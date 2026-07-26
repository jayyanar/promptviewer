---

## name: sheet-to-google-form description: \>- Bulk-submit rows from a Google Sheet (or attached spreadsheet) into a Google Form as individual responses. Use this whenever the user wants to fill, populate, or submit a Google Form repeatedly from tabular data — e.g. "fill this registration form from my sheet", "submit each row of this spreadsheet to the form", "automate these form entries", or any many-rows-into-one-form task. Trigger even if the user only shows a form URL and a sheet/xlsx and says "do the rest" or "enter these" — this is the skill for turning spreadsheet rows into form submissions. Do NOT hand-click the form UI row by row; this skill's whole point is the fast, reliable programmatic path.

# Sheet → Google Form bulk submission

The goal is to take each row of a data source and record it as one Google Form response. The tempting approach — open the live form and click/type every field for every row — is slow and fragile. Google Forms accepts responses over a plain HTTP POST to its `formResponse` endpoint, so the reliable path is: read the data once, learn the form's field IDs once, then POST one request per row. A run of 50 rows becomes 50 fast requests instead of hundreds of brittle clicks.

This runs inside the user's authenticated Chrome session (via the Claude-in-Chrome tools), because both Google Sheets and Google Forms share the `docs.google.com` origin — a `fetch` from a tab already on `docs.google.com` carries the user's cookies, so reads and submissions are authenticated automatically.

## When to stop and ask

Submitting a form is a side-effecting action the user can't easily undo. Before submitting anything, confirm with the user:

- **Which rows.** All rows, or a subset? If some were already submitted (e.g. in an earlier demo or partial run), offer to skip those to avoid duplicates.  
- **Real vs. test data.** If the emails/phone numbers look like real people's personal data, confirm the user has the right to submit it. Flag it rather than assume.

Then submit one row as a test, verify it recorded, and only then do the rest.

## Step 1 — Get the data

Prefer an attached spreadsheet if the user provided one (most authoritative). Read `.xlsx` with Python:

import openpyxl

ws \= openpyxl.load\_workbook(path, data\_only=True).active

rows \= list(ws.iter\_rows(values\_only=True))

header, data \= rows\[0\], rows\[1:\]

If the data is a live Google Sheet, read it from an authenticated tab. Navigate a Chrome tab to the sheet's `/edit` URL first, then fetch the CSV export with a **relative** URL (a relative same-origin fetch avoids the query-string safety block that can trip an absolute cross-origin fetch):

// tab is already on docs.google.com

await fetch('/spreadsheets/d/\<SHEET\_ID\>/export?format=csv\&gid=\<GID\>',

            {credentials:'include'}).then(r \=\> r.text())

Note: the `/gviz/tq?tqx=out:csv` endpoint sometimes truncates to a sampled subset of rows — use `export?format=csv` for the complete data, and always sanity-check the row count against what the user expects.

Watch for **I/l/1 ambiguity** in a Sheet ID copied from a screenshot or typed by hand (`...VsI1...` vs `...Vsl1...`). If a URL 404s ("Page not found") but the doc clearly exists, try the other character; the authoritative ID is whatever the user's own open tab shows.

## Step 2 — Discover the form's field IDs

Every Form field posts under an `entry.<numericID>` key. Read them from the form's embedded config instead of guessing. From a `docs.google.com` tab:

const html \= await fetch('/forms/d/e/\<FORM\_E\_ID\>/viewform',

                         {credentials:'include'}).then(r \=\> r.text());

const data \= JSON.parse(html.match(/FB\_PUBLIC\_LOAD\_DATA\_ \= (.\*?);\<\\/script\>/s)\[1\]);

const fields \= data\[1\]\[1\].map(q \=\> ({

  title: q\[1\],

  type:  q\[3\],            // 0/1 text, 2 radio, 4 checkbox, 5 scale, ...

  entries: (q\[4\]||\[\]).map(e \=\> ({

    id: e\[0\],                              // \-\> entry.\<id\>

    required: e\[2\],

    options: (e\[1\]||\[\]).map(o \=\> o\[0\])     // exact choice strings

  }))

}));

Key points:

- Use the `/forms/d/e/<FORM_E_ID>/viewform` (public) ID, not the `/forms/d/<EDIT_ID>/edit` ID.  
- **Email collection is not a normal field.** If the form collects email addresses, that value is posted as `emailAddress`, and it will NOT appear in the `fields` list. Don't invent an entry ID for it.  
- For radio/checkbox fields, the submitted value must exactly match one of the `options` strings (e.g. `"1:00 PM - 4:00 PM"`, `"Gluten-Free"`). Map the sheet's column values to these, and fail loudly if a value doesn't match rather than submitting a silently-dropped answer.

Build an explicit mapping from sheet columns to entry IDs and confirm it looks right before submitting.

## Step 3 — Submit one row per POST

async function submit(FORM\_E\_ID, fields, row) {

  const p \= new URLSearchParams();

  if (row.email) p.append('emailAddress', row.email);   // only if form collects email

  for (const \[entryId, value\] of Object.entries(fields)) p.append('entry.'+entryId, value);

  p.append('fvv','1'); p.append('pageHistory','0');

  const res \= await fetch(\`/forms/d/e/${FORM\_E\_ID}/formResponse\`, {

    method:'POST', credentials:'include',

    headers:{'Content-Type':'application/x-www-form-urlencoded'},

    body: p.toString()

  });

  const txt \= await res.text();

  return {

    ok: res.status \=== 200 && /formResponse/.test(res.url),

    validationError: /is a required question|errorMessage/i.test(txt)

  };

}

On success Google returns HTTP 200 at the `.../formResponse` confirmation URL. On a validation failure it re-renders the `viewform` and the body contains a "required question" message — treat `validationError:true` as a failed row, not a success. Submit rows sequentially with a short pause (\~300–400ms) between them so a long run stays polite and easy to trace.

For a checkbox field with multiple selected values, append the same `entry.<id>` key once per selected option.

## Step 4 — Verify

Never claim success from the POST alone. Open the form's Responses summary and confirm the count and a few values landed:

navigate \-\> https://docs.google.com/forms/d/\<EDIT\_ID\>/edit\#responses

get\_page\_text  \-\> look for "\<N\> responses" and spot-check names/emails

Cross-check the totals (e.g. the food/size/time distributions) against the source rows so a wrong mapping can't hide behind a green count. Report exactly which rows were submitted and which (if any) were intentionally skipped.

## Fallback

If the form genuinely can't be posted this way (unusual field types, a captcha, or POSTs rejected), fall back to driving the live `viewform` with the Claude-in-Chrome tools — `form_input` / `computer` clicks — one field at a time, then the Submit button. This is the slow path; only use it when the POST path fails.  

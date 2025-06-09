#!/bin/bash
echo "Running custom build script for Amplify deployment"
npm run build
# Create the deploy-manifest.json file that Amplify expects
cat > out/deploy-manifest.json << 'EOF'
{
  "version": 1,
  "routes": [
    {
      "path": "/_next/static/*",
      "target": {
        "kind": "Static"
      }
    },
    {
      "path": "/static/*",
      "target": {
        "kind": "Static"
      }
    },
    {
      "path": "/*",
      "target": {
        "kind": "FileSystem",
        "fallback": "/index.html"
      }
    }
  ]
}
EOF

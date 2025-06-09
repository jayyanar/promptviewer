#!/bin/bash
echo "Running custom build script for Amplify deployment"
npm run build
# Create the deploy-manifest.json file that Amplify expects
echo '{"version":1}' > out/deploy-manifest.json

#!/usr/bin/env bash
set -euo pipefail

CFG=${1:-workers/devices-hub.wrangler.toml}

echo "Make sure you've set PUBLISH_SECRET via: wrangler secret put PUBLISH_SECRET -c $CFG"
npx wrangler publish -c "$CFG"
echo "Deployed devices-hub worker. Configure routes in $CFG to map /ws/devices and /internal/publish to your domain."


#!/bin/bash
# Run wrangler with Cloudflare surrogate auth. Usage: ./cf.sh <wrangler args...>
export CLOUDFLARE_API_TOKEN=$(python3 -c "
import sys; sys.path.insert(0, '/opt/hatch/skills/skill-creator/bin')
from dynamic_credentials import dynamic_credential_entry
print(dynamic_credential_entry('custom.cloudflare', 'access_token')['surrogate'])
")
exec ./node_modules/.bin/wrangler "$@"

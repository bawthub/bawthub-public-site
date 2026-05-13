#!/usr/bin/env bash
# Deploy bawthub-public-site: push to GitHub, then fast-forward pull on Unraid.
set -euo pipefail

cd "$(dirname "$0")"

# Bail if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "✗ Uncommitted changes. Commit or stash first." >&2
  git status --short
  exit 1
fi

# Bail if the branch is behind upstream (avoid clobbering remote work)
git fetch origin --quiet
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse '@{u}' 2>/dev/null || echo "")
BASE=$(git merge-base @ '@{u}' 2>/dev/null || echo "")
if [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ] && [ "$REMOTE" = "$BASE" ]; then
  : # local is ahead, all good
elif [ "$LOCAL" = "$REMOTE" ]; then
  echo "= No new commits to push. Pulling on server anyway."
else
  echo "✗ Local branch has diverged from origin. Resolve manually." >&2
  exit 1
fi

echo "→ Pushing to GitHub..."
git push origin HEAD

echo "→ Pulling on Unraid (10.0.0.99)..."
ssh unraid-lan 'cd /mnt/user/appdata/bawthub-public/site && git pull --ff-only'

echo
echo "✓ Deployed: https://bawthub.com/"
echo "  HEAD: $(git rev-parse --short HEAD)  ($(git log -1 --format=%s))"

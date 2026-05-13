#!/usr/bin/env bash
# Deploy bawthub-public-site: push to GitHub, then fast-forward pull on Unraid.
#
# The Unraid serving directory /mnt/user/appdata/bawthub-public/site IS a git
# checkout of this repo root, so deploying is literally `git pull` over there.
#
# Push handling: this script may be run from the bridge container, which does
# not have GitHub credentials. The push step bounces through echo (where the
# `gh` CLI is authed) by ssh'ing in and running `git push` against the same
# repo (same filesystem; ~bridge/dev == ~nick/dev). If you're running this
# directly on echo it short-circuits to a local push.
set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT=$(pwd -P)

# 1. Sanity checks
if ! git diff-index --quiet HEAD --; then
  echo "✗ Uncommitted changes. Commit or stash first." >&2
  git status --short
  exit 1
fi

# 2. Detect ahead/behind
git fetch origin --quiet
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse '@{u}' 2>/dev/null || echo "")
BASE=$(git merge-base @ '@{u}' 2>/dev/null || echo "")

if [ -z "$REMOTE" ]; then
  echo "✗ No upstream tracking branch set." >&2
  exit 1
fi

# 3. Push step (if there's anything to push)
if [ "$LOCAL" = "$REMOTE" ]; then
  echo "= Local is up to date with origin."
elif [ "$REMOTE" = "$BASE" ]; then
  AHEAD=$(git rev-list --count "$REMOTE..HEAD")
  echo "→ Pushing $AHEAD commit(s) to GitHub..."
  # Try direct push first; fall back to via-echo if no credentials in this env.
  if git push --dry-run origin HEAD >/dev/null 2>&1; then
    git push origin HEAD
  else
    # Repo lives on echo's home filesystem; map our absolute path back to
    # echo's by swapping the /home prefix (bridge container uses /home/bridge,
    # echo uses /home/nick — same btrfs subvolume).
    ECHO_REPO=$(echo "$REPO_ROOT" | sed 's|^/home/bridge/|/home/nick/|')
    echo "  (bouncing via echo for auth: $ECHO_REPO)"
    ssh nick@echo "cd '$ECHO_REPO' && git push origin HEAD"
  fi
else
  echo "✗ Branch has diverged from origin. Resolve manually." >&2
  exit 1
fi

# 4. Pull on the serving host
echo "→ Pulling on Unraid (10.0.0.99)..."
ssh unraid-lan 'cd /mnt/user/appdata/bawthub-public/site && git pull --ff-only origin main'

# 5. Restart nginx container — git pulls change inodes; Unraid user-share
#    can return ESTALE on the FUSE union mount until nginx re-opens files.
#    Restart is ~1s and idempotent.
echo "→ Restarting bawthub-public-site nginx..."
ssh unraid-lan 'docker restart bawthub-public-site >/dev/null'

echo
echo "✓ Deployed: https://bawthub.com/"
echo "  HEAD: $(git rev-parse --short HEAD)  ($(git log -1 --format=%s))"

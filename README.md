# bawthub-public-site

The public marketing + architecture documentation site for [bawthub.com](https://bawthub.com).

Static HTML / CSS / JS only — no runtime, no build step. Served by an nginx
container on Unraid at `10.0.2.36:80`, fronted by Nginx Proxy Manager.

## Layout

The repo **root** is the site root. Files at `index.html`, `story.html`,
`architecture/`, `images/` are served verbatim under `https://bawthub.com/`.

| URL | Source |
|---|---|
| `/` | `index.html` — marketing landing page |
| `/story.html` | `story.html` — origin narrative |
| `/architecture/` | `architecture/index.html` — multi-page docs hub |
| `/architecture/llm-bawt/memory.html` | first architecture deep page (more coming) |

Tooling that's tracked but not part of the site lives under `scripts/`.
The `README.md` and `scripts/` paths are accessible at
`https://bawthub.com/README.md` and `https://bawthub.com/scripts/deploy.sh` —
this is intentional; there are no secrets in either.

## Workflow

```bash
# Edit any file at the repo root
$EDITOR architecture/llm-bawt/api.html

# Sanity-check
git diff

# Commit
git add -p
git commit -m "architecture: add OpenAI-compat API page"

# Deploy — pushes to GitHub, then `git pull` on the Unraid serving container
./scripts/deploy.sh
```

`deploy.sh` is the only deploy mechanism. It:
1. Verifies no uncommitted changes locally
2. `git push origin main` (if anything new)
3. `ssh unraid-lan 'cd /mnt/user/appdata/bawthub-public/site && git pull --ff-only'`

The serving directory on Unraid (`/mnt/user/appdata/bawthub-public/site`) IS
a git checkout of this repo's root, so "deploy" is a fast-forward pull.

## Architecture site internals

- Shared CSS: `architecture/assets/site.css`
- Shared JS (mega-menu + cmdk + soon-toast): `architecture/assets/site.js`
- All pages share the same topbar markup + script tag at the bottom

When adding a new page:
1. Add it to the `PAGES` object in `architecture/assets/site.js` (it'll appear
   in the mega-menu + cmdk automatically; flip `built: true` when shipping)
2. Create the HTML at the path matching the `href`
3. Copy the topbar markup from an existing page (e.g. `architecture/llm-bawt/memory.html`)
4. Update prev/next chips on adjacent pages

## Rolling back

```bash
# Find the bad commit
git log --oneline -10

# Revert on the server (no force-pushes needed for emergency rollback)
ssh unraid-lan 'cd /mnt/user/appdata/bawthub-public/site && git checkout <sha>'

# Then fix forward in this repo and deploy normally
```

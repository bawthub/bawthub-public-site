# bawthub-public-site

The public marketing + architecture documentation site for [bawthub.com](https://bawthub.com).

Static HTML / CSS / JS only — no runtime, no build step. Served by an nginx
container on Unraid at `10.0.2.36:80`, fronted by Nginx Proxy Manager.

## Pages

| URL | Source |
|---|---|
| `/` | `site/index.html` — marketing landing page |
| `/story.html` | `site/story.html` — origin narrative |
| `/architecture/` | `site/architecture/index.html` — multi-page docs hub |
| `/architecture/llm-bawt/memory.html` | first architecture deep page (more coming) |

## Workflow

```bash
# Edit any file in site/
$EDITOR site/architecture/llm-bawt/api.html

# Sanity-check
git diff

# Commit
git add -p
git commit -m "architecture: add OpenAI-compat API page"

# Deploy — pushes to GitHub, then `git pull` on the Unraid serving container
./deploy.sh
```

`deploy.sh` is the only deploy mechanism. It:
1. `git push origin main`
2. `ssh unraid-lan 'cd /mnt/user/appdata/bawthub-public/site && git pull --ff-only'`

The serving directory on Unraid is itself a git checkout of this repo, so
"deploy" is literally a fast-forward pull.

## Architecture site internals

- Shared CSS: `site/architecture/assets/site.css`
- Shared JS (mega-menu + cmdk + soon-toast): `site/architecture/assets/site.js`
- All pages share the same topbar markup + script tag

When adding a new page:
1. Add it to the `PAGES` object in `site/architecture/assets/site.js` (it'll
   appear in the mega-menu + cmdk automatically; flip `built: true` when shipping)
2. Create the HTML at the path matching the `href`
3. Copy the topbar markup from an existing page (e.g. `memory.html`)
4. Update prev/next chips on adjacent pages

## Rolling back

```bash
# Find the bad commit
git log --oneline -10

# Revert on the server (no force-pushes needed for emergency rollback)
ssh unraid-lan 'cd /mnt/user/appdata/bawthub-public/site && git checkout <sha>'

# Then fix forward in this repo and deploy normally
```

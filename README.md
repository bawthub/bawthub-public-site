# bawthub-public-site

The public marketing site for [bawthub.com](https://bawthub.com).

Static HTML / CSS — no runtime, no build step.

## Layout

The repo root is the site root. Single-page site — all content in `index.html`.

## Deploy

Deployed via Cloudflare Pages. Push to `main` → site rebuilds automatically.

```bash
git push bawthub main
```

The old Unraid nginx/static container deploy path is retired. Do not deploy this
site by SSHing to Unraid or running a local `deploy.sh`.

## Cloudflare Management

`bawthub.com` and `www.bawthub.com` are served at the Cloudflare edge. Keep the
Cloudflare DNS/API management notes in the agent skill at
`~/dev/agent-skills/bawthub-public-site/SKILL.md`; it tracks the zone ID,
Workers routes, proxied app/auth records, and Vaultwarden token lookup.

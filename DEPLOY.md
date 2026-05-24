# Deploying MasterMaths to Render

This is a pure-static site (no build step) — same provider as the
`matricmaths-admin` service you already run.

## 1. Push to GitHub

```powershell
cd C:\Users\BaldwinN\Desktop\mastermath

# Create the empty repo on GitHub (UI or CLI):
gh repo create mastermath --public --source=. --remote=origin
# ↑ If the GitHub CLI isn't installed, create the repo at github.com/new,
#   then run:
#     git remote add origin https://github.com/<your-user>/mastermath.git

git push -u origin main
```

## 2. Provision on Render

1. Go to <https://dashboard.render.com> → **New +** → **Blueprint**.
2. Connect your GitHub account if you haven't already.
3. Pick the `mastermath` repo.
4. Render reads [`render.yaml`](render.yaml) and shows a single service:
   - **Name:** `mastermath`
   - **Type:** Static Site
   - **Plan:** Free
   - **Publish directory:** `.`
5. Click **Apply**. First deploy completes in ~30 seconds.
6. Render gives you a URL like `https://mastermath.onrender.com`.

## 3. Whitelist the domain in Supabase

Supabase Auth refuses sign-ins from origins it doesn't recognise.

1. Supabase Dashboard → your project (`yhmnjjkwwthnfgqeodjc`)
2. **Authentication → URL Configuration**
3. **Site URL:** `https://mastermath.onrender.com`
4. **Redirect URLs (add):** `https://mastermath.onrender.com`, `https://mastermath.onrender.com/*`
5. Save.

## 4. (Optional) Custom domain

1. Render → mastermath service → **Settings → Custom Domains** → **Add**.
2. Enter your domain (e.g. `mastermath.co.za`).
3. Render shows you a CNAME target — add that record at your registrar.
4. Once DNS propagates (5 min – 24 h), Render issues a Let's Encrypt
   certificate automatically.
5. Repeat step 3 above with the custom domain in the allowed list.

## How redeploys work

Every `git push` to `main` triggers a redeploy. The HTML is served with
`Cache-Control: must-revalidate` and assets with a 24 h cache (see
[`render.yaml`](render.yaml)), so users see updated code on their next
load — no waiting for cache to expire.

If a deploy ever needs to be rolled back, **Manual Deploy → Pick a
commit** from the Render dashboard.

# MasterMaths (web)

Web mirror of the MasterMaths Expo app — same Supabase backend, same screens,
no build step. Pure HTML + ES modules + CDN-loaded KaTeX/Markdown.

## Run locally

The app uses ES modules, so it needs a static server (file:// won't work).

PowerShell, from this folder:

```powershell
# Option A — Python (built in on most systems)
python -m http.server 5500

# Option B — Node
npx serve -l 5500 .
```

Open http://localhost:5500/

## Layout

ADEWS-style shell:

- Fixed left **sidebar** (collapsible · sticky) — page selector + theme toggle + logout.
- Fixed top **header** — status strip + title bar with the active page name.
- Scrolling **content area** with the active page rendered inside.
- On screens narrower than 900 px the sidebar slides off-screen with a hamburger toggle and backdrop.

## Pages (sidebar items)

| Item | Route | Content |
|---|---|---|
| 🏠 Dashboard | `#/` | Summary tiles (papers loaded, strategies ready, your reports) + quick-launch cards |
| 📘 Paper 1   | `#/strategies` | Question slot list with strategy-ready badges |
| 📑 Past Papers | `#/papers` | All DBE NSC papers, drill into questions |
| 📖 About | `#/about` | Methodology — why "conditions, not topics" |

Deep links: `#/strategy/:slotId`, `#/questions/:paperId`, `#/question/:questionId` resolve to the right sidebar page automatically.

## Folder structure

```
mastermath/
├── index.html
├── app.js                       # shell + hash router
├── styles.css                   # CSS-variable theme palettes + sidebar + page styles
├── assets/                      # icon, splash, heritage_bg, favicon
└── src/
    ├── lib/
    │   └── supabase.js
    ├── theme/
    │   └── theme.js             # toggles data-theme on <html>
    ├── components/
    │   └── mathView.js          # iframe + KaTeX + marked
    └── screens/
        ├── loginScreen.js
        ├── dashboardScreen.js
        ├── homeScreen.js        # Paper 1 question slots
        ├── strategyScreen.js
        ├── paperListScreen.js
        ├── questionListScreen.js
        ├── questionScreen.js
        └── aboutScreen.js
```

## Notes

- Auth: Supabase JS SDK persists the session in `localStorage`.
- AI explanations call the same `explain` Supabase Edge Function as mobile.
- Themes (light / dark / heritage) cycle via the toggle in the header.
- Routes are hash-based (`#/`, `#/papers`, `#/question/<id>`) so it deploys
  to any static host (Netlify, Vercel, GitHub Pages) without rewrites.

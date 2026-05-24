// Renders Markdown + KaTeX inside a sandboxed iframe (its CSS can't leak
// into the host page). Shape mirrors src/components/MathView.web.js from the
// mobile app.
//
// Math handling strategy: BEFORE running marked on the body we pull every
// $$...$$ and $...$ block out and replace it with a unique placeholder. We
// then run marked on the (math-free) markdown, swap each placeholder for an
// empty <span class="kx" data-display="0|1"> holding the raw TeX, and let
// `katex.render` populate each span when KaTeX loads.
//
// Why: marked + KaTeX auto-render is fragile. Marked sometimes wraps math
// inside <p> in ways that confuse auto-render, and bare backslash escapes
// like `\geq` can be eaten by markdown's escape rules. Pulling math out
// before marked sees it eliminates both classes of failure.
import { getTheme } from '../theme/theme.js';

const KATEX_CDN  = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist';
const MARKED_CDN = 'https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js';

function wrapperHtml(body, fontSize, dark, iframeId) {
  const c = dark ? {
    bg:'transparent', text:'#ffffff', soft:'#cccccc', accent:'#4ade80', accentDark:'#86efac',
    h4Bg:'#1a3a22', quoteBg:'#1a3a22', codeBg:'#1f1f1f', border:'#2a2a2a', tableHead:'#1a1a1a',
  } : {
    bg:'transparent', text:'#000000', soft:'#444444', accent:'#2d7a3a', accentDark:'#0a4719',
    h4Bg:'#e8f5ea', quoteBg:'#f0f8f1', codeBg:'#f4f4f4', border:'#dddddd', tableHead:'#f0f0f0',
  };
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="${KATEX_CDN}/katex.min.css">
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, "Segoe UI", sans-serif;
         font-size: ${fontSize}px; line-height: 1.8;
         color: ${c.text}; background: ${c.bg};
         padding: 18px; margin: 0;
         -webkit-text-size-adjust: 100%; overflow-x: hidden; }
  h1 { font-size: 1.45em; color:${c.text}; margin: 26px 0 12px; font-weight: 800; letter-spacing: 0.2px; }
  h2 { font-size: 1.28em; color:${c.text}; margin: 24px 0 12px; font-weight: 800;
       border-bottom: 2px solid ${c.accent}; padding-bottom: 6px; letter-spacing: 0.2px; }
  h3 { font-size: 1.12em; color:${c.accentDark}; margin: 22px 0 10px; font-weight: 700; }
  h4 { font-size: 1.05em; color:${c.accentDark}; margin: 18px 0 10px; font-weight: 700;
       background: ${c.h4Bg}; padding: 8px 12px; border-left: 4px solid ${c.accent};
       border-radius: 4px; }
  p { margin: 14px 0; color: ${c.text}; }
  p + p { margin-top: 16px; }
  strong { color: ${c.text}; font-weight: 800; }
  p > strong:first-child { display: inline-block; margin-right: 4px; }
  ul, ol { margin: 12px 0; padding-left: 26px; }
  li { margin: 8px 0; color: ${c.text}; line-height: 1.75; }
  blockquote { border-left: 4px solid ${c.accent}; background: ${c.quoteBg};
               padding: 12px 16px; margin: 16px 0; font-style: italic; color:${c.accentDark};
               border-radius: 4px; }
  code { background:${c.codeBg}; padding:2px 6px; border-radius:3px; font-size:0.95em; color:${c.text}; }
  hr { border: none; border-top: 1px solid ${c.border}; margin: 22px 0; }
  .katex { color: ${c.text} !important; }
  .katex-display { overflow-x: auto; overflow-y: hidden; margin: 14px 0; }
  /* Holds raw TeX until katex.render() replaces it. Falls back to monospace
     so a render failure is at least readable rather than mojibake. */
  .kx { font-family: "JetBrains Mono", "Lucida Console", monospace; color: ${c.text}; }
  table { border-collapse: collapse; margin: 14px 0; font-size: 0.95em; width: 100%; }
  th, td { border: 1px solid ${c.border}; padding: 8px 12px; color:${c.text}; }
  th { background: ${c.tableHead}; }
</style>
</head><body>
<div id="content"></div>
<script src="${MARKED_CDN}"></script>
<script src="${KATEX_CDN}/katex.min.js"></script>
<script>
  (function(){
    var iframeId = ${JSON.stringify(iframeId)};
    var raw = ${JSON.stringify(body || '')};

    function postHeight() {
      window.parent.postMessage(
        { __mm: true, iframeId: iframeId, height: document.body.scrollHeight },
        '*'
      );
    }

    // ---- 1. Pull math out of the raw string. ----------------------------
    // Use a plain-ASCII placeholder so no parser strips it. Markdown leaves
    // a run of unspaced letters/digits/underscores alone.
    var blocks = [];
    function take(re, display) {
      raw = raw.replace(re, function(_match, tex) {
        var i = blocks.length;
        blocks.push({ display: display, tex: tex });
        return 'MMMATHPLACEHOLDER' + i + 'END';
      });
    }
    take(/\\$\\$([\\s\\S]+?)\\$\\$/g, true);  // $$...$$ first (display)
    take(/\\$([^\\$\\n]+?)\\$/g, false);      // then $...$ (inline)

    // ---- 2. Run markdown on the (math-free) string. ---------------------
    var html;
    try { html = marked.parse(raw); }
    catch (e) { html = '<pre>' + (raw + '').replace(/[<>&]/g, function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];}) + '</pre>'; }

    // ---- 3. Put math back as <span class="kx"> placeholders. ------------
    var placeholderRe = /MMMATHPLACEHOLDER(\\d+)END/g;
    html = html.replace(placeholderRe, function(_m, n) {
      var b = blocks[Number(n)];
      var safe = (b.tex + '').replace(/[<>&]/g, function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];});
      return '<span class="kx" data-display="' + (b.display ? '1' : '0') + '">' + safe + '</span>';
    });

    document.getElementById('content').innerHTML = html;

    // ---- 4. Render each math span with katex.render. --------------------
    function renderMath() {
      var spans = document.querySelectorAll('span.kx');
      for (var i = 0; i < spans.length; i++) {
        var el = spans[i];
        var tex = el.textContent;
        try {
          katex.render(tex, el, {
            displayMode: el.dataset.display === '1',
            throwOnError: false,
            output: 'html',
          });
        } catch (e) {
          // leave the raw TeX visible — better than blank
        }
      }
      postHeight();
      setTimeout(postHeight, 300);
      setTimeout(postHeight, 1000);
    }

    if (window.katex) renderMath();
    else window.addEventListener('load', renderMath);
  })();
</script>
</body></html>`;
}

const heightListenerKey = '__mm_height_listener__';
if (!window[heightListenerKey]) {
  window[heightListenerKey] = true;
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || !d.__mm || typeof d.height !== 'number' || !d.iframeId) return;
    const f = document.getElementById(d.iframeId);
    if (f) f.style.height = (d.height + 28) + 'px';
  });
}

let frameCounter = 0;

export function mathView({ body, fontSize = 16, dark }) {
  const isDark = dark != null ? dark : getTheme().mode === 'dark';
  const id = `mm-math-${++frameCounter}`;
  const html = wrapperHtml(body || '', fontSize, isDark, id);

  const wrap = document.createElement('div');
  wrap.className = 'math-view';

  const iframe = document.createElement('iframe');
  iframe.id = id;
  iframe.title = 'math-content';
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.style.cssText = 'border:none;width:100%;height:200px;background:transparent;';
  iframe.srcdoc = html;

  wrap.appendChild(iframe);
  return wrap;
}

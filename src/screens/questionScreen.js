// QuestionScreen — render a single question with diagram(s), toggleable
// memo + AI explanation, prev/next pager, and a basic mistake reporter.
// Mirrors src/screens/QuestionScreen.js from the mobile app.
import { supabase } from '../lib/supabase.js';
import { mathView } from '../components/mathView.js';
import { getTheme } from '../theme/theme.js';
import { navigate, setHeaderTitle } from '../../app.js';

export async function questionScreen({ questionId }) {
  const root = document.createElement('div');
  root.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;

  let siblingIds = [];
  try { siblingIds = JSON.parse(sessionStorage.getItem('siblingIds') || '[]'); } catch {}

  const { data: q } = await supabase
    .from('questions')
    .select('id, label, body, marks, memo_solution, answer, ai_explanation, diagram_url, slot_id, paper_id, papers(pdf_url, memo_pdf_url, year, session, paper_number)')
    .eq('id', questionId).single();

  if (!q) {
    root.innerHTML = `<div class="error">Question not found.</div>`;
    return root;
  }
  setHeaderTitle(`Question ${q.label}`);

  // Decide what "source material" links to surface for this question. Graph
  // and figure questions often live in the original DBE PDF — if no
  // diagram_url is stored, we still let students open the paper directly so
  // they can see the figures in context.
  const paperMeta = q.papers || {};
  const paperLabel = (paperMeta.session && paperMeta.year)
    ? `${paperMeta.session} ${paperMeta.year} · P${paperMeta.paper_number ?? ''}`.trim()
    : 'original paper';

  // Pull the WHOLE ancestor chain — the function definition, graph, or
  // problem setup often lives in a higher stem (e.g. "5" defines f(x), "5.4"
  // just asks a question about it). Walking only one level up misses
  // grandparent context for sub-sub questions like "5.4.1".
  let ancestors = [];
  if (q.paper_id) {
    const { data: peers } = await supabase
      .from('questions')
      .select('label, body, diagram_url')
      .eq('paper_id', q.paper_id)
      .eq('question_number', q.question_number);
    ancestors = (peers || [])
      .filter(o => o.label !== q.label && q.label.startsWith(o.label + '.'))
      .sort((a, b) => a.label.length - b.label.length);   // shortest = oldest ancestor first
  }
  // Body that gets shown on screen AND sent to the AI — concatenated in
  // ancestor-first order so the AI sees the function definition before the
  // sub-question.
  const combinedBody = [...ancestors.map(a => (a.body || '').trim()), (q.body || '').trim()]
    .filter(Boolean)
    .join('\n\n');
  // Render every diagram we have, ancestor-first, dedup'd in case the same
  // URL appears on multiple rows.
  const diagrams = [...ancestors.map(a => a.diagram_url), q.diagram_url]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const curIdx = siblingIds.indexOf(q.id);
  const prevId = curIdx > 0 ? siblingIds[curIdx - 1] : null;
  const nextId = (curIdx >= 0 && curIdx < siblingIds.length - 1) ? siblingIds[curIdx + 1] : null;

  let showMemo  = false;
  let aiText    = q.ai_explanation || '';
  let showAi    = !!aiText;       // if a cached explanation exists, show it on first load
  let aiLoading = false;
  let reportSent = false;

  render();
  return root;

  function render() {
    const dark = getTheme().mode === 'dark';
    root.innerHTML = `
      <button class="mm-back" id="backBtn">‹ Back</button>
      <div class="question-card">
        <div class="q-meta">
          <span class="q-label-big">Question ${escapeHtml(q.label)}</span>
          <span class="q-marks-big">${q.marks} marks</span>
        </div>
        <div id="qDiagrams" class="q-diagrams"></div>
        <div id="qBody"></div>
        ${paperMeta.pdf_url ? `
          <div class="q-source-link">
            <a href="${escapeAttr(paperMeta.pdf_url)}" target="_blank" rel="noopener">
              📄 Open ${escapeHtml(paperLabel)} (PDF)
            </a>
            ${diagrams.length === 0 ? `<span class="q-source-hint">— if this question references a graph or figure, you'll find it in the source paper.</span>` : ''}
          </div>` : ''}
      </div>

      <div class="mm-encourage">💪 Try it first — even a rough attempt makes the solution stick.</div>

      <div class="q-action-row">
        <button id="memoToggle" class="primary-btn-block ${showMemo ? 'is-open' : ''}">
          ${showMemo ? '✕ Hide solution' : '👀 Reveal the solution'}
        </button>
      </div>
      <div id="memoSlot"></div>

      <div class="q-action-row">
        <button id="aiToggle" class="ai-btn ${showAi ? 'is-open' : ''}"
                ${aiLoading ? 'disabled style="opacity:0.6"' : ''}>
          ${aiLoading
            ? 'Thinking through it for you…'
            : showAi
              ? '✕ Hide AI walkthrough'
              : '🤖 Walk me through it, step-by-step'}
        </button>
      </div>
      <div id="aiSlot"></div>

      <button id="reportBtn" class="report-link">
        ${reportSent ? '✓ Report received — thanks!' : '🐛 Report a problem with this question'}
      </button>
      <div style="height:40px"></div>

      ${siblingIds.length > 1 ? `
        <div class="pager">
          <button class="pager-btn" id="prevBtn" ${prevId ? '' : 'disabled'}>
            <span class="pager-arrow">‹</span>
            <span class="pager-label">Previous</span>
          </button>
          <span class="pager-count">${curIdx + 1} / ${siblingIds.length}</span>
          <button class="pager-btn" id="nextBtn" ${nextId ? '' : 'disabled'}>
            <span class="pager-label">Next</span>
            <span class="pager-arrow">›</span>
          </button>
        </div>
      ` : ''}
    `;
    root.querySelector('#backBtn').addEventListener('click', () => history.back());

    // Diagrams — render any image URLs we found on either the question or
    // its parent stem.
    const dia = root.querySelector('#qDiagrams');
    diagrams.forEach((url, i) => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = i === 0 && diagrams.length > 1 ? 'Question stem diagram' : 'Question diagram';
      img.className = 'q-diagram-img';
      img.loading = 'lazy';
      img.onerror = () => { img.style.display = 'none'; };
      dia.appendChild(img);
    });

    root.querySelector('#qBody').appendChild(mathView({ body: combinedBody, fontSize: 16, dark }));

    // Solution toggle
    root.querySelector('#memoToggle').addEventListener('click', () => {
      showMemo = !showMemo; render();
    });
    if (showMemo) {
      const box = document.createElement('div');
      box.className = 'memo-box';
      box.innerHTML = `<div class="memo-title">✅ Solution</div>`;
      box.appendChild(mathView({
        body: q.memo_solution || '(memo not yet available)',
        fontSize: 15, dark,
      }));
      root.querySelector('#memoSlot').appendChild(box);
    }

    // AI toggle
    root.querySelector('#aiToggle').addEventListener('click', () => {
      if (aiLoading) return;
      if (showAi) {
        // Hide — keep the cached text around so opening again is instant.
        showAi = false;
        render();
        return;
      }
      if (aiText) {
        showAi = true; render();
      } else {
        askAI();
      }
    });
    if (showAi && aiText) {
      const box = document.createElement('div');
      box.className = 'ai-box';
      box.innerHTML = `<div class="ai-title">🤖 AI Explanation</div>`;
      box.appendChild(mathView({ body: aiText, fontSize: 15, dark }));
      const regen = document.createElement('button');
      regen.className = 'regenerate';
      regen.textContent = '↺ Regenerate';
      regen.addEventListener('click', askAI);
      box.appendChild(regen);
      root.querySelector('#aiSlot').appendChild(box);
    }

    root.querySelector('#reportBtn').addEventListener('click', reportMistake);
    if (prevId) root.querySelector('#prevBtn')?.addEventListener('click', () => navigate(`#/question/${prevId}`));
    if (nextId) root.querySelector('#nextBtn')?.addEventListener('click', () => navigate(`#/question/${nextId}`));
  }

  async function askAI() {
    aiLoading = true; showAi = true; aiText = ''; render();
    try {
      const { data, error } = await supabase.functions.invoke('explain', {
        body: {
          questionId:   q.id,
          questionBody: combinedBody,
          memoSolution: q.memo_solution || q.answer || '',
        },
      });
      if (error) throw error;
      const text = data?.text;
      if (!text) throw new Error('Empty response');
      aiText = text;
    } catch (e) {
      aiText = 'Error contacting AI. Please check your connection or sign in.';
    }
    aiLoading = false; render();
  }

  async function reportMistake() {
    if (reportSent) return;
    const issueType = window.prompt('What is wrong? Type one of: typo, wrong_answer, unclear, missing_diagram');
    if (!issueType) return;
    const clean = ['typo', 'wrong_answer', 'unclear', 'missing_diagram'].includes(issueType) ? issueType : 'unclear';
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('Please sign in first.'); return; }
    await supabase.from('mistake_reports').insert({
      user_id: user.id, question_id: q.id, issue_type: clean, status: 'open',
    });
    reportSent = true; render();
    alert('Thanks! We will review and fix it within 48 hours.');
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

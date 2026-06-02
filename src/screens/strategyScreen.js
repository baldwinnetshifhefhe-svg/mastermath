// StrategyScreen — a topic (question-slot) page, Studyclix-style.
// Tabs: Strategy (the approach) · Practice (every DBE question for this topic,
// shown inline grouped by paper, with an inline "Show memo", Mark-as-done and
// bookmark) · Videos & Notes.
//
// Performance: each question body renders via a KaTeX iframe (mathView), which
// is heavy. We LAZY-render a block's body only when it scrolls near the
// viewport, and memo/mark/bookmark interactions never recreate that iframe —
// important for cheap Android phones on small data budgets.
import { supabase } from '../lib/supabase.js';
import { mathView } from '../components/mathView.js';
import { getTheme } from '../theme/theme.js';
import { topicVideosTab } from './videosTab.js';
import { navigate, setHeaderTitle } from '../../app.js';

export async function strategyScreen({ slotId }) {
  const root = document.createElement('div');
  root.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;

  let slot = null;
  try { slot = JSON.parse(sessionStorage.getItem('currentSlot') || 'null'); } catch {}
  if (!slot || String(slot.id) !== String(slotId)) {
    const { data } = await supabase
      .from('question_slots')
      .select('id, question_number, topic, typical_marks, grade, paper_number')
      .eq('id', slotId).single();
    slot = data;
  }
  if (!slot) { root.innerHTML = `<div class="error">Slot not found.</div>`; return root; }
  setHeaderTitle(`Q${slot.question_number} — ${slot.topic}`);

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: strat }, { data: qs }, { data: bm }] = await Promise.all([
    supabase.from('strategies').select('title, body, conditions').eq('slot_id', slot.id).maybeSingle(),
    supabase.from('questions')
      .select('id, label, question_number, marks, body, memo_solution, diagram_url, paper_id, papers(year, session, paper_number, pdf_url)')
      .eq('slot_id', slot.id)
      .order('paper_id', { ascending: false })
      .order('label', { ascending: true }),
    user ? supabase.from('bookmarks').select('question_id').eq('user_id', user.id)
         : Promise.resolve({ data: [] }),
  ]);

  const bookmarked = new Set((bm || []).map(b => b.question_id));

  let tab = 'strategy';
  render();
  return root;

  function render() {
    const dark = getTheme().mode === 'dark';
    const navCtx = sessionStorage.getItem('currentStrategiesNav');
    const m = navCtx && navCtx.match(/^g(\d+)p(\d+)$/);
    const backHash = m
      ? `#/strategies/${m[1]}/${m[2]}`
      : `#/strategies/${slot.grade || 12}/${slot.paper_number || 1}`;
    const groups = groupByPaper(qs || []);
    root.innerHTML = `
      <button class="mm-back" id="backBtn">‹ Back to topics</button>
      <div class="mm-page-title">Q${slot.question_number} — ${escapeHtml(slot.topic)}</div>
      <div class="mm-page-sub">${slot.typical_marks} marks typical · ${groups.length} past-paper question(s)</div>
      <div class="tabs">
        <button class="tab ${tab==='strategy'?'active':''}" data-tab="strategy">📘 Strategy</button>
        <button class="tab ${tab==='practice'?'active':''}" data-tab="practice">✏️ Practice (${groups.length})</button>
        <button class="tab ${tab==='videos'?'active':''}" data-tab="videos">🎬 Videos &amp; Notes</button>
      </div>
      <div id="tabBody"></div>
    `;
    root.querySelector('#backBtn').addEventListener('click', () => navigate(backHash));
    root.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    const body = root.querySelector('#tabBody');
    if (tab === 'strategy') body.appendChild(strategyTab(dark));
    else if (tab === 'practice') body.appendChild(practiceTab(dark, groups));
    else body.appendChild(topicVideosTab({ slot, user }));
  }

  function strategyTab(dark) {
    const box = document.createElement('div');
    if (!strat) {
      box.innerHTML = `<div class="empty-list">Strategy not yet generated.</div>`;
      return box;
    }
    if (Array.isArray(strat.conditions) && strat.conditions.length) {
      const bar = document.createElement('div');
      bar.className = 'condition-bar';
      bar.innerHTML = strat.conditions.map(c =>
        `<span class="condition-chip">${escapeHtml(c.name || c)}</span>`
      ).join('');
      box.appendChild(bar);
    }
    box.appendChild(mathView({ body: strat.body, fontSize: 15, dark }));
    const btn = document.createElement('button');
    btn.className = 'practice-btn-slim';
    btn.textContent = '✏️ Go to practice →';
    btn.addEventListener('click', () => { tab = 'practice'; render(); });
    box.appendChild(btn);
    return box;
  }

  // ── Studyclix-style inline practice: one block per paper, lazy-rendered ──
  function practiceTab(dark, groups) {
    const box = document.createElement('div');
    if (!groups.length) {
      box.innerHTML = `<div class="empty-list">No past-paper questions loaded for this topic yet —
        see the <strong>worked example in the Strategy tab</strong>. Real DBE questions appear here once papers are added.</div>`;
      return box;
    }
    const intro = document.createElement('div');
    intro.className = 'practice-intro';
    intro.innerHTML = 'Every DBE question that tests <strong>this condition</strong>. '
      + 'Learn the approach in the <strong>Strategy</strong> tab first — then prove it here. '
      + 'Tap "Show memo" to check, and mark how you did; it feeds your progress.';
    box.appendChild(intro);

    const startBtn = document.createElement('button');
    startBtn.className = 'ps-start-btn';
    startBtn.innerHTML = `▶ Start a Practice session <span class="ps-start-sub">${Math.min(5, groups.length)} random questions, self-marked</span>`;
    startBtn.addEventListener('click', () => {
      sessionStorage.setItem('currentSlot', JSON.stringify(slot));
      navigate(`#/practice/${slot.id}`);
    });
    box.appendChild(startBtn);

    // Render each block's heavy KaTeX body only as it nears the viewport.
    const io = ('IntersectionObserver' in window)
      ? new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (e.isIntersecting) { e.target._renderBody?.(); io.unobserve(e.target); }
          }
        }, { rootMargin: '400px 0px' })
      : null;

    for (const g of groups) {
      const el = questionBlock(dark, g);
      box.appendChild(el);
      if (io) io.observe(el); else el._renderBody();   // no IO → just render
    }
    return box;
  }

  function questionBlock(dark, g) {
    const parts = g.parts;
    const main = parts[0];
    const totalMarks = parts.reduce((s, p) => s + (p.marks || 0), 0);
    const paper = g.paper;
    const title = `${paper.session || ''} ${paper.year || ''} · P${paper.paper_number ?? ''} · Question ${slot.question_number}`.trim();
    const fullBody = parts.map(p => `**${p.label}** ${(p.body || '').trim()}`).join('\n\n');
    const memos = parts.filter(p => (p.memo_solution || '').trim());
    const fullMemo = memos.map(p => `**${p.label}**\n\n${p.memo_solution.trim()}`).join('\n\n---\n\n');
    const diagrams = [...new Set(parts.map(p => p.diagram_url).filter(Boolean))];

    let bodyRendered = false, memoRendered = false, memoOpen = false;
    let marked = null, marking = false;
    let isBm = bookmarked.has(main.id);

    const block = document.createElement('div');
    block.className = 'sx-block';
    block.innerHTML = `
      <div class="sx-head">
        <div class="sx-head-title">${escapeHtml(title)}</div>
        <div class="sx-head-actions">
          <span class="sx-badge">DBE · NSC</span>
          <button class="sx-icon-btn ${isBm ? 'on' : ''}" data-act="bm" title="Bookmark">${isBm ? '★' : '☆'}</button>
          ${paper.pdf_url ? `<a class="sx-icon-btn" href="${escapeAttr(paper.pdf_url)}" target="_blank" rel="noopener" title="Open / print the paper PDF">🖨</a>` : ''}
        </div>
      </div>
      <div class="sx-marks">${totalMarks} marks</div>
      <div class="sx-diagrams"></div>
      <div class="sx-body"><div class="sx-skeleton">Loading question…</div></div>
      <div class="sx-actions">
        <button class="sx-memo-btn" data-act="memo">✅ Show memo</button>
      </div>
      <div class="sx-memo" hidden></div>
      <div class="sx-mark"></div>
    `;

    const dia = block.querySelector('.sx-diagrams');
    diagrams.forEach(url => {
      const img = document.createElement('img');
      img.src = url; img.className = 'q-diagram-img'; img.loading = 'lazy';
      img.alt = 'Question diagram'; img.onerror = () => { img.style.display = 'none'; };
      dia.appendChild(img);
    });

    block.querySelector('[data-act="memo"]').addEventListener('click', toggleMemo);
    block.querySelector('[data-act="bm"]').addEventListener('click', toggleBookmark);
    drawMark();

    // Exposed to the IntersectionObserver — render the heavy body once.
    block._renderBody = () => {
      if (bodyRendered) return;
      bodyRendered = true;
      const slotEl = block.querySelector('.sx-body');
      slotEl.innerHTML = '';
      slotEl.appendChild(mathView({ body: fullBody, fontSize: 15, dark }));
    };

    return block;

    function toggleMemo() {
      memoOpen = !memoOpen;
      const mbox = block.querySelector('.sx-memo');
      const btn = block.querySelector('[data-act="memo"]');
      mbox.hidden = !memoOpen;
      btn.textContent = memoOpen ? '✕ Hide memo' : '✅ Show memo';
      if (memoOpen && !memoRendered) {
        memoRendered = true;
        const inner = document.createElement('div');
        inner.className = 'memo-box';
        inner.innerHTML = `<div class="memo-title">✅ Memo</div>`;
        inner.appendChild(mathView({ body: fullMemo || '(memo not yet available)', fontSize: 14, dark }));
        mbox.appendChild(inner);
      }
    }

    function drawMark() {
      const slot2 = block.querySelector('.sx-mark');
      slot2.innerHTML = '';
      const mk = document.createElement('div');
      mk.className = 'self-mark';
      if (marked) {
        const label = { correct: '✅ Got it right', partial: '🤔 Partly there', wrong: '❌ Missed it' }[marked];
        mk.classList.add('is-done', `is-${marked}`);
        mk.innerHTML = `<div class="self-mark-done">Logged: <strong>${label}</strong> — added to your progress.</div>`;
      } else {
        mk.innerHTML = `
          <div class="self-mark-q">How did you do?</div>
          <div class="self-mark-btns">
            <button class="sm-btn sm-correct" data-r="correct" ${marking ? 'disabled' : ''}>✅ Got it</button>
            <button class="sm-btn sm-partial" data-r="partial" ${marking ? 'disabled' : ''}>🤔 Partly</button>
            <button class="sm-btn sm-wrong"   data-r="wrong"   ${marking ? 'disabled' : ''}>❌ Missed it</button>
          </div>`;
        mk.querySelectorAll('.sm-btn').forEach(b => b.addEventListener('click', () => logAttempt(b.dataset.r)));
      }
      slot2.appendChild(mk);
    }

    async function logAttempt(rating) {
      if (marking || marked) return;
      if (!user) { alert('Please sign in to save your progress.'); navigate('#/login'); return; }
      marking = true; drawMark();
      const { error } = await supabase.from('user_attempts').insert({
        user_id: user.id, question_id: main.id,
        user_answer: `self:${rating}`, is_correct: rating === 'correct',
        viewed_solution: memoOpen,
      });
      marking = false;
      if (error) { alert(`Could not save: ${error.message}`); drawMark(); return; }
      marked = rating; drawMark();
    }

    async function toggleBookmark() {
      if (!user) { alert('Sign in to bookmark.'); navigate('#/login'); return; }
      const btn = block.querySelector('[data-act="bm"]');
      btn.disabled = true;
      try {
        if (isBm) {
          await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('question_id', main.id);
          isBm = false; bookmarked.delete(main.id);
        } else {
          await supabase.from('bookmarks').insert({ user_id: user.id, question_id: main.id });
          isBm = true; bookmarked.add(main.id);
        }
      } catch (e) { alert(`Bookmark failed: ${e.message || e}`); }
      btn.disabled = false;
      btn.classList.toggle('on', isBm);
      btn.textContent = isBm ? '★' : '☆';
    }
  }
}

// Group sub-questions into one block per paper, parts sorted by natural label.
function groupByPaper(rows) {
  const byPaper = new Map();
  for (const r of rows) {
    const g = byPaper.get(r.paper_id) || { paper: r.papers || {}, parts: [] };
    g.parts.push(r);
    byPaper.set(r.paper_id, g);
  }
  const groups = [...byPaper.values()];
  for (const g of groups) g.parts.sort((a, b) => cmpLabel(a.label, b.label));
  groups.sort((a, b) => (b.paper.year || 0) - (a.paper.year || 0));   // newest first
  return groups;
}

function cmpLabel(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

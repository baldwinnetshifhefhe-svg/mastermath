// PracticeSessionScreen — a focused "Practice" run for one condition (slot).
// Serves a handful of random DBE questions one at a time: try it → show the
// memo → self-mark. Every mark logs a user_attempts row, so a session feeds the
// same progress, streak and spaced-repetition system as everything else.
// This is MasterMaths' take on a quiz — still condition-first, named "Practice".
import { supabase } from '../lib/supabase.js';
import { mathView } from '../components/mathView.js';
import { getTheme } from '../theme/theme.js';
import { navigate, setHeaderTitle } from '../../app.js';

const SESSION_SIZE = 5;

export async function practiceSessionScreen({ slotId }) {
  const root = document.createElement('div');
  root.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;

  let slot = null;
  try { slot = JSON.parse(sessionStorage.getItem('currentSlot') || 'null'); } catch {}
  if (!slot || String(slot.id) !== String(slotId)) {
    const { data } = await supabase
      .from('question_slots')
      .select('id, question_number, topic, grade, paper_number')
      .eq('id', slotId).single();
    slot = data;
  }
  if (!slot) { root.innerHTML = `<div class="error">Topic not found.</div>`; return root; }
  setHeaderTitle(`Practice — ${slot.topic}`);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: rows } = await supabase
    .from('questions')
    .select('id, label, marks, body, memo_solution, diagram_url, paper_id, papers(year, session, paper_number)')
    .eq('slot_id', slot.id)
    .order('label', { ascending: true });

  const groups = pickSession(groupByPaper(rows || []), SESSION_SIZE);

  let idx = 0;
  const results = [];     // 'correct' | 'partial' | 'wrong'
  render();
  return root;

  function backToTopic() {
    sessionStorage.setItem('currentSlot', JSON.stringify(slot));
    navigate(`#/strategy/${slot.id}`);
  }

  function render() {
    const dark = getTheme().mode === 'dark';
    if (!groups.length) {
      root.innerHTML = `
        <button class="mm-back" id="back">‹ Back</button>
        <div class="mm-page-title">Practice — ${escapeHtml(slot.topic)}</div>
        <div class="empty-list">No questions are loaded for this topic yet.</div>`;
      root.querySelector('#back').addEventListener('click', backToTopic);
      return;
    }
    if (idx >= groups.length) { renderSummary(); return; }
    renderQuestion(dark);
  }

  function renderQuestion(dark) {
    const g = groups[idx];
    const main = g.parts[0];
    const totalMarks = g.parts.reduce((s, p) => s + (p.marks || 0), 0);
    const paper = g.paper;
    const src = `${paper.session || ''} ${paper.year || ''} · P${paper.paper_number ?? ''}`.trim();
    const fullBody = g.parts.map(p => `**${p.label}** ${(p.body || '').trim()}`).join('\n\n');
    const memos = g.parts.filter(p => (p.memo_solution || '').trim());
    const fullMemo = memos.map(p => `**${p.label}**\n\n${p.memo_solution.trim()}`).join('\n\n---\n\n');
    const diagrams = [...new Set(g.parts.map(p => p.diagram_url).filter(Boolean))];

    let memoOpen = false, locked = false;

    root.innerHTML = `
      <button class="mm-back" id="back">‹ Exit practice</button>
      <div class="ps-progress">
        <div class="ps-progress-bar"><div class="ps-progress-fill" style="width:${(idx / groups.length) * 100}%"></div></div>
        <div class="ps-progress-text">Question ${idx + 1} of ${groups.length}</div>
      </div>
      <div class="sx-block">
        <div class="sx-head">
          <div class="sx-head-title">${escapeHtml(src)} · ${escapeHtml(slot.topic)}</div>
          <span class="sx-badge">DBE · NSC</span>
        </div>
        <div class="sx-marks">${totalMarks} marks</div>
        <div class="ps-diagrams"></div>
        <div class="ps-body"></div>
        <div class="sx-actions">
          <button class="sx-memo-btn" id="memoBtn">✅ Show memo</button>
        </div>
        <div class="ps-memo" hidden></div>
        <div class="ps-mark"></div>
      </div>
    `;
    root.querySelector('#back').addEventListener('click', backToTopic);

    const dia = root.querySelector('.ps-diagrams');
    diagrams.forEach(url => {
      const img = document.createElement('img');
      img.src = url; img.className = 'q-diagram-img'; img.loading = 'lazy';
      img.alt = 'Question diagram'; img.onerror = () => { img.style.display = 'none'; };
      dia.appendChild(img);
    });
    root.querySelector('.ps-body').appendChild(mathView({ body: fullBody, fontSize: 15, dark }));

    const memoBtn = root.querySelector('#memoBtn');
    const memoBox = root.querySelector('.ps-memo');
    let memoRendered = false;
    memoBtn.addEventListener('click', () => {
      memoOpen = !memoOpen;
      memoBox.hidden = !memoOpen;
      memoBtn.textContent = memoOpen ? '✕ Hide memo' : '✅ Show memo';
      if (memoOpen && !memoRendered) {
        memoRendered = true;
        const inner = document.createElement('div');
        inner.className = 'memo-box';
        inner.innerHTML = `<div class="memo-title">✅ Memo</div>`;
        inner.appendChild(mathView({ body: fullMemo || '(memo not yet available)', fontSize: 14, dark }));
        memoBox.appendChild(inner);
      }
    });

    drawMark();

    function drawMark() {
      const box = root.querySelector('.ps-mark');
      box.innerHTML = '';
      const mk = document.createElement('div');
      mk.className = 'self-mark';
      mk.innerHTML = `
        <div class="self-mark-q">How did you do?</div>
        <div class="self-mark-btns">
          <button class="sm-btn sm-correct" data-r="correct" ${locked ? 'disabled' : ''}>✅ Got it</button>
          <button class="sm-btn sm-partial" data-r="partial" ${locked ? 'disabled' : ''}>🤔 Partly</button>
          <button class="sm-btn sm-wrong"   data-r="wrong"   ${locked ? 'disabled' : ''}>❌ Missed it</button>
        </div>`;
      mk.querySelectorAll('.sm-btn').forEach(b => b.addEventListener('click', () => mark(b.dataset.r, main, memoOpen)));
      box.appendChild(mk);
    }

    async function mark(rating, mainRow, viewed) {
      if (locked) return;
      locked = true; drawMark();
      if (user) {
        await supabase.from('user_attempts').insert({
          user_id: user.id, question_id: mainRow.id,
          user_answer: `self:${rating}`, is_correct: rating === 'correct',
          viewed_solution: viewed,
        }).then(() => {}, () => {});   // best-effort; don't block the session
      }
      results.push(rating);
      idx += 1;
      render();
    }
  }

  function renderSummary() {
    const correct = results.filter(r => r === 'correct').length;
    const partial = results.filter(r => r === 'partial').length;
    const wrong = results.filter(r => r === 'wrong').length;
    const n = results.length;
    const pct = n ? Math.round((correct / n) * 100) : 0;
    const msg = pct >= 80 ? 'Excellent — you own this condition. 🎉'
      : pct >= 50 ? 'Good progress. Review the ones you missed and run it again.'
      : 'Tough one — read the Strategy again, then retry. That\'s how it sticks.';

    root.innerHTML = `
      <button class="mm-back" id="back">‹ Back to topic</button>
      <div class="mm-page-title">Practice complete — ${escapeHtml(slot.topic)}</div>
      <div class="ps-summary">
        <div class="ps-score">${correct}/${n}</div>
        <div class="ps-score-sub">${pct}% got it first time</div>
        <div class="ps-breakdown">
          <span class="ps-pill ps-correct">✅ ${correct} got it</span>
          <span class="ps-pill ps-partial">🤔 ${partial} partly</span>
          <span class="ps-pill ps-wrong">❌ ${wrong} missed</span>
        </div>
        <div class="ps-msg">${msg}</div>
        ${user ? '<div class="ps-note">Saved to your progress and review schedule.</div>' : '<div class="ps-note">Sign in next time to save this to your progress.</div>'}
        <div class="ps-summary-actions">
          <button class="sx-memo-btn" id="again">↻ Practise again</button>
          <button class="practice-btn-slim" id="toTopic">Back to topic</button>
        </div>
      </div>`;
    root.querySelector('#back').addEventListener('click', backToTopic);
    root.querySelector('#toTopic').addEventListener('click', backToTopic);
    root.querySelector('#again').addEventListener('click', () => {
      idx = 0; results.length = 0;
      shuffle(groups);
      render();
    });
  }
}

function groupByPaper(rows) {
  const byPaper = new Map();
  for (const r of rows) {
    const g = byPaper.get(r.paper_id) || { paper: r.papers || {}, parts: [] };
    g.parts.push(r);
    byPaper.set(r.paper_id, g);
  }
  const groups = [...byPaper.values()];
  for (const g of groups) g.parts.sort((a, b) => cmpLabel(a.label, b.label));
  return groups;
}

function pickSession(groups, n) {
  const copy = groups.slice();
  shuffle(copy);
  return copy.slice(0, n);
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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

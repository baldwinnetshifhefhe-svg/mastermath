// StrategyScreen — Strategy / Practice tabs for a single question slot.
// Mirrors src/screens/StrategyScreen.js from the mobile app.
import { supabase } from '../lib/supabase.js';
import { mathView } from '../components/mathView.js';
import { getTheme } from '../theme/theme.js';
import { navigate, setHeaderTitle } from '../../app.js';

export async function strategyScreen({ slotId }) {
  const root = document.createElement('div');
  root.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;

  let slot = null;
  try { slot = JSON.parse(sessionStorage.getItem('currentSlot') || 'null'); } catch {}
  if (!slot || String(slot.id) !== String(slotId)) {
    const { data } = await supabase
      .from('question_slots')
      .select('id, question_number, topic, typical_marks')
      .eq('id', slotId).single();
    slot = data;
  }
  if (!slot) { root.innerHTML = `<div class="error">Slot not found.</div>`; return root; }
  setHeaderTitle(`Q${slot.question_number} — ${slot.topic}`);

  const [{ data: strat }, { data: qs }] = await Promise.all([
    supabase.from('strategies').select('title, body, conditions').eq('slot_id', slot.id).maybeSingle(),
    supabase.from('questions')
      .select('id, label, marks, body, papers(year, session)')
      .eq('slot_id', slot.id)
      .order('paper_id', { ascending: true })
      .order('label', { ascending: true }),
  ]);

  let tab = 'strategy';
  render();
  return root;

  function render() {
    const dark = getTheme().mode === 'dark';
    // Derive the grade+paper this slot belongs to so "Back" returns to the
    // exact strategies list the user came from. Pulled either from the
    // session-stash set by homeScreen, or from the slot record itself.
    const navCtx = sessionStorage.getItem('currentStrategiesNav');
    const m = navCtx && navCtx.match(/^g(\d+)p(\d+)$/);
    const backHash = m
      ? `#/strategies/${m[1]}/${m[2]}`
      : `#/strategies/${slot.grade || 12}/${slot.paper_number || 1}`;
    root.innerHTML = `
      <button class="mm-back" id="backBtn">‹ Back to strategies</button>
      <div class="mm-page-title">Q${slot.question_number} — ${escapeHtml(slot.topic)}</div>
      <div class="mm-page-sub">${slot.typical_marks} marks typical · ${(qs||[]).length} questions available</div>
      <div class="tabs">
        <button class="tab ${tab==='strategy'?'active':''}" data-tab="strategy">📘 Strategy</button>
        <button class="tab ${tab==='practice'?'active':''}" data-tab="practice">✏️ Practice (${(qs||[]).length})</button>
      </div>
      <div id="tabBody"></div>
    `;
    root.querySelector('#backBtn').addEventListener('click', () => navigate(backHash));
    root.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; render(); }));
    root.querySelector('#tabBody').appendChild(tab === 'strategy' ? strategyTab(dark) : practiceTab());
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
        `<span class="condition-chip">${escapeHtml(c.name)}</span>`
      ).join('');
      box.appendChild(bar);
    }
    box.appendChild(mathView({ body: strat.body, fontSize: 15, dark }));
    const btn = document.createElement('button');
    btn.className = 'practice-btn-slim';
    btn.textContent = '✏️ Practice →';
    btn.addEventListener('click', () => { tab = 'practice'; render(); });
    box.appendChild(btn);
    return box;
  }

  function practiceTab() {
    const box = document.createElement('div');
    const questions = qs || [];
    const isStem = (q) => questions.some(o => o.id !== q.id && o.label.startsWith(q.label + '.'));
    const visible = questions.filter(q => !isStem(q));
    if (!visible.length) {
      box.innerHTML = `<div class="empty-list">No questions loaded yet.</div>`;
      return box;
    }
    const allIds = visible.map(q => q.id);
    const intro = document.createElement('div');
    intro.className = 'practice-intro';
    intro.textContent = "These are real DBE past paper questions. Try each one — use the strategy above. Stuck? Tap the question for the solution and AI explanation.";
    box.appendChild(intro);

    visible.forEach(q => {
      const paper = q.papers || {};
      const source = `${paper.session || ''} ${paper.year || ''}`.trim();
      const preview = (q.body || '').replace(/\$[^$]*\$/g, '[math]').replace(/#+\s*/g, '').trim();
      const card = document.createElement('div');
      card.className = 'q-card';
      card.innerHTML = `
        <div class="q-card-left">
          <div class="q-label">${escapeHtml(q.label)}</div>
          <div class="q-marks">${q.marks} marks</div>
        </div>
        <div class="q-card-body">
          <div class="q-source">${escapeHtml(source)}</div>
          <div class="q-preview">${escapeHtml(preview).slice(0, 240)}</div>
        </div>
        <div class="q-arrow">→</div>
      `;
      card.addEventListener('click', () => {
        sessionStorage.setItem('siblingIds', JSON.stringify(allIds));
        navigate(`#/question/${q.id}`);
      });
      box.appendChild(card);
    });
    return box;
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

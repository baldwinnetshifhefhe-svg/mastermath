// QuestionListScreen — grouped questions for a given paper, hiding stem-only
// parents. Mirrors src/screens/QuestionListScreen.js.
import { supabase } from '../lib/supabase.js';
import { navigate, setHeaderTitle } from '../../app.js';

export async function questionListScreen({ paperId }) {
  const root = document.createElement('div');
  root.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;

  let cached = null;
  try { cached = JSON.parse(sessionStorage.getItem('currentPaper') || 'null'); } catch {}
  if (cached && String(cached.id) === String(paperId)) {
    setHeaderTitle(`${cached.session} ${cached.year} · P${cached.paper_number}`);
  } else {
    setHeaderTitle('Questions');
  }

  const { data: questions = [] } = await supabase
    .from('questions')
    .select('id, label, question_number, marks, is_published, slot_id')
    .eq('paper_id', paperId)
    .eq('is_published', true)
    .order('question_number')
    .order('label');

  const { data: paper } = await supabase
    .from('papers').select('grade, paper_number, year, session')
    .eq('id', paperId).single();

  if (paper) setHeaderTitle(`${paper.session} ${paper.year} · P${paper.paper_number}`);

  const { data: slots = [] } = await supabase
    .from('question_slots')
    .select('question_number, topic')
    .eq('subject_id', 1)
    .eq('grade', paper.grade)
    .eq('paper_number', paper.paper_number);
  const topics = Object.fromEntries(slots.map(s => [s.question_number, s.topic]));

  const isStem = (q) => questions.some(o => o.id !== q.id && o.label.startsWith(q.label + '.'));
  const leaves = questions.filter(q => !isStem(q));
  const grouped = {};
  leaves.forEach(q => { (grouped[q.question_number] = grouped[q.question_number] || []).push(q); });
  const groups = Object.entries(grouped).map(([qnum, items]) => ({
    qnum: Number(qnum),
    topic: topics[Number(qnum)] || `Question ${qnum}`,
    items,
  }));
  const allIds = groups.flatMap(g => g.items.map(q => q.id));

  root.innerHTML = `
    <button class="mm-back" id="backBtn">‹ Back to papers</button>
    <div class="mm-page-title">${escapeHtml(paper.session)} ${paper.year} · Paper ${paper.paper_number}</div>
    <div class="mm-page-sub">Grade ${paper.grade} · ${groups.length} question slots · ${leaves.length} sub-questions</div>
    <div id="qlist"></div>
  `;
  root.querySelector('#backBtn').addEventListener('click', () => navigate('#/papers'));

  if (!groups.length) {
    root.querySelector('#qlist').innerHTML = `<div class="empty-list">No published questions yet.</div>`;
    return root;
  }

  const list = root.querySelector('#qlist');
  groups.forEach(g => {
    const sect = document.createElement('div');
    sect.className = 'qsection';
    sect.innerHTML = `<div class="qsection-title">Q${g.qnum} — ${escapeHtml(g.topic)}</div>`;
    g.items.forEach(q => {
      const row = document.createElement('div');
      row.className = 'qrow';
      row.innerHTML = `
        <span class="qrow-label">${escapeHtml(q.label)}</span>
        <span class="qrow-marks">${q.marks} marks</span>
        <span class="qrow-arrow">›</span>
      `;
      row.addEventListener('click', () => {
        sessionStorage.setItem('siblingIds', JSON.stringify(allIds));
        navigate(`#/question/${q.id}`);
      });
      sect.appendChild(row);
    });
    list.appendChild(sect);
  });
  return root;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

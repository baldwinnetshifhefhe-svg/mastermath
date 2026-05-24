// Strategies — question-slot list for a given grade and paper. Same shape
// as the mobile HomeScreen, parameterised so the sidebar can offer
// Grade 12/11/10 × Paper 1/2 entries.
import { supabase } from '../lib/supabase.js';
import { navigate, setHeaderTitle } from '../../app.js';

const NAV_ID = (grade, paper) => `g${grade}p${paper}`;

export async function homeScreen({ grade = 12, paperNumber = 1 } = {}) {
  // Pin the sidebar to this grade/paper while the user is here AND while they
  // drill into a #/strategy/:id from this list.
  sessionStorage.setItem('currentStrategiesNav', NAV_ID(grade, paperNumber));
  setHeaderTitle(`Grade ${grade} · Paper ${paperNumber}`);

  const root = document.createElement('div');
  root.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  loadStrategies(root, grade, paperNumber).catch(err => {
    root.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  });
  return root;
}

async function loadStrategies(root, grade, paperNumber) {
  const { data: slotsData } = await supabase
    .from('question_slots')
    .select('id, question_number, topic, typical_marks')
    .eq('grade', grade)
    .eq('paper_number', paperNumber)
    .order('question_number');

  const slotIds = (slotsData || []).map(s => s.id);
  let strategySlotIds = new Set();
  if (slotIds.length) {
    const { data: strategies } = await supabase
      .from('strategies')
      .select('slot_id')
      .in('slot_id', slotIds);
    strategySlotIds = new Set((strategies || []).map(s => s.slot_id));
  }
  const slots = (slotsData || []).map(s => ({ ...s, hasStrategy: strategySlotIds.has(s.id) }));
  const readyCount = slots.filter(s => s.hasStrategy).length;

  const paperIcon = paperNumber === 1 ? '📘' : '📗';
  root.innerHTML = `
    <div class="mm-page-title">${paperIcon} Grade ${grade} · Paper ${paperNumber} — Question Strategies</div>
    <div class="mm-page-sub" id="subLine"></div>
    <div id="slotList"></div>
  `;
  const sub = root.querySelector('#subLine');

  if (!slots.length) {
    sub.innerHTML = `No question slots defined yet for Grade ${grade} Paper ${paperNumber}.`;
    root.querySelector('#slotList').innerHTML = `
      <div class="coming-soon-box">
        Coming soon — Grade ${grade} Paper ${paperNumber} strategies.
        Once question slots are loaded into Supabase, they'll appear here.
      </div>
    `;
    return;
  }

  sub.innerHTML = `
    Every Paper ${paperNumber} question is built from a small set of repeating conditions.
    Learn the condition, and no question can surprise you.
    <strong>${readyCount} of ${slots.length} strategies ready.</strong>
  `;

  const list = root.querySelector('#slotList');
  slots.forEach(slot => {
    const card = document.createElement('div');
    card.className = `slot-card${slot.hasStrategy ? '' : ' disabled'}`;
    card.innerHTML = `
      <div class="slot-left"><span class="qnum">Q${slot.question_number}</span></div>
      <div class="slot-body">
        <div class="topic">${escapeHtml(slot.topic)}</div>
        <div class="marks">${slot.typical_marks} marks typical</div>
      </div>
      <div class="slot-right">
        ${slot.hasStrategy
          ? `<span class="ready">Strategy ready →</span>`
          : `<span class="coming">Coming soon</span>`}
      </div>
    `;
    if (slot.hasStrategy) {
      card.addEventListener('click', () => {
        sessionStorage.setItem('currentSlot', JSON.stringify(slot));
        sessionStorage.setItem('currentStrategiesNav', NAV_ID(grade, paperNumber));
        navigate(`#/strategy/${slot.id}`);
      });
    }
    list.appendChild(card);
  });
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

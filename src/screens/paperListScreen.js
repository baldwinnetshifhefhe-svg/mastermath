// PaperListScreen — list past papers for a grade with Grade 12 / 11 / 10 tabs
// so the user can move between grades without leaving the sidebar item.
import { supabase } from '../lib/supabase.js';
import { navigate, setHeaderTitle } from '../../app.js';

const GRADES = [12, 11, 10];

export async function paperListScreen({ grade = 12 } = {}) {
  const root = document.createElement('div');
  if (!GRADES.includes(grade)) grade = 12;
  setHeaderTitle(`Past Papers · Grade ${grade}`);

  const tabsHtml = GRADES.map(g => `
    <button class="tab ${g === grade ? 'active' : ''}" data-grade="${g}">Grade ${g}</button>
  `).join('');

  root.innerHTML = `
    <div class="mm-page-title">📑 Past Papers</div>
    <div class="mm-page-sub">DBE NSC mathematics archive. Tap any paper to drill into its questions.</div>
    <div class="tabs">${tabsHtml}</div>
    <div id="paperList"><div class="spinner-wrap"><div class="spinner"></div></div></div>
  `;

  root.querySelectorAll('.tab').forEach(b => {
    b.addEventListener('click', () => {
      const g = Number(b.dataset.grade);
      if (g === grade) return;
      navigate(`#/papers/${g}`);
    });
  });

  const { data: papers = [], error } = await supabase
    .from('papers')
    .select('id, year, session, paper_number, language, examining_body')
    .eq('grade', grade)
    .order('year', { ascending: false })
    .order('paper_number');

  const list = root.querySelector('#paperList');
  if (error) {
    list.innerHTML = `<div class="error">${escapeHtml(error.message)}</div>`;
    return root;
  }
  if (!papers.length) {
    list.innerHTML = `
      <div class="coming-soon-box">
        No Grade ${grade} papers loaded yet. They'll appear here once imported into Supabase.
      </div>`;
    return root;
  }

  list.innerHTML = '';
  papers.forEach(p => {
    const card = document.createElement('div');
    card.className = 'paper-card';
    card.innerHTML = `
      <div class="paper-info">
        <div class="paper-title">${escapeHtml(p.session)} ${p.year}</div>
        <div class="paper-sub">Paper ${p.paper_number} · ${escapeHtml(p.examining_body)} · ${(p.language || '').toUpperCase()}</div>
      </div>
      <span class="paper-arrow">›</span>
    `;
    card.addEventListener('click', () => {
      sessionStorage.setItem('currentPaper', JSON.stringify(p));
      navigate(`#/questions/${p.id}`);
    });
    list.appendChild(card);
  });
  return root;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

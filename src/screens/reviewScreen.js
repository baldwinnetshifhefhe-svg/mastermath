// ReviewScreen — spaced-repetition queue. Lists the questions due for review
// (missed recently, or correct-but-due-again) and pages through them. Clicking
// one opens it with the whole due-list as siblings, so Next walks the session.
import { supabase } from '../lib/supabase.js';
import { getReviewQueue } from '../lib/review.js';
import { navigate, setHeaderTitle } from '../../app.js';

export async function reviewScreen() {
  const root = document.createElement('div');
  root.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  setHeaderTitle('Review');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { root.innerHTML = `<div class="empty-list">Sign in to use review.</div>`; return root; }

  let queue;
  try { queue = await getReviewQueue(user.id); }
  catch (e) { root.innerHTML = `<div class="error">Could not load review (${escapeHtml(e.message || String(e))}).</div>`; return root; }

  const { due, counts } = queue;

  if (!counts.learning && !counts.mastered) {
    root.innerHTML = `
      <div class="mm-page-title">🔁 Review</div>
      <div class="progress-empty">
        <div class="progress-empty-title">Nothing to review yet.</div>
        <div class="progress-empty-sub">Practise some questions and self-mark them. Anything you miss comes back here on a smart schedule until it sticks.</div>
        <button class="primary-btn-block" id="goPractise" style="max-width:280px">Start practising →</button>
      </div>`;
    root.querySelector('#goPractise').addEventListener('click', () => navigate('#/papers/12'));
    return root;
  }

  if (!due.length) {
    root.innerHTML = `
      <div class="mm-page-title">🔁 Review</div>
      <div class="progress-empty">
        <div class="progress-empty-title">✅ All caught up!</div>
        <div class="progress-empty-sub">Nothing is due right now. ${counts.learning} question(s) still learning, ${counts.mastered} mastered. Come back tomorrow.</div>
      </div>`;
    return root;
  }

  const ids = due.map(d => d.questionId);
  root.innerHTML = `
    <div class="mm-page-title">🔁 Review — ${due.length} due</div>
    <div class="mm-page-sub">${counts.learning} learning · ${counts.mastered} mastered. Missed questions return fast; mastered ones space out.</div>
    <div class="q-action-row">
      <button class="primary-btn-block" id="startReview" style="max-width:320px">▶ Start review session (${due.length})</button>
    </div>
    <div class="review-list">
      ${due.map(d => `
        <div class="q-card review-card" data-id="${d.questionId}">
          <div class="q-card-left">
            <div class="q-label">${escapeHtml(d.label)}</div>
            <div class="q-marks">${d.marks} marks</div>
          </div>
          <div class="q-card-body">
            <div class="q-source">${escapeHtml(d.topic)}${d.paper ? ' · ' + escapeHtml(d.paper) : ''}</div>
            <div class="review-meta">
              <span class="review-tag ${d.lastCorrect ? 'tag-due' : 'tag-missed'}">${d.lastCorrect ? 'due again' : 'missed last time'}</span>
              ${d.overdueDays > 0 ? `<span class="review-overdue">${d.overdueDays}d overdue</span>` : ''}
            </div>
          </div>
          <div class="q-arrow">→</div>
        </div>`).join('')}
    </div>
  `;

  const open = (id) => {
    sessionStorage.setItem('siblingIds', JSON.stringify(ids));
    navigate(`#/question/${id}`);
  };
  root.querySelector('#startReview').addEventListener('click', () => open(ids[0]));
  root.querySelectorAll('.review-card').forEach(c =>
    c.addEventListener('click', () => open(Number(c.dataset.id))));

  return root;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

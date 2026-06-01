// Dashboard — the student's personal progress home.
// Reads their user_attempts (logged from the question screen's self-marking)
// and turns them into: headline stats, a 14-day activity chart, and per-topic
// mastery bars. Falls back to a friendly "start practising" prompt with zero
// data. Library counts + quick-launch cards live below.
import { supabase } from '../lib/supabase.js';
import { computeQueue } from '../lib/review.js';
import { generateReportCard } from '../lib/reportCard.js';
import { navigate } from '../../app.js';

export async function dashboardScreen() {
  const root = document.createElement('div');
  root.innerHTML = `
    <div class="mm-banner">
      <div class="mm-banner-title">Master the Condition.</div>
      <div class="mm-banner-sub">Master the Paper.</div>
      <div class="mm-banner-note">
        Every DBE question is built from a small number of conditions.<br>
        Learn the condition — no question can surprise you.
      </div>
    </div>

    <div id="progressSection"><div class="spinner-wrap"><div class="spinner"></div></div></div>

    <div class="mm-section-title">QUICK LAUNCH</div>
    <div class="mm-stat-grid">
      <div class="mm-stat-card" id="goStrategies" style="cursor:pointer">
        <div class="mm-stat-label">📘 PAPER 1 STRATEGIES</div>
        <div class="mm-stat-value" style="font-size:18px">Open</div>
        <div class="mm-stat-detail">Question-by-question playbook built from real past papers.</div>
      </div>
      <div class="mm-stat-card" id="goPapers" style="cursor:pointer">
        <div class="mm-stat-label">📑 PAST PAPERS</div>
        <div class="mm-stat-value" style="font-size:18px">Browse</div>
        <div class="mm-stat-detail">All DBE NSC papers — drill straight into a question.</div>
      </div>
      <div class="mm-stat-card" id="goAbout" style="cursor:pointer">
        <div class="mm-stat-label">📖 HOW IT WORKS</div>
        <div class="mm-stat-value" style="font-size:18px">Read</div>
        <div class="mm-stat-detail">Why we teach conditions instead of "topics".</div>
      </div>
    </div>

    <div class="mm-section-title">LIBRARY</div>
    <div class="mm-stat-grid">
      <div class="mm-stat-card"><div class="mm-stat-label">PAPERS LOADED</div><div class="mm-stat-value" id="statPapers">—</div><div class="mm-stat-detail">DBE NSC archive</div></div>
      <div class="mm-stat-card"><div class="mm-stat-label">STRATEGIES READY</div><div class="mm-stat-value" id="statStrats">—</div><div class="mm-stat-detail">conditions playbooks</div></div>
      <div class="mm-stat-card"><div class="mm-stat-label">QUESTIONS</div><div class="mm-stat-value" id="statQs">—</div><div class="mm-stat-detail">published &amp; tagged</div></div>
    </div>
  `;

  root.querySelector('#goStrategies').addEventListener('click', () => navigate('#/strategies/12/1'));
  root.querySelector('#goPapers').addEventListener('click', () => navigate('#/papers/12'));
  root.querySelector('#goAbout').addEventListener('click', () => navigate('#/about'));

  loadProgress(root).catch((e) => {
    const s = root.querySelector('#progressSection');
    if (s) s.innerHTML = `<div class="empty-list">Could not load your progress (${escapeHtml(e.message || String(e))}).</div>`;
  });
  loadStats(root).catch(() => { /* leave library stats as em-dash on failure */ });
  return root;
}

// ── Personal progress ───────────────────────────────────────────────────────
async function loadProgress(root) {
  const { data: { user } } = await supabase.auth.getUser();
  const section = root.querySelector('#progressSection');
  if (!user) {
    section.innerHTML = `<div class="empty-list">Sign in to start tracking your progress.</div>`;
    return;
  }

  const { data: rows, error } = await supabase
    .from('user_attempts')
    .select('question_id, is_correct, attempted_at, questions(slot_id, question_slots(topic, paper_number))')
    .eq('user_id', user.id)
    .order('attempted_at', { ascending: true });
  if (error) throw error;

  const attempts = rows || [];
  if (!attempts.length) {
    section.innerHTML = `
      <div class="mm-section-title">YOUR PROGRESS</div>
      <div class="progress-empty">
        <div class="progress-empty-title">No practice logged yet.</div>
        <div class="progress-empty-sub">Open any question, try it, then tap <strong>Got it / Partly / Missed it</strong>.
        Your mastery per topic and your streak will grow here.</div>
        <button class="primary-btn-block" id="startNow" style="max-width:280px">Start practising →</button>
      </div>`;
    section.querySelector('#startNow').addEventListener('click', () => navigate('#/papers/12'));
    return;
  }

  // Headline numbers
  const total       = attempts.length;
  const correct     = attempts.filter(a => a.is_correct).length;
  const accuracy    = Math.round((correct / total) * 100);
  const distinct    = new Set(attempts.map(a => a.question_id)).size;
  const dayKeys     = attempts.map(a => localDateKey(new Date(a.attempted_at)));
  const daySet      = new Set(dayKeys);
  const streak      = computeStreak(daySet);
  const last7       = attempts.filter(a => (Date.now() - new Date(a.attempted_at)) < 7 * 864e5).length;

  // 14-day activity
  const days = last14Days(dayKeys);

  // Due for review (reuse the rows we already fetched — counts only)
  let dueCount = 0;
  try { dueCount = computeQueue(attempts).counts.due; } catch { dueCount = 0; }

  // Topic mastery
  const byTopic = new Map();
  for (const a of attempts) {
    const topic = a.questions?.question_slots?.topic || 'Other';
    const t = byTopic.get(topic) || { topic, total: 0, correct: 0 };
    t.total += 1;
    if (a.is_correct) t.correct += 1;
    byTopic.set(topic, t);
  }
  const topics = [...byTopic.values()]
    .map(t => ({ ...t, pct: Math.round((t.correct / t.total) * 100) }))
    .sort((a, b) => a.pct - b.pct);   // weakest first = where to focus
  const focus = topics.find(t => t.total >= 2) || topics[0];

  section.innerHTML = `
    <div class="mm-section-title">YOUR PROGRESS</div>
    ${dueCount ? `<button class="review-cta" id="reviewCta">🔁 <strong>${dueCount}</strong> question${dueCount === 1 ? '' : 's'} due for review — keep them from slipping. Start review →</button>` : ''}
    <div class="mm-stat-grid">
      <div class="mm-stat-card"><div class="mm-stat-label">PRACTISED</div><div class="mm-stat-value">${distinct}</div><div class="mm-stat-detail">questions attempted</div></div>
      <div class="mm-stat-card"><div class="mm-stat-label">ACCURACY</div><div class="mm-stat-value">${accuracy}%</div><div class="mm-stat-detail">${correct} of ${total} self-marked right</div></div>
      <div class="mm-stat-card"><div class="mm-stat-label">DAY STREAK</div><div class="mm-stat-value">${streak}🔥</div><div class="mm-stat-detail">consecutive days</div></div>
      <div class="mm-stat-card"><div class="mm-stat-label">THIS WEEK</div><div class="mm-stat-value">${last7}</div><div class="mm-stat-detail">attempts in last 7 days</div></div>
    </div>

    <div class="progress-panel">
      <div class="progress-panel-title">Activity — last 14 days</div>
      ${activityChart(days)}
    </div>

    <div class="progress-panel">
      <div class="progress-panel-title">Topic mastery${focus ? ` · focus on <span class="focus-topic">${escapeHtml(focus.topic)}</span>` : ''}</div>
      <div class="mastery-list">
        ${topics.map(t => `
          <div class="mastery-row">
            <div class="mastery-name">${escapeHtml(t.topic)}</div>
            <div class="mastery-bar"><div class="mastery-fill ${masteryClass(t.pct)}" style="width:${t.pct}%"></div></div>
            <div class="mastery-pct">${t.pct}% <span class="mastery-n">(${t.correct}/${t.total})</span></div>
          </div>`).join('')}
      </div>
      <button class="report-card-btn" id="reportCardBtn">📄 Download my report card (PDF)</button>
    </div>
  `;

  section.querySelector('#reviewCta')?.addEventListener('click', () => navigate('#/review'));

  const payload = {
    email: user.email, distinct, total, correct, accuracy, streak, last7,
    dueCount, topics, generatedAt: new Date(),
  };
  const btn = section.querySelector('#reportCardBtn');
  btn?.addEventListener('click', async () => {
    btn.disabled = true; const orig = btn.textContent; btn.textContent = 'Building your PDF…';
    try { await generateReportCard(payload); }
    catch (e) { alert(`Could not build the PDF: ${e.message || e}`); }
    finally { btn.disabled = false; btn.textContent = orig; }
  });
}

// Simple inline SVG bar chart — no external chart lib (keeps the static host
// + low-data-budget constraint happy). One bar per day, height ∝ attempts.
function activityChart(days) {
  const W = 100, H = 38, gap = 1.4;
  const max = Math.max(1, ...days.map(d => d.count));
  const bw = (W - gap * (days.length - 1)) / days.length;
  const bars = days.map((d, i) => {
    const h = d.count ? Math.max(2, (d.count / max) * (H - 6)) : 0;
    const x = i * (bw + gap);
    const y = H - h;
    const cls = d.count ? 'ac-bar' : 'ac-bar ac-bar-empty';
    return `<rect class="${cls}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${bw.toFixed(2)}" height="${h.toFixed(2)}" rx="0.6">
      <title>${d.key}: ${d.count} attempt${d.count === 1 ? '' : 's'}</title></rect>`;
  }).join('');
  return `<svg class="activity-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Daily practice, last 14 days">${bars}</svg>`;
}

function masteryClass(pct) {
  if (pct >= 75) return 'mastery-hi';
  if (pct >= 50) return 'mastery-mid';
  return 'mastery-lo';
}

function localDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function last14Days(dayKeys) {
  const counts = new Map();
  for (const k of dayKeys) counts.set(k, (counts.get(k) || 0) + 1);
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);
    out.push({ key, count: counts.get(key) || 0 });
  }
  return out;
}

// Streak = consecutive days (ending today or yesterday) with ≥1 attempt.
function computeStreak(daySet) {
  let streak = 0;
  const d = new Date();
  if (!daySet.has(localDateKey(d))) d.setDate(d.getDate() - 1);  // allow "today not done yet"
  while (daySet.has(localDateKey(d))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

// ── Library counts (unchanged content, now its own section) ─────────────────
async function loadStats(root) {
  const [papers, strategies, questions] = await Promise.all([
    supabase.from('papers').select('id', { count: 'exact', head: true }),
    supabase.from('strategies').select('id', { count: 'exact', head: true }),
    supabase.from('questions').select('id', { count: 'exact', head: true }).eq('is_published', true),
  ]);
  setText(root, '#statPapers', papers.count ?? '—');
  setText(root, '#statStrats', strategies.count ?? '—');
  setText(root, '#statQs',     questions.count ?? '—');
}

function setText(root, sel, val) {
  const el = root.querySelector(sel);
  if (el) el.textContent = String(val);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

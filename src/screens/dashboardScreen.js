// Dashboard — landing page. Pulls a few summary counts from Supabase
// (papers loaded, strategies published, total questions) and renders the
// "Master the Condition" banner plus quick-launch cards into the other pages.
import { supabase } from '../lib/supabase.js';
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

    <div class="mm-stat-grid" id="statGrid">
      <div class="mm-stat-card"><div class="mm-stat-label">PAPERS LOADED</div><div class="mm-stat-value" id="statPapers">—</div><div class="mm-stat-detail">DBE NSC archive</div></div>
      <div class="mm-stat-card"><div class="mm-stat-label">STRATEGIES READY</div><div class="mm-stat-value" id="statStrats">—</div><div class="mm-stat-detail">out of 10 P1 slots</div></div>
      <div class="mm-stat-card"><div class="mm-stat-label">QUESTIONS</div><div class="mm-stat-value" id="statQs">—</div><div class="mm-stat-detail">published &amp; tagged</div></div>
      <div class="mm-stat-card"><div class="mm-stat-label">YOUR REPORTS</div><div class="mm-stat-value" id="statReports">—</div><div class="mm-stat-detail">issues you raised</div></div>
    </div>

    <div class="mm-section-title">QUICK LAUNCH</div>
    <div class="mm-stat-grid">
      <div class="mm-stat-card" id="goStrategies" style="cursor:pointer">
        <div class="mm-stat-label">📘 PAPER 1 STRATEGIES</div>
        <div class="mm-stat-value" style="font-size:18px">Open</div>
        <div class="mm-stat-detail">Question-by-question playbook built from 20 real past papers.</div>
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
  `;

  root.querySelector('#goStrategies').addEventListener('click', () => navigate('#/strategies/12/1'));
  root.querySelector('#goPapers').addEventListener('click', () => navigate('#/papers/12'));
  root.querySelector('#goAbout').addEventListener('click', () => navigate('#/about'));

  loadStats(root).catch(() => { /* leave stats as em-dash on failure */ });
  return root;
}

async function loadStats(root) {
  const [papers, strategies, questions, user] = await Promise.all([
    supabase.from('papers').select('id', { count: 'exact', head: true }),
    supabase.from('strategies').select('id', { count: 'exact', head: true }),
    supabase.from('questions').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.auth.getUser(),
  ]);

  setText(root, '#statPapers',  papers.count ?? '—');
  setText(root, '#statStrats',  strategies.count ?? '—');
  setText(root, '#statQs',      questions.count ?? '—');

  if (user.data?.user) {
    const { count } = await supabase
      .from('mistake_reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.data.user.id);
    setText(root, '#statReports', count ?? 0);
  } else {
    setText(root, '#statReports', 0);
  }
}

function setText(root, sel, val) {
  const el = root.querySelector(sel);
  if (el) el.textContent = String(val);
}

// About — static methodology page. Explains the "conditions" approach and
// links out to DBE source material. No data fetches.
export function aboutScreen() {
  const root = document.createElement('div');
  root.innerHTML = `
    <div class="mm-banner">
      <div class="mm-banner-title">How MasterMaths works</div>
      <div class="mm-banner-sub">Conditions, not topics.</div>
      <div class="mm-banner-note">
        DBE Mathematics Paper 1 is built from a small, stable set of question
        "conditions" — recognisable patterns that recur year after year.
      </div>
    </div>

    <div class="mm-section-title">THE METHOD</div>
    <div class="mm-stat-card" style="border-left-color:var(--accent)">
      <p style="margin:0 0 10px;line-height:1.55">
        Most exam-prep tells you to study by <em>topic</em> — quadratics, sequences,
        functions, calculus. That's how textbooks are organised. It's not how the
        exam is built.
      </p>
      <p style="margin:0 0 10px;line-height:1.55">
        Each Paper 1 question is built from a fixed cookbook of <strong>conditions</strong>
        — the kind of trigger phrases like "show that…", "for which values of \\(k\\)…",
        "prove by induction…", "find the maximum…". The numbers change every year; the
        conditions almost never do.
      </p>
      <p style="margin:0;line-height:1.55">
        For each question slot (Q1, Q2, …, Q10), MasterMaths shows you every
        condition DBE has tested in the last 20 papers, with the strategy for
        each one. Practice the conditions — and the paper stops surprising you.
      </p>
    </div>

    <div class="mm-section-title">DATA</div>
    <div class="mm-stat-grid">
      <div class="mm-stat-card">
        <div class="mm-stat-label">SOURCE</div>
        <div class="mm-stat-value" style="font-size:14px;font-weight:600">DBE NSC archive</div>
        <div class="mm-stat-detail">Free, public-domain Grade 12 papers from the Department of Basic Education.</div>
      </div>
      <div class="mm-stat-card">
        <div class="mm-stat-label">COVERAGE</div>
        <div class="mm-stat-value" style="font-size:14px;font-weight:600">2018 — 2025</div>
        <div class="mm-stat-detail">Nov + Feb/March sittings, English + Afrikaans.</div>
      </div>
      <div class="mm-stat-card">
        <div class="mm-stat-label">AI EXPLANATIONS</div>
        <div class="mm-stat-value" style="font-size:14px;font-weight:600">Claude Sonnet</div>
        <div class="mm-stat-detail">Generated on demand via the <code>explain</code> Edge Function — never stored unless you ask.</div>
      </div>
    </div>

    <div class="mm-section-title">CREDITS</div>
    <div class="mm-stat-card">
      <p style="margin:0;line-height:1.55;font-size:13px;color:var(--text-soft)">
        Built by Baldwin Netshifhefhe. Question content © Department of Basic
        Education, used under the DBE open-access licence for past examination
        papers. Strategy commentary © MasterMaths.
      </p>
    </div>
  `;
  return root;
}

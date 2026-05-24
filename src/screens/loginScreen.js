// LoginScreen — full-screen sign-in. Same smart-auth flow as the mobile app:
// try sign-in, fall back to sign-up if creds aren't recognised, and surface
// a clear "Wrong password" when the account exists with a different password.
import { supabase } from '../lib/supabase.js';
import { getMode, setMode, THEME_ICONS } from '../theme/theme.js';
import { navigate } from '../../app.js';

export function loginScreen() {
  const root = document.createElement('div');
  root.className = 'login-root';
  root.innerHTML = `
    <div class="theme-picker">
      ${['light','dark','heritage'].map(m => `
        <button class="theme-pill ${getMode() === m ? 'active' : ''}" data-mode="${m}">${THEME_ICONS[m]}</button>
      `).join('')}
    </div>

    <div class="login-wrap">
      <img src="assets/icon.png" class="login-logo" alt="">
      <div class="brand">MasterMaths</div>
      <div class="tagline">Grade 12 maths, one condition at a time.</div>

      <div class="cloud-wrap">
        <div class="cloud-halo h3"></div>
        <div class="cloud-halo h2"></div>
        <div class="cloud-halo h1"></div>
        <div class="quote-box">
          <div class="quote-big">You're not failing maths.</div>
          <div class="quote-big accent">You just don't know the strategy.</div>
          <div class="quote-small">Learn how DBE thinks — and no paper can surprise you.</div>
        </div>
      </div>

      <input type="email" id="email" placeholder="Email" autocomplete="email" />
      <input type="password" id="password" placeholder="Password" autocomplete="current-password" />

      <button id="submitBtn" class="primary-btn">Continue</button>

      <div class="login-toggle">
        New here? Just enter an email + password — we'll create your account.
      </div>
    </div>
  `;

  root.querySelectorAll('.theme-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      setMode(btn.dataset.mode);
      // Re-mark the active pill without rebuilding the whole form.
      root.querySelectorAll('.theme-pill').forEach(b => b.classList.toggle('active', b.dataset.mode === btn.dataset.mode));
    });
  });

  const emailEl = root.querySelector('#email');
  const passEl  = root.querySelector('#password');
  const btnEl   = root.querySelector('#submitBtn');

  async function submit() {
    const cleanEmail = emailEl.value.trim().toLowerCase();
    const password   = passEl.value;
    if (!cleanEmail || !password) { alert('Please enter both your email and password.'); return; }
    if (password.length < 6) { alert('Password too short: use at least 6 characters.'); return; }
    btnEl.disabled = true; btnEl.textContent = 'Working…';
    try {
      const signIn = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (!signIn.error) { navigate('#/'); return; }
      const msg = signIn.error.message || '';
      if (/invalid login credentials/i.test(msg)) {
        const signUp = await supabase.auth.signUp({ email: cleanEmail, password });
        if (signUp.error) {
          const sMsg = signUp.error.message || '';
          if (/already registered|already exists|user.*exist/i.test(sMsg)) {
            throw new Error('Wrong password. Please check and try again.');
          }
          throw signUp.error;
        }
        const retry = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (retry.error) throw retry.error;
        navigate('#/');
        return;
      }
      throw signIn.error;
    } catch (e) {
      alert('Sign-in failed: ' + (e.message || 'Unknown error'));
    } finally {
      btnEl.disabled = false; btnEl.textContent = 'Continue';
    }
  }
  btnEl.addEventListener('click', submit);
  passEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

  return root;
}

// App shell — ADEWS-style layout:
//   • fixed left sidebar with collapsible state and a page selector,
//   • fixed top header (status strip + title bar),
//   • scrolling content area that shifts with the sidebar width.
// Hash routes drive both the active sidebar page and the deep-link sub-route
// (e.g. /strategy/:id lives under the "strategies" sidebar item).
import { supabase } from './src/lib/supabase.js';
import {
  getTheme, getMode, setMode, toggleMode, onThemeChange,
  applyThemeToDocument, THEME_ICONS,
} from './src/theme/theme.js';

import { loginScreen }        from './src/screens/loginScreen.js';
import { dashboardScreen }    from './src/screens/dashboardScreen.js';
import { homeScreen }         from './src/screens/homeScreen.js';
import { strategyScreen }     from './src/screens/strategyScreen.js';
import { paperListScreen }    from './src/screens/paperListScreen.js';
import { questionListScreen } from './src/screens/questionListScreen.js';
import { questionScreen }     from './src/screens/questionScreen.js';
import { practiceSessionScreen } from './src/screens/practiceSessionScreen.js';
import { reviewScreen }       from './src/screens/reviewScreen.js';
import { aboutScreen }        from './src/screens/aboutScreen.js';
import { conditionsPreviewScreen } from './src/screens/conditionsPreviewScreen.js';

const SIDEBAR_W_OPEN   = 220;
const SIDEBAR_W_CLOSED = 60;

// Sidebar layout. Items map to one or more route patterns; the first route is
// the "landing" route when the item is clicked. `section` headings group
// items by grade so the user can find Paper 1 / Paper 2 for any grade.
const NAV = [
  { section: 'NAVIGATE' },
  { id: 'dashboard',  icon: '🏠', label: 'Dashboard',  defaultHash: '#/',  patterns: [/^#\/$/] },
  { id: 'review',     icon: '🔁', label: 'Review',     defaultHash: '#/review', patterns: [/^#\/review$/] },

  { section: 'GRADE 12' },
  { id: 'g12p1', icon: '📘', label: 'Paper 1', defaultHash: '#/strategies/12/1', patterns: [/^#\/strategies\/12\/1$/] },
  { id: 'g12p2', icon: '📗', label: 'Paper 2', defaultHash: '#/strategies/12/2', patterns: [/^#\/strategies\/12\/2$/] },

  { section: 'GRADE 11' },
  { id: 'g11p1', icon: '📘', label: 'Paper 1', defaultHash: '#/strategies/11/1', patterns: [/^#\/strategies\/11\/1$/] },
  { id: 'g11p2', icon: '📗', label: 'Paper 2', defaultHash: '#/strategies/11/2', patterns: [/^#\/strategies\/11\/2$/] },

  { section: 'GRADE 10' },
  { id: 'g10p1', icon: '📘', label: 'Paper 1', defaultHash: '#/strategies/10/1', patterns: [/^#\/strategies\/10\/1$/] },
  { id: 'g10p2', icon: '📗', label: 'Paper 2', defaultHash: '#/strategies/10/2', patterns: [/^#\/strategies\/10\/2$/] },

  { section: 'RESOURCES' },
  { id: 'conditions-preview', icon: '🧪', label: 'Conditions (PREVIEW)', defaultHash: '#/conditions-preview', patterns: [/^#\/conditions-preview$/] },
  { id: 'papers', icon: '📑', label: 'Past Papers', defaultHash: '#/papers/12',
    patterns: [/^#\/papers(\/(\d+))?$/, /^#\/questions\/(.+)$/, /^#\/question\/(.+)$/] },
  { id: 'about',  icon: '📖', label: 'About',       defaultHash: '#/about', patterns: [/^#\/about$/] },
];

// Route table — what to render for each hash, and which builder to call.
const ROUTES = [
  { match: /^#\/login$/,                       build: () => loginScreen(),                                                 fullScreen: true },
  { match: /^#\/$/,                            build: () => dashboardScreen(),                                             needsAuth: true, title: 'Dashboard' },
  { match: /^#\/review$/,                      build: () => reviewScreen(),                                                needsAuth: true, title: 'Review' },
  { match: /^#\/strategies\/(\d+)\/(\d+)$/,    build: (m) => homeScreen({ grade: Number(m[1]), paperNumber: Number(m[2]) }), needsAuth: true, title: 'Strategies' },
  { match: /^#\/strategy\/(.+)$/,              build: (m) => strategyScreen({ slotId: m[1] }),                             needsAuth: true, title: 'Strategy' },
  { match: /^#\/practice\/(.+)$/,              build: (m) => practiceSessionScreen({ slotId: m[1] }),                      needsAuth: true, title: 'Practice' },
  { match: /^#\/papers(?:\/(\d+))?$/,          build: (m) => paperListScreen({ grade: m[1] ? Number(m[1]) : 12 }),         needsAuth: true, title: 'Past Papers' },
  { match: /^#\/questions\/(.+)$/,             build: (m) => questionListScreen({ paperId: m[1] }),                        needsAuth: true, title: 'Questions' },
  { match: /^#\/question\/(.+)$/,              build: (m) => questionScreen({ questionId: m[1] }),                         needsAuth: true, title: 'Question' },
  { match: /^#\/about$/,                       build: () => aboutScreen(),                                                 needsAuth: true, title: 'About MasterMaths' },
  { match: /^#\/conditions-preview$/,          build: () => conditionsPreviewScreen(),                                     needsAuth: true, title: 'Conditions (Preview)' },
];

const COLLAPSED_KEY = 'mm-sidebar-collapsed';
let appRoot, sidebarEl, backdropEl, headerEl, contentEl;
let sidebarCollapsed = false;
let mobileSidebarOpen = false;
let currentUserEmail = '';
let currentTitle = '';
let currentNavId = 'dashboard';

export function setHeaderTitle(title) {
  currentTitle = title;
  const t = headerEl?.querySelector('.mm-title-text');
  if (t) t.textContent = (title || '').toUpperCase();
}

export function navigate(hash) {
  if (location.hash === hash) renderRoute();
  else location.hash = hash;
}

function activeNavForHash(hash) {
  // When the user clicks into a strategy detail, /strategy/:id doesn't know
  // which grade/paper owns it on its own. The strategies list stashes the
  // current grade+paper in sessionStorage when navigating in so the right
  // sidebar item stays lit.
  if (/^#\/strategy\//.test(hash)) {
    const ctx = sessionStorage.getItem('currentStrategiesNav');
    if (ctx && NAV.some(n => n.id === ctx)) return ctx;
  }
  for (const nav of NAV) {
    if (!nav.patterns) continue;
    for (const p of nav.patterns) if (p.test(hash)) return nav.id;
  }
  return null;
}

function renderSidebar() {
  if (!sidebarEl) return;
  const t = getTheme();
  const widthOpen = SIDEBAR_W_OPEN;
  const width = sidebarCollapsed ? SIDEBAR_W_CLOSED : widthOpen;
  sidebarEl.style.width = `${width}px`;
  sidebarEl.classList.toggle('mm-sidebar-collapsed', sidebarCollapsed);
  sidebarEl.classList.toggle('open', mobileSidebarOpen);

  sidebarEl.innerHTML = `
    <div class="mm-brand">
      <div class="mm-brand-logo">M</div>
      <div class="mm-brand-text">
        <div class="mm-brand-name">MASTERMATHS</div>
        <div class="mm-brand-sub">DBE · NSC · GR 10–12</div>
      </div>
    </div>
    <div class="mm-sidebar-scroll">
      ${NAV.map(n => n.section
        ? `<div class="mm-nav-section">${escapeHtml(n.section)}</div>`
        : `<button class="mm-nav-item ${currentNavId === n.id ? 'active' : ''}"
                   data-nav="${n.id}"
                   title="${escapeAttr(n.label)}">
             <span class="mm-nav-icon">${n.icon}</span>
             <span class="mm-nav-label">${escapeHtml(n.label)}</span>
           </button>`
      ).join('')}
    </div>
    <div class="mm-sidebar-footer">
      <button class="mm-footer-btn danger" id="logoutBtn" title="Sign out">
        <span class="mm-footer-icon">⏏</span>
        <span class="mm-footer-label">LOGOUT</span>
      </button>
      <button class="mm-footer-btn" id="collapseBtn" title="${sidebarCollapsed ? 'Expand' : 'Collapse'} sidebar">
        <span class="mm-footer-icon">${sidebarCollapsed ? '»' : '«'}</span>
        <span class="mm-footer-label">${sidebarCollapsed ? 'EXPAND' : 'COLLAPSE'}</span>
      </button>
    </div>
  `;
  sidebarEl.querySelectorAll('.mm-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.nav;
      const nav = NAV.find(n => n.id === id);
      if (!nav) return;
      mobileSidebarOpen = false;
      // Clear any stale "the user was drilled into a strategy from X" hint —
      // clicking a sidebar entry should always pin the active item to that
      // sidebar entry, not to whatever they last drilled in from.
      sessionStorage.removeItem('currentStrategiesNav');
      navigate(nav.defaultHash);
    });
  });
  sidebarEl.querySelector('#logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.hash = '#/login';
  });
  sidebarEl.querySelector('#collapseBtn').addEventListener('click', () => {
    sidebarCollapsed = !sidebarCollapsed;
    try { localStorage.setItem(COLLAPSED_KEY, sidebarCollapsed ? '1' : '0'); } catch {}
    renderShell();
  });
}

function renderHeader() {
  if (!headerEl) return;
  const sidebarW = sidebarCollapsed ? SIDEBAR_W_CLOSED : SIDEBAR_W_OPEN;
  headerEl.style.left = `${sidebarW}px`;

  headerEl.innerHTML = `
    <div class="mm-status">
      <div class="mm-status-left">
        <button class="mm-hamburger" id="hamburgerBtn" title="Menu">☰</button>
        <span class="mm-status-dot">
          <span class="dot"></span>
          <span class="mm-status-label">LIVE</span>
        </span>
        <span class="mm-status-divider">|</span>
        <span class="mm-status-version">MM v1.0</span>
        ${currentUserEmail ? `<span class="mm-status-divider">|</span><span class="mm-status-user">👤 ${escapeHtml(currentUserEmail)}</span>` : ''}
      </div>
      <div class="mm-status-right">
        <button class="mm-status-btn accent" id="themeBtnHeader">${THEME_ICONS[getMode()] || '☀️'} ${(getMode() || 'light').toUpperCase()}</button>
      </div>
    </div>
    <div class="mm-title-bar">
      <div>
        <div class="mm-title-text">${escapeHtml((currentTitle || 'MASTERMATHS').toUpperCase())}</div>
        <div class="mm-title-sub">DBE · Grade 12 · Mathematics · 2018 – 2025</div>
      </div>
      <div class="mm-title-emblem" title="MasterMaths">
        <img src="assets/icon.png" alt="">
        <span class="label">RSA</span>
      </div>
    </div>
  `;
  headerEl.querySelector('#hamburgerBtn').addEventListener('click', () => {
    mobileSidebarOpen = !mobileSidebarOpen;
    renderSidebar();
  });
  headerEl.querySelector('#themeBtnHeader').addEventListener('click', () => toggleMode());
}

function renderShell() {
  const sidebarW = sidebarCollapsed ? SIDEBAR_W_CLOSED : SIDEBAR_W_OPEN;
  if (sidebarEl) sidebarEl.style.display = '';
  if (headerEl)  headerEl.style.display  = '';
  if (contentEl) {
    contentEl.style.marginLeft = `${sidebarW}px`;
    contentEl.style.paddingTop = '120px';
  }
  renderSidebar();
  renderHeader();
}

function hideShell() {
  if (sidebarEl) sidebarEl.style.display = 'none';
  if (headerEl)  headerEl.style.display  = 'none';
  if (backdropEl) backdropEl.style.display = 'none';
  if (contentEl) {
    contentEl.style.marginLeft = '0';
    contentEl.style.paddingTop = '0';
  }
}

async function renderRoute() {
  const hash = location.hash || '#/';
  let route = ROUTES.find(r => r.match.test(hash));
  if (!route) { location.hash = '#/'; return; }
  const match = hash.match(route.match);

  // Auth gating
  if (route.needsAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { location.hash = '#/login'; return; }
    currentUserEmail = session.user?.email || '';
  } else if (hash === '#/login') {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) { location.hash = '#/'; return; }
  }

  if (route.fullScreen) {
    hideShell();
    contentEl.innerHTML = '';
    const node = await route.build(match);
    if (node) contentEl.appendChild(node);
    return;
  }

  currentNavId = activeNavForHash(hash) || 'dashboard';
  currentTitle = route.title || '';
  renderShell();

  contentEl.innerHTML = `<div class="mm-page"><div class="spinner-wrap"><div class="spinner"></div></div></div>`;
  let node;
  try {
    node = await route.build(match);
  } catch (e) {
    contentEl.innerHTML = `<div class="mm-page"><div class="error">Error: ${escapeHtml(e.message || String(e))}</div></div>`;
    return;
  }
  const page = document.createElement('div');
  page.className = 'mm-page';
  if (node) page.appendChild(node);
  contentEl.innerHTML = '';
  contentEl.appendChild(page);
  // Title may have been refined by the screen via setHeaderTitle — re-render header.
  renderHeader();
}

function init() {
  appRoot   = document.getElementById('app');
  sidebarEl = document.getElementById('appSidebar');
  backdropEl = document.getElementById('appSidebarBackdrop');
  headerEl  = document.getElementById('appHeader');
  contentEl = document.getElementById('appContent');

  try { sidebarCollapsed = localStorage.getItem(COLLAPSED_KEY) === '1'; } catch {}

  applyThemeToDocument();
  onThemeChange(() => { renderShell(); });

  backdropEl?.addEventListener('click', () => {
    mobileSidebarOpen = false;
    renderSidebar();
  });

  window.addEventListener('hashchange', renderRoute);
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      currentUserEmail = '';
      location.hash = '#/login';
    }
  });

  if (!location.hash) location.hash = '#/';
  renderRoute();
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

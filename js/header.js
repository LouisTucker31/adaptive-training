function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initHeader() {
  const header = document.getElementById('app-header');
  if (!header) return;

  header.innerHTML = `
    <a class="header__logo" href="index.html">
      <div class="header__logo-icon">
        <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 1L1 13h14L8 1zm0 3l4.5 8h-9L8 4z"/>
        </svg>
      </div>
      <span class="header__app-name">Adaptive Training</span>
    </a>
    <div class="header__spacer"></div>
    <div class="header__settings-wrap" id="settings-wrap">
      <button class="header__settings-btn" id="settings-btn" aria-label="Settings" aria-expanded="false">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="3" y1="5"  x2="17" y2="5"  stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="7"  cy="5"  r="2" fill="white" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="13" cy="10" r="2" fill="white" stroke="currentColor" stroke-width="1.6"/>
          <circle cx="8"  cy="15" r="2" fill="white" stroke="currentColor" stroke-width="1.6"/>
        </svg>
      </button>
      <div class="settings-panel" id="settings-panel" aria-hidden="true">
        <div class="settings-panel__section">
          <span class="settings-panel__label">Units</span>
          <div class="settings-units-toggle" id="units-toggle">
            <button class="settings-units-toggle__btn" data-unit="mi">mi</button>
            <button class="settings-units-toggle__btn" data-unit="km">km</button>
          </div>
        </div>
        <div class="settings-panel__divider"></div>
        <div class="settings-panel__section">
          <span class="settings-panel__label">Appearance</span>
          <div class="settings-units-toggle" id="theme-toggle">
            <button class="settings-units-toggle__btn" data-theme="light" aria-label="Light mode">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
            <button class="settings-units-toggle__btn" data-theme="dark" aria-label="Dark mode">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                <path d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 8 8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="settings-panel__divider"></div>
      </div>
    </div>
  `;

  initSettings();
  initBackNav();
}

function initBackNav() {
  const label = document.body.dataset.backLabel;
  const href  = document.body.dataset.backHref;

  // Remove any existing back-nav (safe to call multiple times)
  const existing = document.querySelector('.back-nav');
  if (existing) existing.remove();

  if (!label || !href) return;

  const nav = document.createElement('div');
  nav.className = 'back-nav';
  nav.innerHTML = '<a class="back-nav__link" href="' + href + '">‹ ' + label + '</a>';
  document.body.insertBefore(nav, document.getElementById('app-main'));
}

function initSettings() {
  const btn        = document.getElementById('settings-btn');
  const panel      = document.getElementById('settings-panel');
  const wrap       = document.getElementById('settings-wrap');
  const unitBtns   = document.querySelectorAll('#units-toggle .settings-units-toggle__btn');
  const themeBtns  = document.querySelectorAll('#theme-toggle .settings-units-toggle__btn');

  if (!btn || !panel) return;

  // Apply saved preferences on load
  applyUnit(localStorage.getItem('units') || 'mi', unitBtns);
  applyTheme(localStorage.getItem('theme') || 'light', themeBtns);

  // Toggle panel open/close
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', isOpen);
    panel.setAttribute('aria-hidden', !isOpen);
  });

  // Close when clicking outside
  document.addEventListener('click', e => {
    if (!wrap.contains(e.target)) {
      panel.classList.remove('is-open');
      btn.setAttribute('aria-expanded', false);
      panel.setAttribute('aria-hidden', true);
    }
  });

  // Unit toggle
  unitBtns.forEach(b => {
    b.addEventListener('click', () => {
      const unit = b.dataset.unit;
      localStorage.setItem('units', unit);
      applyUnit(unit, unitBtns);
      document.dispatchEvent(new CustomEvent('unitsChanged', { detail: { unit } }));
    });
  });

  // Theme toggle
  themeBtns.forEach(b => {
    b.addEventListener('click', () => {
      const theme = b.dataset.theme;
      localStorage.setItem('theme', theme);
      applyTheme(theme, themeBtns);
    });
  });
}

function applyUnit(unit, btns) {
  btns.forEach(b => b.classList.toggle('is-active', b.dataset.unit === unit));
}

function applyTheme(theme, btns) {
  document.documentElement.setAttribute('data-theme', theme);
  if (btns) btns.forEach(b => b.classList.toggle('is-active', b.dataset.theme === theme));
}

// Apply theme before paint to avoid flash
(function() {
  const t = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
})();

document.addEventListener('DOMContentLoaded', initHeader);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/adaptive-training/sw.js').catch(() => {});
  });
}
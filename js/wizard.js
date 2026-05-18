const wizard = (() => {
  let steps   = [];
  let current = 0;
  let history = []; // stack of step indices for back navigation

  function register(el) {
    steps.push({ el });
  }

  function reveal(index) {
    const item = steps[index];
    if (!item) return;

    if (index === 0) {
      current = 0;
      return;
    }

    const prev = steps[index - 1];

    history.push(current);
    current = index;

    // Force a paint of the starting position before animating in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        item.el.classList.add('wizard-step--active');
        if (prev) prev.el.classList.add('wizard-step--exit');
        updateNav();
      });
    });
  }

  function advance() {
    reveal(current + 1);
  }

  function back() {
    if (history.length === 0) return;
    // If going back to step 0, restore the page back nav
    if (history[history.length - 1] === 0) {
      const pageBackNav = document.querySelector('.back-nav');
      if (pageBackNav) pageBackNav.style.display = 'flex';
    }
    const prevIndex = history.pop();
    const prevItem  = steps[prevIndex];
    const currItem  = steps[current];
    if (!prevItem) return;

    // Slide current out downward, bring previous back in
    currItem.el.classList.remove('wizard-step--active');
    currItem.el.classList.add('wizard-step--back-exit');
    prevItem.el.classList.remove('wizard-step--exit');
    prevItem.el.classList.add('wizard-step--back-enter');

    setTimeout(() => {
      currItem.el.classList.remove('wizard-step--back-exit');
      prevItem.el.classList.remove('wizard-step--back-enter');
      prevItem.el.classList.add('wizard-step--active');
    }, 450);

    current = prevIndex;
    updateNav();
  }

  function updateNav() {
    const backBtn = document.getElementById('wizard-back-btn');
    const progress = document.getElementById('wizard-progress');
    const progressBar = document.getElementById('wizard-progress-bar');
    const progressText = document.getElementById('wizard-progress-text');

    if (backBtn) backBtn.style.display = history.length > 0 ? 'flex' : 'none';

    if (progress) {
      const isReview = steps[current] && steps[current].el.classList.contains('wizard-step--review');
      if (isReview || current === 0) {
        progress.style.display = 'none';
      } else if (window._wizardRealTotal) {
        const pct = Math.round((current / window._wizardRealTotal) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        progress.style.display = 'flex';
      } else {
        if (progressBar) progressBar.style.width = '5%';
        progress.style.display = 'flex';
      }
    }
  }

  function setTotal(n, provisional) {
    if (provisional) {
      window._wizardRealTotal = null;
    } else {
      window._wizardRealTotal = n;
    }
    updateNav();
  }

  function init() {
    current = 0;
    history = [];
    updateNav();
  }

  function getCurrent() { return current; }

  return { register, advance, back, reveal, init, setTotal, getCurrent };
})();

function _showLoadingOverlay(onDone) {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-box">
      <div class="loading-spinner"></div>
      <p class="loading-title">Building your programme</p>
      <p class="loading-sub">Adaptive Training is personalising your plan\u2026</p>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));
  setTimeout(onDone, 2800);
}

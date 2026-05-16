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

    if (progress && window._wizardTotal) {
      const pct = Math.round((current / window._wizardTotal) * 100);
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressText) progressText.textContent = current + ' of ' + window._wizardTotal;
      progress.style.display = window._wizardTotal > 1 ? 'flex' : 'none';
    }
  }

  function setTotal(n) {
    window._wizardTotal = n;
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

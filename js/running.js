/* ── Running page — boot ── */

function getRunningPreviousProgrammes() {
  const saved = JSON.parse(localStorage.getItem('running-programmes') || '[]');
  return saved;
}

function buildRunStep1() {
  const el = document.getElementById('step-programme');
  el.classList.add('wizard-step--first');

  const programmes = getRunningPreviousProgrammes();
  const hasPrev = programmes.length > 0;

  const prevList = hasPrev ? `
    <div class="prev-programmes" id="prev-list">
      ${programmes.map(p => `
        <div class="prev-programme-card" data-id="${p.id}" data-name="${p.name}" role="button" tabindex="0">
          <div class="prev-programme-card__info">
            <div class="prev-programme-card__name-row">
              <span class="prev-programme-card__name">${p.name}</span>
            </div>
            <span class="prev-programme-card__meta">${p.meta}</span>
          </div>
          <span class="prev-programme-card__arrow">›</span>
        </div>`).join('')}
    </div>` : '';

  el.innerHTML = `
    <div class="wizard-step__inner">
      <h2 class="wizard-step__question">Your programme</h2>
      <p class="wizard-step__hint">Pick up where you left off, or build something new.</p>
      <div class="wizard-choices" id="programme-choices">
        <button class="wizard-choice" data-value="new" type="button">
          <span class="wizard-choice__icon">✦</span>
          <span class="wizard-choice__body">
            <span class="wizard-choice__title">Create a new programme</span>
            <span class="wizard-choice__desc">Answer a few questions to build your plan</span>
          </span>
        </button>
        ${hasPrev ? `
        <button class="wizard-choice" data-value="existing" type="button">
          <span class="wizard-choice__icon">📋</span>
          <span class="wizard-choice__body">
            <span class="wizard-choice__title">Load a previous programme</span>
            <span class="wizard-choice__desc">Continue from an existing plan</span>
          </span>
        </button>` : ''}
      </div>
      ${prevList}
    </div>
  `;

  const choices = el.querySelectorAll('.wizard-choice');
  const prevListEl = el.querySelector('#prev-list');

  choices.forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      const alreadySelected = btn.classList.contains('is-selected');
      choices.forEach(b => b.classList.remove('is-selected'));
      if (alreadySelected) {
        el.classList.remove('has-selection');
        if (prevListEl) prevListEl.classList.remove('is-open');
        return;
      }
      btn.classList.add('is-selected');
      el.classList.add('has-selection');
      if (value === 'existing' && prevListEl) {
        prevListEl.classList.add('is-open');
        prevListEl.querySelectorAll('.prev-programme-card').forEach(card => {
          card.addEventListener('click', () => {
            const id   = card.dataset.id;
            const name = card.dataset.name;
            setTimeout(() => {
              window.location.href = `programme.html?id=${id}&name=${encodeURIComponent(name)}`;
            }, 180);
          }, { once: true });
          card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
              const id   = card.dataset.id;
              const name = card.dataset.name;
              window.location.href = `programme.html?id=${id}&name=${encodeURIComponent(name)}`;
            }
          }, { once: true });
        });
      } else if (value === 'new') {
        if (prevListEl) prevListEl.classList.remove('is-open');
        startRunWizard();
      }
    });
  });
}

/* ── Dynamic step management ── */
let runStepEls = [];
let runAllBuilders = [];
let runBuiltUpTo = -1;

function getOrCreateRunStepEl(index) {
  while (runStepEls.length <= index) {
    const el = document.createElement('div');
    el.className = 'wizard-step';
    el.id = 'run-step-pool-' + runStepEls.length;
    document.querySelector('.wizard').appendChild(el);
    runStepEls.push(el);
  }
  return runStepEls[index];
}

function ensureRunBuilt(index) {
  if (index <= runBuiltUpTo) return;
  for (let i = runBuiltUpTo + 1; i <= index; i++) {
    const el = getOrCreateRunStepEl(i);
    wizard.register(el);
    runAllBuilders[i](el, () => advanceRunTo(i + 1));
    runBuiltUpTo = i;
  }
}

function advanceRunTo(index) {
  if (index >= runAllBuilders.length) return;
  ensureRunBuilt(index);
  wizard.advance();
}

function spliceRunAfterCurrent(builder) {
  const insertAt = runBuiltUpTo + 1;
  runAllBuilders.splice(insertAt, 0, builder);
  wizard.setTotal(runAllBuilders.length - 1);
}

// runSaveAndNavigate is defined in running-review.js

function startRunWizard() {
  runBuiltUpTo = -1;
  runStepEls = [];

  document.getElementById('wizard-nav').style.display = 'flex';
  document.querySelector('.wizard').classList.add('wizard--started');

  runAllBuilders = [
    (el, next) => buildRunGoalStep(el, (goal) => {
      const branch = getRunBranchBuilders(goal);
      runAllBuilders = [
        runAllBuilders[0],
        ...branch,
        (el2, _) => { el2.classList.add('wizard-step--review'); buildRunningReviewStep(el2, runSaveAndNavigate); },
      ];
      wizard.setTotal(runAllBuilders.length);
      next();
    }),
  ];

  ensureRunBuilt(0);
  wizard.advance();
}

document.addEventListener('DOMContentLoaded', () => {
  wizard.register(document.getElementById('step-programme'));
  buildRunStep1();
  wizard.init();

  document.getElementById('wizard-back-btn').addEventListener('click', () => {
    wizard.back();
  });
});

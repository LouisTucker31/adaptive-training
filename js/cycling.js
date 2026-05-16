/* ── Cycling page — boot ── */

function getPreviousProgrammes() {
  return JSON.parse(localStorage.getItem('programmes') || '[]');
}

function buildStep1() {
  const el = document.getElementById('step-programme');
  el.classList.add('wizard-step--first');

  const programmes = getPreviousProgrammes();
  const hasPrev = programmes.length > 0;

  const prevList = hasPrev ? `
    <div class="prev-programmes" id="prev-list">
      ${programmes.map(p => `
        <div class="prev-programme-card" data-id="${p.id}" data-name="${p.name}" role="button" tabindex="0">
          <div class="prev-programme-card__info">
            <div class="prev-programme-card__name-row">
              <span class="prev-programme-card__name">${p.name}</span>
              ${p.demo ? '<span class="prev-programme-card__demo-badge">Demo</span>' : ''}
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
          card.addEventListener('click', () => selectProgramme(card), { once: true });
          card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') selectProgramme(card);
          }, { once: true });
        });
      } else if (value === 'new') {
        if (prevListEl) prevListEl.classList.remove('is-open');
        startWizard();
      }
    });
  });
}

function selectProgramme(card) {
  const id   = card.dataset.id;
  const name = card.dataset.name;
  setTimeout(() => {
    window.location.href = `programme.html?id=${id}&name=${encodeURIComponent(name)}`;
  }, 180);
}

/* ── Dynamic step management ── */
const STEP_POOL_SIZE = 25;
let stepEls = [];
let allBuilders = [];   // full resolved list of builders after branch chosen
let builtUpTo = -1;     // highest index built so far

function getOrCreateStepEl(index) {
  while (stepEls.length <= index) {
    const el = document.createElement('div');
    el.className = 'wizard-step';
    el.id = 'step-pool-' + stepEls.length;
    document.querySelector('.wizard').appendChild(el);
    stepEls.push(el);
  }
  return stepEls[index];
}

function ensureBuilt(index) {
  if (index <= builtUpTo) return;
  for (let i = builtUpTo + 1; i <= index; i++) {
    const el = getOrCreateStepEl(i);
    wizard.register(el);
    allBuilders[i](el, () => advanceTo(i + 1));
    builtUpTo = i;
  }
}

function advanceTo(index) {
  if (index >= allBuilders.length) return;
  ensureBuilt(index);
  wizard.advance();
}

// Insert a builder immediately after the given index (used for format branching)
function spliceAfterCurrent(builder) {
  const insertAt = builtUpTo + 1;
  allBuilders.splice(insertAt, 0, builder);
  wizard.setTotal(allBuilders.length - 1);
}

function startWizard() {
  builtUpTo = -1;
  stepEls = [];

  // Show nav bar and shift wizard down to account for it
  document.getElementById('wizard-nav').style.display = 'flex';
  document.querySelector('.wizard').classList.add('wizard--started');

  // Goal step is index 0 in dynamic pool
  allBuilders = [
    (el, next) => buildGoalStep(el, (goal) => {
      // Once goal is chosen, splice in the branch builders + review
      const branch = getBranchBuilders(goal);
      allBuilders = [
        allBuilders[0], // goal step stays
        ...branch,
        (el2, _) => { el2.classList.add('wizard-step--review'); buildReviewStep(el2, saveAndNavigate); },
      ];
      wizard.setTotal(allBuilders.length);
      next();
    }),
  ];

  ensureBuilt(0);
  wizard.advance();
}

document.addEventListener('DOMContentLoaded', () => {
  // Register step 1
  wizard.register(document.getElementById('step-programme'));
  buildStep1();
  wizard.init();

  // Back button
  document.getElementById('wizard-back-btn').addEventListener('click', () => {
    wizard.back();
  });
});

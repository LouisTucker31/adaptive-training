/* ── Goals ── */

const GOALS_KEY = 'user-goals';
const PBS_KEY_G = 'user-pbs';

const GOAL_TYPES = {
  cycling: [
    { value: 'c_complete_century', label: 'Complete a century (100 miles)' },
    { value: 'c_beat_pb_100mi',    label: 'Beat my 100 mile PB' },
    { value: 'c_beat_pb_50mi',     label: 'Beat my 50 mile PB' },
    { value: 'c_beat_pb_25mi',     label: 'Beat my 25 mile PB' },
    { value: 'c_beat_pb_40km',     label: 'Beat my 40km PB' },
    { value: 'c_event',            label: 'Complete a specific event' },
    { value: 'c_custom',           label: 'Custom goal' },
  ],
  running: [
    { value: 'r_complete_mara',  label: 'Complete a marathon' },
    { value: 'r_complete_half',  label: 'Complete a half marathon' },
    { value: 'r_beat_pb_mara',   label: 'Beat my marathon PB' },
    { value: 'r_beat_pb_half',   label: 'Beat my half marathon PB' },
    { value: 'r_beat_pb_10k',    label: 'Beat my 10km PB' },
    { value: 'r_beat_pb_5k',     label: 'Beat my 5km PB' },
    { value: 'r_event',          label: 'Complete a specific event' },
    { value: 'r_custom',         label: 'Custom goal' },
  ],
};

const PB_KEY_MAP = {
  c_beat_pb_100mi: 'c_100mi',
  c_beat_pb_50mi:  'c_50mi',
  c_beat_pb_25mi:  'c_25mi',
  c_beat_pb_40km:  'c_40km',
  r_beat_pb_mara:  'r_mara',
  r_beat_pb_half:  'r_half',
  r_beat_pb_10k:   'r_10k',
  r_beat_pb_5k:    'r_5k',
};

function safeLoadGoals() {
  try { return JSON.parse(localStorage.getItem(GOALS_KEY) || '[]'); }
  catch { return []; }
}

function safeSaveGoals(data) {
  try { localStorage.setItem(GOALS_KEY, JSON.stringify(data)); }
  catch { showGoalError('Could not save. Your browser storage may be full.'); }
}

function safeLoadPBsForGoals() {
  try { return JSON.parse(localStorage.getItem(PBS_KEY_G) || '{}'); }
  catch { return {}; }
}

function showGoalError(msg) {
  const existing = document.getElementById('goal-error');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'goal-error';
  el.className = 'profile-error';
  el.textContent = msg;
  document.getElementById('app-main').prepend(el);
  setTimeout(() => el.remove(), 4000);
}

function formatGoalDate(val) {
  if (!val) return '';
  try {
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d)) return val;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return val; }
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now    = new Date(); now.setHours(0,0,0,0);
  const target = new Date(dateStr + 'T00:00:00');
  if (isNaN(target)) return null;
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

function getPBCurrentEntry(pbs, key) {
  const val = pbs[key];
  if (!val) return null;
  return val.current || val;
}

function secsToDisplayGoal(secs) {
  if (!secs || secs <= 0) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    : `${m}:${String(s).padStart(2,'0')}`;
}

function getBaseline(goalType, pbs) {
  const pbKey = PB_KEY_MAP[goalType];
  if (!pbKey) return null;
  const entry = getPBCurrentEntry(pbs, pbKey);
  if (!entry || !entry.secs) return null;
  return secsToDisplayGoal(entry.secs);
}

/* ── Build page ── */

function buildGoalsPage() {
  const goals = safeLoadGoals();
  const main  = document.getElementById('app-main');
  const pbs   = safeLoadPBsForGoals();

  const active   = goals.filter(g => g.status !== 'achieved');
  const achieved = goals.filter(g => g.status === 'achieved');

  const activeCycling = active.filter(g => g.sport === 'cycling');
  const activeRunning = active.filter(g => g.sport === 'running');
  const achievedCycling = achieved.filter(g => g.sport === 'cycling');
  const achievedRunning = achieved.filter(g => g.sport === 'running');

  const isEmpty = active.length === 0 && achieved.length === 0;

  main.innerHTML = `
    <div class="home">
      <h1 class="home__heading">Goals</h1>
      <p class="home__subheading">Set targets and track what you are working toward.</p>

      ${activeCycling.length > 0 ? `
        <div class="profile-section">
          <h2 class="profile-section__title">Cycling</h2>
          <div class="goals-list">
            ${activeCycling.map(g => renderGoalCard(g, pbs)).join('')}
          </div>
        </div>` : ''}

      ${activeRunning.length > 0 ? `
        <div class="profile-section">
          <h2 class="profile-section__title">Running</h2>
          <div class="goals-list">
            ${activeRunning.map(g => renderGoalCard(g, pbs)).join('')}
          </div>
        </div>` : ''}

      ${achievedCycling.length > 0 || achievedRunning.length > 0 ? `
        <div class="profile-section">
          <h2 class="profile-section__title">Achieved</h2>
          <div class="goals-list goals-list--achieved">
            ${achievedCycling.map(g => renderGoalCard(g, pbs)).join('')}
            ${achievedRunning.map(g => renderGoalCard(g, pbs)).join('')}
          </div>
        </div>` : ''}

      ${isEmpty ? `
        <div class="profile-section">
          <div class="profile-card">
            <div class="goals-empty">
              <p class="goals-empty__text">No goals set yet.</p>
              <p class="goals-empty__sub">Add a goal to track what you are working toward.</p>
            </div>
          </div>
        </div>` : ''}

      <div class="profile-section">
        <div class="profile-card goals-add-card">
          <button class="goals-open-form goals-add-card__btn" type="button">+ Add a goal</button>
        </div>
      </div>
      <div class="goals-form-wrap" style="display:none"></div>
    </div>
  `;

  attachGoalListeners(goals, pbs);
}

function renderGoalCard(goal, pbs) {
  const days     = daysUntil(goal.targetDate);
  const baseline = getBaseline(goal.type, pbs);
  const isAchieved = goal.status === 'achieved';

  let countdownHtml = '';
  if (!isAchieved && days !== null) {
    const label = days < 0  ? `${Math.abs(days)} days ago`
                : days === 0 ? 'Today'
                : `${days} days to go`;
    const cls   = days < 0 ? 'goal-countdown--past'
                : days < 14 ? 'goal-countdown--soon'
                : 'goal-countdown--future';
    countdownHtml = `<span class="goal-countdown ${cls}">${escapeHTML(label)}</span>`;
  }

  const baselineHtml = baseline
    ? `<span class="goal-baseline">Current PB: ${escapeHTML(baseline)}</span>`
    : '';

  const targetHtml = goal.targetTime
    ? `<span class="goal-target">Target: ${escapeHTML(goal.targetTime)}</span>`
    : '';

  return `
    <div class="goal-card${isAchieved ? ' goal-card--achieved' : ''}" data-id="${escapeHTML(goal.id)}">
      <div class="goal-card__header">
        <div class="goal-card__info">
          <span class="goal-card__title">${escapeHTML(goal.label || goal.customLabel || '')}</span>
          ${goal.targetDate ? `<span class="goal-card__date">${escapeHTML(formatGoalDate(goal.targetDate))}</span>` : ''}
        </div>
        <div class="goal-card__meta">
          ${baselineHtml}
          ${targetHtml}
          ${countdownHtml}
        </div>
      </div>
      <div class="goal-card__actions">
        ${!isAchieved ? `<button class="goal-achieve-btn" data-id="${escapeHTML(goal.id)}" type="button">Mark achieved ✓</button>` : '<span class="goal-achieved-label">✓ Achieved</span>'}
        <button class="goal-delete-btn" data-id="${escapeHTML(goal.id)}" type="button">Remove</button>
      </div>
    </div>`;
}

function showGoalForm(pbs) {
  const wrap = document.querySelector('.goals-form-wrap');
  if (!wrap) return;
  const addSection = document.querySelector('.goals-open-form')?.closest('.profile-section');
  if (addSection) addSection.style.display = 'none';
  wrap.style.display = 'block';

  wrap.innerHTML = `
    <div class="goal-form profile-card">
      <div class="goal-form__row">
        <label class="pb-editor__label">Sport</label>
        <select class="profile-input profile-input--select goal-sport-sel">
          <option value="cycling">Cycling</option>
          <option value="running">Running</option>
        </select>
      </div>
      <div class="goal-form__row">
        <label class="pb-editor__label">Goal type</label>
        <select class="profile-input profile-input--select goal-type-sel">
          <option value="">Select…</option>
        </select>
      </div>
      <div class="goal-form__custom-row" style="display:none">
        <label class="pb-editor__label">Describe your goal</label>
        <input class="profile-input goal-custom-input" type="text" placeholder="e.g. Ride the length of the UK" autocomplete="off" />
      </div>
      <div class="goal-form__row">
        <label class="pb-editor__label">Target time (optional)</label>
        <input class="profile-input goal-target-input" type="text" placeholder="e.g. 3:45:00" autocomplete="off" />
      </div>
      <div class="goal-form__row">
        <label class="pb-editor__label">Target date (optional)</label>
        <input class="profile-input goal-date-input" type="date" />
      </div>
      <div class="goal-form__baseline"></div>
      <div class="goal-form__actions">
        <button class="pb-save-btn goal-save-btn" type="button">Add goal</button>
        <button class="equip-cancel-btn goal-cancel-btn" type="button">Cancel</button>
      </div>
    </div>
  `;

  const sportSel   = wrap.querySelector('.goal-sport-sel');
  const typeSel    = wrap.querySelector('.goal-type-sel');
  const customRow  = wrap.querySelector('.goal-form__custom-row');
  const customInput = wrap.querySelector('.goal-custom-input');
  const targetInput = wrap.querySelector('.goal-target-input');
  const dateInput   = wrap.querySelector('.goal-date-input');
  const baselineEl  = wrap.querySelector('.goal-form__baseline');
  const saveBtn     = wrap.querySelector('.goal-save-btn');
  const cancelBtn   = wrap.querySelector('.goal-cancel-btn');

  function populateTypes() {
    const sport = sportSel.value;
    const types = GOAL_TYPES[sport] || [];
    typeSel.innerHTML = `<option value="">Select…</option>` +
      types.map(t => `<option value="${escapeHTML(t.value)}">${escapeHTML(t.label)}</option>`).join('');
    baselineEl.innerHTML = '';
    customRow.style.display = 'none';
  }

  function updateBaseline() {
    const type     = typeSel.value;
    const isCustom = type.endsWith('_custom') || type.endsWith('_event');
    customRow.style.display = isCustom ? 'block' : 'none';
    const baseline = getBaseline(type, pbs);
    baselineEl.innerHTML = baseline
      ? `<div class="goal-baseline-hint">Your current PB: <strong>${escapeHTML(baseline)}</strong></div>`
      : '';
  }

  sportSel.addEventListener('change', populateTypes);
  typeSel.addEventListener('change', updateBaseline);
  populateTypes();

  cancelBtn.addEventListener('click', () => {
    wrap.style.display = 'none';
    wrap.innerHTML = '';
    const btn = document.querySelector('.goals-open-form');
    if (btn) btn.closest('.profile-section').style.display = '';
  });

  saveBtn.addEventListener('click', () => {
    const type  = typeSel.value;
    if (!type) { showGoalError('Please select a goal type.'); return; }

    const sport  = sportSel.value;
    const types  = GOAL_TYPES[sport] || [];
    const typeDef = types.find(t => t.value === type);
    const isCustom = type.endsWith('_custom') || type.endsWith('_event');
    const label  = isCustom ? customInput.value.trim() : (typeDef ? typeDef.label : type);
    if (isCustom && !label) { showGoalError('Please describe your goal.'); return; }

    const goal = {
      id:          'goal-' + Date.now(),
      sport,
      type,
      label:       isCustom ? typeDef.label : label,
      customLabel: isCustom ? label : null,
      targetTime:  targetInput.value.trim() || null,
      targetDate:  dateInput.value || null,
      status:      'active',
      createdAt:   new Date().toISOString(),
    };

    const goals = safeLoadGoals();
    goals.unshift(goal);
    safeSaveGoals(goals);
    wrap.style.display = 'none';
    wrap.innerHTML = '';
    buildGoalsPage();
  });
}

function attachGoalListeners(goals, pbs) {
  const openBtn = document.querySelector('.goals-open-form');
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      showGoalForm(pbs);
    });
  }

  document.querySelectorAll('.goal-achieve-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.id;
      const goals = safeLoadGoals();
      const goal  = goals.find(g => g.id === id);
      if (goal) { goal.status = 'achieved'; goal.achievedAt = new Date().toISOString(); }
      safeSaveGoals(goals);
      buildGoalsPage();
    });
  });

  document.querySelectorAll('.goal-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Remove this goal?')) return;
      const id    = btn.dataset.id;
      const goals = safeLoadGoals().filter(g => g.id !== id);
      safeSaveGoals(goals);
      buildGoalsPage();
    });
  });
}

document.addEventListener('DOMContentLoaded', buildGoalsPage);
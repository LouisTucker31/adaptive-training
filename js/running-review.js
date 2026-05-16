/* ── Running review screen ── */

const runningAnswerLabels = {
  goal:            { label: 'Goal', map: { event: 'Specific race', distance: 'Hit a target distance', fitness: 'Build running fitness', new: 'New to running' } },
  raceDistance:    { label: 'Race distance', map: { '5k': '5k', '10k': '10k', half: 'Half marathon', marathon: 'Marathon', other: 'Other / Ultra' } },
  surface:         { label: 'Surface', map: { road: 'Road', trail: 'Trail', mixed: 'Mixed' } },
  elevation:       { label: 'Terrain', map: { flat: 'Flat', rolling: 'Rolling', hilly: 'Hilly', mountainous: 'Mountainous' } },
  goalFinish:      { label: 'Finish goal', map: { finish: 'Just finish', comfortable: 'Finish comfortably', time: 'Hit a time target', competitive: 'Race it' } },
  targetTime:      { label: 'Target time', text: true },
  weeksToEvent:    { label: 'Weeks to event', text: true },
  targetDistance:  { label: 'Target distance', text: true },
  targetDate:      { label: 'Timeframe', map: { yes: 'Yes - fixed weeks', no: 'No - own pace' } },
  fitnessGoal:     { label: 'Fitness goal', map: { distance: 'Run further', speed: 'Run faster', health: 'Get fitter', all: 'All-round improvement' } },
  hasKit:          { label: 'Running shoes', map: { yes: 'Yes', getting: 'Getting some soon', no: 'Not yet' } },
  generalFitness:  { label: 'General fitness', map: { low: 'Low', moderate: 'Moderate', good: 'Good' } },
  weeklyMileage:   { label: 'Weekly running', map: { '0': 'Not running', '<10km': '<10km / <6mi', '10-25km': '10–25km / 6–15mi', '25-50km': '25–50km / 15–30mi', '50-80km': '50–80km / 30–50mi', '80km+': '80km+ / 50mi+' } },
  consistency:     { label: 'Consistency', map: { barely: 'Barely running', occasional: 'Occasionally', fairly: 'Fairly consistent', very: 'Very consistent' } },
  longestRecent:   { label: 'Longest run (8 weeks)', map: { '<3mi': '<3 miles', '3-6mi': '3–6 miles', '6-13mi': '6–13 miles', '13-26mi': '13–26 miles', '26mi+': '26+ miles', '<5km': '<5km', '5-10km': '5–10km', '10-21km': '10–21km', '21-42km': '21–42km', '42km+': '42km+' } },
  longestEver:     { label: 'Longest run ever', map: { '<3mi': '<3 miles', '3-6mi': '3–6 miles', '6-13mi': '6–13 miles', '13-26mi': '13–26 miles', '26-50mi': '26–50 miles', '50mi+': '50+ miles', '<5km': '<5km', '5-10km': '5–10km', '10-21km': '10–21km', '21-42km': '21–42km', '42-80km': '42–80km', '80km+': '80km+' } },
  daysPerWeek:     { label: 'Training days/week', map: { '2': '2 days', '3': '3 days', '4': '4 days', '5': '5 days', '6': '6 days' } },
  longRunDay:      { label: 'Long run day', map: { weekend: 'Weekend', weekday: 'Weekday', flexible: 'Flexible' } },
  injury:          { label: 'Injuries', map: { none: 'None', minor: 'Minor niggle', ongoing: 'Ongoing injury' } },
  energy:          { label: 'Energy & sleep', map: { good: 'Good', mixed: 'Mixed', poor: 'Poor' } },
  otherSports:     { label: 'Other training', map: { strength: 'Strength training', cycling: 'Cycling', swimming: 'Swimming', other: 'Other sport', none: 'Running only' } },
  tools:           { label: 'Training tools', multiMap: { hrm: 'Heart rate monitor', gps: 'GPS watch', power: 'Running power meter', none: 'None' } },
  background:      { label: 'Running background', map: { new: 'New to running', recreational: 'Recreational', experienced: 'Experienced', returning: 'Returning after break' } },
  doneBefore:      { label: 'Done before', map: { first: 'First time', similar: 'Similar distance', same: 'This exact distance' } },
  fuelling:        { label: 'Race nutrition', map: { confident: 'Well practised', some: 'Some experience', little: 'Not much', none: 'No experience' } },
};

function formatRunningAnswer(key, val) {
  if (!val) return '-';
  const def = runningAnswerLabels[key];
  if (!def) return val;
  if (def.map && def.map[val]) return def.map[val];
  if (def.multiMap) {
    if (val === 'none') return 'None';
    return val.split(',').map(v => def.multiMap[v] || v).join(', ');
  }
  return val;
}

function generateRunningProgrammeName(answers) {
  const distMap = { '5k': '5k', '10k': '10k', half: 'Half Marathon', marathon: 'Marathon', 'ultra-50k': '50k Ultra', 'ultra-50mi': '50 Mile Ultra', 'ultra-100k': '100k Ultra', 'ultra-100mi': '100 Mile Ultra' };
  if (answers.raceDistance) return (distMap[answers.raceDistance] || answers.raceDistance) + ' Training Plan';
  if (answers.targetDistance) return answers.targetDistance + ' Running Plan';
  if (answers.goal === 'fitness') return 'Running Fitness Plan';
  if (answers.goal === 'new') return 'Getting Started Running Plan';
  return 'My Running Plan';
}

function buildRunningReviewStep(el, onDone) {
  const name = generateRunningProgrammeName(runningAnswers);

  const rows = Object.keys(runningAnswerLabels)
    .filter(key => runningAnswers[key] !== undefined && runningAnswers[key] !== '')
    .map(key => {
      const def = runningAnswerLabels[key];
      const isMulti = !!def.multiMap;
      const hasOptions = !!def.map || isMulti;

      if (hasOptions) {
        const map = def.map || def.multiMap;
        const pills = Object.entries(map).map(([v, label]) =>
          `<button class="review-pill" data-value="${v}" data-multi="${isMulti}" type="button">${label}</button>`
        ).join('');
        return `
          <div class="review-row review-row--accordion" data-key="${key}" data-multi="${isMulti}" tabindex="0" role="button">
            <div class="review-row__summary">
              <span class="review-row__label">${def.label}</span>
              <span class="review-row__value" data-display="${key}">${formatRunningAnswer(key, runningAnswers[key])}</span>
            </div>
            <div class="review-row__pills" hidden>${pills}</div>
          </div>`;
      }

      return `
        <div class="review-row review-row--text" data-key="${key}" tabindex="0" role="button">
          <div class="review-row__summary">
            <span class="review-row__label">${def.label}</span>
            <span class="review-row__value" data-display="${key}">${formatRunningAnswer(key, runningAnswers[key])}</span>
          </div>
        </div>`;
    }).join('');

  el.innerHTML = `
    <div class="wizard-step__inner review-inner">
      <span class="wizard-step__connector"></span>
      <div class="review-name-wrap">
        <div class="review-name-heading" id="review-name-display" tabindex="0" role="button" aria-label="Edit programme name">${name}</div>
        <input class="review-name-input" id="input-progname" type="text" value="${name}" autocomplete="off" aria-label="Programme name" style="display:none" />
      </div>
      <p class="wizard-step__hint">Tap a row to change your answer.</p>
      <div class="review-list">${rows}</div>
      <button class="wizard-create-btn" id="btn-create">Create programme →</button>
    </div>
  `;

  // Name editing
  const nameDisplay = el.querySelector('#review-name-display');
  const nameInput   = el.querySelector('#input-progname');
  function showNameInput() { nameDisplay.style.display = 'none'; nameInput.style.display = ''; nameInput.focus(); nameInput.select(); }
  function showNameDisplay() { const v = nameInput.value.trim() || nameDisplay.textContent; nameDisplay.textContent = v; nameInput.value = v; nameDisplay.style.display = ''; nameInput.style.display = 'none'; }
  nameDisplay.addEventListener('click', showNameInput);
  nameDisplay.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') showNameInput(); });
  nameInput.addEventListener('blur', showNameDisplay);
  nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') showNameDisplay(); });

  // Accordion rows
  function closeAll() {
    el.querySelectorAll('.review-row--accordion.is-open').forEach(r => {
      r.classList.remove('is-open');
      r.querySelector('.review-row__pills').hidden = true;
    });
  }

  el.querySelectorAll('.review-row--accordion').forEach(row => {
    const key     = row.dataset.key;
    const isMulti = row.dataset.multi === 'true';
    const pillsEl = row.querySelector('.review-row__pills');

    function syncPills() {
      const selected = isMulti ? new Set((runningAnswers[key] || '').split(',').filter(Boolean)) : null;
      pillsEl.querySelectorAll('.review-pill').forEach(p => {
        p.classList.toggle('is-selected', isMulti ? selected.has(p.dataset.value) : runningAnswers[key] === p.dataset.value);
      });
    }

    row.addEventListener('click', e => {
      if (e.target.closest('.review-pill')) return;
      const isOpen = row.classList.contains('is-open');
      closeAll();
      if (!isOpen) { syncPills(); row.classList.add('is-open'); pillsEl.hidden = false; }
    });
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') row.click(); });

    pillsEl.querySelectorAll('.review-pill').forEach(pill => {
      pill.addEventListener('click', e => {
        e.stopPropagation();
        const val = pill.dataset.value;
        if (isMulti) {
          let selected = runningAnswers[key] === 'none' ? new Set(['none']) : new Set((runningAnswers[key] || '').split(',').filter(Boolean));
          if (val === 'none') { selected = new Set(['none']); }
          else { selected.delete('none'); if (selected.has(val)) selected.delete(val); else selected.add(val); if (selected.size === 0) selected.add('none'); }
          runningAnswers[key] = [...selected].join(',');
          syncPills();
        } else {
          runningAnswers[key] = val;
          const disp = row.querySelector('[data-display]');
          if (disp) disp.textContent = formatRunningAnswer(key, val);
          closeAll();
        }
      });
    });
  });

  el.querySelectorAll('.review-row--text').forEach(row => {
    const key  = row.dataset.key;
    const disp = row.querySelector('[data-display]');
    const startEdit = () => {
      if (row.querySelector('.review-inline-input')) return;
      closeAll(); disp.style.display = 'none';
      const input = document.createElement('input');
      input.className = 'review-inline-input'; input.value = runningAnswers[key] || '';
      row.querySelector('.review-row__summary').appendChild(input); input.focus();
      const save = () => { runningAnswers[key] = input.value.trim() || runningAnswers[key]; disp.textContent = formatRunningAnswer(key, runningAnswers[key]); disp.style.display = ''; input.remove(); };
      input.addEventListener('blur', save);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
    };
    row.addEventListener('click', startEdit);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') startEdit(); });
  });

  el.querySelector('#btn-create').addEventListener('click', () => {
    const progName = (nameInput.style.display === 'none' ? nameDisplay.textContent : nameInput.value).trim();
    if (!progName) return;
    onDone(progName, runningAnswers);
  });
}

function runSaveAndNavigate(progName, answers) {
  const id = 'run-' + Date.now();
  answers = { ...answers, entryUnit: localStorage.getItem('units') || 'mi' };

  let generated;
  try {
    generated = generateRunningProgramme(answers, progName);
  } catch (e) {
    console.error('generateRunningProgramme failed:', e);
    alert('Something went wrong building your programme. Please check your answers and try again.\n\n' + e.message);
    return;
  }

  const prog = {
    id,
    name: progName,
    meta: generated.meta.event + ' · ' + generated.meta.weeks + ' weeks',
    createdAt: new Date().toISOString(),
    answers,
    demo: false,
    generated,
    sport: 'running',
  };

  const existing = JSON.parse(localStorage.getItem('running-programmes') || '[]');
  existing.unshift(prog);
  localStorage.setItem('running-programmes', JSON.stringify(existing));

  runShowLoading(() => {
    window.location.href = `programme.html?id=${id}&name=${encodeURIComponent(progName)}&sport=running`;
  });
}

function runShowLoading(onDone) {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-box">
      <div class="loading-spinner"></div>
      <p class="loading-title">Building your programme</p>
      <p class="loading-sub">Adaptive Training is personalising your plan…</p>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));
  setTimeout(onDone, 2800);
}
/* ── Running Questions ── */

const runningAnswers = {};

function getUnit() { return localStorage.getItem('units') || 'mi'; }

/* ── Reusable step builders ── */

function rMcStep(el, key, question, hint, options, onSelect) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">${question}</p>
      ${hint ? `<p class="wizard-step__hint">${hint}</p>` : ''}
      <div class="wizard-choices">
        ${options.map(o => `
          <button class="wizard-choice" data-value="${o.value}" type="button">
            ${o.icon ? `<span class="wizard-choice__icon">${o.icon}</span>` : ''}
            <span class="wizard-choice__body">
              <span class="wizard-choice__title">${o.label}</span>
              ${o.desc ? `<span class="wizard-choice__desc">${o.desc}</span>` : ''}
            </span>
          </button>`).join('')}
      </div>
    </div>
  `;
  el.querySelectorAll('.wizard-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.wizard-choice').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      runningAnswers[key] = btn.dataset.value;
      setTimeout(() => onSelect(btn.dataset.value), 200);
    });
  });
}

function rTextStep(el, key, question, hint, placeholder, onContinue) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">${question}</p>
      ${hint ? `<p class="wizard-step__hint">${hint}</p>` : ''}
      <div class="wizard-input-wrap">
        <input class="wizard-input" id="input-${key}" type="text" placeholder="${placeholder}" autocomplete="off" />
        <button class="wizard-continue" id="btn-${key}" disabled>Continue →</button>
      </div>
    </div>
  `;
  const input = el.querySelector(`#input-${key}`);
  const btn   = el.querySelector(`#btn-${key}`);
  input.addEventListener('input', () => { btn.disabled = !input.value.trim(); });
  btn.addEventListener('click', () => {
    if (!input.value.trim()) return;
    runningAnswers[key] = input.value.trim();
    onContinue();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) { runningAnswers[key] = input.value.trim(); onContinue(); }
  });
  setTimeout(() => input.focus(), 300);
}

function rWeeksStep(el, key, question, hint, onContinue) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">${question}</p>
      ${hint ? `<p class="wizard-step__hint">${hint}</p>` : ''}
      <div class="wizard-distance-wrap">
        <input class="wizard-input wizard-distance-input" id="input-${key}" type="number" inputmode="numeric" min="1" max="52" placeholder="0" autocomplete="off" />
        <span style="font-size:0.9375rem;font-weight:600;color:var(--text-secondary);padding-left:0.25rem">weeks</span>
      </div>
      <button class="wizard-continue" id="btn-${key}" disabled style="margin-top:0.75rem">Continue →</button>
    </div>
  `;
  const input = el.querySelector(`#input-${key}`);
  const btn   = el.querySelector(`#btn-${key}`);
  input.addEventListener('input', () => { btn.disabled = !input.value || Number(input.value) < 1; });
  btn.addEventListener('click', () => {
    if (!input.value || Number(input.value) < 1) return;
    runningAnswers[key] = input.value + ' weeks';
    onContinue();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value && Number(input.value) >= 1) {
      runningAnswers[key] = input.value + ' weeks';
      onContinue();
    }
  });
  setTimeout(() => input.focus(), 300);
}

function rToolsStep(el, next) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">Do you train with any of these?</p>
      <p class="wizard-step__hint">Select all that apply.</p>
      <div class="wizard-choices">
        ${[
          { value: 'hrm',   label: 'Heart rate monitor' },
          { value: 'gps',   label: 'GPS watch' },
          { value: 'power', label: 'Running power meter' },
          { value: 'none',  label: 'None of the above' },
        ].map(o => `
          <button class="wizard-choice" data-value="${o.value}" type="button">
            <span class="wizard-choice__body">
              <span class="wizard-choice__title">${o.label}</span>
            </span>
          </button>`).join('')}
      </div>
      <button class="wizard-continue" id="btn-tools" disabled style="margin-top:1rem">Continue →</button>
    </div>
  `;
  const selected = new Set();
  el.querySelectorAll('.wizard-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.value;
      if (val === 'none') {
        selected.clear();
        el.querySelectorAll('.wizard-choice').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        selected.add('none');
      } else {
        const noneBtn = el.querySelector('[data-value="none"]');
        if (noneBtn) noneBtn.classList.remove('is-selected');
        selected.delete('none');
        btn.classList.toggle('is-selected');
        if (btn.classList.contains('is-selected')) selected.add(val);
        else selected.delete(val);
      }
      el.querySelector('#btn-tools').disabled = selected.size === 0;
    });
  });
  el.querySelector('#btn-tools').addEventListener('click', () => {
    runningAnswers['tools'] = [...selected].join(',');
    next();
  });
}

/* ── Step builders ── */

function buildRunGoalStep(el, next) {
  rMcStep(el, 'goal', 'What are you training for?', null, [
    { value: 'event',    icon: '🏁', label: 'A specific race or event',    desc: '5k, 10k, half marathon, marathon, ultra' },
    { value: 'distance', icon: '📍', label: 'Hit a target distance',        desc: 'e.g. run your first 10k or half marathon' },
    { value: 'fitness',  icon: '📈', label: 'Build general running fitness', desc: 'Run further, feel stronger, get fitter' },
    { value: 'new',      icon: '👟', label: "I'm new to running",            desc: 'Just getting started' },
  ], next);
}

function buildRunRaceDistanceStep(el, next) {
  rMcStep(el, 'raceDistance', 'What distance is the race?', null, [
    { value: '5k',       label: '5k' },
    { value: '10k',      label: '10k' },
    { value: 'half',     label: 'Half marathon', desc: '21.1km / 13.1 miles' },
    { value: 'marathon', label: 'Marathon',      desc: '42.2km / 26.2 miles' },
    { value: 'other',    label: 'Other',          desc: 'Ultra or non-standard distance' },
  ], (val) => {
    if (val === 'other') spliceRunAfterCurrent(buildRunUltraDistanceStep);
    next(val);
  });
}

function buildRunUltraDistanceStep(el, next) {
  rMcStep(el, 'raceDistance', 'What ultra distance?', null, [
    { value: 'ultra-50k',   label: '50k' },
    { value: 'ultra-50mi',  label: '50 miles' },
    { value: 'ultra-100k',  label: '100k' },
    { value: 'ultra-100mi', label: '100 miles+' },
  ], next);
}

function buildRunSurfaceStep(el, next) {
  rMcStep(el, 'surface', 'What surface is the race on?', null, [
    { value: 'road',  label: 'Road',  desc: 'Tarmac, pavement, track' },
    { value: 'trail', label: 'Trail', desc: 'Off-road, mixed terrain' },
    { value: 'mixed', label: 'Mixed', desc: 'Both road and trail sections' },
  ], next);
}

function buildRunElevationStep(el, next) {
  rMcStep(el, 'elevation', 'How hilly is the course?', null, [
    { value: 'flat',        label: 'Flat',        desc: 'Minimal elevation change' },
    { value: 'rolling',     label: 'Rolling',     desc: 'Some hills, nothing too serious' },
    { value: 'hilly',       label: 'Hilly',       desc: 'Significant climbing' },
    { value: 'mountainous', label: 'Mountainous', desc: 'Major ascents and descents' },
  ], next);
}

function buildRunGoalFinishStep(el, next) {
  rMcStep(el, 'goalFinish', "What's your goal for the race?", null, [
    { value: 'finish',      label: 'Just finish',        desc: 'Completion is the goal' },
    { value: 'comfortable', label: 'Finish comfortably', desc: 'Enjoy the experience, feel strong' },
    { value: 'time',        label: 'Hit a time target',  desc: 'A specific finish time in mind' },
    { value: 'competitive', label: 'Race it',            desc: 'Competitive finish or personal best' },
  ], (val) => {
    if (val === 'time' || val === 'competitive') {
      spliceRunAfterCurrent(buildRunTargetTimeStep);
    }
    next(val);
  });
}

function buildRunTargetTimeStep(el, next) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">What's your target finish time?</p>
      <p class="wizard-step__hint">An approximate target is fine.</p>
      <div class="wizard-duration-wrap">
        <div class="wizard-duration-field">
          <input class="wizard-input wizard-duration-input" id="input-target-hours" type="number" inputmode="numeric" min="0" max="99" placeholder="0" autocomplete="off" />
          <span class="wizard-duration-label">hrs</span>
        </div>
        <span class="wizard-duration-sep">:</span>
        <div class="wizard-duration-field">
          <input class="wizard-input wizard-duration-input" id="input-target-mins" type="number" inputmode="numeric" min="0" max="59" placeholder="00" autocomplete="off" />
          <span class="wizard-duration-label">min</span>
        </div>
      </div>
      <button class="wizard-continue" id="btn-target-time" disabled style="margin-top:0.75rem">Continue →</button>
    </div>
  `;
  const hoursInput = el.querySelector('#input-target-hours');
  const minsInput  = el.querySelector('#input-target-mins');
  const btn        = el.querySelector('#btn-target-time');

  function validate() {
    const h = parseInt(hoursInput.value) || 0;
    const m = parseInt(minsInput.value)  || 0;
    btn.disabled = (h === 0 && m === 0);
  }
  hoursInput.addEventListener('input', validate);
  minsInput.addEventListener('input', () => {
    if (parseInt(minsInput.value) > 59) minsInput.value = 59;
    validate();
  });
  btn.addEventListener('click', () => {
    const h = parseInt(hoursInput.value) || 0;
    const m = parseInt(minsInput.value)  || 0;
    if (h === 0 && m === 0) return;
    runningAnswers['targetTime'] = h + 'h ' + String(m).padStart(2, '0') + 'm';
    next();
  });
  setTimeout(() => hoursInput.focus(), 300);
}

function buildRunWeeksStep(el, next) {
  rWeeksStep(el, 'weeksToEvent', 'How many weeks until the race?', 'An approximate number is fine.', next);
}

function buildRunTargetDistanceStep(el, next) {
  const u = getUnit();
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">What distance do you want to run?</p>
      <p class="wizard-step__hint">This becomes your target for the plan.</p>
      <div class="wizard-distance-wrap">
        <input class="wizard-input wizard-distance-input" id="input-targetDistance" type="number" inputmode="numeric" min="1" placeholder="0" autocomplete="off" />
        <div class="wizard-unit-toggle">
          <button class="wizard-unit-btn${u === 'mi' ? ' is-active' : ''}" data-unit="mi" type="button">mi</button>
          <button class="wizard-unit-btn${u === 'km' ? ' is-active' : ''}" data-unit="km" type="button">km</button>
        </div>
      </div>
      <button class="wizard-continue" id="btn-targetDistance" disabled style="margin-top:0.75rem">Continue →</button>
    </div>
  `;
  const input = el.querySelector('#input-targetDistance');
  const btn   = el.querySelector('#btn-targetDistance');
  let activeUnit = u;

  el.querySelectorAll('.wizard-unit-btn').forEach(b => {
    b.addEventListener('click', () => {
      activeUnit = b.dataset.unit;
      localStorage.setItem('units', activeUnit);
      el.querySelectorAll('.wizard-unit-btn').forEach(x => x.classList.toggle('is-active', x.dataset.unit === activeUnit));
    });
  });

  input.addEventListener('input', () => { btn.disabled = !input.value || Number(input.value) <= 0; });
  btn.addEventListener('click', () => {
    if (!input.value || Number(input.value) <= 0) return;
    runningAnswers['targetDistance'] = input.value;
    runningAnswers['entryUnit'] = activeUnit;
    next();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value && Number(input.value) > 0) {
      runningAnswers['targetDistance'] = input.value;
      runningAnswers['entryUnit'] = activeUnit;
      next();
    }
  });
  setTimeout(() => input.focus(), 300);
}

function buildRunTargetTimeframeStep(el, next) {
  rMcStep(el, 'targetDate', 'Do you have a timeframe?', null, [
    { value: 'yes', label: 'Yes - I have a number of weeks' },
    { value: 'no',  label: 'No - build at my own pace' },
  ], (val) => {
    if (val === 'yes') spliceRunAfterCurrent(buildRunTargetWeeksStep);
    next(val);
  });
}

function buildRunTargetWeeksStep(el, next) {
  rWeeksStep(el, 'weeksToEvent', 'How many weeks to get there?', 'An approximate number is fine.', next);
}

function buildRunFitnessGoalStep(el, next) {
  rMcStep(el, 'fitnessGoal', 'What do you want to improve?', null, [
    { value: 'distance', label: 'Run further',             desc: 'Build endurance and go longer' },
    { value: 'speed',    label: 'Run faster',              desc: 'Improve pace and efficiency' },
    { value: 'health',   label: 'Get fitter / lose weight',desc: 'General health and fitness' },
    { value: 'all',      label: 'A bit of everything',     desc: 'Well-rounded improvement' },
  ], next);
}

function buildRunHasKitStep(el, next) {
  rMcStep(el, 'hasKit', 'Do you have running shoes?', null, [
    { value: 'yes',     label: 'Yes, ready to go' },
    { value: 'getting', label: "I'm getting some soon" },
    { value: 'no',      label: "Not yet" },
  ], next);
}

function buildRunNewFitnessStep(el, next) {
  rMcStep(el, 'generalFitness', 'How would you describe your general fitness?', 'Outside of running.', [
    { value: 'low',      label: 'Low',      desc: 'Mostly sedentary, not very active' },
    { value: 'moderate', label: 'Moderate', desc: 'Active occasionally, some exercise' },
    { value: 'good',     label: 'Good',     desc: 'Regularly active in other sports' },
  ], next);
}

function buildRunWeeklyMileageStep(el, next) {
  const u = getUnit();
  rMcStep(el, 'weeklyMileage', 'How much do you currently run per week?', null, [
    { value: '0',        label: 'Not running at the moment' },
    { value: '<10km',    label: u === 'km' ? 'Less than 10km'  : 'Less than 6 miles' },
    { value: '10-25km',  label: u === 'km' ? '10–25km'         : '6–15 miles' },
    { value: '25-50km',  label: u === 'km' ? '25–50km'         : '15–30 miles' },
    { value: '50-80km',  label: u === 'km' ? '50–80km'         : '30–50 miles' },
    { value: '80km+',    label: u === 'km' ? '80km+'           : '50+ miles' },
  ], next);
}

function buildRunConsistencyStep(el, next) {
  rMcStep(el, 'consistency', 'How consistent have you been recently?', null, [
    { value: 'barely',     label: 'Barely running',    desc: 'Less than once a week' },
    { value: 'occasional', label: 'Occasionally',      desc: '1–2 times a week' },
    { value: 'fairly',     label: 'Fairly consistent', desc: '3–4 times a week' },
    { value: 'very',       label: 'Very consistent',   desc: '5+ times a week' },
  ], next);
}

function buildRunLongestRecentStep(el, next) {
  const u = getUnit();
  rMcStep(el, 'longestRecent', 'Longest run in the last 8 weeks?', null,
    u === 'km' ? [
      { value: '<5km',    label: 'Less than 5km' },
      { value: '5-10km',  label: '5–10km' },
      { value: '10-21km', label: '10–21km' },
      { value: '21-42km', label: '21–42km' },
      { value: '42km+',   label: '42km+' },
    ] : [
      { value: '<3mi',    label: 'Less than 3 miles' },
      { value: '3-6mi',   label: '3–6 miles' },
      { value: '6-13mi',  label: '6–13 miles' },
      { value: '13-26mi', label: '13–26 miles' },
      { value: '26mi+',   label: '26+ miles' },
    ],
  next);
}

function buildRunLongestEverStep(el, next) {
  const u = getUnit();
  rMcStep(el, 'longestEver', "Longest run you've ever done?", null,
    u === 'km' ? [
      { value: '<5km',    label: 'Less than 5km' },
      { value: '5-10km',  label: '5–10km' },
      { value: '10-21km', label: '10–21km' },
      { value: '21-42km', label: '21–42km' },
      { value: '42-80km', label: '42–80km' },
      { value: '80km+',   label: '80km+' },
    ] : [
      { value: '<3mi',    label: 'Less than 3 miles' },
      { value: '3-6mi',   label: '3–6 miles' },
      { value: '6-13mi',  label: '6–13 miles' },
      { value: '13-26mi', label: '13–26 miles' },
      { value: '26-50mi', label: '26–50 miles' },
      { value: '50mi+',   label: '50+ miles' },
    ],
  next);
}

function buildRunDaysPerWeekStep(el, next) {
  rMcStep(el, 'daysPerWeek', 'How many days per week can you train?', null, [
    { value: '1', label: '1 day' },
    { value: '2', label: '2 days' },
    { value: '3', label: '3 days' },
    { value: '4', label: '4+ days' },
  ], next);
}

function buildRunLongRunDayStep(el, next) {
  rMcStep(el, 'longRunDay', 'When do you typically do your long run?', null, [
    { value: 'weekend', label: 'Weekend',  desc: 'Saturday or Sunday' },
    { value: 'weekday', label: 'Weekday',  desc: 'Mon–Fri' },
    { value: 'flexible',label: 'Flexible', desc: 'Varies week to week' },
  ], next);
}

function buildRunInjuryStep(el, next) {
  rMcStep(el, 'injury', 'Any current injuries or physical limitations?', 'Running injuries are common — be honest here.', [
    { value: 'none',    label: 'No, all good' },
    { value: 'minor',   label: 'Minor niggle - manageable' },
    { value: 'ongoing', label: 'Ongoing injury - need to be careful' },
  ], next);
}

function buildRunEnergyStep(el, next) {
  rMcStep(el, 'energy', 'How are your energy levels and sleep right now?', null, [
    { value: 'good',  label: 'Good',  desc: 'Well rested, low stress' },
    { value: 'mixed', label: 'Mixed', desc: 'Some busy periods but manageable' },
    { value: 'poor',  label: 'Poor',  desc: 'High stress, tired, not sleeping well' },
  ], next);
}

function buildRunOtherSportsStep(el, next) {
  rMcStep(el, 'otherSports', 'Do you do any other sports or strength training?', null, [
    { value: 'light',    label: 'Light activity',   desc: 'Walking, yoga, gentle movement' },
    { value: 'moderate', label: 'Moderate activity', desc: 'Cycling, swimming, gym — a few times a week' },
    { value: 'hard',     label: 'Hard training',     desc: 'Intense cross-training or team sports' },
    { value: 'none',     label: 'No - running only' },
  ], next);
}

function buildRunBackgroundStep(el, next) {
  rMcStep(el, 'background', 'How would you describe your running background?', null, [
    { value: 'new',          label: 'New to running',          desc: 'Less than 1 year' },
    { value: 'recreational', label: 'Recreational',            desc: 'Running a few years, no structured training' },
    { value: 'experienced',  label: 'Experienced',             desc: 'Structured training or regular racing' },
    { value: 'returning',    label: 'Returning after a break', desc: 'Ex-runner getting back into it' },
  ], next);
}

function buildRunDoneBeforeStep(el, next) {
  rMcStep(el, 'doneBefore', 'Have you done this distance before?', null, [
    { value: 'first',   label: 'First time at this distance' },
    { value: 'similar', label: 'Done something similar' },
    { value: 'same',    label: 'Done this exact distance before' },
  ], next);
}

function buildRunNutritionStep(el, next) {
  rMcStep(el, 'fuelling', 'How confident are you with race nutrition?', 'Eating and drinking during long runs.', [
    { value: 'confident', label: 'Well practised',   desc: 'I have a solid strategy' },
    { value: 'some',      label: 'Some experience',  desc: 'I know the basics' },
    { value: 'little',    label: 'Not much',         desc: 'I tend to wing it' },
    { value: 'none',      label: 'No experience',    desc: "I haven't thought about it" },
  ], next);
}

/* ── Branch router ── */

const runShared = [
  buildRunWeeklyMileageStep,
  buildRunConsistencyStep,
  buildRunLongestRecentStep,
  buildRunLongestEverStep,
  buildRunDaysPerWeekStep,
  buildRunLongRunDayStep,
  buildRunInjuryStep,
  buildRunEnergyStep,
  buildRunOtherSportsStep,
  buildRunToolsStep,
  buildRunBackgroundStep,
];

function buildRunToolsStep(el, next) { rToolsStep(el, next); }

function getRunBranchBuilders(goal) {
  if (goal === 'event') {
    return [
      buildRunRaceDistanceStep,
      buildRunSurfaceStep,
      buildRunElevationStep,
      buildRunGoalFinishStep,
      buildRunWeeksStep,
      buildRunDoneBeforeStep,
      ...runShared,
      buildRunNutritionStep,
    ];
  }

  if (goal === 'distance') {
    return [
      buildRunTargetDistanceStep,
      buildRunSurfaceStep,
      buildRunElevationStep,
      buildRunTargetTimeframeStep,
      buildRunLongestRecentStep,
      buildRunLongestEverStep,
      buildRunDaysPerWeekStep,
      buildRunLongRunDayStep,
      buildRunInjuryStep,
      buildRunEnergyStep,
      buildRunOtherSportsStep,
      buildRunToolsStep,
      buildRunBackgroundStep,
    ];
  }

  if (goal === 'fitness') {
    return [
      buildRunFitnessGoalStep,
      buildRunLongestRecentStep,
      buildRunWeeklyMileageStep,
      buildRunConsistencyStep,
      buildRunDaysPerWeekStep,
      buildRunLongRunDayStep,
      buildRunInjuryStep,
      buildRunEnergyStep,
      buildRunOtherSportsStep,
      buildRunToolsStep,
      buildRunBackgroundStep,
    ];
  }

  if (goal === 'new') {
    return [
      buildRunHasKitStep,
      buildRunNewFitnessStep,
      buildRunDaysPerWeekStep,
      buildRunLongRunDayStep,
      buildRunInjuryStep,
      buildRunToolsStep,
    ];
  }

  return runShared;
}
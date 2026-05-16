/* ── Question definitions ── */

const answers = {};

function getUnit() { return localStorage.getItem('units') || 'mi'; }

function distanceLabel(km, mi) {
  return getUnit() === 'km' ? km : mi;
}

function mcStep(el, key, question, hint, options, onSelect) {
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
      answers[key] = btn.dataset.value;
      setTimeout(() => onSelect(btn.dataset.value), 200);
    });
  });
}

function textStep(el, key, question, hint, placeholder, onContinue) {
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
    answers[key] = input.value.trim();
    onContinue();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value.trim()) { answers[key] = input.value.trim(); onContinue(); }
  });
  setTimeout(() => input.focus(), 300);
}

function distanceInputStep(el, key, question, hint, onContinue) {
  function render() {
    const unit = getUnit();
    el.innerHTML = `
      <div class="wizard-step__inner">
        <span class="wizard-step__connector"></span>
        <p class="wizard-step__question">${question}</p>
        ${hint ? `<p class="wizard-step__hint">${hint}</p>` : ''}
        <div class="wizard-distance-wrap">
          <input class="wizard-input wizard-distance-input" id="input-${key}" type="number" inputmode="numeric" min="1" placeholder="0" autocomplete="off" />
          <div class="wizard-distance-unit-toggle">
            <button class="wizard-unit-btn ${unit === 'mi' ? 'is-active' : ''}" data-unit="mi" type="button">mi</button>
            <button class="wizard-unit-btn ${unit === 'km' ? 'is-active' : ''}" data-unit="km" type="button">km</button>
          </div>
        </div>
        <button class="wizard-continue" id="btn-${key}" disabled style="margin-top:0.75rem">Continue →</button>
      </div>
    `;

    const input = el.querySelector(`#input-${key}`);
    const btn   = el.querySelector(`#btn-${key}`);

    // Restore previous value if user came back
    if (answers[key]) {
      const parts = answers[key].split(' ');
      input.value = parts[0] || '';
      btn.disabled = !input.value;
    }

    input.addEventListener('input', () => { btn.disabled = !input.value || Number(input.value) <= 0; });

    btn.addEventListener('click', () => {
      if (!input.value || Number(input.value) <= 0) return;
      const selectedUnit = el.querySelector('.wizard-unit-btn.is-active')?.dataset.unit || getUnit();
      answers[key] = input.value + ' ' + selectedUnit;
      onContinue();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.value && Number(input.value) > 0) {
        const selectedUnit = el.querySelector('.wizard-unit-btn.is-active')?.dataset.unit || getUnit();
        answers[key] = input.value + ' ' + selectedUnit;
        onContinue();
      }
    });

    el.querySelectorAll('.wizard-unit-btn').forEach(unitBtn => {
      unitBtn.addEventListener('click', () => {
        const currentValue = el.querySelector(`#input-${key}`)?.value;
        localStorage.setItem('units', unitBtn.dataset.unit);
        document.dispatchEvent(new CustomEvent('unitsChanged', { detail: { unit: unitBtn.dataset.unit } }));
        render();
        // Restore whatever number the user had typed
        const restoredInput = el.querySelector(`#input-${key}`);
        if (restoredInput && currentValue) {
          restoredInput.value = currentValue;
          el.querySelector(`#btn-${key}`).disabled = !currentValue || Number(currentValue) <= 0;
        }
      });
    });

    setTimeout(() => input.focus(), 300);
  }
  render();

  const onUnitsChanged = () => render();
  document.addEventListener('unitsChanged', onUnitsChanged);
}

function dateStep(el, key, question, hint, onContinue) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">${question}</p>
      ${hint ? `<p class="wizard-step__hint">${hint}</p>` : ''}
      <div class="wizard-input-wrap">
        <input class="wizard-input" id="input-${key}" type="date" />
        <button class="wizard-continue" id="btn-${key}" disabled>Continue →</button>
      </div>
    </div>
  `;
  const input = el.querySelector(`#input-${key}`);
  const btn   = el.querySelector(`#btn-${key}`);
  input.addEventListener('change', () => { btn.disabled = !input.value; });
  btn.addEventListener('click', () => {
    if (!input.value) return;
    answers[key] = input.value;
    onContinue();
  });
}

/* ── Distance MC step - re-renders when units change via settings toggle ── */
function distanceMcStep(el, key, question, hint, kmOptions, miOptions, onSelect) {
  function render() {
    const unit = getUnit();
    const options = unit === 'km' ? kmOptions : miOptions;
    el.innerHTML = `
      <div class="wizard-step__inner">
        <span class="wizard-step__connector"></span>
        <p class="wizard-step__question">${question}</p>
        ${hint ? `<p class="wizard-step__hint">${hint}</p>` : ''}
        <div class="wizard-choices">
          ${options.map(o => `
            <button class="wizard-choice ${answers[key] === o.value ? 'is-selected' : ''}" data-value="${o.value}" type="button">
              <span class="wizard-choice__body">
                <span class="wizard-choice__title">${o.label}</span>
              </span>
            </button>`).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('.wizard-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.wizard-choice').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        answers[key] = btn.dataset.value;
        setTimeout(() => onSelect(btn.dataset.value), 200);
      });
    });
  }

  render();

  const onUnitsChanged = () => render();
  document.addEventListener('unitsChanged', onUnitsChanged);
}

/* ── Step builders ── */

function buildGoalStep(el, next) {
  mcStep(el, 'goal', 'What are you training for?', null, [
    { value: 'event',    icon: '🏁', label: 'A specific event or race',      desc: 'Sportive, gran fondo, race or challenge' },
    { value: 'distance', icon: '📍', label: 'Hit a target distance',         desc: 'e.g. ride 100 miles or 200km' },
    { value: 'fitness',  icon: '📈', label: 'Build general cycling fitness', desc: 'Ride further, feel stronger, get fitter' },
    { value: 'new',      icon: '🚲', label: "I'm new to cycling",            desc: 'Just getting started' },
  ], next);
}

function buildEventTypeStep(el, next) {
  mcStep(el, 'eventType', 'What type of event?', null, [
    { value: 'road-single', label: 'Road ride - single day',  desc: 'Sportive, century, gran fondo' },
    { value: 'road-multi',  label: 'Road ride - multi-day',   desc: 'Tour, stage ride, bikepacking' },
    { value: 'gravel',      label: 'Gravel / mixed terrain',  desc: 'Off-road, gravel racing' },
    { value: 'mtb',         label: 'Mountain bike',           desc: 'Trail, enduro, XC' },
  ], next);
}

function buildEventDistanceStep(el, next) {
  distanceInputStep(el, 'eventDistance', 'How far is the event?', null, next);
}

function buildEventDaysStep(el, next) {
  mcStep(el, 'eventDays', 'How many days is the event?', null, [
    { value: '1',  label: '1 day' },
    { value: '2',  label: '2 days' },
    { value: '3',  label: '3 days' },
    { value: '4+', label: '4 or more days' },
  ], next);
}

function buildElevationStep(el, next) {
  mcStep(el, 'elevation', 'How hilly is the route?', null, [
    { value: 'flat',        label: 'Flat',        desc: 'Minimal climbing' },
    { value: 'rolling',     label: 'Rolling',     desc: 'Some hills, nothing too serious' },
    { value: 'hilly',       label: 'Hilly',       desc: 'Long climbs, significant elevation' },
    { value: 'mountainous', label: 'Mountainous', desc: 'Big passes, alpine terrain' },
  ], next);
}

function buildGoalFinishStep(el, next) {
  mcStep(el, 'goalFinish', "What's your goal for the event?", null, [
    { value: 'survive',     label: 'Just finish',        desc: 'Survival mode - get to the end' },
    { value: 'comfortable', label: 'Finish comfortably', desc: 'Enjoy the ride, feel good throughout' },
    { value: 'strong',      label: 'Finish strong',      desc: 'Good pace, feeling in control' },
    { value: 'competitive', label: 'Race it',            desc: 'Competitive finish or personal best' },
  ], next);
}

function buildLoadedStep(el, next) {
  mcStep(el, 'loaded', 'Will you be carrying luggage?', null, [
    { value: 'no',     label: 'No - unloaded',  desc: 'Standard kit only' },
    { value: 'light',  label: 'Light luggage',   desc: 'Small bags, day kit' },
    { value: 'loaded', label: 'Fully loaded',    desc: 'Bikepacking or touring setup' },
  ], next);
}

function buildTargetDistanceStep(el, next) {
  distanceInputStep(el, 'targetDistance', 'What distance do you want to hit?', 'This becomes your target for the plan.', next);
}

function buildTargetDateStep(el, next) {
  mcStep(el, 'targetDate', 'Do you have a timeframe in mind?', null, [
    { value: 'yes', label: 'Yes - I have a number of weeks' },
    { value: 'no',  label: 'No - just build at my own pace' },
  ], next);
}

function buildTargetDateValueStep(el, next) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">How many weeks to get there?</p>
      <p class="wizard-step__hint">An approximate number is fine.</p>
      <div class="wizard-distance-wrap">
        <input class="wizard-input wizard-distance-input" id="input-targetDateValue" type="number" inputmode="numeric" min="1" max="104" placeholder="0" autocomplete="off" />
        <span style="font-size:0.9375rem;font-weight:600;color:var(--text-secondary);padding-left:0.25rem">weeks</span>
      </div>
      <button class="wizard-continue" id="btn-targetDateValue" disabled style="margin-top:0.75rem">Continue →</button>
    </div>
  `;
  const input = el.querySelector('#input-targetDateValue');
  const btn   = el.querySelector('#btn-targetDateValue');
  input.addEventListener('input', () => { btn.disabled = !input.value || Number(input.value) < 1; });
  btn.addEventListener('click', () => {
    if (!input.value || Number(input.value) < 1) return;
    answers['targetDateValue'] = input.value + ' weeks';
    next();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value && Number(input.value) >= 1) {
      answers['targetDateValue'] = input.value + ' weeks';
      next();
    }
  });
  setTimeout(() => input.focus(), 300);
}

function buildFitnessGoalStep(el, next) {
  mcStep(el, 'fitnessGoal', 'What do you want to improve?', null, [
    { value: 'distance', label: 'Ride further',            desc: 'Build endurance and go longer' },
    { value: 'speed',    label: 'Ride faster',             desc: 'Improve pace and efficiency' },
    { value: 'health',   label: 'Get fitter / lose weight',desc: 'General health and fitness' },
    { value: 'all',      label: 'A bit of everything',     desc: 'Well-rounded improvement' },
  ], next);
}

function buildHaveBikeStep(el, next) {
  mcStep(el, 'haveBike', 'Do you have a bike?', null, [
    { value: 'yes',     label: 'Yes, ready to go' },
    { value: 'getting', label: "I'm getting one soon" },
    { value: 'no',      label: "Not yet - I'll sort that" },
  ], next);
}

function buildNewFitnessStep(el, next) {
  mcStep(el, 'generalFitness', "How would you describe your general fitness?", 'Outside of cycling.', [
    { value: 'low',      label: 'Low',      desc: 'Mostly sedentary, not very active' },
    { value: 'moderate', label: 'Moderate', desc: 'Active occasionally, some exercise' },
    { value: 'good',     label: 'Good',     desc: 'Regularly active in other sports' },
  ], next);
}

function buildCurrentLongestRecentStep(el, next) {
  distanceMcStep(el, 'longestRecent',
    "Longest ride in the last 8 weeks?", null,
    [
      { value: '<50km',    label: 'Less than 50km' },
      { value: '50-100km', label: '50–100km' },
      { value: '100-160km',label: '100–160km' },
      { value: '160-250km',label: '160–250km' },
      { value: '250km+',   label: '250km+' },
    ],
    [
      { value: '<30mi',    label: 'Less than 30 miles' },
      { value: '30-60mi',  label: '30–60 miles' },
      { value: '60-100mi', label: '60–100 miles' },
      { value: '100-150mi',label: '100–150 miles' },
      { value: '150mi+',   label: '150+ miles' },
    ],
    next
  );
}

function buildCurrentLongestEverStep(el, next) {
  distanceMcStep(el, 'longestEver',
    "Longest ride you've ever done?", null,
    [
      { value: '<100km',   label: 'Less than 100km' },
      { value: '100-160km',label: '100–160km' },
      { value: '160-250km',label: '160–250km' },
      { value: '250-400km',label: '250–400km' },
      { value: '400km+',   label: '400km+' },
    ],
    [
      { value: '<60mi',    label: 'Less than 60 miles' },
      { value: '60-100mi', label: '60–100 miles' },
      { value: '100-160mi',label: '100–160 miles' },
      { value: '160-250mi',label: '160–250 miles' },
      { value: '250mi+',   label: '250+ miles' },
    ],
    next
  );
}

function buildWeeklyVolumeStep(el, next) {
  mcStep(el, 'weeklyVolume', 'How much do you currently ride per week?', null, [
    { value: '<1h',   label: 'Less than 1 hour' },
    { value: '1-3h',  label: '1–3 hours' },
    { value: '3-6h',  label: '3–6 hours' },
    { value: '6-10h', label: '6–10 hours' },
    { value: '10h+',  label: '10+ hours' },
    { value: '0',     label: 'Not riding at the moment' },
  ], next);
}

function buildConsistencyStep(el, next) {
  mcStep(el, 'consistency', 'How consistent have you been recently?', null, [
    { value: 'barely',     label: 'Barely riding',     desc: 'Less than once a week' },
    { value: 'occasional', label: 'Occasionally',      desc: '1–2 times a week' },
    { value: 'fairly',     label: 'Fairly consistent', desc: '3–4 times a week' },
    { value: 'very',       label: 'Very consistent',   desc: '5+ times a week' },
  ], next);
}

function buildDaysPerWeekStep(el, next) {
  mcStep(el, 'daysPerWeek', 'How many days per week can you train?', null, [
    { value: '1', label: '1 day' },
    { value: '2', label: '2 days' },
    { value: '3', label: '3 days' },
    { value: '4', label: '4 days' },
    { value: '5', label: '5+ days' },
  ], next);
}

function buildWeekdayTimeStep(el, next) {
  mcStep(el, 'weekdayTime', 'How much time can you ride on a typical weekday?', null, [
    { value: '<1h',    label: 'Up to 1 hour' },
    { value: '1-1.5h', label: '1–1.5 hours' },
    { value: '1.5-2h', label: '1.5–2 hours' },
    { value: '2h+',    label: '2+ hours' },
    { value: '0',      label: "I don't ride on weekdays" },
  ], next);
}

function buildWeekendTimeStep(el, next) {
  mcStep(el, 'weekendTime', 'How much time can you ride on a weekend day?', null, [
    { value: '<2h',  label: 'Up to 2 hours' },
    { value: '2-4h', label: '2–4 hours' },
    { value: '4-6h', label: '4–6 hours' },
    { value: '6h+',  label: '6+ hours' },
    { value: '0',    label: "I don't ride on weekends" },
  ], next);
}

function buildBackToBackStep(el, next) {
  mcStep(el, 'backToBack', 'Can you do back-to-back rides on the weekend?', null, [
    { value: 'both',   label: 'Yes - both days available' },
    { value: 'one',    label: 'One day only' },
    { value: 'varies', label: 'Varies week to week' },
  ], next);
}

function buildInjuryStep(el, next) {
  mcStep(el, 'injury', 'Any current injuries or physical limitations?', null, [
    { value: 'none',    label: 'No, all good' },
    { value: 'minor',   label: 'Minor niggle - manageable' },
    { value: 'ongoing', label: 'Ongoing injury - need to be careful' },
  ], next);
}

function buildEnergyStep(el, next) {
  mcStep(el, 'energy', 'How are your energy levels and sleep right now?', null, [
    { value: 'good',  label: 'Good',  desc: 'Well rested, low stress' },
    { value: 'mixed', label: 'Mixed', desc: 'Some busy periods but manageable' },
    { value: 'poor',  label: 'Poor',  desc: 'High stress, tired, not sleeping well' },
  ], next);
}

function buildOtherSportsStep(el, next) {
  mcStep(el, 'otherSports', 'Do you do any other sports or strength training?', null, [
    { value: 'light',    label: 'Light activity',    desc: 'Walking, yoga, stretching' },
    { value: 'moderate', label: 'Moderate activity', desc: 'Swimming, hiking, casual gym' },
    { value: 'hard',     label: 'Hard training',     desc: 'Running, team sports, heavy lifting' },
    { value: 'none',     label: 'No - cycling only', desc: 'Cycling is my only training' },
  ], next);
}

function buildToolsStep(el, next) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">Do you train with any of these?</p>
      <p class="wizard-step__hint">Select all that apply.</p>
      <div class="wizard-choices">
        ${[
          { value: 'hrm',     label: 'Heart rate monitor' },
          { value: 'power',   label: 'Power meter' },
          { value: 'trainer', label: 'Indoor trainer / turbo' },
          { value: 'none',    label: 'None of the above' },
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
    answers['tools'] = [...selected].join(',');
    next();
  });
}

function buildEventFormatStep(el, onDistance, onDuration) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">Is the event measured by distance or time?</p>
      <div class="wizard-choices">
        <button class="wizard-choice" data-value="distance" type="button">
          <span class="wizard-choice__body">
            <span class="wizard-choice__title">Distance</span>
            <span class="wizard-choice__desc">e.g. 100 miles, 160km</span>
          </span>
        </button>
        <button class="wizard-choice" data-value="duration" type="button">
          <span class="wizard-choice__body">
            <span class="wizard-choice__title">Duration</span>
            <span class="wizard-choice__desc">e.g. 6 hours, 24-hour race</span>
          </span>
        </button>
      </div>
    </div>
  `;
  el.querySelectorAll('.wizard-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.wizard-choice').forEach(b => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      answers['eventFormat'] = btn.dataset.value;
      setTimeout(() => {
        if (btn.dataset.value === 'distance') onDistance();
        else onDuration();
      }, 200);
    });
  });
}

function buildEventDurationStep(el, next) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">How long is the event?</p>
      <div class="wizard-duration-wrap">
        <div class="wizard-duration-field">
          <input class="wizard-input wizard-duration-input" id="input-dur-hours" type="number" inputmode="numeric" min="0" max="999" placeholder="0" autocomplete="off" />
          <span class="wizard-duration-label">hrs</span>
        </div>
        <span class="wizard-duration-sep">:</span>
        <div class="wizard-duration-field">
          <input class="wizard-input wizard-duration-input" id="input-dur-mins" type="number" inputmode="numeric" min="0" max="59" placeholder="00" autocomplete="off" />
          <span class="wizard-duration-label">min</span>
        </div>
      </div>
      <button class="wizard-continue" id="btn-duration" disabled style="margin-top:0.75rem">Continue →</button>
    </div>
  `;

  const hoursInput = el.querySelector('#input-dur-hours');
  const minsInput  = el.querySelector('#input-dur-mins');
  const btn        = el.querySelector('#btn-duration');

  function validate() {
    const h = parseInt(hoursInput.value) || 0;
    const m = parseInt(minsInput.value)  || 0;
    btn.disabled = (h === 0 && m === 0);
  }

  hoursInput.addEventListener('input', validate);
  minsInput.addEventListener('input', () => {
    // Clamp to 59
    if (parseInt(minsInput.value) > 59) minsInput.value = 59;
    validate();
  });

  btn.addEventListener('click', () => {
    const h = parseInt(hoursInput.value) || 0;
    const m = parseInt(minsInput.value)  || 0;
    if (h === 0 && m === 0) return;
    answers['eventDuration'] = h + 'h ' + String(m).padStart(2, '0') + 'm';
    next();
  });

  setTimeout(() => hoursInput.focus(), 300);
}

function buildWeeksToEventStep(el, next) {
  el.innerHTML = `
    <div class="wizard-step__inner">
      <span class="wizard-step__connector"></span>
      <p class="wizard-step__question">How many weeks until the event?</p>
      <p class="wizard-step__hint">An approximate number is fine.</p>
      <div class="wizard-distance-wrap">
        <input class="wizard-input wizard-distance-input" id="input-weeksToEvent" type="number" inputmode="numeric" min="1" max="104" placeholder="0" autocomplete="off" />
        <span style="font-size:0.9375rem;font-weight:600;color:var(--text-secondary);padding-left:0.25rem">weeks</span>
      </div>
      <button class="wizard-continue" id="btn-weeksToEvent" disabled style="margin-top:0.75rem">Continue →</button>
    </div>
  `;
  const input = el.querySelector('#input-weeksToEvent');
  const btn   = el.querySelector('#btn-weeksToEvent');
  input.addEventListener('input', () => { btn.disabled = !input.value || Number(input.value) < 1; });
  btn.addEventListener('click', () => {
    if (!input.value || Number(input.value) < 1) return;
    answers['weeksToEvent'] = input.value + ' weeks';
    next();
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && input.value && Number(input.value) >= 1) {
      answers['weeksToEvent'] = input.value + ' weeks';
      next();
    }
  });
  setTimeout(() => input.focus(), 300);
}

function buildFuellingStep(el, next) {
  mcStep(el, 'fuelling', 'How confident are you with on-bike nutrition?', 'Eating and drinking during long rides.', [
    { value: 'confident',  label: 'Well practised',    desc: 'I have a solid fuelling strategy' },
    { value: 'some',       label: 'Some experience',   desc: 'I know the basics but still learning' },
    { value: 'little',     label: 'Not much',          desc: 'I tend to wing it on rides' },
    { value: 'none',       label: 'No experience',     desc: 'I haven\'t thought about it' },
  ], next);
}

function buildExperiencedBeforeStep(el, next) {
  mcStep(el, 'doneBefore', 'Have you done this or a similar event before?', null, [
    { value: 'first',   label: 'First time' },
    { value: 'similar', label: 'Done something similar' },
    { value: 'same',    label: 'Done this exact event before' },
  ], next);
}

function buildBackgroundStep(el, next) {
  mcStep(el, 'background', 'How would you describe your cycling background?', null, [
    { value: 'new',          label: 'New to cycling',          desc: 'Less than 1 year' },
    { value: 'recreational', label: 'Recreational',            desc: 'Riding a few years, no structured training' },
    { value: 'experienced',  label: 'Experienced',             desc: 'Structured training or regular racing' },
    { value: 'returning',    label: 'Returning after a break', desc: 'Ex-athlete getting back into it' },
  ], next);
}

/* ── Branch router ── */

function getBranchBuilders(goal) {
  const shared = [
    buildWeeklyVolumeStep,
    buildConsistencyStep,
    buildDaysPerWeekStep,
    buildWeekdayTimeStep,
    buildWeekendTimeStep,
    buildBackToBackStep,
    buildInjuryStep,
    buildEnergyStep,
    buildOtherSportsStep,
    buildToolsStep,
    buildBackgroundStep,
  ];

  const eventShared = [...shared, buildFuellingStep];

  if (goal === 'event') {
    const eventTail = [
      buildWeeksToEventStep,
      buildElevationStep,
      buildGoalFinishStep,
      buildLoadedStep,
      buildCurrentLongestRecentStep,
      buildCurrentLongestEverStep,
      buildExperiencedBeforeStep,
      ...eventShared,
    ];
    return [
      (el, next) => buildEventTypeStep(el, (type) => {
        if (type !== 'road-single') spliceAfterCurrent(buildEventDaysStep);
        next();
      }),
      (el, next) => buildEventFormatStep(el,
        () => { spliceAfterCurrent(buildEventDistanceStep); next(); },
        () => { spliceAfterCurrent(buildEventDurationStep); next(); }
      ),
      ...eventTail,
    ];
  }

  if (goal === 'distance') {
    return [
      buildTargetDistanceStep,
      buildTargetDateStep,
      buildTargetDateValueStep,
      buildElevationStep,
      buildCurrentLongestRecentStep,
      buildCurrentLongestEverStep,
      ...shared,
    ];
  }

  if (goal === 'fitness') {
    return [
      buildFitnessGoalStep,
      buildCurrentLongestRecentStep,
      ...shared,
    ];
  }

  if (goal === 'new') {
    return [
      buildHaveBikeStep,
      buildNewFitnessStep,
      buildDaysPerWeekStep,
      buildWeekdayTimeStep,
      buildWeekendTimeStep,
      buildInjuryStep,
      buildToolsStep,
    ];
  }

  return shared;
}

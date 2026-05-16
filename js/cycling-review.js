/* ── Review screen + programme creation ── */

const answerLabels = {
  goal:            { label: 'Goal', map: { event: 'Specific event', distance: 'Hit a distance target', fitness: 'Build general fitness', new: 'New to cycling' } },
  eventType:       { label: 'Event type', map: { 'road-single': 'Road - single day', 'road-multi': 'Road - multi-day', gravel: 'Gravel / mixed terrain', mtb: 'Mountain bike' } },
  eventFormat:     { label: 'Event format', map: { distance: 'Distance', duration: 'Duration' } },
  eventDistance:   { label: 'Event distance', text: true },
  eventDuration:   { label: 'Event duration', text: true },
  eventDays:       { label: 'Event days', map: { '1': '1 day', '2': '2 days', '3': '3 days', '4+': '4+ days' } },
  weeksToEvent:    { label: 'Weeks to event', text: true },
  elevation:       { label: 'Terrain', map: { flat: 'Flat', rolling: 'Rolling', hilly: 'Hilly', mountainous: 'Mountainous' } },
  goalFinish:      { label: 'Finish goal', map: { survive: 'Just finish', comfortable: 'Finish comfortably', strong: 'Finish strong', competitive: 'Race it' } },
  loaded:          { label: 'Luggage', map: { no: 'Unloaded', light: 'Light luggage', loaded: 'Fully loaded' } },
  targetDistance:  { label: 'Target distance', text: true },
  fitnessGoal:     { label: 'Fitness goal', map: { distance: 'Ride further', speed: 'Ride faster', health: 'Get fitter', all: 'All-round improvement' } },
  haveBike:        { label: 'Have a bike', map: { yes: 'Yes', getting: 'Getting one soon', no: 'Not yet' } },
  generalFitness:  { label: 'General fitness', map: { low: 'Low', moderate: 'Moderate', good: 'Good' } },
  longestRecent:   { label: 'Longest ride (8 weeks)', map: { '<50km': '<50km', '50-100km': '50–100km', '100-160km': '100–160km', '160-250km': '160–250km', '250km+': '250km+', '<30mi': '<30mi', '30-60mi': '30–60mi', '60-100mi': '60–100mi', '100-150mi': '100–150mi', '150mi+': '150mi+' } },
  longestEver:     { label: 'Longest ride ever', map: { '<100km': '<100km', '100-160km': '100–160km', '160-250km': '160–250km', '250-400km': '250–400km', '400km+': '400km+', '<60mi': '<60mi', '60-100mi': '60–100mi', '100-160mi': '100–160mi', '160-250mi': '160–250mi', '250mi+': '250mi+' } },
  weeklyVolume:    { label: 'Weekly riding', map: { '<1h': '<1 hour', '1-3h': '1–3 hours', '3-6h': '3–6 hours', '6-10h': '6–10 hours', '10h+': '10+ hours', '0': 'Not riding' } },
  consistency:     { label: 'Consistency', map: { barely: 'Barely riding', occasional: 'Occasionally', fairly: 'Fairly consistent', very: 'Very consistent' } },
  daysPerWeek:     { label: 'Training days/week', map: { '1': '1 day', '2': '2 days', '3': '3 days', '4': '4 days', '5': '5+ days' } },
  weekdayTime:     { label: 'Weekday time', map: { '<1h': '<1 hour', '1-1.5h': '1–1.5 hours', '1.5-2h': '1.5–2 hours', '2h+': '2+ hours', '0': "Don't ride weekdays" } },
  weekendTime:     { label: 'Weekend time', map: { '<2h': '<2 hours', '2-4h': '2–4 hours', '4-6h': '4–6 hours', '6h+': '6+ hours', '0': "Don't ride weekends" } },
  backToBack:      { label: 'Back-to-back rides', map: { both: 'Both days', one: 'One day only', varies: 'Varies' } },
  injury:          { label: 'Injuries', map: { none: 'None', minor: 'Minor niggle', ongoing: 'Ongoing injury' } },
  energy:          { label: 'Energy & sleep', map: { good: 'Good', mixed: 'Mixed', poor: 'Poor' } },
  fuelling:        { label: 'Nutrition', map: { confident: 'Well practised', some: 'Some experience', little: 'Not much', none: 'No experience' } },
  otherSports:     { label: 'Other training', map: { light: 'Light activity', moderate: 'Moderate activity', hard: 'Hard training', none: 'No - cycling only' } },
  tools:           { label: 'Training tools', multiMap: { hrm: 'Heart rate monitor', power: 'Power meter', trainer: 'Indoor trainer', none: 'None' } },
  background:      { label: 'Cycling background', map: { new: 'New to cycling', recreational: 'Recreational', experienced: 'Experienced', returning: 'Returning after break' } },
  doneBefore:      { label: 'Done before', map: { first: 'First time', similar: 'Similar event', same: 'This exact event' } },
};

function formatAnswer(key, val) {
  if (!val) return '-';
  const def = answerLabels[key];
  if (!def) return val;
  if (def.map && def.map[val]) return def.map[val];
  if (def.multiMap) {
    if (val === 'none') return 'None';
    return val.split(',').map(v => def.multiMap[v] || v).join(', ');
  }
  return val;
}

function generateProgrammeName(answers) {
  if (answers.eventDistance) return answers.eventDistance + ' Training Plan';
  if (answers.targetDistance) return answers.targetDistance + ' Challenge Plan';
  if (answers.goal === 'fitness') return 'Cycling Fitness Plan';
  if (answers.goal === 'new') return 'Getting Started Plan';
  return 'My Cycling Plan';
}

function buildReviewStep(el, onCreateProgramme) {
  const name = generateProgrammeName(answers);

  const rows = Object.keys(answerLabels)
    .filter(key => answers[key] !== undefined && answers[key] !== '')
    .map(key => {
      const def = answerLabels[key];
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
              <span class="review-row__value" data-display="${key}">${formatAnswer(key, answers[key])}</span>
            </div>
            <div class="review-row__pills" hidden>${pills}</div>
          </div>`;
      }

      // Free-text - click to edit inline
      return `
        <div class="review-row review-row--text" data-key="${key}" tabindex="0" role="button">
          <div class="review-row__summary">
            <span class="review-row__label">${def.label}</span>
            <span class="review-row__value" data-display="${key}">${formatAnswer(key, answers[key])}</span>
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

  // Inline name editing
  const nameDisplay = el.querySelector('#review-name-display');
  const nameInput   = el.querySelector('#input-progname');

  function showNameInput() {
    nameDisplay.style.display = 'none';
    nameInput.style.display = '';
    nameInput.focus();
    nameInput.select();
  }
  function showNameDisplay() {
    const v = nameInput.value.trim() || nameDisplay.textContent;
    nameDisplay.textContent = v;
    nameInput.value = v;
    nameDisplay.style.display = '';
    nameInput.style.display = 'none';
  }
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

  function updateDisplay(row) {
    const key  = row.dataset.key;
    const disp = row.querySelector('[data-display]');
    if (disp) disp.textContent = formatAnswer(key, answers[key]);
  }

  el.querySelectorAll('.review-row--accordion').forEach(row => {
    const key     = row.dataset.key;
    const isMulti = row.dataset.multi === 'true';
    const pillsEl = row.querySelector('.review-row__pills');

    // Sync pill selected state from current answers
    function syncPills() {
      const selected = isMulti
        ? new Set((answers[key] || '').split(',').filter(Boolean))
        : null;
      pillsEl.querySelectorAll('.review-pill').forEach(p => {
        p.classList.toggle('is-selected', isMulti ? selected.has(p.dataset.value) : answers[key] === p.dataset.value);
      });
    }

    row.addEventListener('click', e => {
      // Don't re-open if clicking a pill - handled separately
      if (e.target.closest('.review-pill')) return;
      const isOpen = row.classList.contains('is-open');
      closeAll();
      if (!isOpen) {
        syncPills();
        row.classList.add('is-open');
        pillsEl.hidden = false;
      }
    });
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') row.click(); });

    // Pill clicks
    pillsEl.querySelectorAll('.review-pill').forEach(pill => {
      pill.addEventListener('click', e => {
        e.stopPropagation();
        const val = pill.dataset.value;

        if (isMulti) {
          let selected = answers[key] === 'none' ? new Set(['none']) : new Set((answers[key] || '').split(',').filter(Boolean));
          if (val === 'none') {
            selected = new Set(['none']);
          } else {
            selected.delete('none');
            if (selected.has(val)) selected.delete(val);
            else selected.add(val);
            if (selected.size === 0) selected.add('none');
          }
          answers[key] = [...selected].join(',');
          syncPills();
          // Multi-select stays open until user taps the row again
        } else {
          answers[key] = val;
          updateDisplay(row);
          closeAll();
        }
      });
    });
  });

  // Click-to-edit free-text rows
  el.querySelectorAll('.review-row--text').forEach(row => {
    const key  = row.dataset.key;
    const disp = row.querySelector('[data-display]');

    const startEdit = () => {
      if (row.querySelector('.review-inline-input')) return;
      closeAll();
      disp.style.display = 'none';
      const input = document.createElement('input');
      input.className = 'review-inline-input';
      input.value = answers[key] || '';
      row.querySelector('.review-row__summary').appendChild(input);
      input.focus();
      const save = () => {
        answers[key] = input.value.trim() || answers[key];
        disp.textContent = formatAnswer(key, answers[key]);
        disp.style.display = '';
        input.remove();
      };
      input.addEventListener('blur', save);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
    };

    row.addEventListener('click', startEdit);
    row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') startEdit(); });
  });

  // Create button
  const createBtn = el.querySelector('#btn-create');
  createBtn.addEventListener('click', () => {
    const progName = (nameInput.style.display === 'none' ? nameDisplay.textContent : nameInput.value).trim();
    if (!progName) return;
    onCreateProgramme(progName, answers);
  });
}

function saveAndNavigate(progName, answers) {
  const id = 'prog-' + Date.now();

  answers = { ...answers, entryUnit: localStorage.getItem('units') || 'mi' };

  let generated;
  try {
    generated = generateProgramme(answers, progName);
  } catch (e) {
    console.error('generateProgramme failed:', e);
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
  };

  const existing = JSON.parse(localStorage.getItem('programmes') || '[]');
  existing.unshift(prog);
  localStorage.setItem('programmes', JSON.stringify(existing));

  showLoading(() => {
    window.location.href = `programme.html?id=${id}&name=${encodeURIComponent(progName)}`;
  });
}

function showLoading(onDone) {
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

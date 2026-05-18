/* ── Personal Bests ── */

const PBS_KEY = 'user-pbs';

const CYCLING_EVENTS = [
  { key: 'c_10mi',    label: '10 miles',            type: 'time' },
  { key: 'c_25mi',    label: '25 miles',            type: 'time' },
  { key: 'c_40km',    label: '40km',                type: 'time' },
  { key: 'c_50mi',    label: '50 miles',            type: 'time' },
  { key: 'c_100mi',   label: '100 miles (Century)', type: 'time' },
  { key: 'c_longest', label: 'Longest ride',        type: 'distance' },
  { key: 'c_ascent',  label: 'Most ascent (ride)',  type: 'ascent' },
  { key: 'c_20min',   label: '20 min best effort',  type: 'distance' },
  { key: 'c_1hr',     label: '1 hour best effort',  type: 'distance' },
];

const RUNNING_EVENTS = [
  { key: 'r_1km',     label: '1km',           type: 'time' },
  { key: 'r_1mi',     label: '1 mile',        type: 'time' },
  { key: 'r_1hmi',    label: '1.5 miles',     type: 'time' },
  { key: 'r_5k',      label: '5km',           type: 'time' },
  { key: 'r_10k',     label: '10km',          type: 'time' },
  { key: 'r_half',    label: 'Half marathon', type: 'time' },
  { key: 'r_mara',    label: 'Marathon',      type: 'time' },
  { key: 'r_longest', label: 'Longest run',   type: 'distance' },
];

/* ── Storage ── */

function safeLoadPBs() {
  try {
    const raw = JSON.parse(localStorage.getItem(PBS_KEY) || '{}');
    return migratePBs(raw);
  }
  catch { return {}; }
}

// Migrate old flat structure { secs, date } to new { current, history[] }
function migratePBs(raw) {
  const migrated = {};
  for (const [key, val] of Object.entries(raw)) {
    if (!val || typeof val !== 'object') { migrated[key] = val; continue; }
    // Already migrated
    if ('current' in val) { migrated[key] = val; continue; }
    // Array (custom event lists) — pass through
    if (Array.isArray(val)) { migrated[key] = val; continue; }
    // Old flat structure — wrap it
    migrated[key] = {
      current: { ...val },
      history: val.secs || val.dist || val.ascent ? [{ ...val }] : [],
    };
  }
  return migrated;
}

function safeSavePBs(data) {
  try { localStorage.setItem(PBS_KEY, JSON.stringify(data)); }
  catch { showPBError('Could not save. Your browser storage may be full.'); }
}

// Save a new PB value — pushes old value to history first
function savePBEntry(pbs, key, newEntry) {
  const existing = pbs[key];
  if (existing && existing.current) {
    // Only push to history if value actually changed and was real
    const old = existing.current;
    const hasOldValue = old.secs || old.dist || old.ascent;
    const isDifferent = JSON.stringify(old) !== JSON.stringify(newEntry);
    if (hasOldValue && isDifferent) {
      existing.history = existing.history || [];
      existing.history.push({ ...old });
    }
    existing.current = { ...newEntry };
  } else {
    pbs[key] = {
      current: { ...newEntry },
      history: [],
    };
  }
}

function deletePBEntry(pbs, key) {
  delete pbs[key];
}

// Get the current value for display
function getCurrentEntry(pbs, key) {
  const val = pbs[key];
  if (!val) return null;
  if (val.current) return val.current;
  return val; // fallback for any unmigrated
}

function showPBError(msg) {
  const existing = document.getElementById('pb-error');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'pb-error';
  el.className = 'profile-error';
  el.textContent = msg;
  document.getElementById('app-main').prepend(el);
  setTimeout(() => el.remove(), 4000);
}

/* ── Formatting ── */

function secsToDisplay(secs) {
  if (!secs || secs <= 0) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function displayToSecs(str) {
  if (!str) return null;
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

function formatDate(val) {
  if (!val) return '';
  try {
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d)) return val;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return val; }
}

function displayTimeValue(entry) {
  const timeStr = entry ? secsToDisplay(entry.secs) : null;
  const dateStr = entry && entry.date ? formatDate(entry.date) : null;
  return timeStr
    ? `<div class="pb-value-wrap">
         <span class="pb-time">${escapeHTML(timeStr)}</span>
         ${dateStr ? `<span class="pb-date">${escapeHTML(dateStr)}</span>` : ''}
       </div>`
    : `<span class="profile-field__empty">—</span>`;
}

function displayDistanceValue(entry) {
  if (!entry || !entry.dist) return `<span class="profile-field__empty">—</span>`;
  const dateStr = entry.date ? formatDate(entry.date) : null;
  return `<div class="pb-value-wrap">
    <span class="pb-time">${escapeHTML(String(entry.dist))}</span>
    ${dateStr ? `<span class="pb-date">${escapeHTML(dateStr)}</span>` : ''}
  </div>`;
}

function displayAscentValue(entry) {
  if (!entry || !entry.ascent) return `<span class="profile-field__empty">—</span>`;
  const dateStr = entry.date ? formatDate(entry.date) : null;
  return `<div class="pb-value-wrap">
    <span class="pb-time">${escapeHTML(String(entry.ascent))}</span>
    ${dateStr ? `<span class="pb-date">${escapeHTML(dateStr)}</span>` : ''}
  </div>`;
}

function displayValue(ev, entry) {
  if (ev.type === 'distance') return displayDistanceValue(entry);
  if (ev.type === 'ascent')   return displayAscentValue(entry);
  return displayTimeValue(entry);
}

function hasEntry(ev, pbs) {
  if (!(ev.key in pbs)) return false;
  const val = pbs[ev.key];
  if (!val) return false;
  if (Array.isArray(val)) return false;
  return true;
}

/* ── Page build ── */

function buildPage() {
  const pbs  = safeLoadPBs();
  const main = document.getElementById('app-main');

  main.innerHTML = `
    <div class="home">
      <h1 class="home__heading">Personal Bests</h1>
      <p class="home__subheading">Log your best efforts. Tap any entry to edit.</p>
      ${renderSport('Cycling', CYCLING_EVENTS, pbs, 'cycling')}
      ${renderSport('Running', RUNNING_EVENTS, pbs, 'running')}
      ${renderPBGraph(pbs)}
    </div>
  `;

  attachAllPBListeners(pbs);
  attachAddListeners(pbs);
  attachGraphListeners(pbs);
}

function renderSport(title, events, pbs, sport) {
  const custom  = Array.isArray(pbs[sport + '_custom']) ? pbs[sport + '_custom'] : [];
  const allEvs  = [...events, ...custom];
  const logged  = allEvs.filter(ev => hasEntry(ev, pbs));
  const available = allEvs.filter(ev => !hasEntry(ev, pbs));

  const rows = logged.map(ev => renderPBRow(ev, pbs)).join('');

  const emptyState = logged.length === 0
    ? `<div class="pb-empty">No PBs logged yet for ${escapeHTML(title.toLowerCase())}.</div>`
    : '';

  // Build dropdown options: remaining standard events + custom option
  const stdOptions = events
    .filter(ev => !hasEntry(ev, pbs))
    .map(ev => `<option value="${escapeHTML(ev.key)}">${escapeHTML(ev.label)}</option>`)
    .join('');

  const hasOptions = events.some(ev => !hasEntry(ev, pbs));

  return `
    <div class="profile-section" data-sport="${sport}">
      <h2 class="profile-section__title">${escapeHTML(title)}</h2>
      <div class="profile-card">
        ${emptyState}
        ${rows}
        <div class="pb-add-row">
          <button class="equip-add-btn pb-add-btn" data-sport="${sport}" type="button">+ Add PB</button>
          <select class="profile-input profile-input--select pb-add-select" data-sport="${sport}" style="display:none;flex:1;max-width:260px">
            <option value="">Select event…</option>
            ${hasOptions ? stdOptions : ''}
            <option value="custom">+ Custom event</option>
          </select>
          <button class="equip-cancel-btn pb-add-cancel" data-sport="${sport}" type="button" style="display:none">Cancel</button>
        </div>
        <div class="pb-custom-wrap" data-sport="${sport}" style="display:none">
          <input class="profile-input pb-custom-input" type="text" placeholder="e.g. 50K or local climb" autocomplete="off" />
          <select class="profile-input profile-input--select pb-custom-type" style="max-width:120px">
            <option value="time">Time</option>
            <option value="distance">Distance</option>
          </select>
          <button class="profile-list-add-btn pb-custom-add" data-sport="${sport}" type="button">Add</button>
        </div>
      </div>
    </div>
  `;
}

function renderPBRow(ev, pbs) {
  const entry    = getCurrentEntry(pbs, ev.key) || {};
  const isCustom = ev.key.startsWith('custom_');

  return `
    <div class="profile-field pb-field" data-key="${escapeHTML(ev.key)}">
      <div class="profile-field__row pb-row">
        <span class="profile-field__label">${escapeHTML(ev.label)}</span>
        <span class="profile-field__value pb-value">${displayValue(ev, entry)}</span>
        <button class="pb-delete-btn" data-key="${escapeHTML(ev.key)}" type="button" aria-label="Remove">✕</button>
      </div>
    </div>`;
}

/* ── Add PB listeners ── */

function attachAddListeners(pbs) {
  document.querySelectorAll('.pb-add-btn').forEach(btn => {
    const sport  = btn.dataset.sport;
    const sel    = document.querySelector(`.pb-add-select[data-sport="${sport}"]`);
    const cancel = document.querySelector(`.pb-add-cancel[data-sport="${sport}"]`);
    const card   = btn.closest('.profile-card');

    btn.addEventListener('click', () => {
      btn.style.display    = 'none';
      sel.style.display    = '';
      cancel.style.display = '';
      sel.focus();
    });

    cancel.addEventListener('click', () => {
      btn.style.display    = '';
      sel.style.display    = 'none';
      cancel.style.display = 'none';
      sel.value = '';
      const customWrap = document.querySelector(`.pb-custom-wrap[data-sport="${sport}"]`);
      if (customWrap) customWrap.style.display = 'none';
    });

    sel.addEventListener('change', () => {
      const val = sel.value;
      if (!val) return;

      if (val === 'custom') {
        const customWrap = document.querySelector(`.pb-custom-wrap[data-sport="${sport}"]`);
        if (customWrap) {
          customWrap.style.display = 'flex';
          customWrap.querySelector('.pb-custom-input').focus();
        }
        sel.value = '';
        return;
      }

      // Find the event definition
      const events = sport === 'cycling' ? CYCLING_EVENTS : RUNNING_EVENTS;
      const ev = events.find(e => e.key === val);
      if (!ev) return;

      // Reset the dropdown UI
      sel.value = '';
      btn.style.display    = '';
      sel.style.display    = 'none';
      cancel.style.display = 'none';

      const freshPbs = safeLoadPBs();
      freshPbs[ev.key] = { current: {}, history: [] };
      safeSavePBs(freshPbs);

      // Build and insert the row directly into the card (before the add row)
      const addRow = card.querySelector('.pb-add-row');
      const rowHtml = renderPBRow(ev, freshPbs);
      const tmp = document.createElement('div');
      tmp.innerHTML = rowHtml;
      const fieldEl = tmp.firstElementChild;
      card.insertBefore(fieldEl, addRow);

      // Remove empty state if present
      const emptyEl = card.querySelector('.pb-empty');
      if (emptyEl) emptyEl.remove();

      // Remove this option from the select
      const opt = sel.querySelector(`option[value="${val}"]`);
      if (opt) opt.remove();

      // Attach listener to the new row
      const row     = fieldEl.querySelector('.pb-row');
      const valueEl = fieldEl.querySelector('.pb-value');
      row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', 'Edit ' + ev.label);
      row.addEventListener('click', e => {
        if (e.target.closest('.pb-delete-btn')) return;
        openPBField(ev, fieldEl, valueEl, safeLoadPBs());
      });
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') openPBField(ev, fieldEl, valueEl, safeLoadPBs());
      });

      const delBtn = fieldEl.querySelector('.pb-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', e => {
          e.stopPropagation();
          const p = safeLoadPBs();
          delete p[ev.key];
          safeSavePBs(p);
          fieldEl.remove();
          // Restore option to select
          const newOpt = document.createElement('option');
          newOpt.value = ev.key;
          newOpt.textContent = ev.label;
          const customOpt = sel.querySelector('option[value="custom"]');
          sel.insertBefore(newOpt, customOpt);
          // Show empty state if no rows left
          if (!card.querySelector('.pb-field')) {
            const empty = document.createElement('div');
            empty.className = 'pb-empty';
            empty.textContent = `No PBs logged yet for ${sport}.`;
            card.insertBefore(empty, addRow);
          }
        });
      }

      // Open the editor immediately
      openPBField(ev, fieldEl, valueEl, freshPbs);
      fieldEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });

  // Custom event add
  document.querySelectorAll('.pb-custom-add').forEach(btn => {
    const sport = btn.dataset.sport;
    const wrap  = document.querySelector(`.pb-custom-wrap[data-sport="${sport}"]`);
    if (!wrap) return;
    const input    = wrap.querySelector('.pb-custom-input');
    const typesSel = wrap.querySelector('.pb-custom-type');

    const add = () => {
      const label = input.value.trim();
      if (!label) return;
      const key  = 'custom_' + sport[0] + '_' + Date.now();
      const type = typesSel.value;
      const ev   = { key, label, type };
      const p    = safeLoadPBs();
      if (!Array.isArray(p[sport + '_custom'])) p[sport + '_custom'] = [];
      p[sport + '_custom'].push(ev);
      safeSavePBs(p);
      wrap.style.display = 'none';
      input.value = '';
      buildPage();
    };

    btn.addEventListener('click', add);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); add(); }
      if (e.key === 'Escape') { wrap.style.display = 'none'; input.value = ''; }
    });
  });
}

/* ── Row listeners ── */

function attachAllPBListeners(pbs) {
  const custom = [
    ...(Array.isArray(pbs.cycling_custom) ? pbs.cycling_custom : []),
    ...(Array.isArray(pbs.running_custom)  ? pbs.running_custom  : []),
  ];
  const allEvs = [...CYCLING_EVENTS, ...RUNNING_EVENTS, ...custom];

  allEvs.forEach(ev => {
    const fieldEl = document.querySelector(`.pb-field[data-key="${ev.key}"]`);
    if (!fieldEl) return;
    const row     = fieldEl.querySelector('.pb-row');
    const valueEl = fieldEl.querySelector('.pb-value');
    if (!row || !valueEl) return;

    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', 'Edit ' + ev.label);

    row.addEventListener('click', e => {
      if (e.target.closest('.pb-delete-btn')) return;
      openPBField(ev, fieldEl, valueEl, pbs);
    });
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openPBField(ev, fieldEl, valueEl, pbs);
    });

    const delBtn = fieldEl.querySelector('.pb-delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', e => {
        e.stopPropagation();
        const freshPbs = safeLoadPBs();
        deletePBEntry(freshPbs, ev.key);
        const sport = ev.key.startsWith('c_') || ev.key.startsWith('custom_c')
          ? 'cycling' : 'running';
        if (ev.key.startsWith('custom_')) {
          freshPbs[sport + '_custom'] = (freshPbs[sport + '_custom'] || [])
            .filter(x => x.key !== ev.key);
        }
        safeSavePBs(freshPbs);
        buildPage();
      });
    }
  });
}

/* ── Inline editor ── */

function openPBField(ev, fieldEl, valueEl, pbs) {
  if (fieldEl.classList.contains('is-editing')) return;
  fieldEl.classList.add('is-editing');

  const entry       = getCurrentEntry(pbs, ev.key) || {};
  const isDistance  = ev.type === 'distance';
  const isAscent    = ev.type === 'ascent';
  const currentTime = secsToDisplay(entry.secs) || '';
  const currentDist = entry.dist    || '';
  const currentAsc  = entry.ascent  || '';
  const currentDate = entry.date    || '';

  let committed = false;

  function commit(mainInput, dateInput) {
    if (committed) return;
    committed = true;
    document.removeEventListener('mousedown', outsideHandler);

    const freshPbs = safeLoadPBs();

    if (isDistance) {
      const dist = mainInput.trim();
      if (dist) savePBEntry(freshPbs, ev.key, { dist, date: dateInput || '' });
      else deletePBEntry(freshPbs, ev.key);
    } else if (isAscent) {
      const ascent = mainInput.trim();
      if (ascent) savePBEntry(freshPbs, ev.key, { ascent, date: dateInput || '' });
      else deletePBEntry(freshPbs, ev.key);
    } else {
      const secs = displayToSecs(mainInput);
      if (secs !== null) savePBEntry(freshPbs, ev.key, { secs, date: dateInput || '' });
      else if (!mainInput.trim()) deletePBEntry(freshPbs, ev.key);
    }

    safeSavePBs(freshPbs);
    fieldEl.classList.remove('is-editing');
    const currentValueEl = fieldEl.querySelector('.pb-value');
    if (currentValueEl) {
      currentValueEl.innerHTML = displayValue(ev, getCurrentEntry(freshPbs, ev.key));
    }

    if (!freshPbs[ev.key]) buildPage();
  }

  function outsideHandler(e) {
    if (!fieldEl.contains(e.target)) {
      const mainEl = fieldEl.querySelector('.pb-main-input');
      const dateEl = fieldEl.querySelector('.pb-date-input');
      commit(mainEl ? mainEl.value : '', dateEl ? dateEl.value : '');
    }
  }

  document.addEventListener('mousedown', outsideHandler);

  const mainLabel       = isAscent ? 'Ascent' : isDistance ? 'Distance' : 'Time';
  const mainPlaceholder = isAscent ? 'e.g. 1500m or 4921ft'
                        : isDistance ? 'e.g. 85 mi or 140 km'
                        : 'MM:SS or H:MM:SS';
  const mainValue       = isAscent ? currentAsc : isDistance ? currentDist : currentTime;
  const mainMode        = (isDistance || isAscent) ? 'text' : 'numeric';

  valueEl.innerHTML = `
    <div class="pb-editor">
      <div class="pb-editor__field">
        <label class="pb-editor__label">${escapeHTML(mainLabel)}</label>
        <input class="profile-input pb-main-input" type="text"
          value="${escapeHTML(mainValue)}"
          placeholder="${escapeHTML(mainPlaceholder)}"
          autocomplete="off"
          inputmode="${mainMode}"
        />
      </div>
      <div class="pb-editor__field">
        <label class="pb-editor__label">Date achieved</label>
        <input class="profile-input pb-date-input" type="date"
          value="${escapeHTML(currentDate)}"
        />
      </div>
      <div class="pb-editor__actions">
        <button class="pb-save-btn" type="button">Save</button>
        <button class="pb-clear-btn" type="button">Clear</button>
      </div>
    </div>
  `;

  const mainInput = valueEl.querySelector('.pb-main-input');
  const dateInput = valueEl.querySelector('.pb-date-input');

  mainInput.focus();
  mainInput.setSelectionRange(mainInput.value.length, mainInput.value.length);

  valueEl.querySelector('.pb-save-btn').addEventListener('click', e => {
    e.stopPropagation();
    commit(mainInput.value, dateInput.value);
  });

  valueEl.querySelector('.pb-clear-btn').addEventListener('click', e => {
    e.stopPropagation();
    commit('', '');
  });

  mainInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); dateInput.focus(); }
    if (e.key === 'Escape') commit(mainValue, currentDate);
  });

  dateInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(mainInput.value, dateInput.value); }
    if (e.key === 'Escape') commit(mainValue, currentDate);
  });
}

/* ── PB History graph ── */

function renderPBGraph(pbs) {
  // Collect all events that have history entries
  const custom = [
    ...(Array.isArray(pbs.cycling_custom) ? pbs.cycling_custom : []),
    ...(Array.isArray(pbs.running_custom)  ? pbs.running_custom  : []),
  ];
  const allEvs = [...CYCLING_EVENTS, ...RUNNING_EVENTS, ...custom];

  const eventsWithHistory = allEvs.filter(ev => {
    const val = pbs[ev.key];
    if (!val) return false;
    const history = val.history || [];
    const current = val.current;
    const totalPoints = history.length + (current && (current.secs || current.dist || current.ascent) ? 1 : 0);
    return totalPoints >= 2;
  });

  if (eventsWithHistory.length === 0) return '';

  const firstEv = eventsWithHistory[0];

  return `
    <div class="profile-section pb-graph-section">
      <h2 class="profile-section__title">Progress</h2>
      <div class="profile-card pb-graph-card">
        <div class="pb-graph-controls">
          <select class="profile-input profile-input--select pb-graph-select">
            ${eventsWithHistory.map(ev =>
              `<option value="${escapeHTML(ev.key)}">${escapeHTML(ev.label)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="pb-graph-wrap" id="pb-graph-wrap">
          ${buildGraph(firstEv, pbs)}
        </div>
      </div>
    </div>
  `;
}

function buildGraph(ev, pbs) {
  const val = pbs[ev.key];
  if (!val) return '';

  const history = [...(val.history || [])];
  const current = val.current;
  if (current && (current.secs || current.dist || current.ascent)) {
    history.push({ ...current });
  }

  if (history.length < 2) return '<p class="pb-graph-empty">Not enough data yet — log more PBs to see progress.</p>';

  // For time events: lower is better. For distance/ascent: higher is better
  const isTime = ev.type === 'time';

  const points = history
    .filter(e => e.date && (e.secs || e.dist || e.ascent))
    .sort((a, b) => a.date < b.date ? -1 : 1)
    .map(e => ({
      date:  e.date,
      value: e.secs || parseFloat(e.dist) || parseFloat(e.ascent) || 0,
      label: e.secs ? secsToDisplay(e.secs) : (e.dist || e.ascent),
    }))
    .filter(p => p.value > 0);

  if (points.length < 2) return '<p class="pb-graph-empty">Add dates to your PBs to see progress over time.</p>';

  const W = 600, H = 140, PL = 8, PR = 8, PT = 16, PB = 24;
  const cW = W - PL - PR;
  const cH = H - PT - PB;
  const n  = points.length;

  const vals   = points.map(p => p.value);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const range  = maxVal - minVal || 1;

  const coords = points.map((p, i) => {
    const x = PL + (i / (n - 1)) * cW;
    // For time: lower = better = higher on graph. For distance: higher = better = higher on graph
    const norm = isTime
      ? 1 - (p.value - minVal) / range
      : (p.value - minVal) / range;
    const y = PT + (1 - norm) * cH;
    return { x, y, p };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const fillD = `${pathD} L${coords[n-1].x},${PT+cH} L${PL},${PT+cH} Z`;

  const dots = coords.map(c => `
    <circle cx="${c.x}" cy="${c.y}" r="4" class="pb-graph-dot" />
    <title>${escapeHTML(c.p.label)} · ${escapeHTML(c.p.date)}</title>
  `).join('');

  const xLabels = coords.map(c => {
    const d = new Date(c.p.date + 'T00:00:00');
    const label = isNaN(d) ? c.p.date : d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    return `<text x="${c.x}" y="${H - 4}" class="pb-graph-label" text-anchor="middle">${escapeHTML(label)}</text>`;
  }).join('');

  const improvement = isTime
    ? points[0].value - points[n-1].value
    : points[n-1].value - points[0].value;
  const improved = improvement > 0;
  const improvLabel = isTime && improved
    ? `Improved by ${secsToDisplay(Math.round(improvement))}`
    : !isTime && improved
    ? `Increased by ${(improvement).toFixed(1)}`
    : 'No improvement yet';

  return `
    <div class="pb-graph-summary">
      <span class="pb-graph-first">${escapeHTML(points[0].label)}</span>
      <span class="pb-graph-arrow ${improved ? 'pb-graph-arrow--good' : ''}">${improved ? '↑' : '→'}</span>
      <span class="pb-graph-latest">${escapeHTML(points[n-1].label)}</span>
      <span class="pb-graph-improve">${escapeHTML(improvLabel)}</span>
    </div>
    <svg class="pb-graph-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="pbGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2563eb" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${fillD}" fill="url(#pbGrad)"/>
      <path d="${pathD}" class="pb-graph-line"/>
      ${dots}
      ${xLabels}
    </svg>
  `;
}

function attachGraphListeners(pbs) {
  const sel = document.querySelector('.pb-graph-select');
  if (!sel) return;
  sel.addEventListener('change', () => {
    const allEvs = [...CYCLING_EVENTS, ...RUNNING_EVENTS];
    const custom = [
      ...(Array.isArray(pbs.cycling_custom) ? pbs.cycling_custom : []),
      ...(Array.isArray(pbs.running_custom)  ? pbs.running_custom  : []),
    ];
    const ev = [...allEvs, ...custom].find(e => e.key === sel.value);
    if (!ev) return;
    const wrap = document.getElementById('pb-graph-wrap');
    if (wrap) wrap.innerHTML = buildGraph(ev, pbs);
  });
}

document.addEventListener('DOMContentLoaded', buildPage);
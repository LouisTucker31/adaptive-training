/* ── Profile page ── */

const PROFILE_KEY = 'user-profile';

const SECTIONS = [
  {
    id: 'personal',
    title: 'Personal',
    fields: [
      { key: 'firstName', label: 'First name',    type: 'text',   placeholder: 'e.g. Alex' },
      { key: 'dob',       label: 'Date of birth', type: 'date',   placeholder: '' },
      { key: 'sex',       label: 'Sex',            type: 'select', options: ['Prefer not to say', 'Male', 'Female', 'Non-binary'] },
      { key: 'location',  label: 'Location',       type: 'select', options: ['Prefer not to say', 'United Kingdom', 'United States', 'Australia', 'Canada', 'Europe', 'Other'] },
    ],
  },
  {
    id: 'physical',
    title: 'Physical',
    fields: [
      { key: 'height', label: 'Height', type: 'text', placeholder: "e.g. 178 cm or 5'10\"" },
      { key: 'weight', label: 'Weight', type: 'text', placeholder: 'e.g. 75 kg or 165 lbs' },
    ],
  },
  {
    id: 'sport',
    title: 'Primary Sport',
    fields: [
      { key: 'primarySport', label: 'Sport', type: 'select', options: ['Not set', 'Cycling', 'Running', 'Both'] },
    ],
  },
  {
    id: 'training',
    title: 'Training',
    fields: [
      { key: 'ftp',   label: 'FTP (cycling)',  type: 'number', placeholder: 'Watts, e.g. 220' },
      { key: 'maxhr', label: 'Max heart rate', type: 'number', placeholder: 'bpm, e.g. 185' },
      { key: 'zones', label: 'Training zones', type: 'zones' },
    ],
  },
  {
    id: 'equipment',
    title: 'Equipment',
    fields: [],
  },
  {
    id: 'connections',
    title: 'Connections',
    fields: [
      { key: 'garmin', label: 'Garmin Connect', type: 'text', placeholder: 'Your Garmin username' },
      { key: 'strava', label: 'Strava',         type: 'text', placeholder: 'Your Strava username' },
    ],
  },
];

/* ── Storage ── */

function safeLoadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); }
  catch { return {}; }
}

function safeSaveProfile(data) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(data)); }
  catch { showProfileError('Could not save. Your browser storage may be full.'); }
}

function showProfileError(msg) {
  const existing = document.getElementById('profile-error');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'profile-error';
  el.className = 'profile-error';
  el.textContent = msg;
  document.getElementById('app-main').prepend(el);
  setTimeout(() => el.remove(), 4000);
}

/* ── Display helpers ── */

function formatDob(val) {
  if (!val) return '';
  try {
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d)) return val;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return val; }
}

function displayValue(field, val) {
  if (field.type === 'zones') return displayZones(val);
  if (!val) return '<span class="profile-field__empty">Tap to add</span>';
  if (field.type === 'date')  return escapeHTML(formatDob(val));
  return escapeHTML(String(val));
}

function displayZones(val, maxhr) {
  // val here is ignored - zones are derived from maxhr in profile
  return ''; // rendered separately
}

/* ── Training zones ── */

const ZONE_DEFS = [
  { name: 'Zone 1', label: 'Recovery',    pctMin: 0,  pctMax: 60, color: '#6b9fff' },
  { name: 'Zone 2', label: 'Aerobic',     pctMin: 60, pctMax: 70, color: '#34d399' },
  { name: 'Zone 3', label: 'Tempo',       pctMin: 70, pctMax: 80, color: '#fbbf24' },
  { name: 'Zone 4', label: 'Threshold',   pctMin: 80, pctMax: 90, color: '#f97316' },
  { name: 'Zone 5', label: 'VO2 Max',     pctMin: 90, pctMax: 100, color: '#ef4444' },
];

function renderZones(maxhr) {
  const hr = parseInt(maxhr);
  if (!hr || hr < 100 || hr > 220) {
    return '<span class="profile-field__empty">Enter max heart rate above to see your zones</span>';
  }

  const segments = ZONE_DEFS.map(z => {
    const width = z.pctMax - z.pctMin;
    return `<div class="zones-bar-segment" style="width:${width}%;background:${z.color}" title="${z.name}"></div>`;
  }).join('');

  const rows = ZONE_DEFS.map(z => {
    const lo = Math.round(hr * z.pctMin / 100);
    const hi = Math.round(hr * z.pctMax / 100);
    const range = z.pctMin === 0 ? `< ${hi} bpm` : `${lo}–${hi} bpm`;
    return `
      <div class="zones-row">
        <span class="zones-dot" style="background:${z.color}"></span>
        <span class="zones-name" style="color:${z.color}">${escapeHTML(z.name)}<br><span class="zones-label">${escapeHTML(z.label)}</span></span>
        <span class="zones-range">${escapeHTML(range)}</span>
      </div>`;
  }).join('');

  return `
    <div class="zones-wrap">
      <div class="zones-bar">${segments}</div>
      <div class="zones-list">${rows}</div>
    </div>`;
}

function refreshZones(profile) {
  const zonesEl = document.querySelector('.profile-field[data-key="zones"] .profile-field__value');
  if (zonesEl) zonesEl.innerHTML = renderZones(profile.maxhr);
}

/* ── Page build ── */

function allFields() {
  return SECTIONS.flatMap(s => s.fields);
}

function openNextField(currentKey, profile) {
  const fields = allFields().filter(f => !['zones', 'days', 'tags', 'list'].includes(f.type));
  const idx = fields.findIndex(f => f.key === currentKey);
  if (idx === -1 || idx >= fields.length - 1) return;
  const next = fields[idx + 1];
  const nextFieldEl = document.querySelector(`.profile-field[data-key="${next.key}"]`);
  if (!nextFieldEl) return;
  const nextValueEl = nextFieldEl.querySelector('.profile-field__value');
  openField(next, nextFieldEl, nextValueEl, profile);
}

function buildPage() {
  const profile = safeLoadProfile();
  const main = document.getElementById('app-main');

  main.innerHTML = `
    <div class="home">
      <h1 class="home__heading">Profile</h1>
      <p class="home__subheading">Tap any field to edit.</p>
      ${SECTIONS.map(section => `
        <div class="profile-section" data-section="${section.id}">
          <h2 class="profile-section__title">${escapeHTML(section.title)}</h2>
          <div class="profile-card">
            ${section.fields.map(field => buildFieldHTML(field, profile)).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  attachAllListeners(profile);
  renderEquipmentSection(profile);
}

function buildFieldHTML(field, profile) {
  if (field.type === 'zones') {
    return `
      <div class="profile-field profile-field--zones" data-key="${field.key}">
        <div class="profile-field__zones-inner">
          <span class="profile-field__label">${escapeHTML(field.label)}</span>
          <div class="profile-field__value">${renderZones(profile.maxhr)}</div>
        </div>
      </div>`;
  }
  return `
    <div class="profile-field" data-key="${field.key}">
      <div class="profile-field__row">
        <span class="profile-field__label">${escapeHTML(field.label)}</span>
        <span class="profile-field__value">${displayValue(field, profile[field.key])}</span>
      </div>
    </div>`;
}

function attachAllListeners(profile) {
  SECTIONS.forEach(section => {
    section.fields.forEach(field => {
      if (field.type === 'zones') return; // zones are read-only display
      const fieldEl = document.querySelector(`.profile-field[data-key="${field.key}"]`);
      if (!fieldEl) return;

      if (field.type === 'days') {
        attachDaysListener(field, fieldEl, profile);
        return;
      }

      const row     = fieldEl.querySelector('.profile-field__row');
      const valueEl = fieldEl.querySelector('.profile-field__value');
      row.setAttribute('tabindex', '0');
      row.setAttribute('role', 'button');
      row.setAttribute('aria-label', 'Edit ' + field.label);
      row.addEventListener('click', () => openField(field, fieldEl, valueEl, profile));
      row.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') openField(field, fieldEl, valueEl, profile);
      });
    });
  });
}

/* ── Standard inline edit ── */

function openField(field, fieldEl, valueEl, profile) {
  if (fieldEl.classList.contains('is-editing')) return;
  fieldEl.classList.add('is-editing');

  let committed = false;

  function commit(newVal, andNext) {
    if (committed) return;
    committed = true;
    document.removeEventListener('mousedown', outsideHandler);
    const val = typeof newVal === 'string' ? newVal.trim() : '';
    profile[field.key] = val;
    safeSaveProfile(profile);
    if (field.key === 'maxhr') refreshZones(profile);
    fieldEl.classList.remove('is-editing');
    const currentValueEl = fieldEl.querySelector('.profile-field__value');
    if (currentValueEl) currentValueEl.innerHTML = displayValue(field, val);
    if (andNext) openNextField(field.key, profile);
  }

  function outsideHandler(e) {
    if (!fieldEl.contains(e.target)) commit(getInputValue(), false);
  }

  function getInputValue() {
    const input = fieldEl.querySelector('input, select');
    return input ? input.value : '';
  }

  document.addEventListener('mousedown', outsideHandler);

  if (field.type === 'select') {
    valueEl.innerHTML = `
      <select class="profile-input profile-input--select" aria-label="${escapeHTML(field.label)}">
        ${field.options.map(o =>
          `<option value="${escapeHTML(o)}"${profile[field.key] === o ? ' selected' : ''}>${escapeHTML(o)}</option>`
        ).join('')}
      </select>`;
    const sel = valueEl.querySelector('select');
    sel.focus();
    sel.addEventListener('change', () => commit(sel.value, true));
    sel.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(sel.value, true); }
      if (e.key === 'Escape') commit(profile[field.key] || '', false);
    });
  } else {
    const inputType = field.type === 'number' ? 'number'
                    : field.type === 'date'   ? 'date'
                    : 'text';
    valueEl.innerHTML = `
      <input
        class="profile-input"
        type="${inputType}"
        value="${escapeHTML(String(profile[field.key] || ''))}"
        placeholder="${escapeHTML(field.placeholder)}"
        autocomplete="off"
        aria-label="${escapeHTML(field.label)}"
      />`;
    const input = valueEl.querySelector('input');
    input.focus();
    if (inputType === 'text' || inputType === 'number') {
      input.setSelectionRange(input.value.length, input.value.length);
    }
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(input.value, true); }
      if (e.key === 'Escape') commit(profile[field.key] || '', false);
    });
  }
}

/* ── Equipment cards ── */

const EQUIPMENT_TYPES = {
  bike: {
    label: 'Bike',
    fields: [
      { key: 'name',  label: 'Name',     type: 'text',   placeholder: 'e.g. Boardman SLR 8.8' },
      { key: 'type',  label: 'Type',     type: 'select', options: ['Road', 'Gravel', 'MTB', 'TT', 'Indoor / Turbo'] },
      { key: 'brand', label: 'Brand',    type: 'text',   placeholder: 'e.g. Trek, Specialized' },
      { key: 'date',  label: 'Acquired', type: 'date',   placeholder: '' },
      { key: 'notes', label: 'Notes',    type: 'text',   placeholder: 'Any notes' },
    ],
  },
  shoes: {
    label: 'Running shoes',
    fields: [
      { key: 'name',  label: 'Name',     type: 'text', placeholder: 'e.g. Nike Vaporfly' },
      { key: 'brand', label: 'Brand',    type: 'text', placeholder: 'e.g. Nike, Adidas' },
      { key: 'date',  label: 'Acquired', type: 'date', placeholder: '' },
      { key: 'notes', label: 'Notes',    type: 'text', placeholder: 'Any notes' },
    ],
  },
  gpswatch: {
    label: 'GPS watch',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Garmin, Suunto' },
      { key: 'model', label: 'Model', type: 'text', placeholder: 'e.g. Forerunner 965' },
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Any notes' },
    ],
  },
  hrm: {
    label: 'Heart rate monitor',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text',   placeholder: 'e.g. Garmin, Polar' },
      { key: 'model', label: 'Model', type: 'text',   placeholder: 'e.g. HRM-Pro' },
      { key: 'type',  label: 'Type',  type: 'select', options: ['Chest strap', 'Wrist', 'Arm band'] },
      { key: 'notes', label: 'Notes', type: 'text',   placeholder: 'Any notes' },
    ],
  },
  powermeter: {
    label: 'Power meter',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text',   placeholder: 'e.g. Wahoo, Quarq' },
      { key: 'model', label: 'Model', type: 'text',   placeholder: 'e.g. Speedplay' },
      { key: 'type',  label: 'Type',  type: 'select', options: ['Pedal', 'Crank', 'Hub', 'Spider'] },
      { key: 'notes', label: 'Notes', type: 'text',   placeholder: 'Any notes' },
    ],
  },
  trainer: {
    label: 'Indoor trainer',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text',   placeholder: 'e.g. Wahoo, Tacx' },
      { key: 'model', label: 'Model', type: 'text',   placeholder: 'e.g. KICKR Core' },
      { key: 'type',  label: 'Type',  type: 'select', options: ['Smart', 'Classic'] },
      { key: 'notes', label: 'Notes', type: 'text',   placeholder: 'Any notes' },
    ],
  },
  computer: {
    label: 'Cycling computer',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Garmin, Wahoo' },
      { key: 'model', label: 'Model', type: 'text', placeholder: 'e.g. Edge 1040' },
      { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Any notes' },
    ],
  },
};

function getEquipment(profile) {
  return Array.isArray(profile.equipment) ? profile.equipment : [];
}

function saveEquipment(profile) {
  safeSaveProfile(profile);
}

function renderEquipmentSection(profile) {
  const section = document.querySelector('.profile-section[data-section="equipment"]');
  if (!section) return;
  const card = section.querySelector('.profile-card');

  card.innerHTML = '';

  const items = getEquipment(profile);
  items.forEach(item => {
    const def = EQUIPMENT_TYPES[item.type];
    if (!def) return;
    card.appendChild(buildEquipCard(item, def, profile));
  });

  const addRow = document.createElement('div');
  addRow.className = 'equip-add-row';
  addRow.innerHTML = `
    <button class="equip-add-btn" type="button">+ Add gear</button>
    <select class="profile-input profile-input--select equip-type-select" style="display:none">
      <option value="">Select type…</option>
      ${Object.entries(EQUIPMENT_TYPES).map(([key, def]) =>
        `<option value="${escapeHTML(key)}">${escapeHTML(def.label)}</option>`
      ).join('')}
    </select>
    <button class="equip-cancel-btn" type="button" style="display:none">Cancel</button>
  `;

  const addBtn    = addRow.querySelector('.equip-add-btn');
  const sel       = addRow.querySelector('.equip-type-select');
  const cancelBtn = addRow.querySelector('.equip-cancel-btn');

  addBtn.addEventListener('click', () => {
    addBtn.style.display    = 'none';
    sel.style.display       = '';
    cancelBtn.style.display = '';
    sel.focus();
  });

  cancelBtn.addEventListener('click', () => {
    addBtn.style.display    = '';
    sel.style.display       = 'none';
    cancelBtn.style.display = 'none';
    sel.value = '';
  });

  sel.addEventListener('change', () => {
    const type = sel.value;
    if (!type) return;
    const newItem = { id: 'eq-' + Date.now(), type };
    if (!Array.isArray(profile.equipment)) profile.equipment = [];
    profile.equipment.push(newItem);
    saveEquipment(profile);
    renderEquipmentSection(profile);
    setTimeout(() => {
      const newCard = document.querySelector(`.equip-card[data-id="${newItem.id}"]`);
      if (newCard) {
        newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        newCard.classList.add('is-open');
        newCard.querySelector('.equip-card__toggle').textContent = '▴';
      }
    }, 50);
  });

  card.appendChild(addRow);
}

function buildEquipCard(item, def, profile) {
  const wrapper = document.createElement('div');
  wrapper.className = 'equip-card';
  wrapper.dataset.id = item.id;

  const nameVal = item.name || item.brand || def.label;

  wrapper.innerHTML = `
    <div class="equip-card__header">
      <div class="equip-card__header-text">
        <span class="equip-card__title">${escapeHTML(nameVal)}</span>
        <span class="equip-card__type">${escapeHTML(def.label)}</span>
      </div>
      <button class="equip-card__toggle" type="button" aria-label="Expand">▾</button>
      <button class="equip-card__delete" type="button" aria-label="Delete">✕</button>
    </div>
    <div class="equip-card__body">
      ${def.fields.map(field => `
        <div class="equip-field" data-key="${field.key}">
          <div class="equip-field__row">
            <span class="equip-field__label">${escapeHTML(field.label)}</span>
            <span class="equip-field__value">${equipDisplayValue(field, item[field.key])}</span>
          </div>
        </div>`).join('')}
    </div>
  `;

  const header = wrapper.querySelector('.equip-card__header');
  const toggle = wrapper.querySelector('.equip-card__toggle');

  header.addEventListener('click', e => {
    if (e.target.closest('.equip-card__delete')) return;
    wrapper.classList.toggle('is-open');
    toggle.textContent = wrapper.classList.contains('is-open') ? '▴' : '▾';
  });

  wrapper.querySelector('.equip-card__delete').addEventListener('click', e => {
    e.stopPropagation();
    if (!confirm('Remove this item?')) return;
    profile.equipment = profile.equipment.filter(i => i.id !== item.id);
    saveEquipment(profile);
    renderEquipmentSection(profile);
  });

  def.fields.forEach(field => {
    const fieldEl = wrapper.querySelector(`.equip-field[data-key="${field.key}"]`);
    if (!fieldEl) return;
    const row     = fieldEl.querySelector('.equip-field__row');
    const valueEl = fieldEl.querySelector('.equip-field__value');
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', 'Edit ' + field.label);
    row.addEventListener('click', () => openEquipField(field, fieldEl, valueEl, item, profile, wrapper));
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openEquipField(field, fieldEl, valueEl, item, profile, wrapper);
    });
  });

  return wrapper;
}

function equipDisplayValue(field, val) {
  if (!val) return '<span class="equip-field__empty">Tap to add</span>';
  if (field.type === 'date') return escapeHTML(formatDob(val));
  return escapeHTML(String(val));
}

function openEquipField(field, fieldEl, valueEl, item, profile, wrapper) {
  if (fieldEl.classList.contains('is-editing')) return;
  fieldEl.classList.add('is-editing');

  let committed = false;

  function commit(newVal) {
    if (committed) return;
    committed = true;
    document.removeEventListener('mousedown', outsideHandler);
    const val = typeof newVal === 'string' ? newVal.trim() : '';
    item[field.key] = val;
    if (field.key === 'name' || field.key === 'brand') {
      const def = EQUIPMENT_TYPES[item.type];
      const titleEl = wrapper.querySelector('.equip-card__title');
      if (titleEl) titleEl.textContent = item.name || item.brand || (def ? def.label : '');
    }
    saveEquipment(profile);
    fieldEl.classList.remove('is-editing');
    const currentValueEl = fieldEl.querySelector('.equip-field__value');
    if (currentValueEl) currentValueEl.innerHTML = equipDisplayValue(field, val);
  }

  function outsideHandler(e) {
    if (!fieldEl.contains(e.target)) commit(getInputValue());
  }

  function getInputValue() {
    const input = fieldEl.querySelector('input, select');
    return input ? input.value : '';
  }

  document.addEventListener('mousedown', outsideHandler);

  if (field.type === 'select') {
    valueEl.innerHTML = `
      <select class="profile-input profile-input--select" aria-label="${escapeHTML(field.label)}">
        ${field.options.map(o =>
          `<option value="${escapeHTML(o)}"${item[field.key] === o ? ' selected' : ''}>${escapeHTML(o)}</option>`
        ).join('')}
      </select>`;
    const sel = valueEl.querySelector('select');
    sel.focus();
    sel.addEventListener('change', () => commit(sel.value));
    sel.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(sel.value); }
      if (e.key === 'Escape') commit(item[field.key] || '');
    });
  } else {
    const inputType = field.type === 'date' ? 'date' : 'text';
    valueEl.innerHTML = `
      <input
        class="profile-input"
        type="${inputType}"
        value="${escapeHTML(String(item[field.key] || ''))}"
        placeholder="${escapeHTML(field.placeholder)}"
        autocomplete="off"
        aria-label="${escapeHTML(field.label)}"
      />`;
    const input = valueEl.querySelector('input');
    input.focus();
    if (inputType === 'text') input.setSelectionRange(input.value.length, input.value.length);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(input.value); }
      if (e.key === 'Escape') commit(item[field.key] || '');
    });
  }
}
document.addEventListener('DOMContentLoaded', buildPage);
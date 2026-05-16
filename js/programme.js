/* ── Programme page ── */

const MI_TO_KM = 1.60934;
function getUnit() { return localStorage.getItem('units') || 'mi'; }
function cvt(miles) { return getUnit() === 'km' ? Math.round(miles * MI_TO_KM) : miles; }
function ul() { return getUnit(); }

/* ────────────────────────────────────────────────
   HARDCODED DEMO DATA  –  Three Bros Prep
   ──────────────────────────────────────────────── */
const DEMO = {
  id: 'three-bros-prep',
  name: 'Three Bros Prep',
  demo: true,

  meta: {
    weeks: 18,
    event: 'Dartmoor Ultra Challenge - 200 km road, multi-day, loaded touring',
    eventDate: 'August 2026',
  },

  profile: [
    { label: 'Programme model',   value: 'Event-specific · Loaded touring' },
    { label: 'Athlete state',     value: 'Recreational → Intermediate' },
    { label: 'Event category',    value: 'Multi-day endurance · Road' },
    { label: 'Luggage load',      value: 'Fully loaded' },
    { label: 'Risk level',        value: 'Moderate', flag: 'amber' },
    { label: 'Main constraint',   value: 'Volume ramp & loaded adaptation' },
    { label: 'Strategy',          value: 'Progressive overload + loaded long rides' },
  ],

  strategy: [
    'This plan takes you from a recreational base to multi-day loaded touring readiness across 18 weeks. The primary goal is to arrive at the Dartmoor Ultra Challenge confident you can complete all three days comfortably, not just survive them.',
    'The Foundation phase builds your aerobic engine and gets you used to time in the saddle. Build doubles the load progressively, introducing back-to-back riding and loaded sessions. The Peak week delivers your highest volume to prove fitness before the Taper brings you to the start line fresh.',
    'Loaded sessions - rides with panniers or a weighted pack - are introduced from Week 8 onwards. This is non-negotiable for multi-day touring: your body must adapt to the altered handling and sustained muscular demand before race day.',
  ],

  keyFocus: [
    { title: 'Aerobic base',          desc: 'Consistent Zone 2 riding to build fatigue resistance across long days.' },
    { title: 'Back-to-back tolerance', desc: 'Training the legs to go again on day 2 and 3 despite accumulated fatigue.' },
    { title: 'Loaded adaptation',      desc: 'Riding with your actual load so handling and cadence adapt before the event.' },
    { title: 'Fuelling practice',      desc: 'Eating and drinking on the bike, every ride - don\'t bonk in training.' },
    { title: 'Recovery discipline',    desc: 'Sleep and nutrition in the 48 hours after long sessions are as important as the session itself.' },
    { title: 'Pacing control',         desc: 'Learn your sustainable pace fully loaded. Start slower than feels right.' },
  ],

  phases: [
    { id: 'foundation', name: 'Foundation', weeks: '1–5',  colour: '#34d399',
      goal: 'Build aerobic base and saddle time',
      load: 'Low → Moderate',
      keySession: (u) => `Long ride (unloaded)`,
      note: 'No loaded riding yet. Focus on consistency and riding 3× per week.' },
    { id: 'build',      name: 'Build',      weeks: '6–15', colour: '#2563eb',
      goal: 'Progressive overload + back-to-back sessions',
      load: 'Moderate → High',
      keySession: (u) => `Back-to-back weekend rides (loaded from Wk 8)`,
      note: 'Volume increases ~10% per fortnight. Loaded sessions added Week 8.' },
    { id: 'peak',       name: 'Peak',       weeks: '16',   colour: '#f59e0b',
      goal: 'Highest volume week - prove fitness',
      load: 'High',
      keySession: (u) => `${cvt(100)} ${u} loaded long ride`,
      note: (u) => `One big week only. Nail nutrition and sleep going in.` },
    { id: 'taper',      name: 'Taper',      weeks: '17',   colour: '#a78bfa',
      goal: 'Reduce load, stay sharp',
      load: 'Low',
      keySession: (u) => `${cvt(50)} ${u} easy spin`,
      note: 'Cut volume by 50%. Keep intensity brief. Trust the training.' },
    { id: 'event',      name: 'Event',      weeks: '18',   colour: '#f43f5e',
      goal: 'Race week - arrive fresh',
      load: 'Very low',
      keySession: (u) => `${cvt(25)} ${u} shakeout the day before`,
      note: 'Short legs-opener only. Pack early. Eat well. Sleep.' },
  ],

  weeks: [
    /* Foundation */
    { wk:1, phase:'Foundation', mainDist:45,  mainSuffix:'easy',           supportDist:20,  supportPrefix:'Rest / ', supportSuffix:'easy spin',   loaded:false, intensity:'Zone 2',   note:'Set your baseline pace. Nothing heroic.' },
    { wk:2, phase:'Foundation', mainDist:50,  mainSuffix:'easy',           supportDist:20,  supportSuffix:'active recovery',                        loaded:false, intensity:'Zone 2',   note:'Add 10% to last week\'s long ride.' },
    { wk:3, phase:'Foundation', mainDist:60,  mainSuffix:'moderate',       supportDist:25,  supportSuffix:'easy',                                   loaded:false, intensity:'Zone 2',   note:(u) => `First time holding ${cvt(60)} ${u}. Note how you feel at ${cvt(50)}.` },
    { wk:4, phase:'Foundation', mainDist:65,  mainSuffix:'moderate',       supportDist:25,  supportSuffix:'easy',                                   loaded:false, intensity:'Zone 2',   note:'Focus on fuelling every 30–40 min.' },
    { wk:5, phase:'Foundation', mainDist:70,  mainSuffix:'moderate',       supportDist:30,  supportSuffix:'easy',                                   loaded:false, intensity:'Zone 2',   note:'Back-to-back this weekend - both days.' },
    /* Build */
    { wk:6, phase:'Build',      mainDist:70,  mainSuffix:'moderate',       supportDist:35,  supportSuffix:'easy',                                   loaded:false, intensity:'Zone 2–3', note:'First proper back-to-back. Take it steady on day 2.' },
    { wk:7, phase:'Build',      mainDist:75,  mainSuffix:'moderate',       supportDist:35,  supportSuffix:'easy',                                   loaded:false, intensity:'Zone 2–3', note:'Reduce week slightly. Active recovery focus.' },
    { wk:8, phase:'Build',      mainDist:75,  mainSuffix:'',               supportDist:35,  supportSuffix:'easy',                                   loaded:true,  intensity:'Zone 2',   note:'First loaded ride. Expect to be ~10–15% slower.' },
    { wk:9, phase:'Build',      mainDist:80,  mainSuffix:'moderate',       supportDist:40,  supportSuffix:'easy',                                   loaded:false, intensity:'Zone 2–3', note:'Back-to-back. Second day loaded if possible.' },
    { wk:10,phase:'Build',      mainDist:80,  mainSuffix:'',               supportDist:40,  supportSuffix:'easy',                                   loaded:true,  intensity:'Zone 2',   note:'Build loaded comfort. Dial in packing.' },
    { wk:11,phase:'Build',      mainDist:85,  mainSuffix:'',               supportDist:40,  supportSuffix:'easy',                                   loaded:true,  intensity:'Zone 2',   note:'Three-day simulation: Fri easy + Sat loaded + Sun easy.' },
    { wk:12,phase:'Build',      mainDist:60,  mainSuffix:'easy',           supportDist:30,  supportSuffix:'easy',                                   loaded:false, intensity:'Zone 1–2', note:'Planned down week. Absorb the fatigue.' },
    { wk:13,phase:'Build',      mainDist:90,  mainSuffix:'',               supportDist:45,  supportSuffix:'easy',                                   loaded:true,  intensity:'Zone 2',   note:'Longest back-to-back to date. Focus on day-2 pacing.' },
    { wk:14,phase:'Build',      mainDist:90,  mainSuffix:'',               supportDist:45,  supportSuffix:'moderate',                               loaded:true,  intensity:'Zone 2',   note:'Repeat to consolidate. How do legs feel on day 2?' },
    { wk:15,phase:'Build',      mainDist:95,  mainSuffix:'',               supportDist:45,  supportSuffix:'easy',                                   loaded:true,  intensity:'Zone 2',   note:'Final big build week. Three days if you can.' },
    /* Peak */
    { wk:16,phase:'Peak',       mainDist:100, mainSuffix:'',               supportDist:50,  supportSuffix:'easy',                                   loaded:true,  intensity:'Zone 2',   note:'Your confidence ride. Start very easy. Eat constantly.' },
    /* Taper */
    { wk:17,phase:'Taper',      mainDist:50,  mainSuffix:'easy (unloaded)',supportDist:20,  supportSuffix:'easy',                                   loaded:false, intensity:'Zone 1–2', note:'Cut volume in half. One short sharp effort mid-week.' },
    /* Event */
    { wk:18,phase:'Event',      mainDist:25,  mainSuffix:'shakeout',       supportDist:null, supportSuffix:'',                                     loaded:false, intensity:'Zone 1',   note:'Legs opener only. Pack the night before. Eat big.' },
  ],

  /* Weekly mileage for graph: [wk, mi] */
  graph: [45,70,85,90,100,105,75,110,120,120,125,90,135,135,140,150,70,25],

  guidance: {
    intro: 'Use the following guidance alongside your training. These are not optional extras - they are core to the programme working.',
    points: [
      { title: 'Nutrition on the bike', body: 'Aim for 60–90g carbohydrate per hour on rides over 90 minutes. Train your gut to accept this. Real food (bars, bananas, rice cakes) plus gels. Never skip eating because you\'re "not hungry yet".' },
      { title: 'Hydration', body: 'At least 500ml per hour in cool conditions, more in heat. Add electrolytes on anything over 2 hours. Weigh yourself before and after long rides to calibrate.' },
      { title: 'Recovery between days', body: 'The first 30–60 minutes after a long ride is your most valuable recovery window. Prioritise carbohydrate and protein, then rest. Sleep 8+ hours.' },
      { title: 'Loaded riding setup', body: 'Use the exact same bags, packing, and bike setup you will race with. Don\'t test new kit on the event. Centre of gravity matters - heavier items low and central.' },
      { title: 'Listening to your body', body: 'Fatigue is expected. Pain is not. Sharp joint pain, persistent muscle soreness that won\'t clear, or unusual fatigue after easy days are signals to rest and reassess.' },
    ],
  },

  warnings: [
    { level: 'high',   text: 'Loaded riding changes handling and braking. Practice descending with full weight before the event.' },
    { level: 'amber',  text: 'The ramp from Week 10 to Week 15 is steep. If you miss two or more consecutive weeks, speak to a coach before resuming.' },
    { level: 'amber',  text: 'This plan assumes no existing injury. If pain develops, pull the load week back to the last comfortable distance.' },
    { level: 'info',   text: (u) => `Distances shown in ${u === 'km' ? 'kilometres' : 'miles'}. Try switching to ${u === 'km' ? 'miles' : 'km'} in settings - all values update automatically.` },
    { level: 'info',   text: 'Weeks marked LOADED require your full touring setup. Don\'t substitute with an unloaded ride as adaptation to the load is a core training goal.' },
  ],
};

/* ────────────────────────────────────────────────
   RENDER HELPERS
   ──────────────────────────────────────────────── */

function sectionHeader(num, title, id) {
  return `<div class="prog-section-header" id="${id}">
    <div class="prog-section-num">${num}</div>
    <h2 class="prog-section-title">${title}</h2>
  </div>`;
}

function renderProfile(d) {
  const flagColour = { amber: '#f59e0b', red: '#f43f5e', green: '#34d399' };
  const pills = d.profile.map(p => `
    <div class="profile-row">
      <span class="profile-label">${p.label}</span>
      <span class="profile-value${p.flag ? ' profile-value--flag' : ''}"
            ${p.flag ? `style="color:${flagColour[p.flag] || '#888'}"` : ''}>${p.value}</span>
    </div>`).join('');
  return `<section class="prog-section" id="sec-overview">
    ${sectionHeader('01', 'Derived Profile', 'hdr-overview')}
    <div class="profile-grid">${pills}</div>
  </section>`;
}

function renderStrategy(d) {
  const paras = d.strategy.map(t => `<p class="strategy-para">${t}</p>`).join('');
  return `<section class="prog-section" id="sec-strategy">
    ${sectionHeader('02', 'Strategy Summary', 'hdr-strategy')}
    <div class="strategy-body">${paras}</div>
  </section>`;
}

function renderKeyFocus(d) {
  const items = d.keyFocus.map((f, i) => `
    <div class="focus-item">
      <div class="focus-num">${String(i + 1).padStart(2, '0')}</div>
      <div class="focus-body">
        <span class="focus-title">${f.title}</span>
        <span class="focus-desc">${f.desc}</span>
      </div>
    </div>`).join('');
  return `<section class="prog-section" id="sec-focus">
    ${sectionHeader('03', 'Key Focus Areas', 'hdr-focus')}
    <div class="focus-list">${items}</div>
  </section>`;
}

function renderPhaseOverview(d) {
  const u = ul();
  const rows = d.phases.map(p => `
    <tr class="phase-row phase-row--${p.id}">
      <td><span class="phase-dot" style="background:${p.colour}"></span><strong>${p.name}</strong></td>
      <td class="phase-cell--weeks">${p.weeks}</td>
      <td class="phase-cell--hide">${p.goal}</td>
      <td class="phase-cell--load">${p.load}</td>
      <td class="phase-cell--hide">${typeof p.keySession === 'function' ? p.keySession(u) : p.keySession}</td>
      <td class="phase-cell--note">${typeof p.note === 'function' ? p.note(u) : p.note}</td>
    </tr>`).join('');
  return `<section class="prog-section" id="sec-phases">
    ${sectionHeader('04', 'Phase Overview', 'hdr-phases')}
    <div class="phase-table-wrap">
      <table class="phase-table">
        <thead>
          <tr>
            <th>Phase</th><th>Weeks</th><th class="phase-cell--hide">Goal</th>
            <th class="phase-cell--load">Load</th><th class="phase-cell--hide">Key session</th><th class="phase-cell--note">Note</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;
}

function renderGraph(d) {
  const data = d.graph;
  const unit = ul();
  const vals = unit === 'km' ? data.map(v => Math.round(v * MI_TO_KM)) : data;
  const maxVal = Math.max(...vals);
  const W = 700, H = 180, PAD_L = 44, PAD_R = 12, PAD_T = 16, PAD_B = 28;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const n = vals.length;
  const xStep = chartW / (n - 1);

  const pts = vals.map((v, i) => {
    const x = PAD_L + i * xStep;
    const y = PAD_T + chartH - (v / maxVal) * chartH;
    return [x, y];
  });

  const pathD = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const fillD = `${pathD} L${pts[n-1][0]},${PAD_T + chartH} L${PAD_L},${PAD_T + chartH} Z`;

  // Y grid lines at 25%, 50%, 75%, 100%
  const gridLines = [0.25, 0.5, 0.75, 1].map(f => {
    const y = PAD_T + chartH - f * chartH;
    const label = Math.round(maxVal * f);
    return `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" class="graph-grid"/>
            <text x="${PAD_L - 6}" y="${y + 4}" class="graph-label">${label}</text>`;
  }).join('');

  // X labels every 3 weeks
  const xLabels = vals.map((_, i) => {
    if ((i + 1) % 3 !== 0 && i !== 0 && i !== n - 1) return '';
    const x = PAD_L + i * xStep;
    return `<text x="${x}" y="${H - 2}" class="graph-label" text-anchor="middle">W${i + 1}</text>`;
  }).join('');

  // Phase band backgrounds - derived from week data when available
  const phaseColourMap = {
    Foundation: '#34d39928', Build: '#2563eb22', Specific: '#8b5cf624',
    'Pre-Peak Rest': '#a78bfa24', 'Pre-Race Rest': '#a78bfa24',
    Peak: '#f59e0b24', Taper: '#a78bfa24',
    Event: '#f43f5e22', Race: '#f43f5e22',
    Consolidate: '#06b6d424', Progress: '#6366f124',
  };
  let phaseBands = '';
  if (d.weeks && d.weeks.length) {
    let lastPh = null, bandStart = 0;
    const bands = [];
    d.weeks.forEach((w, i) => {
      if (w.phase !== lastPh) {
        if (lastPh) bands.push({ start: bandStart, end: i - 1, phase: lastPh });
        lastPh = w.phase; bandStart = i;
      }
    });
    if (lastPh) bands.push({ start: bandStart, end: d.weeks.length - 1, phase: lastPh });
    phaseBands = bands.map(b => {
      const x1 = PAD_L + b.start * xStep;
      const x2 = PAD_L + b.end * xStep;
      const col = phaseColourMap[b.phase] || '#88888810';
      return `<rect x="${x1}" y="${PAD_T}" width="${x2 - x1}" height="${chartH}" fill="${col}" />`;
    }).join('');
  }

  const useDur = d.useDuration || false;
  const graphTitle = useDur
    ? 'Weekly volume - hours per week'
    : `Weekly volume - ${unit === 'km' ? 'km' : 'miles'} per week`;

  return `<div class="graph-wrap" id="graph-wrap">
    <div class="graph-title">${graphTitle}</div>
    <svg class="prog-graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      ${phaseBands}
      ${gridLines}
      <defs>
        <linearGradient id="graphGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2563eb" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${fillD}" fill="url(#graphGrad)"/>
      <path d="${pathD}" class="graph-line"/>
      ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" class="graph-dot"/>`).join('')}
      ${xLabels}
    </svg>
    <div class="graph-legend">
      ${d.phases ? d.phases.map(p => `<span class="legend-dot" style="background:${p.colour}"></span>${p.name}`).join(' ') :
        `<span class="legend-dot" style="background:#34d399"></span>Foundation
         <span class="legend-dot" style="background:#2563eb"></span>Build
         <span class="legend-dot" style="background:#f59e0b"></span>Peak
         <span class="legend-dot" style="background:#a78bfa"></span>Taper
         <span class="legend-dot" style="background:#f43f5e"></span>Event`}
    </div>
  </div>`;
}

function roundToFive(n) { return Math.round(n / 5) * 5; }
// For running distances (small values), round to 1 decimal place in km
function smartRoundKm(miles) {
  const km = miles * MI_TO_KM;
  if (miles < 15) return Math.round(km * 10) / 10; // running: 1 decimal km
  return roundToFive(km); // cycling: nearest 5km
}
function roundToOne(n)  { return Math.round(n * 10) / 10; } // 1 decimal place for running km

function formatMainTarget(w, u) {
  if (w.mainTarget !== undefined) {
    if (w.useDuration) {
      const hrs = Math.floor(w.mainTarget / 60);
      const mins = w.mainTarget % 60;
      return mins ? `${hrs}h ${mins}min` : `${hrs}h`;
    }
    // mainTarget is always in miles internally; convert then round
    const dist = u === 'km' ? smartRoundKm(w.mainTarget) : w.mainTarget;
    return `${dist} ${u}`;
  }
  const parts = [cvt(w.mainDist) + ' ' + u];
  if (w.mainSuffix) parts.push(w.mainSuffix);
  return parts.join(' ').trim();
}

function formatSupportTarget(w, u) {
  if (w.mainTarget !== undefined) {
    if (!w.supportTarget) return null;
    if (w.useDuration) {
      const hrs = Math.floor(w.supportTarget / 60);
      const mins = w.supportTarget % 60;
      return mins ? `${hrs}h ${mins}min` : `${hrs}h`;
    }
    const dist = u === 'km' ? smartRoundKm(w.supportTarget) : w.supportTarget;
    return `${dist} ${u}`;
  }
  if (w.supportDist === null) return w.supportSuffix || null;
  return (w.supportPrefix || '') + cvt(w.supportDist) + ' ' + u + ' ' + w.supportSuffix;
}

function formatB2BTarget(w, u) {
  if (!w.b2bTarget) return null;
  if (w.useDuration) {
    const hrs = Math.floor(w.b2bTarget / 60);
    const mins = w.b2bTarget % 60;
    return mins ? `${hrs}h ${mins}min` : `${hrs}h`;
  }
  const dist = u === 'km' ? smartRoundKm(w.b2bTarget) : w.b2bTarget;
  return `${dist} ${u}`;
}

function formatMidweekTarget(w, u) {
  if (!w.midweekTarget) return null;
  if (w.useDuration) {
    const hrs = Math.floor(w.midweekTarget / 60);
    const mins = w.midweekTarget % 60;
    return mins ? `${hrs}h ${mins}min` : `${hrs}h`;
  }
  const dist = u === 'km' ? smartRoundKm(w.midweekTarget) : w.midweekTarget;
  return `${dist} ${u}`;
}

function formatMidweek2Target(w, u) {
  if (!w.midweek2Target) return null;
  if (w.useDuration) {
    const hrs = Math.floor(w.midweek2Target / 60);
    const mins = w.midweek2Target % 60;
    return mins ? `${hrs}h ${mins}min` : `${hrs}h`;
  }
  const dist = u === 'km' ? smartRoundKm(w.midweek2Target) : w.midweek2Target;
  return `${dist} ${u}`;
}

function formatMidweek3Target(w, u) {
  if (!w.midweek3Target) return null;
  if (w.useDuration) {
    const hrs = Math.floor(w.midweek3Target / 60);
    const mins = w.midweek3Target % 60;
    return mins ? `${hrs}h ${mins}min` : `${hrs}h`;
  }
  const dist = u === 'km' ? smartRoundKm(w.midweek3Target) : w.midweek3Target;
  return `${dist} ${u}`;
}

function buildSessions(w, u) {
  const isDown = w.isRecovery || w.isConsolidation;

  const ride1Badges = [
    w.loaded && !isDown     ? '<span class="loaded-badge loaded-badge--loaded">LOADED</span>'            : '',
    w.isRecovery            ? '<span class="loaded-badge loaded-badge--recovery">RECOVERY</span>'        : '',
    w.isConsolidation       ? '<span class="loaded-badge loaded-badge--consolidation">SHORT WEEK</span>' : '',
  ].filter(Boolean).join('');

  const sessions = [{ dist: formatMainTarget(w, u), isLoaded: w.loaded && !isDown, badges: ride1Badges }];

  if (w.b2b && w.b2bTarget) {
    const ride2Badges = '<span class="loaded-badge loaded-badge--b2b">BACK-TO-BACK</span>';
    sessions.push({ dist: formatB2BTarget(w, u), isLoaded: false, badges: ride2Badges });
  } else if (w.supportTarget) {
    const suppDist = formatSupportTarget(w, u);
    if (suppDist) sessions.push({ dist: suppDist, isLoaded: false, badges: '' });
  }

  // Rides 3-5: midweek sessions for 3/4/5 days/week athletes — dropped on recovery/consolidation weeks
  if (!isDown) {
    const mid1 = formatMidweekTarget(w, u);
    if (mid1) sessions.push({ dist: mid1, isLoaded: false, badges: '' });

    const mid2 = formatMidweek2Target(w, u);
    if (mid2) sessions.push({ dist: mid2, isLoaded: false, badges: '' });

    const mid3 = formatMidweek3Target(w, u);
    if (mid3) sessions.push({ dist: mid3, isLoaded: false, badges: '' });
  }

  return sessions;
}
function renderWeekCards(d) {
  const u = ul();
  const phaseColour = {
    Foundation: '#34d399', Build: '#2563eb', Specific: '#8b5cf6',
    'Pre-Peak Rest': '#a78bfa', 'Pre-Race Rest': '#a78bfa',
    Peak: '#f59e0b', Taper: '#a78bfa',
    Event: '#f43f5e', Race: '#f43f5e',
    Consolidate: '#06b6d4', Progress: '#6366f1',
  };

  const isRunning = d.weeks && d.weeks.length > 0 && d.weeks[0].mainTarget < 30;
  const runLabel = isRunning ? 'Run' : 'Ride';

  let lastPhase = null;
  let html = '';

  d.weeks.forEach((w, idx) => {
    const note = typeof w.note === 'function' ? w.note(u) : w.note;
    const sessions = buildSessions(w, u);
    const colour = phaseColour[w.phase] || '#888';

    if (w.phase !== lastPhase) {
      lastPhase = w.phase;
      html += `<div class="wbw-card-phase" style="border-left: 3px solid ${colour}">${w.phase}</div>`;
    }

    const isDown = w.isRecovery || w.isConsolidation;
    const runRows = sessions.map((s, i) => {
      if (!s) return '';
      const label = i === 0 ? `${runLabel} 1` : i === 1 && w.b2b ? 'B2B' : `${runLabel} ${i + 1}`;

      let badge = '';
      if (i === 0 && w.isRecovery)     badge = `<span class="wbw-card__run-badge wbw-card__run-badge--recovery">Recovery</span>`;
      if (i === 0 && w.isConsolidation) badge = `<span class="wbw-card__run-badge wbw-card__run-badge--short">Short week</span>`;
      if (w.b2b && i === 1)            badge = `<span class="wbw-card__run-badge wbw-card__run-badge--b2b">B2B</span>`;
      if (w.loaded && i === 0)         badge = `<span class="wbw-card__run-badge wbw-card__run-badge--loaded">Loaded</span>`;

      return `<div class="wbw-card__run">
        <span class="wbw-card__run-label">${label}</span>
        <span class="wbw-card__run-dist">${s.dist}</span>
        ${badge}
      </div>`;
    }).join('');

    html += `
      <div class="wbw-card${isDown ? ' wbw-card--recovery' : ''}">
        <div class="wbw-card__top">
          <div class="wbw-card-phase-bar" style="background:${colour}"></div>
          <span class="wbw-card__week">Wk ${w.wk}</span>
          <div class="wbw-card__runs">${runRows}</div>
          <div class="wbw-card__meta">
            <span class="wbw-card__intensity">${w.intensity}</span>
            ${note ? `<button class="wbw-card__note-btn" data-idx="${idx}">Note ↓</button>` : ''}
          </div>
        </div>
        ${note ? `<div class="wbw-card__note" id="card-note-${idx}">${note}</div>` : ''}
      </div>`;
  });

  return `<div class="wbw-cards" id="wbw-cards">${html}</div>`;
}
function renderWeekByWeek(d) {
  const phaseColour = {
    Foundation: '#34d399', Build: '#2563eb', Specific: '#8b5cf6',
    'Pre-Peak Rest': '#a78bfa', 'Pre-Race Rest': '#a78bfa',
    Peak: '#f59e0b', Taper: '#a78bfa',
    Event: '#f43f5e', Race: '#f43f5e',
    Consolidate: '#06b6d4', Progress: '#6366f1',
  };
  const u = ul();
  let lastPhase = null;

  // Determine how many session columns to show — scan all weeks for the max
  const maxSessions = d.weeks.reduce((max, w) => Math.max(max, buildSessions(w, u).length), 1);
  const isRunning = d.weeks && d.weeks.length > 0 && d.weeks[0].mainTarget < 30;
  const sessionLabel = isRunning ? 'Run' : 'Ride';
  const sessionHeaders = Array.from({ length: maxSessions }, (_, i) =>
    `<th class="wbw-ride-th">${sessionLabel} ${i + 1}</th>`
  ).join('');

  const rows = d.weeks.map(w => {
    const phaseChange = w.phase !== lastPhase;
    lastPhase = w.phase;
    const phaseCell = phaseChange
      ? `<td class="wbw-phase" rowspan="${d.weeks.filter(x => x.phase === w.phase).length}" style="border-left:3px solid ${phaseColour[w.phase] || '#888'}">
           <span class="wbw-phase-name">${w.phase}</span>
         </td>`
      : '';

    const note = typeof w.note === 'function' ? w.note(u) : w.note;

    const sessions = buildSessions(w, u);

    // Pad sessions array to maxSessions so every row has the same number of cells
    while (sessions.length < maxSessions) sessions.push(null);

    const sessionCells = sessions.map((s) => {
      if (!s) return `<td class="wbw-ride wbw-ride--empty"></td>`;
      const badgesHtml = s.badges ? `<div class="wbw-badges">${s.badges}</div>` : '';
      return `<td class="wbw-ride${s.isLoaded ? ' wbw-ride--loaded' : ''}">
        <span class="wbw-ride__dist">${s.dist}</span>
        ${badgesHtml}
      </td>`;
    }).join('');

    return `<tr${phaseChange ? ' class="wbw-phase-start"' : ''}>
      ${phaseChange ? phaseCell : ''}
      <td class="wbw-wk">Wk ${w.wk}</td>
      ${sessionCells}
      <td class="wbw-intensity">${w.intensity}</td>
      <td class="wbw-note">${note}</td>
    </tr>`;
  }).join('');

  return `<section class="prog-section" id="sec-weeks">
    ${sectionHeader('05', 'Week-by-Week Programme', 'hdr-weeks')}
    ${renderGraph(d)}
    ${renderWeekCards(d)}
    <div class="wbw-breakout"><div class="wbw-table-wrap">
      <table class="wbw-table">
        <thead>
          <tr>
            <th class="wbw-phase-th">Phase</th>
            <th>Week</th>
            ${sessionHeaders}
            <th>Intensity</th>
            <th class="wbw-note-th">Coaching note</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div></div>
  </section>`;
}

function renderGuidance(d) {
  const items = d.guidance.points.map(p => `
    <div class="guidance-item">
      <div class="guidance-title">${p.title}</div>
      <div class="guidance-body">${p.body}</div>
    </div>`).join('');
  return `<section class="prog-section" id="sec-guidance">
    ${sectionHeader('06', 'Support Guidance', 'hdr-guidance')}
    <p class="guidance-intro">${d.guidance.intro}</p>
    <div class="guidance-list">${items}</div>
  </section>`;
}

function renderWarnings(d) {
  const icon = { high: '⚠', amber: '◆', info: 'ℹ' };
  const u = ul();
  const items = d.warnings.map(w => `
    <div class="warning-card warning-card--${w.level}">
      <span class="warning-icon">${icon[w.level] || '·'}</span>
      <span class="warning-text">${typeof w.text === 'function' ? w.text(u) : w.text}</span>
    </div>`).join('');
  return `<section class="prog-section" id="sec-warnings">
    ${sectionHeader('07', 'Warnings & Assumptions', 'hdr-warnings')}
    <div class="warnings-list">${items}</div>
  </section>`;
}

/* ────────────────────────────────────────────────
   ANCHOR NAV  –  injected into the back-nav bar
   ──────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Overview',     href: '#sec-overview' },
  { label: 'Strategy',     href: '#sec-strategy' },
  { label: 'Key Focus',    href: '#sec-focus' },
  { label: 'Phases',       href: '#sec-phases' },
  { label: 'Week by Week', href: '#sec-weeks' },
  { label: 'Guidance',     href: '#sec-guidance' },
  { label: 'Warnings',     href: '#sec-warnings' },
];

function injectSectionLinks() {
  const backNav = document.querySelector('.back-nav');
  if (!backNav) return;

  // Remove existing links wrapper before re-injecting to avoid duplication on unit toggle
  const existing = backNav.querySelector('.back-nav__section-links');
  if (existing) existing.remove();

  const wrap = document.createElement('div');
  wrap.className = 'back-nav__section-links';
  wrap.id = 'prog-section-links';
  wrap.setAttribute('aria-label', 'Sections');
  wrap.innerHTML = NAV_ITEMS.map(n =>
    `<a class="back-nav__section-link" href="${n.href}">${n.label}</a>`
  ).join('');
  backNav.appendChild(wrap);
}

function initAnchorNav() {
  const wrap = document.getElementById('prog-section-links');
  if (!wrap) return;
  const links = wrap.querySelectorAll('.back-nav__section-link');
  const sections = [...document.querySelectorAll('.prog-section')];

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    });
  });
}

/* ────────────────────────────────────────────────
   INLINE NAME EDITING
   ──────────────────────────────────────────────── */
function initInlineNameEdit(progId) {
  const titleEl = document.getElementById('prog-hero-title');
  if (!titleEl) return;

  titleEl.addEventListener('click', () => startEdit(titleEl, progId));
  titleEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startEdit(titleEl, progId); }
  });
}

function startEdit(titleEl, progId) {
  if (document.getElementById('prog-title-input')) return;

  titleEl.style.display = 'none';
  const input = document.createElement('input');
  input.id = 'prog-title-input';
  input.className = 'prog-hero__title-input';
  input.value = titleEl.textContent;
  input.setAttribute('aria-label', 'Programme name');
  titleEl.parentNode.insertBefore(input, titleEl);
  input.focus();
  input.select();

  const save = () => {
    const newName = input.value.trim() || titleEl.textContent;
    titleEl.textContent = newName;
    titleEl.style.display = '';
    input.remove();
    saveProgrammeName(progId, newName);
  };

  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { input.value = titleEl.textContent; save(); }
  });
}

function saveProgrammeName(progId, newName) {
  if (!progId) return;
  const params = new URLSearchParams(window.location.search);
  const key = params.get('sport') === 'running' ? 'running-programmes' : 'programmes';
  const saved = JSON.parse(localStorage.getItem(key) || '[]');
  const prog = saved.find(p => p.id === progId);
  if (!prog) return;
  prog.name = newName;
  localStorage.setItem(key, JSON.stringify(saved));
  // Update page title and URL param without reload
  document.title = newName + ' - Adaptive Training';
  const url = new URL(window.location.href);
  url.searchParams.set('name', newName);
  history.replaceState(null, '', url.toString());
}

function initDeleteBtn(progId) {
  const btn = document.getElementById('prog-delete-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!confirm('Delete this programme? This cannot be undone.')) return;
    const params = new URLSearchParams(window.location.search);
    const sport = params.get('sport') || 'cycling';
    const key = sport === 'running' ? 'running-programmes' : 'programmes';
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(saved.filter(p => p.id !== progId)));
    window.location.href = sport === 'running' ? 'running.html' : 'index.html';
  });
}

/* ────────────────────────────────────────────────
   MAIN RENDER
   ──────────────────────────────────────────────── */
   function initCardNotes() {
  const cards = document.getElementById('wbw-cards');
  if (!cards) return;
  cards.addEventListener('click', e => {
    const btn = e.target.closest('.wbw-card__note-btn');
    if (!btn) return;
    const idx = btn.dataset.idx;
    const note = document.getElementById(`card-note-${idx}`);
    if (!note) return;
    const isOpen = note.classList.toggle('is-open');
    btn.textContent = isOpen ? 'Coaching note ↑' : 'Coaching note ↓';
  });
}
function renderPage(name, d, progId, sport) {
  sport = sport || 'cycling';
  const demoBadge = d.demo ? '<span class="programme__demo-badge">Demo</span>' : '';
  const editHint  = (!d.demo && progId)
    ? ' title="Click to rename" tabindex="0" role="button" style="cursor:text"'
    : '';
  const main = document.getElementById('app-main');
  main.innerHTML = `
    <div class="prog-page">
      <div class="prog-content">
        <div class="prog-hero">
          <p class="prog-hero__eyebrow">Adaptive Training · ${sport === 'running' ? 'Running' : 'Cycling'}</p>
          <div class="prog-hero__title-row">
            <h1 class="prog-hero__title" id="prog-hero-title"${editHint}>${name}</h1>
            ${demoBadge}
            ${!d.demo && progId ? `<button class="prog-hero__delete" id="prog-delete-btn" aria-label="Delete programme">
              <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
  <rect x="5" y="6" width="6" height="7" rx="1" stroke="currentColor" stroke-width="1.4"/>
  <path d="M3.5 4.5h9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M6 4.5V3.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M7 8.5v2.5M9 8.5v2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
</svg>
              Delete
            </button>` : ''}
          </div>
          <p class="prog-hero__meta">${d.meta.event}</p>
          <p class="prog-hero__meta prog-hero__meta--stats">${d.meta.weeks} weeks · Starting now → ${d.meta.eventDate}</p>
        </div>
        ${renderProfile(d)}
        ${renderStrategy(d)}
        ${renderKeyFocus(d)}
        ${renderPhaseOverview(d)}
        ${renderWeekByWeek(d)}
        ${renderGuidance(d)}
        ${renderWarnings(d)}
        <div class="prog-footer">
          <p>Adaptive Training · Powered by your answers</p>
        </div>
      </div>
    </div>`;

  initAnchorNav();
  if (!d.demo && progId) initInlineNameEdit(progId);
  if (!d.demo && progId) initDeleteBtn(progId);
  initCardNotes();
}

/* ────────────────────────────────────────────────
   BOOT
   ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  history.scrollRestoration = 'manual';
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);
  const params = new URLSearchParams(window.location.search);
  const id   = params.get('id') || '';
  const name = params.get('name') || 'My Programme';

  /* Demo programme always uses hardcoded DEMO data */
  if (id === 'three-bros-prep') {
    document.body.dataset.backLabel = 'Cycling';
    document.body.dataset.backHref  = 'cycling.html';
    initBackNav();
    renderPage(DEMO.name, DEMO, null);
    injectSectionLinks();
    document.addEventListener('unitsChanged', () => renderPage(DEMO.name, DEMO, null));
    return;
  }

  /* Saved programmes */
  const params2 = new URLSearchParams(window.location.search);
  const sport   = params2.get('sport') || 'cycling';
  const storageKey = sport === 'running' ? 'running-programmes' : 'programmes';
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const found = saved.find(p => p.id === id);

  if (!found) {
    document.getElementById('app-main').innerHTML =
      '<div style="max-width:640px;margin:2rem auto;padding:3rem 2rem;text-align:center;">' +
        '<p style="font-size:1.1rem;font-weight:600;color:#bbb;">Programme not found.</p>' +
        '<a href="cycling.html" style="display:inline-block;margin-top:1rem;font-size:0.875rem;color:#2563eb;">← Back to cycling</a>' +
      '</div>';
    return;
  }

  document.body.dataset.backLabel = sport === 'running' ? 'Running' : 'Cycling';
  document.body.dataset.backHref  = sport === 'running' ? 'running.html' : 'cycling.html';
  initBackNav();

  /* Generated programme - use full template */
  if (found.generated) {
    function renderGenerated() {
      const currentName = found.name;
      const unit = localStorage.getItem('units') || 'mi';

      // Use the frozen generated output saved at creation time.
      // This means logic changes do not affect existing saved plans.
      // To pick up logic changes, the user must create a new plan.
      const d = { ...found.generated, unit, name: currentName };

      // Unit conversion is still live — distances re-render in mi/km based on settings.
      renderPage(currentName, d, id, sport);
      injectSectionLinks();
    }
    renderGenerated();
    document.addEventListener('unitsChanged', renderGenerated);
    return;
  }

  /* Basic render for user-created programmes (old phase-based data) */
  function renderSaved() {
    const phases = found.phases || [];
    const totalWeeks = phases.reduce((a, p) => a + p.weeks.length, 0);
    const totalMi = phases.reduce((a, p) =>
      a + p.weeks.reduce((b, w) => b + w.rides.reduce((c, r) => c + r, 0), 0), 0);

    const phasesHtml = phases.map(phase => {
      const weekEnd = phase.weekStart + phase.weeks.length - 1;
      const rangeLabel = phase.weeks.length > 1
        ? 'Weeks ' + phase.weekStart + '–' + weekEnd
        : 'Week ' + phase.weekStart;
      const rows = phase.weeks.map((week, i) => {
        const weekNum = phase.weekStart + i;
        const total = week.rides.reduce((a, b) => a + b, 0);
        return `<div class="week-row">
          <span class="week-row__num">Wk ${weekNum}</span>
          <div class="week-row__rides">${week.rides.map((r, ri) =>
            (ri > 0 ? '<span class="ride-plus">+</span>' : '') +
            `<span class="ride-pill${ri === 0 ? ' ride-pill--primary' : ''}">${cvt(r)} ${ul()}</span>`
          ).join('')}</div>
          ${week.rides.length > 1 ? `<span class="week-row__total">${cvt(total)} ${ul()}</span>` : '<span class="week-row__total"></span>'}
        </div>`;
      }).join('');
      return `<div class="phase phase--${phase.id}">
        <div class="phase__header">
          <span class="phase__name">${phase.name}</span>
          <span class="phase__range">${rangeLabel}</span>
        </div>
        <div class="week-list">${rows}</div>
      </div>`;
    }).join('');

    document.getElementById('app-main').innerHTML = `
      <div class="programme">
        <p class="programme__meta">Your programme</p>
        <h1 class="programme__title">${name}</h1>
        <p class="programme__summary">${totalWeeks} weeks &middot; ${cvt(totalMi).toLocaleString()} ${ul()} total</p>
        ${phasesHtml}
      </div>`;
  }

  renderSaved();
  document.addEventListener('unitsChanged', renderSaved);
});

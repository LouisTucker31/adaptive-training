/* ── Running Logic Engine ──
   generateRunningProgramme(answers) → programme data object for programme.js
   ------------------------------------------------------------------ */

/* ════════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════════ */

const RUN_MI_TO_KM = 1.60934;

function runFriendly(n, unit) {
  if (unit === 'km') return Math.round(n / 1) * 1; // round to nearest 1km for running
  return Math.round(n / 0.5) * 0.5; // round to nearest 0.5mi for running
}

function runDisplay(miles, unit) {
  const raw = unit === 'km' ? miles * RUN_MI_TO_KM : miles;
  return runFriendly(raw, unit);
}

/* ════════════════════════════════════════════════════════════════
   RACE DISTANCE LOOKUP
   Maps raceDistance answer values to miles for internal use
   ════════════════════════════════════════════════════════════════ */

function getRaceDistanceMiles(answers) {
  const map = {
    '5k':       3.1,
    '10k':      6.2,
    'half':     13.1,
    'marathon': 26.2,
  };
  if (answers.raceDistance && map[answers.raceDistance]) {
    return map[answers.raceDistance];
  }
  // Ultra or other — use ultraDistance free-text input
  if (answers.ultraDistance) {
    const raw = parseFloat(answers.ultraDistance);
    if (!isNaN(raw)) {
      const entryUnit = answers.entryUnit || answers.unit || 'mi';
      return entryUnit === 'km' ? raw / RUN_MI_TO_KM : raw;
    }
  }
  return null;
}

/* ════════════════════════════════════════════════════════════════
   1. DERIVE PROFILE
   ════════════════════════════════════════════════════════════════ */

function deriveRunningProfile(answers) {
  const unit      = answers.unit      || 'mi';
  const entryUnit = answers.entryUnit || unit;

  // ── Programme model ──
  const modelMap = {
    event:    'Event plan',
    distance: answers.weeksToEvent ? 'Dated distance goal' : 'Flexible distance progression',
    fitness:  'Rolling fitness block',
    new:      'Beginner running block',
  };
  const model = modelMap[answers.goal] || 'Event plan';

  // ── Race/target distance ──
  let eventDist = null;
  if (answers.goal === 'event') {
    eventDist = getRaceDistanceMiles(answers);
  }
  if (answers.goal === 'distance' && answers.targetDistance) {
    const raw = parseFloat(answers.targetDistance);
    if (!isNaN(raw)) {
      eventDist = entryUnit === 'km' ? raw / RUN_MI_TO_KM : raw;
    }
  }

  // ── Surface and terrain ──
  const surface = answers.surface || 'road';
  const terrain = answers.elevation || 'flat';
  const isTrail = surface === 'trail' || surface === 'mixed';

  // ── Athlete state ──
  const recentScore   = runScoreRecent(answers);
  const historicScore = runScoreHistoric(answers);
  const athleteState  = runClassifyAthlete(recentScore, historicScore);

  // ── Demand category ──
  const demandCat = runClassifyDemand(eventDist, answers);

  // ── Risk level — higher for running due to injury prevalence ──
  const riskLevel = runClassifyRisk(answers, recentScore, eventDist, answers.weeksToEvent);

  // ── Progression tolerance ──
  const progressionTolerance = athleteState === 'highly_trained' ? 'aggressive'
    : athleteState === 'novice' ? 'conservative'
    : riskLevel === 'high' ? 'conservative'
    : 'moderate';

  // ── Training availability ──
  const daysPerWeek = parseInt(answers.daysPerWeek) || 3;
  const longRunDay  = answers.longRunDay || 'weekend';
  const availType   = daysPerWeek <= 2 ? 'constrained'
    : longRunDay === 'weekend' ? 'balanced'
    : 'flexible';

  // ── Weeks to event ──
  const weeksToEvent = parseInt(answers.weeksToEvent) || 12;

  return {
    unit,
    model,
    eventDist,
    athleteState,
    demandCat,
    riskLevel,
    progressionTolerance,
    terrain,
    surface,
    isTrail,
    daysPerWeek,
    longRunDay,
    availType,
    recentScore,
    historicScore,
    goal:        answers.goal,
    raceDistance: answers.raceDistance || null,
    goalFinish:  answers.goalFinish  || 'comfortable',
    injury:      answers.injury      || 'none',
    energy:      answers.energy      || 'good',
    tools:       answers.tools       || 'none',
    fuelling:    answers.fuelling    || 'some',
    otherSports: answers.otherSports || 'none',
    background:  answers.background  || 'recreational',
    doneBefore:  answers.doneBefore  || 'first',
    weeksToEvent,
    consistency: answers.consistency || 'fairly',
    fitnessGoal: answers.fitnessGoal || null,
    longestRecent: answers.longestRecent || null,
    targetTime:  answers.targetTime  || null,
  };
}

/* ── Scoring helpers ── */

function runScoreRecent(answers) {
  let score = 0;

  // Weekly mileage
  const vol = answers.weeklyMileage || '10-25km';
  const volScores = {
    '0':       0,
    '<10km':   0.5,
    '10-25km': 1,
    '25-50km': 2,
    '50-80km': 3,
    '80km+':   4,
  };
  score += volScores[vol] || 1;

  // Consistency
  const con = answers.consistency || 'fairly';
  const conScores = { barely: 0, occasional: 0.5, fairly: 1, very: 2 };
  score += conScores[con] || 1;

  // Longest recent run
  const recent = answers.longestRecent || '<3mi';
  const recentMi = parseRunDistance(recent);
  score += recentMi < 3  ? 0
         : recentMi < 6  ? 0.5
         : recentMi < 13 ? 1
         : recentMi < 26 ? 1.5
         : 2;

  return Math.min(score / 8 * 4, 4);
}

function runScoreHistoric(answers) {
  let score = 0;

  const bg = answers.background || 'recreational';
  const bgScores = { new: 0, recreational: 1, experienced: 3, returning: 2 };
  score += bgScores[bg] || 1;

  const ever = answers.longestEver || '<3mi';
  const everMi = parseRunDistance(ever);
  score += everMi < 6  ? 0
         : everMi < 13 ? 1
         : everMi < 26 ? 2
         : everMi < 50 ? 3
         : 4;

  const done = answers.doneBefore || 'first';
  score += done === 'same' ? 2 : done === 'similar' ? 1 : 0;

  return Math.min(score / 9 * 4, 4);
}

function parseRunDistance(val) {
  // Returns approximate miles
  const map = {
    // mi options
    '<3mi':    2,
    '3-6mi':   4.5,
    '6-13mi':  9,
    '13-26mi': 19,
    '26mi+':   32,
    '26-50mi': 38,
    '50mi+':   60,
    // km options
    '<5km':    2.5,
    '5-10km':  7,
    '10-21km': 15,
    '21-42km': 31,
    '42km+':   50,
    '42-80km': 55,
    '80km+':   70,
  };
  return map[val] || 5;
}

function runClassifyAthlete(recentScore, historicScore) {
  if (recentScore < 1.5 && historicScore < 1.5) return 'novice';
  if (recentScore < 1.5 && historicScore >= 2)  return 'detrained';
  if (recentScore >= 3   && historicScore >= 2.5) return 'highly_trained';
  return 'moderate';
}

function runClassifyDemand(eventDist, answers) {
  if (!eventDist) return answers.goal === 'new' ? 'beginner' : 'fitness';
  if (eventDist >= 26)  return 'ultra';       // marathon+
  if (eventDist >= 13)  return 'long_endurance'; // half marathon+
  if (eventDist >= 6)   return 'endurance';    // 10k+
  return 'short_endurance';                    // 5k
}

function runClassifyRisk(answers, recentScore, eventDist, weeksToEvent) {
  let risk = 0;
  if (answers.injury === 'ongoing') risk += 3;
  if (answers.injury === 'minor')   risk += 1;
  if (answers.energy === 'poor')    risk += 2;
  if (answers.energy === 'mixed')   risk += 1;
  if (answers.otherSports === 'hard') risk += 1; // less impact than cycling — running fatigue is more specific
  if (recentScore < 1.5)            risk += 1;

  // Running has higher injury risk from rapid mileage increase — stricter timeline risk
  if (eventDist && weeksToEvent) {
    const weeksNeeded = eventDist >= 26 ? 16 : eventDist >= 13 ? 12 : eventDist >= 6 ? 8 : 6;
    if (weeksToEvent < weeksNeeded * 0.6) risk += 3;
    else if (weeksToEvent < weeksNeeded * 0.8) risk += 1;
  }

  return risk >= 4 ? 'high' : risk >= 2 ? 'moderate' : 'low';
}

/* ════════════════════════════════════════════════════════════════
   2. SELECT STRATEGY
   ════════════════════════════════════════════════════════════════ */

function runSelectStrategy(profile) {
  const { athleteState, demandCat, goalFinish, availType, terrain, isTrail } = profile;
  const parts = [];

  if (athleteState === 'novice')        parts.push('run/walk progression from a low base');
  else if (athleteState === 'detrained') parts.push('careful mileage rebuild from a strong foundation');
  else if (athleteState === 'highly_trained') parts.push('structured progressive overload with race-specific work');
  else parts.push('steady mileage progression with balanced recovery');

  if (isTrail)                                    parts.push('trail-specific climbing and technical running');
  if (terrain === 'hilly' || terrain === 'mountainous') parts.push('hill training sessions in build and specific phases');
  if (goalFinish === 'time' || goalFinish === 'competitive') parts.push('pace work and tempo running in later phases');
  if (availType === 'constrained')                parts.push('concentrated training on available days');

  return parts;
}

/* ════════════════════════════════════════════════════════════════
   3. ALLOCATE PHASES
   ════════════════════════════════════════════════════════════════ */

function runAllocatePhases(profile) {
  const { goal, weeksToEvent, athleteState, demandCat, riskLevel } = profile;
  const total = weeksToEvent;

  // Fitness / new — repeating blocks
  if (goal === 'fitness' || goal === 'new') {
    const blockSize = total <= 8 ? 3 : 4;
    const blocks = [];
    let w = 1;
    while (w <= total) {
      const len = Math.min(blockSize, total - w + 1);
      const isStep = blocks.length > 0 && blocks.length % 2 === 1;
      blocks.push({
        id:        isStep ? 'consolidate' : (blocks.length === 0 ? 'foundation' : 'progress'),
        name:      isStep ? 'Consolidate' : (blocks.length === 0 ? 'Foundation' : 'Progress'),
        weekStart: w,
        weekCount: len,
      });
      w += len;
    }
    return blocks;
  }

  // Distance goal — Foundation → Build → (Specific) → Target
  if (goal === 'distance') {
    const foundation = athleteState === 'novice' ? Math.ceil(total * 0.3) : Math.ceil(total * 0.2);
    const specific   = total >= 10 ? Math.ceil(total * 0.15) : 0;
    const target     = 1;
    const build      = total - foundation - specific - target;
    return [
      { id: 'foundation', name: 'Foundation', weekStart: 1,                       weekCount: foundation },
      { id: 'build',      name: 'Build',      weekStart: 1 + foundation,           weekCount: Math.max(build, 1) },
      ...(specific > 0 ? [{ id: 'specific', name: 'Specific', weekStart: 1 + foundation + build, weekCount: specific }] : []),
      { id: 'event',      name: 'Target Run',  weekStart: total,                   weekCount: 1 },
    ];
  }

  // Event route
  const hasPeak = total >= 8;
  // Running taper: 2 weeks for marathon+, 1 week for shorter
  const taper   = total <= 6 ? 0 : (demandCat === 'ultra' || demandCat === 'long_endurance') ? 2 : 1;
  const peak    = hasPeak ? 1 : 0;
  const event   = total <= 4 ? 0 : 1;

  let foundation, build, specific;

  if (total <= 8) {
    foundation = total <= 5 ? 1 : athleteState === 'novice' ? 2 : 1;
    specific   = total <= 5 ? 1 : 1;
    build      = total - foundation - specific - peak - taper - event;
  } else if (total <= 12) {
    foundation = athleteState === 'novice' ? 4 : athleteState === 'highly_trained' ? 2 : 3;
    specific   = demandCat === 'ultra' || demandCat === 'long_endurance' ? 3 : 2;
    build      = total - foundation - specific - peak - taper - event;
  } else if (total <= 18) {
    foundation = athleteState === 'novice' ? 5 : athleteState === 'highly_trained' ? 3 : 4;
    specific   = demandCat === 'ultra' || demandCat === 'long_endurance' ? 4 : 3;
    build      = total - foundation - specific - peak - taper - event;
  } else {
    foundation = athleteState === 'novice' ? 7 : athleteState === 'highly_trained' ? 4 : 5;
    specific   = demandCat === 'ultra' || demandCat === 'long_endurance' ? 5 : 3;
    build      = total - foundation - specific - peak - taper - event;
  }

  build = Math.max(build, 2);

  let prepeakRecovery = 0;
  if (hasPeak) {
    if (specific > 2) { specific -= 1; prepeakRecovery = 1; }
    else if (build > 2) { build -= 1; prepeakRecovery = 1; }
  }

  const phases = [];
  let w = 1;
  const add = (id, name, count) => {
    if (count > 0) { phases.push({ id, name, weekStart: w, weekCount: count }); w += count; }
  };

  add('foundation',       'Foundation',    foundation);
  add('build',            'Build',         build);
  add('specific',         'Specific',      specific);
  add('prepeak_recovery', 'Pre-Race Rest', prepeakRecovery);
  if (hasPeak) add('peak', 'Peak', peak);
  add('taper',            'Taper',         taper);
  add('event',            'Race',          event);

  return phases;
}

/* ════════════════════════════════════════════════════════════════
   4. BUILD WEEKS
   Running uses long run as the primary target (in miles or km).
   Secondary runs are expressed as fractions of the long run.
   The 10% rule is strictly enforced — maxWeeklyRise is lower than cycling.
   ════════════════════════════════════════════════════════════════ */

function runBuildWeeks(profile, phases) {
  const { athleteState, riskLevel, daysPerWeek, availType,
          terrain, isTrail, goalFinish, unit, tools, eventDist } = profile;

  // Anchor = race/target distance in miles
  // For fitness/new goals with no target, use a sensible ceiling by athlete state
  const fitnessAnchor = (() => {
    if (profile.goal === 'event' || profile.goal === 'distance') return null;
    if (athleteState === 'highly_trained') return 22;
    if (athleteState === 'detrained')      return 18;
    if (athleteState === 'novice')         return 12;
    return 16;
  })();
  const anchor = eventDist || fitnessAnchor || 13;

  // Start percentage — where week 1 long run sits as % of anchor
  const startPct = athleteState === 'novice'        ? 0.20
    : athleteState === 'detrained'    ? 0.25
    : athleteState === 'highly_trained' ? 0.40
    : 0.30;

  // Peak long run as % of race distance — lower than cycling because running peak
  // long runs are typically 70-85% of race distance, not 100%
  let peakPct = (() => {
    const { demandCat } = profile;
    if (demandCat === 'ultra')          return 0.65; // ultra peak ~65% of race dist
    if (demandCat === 'long_endurance') return 0.78; // marathon peak ~78% (20mi for marathon)
    if (demandCat === 'endurance')      return 0.85; // 10k peak ~85%
    return 0.90;                                      // 5k peak ~90%
  })();

  // Cap for novice/injury
  if (profile.goal !== 'event') {
    if (athleteState === 'novice' && profile.injury === 'ongoing') peakPct = Math.min(peakPct, 0.60);
    else if (athleteState === 'novice' && profile.injury === 'minor') peakPct = Math.min(peakPct, 0.70);
    else if (athleteState === 'novice') peakPct = Math.min(peakPct, 0.80);
  }

  // Start override from longestRecent — same concept as cycling
  let startOverrideMiles = null;
  if (profile.goal !== 'event' && profile.longestRecent) {
    const recentMiles = parseRunDistance(profile.longestRecent);
    const fromRecent = Math.max(1, runRoundTarget(recentMiles * 0.65));
    startOverrideMiles = Math.min(fromRecent, runRoundTarget(anchor * startPct));
  }

  // Running uses stricter weekly mileage increase — 8% novice, 10% others
  // (same as cycling but enforced more strictly due to injury risk)
  const maxWeeklyRise = (athleteState === 'novice' || riskLevel === 'high') ? 0.07 : 0.10;

  // 3-on/1-off for most runners. Only constrained (1-2 days) use alternating.
  const useAlternating = daysPerWeek <= 2;
  const hardBlockSize  = (athleteState === 'novice' || riskLevel === 'high') ? 2 : 3;
  let hardWeekStreak   = 0;

  const consolidationFactor = 0.50;
  const consolidationFloor  = 2;  // 2mi minimum for running consolidation week
  const recoveryFloor        = 1;  // 1mi minimum recovery run

  const weeks = [];
  let planWeekIndex = 0;

  phases.forEach(phase => {
    const { id, name, weekStart, weekCount } = phase;

    const eventPct = profile.goal === 'distance' ? 1.0 : peakPct * 0.15; // race week = tiny shakeout

    const lastHardMiles = weeks.length > 0
      ? ([...weeks].reverse().find(w => !w.isRecovery && !w.isConsolidation) || weeks[weeks.length - 1]).mainTarget
      : null;
    const lastHardPct = lastHardMiles !== null ? lastHardMiles / anchor : null;

    const phaseStartPct = id === 'foundation'        ? startPct
      : id === 'build'            ? startPct + (peakPct - startPct) * 0.25
      : id === 'specific'         ? startPct + (peakPct - startPct) * 0.55
      : id === 'peak'             ? peakPct
      : id === 'taper'            ? peakPct * 0.40
      : id === 'event'            ? eventPct
      : id === 'prepeak_recovery' ? peakPct * 0.55
      : id === 'consolidate'      ? (lastHardPct !== null ? lastHardPct * 0.85 : startPct * 0.9)
      : id === 'progress'         ? (lastHardPct !== null ? lastHardPct * 1.0  : startPct + (peakPct - startPct) * 0.4)
      : startPct;

    const foundationEndPct = (profile.goal === 'distance' || profile.goal === 'fitness' || profile.goal === 'new')
      ? startPct + (peakPct - startPct) * 0.40
      : startPct + (peakPct - startPct) * 0.25;

    const phaseEndPct = id === 'foundation'        ? foundationEndPct
      : id === 'build'            ? startPct + (peakPct - startPct) * 0.55
      : id === 'specific'         ? peakPct * 0.80
      : id === 'peak'             ? peakPct
      : id === 'taper'            ? peakPct * 0.30
      : id === 'event'            ? eventPct
      : id === 'prepeak_recovery' ? peakPct * 0.55
      : id === 'consolidate'      ? (lastHardPct !== null ? lastHardPct * 0.90 : startPct)
      : id === 'progress'         ? (lastHardPct !== null ? Math.min(lastHardPct * 1.35, peakPct) : startPct + (peakPct - startPct) * 0.7)
      : phaseStartPct;

    const linearPhase = id === 'foundation';

    const structureExempt = id === 'taper' || id === 'event' || id === 'prepeak_recovery'
      || id === 'consolidate' || id === 'progress' || id === 'peak';
    const phaseForceRecovery = id === 'prepeak_recovery';

    if (id !== 'foundation') hardWeekStreak = 0;

    for (let i = 0; i < weekCount; i++) {
      const wkNum       = weekStart + i;
      const phaseProgress = weekCount > 1 ? i / (weekCount - 1) : 0;

      let isRecovery     = false;
      let isConsolidation = false;

      if (phaseForceRecovery) {
        isRecovery = true;
      } else if (!structureExempt && !linearPhase) {
        if (useAlternating) {
          isConsolidation = (planWeekIndex % 2 === 1);
        } else {
          isRecovery = hardWeekStreak >= hardBlockSize;
          if (isRecovery) hardWeekStreak = 0;
          else hardWeekStreak++;
        }
      }

      if (!linearPhase) planWeekIndex++;

      let targetPct = runLerp(phaseStartPct, phaseEndPct, phaseProgress);

      if (isRecovery) {
        targetPct *= runRecoveryFactor(athleteState, riskLevel);
      } else if (isConsolidation) {
        targetPct *= consolidationFactor;
      } else if (id === 'consolidate') {
        const easeFactor = 0.75 + phaseProgress * 0.10;
        targetPct *= easeFactor;
      } else if (id === 'progress') {
        const progressWave = (i % 3 === 2) ? 0.92 : 1.0;
        targetPct *= progressWave;
      } else if ((id === 'build' || id === 'specific') && !isRecovery) {
        const wave = Math.sin(i * 1.2) * 0.02;
        targetPct = Math.max(targetPct + wave, phaseStartPct * 0.85);
      }

      let mainTarget = runRoundTarget(anchor * targetPct);

      // Pin week 1 to current fitness for non-event goals
      if (startOverrideMiles !== null && weeks.length === 0) {
        mainTarget = startOverrideMiles;
      }

      if (isConsolidation) {
        mainTarget = Math.max(mainTarget, consolidationFloor);
      }

      if (isRecovery && weeks.length > 0) {
        const lastHard = [...weeks].reverse().find(w => !w.isRecovery && !w.isConsolidation);
        if (lastHard) {
          mainTarget = Math.min(mainTarget, runRoundTarget(lastHard.mainTarget * runRecoveryFactor(athleteState, riskLevel)));
        }
        mainTarget = Math.max(mainTarget, recoveryFloor);
      }

      // Cap week-on-week increase — strict 10% rule for running
      const isTargetWeek = (id === 'event' && profile.goal === 'distance') || id === 'peak';
      if (!isRecovery && !isConsolidation && !isTargetWeek && weeks.length > 0) {
        const prevHard = [...weeks].reverse().find(w => !w.isRecovery && !w.isConsolidation);
        if (prevHard) {
          const minStep = 0.5; // minimum 0.5mi growth per week
          const pctCap  = runRoundTarget(prevHard.mainTarget * (1 + maxWeeklyRise));
          const cap     = Math.max(pctCap, prevHard.mainTarget + minStep);
          mainTarget = Math.min(mainTarget, cap);
        }
      }

      // Hard ceiling at race/target distance
      if (anchor > 0) {
        mainTarget = Math.min(mainTarget, runRoundTarget(anchor));
      }

      // Progress phase minimum growth
      if (id === 'progress' && !isRecovery && !isConsolidation && weeks.length > 0) {
        const lastHard = [...weeks].reverse().find(w => !w.isRecovery && !w.isConsolidation);
        if (lastHard && mainTarget <= lastHard.mainTarget) {
          const minStep = 0.5;
          const maxStep = runRoundTarget(lastHard.mainTarget * maxWeeklyRise);
          mainTarget = lastHard.mainTarget + Math.max(minStep, maxStep);
          mainTarget = runRoundTarget(mainTarget);
        }
      }

      // ── Secondary run targets ──
      // Running secondary sessions are fractions of the long run.
      // Medium run: ~60-70% of long run (tempo/steady effort)
      // Easy runs: ~40-50% of long run (recovery/easy effort)
      // These are all long-run distances — weekly total isn't shown, just individual sessions.
      const prevHardWeek = weeks.length > 0
        ? [...weeks].reverse().find(w => !w.isRecovery && !w.isConsolidation)
        : null;

      const isStructuralDown = isRecovery || isConsolidation || id === 'taper' || id === 'prepeak_recovery';
      const isEventWeek      = id === 'event';

      // Run 2: medium run (~65% of long run)
      const run2Frac = (isRecovery || isConsolidation) ? 0.55 : 0.65;
      const rawRun2  = runRoundTarget(mainTarget * run2Frac);
      const supportTarget = daysPerWeek >= 2 && !isEventWeek ? (() => {
        if (isStructuralDown || !prevHardWeek?.supportTarget) return rawRun2;
        return Math.max(rawRun2, runRoundTarget(prevHardWeek.supportTarget * 0.80));
      })() : null;

      // Run 3: easy run (~45% of long run)
      const run3Frac = (isRecovery || isConsolidation) ? 0.35 : 0.45;
      const rawRun3  = runRoundTarget(mainTarget * run3Frac);
      const midweekTarget = daysPerWeek >= 3 && !isEventWeek ? (() => {
        if (isStructuralDown || !prevHardWeek?.midweekTarget) return rawRun3;
        return Math.max(rawRun3, runRoundTarget(prevHardWeek.midweekTarget * 0.80));
      })() : null;

      // Run 4: easy run (~35% of long run) — 4 day athletes
      const run4Frac = (isRecovery || isConsolidation) ? 0.30 : 0.35;
      const rawRun4  = runRoundTarget(mainTarget * run4Frac);
      const midweek2Target = daysPerWeek >= 4 && !isEventWeek ? (() => {
        if (isStructuralDown || !prevHardWeek?.midweek2Target) return rawRun4;
        return Math.max(rawRun4, runRoundTarget(prevHardWeek.midweek2Target * 0.80));
      })() : null;

      const intensity = runDeriveIntensity(id, isRecovery || isConsolidation, goalFinish, tools, athleteState, i, weekCount);

      weeks.push({
        wk: wkNum,
        phase: name,
        phaseId: id,
        isRecovery,
        isConsolidation,
        mainTarget,
        supportTarget,
        midweekTarget,
        midweek2Target,
        midweek3Target: null, // running max 4 sessions
        b2bTarget: null,
        loaded: false,
        lightLoaded: false,
        b2b: false,
        intensity,
        note: '',
        useDuration: false,
      });
    }
  });

  // Pass 2: notes
  weeks.forEach(w => {
    w.note = buildRunWeekNote(
      w.phaseId, w.wk, w.isRecovery, w.isConsolidation,
      terrain, isTrail, tools, w.mainTarget, unit, goalFinish,
      phases.find(p => p.id === w.phaseId)
        ? (w.wk - phases.find(p => p.id === w.phaseId).weekStart) / Math.max(1, phases.find(p => p.id === w.phaseId).weekCount - 1)
        : 0,
      athleteState, profile.goal, profile.fitnessGoal,
      profile.injury, profile.fuelling, profile.energy, profile.raceDistance
    );
  });

  return weeks;
}

function runLerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

function runRecoveryFactor(athleteState, riskLevel) {
  if (riskLevel === 'high' || athleteState === 'novice') return 0.60;
  if (athleteState === 'detrained')     return 0.65;
  if (athleteState === 'highly_trained') return 0.75;
  return 0.70;
}

function runRoundTarget(val) {
  // Round to nearest 0.5mi for running (friendlier than 5mi cycling increments)
  return Math.round(val * 2) / 2;
}

function runDeriveIntensity(phaseId, isRecovery, goalFinish, tools, athleteState, weekIndex, weekCount) {
  if (isRecovery || phaseId === 'event' || phaseId === 'taper' || phaseId === 'prepeak_recovery') return 'Easy';
  if (phaseId === 'foundation') return 'Easy';
  if (phaseId === 'peak') return 'Easy / Moderate';

  const wantsIntensity = goalFinish === 'time' || goalFinish === 'competitive';
  const canIntensity   = athleteState === 'moderate' || athleteState === 'highly_trained';
  const latePhase      = weekIndex / weekCount > 0.5;

  if (phaseId === 'specific') {
    if (wantsIntensity && canIntensity && latePhase) return 'Moderate / Tempo';
    return 'Easy / Moderate';
  }
  if (phaseId === 'build') {
    if (wantsIntensity && canIntensity && latePhase) return 'Easy / Moderate';
    return 'Easy';
  }
  return 'Easy';
}

/* ════════════════════════════════════════════════════════════════
   WEEK NOTES
   ════════════════════════════════════════════════════════════════ */

function buildRunWeekNote(phaseId, wkNum, isRecovery, isConsolidation,
    terrain, isTrail, tools, mainTarget, unit, goalFinish, phaseProgress,
    athleteState, goal, fitnessGoal, injury, fuelling, energy, raceDistance) {

  // ── Fixed phase notes ──
  if (phaseId === 'event') {
    if (goal === 'distance') return 'This is your target run. Start conservatively - the first half should feel well within your limit. Take on fuel and fluids from early on.';
    return 'Race day shakeout only - 10-15 minutes easy jogging to loosen up. Rest, eat well, stay off your feet.';
  }
  if (phaseId === 'taper') return phaseProgress < 0.5
    ? 'Cut mileage significantly. Keep a couple of short, sharp efforts to stay sharp. Trust the training - the fitness is there.'
    : 'Final prep. Short easy run only. Rest more than you think you need to.';
  if (phaseId === 'prepeak_recovery') return 'Deliberate down week before your biggest training block. Keep runs short and easy. Prioritise sleep and nutrition - your body is absorbing everything you have built.';
  if (isRecovery) {
    if (energy === 'poor') return 'Recovery week. Your energy is already stretched - treat this as a genuine reset. Easy running only, no pressure.';
    if (injury === 'ongoing') return 'Recovery week. Keep all efforts easy and monitor how the injury responds. Do not push through discomfort.';
    return 'Planned recovery week. Keep effort easy and conversational. Let the adaptation happen.';
  }
  if (isConsolidation) {
    return 'Short week. This should feel noticeably lighter. The legs need to clear before next week.';
  }
  if (phaseId === 'consolidate') {
    if (phaseProgress < 0.35) return 'Step-back week. Mileage is reduced deliberately - your body is absorbing the foundation work. Keep it easy.';
    if (phaseProgress < 0.7)  return 'Consolidation continues. Easy effort throughout. Focus on running relaxed and smooth.';
    return 'Final consolidation week. You should be feeling fresher. The progress block starts next.';
  }

  const notes = [];

  // ── Terrain / surface ──
  if (isTrail) {
    if (phaseId === 'specific' && phaseProgress < 0.5) notes.push('Get on trail where possible - technical footing and climbing are skills that need time before race day.');
    else if (phaseId === 'specific') notes.push('Your trail legs should be building. Focus on climbing efficiency and confident descending.');
    else if (phaseId === 'peak') notes.push('Choose your most representative trail for the long run. Practise race-day pacing on the climbs.');
    else if (phaseId === 'build' && phaseProgress > 0.4) notes.push('Include trail running where you can. Time on technical terrain builds confidence alongside fitness.');
  } else if (terrain === 'hilly' || terrain === 'mountainous') {
    if (phaseId === 'specific' && phaseProgress < 0.5) notes.push('Prioritise hills - choose your hilliest route for the long run.');
    else if (phaseId === 'specific') notes.push('Your climbing legs are building. Practise pacing the uphills conservatively - start slower than you think you need to.');
    else if (phaseId === 'peak') notes.push('Hilly long run. Practise your race-day effort on the climbs.');
    else if (phaseId === 'build' && phaseProgress > 0.4) notes.push('Add hills where you can. Climbing fitness accumulates gradually - keep including them.');
  }

  // ── Tools ──
  if (wkNum <= 2) {
    if (tools && tools.includes('hrm'))   notes.push('Keep easy runs genuinely easy - use your heart rate to verify, not just feel.');
    if (tools && tools.includes('gps'))   notes.push('Use your GPS watch to check pace - most runners go too fast on easy days.');
    if (tools && tools.includes('power')) notes.push('Run to power on easy sessions - stay below your easy power threshold.');
  }

  // ── Goal-specific notes ──
  if (goal === 'new') {
    if (phaseId === 'foundation') {
      if (phaseProgress < 0.25) notes.push('First runs - walk when you need to. Getting out and moving is the only goal right now.');
      else if (phaseProgress < 0.6) notes.push('You are building a habit. Consistency matters far more than pace or distance at this stage.');
      else notes.push('Starting to feel more comfortable? Good. Keep the effort easy - it should feel almost too easy.');
    }
    if (phaseId === 'consolidate') notes.push('Lighter week. Use it to rest and notice how your body is responding.');
    if (phaseId === 'progress')    notes.push('Small steps forward. If it feels easy, that is fine - it is supposed to.');
  }

  else if (goal === 'fitness') {
    if (phaseId === 'foundation') {
      if (phaseProgress < 0.25) notes.push('Establish your routine. Same days each week if you can - the habit is the foundation.');
      else if (phaseProgress < 0.6) notes.push('Keep efforts conversational. If you cannot hold a full sentence, slow down.');
      else notes.push('Foundation is bedding in. You should be feeling more comfortable at these distances.');
    }
    if (phaseId === 'consolidate') {
      if (fitnessGoal === 'speed') notes.push('Easier week. Speed work needs fresh legs - this rest makes the next block more effective.');
      else notes.push('Step-back week. Use the extra energy to sleep well and let the training settle.');
    }
    if (phaseId === 'progress') {
      if (phaseProgress < 0.3) notes.push('Progress block begins. Notice how these runs feel compared to when you started.');
      else if (phaseProgress < 0.55) {
        if (fuelling === 'little' || fuelling === 'none') notes.push('Start practising nutrition on runs over 60 minutes. A gel or snack every 45 minutes - even if you do not feel hungry.');
        else notes.push('Building steadily. Keep the effort sustainable - these weeks are meant to accumulate, not exhaust.');
      }
      else if (phaseProgress < 0.85) notes.push('Stay focused on completing each run at a steady, controlled effort.');
      else notes.push('Final progress week. Rest well after the long run.');
    }
  }

  else if (goal === 'distance') {
    if (phaseId === 'foundation') {
      if (phaseProgress < 0.3) notes.push('Building the base. Every run should feel comfortably within your limit right now.');
      else notes.push('Steady foundation work. Resist the urge to push - the big distances come later.');
    }
    if (phaseId === 'build') {
      if (phaseProgress < 0.4) notes.push('Long run is growing. Pace the first half conservatively - you should have plenty left.');
      else if (phaseProgress > 0.7) notes.push('Biggest build weeks. Protect the long run by keeping midweek efforts genuinely easy.');
    }
    if (phaseId === 'specific') {
      if (phaseProgress < 0.5) notes.push('Getting close to your target distance. Practise your nutrition and pacing strategy on these runs.');
      else notes.push('Final specific weeks. Your legs know this distance now. Trust the training.');
    }
  }

  else if (goal === 'event') {
    if (phaseId === 'foundation') {
      if (phaseProgress < 0.2) notes.push('Establish your routine - consistency matters more than pace right now.');
      else if (phaseProgress < 0.45) notes.push('Foundation work. Keep all runs easy and build the habit of regular running.');
      else if (phaseProgress < 0.75) notes.push('Foundation is bedding in. You should be settling into a rhythm.');
      else notes.push('Final foundation week. The base is forming - next phase the work steps up.');
    }
    if (phaseId === 'build') {
      if (phaseProgress < 0.25) notes.push('Build phase begins. Start your long runs a little easier than you think you need to.');
      else if (phaseProgress < 0.5) notes.push('Mileage is stepping up. Keep easy days genuinely easy so you arrive at the long run fresh.');
      else if (phaseProgress < 0.75) notes.push('Mid-build. The long run is the most important session - protect it by not overcooking midweek runs.');
      else notes.push('Biggest build weeks. Rest well between sessions and do not skip the shorter runs.');
    }
    if (phaseId === 'specific') {
      if (phaseProgress < 0.2) notes.push('Specific phase begins. Your long runs are now approaching the distances that matter.');
      else if (phaseProgress < 0.45) notes.push('Specific work building. These are the sessions that count most - arrive at them fresh.');
      else if (phaseProgress < 0.75) notes.push('Practise your full race nutrition and pacing strategy on the long run.');
      else notes.push('Final specific week. Execute it well - this is the last big stimulus before the taper.');
    }
    if (phaseId === 'peak') {
      const distLabel = raceDistance === 'marathon' ? '20-mile' : raceDistance === 'half' ? '10-mile' : 'long';
      notes.push(`Your confidence ${distLabel} run. Start very conservatively. Practise race-day nutrition throughout.`);
    }
  }

  // ── Athlete state overlays ──
  if (athleteState === 'novice') {
    if (phaseProgress < 0.2 && !notes.length) notes.push('Take it easy - building a running base takes time. There are no shortcuts and rushing causes injury.');
    if (mainTarget > 6 && (fuelling === 'none' || fuelling === 'little')) {
      notes.push('Carry water and a snack on runs over 45 minutes. Eat and drink before you feel you need to.');
    }
  }
  if (athleteState === 'detrained') {
    if (phaseId === 'foundation' && phaseProgress < 0.3) notes.push('Your fitness will come back faster than you expect. The early weeks will feel easy - that is intentional. Do not race the comeback.');
    else if (phaseId === 'foundation') notes.push('Fitness returning. Resist the urge to push harder than the plan says - the legs need time to readapt.');
  }
  if (athleteState === 'highly_trained' && (phaseId === 'specific' || phaseId === 'build') && phaseProgress > 0.5) {
    if (goalFinish === 'time' || goalFinish === 'competitive') notes.push('Include some miles at target race pace during the long run - the final third is a good place to practise.');
  }

  // ── Injury / energy ──
  if (injury === 'ongoing' && !isRecovery) notes.push('Monitor the injury closely. If discomfort increases during or after this run, take an extra rest day.');
  if (energy === 'poor' && phaseProgress < 0.5) notes.push('Energy is low - prioritise sleep over extra running. A well-rested shorter run beats an exhausted long one.');

  // ── Fallback ──
  if (!notes.length) {
    if (phaseId === 'foundation') return 'Easy running. Keep the effort conversational and focus on completing the session comfortably.';
    if (phaseId === 'build')      return 'Progressive week. Complete the long run at a pace you could sustain for longer.';
    if (phaseId === 'specific')   return 'Specific prep. These are your most important training weeks - execute them well.';
    return 'Steady week. Run at a comfortable, sustainable effort.';
  }

  return notes.join(' ');
}

/* ════════════════════════════════════════════════════════════════
   5. GENERATE DISPLAY DATA
   ════════════════════════════════════════════════════════════════ */

function runBuildProfileRows(profile) {
  const { unit, model, athleteState, demandCat, riskLevel, terrain, surface,
          progressionTolerance, availType, eventDist } = profile;

  const stateLabels = {
    novice:         'Novice',
    detrained:      'Detrained experienced',
    moderate:       'Moderately trained',
    highly_trained: 'Highly trained',
  };
  const demandLabels = {
    ultra:           'Ultra endurance',
    long_endurance:  'Long endurance',
    endurance:       'Endurance',
    short_endurance: 'Short endurance',
    fitness:         'Fitness / no event',
    beginner:        'Beginner',
  };
  const riskColour = { high: 'red', moderate: 'amber', low: 'green' };
  const tolLabels  = { conservative: 'Conservative', moderate: 'Moderate', aggressive: 'Aggressive' };
  const surfaceLabels = { road: 'Road', trail: 'Trail', mixed: 'Mixed' };

  const rows = [
    { label: 'Programme model', value: model },
    { label: 'Athlete state',   value: stateLabels[athleteState] || athleteState },
  ];

  if (demandCat !== 'fitness' && demandCat !== 'beginner') {
    rows.push({ label: 'Event category', value: demandLabels[demandCat] || demandCat });
  }

  if (eventDist) {
    const d = unit === 'km' ? Math.round(eventDist * RUN_MI_TO_KM * 10) / 10 : eventDist;
    rows.push({ label: 'Race distance', value: `${d} ${unit}` });
  }

  rows.push({ label: 'Surface', value: surfaceLabels[surface] || surface });
  rows.push({ label: 'Terrain', value: terrain.charAt(0).toUpperCase() + terrain.slice(1) });
  rows.push({ label: 'Risk level',          value: riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1), flag: riskColour[riskLevel] });
  rows.push({ label: 'Progression style',   value: tolLabels[progressionTolerance] });
  rows.push({ label: 'Training days/week', value: profile.daysPerWeek + (profile.daysPerWeek === 1 ? ' day' : ' days') });

  return rows;
}

function runBuildStrategyText(profile, strategyParts) {
  const { athleteState, demandCat, goal, weeksToEvent, riskLevel, terrain, isTrail, goalFinish } = profile;

  const para1 = (() => {
    if (goal === 'new') return `This ${weeksToEvent}-week plan builds your running from the ground up. The focus is on establishing a routine, staying injury-free, and building confidence - not pace or performance.`;
    if (goal === 'fitness') return `This ${weeksToEvent}-week plan develops your running fitness progressively. The emphasis is on consistency and sustainable improvement.`;
    if (goal === 'distance') return `This plan builds you toward your target distance across ${weeksToEvent} weeks using progressive long-run development. The goal is to arrive at your target feeling capable, not exhausted.`;
    const eventDesc = demandCat === 'ultra' ? 'ultra endurance event'
      : demandCat === 'long_endurance' ? 'marathon or long distance race'
      : demandCat === 'endurance' ? 'endurance race'
      : 'race';
    return `This ${weeksToEvent}-week plan prepares you for your ${eventDesc}. The programme builds fitness progressively and delivers you to the start line ready - not worn out.`;
  })();

  const para2 = strategyParts.length
    ? `The core strategy combines ${strategyParts.join(', ')}.`
    : 'The plan follows a structured build with regular recovery to maximise adaptation and minimise injury risk.';

  const para3 = (() => {
    if (riskLevel === 'high') return 'Given the risk factors identified, this plan prioritises safe progression. The 10% weekly mileage rule is strictly enforced. Do not skip recovery weeks.';
    if (demandCat === 'ultra') return 'Ultra events are won and lost in training consistency, not peak mileage. Your job is to accumulate time on feet safely - not to replicate the race distance. Trust the process.';
    if (demandCat === 'long_endurance') return 'The long run is the cornerstone of marathon preparation. Everything else supports it. Arrive at each long run well-rested and execute it at a conversational pace.';
    if (isTrail) return 'Trail running requires technical skill as well as fitness. Include trail-specific sessions throughout to build confidence on technical terrain - not just on race week.';
    if (terrain === 'hilly' || terrain === 'mountainous') return 'Climbing fitness accumulates gradually. Include hilly routes consistently throughout the plan rather than saving them for specific phase sessions only.';
    if (goalFinish === 'time' || goalFinish === 'competitive') return 'Pace work is introduced in the specific phase when your aerobic base is solid enough to support it. Rushing intensity too early is the most common cause of injury and underperformance.';
    return 'Running injuries are most often caused by doing too much too soon. The recovery weeks in this plan are not optional - they are where adaptation happens.';
  })();

  return [para1, para2, para3];
}

function runBuildKeyFocus(profile) {
  const { athleteState, demandCat, isTrail, terrain, goalFinish,
          fuelling, tools, riskLevel, goal, otherSports, injury } = profile;
  const focus = [];

  if (goal === 'new') {
    focus.push({ title: 'Run/walk is valid', desc: 'Walking during runs is not failure - it is smart training. Alternate running and walking as needed and build from there.' });
    focus.push({ title: 'Injury prevention first', desc: 'New runners are most vulnerable in the first 3 months. Never skip rest days, and stop if something hurts rather than feels hard.' });
  } else {
    focus.push({ title: 'Easy running first', desc: 'Most of your running should feel comfortably easy - you should be able to hold a full conversation. Durability before speed.' });
  }

  if (isTrail) {
    focus.push({ title: 'Technical skills', desc: 'Trail running requires confidence on technical terrain. Practise on trails regularly - descending at pace is a specific skill that needs training.' });
  }

  if (terrain === 'hilly' || terrain === 'mountainous') {
    focus.push({ title: 'Hill training', desc: 'Include hilly routes from early in the plan. Pacing climbs conservatively is a skill - start them easier than feels necessary.' });
  }

  if (demandCat === 'ultra') {
    focus.push({ title: 'Time on feet', desc: 'Ultra running is about durability, not speed. Train your body to keep moving for long periods - the pace will look after itself.' });
  }

  if (demandCat === 'long_endurance') {
    focus.push({ title: 'Long run execution', desc: 'The long run is your most important session each week. Run it at a truly easy pace - it should feel almost too slow in the first half.' });
  }

  if (fuelling === 'little' || fuelling === 'none') {
    focus.push({ title: 'Fuelling practice', desc: 'Train your gut to accept carbohydrate during running. Start with small amounts on runs over 45 minutes and build to full race fuelling.' });
  } else if (demandCat !== 'short_endurance') {
    focus.push({ title: 'Race nutrition', desc: 'Practise your exact race nutrition strategy in training. Never try something new on race day.' });
  }

  if (goalFinish === 'time' || goalFinish === 'competitive') {
    focus.push({ title: 'Pace discipline', desc: 'Going out too fast is the most common mistake in racing. Practise running your target pace in training so it feels natural, not effortful.' });
  }

  if (otherSports === 'hard') {
    focus.push({ title: 'Total load management', desc: 'Your other training contributes to fatigue. Reduce running intensity on weeks where other training peaks.' });
  }

  if (riskLevel === 'high' || injury !== 'none') {
    focus.push({ title: 'Injury management', desc: 'Running injuries are almost always caused by too much too soon. If something hurts beyond normal muscle soreness, rest rather than push through.' });
  }

  if (tools && tools.includes('hrm')) {
    focus.push({ title: 'Heart rate discipline', desc: 'Use your HRM to keep easy runs genuinely easy. Most runners go 30-60 seconds per mile too fast on easy days - trust the data.' });
  }

  return focus.slice(0, 6);
}

function runBuildPhaseOverview(profile, phases) {
  const phaseColours = {
    foundation:        '#34d399',
    build:             '#2563eb',
    specific:          '#8b5cf6',
    prepeak_recovery:  '#a78bfa',
    peak:              '#f59e0b',
    taper:             '#a78bfa',
    event:             '#f43f5e',
    consolidate:       '#06b6d4',
    progress:          '#6366f1',
  };

  return phases.map(p => {
    const end        = p.weekStart + p.weekCount - 1;
    const weeksLabel = p.weekCount > 1 ? `${p.weekStart}–${end}` : `${p.weekStart}`;
    return {
      id:         p.id,
      name:       p.name,
      weeks:      weeksLabel,
      colour:     phaseColours[p.id] || '#888888',
      goal:       runPhaseGoal(p.id, profile),
      load:       runPhaseLoad(p.id),
      keySession: runPhaseKeySession(p.id, profile),
      note:       runPhaseNote(p.id, profile),
    };
  });
}

function runPhaseGoal(id, profile) {
  const map = {
    foundation:       'Build aerobic base, running habit, and injury resilience',
    build:            'Increase weekly mileage and long-run distance',
    specific:         'Race-specific preparation and peak long runs',
    prepeak_recovery: 'Absorb the specific phase load before your biggest week',
    peak:             'Confidence long run at peak mileage',
    taper:            'Reduce fatigue while maintaining sharpness',
    event:            'Race day - arrive fresh and ready',
    consolidate:      'Recovery and consolidation',
    progress:         'Progressive mileage increase',
  };
  return map[id] || 'Training block';
}

function runPhaseLoad(id) {
  const map = {
    foundation:       'Low to Moderate',
    build:            'Moderate to High',
    specific:         'High',
    prepeak_recovery: 'Low',
    peak:             'High (targeted)',
    taper:            'Low',
    event:            'Very low',
    consolidate:      'Low',
    progress:         'Moderate to High',
  };
  return map[id] || 'Moderate';
}

function runPhaseKeySession(id, profile) {
  const { isTrail, terrain, demandCat } = profile;
  if (id === 'foundation') return 'Easy long run - build time on feet';
  if (id === 'build') return isTrail ? 'Trail long run with elevation' : 'Progressive long run';
  if (id === 'specific') {
    if (isTrail) return 'Technical trail long run at event effort';
    if (terrain === 'hilly' || terrain === 'mountainous') return 'Hilly long run at race effort';
    return 'Race-simulation long run';
  }
  if (id === 'prepeak_recovery') return 'Short easy runs only - no heroics';
  if (id === 'peak') {
    if (demandCat === 'long_endurance') return '20-mile long run (marathon) or 10-mile (half)';
    if (demandCat === 'ultra') return 'Longest training run - back-to-back days if possible';
    return 'Peak long run at easy effort';
  }
  if (id === 'taper')  return 'Short runs with a few race-pace strides';
  if (id === 'event')  return 'Easy shakeout jog the day before (optional)';
  return 'Long run';
}

function runPhaseNote(id, profile) {
  const { athleteState, demandCat } = profile;
  if (id === 'foundation') return athleteState === 'novice'
    ? 'Walk/run as needed. Consistency and habit matter more than pace.'
    : 'Establish your routine. Keep all efforts easy.';
  if (id === 'build') return 'Mileage increases progressively. A recovery week prevents accumulated fatigue.';
  if (id === 'specific') return 'Most important phase. Arrive at each session rested and execute well.';
  if (id === 'prepeak_recovery') return 'This week is deliberate. Cut mileage, sleep well, eat well. You are not losing fitness - you are banking it.';
  if (id === 'peak') return 'One targeted week. Nail nutrition and sleep going in.';
  if (id === 'taper') return 'Cut mileage by 40-60%. Trust the training. Do not add extra sessions.';
  if (id === 'event') return 'Short shakeout only. Early night. Race well.';
  if (id === 'consolidate') return 'Let your body absorb the previous block. Keep runs easy.';
  if (id === 'progress') return 'Build steadily. Monitor how your body is responding.';
  return '';
}

function runBuildGraph(weeks) {
  return weeks.map(w => w.mainTarget);
}

function runBuildGuidance(profile) {
  const { isTrail, terrain, tools, fuelling, injury, unit, goalFinish, demandCat } = profile;
  const distWord = unit === 'km' ? 'kilometres' : 'miles';
  const points   = [];

  points.push({
    title: 'Effort and pacing',
    body: tools && tools.includes('hrm')
      ? 'Keep easy runs in Zone 2. You should be able to hold a full conversation throughout. Use your heart rate to verify - most runners go too fast on easy days.'
      : tools && tools.includes('gps')
      ? 'Use your GPS to check pace on easy runs. Easy pace should feel almost embarrassingly slow. If you can\'t speak in full sentences, slow down.'
      : 'Most runs should feel comfortably conversational. If you cannot hold a full sentence, you are going too fast. Slow down and stay in control.',
  });

  const nutritionBody = fuelling === 'none' || fuelling === 'little'
    ? 'Start simple: a gel or small snack every 40-45 minutes on runs over 60 minutes. Practice this in training - your gut needs training too, not just your legs.'
    : demandCat === 'ultra' || demandCat === 'long_endurance'
    ? 'Target 60-90g carbohydrate per hour on long runs. Practise your exact race nutrition in training - stomach issues are the most common reason for DNFs in long events.'
    : 'Take on fluid and carbohydrate on runs over 60 minutes. Practise your race nutrition in training, not for the first time on race day.';
  points.push({ title: 'Nutrition while running', body: nutritionBody });

  points.push({
    title: 'Hydration',
    body: 'Drink before you feel thirsty - thirst is a late signal. Aim for 400-600ml per hour in cool conditions, more in heat. Add electrolytes on any run over 90 minutes.',
  });

  points.push({
    title: 'Recovery after long runs',
    body: 'The 30-60 minutes after your long run are your most valuable recovery window. Carbohydrate and protein immediately, then rest. Sleep is your most powerful training tool - prioritise 8+ hours on big training weeks.',
  });

  if (isTrail) {
    points.push({
      title: 'Trail running specifics',
      body: 'Trail pace is slower than road pace for the same effort - do not compare the numbers. Walk steep climbs if needed; power hiking is a legitimate race strategy. Practise descending at speed in training - it is a specific skill that needs development.',
    });
  } else if (terrain === 'hilly' || terrain === 'mountainous') {
    points.push({
      title: 'Running hills',
      body: 'Shorten your stride on climbs and focus on effort, not pace. Start climbs easier than feels necessary - it is easy to overcook an early hill and pay for it later. Use downhills to recover, not race.',
    });
  }

  points.push({
    title: 'Injury prevention',
    body: `Increase your weekly mileage by no more than 10% per week. Most running injuries are caused by doing too much too soon. If something hurts beyond normal muscle soreness, take an extra rest day rather than pushing through.`,
  });

  if (demandCat === 'ultra' || demandCat === 'long_endurance') {
    points.push({
      title: 'Managing the mental side',
      body: 'Long races have a psychological wall - usually in the final third. Train yourself to break the race into sections and focus on the next landmark, not the finish. Practise this on your longest training runs.',
    });
  }

  if (goalFinish === 'time' || goalFinish === 'competitive') {
    points.push({
      title: 'Race pacing',
      body: 'The most common race mistake is going out too fast. Your first mile should feel embarrassingly easy. Use heart rate or GPS to enforce your target pace in the early miles - your legs will thank you in the final third.',
    });
  }

  if (injury !== 'none') {
    points.push({
      title: 'Managing your injury',
      body: injury === 'ongoing'
        ? 'You have flagged an ongoing injury. This plan is structured conservatively as a result. Please consult a physiotherapist or sports doctor before starting. Do not run through pain.'
        : 'Monitor your niggle closely. If it worsens after sessions, take an extra rest day. Flagging issues early prevents them becoming serious problems.',
    });
  }

  return { intro: 'Use this guidance alongside your training. These are not optional extras - they are part of the programme.', points };
}

function runBuildWarnings(profile, phases) {
  const { riskLevel, injury, energy, otherSports, weeksToEvent, eventDist,
          athleteState, demandCat, terrain, isTrail } = profile;
  const warnings = [];

  if (injury === 'ongoing') {
    warnings.push({ level: 'high', text: 'You have flagged an ongoing injury. This plan is structured conservatively. Seek professional medical advice before starting and do not train through pain.' });
  }
  if (injury === 'minor') {
    warnings.push({ level: 'amber', text: 'A minor niggle has been noted. Monitor it throughout. If it worsens, rest before continuing rather than pushing through.' });
  }
  if (energy === 'poor') {
    warnings.push({ level: 'high', text: 'Poor energy and sleep significantly limits running adaptation. Recovery weeks are essential - do not skip them.' });
  }
  if (energy === 'mixed') {
    warnings.push({ level: 'amber', text: 'Mixed energy noted. Keep easy sessions genuinely easy and prioritise sleep on hard training weeks.' });
  }
  if (otherSports === 'hard') {
    warnings.push({ level: 'amber', text: 'Hard training in other sports adds to your total fatigue. Reduce running intensity on weeks where other training is particularly demanding.' });
  }

  // Timeline risk
  if (eventDist) {
    const weeksNeeded = eventDist >= 26 ? 16 : eventDist >= 13 ? 12 : eventDist >= 6 ? 8 : 6;
    if (weeksToEvent < weeksNeeded * 0.7) {
      warnings.push({ level: 'high', text: 'The timeline is compressed for this event distance. This plan prioritises injury-free completion over full preparation. Manage expectations and do not skip recovery weeks.' });
    }
  }

  if (athleteState === 'novice' && (demandCat === 'ultra' || demandCat === 'long_endurance')) {
    warnings.push({ level: 'high', text: 'This is a significant challenge relative to your current running base. The plan is structured conservatively - be honest about how your body is responding each week.' });
  }

  if (demandCat === 'ultra' && athleteState !== 'highly_trained') {
    warnings.push({ level: 'amber', text: 'Your peak long run will not match the race distance - that is intentional. The accumulated training load prepares you for the event even if no single run replicates it.' });
  }

  if ((terrain === 'hilly' || terrain === 'mountainous') && demandCat !== 'beginner') {
    warnings.push({ level: 'amber', text: 'Hilly races punish athletes who go out too fast on early climbs. Practise pacing climbs conservatively in training.' });
  }

  if (weeksToEvent >= 16 && athleteState === 'moderate') {
    warnings.push({ level: 'info', text: 'This is a long plan. Consistency across all weeks matters more than any individual session. Missing one week is fine - missing three in a row needs a plan adjustment.' });
  }

  warnings.push({ level: 'info', text: (u) => `Distances shown in ${u === 'km' ? 'kilometres' : 'miles'}. Switch units in settings - all values update automatically.` });
  warnings.push({ level: 'info', text: 'The 10% weekly mileage rule is enforced in this plan. Do not add extra sessions on top of what is prescribed.' });

  return warnings;
}

function runBuildMeta(profile, answers, progName) {
  const { weeksToEvent, eventDist, unit, goal, surface, terrain } = profile;

  let eventDesc;
  if (goal === 'event') {
    const distMap = { '5k': '5k', '10k': '10k', half: 'Half Marathon', marathon: 'Marathon', other: 'Ultra' };
    const distLabel = distMap[answers.raceDistance] || 'Race';
    const surfaceLabel = surface === 'trail' ? 'Trail' : surface === 'mixed' ? 'Mixed terrain' : 'Road';
    const terrainLabel = (terrain === 'hilly' || terrain === 'mountainous') ? ` · ${terrain.charAt(0).toUpperCase() + terrain.slice(1)}` : '';
    eventDesc = `${distLabel} · ${surfaceLabel}${terrainLabel}`;
  } else if (goal === 'distance') {
    eventDesc = `Target distance: ${answers.targetDistance || '?'} ${unit}`;
  } else if (goal === 'fitness') {
    const goalMap = { distance: 'Run further', speed: 'Run faster', health: 'Get fitter', all: 'All-round improvement' };
    eventDesc = 'Fitness goal: ' + (goalMap[answers.fitnessGoal] || 'General fitness');
  } else {
    eventDesc = 'New to running - starter plan';
  }

  const now = new Date();
  now.setDate(now.getDate() + weeksToEvent * 7);
  const eventDate = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return { weeks: weeksToEvent, event: eventDesc, eventDate };
}

/* ════════════════════════════════════════════════════════════════
   TOP-LEVEL: generateRunningProgramme(answers)
   ════════════════════════════════════════════════════════════════ */

function generateRunningProgramme(answers, progName) {
  const unit      = localStorage.getItem('units') || 'mi';
  const entryUnit = answers.entryUnit || answers.unit || unit;
  answers = { ...answers, unit, entryUnit };

  const profile       = deriveRunningProfile(answers);
  const strategyParts = runSelectStrategy(profile);
  const phases        = runAllocatePhases(profile);
  const weeks         = runBuildWeeks(profile, phases);
  const profileRows   = runBuildProfileRows(profile);
  const strategy      = runBuildStrategyText(profile, strategyParts);
  const keyFocus      = runBuildKeyFocus(profile);
  const phaseOverview = runBuildPhaseOverview(profile, phases);
  const graph         = runBuildGraph(weeks);
  const guidance      = runBuildGuidance(profile);
  const warnings      = runBuildWarnings(profile, phases);
  const meta          = runBuildMeta(profile, answers, progName);

  return {
    name:        progName,
    demo:        false,
    useDuration: false,
    unit,
    daysPerWeek: profile.daysPerWeek,
    availType:   profile.availType,
    meta,
    profile:     profileRows,
    strategy,
    keyFocus,
    phases:      phaseOverview,
    weeks,
    graph,
    guidance,
    warnings,
  };
}

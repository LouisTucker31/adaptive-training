/* ── Cycling Logic Engine - Endurance Planner Logic Spec v3 ──
   generateProgramme(answers) → programme data object for programme.js
   ------------------------------------------------------------------ */

/* ════════════════════════════════════════════════════════════════
   CONSTANTS
   ════════════════════════════════════════════════════════════════ */

const MI_TO_KM_L = 1.60934;

// Round to nearest "friendly" number for display
function friendly(n, unit) {
  if (unit === 'km') {
    // Round to nearest 5km
    return Math.round(n / 5) * 5;
  }
  // Round to nearest 5mi
  return Math.round(n / 5) * 5;
}

function toKm(mi) { return Math.round(mi * MI_TO_KM_L); }

// Convert a base-miles distance to display unit, rounded friendly
function display(miles, unit) {
  const raw = unit === 'km' ? miles * MI_TO_KM_L : miles;
  return friendly(raw, unit);
}

/* ════════════════════════════════════════════════════════════════
   1. DERIVE PROFILE
   ════════════════════════════════════════════════════════════════ */

function deriveProfile(answers) {
  const unit      = answers.unit      || 'mi';
  const entryUnit = answers.entryUnit || unit; // unit used when distances were typed

  // ── Programme model ──
  const modelMap = {
    event:    'Event plan',
    distance: answers.weeksToEvent ? 'Dated distance goal' : 'Flexible distance progression',
    fitness:  'Rolling fitness block',
    new:      'Beginner cycling block',
  };
  const model = modelMap[answers.goal] || 'Event plan';

  // ── Event demand ──
  // Parse event distance using entryUnit (the unit active when the user typed it).
  // All internal distances are stored in miles.
  let eventDayDist = null;
  let eventDayDuration = null;
  let eventDays = parseInt(answers.eventDays) || 1;
  let totalEventDist = null;

  if (answers.eventDistance) {
    const raw = parseFloat(answers.eventDistance);
    totalEventDist = entryUnit === 'km' ? raw / MI_TO_KM_L : raw;
    eventDayDist = totalEventDist / eventDays;
  }
  if (answers.eventDuration) {
    const parts = String(answers.eventDuration).match(/(\d+)h?\s*:?\s*(\d*)/);
    if (parts) {
      const hrs = parseInt(parts[1]) || 0;
      const mins = parseInt(parts[2]) || 0;
      const totalMins = (hrs * 60 + mins) * eventDays;
      eventDayDuration = totalMins / eventDays;
    }
  }
  if (answers.targetDistance) {
    const raw = parseFloat(answers.targetDistance);
    totalEventDist = entryUnit === 'km' ? raw / MI_TO_KM_L : raw;
    eventDayDist = totalEventDist;
  }

  const isMultiDay = eventDays > 1;
  const isLoaded   = answers.loaded === 'light' || answers.loaded === 'loaded';
  const isFullLoad = answers.loaded === 'loaded';

  // ── Use duration anchor? ──
  const useDuration = answers.eventType === 'mtb' ||
    answers.elevation === 'mountainous' ||
    (answers.eventType === 'gravel' && answers.elevation === 'hilly') ||
    (!eventDayDist && !!eventDayDuration);

  // ── Athlete state ──
  const recentScore  = scoreRecent(answers);
  const historicScore = scoreHistoric(answers);
  const athleteState = classifyAthlete(recentScore, historicScore);

  // ── Event/goal demand ──
  const demandCat = classifyDemand(eventDayDist, eventDays, isLoaded, answers);

  // ── Risk level ──
  const riskLevel = classifyRisk(answers, recentScore, eventDayDist, answers.weeksToEvent);

  // ── Progression tolerance ──
  const progressionTolerance = athleteState === 'highly_trained' ? 'aggressive'
    : athleteState === 'novice' ? 'conservative'
    : riskLevel === 'high' ? 'conservative'
    : 'moderate';

  // ── Terrain ──
  const terrain = answers.elevation || 'flat';

  // ── Training availability ──
  const daysPerWeek = parseInt(answers.daysPerWeek) || 3;
  const hasWeekdays = answers.weekdayTime && answers.weekdayTime !== '0';
  const hasWeekends = answers.weekendTime  && answers.weekendTime  !== '0';
  const availType = !hasWeekdays ? 'weekend-focused'
    : !hasWeekends ? 'weekday-heavy'
    : daysPerWeek <= 2 ? 'constrained'
    : 'balanced';

  return {
    unit,
    model,
    eventDayDist,
    eventDayDuration,
    totalEventDist,
    eventDays,
    isMultiDay,
    isLoaded,
    isFullLoad,
    useDuration,
    athleteState,
    demandCat,
    riskLevel,
    progressionTolerance,
    terrain,
    daysPerWeek,
    availType,
    recentScore,
    historicScore,
    goal: answers.goal,
    eventType: answers.eventType || 'road-single',
    elevation: answers.elevation || 'flat',
    goalFinish: answers.goalFinish || 'comfortable',
    loaded: answers.loaded || 'no',
    injury: answers.injury || 'none',
    energy: answers.energy || 'good',
    tools: answers.tools || 'none',
    fuelling: answers.fuelling || 'some',
    otherSports: answers.otherSports || 'none',
    background: answers.background || 'recreational',
    doneBefore: answers.doneBefore || 'first',
    weeksToEvent: parseInt(answers.weeksToEvent) || parseInt(answers.targetDateValue) || 12,
    consistency: answers.consistency || 'fairly',
    backToBack: answers.backToBack || 'one',
    longestRecent: answers.longestRecent || null,
  };
}

/* ── Scoring helpers ── */

function scoreRecent(answers) {
  // 0-4 scale
  let score = 0;

  const vol = answers.weeklyVolume || '1-3h';
  const volScores = { '0': 0, '<1h': 0.5, '1-3h': 1, '3-6h': 2, '6-10h': 3, '10h+': 4 };
  score += volScores[vol] || 1;

  const con = answers.consistency || 'fairly';
  const conScores = { barely: 0, occasional: 0.5, fairly: 1, very: 2 };
  score += conScores[con] || 1;

  const recent = answers.longestRecent || '<50km';
  const recentMi = parseLongestRide(recent);
  score += recentMi < 30 ? 0 : recentMi < 60 ? 0.5 : recentMi < 100 ? 1 : recentMi < 150 ? 1.5 : 2;

  return Math.min(score / 8 * 4, 4); // normalise to 0-4
}

function scoreHistoric(answers) {
  let score = 0;
  const bg = answers.background || 'recreational';
  const bgScores = { new: 0, recreational: 1, experienced: 3, returning: 2 };
  score += bgScores[bg] || 1;

  const ever = answers.longestEver || '<100km';
  const everMi = parseLongestRide(ever);
  score += everMi < 60 ? 0 : everMi < 100 ? 1 : everMi < 160 ? 2 : everMi < 250 ? 3 : 4;

  const done = answers.doneBefore || 'first';
  score += done === 'same' ? 2 : done === 'similar' ? 1 : 0;

  return Math.min(score / 9 * 4, 4);
}

function parseLongestRide(val) {
  // Returns approximate miles
  const map = {
    '<50km': 25, '50-100km': 45, '100-160km': 80, '160-250km': 130, '250km+': 180,
    '<30mi': 20, '30-60mi': 45, '60-100mi': 80, '100-150mi': 125, '150mi+': 170,
    '<100km': 50, '160-250km': 130, '250-400km': 220, '400km+': 280,
    '<60mi': 40, '60-100mi': 80, '100-160mi': 130, '160-250mi': 200, '250mi+': 275,
  };
  return map[val] || 50;
}

function classifyAthlete(recentScore, historicScore) {
  if (recentScore < 1.5 && historicScore < 1.5) return 'novice';
  if (recentScore < 1.5 && historicScore >= 2)  return 'detrained';
  if (recentScore >= 3   && historicScore >= 2.5) return 'highly_trained';
  return 'moderate';
}

function classifyDemand(eventDayDist, eventDays, isLoaded, answers) {
  if (!eventDayDist) return answers.goal === 'new' ? 'beginner' : 'fitness';
  if (eventDays > 2 && isLoaded) return 'loaded_multi_ultra';
  if (eventDays > 1)             return 'multi_day';
  if (eventDayDist > 130)        return 'ultra';
  if (eventDayDist > 60)         return 'endurance';
  return 'short_endurance';
}

function classifyRisk(answers, recentScore, eventDayDist, weeksToEvent) {
  let risk = 0;
  if (answers.injury === 'ongoing') risk += 3;
  if (answers.injury === 'minor')   risk += 1;
  if (answers.energy === 'poor')    risk += 2;
  if (answers.energy === 'mixed')   risk += 1;
  if (answers.otherSports === 'hard') risk += 2;
  if (recentScore < 1.5)            risk += 1;

  // Timeline risk
  if (eventDayDist && weeksToEvent) {
    const weeksNeeded = eventDayDist > 130 ? 16 : eventDayDist > 80 ? 12 : 8;
    if (weeksToEvent < weeksNeeded * 0.6) risk += 3;
    else if (weeksToEvent < weeksNeeded * 0.8) risk += 1;
  }

  return risk >= 4 ? 'high' : risk >= 2 ? 'moderate' : 'low';
}

/* ════════════════════════════════════════════════════════════════
   2. SELECT PROGRAMME MODEL & STRATEGY
   ════════════════════════════════════════════════════════════════ */

function selectStrategy(profile) {
  const { athleteState, demandCat, isMultiDay, isLoaded, goalFinish, availType, terrain } = profile;

  const parts = [];

  if (athleteState === 'novice') parts.push('conservative build from a low base');
  else if (athleteState === 'detrained') parts.push('careful durability rebuild from a strong foundation');
  else if (athleteState === 'highly_trained') parts.push('progressive overload with earlier specificity');
  else parts.push('steady endurance progression with balanced recovery');

  if (isMultiDay) parts.push('repeat-day durability and back-to-back sessions');
  if (isLoaded) parts.push('progressive loaded riding practice');
  if (terrain === 'hilly' || terrain === 'mountainous') parts.push('climbing-specific sessions');
  if (goalFinish === 'strong' || goalFinish === 'competitive') parts.push('pacing and controlled tempo work in later phases');
  if (availType === 'weekend-focused') parts.push('concentrated long-ride structure on weekends');

  return parts;
}

/* ════════════════════════════════════════════════════════════════
   3. ALLOCATE PHASES
   ════════════════════════════════════════════════════════════════ */

function allocatePhases(profile) {
  const { goal, weeksToEvent, athleteState, demandCat, isMultiDay, isLoaded, riskLevel } = profile;
  const total = weeksToEvent;

  // Non-event routes
  if (goal === 'fitness' || goal === 'new') {
    const blockSize = total <= 8 ? 3 : 4;
    const blocks = [];
    let w = 1;
    while (w <= total) {
      const len = Math.min(blockSize, total - w + 1);
      const isRecovery = blocks.length > 0 && blocks.length % 2 === 1;
      blocks.push({ id: isRecovery ? 'consolidate' : (blocks.length === 0 ? 'foundation' : 'progress'), name: isRecovery ? 'Consolidate' : (blocks.length === 0 ? 'Foundation' : 'Progress'), weekStart: w, weekCount: len });
      w += len;
    }
    return blocks;
  }

  if (goal === 'distance') {
    // Foundation → Build → (Specific) → Target
    const foundation = athleteState === 'novice' ? Math.ceil(total * 0.3) : Math.ceil(total * 0.2);
    const specific   = total >= 10 ? Math.ceil(total * 0.15) : 0;
    const target     = 1;
    const build      = total - foundation - specific - target;
    return [
      { id: 'foundation', name: 'Foundation', weekStart: 1,                      weekCount: foundation },
      { id: 'build',      name: 'Build',      weekStart: 1 + foundation,          weekCount: Math.max(build, 1) },
      ...(specific > 0 ? [{ id: 'specific', name: 'Specific', weekStart: 1 + foundation + build, weekCount: specific }] : []),
      { id: 'event',      name: 'Target Week', weekStart: total,                  weekCount: 1 },
    ];
  }

  // Event route - standard allocation from spec table
  const hasPeak  = total >= 8;
  const taper    = total <= 6 ? 0 : demandCat === 'loaded_multi_ultra' || demandCat === 'ultra' ? 2 : 1;
  const peak     = hasPeak ? 1 : 0;
  const event    = total <= 4 ? 0 : 1;

  let foundation, build, specific;

  if (total <= 8) {
    foundation = total <= 5 ? 1 : athleteState === 'novice' ? 2 : 1;
    specific   = total <= 5 ? 1 : isMultiDay || isLoaded ? 2 : 1;
    build      = total - foundation - specific - peak - taper - event;
  } else if (total <= 12) {
    foundation = athleteState === 'novice' ? 4 : athleteState === 'highly_trained' ? 2 : 3;
    specific   = isMultiDay || isLoaded ? 3 : 2;
    build      = total - foundation - specific - peak - taper - event;
  } else if (total <= 18) {
    foundation = athleteState === 'novice' ? 6 : athleteState === 'highly_trained' ? 3 : 4;
    specific   = isMultiDay || isLoaded ? 5 : 3;
    build      = total - foundation - specific - peak - taper - event;
  } else {
    foundation = athleteState === 'novice' ? 8 : athleteState === 'highly_trained' ? 4 : 6;
    specific   = isMultiDay || isLoaded ? 6 : 4;
    build      = total - foundation - specific - peak - taper - event;
  }

  build = Math.max(build, 2);

  // Always insert a recovery week between Specific and Peak so the athlete
  // absorbs the Specific load before hitting their biggest week.
  // Take it from Specific (which can spare one week) if Specific > 2, else from Build.
  let prepeakRecovery = 0;
  if (hasPeak) {
    if (specific > 2) { specific -= 1; prepeakRecovery = 1; }
    else if (build > 2) { build -= 1; prepeakRecovery = 1; }
  }

  const phases = [];
  let w = 1;
  const add = (id, name, count) => { if (count > 0) { phases.push({ id, name, weekStart: w, weekCount: count }); w += count; } };

  add('foundation',       'Foundation',    foundation);
  add('build',            'Build',         build);
  add('specific',         'Specific',      specific);
  add('prepeak_recovery', 'Pre-Peak Rest', prepeakRecovery); // recovery buffer before Peak
  if (hasPeak) add('peak', 'Peak', peak);
  add('taper',            'Taper',         taper);
  add('event',            'Event',         event);

  return phases;
}

/* ════════════════════════════════════════════════════════════════
   4. BUILD WEEKS
   ════════════════════════════════════════════════════════════════ */

function buildWeeks(profile, phases) {
  const { eventDayDist, eventDayDuration, athleteState, riskLevel,
          isMultiDay, isLoaded, isFullLoad, useDuration, daysPerWeek,
          availType, terrain, goalFinish, unit, tools } = profile;

  // Anchor = event-day distance in miles (or duration in minutes)
  // For fitness/new goals with no target distance, set a sensible anchor based on athlete state.
  // Highly trained athletes need a higher ceiling than the 60mi default.
  const fitnessAnchor = (() => {
    if (profile.goal === 'event' || profile.goal === 'distance' || useDuration) return null;
    if (athleteState === 'highly_trained') return 80;
    if (athleteState === 'detrained')      return 75;
    if (athleteState === 'novice')         return 40;
    return 60;
  })();
  const anchor = useDuration ? (eventDayDuration || 180) : (eventDayDist || fitnessAnchor || 60);

  const startPct = athleteState === 'novice' ? 0.18
    : athleteState === 'detrained' ? 0.22
    : athleteState === 'highly_trained' ? 0.35
    : 0.25;

  // For non-event goals, override the start distance to reflect where the athlete
  // actually is now (from longestRecent), not a percentage of their target.
  // A novice targeting 100mi starts at ~60% of their recent longest, not 18% of 100mi.
  // Event programmes are unaffected — their week 1 distance is set by startPct * anchor.
  let startOverrideMiles = null;
  if (profile.goal !== 'event' && !useDuration && profile.longestRecent) {
    const recentMiles = parseLongestRide(profile.longestRecent);
    // Start at 60% of their recent longest, floored at 5mi, capped at startPct*anchor
    // so fitter athletes don't get a lower start than the formula would give them.
    const fromRecent = Math.max(5, Math.round(recentMiles * 0.6 / 5) * 5);
    startOverrideMiles = Math.min(fromRecent, roundTarget(anchor * startPct, useDuration));
  }

  // For distance/fitness/new goals, cap peakPct more conservatively for novices with injuries.
  // Event programmes are unaffected — their peakPct is already derived from demandCat above.

  // For multi-day events, peak single-day target = ~85% of event-day distance
  // rather than a fraction of total event distance, so it is a meaningful preparation ride.
  let peakPct = (() => {
    const { demandCat } = profile;
    if (demandCat === 'loaded_multi_ultra') return 0.82;
    if (demandCat === 'multi_day')         return 0.85;
    if (demandCat === 'ultra')             return 0.72;
    if (demandCat === 'endurance')         return 0.82;
    return 0.85;
  })();

  // Distance/fitness/new goals: novice with injury gets a tighter ceiling so the
  // peak week stays achievable. Event peakPct is left untouched.
  if (profile.goal !== 'event') {
    if (athleteState === 'novice' && profile.injury === 'ongoing') peakPct = Math.min(peakPct, 0.60);
    else if (athleteState === 'novice' && profile.injury === 'minor') peakPct = Math.min(peakPct, 0.70);
    else if (athleteState === 'novice') peakPct = Math.min(peakPct, 0.80);
  }

  // Alternating pattern: athletes doing long weekly rides (low days/week or weekend-focused)
  // recover better on a long/short alternating rhythm than 3-on/1-off.
  // 4-5 day/week athletes distribute load across shorter sessions, so 3-on/1-off suits them.
  const useAlternating = (daysPerWeek === 2 && availType !== 'weekend-focused') ||
    availType === 'constrained';

  // For 3-on/1-off athletes: how many hard weeks before a down week.
  const hardBlockSize = (athleteState === 'novice' || riskLevel === 'high') ? 2 : 3;

  // Running counter for 3-on/1-off athletes.
  let hardWeekStreak = 0;

  // Max week-on-week load increase.
  const maxWeeklyRise = athleteState === 'novice' ? 0.08 : 0.10;

  // Consolidation week load factor for alternating pattern (short week = 50% of long week target).
  // Floor ensures the ride stays long enough to maintain aerobic stimulus (~90 min minimum).
  const consolidationFactor = 0.50;
  const consolidationFloor = useDuration ? 75 : 20; // 75 min or 20 mi minimum
  const recoveryFloor       = useDuration ? 45 : 10; // recovery rides still need to be worth doing

  // Pass 1: build weeks without b2b flag (needed for pickB2BWeeks)
  const weeks = [];
  let planWeekIndex = 0; // cross-phase counter for alternating long/short pattern

  phases.forEach(phase => {
    const { id, name, weekStart, weekCount } = phase;

    // For distance goals, the 'event' phase is "Target Week" — attempt the full distance.
    // For actual event programmes, it's a shakeout (tiny ride before race day).
    const eventPct = profile.goal === 'distance' ? 1.0 : peakPct * 0.18;

    // For fitness/new phases (consolidate/progress), derive start from the last hard week
    // actually built rather than a fixed anchor percentage — prevents sharp drops at phase boundaries.
    const lastHardMiles = weeks.length > 0
      ? ([...weeks].reverse().find(w => !w.isRecovery && !w.isConsolidation) || weeks[weeks.length - 1]).mainTarget
      : null;
    const lastHardPct = lastHardMiles !== null ? lastHardMiles / anchor : null;

    const phaseStartPct = id === 'foundation'       ? startPct
      : id === 'build'           ? startPct + (peakPct - startPct) * 0.25
      : id === 'specific'        ? startPct + (peakPct - startPct) * 0.55
      : id === 'peak'            ? peakPct
      : id === 'taper'           ? peakPct * 0.35
      : id === 'event'           ? eventPct
      : id === 'prepeak_recovery'? peakPct * 0.50
      : id === 'consolidate'     ? (lastHardPct !== null ? lastHardPct * 0.85 : startPct * 0.9)
      : id === 'progress'        ? (lastHardPct !== null ? lastHardPct * 1.0  : startPct + (peakPct - startPct) * 0.4)
      : startPct;

    // Foundation end: wide enough to show clear progression across the phase.
    // Event programmes: narrow range (foundation is base-building, not ramping hard).
    // Distance/fitness programmes: ramp further so foundation weeks aren't flat.
    const foundationEndPct = (profile.goal === 'distance' || profile.goal === 'fitness' || profile.goal === 'new')
      ? startPct + (peakPct - startPct) * 0.40
      : startPct + (peakPct - startPct) * 0.22;

    const phaseEndPct = id === 'foundation'       ? foundationEndPct
      : id === 'build'           ? startPct + (peakPct - startPct) * 0.52
      : id === 'specific'        ? peakPct * 0.75
      : id === 'peak'            ? peakPct
      : id === 'taper'           ? peakPct * 0.28
      : id === 'event'           ? eventPct
      : id === 'prepeak_recovery'? peakPct * 0.50
      : id === 'consolidate'     ? (lastHardPct !== null ? lastHardPct * 0.90 : startPct) // gentle lift across consolidate
      : id === 'progress'        ? (lastHardPct !== null ? Math.min(lastHardPct * 1.40, peakPct) : startPct + (peakPct - startPct) * 0.7)
      : phaseStartPct;

    // Foundation is always linear — volume is low enough that the body absorbs it without step-downs.
    // Undulation (alternating or 3-on/1-off) only kicks in from Build onwards.
    const linearPhase = id === 'foundation';

    // prepeak_recovery and taper/event are always low-load - exempt from streak/alternating logic.
    // consolidate is a step-back phase by definition — all weeks are down weeks, no streak needed.
    // progress uses its own gentle alternating rhythm (every 3rd week slightly easier), not recovery drops.
    const structureExempt = id === 'taper' || id === 'event' || id === 'prepeak_recovery'
      || id === 'consolidate' || id === 'progress' || id === 'peak';
    const phaseForceRecovery = id === 'prepeak_recovery';

    // Reset the streak counter at each new phase so carry-over from Foundation doesn't
    // cause a spurious recovery week at the start of Build/Specific.
    if (id !== 'foundation') hardWeekStreak = 0;

    for (let i = 0; i < weekCount; i++) {
      const wkNum = weekStart + i;
      const phaseProgress = weekCount > 1 ? i / (weekCount - 1) : 0;

      let isRecovery = false;
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

      // planWeekIndex only advances on non-linear phases so the alternating cycle
      // starts cleanly at the first Build week (always a long week).
      if (!linearPhase) planWeekIndex++;

      let targetPct = lerp(phaseStartPct, phaseEndPct, phaseProgress);

      if (isRecovery) {
        targetPct *= recoveryFactor(athleteState, riskLevel);
      } else if (isConsolidation) {
        // Consolidation week: step back to ~50% of the long-week target at this point in the plan.
        targetPct *= consolidationFactor;
      } else if (id === 'consolidate') {
        // Step back to 75-85% of where foundation ended — noticeable but not a cliff.
        // Lifts gently across the phase so the last consolidate week transitions smoothly into Progress.
        const easeFactor = 0.75 + phaseProgress * 0.10; // 75% → 85% across the phase
        targetPct *= easeFactor;
      } else if (id === 'progress') {
        // Progress phase climbs steadily. Every 3rd week pulls back slightly (not a full recovery).
        // phaseEndPct is already set to lastHardPct * 1.25 so the lerp does the climbing —
        // we just add a mild wave on top.
        const progressWave = (i % 3 === 2) ? 0.92 : 1.0;
        targetPct *= progressWave;
      } else if ((id === 'build' || id === 'specific') && !isRecovery) {
        const wave = Math.sin(i * 1.2) * 0.02;
        targetPct = Math.max(targetPct + wave, phaseStartPct * 0.85);
      }

      let mainTarget = roundTarget(anchor * targetPct, useDuration);

      // For non-event goals, pin week 1 to the athlete's current fitness level
      // rather than a percentage of their (distant) target distance.
      // Apply floor to consolidation weeks so they stay aerobically meaningful.
      if (isConsolidation) {
        mainTarget = Math.max(mainTarget, consolidationFloor);
      }

      // Recovery weeks must always be shorter than the most recent non-recovery week.
      // The lerp-based recoveryFactor can otherwise produce a recovery week that is
      // longer than preceding weeks (e.g. early build recovery > flat foundation weeks).
      if (isRecovery && weeks.length > 0) {
        const lastHard = [...weeks].reverse().find(w => !w.isRecovery && !w.isConsolidation);
        if (lastHard) {
          mainTarget = Math.min(mainTarget, roundTarget(lastHard.mainTarget * recoveryFactor(athleteState, riskLevel), useDuration));
        }
        mainTarget = Math.max(mainTarget, recoveryFloor);
      }

      // Cap week-on-week increase on long weeks only (consolidation weeks can drop freely).
      // At low absolute distances the percentage cap (8-10%) rounds to zero increase,
      // so allow at least one rounding increment (5mi / 15min) of growth per week.
      // Distance goal target week is exempt — it jumps to full distance by design.
      const isTargetWeek = (id === 'event' && profile.goal === 'distance') || id === 'peak';
      if (!isRecovery && !isConsolidation && !isTargetWeek && weeks.length > 0) {
        const prevHard = [...weeks].reverse().find(w => !w.isRecovery && !w.isConsolidation);
        if (prevHard) {
          const minStep = useDuration ? 15 : 5;
          const pctCap  = roundTarget(prevHard.mainTarget * (1 + maxWeeklyRise), useDuration);
          const cap     = Math.max(pctCap, prevHard.mainTarget + minStep);
          mainTarget = Math.min(mainTarget, cap);
        }
      }

      // Hard ceiling: no training week should exceed the actual event-day distance.
      if (!useDuration && anchor > 0) {
        mainTarget = Math.min(mainTarget, roundTarget(anchor, useDuration));
      }

      // Progress phase: guarantee at least one rounding step of growth vs the previous
      // hard week — prevents the phase going flat at small distances.
      // Capped at the standard weekly rise limit so it can't compound dangerously.
      if (id === 'progress' && !isRecovery && !isConsolidation && weeks.length > 0) {
        const lastHard = [...weeks].reverse().find(w => !w.isRecovery && !w.isConsolidation);
        if (lastHard && mainTarget <= lastHard.mainTarget) {
          const minStep = useDuration ? 15 : 5;
          const maxStep = roundTarget(lastHard.mainTarget * maxWeeklyRise, useDuration);
          mainTarget = lastHard.mainTarget + Math.max(minStep, maxStep);
          mainTarget = roundTarget(mainTarget, useDuration);
        }
      }

      // Support/midweek targets grow with the plan rather than being fixed fractions of mainTarget.
      // Base fractions are calculated from mainTarget, then floored against a minimum derived
      // from the previous hard week's secondary target — so they don't plateau or regress.
      const prevHardWeek = weeks.length > 0
        ? [...weeks].reverse().find(w => !w.isRecovery && !w.isConsolidation)
        : null;

      const supportFraction  = (isRecovery || isConsolidation) ? 0.45 : 0.50;
      const midweekFraction  = (isRecovery || isConsolidation) ? 0.30 : 0.35;
      const midweek2Fraction = (isRecovery || isConsolidation) ? 0.20 : 0.22;
      const midweek3Fraction = (isRecovery || isConsolidation) ? 0.15 : 0.18;

      const rawSupport  = roundTarget(mainTarget * supportFraction, useDuration);
      const rawMidweek  = roundTarget(mainTarget * midweekFraction, useDuration);
      const rawMidweek2 = roundTarget(mainTarget * midweek2Fraction, useDuration);
      const rawMidweek3 = roundTarget(mainTarget * midweek3Fraction, useDuration);

      // Floor secondary targets against 80% of the previous hard week's equivalent — prevents regression.
      // On recovery/consolidation weeks the floor is dropped so they genuinely step back.
      const isStructuralDown = isRecovery || isConsolidation || id === 'taper' || id === 'prepeak_recovery';
      const isEventWeek = id === 'event';

      const supportTarget = daysPerWeek >= 2 && !isEventWeek ? (() => {
        if (isStructuralDown || !prevHardWeek?.supportTarget) return rawSupport;
        return Math.max(rawSupport, roundTarget(prevHardWeek.supportTarget * 0.80, useDuration));
      })() : null;

      const midweekTarget = daysPerWeek >= 3 && !isEventWeek ? (() => {
        if (isStructuralDown || !prevHardWeek?.midweekTarget) return rawMidweek;
        return Math.max(rawMidweek, roundTarget(prevHardWeek.midweekTarget * 0.80, useDuration));
      })() : null;

      // Absolute minimums for rides 4 and 5 — scale with plan progress so they grow
      // across the plan rather than sitting at a fixed floor throughout.
      const planProgress = weeks.length / Math.max(1, phases.reduce((s, p) => s + p.weekCount, 0));
      const midweek2Min = useDuration ? 30
        : athleteState === 'highly_trained' ? Math.round((10 + planProgress * 10) / 5) * 5
        : athleteState === 'moderate'       ? Math.round((8  + planProgress * 7)  / 5) * 5
        : 5;
      const midweek3Min = useDuration ? 20
        : athleteState === 'highly_trained' ? Math.round((5  + planProgress * 10) / 5) * 5
        : athleteState === 'moderate'       ? Math.round((5  + planProgress * 5)  / 5) * 5
        : 5;

      const midweek2Target = daysPerWeek >= 4 && !isEventWeek ? (() => {
        if (isStructuralDown || isRecovery || isConsolidation || !prevHardWeek?.midweek2Target) return rawMidweek2;
        return Math.max(rawMidweek2, roundTarget(prevHardWeek.midweek2Target * 0.80, useDuration), midweek2Min);
      })() : null;

      const midweek3Target = daysPerWeek >= 5 && !isEventWeek ? (() => {
        if (isStructuralDown || isRecovery || isConsolidation || !prevHardWeek?.midweek3Target) return rawMidweek3;
        return Math.max(rawMidweek3, roundTarget(prevHardWeek.midweek3Target * 0.80, useDuration), midweek3Min);
      })() : null;

      const isDown = isRecovery || isConsolidation || id === 'event';
      const loaded      = isFullLoad && !isDown && (id === 'specific' || id === 'peak' || (id === 'build' && i >= Math.floor(weekCount / 2)));
      const lightLoaded = isLoaded && !isFullLoad && !isDown && id === 'specific';
      const intensity   = deriveIntensity(id, isRecovery || isConsolidation, goalFinish, tools, athleteState, i, weekCount);

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
        midweek3Target,
        b2bTarget: null,
        loaded,
        lightLoaded,
        b2b: false,
        intensity,
        note: '',
        useDuration,
      });
    }
  });

  // Pass 2: assign b2b flags and notes
  const b2bWeeks = pickB2BWeeks(profile, phases, weeks);

  weeks.forEach(w => {
    w.b2b = b2bWeeks.has(w.wk);
    // b2bTarget: second day ride = 65% of main, shorter and easier
    if (w.b2b) {
      w.b2bTarget = roundTarget(w.mainTarget * 0.65, useDuration);
    }
    w.note = buildWeekNote(w.phaseId, w.wk, w.isRecovery, w.isConsolidation, w.loaded, w.lightLoaded, w.b2b,
      terrain, tools, w.mainTarget, useDuration, unit, goalFinish,
      phases.find(p => p.id === w.phaseId) ? (w.wk - phases.find(p => p.id === w.phaseId).weekStart) / Math.max(1, phases.find(p => p.id === w.phaseId).weekCount - 1) : 0,
      athleteState, profile.goal, profile.fitnessGoal, profile.injury, profile.fuelling, profile.energy, profile.eventType);
  });

  return weeks;
}

function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }

function recoveryFactor(athleteState, riskLevel) {
  if (riskLevel === 'high' || athleteState === 'novice') return 0.60;
  if (athleteState === 'detrained') return 0.65;
  if (athleteState === 'highly_trained') return 0.75;
  return 0.70;
}

function roundTarget(val, useDuration) {
  if (useDuration) {
    // Round to nearest 15 min
    return Math.round(val / 15) * 15;
  }
  // Round to nearest 5 miles
  return Math.round(val / 5) * 5;
}

// b2bWeeks is pre-computed by buildWeeks and passed in - a Set of absolute week numbers
function shouldDoB2B(wkNum, b2bWeeks) {
  return b2bWeeks.has(wkNum);
}

// Choose N b2b weeks spread across Build + Specific + Peak, avoiding recovery weeks.
// Returns a Set of absolute week numbers.
function pickB2BWeeks(profile, phases, weeks) {
  const { isMultiDay, backToBack, daysPerWeek, athleteState } = profile;
  if (!isMultiDay) return new Set();
  if (backToBack === '0') return new Set();

  // Eligible: build/specific only — peak is a solo confidence ride, not b2b
  const eligible = weeks.filter(w =>
    (w.phaseId === 'build' || w.phaseId === 'specific') &&
    !w.isRecovery &&
    !w.isConsolidation &&
    w.wk > 1
  );
  if (eligible.length === 0) return new Set();

  const totalCount = daysPerWeek <= 1 ? 3
    : daysPerWeek <= 2 ? 4
    : 5;

  const buildEligible    = eligible.filter(w => w.phaseId === 'build');
  const specificEligible = eligible.filter(w => w.phaseId === 'specific');

  // Pick a week at a fractional position (0=first, 1=last) within a pool
  function atFraction(pool, frac) {
    if (pool.length === 0) return null;
    return pool[Math.min(pool.length - 1, Math.round(frac * (pool.length - 1)))].wk;
  }

  // Evenly-spaced thirds through build, then mid+late specific.
  // Using 1/3 and 2/3 positions means the gap between b2b weeks scales
  // with plan length rather than being hardcoded to specific week numbers.
  const slots = [
    atFraction(buildEligible,    0.15),
    atFraction(buildEligible,    0.5),
    atFraction(buildEligible,    0.85),
    atFraction(specificEligible, 0.5),
    atFraction(specificEligible, 0.85),
  ];

  // Filter out consecutive weeks — no two b2b weekends should be adjacent.
  // Walk the slots in order, skipping any week that immediately follows the last chosen one.
  const chosen = new Set();
  let lastChosen = null;
  for (const slot of slots) {
    if (!slot) continue;
    if (chosen.size >= totalCount) break;
    if (lastChosen !== null && slot === lastChosen + 1) continue; // skip if adjacent
    chosen.add(slot);
    lastChosen = slot;
  }

  return chosen;
}

function deriveIntensity(phaseId, isRecovery, goalFinish, tools, athleteState, weekIndex, weekCount) {
  if (isRecovery || phaseId === 'event' || phaseId === 'taper' || phaseId === 'prepeak_recovery') return 'Zone 1-2';
  if (phaseId === 'foundation') return 'Zone 2';
  if (phaseId === 'peak') return 'Zone 2';

  const wantsIntensity = goalFinish === 'strong' || goalFinish === 'competitive';
  const canIntensity = athleteState === 'moderate' || athleteState === 'highly_trained';
  const latePhase = weekIndex / weekCount > 0.5;

  if (phaseId === 'specific') {
    if (wantsIntensity && canIntensity && latePhase) return 'Zone 2–3';
    return 'Zone 2';
  }
  if (phaseId === 'build') {
    if (wantsIntensity && canIntensity && latePhase) return 'Zone 2–3';
    return 'Zone 2';
  }
  return 'Zone 2';
}

function buildWeekNote(phaseId, wkNum, isRecovery, isConsolidation, loaded, lightLoaded, b2b, terrain,
    tools, mainTarget, useDuration, unit, goalFinish, phaseProgress, athleteState,
    goal, fitnessGoal, injury, fuelling, energy, eventType) {

  // ── Fixed phase notes ──
  if (phaseId === 'event') {
    if (goal === 'distance') return 'This is your target ride. Start conservatively - the first half should feel well within your limit. Eat and drink from the first 30 minutes.';
    return 'Short shakeout only. Prepare logistics, eat well, sleep.';
  }
  if (phaseId === 'taper') return phaseProgress < 0.5
    ? 'Cut volume significantly. Trust the training - fitness is locked in.'
    : 'Final prep. Keep legs ticking over. No heroics.';
  if (phaseId === 'prepeak_recovery') return 'Deliberate rest week before your biggest training block. Keep rides short and easy. Prioritise sleep and nutrition - your body is absorbing everything you have built.';
  if (isRecovery) {
    if (energy === 'poor') return 'Recovery week. Your energy is already stretched - treat this as a genuine reset, not just a lighter week.';
    if (injury === 'ongoing') return 'Recovery week. Keep all efforts easy and pay attention to how the injury responds. Do not push through discomfort.';
    return 'Planned recovery week. Keep effort easy. Let the adaptation happen.';
  }
  if (isConsolidation) {
    return 'Short week. This should feel noticeably easier - not a moderate effort, a genuinely easy one. The legs need to clear before next week.';
  }
  // Consolidate phase weeks (all are down weeks by design)
  if (phaseId === 'consolidate') {
    if (phaseProgress < 0.35) return 'Step-back week. Volume is reduced deliberately - your body is absorbing the foundation work. Keep effort easy.';
    if (phaseProgress < 0.7)  return 'Consolidation week. Same easy effort. Use the lighter load to focus on smooth pedalling and comfort on the bike.';
    return 'Final consolidation week. You should be feeling fresher than you did at the end of the Foundation phase. Progress block starts next.';
  }

  const notes = [];

  // ── Equipment / special session flags ──
  if (loaded)      notes.push('Ride with your full event equipment and luggage.');
  if (lightLoaded) notes.push('Introduce your kit - light luggage this session.');
  if (b2b)         notes.push('Back-to-back weekend. Second day shorter and easier.');

  // ── Terrain / discipline ──
  const isMTB = eventType === 'mtb';
  if (isMTB) {
    if (phaseId === 'specific' && phaseProgress < 0.5) notes.push('Choose technical trail riding where possible - cornering and descending at pace are skills that need practice before the event.');
    else if (phaseId === 'specific') notes.push('Late specific phase - your trail fitness should be feeling solid. Focus on sustained climbing and technical confidence.');
    else if (phaseId === 'peak') notes.push('Choose technical trail riding where possible - cornering and descending at pace are skills that need practice before the event.');
    else if (phaseId === 'build' && phaseProgress > 0.4 && phaseProgress < 0.7) notes.push('Include trail riding where you can. Time on technical terrain builds confidence as well as fitness.');
    else if (phaseId === 'build' && phaseProgress >= 0.7) notes.push('Late build - prioritise trail riding on long sessions. Technical terrain at pace is the key skill.');
    else if (phaseId === 'foundation' && phaseProgress < 0.3) notes.push('Get comfortable on your MTB. Handling and position matter as much as fitness at this stage.');
  } else if (terrain === 'hilly' || terrain === 'mountainous') {
    if (phaseId === 'specific' && phaseProgress < 0.5) notes.push('Prioritise climbing - choose your hilliest route.');
    else if (phaseId === 'specific' && phaseProgress < 0.85) notes.push('Final specific weeks - your climbing legs are built. Now practise pacing them correctly for a long day.');
    else if (phaseId === 'peak') notes.push('Prioritise climbing - choose your hilliest route.');
    else if (phaseId === 'build' && phaseProgress > 0.4 && phaseProgress < 0.7) notes.push('Add elevation where you can.');
    else if (phaseId === 'build' && phaseProgress >= 0.7) notes.push('Late build - choose hilly routes for long rides. Getting comfortable on sustained climbs now pays off in the specific phase.');
  }

  // ── Tools — remind only in the first two weeks of the entire plan ──
  if (wkNum <= 2) {
    if (tools && tools.includes('hrm'))   notes.push('Keep easy efforts in Zone 2 - use the data, not feel.');
    if (tools && tools.includes('power')) notes.push('Use endurance power - stay below threshold.');
  }

  // ── Goal-specific notes ──
  if (goal === 'new') {
    if (phaseId === 'foundation') {
      if (phaseProgress < 0.25) notes.push('First rides - focus on getting comfortable on the bike, not on pace or distance.');
      else if (phaseProgress < 0.6) notes.push('You are building a habit. Showing up consistently matters more than how far you go.');
      else notes.push('Starting to feel more comfortable on the bike? Good. Keep the effort easy and enjoyable.');
    }
    if (phaseId === 'consolidate') notes.push('Shorter week. Use it to rest and reflect on what is working.');
    if (phaseId === 'progress')    notes.push('Small steps forward. If the ride feels too easy, that is fine - it is supposed to.');
  }

  else if (goal === 'fitness') {
    if (phaseId === 'foundation') {
      if (phaseProgress < 0.25) notes.push('Establish your routine. Same days each week if you can - habit is the foundation of fitness.');
      else if (phaseProgress < 0.6) notes.push('Keep efforts conversational. If you cannot speak in full sentences, slow down.');
      else notes.push('Foundation is working. You should be starting to feel more comfortable at these distances.');
    }
    if (phaseId === 'consolidate') {
      if (fitnessGoal === 'distance') notes.push('Lighter week. Your aerobic base is absorbing the work - this is where adaptation happens.');
      else if (fitnessGoal === 'speed') notes.push('Easier week. Active recovery - keep moving but do not push. Speed work needs fresh legs.');
      else notes.push('Planned step-back. Use the extra energy to sleep well and eat well.');
    }
    if (phaseId === 'progress') {
      if (phaseProgress < 0.3) notes.push('Progress block begins. You should notice these rides feel more manageable than they would have at the start.');
      else if (phaseProgress < 0.55) {
        if (fuelling === 'little' || fuelling === 'none') notes.push('Start eating on rides over 60 minutes - even if you do not feel hungry. A small snack every 45 minutes.');
        else notes.push('Building steadily. Keep the effort sustainable - these weeks are meant to accumulate, not exhaust.');
      }
      else if (phaseProgress < 0.85) notes.push('Stay focused on completing each session at a steady, sustainable effort.');
      else notes.push('Final push of the progress block. Rest well the day after your longest ride.');
    }
    if (phaseId === 'build') {
      if (phaseProgress < 0.4) notes.push('Volume is building. Prioritise sleep - this is when your body adapts.');
      else if (phaseProgress > 0.7) notes.push('Biggest weeks of the plan. Do not skip the easier rides - they flush fatigue and keep legs fresh for the long effort.');
    }
  }

  else if (goal === 'distance') {
    if (phaseId === 'foundation') {
      if (phaseProgress < 0.3) notes.push('Building the base. Every ride should feel comfortably within your limit right now.');
      else notes.push('Steady foundation work. Resist the urge to push - the big distances come later.');
    }
    if (phaseId === 'build') {
      if (phaseProgress < 0.4) notes.push('Long ride is growing. Focus on pacing the first half - you should have plenty left at the halfway point.');
      else if (phaseProgress > 0.7) notes.push('Biggest build weeks. Rest well between sessions and keep midweek rides easy.');
    }
    if (phaseId === 'specific') {
      if (phaseProgress < 0.5) notes.push('Getting close to your target distance. Start practising your full fuelling strategy on these rides.');
      else notes.push('Final specific weeks. Your legs know what distance feels like now. Trust the training.');
    }
  }

  else if (goal === 'event') {
    if (phaseId === 'foundation') {
      if (phaseProgress < 0.2) notes.push('Establish your routine - consistency matters more than pace right now.');
      else if (phaseProgress < 0.45) notes.push('Foundation work. Keep all efforts easy and build the habit of regular riding.');
      else if (phaseProgress < 0.75) notes.push('Foundation is bedding in. You should be settling into a rhythm by now.');
      else notes.push('Final foundation week. The aerobic base is forming - next phase the work steps up.');
    }
    if (phaseId === 'build') {
      if (phaseProgress < 0.25) notes.push('Build phase begins. Start your long rides a little easier than you think you need to.');
      else if (phaseProgress < 0.5) notes.push('Volume is stepping up. Keep easy days genuinely easy so you arrive at the weekend ride fresh.');
      else if (phaseProgress < 0.75) notes.push('Mid-build. The long ride is the priority - protect it by not overcooking midweek sessions.');
      else notes.push('Biggest build weeks. Rest well between sessions and do not skip the shorter rides.');
    }
    if (phaseId === 'specific') {
      if (phaseProgress < 0.2) notes.push('Specific phase begins. Your long rides are now approaching the distances that matter.');
      else if (phaseProgress < 0.45) notes.push('Specific work is building. These are the sessions that count most - arrive at them fresh and execute them well.');
      else if (phaseProgress < 0.75) notes.push('Start practising your full event nutrition and pacing strategy on long rides.');
      else notes.push('Final specific week. Execute it well - this is the last big training stimulus before the taper.');
    }
    if (phaseId === 'peak') notes.push('Your confidence week. Start conservatively. Eat throughout.');
  }

  // ── Athlete state overlays ──
  if (athleteState === 'novice') {
    if (phaseProgress < 0.2 && !notes.length) notes.push('Take it easy - building a base takes time and there are no shortcuts.');
    if (fuelling === 'none' || fuelling === 'little') {
      if (mainTarget > (useDuration ? 60 : 20)) notes.push('Bring food and water. Eat before you are hungry, drink before you are thirsty.');
    }
  }
  if (athleteState === 'detrained') {
    if (phaseId === 'foundation' && phaseProgress < 0.3) notes.push('Your fitness will come back faster than you expect. The early weeks will feel easy - that is intentional. Do not race the comeback.');
    else if (phaseId === 'foundation') notes.push('Fitness is returning. Resist the urge to push harder than the plan says - consistency beats intensity at this stage.');
  }
  if (athleteState === 'highly_trained' && (phaseId === 'specific' || phaseId === 'build') && phaseProgress > 0.5) {
    if (goalFinish === 'competitive') notes.push('Include some stretches at your target event pace.');
  }

  // ── Injury / energy overlays ──
  if (injury === 'ongoing' && !isRecovery) notes.push('Monitor the injury closely. If discomfort increases during or after this ride, take an extra rest day.');
  if (energy === 'poor' && phaseProgress < 0.5) notes.push('Energy is low - prioritise sleep over extra training. A well-rested moderate session beats an exhausted long one.');

  // ── Fallback ──
  if (!notes.length) {
    if (phaseId === 'foundation') return 'Steady base work. Keep the effort comfortable and focus on completing the session.';
    if (phaseId === 'build')      return 'Progressive week. Complete the long ride at a pace you could sustain for longer.';
    if (phaseId === 'specific')   return 'Specific prep. These are the most important weeks - execute them well.';
    return 'Steady progression. Execute each session at the right effort level.';
  }

  return notes.join(' ');
}

/* ════════════════════════════════════════════════════════════════
   5. GENERATE DISPLAY DATA
   ════════════════════════════════════════════════════════════════ */

function buildProfileRows(profile, answers) {
  const { unit, model, athleteState, demandCat, riskLevel, terrain, loaded,
          isMultiDay, eventDays, eventDayDist, eventDayDuration, useDuration,
          progressionTolerance, availType } = profile;

  const stateLabels = {
    novice:         'Novice',
    detrained:      'Detrained experienced',
    moderate:       'Moderately trained',
    highly_trained: 'Highly trained',
  };
  const demandLabels = {
    loaded_multi_ultra: 'Loaded multi-day ultra',
    multi_day:          'Multi-day endurance',
    ultra:              'Ultra endurance',
    endurance:          'Endurance',
    short_endurance:    'Short endurance',
    fitness:            'Fitness / no event',
    beginner:           'Beginner',
  };
  const riskColour = { high: 'red', moderate: 'amber', low: 'green' };
  const tolLabels = { conservative: 'Conservative', moderate: 'Moderate', aggressive: 'Aggressive' };

  const rows = [
    { label: 'Programme model',   value: model },
    { label: 'Athlete state',     value: stateLabels[athleteState] || athleteState },
  ];

  if (demandCat !== 'fitness' && demandCat !== 'beginner') {
    rows.push({ label: 'Event category', value: demandLabels[demandCat] || demandCat });
  }

  if (eventDayDist && !useDuration) {
    const d = display(eventDayDist, unit);
    rows.push({ label: 'Event-day distance', value: `${d} ${unit}${isMultiDay ? ' per day' : ''}` });
  }
  if (eventDayDuration && useDuration) {
    const hrs = Math.floor(eventDayDuration / 60);
    const mins = eventDayDuration % 60;
    rows.push({ label: 'Event-day duration', value: `${hrs}h${mins ? ' ' + mins + 'min' : ''}${isMultiDay ? ' per day' : ''}` });
  }
  if (isMultiDay) {
    rows.push({ label: 'Event days', value: `${eventDays} days` });
  }

  rows.push({ label: 'Terrain',       value: terrain.charAt(0).toUpperCase() + terrain.slice(1) });
  if (loaded !== 'no') {
    rows.push({ label: 'Luggage load', value: loaded === 'loaded' ? 'Fully loaded' : 'Light luggage' });
  }
  rows.push({ label: 'Risk level',          value: riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1), flag: riskColour[riskLevel] });
  rows.push({ label: 'Progression style',   value: tolLabels[progressionTolerance] });
  rows.push({ label: 'Training availability', value: availType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) });

  return rows;
}

function buildStrategyText(profile, strategyParts) {
  const { athleteState, demandCat, isMultiDay, isLoaded, goal, weeksToEvent,
          riskLevel, terrain, goalFinish } = profile;

  const para1 = (() => {
    if (goal === 'new') return `This plan builds your cycling confidence from the ground up across ${weeksToEvent} weeks. The focus is on routine, comfort, and enjoyment - not performance.`;
    if (goal === 'fitness') return `This ${weeksToEvent}-week plan develops your cycling fitness progressively through repeatable training blocks. The emphasis is on consistency and sustainable improvement.`;
    if (goal === 'distance') return `This plan builds you toward your target distance across ${weeksToEvent} weeks using progressive long-ride development. The goal is to arrive at your target feeling capable and confident, not exhausted.`;
    const eventDesc = demandCat === 'loaded_multi_ultra' ? 'loaded multi-day endurance challenge'
      : demandCat === 'multi_day' ? 'multi-day event'
      : demandCat === 'ultra' ? 'ultra endurance event'
      : 'event';
    return `This ${weeksToEvent}-week plan prepares you for your ${eventDesc}. The programme is structured to build fitness progressively and deliver you to the start line ready - not worn out.`;
  })();

  const para2 = strategyParts.length
    ? `The core strategy combines ${strategyParts.join(', ')}.`
    : 'The plan follows a structured build with regular recovery to maximise adaptation.';

  const para3 = (() => {
    if (riskLevel === 'high') return 'Given the risk factors identified, this plan prioritises safe progression and conservative load management. Monitor your body closely and do not skip recovery weeks.';
    if (isMultiDay) return 'The key differentiator for multi-day events is back-to-back riding - training the legs to go again while already fatigued. This is built in progressively through the plan.';
    if (isLoaded) return 'Loaded sessions are introduced progressively. Riding with your event equipment changes handling and increases fatigue - your body needs time to adapt before race day.';
    if (profile.eventType === 'mtb') return 'Duration-based targets are used throughout - distance is unreliable on trail. Time in the saddle is your anchor, but don\'t neglect technical riding practice alongside the fitness work.';
    if (terrain === 'mountainous') return 'Duration-based targets are used throughout because distance becomes unreliable on mountainous terrain. Time in the saddle is your main anchor.';
    if (demandCat === 'ultra') return 'At 150+ miles, the event itself is the hardest day. Your job in training is to build the aerobic base and mental resilience to sustain effort for that long - not to replicate the distance. Trust the process and do not skip recovery weeks.';
    if (demandCat === 'endurance') return 'The specific phase long rides are the most important sessions in this plan. Arrive at them fresh, execute them well, and the event day will take care of itself.';
    if (terrain === 'hilly' || terrain === 'mountainous') return 'Climbing fitness comes from accumulated time on hills, not single big efforts. Keep your hilly routes across both easy and hard weeks - the body adapts to gradient through repetition.';
    return 'Recovery weeks are not optional - they are where adaptation happens. Arriving at each new phase fresh will deliver better results than grinding through fatigue.';
  })();

  return [para1, para2, para3];
}

function buildKeyFocus(profile) {
  const { athleteState, demandCat, isMultiDay, isLoaded, isFullLoad, terrain,
          goalFinish, fuelling, tools, riskLevel, goal, otherSports, injury } = profile;
  const focus = [];

  // Always included
  if (goal === 'new') {
    focus.push({ title: 'Confidence before fitness', desc: 'Your first goal is to enjoy riding and build a routine. Performance comes later.' });
    focus.push({ title: 'Safety and bike comfort', desc: 'Get comfortable with your bike, basic road skills, and riding in traffic before anything else.' });
  } else {
    focus.push({ title: 'Aerobic base first', desc: 'Build your Zone 2 foundation before adding any intensity. Durability must come before speed.' });
  }

  if (isMultiDay) {
    focus.push({ title: 'Back-to-back tolerance', desc: 'Train the legs to go again on day 2 and 3 despite accumulated fatigue - this is the key skill for multi-day events.' });
  }

  if (isFullLoad) {
    focus.push({ title: 'Loaded adaptation', desc: 'Ride with your actual event equipment during specific phase sessions. Handling, fatigue cost, and pacing all change under load.' });
  } else if (isLoaded) {
    focus.push({ title: 'Kit familiarisation', desc: 'Introduce your luggage during specific phase rides so handling and pacing feel natural before the event.' });
  }

  if (profile.eventType === 'mtb') {
    focus.push({ title: 'Technical skills', desc: 'Fitness alone won\'t win an MTB event. Practise cornering, descending, and trail reading on every ride you can.' });
    if (terrain === 'hilly' || terrain === 'mountainous') {
      focus.push({ title: 'Climbing durability', desc: 'Build tolerance for sustained climbing on trail. Seated climbing efficiency on a MTB is different to road - practise it.' });
    }
  } else if (terrain === 'hilly' || terrain === 'mountainous') {
    focus.push({ title: 'Climbing durability', desc: 'Build tolerance for sustained climbing. Hilly long rides in the specific phase are non-negotiable.' });
  }

  if (fuelling === 'little' || fuelling === 'none') {
    focus.push({ title: 'Fuelling practice', desc: 'Train your gut to accept carbohydrate on the bike. Start with short sessions and build to full event fuelling.' });
  } else {
    focus.push({ title: 'Consistent fuelling', desc: 'Eat and drink on every ride over 60 minutes. Do not wait until you are hungry or thirsty.' });
  }

  if (goalFinish === 'strong' || goalFinish === 'competitive') {
    focus.push({ title: 'Pacing discipline', desc: 'Learn your sustainable pace and practise holding it in specific phase sessions. Start slower than feels right.' });
  }

  if (otherSports === 'hard') {
    focus.push({ title: 'Total load management', desc: 'Your other training contributes to overall fatigue. Reduce cycling intensity on weeks where other training is particularly hard.' });
  }

  if (riskLevel === 'high' || injury !== 'none') {
    focus.push({ title: 'Recovery discipline', desc: 'Recovery weeks are mandatory, not optional. Better to arrive at each phase fresh than to accumulate fatigue and break down.' });
  }

  if (tools && tools.includes('hrm')) {
    focus.push({ title: 'Heart rate control', desc: 'Use your HRM to keep easy rides genuinely easy. Most riders go too hard on endurance days - trust the data.' });
  }

  return focus.slice(0, 6); // spec says 3-6
}

function buildPhaseOverview(profile, phases) {
  const { unit, isMultiDay, isLoaded, terrain, goalFinish, useDuration, eventDayDist, eventDayDuration, anchor } = profile;
  const phaseColours = {
    foundation: '#34d399', build: '#2563eb', specific: '#8b5cf6',
    prepeak_recovery: '#a78bfa', peak: '#f59e0b', taper: '#a78bfa', event: '#f43f5e',
    consolidate: '#06b6d4', progress: '#6366f1',
  };

  return phases.map(p => {
    const end = p.weekStart + p.weekCount - 1;
    const weeksLabel = p.weekCount > 1 ? `${p.weekStart}–${end}` : `${p.weekStart}`;

    const goal = phaseGoal(p.id, profile);
    const load = phaseLoad(p.id);
    const keySession = phaseKeySession(p.id, profile, unit);
    const note = phaseNote(p.id, profile);

    return {
      id: p.id,
      name: p.name,
      weeks: weeksLabel,
      colour: phaseColours[p.id] || '#888888',
      goal,
      load,
      keySession: () => keySession,
      note,
    };
  });
}

function phaseGoal(id, profile) {
  const map = {
    foundation:       'Build consistency, aerobic base, and saddle time',
    build:            'Increase workload and event-specific readiness',
    specific:         'Train for the exact demands of your event or goal',
    prepeak_recovery: 'Absorb the Specific phase load before your biggest week',
    peak:             'Highest event specificity - prove your readiness',
    taper:            'Reduce fatigue while maintaining sharpness',
    event:            'Race or target week - arrive fresh and confident',
    consolidate:      'Recovery and confidence consolidation',
    progress:         'Increase challenge and extend your capabilities',
  };
  return map[id] || 'Training block';
}

function phaseLoad(id) {
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

function phaseKeySession(id, profile, unit) {
  const { isMultiDay, isLoaded, terrain } = profile;
  if (id === 'foundation') return 'Long endurance ride (unloaded)';
  if (id === 'build') return isMultiDay ? 'Back-to-back weekend rides' : 'Progressive long ride';
  if (id === 'specific') {
    if (isLoaded && isMultiDay) return 'Back-to-back loaded rides on event terrain';
    if (isLoaded) return 'Loaded long ride on event terrain';
    if (isMultiDay) return 'Back-to-back weekend rides with event pacing';
    if (terrain === 'hilly' || terrain === 'mountainous') return 'Hilly long ride at event intensity';
    return 'Event simulation long ride';
  }
  if (id === 'prepeak_recovery') return 'Easy spin - legs fresh, no heroics';
  if (id === 'peak') return isMultiDay ? 'Strongest back-to-back simulation' : 'Peak long ride - event conditions';
  if (id === 'taper') return 'Short easy spin - maintain movement only';
  if (id === 'event') return 'Shakeout ride the day before (optional)';
  return 'Long endurance ride';
}

function phaseNote(id, profile) {
  const { athleteState, isMultiDay, isLoaded } = profile;
  if (id === 'foundation') return athleteState === 'novice'
    ? 'Focus on consistency and enjoyment. Nothing heroic.'
    : 'Establish your routine. Resist the urge to go hard.';
  if (id === 'build') return isMultiDay
    ? 'Volume increases progressively. Back-to-back sessions introduced mid-phase.'
    : 'Volume increases progressively. A recovery week mid-phase prevents accumulated fatigue.';
  if (id === 'specific') return isLoaded
    ? 'Event equipment mandatory for loaded sessions. Dial in packing and handling.'
    : 'Sessions should mimic your event conditions as closely as possible.';
  if (id === 'prepeak_recovery') return 'This week is deliberate. Cut volume, sleep well, eat well. You are not losing fitness - you are banking it.';
  if (id === 'peak') return 'One targeted week. Nail nutrition and sleep going in.';
  if (id === 'taper') return 'Cut volume by 40-60%. Trust the training. Do not add extra sessions.';
  if (id === 'event') return 'Short shakeout only. Pack early. Eat well. Sleep.';
  if (id === 'consolidate') return 'Let your body absorb the previous block. Keep rides easy.';
  if (id === 'progress') return 'Push the challenge slightly. Monitor fatigue carefully.';
  return '';
}

/* ── Graph data ── */
function buildGraph(weeks) {
  return weeks.map(w => w.mainTarget);
}

/* ── Support guidance ── */
function buildGuidance(profile) {
  const { isMultiDay, isLoaded, terrain, tools, fuelling, injury, unit, goalFinish } = profile;
  const distWord = unit === 'km' ? 'kilometres' : 'miles';

  const points = [];

  points.push({
    title: 'Effort and pacing',
    body: tools && tools.includes('hrm')
      ? 'Keep easy rides in Zone 2. You should be able to hold a full conversation. Use your heart rate monitor to verify, not just feel.'
      : tools && tools.includes('power')
      ? 'Use endurance power for long rides. Stay below threshold on all base sessions. Higher power comes later in the plan.'
      : 'Most sessions should feel comfortably aerobic at a conversational effort. If you cannot speak in full sentences, slow down.',
  });

  const nutritionBody = fuelling === 'none' || fuelling === 'little'
    ? 'Start simple: one small snack (bar or banana) every 45 minutes on rides over 90 minutes. Practise this every ride - your gut needs training too.'
    : 'Target 60-90g carbohydrate per hour on rides over 90 minutes. Practise your event fuelling strategy in training, not for the first time on race day.';
  points.push({ title: 'Nutrition on the bike', body: nutritionBody });

  points.push({
    title: 'Hydration',
    body: isMultiDay
      ? 'Drink consistently throughout each day - at least 500ml per hour in cool conditions. Between event days, prioritise electrolyte replacement as well as plain water. Weigh yourself before and after long rides to calibrate your needs.'
      : 'Aim for 500ml per hour in cool conditions, more in heat or on hilly terrain. Add electrolytes on any ride over 2 hours. Never start a long ride under-hydrated.',
  });

  if (isMultiDay) {
    points.push({
      title: 'Between-day recovery',
      body: 'The 60 minutes after finishing each day are critical. Prioritise carbohydrate and protein immediately, then rest. Sleep 8+ hours. Prepare kit and logistics in the evening so mornings are stress-free.',
    });
  } else {
    points.push({
      title: 'Recovery',
      body: 'The first 30-60 minutes after a long ride are your most valuable recovery window. Carbohydrate and protein first, then rest. Sleep is your most powerful training tool - prioritise 8+ hours on hard training weeks.',
    });
  }

  if (isLoaded) {
    points.push({
      title: 'Riding with your load',
      body: 'Use your exact event bags, packing, and bike setup for all loaded training sessions. Do not test new equipment on event day. Pack heavier items low and central for better handling. Expect to ride 10-15% slower when fully loaded.',
    });
  }

  if (terrain === 'hilly' || terrain === 'mountainous') {
    points.push({
      title: 'Climbing and terrain',
      body: terrain === 'mountainous'
        ? `On mountainous terrain, duration matters more than ${distWord}. Pace climbs conservatively - it is easy to overcook an early climb and pay for it later. Practise descending at speed safely before your event.`
        : 'Include hilly routes progressively through your build and specific phases. Pacing uphill is a skill - start climbs easier than feels necessary.',
    });
  }

  points.push({
    title: 'Starting sessions well',
    body: `Begin every ride gently - 10-15 minutes of easy spinning before settling into your target pace. On cold days or indoor sessions, extend this. Your first few ${distWord} should never be your hardest.`,
  });

  if (profile.demandCat === 'ultra' || profile.demandCat === 'loaded_multi_ultra') {
    points.push({
      title: 'Managing a very long day',
      body: 'Ultra-distance events have a psychological wall as well as a physical one, usually somewhere in the final third. Train yourself to break the event into sections mentally - focus on the next checkpoint, not the finish. Practise this on your longest training rides.',
    });
  }

  if (goalFinish === 'strong' || goalFinish === 'competitive') {
    points.push({
      title: 'Pacing strategy',
      body: 'The most common mistake in long events is going out too hard. Your target pace should feel almost embarrassingly easy in the first quarter. Use heart rate or power to enforce this discipline - not feel. The second half is where your pacing pays off.',
    });
  }

  if (injury !== 'none') {
    points.push({
      title: 'Managing your injury',
      body: injury === 'ongoing'
        ? 'You have indicated an ongoing injury. This plan is structured conservatively as a result. Please consult a sports physiotherapist or doctor before beginning - do not rely solely on this plan.'
        : 'Monitor your niggle closely. If it worsens after sessions, take an extra rest day before continuing. Flagging pain early prevents it becoming a bigger problem.',
    });
  }

  return { intro: 'Use this guidance alongside your training. These are not optional extras - they are part of the programme.', points };
}

/* ── Warnings ── */
function buildWarnings(profile, phases) {
  const { riskLevel, injury, energy, otherSports, weeksToEvent, eventDayDist,
          athleteState, demandCat, isMultiDay, isLoaded, unit, terrain } = profile;
  const warnings = [];

  if (injury === 'ongoing') {
    warnings.push({ level: 'high', text: 'You have indicated an ongoing injury. This plan has been made conservative as a result. Seek professional medical advice before starting and do not train through pain.' });
  }
  if (injury === 'minor') {
    warnings.push({ level: 'amber', text: 'A minor niggle has been noted. Monitor it throughout. If it worsens, take an unplanned rest day and reduce load before continuing.' });
  }

  if (energy === 'poor') {
    warnings.push({ level: 'high', text: 'Poor energy and sleep will limit your ability to adapt to training. Recovery weeks in this plan are essential - do not skip them. Address the underlying cause if possible.' });
  }
  if (energy === 'mixed') {
    warnings.push({ level: 'amber', text: 'Mixed energy or sleep has been noted. Keep easy sessions genuinely easy and prioritise sleep on hard training weeks.' });
  }

  if (otherSports === 'hard') {
    warnings.push({ level: 'amber', text: 'Hard training in other sports contributes significantly to your overall fatigue. Reduce cycling intensity on weeks where other training peaks.' });
  }

  // Timeline risk
  if (eventDayDist) {
    const weeksNeeded = eventDayDist > 130 ? 16 : eventDayDist > 80 ? 12 : 8;
    if (weeksToEvent < weeksNeeded * 0.7) {
      warnings.push({ level: 'high', text: `The timeline is compressed for an event of this demand. This plan prioritises safe completion over full preparation. Manage expectations and do not skip recovery weeks.` });
    }
  }

  if (athleteState === 'novice' && demandCat === 'ultra') {
    warnings.push({ level: 'high', text: 'This event is a significant challenge relative to your current fitness. The plan is structured conservatively - be honest about how your body is responding each week.' });
  }

  if (isLoaded) {
    warnings.push({ level: 'amber', text: 'Loaded riding changes handling and braking. Practise descending with your full event weight before race day - do not discover this for the first time at the event.' });
  }

  if (isMultiDay) {
    warnings.push({ level: 'amber', text: 'The ramp in load during the specific phase is intentional but significant. If you miss two or more consecutive weeks, reduce load before resuming - do not try to catch up.' });
  }

  // Event-specific amber warnings for moderate-risk plans that don't hit the high-risk flags
  if (demandCat === 'ultra' && athleteState !== 'highly_trained') {
    warnings.push({ level: 'amber', text: 'A 150+ mile event is a serious undertaking. Your peak week will not replicate the full distance - that is intentional. Trust that the accumulated training load prepares you, even if no single ride matches the event.' });
  }
  if ((terrain === 'hilly' || terrain === 'mountainous') && demandCat !== 'beginner') {
    warnings.push({ level: 'amber', text: 'Hilly events punish athletes who go out too hard on early climbs. Practise pacing climbs conservatively in training - especially on your specific phase long rides.' });
  }
  if (weeksToEvent >= 16 && athleteState === 'moderate') {
    warnings.push({ level: 'info', text: 'This is a long plan. Consistency across all 20 weeks matters more than any individual session. If life gets in the way, missing one week is fine - missing three in a row needs a plan adjustment.' });
  }

  // Always: units note - prompt user to try the other unit
  warnings.push({ level: 'info', text: 'Distances shown in your selected unit. Switch between miles and km in settings - all values update automatically.' });
  warnings.push({ level: 'info', text: 'Recovery weeks are included by design. Skipping them reduces adaptation and increases injury risk.' });

  return warnings;
}

/* ── Meta ── */
function buildMeta(profile, answers, progName) {
  const { weeksToEvent, eventDayDist, totalEventDist, isMultiDay, eventDays, unit, useDuration, eventDayDuration, goal } = profile;

  let eventDesc;
  if (goal === 'event' && answers.eventType) {
    const typeMap = { 'road-single': 'Road event', 'road-multi': 'Multi-day road event', gravel: 'Gravel event', mtb: 'Mountain bike event' };
    const dist = eventDayDist ? ` · ${display(totalEventDist || eventDayDist, unit)} ${unit}` : '';
    eventDesc = (typeMap[answers.eventType] || 'Event') + dist + (isMultiDay ? ` · ${eventDays} days` : '');
  } else if (goal === 'distance') {
    eventDesc = `Target distance: ${answers.targetDistance || '?'} ${unit}`;
  } else if (goal === 'fitness') {
    const goalMap = { distance: 'Ride further', speed: 'Ride faster', health: 'Get fitter', all: 'All-round improvement' };
    eventDesc = 'Fitness goal: ' + (goalMap[answers.fitnessGoal] || 'General fitness');
  } else {
    eventDesc = 'New to cycling - starter plan';
  }

  // Estimate event date
  const now = new Date();
  now.setDate(now.getDate() + weeksToEvent * 7);
  const eventDate = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return {
    weeks: weeksToEvent,
    event: eventDesc,
    eventDate,
  };
}

/* ════════════════════════════════════════════════════════════════
   TOP-LEVEL: generateProgramme(answers)
   ════════════════════════════════════════════════════════════════ */

function generateProgramme(answers, progName) {
  const unit = localStorage.getItem('units') || 'mi';
  // answers.entryUnit = the unit active when the user typed distances (preserved from creation).
  // answers.unit = current display unit (may differ after user toggles units).
  const entryUnit = answers.entryUnit || answers.unit || unit;
  answers = { ...answers, unit, entryUnit };

  // 1. Derive profile
  const profile = deriveProfile(answers);

  // 2. Strategy parts
  const strategyParts = selectStrategy(profile);

  // 3. Phases
  const phases = allocatePhases(profile);

  // 4. Weeks
  const weeks = buildWeeks(profile, phases);

  // 5. Assemble display data
  const profileRows  = buildProfileRows(profile, answers);
  const strategy     = buildStrategyText(profile, strategyParts);
  const keyFocus     = buildKeyFocus(profile);
  const phaseOverview = buildPhaseOverview(profile, phases);
  const graph        = buildGraph(weeks);
  const guidance     = buildGuidance(profile);
  const warnings     = buildWarnings(profile, phases);
  const meta         = buildMeta(profile, answers, progName);

  return {
    name:      progName,
    demo:      false,
    useDuration: profile.useDuration,
    unit,
    daysPerWeek: profile.daysPerWeek,
    availType:   profile.availType,
    meta,
    profile:   profileRows,
    strategy,
    keyFocus,
    phases:    phaseOverview,
    weeks,
    graph,
    guidance,
    warnings,
  };
}

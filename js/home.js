function getProgrammeCount() {
  function safeParse(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  }
  return safeParse('programmes').length + safeParse('running-programmes').length;
}

function buildLandingPage() {
  const main = document.getElementById('app-main');
  const count = getProgrammeCount();
  const countBadge = count > 0
    ? `<span class="landing-tile__count">${count} active ${count === 1 ? 'plan' : 'plans'}</span>`
    : `<span class="landing-tile__tag">No plans yet</span>`;

  main.innerHTML = `
    <div class="home">
      <h1 class="home__heading">Adaptive Training</h1>
      <p class="home__subheading">Build your programme. Track your progress.</p>

      <div class="landing-grid">

        <a class="landing-tile landing-tile--create" href="create.html">
          <div class="landing-tile__icon" style="color:#7c3aed">✦</div>
          <div class="landing-tile__name">Create a programme</div>
          <div class="landing-tile__desc">Build a personalised cycling or running plan</div>
        </a>

        <a class="landing-tile landing-tile--programmes" href="programmes.html">
          <div class="landing-tile__icon">📋</div>
          <div class="landing-tile__name">My programmes</div>
          <div class="landing-tile__desc">View and continue your saved plans</div>
          ${countBadge}
        </a>

        <a class="landing-tile landing-tile--goals" href="goals.html">
          <div class="landing-tile__icon">🎯</div>
          <div class="landing-tile__name">Goals</div>
          <div class="landing-tile__desc">Set targets and track what you are working toward</div>
        </a>

        <a class="landing-tile landing-tile--profile" href="profile.html">
          <div class="landing-tile__icon">👤</div>
          <div class="landing-tile__name">Profile</div>
          <div class="landing-tile__desc">Your details, preferences and training history</div>
        </a>

        <a class="landing-tile landing-tile--pbs" href="pbs.html">
          <div class="landing-tile__icon">🏆</div>
          <div class="landing-tile__name">Personal bests</div>
          <div class="landing-tile__desc">Your records and achievements</div>
        </a>

        <div class="landing-tile landing-tile--tests landing-tile--disabled">
          <div class="landing-tile__icon">🔬</div>
          <div class="landing-tile__name">Fitness tests</div>
          <div class="landing-tile__desc">Measure and track your fitness over time</div>
          <span class="landing-tile__tag">Coming soon</span>
        </div>

      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', buildLandingPage);
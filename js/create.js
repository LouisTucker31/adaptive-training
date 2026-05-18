function buildCreatePage() {
  const main = document.getElementById('app-main');

  let sports = [
    { id: 'cycling',  name: 'Cycling',  icon: '🚴', enabled: true,  href: 'cycling.html' },
    { id: 'running',  name: 'Running',  icon: '🏃', enabled: true,  href: 'running.html' },
    { id: 'swimming', name: 'Swimming', icon: '🏊', enabled: false },
    { id: 'strength', name: 'Strength', icon: '🏋️', enabled: false },
  ];

  // Put primary sport first if set in profile
  try {
    const profile = JSON.parse(localStorage.getItem('user-profile') || '{}');
    const primary = profile.primarySport ? profile.primarySport.toLowerCase() : null;
    if (primary === 'cycling' || primary === 'running') {
      sports.sort((a, b) => (a.id === primary ? -1 : b.id === primary ? 1 : 0));
    }
  } catch {}

  const tiles = sports.map(s => {
    if (s.enabled) {
      return `
        <a class="activity-tile activity-tile--active" href="${s.href}">
          <span class="activity-tile__icon">${s.icon}</span>
          <span class="activity-tile__name">${s.name}</span>
        </a>`;
    }
    return `
      <div class="activity-tile activity-tile--disabled">
        <span class="activity-tile__icon">${s.icon}</span>
        <span class="activity-tile__name">${s.name}</span>
        <span class="activity-tile__tag">Coming soon</span>
      </div>`;
  }).join('');

  main.innerHTML = `
    <div class="home">
      <h1 class="home__heading">Create a programme</h1>
      <p class="home__subheading">Choose your sport to get started.</p>
      <div class="activity-grid">${tiles}</div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.dataset.backLabel = 'Home';
  document.body.dataset.backHref  = 'index.html';
  buildCreatePage();
});
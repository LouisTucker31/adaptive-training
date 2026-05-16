const activities = [
  { id: 'cycling',     name: 'Cycling',     icon: '🚴',  enabled: true,  href: 'cycling.html' },
  { id: 'running',     name: 'Running',     icon: '🏃',  enabled: true,  href: 'running.html' },
  { id: 'swimming',    name: 'Swimming',    icon: '🏊',  enabled: false },
  { id: 'strength',    name: 'Strength',    icon: '🏋️',  enabled: false },
  { id: 'rowing',      name: 'Rowing',      icon: '🚣',  enabled: false },
  { id: 'triathlon',   name: 'Triathlon',   icon: '🏅',  enabled: false },
  { id: 'walking',     name: 'Walking',     icon: '🚶',  enabled: false },
  { id: 'yoga',        name: 'Yoga',        icon: '🧘',  enabled: false },
  { id: 'hiking',      name: 'Hiking',      icon: '🥾',  enabled: false },
  { id: 'skiing',      name: 'Skiing',      icon: '⛷️',  enabled: false },
];

function renderHome() {
  const main = document.getElementById('app-main');
  if (!main) return;

  const tiles = activities.map(a => {
    if (a.enabled) {
      return `
        <a class="activity-tile activity-tile--active" href="${a.href}" draggable="false">
          <span class="activity-tile__icon">${a.icon}</span>
          <span class="activity-tile__name">${a.name}</span>
        </a>`;
    }
    return `
      <div class="activity-tile activity-tile--disabled" aria-disabled="true">
        <span class="activity-tile__icon">${a.icon}</span>
        <span class="activity-tile__name">${a.name}</span>
        <span class="activity-tile__tag">Coming soon</span>
      </div>`;
  }).join('');

  main.innerHTML = `
    <section class="home">
      <h1 class="home__heading">Choose your sport</h1>
      <p class="home__subheading">Select an activity to start your adaptive plan.</p>
      <p class="home__section-label">Activities</p>
      <div class="activity-grid">${tiles}</div>
    </section>
  `;
}

document.addEventListener('DOMContentLoaded', renderHome);

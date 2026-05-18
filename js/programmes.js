function buildProgrammesPage() {
  const main = document.getElementById('app-main');

  const cycling = JSON.parse(localStorage.getItem('programmes') || '[]')
    .map(p => ({ ...p, sport: 'cycling' }));
  const running = JSON.parse(localStorage.getItem('running-programmes') || '[]')
    .map(p => ({ ...p, sport: 'running' }));

  const all = [...cycling, ...running].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (all.length === 0) {
    main.innerHTML = `
      <div class="home">
        <h1 class="home__heading">My programmes</h1>
        <p class="home__subheading">No programmes saved yet.</p>
        <a href="create.html" style="display:inline-block;margin-top:1rem;font-size:0.9375rem;font-weight:600;color:#2563eb;text-decoration:none;">
          + Create your first programme
        </a>
      </div>`;
    return;
  }

  const sportIcon  = { cycling: '🚴', running: '🏃' };
  const sportLabel = { cycling: 'Cycling', running: 'Running' };
  const sportColour = {
    cycling: 'rgba(37,99,235,0.07)',
    running: 'rgba(52,211,153,0.07)',
  };
  const sportBorder = {
    cycling: 'rgba(37,99,235,0.2)',
    running: 'rgba(52,211,153,0.2)',
  };

  function renderGroup(plans, sport) {
    if (plans.length === 0) return '';
    const cards = plans.map(p => {
      const url = `programme.html?id=${p.id}&name=${encodeURIComponent(p.name)}&sport=${p.sport}`;
      const date = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';
      return `
        <a class="prog-card" href="${url}" style="background:${sportColour[p.sport]};border-color:${sportBorder[p.sport]}">
          <div class="prog-card__top">
            <span class="prog-card__date">${date}</span>
          </div>
          <div class="prog-card__name">${p.name}</div>
          <div class="prog-card__meta">${p.meta || ''}</div>
        </a>`;
    }).join('');
    return `
      <div class="prog-group">
        <div class="prog-group__heading">
          <span>${sportIcon[sport]}</span>
          <span>${sportLabel[sport]}</span>
        </div>
        <div class="prog-list">${cards}</div>
      </div>`;
  }

  main.innerHTML = `
    <div class="home">
      <h1 class="home__heading">My programmes</h1>
      <p class="home__subheading">${all.length} saved ${all.length === 1 ? 'plan' : 'plans'}</p>
      ${renderGroup(cycling, 'cycling')}
      ${renderGroup(running, 'running')}
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.dataset.backLabel = 'Home';
  document.body.dataset.backHref  = 'index.html';
  buildProgrammesPage();
});
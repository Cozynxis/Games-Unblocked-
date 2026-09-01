const games = [
  {
    id: 'snake',
    title: 'Neon Snake',
    category: 'arcade',
    description: 'Grab glowing energy, grow longer and survive as the arena speeds up.',
    path: 'games/snake.html',
    cover: 'cover-snake',
    art: 'SNAKE',
    badge: 'ARCADE',
    plays: 'Fast reflexes',
    featured: true,
    rank: 1,
    tags: ['arcade', 'snake', 'neon', 'fast', 'reflex']
  },
  {
    id: 'pong',
    title: 'Brick Bounce',
    category: 'classic',
    description: 'Break the wall, chain hits and keep the ball alive with precise paddle control.',
    path: 'games/pong.html',
    cover: 'cover-pong',
    art: 'BOUNCE',
    badge: 'CLASSIC',
    plays: 'Skill based',
    featured: true,
    rank: 3,
    tags: ['classic', 'brick', 'breakout', 'paddle', 'ball']
  },
  {
    id: 'merge',
    title: 'Tile Merge',
    category: 'puzzle',
    description: 'Slide equal tiles together, build combos and chase the legendary 2048 tile.',
    path: 'games/2048.html',
    cover: 'cover-merge',
    art: '2048',
    badge: 'PUZZLE',
    plays: 'Think ahead',
    featured: true,
    rank: 2,
    tags: ['puzzle', '2048', 'numbers', 'logic', 'chill']
  }
];

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }
};

const state = {
  filter: 'all',
  query: '',
  sort: 'featured',
  view: storage.get('gu-view', 'grid'),
  favorites: storage.get('gu-favorites', []),
  recent: storage.get('gu-recent', []),
  theme: storage.get('gu-theme', 'dark')
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function saveState() {
  storage.set('gu-view', state.view);
  storage.set('gu-favorites', state.favorites);
  storage.set('gu-recent', state.recent);
  storage.set('gu-theme', state.theme);
}

function gameById(id) {
  return games.find(game => game.id === id);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function toast(message, icon = '✦') {
  const region = $('#toastRegion');
  if (!region) return;
  const element = document.createElement('div');
  element.className = 'toast';
  element.innerHTML = `<span class="toast-icon">${escapeHtml(icon)}</span><span>${escapeHtml(message)}</span>`;
  region.appendChild(element);
  window.setTimeout(() => {
    element.classList.add('out');
    window.setTimeout(() => element.remove(), 320);
  }, 2200);
}

function launch(id) {
  const game = gameById(id);
  if (!game) {
    toast('That game could not be found.', '!');
    return;
  }

  state.recent = [id, ...state.recent.filter(item => item !== id)].slice(0, 8);
  saveState();
  renderRecent();

  document.body.style.opacity = '0.92';
  document.body.style.transform = prefersReducedMotion ? '' : 'scale(.997)';
  window.setTimeout(() => {
    window.location.href = game.path;
  }, prefersReducedMotion ? 0 : 130);
}

function toggleFavorite(id, event) {
  event?.stopPropagation();
  if (!gameById(id)) return;

  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter(item => item !== id);
    toast('Removed from favorites', '☆');
  } else {
    state.favorites = [...state.favorites, id];
    toast('Added to favorites', '★');
  }

  saveState();
  renderGames();
}

function getFilteredGames() {
  const normalized = state.query.trim().toLowerCase();

  let result = games.filter(game => {
    const matchesFilter =
      state.filter === 'all' ||
      game.category === state.filter ||
      (state.filter === 'favorites' && state.favorites.includes(game.id));

    const haystack = [
      game.title,
      game.description,
      game.category,
      game.badge,
      game.plays,
      ...game.tags
    ].join(' ').toLowerCase();

    const matchesQuery = !normalized || haystack.includes(normalized);
    return matchesFilter && matchesQuery;
  });

  if (state.sort === 'az') result.sort((a, b) => a.title.localeCompare(b.title));
  if (state.sort === 'za') result.sort((a, b) => b.title.localeCompare(a.title));
  if (state.sort === 'featured') result.sort((a, b) => a.rank - b.rank);
  if (state.sort === 'recent') {
    result.sort((a, b) => {
      const aIndex = state.recent.indexOf(a.id);
      const bIndex = state.recent.indexOf(b.id);
      const safeA = aIndex === -1 ? 999 : aIndex;
      const safeB = bIndex === -1 ? 999 : bIndex;
      return safeA - safeB;
    });
  }

  return result;
}

function cardTemplate(game, index) {
  const favorite = state.favorites.includes(game.id);
  return `
    <article class="game-card" data-id="${game.id}" tabindex="0" role="button" aria-label="Play ${escapeHtml(game.title)}" style="--i:${index}">
      <div class="game-cover ${game.cover}">
        <div class="game-art">${escapeHtml(game.art)}</div>
        <span class="game-badge">${escapeHtml(game.badge)}</span>
        <span class="play-bubble">▶</span>
      </div>
      <div class="game-info">
        <div class="game-title-row">
          <h3>${escapeHtml(game.title)}</h3>
          <button class="favorite-btn ${favorite ? 'active' : ''}" data-fav="${game.id}" aria-label="${favorite ? 'Remove from' : 'Add to'} favorites" title="Favorite">
            ${favorite ? '★' : '☆'}
          </button>
        </div>
        <p>${escapeHtml(game.description)}</p>
        <div class="meta-row">
          <span>${escapeHtml(game.plays)}</span>
          <span>Play now →</span>
        </div>
      </div>
    </article>
  `;
}

function bindGameCards() {
  $$('.game-card').forEach(card => {
    card.addEventListener('click', () => launch(card.dataset.id));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        launch(card.dataset.id);
      }
    });
  });

  $$('[data-fav]').forEach(button => {
    button.addEventListener('click', event => toggleFavorite(button.dataset.fav, event));
  });
}

function renderGames() {
  const grid = $('#gamesGrid');
  const empty = $('#emptyState');
  const result = getFilteredGames();

  grid.innerHTML = result.map(cardTemplate).join('');
  grid.className = `games-grid ${state.view === 'compact' ? 'compact' : ''}`;
  empty.classList.toggle('hidden', result.length > 0);

  const label = $('#resultsLabel');
  if (label) {
    const suffix = result.length === 1 ? 'game' : 'games';
    label.textContent = state.query
      ? `${result.length} ${suffix} matching “${state.query}”`
      : `Showing ${result.length} ${suffix}`;
  }

  bindGameCards();
}

function renderFeatured() {
  const grid = $('#featuredGrid');
  if (!grid) return;

  grid.innerHTML = games.filter(game => game.featured).map((game, index) => `
    <article class="featured-card" data-featured="${game.id}" tabindex="0" role="button" aria-label="Play ${escapeHtml(game.title)}">
      <div class="featured-bg ${game.cover}"></div>
      <span class="featured-play">▶</span>
      <div class="featured-content">
        <span class="featured-tag">${index === 0 ? 'EDITOR PICK' : escapeHtml(game.badge)}</span>
        <h3>${escapeHtml(game.title)}</h3>
        <p>${escapeHtml(game.description)}</p>
      </div>
    </article>
  `).join('');

  $$('[data-featured]').forEach(card => {
    const open = () => launch(card.dataset.featured);
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });
}

function renderPopular() {
  const list = $('#popularList');
  if (!list) return;

  const ranked = [...games].sort((a, b) => a.rank - b.rank);
  list.innerHTML = ranked.map((game, index) => `
    <div class="rank-item" data-play="${game.id}" style="--i:${index}">
      <span class="rank-num">${String(index + 1).padStart(2, '0')}</span>
      <span class="mini-icon">${escapeHtml(game.art.slice(0, 2))}</span>
      <div class="rank-copy">
        <strong>${escapeHtml(game.title)}</strong>
        <span>${escapeHtml(game.badge.toLowerCase())} • ${escapeHtml(game.plays)}</span>
      </div>
      <span class="play-arrow">→</span>
    </div>
  `).join('');

  $$('[data-play]').forEach(item => {
    item.addEventListener('click', () => launch(item.dataset.play));
  });
}

function renderRecent() {
  const list = $('#recentList');
  if (!list) return;

  const recentGames = state.recent.map(gameById).filter(Boolean);
  if (!recentGames.length) {
    list.innerHTML = '<div class="empty-mini">Play a game and it will appear here.</div>';
    return;
  }

  list.innerHTML = recentGames.map((game, index) => `
    <div class="recent-item" data-recent="${game.id}" style="--i:${index}">
      <span class="mini-icon">${escapeHtml(game.art.slice(0, 2))}</span>
      <div class="recent-copy">
        <strong>${escapeHtml(game.title)}</strong>
        <span>Continue playing</span>
      </div>
      <span class="play-arrow">→</span>
    </div>
  `).join('');

  $$('[data-recent]').forEach(item => {
    item.addEventListener('click', () => launch(item.dataset.recent));
  });
}

function renderSuggestions() {
  const box = $('#searchSuggestions');
  const query = state.query.trim().toLowerCase();

  if (!query) {
    box.classList.remove('open');
    box.innerHTML = '';
    return;
  }

  const matches = games.filter(game => {
    const text = `${game.title} ${game.category} ${game.tags.join(' ')}`.toLowerCase();
    return text.includes(query);
  }).slice(0, 4);

  if (!matches.length) {
    box.innerHTML = `
      <div class="suggestion-item">
        <span class="suggestion-icon">?</span>
        <div class="suggestion-copy"><strong>No direct match</strong><span>Try arcade, puzzle or classic</span></div>
      </div>`;
    box.classList.add('open');
    return;
  }

  box.innerHTML = matches.map(game => `
    <div class="suggestion-item" data-suggestion="${game.id}">
      <span class="suggestion-icon">${escapeHtml(game.art.slice(0, 2))}</span>
      <div class="suggestion-copy"><strong>${escapeHtml(game.title)}</strong><span>${escapeHtml(game.badge)} • Press to play</span></div>
    </div>
  `).join('');
  box.classList.add('open');

  $$('[data-suggestion]').forEach(item => {
    item.addEventListener('click', () => launch(item.dataset.suggestion));
  });
}

function randomGame() {
  const pool = getFilteredGames();
  const source = pool.length ? pool : games;
  const game = source[Math.floor(Math.random() * source.length)];
  if (game) launch(game.id);
}

function applyTheme(theme, silent = false) {
  state.theme = theme === 'light' ? 'light' : 'dark';
  document.body.classList.toggle('light', state.theme === 'light');
  $('#themeIcon').textContent = state.theme === 'light' ? '🌙' : '☀️';
  saveState();
  if (!silent) toast(`${state.theme === 'light' ? 'Light' : 'Dark'} theme enabled`, state.theme === 'light' ? '☀' : '☾');
}

function buildStars() {
  if (prefersReducedMotion) return;
  const container = $('#stars');
  if (!container) return;
  const fragment = document.createDocumentFragment();
  const amount = window.innerWidth < 700 ? 30 : 65;

  for (let index = 0; index < amount; index += 1) {
    const star = document.createElement('i');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty('--d', `${2.5 + Math.random() * 5}s`);
    star.style.setProperty('--delay', `${Math.random() * -6}s`);
    const size = 1 + Math.random() * 1.7;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    fragment.appendChild(star);
  }
  container.appendChild(fragment);
}

function setupRevealObserver() {
  const elements = $$('.reveal-up, .reveal-left, .reveal-right, .reveal-scale');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach(element => element.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

  elements.forEach(element => observer.observe(element));
}

function setupHeroMotion() {
  const showcase = $('#heroShowcase');
  if (!showcase || prefersReducedMotion || window.matchMedia('(pointer: coarse)').matches) return;

  showcase.addEventListener('mousemove', event => {
    const rect = showcase.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    showcase.style.transform = `perspective(900px) rotateX(${py * -4}deg) rotateY(${px * 5}deg) translateY(-2px)`;

    $$('[data-parallax]', showcase).forEach(card => {
      const strength = Number(card.dataset.parallax) || 1;
      card.style.translate = `${px * 9 * strength}px ${py * 8 * strength}px`;
    });
  });

  showcase.addEventListener('mouseleave', () => {
    showcase.style.transform = '';
    $$('[data-parallax]', showcase).forEach(card => card.style.translate = '');
  });
}

function setupMagneticButtons() {
  if (prefersReducedMotion || window.matchMedia('(pointer: coarse)').matches) return;
  $$('.magnetic').forEach(element => {
    element.addEventListener('mousemove', event => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      element.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
    });
    element.addEventListener('mouseleave', () => element.style.transform = '');
  });
}

function setupScrollEffects() {
  const progress = $('#scrollProgress');
  const topbar = $('#topbar');
  const backToTop = $('#backToTop');

  const update = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = max > 0 ? (scrollTop / max) * 100 : 0;
    progress.style.width = `${Math.min(100, percentage)}%`;
    topbar.classList.toggle('scrolled', scrollTop > 12);
    backToTop.classList.toggle('visible', scrollTop > 700);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' }));
}

function setupNavigationObserver() {
  if (!('IntersectionObserver' in window)) return;
  const links = $$('[data-nav]');
  const sections = ['games', 'featured', 'popular', 'recent'].map(id => document.getElementById(id)).filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
  }, { threshold: [0.2, 0.45, 0.7], rootMargin: '-20% 0px -55% 0px' });

  sections.forEach(section => observer.observe(section));
}

function setupMobileMenu() {
  const button = $('#mobileMenuBtn');
  const menu = $('#mobileMenu');
  if (!button || !menu) return;

  const close = () => {
    button.classList.remove('active');
    menu.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  button.addEventListener('click', () => {
    const open = !menu.classList.contains('open');
    button.classList.toggle('active', open);
    menu.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  });

  $$('a', menu).forEach(link => link.addEventListener('click', close));
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1000) close();
  });
}

function setupLibraryControls() {
  const search = $('#searchInput');
  const clear = $('#searchClear');

  search.addEventListener('input', event => {
    state.query = event.target.value;
    clear.classList.toggle('visible', state.query.length > 0);
    renderGames();
    renderSuggestions();
  });

  search.addEventListener('focus', renderSuggestions);
  search.addEventListener('blur', () => {
    window.setTimeout(() => $('#searchSuggestions').classList.remove('open'), 120);
  });

  clear.addEventListener('click', () => {
    search.value = '';
    state.query = '';
    clear.classList.remove('visible');
    renderGames();
    renderSuggestions();
    search.focus();
  });

  $$('.filter-chip').forEach(button => {
    button.addEventListener('click', () => {
      $$('.filter-chip').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.filter = button.dataset.filter;
      renderGames();
    });
  });

  $$('.view-btn').forEach(button => {
    button.classList.toggle('active', button.dataset.view === state.view);
    button.addEventListener('click', () => {
      $$('.view-btn').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      state.view = button.dataset.view;
      saveState();
      renderGames();
    });
  });

  $('#sortSelect').addEventListener('change', event => {
    state.sort = event.target.value;
    renderGames();
  });

  $('#resetFiltersBtn').addEventListener('click', () => {
    state.filter = 'all';
    state.query = '';
    search.value = '';
    $('#sortSelect').value = 'featured';
    state.sort = 'featured';
    $$('.filter-chip').forEach(item => item.classList.toggle('active', item.dataset.filter === 'all'));
    renderGames();
  });
}

function setupGlobalControls() {
  $('#clearRecentBtn').addEventListener('click', () => {
    state.recent = [];
    saveState();
    renderRecent();
    toast('Recent games cleared', '×');
  });

  $('#randomGameBtn').addEventListener('click', randomGame);
  $('#heroRandomBtn').addEventListener('click', randomGame);
  $('#aboutPlayBtn').addEventListener('click', randomGame);
  $('#themeBtn').addEventListener('click', () => applyTheme(state.theme === 'dark' ? 'light' : 'dark'));
  $('#quickSearchBtn').addEventListener('click', () => {
    $('#searchInput').focus();
    $('#heroSearchWrap').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
  });

  document.addEventListener('keydown', event => {
    const active = document.activeElement;
    const typing = active && ['INPUT', 'TEXTAREA', 'SELECT'].includes(active.tagName);

    if (event.key === '/' && !typing) {
      event.preventDefault();
      $('#searchInput').focus();
      $('#heroSearchWrap').scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    }

    if (event.key === 'Escape') {
      $('#searchInput').blur();
      $('#searchSuggestions').classList.remove('open');
    }
  });
}

function updateCounters() {
  $('#gameCount').textContent = games.length;
  $('#heroGameCount').textContent = games.length;
  $('#year').textContent = new Date().getFullYear();
  const allFilterCount = $('.filter-chip[data-filter="all"] span');
  if (allFilterCount) allFilterCount.textContent = games.length;
}

function finishLoader() {
  const loader = $('#pageLoader');
  window.setTimeout(() => loader?.classList.add('done'), prefersReducedMotion ? 0 : 500);
}

function init() {
  applyTheme(state.theme, true);
  updateCounters();
  buildStars();
  renderFeatured();
  renderGames();
  renderPopular();
  renderRecent();
  setupRevealObserver();
  setupHeroMotion();
  setupMagneticButtons();
  setupScrollEffects();
  setupNavigationObserver();
  setupMobileMenu();
  setupLibraryControls();
  setupGlobalControls();
  finishLoader();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

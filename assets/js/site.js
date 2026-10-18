(() => {
  let publications = [];

  const root = document.documentElement;
  const header = document.getElementById('site-header');
  const menuButton = document.getElementById('menu-toggle');
  const nav = document.getElementById('primary-nav');
  const themeButton = document.getElementById('theme-toggle');
  const searchInput = document.getElementById('publication-search');
  const list = document.getElementById('publication-list');
  const empty = document.getElementById('publication-empty');
  const count = document.getElementById('publication-count');
  const publicationTotal = document.getElementById('publication-total');
  const teamList = document.getElementById('team-members');
  const teamCount = document.getElementById('team-count');
  const teamDescription = document.getElementById('team-description');
  const teamName = document.getElementById('team-name');
  const teamAim = document.getElementById('team-aim');
  const activityList = document.getElementById('team-activities');
  const activityEmpty = document.getElementById('activity-empty');
  const teamEmpty = document.getElementById('team-empty');
  const topButton = document.getElementById('back-to-top');
  let activeYear = 'all';

  const savedTheme = localStorage.getItem('portfolio-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
  function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem('portfolio-theme', theme);
    if (themeButton) themeButton.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  }
  themeButton?.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  menuButton?.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    menuButton.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
    nav?.classList.toggle('is-open', !expanded);
  });
  nav?.addEventListener('click', event => {
    if (event.target.closest('a')) {
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.setAttribute('aria-label', 'Open navigation');
      nav.classList.remove('is-open');
    }
  });
  document.querySelectorAll('.filter-button').forEach(button => button.addEventListener('click', () => {
    activeYear = button.dataset.year;
    document.querySelectorAll('.filter-button').forEach(item => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    renderPublications();
  }));
  searchInput?.addEventListener('input', renderPublications);
  function renderPublications() {
    if (!list) return;
    const query = (searchInput?.value || '').trim().toLowerCase();
    const filtered = publications.filter(item => {
      const yearMatch = activeYear === 'all' || (activeYear === '2020s' ? item.year >= 2020 : item.year < 2020);
      return yearMatch && `${item.title} ${item.journal} ${item.authors} ${item.year}`.toLowerCase().includes(query);
    });
    list.innerHTML = filtered.map(item => {
      const url = publicationUrl(item);
      return `<article class="publication-item"><span class="pub-year">${item.year}</span><div><h3>${escapeHtml(item.title)}</h3><span class="pub-journal">${escapeHtml(item.journal || item.type || 'Publication')}</span><span class="pub-authors">${escapeHtml(item.authors || '')}</span></div>${url ? `<a class="pub-open" href="${escapeHtml(url)}" target="_blank" rel="noopener" aria-label="Open publication: ${escapeHtml(item.title)}">↗</a>` : '<span aria-hidden="true"></span>'}</article>`;
    }).join('');
    empty.hidden = filtered.length > 0;
    count.textContent = `Showing ${filtered.length} of ${publications.length} publications · from your JSON list`;
  }
  function publicationUrl(item) {
    const raw = item.doi || item.pdf || '';
    if (!raw) return '';
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://doi.org/${raw}`;
    try {
      const parsed = new URL(candidate);
      return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '';
    } catch {
      return '';
    }
  }
  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  if (list) {
    list.innerHTML = '<p class="publication-loading" role="status">Loading publications…</p>';
    count.textContent = 'Loading your publication list…';
    fetch('/assets/data/publications.json')
      .then(response => {
        if (!response.ok) throw new Error(`Publication JSON returned ${response.status}`);
        return response.json();
      })
      .then(records => {
        if (!Array.isArray(records)) throw new Error('Publication JSON must contain an array of publication objects');
        publications = records.filter(item => item && Number(item.year) && item.title).map(item => ({ ...item, year: Number(item.year) }));
        renderPublications();
        if (publicationTotal) publicationTotal.textContent = `${publications.length} publications`;
        if (!publications.length) {
          empty.hidden = false;
          empty.textContent = 'No publications are in the JSON list yet.';
          count.textContent = 'The publication list is empty.';
        }
      })
      .catch(error => {
        console.error('Could not load publications JSON:', error);
        list.innerHTML = '';
        empty.hidden = false;
        empty.textContent = 'The publication list could not be loaded. Check assets/data/publications.json.';
        count.textContent = 'Publication JSON unavailable.';
        if (publicationTotal) publicationTotal.textContent = 'Count unavailable';
      });
  }

  if (teamList) {
    fetch('/assets/data/wemetocn-members.json')
      .then(response => {
        if (!response.ok) throw new Error(`Member JSON returned ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data.members)) throw new Error('Member JSON must contain a members array');
        const members = data.members.filter(member => member && member.name);
        if (teamName && data.groupName) teamName.textContent = data.groupName;
        if (teamDescription && data.description) teamDescription.textContent = data.description;
        if (teamAim && data.aim) teamAim.textContent = data.aim;
        if (activityList) {
          const activities = Array.isArray(data.activities) ? data.activities : [];
          activityList.innerHTML = activities.map(renderActivity).join('');
          if (activityEmpty) activityEmpty.hidden = activities.length > 0;
        }
        if (teamCount) teamCount.textContent = `${members.length} ${members.length === 1 ? 'member' : 'members'}`;
        teamList.innerHTML = members.map(renderMember).join('');
        if (teamEmpty) teamEmpty.hidden = members.length > 0;
      })
      .catch(error => {
        console.error('Could not load WeMetOcn member data:', error);
        if (teamCount) teamCount.textContent = 'Profiles unavailable';
        if (teamEmpty) {
          teamEmpty.textContent = 'Member profiles could not be loaded.';
          teamEmpty.hidden = false;
        }
      });
  }

  function renderMember(member) {
    const name = String(member.name || '');
    const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
    const photo = safeUrl(member.photo, ['http:', 'https:']);
    const avatar = photo
      ? `<img class="team-photo" src="${escapeHtml(photo)}" alt="Portrait of ${escapeHtml(name)}" loading="lazy">`
      : `<span class="team-initials" aria-hidden="true">${escapeHtml(initials || 'W')}</span>`;
    const details = [member.role, member.affiliation].filter(Boolean).map(escapeHtml).join(' · ');
    const bio = member.bio ? `<p class="team-bio">${escapeHtml(member.bio)}</p>` : '';
    const emailUrl = member.email ? safeUrl(`mailto:${member.email}`, ['mailto:']) : '';
    const email = emailUrl ? `<a href="${escapeHtml(emailUrl)}">Email <span>↗</span></a>` : '';
    const links = (Array.isArray(member.links) ? member.links : []).map(link => {
      const url = safeUrl(link?.url, ['http:', 'https:', 'mailto:']);
      return url && link?.label ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(link.label)} <span>↗</span></a>` : '';
    }).join('');
    const actions = [email, links].filter(Boolean).join('');
    return `<article class="team-card"><div class="team-card-head">${avatar}<div><h3>${escapeHtml(name)}</h3>${details ? `<p class="team-role">${details}</p>` : ''}</div></div>${bio}${actions ? `<div class="team-links">${actions}</div>` : ''}</article>`;
  }

  function renderActivity(activity) {
    const item = typeof activity === 'string' ? { title: activity } : (activity || {});
    if (!item.title) return '';
    const year = item.year ? `<span class="activity-year">${escapeHtml(String(item.year))}</span>` : '';
    const description = item.description ? `<p>${escapeHtml(item.description)}</p>` : '';
    return `<article class="activity-card">${year}<div><h3>${escapeHtml(item.title)}</h3>${description}</div></article>`;
  }

  function safeUrl(value, protocols) {
    if (!value || typeof value !== 'string') return '';
    try {
      const url = new URL(value, window.location.href);
      return protocols.includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  document.body.classList.add('js-motion');
  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: .12 });
    revealItems.forEach(item => observer.observe(item));
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  const updateScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (y / max) * 100 : 0;
    document.getElementById('reading-progress-bar')?.style.setProperty('width', `${progress}%`);
    header?.classList.toggle('is-scrolled', y > 20);
    topButton?.classList.toggle('is-visible', y > 600);
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();
  topButton?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

  const year = document.getElementById('current-year');
  if (year) year.textContent = new Date().getFullYear();



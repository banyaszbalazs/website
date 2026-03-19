/* ═══════════════════════════════════════════════
   balazs734 — script.js
   ═══════════════════════════════════════════════ */

// ── CONFIG ──────────────────────────────────────
const YT_API_KEY    = 'AIzaSyD373NYvlnZkeMT1xfxgBQZve9Dku2k954';
const YT_CHANNEL_ID = 'UCKfQjFdNUJHTY8HCwlf5jLA';
const BASE          = 'https://www.googleapis.com/youtube/v3';

// ── INIT ────────────────────────────────────────
document.getElementById('yr').textContent = new Date().getFullYear();

// ── OLDAL VÁLTÁS ────────────────────────────────
function showPage(page) {
  ['home', 'setup'].forEach(p => {
    document.getElementById('page-' + p).classList.remove('active');
    const t = document.getElementById('tab-' + p);
    if (t) t.classList.remove('active');
  });
  document.getElementById('page-' + page).classList.add('active');
  const tb = document.getElementById('tab-' + page);
  if (tb) tb.classList.add('active');
  document.getElementById('mainNav').classList.remove('open');
  history.replaceState(null, '', '#' + page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── HAMBURGER ────────────────────────────────────
document.getElementById('menuToggle').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('mainNav').classList.toggle('open');
});
document.addEventListener('click', (e) => {
  const nav = document.getElementById('mainNav');
  if (nav.classList.contains('open')
      && !nav.contains(e.target)
      && e.target !== document.getElementById('menuToggle')) {
    nav.classList.remove('open');
  }
});
if (location.hash.replace('#', '') === 'setup') showPage('setup');

// ── SZÁM FORMÁZÁS ────────────────────────────────
function fmt(n) {
  n = parseInt(n, 10);
  if (isNaN(n)) return '—';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '') + 'K';
  return String(n);
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('hu-HU',
    { year: 'numeric', month: 'long', day: 'numeric' });
}

// ── YT FETCH ─────────────────────────────────────
async function ytFetch(endpoint, params) {
  const url = `${BASE}/${endpoint}?${new URLSearchParams({ ...params, key: YT_API_KEY })}`;
  try {
    const res = await fetch(url);
    if (!res.ok) { console.warn('YT API', res.status, endpoint); return null; }
    return await res.json();
  } catch (e) { console.warn('Fetch hiba', e); return null; }
}

// ── LEGÚJABB VIDEÓ ───────────────────────────────
async function loadLatest() {
  const data = await ytFetch('search', {
    part: 'snippet', channelId: YT_CHANNEL_ID,
    order: 'date', maxResults: 1, type: 'video'
  });

  if (!data) return;

  if (!data.items?.length) {
    document.getElementById('thumbLoading').style.display = 'none';
    document.getElementById('videoTitle').textContent = '—';
    return;
  }

  showLatest(data.items[0]);
}

function showLatest(item) {
  const vid = item.id?.videoId ?? item.id;
  const sn  = item.snippet;
  if (!vid || !sn) return;

  document.getElementById('videoCard').href         = `https://www.youtube.com/watch?v=${vid}`;
  document.getElementById('videoTitle').textContent = sn.title;
  document.getElementById('videoSub').textContent   = fmtDate(sn.publishedAt);

  const img  = document.getElementById('videoThumb');
  const load = document.getElementById('thumbLoading');
  img.src    = sn.thumbnails?.maxres?.url
            || sn.thumbnails?.high?.url
            || sn.thumbnails?.medium?.url
            || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
  img.onload  = () => { img.style.display = 'block'; load.style.display = 'none'; };
  img.onerror = () => {
    img.src = `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
    img.style.display = 'block'; load.style.display = 'none';
  };
}

// ── CSATORNA STATISZTIKA ─────────────────────────
async function loadStats() {
  const data = await ytFetch('channels', {
    part: 'statistics', id: YT_CHANNEL_ID
  });

  if (!data?.items?.[0]) return;

  const s = data.items[0].statistics;
  document.getElementById('subCount').textContent  = fmt(s.subscriberCount);
  document.getElementById('viewCount').textContent = fmt(s.viewCount);
}

// ── LEGNÉZETTEBB VIDEÓK ───────────────────────────
async function loadTopVideos() {
  const search = await ytFetch('search', {
    part: 'snippet', channelId: YT_CHANNEL_ID,
    order: 'viewCount', maxResults: 8, type: 'video'
  });

  if (!search) return;
  if (!search.items?.length) {
    document.getElementById('archiveGrid').innerHTML = '';
    return;
  }

  const ids   = search.items.map(i => i.id.videoId).join(',');
  const vdata = await ytFetch('videos', { part: 'statistics,snippet', id: ids });

  if (!vdata) return;
  if (!vdata.items?.length) {
    document.getElementById('archiveGrid').innerHTML = '';
    return;
  }

  const items = vdata.items
    .sort((a, b) => parseInt(b.statistics.viewCount) - parseInt(a.statistics.viewCount))
    .slice(0, 8)
    .map(v => ({ id: v.id, title: v.snippet.title, views: v.statistics.viewCount }));

  showTopVideos(items);
}

function showTopVideos(items) {
  const grid = document.getElementById('archiveGrid');
  grid.innerHTML = '';
  items.forEach((item, i) => {
    const a = document.createElement('a');
    a.className = 'archive-card';
    a.href      = `https://www.youtube.com/watch?v=${item.id}`;
    a.target    = '_blank';
    a.rel       = 'noopener';
    a.style.animationDelay = (i * 0.07) + 's';
    a.innerHTML = `
      <div class="archive-thumb">
        <img src="https://img.youtube.com/vi/${item.id}/mqdefault.jpg"
             alt="${item.title}" loading="lazy">
        <div class="archive-thumb-overlay">
          <div class="archive-play"><i class="fa-solid fa-play"></i></div>
        </div>
      </div>
      <div class="archive-info">
        <div class="archive-title">${item.title}</div>
        <div class="archive-views">
          <i class="fa-solid fa-eye" style="font-size:.55rem;margin-right:.3rem"></i>
          ${fmt(item.views)} megtekintés
        </div>
      </div>`;
    grid.appendChild(a);
  });
}

// ── INDÍTÁS ──────────────────────────────────────
loadLatest();
loadStats();
loadTopVideos();

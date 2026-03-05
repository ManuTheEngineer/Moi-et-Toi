// ===== VIEWPORT HEIGHT FIX (PWA mobile gap) =====
(function(){
  function setAppHeight(){
    document.documentElement.style.setProperty('--app-h',window.innerHeight+'px');
  }
  setAppHeight();
  window.addEventListener('resize',setAppHeight);
  window.addEventListener('orientationchange',function(){setTimeout(setAppHeight,120);});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)setAppHeight();});
  window.addEventListener('focus',setAppHeight);
  // Re-check a few times on load to catch late PWA viewport adjustments
  window.addEventListener('load',function(){
    setAppHeight();
    setTimeout(setAppHeight,50);
    setTimeout(setAppHeight,150);
    setTimeout(setAppHeight,300);
  });
})();

// ===== INDIVIDUAL SPACE PRIVACY =====
function enforcePrivacy() {
  // Hide the other person's individual space from More hub and menu
  const herPage = document.getElementById('pg-herspace');
  const hisPage = document.getElementById('pg-hisspace');
  // User can only access their own space
  if (user === 'him' && herPage) herPage.remove();
  if (user === 'her' && hisPage) hisPage.remove();
  // Hide menu items for the other person's space
  document.querySelectorAll('.mi').forEach(mi => {
    const h4 = mi.querySelector('h4');
    if (!h4) return;
    if (user === 'him' && h4.textContent === "Taylor's Space") mi.style.display = 'none';
    if (user === 'her' && h4.textContent === "Manu's Space") mi.style.display = 'none';
  });
  // Hide hub cards for the other person's space
  document.querySelectorAll('.hub-card').forEach(card => {
    const title = card.querySelector('.hc-title');
    if (!title) return;
    if (user === 'him' && title.textContent === "Taylor's Space") card.style.display = 'none';
    if (user === 'her' && title.textContent === "Manu's Space") card.style.display = 'none';
  });
}

// ===== LOCAL DATE HELPER (avoids UTC timezone bugs) =====
function localDate(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// ===== TIME AGO =====
function safeHref(url) {
  if (!url) return '';
  try { const u = new URL(url); return (u.protocol === 'http:' || u.protocol === 'https:') ? url : ''; } catch { return url.startsWith('/') ? url : ''; }
}

function esc(s) { return s ? s.replace(/</g,'&lt;').replace(/>/g,'&gt;') : ''; }

function timeAgo(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return days + 'd ago';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ===== TOAST =====
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('on');
  setTimeout(() => t.classList.remove('on'), 2500);
}

// ===== THEME =====
function getThemePref() {
  return localStorage.getItem('met_theme') || 'auto';
}

function applyTheme(pref) {
  const html = document.documentElement;
  if (pref === 'auto') {
    html.removeAttribute('data-theme');
  } else {
    html.setAttribute('data-theme', pref);
  }
  updateThemeColor();
  updateThemeUI();
}

function toggleTheme() {
  const modes = ['auto', 'dark', 'light'];
  const current = getThemePref();
  const next = modes[(modes.indexOf(current) + 1) % 3];
  localStorage.setItem('met_theme', next);
  applyTheme(next);
  closeMenu();
  const labels = { auto: 'System', dark: 'Dark', light: 'Light' };
  toast('Theme: ' + labels[next]);
}

function updateThemeColor() {
  const pref = getThemePref();
  const isDark = pref === 'dark' || (pref === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = isDark ? '#0C1220' : '#F8F6F3';
  // Update More page theme label if visible
  const mts = document.getElementById('more-theme-sub');
  if (mts) { const labels = { auto: 'Auto', dark: 'Dark', light: 'Light' }; mts.textContent = labels[pref]; }
}

function updateThemeUI() {
  const pref = getThemePref();
  const icon = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (icon && label) {
    if (pref === 'dark') { icon.textContent = '☾'; label.textContent = 'Theme: Dark'; }
    else if (pref === 'light') { icon.textContent = '☀'; label.textContent = 'Theme: Light'; }
    else { icon.textContent = '◐'; label.textContent = 'Theme: Auto'; }
  }
}

// ===== PULL TO REFRESH =====
let pullStartY = 0, pulling = false;

function initPullToRefresh() {
  const dash = document.getElementById('pg-dash');
  if (!dash) return;

  dash.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
      pullStartY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });

  dash.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    const dist = e.touches[0].clientY - pullStartY;
    const ptr = document.getElementById('ptr');
    if (dist > 0 && dist < 150 && ptr) {
      const h = Math.min(dist * 0.5, 50);
      ptr.style.height = h + 'px';
      if (dist > 80) {
        ptr.classList.add('show');
        document.querySelector('.ptr-text').textContent = 'Release to refresh';
      } else {
        ptr.classList.remove('show');
        document.querySelector('.ptr-text').textContent = 'Pull to refresh';
      }
    }
  }, { passive: true });

  dash.addEventListener('touchend', () => {
    if (!pulling) return;
    const ptr = document.getElementById('ptr');
    if (ptr && ptr.classList.contains('show')) {
      ptr.classList.add('refreshing');
      document.querySelector('.ptr-text').textContent = 'Refreshing...';
      listenMoods();
      setTimeout(() => {
        ptr.style.height = '0px';
        ptr.classList.remove('show', 'refreshing');
        toast('Refreshed');
      }, 800);
    } else if (ptr) {
      ptr.style.height = '0px';
      ptr.classList.remove('show');
    }
    pulling = false;
  });
}

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      // Check for updates every 30 minutes
      setInterval(() => reg.update(), 30 * 60 * 1000);
    }).catch(() => {});
    // Reload when new SW takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) { refreshing = true; location.reload(); }
    });
  });
}


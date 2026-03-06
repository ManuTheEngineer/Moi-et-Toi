// ===== VIEWPORT FIX (PWA full-screen coverage) =====
(function(){
  function fillScreen(){
    var h = Math.max(window.screen.height, window.innerHeight, document.documentElement.clientHeight);
    document.documentElement.style.setProperty('--real-h', h + 'px');
  }
  fillScreen();
  window.addEventListener('resize', fillScreen);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) fillScreen(); });

  // Dismiss keyboard on scroll (mobile UX)
  var scrollTick = false;
  window.addEventListener('scroll', function() {
    if (!scrollTick) {
      scrollTick = true;
      requestAnimationFrame(function() {
        var active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && !active.closest('.chat-input-wrap')) {
          if (window.scrollY > 60) active.blur();
        }
        scrollTick = false;
      });
    }
  }, { passive: true });
})();

// ===== DYNAMIC TIME-OF-DAY SYSTEM =====
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'afternoon';
  if (h >= 16 && h < 18) return 'golden';
  if (h >= 18 && h < 21) return 'evening';
  return 'night';
}

function updateTimeOfDay() {
  document.body.setAttribute('data-time', getTimeOfDay());
}

// Update every 5 minutes
updateTimeOfDay();
setInterval(updateTimeOfDay, 5 * 60 * 1000);

// ===== SHOW/HIDE HELPERS (works with d-none class OR inline style) =====
function showEl(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) return;
  el.classList.remove('d-none');
  el.style.display = '';
}
function hideEl(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) return;
  el.classList.add('d-none');
}
function toggleEl(id) {
  const el = typeof id === 'string' ? document.getElementById(id) : id;
  if (!el) return;
  if (el.classList.contains('d-none')) showEl(el); else hideEl(el);
}

// ===== FLOATING ORBS SYSTEM =====
function spawnOrbs() {
  const container = document.getElementById('particles');
  if (!container) return;

  const orbColors = {
    dawn: ['rgba(255,120,150,0.12)', 'rgba(180,140,255,0.10)', 'rgba(255,200,140,0.08)'],
    morning: ['rgba(255,200,100,0.10)', 'rgba(255,160,80,0.08)', 'rgba(255,220,160,0.07)'],
    afternoon: ['rgba(100,180,255,0.08)', 'rgba(80,200,200,0.07)', 'rgba(160,220,255,0.06)'],
    golden: ['rgba(255,140,50,0.12)', 'rgba(255,100,80,0.10)', 'rgba(255,180,60,0.08)'],
    evening: ['rgba(120,80,200,0.10)', 'rgba(200,100,150,0.08)', 'rgba(212,149,106,0.07)'],
    night: ['rgba(60,80,180,0.08)', 'rgba(100,60,180,0.07)', 'rgba(0,140,140,0.05)']
  };

  // Remove existing orbs
  container.querySelectorAll('.bg-orb').forEach(o => o.remove());

  const time = getTimeOfDay();
  const colors = orbColors[time] || orbColors.night;

  for (let i = 0; i < 4; i++) {
    const orb = document.createElement('div');
    orb.className = 'bg-orb';
    const size = 150 + Math.random() * 200;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = 20 + Math.random() * 25;
    const dx = (Math.random() - 0.5) * 120;
    const dy = (Math.random() - 0.5) * 80;
    orb.style.cssText = `
      width:${size}px;height:${size}px;
      left:${x}%;top:${y}%;
      background:${colors[i % colors.length]};
      --orb-dx:${dx}px;--orb-dy:${dy}px;
      --orb-opacity:${0.08 + Math.random() * 0.1};
      animation-duration:${duration}s;
      animation-delay:${i * 3}s;
    `;
    container.appendChild(orb);
  }
}

// Add mesh background layer
function addMeshLayer() {
  if (document.querySelector('.bg-mesh')) return;
  const mesh = document.createElement('div');
  mesh.className = 'bg-mesh';
  document.body.appendChild(mesh);
}

// Init on load
document.addEventListener('DOMContentLoaded', function() {
  spawnOrbs();
  addMeshLayer();
  // Re-spawn orbs when time period changes
  setInterval(function() {
    const current = document.body.getAttribute('data-time');
    const now = getTimeOfDay();
    if (current !== now) spawnOrbs();
  }, 5 * 60 * 1000);
});

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
  // Dismiss keyboard on mobile after form submit
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
    document.activeElement.blur();
  }
  // Add checkmark icon for positive messages
  const positive = /added|saved|shared|logged|set|sent|completed|achieved|noted|updated|removed/i.test(msg);
  t.innerHTML = (positive ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ' : '') + msg;
  t.classList.remove('on');
  // Force reflow for re-triggering animation
  void t.offsetWidth;
  t.classList.add('on');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('on'), 2500);
}

function openModal(html) {
  const overlay = document.getElementById('generic-modal');
  const content = document.getElementById('generic-modal-content');
  if (!overlay || !content) return;
  content.innerHTML = html;
  overlay.classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('generic-modal');
  if (overlay) overlay.classList.remove('on');
  document.body.style.overflow = '';
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

// ===== DYNAMIC VISUALS =====

// Mood-reactive accent color shift
function applyMoodReactiveUI() {
  if (typeof MET === 'undefined' || !MET._ready || !user) return;
  const stats = MET.mood.stats[user];
  if (!stats || !stats.avg7d) return;
  const avg = stats.avg7d;
  const root = document.documentElement;
  // Subtle hue shift based on mood (10-15% shift)
  if (avg <= 2) {
    root.style.setProperty('--mood-accent', 'rgba(74,144,217,0.08)');
    root.style.setProperty('--mood-glow', 'rgba(74,144,217,0.12)');
  } else if (avg >= 4) {
    root.style.setProperty('--mood-accent', 'rgba(196,120,74,0.1)');
    root.style.setProperty('--mood-glow', 'rgba(196,120,74,0.15)');
  } else {
    root.style.setProperty('--mood-accent', 'transparent');
    root.style.setProperty('--mood-glow', 'transparent');
  }
}

// Count-up animation for dashboard numbers
function animateCountUp(el, target, duration) {
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const diff = target - start;
  const steps = Math.max(20, Math.abs(diff));
  const stepTime = Math.max(duration / steps, 16);
  let current = start;
  const increment = diff / steps;
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.round(current);
    }
  }, stepTime);
}

// Scroll-triggered animation for charts
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  // Observe chart containers and cards with animation
  document.querySelectorAll('.chart-wrap, .rh-card, .fin-overview, .gs-summary, .sg-card, .habit-card').forEach(el => {
    el.classList.add('scroll-animate');
    observer.observe(el);
  });
}

// Time-based atmosphere (subtle background adjustments)
function updateAtmosphere() {
  const h = new Date().getHours();
  const root = document.documentElement;
  if (h >= 5 && h < 12) {
    root.style.setProperty('--atm-warmth', '0.03');
    root.style.setProperty('--atm-hue', '40');
  } else if (h >= 12 && h < 17) {
    root.style.setProperty('--atm-warmth', '0');
    root.style.setProperty('--atm-hue', '0');
  } else if (h >= 17 && h < 21) {
    root.style.setProperty('--atm-warmth', '0.05');
    root.style.setProperty('--atm-hue', '25');
  } else {
    root.style.setProperty('--atm-warmth', '0.04');
    root.style.setProperty('--atm-hue', '220');
  }
}

// Init all dynamic visuals
function initDynamicVisuals() {
  updateAtmosphere();
  setInterval(updateAtmosphere, 15 * 60 * 1000); // Update every 15 min
  // Delay scroll observer to ensure DOM is ready
  setTimeout(initScrollAnimations, 500);
  // Hook into metrics for mood-reactive UI
  if (typeof onMetricsUpdate === 'function') {
    onMetricsUpdate(applyMoodReactiveUI);
  }
}


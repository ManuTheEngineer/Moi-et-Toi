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

// ===== SKY SCENE SYSTEM =====
// Renders living backgrounds: moon/stars/shooting stars (dark), sun/clouds/birds (light)
// Rotates through different scenes every ~90 seconds

const SKY = {
  currentScene: null,
  sceneTimer: null,
  shootTimer: null,
  isDark: function() { return false; }
};

// Light mode scene configs
const LIGHT_SCENES = [
  { name:'clearDay', sun:true, clouds:3, birds:2, sunPos:{x:80,y:12}, lightShafts:2, haze:true },
  { name:'partlyCloudy', sun:true, clouds:5, birds:1, sunPos:{x:70,y:18}, lightShafts:3, haze:true },
  { name:'driftClouds', sun:false, clouds:7, birds:3, sunPos:{x:85,y:8}, lightShafts:0, haze:true },
  { name:'goldenHour', sun:true, clouds:3, birds:0, sunPos:{x:30,y:25}, golden:true, lightShafts:4, haze:true }
];

function initSkyScene() {
  const container = document.getElementById('sky-scene');
  if (!container) return;
  clearInterval(SKY.sceneTimer);
  clearTimeout(SKY.shootTimer);
  renderSkyScene(container);
  // Rotate scenes every 90s
  SKY.sceneTimer = setInterval(function() { renderSkyScene(container); }, 90000);
}

function renderSkyScene(container) {
  container.innerHTML = '';
  const scenes = LIGHT_SCENES;
  const time = getTimeOfDay();
  let scene;
  if (time === 'golden' || time === 'evening') {
    scene = scenes[3]; // golden hour
  } else {
    scene = scenes[Math.floor(Math.random() * 3)];
  }
  SKY.currentScene = scene;
  renderDaySky(container, scene);
}

// ===== DAY SKY ONLY =====
// Night sky rendering removed (light mode only)
function renderNightSky() {} /* stub */
/* REMOVED: original renderNightSky was here */
// ===== DAY SKY =====
function renderDaySky(container, scene) {
  // 1. Atmospheric haze layer
  if (scene.haze) {
    var atmoDay = document.createElement('div');
    atmoDay.className = 'sky-atmo-day';
    if (scene.golden) {
      atmoDay.style.background = 'linear-gradient(180deg,rgba(255,180,100,0.04) 0%,rgba(255,200,140,0.06) 40%,rgba(255,210,160,0.1) 100%)';
    }
    container.appendChild(atmoDay);
  }

  // 2. Sun
  if (scene.sun) {
    renderSun(container, scene.sunPos, scene.golden);
  }

  // 3. Light shafts (god rays from sun)
  for (var s = 0; s < (scene.lightShafts || 0); s++) {
    var shaft = document.createElement('div');
    shaft.className = 'sky-light-shaft';
    var shaftW = 40 + Math.random() * 60;
    var shaftH = 150 + Math.random() * 200;
    var shaftAngle = -15 + Math.random() * 30;
    var shaftX = scene.sunPos ? (100 - scene.sunPos.x / window.innerWidth * 100 - 10 + Math.random() * 20) : (50 + (Math.random() - 0.5) * 40);
    var shaftOpacity = scene.golden ? 0.06 : 0.03;
    shaft.style.cssText = 'width:' + shaftW + 'px;height:' + shaftH + 'px;right:' + shaftX + '%;top:' + (scene.sunPos ? scene.sunPos.y : 10) + '%;' +
      '--shaft-angle:' + shaftAngle + 'deg;--shaft-opacity:' + shaftOpacity + ';animation-delay:' + (s * 2) + 's';
    if (scene.golden) {
      shaft.style.background = 'linear-gradient(180deg,rgba(255,200,120,' + (shaftOpacity * 1.5) + '),transparent)';
    }
    container.appendChild(shaft);
  }

  // 4. Clouds (volumetric with shadows)
  for (var i = 0; i < scene.clouds; i++) {
    renderCloud(container, false, scene.golden);
  }

  // 5. Birds
  for (var i = 0; i < (scene.birds || 0); i++) {
    (function(idx) {
      setTimeout(function() { renderBird(container); }, idx * 4000 + Math.random() * 3000);
    })(i);
  }

  // 6. Multi-layer horizon glow
  var hz1 = document.createElement('div');
  hz1.className = 'sky-horizon';
  if (scene.golden) {
    hz1.style.cssText = 'height:250px;background:linear-gradient(to top,rgba(255,140,50,0.1),rgba(255,180,80,0.05),rgba(255,200,120,0.02),transparent)';
  } else {
    hz1.style.cssText = 'height:150px;background:linear-gradient(to top,rgba(180,200,230,0.06),rgba(200,215,240,0.03),transparent)';
  }
  container.appendChild(hz1);

  // Subtle warm undertone
  var hz2 = document.createElement('div');
  hz2.className = 'sky-horizon';
  hz2.style.cssText = 'height:60px;background:linear-gradient(to top,rgba(200,180,160,0.04),transparent)';
  container.appendChild(hz2);

  // 7. Lens flare near sun
  if (scene.sun) {
    var flare = document.createElement('div');
    flare.className = 'sky-sun-flare';
    var fs = 100 + Math.random() * 80;
    flare.style.cssText = 'width:' + fs + 'px;height:' + (fs * 0.5) + 'px;right:' + (scene.sunPos.x - 20) + 'px;top:' + (scene.sunPos.y + 5) + '%';
    if (scene.golden) flare.style.background = 'radial-gradient(ellipse,rgba(255,200,100,.15),transparent 70%)';
    container.appendChild(flare);
  }
}

function renderSun(container, pos, golden) {
  const size = golden ? 70 : 55;
  const sun = document.createElement('div');
  sun.className = 'sky-sun';
  sun.style.cssText = 'width:' + size + 'px;height:' + size + 'px;right:' + pos.x + 'px;top:' + pos.y + '%';

  if (golden) {
    sun.style.background = 'radial-gradient(circle,#FFEECC 0%,#FFB347 40%,#E67E22 100%)';
    sun.style.boxShadow = '0 0 80px rgba(255,160,40,.5),0 0 160px rgba(255,120,20,.2)';
  }

  // Rays
  var numRays = 8;
  for (let i = 0; i < numRays; i++) {
    const ray = document.createElement('div');
    ray.className = 'sky-sun-ray';
    const angle = (360 / numRays) * i;
    const len = 30 + Math.random() * 40;
    ray.style.cssText = 'width:' + len + 'px;--ray-angle:' + angle + 'deg;transform:rotate(' + angle + 'deg);animation-delay:' + (i * 0.3) + 's';
    if (golden) ray.style.background = 'linear-gradient(90deg,rgba(255,180,60,.4),transparent)';
    sun.appendChild(ray);
  }

  // Outer glow
  var glow = document.createElement('div');
  glow.className = 'sky-sun-glow';
  var gs = size * 3;
  glow.style.cssText = 'width:' + gs + 'px;height:' + gs + 'px;top:' + (-(gs - size) / 2) + 'px;left:' + (-(gs - size) / 2) + 'px';
  sun.appendChild(glow);

  // Second wider glow layer
  var glow2 = document.createElement('div');
  glow2.className = 'sky-sun-glow';
  var gs2 = size * 5;
  glow2.style.cssText = 'width:' + gs2 + 'px;height:' + gs2 + 'px;top:' + (-(gs2 - size) / 2) + 'px;left:' + (-(gs2 - size) / 2) + 'px;' +
    'background:radial-gradient(circle,rgba(255,220,100,.06),transparent 60%);animation-delay:3s';
  sun.appendChild(glow2);

  // Corona ring
  var corona = document.createElement('div');
  corona.className = 'sky-sun-corona';
  var cs = size * 2;
  corona.style.cssText = 'width:' + cs + 'px;height:' + cs + 'px;top:' + (-(cs - size) / 2) + 'px;left:' + (-(cs - size) / 2) + 'px';
  if (golden) corona.style.borderColor = 'rgba(255,180,60,.15)';
  sun.appendChild(corona);

  container.appendChild(sun);
}

function renderCloud(container, isDarkMode, isGolden) {
  const cloud = document.createElement('div');
  cloud.className = 'sky-cloud' + (isDarkMode ? ' sky-cloud-dark' : '');

  // Cloud body made of overlapping puffs
  const w = 60 + Math.random() * 80;
  const h = 20 + Math.random() * 15;
  const y = 8 + Math.random() * 30;
  const dur = 50 + Math.random() * 50;
  const delay = Math.random() * 30;
  const dir = Math.random() < 0.5 ? -1 : 1;
  const opacity = isDarkMode ? (0.3 + Math.random() * 0.3) : (0.4 + Math.random() * 0.3);

  cloud.style.cssText = 'top:' + y + '%;--cloud-dur:' + dur + 's;--cloud-delay:' + delay + 's;' +
    '--cloud-start:' + (dir > 0 ? '-' + (w + 50) + 'px' : '110vw') + ';' +
    '--cloud-end:' + (dir > 0 ? '110vw' : '-' + (w + 50) + 'px') + ';' +
    '--cloud-opacity:' + opacity;

  // Main body
  const body = document.createElement('div');
  body.className = 'sky-cloud-body';
  body.style.cssText = 'width:' + w + 'px;height:' + h + 'px';
  if (isGolden && !isDarkMode) {
    body.style.background = 'rgba(255,220,180,0.4)';
  }
  cloud.appendChild(body);

  // Puffs
  var puffCount = 3 + Math.floor(Math.random() * 3);
  for (var p = 0; p < puffCount; p++) {
    var puff = document.createElement('div');
    puff.className = 'sky-cloud-puff';
    var pw = h * (0.8 + Math.random() * 0.6);
    var px = (w * 0.15) + Math.random() * (w * 0.6);
    puff.style.cssText = 'width:' + pw + 'px;height:' + pw + 'px;left:' + px + 'px;top:' + (-(pw * 0.4)) + 'px;border-radius:50%';
    if (isGolden && !isDarkMode) puff.style.background = 'rgba(255,220,180,0.35)';
    cloud.appendChild(puff);
  }

  if (!isDarkMode) {
    // Bottom shadow for volumetric depth
    var shadow = document.createElement('div');
    shadow.className = 'sky-cloud-shadow';
    shadow.style.cssText = 'width:' + (w * 0.85) + 'px;height:' + (h * 0.5) + 'px;left:' + (w * 0.1) + 'px;bottom:-' + (h * 0.15) + 'px';
    if (isGolden) shadow.style.background = 'rgba(180,100,40,.06)';
    cloud.appendChild(shadow);

    // Top highlight for rim lighting
    var highlight = document.createElement('div');
    highlight.className = 'sky-cloud-highlight';
    highlight.style.cssText = 'width:' + (w * 0.6) + 'px;height:' + (h * 0.3) + 'px;left:' + (w * 0.15) + 'px;top:-' + (h * 0.25) + 'px';
    if (isGolden) highlight.style.background = 'rgba(255,240,200,.15)';
    cloud.appendChild(highlight);

    // Trailing wisp
    if (Math.random() < 0.5) {
      var wisp = document.createElement('div');
      wisp.className = 'sky-cloud-wisp';
      var wispW = w * 0.4;
      wisp.style.cssText = 'width:' + wispW + 'px;height:' + (h * 0.4) + 'px;' +
        (Math.random() < 0.5 ? 'right:-' + (wispW * 0.3) + 'px' : 'left:-' + (wispW * 0.3) + 'px') +
        ';top:' + (h * 0.1) + 'px;background:rgba(255,255,255,.2)';
      if (isGolden) wisp.style.background = 'rgba(255,220,180,.15)';
      cloud.appendChild(wisp);
    }
  }

  container.appendChild(cloud);
}

function renderBird(container) {
  const bird = document.createElement('div');
  bird.className = 'sky-bird';
  const startX = -20 + Math.random() * 30;
  const startY = 10 + Math.random() * 25;
  const dx = 200 + Math.random() * 300;
  const dy = -(20 + Math.random() * 40);
  const dur = 10 + Math.random() * 8;

  bird.style.cssText = 'left:' + startX + '%;top:' + startY + '%;--bird-dx:' + dx + 'px;--bird-dy:' + dy + 'px;--bird-dur:' + dur + 's';

  const wl = document.createElement('div');
  wl.className = 'sky-bird-wing sky-bird-wing-l';
  const wr = document.createElement('div');
  wr.className = 'sky-bird-wing sky-bird-wing-r';
  bird.appendChild(wl);
  bird.appendChild(wr);

  container.appendChild(bird);
  // Remove after animation
  setTimeout(function() { if (bird.parentNode) bird.remove(); }, (dur + 2) * 1000);
}

// Theme is light-only — no change handler needed
function onThemeChange() {}

// Init on load
document.addEventListener('DOMContentLoaded', function() {
  spawnOrbs();
  addMeshLayer();
  initSkyScene();
  // Light mode only — no theme change listener needed
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

// ===== THEME (light only) =====
function getThemePref() { return 'light'; }
function applyTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = '#F8F6F3';
}
function toggleTheme() {}
function updateThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = '#F8F6F3';
}
function updateThemeUI() {}

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


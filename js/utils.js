// ===== VIEWPORT FIX (PWA full-screen coverage) =====
(function(){
  var fullH = 0;
  function fillScreen(){
    var h = Math.max(window.screen.height, window.innerHeight, document.documentElement.clientHeight);
    document.documentElement.style.setProperty('--real-h', h + 'px');
    if (h > fullH) fullH = h; // Track max height (before keyboard)
  }
  fillScreen();
  window.addEventListener('resize', fillScreen);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) fillScreen(); });

  // Track visual viewport for keyboard-aware layouts
  if (window.visualViewport) {
    var vv = window.visualViewport;
    function onVVResize() {
      var h = vv.height;
      document.documentElement.style.setProperty('--vv-h', h + 'px');
      // Detect keyboard open: viewport shrinks significantly
      var keyboardOpen = fullH > 0 && (fullH - h) > 100;
      document.body.classList.toggle('keyboard-open', keyboardOpen);
    }
    vv.addEventListener('resize', onVVResize);
    onVVResize();
  }

  // Dismiss keyboard on scroll - only on main page, not in modals or forms
  var scrollTick = false;
  window.addEventListener('scroll', function() {
    if (!scrollTick) {
      scrollTick = true;
      requestAnimationFrame(function() {
        var active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
          && !active.closest('.chat-input-wrap')
          && !active.closest('#onboard-steps')
          && !active.closest('#login-form')
          && !active.closest('.generic-modal-overlay')
          && !active.closest('.generic-modal-box')
          && !active.closest('.lmod')
          && !active.closest('.form-card')) {
          if (window.scrollY > 120) active.blur();
        }
        scrollTick = false;
      });
    }
  }, { passive: true });
})();

// ===== EARLY THEME APPLICATION =====
// Apply cached sky theme immediately so login page shows the right environment
(function() {
  try {
    var cached = localStorage.getItem('met_sky_theme');
    if (cached) document.body.setAttribute('data-sky-theme', cached);
  } catch(e) {}
})();

// ===== RENDER LIVING SKY ON LOGIN PAGE =====
function renderLoginSky() {
  var skyC = document.getElementById('login-sky-scene');
  var terrC = document.getElementById('login-terrain-scene');
  if (!skyC || !terrC) return;
  if (typeof renderLivingSky === 'function') renderLivingSky(skyC);
  var theme = (typeof currentSkyTheme !== 'undefined') ? currentSkyTheme : 'mixed';
  terrC.innerHTML = '';
  if (theme === 'mountain' && typeof renderMountainTerrain === 'function') {
    renderMountainTerrain(terrC);
  } else if (theme === 'beach' && typeof renderBeachTerrain === 'function') {
    renderBeachTerrain(terrC);
  } else if (typeof renderMeadowTerrain === 'function') {
    renderMeadowTerrain(terrC);
  }
}
// Render login sky immediately (scripts are at bottom of body, DOM is ready)
renderLoginSky();

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
  var time = getTimeOfDay();
  var prev = document.body.getAttribute('data-time');
  document.body.setAttribute('data-time', time);
  // Update browser chrome color to match theme + sky theme
  var themeColors = {
    mixed:    { dawn: '#F0E6E8', morning: '#F5F0E6', afternoon: '#EFF3F5', golden: '#F2E8D8', evening: '#2A2440', night: '#1A1828' },
    beach:    { dawn: '#F4E0D8', morning: '#F8EEE0', afternoon: '#E4F2F4', golden: '#F6E2C8', evening: '#26203A', night: '#161824' },
    mountain: { dawn: '#E6E8E4', morning: '#E8EEE2', afternoon: '#E2ECF0', golden: '#ECE2D4', evening: '#202838', night: '#141C24' }
  };
  var sky = (typeof currentSkyTheme !== 'undefined' && currentSkyTheme) || 'mixed';
  var colors = themeColors[sky] || themeColors.mixed;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = colors[time] || '#F5F0EB';
  // Re-render orbs when time changes to match new palette
  if (prev && prev !== time && typeof spawnOrbs === 'function') spawnOrbs();
}

// Update every 5 minutes
updateTimeOfDay();
setInterval(updateTimeOfDay, 5 * 60 * 1000);

// ===== TOAST NOTIFICATION =====
function toast(msg, duration) {
  duration = duration || 2500;
  var existing = document.getElementById('toast-msg');
  if (existing) existing.remove();
  var el = document.createElement('div');
  el.id = 'toast-msg';
  el.textContent = msg;
  el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.82);color:#fff;padding:10px 22px;border-radius:20px;font-size:13px;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none;max-width:80vw;text-align:center;font-family:Outfit,sans-serif';
  document.body.appendChild(el);
  requestAnimationFrame(function() { el.style.opacity = '1'; });
  setTimeout(function() {
    el.style.opacity = '0';
    setTimeout(function() { el.remove(); }, 300);
  }, duration);
}

// ===== TIME AGO HELPER =====
function timeAgo(date) {
  if (!date) return '';
  var ts = typeof date === 'number' ? date : date.getTime ? date.getTime() : 0;
  var diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  var days = Math.floor(diff / 86400);
  if (days === 1) return 'yesterday';
  if (days < 7) return days + 'd ago';
  return Math.floor(days / 7) + 'w ago';
}

// ===== HTML ESCAPE =====
function esc(str) {
  if (!str) return '';
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}

// ===== LOCAL DATE HELPER =====
function localDate(d) {
  d = d || new Date();
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

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
  if (_prefersReducedMotion) return;

  var sky = (typeof currentSkyTheme !== 'undefined' && currentSkyTheme) || 'mixed';

  // Theme-aware orb palettes
  const orbPalettes = {
    mixed: {
      dawn: ['rgba(255,120,150,0.12)', 'rgba(180,140,255,0.10)', 'rgba(255,200,140,0.08)'],
      morning: ['rgba(255,200,100,0.10)', 'rgba(255,160,80,0.08)', 'rgba(255,220,160,0.07)'],
      afternoon: ['rgba(100,180,255,0.08)', 'rgba(80,200,200,0.07)', 'rgba(160,220,255,0.06)'],
      golden: ['rgba(255,140,50,0.12)', 'rgba(255,100,80,0.10)', 'rgba(255,180,60,0.08)'],
      evening: ['rgba(120,80,200,0.10)', 'rgba(200,100,150,0.08)', 'rgba(212,149,106,0.07)'],
      night: ['rgba(60,80,180,0.08)', 'rgba(100,60,180,0.07)', 'rgba(0,140,140,0.05)']
    },
    beach: {
      dawn: ['rgba(255,170,130,0.14)', 'rgba(255,210,150,0.12)', 'rgba(220,150,110,0.10)', 'rgba(255,190,160,0.08)'],
      morning: ['rgba(255,230,140,0.12)', 'rgba(80,210,230,0.10)', 'rgba(255,240,190,0.09)', 'rgba(200,170,90,0.07)'],
      afternoon: ['rgba(40,210,240,0.12)', 'rgba(60,230,230,0.10)', 'rgba(200,240,250,0.08)', 'rgba(100,220,240,0.07)'],
      golden: ['rgba(255,140,40,0.16)', 'rgba(255,110,50,0.14)', 'rgba(255,190,90,0.12)', 'rgba(255,160,60,0.10)'],
      evening: ['rgba(100,60,150,0.10)', 'rgba(180,110,130,0.08)', 'rgba(60,100,140,0.07)', 'rgba(140,80,120,0.06)'],
      night: ['rgba(20,50,130,0.09)', 'rgba(50,30,110,0.08)', 'rgba(15,70,100,0.06)', 'rgba(30,60,120,0.05)']
    },
    mountain: {
      dawn: ['rgba(140,180,120,0.14)', 'rgba(120,160,100,0.12)', 'rgba(180,200,150,0.10)', 'rgba(100,150,80,0.08)'],
      morning: ['rgba(100,200,80,0.12)', 'rgba(80,180,60,0.10)', 'rgba(160,220,120,0.09)', 'rgba(120,190,90,0.07)'],
      afternoon: ['rgba(70,150,210,0.10)', 'rgba(80,180,150,0.08)', 'rgba(100,170,200,0.07)', 'rgba(60,140,120,0.06)'],
      golden: ['rgba(200,150,60,0.14)', 'rgba(180,120,40,0.12)', 'rgba(160,180,80,0.10)', 'rgba(140,110,30,0.08)'],
      evening: ['rgba(40,70,120,0.10)', 'rgba(60,100,80,0.08)', 'rgba(30,50,100,0.07)', 'rgba(50,80,60,0.06)'],
      night: ['rgba(20,40,80,0.09)', 'rgba(30,50,40,0.07)', 'rgba(15,30,60,0.06)', 'rgba(20,60,50,0.05)']
    }
  };

  const orbColors = orbPalettes[sky] || orbPalettes.mixed;

  // Remove existing orbs
  container.querySelectorAll('.bg-orb').forEach(o => o.remove());

  const time = getTimeOfDay();
  const colors = orbColors[time] || orbColors.night;

  for (let i = 0; i < 2; i++) {
    const orb = document.createElement('div');
    orb.className = 'bg-orb';
    const size = 150 + Math.random() * 150;
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

// ===== LIVING SKY SYSTEM =====
// Sun tracks real time across the sky, transitions to moon at night.
// Birds fly during day, fireflies glow at night, butterflies at dawn.

let livingSkyEnabled = true;
const SKY = {
  sceneTimer: null,
  creatureTimer: null,
  lastTime: null
};

function setLivingSky(on) {
  livingSkyEnabled = on;
  const container = document.getElementById('sky-scene');
  if (!container) return;
  if (on) {
    renderLivingSky(container);
    startCreatureLoop(container);
  } else {
    container.innerHTML = '';
    clearInterval(SKY.creatureTimer);
  }
}

function initSkyScene() {
  const container = document.getElementById('sky-scene');
  if (!container) return;
  if (!livingSkyEnabled) return;
  renderLivingSky(container);
  startCreatureLoop(container);
  // Update sky every 2 minutes — sun position changes slowly
  SKY.sceneTimer = setInterval(function() {
    if (!livingSkyEnabled) return;
    renderLivingSky(container);
  }, 120000);
}

// ===== SUN / MOON POSITION BASED ON REAL TIME =====
function getSunPosition() {
  var h = new Date().getHours();
  var m = new Date().getMinutes();
  var t = h + m / 60; // decimal hours

  // Sun rises at 6, sets at 20 (simplified)
  // Arc from left(0%) to right(100%) over 6am-8pm
  // Y follows a parabola (highest at noon)
  var sunrise = 6, sunset = 20;
  var dayLength = sunset - sunrise;

  if (t < sunrise || t >= sunset) {
    // Night - return moon position
    var nightT = t < sunrise ? (t + 24 - sunset) : (t - sunset);
    var nightLen = 24 - dayLength;
    var nx = 15 + (nightT / nightLen) * 70; // moon drifts across
    var ny = 8 + 15 * Math.sin((nightT / nightLen) * Math.PI); // gentle arc
    return { isNight: true, x: nx, y: ny, progress: nightT / nightLen };
  }

  var dayT = (t - sunrise) / dayLength; // 0 at sunrise, 1 at sunset
  var x = 10 + dayT * 80; // left to right
  var y = 5 + 25 * Math.sin(dayT * Math.PI); // parabolic arc, highest at noon
  // Invert y so noon is highest (lowest y value)
  y = 30 - y + 5;
  return { isNight: false, x: x, y: y, progress: dayT };
}

function getSunColor() {
  var time = getTimeOfDay();
  var sky = (typeof currentSkyTheme !== 'undefined') ? currentSkyTheme : 'mixed';
  // Environment-aware sun tints
  var sunColors = {
    mixed: {
      dawn: { body: '#FFEEDD', mid: '#FFB070', edge: '#E67E22', glow: 'rgba(255,160,60,.4)', size: 50 },
      morning: { body: '#FFF8E0', mid: '#FFE066', edge: '#F4A300', glow: 'rgba(255,200,60,.35)', size: 55 },
      afternoon: { body: '#FFF4D4', mid: '#FFD93D', edge: '#F4A300', glow: 'rgba(255,200,60,.3)', size: 55 },
      golden: { body: '#FFEECC', mid: '#FFB347', edge: '#E67E22', glow: 'rgba(255,140,40,.5)', size: 65 },
      evening: { body: '#FFCCAA', mid: '#FF8844', edge: '#CC4400', glow: 'rgba(255,100,30,.4)', size: 55 }
    },
    beach: {
      dawn: { body: '#FFE8D0', mid: '#FFB880', edge: '#E08040', glow: 'rgba(255,180,80,.45)', size: 55 },
      morning: { body: '#FFF8E0', mid: '#FFE870', edge: '#E8A800', glow: 'rgba(255,220,80,.40)', size: 60 },
      afternoon: { body: '#FFF6D8', mid: '#FFE050', edge: '#E8A000', glow: 'rgba(255,210,70,.35)', size: 58 },
      golden: { body: '#FFECC0', mid: '#FFB040', edge: '#D87018', glow: 'rgba(255,150,40,.55)', size: 70 },
      evening: { body: '#FFD0A0', mid: '#FF9040', edge: '#C84000', glow: 'rgba(255,120,40,.45)', size: 58 }
    },
    mountain: {
      dawn: { body: '#FFF0E0', mid: '#F0C080', edge: '#C09040', glow: 'rgba(240,180,80,.35)', size: 48 },
      morning: { body: '#FFF8E8', mid: '#FFE880', edge: '#D8A020', glow: 'rgba(240,210,80,.30)', size: 52 },
      afternoon: { body: '#FFF8E0', mid: '#F0D858', edge: '#C8A020', glow: 'rgba(220,200,80,.28)', size: 52 },
      golden: { body: '#FFF0C8', mid: '#E8B048', edge: '#C08020', glow: 'rgba(220,150,50,.48)', size: 60 },
      evening: { body: '#F0C8A0', mid: '#D08840', edge: '#A06020', glow: 'rgba(200,120,40,.38)', size: 50 }
    }
  };
  var palette = sunColors[sky] || sunColors.mixed;
  return palette[time] || null;
}

function renderLivingSky(container) {
  container.innerHTML = '';
  var pos = getSunPosition();
  var time = getTimeOfDay();
  var isGolden = time === 'golden';
  var isEvening = time === 'evening';
  var isDawn = time === 'dawn';

  // 1. Atmospheric haze - environment-aware
  var atmo = document.createElement('div');
  atmo.className = 'sky-atmo-day';
  var skyTheme = (typeof currentSkyTheme !== 'undefined') ? currentSkyTheme : 'mixed';
  if (skyTheme === 'beach') {
    if (isGolden || isEvening) {
      atmo.style.background = 'linear-gradient(180deg,rgba(255,160,80,0.06) 0%,rgba(255,190,120,0.08) 40%,rgba(255,200,140,0.12) 100%)';
    } else if (isDawn) {
      atmo.style.background = 'linear-gradient(180deg,rgba(255,180,140,0.04) 0%,rgba(255,200,160,0.06) 50%,rgba(255,220,180,0.10) 100%)';
    } else {
      atmo.style.background = 'linear-gradient(180deg,rgba(80,200,220,0.04) 0%,rgba(120,220,240,0.06) 40%,rgba(200,235,245,0.08) 100%)';
    }
  } else if (skyTheme === 'mountain') {
    if (isGolden || isEvening) {
      atmo.style.background = 'linear-gradient(180deg,rgba(180,140,60,0.04) 0%,rgba(160,180,80,0.06) 40%,rgba(140,160,100,0.08) 100%)';
    } else if (isDawn) {
      atmo.style.background = 'linear-gradient(180deg,rgba(140,180,120,0.03) 0%,rgba(160,200,140,0.05) 50%,rgba(180,210,160,0.08) 100%)';
    } else {
      atmo.style.background = 'linear-gradient(180deg,rgba(100,160,200,0.03) 0%,rgba(120,180,160,0.05) 40%,rgba(140,200,180,0.07) 100%)';
    }
  } else {
    if (isGolden || isEvening) {
      atmo.style.background = 'linear-gradient(180deg,rgba(255,180,100,0.04) 0%,rgba(255,200,140,0.06) 40%,rgba(255,210,160,0.1) 100%)';
    } else if (isDawn) {
      atmo.style.background = 'linear-gradient(180deg,rgba(180,140,255,0.03) 0%,rgba(255,160,140,0.05) 50%,rgba(255,200,150,0.08) 100%)';
    }
  }
  container.appendChild(atmo);

  if (pos.isNight) {
    // ===== NIGHT SKY =====
    // Deep night sky overlay
    var nightOverlay = document.createElement('div');
    nightOverlay.className = 'sky-atmo-day';
    nightOverlay.style.background = 'linear-gradient(180deg,rgba(8,12,30,0.35) 0%,rgba(15,20,50,0.25) 30%,rgba(20,25,60,0.15) 60%,rgba(25,30,55,0.08) 100%)';
    container.appendChild(nightOverlay);

    renderMoon(container, pos);
    renderStars(container);

    // Theme-specific night horizon
    var hz = document.createElement('div');
    hz.className = 'sky-horizon';
    if (skyTheme === 'beach') {
      // Ocean reflection glow at night
      hz.style.cssText = 'height:180px;background:linear-gradient(to top,rgba(15,35,70,0.14),rgba(25,45,90,0.08),rgba(20,50,80,0.04),transparent)';
    } else if (skyTheme === 'mountain') {
      // Deep forest silhouette
      hz.style.cssText = 'height:200px;background:linear-gradient(to top,rgba(10,20,15,0.16),rgba(15,30,25,0.08),rgba(20,35,30,0.04),transparent)';
    } else {
      hz.style.cssText = 'height:120px;background:linear-gradient(to top,rgba(40,50,100,0.08),rgba(60,70,120,0.04),transparent)';
    }
    container.appendChild(hz);

    // Night clouds (dark wisps)
    for (var nc = 0; nc < 2; nc++) {
      renderCloud(container, true, false);
    }
  } else {
    // ===== DAY SKY =====
    var sunColor = getSunColor();
    renderSun(container, pos, sunColor, isGolden);

    // Light shafts
    var shaftCount = isGolden ? 2 : (isEvening ? 1 : 1);
    for (var s = 0; s < shaftCount; s++) {
      var shaft = document.createElement('div');
      shaft.className = 'sky-light-shaft';
      var shaftW = 40 + Math.random() * 60;
      var shaftH = 150 + Math.random() * 200;
      var shaftAngle = -15 + Math.random() * 30;
      var shaftX = pos.x - 10 + Math.random() * 20;
      var shaftOpacity = isGolden ? 0.06 : 0.03;
      shaft.style.cssText = 'width:' + shaftW + 'px;height:' + shaftH + 'px;left:' + shaftX + '%;top:' + pos.y + '%;' +
        '--shaft-angle:' + shaftAngle + 'deg;--shaft-opacity:' + shaftOpacity + ';animation-delay:' + (s * 2) + 's';
      if (isGolden || isEvening) {
        shaft.style.background = 'linear-gradient(180deg,rgba(255,200,120,' + (shaftOpacity * 1.5) + '),transparent)';
      }
      container.appendChild(shaft);
    }

    // Clouds - reduced for performance
    var cloudCount = time === 'morning' ? 2 : (isGolden ? 2 : 3);
    if (skyTheme === 'beach') cloudCount = Math.max(1, cloudCount - 1);
    if (skyTheme === 'mountain') cloudCount = Math.min(cloudCount + 1, 3);
    for (var i = 0; i < cloudCount; i++) {
      renderCloud(container, false, isGolden || isEvening);
    }

    // Horizon glow - environment-aware
    var hz1 = document.createElement('div');
    hz1.className = 'sky-horizon';
    if (skyTheme === 'beach') {
      if (isGolden || isEvening) {
        hz1.style.cssText = 'height:280px;background:linear-gradient(to top,rgba(255,130,40,0.14),rgba(255,170,70,0.08),rgba(255,200,120,0.04),transparent)';
      } else if (isDawn) {
        hz1.style.cssText = 'height:220px;background:linear-gradient(to top,rgba(255,180,140,0.10),rgba(255,200,170,0.06),transparent)';
      } else {
        hz1.style.cssText = 'height:180px;background:linear-gradient(to top,rgba(100,210,230,0.08),rgba(160,225,240,0.04),transparent)';
      }
    } else if (skyTheme === 'mountain') {
      if (isGolden || isEvening) {
        hz1.style.cssText = 'height:260px;background:linear-gradient(to top,rgba(180,130,50,0.10),rgba(140,160,80,0.06),rgba(120,140,100,0.03),transparent)';
      } else if (isDawn) {
        hz1.style.cssText = 'height:200px;background:linear-gradient(to top,rgba(120,160,100,0.08),rgba(140,180,120,0.04),transparent)';
      } else {
        hz1.style.cssText = 'height:170px;background:linear-gradient(to top,rgba(80,140,120,0.07),rgba(100,160,140,0.04),transparent)';
      }
    } else {
      if (isGolden || isEvening) {
        hz1.style.cssText = 'height:250px;background:linear-gradient(to top,rgba(255,140,50,0.1),rgba(255,180,80,0.05),rgba(255,200,120,0.02),transparent)';
      } else if (isDawn) {
        hz1.style.cssText = 'height:200px;background:linear-gradient(to top,rgba(255,150,120,0.08),rgba(255,180,160,0.04),transparent)';
      } else {
        hz1.style.cssText = 'height:150px;background:linear-gradient(to top,rgba(180,200,230,0.06),rgba(200,215,240,0.03),transparent)';
      }
    }
    container.appendChild(hz1);

    // Lens flare
    var flare = document.createElement('div');
    flare.className = 'sky-sun-flare';
    var fs = 100 + Math.random() * 80;
    flare.style.cssText = 'width:' + fs + 'px;height:' + (fs * 0.5) + 'px;left:' + (pos.x - 5) + '%;top:' + (pos.y + 3) + '%';
    if (isGolden) flare.style.background = 'radial-gradient(ellipse,rgba(255,200,100,.15),transparent 70%)';
    container.appendChild(flare);
  }
}

function renderSun(container, pos, color, isGolden) {
  var size = color.size;
  var sun = document.createElement('div');
  sun.className = 'sky-sun';
  sun.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + pos.x + '%;top:' + pos.y + '%;transform:translate(-50%,-50%)';
  sun.style.background = 'radial-gradient(circle,' + color.body + ' 0%,' + color.mid + ' 40%,' + color.edge + ' 100%)';
  sun.style.boxShadow = '0 0 60px ' + color.glow + ',0 0 120px ' + color.glow.replace(/[\d.]+\)$/, '0.2)');

  // Rays - reduced count for performance
  for (var i = 0; i < 4; i++) {
    var ray = document.createElement('div');
    ray.className = 'sky-sun-ray';
    var angle = (360 / 4) * i;
    var len = 30 + Math.random() * 40;
    ray.style.cssText = 'width:' + len + 'px;--ray-angle:' + angle + 'deg;transform:rotate(' + angle + 'deg);animation-delay:' + (i * 0.3) + 's';
    if (isGolden) ray.style.background = 'linear-gradient(90deg,rgba(255,180,60,.4),transparent)';
    sun.appendChild(ray);
  }

  // Glow layers
  var glow = document.createElement('div');
  glow.className = 'sky-sun-glow';
  var gs = size * 3;
  glow.style.cssText = 'width:' + gs + 'px;height:' + gs + 'px;top:' + (-(gs - size) / 2) + 'px;left:' + (-(gs - size) / 2) + 'px';
  sun.appendChild(glow);

  var glow2 = document.createElement('div');
  glow2.className = 'sky-sun-glow';
  var gs2 = size * 5;
  glow2.style.cssText = 'width:' + gs2 + 'px;height:' + gs2 + 'px;top:' + (-(gs2 - size) / 2) + 'px;left:' + (-(gs2 - size) / 2) + 'px;' +
    'background:radial-gradient(circle,rgba(255,220,100,.06),transparent 60%);animation-delay:3s';
  sun.appendChild(glow2);

  // Corona
  var corona = document.createElement('div');
  corona.className = 'sky-sun-corona';
  var cs = size * 2;
  corona.style.cssText = 'width:' + cs + 'px;height:' + cs + 'px;top:' + (-(cs - size) / 2) + 'px;left:' + (-(cs - size) / 2) + 'px';
  if (isGolden) corona.style.borderColor = 'rgba(255,180,60,.15)';
  sun.appendChild(corona);

  container.appendChild(sun);
}

function renderMoon(container, pos) {
  var moon = document.createElement('div');
  moon.className = 'sky-moon';
  moon.style.cssText = 'left:' + pos.x + '%;top:' + pos.y + '%';

  // Inner shadow for crescent effect
  var shadow = document.createElement('div');
  shadow.className = 'sky-moon-shadow';
  moon.appendChild(shadow);

  // Glow
  var glow = document.createElement('div');
  glow.className = 'sky-moon-glow';
  moon.appendChild(glow);

  container.appendChild(moon);
}

function renderStars(container) {
  // Stars - keep count reasonable for mobile performance
  var starCount = 30 + Math.floor(Math.random() * 15);
  // Star colors for realism: most white, some blue-white, a few warm
  var starColors = [
    'rgba(255,255,255,', 'rgba(255,255,255,', 'rgba(255,255,255,',
    'rgba(200,220,255,', 'rgba(220,230,255,', // blue-white
    'rgba(255,230,200,', 'rgba(255,210,180,'  // warm stars
  ];
  for (var i = 0; i < starCount; i++) {
    var star = document.createElement('div');
    star.className = 'sky-star';
    var size = 0.6 + Math.random() * 2.5;
    var x = Math.random() * 100;
    var y = Math.random() * 65;
    var delay = Math.random() * 8;
    var dur = 2 + Math.random() * 5;
    // Vary brightness with more bright stars near zenith
    var zenithFactor = 1 - (y / 65) * 0.3;
    var brightness = Math.random() < 0.12 ? zenithFactor : ((0.3 + Math.random() * 0.4) * zenithFactor);
    var color = starColors[Math.floor(Math.random() * starColors.length)];
    star.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + '%;top:' + y +
      '%;animation-delay:' + delay + 's;animation-duration:' + dur + 's;opacity:' + brightness +
      ';background:' + color + '1);border-radius:50%';
    // Bright stars get a subtle glow
    if (brightness > 0.8 && size > 1.8) {
      star.style.boxShadow = '0 0 ' + (size * 2) + 'px ' + color + '0.4)';
    }
    container.appendChild(star);
  }

  // Milky way - subtle diagonal band of tiny stars
  var milkyBand = document.createElement('div');
  milkyBand.className = 'sky-milky-way';
  container.appendChild(milkyBand);

  // Shooting star (occasional)
  scheduleShootingStar(container);
}

function scheduleShootingStar(container) {
  var delay = 8000 + Math.random() * 20000;
  setTimeout(function() {
    if (!livingSkyEnabled) return;
    var pos = getSunPosition();
    if (!pos.isNight) return;
    var star = document.createElement('div');
    star.className = 'sky-shooting-star';
    var x = 10 + Math.random() * 80;
    var y = 5 + Math.random() * 25;
    star.style.cssText = 'left:' + x + '%;top:' + y + '%';
    container.appendChild(star);
    setTimeout(function() { if (star.parentNode) star.remove(); }, 1500);
    scheduleShootingStar(container);
  }, delay);
}

// ===== CREATURES =====
function startCreatureLoop(container) {
  clearInterval(SKY.creatureTimer);
  spawnCreatures(container);
  SKY.creatureTimer = setInterval(function() {
    if (!livingSkyEnabled) return;
    spawnCreatures(container);
  }, 15000);
}

var _prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var MAX_SKY_CREATURES = 12;
function spawnCreatures(container) {
  if (_prefersReducedMotion) return;
  // Cap total animated creatures in the DOM to prevent lag
  var existing = container.querySelectorAll('.sky-bird,.sky-butterfly,.sky-firefly,.scene-creature');
  if (existing.length >= MAX_SKY_CREATURES) return;

  var time = getTimeOfDay();
  var pos = getSunPosition();

  if (pos.isNight) {
    // Fireflies at night
    for (var i = 0; i < 2; i++) {
      renderFirefly(container);
    }
  } else if (time === 'dawn') {
    renderButterfly(container);
    if (Math.random() < 0.4) renderBird(container);
  } else if (time === 'evening' || time === 'golden') {
    renderBird(container);
  } else {
    // Day - one bird at a time
    renderBird(container);
    if (Math.random() < 0.2) renderButterfly(container);
  }
}

function renderBird(container) {
  var bird = document.createElement('div');
  bird.className = 'sky-bird';
  var startX = -10 + Math.random() * 20;
  var startY = 8 + Math.random() * 25;
  var dx = 250 + Math.random() * 350;
  var dy = -(15 + Math.random() * 35);
  var dur = 8 + Math.random() * 8;

  bird.style.cssText = 'left:' + startX + '%;top:' + startY + '%;--bird-dx:' + dx + 'px;--bird-dy:' + dy + 'px;--bird-dur:' + dur + 's';

  var wl = document.createElement('div');
  wl.className = 'sky-bird-wing sky-bird-wing-l';
  var wr = document.createElement('div');
  wr.className = 'sky-bird-wing sky-bird-wing-r';
  bird.appendChild(wl);
  bird.appendChild(wr);

  container.appendChild(bird);
  setTimeout(function() { if (bird.parentNode) bird.remove(); }, (dur + 2) * 1000);
}

function renderButterfly(container) {
  var bf = document.createElement('div');
  bf.className = 'sky-butterfly';
  var x = 10 + Math.random() * 60;
  var y = 15 + Math.random() * 30;
  var dx = 80 + Math.random() * 150;
  var dy = -(20 + Math.random() * 40);
  var dur = 12 + Math.random() * 10;

  // Random color
  var colors = ['rgba(255,150,200,0.7)', 'rgba(200,160,255,0.7)', 'rgba(255,200,100,0.7)', 'rgba(150,220,255,0.7)'];
  var col = colors[Math.floor(Math.random() * colors.length)];

  bf.style.cssText = 'left:' + x + '%;top:' + y + '%;--bf-dx:' + dx + 'px;--bf-dy:' + dy + 'px;--bf-dur:' + dur + 's;--bf-color:' + col;

  var wl = document.createElement('div');
  wl.className = 'sky-bf-wing sky-bf-wing-l';
  var wr = document.createElement('div');
  wr.className = 'sky-bf-wing sky-bf-wing-r';
  bf.appendChild(wl);
  bf.appendChild(wr);

  container.appendChild(bf);
  setTimeout(function() { if (bf.parentNode) bf.remove(); }, (dur + 2) * 1000);
}

function renderFirefly(container) {
  var ff = document.createElement('div');
  ff.className = 'sky-firefly';
  var x = 10 + Math.random() * 80;
  var y = 20 + Math.random() * 50;
  var dx = (Math.random() - 0.5) * 100;
  var dy = (Math.random() - 0.5) * 60;
  var dur = 6 + Math.random() * 8;

  ff.style.cssText = 'left:' + x + '%;top:' + y + '%;--ff-dx:' + dx + 'px;--ff-dy:' + dy + 'px;animation-duration:' + dur + 's';

  container.appendChild(ff);
  setTimeout(function() { if (ff.parentNode) ff.remove(); }, (dur + 1) * 1000);
}

function renderCloud(container, isDarkMode, isGolden) {
  const cloud = document.createElement('div');
  cloud.className = 'sky-cloud' + (isDarkMode ? ' sky-cloud-dark' : '');

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

  const body = document.createElement('div');
  body.className = 'sky-cloud-body';
  body.style.cssText = 'width:' + w + 'px;height:' + h + 'px';
  if (isGolden && !isDarkMode) body.style.background = 'rgba(255,220,180,0.4)';
  cloud.appendChild(body);

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
    var shadow = document.createElement('div');
    shadow.className = 'sky-cloud-shadow';
    shadow.style.cssText = 'width:' + (w * 0.85) + 'px;height:' + (h * 0.5) + 'px;left:' + (w * 0.1) + 'px;bottom:-' + (h * 0.15) + 'px';
    if (isGolden) shadow.style.background = 'rgba(180,100,40,.06)';
    cloud.appendChild(shadow);

    var highlight = document.createElement('div');
    highlight.className = 'sky-cloud-highlight';
    highlight.style.cssText = 'width:' + (w * 0.6) + 'px;height:' + (h * 0.3) + 'px;left:' + (w * 0.15) + 'px;top:-' + (h * 0.25) + 'px';
    if (isGolden) highlight.style.background = 'rgba(255,240,200,.15)';
    cloud.appendChild(highlight);

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

// ===== IMMERSIVE TERRAIN RENDERING =====
// Creates environment-specific silhouettes (mountains, beach, meadow)
// rendered into a separate unmasked container for full visibility

function renderTerrain(theme) {
  var container = document.getElementById('terrain-scene');
  if (!container) return;
  container.innerHTML = '';

  theme = theme || (typeof currentSkyTheme !== 'undefined' ? currentSkyTheme : 'mixed');

  if (theme === 'mountain') {
    renderMountainTerrain(container);
  } else if (theme === 'beach') {
    renderBeachTerrain(container);
  } else {
    renderMeadowTerrain(container);
  }
}

function renderMountainTerrain(container) {
  // Far mountain range
  var far = document.createElement('div');
  far.className = 'terrain-mountain-far';
  container.appendChild(far);

  // Mist between far and mid ranges
  var mist = document.createElement('div');
  mist.className = 'terrain-mountain-mist';
  container.appendChild(mist);

  // Mid mountain range
  var mid = document.createElement('div');
  mid.className = 'terrain-mountain-mid';
  container.appendChild(mid);

  // Waterfall on the mid range
  var wf = document.createElement('div');
  wf.className = 'terrain-waterfall';
  wf.style.cssText = 'left:28%;bottom:22%;height:14%';
  container.appendChild(wf);

  // Second waterfall on opposite side
  var wf2 = document.createElement('div');
  wf2.className = 'terrain-waterfall';
  wf2.style.cssText = 'left:72%;bottom:18%;height:10%';
  container.appendChild(wf2);

  // Near foothills (tree-line silhouette)
  var near = document.createElement('div');
  near.className = 'terrain-mountain-near';
  container.appendChild(near);

  // Scattered pine trees along the foothills
  var pinePositions = [
    { left: 5, h: 28, w: 7 },
    { left: 12, h: 22, w: 6 },
    { left: 18, h: 32, w: 8 },
    { left: 25, h: 26, w: 7 },
    { left: 33, h: 20, w: 5 },
    { left: 38, h: 30, w: 8 },
    { left: 45, h: 24, w: 6 },
    { left: 52, h: 34, w: 9 },
    { left: 58, h: 22, w: 6 },
    { left: 63, h: 28, w: 7 },
    { left: 70, h: 26, w: 7 },
    { left: 76, h: 32, w: 8 },
    { left: 82, h: 20, w: 5 },
    { left: 88, h: 28, w: 7 },
    { left: 93, h: 24, w: 6 }
  ];
  for (var i = 0; i < pinePositions.length; i++) {
    var pp = pinePositions[i];
    var pine = document.createElement('div');
    pine.className = 'terrain-pine';
    pine.style.cssText = 'left:' + pp.left + '%;--pine-w:' + pp.w + 'px;--pine-h:' + pp.h + 'px';
    container.appendChild(pine);
  }

  // Second mist layer (lower, subtler)
  var mist2 = document.createElement('div');
  mist2.className = 'terrain-mountain-mist';
  mist2.style.cssText = 'bottom:8%;height:12%;opacity:0.08;animation-delay:-12s';
  container.appendChild(mist2);

  // Snow caps on the highest peaks
  var snowPositions = [
    { left: 18, bottom: 38, w: 12, h: 8 },
    { left: 40, bottom: 40, w: 10, h: 7 },
    { left: 72, bottom: 42, w: 14, h: 9 }
  ];
  for (var s = 0; s < snowPositions.length; s++) {
    var sp = snowPositions[s];
    var snow = document.createElement('div');
    snow.className = 'terrain-snow-cap';
    snow.style.cssText = 'left:' + sp.left + '%;bottom:' + sp.bottom + '%;width:' + sp.w + 'px;height:' + sp.h + 'px';
    container.appendChild(snow);
  }
}

function renderBeachTerrain(container) {
  // Ocean water body
  var ocean = document.createElement('div');
  ocean.className = 'terrain-ocean';

  var oceanBody = document.createElement('div');
  oceanBody.className = 'terrain-ocean-body';
  ocean.appendChild(oceanBody);

  // Wave crests
  var w1 = document.createElement('div');
  w1.className = 'terrain-wave terrain-wave-1';
  ocean.appendChild(w1);

  var w2 = document.createElement('div');
  w2.className = 'terrain-wave terrain-wave-2';
  ocean.appendChild(w2);

  var w3 = document.createElement('div');
  w3.className = 'terrain-wave terrain-wave-3';
  ocean.appendChild(w3);

  // Foam lines
  var foam1 = document.createElement('div');
  foam1.className = 'terrain-foam';
  foam1.style.top = '26%';
  ocean.appendChild(foam1);

  var foam2 = document.createElement('div');
  foam2.className = 'terrain-foam';
  foam2.style.cssText = 'top:34%;animation-delay:1.5s';
  ocean.appendChild(foam2);

  // Sun/moon shimmer on water
  var shimmer = document.createElement('div');
  shimmer.className = 'terrain-ocean-shimmer';
  ocean.appendChild(shimmer);

  container.appendChild(ocean);

  // Sandy shore
  var shore = document.createElement('div');
  shore.className = 'terrain-shore';
  container.appendChild(shore);

  // Palm tree left side
  renderPalmTree(container, 8, 28, -8);

  // Palm tree right side
  renderPalmTree(container, 85, 32, 6);

  // Small palm in mid-ground
  renderPalmTree(container, 18, 22, -5);

  // Distant island
  var island = document.createElement('div');
  island.className = 'terrain-island';
  island.style.cssText = 'left:60%;bottom:28%;width:60px;height:20px;background:rgba(40,60,40,0.3)';
  container.appendChild(island);

  // Second smaller island
  var island2 = document.createElement('div');
  island2.className = 'terrain-island';
  island2.style.cssText = 'left:45%;bottom:27%;width:30px;height:10px;background:rgba(40,60,40,0.18);filter:blur(1px)';
  container.appendChild(island2);

  // Footprints in sand
  var footprints = document.createElement('div');
  footprints.className = 'terrain-footprints';
  var fpPositions = [15, 22, 28, 35, 42, 50, 58, 65, 72, 80];
  for (var fp = 0; fp < fpPositions.length; fp++) {
    var dot = document.createElement('div');
    dot.className = 'terrain-footprint';
    dot.style.cssText = 'left:' + fpPositions[fp] + '%;bottom:' + (Math.random() * 60) + '%';
    footprints.appendChild(dot);
  }
  container.appendChild(footprints);
}

function renderPalmTree(container, leftPct, heightPct, tiltDeg) {
  var palm = document.createElement('div');
  palm.className = 'terrain-palm';
  palm.style.left = leftPct + '%';

  // Trunk
  var trunk = document.createElement('div');
  trunk.className = 'terrain-palm-trunk';
  var trunkH = heightPct * 0.7;
  trunk.style.cssText = 'height:' + trunkH + '%;background:rgba(70,45,20,0.5);transform:rotate(' + tiltDeg + 'deg)';
  palm.appendChild(trunk);

  // Frond canopy at top of trunk
  var canopy = document.createElement('div');
  canopy.className = 'terrain-palm-canopy';
  // Position canopy at top of trunk, accounting for tilt
  var radians = tiltDeg * Math.PI / 180;
  var canopyBottom = trunkH;
  var canopyLeft = Math.sin(radians) * trunkH * 0.5;
  canopy.style.cssText = 'bottom:' + canopyBottom + '%;left:' + canopyLeft + 'px';

  // 6 fronds radiating outward
  var frondSizes = [
    { w: 22, h: 18 },
    { w: 20, h: 16 },
    { w: 18, h: 14 },
    { w: 18, h: 14 },
    { w: 16, h: 12 },
    { w: 16, h: 12 }
  ];
  for (var i = 0; i < 6; i++) {
    var frond = document.createElement('div');
    frond.className = 'terrain-palm-frond terrain-palm-frond-' + (i + 1);
    frond.style.cssText = '--frond-w:' + frondSizes[i].w + 'px;--frond-h:' + frondSizes[i].h + 'px';
    canopy.appendChild(frond);
  }

  palm.appendChild(canopy);
  container.appendChild(palm);
}

function renderMeadowTerrain(container) {
  // Far rolling hill
  var hillFar = document.createElement('div');
  hillFar.className = 'terrain-hill-far';
  hillFar.style.cssText = 'left:-10%;right:40%';
  container.appendChild(hillFar);

  // Second far hill
  var hillFar2 = document.createElement('div');
  hillFar2.className = 'terrain-hill-far';
  hillFar2.style.cssText = 'left:30%;right:-10%;height:20%;border-radius:55% 45% 0 0';
  container.appendChild(hillFar2);

  // Mid rolling hill
  var hillMid = document.createElement('div');
  hillMid.className = 'terrain-hill-mid';
  hillMid.style.cssText = 'left:-5%;right:20%';
  container.appendChild(hillMid);

  // Second mid hill
  var hillMid2 = document.createElement('div');
  hillMid2.className = 'terrain-hill-mid';
  hillMid2.style.cssText = 'left:40%;right:-5%;height:15%;border-radius:40% 60% 0 0';
  container.appendChild(hillMid2);

  // Near gentle hill
  var hillNear = document.createElement('div');
  hillNear.className = 'terrain-hill-near';
  container.appendChild(hillNear);

  // Scattered deciduous trees
  var treePositions = [
    { left: 10, canopyW: 18, canopyH: 16, trunkH: 12, bottom: 14 },
    { left: 22, canopyW: 14, canopyH: 12, trunkH: 10, bottom: 16 },
    { left: 35, canopyW: 20, canopyH: 18, trunkH: 14, bottom: 12 },
    { left: 55, canopyW: 16, canopyH: 14, trunkH: 11, bottom: 15 },
    { left: 68, canopyW: 22, canopyH: 18, trunkH: 15, bottom: 11 },
    { left: 80, canopyW: 14, canopyH: 12, trunkH: 10, bottom: 16 },
    { left: 90, canopyW: 18, canopyH: 16, trunkH: 12, bottom: 13 }
  ];
  for (var i = 0; i < treePositions.length; i++) {
    var tp = treePositions[i];
    var tree = document.createElement('div');
    tree.className = 'terrain-tree';
    tree.style.cssText = 'left:' + tp.left + '%;bottom:' + tp.bottom + '%';

    var trunk = document.createElement('div');
    trunk.className = 'terrain-tree-trunk';
    trunk.style.height = tp.trunkH + 'px';
    tree.appendChild(trunk);

    var canopy = document.createElement('div');
    canopy.className = 'terrain-tree-canopy';
    canopy.style.cssText = 'width:' + tp.canopyW + 'px;height:' + tp.canopyH + 'px;bottom:' + (tp.trunkH - 3) + 'px';
    tree.appendChild(canopy);

    container.appendChild(tree);
  }

  // Wildflower dots
  var flowers = document.createElement('div');
  flowers.className = 'terrain-flowers';
  var flowerColors = [
    'rgba(255,180,100,0.4)', 'rgba(255,140,160,0.4)', 'rgba(200,160,255,0.35)',
    'rgba(255,220,100,0.35)', 'rgba(180,220,255,0.3)', 'rgba(255,160,120,0.35)'
  ];
  for (var f = 0; f < 20; f++) {
    var dot = document.createElement('div');
    dot.className = 'terrain-flower-dot';
    dot.style.cssText = 'left:' + (5 + Math.random() * 90) + '%;bottom:' + (Math.random() * 80) +
      '%;background:' + flowerColors[f % flowerColors.length] +
      ';animation-delay:' + (Math.random() * 4) + 's';
    flowers.appendChild(dot);
  }
  container.appendChild(flowers);

  // Grass blade layer
  var grass = document.createElement('div');
  grass.className = 'terrain-grass-layer';
  container.appendChild(grass);

  // Dappled sunlight spots
  var dapplePositions = [
    { left: 12, bottom: 18, w: 30, h: 20 },
    { left: 38, bottom: 14, w: 25, h: 18 },
    { left: 60, bottom: 20, w: 35, h: 22 },
    { left: 82, bottom: 16, w: 28, h: 16 }
  ];
  for (var d = 0; d < dapplePositions.length; d++) {
    var dp = dapplePositions[d];
    var dapple = document.createElement('div');
    dapple.className = 'terrain-dapple';
    dapple.style.cssText = 'left:' + dp.left + '%;bottom:' + dp.bottom + '%;width:' + dp.w + 'px;height:' + dp.h +
      'px;animation-delay:' + (d * 2) + 's';
    container.appendChild(dapple);
  }
}

// ===== SKY THEME (beach / mountain / mixed) =====
var currentSkyTheme = 'mixed';

function applySkyTheme(theme) {
  currentSkyTheme = theme || 'mixed';
  document.body.setAttribute('data-sky-theme', currentSkyTheme);
  // Cache for instant apply on next load (login page, before Firebase)
  try { localStorage.setItem('met_sky_theme', currentSkyTheme); } catch(e) {}
  // Re-render the living sky with the new theme
  var container = document.getElementById('sky-scene');
  if (container && livingSkyEnabled) renderLivingSky(container);
  // Render immersive terrain silhouettes
  renderTerrain(currentSkyTheme);
  // Also update login page sky/terrain if visible
  renderLoginSky();
  // Refresh orbs and meta color to match new theme
  spawnOrbs();
  updateTimeOfDay();
  // Auto-sync weather scene to match environment
  // beach→coastal, mountain→forest, mixed→meadow
  if (typeof WEATHER !== 'undefined' && typeof SCENES !== 'undefined') {
    var sceneMap = { beach: 'coastal', mountain: 'forest', mixed: 'meadow' };
    var targetScene = sceneMap[currentSkyTheme] || 'meadow';
    if (WEATHER.scene !== targetScene && SCENES[targetScene]) {
      WEATHER.scene = targetScene;
      if (typeof db !== 'undefined' && db && typeof user !== 'undefined' && user) {
        db.ref('settings/weather/' + user + '/scene').set(targetScene);
      }
      // Re-render scene ground and creatures
      if (container && livingSkyEnabled) {
        if (typeof renderSceneGround === 'function') renderSceneGround(container);
      }
      // Update ambient audio to match environment
      if (typeof updateAmbientAudio === 'function') updateAmbientAudio();
      // Stop mood sound if it belongs to a different environment
      if (typeof WEATHER !== 'undefined' && WEATHER.moodPlaying && typeof MOOD_SOUNDS !== 'undefined') {
        var moodDef = MOOD_SOUNDS[WEATHER.moodPlaying];
        if (moodDef && moodDef.env && moodDef.env !== currentSkyTheme) {
          if (typeof stopMoodSound === 'function') stopMoodSound();
        }
      }
    }
  }
  // Re-render mood sounds grid to prioritize environment-matching sounds
  if (typeof renderMoodSoundsGrid === 'function') renderMoodSoundsGrid();
}

// Load sky theme from Firebase on login
function loadSkyTheme() {
  if (!db || !user) return;
  db.ref('settings/skyTheme/' + user).once('value', function(snap) {
    var theme = snap.val() || 'mixed';
    applySkyTheme(theme);
  });
}

// Beach creatures
function renderSeagull(container) {
  var bird = document.createElement('div');
  bird.className = 'sky-bird sky-seagull';
  var startX = -5 + Math.random() * 15;
  var startY = 5 + Math.random() * 20;
  var dx = 300 + Math.random() * 400;
  var dy = -(5 + Math.random() * 25);
  var dur = 10 + Math.random() * 10;
  bird.style.cssText = 'left:' + startX + '%;top:' + startY + '%;--bird-dx:' + dx + 'px;--bird-dy:' + dy + 'px;--bird-dur:' + dur + 's';
  var wl = document.createElement('div');
  wl.className = 'sky-bird-wing sky-bird-wing-l';
  wl.style.background = 'rgba(255,255,255,.6)';
  var wr = document.createElement('div');
  wr.className = 'sky-bird-wing sky-bird-wing-r';
  wr.style.background = 'rgba(255,255,255,.6)';
  bird.appendChild(wl);
  bird.appendChild(wr);
  container.appendChild(bird);
  setTimeout(function() { if (bird.parentNode) bird.remove(); }, (dur + 2) * 1000);
}

function renderCrab(container) {
  var crab = document.createElement('div');
  crab.className = 'sky-crab';
  var startX = Math.random() * 80;
  var dir = Math.random() < 0.5 ? 1 : -1;
  var dur = 8 + Math.random() * 6;
  crab.style.cssText = 'left:' + startX + '%;bottom:4%;--crab-dir:' + (dir * 60) + 'px;animation-duration:' + dur + 's';
  crab.innerHTML = '<div class="crab-body"></div>';
  container.appendChild(crab);
  setTimeout(function() { if (crab.parentNode) crab.remove(); }, (dur + 1) * 1000);
}

// Mountain creatures
function renderEagle(container) {
  var eagle = document.createElement('div');
  eagle.className = 'sky-bird sky-eagle';
  var startX = 20 + Math.random() * 50;
  var startY = 5 + Math.random() * 15;
  var dx = 200 + Math.random() * 300;
  var dy = -(10 + Math.random() * 20);
  var dur = 14 + Math.random() * 10;
  eagle.style.cssText = 'left:' + startX + '%;top:' + startY + '%;--bird-dx:' + dx + 'px;--bird-dy:' + dy + 'px;--bird-dur:' + dur + 's';
  var wl = document.createElement('div');
  wl.className = 'sky-bird-wing sky-bird-wing-l sky-eagle-wing';
  var wr = document.createElement('div');
  wr.className = 'sky-bird-wing sky-bird-wing-r sky-eagle-wing';
  eagle.appendChild(wl);
  eagle.appendChild(wr);
  container.appendChild(eagle);
  setTimeout(function() { if (eagle.parentNode) eagle.remove(); }, (dur + 2) * 1000);
}

// Night creatures by theme
function renderOwl(container) {
  var owl = document.createElement('div');
  owl.className = 'sky-firefly sky-owl-eyes';
  var x = 15 + Math.random() * 70;
  var y = 25 + Math.random() * 30;
  var dur = 4 + Math.random() * 4;
  owl.style.cssText = 'left:' + x + '%;top:' + y + '%;animation-duration:' + dur + 's;width:12px;height:6px';
  owl.innerHTML = '<span class="owl-eye"></span><span class="owl-eye"></span>';
  container.appendChild(owl);
  setTimeout(function() { if (owl.parentNode) owl.remove(); }, (dur + 1) * 1000);
}

// Override spawnCreatures to be theme-aware
var _origSpawnCreatures = spawnCreatures;
spawnCreatures = function(container) {
  var time = getTimeOfDay();
  var pos = getSunPosition();
  var theme = currentSkyTheme;

  if (pos.isNight) {
    // Night creatures based on theme
    for (var i = 0; i < 3; i++) renderFirefly(container);
    if (theme === 'mountain' || theme === 'mixed') {
      if (Math.random() < 0.3) renderOwl(container);
    }
  } else if (theme === 'beach') {
    // Beach day creatures
    for (var i = 0; i < 2; i++) renderSeagull(container);
    if (Math.random() < 0.3) renderCrab(container);
    if (Math.random() < 0.2) renderButterfly(container);
  } else if (theme === 'mountain') {
    // Mountain day creatures
    if (Math.random() < 0.4) renderEagle(container);
    renderBird(container);
    if (time === 'dawn' || time === 'morning') {
      if (Math.random() < 0.4) renderButterfly(container);
    }
  } else {
    // Mixed - use the original behavior plus themed extras
    _origSpawnCreatures(container);
    if (Math.random() < 0.2) {
      if (Math.random() < 0.5) renderSeagull(container);
      else renderEagle(container);
    }
  }
};

// Init on load
document.addEventListener('DOMContentLoaded', function() {
  spawnOrbs();
  addMeshLayer();
  initSkyScene();
  // Render terrain for current theme
  renderTerrain();
  // Re-render sky when time period changes (orbs handled by updateTimeOfDay)
  setInterval(function() {
    var current = document.body.getAttribute('data-time');
    var now = getTimeOfDay();
    if (current !== now) {
      updateTimeOfDay();
      var container = document.getElementById('sky-scene');
      if (container && livingSkyEnabled) renderLivingSky(container);
    }
  }, 5 * 60 * 1000);
});

// ===== INDIVIDUAL SPACE PRIVACY =====

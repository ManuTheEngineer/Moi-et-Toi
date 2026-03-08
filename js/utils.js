// ===== VIEWPORT FIX (PWA full-screen coverage) =====
(function(){
  function fillScreen(){
    var h = Math.max(window.screen.height, window.innerHeight, document.documentElement.clientHeight);
    document.documentElement.style.setProperty('--real-h', h + 'px');
  }
  fillScreen();
  window.addEventListener('resize', fillScreen);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) fillScreen(); });

  // Track visual viewport for keyboard-aware layouts
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function() {
      document.documentElement.style.setProperty('--vv-h', window.visualViewport.height + 'px');
    });
    document.documentElement.style.setProperty('--vv-h', window.visualViewport.height + 'px');
  }

  // Dismiss keyboard on scroll (mobile UX)
  var scrollTick = false;
  window.addEventListener('scroll', function() {
    if (!scrollTick) {
      scrollTick = true;
      requestAnimationFrame(function() {
        var active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && !active.closest('.chat-input-wrap') && !active.closest('#onboard-steps') && !active.closest('#login-form')) {
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
  // Update sky every 60 seconds for smoother sun/moon movement
  SKY.sceneTimer = setInterval(function() {
    if (!livingSkyEnabled) return;
    renderLivingSky(container);
  }, 60000);
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
    // Night — return moon position
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
  switch(time) {
    case 'dawn': return { body: '#FFEEDD', mid: '#FFB070', edge: '#E67E22', glow: 'rgba(255,160,60,.4)', size: 50 };
    case 'morning': return { body: '#FFF8E0', mid: '#FFE066', edge: '#F4A300', glow: 'rgba(255,200,60,.35)', size: 55 };
    case 'afternoon': return { body: '#FFF4D4', mid: '#FFD93D', edge: '#F4A300', glow: 'rgba(255,200,60,.3)', size: 55 };
    case 'golden': return { body: '#FFEECC', mid: '#FFB347', edge: '#E67E22', glow: 'rgba(255,140,40,.5)', size: 65 };
    case 'evening': return { body: '#FFCCAA', mid: '#FF8844', edge: '#CC4400', glow: 'rgba(255,100,30,.4)', size: 55 };
    default: return null; // night
  }
}

function renderLivingSky(container) {
  container.innerHTML = '';
  var pos = getSunPosition();
  var time = getTimeOfDay();
  var isGolden = time === 'golden';
  var isEvening = time === 'evening';
  var isDawn = time === 'dawn';

  // 1. Atmospheric haze
  var atmo = document.createElement('div');
  atmo.className = 'sky-atmo-day';
  if (isGolden || isEvening) {
    atmo.style.background = 'linear-gradient(180deg,rgba(255,180,100,0.04) 0%,rgba(255,200,140,0.06) 40%,rgba(255,210,160,0.1) 100%)';
  } else if (isDawn) {
    atmo.style.background = 'linear-gradient(180deg,rgba(180,140,255,0.03) 0%,rgba(255,160,140,0.05) 50%,rgba(255,200,150,0.08) 100%)';
  }
  container.appendChild(atmo);

  if (pos.isNight) {
    // ===== NIGHT SKY =====
    renderMoon(container, pos);
    renderStars(container);
    // Horizon glow (moonlit)
    var hz = document.createElement('div');
    hz.className = 'sky-horizon';
    hz.style.cssText = 'height:120px;background:linear-gradient(to top,rgba(40,50,100,0.06),rgba(60,70,120,0.03),transparent)';
    container.appendChild(hz);
  } else {
    // ===== DAY SKY =====
    var sunColor = getSunColor();
    renderSun(container, pos, sunColor, isGolden);

    // Light shafts
    var shaftCount = isGolden ? 4 : (isEvening ? 3 : 2);
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

    // Clouds
    var cloudCount = time === 'morning' ? 4 : (isGolden ? 3 : 5);
    for (var i = 0; i < cloudCount; i++) {
      renderCloud(container, false, isGolden || isEvening);
    }

    // Horizon glow
    var hz1 = document.createElement('div');
    hz1.className = 'sky-horizon';
    if (isGolden || isEvening) {
      hz1.style.cssText = 'height:250px;background:linear-gradient(to top,rgba(255,140,50,0.1),rgba(255,180,80,0.05),rgba(255,200,120,0.02),transparent)';
    } else if (isDawn) {
      hz1.style.cssText = 'height:200px;background:linear-gradient(to top,rgba(255,150,120,0.08),rgba(255,180,160,0.04),transparent)';
    } else {
      hz1.style.cssText = 'height:150px;background:linear-gradient(to top,rgba(180,200,230,0.06),rgba(200,215,240,0.03),transparent)';
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

  // Rays
  for (var i = 0; i < 8; i++) {
    var ray = document.createElement('div');
    ray.className = 'sky-sun-ray';
    var angle = (360 / 8) * i;
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
  var starCount = 25 + Math.floor(Math.random() * 15);
  for (var i = 0; i < starCount; i++) {
    var star = document.createElement('div');
    star.className = 'sky-star';
    var size = 1 + Math.random() * 2;
    var x = Math.random() * 100;
    var y = Math.random() * 50; // upper half only
    var delay = Math.random() * 5;
    var dur = 2 + Math.random() * 3;
    star.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + '%;top:' + y + '%;animation-delay:' + delay + 's;animation-duration:' + dur + 's';
    container.appendChild(star);
  }

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
  }, 8000);
}

function spawnCreatures(container) {
  var time = getTimeOfDay();
  var pos = getSunPosition();

  if (pos.isNight) {
    // Fireflies at night
    for (var i = 0; i < 3; i++) {
      renderFirefly(container);
    }
  } else if (time === 'dawn') {
    // Butterflies at dawn + a bird or two
    renderButterfly(container);
    if (Math.random() < 0.5) renderBird(container);
  } else if (time === 'evening' || time === 'golden') {
    // Birds returning home
    for (var i = 0; i < 2; i++) {
      renderBird(container);
    }
  } else {
    // Day — birds and occasional butterfly
    for (var i = 0; i < 2; i++) {
      (function(idx) {
        setTimeout(function() { renderBird(container); }, idx * 3000 + Math.random() * 2000);
      })(i);
    }
    if (Math.random() < 0.3) renderButterfly(container);
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

// Init on load
document.addEventListener('DOMContentLoaded', function() {
  spawnOrbs();
  addMeshLayer();
  initSkyScene();
  // Re-spawn orbs when time period changes
  setInterval(function() {
    const current = document.body.getAttribute('data-time');
    const now = getTimeOfDay();
    if (current !== now) {
      spawnOrbs();
      // Re-render sky when time period changes
      var container = document.getElementById('sky-scene');
      if (container && livingSkyEnabled) renderLivingSky(container);
    }
  }, 5 * 60 * 1000);
});

// ===== INDIVIDUAL SPACE PRIVACY =====

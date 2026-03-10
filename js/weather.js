// ===== LIVING WEATHER & SCENE SYSTEM =====
// Real-time weather from user's location, 3 scene themes, ambient audio

var WEATHER = {
  lat: null,
  lon: null,
  data: null,
  scene: 'meadow',
  locationGranted: false,
  audioCtx: null,
  audioNodes: {},
  audioEnabled: false,
  audioUnlocked: false,
  refreshTimer: null
};

// ===== SCENE DEFINITIONS =====
// Warm, intimate tones matching the app's cream/gold/rose palette
var SCENES = {
  meadow: {
    label: 'Golden Meadow',
    icon: '🌾',
    desc: 'Sun-kissed fields, wildflowers, gentle warmth',
    creatures: {
      dawn: ['rabbit', 'butterfly', 'songbird', 'sparrow', 'hawk'],
      morning: ['bird', 'butterfly', 'bee', 'rabbit', 'sparrow', 'swallow', 'hawk'],
      afternoon: ['bird', 'bee', 'dragonfly', 'hawk', 'swallow', 'butterfly'],
      golden: ['bird', 'deer', 'rabbit', 'sparrow', 'hawk', 'swallow'],
      evening: ['owl', 'bat', 'deer', 'fox', 'firefly'],
      night: ['firefly', 'owl', 'bat', 'fox']
    },
    sounds: {
      base: 'wind',
      dawn: 'birdsong',
      morning: 'birdsong',
      afternoon: 'insects',
      golden: 'birdsong',
      evening: 'crickets',
      night: 'crickets'
    },
    colors: {
      dawn: { ground: 'rgba(200,180,140,0.10)', accent: 'rgba(255,200,150,0.08)' },
      morning: { ground: 'rgba(180,200,130,0.08)', accent: 'rgba(255,230,170,0.06)' },
      afternoon: { ground: 'rgba(160,190,110,0.07)', accent: 'rgba(220,210,160,0.05)' },
      golden: { ground: 'rgba(210,180,110,0.12)', accent: 'rgba(255,180,80,0.10)' },
      evening: { ground: 'rgba(130,110,90,0.08)', accent: 'rgba(180,140,160,0.06)' },
      night: { ground: 'rgba(50,50,40,0.06)', accent: 'rgba(60,60,80,0.05)' }
    }
  },
  coastal: {
    label: 'Sunset Shore',
    icon: '🌊',
    desc: 'Warm tides, sandy breeze, ocean calm',
    creatures: {
      dawn: ['seagull', 'crab', 'dolphin', 'heron', 'pelican'],
      morning: ['seagull', 'fish', 'crab', 'pelican', 'dolphin', 'heron'],
      afternoon: ['seagull', 'jellyfish', 'turtle', 'pelican', 'dolphin'],
      golden: ['seagull', 'dolphin', 'crab', 'heron', 'pelican'],
      evening: ['seagull', 'bat', 'crab', 'firefly'],
      night: ['firefly', 'crab', 'whale', 'bat']
    },
    sounds: {
      base: 'waves',
      dawn: 'seagulls',
      morning: 'seagulls',
      afternoon: 'waves',
      golden: 'seagulls',
      evening: 'waves',
      night: 'waves'
    },
    colors: {
      dawn: { ground: 'rgba(200,185,170,0.10)', accent: 'rgba(255,180,140,0.08)' },
      morning: { ground: 'rgba(170,195,210,0.08)', accent: 'rgba(240,220,190,0.06)' },
      afternoon: { ground: 'rgba(140,190,210,0.08)', accent: 'rgba(200,215,230,0.06)' },
      golden: { ground: 'rgba(220,185,130,0.12)', accent: 'rgba(255,165,90,0.10)' },
      evening: { ground: 'rgba(110,110,140,0.08)', accent: 'rgba(180,140,160,0.06)' },
      night: { ground: 'rgba(30,40,60,0.08)', accent: 'rgba(40,50,80,0.06)' }
    }
  },
  forest: {
    label: 'Whispering Woods',
    icon: '🌲',
    desc: 'Dappled light, mossy trails, woodland peace',
    creatures: {
      dawn: ['fox', 'songbird', 'butterfly', 'sparrow', 'rabbit'],
      morning: ['bird', 'squirrel', 'butterfly', 'woodpecker', 'hawk', 'sparrow'],
      afternoon: ['bird', 'squirrel', 'dragonfly', 'hawk', 'butterfly'],
      golden: ['deer', 'bird', 'fox', 'hawk', 'sparrow', 'swallow'],
      evening: ['owl', 'bat', 'fox', 'deer', 'firefly'],
      night: ['firefly', 'owl', 'bat', 'fox']
    },
    sounds: {
      base: 'forestWind',
      dawn: 'birdsong',
      morning: 'birdsong',
      afternoon: 'forestAmbient',
      golden: 'birdsong',
      evening: 'owls',
      night: 'owls'
    },
    colors: {
      dawn: { ground: 'rgba(100,110,70,0.10)', accent: 'rgba(200,180,130,0.08)' },
      morning: { ground: 'rgba(80,120,70,0.08)', accent: 'rgba(180,200,140,0.06)' },
      afternoon: { ground: 'rgba(70,110,60,0.07)', accent: 'rgba(160,190,130,0.05)' },
      golden: { ground: 'rgba(140,120,60,0.12)', accent: 'rgba(220,180,80,0.10)' },
      evening: { ground: 'rgba(60,70,50,0.08)', accent: 'rgba(100,80,100,0.06)' },
      night: { ground: 'rgba(20,30,20,0.08)', accent: 'rgba(30,40,50,0.06)' }
    }
  }
};

// ===== WEATHER CONDITION MAPPING =====
var WEATHER_EFFECTS = {
  clear: { particles: 0, overlay: null },
  clouds: { particles: 0, overlay: 'overcast' },
  rain: { particles: 60, overlay: 'rain', sound: 'rain' },
  drizzle: { particles: 30, overlay: 'rain', sound: 'lightRain' },
  thunderstorm: { particles: 80, overlay: 'storm', sound: 'thunder' },
  snow: { particles: 50, overlay: 'snow', sound: 'wind' },
  mist: { particles: 0, overlay: 'fog' },
  fog: { particles: 0, overlay: 'fog' },
  haze: { particles: 0, overlay: 'haze' },
  dust: { particles: 25, overlay: 'dust', sound: 'wind' },
  sand: { particles: 35, overlay: 'dust', sound: 'wind' },
  smoke: { particles: 0, overlay: 'haze' },
  tornado: { particles: 60, overlay: 'storm', sound: 'wind' },
  squall: { particles: 50, overlay: 'storm', sound: 'wind' }
};

// ===== GEOLOCATION =====
function requestLocationPermission() {
  return new Promise(function(resolve) {
    if (!navigator.geolocation) {
      toast('Geolocation not supported on this device');
      resolve(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        WEATHER.lat = pos.coords.latitude;
        WEATHER.lon = pos.coords.longitude;
        WEATHER.locationGranted = true;
        if (typeof db !== 'undefined' && db && typeof user !== 'undefined' && user) {
          db.ref('settings/weather/' + user + '/location').set({
            lat: WEATHER.lat,
            lon: WEATHER.lon,
            granted: true
          });
          db.ref('settings/weather/' + user + '/prompted').set(true);
        }
        resolve(true);
      },
      function(err) {
        WEATHER.locationGranted = false;
        if (err.code === 1) {
          toast('Location permission denied - you can enable it in settings later');
        } else {
          toast('Could not get location - try again later');
        }
        resolve(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  });
}

// ===== SUNRISE / SUNSET CALCULATION =====
function getSunTimes() {
  if (WEATHER.data && WEATHER.data.sys && WEATHER.data.sys.sunrise) {
    return {
      sunrise: WEATHER.data.sys.sunrise * 1000,
      sunset: WEATHER.data.sys.sunset * 1000
    };
  }
  // Fallback: approximate based on latitude
  var now = new Date();
  var doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  var lat = WEATHER.lat || 35;
  var declination = 23.45 * Math.sin((2 * Math.PI / 365) * (doy - 81));
  var latRad = lat * Math.PI / 180;
  var decRad = declination * Math.PI / 180;
  var cosHA = -Math.tan(latRad) * Math.tan(decRad);
  cosHA = Math.max(-1, Math.min(1, cosHA));
  var hourAngle = Math.acos(cosHA);
  var dayHours = (2 * hourAngle * 180 / Math.PI) / 15;
  var noon = 12;
  var sunriseH = noon - dayHours / 2;
  var sunsetH = noon + dayHours / 2;
  var base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    sunrise: base.getTime() + sunriseH * 3600000,
    sunset: base.getTime() + sunsetH * 3600000
  };
}

function getTimeOfDayWeather() {
  var times = getSunTimes();
  var sunriseH = new Date(times.sunrise).getHours() + new Date(times.sunrise).getMinutes() / 60;
  var sunsetH = new Date(times.sunset).getHours() + new Date(times.sunset).getMinutes() / 60;
  var h = new Date().getHours() + new Date().getMinutes() / 60;

  if (h >= sunriseH - 1 && h < sunriseH + 1) return 'dawn';
  if (h >= sunriseH + 1 && h < 11) return 'morning';
  if (h >= 11 && h < sunsetH - 2) return 'afternoon';
  if (h >= sunsetH - 2 && h < sunsetH) return 'golden';
  if (h >= sunsetH && h < sunsetH + 2) return 'evening';
  return 'night';
}

function getSunPositionWeather() {
  var times = getSunTimes();
  var h = new Date().getHours() + new Date().getMinutes() / 60;
  var sunriseH = new Date(times.sunrise).getHours() + new Date(times.sunrise).getMinutes() / 60;
  var sunsetH = new Date(times.sunset).getHours() + new Date(times.sunset).getMinutes() / 60;
  var dayLength = sunsetH - sunriseH;
  var nightLength = 24 - dayLength;

  if (h < sunriseH || h >= sunsetH) {
    var nightT = h < sunriseH ? (h + 24 - sunsetH) : (h - sunsetH);
    var nx = 15 + (nightT / nightLength) * 70;
    var ny = 8 + 15 * Math.sin((nightT / nightLength) * Math.PI);
    return { isNight: true, x: nx, y: ny, progress: nightT / nightLength };
  }

  var dayT = (h - sunriseH) / dayLength;
  var x = 10 + dayT * 80;
  var y = 5 + 25 * Math.sin(dayT * Math.PI);
  y = 30 - y + 5;
  return { isNight: false, x: x, y: y, progress: dayT };
}

// ===== FETCH WEATHER DATA =====
function fetchWeather() {
  if (!WEATHER.lat || !WEATHER.lon) return Promise.resolve(null);

  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + WEATHER.lat +
    '&longitude=' + WEATHER.lon +
    '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,cloud_cover' +
    '&daily=sunrise,sunset&timezone=auto&forecast_days=1';

  return fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data || !data.current) return null;
      var code = data.current.weather_code;
      var condition = mapWMOCode(code);
      WEATHER.data = {
        temp: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        clouds: data.current.cloud_cover,
        condition: condition,
        code: code,
        sys: {
          sunrise: data.daily && data.daily.sunrise ? new Date(data.daily.sunrise[0]).getTime() / 1000 : null,
          sunset: data.daily && data.daily.sunset ? new Date(data.daily.sunset[0]).getTime() / 1000 : null
        }
      };
      // Update location button
      var btn = document.getElementById('set-location-btn');
      if (btn) btn.textContent = 'Refresh';
      var infoEl = document.getElementById('weather-info-display');
      if (infoEl) infoEl.classList.remove('d-none');
      return WEATHER.data;
    })
    .catch(function(e) {
      console.warn('Weather fetch failed:', e);
      return null;
    });
}

function mapWMOCode(code) {
  if (code === 0) return 'clear';
  if (code <= 3) return 'clouds';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';
  return 'clear';
}

// ===== TEMPERATURE COLOR TINTING =====
function getTempTint() {
  if (!WEATHER.data) return null;
  var t = WEATHER.data.temp;
  if (t <= -10) return { tint: 'rgba(100,140,255,0.08)', label: 'Freezing' };
  if (t <= 0) return { tint: 'rgba(120,160,255,0.06)', label: 'Cold' };
  if (t <= 10) return { tint: 'rgba(140,180,220,0.04)', label: 'Cool' };
  if (t <= 20) return { tint: 'rgba(200,210,180,0.03)', label: 'Mild' };
  if (t <= 30) return { tint: 'rgba(255,200,120,0.05)', label: 'Warm' };
  if (t <= 38) return { tint: 'rgba(255,160,60,0.07)', label: 'Hot' };
  return { tint: 'rgba(255,100,50,0.09)', label: 'Extreme heat' };
}

// ===== WEATHER PARTICLE EFFECTS =====
function renderWeatherEffects(container) {
  var existing = container.querySelector('.weather-fx-layer');
  if (existing) existing.remove();

  if (!WEATHER.data) return;
  var condition = WEATHER.data.condition;
  var fx = WEATHER_EFFECTS[condition];
  if (!fx) return;

  var layer = document.createElement('div');
  layer.className = 'weather-fx-layer';

  // Overlay
  if (fx.overlay) {
    var overlay = document.createElement('div');
    overlay.className = 'weather-overlay weather-overlay-' + fx.overlay;
    layer.appendChild(overlay);
  }

  // Particles
  if (fx.particles > 0) {
    for (var i = 0; i < fx.particles; i++) {
      var p = document.createElement('div');
      p.className = 'weather-particle weather-' + condition;
      var x = Math.random() * 120 - 10;
      var delay = Math.random() * 3;
      var dur = condition === 'snow' ? (3 + Math.random() * 4) :
                condition === 'dust' || condition === 'sand' ? (2 + Math.random() * 3) :
                (0.4 + Math.random() * 0.6);
      var size = condition === 'snow' ? (3 + Math.random() * 5) :
                 condition === 'dust' || condition === 'sand' ? (2 + Math.random() * 3) :
                 (1 + Math.random() * 1.5);

      p.style.cssText = 'left:' + x + '%;width:' + size + 'px;height:' +
        (condition === 'rain' || condition === 'drizzle' || condition === 'thunderstorm' ? size * 8 : size) +
        'px;animation-delay:' + delay + 's;animation-duration:' + dur + 's';

      if (WEATHER.data.windSpeed > 15) {
        p.style.setProperty('--wind-offset', (WEATHER.data.windSpeed * 2) + 'px');
      }
      layer.appendChild(p);
    }
  }

  // Lightning
  if (condition === 'thunderstorm') {
    scheduleLightning(layer);
  }

  // Temperature tint
  var tempTint = getTempTint();
  if (tempTint) {
    var tintOverlay = document.createElement('div');
    tintOverlay.className = 'weather-temp-tint';
    tintOverlay.style.background = tempTint.tint;
    layer.appendChild(tintOverlay);
  }

  // Wind streaks
  if (WEATHER.data.windSpeed > 20) {
    for (var w = 0; w < 8; w++) {
      var streak = document.createElement('div');
      streak.className = 'weather-wind-streak';
      streak.style.cssText = 'top:' + (Math.random() * 80) + '%;animation-delay:' + (Math.random() * 4) + 's;animation-duration:' + (1 + Math.random() * 2) + 's';
      layer.appendChild(streak);
    }
  }

  container.appendChild(layer);
}

function scheduleLightning(layer) {
  var delay = 5000 + Math.random() * 15000;
  setTimeout(function() {
    if (!layer.parentNode || !livingSkyEnabled) return;
    var flash = document.createElement('div');
    flash.className = 'weather-lightning';
    layer.appendChild(flash);
    setTimeout(function() { if (flash.parentNode) flash.remove(); }, 300);
    if (Math.random() < 0.4) {
      setTimeout(function() {
        var flash2 = document.createElement('div');
        flash2.className = 'weather-lightning';
        layer.appendChild(flash2);
        setTimeout(function() { if (flash2.parentNode) flash2.remove(); }, 200);
      }, 150);
    }
    scheduleLightning(layer);
  }, delay);
}

// ===== SCENE CREATURES =====
function renderSceneCreature(container, type) {
  switch (type) {
    case 'rabbit': renderRabbit(container); break;
    case 'bee': renderBee(container); break;
    case 'dragonfly': renderDragonfly(container); break;
    case 'deer': renderDeer(container); break;
    case 'owl': renderOwl(container); break;
    case 'bat': renderBat(container); break;
    case 'fox': renderFox(container); break;
    case 'squirrel': renderSquirrel(container); break;
    case 'woodpecker': renderWoodpecker(container); break;
    case 'seagull': renderSeagull(container); break;
    case 'pelican': renderPelican(container); break;
    case 'heron': renderHeron(container); break;
    case 'crab': renderCrab(container); break;
    case 'dolphin': renderDolphin(container); break;
    case 'fish': renderFish(container); break;
    case 'jellyfish': renderJellyfish(container); break;
    case 'turtle': renderTurtle(container); break;
    case 'whale': renderWhale(container); break;
    case 'hawk': renderHawk(container); break;
    case 'swallow': renderSwallow(container); break;
    case 'sparrow': renderSparrow(container); break;
    case 'songbird': case 'bird': renderBird(container); break;
    case 'butterfly': renderButterfly(container); break;
    case 'firefly': renderFirefly(container); break;
  }
}

function renderRabbit(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-rabbit';
  var x = 10 + Math.random() * 70;
  var dur = 12 + Math.random() * 10;
  el.style.cssText = 'left:' + x + '%;bottom:8%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="rabbit-body"></div><div class="rabbit-ear rabbit-ear-l"></div><div class="rabbit-ear rabbit-ear-r"></div><div class="rabbit-tail"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderBee(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-bee';
  var x = Math.random() * 80;
  var y = 20 + Math.random() * 40;
  var dur = 16 + Math.random() * 14;
  var dx = 100 + Math.random() * 200;
  var dy = (Math.random() - 0.5) * 80;
  el.style.cssText = 'left:' + x + '%;top:' + y + '%;--bee-dx:' + dx + 'px;--bee-dy:' + dy + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="bee-body"></div><div class="bee-wing bee-wing-l"></div><div class="bee-wing bee-wing-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderDragonfly(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-dragonfly';
  var x = Math.random() * 80;
  var y = 15 + Math.random() * 35;
  var dur = 12 + Math.random() * 10;
  var dx = 150 + Math.random() * 200;
  el.style.cssText = 'left:' + x + '%;top:' + y + '%;--df-dx:' + dx + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="df-body"></div><div class="df-wing df-wing-l"></div><div class="df-wing df-wing-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderDeer(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-deer';
  var dur = 22 + Math.random() * 14;
  var dir = Math.random() < 0.5 ? 1 : -1;
  el.style.cssText = 'bottom:6%;' + (dir > 0 ? 'left:-5%' : 'right:-5%') + ';--deer-dir:' + (dir * 300) + 'px;animation-duration:' + dur + 's';
  if (dir < 0) el.style.transform = 'scaleX(-1)';
  el.innerHTML = '<div class="deer-body"></div><div class="deer-head"></div><div class="deer-antler deer-antler-l"></div><div class="deer-antler deer-antler-r"></div><div class="deer-leg deer-leg-fl"></div><div class="deer-leg deer-leg-fr"></div><div class="deer-leg deer-leg-bl"></div><div class="deer-leg deer-leg-br"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 2) * 1000);
}

function renderOwl(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-owl';
  var x = 15 + Math.random() * 60;
  var y = 10 + Math.random() * 20;
  el.style.cssText = 'left:' + x + '%;top:' + y + '%';
  el.innerHTML = '<div class="owl-body"></div><div class="owl-eye owl-eye-l"></div><div class="owl-eye owl-eye-r"></div><div class="owl-wing owl-wing-l"></div><div class="owl-wing owl-wing-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, 15000);
}

function renderBat(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-bat';
  var x = Math.random() * 20 - 10;
  var y = 10 + Math.random() * 25;
  var dur = 10 + Math.random() * 8;
  var dx = 200 + Math.random() * 300;
  var dy = (Math.random() - 0.5) * 80;
  el.style.cssText = 'left:' + x + '%;top:' + y + '%;--bat-dx:' + dx + 'px;--bat-dy:' + dy + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="bat-body"></div><div class="bat-wing bat-wing-l"></div><div class="bat-wing bat-wing-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderFox(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-fox';
  var dur = 18 + Math.random() * 14;
  var dir = Math.random() < 0.5 ? 1 : -1;
  el.style.cssText = 'bottom:6%;' + (dir > 0 ? 'left:-5%' : 'right:-5%') + ';--fox-dir:' + (dir * 250) + 'px;animation-duration:' + dur + 's';
  if (dir < 0) el.style.transform = 'scaleX(-1)';
  el.innerHTML = '<div class="fox-body"></div><div class="fox-tail"></div><div class="fox-ear fox-ear-l"></div><div class="fox-ear fox-ear-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 2) * 1000);
}

function renderSquirrel(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-squirrel';
  var x = 20 + Math.random() * 60;
  var dur = 10 + Math.random() * 8;
  el.style.cssText = 'left:' + x + '%;bottom:10%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="squirrel-body"></div><div class="squirrel-tail"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderWoodpecker(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-woodpecker';
  var x = 10 + Math.random() * 30;
  var y = 15 + Math.random() * 25;
  el.style.cssText = 'left:' + x + '%;top:' + y + '%';
  el.innerHTML = '<div class="wp-body"></div><div class="wp-beak"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, 10000);
}

function renderSeagull(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-seagull';
  var x = -10 + Math.random() * 20;
  var y = 8 + Math.random() * 20;
  var dur = 14 + Math.random() * 12;
  var dx = 300 + Math.random() * 300;
  var dy = (Math.random() - 0.5) * 50;
  el.style.cssText = 'left:' + x + '%;top:' + y + '%;--sg-dx:' + dx + 'px;--sg-dy:' + dy + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="sg-body"></div><div class="sg-wing sg-wing-l"></div><div class="sg-wing sg-wing-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderCrab(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-crab';
  var dur = 16 + Math.random() * 10;
  var dir = Math.random() < 0.5 ? 1 : -1;
  el.style.cssText = 'bottom:4%;' + (dir > 0 ? 'left:5%' : 'right:5%') + ';--crab-dir:' + (dir * 120) + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="crab-body"></div><div class="crab-claw crab-claw-l"></div><div class="crab-claw crab-claw-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderDolphin(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-dolphin';
  var dur = 12 + Math.random() * 8;
  el.style.cssText = 'bottom:12%;left:-10%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="dolphin-body"></div><div class="dolphin-fin"></div><div class="dolphin-tail"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderFish(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-fish';
  var y = 50 + Math.random() * 30;
  var dur = 10 + Math.random() * 10;
  el.style.cssText = 'left:-5%;top:' + y + '%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="fish-body"></div><div class="fish-tail"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderJellyfish(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-jellyfish';
  var x = 20 + Math.random() * 60;
  var dur = 18 + Math.random() * 14;
  el.style.cssText = 'left:' + x + '%;bottom:15%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="jf-body"></div><div class="jf-tentacle jf-t1"></div><div class="jf-tentacle jf-t2"></div><div class="jf-tentacle jf-t3"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderTurtle(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-turtle';
  var dur = 28 + Math.random() * 16;
  el.style.cssText = 'bottom:5%;left:-5%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="turtle-shell"></div><div class="turtle-head"></div><div class="turtle-leg turtle-leg-fl"></div><div class="turtle-leg turtle-leg-fr"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 2) * 1000);
}

function renderWhale(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-whale';
  var dur = 35 + Math.random() * 15;
  el.style.cssText = 'bottom:20%;left:-15%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="whale-body"></div><div class="whale-tail"></div><div class="whale-spout"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 2) * 1000);
}

// ===== NEW CREATURE RENDERERS =====
function renderHawk(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-hawk';
  var startX = -10;
  var startY = 5 + Math.random() * 15;
  var dur = 18 + Math.random() * 14;
  var dx = 350 + Math.random() * 300;
  var dy = -(10 + Math.random() * 20);
  el.style.cssText = 'left:' + startX + '%;top:' + startY + '%;--hawk-dx:' + dx + 'px;--hawk-dy:' + dy + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="hawk-body"></div><div class="hawk-wing hawk-wing-l"></div><div class="hawk-wing hawk-wing-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 2) * 1000);
}

function renderSwallow(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-swallow';
  var startX = Math.random() < 0.5 ? -8 : 108;
  var startY = 10 + Math.random() * 30;
  var dur = 8 + Math.random() * 8;
  var dx = startX < 0 ? (300 + Math.random() * 200) : -(300 + Math.random() * 200);
  var dy = (Math.random() - 0.5) * 120;
  el.style.cssText = 'left:' + startX + '%;top:' + startY + '%;--sw-dx:' + dx + 'px;--sw-dy:' + dy + 'px;animation-duration:' + dur + 's';
  if (startX > 50) el.style.transform = 'scaleX(-1)';
  el.innerHTML = '<div class="sw-body"></div><div class="sw-wing sw-wing-l"></div><div class="sw-wing sw-wing-r"></div><div class="sw-tail"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderSparrow(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-sparrow';
  var startX = -5 + Math.random() * 15;
  var startY = 12 + Math.random() * 25;
  var dur = 12 + Math.random() * 10;
  var dx = 200 + Math.random() * 250;
  var dy = -(10 + Math.random() * 30);
  el.style.cssText = 'left:' + startX + '%;top:' + startY + '%;--sp-dx:' + dx + 'px;--sp-dy:' + dy + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="sp-body"></div><div class="sp-wing sp-wing-l"></div><div class="sp-wing sp-wing-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderHeron(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-heron';
  var dur = 24 + Math.random() * 14;
  var startX = -10;
  var startY = 8 + Math.random() * 15;
  var dx = 400 + Math.random() * 200;
  var dy = -(5 + Math.random() * 15);
  el.style.cssText = 'left:' + startX + '%;top:' + startY + '%;--hr-dx:' + dx + 'px;--hr-dy:' + dy + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="hr-body"></div><div class="hr-wing hr-wing-l"></div><div class="hr-wing hr-wing-r"></div><div class="hr-neck"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 2) * 1000);
}

function renderPelican(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-pelican';
  var dur = 18 + Math.random() * 14;
  var startX = -10;
  var startY = 10 + Math.random() * 18;
  var dx = 350 + Math.random() * 250;
  var dy = (Math.random() - 0.5) * 40;
  el.style.cssText = 'left:' + startX + '%;top:' + startY + '%;--pl-dx:' + dx + 'px;--pl-dy:' + dy + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="pl-body"></div><div class="pl-wing pl-wing-l"></div><div class="pl-wing pl-wing-r"></div><div class="pl-beak"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 2) * 1000);
}

// ===== AMBIENT AUDIO SYSTEM =====

// Ensure we always have a valid, open AudioContext
function _ensureAudioCtx() {
  try {
    // If context was closed or doesn't exist, create a new one
    if (!WEATHER.audioCtx || WEATHER.audioCtx.state === 'closed') {
      WEATHER.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      _noiseCache = {}; // buffers from old context may be invalid
      WEATHER.audioNodes = {}; // nodes from old context are invalid
      _attachCtxStateListener(WEATHER.audioCtx);
    }
    return WEATHER.audioCtx;
  } catch(e) {
    return null;
  }
}

// Listen for AudioContext state changes (iOS interruptions, background, etc.)
function _attachCtxStateListener(ctx) {
  if (!ctx) return;
  ctx.onstatechange = function() {
    // When iOS interrupts audio (phone call, Siri, etc.) and then returns,
    // the context goes interrupted -> suspended -> running. Auto-resume it.
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      // Try to resume — this will succeed if we're in a user gesture or
      // if the interruption has ended
      ctx.resume().catch(function(){});
    }
    // If context recovered to running, restart sounds
    if (ctx.state === 'running' && WEATHER.audioEnabled) {
      if (Object.keys(WEATHER.audioNodes).length === 0) {
        setTimeout(updateAmbientAudio, 200);
      }
    }
  };
}

// Force-recreate AudioContext (for when existing context is permanently broken)
function _recreateAudioCtx() {
  try {
    if (WEATHER.audioCtx) {
      try { WEATHER.audioCtx.close(); } catch(e) {}
    }
    WEATHER.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    _noiseCache = {};
    WEATHER.audioNodes = {};
    _attachCtxStateListener(WEATHER.audioCtx);
    return WEATHER.audioCtx;
  } catch(e) {
    return null;
  }
}

// Resume AudioContext — call during user gesture
function _resumeCtx(ctx) {
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      ctx.resume();
    }
    // Play a real oscillator tone (inaudible) to force iOS audio pipeline open
    // Oscillators are more reliable than silent buffers for iOS unlock
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    g.gain.value = 0.001; // near-silent
    o.connect(g);
    g.connect(ctx.destination);
    o.start(0);
    o.stop(ctx.currentTime + 0.05);
  } catch(e) {}
  // Prime via HTML Audio element for iOS PWAs (WKWebView)
  // Must re-prime every time — iOS resets audio session after background/interruption
  _primeHtmlAudio();
}

// iOS PWA audio session primer — plays a tiny WAV via <audio> element
// This switches iOS audio session from "ambient" (respects silent switch)
// to "playback" (ignores silent switch). Must be called during user gesture.
var _htmlAudioEl = null;
function _primeHtmlAudio() {
  try {
    if (!_htmlAudioEl) {
      _htmlAudioEl = document.createElement('audio');
      _htmlAudioEl.setAttribute('playsinline', '');
      _htmlAudioEl.setAttribute('webkit-playsinline', '');
      _htmlAudioEl.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    }
    _htmlAudioEl.volume = 0.01;
    _htmlAudioEl.currentTime = 0;
    _htmlAudioEl.play().catch(function(){});
  } catch(e) {}
}

// Audio unlock - requires user gesture on iOS/Safari
function unlockAudio() {
  var ctx = _ensureAudioCtx();
  if (!ctx) return;
  _resumeCtx(ctx);
  WEATHER.audioUnlocked = true;
  _onAudioReady();
}

function _onAudioReady() {
  WEATHER._audioQueued = false; // context is ready, clear queued flag
  if (WEATHER.audioEnabled) {
    setTimeout(updateAmbientAudio, 100);
  }
  if (WEATHER.moodPlaying) {
    setTimeout(function() { playMoodSound(WEATHER.moodPlaying); }, 200);
  }
}

// Keep listener alive - AudioContext can re-suspend on mobile (page background, etc.)
var _unlockTimer = null;
function _tryUnlock() {
  if (typeof vnRecording !== 'undefined' && vnRecording) return;
  if (WEATHER.audioUnlocked && WEATHER.audioCtx && WEATHER.audioCtx.state === 'running') {
    // Context is healthy — if sounds were queued, start them now
    if (WEATHER._audioQueued && WEATHER.audioEnabled) {
      WEATHER._audioQueued = false;
      updateAmbientAudio();
    }
    return;
  }
  if (_unlockTimer) return;
  _unlockTimer = setTimeout(function() { _unlockTimer = null; }, 300);

  // If context exists but is stuck suspended, it was likely created outside a user gesture.
  // Recreate immediately during THIS user gesture so it can actually be resumed.
  if (WEATHER.audioCtx && WEATHER.audioCtx.state === 'suspended') {
    _recreateAudioCtx();
  }
  unlockAudio();

  // If sounds were queued (from Firebase init), start them now that we have a valid context
  if (WEATHER._audioQueued && WEATHER.audioEnabled) {
    WEATHER._audioQueued = false;
    setTimeout(updateAmbientAudio, 150);
  }
}
document.addEventListener('touchstart', _tryUnlock, { passive: true });
document.addEventListener('touchend', _tryUnlock, { passive: true });
document.addEventListener('click', _tryUnlock);

// ===== SOUND GENERATION ENGINE =====
// Helper: clamp sample values
function _clamp(v) { return v > 1 ? 1 : v < -1 ? -1 : v; }

// Helper: generate brown noise into a buffer
function _brownNoise(d, len, gain) {
  var b = 0;
  for (var i = 0; i < len; i++) {
    b = 0.97 * b + 0.03 * (Math.random() * 2 - 1);
    d[i] += b * (gain || 1);
  }
}

// Helper: generate pink noise into a buffer
function _pinkNoise(d, len, gain) {
  var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
  for (var i = 0; i < len; i++) {
    var w = Math.random() * 2 - 1;
    b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
    b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
    b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
    d[i]+=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11*(gain||1); b6=w*0.115926;
  }
}

// Helper: add a bird chirp event at position
function _addBird(d, sr, pos, species) {
  var PI2 = 2 * Math.PI;
  var len = d.length;
  // Different bird species have distinct call patterns
  var patterns = [
    // Robin: rapid descending trill
    function(d, sr, pos) {
      var notes = 3 + Math.floor(Math.random() * 4);
      var p = pos;
      for (var n = 0; n < notes; n++) {
        var f = 3200 - n * 180 + Math.random() * 300;
        var nLen = Math.min(Math.floor(sr * (0.06 + Math.random() * 0.08)), len - p);
        for (var k = 0; k < nLen; k++) {
          var env = Math.sin(Math.PI * k / nLen); // smooth envelope
          d[p + k] += Math.sin(PI2 * (f + 400 * Math.sin(PI2 * 12 * k / sr)) * k / sr) * 0.22 * env;
        }
        p += nLen + Math.floor(sr * 0.02);
        if (p >= len) break;
      }
    },
    // Warbler: rising two-tone whistle
    function(d, sr, pos) {
      var dur = Math.min(Math.floor(sr * (0.4 + Math.random() * 0.3)), len - pos);
      for (var k = 0; k < dur; k++) {
        var t = k / dur;
        var f = 2400 + t * 1200 + 200 * Math.sin(PI2 * 6 * t);
        var env = Math.sin(Math.PI * t) * 0.8;
        d[pos + k] += Math.sin(PI2 * f * k / sr) * 0.18 * env;
      }
    },
    // Sparrow: short repeated peeps
    function(d, sr, pos) {
      var peeps = 2 + Math.floor(Math.random() * 3);
      var p = pos;
      for (var n = 0; n < peeps; n++) {
        var f = 3800 + Math.random() * 600;
        var pLen = Math.min(Math.floor(sr * 0.05), len - p);
        for (var k = 0; k < pLen; k++) {
          var env = Math.sin(Math.PI * k / pLen);
          d[p + k] += Math.sin(PI2 * f * k / sr) * 0.2 * env;
        }
        p += pLen + Math.floor(sr * (0.08 + Math.random() * 0.1));
        if (p >= len) break;
      }
    },
    // Thrush: rich melodic phrase with harmonics
    function(d, sr, pos) {
      var dur = Math.min(Math.floor(sr * (0.5 + Math.random() * 0.5)), len - pos);
      var baseF = 1800 + Math.random() * 400;
      for (var k = 0; k < dur; k++) {
        var t = k / dur;
        var fm = Math.sin(PI2 * 4 * t) * 300;
        var f = baseF + fm + t * 600 * Math.sin(PI2 * 2 * t);
        var env = (1 - Math.pow(2 * t - 1, 2)) * 0.7; // bell curve
        d[pos + k] += (Math.sin(PI2 * f * k / sr) * 0.15 + Math.sin(PI2 * f * 2 * k / sr) * 0.05) * env;
      }
    }
  ];
  var fn = patterns[species % patterns.length];
  fn(d, sr, pos);
}

// Helper: add cricket chirp pattern
function _addCricketChorus(d, sr, pos) {
  var PI2 = 2 * Math.PI;
  var len = d.length;
  // Realistic: rapid burst of 3-6 pulses at ~4200Hz
  var pulses = 3 + Math.floor(Math.random() * 4);
  var p = pos;
  var baseF = 3800 + Math.random() * 800;
  for (var n = 0; n < pulses; n++) {
    var pLen = Math.min(Math.floor(sr * 0.015), len - p);
    for (var k = 0; k < pLen; k++) {
      var env = Math.sin(Math.PI * k / pLen);
      d[p + k] += Math.sin(PI2 * baseF * k / sr) * 0.3 * env;
    }
    p += pLen + Math.floor(sr * 0.012);
    if (p >= len) break;
  }
}

// Cache generated buffers to avoid CPU-heavy re-generation on every play
var _noiseCache = {};

function generateNoise(type) {
  if (!WEATHER.audioCtx) return null;
  // Return cached buffer if available (ambient/nature sounds loop the same buffer)
  if (_noiseCache[type]) return _noiseCache[type];
  var ctx = WEATHER.audioCtx;
  var sr = ctx.sampleRate;
  var len = sr * 30; // 30-second loops for longer, more natural ambience
  var buffer = ctx.createBuffer(2, len, sr); // stereo
  var L = buffer.getChannelData(0);
  var R = buffer.getChannelData(1);
  var PI2 = 2 * Math.PI;
  var i, k, t;

  switch (type) {
    case 'rain': {
      // Layered rain: base hiss + distinct droplet impacts + puddle splashes
      _brownNoise(L, len, 0.25);
      _brownNoise(R, len, 0.25);
      // Add filtered white noise for hiss
      for (i = 0; i < len; i++) {
        var w = (Math.random() * 2 - 1) * 0.35;
        L[i] += w; R[i] += w * 0.9 + (Math.random() * 2 - 1) * 0.05;
      }
      // Droplet impacts - varied sizes, random stereo position
      for (var drop = 0; drop < 200; drop++) {
        var pos = Math.floor(Math.random() * (len - sr * 0.05));
        var size = 0.2 + Math.random() * 0.6; // drop size
        var dropLen = Math.floor(sr * (0.002 + size * 0.008));
        var pan = Math.random(); // 0=left, 1=right
        var freq = 2000 + (1 - size) * 4000; // smaller drops = higher pitch
        for (k = 0; k < dropLen && pos + k < len; k++) {
          var s = Math.sin(PI2 * freq * k / sr) * size * 0.4 * Math.exp(-k / (dropLen * 0.3));
          L[pos + k] += s * (1 - pan * 0.6);
          R[pos + k] += s * (0.4 + pan * 0.6);
        }
      }
      // Gentle rhythm - waves of intensity
      for (i = 0; i < len; i++) {
        t = i / sr;
        var intensity = 0.7 + 0.3 * Math.sin(PI2 * 0.15 * t);
        L[i] *= intensity; R[i] *= intensity;
        L[i] = _clamp(L[i]); R[i] = _clamp(R[i]);
      }
      break;
    }
    case 'lightRain': {
      _pinkNoise(L, len, 0.15);
      _pinkNoise(R, len, 0.15);
      // Sparse gentle drops
      for (var drop = 0; drop < 60; drop++) {
        var pos = Math.floor(Math.random() * (len - sr * 0.02));
        var dLen = Math.floor(sr * (0.003 + Math.random() * 0.006));
        var pan = Math.random();
        var freq = 3000 + Math.random() * 3000;
        for (k = 0; k < dLen && pos + k < len; k++) {
          var s = Math.sin(PI2 * freq * k / sr) * 0.25 * Math.exp(-k / (dLen * 0.25));
          L[pos + k] += s * (1 - pan * 0.5);
          R[pos + k] += s * (0.5 + pan * 0.5);
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'wind': {
      // Rich wind: layered brown noise with slow modulation (gusts)
      var b0 = 0, b1 = 0;
      for (i = 0; i < len; i++) {
        t = i / sr;
        var gust = 0.5 + 0.5 * Math.sin(PI2 * 0.08 * t + Math.sin(PI2 * 0.03 * t) * 2);
        b0 = 0.97 * b0 + 0.03 * (Math.random() * 2 - 1);
        b1 = 0.985 * b1 + 0.015 * (Math.random() * 2 - 1);
        L[i] = (b0 * 2.5 + b1 * 0.8) * gust;
        R[i] = (b0 * 0.8 + b1 * 2.5) * gust;
        // Whistling overtones during strong gusts
        if (gust > 0.75) {
          var whistle = Math.sin(PI2 * (400 + gust * 200) * t) * 0.04 * (gust - 0.75) * 4;
          L[i] += whistle; R[i] += whistle * 0.7;
        }
        L[i] = _clamp(L[i]); R[i] = _clamp(R[i]);
      }
      break;
    }
    case 'forestWind': {
      // Forest breeze + leaf rustles + distant bird + creaking
      var bw = 0;
      for (i = 0; i < len; i++) {
        t = i / sr;
        var breeze = 0.4 + 0.3 * Math.sin(PI2 * 0.1 * t) + 0.2 * Math.sin(PI2 * 0.04 * t);
        bw = 0.98 * bw + 0.02 * (Math.random() * 2 - 1);
        L[i] = bw * 1.2 * breeze;
        R[i] = bw * 1.0 * breeze + (Math.random() * 2 - 1) * 0.08 * breeze;
      }
      // Leaf rustles
      for (var r = 0; r < 30; r++) {
        var pos = Math.floor(Math.random() * (len - sr * 0.3));
        var rLen = Math.floor(sr * (0.05 + Math.random() * 0.2));
        var pan = Math.random();
        for (k = 0; k < rLen && pos + k < len; k++) {
          var s = (Math.random() * 2 - 1) * 0.3 * Math.exp(-k / (rLen * 0.4));
          L[pos + k] += s * (1 - pan * 0.5); R[pos + k] += s * (0.5 + pan * 0.5);
        }
      }
      // A few distant birds
      for (var b = 0; b < 4; b++) {
        var bPos = Math.floor(sr * 1.5 + Math.random() * (len - sr * 3));
        _addBird(L, sr, bPos, b);
        // Quieter in right channel (distance effect)
        var tmp = new Float32Array(len);
        _addBird(tmp, sr, bPos, b);
        for (i = bPos; i < Math.min(bPos + sr, len); i++) R[i] += tmp[i] * 0.4;
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'waves': {
      // Ocean: rolling surf cycles with undertow, foam hiss, deep rumble
      for (i = 0; i < len; i++) {
        t = i / sr;
        // Wave cycle: ~7 seconds per wave
        var wave = Math.sin(PI2 * 0.14 * t);
        var surf = Math.max(0, wave); // only positive half = wave crashing
        var pull = Math.max(0, -wave) * 0.4; // undertow
        // Deep ocean rumble
        var rumble = Math.sin(PI2 * 55 * t + Math.sin(PI2 * 0.2 * t) * 3) * 0.08 +
                     Math.sin(PI2 * 38 * t) * 0.05;
        // Surf noise (filtered white noise shaped by wave envelope)
        var noise = (Math.random() * 2 - 1);
        var surfNoise = noise * (surf * 0.5 + 0.15);
        var pullNoise = noise * pull * 0.3;
        // Foam hiss (high frequency, during crash)
        var foam = (Math.random() * 2 - 1) * surf * surf * 0.3;
        L[i] = _clamp(rumble + surfNoise + pullNoise + foam * 0.8);
        R[i] = _clamp(rumble + surfNoise * 0.9 + pullNoise + foam);
      }
      break;
    }
    case 'thunder': {
      // Thunderstorm: rain base + rolling thunder + lightning cracks
      // Rain base
      for (i = 0; i < len; i++) {
        var w = (Math.random() * 2 - 1) * 0.25;
        L[i] = w; R[i] = w * 0.85 + (Math.random() * 2 - 1) * 0.04;
      }
      _brownNoise(L, len, 0.2);
      _brownNoise(R, len, 0.2);
      // 1-2 thunder events in 10 seconds
      var numThunder = 1 + Math.floor(Math.random() * 2);
      for (var th = 0; th < numThunder; th++) {
        var tPos = Math.floor(sr * (1 + Math.random() * 7));
        // Lightning crack - sharp transient
        var crackLen = Math.floor(sr * 0.05);
        for (k = 0; k < crackLen && tPos + k < len; k++) {
          var s = (Math.random() * 2 - 1) * 0.8 * Math.exp(-k / (crackLen * 0.15));
          L[tPos + k] += s; R[tPos + k] += s * 0.9;
        }
        // Rolling rumble - long decay with low-frequency content
        var rumbleLen = Math.floor(sr * (2 + Math.random() * 2));
        var rStart = tPos + crackLen;
        var bx = 0;
        for (k = 0; k < rumbleLen && rStart + k < len; k++) {
          bx = 0.985 * bx + 0.015 * (Math.random() * 2 - 1);
          var env = Math.exp(-k / (rumbleLen * 0.5));
          var rumble = bx * 2.5 * env + Math.sin(PI2 * 40 * k / sr) * 0.15 * env;
          L[rStart + k] += rumble;
          R[rStart + k] += rumble * (0.7 + 0.3 * Math.sin(PI2 * 0.5 * k / sr)); // pan wander
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'crickets': {
      // Night ambience: multiple crickets at different distances + gentle breeze + tree frogs
      _brownNoise(L, len, 0.12);
      _brownNoise(R, len, 0.12);
      // Near crickets (loud, distinct)
      for (var c = 0; c < 40; c++) {
        var cPos = Math.floor(Math.random() * (len - sr));
        _addCricketChorus(L, sr, cPos);
        if (Math.random() > 0.5) _addCricketChorus(R, sr, cPos + Math.floor(Math.random() * sr * 0.05));
      }
      // Distant cricket bed (continuous, softer)
      for (i = 0; i < len; i++) {
        t = i / sr;
        var chirp = Math.sin(PI2 * 4100 * t) * Math.max(0, Math.sin(PI2 * 3.5 * t)) * 0.06;
        L[i] += chirp; R[i] += chirp * 0.7;
      }
      // Occasional tree frog
      for (var f = 0; f < 3; f++) {
        var fPos = Math.floor(Math.random() * (len - sr * 0.5));
        var fLen = Math.floor(sr * (0.1 + Math.random() * 0.15));
        var fFreq = 1200 + Math.random() * 600;
        for (k = 0; k < fLen && fPos + k < len; k++) {
          var env = Math.sin(Math.PI * k / fLen);
          var s = Math.sin(PI2 * fFreq * k / sr) * 0.15 * env;
          R[fPos + k] += s; L[fPos + k] += s * 0.3;
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'birdsong': {
      // Dawn chorus: multiple bird species + gentle breeze + soft ambience
      _pinkNoise(L, len, 0.08);
      _pinkNoise(R, len, 0.08);
      // Layer 8-12 bird events across the 10 seconds
      var numBirds = 8 + Math.floor(Math.random() * 5);
      for (var b = 0; b < numBirds; b++) {
        var bPos = Math.floor(Math.random() * (len - sr * 1.5));
        var species = Math.floor(Math.random() * 4);
        var channel = Math.random() > 0.5 ? L : R;
        _addBird(channel, sr, bPos, species);
        // Bleed into other channel at lower volume (spatial)
        var other = channel === L ? R : L;
        var tmpBuf = new Float32Array(len);
        _addBird(tmpBuf, sr, bPos, species);
        var bleed = 0.2 + Math.random() * 0.3;
        for (i = bPos; i < Math.min(bPos + sr * 2, len); i++) other[i] += tmpBuf[i] * bleed;
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'seagulls': {
      // Beach: ocean surf + gull cries + distant shore ambience
      // Ocean base
      for (i = 0; i < len; i++) {
        t = i / sr;
        var wave = Math.sin(PI2 * 0.12 * t);
        var surf = Math.max(0, wave) * 0.4;
        var noise = (Math.random() * 2 - 1) * (surf + 0.12);
        L[i] = noise; R[i] = noise * 0.85 + (Math.random() * 2 - 1) * 0.04;
      }
      // Gull calls
      for (var g = 0; g < 5; g++) {
        var gPos = Math.floor(Math.random() * (len - sr * 1.5));
        var gLen = Math.floor(sr * (0.6 + Math.random() * 0.8));
        var cries = 2 + Math.floor(Math.random() * 3);
        var p = gPos;
        var pan = Math.random();
        for (var c = 0; c < cries; c++) {
          var cLen = Math.floor(sr * (0.15 + Math.random() * 0.15));
          for (k = 0; k < cLen && p + k < len; k++) {
            var freq = 1400 + 500 * Math.sin(PI2 * 4 * k / sr) + c * 100;
            var env = Math.sin(Math.PI * k / cLen);
            var s = Math.sin(PI2 * freq * k / sr) * 0.2 * env;
            L[p + k] += s * (1 - pan * 0.6);
            R[p + k] += s * (0.4 + pan * 0.6);
          }
          p += cLen + Math.floor(sr * 0.05);
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'owls': {
      // Night forest: deep quiet + owl hoots + distant rustles + very faint wind
      _brownNoise(L, len, 0.06);
      _brownNoise(R, len, 0.06);
      // 2-3 owl hoot sequences
      for (var o = 0; o < 2 + Math.floor(Math.random() * 2); o++) {
        var oPos = Math.floor(sr * (0.5 + Math.random() * 7));
        var hoots = 2 + Math.floor(Math.random() * 3); // "hoo-hoo-hoooo"
        var p = oPos;
        var pan = 0.3 + Math.random() * 0.4;
        for (var h = 0; h < hoots; h++) {
          var hLen = Math.floor(sr * (h === hoots - 1 ? 0.5 : 0.2)); // last hoot longer
          var freq = 320 + Math.random() * 60;
          for (k = 0; k < hLen && p + k < len; k++) {
            var env = Math.sin(Math.PI * k / hLen) * (h === hoots - 1 ? 1 : 0.7);
            var s = (Math.sin(PI2 * freq * k / sr) * 0.3 + Math.sin(PI2 * freq * 2 * k / sr) * 0.08) * env;
            L[p + k] += s * (1 - pan * 0.5);
            R[p + k] += s * (0.5 + pan * 0.5);
          }
          p += hLen + Math.floor(sr * (h === hoots - 1 ? 0 : 0.15));
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'insects':
    case 'forestAmbient': {
      // Summer forest: cicadas + various insects + breeze
      _pinkNoise(L, len, 0.1);
      _pinkNoise(R, len, 0.1);
      // Cicada drone (rises and falls)
      for (i = 0; i < len; i++) {
        t = i / sr;
        var vol = 0.3 + 0.2 * Math.sin(PI2 * 0.15 * t);
        var cicada = Math.sin(PI2 * 2800 * t) * vol * 0.08 +
                     Math.sin(PI2 * 3200 * t + Math.sin(PI2 * 8 * t)) * vol * 0.05;
        L[i] += cicada; R[i] += cicada * 0.8;
      }
      // Scattered insect chirps
      for (var ins = 0; ins < 20; ins++) {
        var iPos = Math.floor(Math.random() * (len - sr * 0.1));
        _addCricketChorus(Math.random() > 0.5 ? L : R, sr, iPos);
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }

    // ===== ENVIRONMENT-THEMED NATURE SOUNDS =====
    case 'mountainCreek': {
      // Mountain creek: babbling water over rocks + gentle wind through pines
      // Water base - filtered noise with rhythmic burbling
      for (i = 0; i < len; i++) {
        t = i / sr;
        var flow = 0.12 + 0.06 * Math.sin(PI2 * 0.3 * t) + 0.04 * Math.sin(PI2 * 0.7 * t);
        var water = (Math.random() * 2 - 1) * flow;
        // High-frequency sparkle (water over rocks)
        var sparkle = Math.sin(PI2 * (2200 + 400 * Math.sin(PI2 * 1.5 * t)) * t) * 0.03 * flow;
        // Low rumble of deeper water
        var deep = Math.sin(PI2 * 65 * t) * 0.04 + Math.sin(PI2 * 90 * t) * 0.02;
        L[i] = water + sparkle + deep;
        R[i] = water * 0.85 + sparkle * 1.1 + deep + (Math.random() * 2 - 1) * 0.03;
      }
      // Burble events - small splashes
      for (var b = 0; b < 40; b++) {
        var bPos = Math.floor(Math.random() * (len - sr * 0.15));
        var bLen = Math.floor(sr * (0.03 + Math.random() * 0.08));
        var pan = Math.random();
        for (k = 0; k < bLen && bPos + k < len; k++) {
          var env = Math.exp(-k / (bLen * 0.3));
          var s = (Math.random() * 2 - 1) * 0.25 * env;
          L[bPos + k] += s * (1 - pan * 0.5);
          R[bPos + k] += s * (0.5 + pan * 0.5);
        }
      }
      // Gentle pine wind
      _pinkNoise(L, len, 0.04);
      _pinkNoise(R, len, 0.04);
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'beachBreeze': {
      // Beach breeze: gentle ocean surf + warm wind + distant shore sounds
      for (i = 0; i < len; i++) {
        t = i / sr;
        // Slow, gentle waves (longer period than 'waves' - more relaxing)
        var wave = Math.sin(PI2 * 0.09 * t);
        var surf = Math.max(0, wave) * 0.3;
        var pull = Math.max(0, -wave) * 0.15;
        // Warm wind through palms
        var wind = (Math.random() * 2 - 1) * (0.06 + 0.03 * Math.sin(PI2 * 0.15 * t));
        // Surf foam
        var foam = (Math.random() * 2 - 1) * surf * 0.4;
        // Deep warmth
        var warmth = Math.sin(PI2 * 50 * t) * 0.03;
        L[i] = surf * (Math.random() * 2 - 1) * 0.5 + pull * (Math.random() * 2 - 1) * 0.3 + wind + foam * 0.7 + warmth;
        R[i] = surf * (Math.random() * 2 - 1) * 0.45 + pull * (Math.random() * 2 - 1) * 0.3 + wind * 0.9 + foam + warmth;
      }
      // Occasional palm frond rustle
      for (var r = 0; r < 8; r++) {
        var rPos = Math.floor(Math.random() * (len - sr * 0.3));
        var rLen = Math.floor(sr * (0.1 + Math.random() * 0.2));
        for (k = 0; k < rLen && rPos + k < len; k++) {
          var env = Math.sin(Math.PI * k / rLen);
          var s = (Math.random() * 2 - 1) * 0.08 * env;
          L[rPos + k] += s; R[rPos + k] += s * 0.6;
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'mountainWind': {
      // High altitude wind: deep gusts through mountain passes + distant eagle
      _brownNoise(L, len, 0.12);
      _brownNoise(R, len, 0.12);
      // Wind gusts - swelling and fading
      for (i = 0; i < len; i++) {
        t = i / sr;
        var gust = 0.5 + 0.5 * Math.sin(PI2 * 0.12 * t + Math.sin(PI2 * 0.04 * t) * 2);
        L[i] *= gust; R[i] *= gust * 0.9;
        // Whistling through rocks
        var whistle = Math.sin(PI2 * (800 + 200 * Math.sin(PI2 * 0.3 * t)) * t) * 0.02 * gust;
        L[i] += whistle * 0.7; R[i] += whistle;
      }
      // Eagle cry (1-2 distant calls)
      for (var e = 0; e < 1 + Math.floor(Math.random() * 2); e++) {
        var ePos = Math.floor(sr * (2 + Math.random() * 6));
        var eLen = Math.floor(sr * (0.8 + Math.random() * 0.5));
        for (k = 0; k < eLen && ePos + k < len; k++) {
          var env = Math.sin(Math.PI * k / eLen);
          var freq = 1800 - 400 * (k / eLen); // descending cry
          var s = Math.sin(PI2 * freq * k / sr) * 0.08 * env;
          L[ePos + k] += s * 0.6; R[ePos + k] += s;
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }

    // ===== MOOD SOUNDS =====
    case 'moodRelaxing': {
      // Soft piano: slow arpeggiated Dmaj7 with sustain pedal feel
      var relaxNotes = [
        {f: 146.8, t: 0.0}, {f: 185.0, t: 0.5}, {f: 220.0, t: 1.0}, {f: 277.2, t: 1.5},
        {f: 293.7, t: 2.5}, {f: 220.0, t: 3.0}, {f: 185.0, t: 3.5}, {f: 146.8, t: 4.0},
        {f: 130.8, t: 5.0}, {f: 164.8, t: 5.5}, {f: 220.0, t: 6.0}, {f: 261.6, t: 6.5},
        {f: 293.7, t: 7.5}, {f: 261.6, t: 8.0}, {f: 220.0, t: 8.5}, {f: 164.8, t: 9.0}
      ];
      for (var n = 0; n < relaxNotes.length; n++) {
        var note = relaxNotes[n];
        var start = Math.floor(note.t * sr);
        var dur = Math.floor(sr * 2.5);
        for (k = 0; k < dur && start + k < len; k++) {
          var env = Math.exp(-k / (sr * 1.8)) * (1 - Math.exp(-k / (sr * 0.005)));
          var s = (Math.sin(PI2 * note.f * k / sr) * 0.22 +
                   Math.sin(PI2 * note.f * 2 * k / sr) * 0.06 * Math.exp(-k / (sr * 0.8)) +
                   Math.sin(PI2 * note.f * 3 * k / sr) * 0.02 * Math.exp(-k / (sr * 0.4))) * env;
          L[start + k] += s * 0.9; R[start + k] += s * 0.75;
        }
      }
      // Soft reverb tail
      var dly = Math.floor(sr * 0.12);
      for (i = dly; i < len; i++) { L[i] += L[i - dly] * 0.15; R[i] += R[i - dly] * 0.18; }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'moodRomantic': {
      // Romantic piano: slow, tender melody in Am with warm harmonics
      var romNotes = [
        {f: 220, t: 0.0}, {f: 261.6, t: 0.6}, {f: 329.6, t: 1.2}, {f: 392, t: 1.8},
        {f: 329.6, t: 2.8}, {f: 293.7, t: 3.3}, {f: 261.6, t: 3.8},
        {f: 220, t: 4.8}, {f: 196, t: 5.4}, {f: 220, t: 6.0}, {f: 261.6, t: 6.6},
        {f: 246.9, t: 7.6}, {f: 220, t: 8.2}, {f: 196, t: 8.8}, {f: 174.6, t: 9.4}
      ];
      for (var n = 0; n < romNotes.length; n++) {
        var note = romNotes[n];
        var start = Math.floor(note.t * sr);
        var dur = Math.floor(sr * 2.8);
        for (k = 0; k < dur && start + k < len; k++) {
          var env = Math.exp(-k / (sr * 2.2)) * (1 - Math.exp(-k / (sr * 0.004)));
          var vib = Math.sin(PI2 * 5 * k / sr) * 0.8;
          var s = (Math.sin(PI2 * (note.f + vib) * k / sr) * 0.25 +
                   Math.sin(PI2 * (note.f + vib) * 2 * k / sr) * 0.07 * Math.exp(-k / (sr * 1.0)) +
                   Math.sin(PI2 * (note.f + vib) * 3 * k / sr) * 0.03 * Math.exp(-k / (sr * 0.5))) * env;
          L[start + k] += s * 0.85; R[start + k] += s * 0.8;
        }
      }
      // Warm pad underneath
      for (i = 0; i < len; i++) {
        t = i / sr;
        var pad = Math.sin(PI2 * 110 * t) * 0.03 + Math.sin(PI2 * 165 * t) * 0.02;
        var swell = 0.6 + 0.4 * Math.sin(PI2 * 0.08 * t);
        L[i] += pad * swell; R[i] += pad * swell;
      }
      var dly = Math.floor(sr * 0.15);
      for (i = dly; i < len; i++) { L[i] += L[i - dly] * 0.12; R[i] += R[i - dly] * 0.15; }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'moodLively': {
      // Upbeat acoustic guitar strum: major key arpeggios with rhythm
      var livelyChords = [
        {notes: [329.6, 415.3, 523.3], t: 0.0}, // E major
        {notes: [349.2, 440, 523.3], t: 0.8},    // F major
        {notes: [392, 493.9, 587.3], t: 1.6},    // G major
        {notes: [261.6, 329.6, 392], t: 2.4},    // C major
        {notes: [329.6, 415.3, 523.3], t: 3.6},
        {notes: [293.7, 370, 440], t: 4.4},      // D major
        {notes: [392, 493.9, 587.3], t: 5.2},
        {notes: [261.6, 329.6, 392], t: 6.0},
        {notes: [349.2, 440, 523.3], t: 7.2},
        {notes: [329.6, 415.3, 523.3], t: 8.0},
        {notes: [293.7, 370, 440], t: 8.8}
      ];
      for (var c = 0; c < livelyChords.length; c++) {
        var chord = livelyChords[c];
        for (var ni = 0; ni < chord.notes.length; ni++) {
          var strumDelay = ni * 0.03;
          var start = Math.floor((chord.t + strumDelay) * sr);
          var dur = Math.floor(sr * 0.7);
          var freq = chord.notes[ni];
          for (k = 0; k < dur && start + k < len; k++) {
            var env = Math.exp(-k / (sr * 0.35)) * (1 - Math.exp(-k / (sr * 0.001)));
            var s = (Math.sin(PI2 * freq * k / sr) * 0.14 +
                     Math.sin(PI2 * freq * 2 * k / sr) * 0.08 * Math.exp(-k / (sr * 0.15)) +
                     Math.sin(PI2 * freq * 3 * k / sr) * 0.04 * Math.exp(-k / (sr * 0.1)) +
                     Math.sin(PI2 * freq * 4 * k / sr) * 0.02 * Math.exp(-k / (sr * 0.08))) * env;
            var pan = 0.4 + ni * 0.15;
            L[start + k] += s * (1 - pan); R[start + k] += s * pan;
          }
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'moodCozy': {
      // Fireplace: realistic crackling with pops, hiss, and warm low rumble
      var fb = 0;
      for (i = 0; i < len; i++) {
        t = i / sr;
        fb = 0.99 * fb + 0.01 * (Math.random() * 2 - 1);
        var warmth = Math.sin(PI2 * 80 * t) * 0.03 + Math.sin(PI2 * 120 * t) * 0.02;
        L[i] = fb * 0.5 + warmth + (Math.random() * 2 - 1) * 0.08;
        R[i] = fb * 0.4 + warmth + (Math.random() * 2 - 1) * 0.08;
      }
      // Crackle events - sharp pops with sizzle tail
      for (var c = 0; c < 80; c++) {
        var cPos = Math.floor(Math.random() * (len - sr * 0.1));
        var pop = Math.random() * 0.6 + 0.2;
        var cLen = Math.floor(sr * (0.01 + Math.random() * 0.04));
        var pan = Math.random();
        for (k = 0; k < cLen && cPos + k < len; k++) {
          var s = (Math.random() * 2 - 1) * pop * Math.exp(-k / (cLen * 0.2));
          L[cPos + k] += s * (1 - pan * 0.4);
          R[cPos + k] += s * (0.6 + pan * 0.4);
        }
        // Sizzle tail
        var sLen = Math.floor(sr * (0.05 + Math.random() * 0.1));
        for (k = 0; k < sLen && cPos + cLen + k < len; k++) {
          var s = (Math.random() * 2 - 1) * pop * 0.2 * Math.exp(-k / (sLen * 0.4));
          L[cPos + cLen + k] += s;
          R[cPos + cLen + k] += s * 0.8;
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'moodFocused': {
      // Lo-fi focus: gentle piano chords + binaural undertone + vinyl crackle
      var focChords = [
        {notes: [261.6, 329.6, 392], t: 0},     // Cmaj
        {notes: [220, 293.7, 349.2], t: 2.5},   // Dm
        {notes: [196, 246.9, 329.6], t: 5.0},    // Em
        {notes: [174.6, 220, 293.7], t: 7.5}     // Dm low
      ];
      for (var c = 0; c < focChords.length; c++) {
        var chord = focChords[c];
        for (var ni = 0; ni < chord.notes.length; ni++) {
          var start = Math.floor((chord.t + ni * 0.08) * sr);
          var dur = Math.floor(sr * 3.0);
          var freq = chord.notes[ni];
          for (k = 0; k < dur && start + k < len; k++) {
            var env = Math.exp(-k / (sr * 2.0)) * (1 - Math.exp(-k / (sr * 0.006)));
            var s = (Math.sin(PI2 * freq * k / sr) * 0.16 +
                     Math.sin(PI2 * freq * 2 * k / sr) * 0.04 * Math.exp(-k / (sr * 0.6))) * env;
            L[start + k] += s * 0.8; R[start + k] += s * 0.7;
          }
        }
      }
      // Binaural undertone for focus (10Hz alpha beat)
      for (i = 0; i < len; i++) {
        t = i / sr;
        L[i] += Math.sin(PI2 * 200 * t) * 0.03;
        R[i] += Math.sin(PI2 * 210 * t) * 0.03;
      }
      // Subtle vinyl crackle
      for (var cr = 0; cr < 40; cr++) {
        var pos = Math.floor(Math.random() * len);
        L[pos] += (Math.random() - 0.5) * 0.06;
        R[pos] += (Math.random() - 0.5) * 0.06;
      }
      var dly = Math.floor(sr * 0.1);
      for (i = dly; i < len; i++) { L[i] += L[i - dly] * 0.12; R[i] += R[i - dly] * 0.14; }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'moodPlayful': {
      // Playful xylophone/music box melody in G major
      var playNotes = [
        {f: 784, t: 0.0}, {f: 880, t: 0.25}, {f: 784, t: 0.5}, {f: 659.3, t: 0.75},
        {f: 587.3, t: 1.25}, {f: 659.3, t: 1.5}, {f: 784, t: 1.75},
        {f: 523.3, t: 2.5}, {f: 587.3, t: 2.75}, {f: 659.3, t: 3.0}, {f: 784, t: 3.5},
        {f: 880, t: 4.0}, {f: 784, t: 4.5}, {f: 659.3, t: 5.0},
        {f: 587.3, t: 5.5}, {f: 523.3, t: 6.0}, {f: 587.3, t: 6.5},
        {f: 392, t: 7.0}, {f: 440, t: 7.5}, {f: 523.3, t: 8.0}, {f: 587.3, t: 8.5},
        {f: 659.3, t: 9.0}, {f: 784, t: 9.5}
      ];
      for (var n = 0; n < playNotes.length; n++) {
        var note = playNotes[n];
        var start = Math.floor(note.t * sr);
        var dur = Math.floor(sr * 0.5);
        for (k = 0; k < dur && start + k < len; k++) {
          var env = Math.exp(-k / (sr * 0.18)) * (1 - Math.exp(-k / (sr * 0.0005)));
          var s = (Math.sin(PI2 * note.f * k / sr) * 0.18 +
                   Math.sin(PI2 * note.f * 3 * k / sr) * 0.06 * Math.exp(-k / (sr * 0.08)) +
                   Math.sin(PI2 * note.f * 5 * k / sr) * 0.02 * Math.exp(-k / (sr * 0.04))) * env;
          var pan = 0.3 + (note.f / 1000) * 0.4;
          L[start + k] += s * (1 - pan); R[start + k] += s * pan;
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'moodDreamy': {
      // Ethereal harp arpeggios with long reverb
      var dreamNotes = [
        {f: 261.6, t: 0.0}, {f: 392, t: 0.4}, {f: 523.3, t: 0.8}, {f: 659.3, t: 1.2},
        {f: 784, t: 1.6}, {f: 659.3, t: 2.4}, {f: 523.3, t: 2.8},
        {f: 293.7, t: 3.6}, {f: 440, t: 4.0}, {f: 587.3, t: 4.4}, {f: 784, t: 4.8},
        {f: 880, t: 5.2}, {f: 784, t: 6.0}, {f: 587.3, t: 6.4},
        {f: 246.9, t: 7.2}, {f: 370, t: 7.6}, {f: 493.9, t: 8.0}, {f: 659.3, t: 8.4},
        {f: 784, t: 8.8}, {f: 659.3, t: 9.4}
      ];
      for (var n = 0; n < dreamNotes.length; n++) {
        var note = dreamNotes[n];
        var start = Math.floor(note.t * sr);
        var dur = Math.floor(sr * 3.0);
        for (k = 0; k < dur && start + k < len; k++) {
          var env = Math.exp(-k / (sr * 2.5)) * (1 - Math.exp(-k / (sr * 0.002)));
          var s = (Math.sin(PI2 * note.f * k / sr) * 0.15 +
                   Math.sin(PI2 * note.f * 2 * k / sr) * 0.05 * Math.exp(-k / (sr * 1.0)) +
                   Math.sin(PI2 * note.f * 0.5 * k / sr) * 0.03) * env;
          L[start + k] += s * (0.6 + 0.3 * Math.sin(PI2 * 0.2 * k / sr));
          R[start + k] += s * (0.7 + 0.2 * Math.sin(PI2 * 0.15 * k / sr));
        }
      }
      // Long reverb
      var dly1 = Math.floor(sr * 0.17), dly2 = Math.floor(sr * 0.37);
      for (i = dly2; i < len; i++) {
        L[i] += L[i - dly1] * 0.2 + L[i - dly2] * 0.12;
        R[i] += R[i - dly1] * 0.15 + R[i - dly2] * 0.18;
        L[i] = _clamp(L[i]); R[i] = _clamp(R[i]);
      }
      break;
    }
    case 'moodSerene': {
      // Singing bowls with gentle melodic progression
      var bowlNotes = [
        {f: 349.2, t: 0.0, dur: 4.0}, {f: 523.3, t: 2.0, dur: 4.0},
        {f: 392, t: 4.5, dur: 4.0}, {f: 293.7, t: 6.5, dur: 3.5}
      ];
      for (var n = 0; n < bowlNotes.length; n++) {
        var note = bowlNotes[n];
        var start = Math.floor(note.t * sr);
        var dur = Math.floor(sr * note.dur);
        for (k = 0; k < dur && start + k < len; k++) {
          var breath = 0.5 + 0.5 * Math.sin(PI2 * 0.12 * k / sr);
          var env = (1 - Math.exp(-k / (sr * 0.3))) * Math.exp(-k / (sr * 3.5));
          var s = (Math.sin(PI2 * note.f * k / sr) * 0.15 +
                   Math.sin(PI2 * note.f * 2.71 * k / sr) * 0.05 * Math.exp(-k / (sr * 1.5)) +
                   Math.sin(PI2 * note.f * 4.16 * k / sr) * 0.02 * Math.exp(-k / (sr * 0.8))) * env * breath;
          L[start + k] += s * 0.85; R[start + k] += s * 0.75;
        }
      }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'moodSoulful': {
      // Jazzy piano: Cm9 voicings with soulful walk
      var soulNotes = [
        {f: 130.8, t: 0.0}, {f: 155.6, t: 0.3}, {f: 196, t: 0.6}, {f: 233.1, t: 0.9}, {f: 293.7, t: 1.2},
        {f: 261.6, t: 2.0}, {f: 196, t: 2.4}, {f: 233.1, t: 2.8},
        {f: 146.8, t: 3.5}, {f: 174.6, t: 3.8}, {f: 220, t: 4.1}, {f: 261.6, t: 4.5},
        {f: 233.1, t: 5.3}, {f: 196, t: 5.8}, {f: 174.6, t: 6.3},
        {f: 130.8, t: 7.0}, {f: 164.8, t: 7.4}, {f: 196, t: 7.8}, {f: 233.1, t: 8.3},
        {f: 261.6, t: 8.8}, {f: 293.7, t: 9.3}
      ];
      for (var n = 0; n < soulNotes.length; n++) {
        var note = soulNotes[n];
        var start = Math.floor(note.t * sr);
        var dur = Math.floor(sr * 2.0);
        for (k = 0; k < dur && start + k < len; k++) {
          var vib = Math.sin(PI2 * 5.5 * k / sr) * 1.2;
          var env = Math.exp(-k / (sr * 1.5)) * (1 - Math.exp(-k / (sr * 0.005)));
          var s = (Math.sin(PI2 * (note.f + vib) * k / sr) * 0.2 +
                   Math.sin(PI2 * (note.f + vib) * 2 * k / sr) * 0.06 * Math.exp(-k / (sr * 0.7)) +
                   Math.sin(PI2 * (note.f + vib) * 3 * k / sr) * 0.02 * Math.exp(-k / (sr * 0.4))) * env;
          L[start + k] += s * 0.8; R[start + k] += s * 0.7;
        }
      }
      var dly = Math.floor(sr * 0.13);
      for (i = dly; i < len; i++) { L[i] += L[i - dly] * 0.1; R[i] += R[i - dly] * 0.13; }
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'moodTropical': {
      // Steel drum melody over ocean waves + ukulele rhythm
      // Gentle wave base
      _brownNoise(L, len, 0.04);
      _brownNoise(R, len, 0.04);
      // Steel drum melody (C major pentatonic)
      var tropMelody = [
        {f: 523.3, t: 0.0}, {f: 587.3, t: 0.4}, {f: 659.3, t: 0.8}, {f: 784, t: 1.2},
        {f: 880, t: 1.6}, {f: 784, t: 2.2}, {f: 659.3, t: 2.6},
        {f: 587.3, t: 3.4}, {f: 523.3, t: 3.8}, {f: 587.3, t: 4.2}, {f: 659.3, t: 4.6},
        {f: 784, t: 5.2}, {f: 880, t: 5.6}, {f: 1046.5, t: 6.0},
        {f: 880, t: 6.8}, {f: 784, t: 7.2}, {f: 659.3, t: 7.6},
        {f: 587.3, t: 8.2}, {f: 523.3, t: 8.6}, {f: 659.3, t: 9.2}
      ];
      for (var n = 0; n < tropMelody.length; n++) {
        var note = tropMelody[n];
        var start = Math.floor(note.t * sr);
        var dur = Math.floor(sr * 0.6);
        for (k = 0; k < dur && start + k < len; k++) {
          var env = Math.exp(-k / (sr * 0.25)) * (1 - Math.exp(-k / (sr * 0.0008)));
          var s = (Math.sin(PI2 * note.f * k / sr) * 0.16 +
                   Math.sin(PI2 * note.f * 2.01 * k / sr) * 0.06 * Math.exp(-k / (sr * 0.1)) +
                   Math.sin(PI2 * note.f * 3.98 * k / sr) * 0.03 * Math.exp(-k / (sr * 0.06))) * env;
          var pan = 0.3 + Math.sin(n * 0.7) * 0.2;
          L[start + k] += s * (1 - pan); R[start + k] += s * pan;
        }
      }
      // Warm pad
      for (i = 0; i < len; i++) {
        t = i / sr;
        var pad = Math.sin(PI2 * 261.6 * t) * 0.025 + Math.sin(PI2 * 392 * t) * 0.02;
        L[i] += pad; R[i] += pad;
        L[i] = _clamp(L[i]); R[i] = _clamp(R[i]);
      }
      break;
    }
    case 'moodCampfire': {
      // Outdoor campfire: fire crackle + night insects + gentle wind
      // Fire base
      var fb2 = 0;
      for (i = 0; i < len; i++) {
        fb2 = 0.99 * fb2 + 0.01 * (Math.random() * 2 - 1);
        L[i] = fb2 * 0.4 + (Math.random() * 2 - 1) * 0.06;
        R[i] = fb2 * 0.35 + (Math.random() * 2 - 1) * 0.06;
      }
      // Fire crackles
      for (var c = 0; c < 50; c++) {
        var cPos = Math.floor(Math.random() * (len - sr * 0.05));
        var pop = Math.random() * 0.5 + 0.15;
        var cLen = Math.floor(sr * (0.008 + Math.random() * 0.02));
        for (k = 0; k < cLen && cPos + k < len; k++) {
          var s = (Math.random() * 2 - 1) * pop * Math.exp(-k / (cLen * 0.15));
          L[cPos + k] += s; R[cPos + k] += s * 0.8;
        }
      }
      // Distant crickets
      for (i = 0; i < len; i++) {
        t = i / sr;
        var chirp = Math.sin(PI2 * 4000 * t) * Math.max(0, Math.sin(PI2 * 3 * t)) * 0.02;
        R[i] += chirp;
      }
      // Gentle wind
      _brownNoise(L, len, 0.04);
      _brownNoise(R, len, 0.04);
      for (i = 0; i < len; i++) { L[i] = _clamp(L[i]); R[i] = _clamp(R[i]); }
      break;
    }
    case 'moodRainyNight': {
      // Cozy rain on window: gentle rain + distant thunder + warm interior feel
      _pinkNoise(L, len, 0.12);
      _pinkNoise(R, len, 0.12);
      // Rain drops on glass (higher pitched, more regular)
      for (var drop = 0; drop < 120; drop++) {
        var pos = Math.floor(Math.random() * (len - sr * 0.02));
        var dLen = Math.floor(sr * (0.001 + Math.random() * 0.004));
        var freq = 4000 + Math.random() * 4000;
        for (k = 0; k < dLen && pos + k < len; k++) {
          var s = Math.sin(PI2 * freq * k / sr) * 0.2 * Math.exp(-k / (dLen * 0.2));
          L[pos + k] += s; R[pos + k] += s * 0.7;
        }
      }
      // Very distant thunder rumble
      var tPos = Math.floor(sr * (3 + Math.random() * 4));
      var bx2 = 0;
      var rLen = Math.floor(sr * 3);
      for (k = 0; k < rLen && tPos + k < len; k++) {
        bx2 = 0.99 * bx2 + 0.01 * (Math.random() * 2 - 1);
        var env = Math.exp(-k / (rLen * 0.6));
        var s = bx2 * 0.4 * env;
        L[tPos + k] += s; R[tPos + k] += s * 0.9;
      }
      // Warm low-end bed
      for (i = 0; i < len; i++) {
        t = i / sr;
        var warm = Math.sin(PI2 * 80 * t) * 0.02;
        L[i] += warm; R[i] += warm;
        L[i] = _clamp(L[i]); R[i] = _clamp(R[i]);
      }
      break;
    }
    default: {
      _brownNoise(L, len, 0.3);
      _brownNoise(R, len, 0.3);
      break;
    }
  }
  _noiseCache[type] = buffer;
  return buffer;
}

// --- SOUND SYSTEM: uses rich buffer generation with filters ---
function _makeNoise(noiseType) {
  var ctx = WEATHER.audioCtx;
  var sr = ctx.sampleRate;
  var len = sr * 4;
  var buf = ctx.createBuffer(1, len, sr);
  var d = buf.getChannelData(0);
  if (noiseType === 'white') {
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  } else if (noiseType === 'pink') {
    _pinkNoise(d, len, 1);
  } else {
    _brownNoise(d, len, 2.5);
  }
  return buf;
}

function playAmbientSound(type, volume) {
  if (!WEATHER.audioEnabled) return;
  // Don't create AudioContext here — wait for user gesture via _tryUnlock
  if (!WEATHER.audioCtx || WEATHER.audioCtx.state === 'closed') return;
  var ctx = WEATHER.audioCtx;
  if (WEATHER.audioNodes[type]) return;

  // Resume if suspended or interrupted (iOS)
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
    ctx.resume().catch(function(){});
  }

  var vol = volume || 0.12;

  var buffer;
  try {
    buffer = generateNoise(type);
  } catch(e) {
    console.warn('Buffer gen error (' + type + '): ' + e.message);
    return;
  }
  if (!buffer) {
    console.warn('Buffer null for: ' + type);
    return;
  }

  // PRIMARY: HTML5 <audio> with WAV blob — most reliable on mobile
  // Falls back to Web Audio API if HTML5 Audio fails
  try {
    var wav = _audioBufferToWav(buffer);
    var objUrl = URL.createObjectURL(wav);
    var audio = document.createElement('audio');
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.src = objUrl;
    audio.loop = true;
    audio.volume = Math.min(1.0, vol);
    var playP = audio.play();
    if (playP && playP.then) {
      playP.then(function() {
        if (!WEATHER.audioEnabled) { audio.pause(); URL.revokeObjectURL(objUrl); return; }
        WEATHER.audioNodes[type] = { parts: [], gain: null, audio: audio, objUrl: objUrl };
      }).catch(function() {
        URL.revokeObjectURL(objUrl);
        // Fallback to Web Audio API
        _playAmbientWebAudio(ctx, type, buffer, vol);
      });
    } else {
      WEATHER.audioNodes[type] = { parts: [], gain: null, audio: audio, objUrl: objUrl };
    }
  } catch(e) {
    _playAmbientWebAudio(ctx, type, buffer, vol);
  }
}

// Fallback: play ambient sound via Web Audio API
function _playAmbientWebAudio(ctx, type, buffer, vol) {
  if (!ctx || ctx.state === 'closed') return;
  if (WEATHER.audioNodes[type]) return;
  var master = ctx.createGain();
  master.gain.value = vol;
  master.connect(ctx.destination);
  var src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.connect(master);
  src.start(0);
  WEATHER.audioNodes[type] = { parts: [src], gain: master };
}

function stopAmbientSound(type) {
  var node = WEATHER.audioNodes[type];
  if (!node) return;
  // HTML5 Audio path
  if (node.audio) {
    try { node.audio.pause(); node.audio.src = ''; } catch(e) {}
    if (node.objUrl) try { URL.revokeObjectURL(node.objUrl); } catch(e) {}
  }
  // Web Audio path
  if (node.gain && WEATHER.audioCtx) {
    try {
      node.gain.gain.linearRampToValueAtTime(0, WEATHER.audioCtx.currentTime + 0.8);
      var parts = node.parts;
      setTimeout(function() {
        try { for (var i = 0; i < parts.length; i++) parts[i].stop(); } catch(e) {}
      }, 1000);
    } catch(e) {
      try { for (var i = 0; i < node.parts.length; i++) node.parts[i].stop(); } catch(e2) {}
    }
  }
  delete WEATHER.audioNodes[type];
}

function stopAllSounds() {
  Object.keys(WEATHER.audioNodes).forEach(stopAmbientSound);
}

function updateAmbientAudio() {
  if (!WEATHER.audioEnabled) return;
  // Do NOT create AudioContext here — this function can be called from Firebase init
  // (outside a user gesture). On iOS, contexts created outside gestures are permanently broken.
  // Only use an existing context, or wait for _tryUnlock to create one during a gesture.
  if (!WEATHER.audioCtx || WEATHER.audioCtx.state === 'closed') {
    WEATHER._audioQueued = true; // flag: play sounds once context is available
    return;
  }
  var ctx = WEATHER.audioCtx;
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
    ctx.resume().catch(function(){});
  }

  var scene = SCENES[WEATHER.scene];
  if (!scene) {
    playAmbientSound('wind', 0.08);
    return;
  }

  var time = WEATHER.locationGranted && WEATHER.data ? getTimeOfDayWeather() : getTimeOfDay();
  var soundType = scene.sounds[time] || scene.sounds.base;
  // Play only the single best-matching sound for this environment + time
  var keep = [soundType];
  if (WEATHER.data) {
    var wx = WEATHER_EFFECTS[WEATHER.data.condition];
    if (wx && wx.sound) keep.push(wx.sound);
  }
  Object.keys(WEATHER.audioNodes).forEach(function(k) {
    if (keep.indexOf(k) === -1) stopAmbientSound(k);
  });

  // Single environment sound — soft and calm
  playAmbientSound(soundType, 0.12);
  if (WEATHER.data) {
    var wx = WEATHER_EFFECTS[WEATHER.data.condition];
    if (wx && wx.sound) playAmbientSound(wx.sound, 0.10);
  }
}

function toggleAmbientAudio(on) {
  WEATHER.audioEnabled = on;
  WEATHER._audioQueued = false;
  if (on) {
    // Always create a FRESH context during this user gesture
    var ctx = _recreateAudioCtx();
    if (!ctx) { toast('Audio not supported on this device'); return; }

    // Resume context — MUST happen during user gesture
    _resumeCtx(ctx);
    WEATHER.audioUnlocked = true;

    // Helper: start ambient sounds (no beep)
    var startSounds = function() {
      updateAmbientAudio();
    };

    // Resume and start — try both promise-based and immediate
    if (ctx.state !== 'running') {
      try {
        var p = ctx.resume();
        if (p && p.then) {
          p.then(function() {
            startSounds();
          }).catch(function(e) {
            startSounds(); // try anyway
          });
        } else {
          startSounds();
        }
      } catch(e) {
        startSounds();
      }
    } else {
      startSounds();
    }

    // Also try starting sounds immediately (don't wait for promise)
    // On some devices the promise never resolves but audio works anyway
    setTimeout(function() {
      if (!WEATHER.audioEnabled) return;
      var c = WEATHER.audioCtx;
      if (!c) return;
      var nodes = Object.keys(WEATHER.audioNodes).length;
      if (nodes === 0) {
        if (c.state !== 'running') c.resume().catch(function(){});
        updateAmbientAudio();
      }
    }, 1000);

    // Final retry — recreate context and try one more time
    setTimeout(function() {
      if (!WEATHER.audioEnabled) return;
      var c = WEATHER.audioCtx;
      var nodes = Object.keys(WEATHER.audioNodes).length;
      var state = c ? c.state : 'no-ctx';
      if (nodes === 0) {
        // Last resort: recreate context and try again
        if (state !== 'running') {
          c = _recreateAudioCtx();
          if (c) {
            _resumeCtx(c);
            c.resume().then(function() { updateAmbientAudio(); }).catch(function() { updateAmbientAudio(); });
          }
        } else {
          updateAmbientAudio();
        }
      }
    }, 3000);
  } else {
    stopAllSounds();
  }
  if (typeof db !== 'undefined' && db && typeof user !== 'undefined' && user) {
    db.ref('settings/weather/' + user + '/audio').set(on);
  }
}


// ===== SCENE GROUND LAYER =====
function renderSceneGround(container) {
  var existing = container.querySelector('.scene-ground');
  if (existing) existing.remove();

  var scene = SCENES[WEATHER.scene];
  if (!scene) return;
  var time = WEATHER.locationGranted && WEATHER.data ? getTimeOfDayWeather() : getTimeOfDay();
  var colors = scene.colors[time] || scene.colors.morning;

  var ground = document.createElement('div');
  ground.className = 'scene-ground scene-ground-' + WEATHER.scene;
  ground.style.cssText = '--scene-ground:' + colors.ground + ';--scene-accent:' + colors.accent;
  container.appendChild(ground);
}

// ===== SCENE-AWARE CREATURE SPAWNING =====
var MAX_SCENE_CREATURES = 10;
function spawnSceneCreatures(container) {
  var scene = SCENES[WEATHER.scene];
  if (!scene) return;

  // Cap creatures in the DOM
  var existing = container.querySelectorAll('.scene-creature');
  if (existing.length >= MAX_SCENE_CREATURES) return;

  var time = WEATHER.locationGranted && WEATHER.data ? getTimeOfDayWeather() : getTimeOfDay();
  var creatures = scene.creatures[time] || scene.creatures.morning;

  // Spawn 1-2 creatures with staggered timing
  var count = 1 + Math.floor(Math.random() * 2);
  for (var i = 0; i < count; i++) {
    (function(idx) {
      var delay = idx * (2000 + Math.random() * 2000);
      setTimeout(function() {
        if (container.querySelectorAll('.scene-creature').length >= MAX_SCENE_CREATURES) return;
        var type = creatures[Math.floor(Math.random() * creatures.length)];
        renderSceneCreature(container, type);
      }, delay);
    })(i);
  }

  // Continuous creature spawning - keep the scene alive
  if (!WEATHER._creatureInterval) {
    WEATHER._creatureInterval = setInterval(function() {
      if (!container.parentNode) { clearInterval(WEATHER._creatureInterval); WEATHER._creatureInterval = null; return; }
      if (document.hidden) return;
      if (container.querySelectorAll('.scene-creature').length >= MAX_SCENE_CREATURES) return;
      var t = WEATHER.locationGranted && WEATHER.data ? getTimeOfDayWeather() : getTimeOfDay();
      var c = scene.creatures[t] || scene.creatures.morning;
      var type = c[Math.floor(Math.random() * c.length)];
      renderSceneCreature(container, type);
    }, 18000 + Math.random() * 10000);
  }
}

// ===== OVERRIDE EXISTING SYSTEM =====
(function() {
  function patchSkySystem() {
    var _origGetTimeOfDay = window.getTimeOfDay;
    var _origGetSunPosition = window.getSunPosition;
    var _origSpawnCreatures = window.spawnCreatures;
    var _origRenderLivingSky = window.renderLivingSky;

    window.getTimeOfDay = function() {
      if (WEATHER.locationGranted && WEATHER.data) {
        return getTimeOfDayWeather();
      }
      return _origGetTimeOfDay ? _origGetTimeOfDay() : 'morning';
    };

    window.getSunPosition = function() {
      if (WEATHER.locationGranted && WEATHER.data) {
        return getSunPositionWeather();
      }
      return _origGetSunPosition ? _origGetSunPosition() : { isNight: false, x: 50, y: 15, progress: 0.5 };
    };

    window.spawnCreatures = function(container) {
      if (WEATHER.scene && SCENES[WEATHER.scene]) {
        spawnSceneCreatures(container);
      } else if (_origSpawnCreatures) {
        _origSpawnCreatures(container);
      }
    };

    window.renderLivingSky = function(container) {
      // Clear ongoing creature spawning before re-render
      if (WEATHER._creatureInterval) {
        clearInterval(WEATHER._creatureInterval);
        WEATHER._creatureInterval = null;
      }
      // Render the base living sky (sun, moon, stars, clouds, gradient)
      if (_origRenderLivingSky) _origRenderLivingSky(container);
      // Layer scene ground and weather effects on top
      renderSceneGround(container);
      renderWeatherEffects(container);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchSkySystem);
  } else {
    patchSkySystem();
  }
})();

// ===== LOCATION PROMPT MODAL =====
function showLocationPrompt() {
  var modal = document.getElementById('generic-modal');
  var content = document.getElementById('generic-modal-content');
  if (!modal || !content) return;

  content.innerHTML =
    '<div class="loc-prompt">' +
      '<div class="loc-prompt-icon">🌍</div>' +
      '<h2 class="loc-prompt-title">Living Weather</h2>' +
      '<p class="loc-prompt-desc">Allow location access to bring your real weather to life - rain, snow, sunshine, wind and more, right in your background.</p>' +
      '<div class="loc-prompt-features">' +
        '<div class="loc-feat"><span>🌧</span> Real weather effects</div>' +
        '<div class="loc-feat"><span>🌅</span> Actual sunrise & sunset</div>' +
        '<div class="loc-feat"><span>🌡</span> Temperature colors</div>' +
        '<div class="loc-feat"><span>🔊</span> Nature sounds</div>' +
      '</div>' +
      '<button class="dq-submit w-full mt-12" onclick="handleLocationAllow()">Allow Location</button>' +
      '<div class="loc-prompt-skip" onclick="handleLocationDeny()">Not now</div>' +
    '</div>';

  modal.classList.add('on');
}

function handleLocationAllow() {
  var modal = document.getElementById('generic-modal');
  if (modal) modal.classList.remove('on');

  toast('Requesting location...');
  requestLocationPermission().then(function(granted) {
    if (granted) {
      toast('Location enabled - fetching weather...');
      fetchWeather().then(function(data) {
        if (data) {
          var container = document.getElementById('sky-scene');
          if (container && livingSkyEnabled) renderLivingSky(container);
          updateAmbientAudio();
          updateWeatherInfoUI();
          toast('Weather loaded: ' + Math.round(data.temp) + '° ' + data.condition);
        } else {
          toast('Could not fetch weather data');
        }
      });
    }
  });
}

function handleLocationDeny() {
  var modal = document.getElementById('generic-modal');
  if (modal) modal.classList.remove('on');
  if (typeof db !== 'undefined' && db && typeof user !== 'undefined' && user) {
    db.ref('settings/weather/' + user + '/prompted').set(true);
  }
}

// ===== WEATHER INFO UI UPDATE =====
function updateWeatherInfoUI() {
  var el = document.getElementById('weather-info-display');
  if (!el) return;
  if (!WEATHER.data) {
    el.textContent = 'No weather data';
    return;
  }
  var d = WEATHER.data;
  var condIcon = {
    clear: '☀️', clouds: '☁️', rain: '🌧️', drizzle: '🌦️',
    thunderstorm: '⛈️', snow: '❄️', mist: '🌫️', fog: '🌫️',
    haze: '🌫️', dust: '💨', sand: '💨'
  };
  el.classList.remove('d-none');
  el.innerHTML = '<span class="weather-icon">' + (condIcon[d.condition] || '🌤') + '</span>' +
    '<span class="weather-temp">' + Math.round(d.temp) + '°C</span>' +
    '<span class="weather-cond">' + d.condition.charAt(0).toUpperCase() + d.condition.slice(1) + '</span>' +
    '<span class="weather-wind">💨 ' + Math.round(d.windSpeed) + ' km/h</span>';
}

// ===== SET SCENE =====
function setWeatherScene(sceneName) {
  if (!SCENES[sceneName]) return;
  WEATHER.scene = sceneName;
  if (typeof db !== 'undefined' && db && typeof user !== 'undefined' && user) {
    db.ref('settings/weather/' + user + '/scene').set(sceneName);
  }
  var container = document.getElementById('sky-scene');
  if (container && livingSkyEnabled) renderLivingSky(container);
  updateAmbientAudio();

  document.querySelectorAll('.scene-option').forEach(function(opt) {
    opt.classList.toggle('active', opt.getAttribute('data-scene') === sceneName);
  });

  toast(SCENES[sceneName].label + ' activated');
}

// ===== MOOD SOUNDS SYSTEM =====
// Ambient mood sounds for date nights, events, and partner sharing
var MOOD_SOUNDS = {
  romantic:   { label: 'Romantic',    icon: '🕯',  type: 'moodRomantic',   desc: 'Warm, intimate tones' },
  dreamy:     { label: 'Dreamy',      icon: '💫', type: 'moodDreamy',     desc: 'Ethereal, floating' },
  cozy:       { label: 'Cozy',        icon: '☕', type: 'moodCozy',       desc: 'Crackling fireplace' },
  soulful:    { label: 'Soulful',     icon: '🎷', type: 'moodSoulful',    desc: 'Deep, warm tones' },
  serene:     { label: 'Serene',      icon: '🪷', type: 'moodSerene',     desc: 'Meditation bowls' },
  relaxing:   { label: 'Relaxing',    icon: '🧘', type: 'moodRelaxing',   desc: 'Calm, peaceful ambient' },
  rainyNight: { label: 'Rainy Night', icon: '🌃', type: 'moodRainyNight', desc: 'Rain on windows' },
  campfire:   { label: 'Campfire',    icon: '🔥', type: 'moodCampfire',   desc: 'Outdoor fire + night' },
  tropical:   { label: 'Tropical',    icon: '🌴', type: 'moodTropical',   desc: 'Island steel drums' },
  lively:     { label: 'Lively',      icon: '🎉', type: 'moodLively',     desc: 'Upbeat, energetic' },
  rain:       { label: 'Rain',        icon: '🌧',  type: 'rain',           desc: 'Rainfall ambience' },
  ocean:      { label: 'Ocean',       icon: '🌊', type: 'waves',          desc: 'Waves and shore' },
  night:      { label: 'Night',       icon: '🌙', type: 'crickets',       desc: 'Crickets and frogs' },
  forest:     { label: 'Forest',      icon: '🌲', type: 'forestWind',     desc: 'Wind, birds, leaves' },
  birds:      { label: 'Birds',       icon: '🐦', type: 'birdsong',       desc: 'Dawn bird chorus' },
  thunder:    { label: 'Storm',       icon: '⛈',  type: 'thunder',        desc: 'Thunder and rain' },
  // Beach environment (her favorites)
  beachBreeze:  { label: 'Beach Breeze',  icon: '🏖', type: 'beachBreeze',    desc: 'Warm wind, gentle surf', env: 'beach' },
  seagulls:     { label: 'Seagulls',      icon: '🕊', type: 'seagulls',       desc: 'Shore birds and waves', env: 'beach' },
  // Mountain environment (his favorites)
  mountainCreek: { label: 'Mountain Creek', icon: '🏔', type: 'mountainCreek', desc: 'Babbling water over rocks', env: 'mountain' },
  mountainWind:  { label: 'Mountain Wind',  icon: '🦅', type: 'mountainWind',  desc: 'Alpine gusts and eagles', env: 'mountain' }
};

// Nature sound order per user: beach-first for her, mountain-first for him
var NATURE_ORDER_HER = [
  'ocean', 'beachBreeze', 'seagulls', 'tropical',
  'rain', 'night', 'forest', 'birds', 'thunder',
  'mountainCreek', 'mountainWind', 'campfire'
];
var NATURE_ORDER_HIM = [
  'forest', 'mountainCreek', 'mountainWind', 'campfire',
  'birds', 'rain', 'night', 'thunder',
  'ocean', 'beachBreeze', 'seagulls', 'tropical'
];
var MOOD_ORDER = ['romantic', 'dreamy', 'cozy', 'soulful', 'serene', 'relaxing', 'rainyNight', 'campfire', 'tropical', 'lively'];

WEATHER.moodPlaying = null;
WEATHER.moodNode = null;

// Dynamically render sound grids based on user role + environment
function renderMoodSoundsGrid() {
  var role = typeof user !== 'undefined' ? user : null;
  var baseOrder = role === 'her' ? NATURE_ORDER_HER : NATURE_ORDER_HIM;
  // Reorder nature sounds to prioritize current environment
  var sky = (typeof currentSkyTheme !== 'undefined') ? currentSkyTheme : 'mixed';
  var natureOrder = baseOrder.slice();
  if (sky === 'beach') {
    // Prioritize beach/ocean sounds
    var beachSounds = ['ocean', 'beachBreeze', 'seagulls', 'tropical'];
    var rest = natureOrder.filter(function(s) { return beachSounds.indexOf(s) === -1; });
    natureOrder = beachSounds.concat(rest);
  } else if (sky === 'mountain') {
    // Prioritize mountain/forest sounds
    var mtSounds = ['forest', 'mountainCreek', 'mountainWind', 'campfire', 'birds'];
    var rest = natureOrder.filter(function(s) { return mtSounds.indexOf(s) === -1; });
    natureOrder = mtSounds.concat(rest);
  }

  // Main sounds page grid (toggleMoodSound)
  var mainGrid = document.getElementById('mood-sounds-grid');
  if (mainGrid) {
    var html = '';
    // Mood sounds first
    for (var m = 0; m < MOOD_ORDER.length; m++) {
      var k = MOOD_ORDER[m];
      var s = MOOD_SOUNDS[k];
      if (s) html += '<button class="mood-sound-btn" data-mood="' + k + '" onclick="toggleMoodSound(\'' + k + '\')"><span class="msb-icon">' + s.icon + '</span><span class="msb-label">' + s.label + '</span></button>';
    }
    // Nature sounds in user-preferred order
    for (var n = 0; n < natureOrder.length; n++) {
      var k = natureOrder[n];
      var s = MOOD_SOUNDS[k];
      if (s) html += '<button class="mood-sound-btn" data-mood="' + k + '" onclick="toggleMoodSound(\'' + k + '\')"><span class="msb-icon">' + s.icon + '</span><span class="msb-label">' + s.label + '</span></button>';
    }
    mainGrid.innerHTML = html;
  }

  // Settings grid
  var settingsGrid = document.getElementById('settings-mood-sounds');
  if (settingsGrid) {
    var html = '';
    for (var m = 0; m < MOOD_ORDER.length; m++) {
      var k = MOOD_ORDER[m];
      var s = MOOD_SOUNDS[k];
      if (s) html += '<button class="mood-sound-btn" data-mood="' + k + '" onclick="toggleMoodSound(\'' + k + '\')"><span class="msb-icon">' + s.icon + '</span><span class="msb-label">' + s.label + '</span></button>';
    }
    for (var n = 0; n < natureOrder.length; n++) {
      var k = natureOrder[n];
      var s = MOOD_SOUNDS[k];
      if (s) html += '<button class="mood-sound-btn" data-mood="' + k + '" onclick="toggleMoodSound(\'' + k + '\')"><span class="msb-icon">' + s.icon + '</span><span class="msb-label">' + s.label + '</span></button>';
    }
    settingsGrid.innerHTML = html;
  }

  // Date night / send-to-partner grid (sendMoodToPartner)
  var sendGrids = document.querySelectorAll('.mood-sounds-grid:not(#mood-sounds-grid):not(#settings-mood-sounds)');
  sendGrids.forEach(function(grid) {
    var html = '';
    var allKeys = MOOD_ORDER.concat(natureOrder);
    for (var i = 0; i < allKeys.length; i++) {
      var k = allKeys[i];
      var s = MOOD_SOUNDS[k];
      if (s) html += '<button class="mood-sound-btn" data-mood="' + k + '" onclick="sendMoodToPartner(\'' + k + '\')"><span class="msb-icon">' + s.icon + '</span><span class="msb-label">' + s.label + '</span></button>';
    }
    grid.innerHTML = html;
  });
}

function playMoodSound(moodKey) {
  stopMoodSound();

  var ctx = _ensureAudioCtx();
  if (!ctx) { toast('Audio not supported on this device'); return; }

  // If context is suspended, recreate it during this user gesture (iOS fix)
  if (ctx.state === 'suspended') {
    ctx = _recreateAudioCtx();
    if (!ctx) { toast('Audio not supported on this device'); return; }
  }

  _resumeCtx(ctx);
  WEATHER.audioUnlocked = true;

  var mood = MOOD_SOUNDS[moodKey];
  if (!mood) return;

  // Set playing state and UI immediately for responsiveness
  WEATHER.moodPlaying = moodKey;
  document.querySelectorAll('.mood-sound-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-mood') === moodKey);
  });

  // Chain sound creation to resume() Promise so context is running first
  var resumePromise = (ctx.state !== 'running') ? ctx.resume() : Promise.resolve();
  (resumePromise || Promise.resolve()).then(function() {
    // Check if user cancelled while we were waiting
    if (WEATHER.moodPlaying !== moodKey) return;

    _startMoodPlayback(ctx, mood, moodKey);
  }).catch(function() {
    // Fallback: try playing anyway
    if (WEATHER.moodPlaying !== moodKey) return;
    _startMoodPlayback(ctx, mood, moodKey);
  });
}

function _startMoodPlayback(ctx, mood, moodKey) {
  // Re-check context is still valid
  if (!ctx || ctx.state === 'closed') {
    ctx = _ensureAudioCtx();
    if (!ctx) return;
  }

  var buffer = generateNoise(mood.type);
  if (!buffer) { toast('Could not generate ' + mood.label); return; }

  // PRIMARY: HTML5 <audio> with WAV blob — most reliable on mobile
  try {
    var wav = _audioBufferToWav(buffer);
    var objUrl = URL.createObjectURL(wav);
    var audio = document.createElement('audio');
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.src = objUrl;
    audio.loop = true;
    audio.volume = 0.35;
    var playP = audio.play();
    if (playP && playP.then) {
      playP.then(function() {
        if (WEATHER.moodPlaying !== moodKey) { audio.pause(); URL.revokeObjectURL(objUrl); return; }
        WEATHER.moodNode = { audio: audio, objUrl: objUrl };
      }).catch(function() {
        URL.revokeObjectURL(objUrl);
        // Fallback to Web Audio API
        _startMoodWebAudio(ctx, buffer, mood, moodKey);
      });
    } else {
      WEATHER.moodNode = { audio: audio, objUrl: objUrl };
      toast(mood.label + ' mood playing');
    }
  } catch(e) {
    _startMoodWebAudio(ctx, buffer, mood, moodKey);
  }

  // Verify audio is actually running after a delay
  setTimeout(function() {
    if (!WEATHER.moodNode && WEATHER.moodPlaying === moodKey) {
      // Neither HTML5 nor Web Audio started — try Web Audio as last resort
      _startMoodWebAudio(ctx, buffer, mood, moodKey);
    }
    if (ctx.state !== 'running') {
      toast('Audio blocked (' + ctx.state + ') — check silent mode & volume');
      ctx.resume();
    }
  }, 800);
}

// Fallback: play mood sound via Web Audio API
function _startMoodWebAudio(ctx, buffer, mood, moodKey) {
  if (!ctx || ctx.state === 'closed') return;
  if (WEATHER.moodPlaying !== moodKey) return;
  if (WEATHER.moodNode) return;

  var source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  var gain = ctx.createGain();
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.5);

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);

  WEATHER.moodNode = { source: source, gain: gain };
  toast(mood.label + ' mood playing');
}

function stopMoodSound() {
  if (WEATHER.moodNode) {
    var node = WEATHER.moodNode;
    // HTML5 Audio path
    if (node.audio) {
      try { node.audio.pause(); node.audio.src = ''; } catch(e) {}
      if (node.objUrl) try { URL.revokeObjectURL(node.objUrl); } catch(e) {}
    }
    // Web Audio path
    if (node.source) {
      try {
        if (node.gain && WEATHER.audioCtx) {
          node.gain.gain.linearRampToValueAtTime(0, WEATHER.audioCtx.currentTime + 0.5);
        }
        setTimeout(function() { try { node.source.stop(); } catch(e) {} }, 600);
      } catch(e) { try { node.source.stop(); } catch(e2) {} }
    }
    WEATHER.moodNode = null;
  }
  WEATHER.moodPlaying = null;
  document.querySelectorAll('.mood-sound-btn').forEach(function(btn) {
    btn.classList.remove('active');
  });
  // Hide send/stop buttons
  var sendBtn = document.getElementById('mood-send-btn');
  var stopBtn = document.getElementById('mood-stop-all');
  var stopMain = document.getElementById('mood-stop-main');
  if (sendBtn) sendBtn.classList.add('d-none');
  if (stopBtn) stopBtn.classList.add('d-none');
  if (stopMain) stopMain.classList.add('d-none');
}

function toggleMoodSound(moodKey) {
  if (WEATHER.moodPlaying === moodKey) {
    stopMoodSound();
  } else {
    playMoodSound(moodKey);
  }
  // Update send/stop buttons visibility
  var sendBtn = document.getElementById('mood-send-btn');
  var stopBtn = document.getElementById('mood-stop-all');
  var stopMain = document.getElementById('mood-stop-main');
  var playing = !!WEATHER.moodPlaying;
  if (sendBtn) sendBtn.classList.toggle('d-none', !playing);
  if (stopBtn) stopBtn.classList.toggle('d-none', !playing);
  if (stopMain) stopMain.classList.toggle('d-none', !playing);
}

function sendMoodToPartner(moodKey) {
  if (typeof db === 'undefined' || !db || typeof user === 'undefined' || !user) {
    toast('Not connected');
    return;
  }
  var mood = MOOD_SOUNDS[moodKey];
  if (!mood) return;
  var partnerRole = user === 'her' ? 'him' : 'her';
  db.ref('notifications/' + partnerRole).push({
    type: 'mood-sound',
    from: user,
    fromName: typeof NAMES !== 'undefined' ? NAMES[user] : user,
    mood: moodKey,
    label: mood.label,
    icon: mood.icon,
    ts: Date.now()
  });
  if (typeof sendInAppNotif === 'function') {
    var senderName = typeof NAMES !== 'undefined' ? NAMES[user] : user;
    sendInAppNotif('mood', senderName + ' set the mood to ' + mood.label, mood.icon);
  }
  toast('Sent ' + mood.label + ' mood to partner');
}

// ===== DYNAMIC SKY SYNC =====
// Update body data attributes for CSS transitions and synchronized colors
function syncSkyState() {
  var time = getTimeOfDay();
  var prevTime = document.body.getAttribute('data-time');
  document.body.setAttribute('data-time', time);

  // If time period changed, refresh the sky
  if (prevTime && prevTime !== time) {
    var container = document.getElementById('sky-scene');
    if (container && livingSkyEnabled) {
      renderLivingSky(container);
    }
    updateAmbientAudio();
    if (typeof spawnOrbs === 'function') spawnOrbs();
  }
}
// Sync every 60 seconds (skip when tab hidden)
setInterval(function() { if (!document.hidden) syncSkyState(); }, 60000);

// Periodic audio retry - if enabled but no sounds playing, try again
// Does NOT create AudioContext — only works with an existing one
setInterval(function() {
  if (typeof vnRecording !== 'undefined' && vnRecording) return;
  if (!WEATHER.audioEnabled && !WEATHER.moodPlaying) return;
  var ctx = WEATHER.audioCtx;
  if (!ctx || ctx.state === 'closed') return; // wait for user gesture to create
  var nodeCount = Object.keys(WEATHER.audioNodes).length;
  if (nodeCount === 0 || ctx.state !== 'running') {
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      ctx.resume().catch(function(){});
    }
    if (WEATHER.audioEnabled && ctx.state === 'running') {
      updateAmbientAudio();
    }
  }
}, 15000);

// Resume audio when page returns from background
document.addEventListener('visibilitychange', function() {
  if (document.hidden) return;
  if (typeof vnRecording !== 'undefined' && vnRecording) return;
  if (WEATHER.audioEnabled) {
    var ctx = _ensureAudioCtx();
    if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
      ctx.resume().catch(function(){});
    }
    // On iOS PWA, context may be permanently broken after background — recreate if needed
    setTimeout(function() {
      if (!WEATHER.audioEnabled) return;
      var c = WEATHER.audioCtx;
      if (c && c.state !== 'running') {
        // Context didn't resume — recreate it (will need user gesture to actually play)
        _recreateAudioCtx();
      }
      // Restart sounds if they were lost
      if (Object.keys(WEATHER.audioNodes).length === 0) {
        updateAmbientAudio();
      }
    }, 500);
  }
});

// iOS fires 'pageshow' when returning to a PWA from the app switcher
// This is more reliable than visibilitychange for iOS standalone mode
window.addEventListener('pageshow', function(e) {
  if (!WEATHER.audioEnabled) return;
  if (typeof vnRecording !== 'undefined' && vnRecording) return;
  var ctx = WEATHER.audioCtx;
  if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
    ctx.resume().catch(function(){});
  }
});

// ===== INIT =====
var _weatherInitialized = false;
function initWeatherSystem() {
  if (typeof db === 'undefined' || !db || typeof user === 'undefined' || !user) return;
  if (_weatherInitialized) return; // prevent double-init
  _weatherInitialized = true;

  db.ref('settings/weather/' + user).once('value', function(snap) {
    var data = snap.val() || {};

    // Load scene
    if (data.scene && SCENES[data.scene]) {
      WEATHER.scene = data.scene;
    }

    // Load audio preference - properly restore saved state
    if (data.audio) {
      WEATHER.audioEnabled = true;
      var audioToggle = document.getElementById('set-ambient-audio');
      if (audioToggle) audioToggle.checked = true;
      // Do NOT create AudioContext eagerly — on iOS/mobile, contexts created
      // outside a user gesture can never be properly resumed. The first user
      // touch/click will create and unlock it via _tryUnlock.
    }

    // Update scene selection UI
    document.querySelectorAll('.scene-option').forEach(function(opt) {
      opt.classList.toggle('active', opt.getAttribute('data-scene') === WEATHER.scene);
    });

    // Load location
    if (data.location && data.location.granted && data.location.lat) {
      WEATHER.lat = data.location.lat;
      WEATHER.lon = data.location.lon;
      WEATHER.locationGranted = true;
      // Update button
      var btn = document.getElementById('set-location-btn');
      if (btn) btn.textContent = 'Refresh';

      fetchWeather().then(function() {
        var container = document.getElementById('sky-scene');
        if (container && livingSkyEnabled) renderLivingSky(container);
        updateWeatherInfoUI();
        // Queue ambient audio - will play once AudioContext is unlocked by user gesture
        if (WEATHER.audioEnabled) {
          updateAmbientAudio();
        }
      });
    } else {
      // Even without weather, queue ambient audio for scene sounds
      if (WEATHER.audioEnabled) {
        updateAmbientAudio();
      }
      if (!data.prompted) {
        // First time - prompt after delay
        setTimeout(function() {
          if (livingSkyEnabled) showLocationPrompt();
        }, 4000);
      }
    }
  });

  // Refresh weather every 15 minutes
  if (!WEATHER.refreshTimer) {
    WEATHER.refreshTimer = setInterval(function() {
      if (document.hidden) return;
      if (WEATHER.locationGranted) {
        fetchWeather().then(function() {
          var container = document.getElementById('sky-scene');
          if (container && livingSkyEnabled) renderLivingSky(container);
          updateWeatherInfoUI();
        });
      }
    }, 15 * 60 * 1000);
  }
}

// Hook into app init - fallback for non-finishLogin paths
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (typeof db !== 'undefined' && db && typeof user !== 'undefined' && user) {
      initWeatherSystem();
    }
  }, 3500);
});

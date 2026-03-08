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
  refreshTimer: null,
  previewTimer: null,
  previewRunning: false
};

// ===== SCENE DEFINITIONS =====
// Warm, intimate tones matching the app's cream/gold/rose palette
var SCENES = {
  meadow: {
    label: 'Golden Meadow',
    icon: '🌾',
    desc: 'Sun-kissed fields, wildflowers, gentle warmth',
    creatures: {
      dawn: ['rabbit', 'butterfly', 'songbird'],
      morning: ['bird', 'butterfly', 'bee', 'rabbit'],
      afternoon: ['bird', 'bee', 'dragonfly'],
      golden: ['bird', 'deer', 'rabbit'],
      evening: ['owl', 'bat', 'deer'],
      night: ['firefly', 'owl']
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
      dawn: ['seagull', 'crab', 'dolphin'],
      morning: ['seagull', 'fish', 'crab'],
      afternoon: ['seagull', 'jellyfish', 'turtle'],
      golden: ['seagull', 'dolphin', 'crab'],
      evening: ['seagull', 'bat', 'crab'],
      night: ['firefly', 'crab', 'whale']
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
      dawn: ['fox', 'songbird', 'butterfly'],
      morning: ['bird', 'squirrel', 'butterfly', 'woodpecker'],
      afternoon: ['bird', 'squirrel', 'dragonfly'],
      golden: ['deer', 'bird', 'fox'],
      evening: ['owl', 'bat', 'fox'],
      night: ['firefly', 'owl']
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
          toast('Location permission denied — you can enable it in settings later');
        } else {
          toast('Could not get location — try again later');
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
    case 'seagull': case 'pelican': renderSeagull(container); break;
    case 'crab': renderCrab(container); break;
    case 'dolphin': renderDolphin(container); break;
    case 'fish': renderFish(container); break;
    case 'jellyfish': renderJellyfish(container); break;
    case 'turtle': renderTurtle(container); break;
    case 'whale': renderWhale(container); break;
    case 'songbird': case 'bird': renderBird(container); break;
    case 'butterfly': renderButterfly(container); break;
    case 'firefly': renderFirefly(container); break;
  }
}

function renderRabbit(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-rabbit';
  var x = 10 + Math.random() * 70;
  var dur = 6 + Math.random() * 6;
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
  var dur = 8 + Math.random() * 8;
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
  var dur = 6 + Math.random() * 6;
  var dx = 150 + Math.random() * 200;
  el.style.cssText = 'left:' + x + '%;top:' + y + '%;--df-dx:' + dx + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="df-body"></div><div class="df-wing df-wing-l"></div><div class="df-wing df-wing-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderDeer(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-deer';
  var dur = 12 + Math.random() * 8;
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
  var dur = 5 + Math.random() * 5;
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
  var dur = 10 + Math.random() * 8;
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
  var dur = 5 + Math.random() * 5;
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
  var dur = 7 + Math.random() * 8;
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
  var dur = 8 + Math.random() * 6;
  var dir = Math.random() < 0.5 ? 1 : -1;
  el.style.cssText = 'bottom:4%;' + (dir > 0 ? 'left:5%' : 'right:5%') + ';--crab-dir:' + (dir * 120) + 'px;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="crab-body"></div><div class="crab-claw crab-claw-l"></div><div class="crab-claw crab-claw-r"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderDolphin(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-dolphin';
  var dur = 6 + Math.random() * 4;
  el.style.cssText = 'bottom:12%;left:-10%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="dolphin-body"></div><div class="dolphin-fin"></div><div class="dolphin-tail"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderFish(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-fish';
  var y = 50 + Math.random() * 30;
  var dur = 5 + Math.random() * 5;
  el.style.cssText = 'left:-5%;top:' + y + '%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="fish-body"></div><div class="fish-tail"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderJellyfish(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-jellyfish';
  var x = 20 + Math.random() * 60;
  var dur = 10 + Math.random() * 8;
  el.style.cssText = 'left:' + x + '%;bottom:15%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="jf-body"></div><div class="jf-tentacle jf-t1"></div><div class="jf-tentacle jf-t2"></div><div class="jf-tentacle jf-t3"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 1) * 1000);
}

function renderTurtle(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-turtle';
  var dur = 15 + Math.random() * 10;
  el.style.cssText = 'bottom:5%;left:-5%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="turtle-shell"></div><div class="turtle-head"></div><div class="turtle-leg turtle-leg-fl"></div><div class="turtle-leg turtle-leg-fr"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 2) * 1000);
}

function renderWhale(container) {
  var el = document.createElement('div');
  el.className = 'scene-creature creature-whale';
  var dur = 20 + Math.random() * 10;
  el.style.cssText = 'bottom:20%;left:-15%;animation-duration:' + dur + 's';
  el.innerHTML = '<div class="whale-body"></div><div class="whale-tail"></div><div class="whale-spout"></div>';
  container.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.remove(); }, (dur + 2) * 1000);
}

// ===== AMBIENT AUDIO SYSTEM =====
// Audio requires user gesture — we unlock on first tap/click
function unlockAudio() {
  if (WEATHER.audioUnlocked) return;
  try {
    WEATHER.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Create and play a silent buffer to unlock
    var buf = WEATHER.audioCtx.createBuffer(1, 1, 22050);
    var src = WEATHER.audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(WEATHER.audioCtx.destination);
    src.start(0);
    WEATHER.audioUnlocked = true;
    // Now start audio if it was enabled
    if (WEATHER.audioEnabled) {
      updateAmbientAudio();
    }
  } catch(e) {
    console.warn('Audio unlock failed:', e);
  }
}

// Attach unlock to first user interaction
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

function generateNoise(type) {
  if (!WEATHER.audioCtx) return null;
  var ctx = WEATHER.audioCtx;
  var sampleRate = ctx.sampleRate;
  var bufferSize = sampleRate * 3; // 3 seconds loop
  var buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  var data = buffer.getChannelData(0);

  switch (type) {
    case 'rain':
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.035;
        // Occasional louder drops
        if (Math.random() < 0.002) data[i] *= 6;
      }
      break;
    case 'lightRain':
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.015;
        if (Math.random() < 0.001) data[i] *= 5;
      }
      break;
    case 'wind':
      var b0 = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.993 * b0 + 0.007 * white;
        data[i] = b0 * 0.10;
      }
      break;
    case 'forestWind':
      var b0 = 0, b1 = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.996 * b0 + 0.004 * white;
        b1 = 0.999 * b1 + 0.001 * white;
        data[i] = (b0 * 0.06 + b1 * 0.03);
        // Subtle rustling
        if (Math.random() < 0.0005) {
          for (var k = 0; k < Math.min(600, bufferSize - i); k++) {
            data[i + k] += (Math.random() * 2 - 1) * 0.02 * Math.exp(-k / 200);
          }
        }
      }
      break;
    case 'waves':
      for (var i = 0; i < bufferSize; i++) {
        var t = i / sampleRate;
        // Layered wave sounds at different frequencies
        data[i] = Math.sin(t * 0.25) * 0.04 +
                  Math.sin(t * 0.6 + 1.2) * 0.025 +
                  Math.sin(t * 1.1 + 2.8) * 0.015 +
                  (Math.random() * 2 - 1) * 0.008;
      }
      break;
    case 'thunder':
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.04;
        // Rumbles
        if (Math.random() < 0.0003) {
          for (var j = 0; j < Math.min(5000, bufferSize - i); j++) {
            data[i + j] += (Math.random() * 2 - 1) * 0.25 * Math.exp(-j / 3000);
          }
        }
      }
      break;
    case 'crickets':
      var b0 = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + 0.003 * white;
        data[i] = b0 * 0.03;
        // Chirps
        if (Math.random() < 0.0004) {
          for (var k = 0; k < Math.min(800, bufferSize - i); k++) {
            data[i + k] += Math.sin(k * 0.6) * 0.04 * Math.exp(-k / 150);
          }
        }
      }
      break;
    case 'birdsong':
      var b0 = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.998 * b0 + 0.002 * white;
        data[i] = b0 * 0.02;
        // Bird calls — warbling frequency sweeps
        if (Math.random() < 0.00025) {
          for (var k = 0; k < Math.min(2500, bufferSize - i); k++) {
            var freq = 0.3 + 0.25 * Math.sin(k / 250);
            data[i + k] += Math.sin(k * freq) * 0.05 * Math.exp(-k / 1000);
          }
        }
      }
      break;
    case 'seagulls':
      var b0 = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.998 * b0 + 0.002 * white;
        data[i] = b0 * 0.015;
        // Seagull-like calls — higher, more nasal
        if (Math.random() < 0.0002) {
          for (var k = 0; k < Math.min(3000, bufferSize - i); k++) {
            var freq = 0.4 + 0.15 * Math.sin(k / 400);
            data[i + k] += Math.sin(k * freq) * 0.04 * Math.exp(-k / 1200);
          }
        }
      }
      break;
    case 'owls':
      var b0 = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.999 * b0 + 0.001 * white;
        data[i] = b0 * 0.02;
        // Low hooting
        if (Math.random() < 0.00008) {
          for (var k = 0; k < Math.min(4000, bufferSize - i); k++) {
            data[i + k] += Math.sin(k * 0.08) * 0.06 * Math.exp(-k / 2000);
          }
        }
      }
      break;
    case 'insects':
    case 'forestAmbient':
      var b0 = 0, b1 = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.996 * b0 + 0.004 * white;
        b1 = 0.999 * b1 + 0.001 * white;
        data[i] = (b0 + b1) * 0.025;
        // Insect buzzes
        if (Math.random() < 0.0003) {
          for (var k = 0; k < Math.min(500, bufferSize - i); k++) {
            data[i + k] += Math.sin(k * 0.8) * 0.02 * Math.exp(-k / 150);
          }
        }
      }
      break;
    default:
      for (var i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.01;
      }
      break;
  }
  return buffer;
}

function playAmbientSound(type, volume) {
  if (!WEATHER.audioCtx || !WEATHER.audioEnabled || !WEATHER.audioUnlocked) return;
  if (WEATHER.audioNodes[type]) return;

  // Resume context if suspended
  if (WEATHER.audioCtx.state === 'suspended') {
    WEATHER.audioCtx.resume();
  }

  var buffer = generateNoise(type);
  if (!buffer) return;

  var source = WEATHER.audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  var gain = WEATHER.audioCtx.createGain();
  var vol = volume || 0.12;
  gain.gain.setValueAtTime(0, WEATHER.audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, WEATHER.audioCtx.currentTime + 2);

  source.connect(gain);
  gain.connect(WEATHER.audioCtx.destination);
  source.start(0);

  WEATHER.audioNodes[type] = { source: source, gain: gain };
}

function stopAmbientSound(type) {
  if (!WEATHER.audioNodes[type]) return;
  var node = WEATHER.audioNodes[type];
  try {
    node.gain.gain.linearRampToValueAtTime(0, WEATHER.audioCtx.currentTime + 1);
    setTimeout(function() {
      try { node.source.stop(); } catch(e) {}
    }, 1200);
  } catch(e) {}
  delete WEATHER.audioNodes[type];
}

function stopAllSounds() {
  Object.keys(WEATHER.audioNodes).forEach(function(type) {
    stopAmbientSound(type);
  });
}

function updateAmbientAudio() {
  if (!WEATHER.audioEnabled || !WEATHER.audioCtx || !WEATHER.audioUnlocked) return;

  var scene = SCENES[WEATHER.scene];
  if (!scene) return;
  var time = WEATHER.locationGranted && WEATHER.data ? getTimeOfDayWeather() : getTimeOfDay();
  var soundType = scene.sounds[time] || scene.sounds.base;

  // Stop sounds not matching current
  var keepSounds = [scene.sounds.base, soundType];
  if (WEATHER.data) {
    var wxFx = WEATHER_EFFECTS[WEATHER.data.condition];
    if (wxFx && wxFx.sound) keepSounds.push(wxFx.sound);
  }
  Object.keys(WEATHER.audioNodes).forEach(function(k) {
    if (keepSounds.indexOf(k) === -1) stopAmbientSound(k);
  });

  // Play sounds
  playAmbientSound(scene.sounds.base, 0.06);
  if (soundType !== scene.sounds.base) playAmbientSound(soundType, 0.10);

  // Weather sounds
  if (WEATHER.data) {
    var wxFx = WEATHER_EFFECTS[WEATHER.data.condition];
    if (wxFx && wxFx.sound) playAmbientSound(wxFx.sound, 0.12);
  }
}

function toggleAmbientAudio(on) {
  WEATHER.audioEnabled = on;
  if (on) {
    if (!WEATHER.audioUnlocked) {
      // Will start when user next taps
      toast('Sounds will start on next tap');
    } else {
      if (WEATHER.audioCtx && WEATHER.audioCtx.state === 'suspended') {
        WEATHER.audioCtx.resume();
      }
      updateAmbientAudio();
    }
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
function spawnSceneCreatures(container) {
  var scene = SCENES[WEATHER.scene];
  if (!scene) return;
  var time = WEATHER.locationGranted && WEATHER.data ? getTimeOfDayWeather() : getTimeOfDay();
  var creatures = scene.creatures[time] || scene.creatures.morning;

  var count = 1 + Math.floor(Math.random() * 2);
  for (var i = 0; i < count; i++) {
    var type = creatures[Math.floor(Math.random() * creatures.length)];
    renderSceneCreature(container, type);
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
      if (_origRenderLivingSky) _origRenderLivingSky(container);
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

// ===== SCENE PREVIEW SYSTEM =====
function startScenePreview(sceneName, previewEl) {
  if (WEATHER.previewRunning) stopScenePreview();
  WEATHER.previewRunning = true;

  var scene = SCENES[sceneName];
  if (!scene || !previewEl) return;

  var periods = ['dawn', 'morning', 'afternoon', 'golden', 'evening', 'night'];
  var idx = 0;
  var gradients = {
    dawn: 'linear-gradient(180deg, #2a1f4e 0%, #7b4a8c 25%, #e8836b 50%, #f5c07a 75%, #ffecd2 100%)',
    morning: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 30%, #FFF8DC 70%, #FFFAF0 100%)',
    afternoon: 'linear-gradient(180deg, #5BA3E6 0%, #87CEEB 30%, #B8D4E8 60%, #F0F4E8 100%)',
    golden: 'linear-gradient(180deg, #FF8C42 0%, #FFB347 25%, #FFD93D 50%, #FFF0B8 75%, #FFF8E0 100%)',
    evening: 'linear-gradient(180deg, #2C1654 0%, #6B3FA0 25%, #C46D6D 50%, #E8A87C 75%, #F5DEB3 100%)',
    night: 'linear-gradient(180deg, #0a0e27 0%, #151d3b 30%, #1a2444 60%, #1f2d50 100%)'
  };

  var weatherConditions = ['clear', 'clouds', 'rain', 'snow'];
  var wxIdx = 0;

  function renderPreviewFrame() {
    if (!WEATHER.previewRunning) return;
    var period = periods[idx];

    previewEl.innerHTML = '';
    previewEl.style.background = gradients[period];
    previewEl.style.transition = 'background 1.5s ease';

    // Period label
    var label = document.createElement('div');
    label.className = 'preview-period-label';
    label.textContent = period.charAt(0).toUpperCase() + period.slice(1);
    previewEl.appendChild(label);

    // Weather label
    var wxLabel = document.createElement('div');
    wxLabel.className = 'preview-weather-label';
    wxLabel.textContent = weatherConditions[wxIdx].charAt(0).toUpperCase() + weatherConditions[wxIdx].slice(1);
    previewEl.appendChild(wxLabel);

    // Scene ground
    var ground = document.createElement('div');
    ground.className = 'preview-ground scene-ground-' + sceneName;
    previewEl.appendChild(ground);

    // Sun/Moon
    if (period === 'night') {
      var moon = document.createElement('div');
      moon.className = 'preview-moon';
      previewEl.appendChild(moon);
      for (var s = 0; s < 15; s++) {
        var star = document.createElement('div');
        star.className = 'preview-star';
        star.style.cssText = 'left:' + (Math.random() * 90) + '%;top:' + (Math.random() * 50) + '%;width:' + (1 + Math.random() * 2) + 'px;height:' + (1 + Math.random() * 2) + 'px';
        previewEl.appendChild(star);
      }
    } else {
      var sun = document.createElement('div');
      sun.className = 'preview-sun';
      var positions = { dawn: { x: 15, y: 70 }, morning: { x: 30, y: 30 }, afternoon: { x: 60, y: 15 }, golden: { x: 80, y: 50 }, evening: { x: 90, y: 70 } };
      var sp = positions[period] || { x: 50, y: 30 };
      sun.style.cssText = 'left:' + sp.x + '%;top:' + sp.y + '%';
      if (period === 'golden' || period === 'evening') sun.style.background = 'radial-gradient(circle, #FFD700, #FF8C00)';
      previewEl.appendChild(sun);
    }

    // Weather particles
    var wx = weatherConditions[wxIdx];
    if (wx === 'rain') {
      for (var r = 0; r < 20; r++) {
        var drop = document.createElement('div');
        drop.className = 'preview-rain';
        drop.style.cssText = 'left:' + (Math.random() * 100) + '%;animation-delay:' + (Math.random() * 1) + 's';
        previewEl.appendChild(drop);
      }
    } else if (wx === 'snow') {
      for (var s = 0; s < 15; s++) {
        var flake = document.createElement('div');
        flake.className = 'preview-snow';
        flake.style.cssText = 'left:' + (Math.random() * 100) + '%;animation-delay:' + (Math.random() * 2) + 's';
        previewEl.appendChild(flake);
      }
    } else if (wx === 'clouds') {
      for (var c = 0; c < 3; c++) {
        var cloud = document.createElement('div');
        cloud.className = 'preview-cloud';
        cloud.style.cssText = 'top:' + (10 + c * 15) + '%;animation-delay:' + (c * 2) + 's;width:' + (30 + Math.random() * 30) + 'px';
        previewEl.appendChild(cloud);
      }
    }

    // Creature emoji
    var creatures = scene.creatures[period];
    if (creatures && creatures.length > 0) {
      var c1 = creatures[0];
      var creatureEl = document.createElement('div');
      creatureEl.className = 'preview-creature';
      creatureEl.textContent = getCreatureEmoji(c1);
      creatureEl.style.cssText = 'bottom:15%;left:' + (20 + Math.random() * 60) + '%';
      previewEl.appendChild(creatureEl);
      if (creatures.length > 1) {
        var c2El = document.createElement('div');
        c2El.className = 'preview-creature';
        c2El.textContent = getCreatureEmoji(creatures[1]);
        c2El.style.cssText = 'bottom:18%;left:' + (10 + Math.random() * 40) + '%;animation-delay:0.5s';
        previewEl.appendChild(c2El);
      }
    }

    // Temperature
    var tempEl = document.createElement('div');
    tempEl.className = 'preview-temp';
    var temps = { dawn: '16°', morning: '20°', afternoon: '27°', golden: '24°', evening: '19°', night: '14°' };
    tempEl.textContent = temps[period];
    previewEl.appendChild(tempEl);
  }

  renderPreviewFrame();
  WEATHER.previewTimer = setInterval(function() {
    if (!WEATHER.previewRunning) {
      clearInterval(WEATHER.previewTimer);
      return;
    }
    wxIdx = (wxIdx + 1) % weatherConditions.length;
    if (wxIdx === 0) idx = (idx + 1) % periods.length;
    renderPreviewFrame();
  }, 2500);
}

function stopScenePreview() {
  WEATHER.previewRunning = false;
  clearInterval(WEATHER.previewTimer);
}

function getCreatureEmoji(type) {
  var map = {
    rabbit: '🐇', bird: '🐦', butterfly: '🦋', bee: '🐝', dragonfly: '🪰',
    deer: '🦌', owl: '🦉', bat: '🦇', fox: '🦊', squirrel: '🐿',
    woodpecker: '🪶', firefly: '✨', wolf: '🐺',
    seagull: '🕊', crab: '🦀', dolphin: '🐬', pelican: '🕊',
    fish: '🐟', jellyfish: '🪼', turtle: '🐢', whale: '🐋', songbird: '🐦'
  };
  return map[type] || '🐾';
}

// ===== LOCATION PROMPT MODAL =====
function showLocationPrompt() {
  var modal = document.getElementById('generic-modal');
  var content = document.getElementById('generic-modal-content');
  if (!modal || !content) return;

  content.innerHTML =
    '<div class="loc-prompt">' +
      '<div class="loc-prompt-icon">🌍</div>' +
      '<h2 class="loc-prompt-title">Living Weather</h2>' +
      '<p class="loc-prompt-desc">Allow location access to bring your real weather to life — rain, snow, sunshine, wind and more, right in your background.</p>' +
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
      toast('Location enabled — fetching weather...');
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

  // If preview is running, restart with new scene
  if (WEATHER.previewRunning) {
    var box = document.getElementById('scene-preview-box');
    if (box) startScenePreview(sceneName, box);
  }

  toast(SCENES[sceneName].label + ' activated');
}

// ===== INIT =====
function initWeatherSystem() {
  if (typeof db === 'undefined' || !db || typeof user === 'undefined' || !user) return;

  db.ref('settings/weather/' + user).once('value', function(snap) {
    var data = snap.val() || {};

    // Load scene
    if (data.scene && SCENES[data.scene]) {
      WEATHER.scene = data.scene;
    }

    // Load audio preference
    if (data.audio) {
      WEATHER.audioEnabled = true;
      var audioToggle = document.getElementById('set-ambient-audio');
      if (audioToggle) audioToggle.checked = true;
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
        updateAmbientAudio();
      });
    } else if (!data.prompted) {
      // First time — prompt after delay
      setTimeout(function() {
        if (livingSkyEnabled) showLocationPrompt();
      }, 4000);
    }
  });

  // Refresh weather every 15 minutes
  WEATHER.refreshTimer = setInterval(function() {
    if (WEATHER.locationGranted) {
      fetchWeather().then(function() {
        var container = document.getElementById('sky-scene');
        if (container && livingSkyEnabled) renderLivingSky(container);
        updateWeatherInfoUI();
      });
    }
  }, 15 * 60 * 1000);
}

// Hook into app init
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (typeof db !== 'undefined' && db && typeof user !== 'undefined' && user) {
      initWeatherSystem();
    }
  }, 2500);
});

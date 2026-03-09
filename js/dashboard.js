// ===== THEME =====
function applyTheme() {
  // Light mode is the default via CSS variables; nothing to do unless dark mode is added
}

// ===== PULL TO REFRESH =====
function initPullToRefresh() {
  let startY = 0;
  let pulling = false;
  const threshold = 100;

  document.addEventListener('touchstart', function(e) {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
      pulling = true;
    }
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (!pulling) return;
    const dy = e.touches[0].clientY - startY;
    const ptr = document.getElementById('ptr');
    if (dy > 20 && dy < threshold && window.scrollY === 0 && ptr) {
      ptr.style.height = Math.min(dy * 0.5, 40) + 'px';
      ptr.classList.add('show');
    }
    if (dy > threshold && window.scrollY === 0) {
      pulling = false;
      softRefresh();
    }
  }, { passive: true });

  document.addEventListener('touchend', function() {
    pulling = false;
    const ptr = document.getElementById('ptr');
    if (ptr) { ptr.style.height = '0'; ptr.classList.remove('show', 'refreshing'); }
  }, { passive: true });
}

function softRefresh() {
  var ptr = document.getElementById('ptr');
  if (ptr) {
    ptr.style.height = '40px';
    ptr.classList.add('show', 'refreshing');
  }

  // Re-render current page data without a full page reload
  var page = currentPageId || 'dash';
  try {
    // Re-render dashboard if on it
    if (page === 'dash') {
      if (typeof renderDashHero === 'function') renderDashHero();
      if (typeof renderDailyTasks === 'function') renderDailyTasks();
    }
    // Re-trigger page-specific data load via go()
    if (typeof go === 'function') go(page);

    // Refresh sky scene
    if (typeof livingSkyEnabled !== 'undefined' && livingSkyEnabled) {
      var skyEl = document.getElementById('sky-scene');
      if (skyEl && typeof renderLivingSky === 'function') renderLivingSky(skyEl);
    }

    // Refresh weather if available
    if (typeof WEATHER !== 'undefined' && WEATHER.locationGranted && typeof fetchWeather === 'function') {
      fetchWeather().then(function() {
        if (typeof updateWeatherInfoUI === 'function') updateWeatherInfoUI();
      });
    }

    // Update time of day visuals
    if (typeof updateTimeOfDay === 'function') updateTimeOfDay();
    if (typeof spawnOrbs === 'function') spawnOrbs();
    if (typeof renderTerrain === 'function') renderTerrain();

    toast('Refreshed');
  } catch(e) {
    console.error('Soft refresh error:', e);
  }

  // Hide PTR indicator after a short delay
  setTimeout(function() {
    if (ptr) {
      ptr.classList.remove('refreshing');
      ptr.style.height = '0';
      setTimeout(function() { ptr.classList.remove('show'); }, 300);
    }
  }, 800);
}

// ===== MODAL =====
function openModal(html) {
  var el = document.getElementById('generic-modal');
  var box = document.getElementById('generic-modal-content');
  if (box) box.innerHTML = html;
  if (el) { el.classList.add('on'); }
  // Lock body scroll to prevent iOS from scrolling behind the fixed overlay
  document.body.dataset.scrollY = window.scrollY;
  document.body.style.top = '-' + window.scrollY + 'px';
  document.body.classList.add('modal-open');
  // Ensure inputs inside modal are tappable on iOS
  if (box) {
    var inputs = box.querySelectorAll('input, textarea');
    for (var i = 0; i < inputs.length; i++) {
      (function(input) {
        // Force focus on touchend to bypass iOS fixed-overlay input issues
        input.addEventListener('touchend', function(e) {
          e.preventDefault();
          input.focus();
        });
        // Ensure inputs have correct styles for iOS
        input.style.fontSize = '16px'; // Prevents iOS zoom on focus
      })(inputs[i]);
    }
  }
}

function closeModal() {
  var el = document.getElementById('generic-modal');
  // Blur any focused input first so keyboard dismisses cleanly
  var active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
    active.blur();
  }
  if (el) { el.classList.remove('on'); }
  var scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollY);
}

// ===== PRIVACY =====
function enforcePrivacy() {
  // Hide partner-only sections when viewing your own private space
}

// ===== DYNAMIC VISUALS =====
function initDynamicVisuals() {
  // Sky scene is initialized separately via initSkyScene
  if (typeof initSkyScene === 'function') initSkyScene();
}

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => {
  // Apply light theme
  applyTheme();

  // Init pull to refresh
  initPullToRefresh();

  if (FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) {
    init();
  } else {
    showConfigSetup();
  }
});

function showConfigSetup() {
  document.getElementById('login').innerHTML = `
    <div class="login-logo">M&T</div>
    <h1>Manu & Taylor</h1>
    <div class="sub">One-time setup</div>
    <div class="lbl" style="margin-bottom:14px">Paste your connection key</div>
    <input type="password" id="config-input" class="login-input mb16" placeholder="Paste key here..."
      onkeydown="if(event.key==='Enter')saveConfig()">
    <button onclick="saveConfig()" class="login-btn">Connect ♡</button>
    <div id="config-err" class="login-err"></div>
    <div style="margin-top:20px;font-size:11px;color:var(--t3);text-align:center;max-width:280px;line-height:1.5">
      Ask Manu for the connection key. You only need to do this once on each device.</div>
  `;
}

function saveConfig() {
  const raw = document.getElementById('config-input').value.trim();
  try {
    // Try as base64 first
    let config;
    try {
      config = JSON.parse(atob(raw));
    } catch(e) {
      // Try as raw JSON
      config = JSON.parse(raw);
    }
    if (!config.apiKey || !config.databaseURL || !config.projectId) {
      throw new Error('Missing fields');
    }
    localStorage.setItem('met_fb_config', JSON.stringify(config));
    FIREBASE_CONFIG = config;
    location.reload();
  } catch(e) {
    document.getElementById('config-err').textContent = 'Invalid key. Try again.';
  }
}

// ===== TRUTH OR DARE =====
const TOD_TRUTHS = [
  "What's one thing you've never told me but want to?",
  "What's the first thing you noticed about me?",
  "What's a secret dream you haven't shared with anyone?",
  "What's the most romantic thing you've ever imagined us doing?",
  "What's something small I do that always makes you smile?",
  "What's a fear you have about our future together?",
  "What's the most attractive quality I have that isn't physical?",
  "What song makes you think of me?",
  "What's a moment with me you replay in your head?",
  "What's something you want us to try together?",
  "When did you realize you loved me?",
  "What's something I do that you find adorable but haven't mentioned?",
  "What's your favorite memory of us so far?",
  "If you could change one thing about how we met, what would it be?",
  "What's something you're grateful for about our relationship?",
  "What does home feel like to you?",
  "What's a compliment you've wanted to give me but felt shy about?",
  "What's your ideal lazy Sunday with me?",
  "What habit of mine do you secretly love?",
  "What's the bravest thing you've done for love?"
];

const TOD_DARES = [
  "Send me a voice note saying what you love about me",
  "Write a 4-line poem about us right now",
  "Text me three things you find attractive about me",
  "Set a timer and tell me everything you appreciate for 60 seconds",
  "Share the last photo you took of us",
  "Send me a song that reminds you of us",
  "Describe your perfect date with me in detail",
  "Tell me something you want to do together this month",
  "Close your eyes and describe my face from memory",
  "Create a nickname for us as a couple",
  "Share something from your camera roll that makes you think of me",
  "Plan our next date and share it right now",
  "Write me a short love letter in under 2 minutes",
  "Record yourself saying 'I love you' in 3 different ways",
  "Send me a list of 5 reasons I'm your person",
  "Make up a handshake for just the two of us",
  "Describe our love story in exactly 10 words",
  "Name 3 things on your bucket list that include me",
  "Send me your favorite photo of us and explain why",
  "Tell me something new you want to learn together"
];

function drawTOD(type) {
  const list = type === 'truth' ? TOD_TRUTHS : TOD_DARES;
  const text = list[Math.floor(Math.random() * list.length)];
  const typeEl = document.getElementById('tod-type');
  const textEl = document.getElementById('tod-text');
  if (typeEl) {
    typeEl.textContent = type;
    typeEl.className = 'tod-type ' + type;
  }
  if (textEl) {
    textEl.style.opacity = '0';
    textEl.style.transform = 'translateY(8px)';
    setTimeout(() => {
      textEl.textContent = text;
      textEl.style.transition = 'all .3s ease';
      textEl.style.opacity = '1';
      textEl.style.transform = 'translateY(0)';
    }, 100);
  }
}

// ===== THIS OR THAT =====
const TOT_QUESTIONS = [
  {a: "Morning person", b: "Night owl"},
  {a: "Beach vacation", b: "Mountain getaway"},
  {a: "Cooking together", b: "Ordering takeout"},
  {a: "Texting all day", b: "One long phone call"},
  {a: "Rainy day inside", b: "Sunny day outside"},
  {a: "Big wedding", b: "Intimate elopement"},
  {a: "City apartment", b: "Country house"},
  {a: "Road trip", b: "Flying there"},
  {a: "Movie night", b: "Game night"},
  {a: "Sweet breakfast", b: "Savory breakfast"},
  {a: "Dancing together", b: "Singing together"},
  {a: "Love letter", b: "Surprise gift"},
  {a: "Matching outfits", b: "Coordinated colors"},
  {a: "First to say sorry", b: "First to make them laugh"},
  {a: "Sunset walks", b: "Stargazing nights"},
  {a: "Adopt a cat", b: "Adopt a dog"},
  {a: "Coffee date", b: "Wine night"},
  {a: "Plan everything", b: "Be spontaneous"},
  {a: "PDA everywhere", b: "Private affection"},
  {a: "Classic romance", b: "Adventure love"}
];

let totIndex = 0;

function loadTOT() {
  const q = TOT_QUESTIONS[totIndex];
  const aEl = document.getElementById('tot-a');
  const bEl = document.getElementById('tot-b');
  if (!aEl || !bEl) return;
  var wrap = document.getElementById('tot-wrap');
  if (wrap) { wrap.style.opacity = '0'; setTimeout(function(){ wrap.style.opacity = '1'; }, 50); }
  aEl.textContent = q.a;
  bEl.textContent = q.b;
  // Reset styles
  aEl.closest('.tot-option').classList.remove('picked', 'partner-picked');
  bEl.closest('.tot-option').classList.remove('picked', 'partner-picked');
  // Load saved answers
  if (db) {
    db.ref('games/tot/' + totIndex).once('value', snap => {
      const data = snap.val();
      if (data && data[user]) {
        const pickedEl = data[user] === 'A' ? aEl : bEl;
        pickedEl.closest('.tot-option').classList.add('picked');
      }
      if (data && data[partner]) {
        const partnerEl = data[partner] === 'A' ? aEl : bEl;
        partnerEl.closest('.tot-option').classList.add('partner-picked');
      }
    });
  }
}

async function pickTOT(choice) {
  if (!db || !user) return;
  await db.ref('games/tot/' + totIndex + '/' + user).set(choice);
  const aEl = document.getElementById('tot-a');
  const bEl = document.getElementById('tot-b');
  aEl.closest('.tot-option').classList.remove('picked');
  bEl.closest('.tot-option').classList.remove('picked');
  const pickedEl = choice === 'A' ? aEl : bEl;
  pickedEl.closest('.tot-option').classList.add('picked');
  // Check partner
  const snap = await db.ref('games/tot/' + totIndex + '/' + partner).once('value');
  if (snap.val()) {
    const partnerEl = snap.val() === 'A' ? aEl : bEl;
    partnerEl.closest('.tot-option').classList.add('partner-picked');
    if (choice === snap.val()) toast('You both picked the same!');
    else toast('Different picks! Interesting...');
  } else {
    toast('Waiting for ' + NAMES[partner] + '...');
  }
  updateEnhancedCompat();
}

function nextTOT() { totIndex = (totIndex + 1) % TOT_QUESTIONS.length; loadTOT(); }
function prevTOT() { totIndex = (totIndex - 1 + TOT_QUESTIONS.length) % TOT_QUESTIONS.length; loadTOT(); }

// ===== COMPATIBILITY SCORE =====
function updateCompat() {
  if (!db) return;
  let matches = 0, total = 0;

  // Check WYR answers
  const wyrChecks = WYR_QUESTIONS.map((_, i) => db.ref('games/wyr/' + i).once('value'));
  const totChecks = TOT_QUESTIONS.map((_, i) => db.ref('games/tot/' + i).once('value'));

  Promise.all([...wyrChecks, ...totChecks]).then(snaps => {
    snaps.forEach(snap => {
      const data = snap.val();
      if (data && data[user] && data[partner]) {
        total++;
        if (data[user] === data[partner]) matches++;
      }
    });

    const ring = document.getElementById('compat-ring');
    const scoreEl = document.getElementById('compat-score');
    if (!ring || !scoreEl) return;

    if (total === 0) {
      scoreEl.textContent = '--';
      ring.setAttribute('stroke-dashoffset', '327');
      return;
    }

    const pct = Math.round((matches / total) * 100);
    scoreEl.textContent = pct + '%';
    // Circumference = 2 * PI * 52 ≈ 327
    const offset = 327 - (pct / 100) * 327;
    ring.style.transition = 'stroke-dashoffset 1s ease';
    ring.setAttribute('stroke-dashoffset', String(offset));

    if (pct >= 80) showConfetti();
  });
}

// ===== CONFETTI ANIMATION =====
function showConfetti() {
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden';
  document.body.appendChild(container);

  const colors = ['#1C2B4A', '#2E4468', '#C4784A', '#B08A50', '#3A2860', '#8C4228', '#D4946A'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 600;
    const size = 4 + Math.random() * 6;
    const rotation = Math.random() * 360;
    piece.style.cssText = `position:absolute;top:-10px;left:${left}%;width:${size}px;height:${size * 0.6}px;background:${color};border-radius:1px;transform:rotate(${rotation}deg);animation:confettiFall ${1.5 + Math.random()}s ease-in ${delay}ms forwards`;
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 3000);
}

// ===== DASHBOARD STREAK WIRING =====
function updateDashStreak(data) {
  const numEl = document.getElementById('dash-streak-num');
  if (numEl) numEl.textContent = data.current || 0;
}

// ===== DASHBOARD HERO (time-aware) =====
function renderDashHero() {
  const h = new Date().getHours();
  const timeLabel = document.getElementById('dash-time-label');
  const greeting = document.getElementById('dash-greeting');
  if (timeLabel && greeting) {
    let timeText, greetText;
    if (h < 6) { timeText = 'Late night'; greetText = NAMES[user]; }
    else if (h < 12) { timeText = 'Good morning'; greetText = NAMES[user]; }
    else if (h < 17) { timeText = 'Good afternoon'; greetText = NAMES[user]; }
    else if (h < 21) { timeText = 'Good evening'; greetText = NAMES[user]; }
    else { timeText = 'Good night'; greetText = NAMES[user]; }
    timeLabel.textContent = timeText;
    greeting.textContent = greetText;
  }

  // Calculate "together since" from settings/anniversary
  const togetherNum = document.getElementById('dash-together-num');
  if (togetherNum && db) {
    db.ref('settings/anniversary').once('value', snap => {
      const dateStr = snap.val();
      if (dateStr) {
        const start = new Date(dateStr + 'T00:00:00');
        const now = new Date();
        const days = Math.floor((now - start) / 86400000);
        if (days >= 0) togetherNum.textContent = days;
      } else {
        togetherNum.textContent = '--';
      }
    });
  }
}

// ===== DASHBOARD NUDGES (unread letters, actions needed) =====
function renderDashNudges() {
  const container = document.getElementById('dash-nudges');
  if (!container || !db) return;

  const nudges = [];
  const today = localDate();

  // Check for unread letters
  db.ref('letters').orderByChild('timestamp').limitToLast(10).once('value', snap => {
    let unreadCount = 0;
    snap.forEach(c => {
      const l = c.val();
      if (l.from === partner && !l.read) unreadCount++;
    });

    if (unreadCount > 0) {
      nudges.push(`<div onclick="go('connect')" style="flex-shrink:0;padding:10px 18px;border-radius:50px;background:var(--gold);color:#fff;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">${unreadCount} unread letter${unreadCount > 1 ? 's' : ''} 💌</div>`);
    }

    // Check if user hasn't done mood today
    db.ref('moods').orderByChild('timestamp').limitToLast(10).once('value', moodSnap => {
      let checkedIn = false;
      moodSnap.forEach(c => {
        const m = c.val();
        if (m.user === user && m.date === today) checkedIn = true;
      });

      if (!checkedIn) {
        nudges.push(`<div onclick="go('mood')" style="flex-shrink:0;padding:10px 18px;border-radius:50px;background:var(--card-bg);box-shadow:var(--card-shadow);font-size:12px;color:var(--cream);cursor:pointer;white-space:nowrap;font-weight:500">Check in today ◎</div>`);
      }

      // Check daily question
      db.ref('dailyAnswers/' + today + '/' + user).once('value', dqSnap => {
        if (!dqSnap.exists()) {
          nudges.push(`<div onclick="go('question')" style="flex-shrink:0;padding:10px 18px;border-radius:50px;background:var(--card-bg);box-shadow:var(--card-shadow);font-size:12px;color:var(--cream);cursor:pointer;white-space:nowrap;font-weight:500">Answer today's question ❓</div>`);
        }

        container.innerHTML = nudges.join('');
        if (nudges.length === 0) hideEl(container); else { showEl(container); container.style.display = 'flex'; }
      });
    });
  });
}

// ===== DASHBOARD UPCOMING COUNTDOWN =====
function renderDashCountdown() {
  // Find nearest upcoming countdown and show as a nudge pill
  if (!db) return;
  db.ref('countdowns').once('value', snap => {
    if (!snap.exists()) return;
    const now = new Date();
    let nearest = null, nearestDays = Infinity;
    snap.forEach(c => {
      const cd = c.val();
      if (!cd.date) return;
      const target = new Date(cd.date + 'T00:00:00');
      const diff = Math.ceil((target - now) / 86400000);
      if (diff > 0 && diff < nearestDays) {
        nearestDays = diff;
        nearest = cd;
      }
    });
    if (nearest) {
      const nudges = document.getElementById('dash-nudges');
      if (nudges) {
        const pill = document.createElement('div');
        pill.style.cssText = 'padding:6px 14px;background:var(--tint);border-radius:20px;font-size:11px;color:var(--gold);white-space:nowrap;cursor:pointer';
        pill.textContent = nearestDays + 'd to ' + nearest.title;
        pill.onclick = () => go('story');
        nudges.appendChild(pill);
      }
    }
  });
}

// ===== CONFIRM DIALOG =====
let confirmCallback = null;
function showConfirmDialog(title, msg, actionLabel, cb) {
  const overlay = document.getElementById('confirm-dialog');
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  const actionBtn = document.getElementById('confirm-action');
  actionBtn.textContent = actionLabel || 'Delete';
  actionBtn.className = 'confirm-btn ' + (actionLabel === 'Delete' ? 'danger' : 'primary');
  confirmCallback = cb;
  overlay.classList.add('on');
}
function closeConfirm() { document.getElementById('confirm-dialog').classList.remove('on'); confirmCallback = null; }
function doConfirm() { if (confirmCallback) confirmCallback(); closeConfirm(); }

// ===== DELETE HELPERS =====
function deleteBucketItem(key) {
  showConfirmDialog('Remove item', 'Delete this from your bucket list?', 'Delete', () => {
    db.ref('bucketList/' + key).remove();
    toast('Removed');
  });
}
function deleteDream(key) {
  showConfirmDialog('Remove dream', 'Delete this dream?', 'Delete', () => {
    db.ref('dreams/' + key).remove();
    toast('Removed');
  });
}
function deleteChore(key) {
  showConfirmDialog('Remove task', 'Delete this household task?', 'Delete', () => {
    db.ref('homelife/chores/' + key).remove();
    toast('Removed');
  });
}
function deleteMeal(key) {
  db.ref('homelife/meals/' + key).remove();
  toast('Removed');
}
function deleteSavingsGoal(key) {
  showConfirmDialog('Remove goal', 'Delete this savings goal?', 'Delete', () => {
    db.ref('homelife/savings/' + key).remove();
    toast('Removed');
  });
}
function deleteBabyName(key) {
  db.ref('family/names/' + key).remove();
  toast('Removed');
}
function deleteFamilyGoal(key) {
  db.ref('family/goals/' + key).remove();
  toast('Removed');
}
function deleteWishItem(owner, key) {
  db.ref('wishlists/' + owner + '/' + key).remove();
  toast('Removed');
}
function deleteIntention(key) {
  db.ref('spiritual/intentions/' + key).remove();
  toast('Removed');
}
function deletePersonalGoal(who, key) {
  db.ref('personalGoals/' + who + '/' + key).remove();
  toast('Removed');
}
function deleteDateIdea(key) {
  db.ref('dateNights/' + key).remove();
  toast('Removed');
}

// ===== HUB STATUS UPDATES =====
function updateHubStatuses() {
  if (!db) return;
  updateHubCheckin();
  updateHubBucket();
  updateHubDreams();
  updateHubWishlist();
  updateHubGratitude();
  updateHubDQ();
  updateHubCulture();
  updateHubFoundation();
  updateHubFamily();
  updateHubHomeLife();
  updateHubSpiritual();
  updateHubDateNight();
  updateHubDeepTalk();
  updateHubGames();
  updateHubLL();
}

function updateHubCheckin() {
  const el = document.getElementById('hub-ci-status');
  if (!el || !db) return;
  const week = getWeekId();
  db.ref('checkins/' + week).once('value', snap => {
    const data = snap.val();
    if (!data) { el.textContent = 'Check in'; el.className = 'hub-badge pending'; }
    else if (data[user] && data[partner]) { el.textContent = 'Both done'; el.className = 'hub-badge done'; }
    else if (data[user]) { el.textContent = '1/2 done'; el.className = 'hub-badge count'; }
    else { el.textContent = 'Your turn'; el.className = 'hub-badge pending'; }
  });
}

function updateHubBucket() {
  const el = document.getElementById('hub-bl-status');
  if (!el || !db) return;
  db.ref('bucketList').once('value', snap => {
    if (!snap.exists()) { el.textContent = 'Start'; return; }
    let total = 0, done = 0;
    snap.forEach(c => { total++; if (c.val().completed) done++; });
    el.textContent = done + '/' + total + ' done';
    el.className = done === total && total > 0 ? 'hub-badge done' : 'hub-badge count';
  });
}

function updateHubDreams() {
  const el = document.getElementById('hub-dr-status');
  if (!el || !db) return;
  db.ref('dreams').once('value', snap => {
    if (!snap.exists()) { el.textContent = 'Start'; return; }
    let total = 0, done = 0;
    snap.forEach(c => { total++; if (c.val().achieved) done++; });
    el.textContent = done > 0 ? done + '/' + total : total + ' dreams';
    el.className = 'hub-badge count';
  });
}

function updateHubWishlist() {
  const el = document.getElementById('hub-wl-status');
  if (!el || !db) return;
  db.ref('wishlists').once('value', snap => {
    if (!snap.exists()) { el.textContent = 'Add items'; return; }
    let total = 0;
    snap.forEach(u => { u.forEach(() => total++); });
    el.textContent = total + ' items';
    el.className = 'hub-badge count';
  });
}

function updateHubGratitude() {
  const el = document.getElementById('hub-grat-status');
  if (!el || !db) return;
  const today = localDate();
  db.ref('gratitude').orderByChild('date').equalTo(today).once('value', snap => {
    if (!snap.exists()) { el.textContent = 'Share today'; el.className = 'hub-badge pending'; return; }
    let count = 0; snap.forEach(() => count++);
    el.textContent = count + ' today';
    el.className = 'hub-badge done';
  });
}

function updateHubDQ() {
  const el = document.getElementById('hub-dq-status');
  if (!el || !db) return;
  const today = localDate();
  db.ref('dailyAnswers/' + today).once('value', snap => {
    const data = snap.val();
    if (!data) { el.textContent = 'New'; el.className = 'hub-badge new'; }
    else if (data[user] && data[partner]) { el.textContent = 'Both answered'; el.className = 'hub-badge done'; }
    else if (data[user]) { el.textContent = 'Waiting'; el.className = 'hub-badge count'; }
    else { el.textContent = 'Answer'; el.className = 'hub-badge pending'; }
  });
}

function updateHubCulture() {
  const el = document.getElementById('hub-cx-status');
  if (!el || !db) return;
  let total = 0;
  const promises = [
    db.ref('culture/phrases').once('value').then(s => { if (s.exists()) s.forEach(() => total++); }),
    db.ref('culture/traditions').once('value').then(s => { if (s.exists()) s.forEach(() => total++); }),
    db.ref('culture/recipes').once('value').then(s => { if (s.exists()) s.forEach(() => total++); })
  ];
  Promise.all(promises).then(() => {
    el.textContent = total > 0 ? total + ' items' : 'Start';
    el.className = 'hub-badge count';
  });
}

function updateHubFoundation() {
  const el = document.getElementById('hub-fdn-status');
  if (!el || !db) return;
  db.ref('foundation/values').once('value', snap => {
    let count = 0;
    if (snap.exists()) snap.forEach(() => count++);
    el.textContent = count > 0 ? count + ' values' : 'Define';
    el.className = 'hub-badge count';
  });
}

function updateHubFamily() {
  const el = document.getElementById('hub-fam-status');
  if (!el || !db) return;
  db.ref('family/names').once('value', snap => {
    let count = 0;
    if (snap.exists()) snap.forEach(() => count++);
    el.textContent = count > 0 ? count + ' names' : 'Plan';
    el.className = 'hub-badge count';
  });
}

function updateHubHomeLife() {
  const el = document.getElementById('hub-hl-status');
  if (!el || !db) return;
  db.ref('homelife/chores').once('value', snap => {
    if (!snap.exists()) { el.textContent = 'Set up'; return; }
    let total = 0, done = 0;
    snap.forEach(c => { total++; if (c.val().done) done++; });
    el.textContent = done + '/' + total + ' tasks';
    el.className = done === total && total > 0 ? 'hub-badge done' : 'hub-badge count';
  });
}

function updateHubSpiritual() {
  const el = document.getElementById('hub-sp-status');
  if (!el || !db) return;
  db.ref('spiritual/prayers').orderByChild('timestamp').limitToLast(1).once('value', snap => {
    if (!snap.exists()) { el.textContent = 'Reflect'; el.className = 'hub-badge count'; return; }
    let latest = null;
    snap.forEach(c => latest = c.val());
    if (latest) {
      const ago = timeAgo(new Date(latest.timestamp));
      el.textContent = ago;
      el.className = 'hub-badge count';
    }
  });
}

function updateHubDateNight() {
  const el = document.getElementById('hub-dn-status');
  if (!el || !db) return;
  db.ref('dateNights').once('value', snap => {
    if (!snap.exists()) { el.textContent = 'Spin the wheel'; return; }
    let saved = 0, done = 0;
    snap.forEach(c => { if (c.val().done) done++; else saved++; });
    el.textContent = saved > 0 ? saved + ' saved' : done + ' completed';
  });
}

function updateHubDeepTalk() {
  const el = document.getElementById('hub-dt-status');
  if (!el || !db) return;
  db.ref('deepTalkJournal').once('value', snap => {
    if (!snap.exists()) { el.textContent = 'Start a conversation'; return; }
    let count = 0; snap.forEach(() => count++);
    el.textContent = count + ' reflections';
  });
}

function updateHubGames() {
  const el = document.getElementById('hub-games-status');
  if (!el) return;
  const compatEl = document.getElementById('compat-score');
  if (compatEl && compatEl.textContent !== '--') {
    el.textContent = compatEl.textContent + ' match';
    el.className = 'hub-badge done';
  } else {
    el.textContent = 'Play';
    el.className = 'hub-badge count';
  }
}

function updateHubLL() {
  const el = document.getElementById('hub-ll-status');
  if (!el || !db) return;
  db.ref('loveLang').once('value', snap => {
    const data = snap.val();
    if (!data) { el.textContent = 'Take quiz'; el.className = 'hub-badge pending'; return; }
    if (data[user] && data[partner]) { el.textContent = 'Both done'; el.className = 'hub-badge done'; }
    else if (data[user]) { el.textContent = 'You\'re done'; el.className = 'hub-badge count'; }
    else { el.textContent = 'Take quiz'; el.className = 'hub-badge pending'; }
  });
}

// ===== MODULE STATUS STRIPS =====
function updateModuleStats() {
  updateBLStats();
  updateDRStats();
  updateHLStats();
  updateCXStats();
  updateSPStats();
  updateFDNStats();
  updateFAMStats();
  updateGamesStats();
}

function updateBLStats() {
  const el = document.getElementById('bl-stats');
  if (!el || !db) return;
  db.ref('bucketList').once('value', snap => {
    if (!snap.exists()) { el.innerHTML = ''; return; }
    let total = 0, done = 0;
    snap.forEach(c => { total++; if (c.val().completed) done++; });
    const pct = total ? Math.round((done/total)*100) : 0;
    el.innerHTML = `
      <div class="mod-stat"><div class="mod-stat-num">${total}</div><div class="mod-stat-label">Total</div></div>
      <div class="mod-stat"><div class="mod-stat-num">${done}</div><div class="mod-stat-label">Done</div></div>
      <div class="mod-stat" style="flex:1;min-width:100px"><div style="font-size:11px;color:var(--t2);margin-bottom:4px">${pct}% complete</div><div class="prog-bar"><div class="prog-fill" style="width:${pct}%"></div></div></div>`;
  });
}

// updateDRStats moved to modules-social.js renderDreams

function updateHLStats() {
  const el = document.getElementById('hl-stats');
  if (!el || !db) return;
  let savings = 0, target = 0, choresTotal = 0, choresDone = 0, meals = 0;
  Promise.all([
    db.ref('homelife/savings').once('value').then(s => {
      if (s.exists()) s.forEach(c => { const v = c.val(); savings += v.saved||0; target += v.target||0; });
    }),
    db.ref('homelife/chores').once('value').then(s => {
      if (s.exists()) s.forEach(c => { choresTotal++; if (c.val().done) choresDone++; });
    }),
    db.ref('homelife/meals').once('value').then(s => {
      if (s.exists()) s.forEach(() => meals++);
    })
  ]).then(() => {
    const parts = [];
    if (target > 0) parts.push(`<div class="mod-stat"><div class="mod-stat-num">$${Math.round(savings/1000)}k</div><div class="mod-stat-label">Saved</div></div>`);
    if (choresTotal > 0) parts.push(`<div class="mod-stat"><div class="mod-stat-num">${choresDone}/${choresTotal}</div><div class="mod-stat-label">Tasks</div></div>`);
    if (meals > 0) parts.push(`<div class="mod-stat"><div class="mod-stat-num">${meals}</div><div class="mod-stat-label">Meals</div></div>`);
    el.innerHTML = parts.join('');
  });
}

function updateCXStats() {
  const el = document.getElementById('cx-stats');
  if (!el || !db) return;
  let phrases = 0, traditions = 0, recipes = 0;
  Promise.all([
    db.ref('culture/phrases').once('value').then(s => { if (s.exists()) s.forEach(() => phrases++); }),
    db.ref('culture/traditions').once('value').then(s => { if (s.exists()) s.forEach(() => traditions++); }),
    db.ref('culture/recipes').once('value').then(s => { if (s.exists()) s.forEach(() => recipes++); })
  ]).then(() => {
    if (phrases + traditions + recipes === 0) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="mod-stat"><div class="mod-stat-num">${phrases}</div><div class="mod-stat-label">Phrases</div></div>
      <div class="mod-stat"><div class="mod-stat-num">${traditions}</div><div class="mod-stat-label">Traditions</div></div>
      <div class="mod-stat"><div class="mod-stat-num">${recipes}</div><div class="mod-stat-label">Recipes</div></div>`;
  });
}

function updateSPStats() {
  const el = document.getElementById('sp-stats');
  if (!el || !db) return;
  let prayers = 0, blessings = 0, intentions = 0;
  Promise.all([
    db.ref('spiritual/prayers').once('value').then(s => { if (s.exists()) s.forEach(() => prayers++); }),
    db.ref('spiritual/blessings').once('value').then(s => { if (s.exists()) s.forEach(() => blessings++); }),
    db.ref('spiritual/intentions').once('value').then(s => { if (s.exists()) s.forEach(() => intentions++); })
  ]).then(() => {
    if (prayers + blessings + intentions === 0) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="mod-stat"><div class="mod-stat-num">${prayers}</div><div class="mod-stat-label">Prayers</div></div>
      <div class="mod-stat"><div class="mod-stat-num">${blessings}</div><div class="mod-stat-label">Blessings</div></div>
      <div class="mod-stat"><div class="mod-stat-num">${intentions}</div><div class="mod-stat-label">Intentions</div></div>`;
  });
}

function updateFDNStats() {
  const el = document.getElementById('fdn-stats');
  if (!el || !db) return;
  let values = 0, agrees = 0;
  Promise.all([
    db.ref('foundation/values').once('value').then(s => { if (s.exists()) s.forEach(() => values++); }),
    db.ref('foundation/agreements/' + user).once('value').then(s => {
      const data = s.val() || {};
      agrees = Object.values(data).filter(Boolean).length;
    })
  ]).then(() => {
    if (values === 0 && agrees === 0) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <div class="mod-stat"><div class="mod-stat-num">${values}</div><div class="mod-stat-label">Values</div></div>
      <div class="mod-stat"><div class="mod-stat-num">${agrees}/6</div><div class="mod-stat-label">Agreed</div></div>`;
  });
}

function updateFAMStats() {
  const el = document.getElementById('fam-stats');
  if (!el || !db) return;
  let names = 0, goals = 0;
  Promise.all([
    db.ref('family/names').once('value').then(s => { if (s.exists()) s.forEach(() => names++); }),
    db.ref('family/goals').once('value').then(s => { if (s.exists()) s.forEach(() => goals++); })
  ]).then(() => {
    if (names === 0 && goals === 0) { el.innerHTML = ''; return; }
    const parts = [];
    if (names > 0) parts.push(`<div class="mod-stat"><div class="mod-stat-num">${names}</div><div class="mod-stat-label">Names</div></div>`);
    if (goals > 0) parts.push(`<div class="mod-stat"><div class="mod-stat-num">${goals}</div><div class="mod-stat-label">Goals</div></div>`);
    el.innerHTML = parts.join('');
  });
}

function updateGamesStats() {
  const el = document.getElementById('games-stats');
  if (!el) return;
  const compatEl = document.getElementById('compat-score');
  const pct = compatEl ? compatEl.textContent : '--';
  el.innerHTML = `<div class="mod-stat"><div class="mod-stat-num">${pct}</div><div class="mod-stat-label">Match</div></div>`;
}

function updateDNStats() {
  const el = document.getElementById('dn-stats');
  if (!el || !db) return;
  db.ref('dateNights').once('value', snap => {
    if (!snap.exists()) { el.innerHTML = ''; return; }
    let saved = 0, done = 0;
    snap.forEach(c => { if (c.val().done) done++; else saved++; });
    el.innerHTML = `
      <div class="mod-stat"><div class="mod-stat-num">${saved}</div><div class="mod-stat-label">Saved</div></div>
      <div class="mod-stat"><div class="mod-stat-num">${done}</div><div class="mod-stat-label">Done</div></div>
      <div class="mod-stat"><div class="mod-stat-num">${saved + done}</div><div class="mod-stat-label">Total</div></div>`;
  });
}

// ===== DASHBOARD QUICK NAV STATUS =====
function updateDashQuickNav() {
  if (!db) return;

  // Letters count
  db.ref('letters').orderByChild('timestamp').limitToLast(50).once('value', snap => {
    let total = 0;
    if (snap.exists()) snap.forEach(() => total++);
    const el = document.getElementById('dash-qn-letters');
    if (el) el.textContent = total > 0 ? total + ' total' : 'Write';
  });

  // Compat score
  setTimeout(() => {
    const compatEl = document.getElementById('compat-score');
    const el = document.getElementById('dash-qn-compat');
    if (el) el.textContent = compatEl && compatEl.textContent !== '--' ? compatEl.textContent + ' match' : 'Play';
  }, 2000);

  // Date nights
  db.ref('dateNights').once('value', snap => {
    let saved = 0;
    if (snap.exists()) snap.forEach(c => { if (!c.val().done) saved++; });
    const el = document.getElementById('dash-qn-dates');
    if (el) el.textContent = saved > 0 ? saved + ' saved' : 'Spin';
  });

  // Deep talk reflections
  db.ref('deepTalkJournal').once('value', snap => {
    let count = 0;
    if (snap.exists()) snap.forEach(() => count++);
    const el = document.getElementById('dash-qn-talks');
    if (el) el.textContent = count > 0 ? count + ' notes' : 'Start';
  });
}


// ===== US/ME VIEW TOGGLE =====
let viewMode = localStorage.getItem('met_viewMode') || 'us';

function setViewMode(mode) {
  viewMode = mode;
  localStorage.setItem('met_viewMode', mode);
  document.querySelectorAll('.vt-option').forEach(e => e.classList.toggle('active', e.dataset.mode === mode));
  const slider = document.getElementById('vt-slider');
  if (slider) slider.classList.toggle('me', mode === 'me');
  if (mode === 'us') { showEl('dash-us'); hideEl('dash-me'); } else { hideEl('dash-us'); showEl('dash-me'); }
  if (mode === 'me') renderMeDashboard();
}

function initViewToggle() {
  setViewMode(viewMode);
}

function renderMeDashboard() {
  if (!db || !user) return;
  // Personal mood average
  db.ref('moods').orderByChild('timestamp').limitToLast(30).once('value', snap => {
    const moods = [];
    snap.forEach(c => { const m = c.val(); if (m.user === user) moods.push(m); });
    if (moods.length > 0) {
      const avgMood = (moods.reduce((s,m) => s + m.mood, 0) / moods.length).toFixed(1);
      const avgEnergy = (moods.reduce((s,m) => s + (m.energy||3), 0) / moods.length).toFixed(1);
      const el = document.getElementById('dash-me-mood-avg');
      if (el) el.textContent = avgMood;
      const eEl = document.getElementById('dash-me-energy');
      if (eEl) eEl.textContent = avgEnergy;
    }
    // Render personal mood chart
    renderMeMoodChart(moods.slice(-7));
  });
  // Personal goals count
  const who = user;
  db.ref('personalGoals/' + who).once('value', snap => {
    let done = 0, total = 0;
    if (snap.exists()) snap.forEach(c => { total++; if (c.val().done) done++; });
    const el = document.getElementById('dash-me-goals');
    if (el) el.textContent = done;
    // Personal growth score
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const ring = document.getElementById('dash-me-ring');
    if (ring) ring.setAttribute('stroke-dashoffset', String(314 - (pct / 100) * 314));
    const scoreEl = document.getElementById('dash-me-score');
    if (scoreEl) scoreEl.textContent = pct + '%';
    // Goals list
    const listEl = document.getElementById('dash-me-goals-list');
    if (listEl && snap.exists()) {
      const items = [];
      snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); });
      items.reverse();
      if (items.length > 0) {
        listEl.innerHTML = items.slice(0, 5).map(i =>
          `<div class="dash-goal-item">
            <div class="dash-goal-check${i.done?' done':''}">${i.done?'✓':''}</div>
            <div class="dash-goal-text${i.done?' done':''}">${i.title}</div>
          </div>`
        ).join('');
      }
    }
  });
}

function renderMeMoodChart(moods) {
  const chartEl = document.getElementById('me-chart-line');
  const areaEl = document.getElementById('me-chart-area');
  if (!chartEl || !areaEl || moods.length < 2) return;
  const w = 295, h = 80, startX = 20, startY = 10;
  const stepX = w / (moods.length - 1);
  let linePath = '', areaPath = `M${startX},${startY + h} `;
  moods.forEach((m, i) => {
    const x = startX + i * stepX;
    const y = startY + h - ((m.mood - 1) / 4) * h;
    linePath += (i === 0 ? 'M' : 'L') + x + ',' + y + ' ';
    areaPath += (i === 0 ? 'L' : 'L') + x + ',' + y + ' ';
  });
  areaPath += `L${startX + (moods.length - 1) * stepX},${startY + h} Z`;
  chartEl.setAttribute('d', linePath);
  areaEl.setAttribute('d', areaPath);
}

// ===== DASHBOARD SPARKLINE (compact mood trend) =====
function renderDashSparkline(moods) {
  const el = document.getElementById('dash-sparkline');
  if (!el) return;
  const userMoods = moods.filter(m => m.user === user).slice(-7);
  if (userMoods.length < 2) {
    el.innerHTML = '<div style="font-size:18px;color:var(--t3);text-align:center;line-height:24px">--</div>';
    return;
  }
  const w = el.clientWidth || 60, h = 28;
  const stepX = w / (userMoods.length - 1);
  let d = '';
  userMoods.forEach((m, i) => {
    const x = i * stepX;
    const y = h - ((m.mood - 1) / 4) * h;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1) + ' ';
  });
  el.innerHTML = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="overflow:visible"><path d="' + d + '" fill="none" stroke="var(--gold)" stroke-width="1.5" stroke-linecap="round"/></svg>';
}

// ===== RELATIONSHIP HEALTH SCORE =====
function calculateRelationshipPulse() {
  if (!db || !user) return;
  const today = localDate();
  const week = getWeekId();
  let score = 0, maxScore = 0;

  Promise.all([
    // Communication: taps + letters in last 7 days
    db.ref('taps').orderByChild('timestamp').limitToLast(20).once('value'),
    db.ref('letters').orderByChild('timestamp').limitToLast(10).once('value'),
    // Mood: both checked in today
    db.ref('moods').orderByChild('date').equalTo(today).once('value'),
    // Weekly check-in
    db.ref('checkins/' + week).once('value'),
    // Games played
    db.ref('games/wyr').once('value'),
    db.ref('games/tot').once('value'),
    // Gratitude
    db.ref('gratitude').orderByChild('timestamp').limitToLast(10).once('value'),
    // Deep talk
    db.ref('deepTalkJournal').orderByChild('timestamp').limitToLast(5).once('value'),
  ]).then(([taps, letters, todayMoods, checkin, wyr, tot, gratitude, deepTalk]) => {
    const now = Date.now();
    const weekMs = 7 * 86400000;

    // Communication score (max 25)
    maxScore += 25;
    let recentTaps = 0, recentLetters = 0;
    if (taps.exists()) taps.forEach(c => { if (now - c.val().timestamp < weekMs) recentTaps++; });
    if (letters.exists()) letters.forEach(c => { if (now - c.val().timestamp < weekMs) recentLetters++; });
    score += Math.min(25, (recentTaps * 2) + (recentLetters * 5));

    // Mood score (max 20)
    maxScore += 20;
    let bothMood = false;
    if (todayMoods.exists()) {
      let userMood = false, partnerMood = false;
      todayMoods.forEach(c => {
        const m = c.val();
        if (m.user === user) userMood = true;
        if (m.user === partner) partnerMood = true;
      });
      bothMood = userMood && partnerMood;
    }
    if (bothMood) score += 20;

    // Check-in score (max 20)
    maxScore += 20;
    if (checkin.exists()) {
      const data = checkin.val();
      if (data && data[user] && data[partner]) score += 20;
      else if (data && (data[user] || data[partner])) score += 10;
    }

    // Games score (max 15)
    maxScore += 15;
    let gamesPlayed = 0;
    if (wyr.exists()) wyr.forEach(c => { const d = c.val(); if (d && d[user] && d[partner]) gamesPlayed++; });
    if (tot.exists()) tot.forEach(c => { const d = c.val(); if (d && d[user] && d[partner]) gamesPlayed++; });
    score += Math.min(15, gamesPlayed * 2);

    // Gratitude score (max 10)
    maxScore += 10;
    let recentGrat = 0;
    if (gratitude.exists()) gratitude.forEach(c => { if (now - c.val().timestamp < weekMs) recentGrat++; });
    score += Math.min(10, recentGrat * 3);

    // Deep talk score (max 10)
    maxScore += 10;
    let recentDeep = 0;
    if (deepTalk.exists()) deepTalk.forEach(c => { if (now - c.val().timestamp < weekMs * 2) recentDeep++; });
    score += Math.min(10, recentDeep * 5);

    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    // Update pulse ring
    const ring = document.getElementById('dash-pulse-ring');
    const scoreEl = document.getElementById('dash-pulse-score');
    const labelEl = document.getElementById('dash-pulse-label');
    const tipEl = document.getElementById('dash-pulse-tip');
    if (ring) ring.setAttribute('stroke-dashoffset', String(314 - (pct / 100) * 314));
    if (scoreEl) scoreEl.textContent = pct;

    if (pct >= 80) { if (labelEl) labelEl.textContent = 'Thriving'; if (tipEl) tipEl.textContent = 'You two are on fire together'; }
    else if (pct >= 60) { if (labelEl) labelEl.textContent = 'Strong'; if (tipEl) tipEl.textContent = 'Keep the momentum going'; }
    else if (pct >= 40) { if (labelEl) labelEl.textContent = 'Growing'; if (tipEl) tipEl.textContent = 'Try a game or deep talk together'; }
    else if (pct >= 20) { if (labelEl) labelEl.textContent = 'Warming up'; if (tipEl) tipEl.textContent = 'Check in with each other today'; }
    else { if (labelEl) labelEl.textContent = 'Getting started'; if (tipEl) tipEl.textContent = 'Start with a mood check-in'; }
  });
}

// ===== ACTIVITY FEED =====
function logActivity(module, description) {
  if (!db || !user) return;
  db.ref('activity').push({
    module, description, user, userName: NAMES[user], timestamp: Date.now()
  });
}

function renderActivityFeed() {
  if (!db) return;
  db.ref('activity').orderByChild('timestamp').limitToLast(12).on('value', snap => {
    const el = document.getElementById('dash-activity-feed');
    if (!el) return;
    const items = [];
    snap.forEach(c => items.push(c.val()));
    items.reverse();
    if (!items.length) { el.innerHTML = '<div class="empty" style="padding:16px">Activity from both of you shows here</div>'; return; }

    function renderItem(i) {
      const ts = timeAgo(new Date(i.timestamp));
      const isMe = i.user === user;
      return `<div class="act-item">
        <div class="act-avatar ${isMe?'me':'them'}">${(isMe ? 'You' : i.userName).charAt(0)}</div>
        <div class="act-body">${isMe ? 'You' : i.userName} ${i.description}</div>
        <div class="act-time">${ts}</div>
      </div>`;
    }

    let html = items.slice(0, 3).map(renderItem).join('');
    if (items.length > 3) {
      html += `<div id="activity-extra" class="d-none">${items.slice(3).map(renderItem).join('')}</div>`;
      html += `<div id="activity-toggle" class="act-more" onclick="toggleActivityFeed()">Show more</div>`;
    }
    el.innerHTML = html;
  });
}

function toggleActivityFeed() {
  const extra = document.getElementById('activity-extra');
  const toggle = document.getElementById('activity-toggle');
  if (!extra || !toggle) return;
  const hidden = extra.classList.contains('d-none');
  extra.classList.toggle('d-none');
  toggle.textContent = hidden ? 'Show less' : 'Show more';
}

// ===== ME DASHBOARD: GRATITUDE + AFFIRMATION =====
function renderDashMeGratitude() {
  if (!db) return;
  const card = document.getElementById('dash-me-gratitude');
  const list = document.getElementById('dash-me-grat-list');
  if (!card || !list) return;
  db.ref('gratitude').orderByChild('timestamp').limitToLast(5).once('value', snap => {
    if (!snap.exists()) return;
    const items = [];
    snap.forEach(c => { const v = c.val(); if (v.from === user) items.push(v); });
    if (!items.length) return;
    items.reverse();
    list.innerHTML = items.slice(0, 3).map(i =>
      `<div class="d-flex gap-8 items-baseline mb-4"><span class="c-gold" style="font-size:10px">&#9679;</span><span>${esc(i.message || '')}</span></div>`
    ).join('');
    showEl(card);
  });
}

function renderDashMeAffirmation() {
  const card = document.getElementById('dash-me-affirmation');
  const text = document.getElementById('dash-me-affirm-text');
  if (!card || !text) return;
  const affirmations = [
    "I am worthy of love and kindness, starting with myself.",
    "Today I choose progress over perfection.",
    "My feelings are valid. I honor them without judgment.",
    "I am building a life I'm proud of, one step at a time.",
    "I bring value to my relationship and to the world.",
    "I am growing stronger and wiser every day.",
    "I deserve rest, joy, and peace.",
    "I trust my journey, even when I can't see the full path."
  ];
  const idx = Math.floor(Date.now() / 86400000) % affirmations.length;
  text.textContent = affirmations[idx];
  showEl(card);
}

// ===== DAILY QUESTION PREVIEW ON DASHBOARD =====
function renderDashDailyQ() {
  if (!db) return;
  const card = document.getElementById('dash-daily-q');
  const textEl = document.getElementById('dash-dq-text');
  const statusEl = document.getElementById('dash-dq-status');
  if (!card || !textEl) return;
  const today = localDate();

  db.ref('dailyQuestion').once('value', snap => {
    const q = snap.val();
    if (!q || !q.text) return;
    textEl.textContent = q.text;
    showEl(card);

    // Check who answered
    db.ref('dailyAnswers/' + today).once('value', aSnap => {
      const answers = aSnap.val() || {};
      const youDone = !!answers[user];
      const partnerDone = !!answers[partner];
      if (statusEl) {
        if (youDone && partnerDone) statusEl.textContent = 'Both answered';
        else if (youDone) statusEl.textContent = 'Waiting for ' + NAMES[partner];
        else statusEl.textContent = 'Tap to answer';
      }
    });
  });
}

// ===== SMART NUDGES (ENHANCED) =====
function renderSmartNudges() {
  const container = document.getElementById('dash-nudges');
  if (!container || !db) return;
  const nudges = [];
  const today = localDate();
  const now = Date.now();
  const week = getWeekId();

  Promise.all([
    db.ref('letters').orderByChild('timestamp').limitToLast(10).once('value'),
    db.ref('moods').orderByChild('timestamp').limitToLast(10).once('value'),
    db.ref('dailyAnswers/' + today + '/' + user).once('value'),
    db.ref('checkins/' + week + '/' + user).once('value'),
    db.ref('deepTalkJournal').orderByChild('timestamp').limitToLast(1).once('value'),
    db.ref('games/wyr').once('value'),
    db.ref('dateNights').once('value'),
    db.ref('countdowns').once('value'),
  ]).then(([letters, moods, dq, checkin, deepTalk, games, dates, countdowns]) => {
    // Unread letters
    let unread = 0;
    if (letters.exists()) letters.forEach(c => { const l = c.val(); if (l.from === partner && !l.read) unread++; });
    if (unread > 0) nudges.push({ text: unread + ' unread letter' + (unread>1?'s':'') + ' 💌', page: 'connect', priority: true });

    // Mood
    let checkedIn = false;
    if (moods.exists()) moods.forEach(c => { if (c.val().user === user && c.val().date === today) checkedIn = true; });
    if (!checkedIn) nudges.push({ text: 'Check in today', page: 'mood' });

    // Daily question
    if (!dq.exists()) nudges.push({ text: 'Answer today\'s question', page: 'question' });

    // Weekly check-in
    if (!checkin.exists()) nudges.push({ text: 'Weekly check-in', page: 'checkin' });

    // Deep talk (if older than 2 weeks)
    let lastDeep = 0;
    if (deepTalk.exists()) deepTalk.forEach(c => { lastDeep = Math.max(lastDeep, c.val().timestamp); });
    if (now - lastDeep > 14 * 86400000) nudges.push({ text: 'Deep talk time', page: 'deeptalk' });

    // Date night
    let savedDates = 0;
    if (dates.exists()) dates.forEach(c => { if (!c.val().done) savedDates++; });
    if (savedDates === 0) nudges.push({ text: 'Spin for a date', page: 'datenight' });

    // Upcoming countdown
    if (countdowns.exists()) {
      let nearest = null, nearestDays = Infinity;
      countdowns.forEach(c => {
        const cd = c.val();
        if (!cd.date) return;
        const diff = Math.ceil((new Date(cd.date + 'T00:00:00') - new Date()) / 86400000);
        if (diff > 0 && diff < nearestDays) { nearestDays = diff; nearest = cd; }
      });
      if (nearest) nudges.push({ text: nearestDays + 'd to ' + nearest.title, page: 'story', countdown: true });
    }

    container.innerHTML = nudges.slice(0, 6).map(n => {
      const bg = n.priority ? 'var(--gold)' : n.countdown ? 'var(--tint)' : 'var(--card-bg)';
      const color = n.priority ? '#fff' : n.countdown ? 'var(--gold)' : 'var(--cream)';
      const border = n.priority ? 'transparent' : 'var(--bdr-s)';
      const dot = (!n.countdown && !n.priority) ? '<span class="nudge-dot"></span>' : '';
      return `<div onclick="go('${n.page}')" style="position:relative;padding:7px 14px;border-radius:50px;background:${bg};color:${color};font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;box-shadow:var(--card-shadow);border:1px solid ${border}">${dot}${n.text}</div>`;
    }
    ).join('');
    container.style.display = nudges.length === 0 ? 'none' : 'flex';
  });
}

// ===== DAILY TASKS CHECKLIST =====
function renderDailyTasks() {
  if (!db || !user) return;
  const today = localDate();
  const week = getWeekId();

  Promise.all([
    db.ref('moods').orderByChild('timestamp').limitToLast(10).once('value'),
    db.ref('dailyAnswers/' + today + '/' + user).once('value'),
    db.ref('checkins/' + week + '/' + user).once('value'),
    db.ref('gratitude').orderByChild('timestamp').limitToLast(5).once('value'),
  ]).then(([moods, dq, checkin, gratitude]) => {
    // Check mood
    let moodDone = false;
    if (moods.exists()) moods.forEach(c => { if (c.val().user === user && c.val().date === today) moodDone = true; });

    // Check daily question
    const dqDone = dq.exists();

    // Check weekly check-in
    const checkinDone = checkin.exists();

    // Check gratitude today
    let gratDone = false;
    if (gratitude.exists()) gratitude.forEach(c => { const v = c.val(); if (v.from === user && v.timestamp && localDate(new Date(v.timestamp)) === today) gratDone = true; });

    const tasks = [
      { label: 'Mood check-in', done: moodDone, page: 'mood', desc: 'How are you feeling today?' },
      { label: 'Daily question', done: dqDone, page: 'question', desc: 'Answer & see your partner\'s answer' },
      { label: 'Share gratitude', done: gratDone, page: 'gratitude', desc: 'What are you grateful for?' },
      { label: 'Weekly check-in', done: checkinDone, page: 'checkin', desc: 'Reflect on the week together' },
    ];

    const doneCount = tasks.filter(t => t.done).length;

    // Render for both Us and Me dashboards
    renderTaskList('dash-daily-tasks', 'dash-tasks-list', 'dash-tasks-count', tasks, doneCount);
    renderTaskList('dash-me-daily-tasks', 'dash-me-tasks-list', 'dash-me-tasks-count', tasks, doneCount);

    // Trigger daily notification check
    checkDailyNotification(tasks, doneCount);
  });
}

function renderTaskList(containerId, listId, countId, tasks, doneCount) {
  const container = document.getElementById(containerId);
  const list = document.getElementById(listId);
  const count = document.getElementById(countId);
  if (!container || !list) return;

  count.textContent = doneCount + '/' + tasks.length + ' done';
  list.innerHTML = tasks.map(t => {
    const checkColor = t.done ? 'var(--gold)' : 'var(--bg3)';
    const checkIcon = t.done
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>'
      : '<div style="width:14px;height:14px;border-radius:50%;border:2px solid var(--t3)"></div>';
    const textColor = t.done ? 'var(--t3)' : 'var(--cream)';
    const textDecor = t.done ? 'line-through' : 'none';
    return `<div class="dash-task" onclick="go('${t.page}')">
      <div class="dash-task-check${t.done?' done':''}">${checkIcon}</div>
      <div style="flex:1;min-width:0">
        <div class="dash-task-label${t.done?' done':''}">${t.label}</div>
        ${!t.done ? '<div class="dash-task-desc">' + t.desc + '</div>' : ''}
      </div>
      ${!t.done ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>' : ''}
    </div>`;
  }).join('');
  showEl(container);
}

// ===== PUSH NOTIFICATIONS FOR DAILY TASKS =====
function initNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    // Delay permission request so it's not jarring on first load
    setTimeout(() => {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') scheduleDailyReminder();
      });
    }, 8000);
  } else if (Notification.permission === 'granted') {
    scheduleDailyReminder();
  }
}

function scheduleDailyReminder() {
  const REMINDER_KEY = 'met_last_reminder';
  const CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour (not 30 min - less aggressive)

  function check() {
    if (!db || !user) return;
    const today = localDate();
    const lastReminder = localStorage.getItem(REMINDER_KEY);
    if (lastReminder === today) return;

    const now = new Date();
    const hour = now.getHours();
    // Only remind between 10am and 8pm - respect quiet hours
    if (hour < 10 || hour > 20) return;

    // Check the two most important daily tasks (mood + daily question)
    Promise.all([
      db.ref('moods').orderByChild('timestamp').limitToLast(10).once('value'),
      db.ref('dailyAnswers/' + today + '/' + user).once('value'),
    ]).then(([moods, dq]) => {
      let moodDone = false;
      if (moods.exists()) moods.forEach(c => { if (c.val().user === user && c.val().date === today) moodDone = true; });
      const dqDone = dq.exists();

      // Only notify if at least one core task is pending
      if (!moodDone || !dqDone) {
        const pending = [];
        if (!moodDone) pending.push('mood check-in');
        if (!dqDone) pending.push('daily question');
        sendNotification(pending);
        localStorage.setItem(REMINDER_KEY, today);
      }
    });
  }

  // Initial check after a longer delay (don't notify right after login)
  setTimeout(check, 30000);
  setInterval(check, CHECK_INTERVAL);
}

function sendNotification(pendingTasks) {
  if (Notification.permission !== 'granted') return;
  // Warm, friendly messages that feel personal
  const msgs = {
    1: {
      'mood check-in': 'Take a moment to check in with yourself today',
      'daily question': 'A new question is waiting for you and your partner',
    },
    multi: 'Your mood check-in and daily question are waiting for you'
  };
  const body = pendingTasks.length === 1
    ? (msgs[1][pendingTasks[0]] || 'You have something waiting for you')
    : msgs.multi;
  try {
    new Notification('Moi & Toi', {
      body: body,
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-96x96.png',
      tag: 'daily-reminder',
      renotify: false,
      silent: false,
    });
  } catch(e) {}
}

function checkDailyNotification(tasks, doneCount) {
  if (doneCount < tasks.length) initNotifications();
}

// ===== WIRE UP STATUS UPDATES =====
// Override go() to refresh statuses when navigating
const _originalGo = go;
go = function(p) {
  _originalGo(p);
  if (p === 'explore' || p === 'more') { updateHubStatuses(); }
  if (p === 'together' || p === 'wellness' || p === 'plan') { updateHubStatuses(); updateModuleStats(); }
  if (p === 'bucket') updateBLStats();
  if (p === 'dreams') updateDRStats();
  if (p === 'lists') updateBLStats();
  if (p === 'homelife') updateHLStats();
  if (p === 'culture') updateCXStats();
  if (p === 'spiritual') updateSPStats();
  if (p === 'foundation') updateFDNStats();
  if (p === 'family') updateFAMStats();
  if (p === 'games') updateGamesStats();
  if (p === 'datenight') updateDNStats();
  if (p === 'connect') { loadVoiceNoteFeed(); }
  if (p === 'dash') { renderDailyTasks(); renderDashHero(); checkPartnerVoiceNote(); }
  if (p === 'settings') { loadSettings(); }
  if (p === 'fitness') renderFitnessHub();
  if (p === 'nutrition') renderNutritionDay();
  if (p === 'calendar') renderCalendar();
  if (p === 'dreamhome') { renderDreamHome(); dhLoadAll(); }
  if (p === 'knowyou') renderKnowYou();
  if (p === 'wakeup') initWakeUp();
  if (p === 'memories') renderMemories();
  if (p === 'achievements') { renderAchievements(); checkAchievements(); }
  if (p === 'mood') renderStreakCalendar();
  if (p === 'story') { updateModuleStats(); }
  // Update presence
  if (db && user) db.ref('presence/' + user + '/currentPage').set(p);
};

// ===== SETTINGS =====
function loadSettings() {
  const nameEl = document.getElementById('set-name');
  const annivEl = document.getElementById('set-anniversary');
  const partnerEl = document.getElementById('set-partner-name');
  const bdayEl = document.getElementById('set-birthday');
  const nickEl = document.getElementById('set-nickname');
  if (nameEl) nameEl.value = NAMES[user] || '';
  if (partnerEl) partnerEl.value = NAMES[partner] || '';
  // Nickname
  if (nickEl) {
    var nickKey = user === 'him' ? 'himCallsHer' : 'herCallsHim';
    nickEl.value = NICKNAMES[nickKey] || '';
  }
  if (annivEl && db) {
    db.ref('settings/anniversary').once('value', snap => {
      if (snap.val()) annivEl.value = snap.val();
    });
  }
  // Birthday
  if (bdayEl && db && user) {
    db.ref('settings/birthday/' + user).once('value', snap => {
      if (snap.val()) bdayEl.value = snap.val();
    });
  }
  // Living Sky toggle
  const skyToggle = document.getElementById('set-living-sky');
  if (skyToggle && db && user) {
    db.ref('settings/livingSky/' + user).once('value', snap => {
      var val = snap.val();
      var enabled = val !== false; // default to true
      skyToggle.checked = enabled;
      livingSkyEnabled = enabled;
      setLivingSky(enabled);
    });
  }
  // Sky theme
  if (db && user) {
    db.ref('settings/skyTheme/' + user).once('value', snap => {
      var theme = snap.val() || 'mixed';
      document.querySelectorAll('#set-sky-theme .sky-theme-btn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-theme') === theme);
      });
    });
  }
  // Weather settings
  loadWeatherSettings();
  // Shared music feed
  loadSharedMusicFeed();
}

function toggleLivingSkySetting(on) {
  livingSkyEnabled = on;
  setLivingSky(on);
  if (db && user) {
    db.ref('settings/livingSky/' + user).set(on);
  }
}

function setSkyTheme(theme) {
  if (db && user) {
    db.ref('settings/skyTheme/' + user).set(theme);
  }
  // Update UI
  document.querySelectorAll('#set-sky-theme .sky-theme-btn, #ob-sky-theme-grid .sky-theme-btn').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-theme') === theme);
  });
  if (typeof applySkyTheme === 'function') applySkyTheme(theme);
  // Update scene selection UI to match the synced scene
  var sceneMap = { beach: 'coastal', mountain: 'forest', mixed: 'meadow' };
  var scene = sceneMap[theme] || 'meadow';
  document.querySelectorAll('.scene-option').forEach(function(opt) {
    opt.classList.toggle('active', opt.getAttribute('data-scene') === scene);
  });
  var envNames = { beach: 'Beach', mountain: 'Mountain', mixed: 'Mixed' };
  toast((envNames[theme] || 'Mixed') + ' environment activated');
}

// ===== WEATHER SETTINGS =====
function handleLocationSettingsBtn() {
  var btn = document.getElementById('set-location-btn');
  if (WEATHER.locationGranted) {
    // Already granted - refresh weather
    fetchWeather().then(function() {
      updateWeatherInfoUI();
      var container = document.getElementById('sky-scene');
      if (container && livingSkyEnabled) renderLivingSky(container);
      toast('Weather refreshed');
    });
  } else {
    showLocationPrompt();
  }
}

function loadWeatherSettings() {
  // Update location button state
  var btn = document.getElementById('set-location-btn');
  if (btn && WEATHER.locationGranted) {
    btn.textContent = 'Refresh';
  }
  // Show weather info if available
  var infoEl = document.getElementById('weather-info-display');
  if (infoEl && WEATHER.data) {
    infoEl.classList.remove('d-none');
    updateWeatherInfoUI();
  }
  // Audio toggle
  var audioToggle = document.getElementById('set-ambient-audio');
  if (audioToggle) audioToggle.checked = WEATHER.audioEnabled;
  // Scene selection
  document.querySelectorAll('.scene-option').forEach(function(opt) {
    opt.classList.toggle('active', opt.getAttribute('data-scene') === WEATHER.scene);
  });
}

// ===== MUSIC CONNECT & SHARING =====

// Extract embed URLs from Spotify/YouTube links
function getSpotifyEmbedUrl(url) {
  // open.spotify.com/track/xxx or spotify:track:xxx
  var m = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (m) return 'https://open.spotify.com/embed/' + m[1] + '/' + m[2] + '?theme=0&utm_source=generator';
  return null;
}
function getYouTubeEmbedUrl(url) {
  var m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
  if (m) return 'https://www.youtube.com/embed/' + m[1] + '?autoplay=0';
  // YouTube Music playlist
  var mp = url.match(/(?:youtube\.com|music\.youtube\.com)\/playlist\?list=([a-zA-Z0-9_-]+)/);
  if (mp) return 'https://www.youtube.com/embed/videoseries?list=' + mp[1];
  return null;
}

function connectSpotify() {
  openModal(
    '<div style="text-align:center;padding:16px">' +
      '<div style="font-size:36px;margin-bottom:10px">🎵</div>' +
      '<h2 style="font-family:Cormorant Garamond,serif;font-size:20px;margin:0 0 6px">Spotify</h2>' +
      '<p style="font-size:13px;color:var(--t2);margin:0 0 14px;line-height:1.5">Paste a song, album, or playlist link to share with your partner.</p>' +
      '<input type="url" inputmode="url" id="spotify-link" placeholder="Paste Spotify link..." class="form-input" style="margin-bottom:10px;font-size:16px" autocomplete="off" autocorrect="off" autocapitalize="off">' +
      '<div style="display:flex;gap:8px">' +
        '<button class="dq-submit" style="flex:1" onclick="saveSpotifyLink()">Save</button>' +
        '<button class="dq-submit" style="flex:1;background:var(--gold)" onclick="shareSongWithPartner(\'spotify\')">Send to Partner</button>' +
      '</div>' +
      '<div id="spotify-embed" style="margin-top:14px;border-radius:12px;overflow:hidden"></div>' +
      '<div id="spotify-partner-section" style="margin-top:14px"></div>' +
    '</div>'
  );
  if (db && user) {
    db.ref('settings/music/' + user + '/spotify').once('value', function(s) {
      var el = document.getElementById('spotify-link');
      if (el && s.val()) {
        el.value = s.val();
        showSpotifyEmbed(s.val());
      }
    });
    var partnerRole = user === 'her' ? 'him' : 'her';
    db.ref('settings/music/' + partnerRole + '/spotify').once('value', function(s) {
      var el = document.getElementById('spotify-partner-section');
      if (el && s.val()) {
        var embedUrl = getSpotifyEmbedUrl(s.val());
        el.innerHTML = '<div style="font-size:12px;color:var(--t3);margin-bottom:8px">Partner\'s Spotify:</div>' +
          (embedUrl ? '<iframe src="' + embedUrl + '" width="100%" height="80" frameborder="0" allow="encrypted-media" style="border-radius:12px"></iframe>' : '') +
          '<a href="' + s.val() + '" target="_blank" style="display:block;margin-top:6px;color:var(--gold);font-size:12px">Open in Spotify</a>';
      }
    });
  }
}

function showSpotifyEmbed(url) {
  var embedUrl = getSpotifyEmbedUrl(url);
  var el = document.getElementById('spotify-embed');
  if (el && embedUrl) {
    el.innerHTML = '<iframe src="' + embedUrl + '" width="100%" height="80" frameborder="0" allow="encrypted-media" style="border-radius:12px"></iframe>';
  }
}

function saveSpotifyLink() {
  var link = document.getElementById('spotify-link');
  if (!link || !link.value.trim()) return;
  if (db && user) {
    db.ref('settings/music/' + user + '/spotify').set(link.value.trim());
    showSpotifyEmbed(link.value.trim());
    toast('Spotify link saved');
  }
}

function connectYouTubeMusic() {
  openModal(
    '<div style="text-align:center;padding:16px">' +
      '<div style="font-size:36px;margin-bottom:10px">🎶</div>' +
      '<h2 style="font-family:Cormorant Garamond,serif;font-size:20px;margin:0 0 6px">YouTube Music</h2>' +
      '<p style="font-size:13px;color:var(--t2);margin:0 0 14px;line-height:1.5">Paste a song or playlist link to share with your partner.</p>' +
      '<input type="url" inputmode="url" id="ytm-link" placeholder="Paste YouTube Music link..." class="form-input" style="margin-bottom:10px;font-size:16px" autocomplete="off" autocorrect="off" autocapitalize="off">' +
      '<div style="display:flex;gap:8px">' +
        '<button class="dq-submit" style="flex:1" onclick="saveYTMLink()">Save</button>' +
        '<button class="dq-submit" style="flex:1;background:var(--gold)" onclick="shareSongWithPartner(\'youtube\')">Send to Partner</button>' +
      '</div>' +
      '<div id="ytm-embed" style="margin-top:14px;border-radius:12px;overflow:hidden"></div>' +
      '<div id="ytm-partner-section" style="margin-top:14px"></div>' +
    '</div>'
  );
  if (db && user) {
    db.ref('settings/music/' + user + '/youtube').once('value', function(s) {
      var el = document.getElementById('ytm-link');
      if (el && s.val()) {
        el.value = s.val();
        showYTMEmbed(s.val());
      }
    });
    var partnerRole = user === 'her' ? 'him' : 'her';
    db.ref('settings/music/' + partnerRole + '/youtube').once('value', function(s) {
      var el = document.getElementById('ytm-partner-section');
      if (el && s.val()) {
        var embedUrl = getYouTubeEmbedUrl(s.val());
        el.innerHTML = '<div style="font-size:12px;color:var(--t3);margin-bottom:8px">Partner\'s YouTube Music:</div>' +
          (embedUrl ? '<iframe src="' + embedUrl + '" width="100%" height="200" frameborder="0" allow="autoplay; encrypted-media" style="border-radius:12px"></iframe>' : '') +
          '<a href="' + s.val() + '" target="_blank" style="display:block;margin-top:6px;color:var(--gold);font-size:12px">Open in YouTube Music</a>';
      }
    });
  }
}

function showYTMEmbed(url) {
  var embedUrl = getYouTubeEmbedUrl(url);
  var el = document.getElementById('ytm-embed');
  if (el && embedUrl) {
    el.innerHTML = '<iframe src="' + embedUrl + '" width="100%" height="200" frameborder="0" allow="autoplay; encrypted-media" style="border-radius:12px"></iframe>';
  }
}

function saveYTMLink() {
  var link = document.getElementById('ytm-link');
  if (!link || !link.value.trim()) return;
  if (db && user) {
    db.ref('settings/music/' + user + '/youtube').set(link.value.trim());
    showYTMEmbed(link.value.trim());
    toast('YouTube Music link saved');
  }
}

// Share a song link with partner as a notification/message
function shareSongWithPartner(platform) {
  var linkEl = document.getElementById(platform === 'spotify' ? 'spotify-link' : 'ytm-link');
  if (!linkEl || !linkEl.value.trim()) { toast('Paste a link first'); return; }
  var url = linkEl.value.trim();
  if (!db || !user) { toast('Not connected'); return; }

  var partnerRole = user === 'her' ? 'him' : 'her';
  var senderName = typeof NAMES !== 'undefined' ? NAMES[user] : user;
  var icon = platform === 'spotify' ? '🎵' : '🎶';

  // Save to shared music feed
  db.ref('shared-music').push({
    from: user,
    fromName: senderName,
    platform: platform,
    url: url,
    ts: Date.now()
  });

  // Send notification to partner
  db.ref('notifications/' + partnerRole).push({
    type: 'shared-song',
    from: user,
    fromName: senderName,
    platform: platform,
    url: url,
    icon: icon,
    ts: Date.now()
  });

  if (typeof sendInAppNotif === 'function') {
    sendInAppNotif('music', senderName + ' shared a song with you ' + icon, icon);
  }
  toast('Song sent to partner!');
}

function loadSharedMusicFeed() {
  var feed = document.getElementById('shared-music-feed');
  if (!feed || !db) return;
  db.ref('shared-music').orderByChild('ts').limitToLast(5).once('value', function(snap) {
    var songs = [];
    snap.forEach(function(child) { songs.push(child.val()); });
    songs.reverse();
    if (!songs.length) { feed.innerHTML = ''; return; }
    var html = '<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--t3);margin-bottom:8px">Recently Shared</div>';
    songs.forEach(function(song) {
      var icon = song.platform === 'spotify' ? '🎵' : '🎶';
      var ago = typeof timeAgo === 'function' ? timeAgo(song.ts) : '';
      var embedUrl = song.platform === 'spotify' ? getSpotifyEmbedUrl(song.url) : getYouTubeEmbedUrl(song.url);
      html += '<div style="background:var(--input-bg);border-radius:14px;padding:12px;margin-bottom:8px">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<span style="font-size:13px;font-weight:500;color:var(--t1)">' + icon + ' ' + (song.fromName || song.from) + '</span>' +
          '<span style="font-size:11px;color:var(--t3)">' + ago + '</span>' +
        '</div>';
      if (embedUrl) {
        var h = song.platform === 'spotify' ? '80' : '150';
        html += '<iframe src="' + embedUrl + '" width="100%" height="' + h + '" frameborder="0" allow="encrypted-media" style="border-radius:10px"></iframe>';
      }
      html += '<a href="' + song.url + '" target="_blank" style="display:block;margin-top:6px;font-size:11px;color:var(--gold)">Open in app</a>';
      html += '</div>';
    });
    feed.innerHTML = html;
  });
}

async function saveSettings() {
  if (!db || !user) return;
  const nameEl = document.getElementById('set-name');
  const annivEl = document.getElementById('set-anniversary');
  const bdayEl = document.getElementById('set-birthday');
  const nickEl = document.getElementById('set-nickname');
  const newName = nameEl ? nameEl.value.trim() : '';
  const newAnniv = annivEl ? annivEl.value : '';
  const newBday = bdayEl ? bdayEl.value : '';
  const newNick = nickEl ? nickEl.value.trim() : '';

  if (newName && newName !== NAMES[user]) {
    NAMES[user] = newName;
    await db.ref('profiles/' + user).set(newName);
    document.querySelectorAll('.uname').forEach(e => e.textContent = newName);
  }
  if (newAnniv) {
    await db.ref('settings/anniversary').set(newAnniv);
  }
  if (newBday) {
    await db.ref('settings/birthday/' + user).set(newBday);
  }
  if (newNick) {
    var nickKey = user === 'him' ? 'himCallsHer' : 'herCallsHim';
    NICKNAMES[nickKey] = newNick;
    NAMES[partner] = newNick;
    await db.ref('profiles/' + nickKey).set(newNick);
    document.querySelectorAll('.pname').forEach(e => e.textContent = newNick);
    document.querySelectorAll('.partner-nick').forEach(e => e.textContent = newNick);
  }
  toast('Settings saved');
  renderDashHero();
}

// ===== HUB PAGES - Live data for Together, Track, Build =====
function initHubPages() {
  if (!db) return;
  const today = localDate();

  // Together hub stats
  db.ref('letters').orderByChild('timestamp').limitToLast(50).once('value', snap => {
    const el = document.getElementById('hub-tg-letters');
    if (el) el.textContent = snap.numChildren() || 0;
  });
  db.ref('daily_answers/' + today).once('value', snap => {
    // Use streak from existing streak logic
    const el = document.getElementById('hub-tg-streak');
    const streakEl = document.getElementById('streak-count');
    if (el && streakEl) el.textContent = streakEl.textContent || '0';
  });

  // Together recent feed (last 3 activities: taps, letters, answers)
  db.ref('taps').orderByChild('ts').limitToLast(3).once('value', snap => {
    const feed = document.getElementById('together-recent-feed');
    if (!feed || !snap.exists()) return;
    const items = [];
    snap.forEach(c => {
      const t = c.val();
      const who = t.from === user ? 'You' : (NAMES[t.from] || 'Partner');
      const ago = _timeAgo(t.ts);
      items.unshift('<div class="hub-feed-item"><span class="hub-feed-emoji">' + (t.emoji || '💕') + '</span><span class="hub-feed-text">' + who + ' sent a ' + (t.type || 'tap') + '</span><span class="hub-feed-time">' + ago + '</span></div>');
    });
    if (items.length > 0) feed.innerHTML = items.join('');
  });

  // Track hub stats
  db.ref('moods').orderByChild('timestamp').limitToLast(7).once('value', snap => {
    const el = document.getElementById('hub-tr-mood');
    const snapMood = document.getElementById('track-snap-mood-val');
    if (!snap.exists()) return;
    let sum = 0, count = 0, todayMood = null, todayEnergy = null;
    const MOOD_LABELS = ['','Rough','Off','Okay','Good','Great'];
    const ENERGY_LABELS = ['','Drained','Low','Steady','Wired','Charged'];
    snap.forEach(c => {
      const m = c.val();
      if (m.user === user) {
        sum += m.mood || 0;
        count++;
        if (m.date === today) {
          todayMood = m.mood;
          todayEnergy = m.energy;
        }
      }
    });
    if (el && count > 0) el.textContent = (sum / count).toFixed(1);
    if (snapMood && todayMood) snapMood.textContent = MOOD_LABELS[todayMood] || todayMood;
    const snapEnergy = document.getElementById('track-snap-energy-val');
    if (snapEnergy && todayEnergy) snapEnergy.textContent = ENERGY_LABELS[todayEnergy] || todayEnergy;
  });

  db.ref('gratitude').orderByChild('timestamp').limitToLast(20).once('value', snap => {
    const el = document.getElementById('hub-tr-gratitude');
    if (el) el.textContent = snap.numChildren() || 0;
  });

  // Build hub stats
  db.ref('dreams').once('value', snap => {
    const el = document.getElementById('hub-bd-dreams');
    if (el) el.textContent = snap.numChildren() || 0;
  });

  db.ref('calendar').once('value', snap => {
    const el = document.getElementById('hub-bd-events');
    if (el) el.textContent = snap.numChildren() || 0;
  });

  // Together hero title - personalized
  const heroTitle = document.getElementById('together-hero-title');
  if (heroTitle && NAMES[partner]) {
    heroTitle.textContent = 'You & ' + NAMES[partner];
  }
}

function _timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h';
  return Math.floor(diff / 86400) + 'd';
}

// ===== VOICE NOTES =====
var vnRecorder = null;
var vnChunks = [];
var vnBlob = null;
var vnRecording = false;
var vnTimerInterval = null;
var vnStartTime = 0;
var vnPreviewAudio = null;
var vnAvatarAudio = null;
var vnAvatarPlaying = false;

function toggleVoiceRecord() {
  if (vnRecording) {
    stopVoiceRecord();
  } else {
    startVoiceRecord();
  }
}

function startVoiceRecord() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast('Voice recording not supported on this device');
    return;
  }
  // Suspend ambient audio BEFORE requesting mic to prevent feedback/static
  if (typeof WEATHER !== 'undefined' && WEATHER.audioCtx) {
    WEATHER._priorAudioState = WEATHER.audioCtx.state;
    WEATHER.audioCtx.suspend();
  }
  // Request mic with noise suppression + echo cancellation for clean audio
  var audioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 44100
  };
  navigator.mediaDevices.getUserMedia({ audio: audioConstraints }).then(function(stream) {
    vnChunks = [];
    vnBlob = null;
    var options = {};
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      options.mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      options.mimeType = 'audio/webm';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      options.mimeType = 'audio/mp4';
    }
    vnRecorder = new MediaRecorder(stream, options);
    vnRecorder.ondataavailable = function(e) {
      if (e.data.size > 0) vnChunks.push(e.data);
    };
    vnRecorder.onstop = function() {
      vnBlob = new Blob(vnChunks, { type: vnRecorder.mimeType || 'audio/webm' });
      stream.getTracks().forEach(function(t) { t.stop(); });
      showVoiceNotePreview();
    };
    vnRecorder.start(250); // collect chunks every 250ms for smoother data
    vnRecording = true;
    vnStartTime = Date.now();
    var btn = document.getElementById('vn-record-btn');
    var label = document.getElementById('vn-record-label');
    if (btn) btn.classList.add('recording');
    if (label) label.textContent = 'Recording... tap to stop';
    var vnControls = document.getElementById('vn-controls');
    if (vnControls) vnControls.classList.remove('show');
    vnTimerInterval = setInterval(updateVnTimer, 500);
    // Auto-stop at 60s
    setTimeout(function() { if (vnRecording) stopVoiceRecord(); }, 60000);
  }).catch(function(err) {
    console.error('Mic access denied:', err);
    // Resume audio if mic was denied
    if (typeof WEATHER !== 'undefined' && WEATHER.audioCtx && WEATHER._priorAudioState === 'running') {
      WEATHER.audioCtx.resume();
    }
    toast('Microphone access denied');
  });
}

function stopVoiceRecord() {
  if (vnRecorder && vnRecorder.state === 'recording') {
    vnRecorder.stop();
  }
  vnRecording = false;
  clearInterval(vnTimerInterval);
  // Resume ambient audio after recording
  if (typeof WEATHER !== 'undefined' && WEATHER.audioCtx && WEATHER._priorAudioState === 'running') {
    WEATHER.audioCtx.resume();
  }
  var btn = document.getElementById('vn-record-btn');
  var label = document.getElementById('vn-record-label');
  if (btn) btn.classList.remove('recording');
  if (label) label.textContent = 'Hold or tap to record';
}

function updateVnTimer() {
  var elapsed = Math.floor((Date.now() - vnStartTime) / 1000);
  var timerEl = document.getElementById('vn-timer');
  if (timerEl) timerEl.textContent = elapsed + 's / 60s';
}

function showVoiceNotePreview() {
  var controls = document.getElementById('vn-controls');
  if (controls) controls.classList.add('show');
  var duration = Math.round((Date.now() - vnStartTime) / 1000);
  var durLabel = document.getElementById('vn-duration-label');
  if (durLabel) durLabel.textContent = duration + 's';
  document.getElementById('vn-timer').textContent = '';
  // Generate waveform bars
  var waveform = document.getElementById('vn-waveform');
  if (waveform) {
    var bars = '';
    for (var i = 0; i < 30; i++) {
      var h = Math.floor(Math.random() * 18) + 6;
      bars += '<div class="vn-wave-bar" style="height:' + h + 'px"></div>';
    }
    waveform.innerHTML = bars;
  }
}

function previewVoiceNote() {
  if (!vnBlob) return;
  if (vnPreviewAudio) {
    vnPreviewAudio.pause();
    vnPreviewAudio = null;
    return;
  }
  var url = URL.createObjectURL(vnBlob);
  vnPreviewAudio = new Audio(url);
  vnPreviewAudio.volume = 0.8;
  vnPreviewAudio.play();
  vnPreviewAudio.onended = function() { vnPreviewAudio = null; };
}

function discardVoiceNote() {
  vnBlob = null;
  vnChunks = [];
  var controls = document.getElementById('vn-controls');
  if (controls) controls.classList.remove('show');
  document.getElementById('vn-timer').textContent = '';
  toast('Voice note discarded');
}

function sendVoiceNote() {
  if (!vnBlob || !db || !user) return;
  var expirySelect = document.getElementById('vn-expiry');
  var replaySelect = document.getElementById('vn-replays');
  var expirySec = parseInt(expirySelect.value) || 0;
  var maxReplays = parseInt(replaySelect.value) || 0;

  // Convert blob to base64 for Firebase Realtime DB
  var reader = new FileReader();
  reader.onloadend = function() {
    var base64 = reader.result;
    var noteData = {
      from: user,
      fromName: NAMES[user] || user,
      audio: base64,
      mimeType: vnBlob.type || 'audio/webm',
      duration: Math.round((Date.now() - vnStartTime) / 1000),
      timestamp: Date.now(),
      expirySec: expirySec,
      maxReplays: maxReplays,
      playCount: 0,
      expiresAt: expirySec > 0 ? Date.now() + (expirySec * 1000) : 0
    };
    db.ref('voiceNotes').push(noteData).then(function() {
      // Send notification to partner
      sendInAppNotif('voiceNote', NAMES[user] + ' sent you a voice note', '🎙');
      toast('Voice note sent');
      discardVoiceNote();
      loadVoiceNoteFeed();
      checkPartnerVoiceNote();
    });
  };
  reader.readAsDataURL(vnBlob);
}

// ===== VOICE NOTE FEED (on Connect page) =====
function loadVoiceNoteFeed() {
  if (!db) return;
  var feed = document.getElementById('vn-feed');
  if (!feed) return;
  db.ref('voiceNotes').orderByChild('timestamp').limitToLast(10).once('value', function(snap) {
    if (!snap.exists()) { feed.innerHTML = ''; return; }
    var notes = [];
    snap.forEach(function(c) {
      var v = c.val();
      v._key = c.key;
      // Check expiry
      if (v.expiresAt && v.expiresAt > 0 && Date.now() > v.expiresAt) {
        db.ref('voiceNotes/' + c.key).remove();
        return;
      }
      // Check max replays
      if (v.maxReplays > 0 && (v.playCount || 0) >= v.maxReplays) {
        db.ref('voiceNotes/' + c.key).remove();
        return;
      }
      notes.push(v);
    });
    notes.reverse();
    if (notes.length === 0) { feed.innerHTML = ''; return; }
    feed.innerHTML = notes.map(function(n) {
      var replaysLeft = n.maxReplays > 0 ? (n.maxReplays - (n.playCount || 0)) + ' plays left' : 'unlimited';
      var timeAgo = _timeAgo(n.timestamp);
      return '<div class="vn-feed-item">' +
        '<button class="vn-feed-play" onclick="playVoiceNoteFeed(\'' + n._key + '\')">&#9654;</button>' +
        '<div class="vn-feed-info"><div class="vn-feed-from">from ' + (n.fromName || n.from) + '</div>' +
        '<div class="vn-feed-meta">' + (n.duration || 0) + 's · ' + timeAgo + '</div></div>' +
        '<div class="vn-feed-replays">' + replaysLeft + '</div></div>';
    }).join('');
  });
}

function playVoiceNoteFeed(key) {
  if (!db || !key) return;
  db.ref('voiceNotes/' + key).once('value', function(snap) {
    if (!snap.exists()) return;
    var note = snap.val();
    // Increment play count
    var newCount = (note.playCount || 0) + 1;
    db.ref('voiceNotes/' + key + '/playCount').set(newCount);
    // Check if should be removed after this play
    if (note.maxReplays > 0 && newCount >= note.maxReplays) {
      setTimeout(function() { db.ref('voiceNotes/' + key).remove(); loadVoiceNoteFeed(); }, 2000);
    }
    // Play audio as background-style
    playVoiceAudioBackground(note.audio);
  });
}

// ===== VOICE NOTE ON PARTNER AVATAR (Dashboard) =====
function checkPartnerVoiceNote() {
  if (!db || !user) return;
  db.ref('voiceNotes').orderByChild('timestamp').limitToLast(5).once('value', function(snap) {
    var avatar = document.getElementById('dash-partner-avatar');
    if (!avatar) return;
    // Remove existing play button
    var existing = avatar.querySelector('.vn-avatar-play');
    if (existing) existing.remove();
    if (!snap.exists()) return;
    var latestNote = null;
    snap.forEach(function(c) {
      var v = c.val();
      v._key = c.key;
      // Only show notes FROM partner TO this user
      if (v.from !== user) {
        // Check expiry
        if (v.expiresAt && v.expiresAt > 0 && Date.now() > v.expiresAt) return;
        // Check replays
        if (v.maxReplays > 0 && (v.playCount || 0) >= v.maxReplays) return;
        latestNote = v;
      }
    });
    if (latestNote) {
      var playBtn = document.createElement('div');
      playBtn.className = 'vn-avatar-play';
      playBtn.setAttribute('data-vn-key', latestNote._key);
      playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
      playBtn.onclick = function(e) {
        e.stopPropagation();
        playAvatarVoiceNote(latestNote._key);
      };
      avatar.appendChild(playBtn);
    }
  });
}

function playAvatarVoiceNote(key) {
  if (!db || !key) return;
  if (vnAvatarPlaying) {
    // Stop current playback
    if (vnAvatarAudio) { vnAvatarAudio.pause(); vnAvatarAudio = null; }
    vnAvatarPlaying = false;
    var playBtn = document.querySelector('.vn-avatar-play');
    if (playBtn) playBtn.classList.remove('vn-avatar-playing');
    return;
  }
  db.ref('voiceNotes/' + key).once('value', function(snap) {
    if (!snap.exists()) return;
    var note = snap.val();
    // Increment play count
    var newCount = (note.playCount || 0) + 1;
    db.ref('voiceNotes/' + key + '/playCount').set(newCount);
    // Play as background audio
    vnAvatarPlaying = true;
    var playBtn = document.querySelector('.vn-avatar-play');
    if (playBtn) playBtn.classList.add('vn-avatar-playing');
    playVoiceAudioBackground(note.audio, function() {
      vnAvatarPlaying = false;
      if (playBtn) playBtn.classList.remove('vn-avatar-playing');
      // Remove play button if max replays reached
      if (note.maxReplays > 0 && newCount >= note.maxReplays) {
        if (playBtn) playBtn.remove();
        db.ref('voiceNotes/' + key).remove();
      }
      checkPartnerVoiceNote();
    });
  });
}

// ===== BACKGROUND-STYLE VOICE AUDIO PLAYBACK =====
function playVoiceAudioBackground(dataUrl, onEnded) {
  // Use regular Audio element with lower volume for background feel
  if (vnAvatarAudio) { vnAvatarAudio.pause(); }
  vnAvatarAudio = new Audio(dataUrl);
  vnAvatarAudio.volume = 0.45; // Background-level volume
  vnAvatarAudio.play().catch(function(e) { console.error('Voice playback error:', e); });
  vnAvatarAudio.onended = function() {
    vnAvatarAudio = null;
    if (typeof onEnded === 'function') onEnded();
  };
}

// ===== IN-APP NOTIFICATION SYSTEM =====
function sendInAppNotif(type, message, icon) {
  if (!db || !user) return;
  var partnerRole = user === 'her' ? 'him' : 'her';
  var notifData = {
    type: type,
    from: user,
    fromName: NAMES[user] || user,
    message: message,
    icon: icon || '💬',
    timestamp: Date.now(),
    read: false
  };
  db.ref('notifications/' + partnerRole).push(notifData);
}

function listenNotifications() {
  if (!db || !user) return;
  db.ref('notifications/' + user).orderByChild('timestamp').limitToLast(1).on('child_added', function(snap) {
    var notif = snap.val();
    if (!notif || notif.read) return;
    // Only show if recent (within last 10 seconds)
    if (Date.now() - notif.timestamp > 10000) return;
    // Determine which page this notification should navigate to
    var notifPage = NOTIF_PAGE_MAP[notif.type] || null;
    showNotifToast(notif.fromName || notif.from, notif.message, notif.icon, notifPage);
    // Mark as read
    db.ref('notifications/' + user + '/' + snap.key + '/read').set(true);
    // If voice note, refresh avatar play button
    if (notif.type === 'voiceNote') {
      checkPartnerVoiceNote();
    }
  });
}

// Map notification types to the page they should navigate to
var NOTIF_PAGE_MAP = {
  'tap': 'connect',
  'letter': 'connect',
  'voiceNote': 'connect',
  'mood-sound': 'connect',
  'mood': 'mood',
  'game-invite': 'games',
  'challenge': 'together',
  'morning-msg': 'connect',
  'listen-together': 'connect',
  'fitness': 'fitness',
  'checkin': 'mood',
  'song': 'connect'
};

function showNotifToast(fromName, message, icon, targetPage) {
  var el = document.getElementById('notif-toast');
  var iconEl = document.getElementById('notif-toast-icon');
  var fromEl = document.getElementById('notif-toast-from');
  var msgEl = document.getElementById('notif-toast-msg');
  if (!el) return;
  if (iconEl) iconEl.textContent = icon || '💬';
  if (fromEl) fromEl.textContent = 'from ' + fromName;
  if (msgEl) msgEl.textContent = message;
  // Make tappable - navigate to the relevant page
  el.onclick = null;
  if (targetPage && typeof go === 'function') {
    el.style.cursor = 'pointer';
    el.onclick = function() {
      el.classList.remove('show');
      go(targetPage);
    };
  } else {
    el.style.cursor = '';
  }
  el.classList.add('show');
  // Auto hide after 4 seconds
  setTimeout(function() { el.classList.remove('show'); }, 4000);
  // Haptic
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

// ===== ENHANCED NOTIFICATIONS FOR EXISTING ACTIONS =====
// Patch sendTap to also send in-app notification
(function() {
  if (typeof window._origSendTap === 'undefined') {
    window._origSendTap = window.sendTap;
  }
})();
// We'll patch after DOM ready since sendTap is in modules-core.js
function patchSendTapNotif() {
  if (typeof sendTap === 'function' && !sendTap._patched) {
    var origSendTap = sendTap;
    window.sendTap = async function(e, type, emoji) {
      await origSendTap(e, type, emoji);
      var TAP_MSGS = { hug:'sent you a hug', kiss:'blew you a kiss', love:'sent you love', miss:'misses you', thinking:'is thinking of you' };
      sendInAppNotif('tap', (NAMES[user] || user) + ' ' + (TAP_MSGS[type] || 'sent a tap'), emoji || '💕');
    };
    window.sendTap._patched = true;
  }
}

// ===== INIT VOICE NOTES & NOTIFICATIONS =====
function initVoiceNotes() {
  checkPartnerVoiceNote();
  listenNotifications();
  patchSendTapNotif();
  // Refresh avatar play button periodically
  setInterval(checkPartnerVoiceNote, 30000);
  // Load feed if on connect page
  loadVoiceNoteFeed();
}

// ===== DAILY MORNING MESSAGE SYSTEM =====
// Partner wakes up to a compliment, affirmation, or poem "...from [nickname]"
var MORNING_MESSAGES = {
  compliments: [
    "You make every room brighter just by walking in.",
    "The way you love is something most people only dream about.",
    "You have the most beautiful soul I've ever known.",
    "Your smile is my favorite thing in this entire world.",
    "You are the most incredible person I've ever met.",
    "Everything about you makes me fall deeper in love.",
    "You don't even realize how amazing you are, and that's part of your magic.",
    "I still get butterflies every time I see your face.",
    "The world doesn't deserve you, but I'm so grateful I get to love you.",
    "You are beautiful in ways that have nothing to do with how you look."
  ],
  affirmations: [
    "You are enough, exactly as you are right now.",
    "Your light inspires everyone around you.",
    "You are worthy of all the love you give to others.",
    "Today is going to be a beautiful day because you're in it.",
    "You carry so much grace in everything you do.",
    "The strength you show every day is extraordinary.",
    "Your heart is pure and the world is better for it.",
    "You are becoming everything you were meant to be.",
    "Never forget how far you've come and how much you've grown.",
    "You deserve every good thing that's coming your way."
  ],
  poems: [
    "Before the sun, before the dew,\nmy first thought is always you.\nGood morning, love - this day is new,\nand everything's more beautiful because of you.",
    "Soft light falls on sleepy eyes,\na gentle start beneath the skies.\nI hope you wake and smile because\nyou're loved beyond what language does.",
    "The morning light can't hold a flame\nto hearing someone speak your name.\nSo here it is, whispered true -\nGood morning, love. I'm thinking of you.",
    "In quiet hours before the day,\nI send these words across the way -\nthat you are loved, that you are seen,\nand you're the best thing in between.",
    "Rise and shine, my everything.\nYou're the reason birds still sing.\nNo poem could ever capture right\nhow you make my world so bright."
  ],
  words: [
    "Word of the day: Saudade - the deep, nostalgic longing for someone you love. That's what I feel every moment we're apart.",
    "Word of the day: Kilig - the rush of butterflies you feel when something romantic happens. You give me this every single day.",
    "Word of the day: Mamihlapinatapai - a look shared between two people, each wishing the other would start something they both want. Our whole love story.",
    "Word of the day: Forelsket - the euphoria of falling in love. I'm still falling, every day, with you.",
    "Word of the day: Merak - the pursuit of small pleasures that make life worth living. You are my merak."
  ]
};

function getMorningMessage() {
  var today = new Date();
  var dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  var cats = Object.keys(MORNING_MESSAGES);
  var catIdx = dayOfYear % cats.length;
  var cat = cats[catIdx];
  var msgs = MORNING_MESSAGES[cat];
  var msgIdx = dayOfYear % msgs.length;
  return { category: cat, message: msgs[msgIdx] };
}

function checkMorningMessage() {
  if (!db || !user) return;
  var today = localDate();
  var KEY = 'met_morning_msg_' + user;
  if (localStorage.getItem(KEY) === today) return;

  // Check if partner has enabled morning messages for us
  var partnerRole = user === 'her' ? 'him' : 'her';
  db.ref('settings/morningMsg/' + partnerRole).once('value', function(snap) {
    var settings = snap.val();
    if (!settings || !settings.enabled) return;

    var now = new Date();
    var hour = now.getHours();
    // Only show between 5am and 11am
    if (hour < 5 || hour > 11) return;

    var nickname = settings.nickname || NAMES[partnerRole] || 'your love';
    var msg;
    if (settings.customMsg) {
      // Use custom messages (can be multiple separated by |)
      var customs = settings.customMsg.split('|').map(function(s) { return s.trim(); }).filter(Boolean);
      var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
      msg = { category: 'custom', message: customs[dayOfYear % customs.length] };
    } else {
      msg = getMorningMessage();
    }

    // Save to Firebase so it persists and partner can see what was sent
    db.ref('morningMessages/' + user + '/' + today).set({
      message: msg.message, category: msg.category, from: partnerRole,
      fromNickname: nickname, timestamp: Date.now()
    });

    // Show as notification
    showMorningMessageOverlay(msg.message, nickname);
    localStorage.setItem(KEY, today);

    // Also send a browser notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Good Morning', {
          body: msg.message + '\n\n...from ' + nickname,
          icon: 'icons/icon-192x192.png',
          badge: 'icons/icon-96x96.png',
          tag: 'morning-msg',
          data: { page: 'connect' }
        });
      } catch(e) {}
    }
  });
}

function showMorningMessageOverlay(message, nickname) {
  // Reuse or create overlay
  var overlay = document.getElementById('morning-msg-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'morning-msg-overlay';
    overlay.className = 'morning-overlay';
    overlay.innerHTML = '<div class="morning-card">' +
      '<div class="morning-icon">☀️</div>' +
      '<div class="morning-text" id="morning-text"></div>' +
      '<div class="morning-from" id="morning-from"></div>' +
      '<button class="morning-close" onclick="closeMorningMessage()">Start my day</button>' +
    '</div>';
    document.body.appendChild(overlay);
  }
  var textEl = document.getElementById('morning-text');
  var fromEl = document.getElementById('morning-from');
  if (textEl) textEl.textContent = message;
  if (fromEl) fromEl.textContent = '...from ' + nickname;
  overlay.classList.add('on');
}

function closeMorningMessage() {
  var overlay = document.getElementById('morning-msg-overlay');
  if (overlay) overlay.classList.remove('on');
}


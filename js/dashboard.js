// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => {
  // Apply theme immediately
  applyTheme(getThemePref());

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getThemePref() === 'auto') updateThemeColor();
  });

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

function updateDRStats() {
  const el = document.getElementById('dr-stats');
  if (!el || !db) return;
  db.ref('dreams').once('value', snap => {
    if (!snap.exists()) { el.innerHTML = ''; return; }
    let total = 0, done = 0;
    const cats = {};
    snap.forEach(c => { total++; const v = c.val(); if (v.achieved) done++; cats[v.category] = (cats[v.category]||0)+1; });
    const topCat = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
    el.innerHTML = `
      <div class="mod-stat"><div class="mod-stat-num">${total}</div><div class="mod-stat-label">Dreams</div></div>
      <div class="mod-stat"><div class="mod-stat-num">${done}</div><div class="mod-stat-label">Achieved</div></div>
      ${topCat ? `<div class="mod-stat"><div class="mod-stat-num">${topCat[1]}</div><div class="mod-stat-label">${topCat[0]}</div></div>` : ''}`;
  });
}

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
          `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--card-bg);border-radius:14px;margin-bottom:6px;box-shadow:var(--card-shadow);border:1px solid var(--bdr-s)">
            <div style="width:20px;height:20px;border-radius:50%;border:2px solid ${i.done?'var(--gold)':'var(--t3)'};display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--gold);flex-shrink:0">${i.done?'✓':''}</div>
            <div style="font-size:13px;color:var(--cream);flex:1;${i.done?'text-decoration:line-through;opacity:.5':''}">${i.title}</div>
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
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--card-bg);border-radius:14px;margin-bottom:6px;box-shadow:var(--card-shadow);border:1px solid var(--bdr-s)">
        <div style="width:28px;height:28px;border-radius:50%;background:${isMe?'var(--tint)':'var(--red-s)'};display:flex;align-items:center;justify-content:center;font-size:11px;color:${isMe?'var(--gold)':'var(--red)'};flex-shrink:0">${(isMe ? 'You' : i.userName).charAt(0)}</div>
        <div style="flex:1;min-width:0"><div style="font-size:12px;color:var(--cream)">${isMe ? 'You' : i.userName} ${i.description}</div></div>
        <div style="font-size:9px;color:var(--t3);flex-shrink:0">${ts}</div>
      </div>`;
    }

    let html = items.slice(0, 3).map(renderItem).join('');
    if (items.length > 3) {
      html += `<div id="activity-extra" style="display:none">${items.slice(3).map(renderItem).join('')}</div>`;
      html += `<div id="activity-toggle" onclick="toggleActivityFeed()" style="text-align:center;padding:8px;font-size:11px;color:var(--gold);cursor:pointer;font-weight:500">Show more</div>`;
    }
    el.innerHTML = html;
  });
}

function toggleActivityFeed() {
  const extra = document.getElementById('activity-extra');
  const toggle = document.getElementById('activity-toggle');
  if (!extra || !toggle) return;
  const hidden = extra.style.display === 'none';
  extra.style.display = hidden ? 'block' : 'none';
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
      `<div style="display:flex;gap:8px;align-items:baseline;margin-bottom:4px"><span style="color:var(--gold);font-size:10px">&#9679;</span><span>${esc(i.message || '')}</span></div>`
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
    return `<div onclick="go('${t.page}')" style="display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;border-bottom:1px solid var(--bdr-s)">
      <div style="width:22px;height:22px;border-radius:50%;background:${t.done ? 'var(--tint)' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0">${checkIcon}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:500;color:${textColor};text-decoration:${textDecor}">${t.label}</div>
        ${!t.done ? '<div style="font-size:10px;color:var(--t3);margin-top:1px">' + t.desc + '</div>' : ''}
      </div>
      ${!t.done ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>' : ''}
    </div>`;
  }).join('');
  // Remove border from last item
  if (list.lastElementChild) list.lastElementChild.style.borderBottom = 'none';
  showEl(container);
}

// ===== PUSH NOTIFICATIONS FOR DAILY TASKS =====
function initNotifications() {
  if (!('Notification' in window)) return;
  // Request permission on first app load (after login)
  if (Notification.permission === 'default') {
    // Delay request so it's not jarring on first load
    setTimeout(() => {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') scheduleDailyReminder();
      });
    }, 5000);
  } else if (Notification.permission === 'granted') {
    scheduleDailyReminder();
  }
}

function scheduleDailyReminder() {
  // Check every 30 minutes if user has pending tasks and hasn't been notified today
  const REMINDER_KEY = 'met_last_reminder';
  const CHECK_INTERVAL = 30 * 60 * 1000; // 30 min

  function check() {
    if (!db || !user) return;
    const today = localDate();
    const lastReminder = localStorage.getItem(REMINDER_KEY);
    if (lastReminder === today) return; // Already reminded today

    const now = new Date();
    const hour = now.getHours();
    // Only remind between 9am and 9pm
    if (hour < 9 || hour > 21) return;

    // Check if there are pending daily tasks
    Promise.all([
      db.ref('moods').orderByChild('timestamp').limitToLast(10).once('value'),
      db.ref('dailyAnswers/' + today + '/' + user).once('value'),
    ]).then(([moods, dq]) => {
      let moodDone = false;
      if (moods.exists()) moods.forEach(c => { if (c.val().user === user && c.val().date === today) moodDone = true; });
      const dqDone = dq.exists();

      if (!moodDone || !dqDone) {
        const pending = [];
        if (!moodDone) pending.push('mood check-in');
        if (!dqDone) pending.push('daily question');
        sendNotification(pending);
        localStorage.setItem(REMINDER_KEY, today);
      }
    });
  }

  // Initial check after a short delay
  setTimeout(check, 10000);
  // Then check periodically
  setInterval(check, CHECK_INTERVAL);
}

function sendNotification(pendingTasks) {
  if (Notification.permission !== 'granted') return;
  const body = pendingTasks.length === 1
    ? 'You still need to do your ' + pendingTasks[0] + ' today'
    : 'You still need to do your ' + pendingTasks.join(' & ') + ' today';
  try {
    new Notification('Moi & Toi', {
      body: body,
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-96x96.png',
      tag: 'daily-reminder',
      renotify: false,
    });
  } catch(e) { /* SW notification fallback not needed for now */ }
}

function checkDailyNotification(tasks, doneCount) {
  // If not all tasks done and user hasn't been notified, check
  if (doneCount < tasks.length) initNotifications();
}

// ===== WIRE UP STATUS UPDATES =====
// Override go() to refresh statuses when navigating
const _originalGo = go;
go = function(p) {
  _originalGo(p);
  if (p === 'explore' || p === 'more') { updateHubStatuses(); }
  if (p === 'bucket') updateBLStats();
  if (p === 'dreams') updateDRStats();
  if (p === 'homelife') updateHLStats();
  if (p === 'culture') updateCXStats();
  if (p === 'spiritual') updateSPStats();
  if (p === 'foundation') updateFDNStats();
  if (p === 'family') updateFAMStats();
  if (p === 'games') updateGamesStats();
  if (p === 'datenight') updateDNStats();
  if (p === 'dash') { renderDailyTasks(); }
  if (p === 'settings') { loadSettings(); }
  if (p === 'fitness') renderFitnessHub();
  if (p === 'nutrition') renderNutritionDay();
  if (p === 'calendar') renderCalendar();
  if (p === 'dreamhome') renderDreamHome();
  if (p === 'knowyou') renderKnowYou();
  if (p === 'memories') renderMemories();
  if (p === 'achievements') { renderAchievements(); checkAchievements(); }
  // Update presence
  if (db && user) db.ref('presence/' + user + '/currentPage').set(p);
};

// ===== SETTINGS =====
function loadSettings() {
  const nameEl = document.getElementById('set-name');
  const annivEl = document.getElementById('set-anniversary');
  const partnerEl = document.getElementById('set-partner-name');
  if (nameEl) nameEl.value = NAMES[user] || '';
  if (partnerEl) partnerEl.value = NAMES[partner] || '';
  if (annivEl && db) {
    db.ref('settings/anniversary').once('value', snap => {
      if (snap.val()) annivEl.value = snap.val();
    });
  }
}

async function saveSettings() {
  if (!db || !user) return;
  const nameEl = document.getElementById('set-name');
  const annivEl = document.getElementById('set-anniversary');
  const newName = nameEl ? nameEl.value.trim() : '';
  const newAnniv = annivEl ? annivEl.value : '';

  if (newName && newName !== NAMES[user]) {
    NAMES[user] = newName;
    await db.ref('profiles/' + user).set(newName);
    document.querySelectorAll('.uname').forEach(e => e.textContent = newName);
  }
  if (newAnniv) {
    await db.ref('settings/anniversary').set(newAnniv);
  }
  toast('Settings saved');
  renderDashHero();
}


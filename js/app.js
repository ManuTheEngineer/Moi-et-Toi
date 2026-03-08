// ========== CONFIG ==========
// Firebase config stored in browser localStorage. Set once per device.
// Anthropic API key stored in Firebase, set once by admin.

let FIREBASE_CONFIG = null;
try { FIREBASE_CONFIG = JSON.parse(localStorage.getItem('met_fb_config')); } catch(e) {}

// API key loaded from Firebase - set once, works for both
let CLAUDE_API_KEY = "";

// Profile names & nicknames - loaded from Firebase
let NAMES = { her: "", him: "" };
let NICKNAMES = { herCallsHim: "", himCallsHer: "" };

// ==========================================

let db, user, partner, authUser, selectedMood = 0, logExercises = [], logType = '', chatHistory = [];

// Map email to profile role
const EMAIL_MAP = {
  'abokemmanuel1@gmail.com': 'him',
  'takelley11@gmail.com': 'her'
};

// ===== INIT =====
async function init() {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.database();
  
  // Check if already signed in
  firebase.auth().onAuthStateChanged(async (fbUser) => {
    if (fbUser) {
      authUser = fbUser;
      const role = EMAIL_MAP[fbUser.email];
      if (role) {
        user = role;
        partner = role === 'her' ? 'him' : 'her';
        await loadProfiles();
        if (needsOnboarding()) {
          startOnboarding();
        } else {
          showWelcomeGate();
        }
      } else {
        firebase.auth().signOut();
        showError('Account not authorized.');
      }
    }
  });
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-pass').value;
  
  if (!email || !pass) { showError('Enter email and password'); return; }
  
  try {
    const result = await firebase.auth().signInWithEmailAndPassword(email, pass);
    authUser = result.user;
    const role = EMAIL_MAP[email];
    
    if (!role) { 
      firebase.auth().signOut();
      showError('Account not authorized.'); 
      return; 
    }
    
    user = role;
    partner = role === 'her' ? 'him' : 'her';
    await loadProfiles();
    
    if (needsOnboarding()) {
      startOnboarding();
    } else {
      finishLogin();
    }
  } catch(e) {
    console.error('Login error:', e.code, e.message);
    if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
      showError('Wrong email or password.');
    } else if (e.code === 'auth/user-not-found') {
      showError('Account not found.');
    } else if (e.code === 'auth/invalid-email') {
      showError('Invalid email format.');
    } else if (e.code === 'auth/too-many-requests') {
      showError('Too many attempts. Wait a minute.');
    } else {
      showError(e.code || 'Sign in failed. Try again.');
    }
  }
}

function showError(msg) {
  const el = document.getElementById('login-err');
  if (el) el.textContent = msg;
}

async function loadProfiles() {
  return new Promise(resolve => {
    db.ref('profiles').on('value', snap => {
      const data = snap.val();
      // Reset to empty so onboarding triggers if profiles were wiped
      NAMES.her = (data && data.her) || '';
      NAMES.him = (data && data.him) || '';
      NICKNAMES.herCallsHim = (data && data.herCallsHim) || '';
      NICKNAMES.himCallsHer = (data && data.himCallsHer) || '';
      if (data && data.apiKey) CLAUDE_API_KEY = data.apiKey;
      if (user) {
        document.querySelectorAll('.uname').forEach(e => e.textContent = NAMES[user]);
        document.querySelectorAll('.pname').forEach(e => e.textContent = NAMES[partner]);
        const myNick = user === 'her' ? NICKNAMES.herCallsHim : NICKNAMES.himCallsHer;
        document.querySelectorAll('.partner-nick').forEach(e => e.textContent = myNick || NAMES[partner]);
      }
      resolve();
    });
  });
}

function needsOnboarding() {
  return !NAMES[user] || NAMES[user] === 'Her' || NAMES[user] === 'Him';
}

// ===== ONBOARDING FLOW =====
let onboardStep = 0;
let onboardData = { name: '', nickname: '', anniversary: '' };
const OB_TOTAL = 7;

function startOnboarding() {
  onboardStep = 0;
  onboardData = { name: '', nickname: '', anniversary: '' };
  const el = document.getElementById('login');
  el.classList.add('onboard-active');
  renderOnboardStep();
}

function obProgress() {
  return Math.round(((onboardStep) / (OB_TOTAL - 1)) * 100);
}

function renderDots(active) {
  return Array.from({length: OB_TOTAL}, (_, i) =>
    `<span class="onboard-dot${i === active ? ' active' : ''}${i < active ? ' done' : ''}"></span>`
  ).join('');
}

function renderOnboardStep() {
  const el = document.getElementById('login');
  const isHer = user === 'her';
  const partnerLabel = isHer ? 'him' : 'her';
  const pct = obProgress();

  const steps = [
    // Step 0: Personalized Welcome
    `<div class="onboard-wrap">
      <div class="onboard-progress"><div class="onboard-bar" style="width:${pct}%"></div></div>
      <div class="login-logo">M&T</div>
      <h1 class="onboard-title">${isHer ? "Hey Baby" : "Welcome"}</h1>
      <p class="onboard-sub">${isHer
        ? "I'm sorry baby, let's start over.<br>Let me set things up right this time."
        : "Let's build our space together.<br>This only takes a moment."
      }</p>
      <button onclick="onboardNext()" class="login-btn">${isHer ? "Okay, let's go" : "Let's begin"}</button>
      <div class="onboard-dots">${renderDots(0)}</div>
    </div>`,

    // Step 1: Your name
    `<div class="onboard-wrap">
      <div class="onboard-progress"><div class="onboard-bar" style="width:${pct}%"></div></div>
      <div class="onboard-emoji">👋</div>
      <h1 class="onboard-title">What's your name?</h1>
      <p class="onboard-sub">This is how your partner will see you in the app.</p>
      <input type="text" id="ob-name" class="login-input mb16" placeholder="Your first name..." autocomplete="off"
             enterkeyhint="next" onkeydown="if(event.key==='Enter'){event.preventDefault();onboardNext()}">
      <button onclick="onboardNext()" class="login-btn">Continue</button>
      <div class="onboard-dots">${renderDots(1)}</div>
    </div>`,

    // Step 2: Nickname for partner
    `<div class="onboard-wrap">
      <div class="onboard-progress"><div class="onboard-bar" style="width:${pct}%"></div></div>
      <div class="onboard-emoji">${isHer ? '💜' : '💛'}</div>
      <h1 class="onboard-title">What do you call ${partnerLabel}?</h1>
      <p class="onboard-sub">A pet name, nickname, or their real name — whatever feels like you.</p>
      <input type="text" id="ob-nickname" class="login-input mb16"
             placeholder="${isHer ? 'Baby, Babe, His name...' : 'Babe, Love, Her name...'}" autocomplete="off"
             enterkeyhint="next" onkeydown="if(event.key==='Enter'){event.preventDefault();onboardNext()}">
      <button onclick="onboardNext()" class="login-btn">Continue</button>
      <div class="onboard-dots">${renderDots(2)}</div>
    </div>`,

    // Step 3: Anniversary
    `<div class="onboard-wrap">
      <div class="onboard-progress"><div class="onboard-bar" style="width:${pct}%"></div></div>
      <div class="onboard-emoji">📅</div>
      <h1 class="onboard-title">When did it start?</h1>
      <p class="onboard-sub">The day you two became official. This powers your "Days Together" count.</p>
      <input type="date" id="ob-anniversary" class="login-input mb16" style="color-scheme:light">
      <button onclick="onboardNext()" class="login-btn">Continue</button>
      <p class="onboard-skip" onclick="onboardNext()">Skip for now</p>
      <div class="onboard-dots">${renderDots(3)}</div>
    </div>`,

    // Step 4: Tour — Home
    `<div class="onboard-wrap">
      <div class="onboard-progress"><div class="onboard-bar" style="width:${pct}%"></div></div>
      <h1 class="onboard-title">Your Home</h1>
      <div class="ob-tour-card">
        <div class="ob-tour-row"><span class="ob-tour-ico">🏠</span><div><strong>Home</strong><br>Your dashboard — mood, daily questions, streaks, and a pulse on your relationship.</div></div>
        <div class="ob-tour-row"><span class="ob-tour-ico">💕</span><div><strong>Together</strong><br>Letters, games, date nights, check-ins — everything you do as a couple.</div></div>
      </div>
      <button onclick="onboardNext()" class="login-btn">Next</button>
      <div class="onboard-dots">${renderDots(4)}</div>
    </div>`,

    // Step 5: Tour — Wellness, Plan, More
    `<div class="onboard-wrap">
      <div class="onboard-progress"><div class="onboard-bar" style="width:${pct}%"></div></div>
      <h1 class="onboard-title">Your Tools</h1>
      <div class="ob-tour-card">
        <div class="ob-tour-row"><span class="ob-tour-ico">📊</span><div><strong>Wellness</strong><br>Track mood, fitness, nutrition, and gratitude — individually and together.</div></div>
        <div class="ob-tour-row"><span class="ob-tour-ico">🌍</span><div><strong>Plan</strong><br>Dreams, calendar, finances, your dream home, shared values and wishlists.</div></div>
        <div class="ob-tour-row"><span class="ob-tour-ico">✨</span><div><strong>More</strong><br>AI chat, memories, achievements, and settings.</div></div>
      </div>
      <button onclick="onboardNext()" class="login-btn">Got it</button>
      <div class="onboard-dots">${renderDots(5)}</div>
    </div>`,

    // Step 6: Done
    `<div class="onboard-wrap">
      <div class="onboard-progress"><div class="onboard-bar" style="width:100%"></div></div>
      <div class="onboard-emoji">✨</div>
      <h1 class="onboard-title">${isHer ? "All yours, baby" : "You're all set"}</h1>
      <p class="onboard-sub">
        Welcome, <strong>${esc(onboardData.name)}</strong>.<br>
        Your partner is <strong>${esc(onboardData.nickname)}</strong> in here.
        ${onboardData.anniversary ? '<br>Counting the days since <strong>' + onboardData.anniversary + '</strong>.' : ''}
      </p>
      <button onclick="finishOnboarding()" class="login-btn">Enter Moi & Toi</button>
      <div class="onboard-dots">${renderDots(6)}</div>
    </div>`
  ];

  el.innerHTML = steps[onboardStep];

  // On mobile, programmatic focus() won't open the keyboard —
  // only a real user tap does. Scroll input into view and when
  // they tap it, ensure it stays visible above the keyboard.
  const input = el.querySelector('input');
  if (input) {
    setTimeout(() => input.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    input.addEventListener('focus', () => {
      setTimeout(() => input.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
    });
  }
}

function onboardNext() {
  if (onboardStep === 1) {
    const name = (document.getElementById('ob-name') || {}).value;
    if (!name || !name.trim()) { toast('Please enter your name'); return; }
    onboardData.name = name.trim();
  }
  if (onboardStep === 2) {
    const nick = (document.getElementById('ob-nickname') || {}).value;
    if (!nick || !nick.trim()) { toast('Enter what you call them'); return; }
    onboardData.nickname = nick.trim();
  }
  if (onboardStep === 3) {
    const anniv = (document.getElementById('ob-anniversary') || {}).value;
    if (anniv) onboardData.anniversary = anniv;
  }
  onboardStep++;
  renderOnboardStep();
}

async function finishOnboarding() {
  NAMES[user] = onboardData.name;
  const nickKey = user === 'him' ? 'himCallsHer' : 'herCallsHim';
  NICKNAMES[nickKey] = onboardData.nickname;
  const updates = {
    [user]: onboardData.name,
    [nickKey]: onboardData.nickname
  };
  await db.ref('profiles').update(updates);
  if (onboardData.anniversary) {
    await db.ref('settings/anniversary').set(onboardData.anniversary);
  }
  document.getElementById('login').classList.remove('onboard-active');
  finishLogin();
}

function showWelcomeGate() {
  const form = document.getElementById('login-form');
  const gate = document.getElementById('welcome-gate');
  const greeting = document.getElementById('welcome-greeting');
  hideEl(form);
  showEl(gate);
  const h = new Date().getHours();
  const timeLabel = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  if (greeting) greeting.textContent = timeLabel + ', ' + (NAMES[user] || '');
}

function finishLogin() {
  document.getElementById('login').classList.add('h');
  document.getElementById('shell').classList.add('on');
  document.querySelectorAll('.uname').forEach(e => e.textContent = NAMES[user]);
  document.querySelectorAll('.pname').forEach(e => e.textContent = NAMES[partner]);
  if(user==='him'){var ki=document.querySelector('[onclick*="sendTap(event,\'kiss\'"]');if(ki){var ic=ki.querySelector('.pill-ico');if(ic)ic.textContent='😘';}}
  // Handle PWA shortcut deep links
  const startPage = new URLSearchParams(window.location.search).get('page');
  go(startPage || 'dash');
  listenMoods();
  listenTaps();
  listenLetters();
  listenOpenWhenLetters();
  listenMilestones();
  listenCountdowns();
  listenDailyAnswers();
  listenStreak();
  listenGratitude();
  loadDailyQuestion();
  loadWYR();
  listenQuiz();
  listenBucketList();
  listenWishlists();
  loadTOT();
  renderStreakCalendar();
  updateEnhancedCompat();
  listenGameInvites();
  renderAllGameStats();
  // New modules
  listenDateNights();
  listenChallenges();
  loadLLQuiz();
  loadASQuiz();
  listenCheckins();
  listenDreams();
  loadAffirmation();
  loadMotivation();
  loadCycleData();
  loadSelfCare();
  listenPRs();
  loadClarity();
  listenPersonalGoals('her');
  listenPersonalGoals('him');
  // New modules v2
  listenPhrases();
  listenTraditions();
  listenRecipes();
  loadDeepTalk();
  listenConvoNotes();
  renderFamDiscussions();
  listenBabyNames();
  listenFamilyGoals();
  listenValues();
  loadAgreements();
  listenCustomAgreements();
  loadDevotional();
  listenPrayers();
  listenBlessings();
  listenIntentions();
  listenSavings();
  listenMeals();
  listenChores();
  listenExpenses();
  listenSharedGoals();
  listenHabits();
  listenGrocery();
  listenSharedTodos();
  enforcePrivacy();
  // Dashboard UX
  renderDashHero();
  renderDashDailyQ();
  renderDailyTasks();
  renderActivityFeed();
  renderDashMeGratitude();
  renderDashMeAffirmation();
  initMetricsEngine(); // Phase 15: data engine replaces calculateRelationshipPulse
  listenMoodUpdates(); // incremental mood index updates
  onMetricsUpdate(() => renderRelHealthCard());
  initDynamicVisuals();
  initViewToggle();
  // New modules v3 - enhanced features
  listenFitnessData();
  listenNutritionData();
  listenCalendarEvents();
  listenDreamHome();
  loadDHVisions();
  listenKnowYou();
  loadIdentityProfiles();
  listenMemories();
  listenAchievements();
  listenGrowData();
  // Particles, global mode, presence
  initParticles();
  setGlobalMode(localStorage.getItem('met_global_mode') || 'us');
  initPresence();
  // Nav enhancements: swipe gestures, tab indicator, badges
  initSwipeNav();
  initCollapsingHeader();
  setTimeout(updateNavIndicator, 100);
  // Hub & module statuses
  setTimeout(() => { updateHubStatuses(); updateModuleStats(); updateDashQuickNav(); checkAchievements(); updateNavBadges(); initHubPages(); }, 1500);
  // Refresh badges periodically
  setInterval(updateNavBadges, 60000);
}

function switchUser() { firebase.auth().signOut(); location.reload(); }
function logout() { firebase.auth().signOut(); location.reload(); }

async function clearAllData() {
  if (!db) { toast('Not connected'); return; }
  try {
    // Preserve only the API key
    const snap = await db.ref('profiles/apiKey').once('value');
    const apiKey = snap.val();
    // Wipe everything
    await db.ref('/').remove();
    // Restore only API key
    if (apiKey) await db.ref('profiles/apiKey').set(apiKey);
    // Clear local caches
    ['met_last_reminder', 'met_recent_pages'].forEach(k => localStorage.removeItem(k));
    toast('All data cleared — onboarding will restart');
    setTimeout(() => location.reload(), 1000);
  } catch (e) {
    toast('Clear failed');
    console.error(e);
  }
}

async function exportAllData() {
  if (!db) { toast('Not connected'); return; }
  toast('Preparing export...');
  try {
    const snap = await db.ref('/').once('value');
    const data = snap.val();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moiettoi-backup-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Data exported!');
  } catch (e) {
    toast('Export failed');
    console.error(e);
  }
}

function updateApiKey() {
  openModal(`<div style="text-align:left">
    <h3 style="margin:0 0 12px;font-size:16px;color:var(--t1)">API Key</h3>
    <input id="api-key-input" type="text" class="form-input" placeholder="sk-ant-..." value="${esc(CLAUDE_API_KEY || '')}" style="width:100%;font-size:14px;font-family:monospace">
    <div style="display:flex;gap:8px;margin-top:14px">
      <button class="btn-sm" onclick="closeModal()" style="flex:1;background:var(--card-bg);color:var(--t2)">Cancel</button>
      <button class="btn-sm" onclick="submitApiKey()" style="flex:1">Save</button>
    </div>
  </div>`);
  setTimeout(function(){ var el=document.getElementById('api-key-input'); if(el) el.focus(); }, 100);
}
function submitApiKey() {
  var key = (document.getElementById('api-key-input') || {}).value || '';
  key = key.trim();
  if (key && key.startsWith('sk-ant-')) {
    CLAUDE_API_KEY = key;
    db.ref('profiles/apiKey').set(key);
    closeModal(); toast('API key updated');
  } else if (key) { toast('Invalid key format'); }
  else { closeModal(); }
}


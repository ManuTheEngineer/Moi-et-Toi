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
// Uses DOM elements defined in index.html (not innerHTML) so mobile
// keyboards work reliably — iOS won't open keyboards for dynamically
// injected inputs inside position:fixed containers.
let onboardStep = 0;
let onboardData = { name: '', nickname: '', anniversary: '' };
const OB_TOTAL = 7;

function startOnboarding() {
  onboardStep = 0;
  onboardData = { name: '', nickname: '', anniversary: '' };
  // Hide login chrome, show onboard container
  hideEl('login-form');
  hideEl('welcome-gate');
  var logo = document.getElementById('login-logo');
  var heading = document.getElementById('login-heading');
  var sub = document.getElementById('login-sub');
  if (logo) logo.style.display = 'none';
  if (heading) heading.style.display = 'none';
  if (sub) sub.style.display = 'none';
  showEl('onboard-steps');
  renderOnboardStep();
}

function renderDots(active) {
  return Array.from({length: OB_TOTAL}, (_, i) =>
    `<span class="onboard-dot${i === active ? ' active' : ''}${i < active ? ' done' : ''}"></span>`
  ).join('');
}

function renderOnboardStep() {
  const isHer = user === 'her';
  const partnerLabel = isHer ? 'him' : 'her';
  const pct = Math.round((onboardStep / (OB_TOTAL - 1)) * 100);

  // References
  const bar = document.getElementById('ob-bar');
  const emoji = document.getElementById('ob-emoji');
  const title = document.getElementById('ob-title');
  const sub = document.getElementById('ob-sub');
  const btn = document.getElementById('ob-btn');
  const skip = document.getElementById('ob-skip');
  const dots = document.getElementById('ob-dots');
  const tour = document.getElementById('ob-tour');
  const nameIn = document.getElementById('ob-name');
  const nickIn = document.getElementById('ob-nickname');
  const annivIn = document.getElementById('ob-anniversary');

  // Progress
  bar.style.width = pct + '%';
  dots.innerHTML = renderDots(onboardStep);

  // Hide all optional elements
  emoji.style.display = 'none';
  nameIn.style.display = 'none';
  nickIn.style.display = 'none';
  annivIn.style.display = 'none';
  tour.style.display = 'none';
  skip.style.display = 'none';

  // Configure each step
  if (onboardStep === 0) {
    // Welcome
    title.textContent = isHer ? 'Hey Baby' : 'Welcome';
    sub.innerHTML = isHer
      ? "I'm sorry baby, let's start over.<br>Let me set things up right this time."
      : "Let's build our space together.<br>This only takes a moment.";
    btn.textContent = isHer ? "Okay, let's go" : "Let's begin";
  } else if (onboardStep === 1) {
    // Name
    emoji.textContent = '👋'; emoji.style.display = '';
    title.textContent = "What's your name?";
    sub.textContent = 'This is how your partner will see you in the app.';
    nameIn.style.display = ''; nameIn.value = onboardData.name;
    btn.textContent = 'Continue';
  } else if (onboardStep === 2) {
    // Nickname
    emoji.textContent = isHer ? '💜' : '💛'; emoji.style.display = '';
    title.textContent = 'What do you call ' + partnerLabel + '?';
    sub.textContent = 'A pet name, nickname, or their real name — whatever feels like you.';
    nickIn.placeholder = isHer ? 'Baby, Babe, His name...' : 'Babe, Love, Her name...';
    nickIn.style.display = ''; nickIn.value = onboardData.nickname;
    btn.textContent = 'Continue';
  } else if (onboardStep === 3) {
    // Anniversary
    emoji.textContent = '📅'; emoji.style.display = '';
    title.textContent = 'When did it start?';
    sub.textContent = 'The day you two became official. This powers your "Days Together" count.';
    annivIn.style.display = '';
    skip.style.display = '';
    btn.textContent = 'Continue';
  } else if (onboardStep === 4) {
    // Tour 1
    title.textContent = 'Your Home';
    sub.textContent = '';
    tour.style.display = '';
    tour.innerHTML = '<div class="ob-tour-card">'
      + '<div class="ob-tour-row"><span class="ob-tour-ico">🏠</span><div><strong>Home</strong><br>Your dashboard — mood, daily questions, streaks, and a pulse on your relationship.</div></div>'
      + '<div class="ob-tour-row"><span class="ob-tour-ico">💕</span><div><strong>Together</strong><br>Letters, games, date nights, check-ins — everything you do as a couple.</div></div>'
      + '</div>';
    btn.textContent = 'Next';
  } else if (onboardStep === 5) {
    // Tour 2
    title.textContent = 'Your Tools';
    sub.textContent = '';
    tour.style.display = '';
    tour.innerHTML = '<div class="ob-tour-card">'
      + '<div class="ob-tour-row"><span class="ob-tour-ico">📊</span><div><strong>Wellness</strong><br>Track mood, fitness, nutrition, and gratitude — individually and together.</div></div>'
      + '<div class="ob-tour-row"><span class="ob-tour-ico">🌍</span><div><strong>Plan</strong><br>Dreams, calendar, finances, your dream home, shared values and wishlists.</div></div>'
      + '<div class="ob-tour-row"><span class="ob-tour-ico">✨</span><div><strong>More</strong><br>AI chat, memories, achievements, and settings.</div></div>'
      + '</div>';
    btn.textContent = 'Got it';
  } else if (onboardStep === 6) {
    // Done
    bar.style.width = '100%';
    emoji.textContent = '✨'; emoji.style.display = '';
    title.textContent = isHer ? 'All yours, baby' : "You're all set";
    var msg = 'Welcome, <strong>' + esc(onboardData.name) + '</strong>.<br>'
      + 'Your partner is <strong>' + esc(onboardData.nickname) + '</strong> in here.';
    if (onboardData.anniversary) msg += '<br>Counting the days since <strong>' + onboardData.anniversary + '</strong>.';
    sub.innerHTML = msg;
    btn.textContent = 'Enter Moi & Toi';
    btn.onclick = function() { finishOnboarding(); };
  }
}

function onboardNext() {
  if (onboardStep === 1) {
    var name = document.getElementById('ob-name').value.trim();
    if (!name) { toast('Please enter your name'); return; }
    onboardData.name = name;
  }
  if (onboardStep === 2) {
    var nick = document.getElementById('ob-nickname').value.trim();
    if (!nick) { toast('Enter what you call them'); return; }
    onboardData.nickname = nick;
  }
  if (onboardStep === 3) {
    var anniv = document.getElementById('ob-anniversary').value;
    if (anniv) onboardData.anniversary = anniv;
  }
  onboardStep++;
  renderOnboardStep();
}

async function finishOnboarding() {
  NAMES[user] = onboardData.name;
  var nickKey = user === 'him' ? 'himCallsHer' : 'herCallsHim';
  NICKNAMES[nickKey] = onboardData.nickname;
  await db.ref('profiles').update({
    [user]: onboardData.name,
    [nickKey]: onboardData.nickname
  });
  if (onboardData.anniversary) {
    await db.ref('settings/anniversary').set(onboardData.anniversary);
  }
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


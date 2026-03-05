// ========== CONFIG ==========
// Firebase config stored in browser localStorage. Set once per device.
// Anthropic API key stored in Firebase, set once by admin.

let FIREBASE_CONFIG = null;
try { FIREBASE_CONFIG = JSON.parse(localStorage.getItem('met_fb_config')); } catch(e) {}

// API key loaded from Firebase - set once, works for both
let CLAUDE_API_KEY = "";

// Profile names - loaded from Firebase
let NAMES = { her: "Taylor", him: "Manu" };

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
        // Show welcome gate instead of auto-entering
        showWelcomeGate();
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
    
    // Check if name is set
    if (!NAMES[user] || NAMES[user] === 'Her' || NAMES[user] === 'Him') {
      showNameSetup();
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
      if (data) {
        if (data.her) NAMES.her = data.her;
        if (data.him) NAMES.him = data.him;
        if (data.apiKey) CLAUDE_API_KEY = data.apiKey;
      }
      if (user) {
        document.querySelectorAll('.uname').forEach(e => e.textContent = NAMES[user]);
        document.querySelectorAll('.pname').forEach(e => e.textContent = NAMES[partner]);
      }
      resolve();
    });
  });
}

function showNameSetup() {
  document.getElementById('login').innerHTML = `
    <div class="login-logo">M&T</div>
    <h1>Manu & Taylor</h1>
    <div class="sub">Almost there</div>
    <div class="lbl">What should we call you?</div>
    <input type="text" id="name-input" class="login-input mb16" placeholder="Your name..."
           onkeydown="if(event.key==='Enter')saveName()">
    <button onclick="saveName()" class="login-btn">Let's go</button>
  `;
  setTimeout(() => document.getElementById('name-input').focus(), 300);
}

async function saveName() {
  const name = document.getElementById('name-input').value.trim();
  if (!name) { toast('Enter your name'); return; }
  NAMES[user] = name;
  await db.ref('profiles/' + user).set(name);
  finishLogin();
}

function showWelcomeGate() {
  const form = document.getElementById('login-form');
  const gate = document.getElementById('welcome-gate');
  const greeting = document.getElementById('welcome-greeting');
  if (form) form.style.display = 'none';
  if (gate) gate.style.display = '';
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
  go('dash');
  listenMoods();
  listenTaps();
  listenLetters();
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
  initViewToggle();
  // New modules v3 - enhanced features
  listenFitnessData();
  listenNutritionData();
  listenCalendarEvents();
  listenDreamHome();
  listenKnowYou();
  listenMemories();
  listenAchievements();
  listenGrowData();
  // Particles, global mode, presence
  initParticles();
  setGlobalMode(localStorage.getItem('met_global_mode') || 'us');
  initPresence();
  // Nav enhancements: swipe gestures, tab indicator, badges
  initSwipeNav();
  setTimeout(updateNavIndicator, 100);
  // Hub & module statuses
  setTimeout(() => { updateHubStatuses(); updateModuleStats(); updateDashQuickNav(); checkAchievements(); updateNavBadges(); }, 1500);
  // Refresh badges periodically
  setInterval(updateNavBadges, 60000);
}

function switchUser() { firebase.auth().signOut(); location.reload(); }
function logout() { firebase.auth().signOut(); location.reload(); }
function updateApiKey() {
  const key = prompt('Enter Anthropic API key:', CLAUDE_API_KEY || '');
  if (key && key.startsWith('sk-ant-')) {
    CLAUDE_API_KEY = key;
    db.ref('profiles/apiKey').set(key);
    toast('API key updated');
    closeMenu();
  } else if (key) { toast('Invalid key format'); }
}


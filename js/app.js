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
  // Show Face ID hint if biometrics available
  updateBiometricHint();
}

// ===== BIOMETRIC (Face ID / Touch ID) =====

function isBiometricAvailable() {
  return window.PublicKeyCredential &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
}

async function checkBiometricSupport() {
  if (!isBiometricAvailable()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch(e) { return false; }
}

function getBiometricCredId() {
  try { return localStorage.getItem('met_bio_cred_' + user); } catch(e) { return null; }
}

function saveBiometricCredId(id) {
  try { localStorage.setItem('met_bio_cred_' + user, id); } catch(e) {}
}

function arrayBufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToArrayBuf(b64) {
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function registerBiometric() {
  const supported = await checkBiometricSupport();
  if (!supported) return false;
  try {
    const userId = new TextEncoder().encode(authUser.uid);
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: { name: 'Manu & Taylor', id: location.hostname },
        user: {
          id: userId,
          name: authUser.email,
          displayName: NAMES[user] || authUser.email
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' }
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'none'
      }
    });
    if (credential && credential.rawId) {
      saveBiometricCredId(arrayBufToBase64(credential.rawId));
      return true;
    }
    return false;
  } catch(e) {
    console.log('Biometric registration skipped:', e.message);
    return false;
  }
}

async function verifyBiometric() {
  const credId = getBiometricCredId();
  if (!credId) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge,
        allowCredentials: [{
          id: base64ToArrayBuf(credId),
          type: 'public-key',
          transports: ['internal']
        }],
        userVerification: 'required',
        timeout: 60000
      }
    });
    return !!assertion;
  } catch(e) {
    console.log('Biometric verification failed:', e.message);
    return false;
  }
}

async function updateBiometricHint() {
  const hint = document.getElementById('bio-hint');
  if (!hint) return;
  const supported = await checkBiometricSupport();
  if (supported) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    hint.textContent = isIOS ? 'Face ID protected' : 'Biometric protected';
    hint.style.display = '';
  } else {
    hint.style.display = 'none';
  }
}

async function enterWithBiometric() {
  const enterBtn = document.getElementById('enter-btn');
  const supported = await checkBiometricSupport();

  if (!supported) {
    finishLogin();
    return;
  }

  const credId = getBiometricCredId();

  if (!credId) {
    // First time: register biometric credential
    if (enterBtn) { enterBtn.textContent = 'Setting up...'; enterBtn.disabled = true; }
    const registered = await registerBiometric();
    if (enterBtn) { enterBtn.textContent = 'Enter'; enterBtn.disabled = false; }
    if (registered) {
      toast('Biometric set up successfully!');
    }
    finishLogin();
    return;
  }

  // Returning user: verify with biometric
  if (enterBtn) { enterBtn.textContent = 'Verifying...'; enterBtn.disabled = true; }
  const verified = await verifyBiometric();
  if (enterBtn) { enterBtn.textContent = 'Enter'; enterBtn.disabled = false; }

  if (verified) {
    finishLogin();
  } else {
    showError('Verification failed. Try again.');
  }
}

function finishLogin() {
  document.getElementById('login').classList.add('h');
  document.getElementById('shell').classList.add('on');
  document.querySelectorAll('.uname').forEach(e => e.textContent = NAMES[user]);
  document.querySelectorAll('.pname').forEach(e => e.textContent = NAMES[partner]);
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


// ========== CONFIG ==========
// Firebase config stored in browser localStorage. Set once per device.
// Anthropic API key stored in Firebase, set once by admin.

let FIREBASE_CONFIG = null;
try { FIREBASE_CONFIG = JSON.parse(localStorage.getItem('met_fb_config')); } catch(e) {}

// API key loaded from Firebase - set once, works for both
let CLAUDE_API_KEY = "";
// Proxy URL for Claude API — set this to your deployed proxy (e.g. Cloudflare Worker)
// When set, API calls go through the proxy and the key stays server-side.
let AI_PROXY_URL = localStorage.getItem('met_ai_proxy') || "";

// Profile names & nicknames - loaded from Firebase
let NAMES = { her: "", him: "" };
let NICKNAMES = { herCallsHim: "", himCallsHer: "" };

// ==========================================

let db, user, partner, authUser, selectedMood = 0, logExercises = [], logType = '', chatHistory = [];

// Map email to profile role — loaded from Firebase at init
let EMAIL_MAP = {};

// ===== FIREBASE LISTENER REGISTRY =====
// Tracks all .on() listeners so they can be cleaned up per-page or globally
const _fbListeners = []; // { ref, event, callback, page }

function fbOn(ref, event, callback, page) {
  page = page || '_global';
  ref.on(event, callback);
  _fbListeners.push({ ref, event, callback, page });
}

function fbOff(page) {
  for (let i = _fbListeners.length - 1; i >= 0; i--) {
    if (_fbListeners[i].page === page) {
      _fbListeners[i].ref.off(_fbListeners[i].event, _fbListeners[i].callback);
      _fbListeners.splice(i, 1);
    }
  }
}

function fbOffAll() {
  _fbListeners.forEach(l => l.ref.off(l.event, l.callback));
  _fbListeners.length = 0;
}

// ===== CONNECTION STATE MONITOR =====
let _isOnline = true;
function initConnectionMonitor() {
  if (!db) return;
  const connRef = db.ref('.info/connected');
  connRef.on('value', snap => {
    _isOnline = snap.val() === true;
    const banner = document.getElementById('offline-banner');
    if (banner) banner.classList.toggle('show', !_isOnline);
    document.body.classList.toggle('app-offline', !_isOnline);
  });
}
function isOnline() { return _isOnline; }

// ===== INIT =====
async function init() {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.database();

  // Enable offline persistence — caches data locally so app works offline
  try { db.goOnline(); } catch(e) {}
  // Keep key refs synced for offline access
  ['moods', 'letters', 'taps', 'streaks', 'gratitude', 'profiles', 'config/emailMap'].forEach(function(p) {
    db.ref(p).keepSynced(true);
  });

  // Start connection state monitoring
  initConnectionMonitor();

  // Load email-to-role mapping from Firebase (keeps emails out of source code)
  await loadEmailMap();

  // Check if already signed in
  firebase.auth().onAuthStateChanged(async (fbUser) => {
    if (fbUser) {
      authUser = fbUser;
      // Retry loading email map if it's empty — Firebase rules may require auth
      if (Object.keys(EMAIL_MAP).length === 0) {
        await loadEmailMap();
      }
      const role = EMAIL_MAP[fbUser.email];
      if (role) {
        user = role;
        partner = role === 'her' ? 'him' : 'her';
        await loadProfiles();
        // Load living sky preference
        db.ref('settings/livingSky/' + role).once('value', snap => {
          var val = snap.val();
          livingSkyEnabled = val !== false;
          setLivingSky(livingSkyEnabled);
        });
        if (needsOnboarding()) {
          startOnboarding();
        } else {
          finishLogin();
        }
      } else {
        firebase.auth().signOut();
        showError(Object.keys(EMAIL_MAP).length === 0
          ? 'Could not verify account. Check your connection and try again.'
          : 'Account not authorized.');
      }
    }
  });
}

// Load email-to-role mapping from Firebase, with localStorage fallback.
// Seeds the default map into Firebase if the node doesn't exist yet.
const DEFAULT_EMAIL_MAP = {
  'abokemmanuel1@gmail.com': 'him',
  'takelley11@gmail.com': 'her'
};

async function loadEmailMap() {
  try {
    const snap = await db.ref('config/emailMap').once('value');
    const val = snap.val();
    if (val && Object.keys(val).length > 0) {
      EMAIL_MAP = val;
      try { localStorage.setItem('met_email_map', JSON.stringify(val)); } catch(e) {}
      return;
    }
  } catch(e) {
    console.warn('Could not load email map from Firebase:', e);
  }
  // Fall back to localStorage cache
  try {
    const cached = JSON.parse(localStorage.getItem('met_email_map'));
    if (cached && Object.keys(cached).length > 0) {
      EMAIL_MAP = cached;
      return;
    }
  } catch(e) {}
  // If still empty, seed default map into Firebase and use it
  if (Object.keys(EMAIL_MAP).length === 0) {
    EMAIL_MAP = DEFAULT_EMAIL_MAP;
    try { localStorage.setItem('met_email_map', JSON.stringify(EMAIL_MAP)); } catch(e) {}
    try { await db.ref('config/emailMap').set(DEFAULT_EMAIL_MAP); } catch(e) {
      console.warn('Could not seed email map to Firebase:', e);
    }
  }
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-pass').value;
  
  if (!email || !pass) { showError('Enter email and password'); return; }
  
  try {
    const result = await firebase.auth().signInWithEmailAndPassword(email, pass);
    authUser = result.user;
    // Reload email map now that we're authenticated (rules may require auth)
    if (Object.keys(EMAIL_MAP).length === 0) {
      await loadEmailMap();
    }
    const role = EMAIL_MAP[email];

    if (!role) {
      firebase.auth().signOut();
      showError(Object.keys(EMAIL_MAP).length === 0
        ? 'Could not verify account. Check your connection and try again.'
        : 'Account not authorized.');
      return;
    }
    
    user = role;
    partner = role === 'her' ? 'him' : 'her';
    await loadProfiles();
    // Load living sky preference
    db.ref('settings/livingSky/' + role).once('value', snap => {
      var val = snap.val();
      livingSkyEnabled = val !== false;
      setLivingSky(livingSkyEnabled);
    });
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
      NAMES.her = esc((data && data.her) || '');
      NAMES.him = esc((data && data.him) || '');
      NICKNAMES.herCallsHim = esc((data && data.herCallsHim) || '');
      NICKNAMES.himCallsHer = esc((data && data.himCallsHer) || '');
      if (data && data.apiKey) CLAUDE_API_KEY = data.apiKey;
      // Use the nickname the current user gave their partner as the display name
      if (user) {
        const nick = user === 'him' ? NICKNAMES.himCallsHer : NICKNAMES.herCallsHim;
        if (nick) NAMES[partner] = nick;
        document.querySelectorAll('.uname').forEach(e => e.textContent = NAMES[user]);
        document.querySelectorAll('.pname').forEach(e => e.textContent = NAMES[partner]);
        document.querySelectorAll('.partner-nick').forEach(e => e.textContent = NAMES[partner]);
      }
      resolve();
    });
  });
}

// Photo that partner chose for you - listen for changes
let myPhoto = '';
function listenPhoto() {
  if (!db || !user) return;
  db.ref('photos/' + user).on('value', snap => {
    const d = snap.val();
    myPhoto = (d && d.data) || '';
    applyPhoto();
  });
}

function applyPhoto() {
  // Welcome gate
  const welcomeEl = document.getElementById('welcome-photo');
  if (welcomeEl) {
    welcomeEl.innerHTML = myPhoto
      ? '<img src="' + myPhoto + '" class="welcome-photo-img" alt="">'
      : '';
  }
  // Dashboard partner avatar (show PARTNER's photo of you - but on your dashboard
  // you see the photo you chose for THEM, so load partner's photo)
}

// Load the photo YOU chose for your partner (shown on your dashboard next to their name)
let partnerPhoto = '';
function listenPartnerPhoto() {
  if (!db || !partner) return;
  db.ref('photos/' + partner).on('value', snap => {
    const d = snap.val();
    partnerPhoto = (d && d.data) || '';
    applyPartnerPhoto();
  });
}

function applyPartnerPhoto() {
  const avatarEl = document.getElementById('dash-partner-avatar');
  if (avatarEl) {
    if (partnerPhoto) {
      avatarEl.style.backgroundImage = 'url(' + partnerPhoto + ')';
      avatarEl.classList.add('has-photo');
    } else {
      avatarEl.style.backgroundImage = '';
      avatarEl.classList.remove('has-photo');
    }
  }
}

// Change partner photo (daily update from dashboard)
function changePartnerPhoto() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function() {
    if (!input.files || !input.files[0]) return;
    resizePhoto(input.files[0], function(dataUrl) {
      db.ref('photos/' + partner).set({
        data: dataUrl, setBy: user, timestamp: Date.now()
      });
      toast('New photo set for ' + NAMES[partner]);
    });
  };
  input.click();
}

function needsOnboarding() {
  return !NAMES[user] || NAMES[user] === 'Her' || NAMES[user] === 'Him';
}

// ===== ONBOARDING FLOW =====
// Uses DOM elements defined in index.html (not innerHTML) so mobile
// keyboards work reliably - iOS won't open keyboards for dynamically
// injected inputs inside position:fixed containers.
let onboardStep = 0;
let onboardData = {
  name: '', nickname: '', anniversary: '', photo: '', livingSky: true,
  skyTheme: 'mixed', natureSoundsEnabled: false,
  birthday: '',
  mood: 0, energy: 0, stress: 0,
  heightFt: '', heightIn: '', weight: '', activityLevel: '', fitnessGoal: '',
  commRating: 0, qualityRating: 0, connectedRating: 0,
  agreementsMine: [], agreementsTogether: [],
  morningMsgEnabled: true, morningCustomMsg: ''
};
const OB_TOTAL = 15;

function startOnboarding() {
  onboardStep = 0;
  onboardData = {
    name: '', nickname: '', anniversary: '', photo: '', livingSky: true,
    skyTheme: 'mixed', natureSoundsEnabled: false,
    birthday: '',
    mood: 0, energy: 0, stress: 0,
    heightFt: '', heightIn: '', weight: '', activityLevel: '', fitnessGoal: '',
    commRating: 0, qualityRating: 0, connectedRating: 0,
    agreementsMine: [], agreementsTogether: [],
    morningMsgEnabled: true, morningCustomMsg: ''
  };
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
  // Switch login from position:fixed to absolute so iOS keyboard works
  document.getElementById('login').classList.add('onboard-active');
  // Ensure time-of-day is set so onboarding background matches current time
  if (typeof updateTimeOfDay === 'function') updateTimeOfDay();
  // Set initial content to enter state
  var content = document.getElementById('ob-content');
  if (content) { content.classList.remove('ob-exit'); content.classList.add('ob-enter'); }
  // Broadcast onboarding status and listen for partner
  obBroadcastStep();
  obListenPartner();
  renderOnboardStep();
}

// Broadcast current onboarding step to Firebase
function obBroadcastStep() {
  if (!db || !user) return;
  db.ref('onboarding/' + user).set({
    step: onboardStep,
    name: onboardData.name || '',
    timestamp: Date.now(),
    active: true
  });
}

// Listen for partner's onboarding progress
var obPartnerListener = null;
function obListenPartner() {
  if (!db || !partner) return;
  obPartnerListener = db.ref('onboarding/' + partner);
  obPartnerListener.on('value', function(snap) {
    var data = snap.val();
    var el = document.getElementById('ob-partner-status');
    if (!el) return;
    if (data && data.active) {
      var partnerName = data.name || (user === 'her' ? 'He' : 'She');
      var isRecent = (Date.now() - (data.timestamp || 0)) < 120000; // 2 min
      if (isRecent) {
        el.style.display = '';
        el.classList.remove('offline');
        el.innerHTML = '<span class="ob-ps-dot"></span> ' + esc(partnerName) + ' is setting up too';
      } else {
        el.style.display = '';
        el.classList.add('offline');
        el.innerHTML = '<span class="ob-ps-dot"></span> ' + esc(partnerName) + ' started setup earlier';
      }
    } else {
      el.style.display = '';
      el.classList.add('offline');
      el.innerHTML = '<span class="ob-ps-dot"></span> Waiting for your partner to start';
    }
  });
}

// Clean up onboarding status when done
function obCleanupStatus() {
  if (db && user) db.ref('onboarding/' + user).update({ active: false });
  if (obPartnerListener) obPartnerListener.off();
}

function renderDots(active) {
  return Array.from({length: OB_TOTAL}, (_, i) =>
    `<span class="onboard-dot${i === active ? ' active' : ''}${i < active ? ' done' : ''}"></span>`
  ).join('');
}

// Smooth scroll for input focus - keeps input visible above keyboard
function obScrollToInput(el) {
  setTimeout(function() {
    var rect = el.getBoundingClientRect();
    var viewH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    // If input is in the lower third, scroll up
    if (rect.bottom > viewH * 0.55) {
      var loginEl = document.getElementById('login');
      var offset = rect.top - viewH * 0.35;
      loginEl.scrollTo({ top: loginEl.scrollTop + offset, behavior: 'smooth' });
    }
  }, 300);
}

// Transition between steps: fade out, update, fade in
let obTransitioning = false;
function transitionStep(setupFn) {
  var content = document.getElementById('ob-content');
  if (!content) { setupFn(); return; }

  obTransitioning = true;
  // Blur any focused input first (dismisses keyboard smoothly)
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
    document.activeElement.blur();
  }

  // Fade out
  content.classList.remove('ob-enter');
  content.classList.add('ob-exit');

  setTimeout(function() {
    setupFn();
    content.classList.remove('ob-exit');
    // Force reflow to restart animation
    void content.offsetWidth;
    content.classList.add('ob-enter');
    // Scroll back to top of login area smoothly
    var loginEl = document.getElementById('login');
    if (loginEl) loginEl.scrollTo({ top: 0, behavior: 'smooth' });
    obTransitioning = false;
  }, 250);
}

// Helper: render pill selectors
function obRenderPills(containerId, labels, dataKey) {
  var el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = labels.map(function(l, i) {
    var val = i + 1;
    var active = onboardData[dataKey] === val ? ' on' : '';
    return '<button type="button" class="ob-pill' + active + '" data-val="' + val + '" onclick="obSelectPill(this,\'' + dataKey + '\',' + val + ')">' + l + '</button>';
  }).join('');
}
function obSelectPill(btn, key, val) {
  onboardData[key] = val;
  var siblings = btn.parentElement.querySelectorAll('.ob-pill');
  siblings.forEach(function(s) { s.classList.remove('on'); });
  btn.classList.add('on');
}
function obAddAgreement(type) {
  var inputId = type === 'mine' ? 'ob-agree-mine-input' : 'ob-agree-together-input';
  var listId = type === 'mine' ? 'ob-agree-mine' : 'ob-agree-together';
  var arrKey = type === 'mine' ? 'agreementsMine' : 'agreementsTogether';
  var input = document.getElementById(inputId);
  if (!input) return;
  var val = input.value.trim();
  if (!val) return;
  onboardData[arrKey].push(val);
  input.value = '';
  obRenderAgreementList(listId, arrKey);
}
function obRemoveAgreement(type, idx) {
  var listId = type === 'mine' ? 'ob-agree-mine' : 'ob-agree-together';
  var arrKey = type === 'mine' ? 'agreementsMine' : 'agreementsTogether';
  onboardData[arrKey].splice(idx, 1);
  obRenderAgreementList(listId, arrKey);
}
function obRenderAgreementList(listId, arrKey) {
  var el = document.getElementById(listId);
  if (!el) return;
  var type = arrKey === 'agreementsMine' ? 'mine' : 'together';
  el.innerHTML = onboardData[arrKey].map(function(a, i) {
    return '<div class="ob-agree-item"><span>' + esc(a) + '</span><span class="ob-agree-rm" onclick="obRemoveAgreement(\'' + type + '\',' + i + ')">x</span></div>';
  }).join('');
}

// SVG icon helper for onboarding (inline since nav.js loads after app.js)
function _obIcon(d,s){s=s||24;return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';}
var OB_ICONS = {
  sparkle: _obIcon('<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>'),
  heart: _obIcon('<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>'),
  gift: _obIcon('<rect x="3" y="10" width="18" height="12" rx="1"/><line x1="12" y1="22" x2="12" y2="10"/><path d="M12 10H7.5a2.5 2.5 0 010-5C10 5 12 10 12 10z"/><path d="M12 10h4.5a2.5 2.5 0 000-5C14 5 12 10 12 10z"/>'),
  camera: _obIcon('<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>'),
  calendar: _obIcon('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  brain: _obIcon('<path d="M9.5 2A4.5 4.5 0 005 6.5a4.49 4.49 0 00.98 2.81A4.5 4.5 0 003 13.5a4.5 4.5 0 004.5 4.5h1V21h7v-3h1a4.5 4.5 0 004.5-4.5 4.49 4.49 0 00-2.98-4.19A4.49 4.49 0 0019 6.5 4.5 4.5 0 0014.5 2h-5z"/>'),
  dumbbell: _obIcon('<line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><rect x="6" y="7" width="3" height="10" rx="1"/><rect x="15" y="7" width="3" height="10" rx="1"/>'),
  users: _obIcon('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>'),
  handshake: _obIcon('<path d="M11 17l-5-5 1.41-1.42 2.59 2.6 5.59-5.6L17 8.97z"/><circle cx="12" cy="12" r="10"/>'),
  sunrise: _obIcon('<path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/>'),
  check: _obIcon('<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>'),
  cake: _obIcon('<path d="M20 21v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>'),
  party: _obIcon('<path d="M5.8 11.3L2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="M22 2l-2.24.75a2.9 2.9 0 00-1.96 3.12v0L18.07 8l2.14-.72a2.9 2.9 0 001.96-3.12L22 2z"/><path d="M9 2l-.75 2.24a2.9 2.9 0 003.12 1.96v0L13.5 5.93l-.72-2.14A2.9 2.9 0 009.66 1.83L9 2z"/>'),
  muscle: _obIcon('<path d="M7 12.5s1.5-2 4.5-2 4.5 2 4.5 2"/><path d="M3 8a1 1 0 011-1h1a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"/><path d="M18 8a1 1 0 011-1h1a1 1 0 011 1v8a1 1 0 01-1 1h-1a1 1 0 01-1-1V8z"/><line x1="6" y1="12" x2="18" y2="12"/>'),
  couple: _obIcon('<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>')
};

function renderOnboardStep() {
  var isHer = user === 'her';
  var partnerLabel = isHer ? 'him' : 'her';
  var partnerSubject = isHer ? 'he' : 'she';
  var partnerPossessive = isHer ? 'his' : 'her';
  // Use nickname if already entered (steps after step 2)
  var pNick = onboardData.nickname || partnerLabel;
  var pct = Math.round((onboardStep / (OB_TOTAL - 1)) * 100);

  var bar = document.getElementById('ob-bar');
  var dots = document.getElementById('ob-dots');
  bar.style.width = pct + '%';
  dots.innerHTML = renderDots(onboardStep);

  transitionStep(function() {
    var emoji = document.getElementById('ob-emoji');
    var title = document.getElementById('ob-title');
    var sub = document.getElementById('ob-sub');
    var btn = document.getElementById('ob-btn');
    var skip = document.getElementById('ob-skip');
    var tour = document.getElementById('ob-tour');
    var nameIn = document.getElementById('ob-name');
    var nickIn = document.getElementById('ob-nickname');
    var annivIn = document.getElementById('ob-anniversary');
    var photoWrap = document.getElementById('ob-photo-wrap');
    var skyCard = document.getElementById('ob-living-sky');
    var birthdayIn = document.getElementById('ob-birthday');
    var moodBL = document.getElementById('ob-mood-baseline');
    var fitBL = document.getElementById('ob-fitness-baseline');
    var relBL = document.getElementById('ob-rel-baseline');
    var agreeCard = document.getElementById('ob-agreement');
    var morningCard = document.getElementById('ob-morning-msg');
    var skyThemeCard = document.getElementById('ob-sky-theme');

    // Hide all optional elements
    [emoji, nameIn, nickIn, annivIn, photoWrap, skyCard, tour, skip,
     birthdayIn, moodBL, fitBL, relBL, agreeCard, morningCard, skyThemeCard].forEach(function(el) {
      if (el) el.style.display = 'none';
    });

    // Step 0: Welcome
    if (onboardStep === 0) {
      title.textContent = 'Your Space Awaits';
      sub.innerHTML = "Welcome to <strong>Moi & Toi</strong>, a private space just for you two.<br>Let's set up your world together.";
      btn.textContent = "Let's go";
    }
    // Step 1: Name
    else if (onboardStep === 1) {
      emoji.innerHTML = OB_ICONS.sparkle; emoji.style.display = '';
      title.textContent = "What's your name?";
      sub.textContent = "Your partner will see this throughout the app.";
      nameIn.style.display = ''; nameIn.value = onboardData.name;
      setTimeout(function(){ nameIn.focus(); }, 500);
      btn.textContent = 'Next';
    }
    // Step 2: Nickname for partner
    else if (onboardStep === 2) {
      emoji.innerHTML = OB_ICONS.heart; emoji.style.display = '';
      title.textContent = 'A name for ' + (isHer ? 'him' : 'her');
      sub.textContent = "Pet name, nickname, or real name. Whatever feels right.";
      nickIn.placeholder = isHer ? 'e.g. Baby, Babe, His name...' : 'e.g. Babe, Love, Her name...';
      nickIn.style.display = ''; nickIn.value = onboardData.nickname;
      setTimeout(function(){ nickIn.focus(); }, 500);
      btn.textContent = 'Next';
    }
    // Step 3: Birthday
    else if (onboardStep === 3) {
      emoji.innerHTML = OB_ICONS.cake; emoji.style.display = '';
      title.textContent = 'Your birthday';
      sub.textContent = "We'll celebrate you and remind " + pNick + " when the day comes.";
      birthdayIn.style.display = '';
      if (onboardData.birthday) birthdayIn.value = onboardData.birthday;
      btn.textContent = 'Next';
    }
    // Step 4: Photo
    else if (onboardStep === 4) {
      emoji.innerHTML = OB_ICONS.camera; emoji.style.display = '';
      title.textContent = 'Add a photo';
      sub.textContent = "Choose a photo of " + pNick + ". This appears on " + partnerPossessive + " profile.";
      photoWrap.style.display = '';
      skip.style.display = '';
      if (onboardData.photo) {
        var prev = document.getElementById('ob-photo-preview');
        prev.innerHTML = '<img src="' + onboardData.photo + '" alt="photo">';
      }
      btn.textContent = 'Next';
    }
    // Step 5: Anniversary
    else if (onboardStep === 5) {
      emoji.innerHTML = OB_ICONS.calendar; emoji.style.display = '';
      title.textContent = 'Your anniversary';
      sub.textContent = "When did your relationship start? We'll track your days together.";
      annivIn.style.display = '';
      skip.style.display = '';
      btn.textContent = 'Next';
    }
    // Step 6: Mood & mental baseline
    else if (onboardStep === 6) {
      emoji.innerHTML = OB_ICONS.brain; emoji.style.display = '';
      title.textContent = 'How are you today?';
      sub.textContent = "This helps the app understand where you're starting from.";
      moodBL.style.display = '';
      obRenderPills('ob-mood-pills', ['Low', 'Okay', 'Good', 'Great', 'Amazing'], 'mood');
      obRenderPills('ob-energy-pills', ['Drained', 'Tired', 'Normal', 'Energized', 'On Fire'], 'energy');
      obRenderPills('ob-stress-pills', ['Calm', 'Low', 'Moderate', 'High', 'Overwhelmed'], 'stress');
      btn.textContent = 'Next';
    }
    // Step 7: Fitness baseline
    else if (onboardStep === 7) {
      emoji.innerHTML = OB_ICONS.muscle; emoji.style.display = '';
      title.textContent = 'Your body';
      sub.textContent = "Optional baselines so your fitness journey starts on day one.";
      fitBL.style.display = '';
      skip.style.display = '';
      if (onboardData.heightFt) document.getElementById('ob-fit-height-ft').value = onboardData.heightFt;
      if (onboardData.heightIn) document.getElementById('ob-fit-height-in').value = onboardData.heightIn;
      if (onboardData.weight) document.getElementById('ob-fit-weight').value = onboardData.weight;
      obRenderPills('ob-activity-pills', ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'], 'activityLevel');
      obRenderPills('ob-goal-pills', ['Lose Weight', 'Build Muscle', 'Stay Fit', 'Get Stronger'], 'fitnessGoal');
      btn.textContent = 'Next';
    }
    // Step 8: Relationship baseline
    else if (onboardStep === 8) {
      emoji.innerHTML = OB_ICONS.couple; emoji.style.display = '';
      title.textContent = 'Your relationship';
      sub.textContent = "How do things feel right now? Honest answers help the app grow with you.";
      relBL.style.display = '';
      obRenderPills('ob-comm-pills', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], 'commRating');
      obRenderPills('ob-quality-pills', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], 'qualityRating');
      obRenderPills('ob-connected-pills', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], 'connectedRating');
      btn.textContent = 'Next';
    }
    // Step 9: Relationship agreement
    else if (onboardStep === 9) {
      emoji.innerHTML = OB_ICONS.handshake; emoji.style.display = '';
      title.textContent = 'Your agreement';
      sub.innerHTML = "Build your relationship agreement together. " + esc(pNick) + " is setting " + partnerPossessive + " right now too.";
      agreeCard.style.display = '';
      obRenderAgreementList('ob-agree-mine', 'agreementsMine');
      obRenderAgreementList('ob-agree-together', 'agreementsTogether');
      skip.style.display = '';
      btn.textContent = 'Next';
    }
    // Step 10: Daily morning message
    else if (onboardStep === 10) {
      emoji.innerHTML = OB_ICONS.sunrise; emoji.style.display = '';
      title.textContent = 'Morning messages';
      sub.innerHTML = "Every morning, " + esc(pNick) + " wakes up to a personalized message: a compliment, affirmation, or poem.";
      morningCard.style.display = '';
      document.getElementById('ob-morning-toggle').checked = onboardData.morningMsgEnabled;
      var customTA = document.getElementById('ob-morning-custom');
      if (customTA) { customTA.style.display = ''; customTA.value = onboardData.morningCustomMsg; }
      // Show preview
      var preview = document.getElementById('ob-morning-preview');
      if (preview) {
        var sampleMsgs = [
          "You are the most beautiful thing that ever happened to me. Every day with you is a gift I'll never take for granted.",
          "Good morning, sunshine. The world is better because you're in it.",
          "I hope you slept well. Just know that you're the first thing on my mind today, and every day."
        ];
        var sample = sampleMsgs[Math.floor(Math.random() * sampleMsgs.length)];
        preview.innerHTML = '"' + sample + '"<div class="ob-morning-from">...from ' + esc(onboardData.nickname || 'your love') + '</div>';
      }
      btn.textContent = 'Next';
    }
    // Step 11: Living Sky
    else if (onboardStep === 11) {
      emoji.innerHTML = OB_ICONS.sunrise; emoji.style.display = '';
      title.textContent = 'Living Sky';
      sub.innerHTML = "Your app has a living sky: sunrise, sunset, stars, birds, and fireflies that follow real time.";
      skyCard.style.display = '';
      document.getElementById('ob-sky-toggle').checked = onboardData.livingSky;
      btn.textContent = 'Next';
    }
    // Step 12: Sky environment + nature sounds
    else if (onboardStep === 12) {
      emoji.innerHTML = OB_ICONS.sunrise; emoji.style.display = '';
      title.textContent = 'Your environment';
      sub.innerHTML = "Pick the landscape that feels like home. It shapes your sky, creatures, and sounds.";
      skyThemeCard.style.display = '';
      // Pre-select based on user preference
      var defaultTheme = isHer ? 'beach' : 'mountain';
      if (!onboardData.skyTheme || onboardData.skyTheme === 'mixed') onboardData.skyTheme = defaultTheme;
      document.querySelectorAll('#ob-sky-theme-grid .sky-theme-btn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-theme') === onboardData.skyTheme);
      });
      document.getElementById('ob-nature-toggle').checked = onboardData.natureSoundsEnabled;
      // Render environment preview
      if (typeof obRenderEnvPreview === 'function') obRenderEnvPreview(onboardData.skyTheme);
      btn.textContent = 'Next';
    }
    // Step 13: All set
    else if (onboardStep === 13) {
      bar.style.width = '95%';
      emoji.innerHTML = OB_ICONS.party; emoji.style.display = '';
      title.textContent = "You're all set!";
      sub.innerHTML = "Let me give you a quick tour of your new space. It takes 30 seconds.";
      btn.textContent = 'Start tour';
    }
    // Step 14: Finish
    else if (onboardStep === 14) {
      finishOnboarding(true);
      return;
    }
  });
}

function onboardNext() {
  if (obTransitioning) return;
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
    var bday = document.getElementById('ob-birthday').value;
    if (!bday) { toast('Please enter your birthday'); return; }
    onboardData.birthday = bday;
  }
  // Step 4 is photo - optional
  if (onboardStep === 5) {
    var anniv = document.getElementById('ob-anniversary').value;
    if (anniv) onboardData.anniversary = anniv;
  }
  if (onboardStep === 6) {
    if (!onboardData.mood) { toast('How are you feeling?'); return; }
    if (!onboardData.energy) { toast('Select your energy level'); return; }
    if (!onboardData.stress) { toast('Select your stress level'); return; }
  }
  if (onboardStep === 7) {
    var ft = document.getElementById('ob-fit-height-ft').value;
    var inn = document.getElementById('ob-fit-height-in').value;
    var wt = document.getElementById('ob-fit-weight').value;
    if (ft) onboardData.heightFt = ft;
    if (inn) onboardData.heightIn = inn;
    if (wt) onboardData.weight = wt;
  }
  // Step 8: relationship baseline - ratings optional but encouraged
  if (onboardStep === 10) {
    onboardData.morningMsgEnabled = document.getElementById('ob-morning-toggle').checked;
    var customTA = document.getElementById('ob-morning-custom');
    if (customTA) onboardData.morningCustomMsg = customTA.value.trim();
  }
  if (onboardStep === 12) {
    onboardData.natureSoundsEnabled = document.getElementById('ob-nature-toggle').checked;
    // Stop any sound preview when leaving this step
    if (typeof obStopSoundPreview === 'function') obStopSoundPreview();
  }
  onboardStep++;
  obBroadcastStep();
  renderOnboardStep();
}

function obSelectSkyTheme(theme, btn) {
  onboardData.skyTheme = theme;
  var grid = document.getElementById('ob-sky-theme-grid');
  if (grid) grid.querySelectorAll('.sky-theme-btn').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-theme') === theme);
  });
  // Update environment preview
  obRenderEnvPreview(theme);
  // If sound preview is playing, switch to new environment's sound
  if (window._obSoundPreviewing) {
    obStopSoundPreview();
    obStartSoundPreview(theme);
  }
}

// ===== ONBOARDING ENVIRONMENT PREVIEW =====
// Uses the actual living sky + terrain rendering so users see the real scene
function obRenderEnvPreview(theme) {
  var el = document.getElementById('ob-env-preview');
  if (!el) return;
  theme = theme || onboardData.skyTheme || 'mixed';

  // Map onboard theme names to internal scene names
  var sceneMap = { beach: 'coastal', mountain: 'forest', mixed: 'meadow' };
  var themeMap = { beach: 'beach', mountain: 'mountain', mixed: 'mixed' };
  var labels = { beach: 'Sunset Shore', mountain: 'Whispering Woods', mixed: 'Golden Meadow' };

  // Temporarily set sky theme globals so renderLivingSky uses the right env colors
  var prevSkyTheme = (typeof currentSkyTheme !== 'undefined') ? currentSkyTheme : 'mixed';
  currentSkyTheme = themeMap[theme] || 'mixed';
  var prevScene = WEATHER.scene;
  WEATHER.scene = sceneMap[theme] || 'meadow';

  el.innerHTML = '';

  // Create sky container inside preview
  var skyDiv = document.createElement('div');
  skyDiv.className = 'ob-live-sky';
  el.appendChild(skyDiv);

  // Render the actual living sky into preview
  if (typeof renderLivingSky === 'function') {
    renderLivingSky(skyDiv);
  }

  // Create terrain container inside preview
  var terrainDiv = document.createElement('div');
  terrainDiv.className = 'ob-live-terrain';
  el.appendChild(terrainDiv);

  // Render actual terrain
  if (theme === 'mountain' && typeof renderMountainTerrain === 'function') {
    renderMountainTerrain(terrainDiv);
  } else if (theme === 'beach' && typeof renderBeachTerrain === 'function') {
    renderBeachTerrain(terrainDiv);
  } else if (typeof renderMeadowTerrain === 'function') {
    renderMeadowTerrain(terrainDiv);
  }

  // Add label overlay
  var labelDiv = document.createElement('div');
  labelDiv.className = 'ob-prev-label';
  labelDiv.textContent = labels[theme] || 'Golden Meadow';
  el.appendChild(labelDiv);

  // Restore previous globals
  currentSkyTheme = prevSkyTheme;
  WEATHER.scene = prevScene;
}

// Sound preview for onboarding
window._obSoundPreviewing = false;
window._obSoundPreviewNode = null;   // { audio, objUrl } for HTML5 path, or { source, gain } for WebAudio path

function obToggleSoundPreview() {
  if (window._obSoundPreviewing) {
    obStopSoundPreview();
  } else {
    obStartSoundPreview(onboardData.skyTheme || 'mixed');
  }
}

// Convert an AudioBuffer (stereo Float32) → WAV Blob for HTML5 <audio> playback
function _audioBufferToWav(audioBuffer) {
  var numCh = audioBuffer.numberOfChannels;
  var sr = audioBuffer.sampleRate;
  var len = audioBuffer.length;
  var bytesPerSample = 2; // 16-bit
  var dataBytes = len * numCh * bytesPerSample;
  var buf = new ArrayBuffer(44 + dataBytes);
  var v = new DataView(buf);
  var writeStr = function(off, s) { for (var i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  v.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, numCh, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * numCh * bytesPerSample, true);
  v.setUint16(32, numCh * bytesPerSample, true);
  v.setUint16(34, 16, true);
  writeStr(36, 'data');
  v.setUint32(40, dataBytes, true);
  // Interleave channels into 16-bit samples
  var channels = [];
  for (var ch = 0; ch < numCh; ch++) channels.push(audioBuffer.getChannelData(ch));
  var off = 44;
  for (var i = 0; i < len; i++) {
    for (var ch = 0; ch < numCh; ch++) {
      var s = Math.max(-1, Math.min(1, channels[ch][i]));
      v.setInt16(off, s * 32767, true);
      off += 2;
    }
  }
  return new Blob([buf], { type: 'audio/wav' });
}

function obStartSoundPreview(theme) {
  if (typeof WEATHER === 'undefined' || typeof generateNoise !== 'function') return;

  var soundMap = { beach: 'seagulls', mountain: 'forestWind', mixed: 'birdsong' };
  var soundType = soundMap[theme] || 'birdsong';

  // Need an AudioContext to generate the buffer (even if we play via HTML5 Audio)
  var ctx;
  if (typeof _recreateAudioCtx === 'function') {
    ctx = _recreateAudioCtx();
  } else {
    try {
      if (WEATHER.audioCtx) { try { WEATHER.audioCtx.close(); } catch(e) {} }
      WEATHER.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      ctx = WEATHER.audioCtx;
    } catch(e) { return; }
  }
  if (!ctx) return;

  // UI updates immediately
  window._obSoundPreviewing = true;
  WEATHER.audioUnlocked = true;
  var btn = document.getElementById('ob-sound-preview-btn');
  var icon = document.getElementById('ob-sound-preview-icon');
  if (btn) btn.classList.add('playing');
  if (icon) icon.textContent = '🔇';

  // Unlock iOS audio pipeline during this user gesture
  if (typeof _resumeCtx === 'function') _resumeCtx(ctx);

  // Generate the audio buffer
  var buffer;
  try { buffer = generateNoise(soundType); } catch(e) {}
  if (!buffer) {
    obStopSoundPreview();
    return;
  }

  // PRIMARY: HTML5 <audio> with WAV blob — most reliable on mobile
  try {
    var wav = _audioBufferToWav(buffer);
    var objUrl = URL.createObjectURL(wav);
    var audio = document.createElement('audio');
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');
    audio.src = objUrl;
    audio.loop = true;
    audio.volume = 1.0;
    var playP = audio.play();
    if (playP && playP.then) {
      playP.then(function() {
        if (!window._obSoundPreviewing) { audio.pause(); URL.revokeObjectURL(objUrl); return; }
        window._obSoundPreviewNode = { audio: audio, objUrl: objUrl };
      }).catch(function() {
        URL.revokeObjectURL(objUrl);
        _obWebAudioFallback(ctx, buffer);
      });
    } else {
      window._obSoundPreviewNode = { audio: audio, objUrl: objUrl };
    }
  } catch(e) {
    _obWebAudioFallback(ctx, buffer);
  }
}

// Fallback: play via Web Audio API if HTML5 Audio fails
function _obWebAudioFallback(ctx, buffer) {
  if (!window._obSoundPreviewing) return;
  if (window._obSoundPreviewNode) return;

  function _tryPlay() {
    if (!window._obSoundPreviewing || window._obSoundPreviewNode) return;
    var c = WEATHER.audioCtx;
    if (!c) return;
    var source = c.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    var gain = c.createGain();
    gain.gain.setValueAtTime(0.5, c.currentTime);
    gain.gain.linearRampToValueAtTime(1.0, c.currentTime + 0.3);
    source.connect(gain);
    gain.connect(c.destination);
    source.start(0);
    window._obSoundPreviewNode = { source: source, gain: gain };
  }

  if (ctx.state !== 'running') {
    try {
      var p = ctx.resume();
      if (p && p.then) {
        p.then(_tryPlay).catch(_tryPlay);
      } else { _tryPlay(); }
    } catch(e) { _tryPlay(); }
  } else {
    _tryPlay();
  }
  // Retry after 800ms
  setTimeout(function() {
    if (!window._obSoundPreviewing || window._obSoundPreviewNode) return;
    if (WEATHER.audioCtx && WEATHER.audioCtx.state !== 'running') WEATHER.audioCtx.resume().catch(function(){});
    _tryPlay();
  }, 800);
}

function obStopSoundPreview() {
  var node = window._obSoundPreviewNode;
  if (node) {
    // HTML5 Audio path
    if (node.audio) {
      try { node.audio.pause(); node.audio.src = ''; } catch(e) {}
      if (node.objUrl) try { URL.revokeObjectURL(node.objUrl); } catch(e) {}
    }
    // Web Audio path
    if (node.source && WEATHER.audioCtx) {
      try {
        node.gain.gain.linearRampToValueAtTime(0, WEATHER.audioCtx.currentTime + 0.5);
        var s = node.source;
        setTimeout(function() { try { s.stop(); } catch(e) {} }, 600);
      } catch(e) {}
    }
    window._obSoundPreviewNode = null;
  }
  window._obSoundPreviewing = false;

  var btn = document.getElementById('ob-sound-preview-btn');
  var icon = document.getElementById('ob-sound-preview-icon');
  if (btn) btn.classList.remove('playing');
  if (icon) icon.textContent = '🔊';
}

function onboardPhotoPicked(input) {
  if (!input.files || !input.files[0]) return;
  resizePhoto(input.files[0], function(dataUrl) {
    onboardData.photo = dataUrl;
    var prev = document.getElementById('ob-photo-preview');
    prev.innerHTML = '<img src="' + dataUrl + '" alt="photo">';
  });
}

function resizePhoto(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var size = 300;
      var w = img.width, h = img.height;
      var scale = Math.max(size / w, size / h);
      var sw = w * scale, sh = h * scale;
      canvas.width = size; canvas.height = size;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, (size - sw) / 2, (size - sh) / 2, sw, sh);
      callback(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function finishOnboarding(startTour) {
  obCleanupStatus();
  NAMES[user] = onboardData.name;
  var nickKey = user === 'him' ? 'himCallsHer' : 'herCallsHim';
  NICKNAMES[nickKey] = onboardData.nickname;
  if (onboardData.nickname) NAMES[partner] = onboardData.nickname;
  var profileUpdate = { [user]: onboardData.name, [nickKey]: onboardData.nickname };
  await db.ref('profiles').update(profileUpdate);

  // Photo
  if (onboardData.photo) {
    await db.ref('photos/' + partner).set({ data: onboardData.photo, setBy: user, timestamp: Date.now() });
  }
  // Anniversary
  if (onboardData.anniversary) {
    await db.ref('settings/anniversary').set(onboardData.anniversary);
  }
  // Birthday
  if (onboardData.birthday) {
    await db.ref('settings/birthday/' + user).set(onboardData.birthday);
  }
  // Mood baseline
  if (onboardData.mood) {
    await db.ref('baselines/' + user + '/mood').set({
      mood: onboardData.mood, energy: onboardData.energy, stress: onboardData.stress,
      timestamp: Date.now(), source: 'onboarding'
    });
    // Also log as first mood entry
    await db.ref('moods').push({
      user: user, mood: onboardData.mood, energy: onboardData.energy,
      stress: onboardData.stress, date: localDate(), timestamp: Date.now(), source: 'onboarding'
    });
  }
  // Fitness baseline
  if (onboardData.heightFt || onboardData.weight) {
    var fitData = { timestamp: Date.now(), source: 'onboarding' };
    if (onboardData.heightFt) fitData.heightFt = parseInt(onboardData.heightFt);
    if (onboardData.heightIn) fitData.heightIn = parseInt(onboardData.heightIn);
    if (onboardData.weight) fitData.weight = parseFloat(onboardData.weight);
    if (onboardData.activityLevel) fitData.activityLevel = onboardData.activityLevel;
    if (onboardData.fitnessGoal) fitData.fitnessGoal = onboardData.fitnessGoal;
    await db.ref('baselines/' + user + '/fitness').set(fitData);
    // Also log as first body entry
    if (onboardData.weight) {
      await db.ref('fitness/' + user + '/body').push({
        weight: parseFloat(onboardData.weight), timestamp: Date.now(), date: localDate()
      });
    }
  }
  // Relationship baseline
  if (onboardData.commRating || onboardData.qualityRating || onboardData.connectedRating) {
    await db.ref('baselines/' + user + '/relationship').set({
      communication: onboardData.commRating, qualityTime: onboardData.qualityRating,
      connection: onboardData.connectedRating, timestamp: Date.now(), source: 'onboarding'
    });
  }
  // Relationship agreements
  if (onboardData.agreementsMine.length || onboardData.agreementsTogether.length) {
    var agreeData = { timestamp: Date.now(), by: user };
    if (onboardData.agreementsMine.length) agreeData.personal = onboardData.agreementsMine;
    if (onboardData.agreementsTogether.length) agreeData.together = onboardData.agreementsTogether;
    await db.ref('agreements/onboarding/' + user).set(agreeData);
  }
  // Morning message settings
  await db.ref('settings/morningMsg/' + user).set({
    enabled: onboardData.morningMsgEnabled,
    customMsg: onboardData.morningCustomMsg || '',
    nickname: onboardData.nickname || onboardData.name
  });

  // Living Sky
  livingSkyEnabled = onboardData.livingSky;
  await db.ref('settings/livingSky/' + user).set(onboardData.livingSky);
  setLivingSky(onboardData.livingSky);

  // Sky theme
  await db.ref('settings/skyTheme/' + user).set(onboardData.skyTheme || 'mixed');
  if (typeof applySkyTheme === 'function') applySkyTheme(onboardData.skyTheme || 'mixed');

  // Nature sounds preference
  await db.ref('settings/natureSounds/' + user).set(onboardData.natureSoundsEnabled);
  if (onboardData.natureSoundsEnabled && typeof toggleAmbientAudio === 'function') {
    toggleAmbientAudio(true);
  }

  document.getElementById('login').classList.remove('onboard-active');
  finishLogin();
  if (startTour) {
    setTimeout(function() { startAppTour(); }, 600);
  }
}

// ===== INTERACTIVE APP TOUR =====
let tourStep = 0;
const TOUR_STEPS = [
  {
    target: '.dash-greeting-row',
    title: 'Home',
    text: 'Your dashboard updates throughout the day with personalized greetings, weather, and your relationship status.',
    position: 'bottom',
    page: 'dash'
  },
  {
    target: '.hero-card-us',
    title: 'Your Pulse',
    text: 'See your relationship at a glance: days together, daily streak, and how you\'re both feeling. Tap it for more detail.',
    position: 'bottom',
    page: 'dash'
  },
  {
    target: '#dash-daily-q, .dash-card',
    title: 'Daily Question',
    text: 'A new question appears every day for both of you. Answer daily to build your streak and discover new things about each other.',
    position: 'top',
    page: 'dash',
    fallbackText: true
  },
  {
    target: '.view-toggle',
    title: 'Us & Me Views',
    text: '"Us" shows your relationship together. "Me" is your personal space for individual growth, goals, and wellness.',
    position: 'bottom',
    page: 'dash'
  },
  {
    target: '[data-p="together"]',
    title: 'Together Tab',
    text: 'Your couple activities: love letters, date night ideas, fun games, quizzes, and relationship check-ins.',
    position: 'top',
    page: 'dash',
    navigate: 'together'
  },
  {
    target: '.hub-action-btn, .hub-list-row',
    title: 'Activities',
    text: 'Write letters, plan date nights, play couple games, and more. Everything syncs in real-time with your partner.',
    position: 'bottom',
    page: 'together'
  },
  {
    target: '[data-p="wellness"]',
    title: 'Wellness Tab',
    text: 'Track mood, fitness, nutrition, sleep, and gratitude. See how you\'re both doing side by side.',
    position: 'top',
    page: 'together',
    navigate: 'wellness'
  },
  {
    target: '[data-p="plan"]',
    title: 'Plan Tab',
    text: 'Shared calendar, bucket list, finances, and dream home planning. Build your future together.',
    position: 'top',
    page: 'wellness',
    navigate: 'plan'
  },
  {
    target: '[data-p="more"]',
    title: 'More Tab',
    text: 'AI assistant, photo memories, music, achievements, ambient sounds, and settings.',
    position: 'top',
    page: 'plan',
    navigate: 'more'
  }
];

function startAppTour() {
  tourStep = 0;
  var overlay = document.getElementById('tour-overlay');
  if (!overlay) return;
  overlay.classList.add('on');
  document.body.classList.add('touring');
  showTourStep();
}

function showTourStep() {
  var step = TOUR_STEPS[tourStep];
  if (!step) { endTour(); return; }

  // Navigate if needed
  if (step.navigate) {
    go(step.navigate);
    setTimeout(function() { positionTourStep(step); }, 350);
  } else if (step.page) {
    go(step.page);
    setTimeout(function() { positionTourStep(step); }, 100);
  } else {
    positionTourStep(step);
  }
}

function positionTourStep(step) {
  var overlay = document.getElementById('tour-overlay');
  var spotlight = document.getElementById('tour-spotlight');
  var tooltip = document.getElementById('tour-tooltip');
  var titleEl = document.getElementById('tour-title');
  var textEl = document.getElementById('tour-text');
  var countEl = document.getElementById('tour-count');

  // Find target - try multiple selectors separated by comma
  var target = null;
  var selectors = step.target.split(',');
  for (var i = 0; i < selectors.length; i++) {
    var el = document.querySelector(selectors[i].trim());
    if (el && el.offsetParent !== null) { target = el; break; }
  }

  // Set content
  titleEl.textContent = step.title;
  textEl.textContent = step.text;
  countEl.textContent = (tourStep + 1) + ' / ' + TOUR_STEPS.length;

  if (target) {
    var rect = target.getBoundingClientRect();
    var pad = 8;
    spotlight.style.display = '';
    spotlight.style.top = (rect.top - pad) + 'px';
    spotlight.style.left = (rect.left - pad) + 'px';
    spotlight.style.width = (rect.width + pad * 2) + 'px';
    spotlight.style.height = (rect.height + pad * 2) + 'px';
    spotlight.style.borderRadius = getComputedStyle(target).borderRadius || '12px';

    // Scroll target into view first
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function() {
      // Recalculate after scroll
      var r2 = target.getBoundingClientRect();
      spotlight.style.top = (r2.top - pad) + 'px';
      spotlight.style.left = (r2.left - pad) + 'px';
      spotlight.style.width = (r2.width + pad * 2) + 'px';
      spotlight.style.height = (r2.height + pad * 2) + 'px';

      // Position tooltip
      positionTooltip(tooltip, r2, step.position);
    }, 350);
  } else {
    // No visible target - center the tooltip, hide spotlight
    spotlight.style.display = 'none';
    tooltip.style.top = '50%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
  }

  // Animate in
  tooltip.classList.remove('tour-tooltip-in');
  void tooltip.offsetWidth;
  tooltip.classList.add('tour-tooltip-in');
}

function positionTooltip(tooltip, rect, position) {
  var gap = 16;
  tooltip.style.transform = '';
  tooltip.style.left = '20px';
  tooltip.style.right = '20px';
  tooltip.style.width = 'auto';

  if (position === 'top') {
    tooltip.style.top = '';
    tooltip.style.bottom = (window.innerHeight - rect.top + gap) + 'px';
  } else {
    tooltip.style.bottom = '';
    tooltip.style.top = (rect.bottom + gap) + 'px';
  }
}

function tourNext() {
  tourStep++;
  if (tourStep >= TOUR_STEPS.length) {
    endTour();
  } else {
    showTourStep();
  }
}

function endTour() {
  var overlay = document.getElementById('tour-overlay');
  if (overlay) overlay.classList.remove('on');
  document.body.classList.remove('touring');
  go('dash');
  toast('Welcome home! Enjoy your space together.');
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
  // Show photo partner chose for you on the welcome gate
  const welcomePhotoEl = document.getElementById('welcome-photo');
  if (welcomePhotoEl && db) {
    db.ref('photos/' + user).once('value', snap => {
      const d = snap.val();
      if (d && d.data) {
        welcomePhotoEl.innerHTML = '<img src="' + d.data + '" class="welcome-photo-img" alt="">';
      }
    });
  }
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
  listenPhoto();
  listenPartnerPhoto();
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
  // Render sound grids personalized for user
  if (typeof renderMoodSoundsGrid === 'function') renderMoodSoundsGrid();
  if (typeof loadSkyTheme === 'function') loadSkyTheme();
  // Initialize weather system (must run after user/db are set)
  if (typeof initWeatherSystem === 'function') initWeatherSystem();
  // Particles, global mode, presence
  initParticles();
  setGlobalMode(localStorage.getItem('met_global_mode') || 'us');
  initPresence();
  if (typeof ltStartListening === 'function') ltStartListening();
  // Morning message check (runs after a short delay so dashboard renders first)
  setTimeout(function() { if (typeof checkMorningMessage === 'function') checkMorningMessage(); }, 3000);
  // Nav enhancements: swipe gestures, tab indicator, badges
  initSwipeNav();
  initCollapsingHeader();
  setTimeout(updateNavIndicator, 100);
  // Hub & module statuses
  setTimeout(() => { updateHubStatuses(); updateModuleStats(); updateDashQuickNav(); checkAchievements(); updateNavBadges(); initHubPages(); }, 1500);
  // Refresh badges periodically
  setInterval(updateNavBadges, 60000);
  // Voice notes & in-app notifications
  if (typeof initVoiceNotes === 'function') setTimeout(initVoiceNotes, 2000);
  // Initialize dark mode from saved preference
  initDarkMode();
  // Update push notification button state
  updateNotifButton();
}

function switchUser() { fbOffAll(); firebase.auth().signOut(); location.reload(); }
function logout() { fbOffAll(); firebase.auth().signOut(); location.reload(); }

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
    toast('All data cleared - onboarding will restart');
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

// ===== DARK MODE (#17) =====
function initDarkMode() {
  var pref = localStorage.getItem('met_dark_mode') || 'auto';
  applyDarkMode(pref);
  // Highlight the active button
  document.querySelectorAll('.dm-btn').forEach(function(b) {
    b.classList.toggle('sel', b.dataset.dm === pref);
  });
  // Listen for system preference changes when in auto mode
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
      if ((localStorage.getItem('met_dark_mode') || 'auto') === 'auto') {
        applyDarkMode('auto');
      }
    });
  }
}

function setDarkMode(mode) {
  localStorage.setItem('met_dark_mode', mode);
  applyDarkMode(mode);
  document.querySelectorAll('.dm-btn').forEach(function(b) {
    b.classList.toggle('sel', b.dataset.dm === mode);
  });
  // Save preference to Firebase
  if (db && user) {
    db.ref('settings/darkMode/' + user).set(mode);
  }
}

function applyDarkMode(mode) {
  var isDark = false;
  if (mode === 'dark') isDark = true;
  else if (mode === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) isDark = true;
  if (isDark) {
    document.body.setAttribute('data-theme', 'dark');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', '#121218');
  } else {
    document.body.removeAttribute('data-theme');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', '#F5F0EB');
  }
}

// ===== PUSH NOTIFICATIONS (#15) =====
function updateNotifButton() {
  var btn = document.getElementById('set-notif-btn');
  var status = document.getElementById('notif-status');
  if (!btn) return;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    btn.textContent = 'Not Supported';
    btn.disabled = true;
    return;
  }
  if (Notification.permission === 'granted') {
    btn.textContent = 'Enabled';
    btn.classList.add('btn-success');
    if (status) { status.textContent = 'Notifications are active'; status.classList.remove('d-none'); }
  } else if (Notification.permission === 'denied') {
    btn.textContent = 'Blocked';
    btn.disabled = true;
    if (status) { status.textContent = 'Blocked by browser — enable in your browser settings'; status.classList.remove('d-none'); }
  } else {
    btn.textContent = 'Enable';
  }
}

async function togglePushNotifications() {
  if (!('Notification' in window)) { toast('Notifications not supported'); return; }
  if (Notification.permission === 'granted') {
    toast('Notifications already enabled');
    return;
  }
  if (Notification.permission === 'denied') {
    toast('Blocked — enable in browser settings');
    return;
  }
  var permission = await Notification.requestPermission();
  if (permission === 'granted') {
    toast('Notifications enabled!');
    // Save FCM token to Firebase for this user
    savePushToken();
  }
  updateNotifButton();
}

async function savePushToken() {
  if (!db || !user) return;
  // Store a flag so we know this device has notifications enabled
  try {
    var reg = await navigator.serviceWorker.ready;
    db.ref('pushTokens/' + user + '/web').set({
      enabled: true,
      timestamp: Date.now(),
      userAgent: navigator.userAgent.substring(0, 100)
    });
  } catch (e) { console.warn('Could not save push token:', e); }
}

// Send a browser notification (called when partner does something)
function sendPushNotification(title, body, icon) {
  if (Notification.permission !== 'granted') return;
  try {
    navigator.serviceWorker.ready.then(function(reg) {
      reg.showNotification(title, {
        body: body,
        icon: icon || 'icons/icon-192x192.png',
        badge: 'icons/icon-96x96.png',
        vibrate: [100, 50, 100],
        tag: 'met-' + Date.now(),
        renotify: true
      });
    });
  } catch (e) {
    // Fallback to basic notification
    new Notification(title, { body: body, icon: icon || 'icons/icon-192x192.png' });
  }
}

// Listen for partner actions and send notifications
function initPartnerNotifications() {
  if (!db || !user || Notification.permission !== 'granted') return;
  // Letters from partner
  db.ref('letters').orderByChild('timestamp').limitToLast(1).on('child_added', function(snap) {
    var l = snap.val();
    if (l && l.from === partner && Date.now() - l.timestamp < 10000) {
      sendPushNotification('New Letter', (l.fromName || 'Your partner') + ' sent you a letter', 'icons/icon-192x192.png');
    }
  });
  // Taps from partner
  db.ref('taps').orderByChild('timestamp').limitToLast(1).on('child_added', function(snap) {
    var t = snap.val();
    if (t && t.from === partner && Date.now() - t.timestamp < 10000) {
      var tapMsgs = { hug:'sent you a hug', kiss:'sent you a kiss', love:'sent you love', miss:'misses you', thinking:'is thinking of you' };
      sendPushNotification((t.fromName || 'Your partner'), tapMsgs[t.type] || 'sent you a tap', 'icons/icon-192x192.png');
    }
  });
}

// ===== BACKGROUND SYNC (#16) =====
// Queue offline data writes and sync when back online
var _offlineQueue = [];
try { _offlineQueue = JSON.parse(localStorage.getItem('met_offline_queue') || '[]'); } catch(e) { _offlineQueue = []; }

function queueOfflineWrite(path, data) {
  _offlineQueue.push({ path: path, data: data, timestamp: Date.now() });
  localStorage.setItem('met_offline_queue', JSON.stringify(_offlineQueue));
  // Try background sync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(function(reg) {
      reg.sync.register('met-offline-sync').catch(function() {});
    });
  }
}

function flushOfflineQueue() {
  if (!db || !_offlineQueue.length) return;
  var queue = _offlineQueue.slice();
  _offlineQueue = [];
  localStorage.removeItem('met_offline_queue');
  var count = 0;
  queue.forEach(function(item) {
    db.ref(item.path).push(item.data).then(function() {
      count++;
      if (count === queue.length) toast('Synced ' + count + ' offline entries');
    }).catch(function(e) {
      // Re-queue failed items
      _offlineQueue.push(item);
      localStorage.setItem('met_offline_queue', JSON.stringify(_offlineQueue));
    });
  });
}

// Flush queue when coming back online
window.addEventListener('online', function() {
  setTimeout(flushOfflineQueue, 2000);
});

// Override submitMood and finishWorkout to queue when offline
var _origSubmitMood = typeof submitMood === 'function' ? submitMood : null;
var _origFinishWorkout = typeof finishWorkout === 'function' ? finishWorkout : null;

// Patching is deferred to after all scripts load
window.addEventListener('load', function() {
  // Patch submitMood for offline support
  if (typeof submitMood === 'function' && !submitMood._bgSyncPatched) {
    var origMood = submitMood;
    window.submitMood = async function() {
      if (!navigator.onLine && selectedMood) {
        var entry = {
          mood: selectedMood, energy: selectedEnergy || 3,
          note: (document.getElementById('mood-note') || {}).value || '',
          user: user, userName: NAMES[user],
          timestamp: Date.now(), date: localDate()
        };
        queueOfflineWrite('moods', entry);
        toast('Saved offline — will sync when connected');
        selectedMood = 0;
        return;
      }
      return origMood.apply(this, arguments);
    };
    window.submitMood._bgSyncPatched = true;
  }
  // Initialize partner notifications after login
  if (typeof initPartnerNotifications === 'function') {
    setTimeout(initPartnerNotifications, 5000);
  }
});


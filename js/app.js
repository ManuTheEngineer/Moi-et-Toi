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
      NAMES.her = (data && data.her) || '';
      NAMES.him = (data && data.him) || '';
      NICKNAMES.herCallsHim = (data && data.herCallsHim) || '';
      NICKNAMES.himCallsHer = (data && data.himCallsHer) || '';
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

// Photo that partner chose for you — listen for changes
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
  // Dashboard partner avatar (show PARTNER's photo of you — but on your dashboard
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
// keyboards work reliably — iOS won't open keyboards for dynamically
// injected inputs inside position:fixed containers.
let onboardStep = 0;
let onboardData = { name: '', nickname: '', anniversary: '', photo: '', livingSky: true };
const OB_TOTAL = 8;

function startOnboarding() {
  onboardStep = 0;
  onboardData = { name: '', nickname: '', anniversary: '', photo: '', livingSky: true };
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
  // Set initial content to enter state
  var content = document.getElementById('ob-content');
  if (content) { content.classList.remove('ob-exit'); content.classList.add('ob-enter'); }
  renderOnboardStep();
}

function renderDots(active) {
  return Array.from({length: OB_TOTAL}, (_, i) =>
    `<span class="onboard-dot${i === active ? ' active' : ''}${i < active ? ' done' : ''}"></span>`
  ).join('');
}

// Smooth scroll for input focus — keeps input visible above keyboard
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

function renderOnboardStep() {
  var isHer = user === 'her';
  var partnerLabel = isHer ? 'him' : 'her';
  var pct = Math.round((onboardStep / (OB_TOTAL - 1)) * 100);

  // Progress bar + dots (update immediately, outside transition)
  var bar = document.getElementById('ob-bar');
  var dots = document.getElementById('ob-dots');
  bar.style.width = pct + '%';
  dots.innerHTML = renderDots(onboardStep);

  transitionStep(function() {
    // References
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

    // Hide all optional elements
    emoji.style.display = 'none';
    nameIn.style.display = 'none';
    nickIn.style.display = 'none';
    annivIn.style.display = 'none';
    photoWrap.style.display = 'none';
    skyCard.style.display = 'none';
    tour.style.display = 'none';
    skip.style.display = 'none';

    // Configure each step
    if (onboardStep === 0) {
      title.textContent = isHer ? 'Hey Baby' : 'Welcome';
      sub.innerHTML = isHer
        ? "I'm sorry baby, let's start over.<br>Let me set things up right this time."
        : "Let's build our space together.<br>This only takes a moment.";
      btn.textContent = isHer ? "Okay, let's go" : "Let's begin";
    } else if (onboardStep === 1) {
      emoji.textContent = '👋'; emoji.style.display = '';
      title.textContent = "What's your name?";
      sub.textContent = 'This is how your partner will see you in the app.';
      nameIn.style.display = ''; nameIn.value = onboardData.name;
      setTimeout(function(){ nameIn.focus(); }, 500);
      btn.textContent = 'Continue';
    } else if (onboardStep === 2) {
      emoji.textContent = isHer ? '💜' : '💛'; emoji.style.display = '';
      title.textContent = 'What do you call ' + partnerLabel + '?';
      sub.textContent = 'A pet name, nickname, or their real name — whatever feels like you.';
      nickIn.placeholder = isHer ? 'Baby, Babe, His name...' : 'Babe, Love, Her name...';
      nickIn.style.display = ''; nickIn.value = onboardData.nickname;
      setTimeout(function(){ nickIn.focus(); }, 500);
      btn.textContent = 'Continue';
    } else if (onboardStep === 3) {
      emoji.textContent = '📸'; emoji.style.display = '';
      title.textContent = 'Pick a photo of ' + partnerLabel;
      sub.textContent = 'This is how ' + partnerLabel + ' will see themselves — choose how you see them today.';
      photoWrap.style.display = '';
      skip.style.display = '';
      if (onboardData.photo) {
        var prev = document.getElementById('ob-photo-preview');
        prev.innerHTML = '<img src="' + onboardData.photo + '" alt="photo">';
      }
      btn.textContent = 'Continue';
    } else if (onboardStep === 4) {
      emoji.textContent = '📅'; emoji.style.display = '';
      title.textContent = 'When did it start?';
      sub.textContent = 'The day you two became official. This powers your "Days Together" count.';
      annivIn.style.display = '';
      skip.style.display = '';
      btn.textContent = 'Continue';
    } else if (onboardStep === 5) {
      emoji.textContent = '🌅'; emoji.style.display = '';
      title.textContent = 'Living Sky';
      sub.innerHTML = 'The app has a living sky — the sun moves with time, turns to moon at night, birds fly by, fireflies glow.';
      skyCard.style.display = '';
      document.getElementById('ob-sky-toggle').checked = onboardData.livingSky;
      btn.textContent = 'Continue';
    } else if (onboardStep === 6) {
      bar.style.width = '95%';
      emoji.textContent = '🏡'; emoji.style.display = '';
      title.textContent = "Let me show you around";
      sub.innerHTML = "I'll walk you through your new space —<br>it'll only take a moment.";
      btn.textContent = 'Show me';
    } else if (onboardStep === 7) {
      finishOnboarding(true);
      return;
    }
  });
}

function onboardNext() {
  if (obTransitioning) return; // prevent double-tap during transitions
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
  // Step 3 is photo — optional, data stored via onboardPhotoPicked
  if (onboardStep === 4) {
    var anniv = document.getElementById('ob-anniversary').value;
    if (anniv) onboardData.anniversary = anniv;
  }
  onboardStep++;
  renderOnboardStep();
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
  NAMES[user] = onboardData.name;
  var nickKey = user === 'him' ? 'himCallsHer' : 'herCallsHim';
  NICKNAMES[nickKey] = onboardData.nickname;
  // Set partner display name to the nickname just entered
  if (onboardData.nickname) NAMES[partner] = onboardData.nickname;
  var profileUpdate = { [user]: onboardData.name, [nickKey]: onboardData.nickname };
  await db.ref('profiles').update(profileUpdate);
  // Save photo of partner — stored under the partner's key so they see it
  if (onboardData.photo) {
    await db.ref('photos/' + partner).set({
      data: onboardData.photo, setBy: user, timestamp: Date.now()
    });
  }
  if (onboardData.anniversary) {
    await db.ref('settings/anniversary').set(onboardData.anniversary);
  }
  // Save Living Sky preference
  livingSkyEnabled = onboardData.livingSky;
  await db.ref('settings/livingSky/' + user).set(onboardData.livingSky);
  setLivingSky(onboardData.livingSky);
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
    title: 'Your Home',
    text: 'This is your dashboard — it greets you and shows how you and your partner are doing.',
    position: 'bottom',
    page: 'dash'
  },
  {
    target: '.hero-card-us',
    title: 'Relationship Pulse',
    text: 'Your relationship health at a glance — mood, streak, and days together. Tap to see the breakdown.',
    position: 'bottom',
    page: 'dash'
  },
  {
    target: '#dash-daily-q, .dash-card',
    title: 'Daily Question',
    text: 'Every day, you both get a new question. Answer it to build your streak and learn about each other.',
    position: 'top',
    page: 'dash',
    fallbackText: true
  },
  {
    target: '.view-toggle',
    title: 'Us & Me',
    text: 'Switch between "Us" (your relationship) and "Me" (your personal growth and goals).',
    position: 'bottom',
    page: 'dash'
  },
  {
    target: '[data-p="together"]',
    title: 'Together',
    text: 'Letters, games, date nights, check-ins — everything you do as a couple lives here.',
    position: 'top',
    page: 'dash',
    navigate: 'together'
  },
  {
    target: '.hub-action-btn, .hub-list-row',
    title: 'Your Couple Space',
    text: 'Send letters, play games, plan date nights, and take quizzes together. All in one place.',
    position: 'bottom',
    page: 'together'
  },
  {
    target: '[data-p="wellness"]',
    title: 'Wellness',
    text: 'Track mood, fitness, nutrition, and gratitude — individually and together.',
    position: 'top',
    page: 'together',
    navigate: 'wellness'
  },
  {
    target: '[data-p="plan"]',
    title: 'Plan',
    text: 'Dreams, calendar, finances, dream home — plan your future side by side.',
    position: 'top',
    page: 'wellness',
    navigate: 'plan'
  },
  {
    target: '[data-p="more"]',
    title: 'More',
    text: 'AI chat, photo memories, achievements, and settings. There\'s always more to explore.',
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

  // Find target — try multiple selectors separated by comma
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
    // No visible target — center the tooltip, hide spotlight
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
  toast('You\'re all set! Explore anytime.');
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
  // Voice notes & in-app notifications
  if (typeof initVoiceNotes === 'function') setTimeout(initVoiceNotes, 2000);
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


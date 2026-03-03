// ===== NAV =====
// Map sub-pages to their parent tab
const TAB_MAP = {
  'dash': 'dash',
  'connect': 'together', 'games': 'together', 'deeptalk': 'together', 'question': 'together', 'datenight': 'together', 'lovelang': 'together', 'checkin': 'together',
  'mood': 'track', 'fitness': 'track', 'gratitude': 'track', 'w1': 'track', 'w2': 'track', 'w3': 'track',
  'dreams': 'build', 'homelife': 'build', 'family': 'build', 'foundation': 'build', 'culture': 'build', 'spiritual': 'build', 'dreamhome': 'build', 'calendar': 'build',
  'explore': 'explore', 'more': 'explore', 'ai': 'explore', 'bucket': 'explore', 'wishlist': 'explore', 'herspace': 'explore', 'hisspace': 'explore', 'story': 'explore',
  'knowyou': 'explore', 'nutrition': 'explore', 'memories': 'explore', 'achievements': 'explore',
  'grow': 'track'
};

// Tab ordering for directional transitions and swipe nav
const TAB_ORDER = ['dash', 'together', 'track', 'build', 'explore'];
const TAB_LANDINGS = { dash:'dash', together:'connect', track:'mood', build:'dreams', explore:'explore' };

function go(p) {
  if (p === 'more') p = 'explore';
  const current = document.querySelector('.pg.on');
  const next = document.getElementById('pg-' + p);
  if (current === next) { closeMenu(); return; }

  // Determine direction for transition
  const prevPage = document.body.dataset.page || 'dash';
  const prevTab = TAB_MAP[prevPage] || prevPage;
  const nextTab = TAB_MAP[p] || p;
  const prevIdx = TAB_ORDER.indexOf(prevTab);
  const nextIdx = TAB_ORDER.indexOf(nextTab);
  const isTabSwitch = prevIdx !== -1 && nextIdx !== -1 && prevIdx !== nextIdx;
  const slideDir = isTabSwitch ? (nextIdx > prevIdx ? 'slide-right' : 'slide-left') : '';

  if (current) {
    current.classList.add('out');
    if (slideDir) current.classList.add(slideDir);
    current.classList.remove('on');
    setTimeout(() => { current.classList.remove('out', 'slide-right', 'slide-left'); }, 300);
  }
  if (next) {
    next.classList.add('on');
    if (slideDir) {
      next.classList.add(slideDir);
      setTimeout(() => next.classList.remove('slide-right', 'slide-left'), 500);
    }
  }

  // Set page-specific background accent
  document.body.dataset.page = p;

  // Track for recent pages in quick action sheet
  trackRecentPage(p);

  // Update bottom nav active state
  document.querySelectorAll('.bn').forEach(e => e.classList.remove('on'));
  const tabId = TAB_MAP[p] || p;
  const bn = document.querySelector('[data-p="' + tabId + '"]');
  if (bn) bn.classList.add('on');

  // Update sliding indicator
  updateNavIndicator();

  // Update page header
  updatePageHeader(p);

  closeMenu();
  window.scrollTo({ top: 0 });
}

// ===== SLIDING TAB INDICATOR =====
function updateNavIndicator() {
  const indicator = document.getElementById('bnav-indicator');
  const activeBtn = document.querySelector('.bn.on');
  const nav = document.querySelector('.bnav');
  if (!indicator || !activeBtn || !nav) return;
  const navRect = nav.getBoundingClientRect();
  const btnRect = activeBtn.getBoundingClientRect();
  indicator.style.left = (btnRect.left - navRect.left) + 'px';
  indicator.style.width = btnRect.width + 'px';
}
window.addEventListener('resize', updateNavIndicator);

// ===== PAGE HEADER =====
function updatePageHeader(p) {
  const header = document.getElementById('page-header');
  const titleEl = document.getElementById('ph-title');
  const backEl = document.getElementById('ph-back');
  if (!header) return;

  // Hide header on dashboard (has its own greeting)
  header.classList.toggle('hidden', p === 'dash');

  // Animate title change
  if (titleEl) {
    titleEl.classList.add('changing');
    setTimeout(() => {
      const meta = PAGE_META[p];
      titleEl.textContent = meta ? meta.label : '';
      titleEl.classList.remove('changing');
    }, 150);
  }

  // Show back button for sub-pages (not landing pages of tabs)
  if (backEl) {
    const parentTab = TAB_MAP[p];
    const isSubPage = parentTab && TAB_LANDINGS[parentTab] !== p && p !== 'dash';
    backEl.classList.toggle('show', isSubPage);
  }
}

function goBack() {
  const currentPage = document.body.dataset.page;
  const parentTab = TAB_MAP[currentPage];
  if (parentTab && parentTab !== currentPage) {
    go(TAB_LANDINGS[parentTab] || 'dash');
  } else {
    go('dash');
  }
}

// ===== QUICK ACTION SHEET =====
let recentPages = JSON.parse(localStorage.getItem('met_recent_pages') || '[]');
let currentPageId = 'dash';
let favPages = JSON.parse(localStorage.getItem('met_fav_pages') || '["mood","fitness","connect","datenight"]');

const PAGE_META = {
  dash:{icon:'🏠',label:'Home'},connect:{icon:'💌',label:'Connect'},games:{icon:'🎮',label:'Games'},
  question:{icon:'💬',label:'Daily Q'},deeptalk:{icon:'🌊',label:'Deep Talk'},datenight:{icon:'🕯',label:'Date Night'},
  lovelang:{icon:'💕',label:'Love Lang'},checkin:{icon:'✅',label:'Check-in'},gratitude:{icon:'🙏',label:'Gratitude'},
  knowyou:{icon:'🔮',label:'Know You'},dreams:{icon:'✨',label:'Dreams'},dreamhome:{icon:'🏡',label:'Dream Home'},
  homelife:{icon:'💰',label:'Finances'},family:{icon:'👶',label:'Family'},bucket:{icon:'⭐',label:'Bucket List'},
  calendar:{icon:'📅',label:'Calendar'},foundation:{icon:'🏛',label:'Foundation'},wishlist:{icon:'🎁',label:'Wishlists'},
  memories:{icon:'📸',label:'Memories'},mood:{icon:'🌤',label:'Mood'},fitness:{icon:'💪',label:'Fitness'},
  nutrition:{icon:'🥗',label:'Nutrition'},spiritual:{icon:'🕊',label:'Spirit'},herspace:{icon:'🌸',label:'Her Space'},
  hisspace:{icon:'⚡',label:'His Space'},story:{icon:'📖',label:'Timeline'},culture:{icon:'🌍',label:'Cultures'},
  ai:{icon:'🤖',label:'AI Chat'},achievements:{icon:'🏆',label:'Achievements'},explore:{icon:'🧭',label:'Explore'},
  grow:{icon:'🌱',label:'Growth'}
};

const CTX_ACTIONS = {
  dash:[{p:'mood',icon:'🌤',label:'Log Mood'},{p:'question',icon:'💬',label:'Daily Q'},{p:'connect',icon:'💌',label:'Letter'},{p:'datenight',icon:'🕯',label:'Date Night'}],
  fitness:[{p:'fitness',icon:'🏋️',label:'Workout',fn:'openWorkoutBuilder'},{p:'fitness',icon:'📝',label:'Quick Log',fn:'scrollToQuickLog'},{p:'fitness',icon:'📊',label:'Analytics',fn:'scrollToAnalytics'},{p:'fitness',icon:'📏',label:'Metrics',fn:'scrollToMetrics'}],
  nutrition:[{p:'nutrition',icon:'🍽',label:'Log Meal'},{p:'nutrition',icon:'💧',label:'Water'},{p:'nutrition',icon:'📋',label:'Recipes'},{p:'nutrition',icon:'🛒',label:'Grocery'}],
  connect:[{p:'connect',icon:'💌',label:'Write'},{p:'games',icon:'🎮',label:'Games'},{p:'deeptalk',icon:'🌊',label:'Deep Talk'},{p:'question',icon:'💬',label:'Daily Q'}],
  games:[{p:'games',icon:'🎯',label:'New Game'},{p:'connect',icon:'💌',label:'Connect'},{p:'deeptalk',icon:'🌊',label:'Deep Talk'},{p:'datenight',icon:'🕯',label:'Date'}],
  mood:[{p:'gratitude',icon:'🙏',label:'Gratitude'},{p:'checkin',icon:'✅',label:'Check-in'},{p:'fitness',icon:'💪',label:'Fitness'},{p:'nutrition',icon:'🥗',label:'Nutrition'}],
  grow:[{p:'herspace',icon:'🌸',label:'Her Space'},{p:'hisspace',icon:'⚡',label:'His Space'},{p:'foundation',icon:'🏛',label:'Foundation'},{p:'spiritual',icon:'🕊',label:'Spirit'}],
  _default:[{p:'mood',icon:'🌤',label:'Mood'},{p:'fitness',icon:'💪',label:'Fitness'},{p:'connect',icon:'💌',label:'Connect'},{p:'explore',icon:'🧭',label:'Explore'}]
};

function trackRecentPage(pageId) {
  if (!pageId || pageId === 'dash') return;
  recentPages = recentPages.filter(p => p !== pageId);
  recentPages.unshift(pageId);
  if (recentPages.length > 5) recentPages = recentPages.slice(0, 5);
  localStorage.setItem('met_recent_pages', JSON.stringify(recentPages));
  currentPageId = pageId;
}

function toggleMenu() {
  const cmd = document.getElementById('cmd-center');
  const backdrop = document.getElementById('cmd-backdrop');
  if (!cmd) return;
  const opening = !cmd.classList.contains('on');
  if (opening) {
    populateQuickSheet();
    cmd.classList.add('on');
    if (backdrop) backdrop.classList.add('on');
  } else {
    cmd.classList.remove('on');
    if (backdrop) backdrop.classList.remove('on');
  }
}

function closeMenu() {
  const cmd = document.getElementById('cmd-center');
  const backdrop = document.getElementById('cmd-backdrop');
  if (cmd) cmd.classList.remove('on');
  if (backdrop) backdrop.classList.remove('on');
  const search = document.getElementById('cmd-search');
  if (search) search.value = '';
  const sr = document.getElementById('cmd-search-results');
  if (sr) sr.style.display = 'none';
}

function populateQuickSheet() {
  // Favorites
  const favEl = document.getElementById('cmd-favorites');
  if (favEl) {
    favEl.innerHTML = favPages.map(p => {
      const m = PAGE_META[p] || {icon:'📄',label:p};
      return '<div class="cmd-ctx-item" onclick="closeMenu();go(\''+p+'\')"><span class="cmd-ctx-icon">'+m.icon+'</span><span class="cmd-ctx-label">'+m.label+'</span></div>';
    }).join('');
  }
  // Recent
  const recentEl = document.getElementById('cmd-recent');
  if (recentEl) {
    if (recentPages.length === 0) {
      recentEl.innerHTML = '<span style="font-size:11px;color:var(--t3);padding:4px 0">No recent pages yet</span>';
    } else {
      recentEl.innerHTML = recentPages.slice(0, 4).map(p => {
        const m = PAGE_META[p] || {icon:'📄',label:p};
        return '<div class="cmd-recent-item" onclick="closeMenu();go(\''+p+'\')">'+m.icon+' '+m.label+'</div>';
      }).join('');
    }
  }
  // Context actions
  const ctxEl = document.getElementById('cmd-ctx-actions');
  if (ctxEl) {
    const actions = CTX_ACTIONS[currentPageId] || CTX_ACTIONS._default;
    ctxEl.innerHTML = actions.map(a => {
      const onclick = a.fn ? a.fn + '();closeMenu()' : 'closeMenu();go(\''+a.p+'\')';
      return '<div class="cmd-ctx-item" onclick="'+onclick+'"><span class="cmd-ctx-icon">'+a.icon+'</span><span class="cmd-ctx-label">'+a.label+'</span></div>';
    }).join('');
  }
}

function filterQuickSheet(val) {
  const q = val.toLowerCase().trim();
  const sr = document.getElementById('cmd-search-results');
  if (!sr) return;
  if (!q) { sr.style.display = 'none'; return; }
  const matches = Object.entries(PAGE_META).filter(([k,v]) => v.label.toLowerCase().includes(q));
  if (matches.length === 0) {
    sr.innerHTML = '<div style="padding:12px;font-size:12px;color:var(--t3);text-align:center">No matches</div>';
  } else {
    sr.innerHTML = matches.slice(0, 6).map(([k,v]) =>
      '<div class="cmd-ctx-item" onclick="closeMenu();go(\''+k+'\')" style="display:inline-flex;align-items:center;gap:8px;padding:10px 14px;margin:3px"><span class="cmd-ctx-icon" style="margin:0">'+v.icon+'</span><span class="cmd-ctx-label" style="font-size:12px">'+v.label+'</span></div>'
    ).join('');
  }
  sr.style.display = 'block';
}

function goCmd(page) { closeMenu(); go(page); }

// ===== SWIPE GESTURE NAVIGATION =====
let _swipeStartX = 0, _swipeStartY = 0, _swipeStartTime = 0;

function initSwipeNav() {
  const shell = document.getElementById('shell');
  if (!shell) return;

  shell.addEventListener('touchstart', function(e) {
    _swipeStartX = e.touches[0].clientX;
    _swipeStartY = e.touches[0].clientY;
    _swipeStartTime = Date.now();
  }, { passive: true });

  shell.addEventListener('touchend', function(e) {
    const dx = e.changedTouches[0].clientX - _swipeStartX;
    const dy = e.changedTouches[0].clientY - _swipeStartY;
    const dt = Date.now() - _swipeStartTime;

    // Must be horizontal swipe: |dx|>60px, more horizontal than vertical, <400ms
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || dt > 400) return;

    // Don't swipe if cmd sheet is open
    const cmd = document.getElementById('cmd-center');
    if (cmd && cmd.classList.contains('on')) return;

    const currentTab = TAB_MAP[document.body.dataset.page] || document.body.dataset.page;
    const idx = TAB_ORDER.indexOf(currentTab);
    if (idx === -1) return;

    if (dx < 0 && idx < TAB_ORDER.length - 1) {
      go(TAB_LANDINGS[TAB_ORDER[idx + 1]]);
    } else if (dx > 0 && idx > 0) {
      go(TAB_LANDINGS[TAB_ORDER[idx - 1]]);
    }
  }, { passive: true });
}

// ===== NAV BADGES =====
function updateNavBadges() {
  if (typeof db === 'undefined' || !db) return;

  // Together tab: check for recent letters
  db.ref('letters').orderByChild('timestamp').limitToLast(5).once('value', function(snap) {
    const badge = document.getElementById('badge-together');
    if (!badge) return;
    let unread = 0;
    const now = Date.now();
    if (snap.exists()) snap.forEach(function(c) {
      const v = c.val();
      if (v.timestamp && (now - v.timestamp) < 86400000) unread++;
    });
    if (unread > 0) { badge.textContent = unread; badge.classList.add('show'); }
    else { badge.classList.remove('show'); }
  });

  // Track tab: check if mood logged today
  var today = new Date().toISOString().split('T')[0];
  var u = typeof user !== 'undefined' ? user : null;
  if (u) {
    db.ref('moods/' + u + '/' + today).once('value', function(snap) {
      const badge = document.getElementById('badge-track');
      if (!badge) return;
      if (!snap.exists()) { badge.textContent = '!'; badge.classList.add('show'); }
      else { badge.classList.remove('show'); }
    });
  }
}

// ===== GLOBAL MODE (Us/Me) =====
function setGlobalMode(mode) {
  document.body.dataset.mode = mode;
  const pill = document.getElementById('global-mode-pill');
  if (pill) pill.querySelectorAll('.gmp-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.mode === mode);
  });
  localStorage.setItem('met_global_mode', mode);
}

// ===== PARTICLES =====
function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.width = p.style.height = (Math.random() * 3 + 1) + 'px';
    p.style.animationDuration = (Math.random() * 15 + 10) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.opacity = Math.random() * 0.3 + 0.1;
    container.appendChild(p);
  }
}

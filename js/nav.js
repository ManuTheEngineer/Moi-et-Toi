// ===== NAV =====
// Map sub-pages to their parent tab
const TAB_MAP = {
  'dash': 'dash',
  'connect': 'together', 'games': 'together', 'deeptalk': 'together', 'question': 'together', 'datenight': 'together', 'lovelang': 'together', 'checkin': 'together',
  'mood': 'track', 'fitness': 'track', 'gratitude': 'track', 'w1': 'track', 'w2': 'track', 'w3': 'track',
  'dreams': 'build', 'homelife': 'build', 'family': 'build', 'foundation': 'build', 'culture': 'build', 'spiritual': 'build', 'dreamhome': 'build', 'calendar': 'build',
  'explore': 'explore', 'more': 'explore', 'ai': 'explore', 'bucket': 'explore', 'wishlist': 'explore', 'herspace': 'explore', 'hisspace': 'explore', 'story': 'explore',
  'knowyou': 'explore', 'nutrition': 'explore', 'memories': 'explore', 'achievements': 'explore', 'settings': 'explore',
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

  if (current) current.classList.remove('on');
  if (next) next.classList.add('on');

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

// Mini SVG icon helper (Feather-style, matches bottom nav)
function _i(d){return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';}
const _IC = {
  home:_i('<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V14h6v7"/>'),
  mail:_i('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>'),
  game:_i('<rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="16" cy="11" r=".5" fill="currentColor"/><circle cx="18" cy="13" r=".5" fill="currentColor"/>'),
  chat:_i('<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>'),
  wave:_i('<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 18c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 6c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/>'),
  heart:_i('<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>'),
  check:_i('<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>'),
  star:_i('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  users:_i('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>'),
  sparkle:_i('<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>'),
  house:_i('<path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><rect x="9" y="14" width="6" height="7"/>'),
  dollar:_i('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>'),
  list:_i('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>'),
  cal:_i('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'),
  columns:_i('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/>'),
  gift:_i('<rect x="3" y="10" width="18" height="12" rx="1"/><line x1="12" y1="22" x2="12" y2="10"/><path d="M12 10H7.5a2.5 2.5 0 010-5C10 5 12 10 12 10z"/><path d="M12 10h4.5a2.5 2.5 0 000-5C14 5 12 10 12 10z"/>'),
  camera:_i('<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>'),
  sun:_i('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'),
  activity:_i('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
  apple:_i('<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/><line x1="12" y1="2" x2="12" y2="5"/>'),
  feather:_i('<path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/>'),
  zap:_i('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  book:_i('<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>'),
  globe:_i('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>'),
  cpu:_i('<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>'),
  award:_i('<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>'),
  compass:_i('<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>'),
  trend:_i('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>'),
  dumbbell:_i('<path d="M6.5 6.5h11v11h-11z" fill="none"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><rect x="6" y="7" width="3" height="10" rx="1"/><rect x="15" y="7" width="3" height="10" rx="1"/>')
};
const PAGE_META = {
  dash:{icon:_IC.home,label:'Home'},connect:{icon:_IC.mail,label:'Connect'},games:{icon:_IC.game,label:'Games'},
  question:{icon:_IC.chat,label:'Daily Q'},deeptalk:{icon:_IC.wave,label:'Deep Talk'},datenight:{icon:_IC.heart,label:'Date Night'},
  lovelang:{icon:_IC.heart,label:'Love Lang'},checkin:{icon:_IC.check,label:'Check-in'},gratitude:{icon:_IC.star,label:'Gratitude'},
  knowyou:{icon:_IC.users,label:'Know You'},dreams:{icon:_IC.sparkle,label:'Dreams'},dreamhome:{icon:_IC.house,label:'Dream Home'},
  homelife:{icon:_IC.dollar,label:'Finances'},family:{icon:_IC.users,label:'Family'},bucket:{icon:_IC.list,label:'Bucket List'},
  calendar:{icon:_IC.cal,label:'Calendar'},foundation:{icon:_IC.columns,label:'Foundation'},wishlist:{icon:_IC.gift,label:'Wishlists'},
  memories:{icon:_IC.camera,label:'Memories'},mood:{icon:_IC.sun,label:'Mood'},fitness:{icon:_IC.dumbbell,label:'Fitness'},
  nutrition:{icon:_IC.apple,label:'Nutrition'},spiritual:{icon:_IC.feather,label:'Spirit'},herspace:{icon:_IC.heart,label:'Her Space'},
  hisspace:{icon:_IC.zap,label:'His Space'},story:{icon:_IC.book,label:'Timeline'},culture:{icon:_IC.globe,label:'Cultures'},
  ai:{icon:_IC.cpu,label:'AI Chat'},achievements:{icon:_IC.award,label:'Achievements'},explore:{icon:_IC.compass,label:'Explore'},
  grow:{icon:_IC.trend,label:'Growth'},
  settings:{icon:_IC.list,label:'Settings'}
};

const CTX_ACTIONS = {
  dash:[{p:'mood',icon:_IC.sun,label:'Log Mood'},{p:'question',icon:_IC.chat,label:'Daily Q'},{p:'connect',icon:_IC.mail,label:'Letter'},{p:'datenight',icon:_IC.heart,label:'Date Night'}],
  fitness:[{p:'fitness',icon:_IC.dumbbell,label:'Workout',fn:'openWorkoutBuilder'},{p:'fitness',icon:_IC.list,label:'Quick Log',fn:'scrollToQuickLog'},{p:'fitness',icon:_IC.activity,label:'Analytics',fn:'scrollToAnalytics'},{p:'fitness',icon:_IC.trend,label:'Metrics',fn:'scrollToMetrics'}],
  nutrition:[{p:'nutrition',icon:_IC.apple,label:'Log Meal'},{p:'nutrition',icon:_IC.activity,label:'Water'},{p:'nutrition',icon:_IC.list,label:'Recipes'},{p:'nutrition',icon:_IC.list,label:'Grocery'}],
  connect:[{p:'connect',icon:_IC.mail,label:'Write'},{p:'games',icon:_IC.game,label:'Games'},{p:'deeptalk',icon:_IC.wave,label:'Deep Talk'},{p:'question',icon:_IC.chat,label:'Daily Q'}],
  games:[{p:'games',icon:_IC.game,label:'New Game'},{p:'connect',icon:_IC.mail,label:'Connect'},{p:'deeptalk',icon:_IC.wave,label:'Deep Talk'},{p:'datenight',icon:_IC.heart,label:'Date'}],
  mood:[{p:'gratitude',icon:_IC.star,label:'Gratitude'},{p:'checkin',icon:_IC.check,label:'Check-in'},{p:'fitness',icon:_IC.dumbbell,label:'Fitness'},{p:'nutrition',icon:_IC.apple,label:'Nutrition'}],
  grow:[{p:'herspace',icon:_IC.heart,label:'Her Space'},{p:'hisspace',icon:_IC.zap,label:'His Space'},{p:'foundation',icon:_IC.columns,label:'Foundation'},{p:'spiritual',icon:_IC.feather,label:'Spirit'}],
  _default:[{p:'mood',icon:_IC.sun,label:'Mood'},{p:'fitness',icon:_IC.dumbbell,label:'Fitness'},{p:'connect',icon:_IC.mail,label:'Connect'},{p:'explore',icon:_IC.compass,label:'Explore'}]
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
let _swipeStartX = 0, _swipeStartY = 0, _swipeStartTime = 0, _swipeOnInteractive = false;

function initSwipeNav() {
  const shell = document.getElementById('shell');
  if (!shell) return;

  shell.addEventListener('touchstart', function(e) {
    _swipeStartX = e.touches[0].clientX;
    _swipeStartY = e.touches[0].clientY;
    _swipeStartTime = Date.now();
    // Tag whether swipe started on an interactive element
    const tag = e.target.tagName;
    _swipeOnInteractive = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT' || e.target.closest('.pill-row'));
  }, { passive: true });

  shell.addEventListener('touchend', function(e) {
    const dx = e.changedTouches[0].clientX - _swipeStartX;
    const dy = e.changedTouches[0].clientY - _swipeStartY;
    const dt = Date.now() - _swipeStartTime;

    // Must be horizontal swipe: |dx|>60px, more horizontal than vertical, <400ms
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5 || dt > 400) return;

    // Don't swipe if started on an interactive element
    if (_swipeOnInteractive) return;

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
  var today = localDate();
  var u = typeof user !== 'undefined' ? user : null;
  if (u) {
    db.ref('moods').orderByChild('date').equalTo(today).once('value', function(snap) {
      const badge = document.getElementById('badge-track');
      if (!badge) return;
      var found = false;
      if (snap.exists()) snap.forEach(function(c) { if (c.val().user === u) found = true; });
      if (!found) { badge.textContent = '!'; badge.classList.add('show'); }
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

// ===== PARTICLES & CREATURES =====
const ENV_CREATURES = {
  starry: {
    particles: { count: 25, color: '#D4956A', glow: true },
    creatures: [
      { type: 'firefly', svg: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="#FFE4A0" opacity=".8"/><circle cx="5" cy="5" r="5" fill="#FFE4A0" opacity=".2"/></svg>', count: 8, size: [6,12], anim: 'fireflyDrift', dur: [12,22] },
    ]
  },
  forest: {
    particles: { count: 15, color: '#6EC48A', glow: true },
    creatures: [
      { type: 'firefly', svg: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="#C0FF70" opacity=".8"/><circle cx="5" cy="5" r="5" fill="#C0FF70" opacity=".25"/></svg>', count: 12, size: [5,10], anim: 'fireflyDrift', dur: [10,20] },
      { type: 'butterfly', svg: '<svg viewBox="0 0 24 16"><ellipse cx="8" cy="6" rx="7" ry="5.5" fill="#88D4A0" opacity=".6"/><ellipse cx="16" cy="6" rx="7" ry="5.5" fill="#6EC48A" opacity=".6"/><ellipse cx="8" cy="11" rx="5" ry="4" fill="#A0E0B0" opacity=".4"/><ellipse cx="16" cy="11" rx="5" ry="4" fill="#80C890" opacity=".4"/><line x1="12" y1="2" x2="12" y2="14" stroke="#4A8A5A" stroke-width=".8"/></svg>', count: 4, size: [16,26], anim: 'butterflyFloat', dur: [18,30] },
      { type: 'leaf', svg: '<svg viewBox="0 0 16 16"><path d="M2 14 C2 6 8 2 14 2 C14 10 8 14 2 14Z" fill="#5BA868" opacity=".5"/><path d="M2 14 L10 6" stroke="#4A8A5A" stroke-width=".5" fill="none"/></svg>', count: 5, size: [10,18], anim: 'leafDrift', dur: [15,25] },
    ]
  },
  ocean: {
    particles: { count: 12, color: '#58B8D8', glow: false },
    creatures: [
      { type: 'fish', svg: '<svg viewBox="0 0 24 14"><ellipse cx="12" cy="7" rx="10" ry="5.5" fill="#58B8D8" opacity=".45"/><polygon points="22,7 28,2 28,12" fill="#58B8D8" opacity=".35"/><circle cx="7" cy="6" r="1.2" fill="#D8F0F8" opacity=".6"/></svg>', count: 6, size: [18,30], anim: 'fishSwim', dur: [16,28] },
      { type: 'jellyfish', svg: '<svg viewBox="0 0 20 28"><ellipse cx="10" cy="8" rx="8" ry="7" fill="#70A8D0" opacity=".3"/><path d="M4 14 Q5 20 3 26" stroke="#58B8D8" stroke-width=".6" fill="none" opacity=".3"/><path d="M8 14 Q9 22 7 28" stroke="#58B8D8" stroke-width=".6" fill="none" opacity=".3"/><path d="M12 14 Q11 22 13 28" stroke="#58B8D8" stroke-width=".6" fill="none" opacity=".3"/><path d="M16 14 Q15 20 17 26" stroke="#58B8D8" stroke-width=".6" fill="none" opacity=".3"/></svg>', count: 4, size: [20,34], anim: 'jellyBob', dur: [14,24] },
      { type: 'bubble', svg: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="none" stroke="#88D8F0" stroke-width=".5" opacity=".3"/><circle cx="3.5" cy="3.5" r="1" fill="#88D8F0" opacity=".15"/></svg>', count: 8, size: [6,14], anim: 'particleFloat', dur: [12,22] },
    ]
  },
  blossom: {
    particles: { count: 10, color: '#E090A8', glow: false },
    creatures: [
      { type: 'petal', svg: '<svg viewBox="0 0 14 14"><ellipse cx="7" cy="7" rx="6" ry="3" transform="rotate(30 7 7)" fill="#F0A8B8" opacity=".45"/></svg>', count: 12, size: [8,16], anim: 'petalFall', dur: [10,20] },
      { type: 'butterfly', svg: '<svg viewBox="0 0 24 16"><ellipse cx="8" cy="6" rx="7" ry="5.5" fill="#F0889A" opacity=".5"/><ellipse cx="16" cy="6" rx="7" ry="5.5" fill="#E090A8" opacity=".5"/><ellipse cx="8" cy="11" rx="5" ry="4" fill="#F8A8B8" opacity=".35"/><ellipse cx="16" cy="11" rx="5" ry="4" fill="#E898B0" opacity=".35"/><line x1="12" y1="2" x2="12" y2="14" stroke="#A06878" stroke-width=".8"/></svg>', count: 5, size: [16,26], anim: 'butterflyFloat', dur: [18,28] },
      { type: 'firefly', svg: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="#FFD0E0" opacity=".6"/><circle cx="5" cy="5" r="5" fill="#FFD0E0" opacity=".15"/></svg>', count: 6, size: [5,9], anim: 'fireflyDrift', dur: [12,20] },
    ]
  },
  savanna: {
    particles: { count: 8, color: '#E8A050', glow: true },
    creatures: [
      { type: 'bird', svg: '<svg viewBox="0 0 28 12"><path d="M0 6 Q7 0 14 5 Q21 0 28 6" stroke="#E8A050" stroke-width="1.2" fill="none" opacity=".45"/></svg>', count: 4, size: [20,32], anim: 'birdGlide', dur: [14,24] },
      { type: 'firefly', svg: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="#FFD080" opacity=".7"/><circle cx="5" cy="5" r="5" fill="#FFD080" opacity=".2"/></svg>', count: 6, size: [5,10], anim: 'fireflyDrift', dur: [12,22] },
      { type: 'leaf', svg: '<svg viewBox="0 0 16 16"><path d="M2 14 C2 6 8 2 14 2 C14 10 8 14 2 14Z" fill="#C8A048" opacity=".4"/><path d="M2 14 L10 6" stroke="#A08030" stroke-width=".5" fill="none"/></svg>', count: 4, size: [10,16], anim: 'leafDrift', dur: [16,26] },
    ]
  }
};

function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  container.innerHTML = '';
  const env = getEnvironment();
  const cfg = ENV_CREATURES[env] || ENV_CREATURES.starry;

  // Base particles (small dots)
  for (let i = 0; i < cfg.particles.count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    const sz = Math.random() * 3 + 1;
    p.style.width = p.style.height = sz + 'px';
    p.style.background = cfg.particles.color;
    if (cfg.particles.glow) p.style.boxShadow = '0 0 ' + (sz * 2) + 'px ' + cfg.particles.color;
    p.style.animationDuration = (Math.random() * 15 + 10) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.opacity = Math.random() * 0.3 + 0.1;
    container.appendChild(p);
  }

  // Creatures
  if (cfg.creatures) {
    cfg.creatures.forEach(c => {
      for (let i = 0; i < c.count; i++) {
        const el = document.createElement('div');
        el.className = 'creature';
        el.innerHTML = c.svg;
        const sz = c.size[0] + Math.random() * (c.size[1] - c.size[0]);
        el.style.width = sz + 'px';
        el.style.height = sz + 'px';
        el.style.left = Math.random() * 90 + 5 + '%';
        el.style.top = Math.random() * 80 + 10 + '%';
        const dur = c.dur[0] + Math.random() * (c.dur[1] - c.dur[0]);
        el.style.animationName = c.anim;
        el.style.animationDuration = dur + 's';
        el.style.animationDelay = Math.random() * dur + 's';
        el.style.animationTimingFunction = 'ease-in-out';
        el.style.animationIterationCount = 'infinite';
        container.appendChild(el);
      }
    });
  }
}

// ===== ENVIRONMENT MANAGEMENT =====
function getEnvironment() {
  return localStorage.getItem('met_env') || 'starry';
}

function setEnvironment(env) {
  localStorage.setItem('met_env', env);
  applyEnvironment(env);
  initParticles();
  updateEnvGrid();
  toast('Environment: ' + env.charAt(0).toUpperCase() + env.slice(1));
}

function applyEnvironment(env) {
  if (!env || env === 'starry') {
    document.body.removeAttribute('data-env');
  } else {
    document.body.dataset.env = env;
  }
}

function renderEnvGrid() {
  const grid = document.getElementById('env-grid');
  if (!grid) return;
  const envs = [
    { id: 'starry', name: 'Starry Night', desc: 'The original dreamy glow', creatures: '✦' },
    { id: 'forest', name: 'Enchanted Forest', desc: 'Fireflies & butterflies', creatures: '🦋' },
    { id: 'ocean', name: 'Ocean Depths', desc: 'Fish & jellyfish drift', creatures: '🐠' },
    { id: 'blossom', name: 'Cherry Blossom', desc: 'Petals & butterflies', creatures: '🌸' },
    { id: 'savanna', name: 'Sunset Savanna', desc: 'Birds across warm skies', creatures: '🐦' },
  ];
  const current = getEnvironment();
  grid.innerHTML = envs.map(e =>
    '<div class="env-card' + (e.id === current ? ' active' : '') + '" data-env="' + e.id + '" onclick="setEnvironment(\'' + e.id + '\')">' +
    '<span class="env-creatures">' + e.creatures + '</span>' +
    '<div class="env-name">' + e.name + '</div>' +
    '<div class="env-desc">' + e.desc + '</div>' +
    '</div>'
  ).join('');
}

function updateEnvGrid() {
  const current = getEnvironment();
  document.querySelectorAll('.env-card').forEach(c => {
    c.classList.toggle('active', c.dataset.env === current);
  });
}

// Settings tab management
function switchSettingsTab(tab) {
  document.querySelectorAll('.set-tab').forEach((t, i) => {
    const panels = ['profile', 'look', 'account'];
    t.classList.toggle('active', panels[i] === tab);
  });
  document.querySelectorAll('.set-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('set-panel-' + tab);
  if (panel) panel.classList.add('active');
  if (tab === 'look') renderEnvGrid();
}

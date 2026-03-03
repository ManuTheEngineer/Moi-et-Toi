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

function go(p) {
  if (p === 'more') p = 'explore';
  const current = document.querySelector('.pg.on');
  const next = document.getElementById('pg-' + p);
  if (current === next) { closeMenu(); return; }

  if (current) {
    current.classList.add('out');
    current.classList.remove('on');
    setTimeout(() => current.classList.remove('out'), 180);
  }
  if (next) next.classList.add('on');

  // Set page-specific background accent
  document.body.dataset.page = p;

  // Track for recent pages in quick action sheet
  trackRecentPage(p);

  document.querySelectorAll('.bn').forEach(e => e.classList.remove('on'));
  const tabId = TAB_MAP[p] || p;
  const bn = document.querySelector(`[data-p="${tabId}"]`);
  if (bn) bn.classList.add('on');
  closeMenu();
  window.scrollTo({ top: 0 });
}

// ===== QUICK ACTION SHEET =====
let recentPages = JSON.parse(localStorage.getItem('met_recent_pages') || '[]');
let currentPageId = 'dash';

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


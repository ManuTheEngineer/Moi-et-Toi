// ========================================
// ===== KNOW YOUR PERSON MODULE =====
// ========================================
let kypData = {}, kypNotes = {}, kypDates = {}, kypLoveNotes = {};

function listenKnowYou() {
  if (!db) return;
  // Listen to partner's data (what they share about themselves)
  db.ref('knowYou/' + partner + '/favorites').on('value', snap => {
    kypData = snap.val() || {};
    renderKnowYou();
  });
  db.ref('knowYou/' + user + '/notes').on('value', snap => {
    kypNotes = snap.val() || {};
    renderKYPNotes();
  });
  db.ref('knowYou/dates').on('value', snap => {
    kypDates = snap.val() || {};
    renderKYPDates();
  });
  db.ref('knowYou/' + user + '/loveNotes').on('value', snap => {
    kypLoveNotes = snap.val() || {};
    renderKYPLoveNotes();
  });
  listenKYPCategories();
}

function renderKnowYou() {
  const favFields = ['food','color','movie','song','book','place','season','coffee','drink','flower','hobby','sport','restaurant','vacationspot','scent','tvshow','dessert','comfortfood','quote','fear'];
  const sizeFields = ['shirt','pants','shoe','ring'];
  const allFields = favFields.concat(sizeFields);
  let filled = 0;
  allFields.forEach(f => {
    const el = document.getElementById('kyp-' + f);
    if (el) el.textContent = kypData[f] || 'Tap to add';
    if (kypData[f]) filled++;
  });
  const scoreEl = document.getElementById('kyp-score');
  if (scoreEl) {
    const pct = allFields.length ? Math.round(filled / allFields.length * 100) : 0;
    scoreEl.textContent = pct + '%';
  }
}

function editKYP(field) {
  const current = kypData[field] || '';
  const val = prompt('Enter your ' + field + ':', current);
  if (val !== null) {
    db.ref('knowYou/' + user + '/favorites/' + field).set(val.trim());
    // Also update display immediately for own data
    const el = document.getElementById('kyp-' + field);
    if (el) el.textContent = val.trim() || 'Tap to add';
    awardXP(5);
  }
}

async function addKYPDate() {
  const label = document.getElementById('kyp-date-label').value.trim();
  const date = document.getElementById('kyp-date-val').value;
  if (!label || !date) { toast('Enter label and date'); return; }
  await db.ref('knowYou/dates').push({ label, date, user, timestamp: Date.now() });
  document.getElementById('kyp-date-label').value = '';
  toast('Date saved');
  // Auto-add to calendar
  await db.ref('calendar').push({ title: label, date, type: 'recurring', notes: 'From Know Your Person', createdBy: user, timestamp: Date.now() });
  awardXP(5);
}

function renderKYPDates() {
  const container = document.getElementById('kyp-dates');
  if (!container) return;
  const items = Object.entries(kypDates);
  if (!items.length) { container.innerHTML = '<div class="empty">Add birthdays, anniversaries, and special dates</div>'; return; }
  container.innerHTML = items.map(([k, d]) => `
    <div class="card-data" style="margin-bottom:6px">
      <div class="cd-accent" style="background:var(--gold)"></div>
      <div class="cd-number" style="font-size:11px;color:var(--gold)">${d.date.slice(5)}</div>
      <div class="cd-info"><div class="cd-label">${esc(d.label)}</div></div>
    </div>`).join('');
}

async function addKYPNote() {
  const input = document.getElementById('kyp-note-input');
  const text = input.value.trim();
  if (!text) return;
  await db.ref('knowYou/' + user + '/notes').push({ text, timestamp: Date.now() });
  input.value = '';
  toast('Note saved');
  awardXP(5);
}

function renderKYPNotes() {
  const container = document.getElementById('kyp-notes');
  if (!container) return;
  const items = Object.entries(kypNotes);
  if (!items.length) { container.innerHTML = '<div class="empty">Jot down things to remember</div>'; return; }
  container.innerHTML = items.sort((a, b) => b[1].timestamp - a[1].timestamp).map(([k, n]) => `
    <div class="kyp-note" style="padding:10px 0;border-bottom:1px solid var(--tint);display:flex;align-items:center;gap:10px">
      <span style="flex:1;font-size:13px;color:var(--cream)">${esc(n.text)}</span>
      <span style="font-size:10px;color:var(--t3)">${timeAgo(n.timestamp)}</span>
      <button onclick="db.ref('knowYou/${user}/notes/${k}').remove()" style="background:none;border:none;color:var(--red);font-size:14px;cursor:pointer">&times;</button>
    </div>`).join('');
}

async function addLoveNote() {
  const text = document.getElementById('kyp-love-note').value.trim();
  if (!text) { toast('Write a note first'); return; }
  await db.ref('knowYou/' + user + '/loveNotes').push({ text, timestamp: Date.now() });
  document.getElementById('kyp-love-note').value = '';
  toast('Love note saved');
  awardXP(10);
}

function renderKYPLoveNotes() {
  const container = document.getElementById('kyp-love-notes');
  if (!container) return;
  const items = Object.entries(kypLoveNotes);
  if (!items.length) { container.innerHTML = '<div class="empty">Your private notes about what they love</div>'; return; }
  container.innerHTML = items.sort((a, b) => b[1].timestamp - a[1].timestamp).map(([k, n]) => `
    <div class="card-story" style="margin-bottom:8px">
      <div style="font-size:13px;color:var(--cream);white-space:pre-wrap">${esc(n.text)}</div>
      <div style="font-size:10px;color:var(--t3);margin-top:6px">${timeAgo(n.timestamp)}</div>
    </div>`).join('');
}

// ===== KYP QUIZ SYSTEM =====
let currentQuizField = null;
let kypQuizStats = { correct: 0, total: 0 };

function startKYPQuiz() {
  const filledFields = Object.entries(kypData).filter(([k, v]) => v && v.trim());
  if (!filledFields.length) { toast('Your partner hasn\'t added any favorites yet'); return; }
  const [field, value] = filledFields[Math.floor(Math.random() * filledFields.length)];
  currentQuizField = field;
  const labels = {food:'favorite food',color:'favorite color',movie:'favorite movie',song:'favorite song',book:'favorite book',place:'favorite place',season:'favorite season',coffee:'coffee order',drink:'favorite drink',flower:'favorite flower',hobby:'favorite hobby',sport:'favorite sport',restaurant:'favorite restaurant',vacationspot:'dream vacation spot',scent:'favorite scent',tvshow:'favorite TV show',dessert:'favorite dessert',comfortfood:'comfort food',quote:'favorite quote',fear:'biggest fear',shirt:'shirt size',pants:'pants size',shoe:'shoe size',ring:'ring size'};
  const q = document.getElementById('kyp-quiz-q');
  if (q) q.textContent = 'What is ' + (NAMES[partner] || 'your partner') + '\'s ' + (labels[field] || field) + '?';
  const ans = document.getElementById('kyp-quiz-answer');
  if (ans) { ans.value = ''; ans.focus(); }
  const res = document.getElementById('kyp-quiz-result');
  if (res) res.innerHTML = '';
  document.getElementById('kyp-quiz').style.display = '';
  // Load stats
  if (db) db.ref('knowYou/' + user + '/quizStats').once('value', snap => {
    kypQuizStats = snap.val() || { correct: 0, total: 0 };
    renderKYPQuizStats();
  });
}

function checkKYPQuiz() {
  if (!currentQuizField) return;
  const answer = (document.getElementById('kyp-quiz-answer').value || '').trim().toLowerCase();
  const correct = (kypData[currentQuizField] || '').trim().toLowerCase();
  const res = document.getElementById('kyp-quiz-result');
  kypQuizStats.total = (kypQuizStats.total || 0) + 1;
  if (correct && answer && (correct.includes(answer) || answer.includes(correct))) {
    if (res) res.innerHTML = '<span style="color:var(--green)">Correct! It\'s ' + esc(kypData[currentQuizField]) + '</span>';
    kypQuizStats.correct = (kypQuizStats.correct || 0) + 1;
    awardXP(10);
  } else {
    if (res) res.innerHTML = '<span style="color:var(--red)">Not quite. It\'s ' + esc(kypData[currentQuizField]) + '</span>';
  }
  if (db) db.ref('knowYou/' + user + '/quizStats').set(kypQuizStats);
  renderKYPQuizStats();
  setTimeout(() => startKYPQuiz(), 2000);
}

function skipKYPQuiz() {
  if (!currentQuizField) return;
  const res = document.getElementById('kyp-quiz-result');
  if (res) res.innerHTML = '<span style="color:var(--t3)">Answer: ' + esc(kypData[currentQuizField] || '?') + '</span>';
  kypQuizStats.total = (kypQuizStats.total || 0) + 1;
  if (db) db.ref('knowYou/' + user + '/quizStats').set(kypQuizStats);
  renderKYPQuizStats();
  setTimeout(() => startKYPQuiz(), 1500);
}

function renderKYPQuizStats() {
  const el = document.getElementById('kyp-quiz-stats');
  if (!el) return;
  const pct = kypQuizStats.total ? Math.round(kypQuizStats.correct / kypQuizStats.total * 100) : 0;
  el.textContent = kypQuizStats.correct + '/' + kypQuizStats.total + ' correct (' + pct + '%)';
}

// ===== KYP NOTE CATEGORIES =====
let kypCategories = {};

function listenKYPCategories() {
  if (!db) return;
  db.ref('knowYou/' + user + '/categories').on('value', snap => {
    kypCategories = snap.val() || {};
    renderKYPCategories();
  });
}

function saveKYPCategory(cat) {
  const el = document.getElementById('kyp-cat-' + cat);
  if (!el) return;
  const text = el.value.trim();
  if (!text) { toast('Write something first'); return; }
  db.ref('knowYou/' + user + '/categories/' + cat).push({ text, timestamp: Date.now() });
  el.value = '';
  toast('Saved');
  awardXP(5);
}

function renderKYPCategories() {
  const cats = ['happy','petpeeves','dreams','fears'];
  cats.forEach(cat => {
    const container = document.getElementById('kyp-cat-list-' + cat);
    if (!container) return;
    const items = kypCategories[cat] ? Object.entries(kypCategories[cat]) : [];
    if (!items.length) { container.innerHTML = '<div class="empty" style="font-size:12px">Nothing added yet</div>'; return; }
    container.innerHTML = items.sort((a, b) => b[1].timestamp - a[1].timestamp).map(([k, n]) => `
      <div style="padding:8px 0;border-bottom:1px solid var(--tint);display:flex;align-items:center;gap:8px">
        <span style="flex:1;font-size:13px;color:var(--cream)">${esc(n.text)}</span>
        <span style="font-size:10px;color:var(--t3)">${timeAgo(n.timestamp)}</span>
        <button onclick="db.ref('knowYou/${user}/categories/${cat}/${k}').remove()" style="background:none;border:none;color:var(--red);font-size:14px;cursor:pointer">&times;</button>
      </div>`).join('');
  });
}

// ========================================
// ===== PHOTO MEMORIES MODULE =====
// ========================================
let memoriesData = {};

function listenMemories() {
  if (!db) return;
  // Load custom albums into selectors
  memCustomAlbums.forEach(a => {
    ['mem-album','mem-detail-album'].forEach(selId => {
      const sel = document.getElementById(selId);
      if (sel && !sel.querySelector('option[value="' + a + '"]')) {
        const opt = document.createElement('option');
        opt.value = a; opt.textContent = a;
        sel.appendChild(opt);
      }
    });
  });
  refreshAlbumBar();
  // Restore saved view preference
  const savedView = localStorage.getItem('met_mem_view');
  if (savedView === 'timeline') toggleMemoryView('timeline');
  // Listen for data changes
  db.ref('memories').orderByChild('timestamp').on('value', snap => {
    memoriesData = snap.val() || {};
    renderMemories();
    checkOnThisDay();
  });
}

let memCurrentAlbum = 'all';
let memCurrentView = 'grid';
let memCustomAlbums = JSON.parse(localStorage.getItem('met_custom_albums') || '[]');

function getFilteredMemories() {
  let items = Object.entries(memoriesData);
  if (memCurrentAlbum === 'favorites') {
    items = items.filter(([k, m]) => m.favorite);
  } else if (memCurrentAlbum && memCurrentAlbum !== 'all') {
    items = items.filter(([k, m]) => m.album === memCurrentAlbum);
  }
  return items.sort((a, b) => b[1].timestamp - a[1].timestamp);
}

function renderMemories() {
  const container = document.getElementById('mem-grid');
  if (!container) return;
  const items = getFilteredMemories();
  if (!items.length) {
    const msg = memCurrentAlbum === 'all' ? 'Upload your first photo together' :
                memCurrentAlbum === 'favorites' ? 'No favorites yet. Tap a photo to favorite it.' :
                'No memories in this album yet';
    container.innerHTML = '<div class="empty">' + msg + '</div>';
    return;
  }
  container.innerHTML = items.map(([k, m]) => `
    <div class="mem-item" onclick="openMemoryDetail('${k}')">
      <button class="mem-fav-btn ${m.favorite ? 'active' : ''}" onclick="event.stopPropagation();toggleMemFavorite('${k}')">
        ${m.favorite ? '&#9733;' : '&#9734;'}
      </button>
      <img src="${m.imageData}" alt="${esc(m.caption || '')}" loading="lazy">
      <div class="mem-caption">
        <div style="font-size:12px;font-weight:500">${esc(m.caption || '')}</div>
        <div style="font-size:10px;opacity:.7">${m.date || ''} &bull; ${NAMES[m.uploadedBy] || ''}</div>
      </div>
    </div>`).join('');
  // Update section title
  const titleEl = document.getElementById('mem-section-title');
  if (titleEl) titleEl.textContent = memCurrentAlbum === 'all' ? 'All Memories' : memCurrentAlbum === 'favorites' ? 'Favorites' : memCurrentAlbum;
  // Also update timeline if visible
  if (memCurrentView === 'timeline') renderMemoryTimeline();
  // Update prompt
  renderMemoryPrompt();
}

function previewMemory(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    // Compress image
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxSize = 400;
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h *= maxSize / w; w = maxSize; } }
      else { if (h > maxSize) { w *= maxSize / h; h = maxSize; } }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', 0.6);
      document.getElementById('mem-preview-img').src = compressed;
      document.getElementById('mem-preview').style.display = '';
      document.getElementById('mem-preview-img').dataset.data = compressed;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function saveMemory() {
  const imgEl = document.getElementById('mem-preview-img');
  const imageData = imgEl ? imgEl.dataset.data : '';
  if (!imageData) { toast('Upload a photo first'); return; }
  const caption = document.getElementById('mem-caption').value.trim();
  const date = document.getElementById('mem-date').value || new Date().toISOString().split('T')[0];
  const albumSel = document.getElementById('mem-album');
  const album = albumSel ? albumSel.value : '';
  await db.ref('memories').push({ imageData, caption, date, album, uploadedBy: user, timestamp: Date.now() });
  document.getElementById('mem-caption').value = '';
  document.getElementById('mem-date').value = '';
  if (albumSel) albumSel.value = '';
  document.getElementById('mem-preview').style.display = 'none';
  document.getElementById('mem-file').value = '';
  toast('Memory saved');
  awardXP(15);
}

function checkOnThisDay() {
  const today = new Date();
  const monthDay = String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  const matches = Object.values(memoriesData).filter(m => m.date && m.date.slice(5) === monthDay && m.date.slice(0, 4) !== String(today.getFullYear()));
  const container = document.getElementById('mem-onthisday');
  const content = document.getElementById('mem-otd-content');
  if (matches.length && container && content) {
    container.style.display = '';
    content.innerHTML = matches.map(m => `
      <div style="margin-bottom:8px">
        <img src="${m.imageData}" style="width:100%;border-radius:12px;max-height:150px;object-fit:cover">
        <div style="font-size:12px;color:var(--cream);margin-top:4px">${esc(m.caption || '')} &bull; ${m.date}</div>
      </div>`).join('');
  } else if (container) {
    container.style.display = 'none';
  }
}

// ===== MEMORY ALBUMS =====
function filterMemAlbum(album) {
  memCurrentAlbum = album;
  document.querySelectorAll('.mem-album-pill').forEach(p => p.classList.remove('active'));
  const pills = document.querySelectorAll('.mem-album-pill');
  pills.forEach(p => {
    const onclick = p.getAttribute('onclick') || '';
    if (onclick.includes("'" + album + "'")) p.classList.add('active');
  });
  renderMemories();
  if (memCurrentView === 'timeline') renderMemoryTimeline();
}

function addCustomAlbum() {
  const name = prompt('Album name:');
  if (!name || !name.trim()) return;
  const albumName = name.trim();
  if (!memCustomAlbums.includes(albumName)) {
    memCustomAlbums.push(albumName);
    localStorage.setItem('met_custom_albums', JSON.stringify(memCustomAlbums));
    refreshAlbumBar();
    // Also add to the upload selector
    const sel = document.getElementById('mem-album');
    if (sel) {
      const opt = document.createElement('option');
      opt.value = albumName; opt.textContent = albumName;
      sel.appendChild(opt);
    }
    const detailSel = document.getElementById('mem-detail-album');
    if (detailSel) {
      const opt2 = document.createElement('option');
      opt2.value = albumName; opt2.textContent = albumName;
      detailSel.appendChild(opt2);
    }
  }
  filterMemAlbum(albumName);
}

function refreshAlbumBar() {
  const bar = document.getElementById('mem-album-bar');
  if (!bar) return;
  const defaults = ['all','favorites','Dates','Trips','Home','Milestones'];
  let html = defaults.map(a => {
    const label = a === 'all' ? 'All' : a === 'favorites' ? 'Favorites' : a;
    return '<button class="mem-album-pill' + (memCurrentAlbum === a ? ' active' : '') + '" onclick="filterMemAlbum(\'' + a + '\')">' + label + '</button>';
  }).join('');
  memCustomAlbums.forEach(a => {
    html += '<button class="mem-album-pill' + (memCurrentAlbum === a ? ' active' : '') + '" onclick="filterMemAlbum(\'' + esc(a) + '\')">' + esc(a) + '</button>';
  });
  html += '<button class="mem-album-pill" onclick="addCustomAlbum()" style="border-style:dashed">+ New</button>';
  bar.innerHTML = html;
}

// ===== MEMORY VIEW TOGGLE =====
function toggleMemoryView(view) {
  memCurrentView = view;
  localStorage.setItem('met_mem_view', view);
  const gridEl = document.getElementById('mem-grid');
  const tlEl = document.getElementById('mem-timeline');
  const gridBtn = document.getElementById('mem-view-grid-btn');
  const tlBtn = document.getElementById('mem-view-tl-btn');
  if (view === 'grid') {
    if (gridEl) gridEl.style.display = '';
    if (tlEl) tlEl.style.display = 'none';
    if (gridBtn) gridBtn.classList.add('active');
    if (tlBtn) tlBtn.classList.remove('active');
  } else {
    if (gridEl) gridEl.style.display = 'none';
    if (tlEl) tlEl.style.display = '';
    if (gridBtn) gridBtn.classList.remove('active');
    if (tlBtn) tlBtn.classList.add('active');
    renderMemoryTimeline();
  }
}

function renderMemoryTimeline() {
  const container = document.getElementById('mem-timeline');
  if (!container) return;
  const items = getFilteredMemories();
  if (!items.length) { container.innerHTML = '<div class="empty">No memories to show</div>'; return; }
  // Group by month
  const months = {};
  items.forEach(([k, m]) => {
    const monthKey = m.date ? m.date.slice(0, 7) : 'Unknown';
    if (!months[monthKey]) months[monthKey] = [];
    months[monthKey].push([k, m]);
  });
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  container.innerHTML = Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).map(([month, memories]) => {
    const [y, mo] = month.split('-');
    const label = monthNames[parseInt(mo) - 1] + ' ' + y;
    return '<div class="mem-tl-month">' + label + '</div>' +
      memories.map(([k, m]) => `
        <div class="mem-tl-item" onclick="openMemoryDetail('${k}')">
          <img src="${m.imageData}" alt="" loading="lazy">
          <div class="mem-tl-info">
            <div class="mem-tl-caption">${esc(m.caption || 'No caption')}</div>
            <div class="mem-tl-meta">${m.date || ''} &bull; ${NAMES[m.uploadedBy] || ''} ${m.album ? '&bull; ' + esc(m.album) : ''}</div>
          </div>
        </div>`).join('');
  }).join('');
}

// ===== MEMORY FAVORITES =====
function toggleMemFavorite(key) {
  if (!db || !key) return;
  const current = memoriesData[key] && memoriesData[key].favorite;
  db.ref('memories/' + key + '/favorite').set(!current);
}

// ===== MEMORY PROMPTS =====
const MEMORY_PROMPTS = [
  'What were you doing one month ago?',
  'Share a photo from your last date night.',
  'What is your favorite memory together this year?',
  'Share something from a trip you took together.',
  'What made you smile together recently?',
  'Capture a cozy moment at home.',
  'Share a photo that makes you both laugh.',
  'What adventure would you love to relive?',
  'Post a photo from a celebration you shared.',
  'What everyday moment do you want to remember?',
  'Share a photo of something you cooked together.',
  'Capture a sunset or sunrise you watched together.',
  'What place holds a special memory for you both?',
  'Share a photo from the first month you were together.',
  'What moment this week are you most grateful for?'
];

function getMemoryPrompt() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return MEMORY_PROMPTS[dayOfYear % MEMORY_PROMPTS.length];
}

function renderMemoryPrompt() {
  const el = document.getElementById('mem-prompt-text');
  if (el) el.textContent = getMemoryPrompt();
}

function useMemoryPrompt() {
  const captionEl = document.getElementById('mem-caption');
  if (captionEl) captionEl.value = getMemoryPrompt();
  document.getElementById('mem-file').click();
}

// ===== MEMORY DETAIL VIEW =====
let currentMemoryKey = null;

function openMemoryDetail(key) {
  const m = memoriesData[key];
  if (!m) return;
  currentMemoryKey = key;
  const modal = document.getElementById('mem-detail-modal');
  document.getElementById('mem-detail-img').src = m.imageData || '';
  document.getElementById('mem-detail-caption').textContent = m.caption || 'No caption';
  document.getElementById('mem-detail-meta').textContent = (m.date || '') + ' \u2022 ' + (NAMES[m.uploadedBy] || '');
  const favBtn = document.getElementById('mem-detail-fav-btn');
  if (favBtn) favBtn.textContent = m.favorite ? 'Unfavorite' : 'Favorite';
  const albumSel = document.getElementById('mem-detail-album');
  if (albumSel) albumSel.value = m.album || '';
  if (modal) modal.classList.add('on');
}

function closeMemoryDetail() {
  const modal = document.getElementById('mem-detail-modal');
  if (modal) modal.classList.remove('on');
  currentMemoryKey = null;
}

function toggleMemDetailFav() {
  if (!currentMemoryKey) return;
  toggleMemFavorite(currentMemoryKey);
  // Update button text immediately
  const m = memoriesData[currentMemoryKey];
  const favBtn = document.getElementById('mem-detail-fav-btn');
  if (favBtn && m) favBtn.textContent = m.favorite ? 'Favorite' : 'Unfavorite';
}

function setMemDetailAlbum(album) {
  if (!currentMemoryKey || !db) return;
  db.ref('memories/' + currentMemoryKey + '/album').set(album);
  toast('Album updated');
}

function deleteMemory() {
  if (!currentMemoryKey || !db) return;
  if (!confirm('Delete this memory? This cannot be undone.')) return;
  db.ref('memories/' + currentMemoryKey).remove();
  closeMemoryDetail();
  toast('Memory deleted');
}

// ========================================
// ===== ACHIEVEMENTS MODULE =====
// ========================================
let achievementsData = { badges: {}, xp: 0, level: 1 };

function listenAchievements() {
  if (!db) return;
  db.ref('achievements').on('value', snap => {
    achievementsData = snap.val() || { badges: {}, xp: 0, level: 1 };
    renderAchievements();
  });
}

function renderAchievements() {
  const el = id => document.getElementById(id);
  const data = achievementsData;
  const level = data.level || 1;
  const xp = data.xp || 0;
  const xpForNext = level * 100;

  if (el('ach-level')) el('ach-level').textContent = level;
  if (el('ach-xp')) el('ach-xp').textContent = xp;
  if (el('ach-xp-next')) el('ach-xp-next').textContent = xpForNext;
  if (el('ach-xp-bar')) el('ach-xp-bar').style.width = Math.min(100, (xp % (level * 100)) / (level * 100) * 100) + '%';

  // Unlock badges
  const badges = data.badges || {};
  document.querySelectorAll('.achievement').forEach(badge => {
    const id = badge.id.replace('ach-', '');
    if (badges[id]) {
      badge.classList.remove('locked');
      badge.classList.add('unlocked');
    }
  });
}

async function awardXP(amount) {
  if (!db) return;
  const snap = await db.ref('achievements/xp').once('value');
  const currentXP = snap.val() || 0;
  const newXP = currentXP + amount;
  const snap2 = await db.ref('achievements/level').once('value');
  const currentLevel = snap2.val() || 1;
  const xpForNext = currentLevel * 100;
  if (newXP >= xpForNext) {
    await db.ref('achievements/level').set(currentLevel + 1);
    await db.ref('achievements/xp').set(newXP - xpForNext);
    toast('Level up! Now level ' + (currentLevel + 1));
  } else {
    await db.ref('achievements/xp').set(newXP);
  }
}

async function unlockBadge(badgeId, badgeName) {
  const snap = await db.ref('achievements/badges/' + badgeId).once('value');
  if (snap.val()) return;
  await db.ref('achievements/badges/' + badgeId).set({ unlockedAt: Date.now() });
  toast('Badge unlocked: ' + badgeName);
  awardXP(25);
}

async function checkAchievements() {
  if (!db) return;
  // Check letter count
  const letters = await db.ref('letters').once('value');
  const letterCount = letters.val() ? Object.keys(letters.val()).length : 0;
  if (letterCount >= 1) unlockBadge('first-letter', 'First Letter');
  const el = id => document.getElementById(id);
  if (el('ach-stat-letters')) el('ach-stat-letters').textContent = letterCount;

  // Check games
  const gamesSnap = await db.ref('games/history').once('value');
  const gameCount = gamesSnap.val() ? Object.keys(gamesSnap.val()).length : 0;
  if (gameCount >= 10) unlockBadge('game-champs', 'Game Night Champions');
  if (el('ach-stat-games')) el('ach-stat-games').textContent = gameCount;

  // Check moods
  const moodSnap = await db.ref('moods').once('value');
  const moodCount = moodSnap.val() ? Object.keys(moodSnap.val()).length : 0;
  if (el('ach-stat-moods')) el('ach-stat-moods').textContent = moodCount;

  // Check dreams
  const dreamSnap = await db.ref('dreams').once('value');
  const dreamCount = dreamSnap.val() ? Object.keys(dreamSnap.val()).length : 0;
  if (dreamCount >= 20) unlockBadge('dream-big', 'Dream Big');
  if (el('ach-stat-dreams')) el('ach-stat-dreams').textContent = dreamCount;

  // Check workouts
  const fitSnap = await db.ref('fitness/' + user + '/workouts').once('value');
  const workoutCount = fitSnap.val() ? Object.keys(fitSnap.val()).length : 0;
  if (el('ach-stat-workouts')) el('ach-stat-workouts').textContent = workoutCount;

  // Check memories
  const memCount = Object.keys(memoriesData).length;
  if (memCount >= 10) unlockBadge('memory-makers', 'Memory Makers');
  if (el('ach-stat-memories')) el('ach-stat-memories').textContent = memCount;

  // Check culture
  const cultureSnap = await db.ref('culture/phrases').once('value');
  const cultureCount = cultureSnap.val() ? Object.keys(cultureSnap.val()).length : 0;
  if (cultureCount >= 10) unlockBadge('culture-bridge', 'Culture Bridge');

  // Check KYP favorites
  const kypSnap = await db.ref('knowYou/' + user + '/favorites').once('value');
  const kypFav = kypSnap.val() || {};
  const fields = ['food', 'color', 'movie', 'song', 'book', 'place', 'season', 'coffee'];
  if (fields.every(f => kypFav[f])) unlockBadge('know-it-all', 'Know It All');

  // Check dream home rooms
  const dhRooms = Object.keys(dreamHomeData).filter(r => dreamHomeData[r] && Object.keys(dreamHomeData[r]).length > 0);
  if (dhRooms.length >= 3) unlockBadge('home-dreamers', 'Home Dreamers');

  // Check streak for week and month badges
  const streakEl = document.getElementById('fit-streak');
  const currentStreak = streakEl ? parseInt(streakEl.textContent) : 0;
  if (currentStreak >= 7) unlockBadge('week-streak', 'Week Streak');
  if (currentStreak >= 30) unlockBadge('month-strong', 'Month Strong');

  // Check fit couple - both worked out this week
  const partnerFitSnap = await db.ref('fitness/' + partner + '/workouts').orderByChild('date').limitToLast(7).once('value');
  const partnerWorkouts = partnerFitSnap.val() ? Object.values(partnerFitSnap.val()) : [];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const myWeek = Object.values(fitnessData).some(w => w.date >= weekAgo);
  const partnerWeek = partnerWorkouts.some(w => w.date >= weekAgo);
  if (myWeek && partnerWeek) unlockBadge('fit-couple', 'Fit Couple');

  // Check savings goals
  const savingsSnap = await db.ref('homelife/savings').once('value');
  const savings = savingsSnap.val() ? Object.values(savingsSnap.val()) : [];
  if (savings.some(s => s.saved >= s.target && s.target > 0)) unlockBadge('money-smart', 'Money Smart');

  // Deep talk check
  const dtSnap = await db.ref('deepTalk/completed').once('value');
  const dtCompleted = dtSnap.val() ? Object.keys(dtSnap.val()).length : 0;
  if (dtCompleted >= 10) unlockBadge('deep-divers', 'Deep Divers');
}

// ========================================
// ===== PRESENCE SYSTEM =====
// ========================================
function initPresence() {
  if (!db || !user) return;
  const presRef = db.ref('presence/' + user);
  const connRef = db.ref('.info/connected');
  connRef.on('value', snap => {
    if (snap.val() === true) {
      presRef.onDisconnect().set({ online: false, lastSeen: firebase.database.ServerValue.TIMESTAMP });
      presRef.set({ online: true, currentPage: document.body.dataset.page || 'dash', lastSeen: firebase.database.ServerValue.TIMESTAMP });
    }
  });
  // Listen to partner presence
  db.ref('presence/' + partner).on('value', snap => {
    const p = snap.val() || {};
    const dot = document.getElementById('fit-partner-dot');
    if (dot) dot.className = 'presence-dot ' + (p.online ? 'online' : 'offline');
    // Update page header presence dot + name
    const phDot = document.getElementById('ph-presence-dot');
    if (phDot) phDot.classList.toggle('offline', !p.online);
    const phName = document.getElementById('ph-presence-name');
    if (phName) phName.textContent = NAMES[partner];
    // Update dashboard presence dot
    const dashDot = document.getElementById('dash-presence-dot');
    if (dashDot) dashDot.classList.toggle('offline', !p.online);
    const nameEl = document.getElementById('fit-partner-name');
    if (nameEl) nameEl.textContent = NAMES[partner];
    const lastEl = document.getElementById('fit-partner-last');
    if (lastEl) lastEl.textContent = p.online ? 'Online now' : (p.lastSeen ? 'Last seen ' + timeAgo(p.lastSeen) : 'Offline');
  });
}


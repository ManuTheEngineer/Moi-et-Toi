// ===== WOULD YOU RATHER =====
const WYR_QUESTIONS = [
  {a:"Travel the world together for a year",b:"Have a dream home together right now"},
  {a:"Always know what your partner is thinking",b:"Always know what your partner is feeling"},
  {a:"Cook a fancy dinner together",b:"Order in and watch a movie together"},
  {a:"Go on a spontaneous road trip",b:"Plan a perfect vacation in detail"},
  {a:"Relive your first date",b:"Skip to your 50th anniversary"},
  {a:"Have a partner who gives amazing gifts",b:"Have a partner who writes you love letters"},
  {a:"Live in a cabin in the mountains",b:"Live in a beach house by the ocean"},
  {a:"Always agree on everything",b:"Have passionate debates that make you grow"},
  {a:"Have breakfast in bed every morning",b:"Have a slow dance in the kitchen every evening"},
  {a:"Know your love language perfectly",b:"Know your partner's dream future perfectly"},
  {a:"Take a cooking class together",b:"Take a dance class together"},
  {a:"Have a picnic under the stars",b:"Have coffee watching the sunrise"},
  {a:"Read each other's minds for a day",b:"Swap lives for a day"},
  {a:"Have a movie night every week",b:"Have a date night out every week"},
  {a:"Write a song together",b:"Paint a picture together"},
  {a:"Live somewhere always warm",b:"Live somewhere with all four seasons"},
  {a:"Have the ability to pause time together",b:"Have the ability to teleport to each other"},
  {a:"Go to a couples spa retreat",b:"Go on an adventure like skydiving"},
  {a:"Have a partner who always makes you laugh",b:"Have a partner who always makes you feel safe"},
  {a:"Receive a handwritten letter",b:"Receive a surprise visit"},
];

let wyrIndex = 0;

function loadWYR() {
  const q = WYR_QUESTIONS[wyrIndex];
  document.getElementById('wyr-a').textContent = q.a;
  document.getElementById('wyr-b').textContent = q.b;
  document.getElementById('wyr-a').className = 'wyr-option';
  document.getElementById('wyr-b').className = 'wyr-option';
  document.getElementById('wyr-result').textContent = '';
  // Load saved answers
  if (db) {
    db.ref('games/wyr/' + wyrIndex).once('value', snap => {
      const data = snap.val();
      if (data && data[user]) {
        document.getElementById('wyr-' + data[user].toLowerCase()).classList.add('picked');
      }
      if (data && data[partner]) {
        document.getElementById('wyr-' + data[partner].toLowerCase()).classList.add('partner-picked');
        const match = data[user] === data[partner];
        document.getElementById('wyr-result').textContent = match ? 'You both picked the same' : 'You picked differently';
      }
    });
  }
}

async function pickWYR(choice) {
  if (!db || !user) return;
  await db.ref('games/wyr/' + wyrIndex + '/' + user).set(choice);
  document.getElementById('wyr-a').classList.remove('picked');
  document.getElementById('wyr-b').classList.remove('picked');
  document.getElementById('wyr-' + choice.toLowerCase()).classList.add('picked');
  // Check partner answer
  const snap = await db.ref('games/wyr/' + wyrIndex + '/' + partner).once('value');
  if (snap.val()) {
    document.getElementById('wyr-' + snap.val().toLowerCase()).classList.add('partner-picked');
    const match = choice === snap.val();
    document.getElementById('wyr-result').textContent = match ? 'You both picked the same' : 'You picked differently';
  } else {
    document.getElementById('wyr-result').textContent = 'Waiting for ' + NAMES[partner] + '...';
  }
  toast('Answer saved');
}

function nextWYR() { wyrIndex = (wyrIndex + 1) % WYR_QUESTIONS.length; loadWYR(); }
function prevWYR() { wyrIndex = (wyrIndex - 1 + WYR_QUESTIONS.length) % WYR_QUESTIONS.length; loadWYR(); }

// ===== HOW WELL DO YOU KNOW ME =====
async function submitQuizQ() {
  if (!db || !user) return;
  const q = document.getElementById('quiz-q').value.trim();
  const a = document.getElementById('quiz-a').value.trim();
  if (!q || !a) { toast('Question and answer required'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('games/knowme/' + user).push({
    question: q, answer: a, timestamp: Date.now()
  });
  document.getElementById('quiz-q').value = '';
  document.getElementById('quiz-a').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add question'; }, 1500); }
  toast('Question added');
}

function listenQuiz() {
  // My questions
  db.ref('games/knowme/' + user).on('value', snap => {
    const el = document.getElementById('quiz-mine');
    if (!el) return;
    const qs = [];
    snap.forEach(c => qs.push(c.val()));
    if (!qs.length) { el.innerHTML = '<div class="empty">Add questions about yourself for your partner to answer.</div>'; return; }
    el.innerHTML = qs.map(q => `<div class="quiz-item"><div class="quiz-item-q">${q.question}</div><div class="quiz-item-a correct">Answer: ${q.answer}</div></div>`).join('');
  });
  // Partner's questions
  db.ref('games/knowme/' + partner).on('value', snap => {
    const el = document.getElementById('quiz-theirs');
    if (!el) return;
    const qs = [];
    snap.forEach(c => { const v = c.val(); v._key = c.key; qs.push(v); });
    if (!qs.length) { el.innerHTML = '<div class="empty">Waiting for your partner to write some questions</div>'; return; }
    el.innerHTML = qs.map(q => {
      return `<div class="quiz-item">
        <div class="quiz-item-q">${q.question}</div>
        <input class="quiz-q" placeholder="Your guess..." onkeydown="if(event.key==='Enter')checkQuizAnswer(this,'${q.answer.replace(/'/g,"\\'")}')">
      </div>`;
    }).join('');
  });
}

function checkQuizAnswer(input, correct) {
  const guess = input.value.trim().toLowerCase();
  const answer = correct.toLowerCase();
  const parent = input.closest('.quiz-item');
  if (guess === answer) {
    parent.innerHTML += '<div class="quiz-item-a correct">Correct — ' + correct.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>';
    input.remove();
    toast('Correct');
  } else {
    toast('Not quite, try again');
  }
}

// ===== BUCKET LIST =====
let bucketFilter = 'all';
const BUCKET_CATS = ['travel','food','adventure','home','other'];

async function addBucketItem() {
  if (!db || !user) return;
  const title = document.getElementById('bl-input').value.trim();
  const emoji = document.getElementById('bl-emoji').value.trim() || '✨';
  if (!title) { toast('Enter a dream first'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  // Detect category from keywords
  let cat = 'other';
  const lower = title.toLowerCase();
  if (/visit|trip|travel|fly|country|city|island|japan|paris|italy/.test(lower)) cat = 'travel';
  else if (/eat|cook|restaurant|food|recipe|bake|cafe|dinner/.test(lower)) cat = 'food';
  else if (/try|climb|dive|jump|hike|run|swim|sky|bungee|surf/.test(lower)) cat = 'adventure';
  else if (/house|apartment|decor|garden|furniture|move|build/.test(lower)) cat = 'home';

  await db.ref('bucketList').push({
    title, emoji, category: cat,
    addedBy: user, addedByName: NAMES[user],
    completed: false, timestamp: Date.now()
  });
  document.getElementById('bl-input').value = '';
  document.getElementById('bl-emoji').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add'; }, 1500); }
  toast('Dream added');
}

function filterBucket(cat, el) {
  bucketFilter = cat;
  document.querySelectorAll('.bl-cat').forEach(e => e.classList.remove('on'));
  if (el) el.classList.add('on');
  listenBucketList();
}

function listenBucketList() {
  db.ref('bucketList').orderByChild('timestamp').on('value', snap => {
    const items = [];
    snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); });
    items.reverse();
    renderBucketList(items);
  });
}

function renderBucketList(items) {
  const el = document.getElementById('bl-list');
  if (!el) return;
  const filtered = bucketFilter === 'all' ? items : items.filter(i => i.category === bucketFilter);
  if (!filtered.length) { el.innerHTML = '<div class="empty">No items in this category yet.</div>'; return; }
  el.innerHTML = filtered.map(i => `<div class="bl-item ${i.completed ? 'completed' : ''}">
    <div class="bl-check" onclick="toggleBucket('${i._key}',${!i.completed})">${i.completed ? '✓' : ''}</div>
    <span class="bl-emoji">${i.emoji}</span>
    <div class="bl-info">
      <div class="bl-title">${i.title.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
      <div class="bl-meta">${i.addedBy === user ? 'You' : (i.addedByName || '?')} · ${i.category}</div>
    </div>
    <button class="item-delete" onclick="event.stopPropagation();deleteBucketItem('${i._key}')">×</button>
  </div>`).join('');
  updateBLStats();
}

async function toggleBucket(key, completed) {
  if (!db) return;
  await db.ref('bucketList/' + key + '/completed').set(completed);
  if (completed) toast('Dream achieved');
}

// ===== WISHLISTS =====
async function addWishItem() {
  if (!db || !user) return;
  const title = document.getElementById('wl-input').value.trim();
  const link = document.getElementById('wl-link').value.trim();
  const priority = document.getElementById('wl-priority').value;
  if (!title) { toast('Enter an item first'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('wishlists/' + user).push({
    title, link, priority,
    purchased: false, timestamp: Date.now()
  });
  document.getElementById('wl-input').value = '';
  document.getElementById('wl-link').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add'; }, 1500); }
  toast('Added to wishlist');
}

function listenWishlists() {
  // My wishlist
  db.ref('wishlists/' + user).orderByChild('timestamp').on('value', snap => {
    const items = [];
    snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); });
    items.reverse();
    const el = document.getElementById('wl-mine');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Drop hints here</div>'; return; }
    el.innerHTML = items.map(i => `<div class="wl-item ${i.purchased ? 'purchased' : ''}">
      <div class="wl-info">
        <div class="wl-title">${esc(i.title)}</div>
        <span class="wl-priority ${i.priority}">${i.priority === 'love' ? '♡ Love it' : i.priority === 'want' ? '★ Want it' : '● Need it'}</span>
        ${i.link && safeHref(i.link) ? `<a class="wl-link" href="${safeHref(i.link)}" target="_blank" rel="noopener">View →</a>` : ''}
      </div>
      <button class="item-delete" onclick="event.stopPropagation();deleteWishItem('${user}','${i._key}')">×</button>
    </div>`).join('');
  });
  // Partner's wishlist
  db.ref('wishlists/' + partner).orderByChild('timestamp').on('value', snap => {
    const items = [];
    snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); });
    items.reverse();
    const el = document.getElementById('wl-theirs');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Nothing here yet — someone is being mysterious</div>'; return; }
    el.innerHTML = items.map(i => `<div class="wl-item ${i.purchased ? 'purchased' : ''}">
      <div class="wl-info">
        <div class="wl-title">${esc(i.title)}</div>
        <span class="wl-priority ${i.priority}">${i.priority === 'love' ? '♡ Love it' : i.priority === 'want' ? '★ Want it' : '● Need it'}</span>
        ${i.link && safeHref(i.link) ? `<a class="wl-link" href="${safeHref(i.link)}" target="_blank" rel="noopener">View →</a>` : ''}
      </div>
      ${!i.purchased ? `<button class="wl-buy" onclick="markPurchased('${i._key}')">Got it</button>` : '<span style="font-size:10px;color:var(--gold)">✓ Got</span>'}
    </div>`).join('');
  });
}

async function markPurchased(key) {
  if (!db) return;
  await db.ref('wishlists/' + partner + '/' + key + '/purchased').set(true);
  toast('Marked as purchased');
}

// ===== DATE NIGHT GENERATOR =====
const DATE_IDEAS = [
  {cat:'home',emoji:'🍿',title:'Movie Marathon Night',desc:'Pick a trilogy or director. Make popcorn. No phones. Blankets required.'},
  {cat:'home',emoji:'👨‍🍳',title:'Cook-Off Challenge',desc:'Each person picks a secret recipe. Cook simultaneously. Judge each other\'s dishes.'},
  {cat:'home',emoji:'🎨',title:'Paint & Sip',desc:'Get two canvases, some paint, wine. Paint the same subject, compare results.'},
  {cat:'home',emoji:'🕯',title:'Candlelit Dinner at Home',desc:'Dress up nice. Set the table properly. Cook something special. Real napkins.'},
  {cat:'home',emoji:'🧩',title:'Puzzle Night',desc:'1000-piece puzzle, music, snacks. See how far you get in one evening.'},
  {cat:'home',emoji:'📖',title:'Read Together',desc:'Same book, same couch, different ends. Discuss chapters over tea.'},
  {cat:'home',emoji:'🎮',title:'Retro Game Night',desc:'Old-school video games or board games. Winner picks dessert.'},
  {cat:'home',emoji:'💆',title:'Spa Night',desc:'Face masks, foot soaks, massage oils. Take turns pampering each other.'},
  {cat:'home',emoji:'🌮',title:'Taco Tuesday Deluxe',desc:'Every topping imaginable. Build your own tacos. Compete for best creation.'},
  {cat:'home',emoji:'🔮',title:'Question Deep Dive',desc:'36 questions that lead to love. No distractions. Just each other.'},
  {cat:'outdoor',emoji:'🌅',title:'Sunrise Picnic',desc:'Wake up early. Pack breakfast. Find the best view. Watch the sky change.'},
  {cat:'outdoor',emoji:'🥾',title:'Hike & Discover',desc:'Find a trail neither of you has done. Pack snacks. Take photos at the top.'},
  {cat:'outdoor',emoji:'🚗',title:'Mystery Drive',desc:'Take turns saying left/right/straight. End up somewhere random. Explore.'},
  {cat:'outdoor',emoji:'⭐',title:'Stargazing',desc:'Blanket, hot drinks, star map app. Find constellations. Make wishes.'},
  {cat:'outdoor',emoji:'🚴',title:'Bike Ride Adventure',desc:'Rent bikes or use your own. Explore a new neighborhood or trail together.'},
  {cat:'outdoor',emoji:'📸',title:'Photo Walk',desc:'Each take 20 photos of things that catch your eye. Compare perspectives after.'},
  {cat:'outdoor',emoji:'🧺',title:'Sunset Picnic',desc:'Pack a basket. Find a park or waterfront spot. Watch the sun go down together.'},
  {cat:'fancy',emoji:'🍷',title:'Wine Tasting',desc:'Visit a winery or buy 4 bottles. Rate each one blindfolded. Find your couple wine.'},
  {cat:'fancy',emoji:'🎭',title:'Theatre or Live Show',desc:'Book tickets to something neither of you would normally see. Dress up.'},
  {cat:'fancy',emoji:'🍽',title:'Chef\'s Table Experience',desc:'Find a tasting menu restaurant. Let someone else cook. Savor every course.'},
  {cat:'fancy',emoji:'💃',title:'Dancing Night',desc:'Salsa, swing, or ballroom class. Then go out dancing after.'},
  {cat:'fancy',emoji:'🎵',title:'Jazz Club Evening',desc:'Find a live jazz spot. Dress sharp. Sip cocktails. Feel like old Hollywood.'},
  {cat:'adventure',emoji:'🧗',title:'Rock Climbing',desc:'Indoor climbing gym. Belay each other. Trust falls built in.'},
  {cat:'adventure',emoji:'🛶',title:'Kayak or Canoe',desc:'Rent one and paddle somewhere scenic. Teamwork required.'},
  {cat:'adventure',emoji:'🎯',title:'Axe Throwing',desc:'Surprisingly fun couples activity. Release some energy. Compete.'},
  {cat:'adventure',emoji:'🏄',title:'Learn Something Together',desc:'Surfing, pottery, archery, glass blowing. First-timers together.'},
  {cat:'adventure',emoji:'🗺',title:'Tourist in Your Own City',desc:'Visit attractions you\'ve never been to in your own town. Pretend you\'re tourists.'},
  {cat:'budget',emoji:'☕',title:'Coffee Shop Hop',desc:'Visit 3 different coffee shops. Rate each one. Find your new favorite spot.'},
  {cat:'budget',emoji:'🌳',title:'Park & People Watch',desc:'Pack snacks, find a bench. Create backstories for strangers walking by.'},
  {cat:'budget',emoji:'🎪',title:'Free Community Event',desc:'Check local listings for free concerts, markets, festivals, or outdoor movies.'},
  {cat:'budget',emoji:'📝',title:'Love Letter Exchange',desc:'Sit in the same room. Write each other a letter. Exchange and read aloud.'},
  {cat:'budget',emoji:'🌙',title:'Night Walk',desc:'Walk through your neighborhood at night. Different energy. Hold hands. Talk.'},
  {cat:'budget',emoji:'🏠',title:'Fort Building',desc:'Blankets, pillows, fairy lights. Build a fort in the living room. Never grow up.'},
];

let currentDateIdea = null;
let dnFilter = 'all';

function spinDateNight() {
  const wheel = document.getElementById('dn-wheel');
  const filtered = dnFilter === 'all' ? DATE_IDEAS : DATE_IDEAS.filter(d => d.cat === dnFilter);
  if (!filtered.length) return;
  wheel.classList.add('spinning');
  setTimeout(() => {
    wheel.classList.remove('spinning');
    currentDateIdea = filtered[Math.floor(Math.random() * filtered.length)];
    document.getElementById('dn-emoji').textContent = currentDateIdea.emoji;
    document.getElementById('dn-result-cat').textContent = currentDateIdea.cat.toUpperCase();
    document.getElementById('dn-result-idea').textContent = currentDateIdea.title;
    document.getElementById('dn-result-desc').textContent = currentDateIdea.desc;
    document.getElementById('dn-result').style.display = 'block';
  }, 600);
}

function filterDN(cat, el) {
  dnFilter = cat;
  document.querySelectorAll('#dn-cats .bl-cat').forEach(e => e.classList.remove('on'));
  if (el) el.classList.add('on');
}

async function saveDateIdea() {
  if (!db || !user || !currentDateIdea) return;
  await db.ref('dateNights').push({
    ...currentDateIdea, savedBy: user, savedByName: NAMES[user],
    done: false, timestamp: Date.now()
  });
  toast('Date idea saved');
}

function listenDateNights() {
  db.ref('dateNights').orderByChild('timestamp').on('value', snap => {
    const items = [];
    snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); });
    items.reverse();
    const saved = items.filter(i => !i.done);
    const done = items.filter(i => i.done);
    const sEl = document.getElementById('dn-saved');
    const hEl = document.getElementById('dn-history');
    if (sEl) {
      if (!saved.length) sEl.innerHTML = '<div class="empty">No saved ideas yet. Spin the wheel!</div>';
      else sEl.innerHTML = saved.map(i => {
        const who = i.savedBy === user ? 'you' : (i.savedByName||'?');
        return `<div class="dn-saved-card">
        <div class="dn-saved-emoji">${i.emoji}</div>
        <div class="dn-saved-info"><div class="dn-saved-title">${i.title}</div><div class="dn-saved-meta">${i.cat} · saved by ${who}</div></div>
        <button class="dn-done-btn" onclick="markDateDone('${i._key}')">Did it</button>
        <button class="item-delete" style="opacity:.4" onclick="event.stopPropagation();deleteDateIdea('${i._key}')">×</button>
      </div>`;
      }).join('');
    }
    if (hEl) {
      if (!done.length) hEl.innerHTML = '<div class="empty">No dates done yet. Go on one!</div>';
      else hEl.innerHTML = done.map(i => {
        const ts = timeAgo(new Date(i.doneAt||i.timestamp));
        return `<div class="dn-saved-card" style="opacity:.7"><div class="dn-saved-emoji">${i.emoji}</div><div class="dn-saved-info"><div class="dn-saved-title">${i.title}</div><div class="dn-saved-meta">${ts}${i.rating?' · '+'★'.repeat(i.rating):''}</div></div></div>`;
      }).join('');
    }
  });
}

async function markDateDone(key) {
  if (!db) return;
  const rating = parseInt(prompt('Rate this date 1-5 stars:') || '0');
  await db.ref('dateNights/' + key).update({ done: true, doneAt: Date.now(), rating: Math.min(5, Math.max(0, rating)) });
  toast('Date completed');
}

// ===== LOVE LANGUAGES =====
const LL_NAMES = ['Words of Affirmation','Quality Time','Receiving Gifts','Acts of Service','Physical Touch'];
const LL_QUIZ = [
  {q:'I feel most loved when my partner...',a:['Tells me how much I mean to them','Spends undivided time with me'],l:[0,1]},
  {q:'What makes you feel most appreciated?',a:['A thoughtful gift, even small','When they help without being asked'],l:[2,3]},
  {q:'After a long day, I want my partner to...',a:['Hold me and be close','Tell me they\'re proud of me'],l:[4,0]},
  {q:'The best surprise would be...',a:['A day planned just for us two','A heartfelt handwritten note'],l:[1,0]},
  {q:'I feel disconnected when...',a:['We haven\'t touched in a while','They forget to help with things I need'],l:[4,3]},
  {q:'My ideal evening involves...',a:['Sitting close, watching something together','Receiving a small unexpected gift'],l:[1,2]},
  {q:'I feel most valued when they...',a:['Take something off my plate without me asking','Say specific things they love about me'],l:[3,0]},
  {q:'What warms your heart most?',a:['A long hug after time apart','When they plan our time intentionally'],l:[4,1]},
  {q:'Which means more to you?',a:['They remembered something I mentioned wanting','They wrote me a love letter'],l:[2,0]},
  {q:'I feel closest to my partner when...',a:['We\'re doing something together, phones away','They do my least favorite chore for me'],l:[1,3]},
];
let llStep = 0;
let llScores = [0,0,0,0,0];

function loadLLQuiz() {
  if (!db || !user) return;
  db.ref('loveLang/' + user).once('value', snap => {
    const data = snap.val();
    if (data && data.scores) {
      showLLResults();
    } else {
      llStep = 0; llScores = [0,0,0,0,0];
      renderLLQuestion();
      document.getElementById('ll-quiz').style.display = 'block';
      document.getElementById('ll-results').style.display = 'none';
    }
  });
}

function renderLLQuestion() {
  if (llStep >= LL_QUIZ.length) { submitLLResults(); return; }
  const q = LL_QUIZ[llStep];
  document.getElementById('ll-progress').textContent = `Question ${llStep+1} of ${LL_QUIZ.length}`;
  document.getElementById('ll-q-text').textContent = q.q;
  document.getElementById('ll-options').innerHTML = q.a.map((a,i) =>
    `<button class="ll-option" onclick="pickLL(${i})">${a}</button>`
  ).join('');
}

function pickLL(choice) {
  const q = LL_QUIZ[llStep];
  llScores[q.l[choice]] += 2;
  // Give 1 point to the other option too (secondary)
  llScores[q.l[1-choice]] += 1;
  llStep++;
  renderLLQuestion();
}

async function submitLLResults() {
  if (!db || !user) return;
  await db.ref('loveLang/' + user).set({ scores: llScores, timestamp: Date.now() });
  showLLResults();
}

function showLLResults() {
  document.getElementById('ll-quiz').style.display = 'none';
  document.getElementById('ll-results').style.display = 'block';
  db.ref('loveLang').on('value', snap => {
    const data = snap.val() || {};
    renderLLProfile('ll-my-primary', 'll-my-bars', data[user]);
    renderLLProfile('ll-partner-primary', 'll-partner-bars', data[partner]);
    renderLLTips(data[user], data[partner]);
    document.querySelectorAll('.uname').forEach(e => e.textContent = NAMES[user]);
    document.querySelectorAll('.pname').forEach(e => e.textContent = NAMES[partner]);
  });
}

function renderLLProfile(primaryId, barsId, data) {
  const pEl = document.getElementById(primaryId);
  const bEl = document.getElementById(barsId);
  if (!pEl || !bEl) return;
  if (!data || !data.scores) { pEl.textContent = 'Not taken yet'; bEl.innerHTML = ''; return; }
  const scores = data.scores;
  const max = Math.max(...scores);
  const primary = scores.indexOf(max);
  pEl.textContent = LL_NAMES[primary];
  bEl.innerHTML = scores.map((s,i) => {
    const pct = max > 0 ? Math.round(s/max*100) : 0;
    return `<div class="ll-bar"><span style="min-width:60px;font-size:9px">${LL_NAMES[i].split(' ')[0]}</span><div class="ll-bar-track"><div class="ll-bar-fill" style="width:${pct}%"></div></div></div>`;
  }).join('');
}

function renderLLTips(myData, theirData) {
  const el = document.getElementById('ll-tips');
  if (!el || !myData?.scores || !theirData?.scores) {
    if (el) el.innerHTML = '<div class="ll-tips-title">Tips</div><div class="ll-tip">Both partners need to complete the quiz to see personalized tips.</div>';
    return;
  }
  const myPrimary = LL_NAMES[myData.scores.indexOf(Math.max(...myData.scores))];
  const theirPrimary = LL_NAMES[theirData.scores.indexOf(Math.max(...theirData.scores))];
  const tips = {
    'Words of Affirmation': 'Leave notes, send texts saying what you appreciate. Be specific: "I loved how you handled that" means more than "you\'re great."',
    'Quality Time': 'Put the phone away. Plan intentional time. It\'s not about quantity — it\'s about being fully present.',
    'Receiving Gifts': 'It\'s not about price. It\'s about "I saw this and thought of you." Small, thoughtful tokens matter most.',
    'Acts of Service': 'Do something they usually do themselves. Take a task off their plate. Actions speak louder than words.',
    'Physical Touch': 'Hold hands walking. Touch their back passing by. A long hug when they get home. Proximity matters.'
  };
  el.innerHTML = `<div class="ll-tips-title">How to Love Each Other Better</div>
    <div class="ll-tip">For <strong>${NAMES[partner]}</strong> (${theirPrimary}): ${tips[theirPrimary]}</div>
    <div class="ll-tip">For <strong>${NAMES[user]}</strong> (${myPrimary}): ${tips[myPrimary]}</div>`;
}

function retakeLLQuiz() {
  llStep = 0; llScores = [0,0,0,0,0];
  document.getElementById('ll-quiz').style.display = 'block';
  document.getElementById('ll-results').style.display = 'none';
  renderLLQuestion();
}

// ===== WEEKLY CHECK-IN =====
function getWeekId() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(),0,1);
  const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + String(weekNum).padStart(2,'0');
}

function updCIEnergy() {
  const v = document.getElementById('ci-energy').value;
  const labels = ['','Distant','Low','Steady','Strong','Thriving'];
  document.getElementById('ci-energy-val').textContent = labels[v];
}

async function submitCheckin() {
  if (!db || !user) return;
  const well = document.getElementById('ci-well').value.trim();
  const better = document.getElementById('ci-better').value.trim();
  const need = document.getElementById('ci-need').value.trim();
  const energy = parseInt(document.getElementById('ci-energy').value);
  if (!well && !better && !need) { toast('Share at least one thought'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  const week = getWeekId();
  await db.ref('checkins/' + week + '/' + user).set({
    well, better, need, energy,
    userName: NAMES[user], timestamp: Date.now()
  });
  document.getElementById('ci-well').value = '';
  document.getElementById('ci-better').value = '';
  document.getElementById('ci-need').value = '';
  if (typeof logActivity === 'function') logActivity('checkin', 'completed weekly check-in');
  if (typeof renderSmartNudges === 'function') renderSmartNudges();
  if (btn) { btn.textContent = 'Saved'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Submit'; }, 1500); }
  toast('Check-in saved');
}

function listenCheckins() {
  db.ref('checkins').orderByKey().limitToLast(8).on('value', snap => {
    const weeks = [];
    snap.forEach(c => weeks.push({ week: c.key, data: c.val() }));
    weeks.reverse();
    renderCheckinStatus(weeks);
    renderCheckinFeed(weeks);
  });
}

function renderCheckinStatus(weeks) {
  const el = document.getElementById('ci-status');
  if (!el) return;
  const currentWeek = getWeekId();
  const thisWeek = weeks.find(w => w.week === currentWeek);
  const myDone = thisWeek?.data?.[user];
  const theirDone = thisWeek?.data?.[partner];
  if (myDone && theirDone) {
    el.innerHTML = '<div class="ci-status-label">This Week</div><div class="ci-status-text">Both checked in! Read each other\'s thoughts below.</div>';
  } else if (myDone) {
    el.innerHTML = `<div class="ci-status-label">This Week</div><div class="ci-status-text">You've checked in. Waiting for ${NAMES[partner]}...</div>`;
  } else {
    el.innerHTML = '<div class="ci-status-label">This Week</div><div class="ci-status-text">Time for your weekly relationship check-in.</div>';
  }
}

function renderCheckinFeed(weeks) {
  const el = document.getElementById('ci-feed');
  if (!el) return;
  const completed = weeks.filter(w => w.data[user] || w.data[partner]);
  if (!completed.length) { el.innerHTML = '<div class="empty">No check-ins yet.</div>'; return; }
  el.innerHTML = completed.map(w => {
    let html = `<div class="ci-card"><div class="ci-card-week">${w.week}</div>`;
    [user, partner].forEach(u => {
      const d = w.data[u];
      if (!d) return;
      const name = u === user ? 'You' : NAMES[partner];
      html += `<div class="ci-card-name">${name}</div>`;
      if (d.well) html += `<div class="ci-card-q">What went well:</div><div class="ci-card-a">${d.well.replace(/</g,'&lt;')}</div>`;
      if (d.better) html += `<div class="ci-card-q">Could be better:</div><div class="ci-card-a">${d.better.replace(/</g,'&lt;')}</div>`;
      if (d.need) html += `<div class="ci-card-q">What I need:</div><div class="ci-card-a">${d.need.replace(/</g,'&lt;')}</div>`;
    });
    return html + '</div>';
  }).join('');
}

// ===== DREAM BOARD =====
let dreamFilter = 'all';

async function addDream() {
  if (!db || !user) return;
  const title = document.getElementById('dr-title').value.trim();
  const emoji = document.getElementById('dr-emoji').value.trim() || '✧';
  const cat = document.getElementById('dr-cat').value;
  const desc = document.getElementById('dr-desc').value.trim();
  if (!title) { toast('Describe your dream'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('dreams').push({
    title, emoji, category: cat, description: desc,
    addedBy: user, addedByName: NAMES[user],
    achieved: false, timestamp: Date.now()
  });
  document.getElementById('dr-title').value = '';
  document.getElementById('dr-emoji').value = '';
  document.getElementById('dr-desc').value = '';
  if (btn) { btn.textContent = 'Saved'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add dream'; }, 1500); }
  toast('Dream added');
}

function filterDreams(cat, el) {
  dreamFilter = cat;
  document.querySelectorAll('#dr-cats .bl-cat').forEach(e => e.classList.remove('on'));
  if (el) el.classList.add('on');
  listenDreams();
}

function listenDreams() {
  db.ref('dreams').orderByChild('timestamp').on('value', snap => {
    const items = [];
    snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); });
    items.reverse();
    renderDreams(items);
  });
}

function renderDreams(items) {
  const el = document.getElementById('dr-list');
  if (!el) return;
  const filtered = dreamFilter === 'all' ? items : items.filter(i => i.category === dreamFilter);
  if (!filtered.length) { el.innerHTML = '<div class="empty">No dreams in this category yet.</div>'; return; }
  el.innerHTML = filtered.map(i => {
    const ts = timeAgo(new Date(i.timestamp));
    const who = i.addedBy === user ? 'You' : (i.addedByName||'?');
    return `<div class="dr-card ${i.achieved?'achieved':''}">
      <div class="dr-check" onclick="toggleDream('${i._key}',${!i.achieved})">${i.achieved?'✓':''}</div>
      <div class="dr-emoji">${i.emoji}</div>
      <div class="dr-info">
        <div class="dr-title">${i.title}</div>
        <div class="dr-cat-tag">${i.category}</div>
        ${i.description ? `<div class="dr-desc">${i.description.replace(/</g,'&lt;')}</div>` : ''}
        <div class="dr-meta">${who} · ${ts}</div>
      </div>
      <button class="item-delete" onclick="event.stopPropagation();deleteDream('${i._key}')">×</button>
    </div>`;
  }).join('');
  updateDRStats();
}

async function toggleDream(key, achieved) {
  if (!db) return;
  await db.ref('dreams/' + key + '/achieved').set(achieved);
  if (achieved) { toast('Dream achieved'); showConfetti(); }
}

// ===== ATTACHMENT STYLE QUIZ =====
const AS_NAMES = ['Secure', 'Anxious', 'Avoidant', 'Fearful-Avoidant'];
const AS_COLORS = ['var(--emerald)', 'var(--rose)', 'var(--teal)', 'var(--amber)'];
const AS_ICONS = ['🛡️', '💗', '🏔️', '🌊'];
const AS_DESCRIPTIONS = {
  'Secure': 'You feel comfortable with closeness and independence. You trust your partner and communicate openly.',
  'Anxious': 'You crave closeness and can worry about your partner\'s feelings. You\'re deeply attuned to relationship cues.',
  'Avoidant': 'You value independence and may need more space. You\'re self-reliant and process emotions internally.',
  'Fearful-Avoidant': 'You desire closeness but sometimes pull back. You\'re learning to balance vulnerability and independence.'
};
const AS_QUIZ = [
  {q:'When my partner is away, I usually...', a:['Feel fine and trust them','Worry about what they\'re doing','Enjoy the alone time','Alternate between missing them and feeling relieved'], s:[0,1,2,3]},
  {q:'When we have a conflict, I tend to...', a:['Talk it through calmly','Need reassurance things are ok','Withdraw and process alone','Shut down or get overwhelmed'], s:[0,1,2,3]},
  {q:'How do you feel about sharing deep emotions?', a:['I\'m comfortable being vulnerable','I want to share everything, maybe too much','I prefer to keep things to myself','I want to but it feels risky'], s:[0,1,2,3]},
  {q:'When your partner needs space, you...', a:['Respect it without worrying','Feel anxious about why','Understand completely — I need it too','Feel confused — do they still care?'], s:[0,1,2,3]},
  {q:'How do you handle relationship uncertainty?', a:['Stay grounded and communicate','Seek constant reassurance','Act like it doesn\'t bother me','Swing between clinging and pulling away'], s:[0,1,2,3]},
  {q:'Your partner says "we need to talk." You feel...', a:['Curious and open','Immediately worried','Slightly annoyed','Panicked but try to hide it'], s:[0,1,2,3]},
  {q:'After a fight, you usually...', a:['Reach out to reconnect when ready','Apologize quickly, even if not my fault','Need time alone before talking','Want to reconnect but don\'t know how'], s:[0,1,2,3]},
  {q:'How comfortable are you depending on your partner?', a:['Very — we\'re a team','I lean on them a lot','I prefer self-reliance','I want to but it feels unsafe'], s:[0,1,2,3]},
  {q:'When things are going well in your relationship...', a:['I feel content and grateful','I worry it won\'t last','I start creating distance','I enjoy it but brace for the other shoe'], s:[0,1,2,3]},
  {q:'What best describes your relationship ideal?', a:['Close, balanced partnership','Deep emotional fusion','Respectful independence','Intimacy without losing myself'], s:[0,1,2,3]},
];
let asStep = 0;
let asScores = [0, 0, 0, 0];

function loadASQuiz() {
  if (!db || !user) return;
  db.ref('attachmentStyle/' + user).once('value', snap => {
    const data = snap.val();
    if (data && data.scores) {
      showASResults();
    } else {
      asStep = 0; asScores = [0, 0, 0, 0];
      renderASQuestion();
      document.getElementById('as-quiz').style.display = 'block';
      document.getElementById('as-results').style.display = 'none';
    }
  });
}

function renderASQuestion() {
  if (asStep >= AS_QUIZ.length) { submitASResults(); return; }
  const q = AS_QUIZ[asStep];
  document.getElementById('as-progress').textContent = `Question ${asStep + 1} of ${AS_QUIZ.length}`;
  document.getElementById('as-q-text').textContent = q.q;
  document.getElementById('as-options').innerHTML = q.a.map((a, i) =>
    `<button class="ll-option" onclick="pickAS(${i})">${a}</button>`
  ).join('');
}

function pickAS(choice) {
  const q = AS_QUIZ[asStep];
  asScores[q.s[choice]] += 3;
  // Give secondary points to adjacent styles
  q.s.forEach((s, i) => { if (i !== choice) asScores[s] += 1; });
  asStep++;
  renderASQuestion();
}

async function submitASResults() {
  if (!db || !user) return;
  await db.ref('attachmentStyle/' + user).set({ scores: asScores, timestamp: Date.now() });
  showASResults();
  // Recalculate enhanced compatibility
  updateEnhancedCompat();
}

function showASResults() {
  document.getElementById('as-quiz').style.display = 'none';
  document.getElementById('as-results').style.display = 'block';
  db.ref('attachmentStyle').on('value', snap => {
    const data = snap.val() || {};
    renderASProfile('as-my-result', data[user]);
    renderASProfile('as-partner-result', data[partner]);
    renderASCombo(data[user], data[partner]);
    renderASRadar(data[user], data[partner]);
    document.querySelectorAll('.uname').forEach(e => e.textContent = NAMES[user]);
    document.querySelectorAll('.pname').forEach(e => e.textContent = NAMES[partner]);
  });
}

function renderASProfile(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!data || !data.scores) { el.innerHTML = '<div style="font-size:12px;color:var(--t3)">Not taken yet</div>'; return; }
  const scores = data.scores;
  const max = Math.max(...scores);
  const primary = scores.indexOf(max);
  const total = scores.reduce((s, v) => s + v, 0);
  el.innerHTML = `<div style="font-size:24px;margin-bottom:4px">${AS_ICONS[primary]}</div>
    <div style="font-size:14px;color:var(--cream);font-weight:600;margin-bottom:4px">${AS_NAMES[primary]}</div>
    <div style="font-size:10px;color:var(--t3);margin-bottom:8px;line-height:1.4">${AS_DESCRIPTIONS[AS_NAMES[primary]]}</div>
    ${scores.map((s, i) => {
      const pct = total ? Math.round(s / total * 100) : 0;
      return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <span style="font-size:9px;min-width:55px;color:var(--t3)">${AS_NAMES[i]}</span>
        <div style="flex:1;height:4px;background:var(--bg3);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${AS_COLORS[i]};border-radius:2px;transition:width .6s ease"></div>
        </div>
        <span style="font-size:9px;color:var(--t3);min-width:25px;text-align:right">${pct}%</span>
      </div>`;
    }).join('')}`;
}

function renderASCombo(myData, theirData) {
  const el = document.getElementById('as-combo-tips');
  if (!el) return;
  if (!myData?.scores || !theirData?.scores) {
    el.innerHTML = '<div style="font-size:11px;color:var(--t3)">Both partners need to complete the quiz for combo insights.</div>';
    return;
  }
  const myPrimary = AS_NAMES[myData.scores.indexOf(Math.max(...myData.scores))];
  const theirPrimary = AS_NAMES[theirData.scores.indexOf(Math.max(...theirData.scores))];

  const comboTips = getComboTips(myPrimary, theirPrimary);
  el.innerHTML = `<div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:600;margin-bottom:6px">Your Dynamic</div>
    <div style="font-size:13px;color:var(--cream);margin-bottom:8px;font-weight:500">${myPrimary} + ${theirPrimary}</div>
    <div style="font-size:11px;color:var(--t3);line-height:1.5">${comboTips.summary}</div>
    <div style="margin-top:10px">
      ${comboTips.tips.map(t => `<div style="font-size:11px;color:var(--cream);padding:6px 0;border-top:1px solid var(--bdr-s)">• ${t}</div>`).join('')}
    </div>`;
}

function getComboTips(a, b) {
  // Normalize order for symmetric lookup
  const key = [a, b].sort().join('+');
  const combos = {
    'Secure+Secure': { summary: 'The golden pair. You both bring stability, trust, and open communication.', tips: ['Keep nurturing what you have — don\'t take it for granted', 'Push each other to grow even when comfortable', 'Model healthy conflict resolution together'] },
    'Anxious+Secure': { summary: 'The secure partner anchors the relationship. With patience, the anxious partner feels safe to relax.', tips: ['Secure: offer reassurance proactively, not just when asked', 'Anxious: trust actions over your worries', 'Set check-in rituals to build predictable closeness'] },
    'Avoidant+Secure': { summary: 'The secure partner creates space for connection without pressure. The avoidant partner can slowly open up.', tips: ['Secure: respect their need for space without taking it personally', 'Avoidant: practice sharing one vulnerable thing per week', 'Find activities you both enjoy doing together in parallel'] },
    'Fearful-Avoidant+Secure': { summary: 'The secure partner provides a stable base. The FA partner is learning that closeness is safe.', tips: ['Secure: be consistent — your predictability is their medicine', 'FA: notice when you push-pull and name it', 'Build trust through small, repeated positive experiences'] },
    'Anxious+Anxious': { summary: 'Deep emotional connection but can spiral into mutual worry. You understand each other\'s needs deeply.', tips: ['Create rituals of reassurance for both of you', 'When both anxious, take a breath before reacting', 'Build individual hobbies to avoid codependency'] },
    'Anxious+Avoidant': { summary: 'The classic push-pull dynamic. Different needs, but understanding the pattern is the first step.', tips: ['Anxious: give space without interpreting it as rejection', 'Avoidant: small gestures of connection go a huge distance', 'Agree on a signal for "I need space" vs "I need closeness"'] },
    'Anxious+Fearful-Avoidant': { summary: 'Both crave connection but express it differently. Communication is key.', tips: ['Be explicit about needs — don\'t assume the other knows', 'When triggered, say "I need a moment" instead of reacting', 'Celebrate the small moments of vulnerability together'] },
    'Avoidant+Avoidant': { summary: 'You respect each other\'s independence. The challenge is building deeper emotional intimacy.', tips: ['Schedule intentional connection time — it won\'t happen organically', 'Practice sharing one feeling per day, even small ones', 'Physical proximity (cooking together, walks) builds closeness without pressure'] },
    'Avoidant+Fearful-Avoidant': { summary: 'Both tend to withdraw but for different reasons. Building trust happens through small consistent gestures.', tips: ['Create low-pressure ways to be close (side-by-side activities)', 'FA: your need for closeness is valid — voice it', 'Avoidant: lean into connection when it feels uncomfortable'] },
    'Fearful-Avoidant+Fearful-Avoidant': { summary: 'You deeply understand each other\'s push-pull. Together, you can build the safety you both need.', tips: ['Name the pattern when you see it: "I\'m pulling away because I\'m scared"', 'Create a safe word for when either feels overwhelmed', 'Celebrate every moment of vulnerability — it\'s brave'] },
  };
  return combos[key] || { summary: 'Your unique combination brings growth opportunities.', tips: ['Practice open communication daily', 'Be patient with different emotional speeds', 'Remember you\'re on the same team'] };
}

function renderASRadar(myData, theirData) {
  if (!myData?.scores || !theirData?.scores) return;
  const total1 = myData.scores.reduce((s, v) => s + v, 0) || 1;
  const total2 = theirData.scores.reduce((s, v) => s + v, 0) || 1;
  const dimensions = AS_NAMES.map((name, i) => ({
    label: name.substring(0, 7),
    her: user === 'her' ? (myData.scores[i] / total1 * 5) : (theirData.scores[i] / total2 * 5),
    him: user === 'him' ? (myData.scores[i] / total1 * 5) : (theirData.scores[i] / total2 * 5),
  }));
  if (typeof renderRadarChart === 'function') renderRadarChart('as-radar', dimensions);
}

function retakeASQuiz() {
  asStep = 0; asScores = [0, 0, 0, 0];
  document.getElementById('as-quiz').style.display = 'block';
  document.getElementById('as-results').style.display = 'none';
  renderASQuestion();
}

// ===== ENHANCED COMPATIBILITY SCORE =====
// Incorporates: WYR/TOT matches (40%), Love Languages alignment (30%), Attachment compatibility (30%)
function updateEnhancedCompat() {
  if (!db) return;
  Promise.all([
    db.ref('games/wyr').once('value'),
    db.ref('games/tot').once('value'),
    db.ref('loveLang').once('value'),
    db.ref('attachmentStyle').once('value'),
  ]).then(([wyrSnap, totSnap, llSnap, asSnap]) => {
    let gameMatches = 0, gameTotal = 0;

    // WYR matches
    if (wyrSnap.exists()) wyrSnap.forEach(c => {
      const d = c.val();
      if (d && d.her && d.him) { gameTotal++; if (d.her === d.him) gameMatches++; }
    });
    // TOT matches
    if (totSnap.exists()) totSnap.forEach(c => {
      const d = c.val();
      if (d && d.her && d.him) { gameTotal++; if (d.her === d.him) gameMatches++; }
    });
    const gamePct = gameTotal ? gameMatches / gameTotal : 0;

    // Love Language alignment (cosine similarity)
    let llPct = 0;
    const llData = llSnap.val() || {};
    if (llData.her?.scores && llData.him?.scores) {
      const a = llData.her.scores, b = llData.him.scores;
      let dot = 0, magA = 0, magB = 0;
      for (let i = 0; i < 5; i++) { dot += a[i] * b[i]; magA += a[i] * a[i]; magB += b[i] * b[i]; }
      llPct = (magA && magB) ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
    }

    // Attachment compatibility score
    let asPct = 0;
    const asData = asSnap.val() || {};
    if (asData.her?.scores && asData.him?.scores) {
      const herPrimary = asData.her.scores.indexOf(Math.max(...asData.her.scores));
      const himPrimary = asData.him.scores.indexOf(Math.max(...asData.him.scores));
      // Secure-Secure = best, Anxious-Avoidant = challenging, etc.
      const compatMatrix = [
        [1.0, 0.8, 0.7, 0.65],  // Secure with...
        [0.8, 0.6, 0.45, 0.5],  // Anxious with...
        [0.7, 0.45, 0.55, 0.5], // Avoidant with...
        [0.65, 0.5, 0.5, 0.45], // Fearful-Avoidant with...
      ];
      asPct = compatMatrix[herPrimary][himPrimary];
    }

    // Weighted composite
    const weights = { game: 0.4, ll: 0.3, as: 0.3 };
    let totalW = 0, totalS = 0;
    if (gameTotal > 0) { totalW += weights.game; totalS += gamePct * weights.game; }
    if (llData.her?.scores && llData.him?.scores) { totalW += weights.ll; totalS += llPct * weights.ll; }
    if (asData.her?.scores && asData.him?.scores) { totalW += weights.as; totalS += asPct * weights.as; }

    const pct = totalW ? Math.round((totalS / totalW) * 100) : 0;

    // Update UI
    const ring = document.getElementById('compat-ring');
    const score = document.getElementById('compat-score');
    if (ring) ring.setAttribute('stroke-dashoffset', String(327 - (pct / 100) * 327));
    if (score) score.textContent = pct + '%';

    // Update subtitle
    const sub = document.querySelector('#compat-ring + text + text') ||
      document.querySelector('.donut-sub');

    // Show breakdown if element exists
    const bd = document.getElementById('compat-breakdown');
    if (bd) {
      const items = [];
      if (gameTotal > 0) items.push(`Games: ${Math.round(gamePct * 100)}%`);
      if (llData.her?.scores && llData.him?.scores) items.push(`Love Lang: ${Math.round(llPct * 100)}%`);
      if (asData.her?.scores && asData.him?.scores) items.push(`Attachment: ${Math.round(asPct * 100)}%`);
      bd.innerHTML = items.map(t => `<span style="font-size:9px;padding:2px 8px;background:var(--bg3);border-radius:8px;color:var(--t3)">${t}</span>`).join('');
    }

    // Dashboard quick note
    const dashQn = document.getElementById('dash-qn-compat');
    if (dashQn) dashQn.textContent = pct ? pct + '% compatible' : '';
  });
}



// ===== HER SPACE =====
const AFFIRMATIONS = [
  "You are becoming the woman you've always wanted to be.",
  "Your softness is not weakness. It is your superpower.",
  "You don't have to earn rest. You deserve it now.",
  "Your body is doing incredible things. Trust her.",
  "You are allowed to take up space unapologetically.",
  "The right things will find you when you stop chasing them.",
  "Your intuition has never been wrong. Listen closer.",
  "You are not behind. You are exactly where you need to be.",
  "Every version of you has been necessary for who you're becoming.",
  "You don't need to be fixed. You need to be understood.",
  "Your feelings are valid, even when they're inconvenient.",
  "You are someone's answered prayer.",
  "The love you give the world starts with the love you give yourself.",
  "You are allowed to outgrow people, places, and versions of yourself.",
  "Your presence is a gift. Never let anyone make you feel otherwise.",
  "She believed she could, so she did.",
  "You are both the storm and the calm after it.",
  "Your worth is not measured by your productivity.",
  "Healing is not linear, but you are still moving forward.",
  "The woman you are becoming will cost you relationships, spaces, and material things. Choose her over everything."
];

let affirmIdx = Math.floor(Math.random() * AFFIRMATIONS.length);

function loadAffirmation() {
  const el = document.getElementById('hs-affirm-text');
  if (el) el.textContent = AFFIRMATIONS[affirmIdx % AFFIRMATIONS.length];
}

function nextAffirmation() {
  affirmIdx++;
  loadAffirmation();
}

function logPeriodStart() {
  if (!db || !user) return;
  const today = localDate();
  db.ref('herWellness/cycle').push({ type: 'start', date: today, timestamp: Date.now() });
  toast('Period start logged');
  loadCycleData();
}

function logPeriodEnd() {
  if (!db || !user) return;
  const today = localDate();
  db.ref('herWellness/cycle').push({ type: 'end', date: today, timestamp: Date.now() });
  toast('Period end logged');
  loadCycleData();
}

function loadCycleData() {
  if (!db) return;
  db.ref('herWellness/cycle').orderByChild('timestamp').limitToLast(10).once('value', snap => {
    const entries = [];
    snap.forEach(c => entries.push(c.val()));
    entries.sort((a,b) => b.timestamp - a.timestamp);
    const lastStart = entries.find(e => e.type === 'start');
    const phaseEl = document.getElementById('hs-cycle-phase');
    const dayEl = document.getElementById('hs-cycle-day');
    const arcEl = document.getElementById('hs-cycle-arc');
    const infoEl = document.getElementById('hs-cycle-info');
    if (!lastStart) {
      if (phaseEl) phaseEl.textContent = 'Not tracked yet';
      return;
    }
    const start = new Date(lastStart.date + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const dayOfCycle = Math.floor((today - start) / 86400000) + 1;
    const cycleLength = 28;
    if (dayEl) dayEl.textContent = dayOfCycle > cycleLength ? '--' : dayOfCycle;
    if (arcEl) {
      const pct = Math.min(dayOfCycle / cycleLength, 1);
      arcEl.setAttribute('stroke-dashoffset', String(314 - pct * 314));
    }
    let phase = '', info = '';
    if (dayOfCycle <= 5) { phase = 'Menstrual'; info = 'Rest is productive right now. Honor your body\'s need to slow down. Iron-rich foods help.'; }
    else if (dayOfCycle <= 13) { phase = 'Follicular'; info = 'Energy is rising. Great time for new projects, socializing, and trying new things.'; }
    else if (dayOfCycle <= 16) { phase = 'Ovulatory'; info = 'Peak energy and confidence. Communication skills are sharpest now.'; }
    else if (dayOfCycle <= 28) { phase = 'Luteal'; info = 'Winding down. Focus on completion, not starting new things. Self-care is essential.'; }
    else { phase = 'Cycle day ' + dayOfCycle; info = 'If your cycle is longer than 28 days, that\'s normal. Everyone\'s different.'; }
    if (phaseEl) phaseEl.textContent = phase;
    if (infoEl) infoEl.textContent = info;
  });
}

function toggleCare(el, type) {
  if (!db || !user) return;
  el.classList.toggle('done');
  const today = localDate();
  const done = el.classList.contains('done');
  db.ref('herWellness/selfcare/' + today + '/' + type).set(done ? true : null);
}

function loadSelfCare() {
  if (!db) return;
  const today = localDate();
  db.ref('herWellness/selfcare/' + today).once('value', snap => {
    const data = snap.val() || {};
    document.querySelectorAll('#hs-care-grid .hs-care-item').forEach(el => {
      const type = el.onclick.toString().match(/'(\w+)'/)?.[1];
      if (type && data[type]) el.classList.add('done');
    });
  });
}

// ===== HIS SPACE =====
const MOTIVATIONS = [
  "Discipline is choosing between what you want now and what you want most.",
  "The man you want to be is built by the things you do when no one is watching.",
  "Strength isn't just physical. It's showing up emotionally when it's hard.",
  "You don't rise to the level of your goals. You fall to the level of your systems.",
  "Protect your energy. Not everything deserves a reaction.",
  "The obstacle is the way. What's hard is what makes you grow.",
  "A calm man in a chaotic world is the most powerful thing there is.",
  "Your word is your bond. Say less, mean more, follow through always.",
  "The best investment you'll ever make is in yourself.",
  "Comfort is the enemy of growth. Get uncomfortable on purpose.",
  "Real confidence is quiet. Insecurity is loud.",
  "Build in silence. Let results make the noise.",
  "You are not your mistakes. You are what you do after them.",
  "Control what you can. Release what you can't. Know the difference.",
  "The man who masters himself is greater than the one who conquers cities.",
  "Your energy introduces you before you speak. Make it count.",
  "Stop waiting for motivation. Discipline will carry you further.",
  "Be the man she doesn't have to question.",
  "Growth requires sacrifice. What are you willing to give up?",
  "Legacy is not what you leave for people. It's what you leave in them."
];

let motivIdx = Math.floor(Math.random() * MOTIVATIONS.length);

function loadMotivation() {
  const el = document.getElementById('him-affirm-text');
  if (el) el.textContent = MOTIVATIONS[motivIdx % MOTIVATIONS.length];
}

function nextMotivation() {
  motivIdx++;
  loadMotivation();
}

async function logPR() {
  if (!db || !user) return;
  const exercise = document.getElementById('him-pr-exercise').value.trim();
  const weight = document.getElementById('him-pr-weight').value.trim();
  const reps = document.getElementById('him-pr-reps').value.trim();
  if (!exercise) { toast('Enter an exercise'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('hisWellness/prs').push({
    exercise, weight: weight || '--', reps: reps || '--',
    timestamp: Date.now(), date: localDate()
  });
  document.getElementById('him-pr-exercise').value = '';
  document.getElementById('him-pr-weight').value = '';
  document.getElementById('him-pr-reps').value = '';
  if (btn) { btn.textContent = 'Logged'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Log PR'; }, 1500); }
  toast('PR logged');
}

function listenPRs() {
  db.ref('hisWellness/prs').orderByChild('timestamp').limitToLast(20).on('value', snap => {
    const items = [];
    snap.forEach(c => items.push(c.val()));
    items.reverse();
    const el = document.getElementById('him-pr-list');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Log your first PR</div>'; return; }
    el.innerHTML = items.map(i => {
      const ts = timeAgo(new Date(i.timestamp));
      return `<div class="him-pr-card"><div class="him-pr-name">${i.exercise}</div><div class="him-pr-val">${i.weight}${i.weight!=='--'?' lbs':''} × ${i.reps}</div><div class="him-pr-date">${ts}</div></div>`;
    }).join('');
  });
}

function toggleClarity(el, type) {
  if (!db || !user) return;
  el.classList.toggle('done');
  const today = localDate();
  const done = el.classList.contains('done');
  db.ref('hisWellness/clarity/' + today + '/' + type).set(done ? true : null);
}

function loadClarity() {
  if (!db) return;
  const today = localDate();
  db.ref('hisWellness/clarity/' + today).once('value', snap => {
    const data = snap.val() || {};
    document.querySelectorAll('#him-clarity-grid .hs-care-item').forEach(el => {
      const type = el.onclick.toString().match(/'(\w+)'/)?.[1];
      if (type && data[type]) el.classList.add('done');
    });
  });
}

// ===== PERSONAL GOALS (shared between her/him spaces) =====
async function addPersonalGoal(who) {
  if (!db || !user) return;
  const inputId = who === 'her' ? 'hs-goal-input' : 'him-goal-input';
  const title = document.getElementById(inputId).value.trim();
  if (!title) { toast('Enter a goal'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('personalGoals/' + who).push({
    title, done: false, timestamp: Date.now()
  });
  document.getElementById(inputId).value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add goal'; }, 1500); }
  toast('Goal added');
}

function listenPersonalGoals(who) {
  const listId = who === 'her' ? 'hs-goals' : 'him-goals';
  db.ref('personalGoals/' + who).orderByChild('timestamp').on('value', snap => {
    const items = [];
    snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); });
    items.reverse();
    const el = document.getElementById(listId);
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">What are you working towards?</div>'; return; }
    el.innerHTML = items.map(i => {
      const ts = timeAgo(new Date(i.timestamp));
      return `<div class="pg-goal ${i.done?'done':''}">
        <div class="pg-goal-check" onclick="toggleGoal('${who}','${i._key}',${!i.done})">${i.done?'✓':''}</div>
        <div class="pg-goal-text">${i.title}</div>
        <div class="pg-goal-date">${ts}</div>
        <button class="item-delete" onclick="event.stopPropagation();deletePersonalGoal('${who}','${i._key}')">×</button>
      </div>`;
    }).join('');
  });
}

async function toggleGoal(who, key, done) {
  if (!db) return;
  await db.ref('personalGoals/' + who + '/' + key + '/done').set(done);
  if (done) toast('Goal completed');
}

// ===== CULTURE EXCHANGE =====
async function addPhrase() {
  if (!db || !user) return;
  const word = document.getElementById('cx-word').value.trim();
  const meaning = document.getElementById('cx-meaning').value.trim();
  const lang = document.getElementById('cx-lang').value;
  if (!word || !meaning) { toast('Word and meaning required'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('culture/phrases').push({
    word, meaning, lang, addedBy: user, addedByName: NAMES[user], timestamp: Date.now()
  });
  document.getElementById('cx-word').value = '';
  document.getElementById('cx-meaning').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add phrase'; }, 1500); }
  toast('Phrase added');
}

function listenPhrases() {
  db.ref('culture/phrases').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => items.push(c.val())); items.reverse();
    const el = document.getElementById('cx-phrases');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Teach each other your languages</div>'; return; }
    const langLabels = {ewe:'Ewe',french:'French',mina:'Mina',english:'English',slang:'Texas Slang'};
    el.innerHTML = items.map(i => {
      const who = i.addedBy === user ? 'You' : (i.addedByName||'?');
      return `<div class="cx-phrase">
      <div style="flex:1"><div class="cx-phrase-word">${i.word}</div><div class="cx-phrase-meaning">${i.meaning}</div></div>
      <div style="text-align:right"><div class="cx-phrase-lang">${langLabels[i.lang]||i.lang}</div><div class="cx-phrase-by">${who}</div></div>
    </div>`;
    }).join('');
  });
}

async function addTradition() {
  if (!db || !user) return;
  const title = document.getElementById('cx-trad-title').value.trim();
  const emoji = document.getElementById('cx-trad-emoji').value.trim() || '🎉';
  const origin = document.getElementById('cx-trad-origin').value;
  const desc = document.getElementById('cx-trad-desc').value.trim();
  if (!title) { toast('Describe the tradition'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('culture/traditions').push({
    title, emoji, origin, description: desc,
    addedBy: user, addedByName: NAMES[user], timestamp: Date.now()
  });
  document.getElementById('cx-trad-title').value = '';
  document.getElementById('cx-trad-emoji').value = '';
  document.getElementById('cx-trad-desc').value = '';
  if (btn) { btn.textContent = 'Saved'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add tradition'; }, 1500); }
  toast('Tradition saved');
}

function listenTraditions() {
  db.ref('culture/traditions').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => items.push(c.val())); items.reverse();
    const el = document.getElementById('cx-traditions');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Share your cultural traditions</div>'; return; }
    const originLabels = {togo:'From Togo',texas:'From Texas',ours:'Our Tradition'};
    el.innerHTML = items.map(i => {
      const ts = timeAgo(new Date(i.timestamp));
      const who = i.addedBy === user ? 'You' : (i.addedByName||'?');
      return `<div class="cx-trad-card">
        <div class="cx-trad-origin ${i.origin}">${originLabels[i.origin]||i.origin}</div>
        <div class="cx-trad-title">${i.emoji} ${i.title}</div>
        ${i.description ? `<div class="cx-trad-desc">${i.description.replace(/</g,'&lt;')}</div>` : ''}
        <div class="cx-trad-meta">${who} · ${ts}</div>
      </div>`;
    }).join('');
  });
}

async function addRecipe() {
  if (!db || !user) return;
  const name = document.getElementById('cx-recipe-name').value.trim();
  const emoji = document.getElementById('cx-recipe-emoji').value.trim() || '🍲';
  const origin = document.getElementById('cx-recipe-origin').value;
  const how = document.getElementById('cx-recipe-how').value.trim();
  if (!name) { toast('Name the dish'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('culture/recipes').push({
    name, emoji, origin, recipe: how,
    addedBy: user, addedByName: NAMES[user], timestamp: Date.now()
  });
  document.getElementById('cx-recipe-name').value = '';
  document.getElementById('cx-recipe-emoji').value = '';
  document.getElementById('cx-recipe-how').value = '';
  if (btn) { btn.textContent = 'Saved'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add recipe'; }, 1500); }
  toast('Recipe saved');
}

function listenRecipes() {
  db.ref('culture/recipes').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => items.push(c.val())); items.reverse();
    const el = document.getElementById('cx-recipes');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Share recipes from your cultures</div>'; return; }
    const originLabels = {togo:'Togolese',texas:'Texan',fusion:'Fusion'};
    el.innerHTML = items.map(i => {
      const who = i.addedBy === user ? 'You' : (i.addedByName||'?');
      return `<div class="cx-recipe-card">
        <div class="cx-trad-origin ${i.origin==='togo'?'togo':i.origin==='texas'?'texas':'ours'}">${originLabels[i.origin]||i.origin}</div>
        <div class="cx-trad-title">${i.emoji} ${i.name}</div>
        ${i.recipe ? `<div class="cx-trad-desc">${i.recipe.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>` : ''}
        <div class="cx-trad-meta">${who}</div>
      </div>`;
    }).join('');
  });
}

// ===== DEEP TALK =====
const DEEP_PROMPTS = {
  light: [
    "What's a small thing I do that always makes your day better?",
    "If we could have dinner with any couple in history, who would you pick?",
    "What's a hobby you'd love for us to try together?",
    "What's the funniest thing that's happened to us?",
    "If you could describe our relationship as a movie genre, what would it be?",
    "What's something you think we do better than most couples?",
    "What's a place you've never been but dream of going with me?",
    "What's the best meal we've ever shared?",
  ],
  medium: [
    "What's something you've been wanting to tell me but haven't found the right moment?",
    "How has our relationship changed who you are?",
    "What's a boundary you need me to respect better?",
    "What does feeling safe with me look like for you?",
    "When do you feel most loved by me? Most disconnected?",
    "What's a fear you carry that I might not know about?",
    "How do you want me to support you when you're stressed?",
    "What part of your childhood shaped how you love?",
  ],
  deep: [
    "What does unconditional love mean to you, and do you feel it from me?",
    "Is there a resentment you're holding that we need to address?",
    "What role does vulnerability play in how close you feel to me?",
    "How has your family of origin shaped your expectations of our relationship?",
    "What's the hardest thing about being with someone from a different culture?",
    "What do you need from me that you've been afraid to ask for?",
    "How do you define loyalty, and do you feel it's mutual between us?",
    "What's a pattern in our relationship you want to break?",
  ],
  soul: [
    "If I could see every version of you — past, present, future — what would you want me to understand?",
    "What does your soul need right now that nobody is giving it?",
    "What kind of old people do you want us to become together?",
    "What are you most afraid of losing in this life?",
    "If you wrote a letter to our future children about us, what would it say?",
    "What does God or the universe mean to you, and how does it shape how you love?",
    "What wound do you carry that you want me to help heal?",
    "What would you say to me if you had no fear at all?",
  ]
};

let dtLevel = 'light', dtIndex = 0;

function loadDeepTalk() {
  const prompts = DEEP_PROMPTS[dtLevel];
  const prompt = prompts[dtIndex % prompts.length];
  const depthLabels = {light:'Level 1 · Light',medium:'Level 2 · Medium',deep:'Level 3 · Deep',soul:'Level 4 · Soul'};
  document.getElementById('dt-depth').textContent = depthLabels[dtLevel];
  document.getElementById('dt-prompt').textContent = prompt;
}

function setDTLevel(level, el) {
  dtLevel = level; dtIndex = 0;
  document.querySelectorAll('#dt-levels .bl-cat').forEach(e => e.classList.remove('on'));
  if (el) el.classList.add('on');
  loadDeepTalk();
}

function nextDeepTalk() { dtIndex++; loadDeepTalk(); }
function prevDeepTalk() { dtIndex = Math.max(0, dtIndex - 1); loadDeepTalk(); }

async function saveConvoNote() {
  if (!db || !user) return;
  const text = document.getElementById('dt-journal').value.trim();
  if (!text) { toast('Write a reflection first'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('deepTalkJournal').push({
    text, user, userName: NAMES[user], timestamp: Date.now(),
    date: localDate()
  });
  document.getElementById('dt-journal').value = '';
  if (typeof logActivity === 'function') logActivity('deeptalk', 'saved a reflection');
  if (btn) { btn.textContent = 'Saved'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Save'; }, 1500); }
  toast('Reflection saved');
}

function listenConvoNotes() {
  db.ref('deepTalkJournal').orderByChild('timestamp').limitToLast(20).on('value', snap => {
    const items = []; snap.forEach(c => items.push(c.val())); items.reverse();
    const el = document.getElementById('dt-journal-feed');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">After a deep conversation, write what you learned.</div>'; return; }
    el.innerHTML = items.map(i => {
      const ts = timeAgo(new Date(i.timestamp));
      const who = i.user === user ? 'You' : (i.userName||'?');
      return `<div class="dt-note-card"><div class="dt-note-meta">${who} · ${ts}</div><div class="dt-note-text">${i.text.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div></div>`;
    }).join('');
  });
}

// ===== FAMILY PLANNING =====
const FAM_DISCUSSIONS = [
  {q:"How many children do you want, and why?",cat:"Children"},
  {q:"What parenting style resonates with you?",cat:"Parenting"},
  {q:"How do you feel about our different cultural approaches to raising children?",cat:"Culture"},
  {q:"What values are non-negotiable for you to pass on?",cat:"Values"},
  {q:"How will we handle discipline?",cat:"Parenting"},
  {q:"What role will religion play in our children's lives?",cat:"Faith"},
  {q:"How do we feel about our families' involvement?",cat:"Family"},
  {q:"What's our financial plan for starting a family?",cat:"Financial"},
  {q:"Where do we want to raise our family?",cat:"Home"},
  {q:"How will we balance career and family?",cat:"Lifestyle"},
  {q:"What names from your culture would you want to honor?",cat:"Culture"},
  {q:"How do we feel about adoption or fostering?",cat:"Family"},
  {q:"What traditions from Togo and Texas do we blend?",cat:"Culture"},
  {q:"How do we handle disagreements about parenting?",cat:"Communication"},
  {q:"What kind of home environment do you want for our kids?",cat:"Home"},
];

function renderFamDiscussions() {
  const el = document.getElementById('fam-discuss');
  if (!el || !db) return;
  db.ref('family/discussed').once('value', snap => {
    const discussed = snap.val() || {};
    el.innerHTML = FAM_DISCUSSIONS.map((d,i) =>
      `<div class="fam-discuss-item ${discussed[i]?'discussed':''}" onclick="toggleDiscussed(${i})">
        <div class="fam-discuss-q">${d.q}</div>
        <div class="fam-discuss-cat">${d.cat}${discussed[i]?' · ✓ Discussed':''}</div>
      </div>`
    ).join('');
  });
}

async function toggleDiscussed(idx) {
  if (!db) return;
  const snap = await db.ref('family/discussed/' + idx).once('value');
  await db.ref('family/discussed/' + idx).set(!snap.val());
  renderFamDiscussions();
  toast(snap.val() ? 'Unmarked' : 'Marked as discussed ✓');
}

async function addBabyName() {
  if (!db || !user) return;
  const name = document.getElementById('fam-name-input').value.trim();
  const gender = document.getElementById('fam-name-gender').value;
  if (!name) { toast('Enter a name'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('family/names').push({
    name, gender, addedBy: user, addedByName: NAMES[user],
    loved: {}, timestamp: Date.now()
  });
  document.getElementById('fam-name-input').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add name'; }, 1500); }
  toast('Name added');
}

function listenBabyNames() {
  db.ref('family/names').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); }); items.reverse();
    const el = document.getElementById('fam-names');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Save names you both love</div>'; return; }
    const genderEmoji = {girl:'♀',boy:'♂',neutral:'◎'};
    el.innerHTML = items.map(i => {
      const isLoved = i.loved && i.loved[user];
      return `<div class="fam-name-card">
        <div class="fam-name-text">${i.name}</div>
        <div class="fam-name-gender">${genderEmoji[i.gender]||''} ${i.gender}</div>
        <div class="fam-name-heart ${isLoved?'loved':''}" onclick="toggleNameLove('${i._key}')">${isLoved?'♥':'♡'}</div>
        <button class="item-delete" onclick="event.stopPropagation();deleteBabyName('${i._key}')">×</button>
      </div>`;
    }).join('');
  });
}

async function toggleNameLove(key) {
  if (!db || !user) return;
  const snap = await db.ref('family/names/' + key + '/loved/' + user).once('value');
  await db.ref('family/names/' + key + '/loved/' + user).set(!snap.val());
}

async function addFamilyGoal() {
  if (!db || !user) return;
  const title = document.getElementById('fam-goal-input').value.trim();
  if (!title) { toast('Enter a goal'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('family/goals').push({ title, done: false, addedBy: user, timestamp: Date.now() });
  document.getElementById('fam-goal-input').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add goal'; }, 1500); }
  toast('Goal added');
}

function listenFamilyGoals() {
  db.ref('family/goals').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); }); items.reverse();
    const el = document.getElementById('fam-goals');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Set goals for your future family</div>'; return; }
    el.innerHTML = items.map(i => `<div class="pg-goal ${i.done?'done':''}">
      <div class="pg-goal-check" onclick="toggleFamGoal('${i._key}',${!i.done})">${i.done?'✓':''}</div>
      <div class="pg-goal-text">${i.title}</div>
      <button class="item-delete" onclick="event.stopPropagation();deleteFamilyGoal('${i._key}')">×</button>
    </div>`).join('');
  });
}

async function toggleFamGoal(key, done) {
  if (!db) return;
  await db.ref('family/goals/' + key + '/done').set(done);
}

// ===== OUR FOUNDATION =====
async function addValue() {
  if (!db || !user) return;
  const title = document.getElementById('fdn-value-input').value.trim();
  if (!title) { toast('Enter a value'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('foundation/values').push({
    title, addedBy: user, addedByName: NAMES[user], timestamp: Date.now()
  });
  document.getElementById('fdn-value-input').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add value'; }, 1500); }
  toast('Value added');
}

function listenValues() {
  db.ref('foundation/values').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => items.push(c.val())); items.reverse();
    const el = document.getElementById('fdn-value-list');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">What do you both stand for?</div>'; return; }
    const icons = ['◆','✦','♡','⬡','◇','✧','●','○'];
    el.innerHTML = items.map((i,idx) => {
      const who = i.addedBy === user ? 'You' : (i.addedByName||'?');
      return `<div class="fdn-value-card">
      <div class="fdn-value-icon">${icons[idx%icons.length]}</div>
      <div class="fdn-value-text">${i.title}</div>
      <div class="fdn-value-by">${who}</div>
    </div>`;
    }).join('');
  });
}

function toggleAgreement(el, idx) {
  el.classList.toggle('agreed');
  if (db) db.ref('foundation/agreements/' + user + '/' + idx).set(el.classList.contains('agreed'));
}

function loadAgreements() {
  if (!db || !user) return;
  db.ref('foundation/agreements/' + user).once('value', snap => {
    const data = snap.val() || {};
    document.querySelectorAll('#fdn-agreements .fdn-agree-item').forEach((el, i) => {
      if (data[i]) el.classList.add('agreed');
    });
  });
}

async function addAgreement() {
  if (!db || !user) return;
  const text = document.getElementById('fdn-agree-input').value.trim();
  if (!text) return;
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('foundation/customAgreements').push({
    text, addedBy: user, addedByName: NAMES[user], timestamp: Date.now()
  });
  document.getElementById('fdn-agree-input').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add'; }, 1500); }
  toast('Agreement added');
}

function listenCustomAgreements() {
  db.ref('foundation/customAgreements').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => items.push(c.val())); items.reverse();
    const el = document.getElementById('fdn-custom-agrees');
    if (!el) return;
    el.innerHTML = items.map(i =>
      `<div class="fdn-agree-item agreed"><span class="fdn-check" style="border-color:var(--gold)">✓</span>${i.text}</div>`
    ).join('');
  });
}

// ===== SPIRITUAL SPACE =====
const DEVOTIONALS = [
  {verse:"Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",ref:"1 Corinthians 13:4"},
  {verse:"Above all, love each other deeply, because love covers over a multitude of sins.",ref:"1 Peter 4:8"},
  {verse:"Two are better than one, because they have a good return for their labor.",ref:"Ecclesiastes 4:9"},
  {verse:"Be completely humble and gentle; be patient, bearing with one another in love.",ref:"Ephesians 4:2"},
  {verse:"Let all that you do be done in love.",ref:"1 Corinthians 16:14"},
  {verse:"And now these three remain: faith, hope and love. But the greatest of these is love.",ref:"1 Corinthians 13:13"},
  {verse:"Trust in the Lord with all your heart and lean not on your own understanding.",ref:"Proverbs 3:5"},
  {verse:"For where two or three gather in my name, there am I with them.",ref:"Matthew 18:20"},
  {verse:"Be strong and courageous. Do not be afraid; do not be discouraged.",ref:"Joshua 1:9"},
  {verse:"He who finds a wife finds what is good and receives favor from the Lord.",ref:"Proverbs 18:22"},
  {verse:"Do not be anxious about anything, but in every situation, by prayer and petition, present your requests to God.",ref:"Philippians 4:6"},
  {verse:"The Lord bless you and keep you; the Lord make his face shine on you.",ref:"Numbers 6:24-25"},
  {verse:"Commit to the Lord whatever you do, and he will establish your plans.",ref:"Proverbs 16:3"},
  {verse:"I can do all things through Christ who strengthens me.",ref:"Philippians 4:13"},
  {verse:"For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you.",ref:"Jeremiah 29:11"},
];
let devIdx = Math.floor(Math.random() * DEVOTIONALS.length);

function loadDevotional() {
  const d = DEVOTIONALS[devIdx % DEVOTIONALS.length];
  const vEl = document.getElementById('sp-devo-verse');
  const rEl = document.getElementById('sp-devo-ref');
  if (vEl) vEl.textContent = d.verse;
  if (rEl) rEl.textContent = '— ' + d.ref;
}

function nextDevotional() { devIdx++; loadDevotional(); }

async function addPrayer() {
  if (!db || !user) return;
  const text = document.getElementById('sp-prayer-input').value.trim();
  if (!text) { toast('Share your prayer'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Sharing...'; }
  await db.ref('spiritual/prayers').push({
    text, user, userName: NAMES[user], timestamp: Date.now(), prayedFor: {}
  });
  document.getElementById('sp-prayer-input').value = '';
  if (btn) { btn.textContent = 'Shared'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Share'; }, 1500); }
  toast('Prayer shared');
}

function listenPrayers() {
  db.ref('spiritual/prayers').orderByChild('timestamp').limitToLast(20).on('value', snap => {
    const items = []; snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); }); items.reverse();
    const el = document.getElementById('sp-prayers');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Share what you need prayer for</div>'; return; }
    el.innerHTML = items.map(i => {
      const ts = timeAgo(new Date(i.timestamp));
      const who = i.user === user ? 'You' : (i.userName||'?');
      const prayed = i.prayedFor && i.prayedFor[user];
      return `<div class="sp-prayer-card">
        <div class="sp-prayer-from">${who} · ${ts}</div>
        <div class="sp-prayer-text">${i.text.replace(/</g,'&lt;')}</div>
        <div class="sp-prayer-pray" onclick="prayFor('${i._key}')">${prayed?'Prayed for':'Tap to pray for this'}</div>
      </div>`;
    }).join('');
  });
}

async function prayFor(key) {
  if (!db || !user) return;
  await db.ref('spiritual/prayers/' + key + '/prayedFor/' + user).set(true);
  toast('Noted');
}

async function addBlessing() {
  if (!db || !user) return;
  const text = document.getElementById('sp-bless-input').value.trim();
  if (!text) { toast('Share a blessing'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Sharing...'; }
  await db.ref('spiritual/blessings').push({
    text, user, userName: NAMES[user], timestamp: Date.now()
  });
  document.getElementById('sp-bless-input').value = '';
  if (btn) { btn.textContent = 'Shared'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Share'; }, 1500); }
  toast('Blessing shared');
}

function listenBlessings() {
  db.ref('spiritual/blessings').orderByChild('timestamp').limitToLast(20).on('value', snap => {
    const items = []; snap.forEach(c => items.push(c.val())); items.reverse();
    const el = document.getElementById('sp-blessings');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Count your blessings together</div>'; return; }
    el.innerHTML = items.map(i => {
      const ts = timeAgo(new Date(i.timestamp));
      const who = i.user === user ? 'You' : (i.userName||'?');
      return `<div class="sp-bless-card"><div class="sp-prayer-from">${who} · ${ts}</div><div class="sp-prayer-text">${i.text.replace(/</g,'&lt;')}</div></div>`;
    }).join('');
  });
}

async function addIntention() {
  if (!db || !user) return;
  const text = document.getElementById('sp-intent-input').value.trim();
  if (!text) return;
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('spiritual/intentions').push({
    text, addedBy: user, addedByName: NAMES[user], timestamp: Date.now()
  });
  document.getElementById('sp-intent-input').value = '';
  if (btn) { btn.textContent = 'Set'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add'; }, 1500); }
  toast('Intention set');
}

function listenIntentions() {
  db.ref('spiritual/intentions').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); }); items.reverse();
    const el = document.getElementById('sp-intentions');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Set spiritual intentions together</div>'; return; }
    el.innerHTML = items.map(i => {
      const who = i.addedBy === user ? 'You' : (i.addedByName||'?');
      return `<div class="sp-intent-card"><div class="sp-intent-text">${i.text}</div><div class="sp-intent-by">${who}</div><button class="item-delete" onclick="event.stopPropagation();deleteIntention('${i._key}')">×</button></div>`;
    }).join('');
  });
}

// ===== HOME BUILDING =====
// ===== EXPENSE TRACKING =====
let selectedFinCat = 'food';

function selectFinCat(el, cat) {
  selectedFinCat = cat;
  document.querySelectorAll('.fin-cat').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

async function addExpense() {
  if (!db || !user) return;
  const amount = parseFloat(document.getElementById('fin-amount').value);
  const note = document.getElementById('fin-note').value.trim();
  if (!amount || amount <= 0) { toast('Enter an amount'); return; }
  const today = new Date().toISOString().split('T')[0];
  const btn = event?.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('finances/expenses').push({
    amount, category: selectedFinCat, note,
    paidBy: user, date: today, timestamp: Date.now()
  });
  document.getElementById('fin-amount').value = '';
  document.getElementById('fin-note').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add'; }, 1500); }
  toast('$' + amount.toFixed(2) + ' logged');
}

function listenExpenses() {
  if (!db) return;
  db.ref('finances/expenses').orderByChild('timestamp').on('value', snap => {
    const all = [];
    snap.forEach(c => { const v = c.val(); v._key = c.key; all.push(v); });
    all.reverse();
    renderFinOverview(all);
    renderFinRecent(all);
    renderFinCatChart(all);
  });
}

function renderFinOverview(expenses) {
  const now = new Date();
  const month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const thisMonth = expenses.filter(e => e.date && e.date.startsWith(month));
  const total = thisMonth.reduce((s, e) => s + (e.amount || 0), 0);
  const myTotal = thisMonth.filter(e => e.paidBy === user).reduce((s, e) => s + (e.amount || 0), 0);
  const partnerTotal = thisMonth.filter(e => e.paidBy === partner).reduce((s, e) => s + (e.amount || 0), 0);

  const el1 = document.getElementById('fin-total');
  const el2 = document.getElementById('fin-my-total');
  const el3 = document.getElementById('fin-partner-total');
  if (el1) el1.textContent = '$' + total.toFixed(0);
  if (el2) el2.textContent = '$' + myTotal.toFixed(0);
  if (el3) el3.textContent = '$' + partnerTotal.toFixed(0);
}

function renderFinRecent(expenses) {
  const el = document.getElementById('fin-recent');
  if (!el) return;
  const recent = expenses.slice(0, 15);
  if (!recent.length) { el.innerHTML = '<div class="empty">No expenses yet</div>'; return; }
  const catIcons = { food: '🍕', transport: '🚗', housing: '🏠', entertainment: '🎬', shopping: '🛍️', health: '💊', subscriptions: '📱', other: '📦' };
  el.innerHTML = recent.map(e => {
    const who = e.paidBy === user ? 'You' : NAMES[partner];
    const icon = catIcons[e.category] || '📦';
    const ago = timeAgo(e.timestamp);
    return `<div class="fin-item">
      <div class="fin-item-icon">${icon}</div>
      <div class="fin-item-info">
        <div class="fin-item-note">${esc(e.note || e.category)}</div>
        <div class="fin-item-meta">${who} · ${ago}</div>
      </div>
      <div class="fin-item-amount">$${e.amount.toFixed(2)}</div>
    </div>`;
  }).join('');
}

function renderFinCatChart(expenses) {
  const el = document.getElementById('fin-cat-chart');
  if (!el) return;
  const now = new Date();
  const month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const thisMonth = expenses.filter(e => e.date && e.date.startsWith(month));
  if (!thisMonth.length) { el.innerHTML = ''; return; }

  const cats = {};
  thisMonth.forEach(e => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
  const total = Object.values(cats).reduce((s, v) => s + v, 0);
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const colors = { food: '#C4784A', transport: '#4A90D9', housing: '#2D8A56', entertainment: '#7B5B8C', shopping: '#D4943A', health: '#C44B4B', subscriptions: '#3A7BA6', other: '#6B6465' };

  let html = '<div class="fin-cat-bars">';
  sorted.forEach(([cat, amt]) => {
    const pct = Math.round((amt / total) * 100);
    const color = colors[cat] || '#6B6465';
    html += `<div class="fin-cat-row">
      <span class="fin-cat-name">${cat}</span>
      <div class="fin-cat-bar"><div class="fin-cat-fill" style="width:${pct}%;background:${color}"></div></div>
      <span class="fin-cat-amt">$${amt.toFixed(0)}</span>
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
}

async function addSavingsGoal() {
  if (!db || !user) return;
  const name = document.getElementById('hl-goal-name').value.trim();
  const target = parseFloat(document.getElementById('hl-goal-target').value) || 0;
  const saved = parseFloat(document.getElementById('hl-goal-saved').value) || 0;
  if (!name || !target) { toast('Name and target required'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('homelife/savings').push({
    name, target, saved, addedBy: user, timestamp: Date.now()
  });
  document.getElementById('hl-goal-name').value = '';
  document.getElementById('hl-goal-target').value = '';
  document.getElementById('hl-goal-saved').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add goal'; }, 1500); }
  toast('Savings goal added');
}

function listenSavings() {
  db.ref('homelife/savings').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); }); items.reverse();
    const el = document.getElementById('hl-savings');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Set savings goals together</div>'; return; }
    el.innerHTML = items.map(i => {
      const pct = Math.min(100, Math.round((i.saved/i.target)*100));
      return `<div class="hl-savings-card">
        <div style="display:flex;align-items:center;gap:8px"><div class="hl-savings-name" style="flex:1">${i.name}</div><button class="item-delete" style="opacity:.4" onclick="event.stopPropagation();deleteSavingsGoal('${i._key}')">×</button></div>
        <div class="hl-savings-bar"><div class="hl-savings-fill" style="width:${pct}%"></div></div>
        <div class="hl-savings-meta"><span>$${i.saved.toLocaleString()} saved</span><span>$${i.target.toLocaleString()} goal · ${pct}%</span></div>
        <button class="hl-savings-update" onclick="updateSavings('${i._key}')">Update Amount</button>
      </div>`;
    }).join('');
  });
}

async function updateSavings(key) {
  if (!db) return;
  const amount = parseFloat(prompt('Enter new saved amount:') || '0');
  if (amount > 0) {
    await db.ref('homelife/savings/' + key + '/saved').set(amount);
    toast('Updated');
  }
}

async function addMeal() {
  if (!db || !user) return;
  const name = document.getElementById('hl-meal-input').value.trim();
  const day = document.getElementById('hl-meal-day').value;
  if (!name) { toast('Name a meal'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('homelife/meals').push({
    name, day, addedBy: user, addedByName: NAMES[user], timestamp: Date.now()
  });
  document.getElementById('hl-meal-input').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add meal'; }, 1500); }
  toast('Meal added');
}

function listenMeals() {
  db.ref('homelife/meals').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); }); items.reverse();
    const el = document.getElementById('hl-meals');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Plan your meals together</div>'; return; }
    el.innerHTML = items.map(i => {
      const who = i.addedBy === user ? 'You' : (i.addedByName||'?');
      return `<div class="hl-meal-card"><div class="hl-meal-day">${i.day==='anytime'?'':i.day}</div><div class="hl-meal-name">${i.name}</div><div class="hl-meal-by">${who}</div><button class="item-delete" onclick="event.stopPropagation();deleteMeal('${i._key}')">×</button></div>`;
    }).join('');
  });
}

async function addChore() {
  if (!db || !user) return;
  const name = document.getElementById('hl-chore-input').value.trim();
  const who = document.getElementById('hl-chore-who').value;
  if (!name) { toast('Name the task'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  await db.ref('homelife/chores').push({
    name, assignedTo: who, done: false, timestamp: Date.now()
  });
  document.getElementById('hl-chore-input').value = '';
  if (btn) { btn.textContent = 'Added'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Add task'; }, 1500); }
  toast('Task added');
}

function listenChores() {
  db.ref('homelife/chores').orderByChild('timestamp').on('value', snap => {
    const items = []; snap.forEach(c => { const v = c.val(); v._key = c.key; items.push(v); }); items.reverse();
    const el = document.getElementById('hl-chores');
    if (!el) return;
    if (!items.length) { el.innerHTML = '<div class="empty">Divide and conquer household tasks</div>'; return; }
    const whoLabels = {shared:'Shared',her:user==='her'?'You':NAMES.her,him:user==='him'?'You':NAMES.him,alternate:'Alternate'};
    el.innerHTML = items.map(i =>
      `<div class="hl-chore-card ${i.done?'done':''}">
        <div class="hl-chore-check" onclick="toggleChore('${i._key}',${!i.done})">${i.done?'✓':''}</div>
        <div class="hl-chore-name">${i.name}</div>
        <div class="hl-chore-who">${whoLabels[i.assignedTo]||i.assignedTo}</div>
        <button class="item-delete" onclick="event.stopPropagation();deleteChore('${i._key}')">×</button>
      </div>`
    ).join('');
  });
}

async function toggleChore(key, done) {
  if (!db) return;
  await db.ref('homelife/chores/' + key + '/done').set(done);
}


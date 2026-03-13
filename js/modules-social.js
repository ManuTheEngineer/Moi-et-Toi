// ===== WOULD YOU RATHER =====
const WYR_QUESTIONS = [
  { a: 'Travel the world together for a year', b: 'Have a dream home together right now' },
  { a: 'Always know what your partner is thinking', b: 'Always know what your partner is feeling' },
  { a: 'Cook a fancy dinner together', b: 'Order in and watch a movie together' },
  { a: 'Go on a spontaneous road trip', b: 'Plan a perfect vacation in detail' },
  { a: 'Relive your first date', b: 'Skip to your 50th anniversary' },
  { a: 'Have a partner who gives amazing gifts', b: 'Have a partner who writes you love letters' },
  { a: 'Live in a cabin in the mountains', b: 'Live in a beach house by the ocean' },
  { a: 'Always agree on everything', b: 'Have passionate debates that make you grow' },
  { a: 'Have breakfast in bed every morning', b: 'Have a slow dance in the kitchen every evening' },
  { a: 'Know your love language perfectly', b: "Know your partner's dream future perfectly" },
  { a: 'Take a cooking class together', b: 'Take a dance class together' },
  { a: 'Have a picnic under the stars', b: 'Have coffee watching the sunrise' },
  { a: "Read each other's minds for a day", b: 'Swap lives for a day' },
  { a: 'Have a movie night every week', b: 'Have a date night out every week' },
  { a: 'Write a song together', b: 'Paint a picture together' },
  { a: 'Live somewhere always warm', b: 'Live somewhere with all four seasons' },
  { a: 'Have the ability to pause time together', b: 'Have the ability to teleport to each other' },
  { a: 'Go to a couples spa retreat', b: 'Go on an adventure like skydiving' },
  { a: 'Have a partner who always makes you laugh', b: 'Have a partner who always makes you feel safe' },
  { a: 'Receive a handwritten letter', b: 'Receive a surprise visit' }
];

let wyrIndex = 0;

function loadWYR() {
  const q = WYR_QUESTIONS[wyrIndex];
  var card = document.getElementById('wyr-card');
  if (card) {
    card.style.opacity = '0';
    setTimeout(function () {
      card.style.opacity = '1';
    }, 50);
  }
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
        document.getElementById('wyr-result').textContent = match
          ? 'You both picked the same'
          : 'You picked differently';
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

function nextWYR() {
  wyrIndex = (wyrIndex + 1) % WYR_QUESTIONS.length;
  loadWYR();
}
function prevWYR() {
  wyrIndex = (wyrIndex - 1 + WYR_QUESTIONS.length) % WYR_QUESTIONS.length;
  loadWYR();
}

// ===== HOW WELL DO YOU KNOW ME =====
async function submitQuizQ() {
  if (!db || !user) return;
  const q = document.getElementById('quiz-q').value.trim();
  const a = document.getElementById('quiz-a').value.trim();
  if (!q || !a) {
    toast('Question and answer required');
    return;
  }
  const btn = event?.target;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  await db.ref('games/knowme/' + user).push({
    question: q,
    answer: a,
    timestamp: Date.now()
  });
  document.getElementById('quiz-q').value = '';
  document.getElementById('quiz-a').value = '';
  if (btn) {
    btn.textContent = 'Added';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Add question';
    }, 1500);
  }
  toast('Question added');
  setTimeout(function () {
    var el = document.getElementById('quiz-q');
    if (el) el.focus();
  }, 200);
}

function listenQuiz() {
  // My questions
  db.ref('games/knowme/' + user).on('value', snap => {
    const el = document.getElementById('quiz-mine');
    if (!el) return;
    const qs = [];
    snap.forEach(c => qs.push(c.val()));
    if (!qs.length) {
      el.innerHTML = '<div class="empty">Add questions about yourself for your partner to answer.</div>';
      return;
    }
    el.innerHTML = qs
      .map(
        q =>
          `<div class="quiz-item"><div class="quiz-item-q">${esc(q.question)}</div><div class="quiz-item-a correct">Answer: ${esc(q.answer)}</div></div>`
      )
      .join('');
  });
  // Partner's questions
  db.ref('games/knowme/' + partner).on('value', snap => {
    const el = document.getElementById('quiz-theirs');
    if (!el) return;
    const qs = [];
    snap.forEach(c => {
      const v = c.val();
      v._key = c.key;
      qs.push(v);
    });
    if (!qs.length) {
      el.innerHTML = '<div class="empty">Waiting for your partner to write some questions</div>';
      return;
    }
    el.innerHTML = qs
      .map(q => {
        return `<div class="quiz-item">
        <div class="quiz-item-q">${esc(q.question)}</div>
        <input class="quiz-q" placeholder="Your guess..." data-answer="${esc(q.answer)}" onkeydown="if(event.key==='Enter')checkQuizAnswer(this,this.dataset.answer)">
      </div>`;
      })
      .join('');
  });
}

function checkQuizAnswer(input, correct) {
  const guess = input.value.trim().toLowerCase();
  const answer = correct.toLowerCase();
  const parent = input.closest('.quiz-item');
  if (guess === answer) {
    parent.innerHTML +=
      '<div class="quiz-item-a correct">Correct - ' + correct.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>';
    input.remove();
    toast('Correct');
  } else {
    toast('Not quite, try again');
  }
}

// ===== BUCKET LIST =====
let bucketFilter = 'all';
const BUCKET_CATS = ['travel', 'food', 'adventure', 'home', 'other'];

async function addBucketItem() {
  if (!db || !user) return;
  const title = document.getElementById('bl-input').value.trim();
  const emoji = document.getElementById('bl-emoji').value.trim() || '✨';
  if (!title) {
    toast('Enter a dream first');
    return;
  }
  const btn = event?.target;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  // Detect category from keywords
  let cat = 'other';
  const lower = title.toLowerCase();
  if (/visit|trip|travel|fly|country|city|island|japan|paris|italy/.test(lower)) cat = 'travel';
  else if (/eat|cook|restaurant|food|recipe|bake|cafe|dinner/.test(lower)) cat = 'food';
  else if (/try|climb|dive|jump|hike|run|swim|sky|bungee|surf/.test(lower)) cat = 'adventure';
  else if (/house|apartment|decor|garden|furniture|move|build/.test(lower)) cat = 'home';

  await db.ref('bucketList').push({
    title,
    emoji,
    category: cat,
    addedBy: user,
    addedByName: NAMES[user],
    completed: false,
    timestamp: Date.now()
  });
  document.getElementById('bl-input').value = '';
  document.getElementById('bl-emoji').value = '';
  document.getElementById('bl-input').focus();
  if (btn) {
    btn.textContent = '\u2713 Added';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Add';
    }, 1500);
  }
  toast('Added to bucket list');
  if (typeof logActivity === 'function') logActivity('bucket', 'added to bucket list');
}

function filterBucket(cat, el) {
  bucketFilter = cat;
  document.querySelectorAll('.bl-cat').forEach(e => e.classList.remove('on'));
  if (el) el.classList.add('on');
  // Remove previous listener before re-attaching to prevent stacking
  if (db) db.ref('bucketList').off('value');
  listenBucketList();
}

function listenBucketList() {
  db.ref('bucketList')
    .orderByChild('timestamp')
    .on('value', snap => {
      const items = [];
      snap.forEach(c => {
        const v = c.val();
        v._key = c.key;
        items.push(v);
      });
      items.reverse();
      renderBucketList(items);
    });
}

function renderBucketList(items) {
  const el = document.getElementById('bl-list');
  if (!el) return;
  const filtered = bucketFilter === 'all' ? items : items.filter(i => i.category === bucketFilter);
  if (!filtered.length) {
    el.innerHTML = '<div class="empty">No items in this category yet.</div>';
    return;
  }
  el.innerHTML = filtered
    .map(
      i => `<div class="bl-item ${i.completed ? 'completed' : ''}">
    <div class="bl-check" onclick="toggleBucket('${i._key}',${!i.completed})">${i.completed ? '✓' : ''}</div>
    <span class="bl-emoji">${i.emoji}</span>
    <div class="bl-info">
      <div class="bl-title">${esc(i.title)}</div>
      <div class="bl-meta">${i.addedBy === user ? 'You' : esc(i.addedByName || '?')} · ${esc(i.category)}</div>
    </div>
    <button class="item-delete" aria-label="Delete" onclick="event.stopPropagation();deleteBucketItem('${i._key}')">×</button>
  </div>`
    )
    .join('');
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
  if (!title) {
    toast('Enter an item first');
    return;
  }
  const btn = event?.target;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  await db.ref('wishlists/' + user).push({
    title,
    link,
    priority,
    purchased: false,
    timestamp: Date.now()
  });
  document.getElementById('wl-input').value = '';
  document.getElementById('wl-link').value = '';
  document.getElementById('wl-input').focus();
  if (btn) {
    btn.textContent = '\u2713 Added';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Add';
    }, 1500);
  }
  toast('Added to wishlist');
}

function listenWishlists() {
  // My wishlist
  db.ref('wishlists/' + user)
    .orderByChild('timestamp')
    .on('value', snap => {
      const items = [];
      snap.forEach(c => {
        const v = c.val();
        v._key = c.key;
        items.push(v);
      });
      items.reverse();
      const el = document.getElementById('wl-mine');
      if (!el) return;
      if (!items.length) {
        el.innerHTML = '<div class="empty">Drop hints here</div>';
        return;
      }
      el.innerHTML = items
        .map(
          i => `<div class="wl-item ${i.purchased ? 'purchased' : ''}">
      <div class="wl-info">
        <div class="wl-title">${esc(i.title)}</div>
        <span class="wl-priority ${i.priority}">${i.priority === 'love' ? '♡ Love it' : i.priority === 'want' ? '★ Want it' : '● Need it'}</span>
        ${i.link && safeHref(i.link) ? `<a class="wl-link" href="${safeHref(i.link)}" target="_blank" rel="noopener">View →</a>` : ''}
      </div>
      <button class="item-delete" aria-label="Delete" onclick="event.stopPropagation();deleteWishItem('${user}','${i._key}')">×</button>
    </div>`
        )
        .join('');
    });
  // Partner's wishlist
  db.ref('wishlists/' + partner)
    .orderByChild('timestamp')
    .on('value', snap => {
      const items = [];
      snap.forEach(c => {
        const v = c.val();
        v._key = c.key;
        items.push(v);
      });
      items.reverse();
      const el = document.getElementById('wl-theirs');
      if (!el) return;
      if (!items.length) {
        el.innerHTML = '<div class="empty">Nothing here yet - someone is being mysterious</div>';
        return;
      }
      el.innerHTML = items
        .map(
          i => `<div class="wl-item ${i.purchased ? 'purchased' : ''}">
      <div class="wl-info">
        <div class="wl-title">${esc(i.title)}</div>
        <span class="wl-priority ${i.priority}">${i.priority === 'love' ? '♡ Love it' : i.priority === 'want' ? '★ Want it' : '● Need it'}</span>
        ${i.link && safeHref(i.link) ? `<a class="wl-link" href="${safeHref(i.link)}" target="_blank" rel="noopener">View →</a>` : ''}
      </div>
      ${!i.purchased ? `<button class="wl-buy" onclick="markPurchased('${i._key}')">Got it</button>` : '<span style="font-size:10px;color:var(--gold)">✓ Got</span>'}
    </div>`
        )
        .join('');
    });
}

async function markPurchased(key) {
  if (!db) return;
  await db.ref('wishlists/' + partner + '/' + key + '/purchased').set(true);
  toast('Marked as purchased');
}

// ===== DATE NIGHT GENERATOR =====
const DATE_IDEAS = [
  {
    cat: 'home',
    emoji: '🍿',
    title: 'Movie Marathon Night',
    desc: 'Pick a trilogy or director. Make popcorn. No phones. Blankets required.'
  },
  {
    cat: 'home',
    emoji: '👨‍🍳',
    title: 'Cook-Off Challenge',
    desc: "Each person picks a secret recipe. Cook simultaneously. Judge each other's dishes."
  },
  {
    cat: 'home',
    emoji: '🎨',
    title: 'Paint & Sip',
    desc: 'Get two canvases, some paint, wine. Paint the same subject, compare results.'
  },
  {
    cat: 'home',
    emoji: '🕯',
    title: 'Candlelit Dinner at Home',
    desc: 'Dress up nice. Set the table properly. Cook something special. Real napkins.'
  },
  {
    cat: 'home',
    emoji: '🧩',
    title: 'Puzzle Night',
    desc: '1000-piece puzzle, music, snacks. See how far you get in one evening.'
  },
  {
    cat: 'home',
    emoji: '📖',
    title: 'Read Together',
    desc: 'Same book, same couch, different ends. Discuss chapters over tea.'
  },
  {
    cat: 'home',
    emoji: '🎮',
    title: 'Retro Game Night',
    desc: 'Old-school video games or board games. Winner picks dessert.'
  },
  {
    cat: 'home',
    emoji: '💆',
    title: 'Spa Night',
    desc: 'Face masks, foot soaks, massage oils. Take turns pampering each other.'
  },
  {
    cat: 'home',
    emoji: '🌮',
    title: 'Taco Tuesday Deluxe',
    desc: 'Every topping imaginable. Build your own tacos. Compete for best creation.'
  },
  {
    cat: 'home',
    emoji: '🔮',
    title: 'Question Deep Dive',
    desc: '36 questions that lead to love. No distractions. Just each other.'
  },
  {
    cat: 'outdoor',
    emoji: '🌅',
    title: 'Sunrise Picnic',
    desc: 'Wake up early. Pack breakfast. Find the best view. Watch the sky change.'
  },
  {
    cat: 'outdoor',
    emoji: '🥾',
    title: 'Hike & Discover',
    desc: 'Find a trail neither of you has done. Pack snacks. Take photos at the top.'
  },
  {
    cat: 'outdoor',
    emoji: '🚗',
    title: 'Mystery Drive',
    desc: 'Take turns saying left/right/straight. End up somewhere random. Explore.'
  },
  {
    cat: 'outdoor',
    emoji: '⭐',
    title: 'Stargazing',
    desc: 'Blanket, hot drinks, star map app. Find constellations. Make wishes.'
  },
  {
    cat: 'outdoor',
    emoji: '🚴',
    title: 'Bike Ride Adventure',
    desc: 'Rent bikes or use your own. Explore a new neighborhood or trail together.'
  },
  {
    cat: 'outdoor',
    emoji: '📸',
    title: 'Photo Walk',
    desc: 'Each take 20 photos of things that catch your eye. Compare perspectives after.'
  },
  {
    cat: 'outdoor',
    emoji: '🧺',
    title: 'Sunset Picnic',
    desc: 'Pack a basket. Find a park or waterfront spot. Watch the sun go down together.'
  },
  {
    cat: 'fancy',
    emoji: '🍷',
    title: 'Wine Tasting',
    desc: 'Visit a winery or buy 4 bottles. Rate each one blindfolded. Find your couple wine.'
  },
  {
    cat: 'fancy',
    emoji: '🎭',
    title: 'Theatre or Live Show',
    desc: 'Book tickets to something neither of you would normally see. Dress up.'
  },
  {
    cat: 'fancy',
    emoji: '🍽',
    title: "Chef's Table Experience",
    desc: 'Find a tasting menu restaurant. Let someone else cook. Savor every course.'
  },
  {
    cat: 'fancy',
    emoji: '💃',
    title: 'Dancing Night',
    desc: 'Salsa, swing, or ballroom class. Then go out dancing after.'
  },
  {
    cat: 'fancy',
    emoji: '🎵',
    title: 'Jazz Club Evening',
    desc: 'Find a live jazz spot. Dress sharp. Sip cocktails. Feel like old Hollywood.'
  },
  {
    cat: 'adventure',
    emoji: '🧗',
    title: 'Rock Climbing',
    desc: 'Indoor climbing gym. Belay each other. Trust falls built in.'
  },
  {
    cat: 'adventure',
    emoji: '🛶',
    title: 'Kayak or Canoe',
    desc: 'Rent one and paddle somewhere scenic. Teamwork required.'
  },
  {
    cat: 'adventure',
    emoji: '🎯',
    title: 'Axe Throwing',
    desc: 'Surprisingly fun couples activity. Release some energy. Compete.'
  },
  {
    cat: 'adventure',
    emoji: '🏄',
    title: 'Learn Something Together',
    desc: 'Surfing, pottery, archery, glass blowing. First-timers together.'
  },
  {
    cat: 'adventure',
    emoji: '🗺',
    title: 'Tourist in Your Own City',
    desc: "Visit attractions you've never been to in your own town. Pretend you're tourists."
  },
  {
    cat: 'budget',
    emoji: '☕',
    title: 'Coffee Shop Hop',
    desc: 'Visit 3 different coffee shops. Rate each one. Find your new favorite spot.'
  },
  {
    cat: 'budget',
    emoji: '🌳',
    title: 'Park & People Watch',
    desc: 'Pack snacks, find a bench. Create backstories for strangers walking by.'
  },
  {
    cat: 'budget',
    emoji: '🎪',
    title: 'Free Community Event',
    desc: 'Check local listings for free concerts, markets, festivals, or outdoor movies.'
  },
  {
    cat: 'budget',
    emoji: '📝',
    title: 'Love Letter Exchange',
    desc: 'Sit in the same room. Write each other a letter. Exchange and read aloud.'
  },
  {
    cat: 'budget',
    emoji: '🌙',
    title: 'Night Walk',
    desc: 'Walk through your neighborhood at night. Different energy. Hold hands. Talk.'
  },
  {
    cat: 'budget',
    emoji: '🏠',
    title: 'Fort Building',
    desc: 'Blankets, pillows, fairy lights. Build a fort in the living room. Never grow up.'
  }
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
    showEl('dn-result');
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
    ...currentDateIdea,
    savedBy: user,
    savedByName: NAMES[user],
    done: false,
    timestamp: Date.now()
  });
  toast('Date idea saved');
  if (typeof logActivity === 'function') logActivity('datenight', 'saved a date idea');
}

function listenDateNights() {
  db.ref('dateNights')
    .orderByChild('timestamp')
    .on('value', snap => {
      const items = [];
      snap.forEach(c => {
        const v = c.val();
        v._key = c.key;
        items.push(v);
      });
      items.reverse();
      const saved = items.filter(i => !i.done);
      const done = items.filter(i => i.done);
      const sEl = document.getElementById('dn-saved');
      const hEl = document.getElementById('dn-history');
      if (sEl) {
        if (!saved.length) sEl.innerHTML = '<div class="empty">No saved ideas yet. Spin the wheel!</div>';
        else
          sEl.innerHTML = saved
            .map(i => {
              const who = i.savedBy === user ? 'you' : i.savedByName || '?';
              return `<div class="dn-saved-card">
        <div class="dn-saved-emoji">${i.emoji}</div>
        <div class="dn-saved-info"><div class="dn-saved-title">${i.title}</div><div class="dn-saved-meta">${i.cat} · saved by ${who}</div></div>
        <button class="dn-done-btn" onclick="markDateDone('${i._key}')">Did it</button>
        <button class="item-delete" aria-label="Delete" style="opacity:.4" onclick="event.stopPropagation();deleteDateIdea('${i._key}')">×</button>
      </div>`;
            })
            .join('');
      }
      if (hEl) {
        if (!done.length) hEl.innerHTML = '<div class="empty">No dates done yet. Go on one!</div>';
        else
          hEl.innerHTML = done
            .map(i => {
              const ts = timeAgo(new Date(i.doneAt || i.timestamp));
              return `<div class="dn-saved-card" style="opacity:.7"><div class="dn-saved-emoji">${i.emoji}</div><div class="dn-saved-info"><div class="dn-saved-title">${i.title}</div><div class="dn-saved-meta">${ts}${i.rating ? ' · ' + '★'.repeat(i.rating) : ''}</div></div></div>`;
            })
            .join('');
      }
    });
}

function markDateDone(key) {
  if (!db) return;
  openModal(`
    <div style="text-align:center;padding:12px 0">
      <div style="font-size:14px;font-weight:600;color:var(--cream);margin-bottom:12px">How was your date?</div>
      <div style="display:flex;justify-content:center;gap:12px;margin-bottom:16px">
        ${[1, 2, 3, 4, 5].map(n => `<button onclick="submitDateRating('${key}',${n})" style="width:44px;height:44px;border-radius:50%;border:1px solid var(--border);background:var(--tint);color:var(--gold);font-size:18px;cursor:pointer;transition:all .15s;font-family:Outfit,sans-serif" onpointerdown="this.style.transform='scale(.9)';this.style.background='var(--gold)';this.style.color='#fff'" onpointerup="this.style.transform=''">${n}★</button>`).join('')}
      </div>
      <button onclick="submitDateRating('${key}',0)" style="border:none;background:none;color:var(--t3);font-size:12px;cursor:pointer;padding:8px">Skip rating</button>
    </div>
  `);
}

async function submitDateRating(key, rating) {
  await db
    .ref('dateNights/' + key)
    .update({ done: true, doneAt: Date.now(), rating: Math.min(5, Math.max(0, rating)) });
  closeModal();
  toast('Date completed');
}

// ===== LOVE LANGUAGES =====
const LL_NAMES = ['Words of Affirmation', 'Quality Time', 'Receiving Gifts', 'Acts of Service', 'Physical Touch'];
const LL_QUIZ = [
  {
    q: 'I feel most loved when my partner...',
    a: ['Tells me how much I mean to them', 'Spends undivided time with me'],
    l: [0, 1]
  },
  {
    q: 'What makes you feel most appreciated?',
    a: ['A thoughtful gift, even small', 'When they help without being asked'],
    l: [2, 3]
  },
  {
    q: 'After a long day, I want my partner to...',
    a: ['Hold me and be close', "Tell me they're proud of me"],
    l: [4, 0]
  },
  {
    q: 'The best surprise would be...',
    a: ['A day planned just for us two', 'A heartfelt handwritten note'],
    l: [1, 0]
  },
  {
    q: 'I feel disconnected when...',
    a: ["We haven't touched in a while", 'They forget to help with things I need'],
    l: [4, 3]
  },
  {
    q: 'My ideal evening involves...',
    a: ['Sitting close, watching something together', 'Receiving a small unexpected gift'],
    l: [1, 2]
  },
  {
    q: 'I feel most valued when they...',
    a: ['Take something off my plate without me asking', 'Say specific things they love about me'],
    l: [3, 0]
  },
  {
    q: 'What warms your heart most?',
    a: ['A long hug after time apart', 'When they plan our time intentionally'],
    l: [4, 1]
  },
  {
    q: 'Which means more to you?',
    a: ['They remembered something I mentioned wanting', 'They wrote me a love letter'],
    l: [2, 0]
  },
  {
    q: 'I feel closest to my partner when...',
    a: ["We're doing something together, phones away", 'They do my least favorite chore for me'],
    l: [1, 3]
  }
];
let llStep = 0;
let llScores = [0, 0, 0, 0, 0];

function loadLLQuiz() {
  if (!db || !user) return;
  db.ref('loveLang/' + user).once('value', snap => {
    const data = snap.val();
    if (data && data.scores) {
      showLLResults();
    } else {
      llStep = 0;
      llScores = [0, 0, 0, 0, 0];
      renderLLQuestion();
      showEl('ll-quiz');
      hideEl('ll-results');
    }
  });
}

function renderLLQuestion() {
  if (llStep >= LL_QUIZ.length) {
    submitLLResults();
    return;
  }
  const q = LL_QUIZ[llStep];
  document.getElementById('ll-progress').textContent = `Question ${llStep + 1} of ${LL_QUIZ.length}`;
  document.getElementById('ll-q-text').textContent = q.q;
  var opts = document.getElementById('ll-options');
  if (opts) {
    opts.style.opacity = '0';
  }
  opts.innerHTML = q.a.map((a, i) => `<button class="ll-option" onclick="pickLL(${i})">${esc(a)}</button>`).join('');
  if (opts) {
    setTimeout(function () {
      opts.style.opacity = '1';
    }, 50);
  }
}

function pickLL(choice) {
  const q = LL_QUIZ[llStep];
  llScores[q.l[choice]] += 2;
  // Give 1 point to the other option too (secondary)
  llScores[q.l[1 - choice]] += 1;
  llStep++;
  renderLLQuestion();
}

async function submitLLResults() {
  if (!db || !user) return;
  await db.ref('loveLang/' + user).set({ scores: llScores, timestamp: Date.now() });
  showLLResults();
}

function showLLResults() {
  hideEl('ll-quiz');
  showEl('ll-results');
  db.ref('loveLang').on('value', snap => {
    const data = snap.val() || {};
    renderLLProfile('ll-my-primary', 'll-my-bars', data[user]);
    renderLLProfile('ll-partner-primary', 'll-partner-bars', data[partner]);
    renderLLTips(data[user], data[partner]);
    document.querySelectorAll('.uname').forEach(e => (e.textContent = NAMES[user]));
    document.querySelectorAll('.pname').forEach(e => (e.textContent = NAMES[partner]));
  });
}

function renderLLProfile(primaryId, barsId, data) {
  const pEl = document.getElementById(primaryId);
  const bEl = document.getElementById(barsId);
  if (!pEl || !bEl) return;
  if (!data || !data.scores) {
    pEl.textContent = 'Not taken yet';
    bEl.innerHTML = '';
    return;
  }
  const scores = data.scores;
  const max = Math.max(...scores);
  const primary = scores.indexOf(max);
  pEl.textContent = LL_NAMES[primary];
  bEl.innerHTML = scores
    .map((s, i) => {
      const pct = max > 0 ? Math.round((s / max) * 100) : 0;
      return `<div class="ll-bar"><span style="min-width:60px;font-size:9px">${LL_NAMES[i].split(' ')[0]}</span><div class="ll-bar-track"><div class="ll-bar-fill" style="width:${pct}%"></div></div></div>`;
    })
    .join('');
}

function renderLLTips(myData, theirData) {
  const el = document.getElementById('ll-tips');
  if (!el || !myData?.scores || !theirData?.scores) {
    if (el)
      el.innerHTML =
        '<div class="ll-tips-title">Tips</div><div class="ll-tip">Both partners need to complete the quiz to see personalized tips.</div>';
    return;
  }
  const myPrimary = LL_NAMES[myData.scores.indexOf(Math.max(...myData.scores))];
  const theirPrimary = LL_NAMES[theirData.scores.indexOf(Math.max(...theirData.scores))];
  const tips = {
    'Words of Affirmation':
      'Leave notes, send texts saying what you appreciate. Be specific: "I loved how you handled that" means more than "you\'re great."',
    'Quality Time':
      "Put the phone away. Plan intentional time. It's not about quantity - it's about being fully present.",
    'Receiving Gifts':
      'It\'s not about price. It\'s about "I saw this and thought of you." Small, thoughtful tokens matter most.',
    'Acts of Service':
      'Do something they usually do themselves. Take a task off their plate. Actions speak louder than words.',
    'Physical Touch':
      'Hold hands walking. Touch their back passing by. A long hug when they get home. Proximity matters.'
  };
  el.innerHTML = `<div class="ll-tips-title">How to Love Each Other Better</div>
    <div class="ll-tip">For <strong>${NAMES[partner]}</strong> (${theirPrimary}): ${tips[theirPrimary]}</div>
    <div class="ll-tip">For <strong>${NAMES[user]}</strong> (${myPrimary}): ${tips[myPrimary]}</div>`;
}

function retakeLLQuiz() {
  llStep = 0;
  llScores = [0, 0, 0, 0, 0];
  showEl('ll-quiz');
  hideEl('ll-results');
  renderLLQuestion();
}

// ===== WEEKLY CHECK-IN =====
function getWeekId() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + String(weekNum).padStart(2, '0');
}

async function submitCheckin() {
  if (!db || !user) return;
  const well = document.getElementById('ci-well').value.trim();
  const better = document.getElementById('ci-better').value.trim();
  const need = document.getElementById('ci-need').value.trim();
  if (!well && !better && !need) {
    toast('Share at least one thought');
    return;
  }
  const btn = event?.target;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  const week = getWeekId();
  await db.ref('checkins/' + week + '/' + user).set({
    well,
    better,
    need,
    userName: NAMES[user],
    timestamp: Date.now()
  });
  document.getElementById('ci-well').value = '';
  document.getElementById('ci-better').value = '';
  document.getElementById('ci-need').value = '';
  if (typeof logActivity === 'function') logActivity('checkin', 'completed weekly check-in');
  if (typeof renderSmartNudges === 'function') renderSmartNudges();
  if (btn) {
    btn.textContent = 'Saved';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Submit';
    }, 1500);
  }
  toast('Check-in saved');
}

function listenCheckins() {
  db.ref('checkins')
    .orderByKey()
    .limitToLast(8)
    .on('value', snap => {
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
    el.innerHTML =
      '<div class="ci-status-label">This Week</div><div class="ci-status-text">Both checked in! Read each other\'s thoughts below.</div>';
  } else if (myDone) {
    el.innerHTML = `<div class="ci-status-label">This Week</div><div class="ci-status-text">You've checked in. Waiting for ${NAMES[partner]}...</div>`;
  } else {
    el.innerHTML =
      '<div class="ci-status-label">This Week</div><div class="ci-status-text">Time for your weekly relationship check-in.</div>';
  }
}

function renderCheckinFeed(weeks) {
  const el = document.getElementById('ci-feed');
  if (!el) return;
  const completed = weeks.filter(w => w.data[user] || w.data[partner]);
  if (!completed.length) {
    el.innerHTML = '<div class="empty">No check-ins yet.</div>';
    return;
  }
  el.innerHTML = completed
    .map(w => {
      let html = `<div class="ci-card"><div class="ci-card-week">${w.week}</div>`;
      [user, partner].forEach(u => {
        const d = w.data[u];
        if (!d) return;
        const name = u === user ? 'You' : NAMES[partner];
        html += `<div class="ci-card-name">${name}</div>`;
        if (d.well)
          html += `<div class="ci-card-q">What went well:</div><div class="ci-card-a">${d.well.replace(/</g, '&lt;')}</div>`;
        if (d.better)
          html += `<div class="ci-card-q">Could be better:</div><div class="ci-card-a">${d.better.replace(/</g, '&lt;')}</div>`;
        if (d.need)
          html += `<div class="ci-card-q">What I need:</div><div class="ci-card-a">${d.need.replace(/</g, '&lt;')}</div>`;
      });
      return html + '</div>';
    })
    .join('');
}

// ===== DREAM BOARD =====
let dreamFilter = 'all';
let _lastDreamItems = [];
const DR_CAT_ICONS = { home: '🏠', travel: '✈️', career: '💼', family: '👨‍👩‍👧', experience: '🎯', financial: '💰' };
const DR_CAT_COLORS = {
  home: 'var(--lavender)',
  travel: 'var(--teal)',
  career: 'var(--gold)',
  family: 'var(--rose)',
  experience: 'var(--emerald)',
  financial: 'var(--amber)'
};
const DR_PRIORITY_LABELS = {
  someday: 'Someday',
  thisyear: 'This Year',
  next2: 'Next 2 Yrs',
  '5year': '5 Year',
  lifetime: 'Lifetime'
};

async function addDream() {
  if (!db || !user) return;
  const title = document.getElementById('dr-title').value.trim();
  const emoji = document.getElementById('dr-emoji').value.trim() || '✧';
  const cat = document.getElementById('dr-cat').value;
  const desc = document.getElementById('dr-desc').value.trim();
  const priority = document.getElementById('dr-priority').value;
  const target = document.getElementById('dr-target').value.trim();
  if (!title) {
    toast('Describe your dream');
    return;
  }
  const btn = event?.target;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  await db.ref('dreams').push({
    title,
    emoji,
    category: cat,
    description: desc,
    priority,
    targetDate: target,
    addedBy: user,
    addedByName: NAMES[user],
    achieved: false,
    timestamp: Date.now()
  });
  document.getElementById('dr-title').value = '';
  document.getElementById('dr-emoji').value = '';
  document.getElementById('dr-desc').value = '';
  document.getElementById('dr-target').value = '';
  document.getElementById('dr-title').focus();
  if (btn) {
    btn.textContent = '\u2713 Saved';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Add Dream';
    }, 1500);
  }
  toast('Dream added');
  awardXP(10);
  if (typeof logActivity === 'function') logActivity('dreams', 'added a dream: ' + title);
}

function filterDreams(cat, el) {
  dreamFilter = cat;
  document.querySelectorAll('#dr-cats .bl-cat').forEach(e => e.classList.remove('on'));
  if (el) el.classList.add('on');
  // Remove previous listener before re-attaching to prevent stacking
  if (db) db.ref('dreams').off('value');
  listenDreams();
}

function listenDreams() {
  db.ref('dreams')
    .orderByChild('timestamp')
    .on('value', snap => {
      const items = [];
      snap.forEach(c => {
        const v = c.val();
        v._key = c.key;
        items.push(v);
      });
      items.reverse();
      _lastDreamItems = items;
      renderDreams(items);
    });
}

function renderDreams(items) {
  const el = document.getElementById('dr-list');
  if (!el) return;
  let filtered;
  if (dreamFilter === 'all') filtered = items.filter(i => !i.achieved);
  else if (dreamFilter === 'achieved') filtered = items.filter(i => i.achieved);
  else filtered = items.filter(i => i.category === dreamFilter && !i.achieved);

  if (!filtered.length) {
    el.innerHTML = `<div class="empty">${dreamFilter === 'achieved' ? 'No achieved dreams yet - keep going!' : 'No dreams in this category yet'}</div>`;
    updateDRStats(items);
    return;
  }
  el.innerHTML = filtered
    .map(i => {
      const ts = timeAgo(new Date(i.timestamp));
      const who = i.addedBy === user ? 'You' : esc(i.addedByName || '?');
      const catColor = DR_CAT_COLORS[i.category] || 'var(--gold)';
      const catIcon = DR_CAT_ICONS[i.category] || '';
      const prioLabel = DR_PRIORITY_LABELS[i.priority] || '';
      return `<div class="dr-card ${i.achieved ? 'achieved' : ''}" style="border-left:3px solid ${catColor}">
      <div class="dr-check" onclick="toggleDream('${i._key}',${!i.achieved})">${i.achieved ? '✓' : ''}</div>
      <div class="dr-emoji">${i.emoji}</div>
      <div class="dr-info">
        <div class="dr-title">${esc(i.title)}</div>
        <div class="dr-tags-row">
          <span class="dr-cat-tag" style="color:${catColor}">${catIcon} ${i.category}</span>
          ${prioLabel ? `<span class="dr-prio-tag">${prioLabel}</span>` : ''}
          ${i.targetDate ? `<span class="dr-target-tag">${esc(i.targetDate)}</span>` : ''}
        </div>
        ${i.description ? `<div class="dr-desc">${i.description.replace(/</g, '&lt;')}</div>` : ''}
        <div class="dr-meta">${who} · ${ts}</div>
      </div>
      <button class="item-delete" aria-label="Delete" onclick="event.stopPropagation();deleteDream('${i._key}')">×</button>
    </div>`;
    })
    .join('');
  updateDRStats(items);
}

function updateDRStats(items) {
  if (!items) items = _lastDreamItems;
  if (!items || !items.length) return;
  const total = items.length;
  const done = items.filter(i => i.achieved).length;
  const active = total - done;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Progress ring
  const ring = document.getElementById('dr-ring-fill');
  if (ring) {
    const dashoffset = 220 - (220 * pct) / 100;
    ring.style.strokeDashoffset = dashoffset;
  }
  const pctEl = document.getElementById('dr-ring-pct');
  if (pctEl) pctEl.textContent = pct;

  // Stat numbers
  const totalEl = document.getElementById('dr-total-ct');
  const doneEl = document.getElementById('dr-done-ct');
  const activeEl = document.getElementById('dr-active-ct');
  if (totalEl) totalEl.textContent = total;
  if (doneEl) doneEl.textContent = done;
  if (activeEl) activeEl.textContent = active;
}

async function toggleDream(key, achieved) {
  if (!db) return;
  await db.ref('dreams/' + key + '/achieved').set(achieved);
  if (achieved) {
    toast('Dream achieved!');
    showConfetti();
    awardXP(25);
    if (typeof logActivity === 'function') logActivity('dreams', 'achieved a dream!');
  }
}

// ===== ATTACHMENT STYLE QUIZ =====
const AS_NAMES = ['Secure', 'Anxious', 'Avoidant', 'Fearful-Avoidant'];
const AS_COLORS = ['var(--emerald)', 'var(--rose)', 'var(--teal)', 'var(--amber)'];
const AS_ICONS = ['🛡️', '💗', '🏔️', '🌊'];
const AS_DESCRIPTIONS = {
  Secure: 'You feel comfortable with closeness and independence. You trust your partner and communicate openly.',
  Anxious:
    "You crave closeness and can worry about your partner's feelings. You're deeply attuned to relationship cues.",
  Avoidant: "You value independence and may need more space. You're self-reliant and process emotions internally.",
  'Fearful-Avoidant':
    "You desire closeness but sometimes pull back. You're learning to balance vulnerability and independence."
};
const AS_QUIZ = [
  {
    q: 'When my partner is away, I usually...',
    a: [
      'Feel fine and trust them',
      "Worry about what they're doing",
      'Enjoy the alone time',
      'Alternate between missing them and feeling relieved'
    ],
    s: [0, 1, 2, 3]
  },
  {
    q: 'When we have a conflict, I tend to...',
    a: [
      'Talk it through calmly',
      'Need reassurance things are ok',
      'Withdraw and process alone',
      'Shut down or get overwhelmed'
    ],
    s: [0, 1, 2, 3]
  },
  {
    q: 'How do you feel about sharing deep emotions?',
    a: [
      "I'm comfortable being vulnerable",
      'I want to share everything, maybe too much',
      'I prefer to keep things to myself',
      'I want to but it feels risky'
    ],
    s: [0, 1, 2, 3]
  },
  {
    q: 'When your partner needs space, you...',
    a: [
      'Respect it without worrying',
      'Feel anxious about why',
      'Understand completely - I need it too',
      'Feel confused - do they still care?'
    ],
    s: [0, 1, 2, 3]
  },
  {
    q: 'How do you handle relationship uncertainty?',
    a: [
      'Stay grounded and communicate',
      'Seek constant reassurance',
      "Act like it doesn't bother me",
      'Swing between clinging and pulling away'
    ],
    s: [0, 1, 2, 3]
  },
  {
    q: 'Your partner says "we need to talk." You feel...',
    a: ['Curious and open', 'Immediately worried', 'Slightly annoyed', 'Panicked but try to hide it'],
    s: [0, 1, 2, 3]
  },
  {
    q: 'After a fight, you usually...',
    a: [
      'Reach out to reconnect when ready',
      'Apologize quickly, even if not my fault',
      'Need time alone before talking',
      "Want to reconnect but don't know how"
    ],
    s: [0, 1, 2, 3]
  },
  {
    q: 'How comfortable are you depending on your partner?',
    a: ["Very - we're a team", 'I lean on them a lot', 'I prefer self-reliance', 'I want to but it feels unsafe'],
    s: [0, 1, 2, 3]
  },
  {
    q: 'When things are going well in your relationship...',
    a: [
      'I feel content and grateful',
      "I worry it won't last",
      'I start creating distance',
      'I enjoy it but brace for the other shoe'
    ],
    s: [0, 1, 2, 3]
  },
  {
    q: 'What best describes your relationship ideal?',
    a: [
      'Close, balanced partnership',
      'Deep emotional fusion',
      'Respectful independence',
      'Intimacy without losing myself'
    ],
    s: [0, 1, 2, 3]
  }
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
      asStep = 0;
      asScores = [0, 0, 0, 0];
      renderASQuestion();
      showEl('as-quiz');
      hideEl('as-results');
    }
  });
}

function renderASQuestion() {
  if (asStep >= AS_QUIZ.length) {
    submitASResults();
    return;
  }
  const q = AS_QUIZ[asStep];
  document.getElementById('as-progress').textContent = `Question ${asStep + 1} of ${AS_QUIZ.length}`;
  document.getElementById('as-q-text').textContent = q.q;
  document.getElementById('as-options').innerHTML = q.a
    .map((a, i) => `<button class="ll-option" onclick="pickAS(${i})">${a}</button>`)
    .join('');
}

function pickAS(choice) {
  const q = AS_QUIZ[asStep];
  asScores[q.s[choice]] += 3;
  // Give secondary points to adjacent styles
  q.s.forEach((s, i) => {
    if (i !== choice) asScores[s] += 1;
  });
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
  hideEl('as-quiz');
  showEl('as-results');
  db.ref('attachmentStyle').on('value', snap => {
    const data = snap.val() || {};
    renderASProfile('as-my-result', data[user]);
    renderASProfile('as-partner-result', data[partner]);
    renderASCombo(data[user], data[partner]);
    renderASRadar(data[user], data[partner]);
    document.querySelectorAll('.uname').forEach(e => (e.textContent = NAMES[user]));
    document.querySelectorAll('.pname').forEach(e => (e.textContent = NAMES[partner]));
  });
}

function renderASProfile(containerId, data) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!data || !data.scores) {
    el.innerHTML = '<div style="font-size:12px;color:var(--t3)">Not taken yet</div>';
    return;
  }
  const scores = data.scores;
  const max = Math.max(...scores);
  const primary = scores.indexOf(max);
  const total = scores.reduce((s, v) => s + v, 0);
  el.innerHTML = `<div style="font-size:24px;margin-bottom:4px">${AS_ICONS[primary]}</div>
    <div style="font-size:14px;color:var(--cream);font-weight:600;margin-bottom:4px">${AS_NAMES[primary]}</div>
    <div style="font-size:10px;color:var(--t3);margin-bottom:8px;line-height:1.4">${AS_DESCRIPTIONS[AS_NAMES[primary]]}</div>
    ${scores
      .map((s, i) => {
        const pct = total ? Math.round((s / total) * 100) : 0;
        return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <span style="font-size:9px;min-width:55px;color:var(--t3)">${AS_NAMES[i]}</span>
        <div style="flex:1;height:4px;background:var(--bg3);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${AS_COLORS[i]};border-radius:2px;transition:width .6s ease"></div>
        </div>
        <span style="font-size:9px;color:var(--t3);min-width:25px;text-align:right">${pct}%</span>
      </div>`;
      })
      .join('')}`;
}

function renderASCombo(myData, theirData) {
  const el = document.getElementById('as-combo-tips');
  if (!el) return;
  if (!myData?.scores || !theirData?.scores) {
    el.innerHTML =
      '<div style="font-size:11px;color:var(--t3)">Both partners need to complete the quiz for combo insights.</div>';
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
    'Secure+Secure': {
      summary: 'The golden pair. You both bring stability, trust, and open communication.',
      tips: [
        "Keep nurturing what you have - don't take it for granted",
        'Push each other to grow even when comfortable',
        'Model healthy conflict resolution together'
      ]
    },
    'Anxious+Secure': {
      summary: 'The secure partner anchors the relationship. With patience, the anxious partner feels safe to relax.',
      tips: [
        'Secure: offer reassurance proactively, not just when asked',
        'Anxious: trust actions over your worries',
        'Set check-in rituals to build predictable closeness'
      ]
    },
    'Avoidant+Secure': {
      summary:
        'The secure partner creates space for connection without pressure. The avoidant partner can slowly open up.',
      tips: [
        'Secure: respect their need for space without taking it personally',
        'Avoidant: practice sharing one vulnerable thing per week',
        'Find activities you both enjoy doing together in parallel'
      ]
    },
    'Fearful-Avoidant+Secure': {
      summary: 'The secure partner provides a stable base. The FA partner is learning that closeness is safe.',
      tips: [
        'Secure: be consistent - your predictability is their medicine',
        'FA: notice when you push-pull and name it',
        'Build trust through small, repeated positive experiences'
      ]
    },
    'Anxious+Anxious': {
      summary: "Deep emotional connection but can spiral into mutual worry. You understand each other's needs deeply.",
      tips: [
        'Create rituals of reassurance for both of you',
        'When both anxious, take a breath before reacting',
        'Build individual hobbies to avoid codependency'
      ]
    },
    'Anxious+Avoidant': {
      summary: 'The classic push-pull dynamic. Different needs, but understanding the pattern is the first step.',
      tips: [
        'Anxious: give space without interpreting it as rejection',
        'Avoidant: small gestures of connection go a huge distance',
        'Agree on a signal for "I need space" vs "I need closeness"'
      ]
    },
    'Anxious+Fearful-Avoidant': {
      summary: 'Both crave connection but express it differently. Communication is key.',
      tips: [
        "Be explicit about needs - don't assume the other knows",
        'When triggered, say "I need a moment" instead of reacting',
        'Celebrate the small moments of vulnerability together'
      ]
    },
    'Avoidant+Avoidant': {
      summary: "You respect each other's independence. The challenge is building deeper emotional intimacy.",
      tips: [
        "Schedule intentional connection time - it won't happen organically",
        'Practice sharing one feeling per day, even small ones',
        'Physical proximity (cooking together, walks) builds closeness without pressure'
      ]
    },
    'Avoidant+Fearful-Avoidant': {
      summary:
        'Both tend to withdraw but for different reasons. Building trust happens through small consistent gestures.',
      tips: [
        'Create low-pressure ways to be close (side-by-side activities)',
        'FA: your need for closeness is valid - voice it',
        'Avoidant: lean into connection when it feels uncomfortable'
      ]
    },
    'Fearful-Avoidant+Fearful-Avoidant': {
      summary: "You deeply understand each other's push-pull. Together, you can build the safety you both need.",
      tips: [
        'Name the pattern when you see it: "I\'m pulling away because I\'m scared"',
        'Create a safe word for when either feels overwhelmed',
        "Celebrate every moment of vulnerability - it's brave"
      ]
    }
  };
  return (
    combos[key] || {
      summary: 'Your unique combination brings growth opportunities.',
      tips: [
        'Practice open communication daily',
        'Be patient with different emotional speeds',
        "Remember you're on the same team"
      ]
    }
  );
}

function renderASRadar(myData, theirData) {
  if (!myData?.scores || !theirData?.scores) return;
  const total1 = myData.scores.reduce((s, v) => s + v, 0) || 1;
  const total2 = theirData.scores.reduce((s, v) => s + v, 0) || 1;
  const dimensions = AS_NAMES.map((name, i) => ({
    label: name.substring(0, 7),
    partner1: user === 'partner1' ? (myData.scores[i] / total1) * 5 : (theirData.scores[i] / total2) * 5,
    partner2: user === 'partner2' ? (myData.scores[i] / total1) * 5 : (theirData.scores[i] / total2) * 5
  }));
  if (typeof renderRadarChart === 'function') renderRadarChart('as-radar', dimensions);
}

function retakeASQuiz() {
  asStep = 0;
  asScores = [0, 0, 0, 0];
  showEl('as-quiz');
  hideEl('as-results');
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
    db.ref('attachmentStyle').once('value')
  ]).then(([wyrSnap, totSnap, llSnap, asSnap]) => {
    let gameMatches = 0,
      gameTotal = 0;

    // WYR matches
    if (wyrSnap.exists())
      wyrSnap.forEach(c => {
        const d = c.val();
        if (d && d.partner1 && d.partner2) {
          gameTotal++;
          if (d.partner1 === d.partner2) gameMatches++;
        }
      });
    // TOT matches
    if (totSnap.exists())
      totSnap.forEach(c => {
        const d = c.val();
        if (d && d.partner1 && d.partner2) {
          gameTotal++;
          if (d.partner1 === d.partner2) gameMatches++;
        }
      });
    const gamePct = gameTotal ? gameMatches / gameTotal : 0;

    // Love Language alignment (cosine similarity)
    let llPct = 0;
    const llData = llSnap.val() || {};
    if (llData.partner1?.scores && llData.partner2?.scores) {
      const a = llData.partner1.scores,
        b = llData.partner2.scores;
      let dot = 0,
        magA = 0,
        magB = 0;
      for (let i = 0; i < 5; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
      }
      llPct = magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
    }

    // Attachment compatibility score
    let asPct = 0;
    const asData = asSnap.val() || {};
    if (asData.partner1?.scores && asData.partner2?.scores) {
      const herPrimary = asData.partner1.scores.indexOf(Math.max(...asData.partner1.scores));
      const himPrimary = asData.partner2.scores.indexOf(Math.max(...asData.partner2.scores));
      // Secure-Secure = best, Anxious-Avoidant = challenging, etc.
      const compatMatrix = [
        [1.0, 0.8, 0.7, 0.65], // Secure with...
        [0.8, 0.6, 0.45, 0.5], // Anxious with...
        [0.7, 0.45, 0.55, 0.5], // Avoidant with...
        [0.65, 0.5, 0.5, 0.45] // Fearful-Avoidant with...
      ];
      asPct = compatMatrix[herPrimary][himPrimary];
    }

    // Weighted composite
    const weights = { game: 0.4, ll: 0.3, as: 0.3 };
    let totalW = 0,
      totalS = 0;
    if (gameTotal > 0) {
      totalW += weights.game;
      totalS += gamePct * weights.game;
    }
    if (llData.partner1?.scores && llData.partner2?.scores) {
      totalW += weights.ll;
      totalS += llPct * weights.ll;
    }
    if (asData.partner1?.scores && asData.partner2?.scores) {
      totalW += weights.as;
      totalS += asPct * weights.as;
    }

    const pct = totalW ? Math.round((totalS / totalW) * 100) : 0;

    // Update UI
    const ring = document.getElementById('compat-ring');
    const score = document.getElementById('compat-score');
    if (ring) ring.setAttribute('stroke-dashoffset', String(327 - (pct / 100) * 327));
    if (score) score.textContent = pct + '%';

    // Update subtitle
    const sub = document.querySelector('#compat-ring + text + text') || document.querySelector('.donut-sub');

    // Show breakdown if element exists
    const bd = document.getElementById('compat-breakdown');
    if (bd) {
      const items = [];
      if (gameTotal > 0) items.push(`Games: ${Math.round(gamePct * 100)}%`);
      if (llData.partner1?.scores && llData.partner2?.scores) items.push(`Love Lang: ${Math.round(llPct * 100)}%`);
      if (asData.partner1?.scores && asData.partner2?.scores) items.push(`Attachment: ${Math.round(asPct * 100)}%`);
      bd.innerHTML = items
        .map(
          t =>
            `<span style="font-size:9px;padding:2px 8px;background:var(--bg3);border-radius:8px;color:var(--t3)">${t}</span>`
        )
        .join('');
    }

    // Dashboard quick note
    const dashQn = document.getElementById('dash-qn-compat');
    if (dashQn) dashQn.textContent = pct ? pct + '% compatible' : '';
  });
}

// ===== GAME FRAMEWORK =====
let activeGameKey = null;
let activeGameListener = null;

async function startGame(type, initialState) {
  if (!db || !user) return null;
  const ref = db.ref('games/sessions').push();
  const session = {
    type,
    ...initialState,
    startedBy: user,
    startedAt: Date.now(),
    endedAt: null,
    winner: null,
    status: 'active'
  };
  await ref.set(session);
  return ref.key;
}

function listenGame(key, renderFn) {
  if (activeGameListener) {
    db.ref('games/sessions/' + activeGameListener).off();
  }
  activeGameKey = key;
  activeGameListener = key;
  db.ref('games/sessions/' + key).on('value', snap => {
    const data = snap.val();
    if (data) renderFn(data, key);
  });
}

function stopListeningGame() {
  if (activeGameListener) {
    db.ref('games/sessions/' + activeGameListener).off();
    activeGameListener = null;
    activeGameKey = null;
  }
}

async function endGame(key, type, winner) {
  if (!db) return;
  await db.ref('games/sessions/' + key).update({ winner, status: 'finished', endedAt: Date.now() });
  // Update stats
  const myResult = winner === 'draw' ? 'd' : winner === user ? 'w' : 'l';
  const partnerResult = winner === 'draw' ? 'd' : winner === partner ? 'w' : 'l';
  const myStatsRef = db.ref('games/stats/' + user + '/' + type + '/' + myResult);
  const partnerStatsRef = db.ref('games/stats/' + partner + '/' + type + '/' + partnerResult);
  myStatsRef.transaction(v => (v || 0) + 1);
  partnerStatsRef.transaction(v => (v || 0) + 1);
  // Total games
  db.ref('games/stats/' + user + '/totalGames').transaction(v => (v || 0) + 1);
  db.ref('games/stats/' + partner + '/totalGames').transaction(v => (v || 0) + 1);
  // Win streak for winner
  if (winner !== 'draw' && winner) {
    db.ref('games/stats/' + winner + '/streak').transaction(v => (v || 0) + 1);
    const loser = winner === 'partner2' ? 'partner1' : 'partner2';
    db.ref('games/stats/' + loser + '/streak').set(0);
  }
  // Celebrate
  if (winner === user) {
    toast('You won! 🎉');
    if (typeof showConfetti === 'function') showConfetti();
    if (typeof awardXP === 'function') awardXP(15);
  } else if (winner === 'draw') {
    toast("It's a draw!");
  } else {
    toast(NAMES[partner] + ' won this round!');
  }
}

function renderAllGameStats() {
  const el = document.getElementById('game-stats-board');
  if (!el || !db) return;
  Promise.all([db.ref('games/stats/' + user).once('value'), db.ref('games/stats/' + partner).once('value')]).then(
    ([mySnap, theirSnap]) => {
      const my = mySnap.val() || {};
      const their = theirSnap.val() || {};
      const types = [
        { key: 'ttt', name: 'Tic-Tac-Toe', icon: '⊞' },
        { key: 'c4', name: 'Connect 4', icon: '⊚' },
        { key: 'memory', name: 'Memory', icon: '🃏' },
        { key: 'rps', name: 'Rock Paper Scissors', icon: '✊' },
        { key: 'emoji', name: 'Emoji Guess', icon: '🎭' },
        { key: '21q', name: '21 Questions', icon: '❓' },
        { key: 'ttal', name: '2 Truths', icon: '🤥' },
        { key: 'wordchain', name: 'Word Chain', icon: '🔗' },
        { key: 'trivia', name: 'Trivia', icon: '🧠' },
        { key: 'war', name: 'War', icon: '🃏' },
        { key: 'checkers', name: 'Checkers', icon: '🏁' },
        { key: 'gofish', name: 'Go Fish', icon: '🐟' },
        { key: 'hangman', name: 'Hangman', icon: '💀' },
        { key: 'battleship', name: 'Battleship', icon: '🚢' }
      ];
      const myTotal = my.totalGames || 0;
      const myWins = types.reduce((s, t) => s + (my[t.key]?.w || 0), 0);
      const theirWins = types.reduce((s, t) => s + (their[t.key]?.w || 0), 0);
      let html = `<div class="gs-summary">
      <div class="gs-total"><span class="gs-num">${myTotal}</span><span class="gs-label">Games Played</span></div>
      <div class="gs-vs">
        <span class="gs-me">${NAMES[user]}: ${myWins}</span>
        <span class="gs-vstext">vs</span>
        <span class="gs-them">${NAMES[partner]}: ${theirWins}</span>
      </div>
      ${my.streak ? `<div class="gs-streak">🔥 ${my.streak} win streak</div>` : ''}
    </div>`;
      html += '<div class="gs-grid">';
      types.forEach(t => {
        const m = my[t.key] || {};
        const total = (m.w || 0) + (m.l || 0) + (m.d || 0);
        if (total === 0) return;
        const winPct = total ? Math.round(((m.w || 0) / total) * 100) : 0;
        html += `<div class="gs-item">
        <div class="gs-icon">${t.icon}</div>
        <div class="gs-name">${t.name}</div>
        <div class="gs-bar"><div class="gs-bar-fill" style="width:${winPct}%"></div></div>
        <div class="gs-record">${m.w || 0}W ${m.l || 0}L ${m.d || 0}D</div>
      </div>`;
      });
      html += '</div>';
      el.innerHTML = html;
    }
  );
}

// Check for active game invite from partner
function listenGameInvites() {
  if (!db) return;
  db.ref('games/sessions')
    .orderByChild('status')
    .equalTo('active')
    .on('value', snap => {
      snap.forEach(c => {
        const g = c.val();
        if (g.startedBy === partner && g.status === 'active') {
          const el = document.getElementById('game-invite');
          if (el) {
            const names = {
              ttt: 'Tic-Tac-Toe',
              c4: 'Connect Four',
              memory: 'Memory Match',
              rps: 'Rock Paper Scissors',
              emoji: 'Emoji Guess',
              '21q': '21 Questions',
              ttal: 'Two Truths & a Lie',
              wordchain: 'Word Chain',
              trivia: 'Trivia',
              war: 'War',
              checkers: 'Checkers',
              gofish: 'Go Fish',
              hangman: 'Hangman',
              battleship: 'Battleship'
            };
            el.innerHTML = `<div class="game-invite-card">
            <span>${NAMES[partner]} wants to play <strong>${names[g.type] || g.type}</strong>!</span>
            <button class="gi-join" onclick="joinGame('${c.key}','${g.type}')">Join</button>
          </div>`;
            showEl(el);
          }
        }
      });
    });
}

function joinGame(key, type) {
  const el = document.getElementById('game-invite');
  if (el) {
    hideEl(el);
    el.innerHTML = '';
  }
  if (type === 'ttt') {
    listenGame(key, renderTTT);
    showGameView('ttt');
  } else if (type === 'c4') {
    listenGame(key, renderC4);
    showGameView('c4');
  } else if (type === 'memory') {
    listenGame(key, renderMemory);
    showGameView('memory');
  } else if (type === 'rps') {
    listenGame(key, renderRPS);
    showGameView('rps');
  } else if (type === 'emoji') {
    listenGame(key, renderEmoji);
    showGameView('emoji');
  } else if (type === '21q') {
    listenGame(key, render21Q);
    showGameView('21q');
  } else if (type === 'ttal') {
    listenGame(key, renderTTAL);
    showGameView('ttal');
  } else if (type === 'wordchain') {
    listenGame(key, renderWordChain);
    showGameView('wordchain');
  } else if (type === 'trivia') {
    listenGame(key, renderTrivia);
    showGameView('trivia');
  } else if (type === 'war') {
    listenGame(key, renderWar);
    showGameView('war');
  } else if (type === 'checkers') {
    listenGame(key, renderCheckers);
    showGameView('checkers');
  } else if (type === 'gofish') {
    listenGame(key, renderGoFish);
    showGameView('gofish');
  } else if (type === 'hangman') {
    listenGame(key, renderHangman);
    showGameView('hangman');
  } else if (type === 'battleship') {
    listenGame(key, renderBattleship);
    showGameView('battleship');
  }
}

function showGameView(game) {
  document.querySelectorAll('.game-view').forEach(el => hideEl(el));
  const el = document.getElementById('gv-' + game);
  showEl(el);
  hideEl('game-lobby');
}

function showGameLobby() {
  stopListeningGame();
  document.querySelectorAll('.game-view').forEach(el => hideEl(el));
  showEl('game-lobby');
  renderAllGameStats();
}

// ===== TIC-TAC-TOE =====
async function newTTT() {
  const board = Array(9).fill(null);
  const key = await startGame('ttt', { board, turn: user });
  if (key) {
    listenGame(key, renderTTT);
    showGameView('ttt');
  }
}

async function playTTT(idx) {
  if (!activeGameKey || !db) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const g = snap.val();
  if (!g || g.status !== 'active' || g.turn !== user || g.board[idx]) return;
  g.board[idx] = user;
  const winner = checkTTTWinner(g.board);
  const isDraw = !winner && g.board.every(c => c !== null);
  const updates = { board: g.board, turn: partner };
  if (winner) {
    updates.winner = winner;
    updates.status = 'finished';
    updates.endedAt = Date.now();
  } else if (isDraw) {
    updates.winner = 'draw';
    updates.status = 'finished';
    updates.endedAt = Date.now();
  }
  await db.ref('games/sessions/' + activeGameKey).update(updates);
  if (winner) endGame(activeGameKey, 'ttt', winner);
  else if (isDraw) endGame(activeGameKey, 'ttt', 'draw');
}

function checkTTTWinner(b) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (const [a, c, d] of lines) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}

function getTTTWinLine(b) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];
  for (const line of lines) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return line;
  }
  return null;
}

function renderTTT(data, key) {
  const el = document.getElementById('ttt-board');
  if (!el) return;
  const winLine = data.winner && data.winner !== 'draw' ? getTTTWinLine(data.board) : null;
  const isMyTurn = data.turn === user && data.status === 'active';
  const marker = data.startedBy; // starter is X

  let html = '<div class="ttt-grid">';
  data.board.forEach((cell, i) => {
    const isWin = winLine && winLine.includes(i);
    const cls = cell === marker ? 'x' : cell ? 'o' : '';
    const winCls = isWin ? ' win' : '';
    const canTap = !cell && isMyTurn ? ` onclick="playTTT(${i})"` : '';
    html += `<div class="ttt-cell ${cls}${winCls}"${canTap}></div>`;
  });
  html += '</div>';

  // Status
  if (data.status === 'finished') {
    const msg =
      data.winner === 'draw' ? "It's a draw!" : data.winner === user ? 'You won! 🎉' : NAMES[partner] + ' won!';
    html += `<div class="game-status">${msg}</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newTTT()">Rematch</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  } else {
    html += `<div class="game-status turn">${isMyTurn ? 'Your turn' : 'Waiting for ' + NAMES[partner] + '...'}</div>`;
  }
  el.innerHTML = html;
}

// ===== CONNECT FOUR =====
const C4_ROWS = 6,
  C4_COLS = 7;

async function newC4() {
  const board = Array(C4_ROWS)
    .fill(null)
    .map(() => Array(C4_COLS).fill(null));
  const key = await startGame('c4', { board, turn: user });
  if (key) {
    listenGame(key, renderC4);
    showGameView('c4');
  }
}

async function playC4(col) {
  if (!activeGameKey || !db) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const g = snap.val();
  if (!g || g.status !== 'active' || g.turn !== user) return;
  // Find lowest empty row in column
  let row = -1;
  for (let r = C4_ROWS - 1; r >= 0; r--) {
    if (!g.board[r][col]) {
      row = r;
      break;
    }
  }
  if (row === -1) return; // Column full
  g.board[row][col] = user;
  const winner = checkC4Winner(g.board);
  const isDraw = !winner && g.board[0].every(c => c !== null);
  const updates = { board: g.board, turn: partner, lastMove: { row, col } };
  if (winner) {
    updates.winner = winner;
    updates.status = 'finished';
    updates.endedAt = Date.now();
  } else if (isDraw) {
    updates.winner = 'draw';
    updates.status = 'finished';
    updates.endedAt = Date.now();
  }
  await db.ref('games/sessions/' + activeGameKey).update(updates);
  if (winner) endGame(activeGameKey, 'c4', winner);
  else if (isDraw) endGame(activeGameKey, 'c4', 'draw');
}

function checkC4Winner(b) {
  // Horizontal, vertical, diagonal checks
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      if (!b[r][c]) continue;
      const p = b[r][c];
      // Right
      if (c + 3 < C4_COLS && b[r][c + 1] === p && b[r][c + 2] === p && b[r][c + 3] === p) return p;
      // Down
      if (r + 3 < C4_ROWS && b[r + 1][c] === p && b[r + 2][c] === p && b[r + 3][c] === p) return p;
      // Diagonal down-right
      if (r + 3 < C4_ROWS && c + 3 < C4_COLS && b[r + 1][c + 1] === p && b[r + 2][c + 2] === p && b[r + 3][c + 3] === p)
        return p;
      // Diagonal down-left
      if (r + 3 < C4_ROWS && c - 3 >= 0 && b[r + 1][c - 1] === p && b[r + 2][c - 2] === p && b[r + 3][c - 3] === p)
        return p;
    }
  }
  return null;
}

function getC4WinCells(b) {
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      if (!b[r][c]) continue;
      const p = b[r][c];
      if (c + 3 < C4_COLS && b[r][c + 1] === p && b[r][c + 2] === p && b[r][c + 3] === p)
        return [
          [r, c],
          [r, c + 1],
          [r, c + 2],
          [r, c + 3]
        ];
      if (r + 3 < C4_ROWS && b[r + 1][c] === p && b[r + 2][c] === p && b[r + 3][c] === p)
        return [
          [r, c],
          [r + 1, c],
          [r + 2, c],
          [r + 3, c]
        ];
      if (r + 3 < C4_ROWS && c + 3 < C4_COLS && b[r + 1][c + 1] === p && b[r + 2][c + 2] === p && b[r + 3][c + 3] === p)
        return [
          [r, c],
          [r + 1, c + 1],
          [r + 2, c + 2],
          [r + 3, c + 3]
        ];
      if (r + 3 < C4_ROWS && c - 3 >= 0 && b[r + 1][c - 1] === p && b[r + 2][c - 2] === p && b[r + 3][c - 3] === p)
        return [
          [r, c],
          [r + 1, c - 1],
          [r + 2, c - 2],
          [r + 3, c - 3]
        ];
    }
  }
  return null;
}

function renderC4(data, key) {
  const el = document.getElementById('c4-board');
  if (!el) return;
  const winCells = data.winner && data.winner !== 'draw' ? getC4WinCells(data.board) : null;
  const isMyTurn = data.turn === user && data.status === 'active';
  const isNew = data.lastMove;

  let html = '<div class="c4-grid">';
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      const cell = data.board[r][c];
      const isWin = winCells && winCells.some(([wr, wc]) => wr === r && wc === c);
      const isDrop = isNew && isNew.row === r && isNew.col === c;
      const colorCls = cell === data.startedBy ? 'gold' : cell ? 'rose' : '';
      const winCls = isWin ? ' win' : '';
      const dropCls = isDrop ? ' drop' : '';
      const tap = !cell && isMyTurn ? ` onclick="playC4(${c})"` : '';
      html += `<div class="c4-cell${winCls}"${tap}>${cell ? `<div class="c4-piece ${colorCls}${dropCls}" style="${isDrop ? '--drop-rows:' + (r + 1) : ''}"></div>` : ''}</div>`;
    }
  }
  html += '</div>';

  if (data.status === 'finished') {
    const msg =
      data.winner === 'draw' ? "It's a draw!" : data.winner === user ? 'You won! 🎉' : NAMES[partner] + ' won!';
    html += `<div class="game-status">${msg}</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newC4()">Rematch</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  } else {
    html += `<div class="game-status turn">${isMyTurn ? 'Your turn - tap a column' : 'Waiting for ' + NAMES[partner] + '...'}</div>`;
  }
  el.innerHTML = html;
}

// ===== MEMORY MATCH =====
const MEM_EMOJIS = ['🌹', '🦋', '🌙', '💎', '🔥', '🌊', '⭐', '🍒', '🎭', '🦊', '🌻', '🎪', '🐙', '🎵', '🍄', '🦜'];
let memFlipped = [];
let memProcessing = false;

async function newMemory() {
  const emojis = MEM_EMOJIS.slice(0, 8);
  const deck = [...emojis, ...emojis];
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const key = await startGame('memory', {
    deck,
    revealed: Array(16).fill(false),
    matched: Array(16).fill(false),
    turn: user,
    scores: { him: 0, her: 0 },
    flipped: []
  });
  if (key) {
    memFlipped = [];
    memProcessing = false;
    listenGame(key, renderMemory);
    showGameView('memory');
  }
}

async function flipMemCard(idx) {
  if (!activeGameKey || !db || memProcessing) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const g = snap.val();
  if (!g || g.status !== 'active' || g.turn !== user || g.matched[idx] || g.revealed[idx]) return;

  const flipped = g.flipped || [];
  if (flipped.length >= 2) return;

  flipped.push(idx);
  g.revealed[idx] = true;

  if (flipped.length === 2) {
    memProcessing = true;
    const [a, b] = flipped;
    await db.ref('games/sessions/' + activeGameKey).update({ revealed: g.revealed, flipped });

    // Check match after a delay
    setTimeout(async () => {
      const freshSnap = await db.ref('games/sessions/' + activeGameKey).once('value');
      const fg = freshSnap.val();
      if (!fg) {
        memProcessing = false;
        return;
      }

      if (fg.deck[a] === fg.deck[b]) {
        // Match found
        fg.matched[a] = true;
        fg.matched[b] = true;
        fg.scores[user] = (fg.scores[user] || 0) + 1;
        const allMatched = fg.matched.every(Boolean);
        const updates = { matched: fg.matched, scores: fg.scores, flipped: [], revealed: fg.revealed };
        if (allMatched) {
          updates.status = 'finished';
          updates.endedAt = Date.now();
          const winner = fg.scores.partner2 > fg.scores.partner1 ? 'partner2' : fg.scores.partner1 > fg.scores.partner2 ? 'partner1' : 'draw';
          updates.winner = winner;
          await db.ref('games/sessions/' + activeGameKey).update(updates);
          endGame(activeGameKey, 'memory', winner);
        } else {
          // Same player goes again on match
          await db.ref('games/sessions/' + activeGameKey).update(updates);
        }
      } else {
        // No match - flip back, switch turns
        fg.revealed[a] = false;
        fg.revealed[b] = false;
        await db.ref('games/sessions/' + activeGameKey).update({
          revealed: fg.revealed,
          flipped: [],
          turn: partner
        });
      }
      memProcessing = false;
    }, 1000);
  } else {
    await db.ref('games/sessions/' + activeGameKey).update({ revealed: g.revealed, flipped });
  }
}

function renderMemory(data, key) {
  const el = document.getElementById('mem-board');
  if (!el) return;
  const isMyTurn = data.turn === user && data.status === 'active';

  let html = `<div class="mem-scores">
    <span class="${user === 'partner2' ? 'me' : ''}">${NAMES.partner2}: ${data.scores?.partner2 || 0}</span>
    <span class="${user === 'partner1' ? 'me' : ''}">${NAMES.partner1}: ${data.scores?.partner1 || 0}</span>
  </div>`;
  html += '<div class="mm-grid">';
  for (let i = 0; i < 16; i++) {
    const shown = data.revealed[i] || data.matched[i];
    const matched = data.matched[i];
    const canTap = isMyTurn && !shown && !memProcessing;
    html += `<div class="mem-card ${shown ? 'flipped' : ''} ${matched ? 'matched' : ''}" ${canTap ? `onclick="flipMemCard(${i})"` : ''}>
      <div class="mem-card-inner">
        <div class="mem-card-back"></div>
        <div class="mem-card-front">${data.deck[i]}</div>
      </div>
    </div>`;
  }
  html += '</div>';

  if (data.status === 'finished') {
    const msg =
      data.winner === 'draw' ? "It's a draw!" : data.winner === user ? 'You won! 🎉' : NAMES[partner] + ' won!';
    html += `<div class="game-status">${msg}</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newMemory()">Rematch</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  } else {
    html += `<div class="game-status turn">${isMyTurn ? 'Your turn - find a pair!' : 'Waiting for ' + NAMES[partner] + '...'}</div>`;
  }
  el.innerHTML = html;
}

// ===== ROCK PAPER SCISSORS =====
async function newRPS() {
  const key = await startGame('rps', {
    choices: { partner2: null, partner1: null },
    round: 1,
    totalScores: { partner2: 0, partner1: 0 },
    bestOf: 5,
    roundHistory: []
  });
  if (key) {
    listenGame(key, renderRPS);
    showGameView('rps');
  }
}

async function pickRPS(choice) {
  if (!activeGameKey || !db) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const g = snap.val();
  if (!g || g.status !== 'active' || g.choices[user]) return;
  await db.ref('games/sessions/' + activeGameKey + '/choices/' + user).set(choice);

  // Check if both have chosen
  const fresh = (await db.ref('games/sessions/' + activeGameKey).once('value')).val();
  if (fresh.choices.partner2 && fresh.choices.partner1) {
    // Resolve round
    const result = resolveRPS(fresh.choices.partner2, fresh.choices.partner1);
    const roundResult = { partner2: fresh.choices.partner2, partner1: fresh.choices.partner1, winner: result };
    const history = fresh.roundHistory || [];
    history.push(roundResult);
    const scores = fresh.totalScores || { partner2: 0, partner1: 0 };
    if (result !== 'draw') scores[result]++;
    const bestOf = fresh.bestOf || 5;
    const winsNeeded = Math.ceil(bestOf / 2);

    if (scores.partner2 >= winsNeeded || scores.partner1 >= winsNeeded) {
      const winner = scores.partner2 >= winsNeeded ? 'partner2' : 'partner1';
      await db.ref('games/sessions/' + activeGameKey).update({
        roundHistory: history,
        totalScores: scores,
        choices: { partner2: null, partner1: null },
        winner,
        status: 'finished',
        endedAt: Date.now(),
        lastResult: roundResult
      });
      endGame(activeGameKey, 'rps', winner);
    } else {
      await db.ref('games/sessions/' + activeGameKey).update({
        roundHistory: history,
        totalScores: scores,
        choices: { partner2: null, partner1: null },
        round: (fresh.round || 1) + 1,
        lastResult: roundResult
      });
    }
  }
}

function resolveRPS(a, b) {
  if (a === b) return 'draw';
  const wins = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
  return wins[a] === b ? 'partner2' : 'partner1';
}

const RPS_ICONS = { rock: '✊', paper: '✋', scissors: '✌️' };

function renderRPS(data, key) {
  const el = document.getElementById('rps-board');
  if (!el) return;
  const hasChosen = data.choices && data.choices[user];
  const bestOf = data.bestOf || 5;
  const winsNeeded = Math.ceil(bestOf / 2);

  let html = `<div class="rps-scorebar">
    <span class="${user === 'partner2' ? 'me' : ''}">${NAMES.partner2}: ${data.totalScores?.partner2 || 0}</span>
    <span class="rps-round">Round ${data.round || 1} · Best of ${bestOf}</span>
    <span class="${user === 'partner1' ? 'me' : ''}">${NAMES.partner1}: ${data.totalScores?.partner1 || 0}</span>
  </div>`;

  // Show last result
  if (data.lastResult) {
    const lr = data.lastResult;
    const msg = lr.winner === 'draw' ? 'Draw!' : lr.winner === user ? 'You won!' : NAMES[partner] + ' won!';
    html += `<div class="rps-last">
      <span>${RPS_ICONS[lr.partner2]}</span> vs <span>${RPS_ICONS[lr.partner1]}</span> - ${msg}
    </div>`;
  }

  if (data.status === 'active') {
    if (hasChosen) {
      html += `<div class="rps-waiting">
        <div class="rps-chosen">${RPS_ICONS[data.choices[user]]}</div>
        <div class="game-status turn">Waiting for ${NAMES[partner]}...</div>
      </div>`;
    } else {
      html += `<div class="rps-choices">
        <button class="rps-btn" onclick="pickRPS('rock')">${RPS_ICONS.rock}<span>Rock</span></button>
        <button class="rps-btn" onclick="pickRPS('paper')">${RPS_ICONS.paper}<span>Paper</span></button>
        <button class="rps-btn" onclick="pickRPS('scissors')">${RPS_ICONS.scissors}<span>Scissors</span></button>
      </div>`;
    }
  } else {
    const msg = data.winner === user ? 'You won the match! 🎉' : NAMES[partner] + ' won the match!';
    html += `<div class="game-status">${msg}</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newRPS()">Rematch</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ===== EMOJI GUESSING GAME =====
const EMOJI_PROMPTS = [
  { word: 'Pizza', hint: '🍕🧀🔥🇮🇹', cat: 'food' },
  { word: 'Beach', hint: '🏖️🌊☀️🐚', cat: 'places' },
  { word: 'Movie Night', hint: '🎬🍿🛋️🌙', cat: 'activities' },
  { word: 'Camping', hint: '⛺🔥🌲🏕️', cat: 'activities' },
  { word: 'Birthday', hint: '🎂🎈🎁🕯️', cat: 'events' },
  { word: 'Rainy Day', hint: '🌧️☔💧🌫️', cat: 'weather' },
  { word: 'Road Trip', hint: '🚗🗺️🎵🌅', cat: 'activities' },
  { word: 'Sushi', hint: '🍣🥢🐟🇯🇵', cat: 'food' },
  { word: 'Wedding', hint: '💒💍👰🤵', cat: 'events' },
  { word: 'Gym', hint: '🏋️💪🏃😤', cat: 'activities' },
  { word: 'Coffee', hint: '☕🫘😴→😊', cat: 'food' },
  { word: 'Snow Day', hint: '❄️⛄🧣☕', cat: 'weather' },
  { word: 'Dance', hint: '💃🕺🎵✨', cat: 'activities' },
  { word: 'Halloween', hint: '🎃👻🍬🦇', cat: 'events' },
  { word: 'Breakfast', hint: '🥞🍳☀️😋', cat: 'food' },
  { word: 'Sunset', hint: '🌅🧡💜🌊', cat: 'nature' },
  { word: 'Cat', hint: '🐱😺🐟🧶', cat: 'animals' },
  { word: 'Hiking', hint: '🥾⛰️🌲🏞️', cat: 'activities' },
  { word: 'Ice Cream', hint: '🍦🍨❄️😍', cat: 'food' },
  { word: 'Space', hint: '🚀🌌⭐🛸', cat: 'science' },
  { word: 'Cooking', hint: '👨‍🍳🍳🔪🧅', cat: 'activities' },
  { word: 'Puppy', hint: '🐶🐾🦴❤️', cat: 'animals' },
  { word: 'Music Festival', hint: '🎤🎸🎪🤘', cat: 'events' },
  { word: 'Garden', hint: '🌷🌻🦋🧑‍🌾', cat: 'nature' }
];

async function newEmojiGame() {
  // Pick a random prompt
  const prompt = EMOJI_PROMPTS[Math.floor(Math.random() * EMOJI_PROMPTS.length)];
  const key = await startGame('emoji', {
    answer: prompt.word,
    hint: prompt.hint,
    category: prompt.cat,
    clueGiver: user,
    guesser: partner,
    guesses: [],
    maxGuesses: 3,
    customClue: null
  });
  if (key) {
    listenGame(key, renderEmoji);
    showGameView('emoji');
  }
}

async function submitEmojiGuess() {
  if (!activeGameKey || !db) return;
  const input = document.getElementById('emoji-guess-input');
  if (!input) return;
  const guess = input.value.trim();
  if (!guess) return;
  input.value = '';

  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const g = snap.val();
  if (!g || g.status !== 'active' || g.guesser !== user) return;

  const guesses = g.guesses || [];
  const isCorrect = guess.toLowerCase() === g.answer.toLowerCase();
  guesses.push({ text: guess, correct: isCorrect, timestamp: Date.now() });

  if (isCorrect) {
    await db.ref('games/sessions/' + activeGameKey).update({
      guesses,
      winner: user,
      status: 'finished',
      endedAt: Date.now()
    });
    endGame(activeGameKey, 'emoji', user);
  } else if (guesses.length >= (g.maxGuesses || 3)) {
    await db.ref('games/sessions/' + activeGameKey).update({
      guesses,
      winner: g.clueGiver,
      status: 'finished',
      endedAt: Date.now()
    });
    endGame(activeGameKey, 'emoji', g.clueGiver);
  } else {
    await db.ref('games/sessions/' + activeGameKey).update({ guesses });
    toast(`Not quite! ${(g.maxGuesses || 3) - guesses.length} guesses left`);
  }
}

async function sendCustomEmoji() {
  if (!activeGameKey || !db) return;
  const input = document.getElementById('emoji-custom-clue');
  if (!input) return;
  const clue = input.value.trim();
  if (!clue) return;
  await db.ref('games/sessions/' + activeGameKey + '/customClue').set(clue);
  toast('Extra clue sent!');
  input.value = '';
}

function renderEmoji(data, key) {
  const el = document.getElementById('emoji-board');
  if (!el) return;
  const isGuesser = data.guesser === user;
  const guesses = data.guesses || [];

  let html = `<div class="emoji-category">${data.category || 'general'}</div>`;
  html += `<div class="emoji-clue-display">${data.hint}</div>`;

  if (data.customClue) {
    html += `<div class="emoji-extra-clue">Bonus clue: ${esc(data.customClue)}</div>`;
  }

  // Show guesses
  if (guesses.length) {
    html += '<div class="emoji-guesses">';
    guesses.forEach(g => {
      html += `<div class="emoji-guess ${g.correct ? 'correct' : 'wrong'}">${esc(g.text)} ${g.correct ? '✓' : '✗'}</div>`;
    });
    html += '</div>';
  }

  if (data.status === 'active') {
    if (isGuesser) {
      html += `<div class="emoji-guess-form">
        <input id="emoji-guess-input" class="quiz-q" placeholder="What's the answer?" onkeydown="if(event.key==='Enter')submitEmojiGuess()">
        <button class="game-btn" onclick="submitEmojiGuess()">Guess</button>
        <div class="emoji-remaining">${(data.maxGuesses || 3) - guesses.length} guesses left</div>
      </div>`;
    } else {
      html += `<div class="emoji-clue-giver">
        <div class="game-status turn">The answer is: <strong>${esc(data.answer)}</strong></div>
        <div style="font-size:12px;color:var(--t3);margin:8px 0">Waiting for ${NAMES[partner]} to guess...</div>
        <input id="emoji-custom-clue" class="quiz-q" placeholder="Send an extra emoji clue...">
        <button class="game-btn secondary" onclick="sendCustomEmoji()">Send Hint</button>
      </div>`;
    }
  } else {
    const msg = data.winner === user ? 'You won! 🎉' : NAMES[partner] + ' won!';
    html += `<div class="game-status">${msg}</div>`;
    html += `<div class="emoji-answer">The answer was: <strong>${esc(data.answer)}</strong></div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newEmojiGame()">New Round</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ===== 21 QUESTIONS =====
async function new21Q() {
  const key = await startGame('21q', {
    thinker: user,
    guesser: partner,
    questionsLeft: 21,
    questions: [],
    answer: '',
    phase: 'setup' // setup -> playing -> finished
  });
  if (!key) return;
  listenGame(key, render21Q);
  showGameView('21q');
}

async function set21QAnswer() {
  if (!activeGameKey) return;
  const input = document.getElementById('q21-answer-input');
  if (!input) return;
  const answer = input.value.trim();
  if (!answer) {
    toast('Enter your secret answer');
    return;
  }
  await db.ref('games/sessions/' + activeGameKey).update({ answer, phase: 'playing' });
}

async function ask21Q() {
  if (!activeGameKey) return;
  const input = document.getElementById('q21-question-input');
  if (!input) return;
  const q = input.value.trim();
  if (!q) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data || data.phase !== 'playing') return;
  const questions = data.questions || [];
  questions.push({ text: q, from: user, answer: null });
  await db.ref('games/sessions/' + activeGameKey).update({ questions, questionsLeft: (data.questionsLeft || 21) - 1 });
  input.value = '';
}

async function answer21Q(idx, ans) {
  if (!activeGameKey) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data) return;
  const questions = data.questions || [];
  if (questions[idx]) questions[idx].answer = ans;
  await db.ref('games/sessions/' + activeGameKey).update({ questions });
}

async function guess21Q() {
  if (!activeGameKey) return;
  const input = document.getElementById('q21-final-guess');
  if (!input) return;
  const guess = input.value.trim().toLowerCase();
  if (!guess) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data) return;
  const correct = guess === (data.answer || '').toLowerCase();
  const winner = correct ? data.guesser : data.thinker;
  await endGame(activeGameKey, '21q', winner);
  await db.ref('games/sessions/' + activeGameKey).update({ finalGuess: guess, correct });
}

function render21Q(data, key) {
  const el = document.getElementById('q21-board');
  if (!el) return;
  const isThinker = data.thinker === user;
  const questions = data.questions || [];

  let html = `<div class="q21-counter">${data.questionsLeft || 0} questions left</div>`;

  if (data.phase === 'setup') {
    if (isThinker) {
      html += `<div class="q21-setup">
        <div class="game-status">Think of something - a person, place, or thing</div>
        <input id="q21-answer-input" class="quiz-q" placeholder="Type your secret answer..." onkeydown="if(event.key==='Enter')set21QAnswer()">
        <button class="game-btn" onclick="set21QAnswer()">Lock it in</button>
      </div>`;
    } else {
      html += `<div class="game-status turn">${NAMES[partner]} is thinking of something...</div>`;
    }
  } else if (data.phase === 'playing' || data.status === 'active') {
    // Show Q&A history
    if (questions.length) {
      html += '<div class="q21-history">';
      questions.forEach((q, i) => {
        html += `<div class="q21-item">
          <div class="q21-q">${esc(q.text)}</div>`;
        if (q.answer !== null) {
          html += `<div class="q21-a ${q.answer}">${q.answer === 'yes' ? '✓ Yes' : q.answer === 'no' ? '✗ No' : '~ Maybe'}</div>`;
        } else if (isThinker) {
          html += `<div class="q21-btns">
            <button class="q21-ans yes" onclick="answer21Q(${i},'yes')">Yes</button>
            <button class="q21-ans no" onclick="answer21Q(${i},'no')">No</button>
            <button class="q21-ans maybe" onclick="answer21Q(${i},'maybe')">Maybe</button>
          </div>`;
        } else {
          html += `<div class="q21-a pending">Waiting...</div>`;
        }
        html += '</div>';
      });
      html += '</div>';
    }

    if (!isThinker && data.questionsLeft > 0) {
      html += `<div class="q21-ask">
        <input id="q21-question-input" class="quiz-q" placeholder="Ask a yes/no question..." onkeydown="if(event.key==='Enter')ask21Q()">
        <button class="game-btn" onclick="ask21Q()">Ask</button>
      </div>`;
      html += `<div class="q21-guess-section" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--bdr-s)">
        <div style="font-size:11px;color:var(--t3);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Ready to guess?</div>
        <input id="q21-final-guess" class="quiz-q" placeholder="Your final guess..." onkeydown="if(event.key==='Enter')guess21Q()">
        <button class="game-btn" onclick="guess21Q()">Final Guess</button>
      </div>`;
    } else if (!isThinker && data.questionsLeft <= 0) {
      html += `<div class="q21-guess-section">
        <div class="game-status">No questions left - make your guess!</div>
        <input id="q21-final-guess" class="quiz-q" placeholder="Your final guess...">
        <button class="game-btn" onclick="guess21Q()">Final Guess</button>
      </div>`;
    } else {
      html += `<div class="game-status turn">Waiting for ${NAMES[partner]} to ask or guess...</div>`;
    }
  }

  if (data.status === 'finished') {
    html = `<div class="q21-counter">${21 - (data.questionsLeft || 0)} questions used</div>`;
    html += `<div class="game-status">${data.correct ? NAMES[data.guesser] + ' guessed it!' : NAMES[data.thinker] + ' stumped them!'}</div>`;
    html += `<div style="text-align:center;font-size:14px;color:var(--t2);margin:8px 0">The answer was: <strong>${esc(data.answer)}</strong></div>`;
    if (data.finalGuess)
      html += `<div style="text-align:center;font-size:12px;color:var(--t3)">Guess: "${esc(data.finalGuess)}"</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="new21Q()">Play Again</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ===== TWO TRUTHS AND A LIE =====
async function newTTAL() {
  const key = await startGame('ttal', {
    writer: user,
    guesser: partner,
    statements: [],
    lieIndex: -1,
    guess: -1,
    phase: 'setup'
  });
  if (!key) return;
  listenGame(key, renderTTAL);
  showGameView('ttal');
}

async function submitTTAL() {
  if (!activeGameKey) return;
  const s1 = document.getElementById('ttal-s1')?.value.trim();
  const s2 = document.getElementById('ttal-s2')?.value.trim();
  const s3 = document.getElementById('ttal-s3')?.value.trim();
  const lieIdx = parseInt(document.querySelector('input[name="ttal-lie"]:checked')?.value);
  if (!s1 || !s2 || !s3) {
    toast('Fill in all three statements');
    return;
  }
  if (isNaN(lieIdx)) {
    toast('Select which one is the lie');
    return;
  }
  await db.ref('games/sessions/' + activeGameKey).update({
    statements: [s1, s2, s3],
    lieIndex: lieIdx,
    phase: 'guessing'
  });
}

async function guessTTAL(idx) {
  if (!activeGameKey) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data) return;
  const correct = idx === data.lieIndex;
  const winner = correct ? data.guesser : data.writer;
  await db.ref('games/sessions/' + activeGameKey).update({ guess: idx });
  await endGame(activeGameKey, 'ttal', winner);
}

function renderTTAL(data, key) {
  const el = document.getElementById('ttal-board');
  if (!el) return;
  const isWriter = data.writer === user;

  let html = '';
  if (data.phase === 'setup') {
    if (isWriter) {
      html += `<div class="game-status">Write two truths and one lie about yourself</div>
        <div class="ttal-form">
          <div class="ttal-input-row">
            <input type="radio" name="ttal-lie" value="0" id="ttal-r0"><label for="ttal-r0" class="ttal-lie-label">Lie</label>
            <input id="ttal-s1" class="quiz-q" placeholder="Statement 1...">
          </div>
          <div class="ttal-input-row">
            <input type="radio" name="ttal-lie" value="1" id="ttal-r1"><label for="ttal-r1" class="ttal-lie-label">Lie</label>
            <input id="ttal-s2" class="quiz-q" placeholder="Statement 2...">
          </div>
          <div class="ttal-input-row">
            <input type="radio" name="ttal-lie" value="2" id="ttal-r2"><label for="ttal-r2" class="ttal-lie-label">Lie</label>
            <input id="ttal-s3" class="quiz-q" placeholder="Statement 3...">
          </div>
          <button class="game-btn" onclick="submitTTAL()">Submit</button>
        </div>`;
    } else {
      html += `<div class="game-status turn">${NAMES[partner]} is writing their statements...</div>`;
    }
  } else if (data.phase === 'guessing' && data.status === 'active') {
    html += `<div class="game-status">${isWriter ? 'Waiting for ' + NAMES[partner] + ' to guess the lie...' : 'Which one is the lie?'}</div>`;
    html += '<div class="ttal-statements">';
    data.statements.forEach((s, i) => {
      if (!isWriter) {
        html += `<button class="ttal-stmt" onclick="guessTTAL(${i})">${esc(s)}</button>`;
      } else {
        html += `<div class="ttal-stmt static">${esc(s)} ${i === data.lieIndex ? '<span class="ttal-lie-mark">← the lie</span>' : ''}</div>`;
      }
    });
    html += '</div>';
  }

  if (data.status === 'finished') {
    const correct = data.guess === data.lieIndex;
    html += `<div class="game-status">${correct ? NAMES[data.guesser] + ' found the lie!' : NAMES[data.writer] + ' fooled them!'}</div>`;
    html += '<div class="ttal-statements">';
    data.statements.forEach((s, i) => {
      const cls = i === data.lieIndex ? 'lie' : 'truth';
      const picked = i === data.guess ? ' picked' : '';
      html += `<div class="ttal-stmt result ${cls}${picked}">${esc(s)} <span class="ttal-badge">${i === data.lieIndex ? '🤥 LIE' : '✓ TRUE'}</span></div>`;
    });
    html += '</div>';
    html += `<div class="game-actions"><button class="game-btn" onclick="newTTAL()">Play Again</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ===== WORD CHAIN =====
async function newWordChain() {
  const categories = ['animals', 'food', 'places', 'movies', 'anything'];
  const cat = categories[Math.floor(Math.random() * categories.length)];
  const starters = { animals: 'cat', food: 'pizza', places: 'Paris', movies: 'Avatar', anything: 'love' };
  const key = await startGame('wordchain', {
    turn: user,
    category: cat,
    words: [{ word: starters[cat], by: 'system' }],
    scores: { her: 0, him: 0 },
    timer: 15,
    lastTime: Date.now()
  });
  if (!key) return;
  listenGame(key, renderWordChain);
  showGameView('wordchain');
}

async function submitWord() {
  if (!activeGameKey) return;
  const input = document.getElementById('wc-word-input');
  if (!input) return;
  const word = input.value.trim().toLowerCase();
  if (!word) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data || data.turn !== user || data.status !== 'active') return;
  const words = data.words || [];
  const lastWord = words[words.length - 1].word.toLowerCase();
  const lastChar = lastWord.charAt(lastWord.length - 1);

  // Validate: starts with last letter of previous word
  if (word.charAt(0) !== lastChar) {
    toast('Word must start with "' + lastChar.toUpperCase() + '"');
    return;
  }
  // No repeats
  if (words.some(w => w.word.toLowerCase() === word)) {
    toast('Already used!');
    return;
  }

  words.push({ word, by: user });
  const scores = data.scores || { her: 0, him: 0 };
  scores[user] = (scores[user] || 0) + 1;
  await db.ref('games/sessions/' + activeGameKey).update({
    words,
    scores,
    turn: partner,
    lastTime: Date.now()
  });
  input.value = '';
}

async function passWordChain() {
  if (!activeGameKey) return;
  // Passing means you lose
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data || data.status !== 'active') return;
  await endGame(activeGameKey, 'wordchain', partner);
}

function renderWordChain(data, key) {
  const el = document.getElementById('wc-board');
  if (!el) return;
  const isMyTurn = data.turn === user;
  const words = data.words || [];
  const lastWord = words.length ? words[words.length - 1].word : '';
  const nextLetter = lastWord.charAt(lastWord.length - 1).toUpperCase();
  const scores = data.scores || { her: 0, him: 0 };

  let html = `<div class="wc-scorebar">
    <span class="me">${NAMES[user]}: ${scores[user] || 0}</span>
    <span class="wc-cat">${data.category || 'anything'}</span>
    <span>${NAMES[partner]}: ${scores[partner] || 0}</span>
  </div>`;

  // Word chain display
  html += '<div class="wc-chain">';
  const recent = words.slice(-8);
  recent.forEach(w => {
    const cls = w.by === user ? 'me' : w.by === partner ? 'them' : 'system';
    html += `<div class="wc-word ${cls}">${esc(w.word)}</div>`;
  });
  html += '</div>';

  if (data.status === 'active') {
    if (isMyTurn) {
      html += `<div class="wc-prompt">Word starting with <strong>"${nextLetter}"</strong></div>`;
      html += `<div class="wc-input-row">
        <input id="wc-word-input" class="quiz-q" placeholder="Type a word..." onkeydown="if(event.key==='Enter')submitWord()" style="flex:1">
        <button class="game-btn" onclick="submitWord()">Go</button>
      </div>`;
      html += `<button class="game-btn secondary" onclick="passWordChain()" style="margin-top:8px;width:100%">I give up</button>`;
    } else {
      html += `<div class="game-status turn">Waiting for ${NAMES[partner]} - next letter: "${nextLetter}"</div>`;
    }
  } else {
    html += `<div class="game-status">${data.winner === user ? 'You won!' : NAMES[partner] + ' won!'} Chain: ${words.length - 1} words</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newWordChain()">Play Again</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ===== TRIVIA =====
const TRIVIA_QUESTIONS = [
  { q: "What's the hardest natural substance?", a: 'Diamond', opts: ['Diamond', 'Gold', 'Titanium', 'Quartz'] },
  { q: 'Which planet is known as the Red Planet?', a: 'Mars', opts: ['Venus', 'Mars', 'Jupiter', 'Mercury'] },
  { q: 'How many bones are in the adult human body?', a: '206', opts: ['206', '208', '186', '212'] },
  { q: 'What year did the Titanic sink?', a: '1912', opts: ['1905', '1912', '1920', '1898'] },
  { q: 'Which country has the most time zones?', a: 'France', opts: ['Russia', 'USA', 'France', 'China'] },
  {
    q: "What's the smallest country in the world?",
    a: 'Vatican City',
    opts: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein']
  },
  {
    q: 'Who painted the Mona Lisa?',
    a: 'Leonardo da Vinci',
    opts: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello']
  },
  { q: "What's the longest river in the world?", a: 'Nile', opts: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'] },
  { q: "Which element has the chemical symbol 'Au'?", a: 'Gold', opts: ['Silver', 'Gold', 'Iron', 'Aluminum'] },
  { q: 'In what year did World War II end?', a: '1945', opts: ['1943', '1944', '1945', '1946'] },
  { q: "What's the capital of Australia?", a: 'Canberra', opts: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'] },
  { q: 'How many hearts does an octopus have?', a: '3', opts: ['1', '2', '3', '4'] },
  {
    q: 'Which language has the most native speakers?',
    a: 'Mandarin Chinese',
    opts: ['English', 'Mandarin Chinese', 'Spanish', 'Hindi']
  },
  { q: "What's the largest ocean?", a: 'Pacific', opts: ['Atlantic', 'Pacific', 'Indian', 'Arctic'] },
  { q: 'What color do you get mixing blue and yellow?', a: 'Green', opts: ['Green', 'Purple', 'Orange', 'Brown'] },
  { q: 'Which planet has the most moons?', a: 'Saturn', opts: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'] },
  { q: 'What year was the first iPhone released?', a: '2007', opts: ['2005', '2006', '2007', '2008'] },
  { q: "What's the fastest land animal?", a: 'Cheetah', opts: ['Lion', 'Cheetah', 'Gazelle', 'Horse'] },
  { q: 'How many strings does a standard guitar have?', a: '6', opts: ['4', '5', '6', '8'] },
  {
    q: 'What gas do plants absorb from the air?',
    a: 'Carbon dioxide',
    opts: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Hydrogen']
  }
];

async function newTrivia() {
  // Pick 5 random questions
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
  const key = await startGame('trivia', {
    questions: shuffled.map(q => ({ ...q, opts: q.opts.sort(() => Math.random() - 0.5) })),
    current: 0,
    scores: { her: 0, him: 0 },
    answers: { her: [], him: [] },
    turn: user
  });
  if (!key) return;
  listenGame(key, renderTrivia);
  showGameView('trivia');
}

async function answerTrivia(answer) {
  if (!activeGameKey) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data || data.status !== 'active' || data.turn !== user) return;
  const q = data.questions[data.current];
  const correct = answer === q.a;
  const scores = data.scores || { her: 0, him: 0 };
  const answers = data.answers || { her: [], him: [] };
  if (correct) scores[user] = (scores[user] || 0) + 1;
  answers[user] = answers[user] || [];
  answers[user].push({ q: data.current, picked: answer, correct });

  // Check if partner also answered this question
  const partnerAnswers = answers[partner] || [];
  const partnerAnswered = partnerAnswers.some(a => a.q === data.current);

  let updates = { scores, answers };
  if (partnerAnswered) {
    // Both answered - move to next question
    if (data.current + 1 >= data.questions.length) {
      // Game over
      const w = scores[user] > scores[partner] ? user : scores[partner] > scores[user] ? partner : 'draw';
      updates.turn = null;
      await db.ref('games/sessions/' + activeGameKey).update(updates);
      await endGame(activeGameKey, 'trivia', w);
      return;
    } else {
      updates.current = data.current + 1;
      updates.turn = user; // both can answer
    }
  } else {
    updates.turn = partner; // wait for partner
  }
  await db.ref('games/sessions/' + activeGameKey).update(updates);
}

function renderTrivia(data, key) {
  const el = document.getElementById('trivia-board');
  if (!el) return;
  const scores = data.scores || { her: 0, him: 0 };
  const myAnswers = (data.answers && data.answers[user]) || [];
  const current = data.current || 0;

  let html = `<div class="trivia-scorebar">
    <span class="me">${NAMES[user]}: ${scores[user] || 0}</span>
    <span class="trivia-round">Q${current + 1} of ${data.questions.length}</span>
    <span>${NAMES[partner]}: ${scores[partner] || 0}</span>
  </div>`;

  if (data.status === 'active') {
    const q = data.questions[current];
    const alreadyAnswered = myAnswers.some(a => a.q === current);

    html += `<div class="trivia-question">${esc(q.q)}</div>`;
    html += '<div class="trivia-opts">';
    q.opts.forEach(opt => {
      if (alreadyAnswered) {
        const myPick = myAnswers.find(a => a.q === current);
        const cls = opt === q.a ? 'correct' : myPick && myPick.picked === opt ? 'wrong' : '';
        html += `<div class="trivia-opt ${cls} disabled">${esc(opt)}</div>`;
      } else {
        html += `<button class="trivia-opt" onclick="answerTrivia('${esc(opt)}')">${esc(opt)}</button>`;
      }
    });
    html += '</div>';

    if (alreadyAnswered) {
      html += `<div class="game-status turn">Waiting for ${NAMES[partner]}...</div>`;
    }
  } else {
    // Finished
    const w = data.winner;
    html += `<div class="game-status">${w === 'draw' ? "It's a tie!" : w === user ? 'You won!' : NAMES[partner] + ' won!'}</div>`;
    html += `<div style="text-align:center;font-size:14px;color:var(--t2);margin:8px 0">${scores[user] || 0} - ${scores[partner] || 0}</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newTrivia()">Play Again</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ===== WAR (CARD GAME) =====
function buildDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  suits.forEach(s => ranks.forEach(r => deck.push({ rank: r, suit: s, value: ranks.indexOf(r) + 2 })));
  return deck.sort(() => Math.random() - 0.5);
}

async function newWar() {
  const deck = buildDeck();
  const half = Math.floor(deck.length / 2);
  const key = await startGame('war', {
    deck1: deck.slice(0, half),
    deck2: deck.slice(half),
    played: { p1: null, p2: null },
    warPile: [],
    round: 0,
    phase: 'flip'
  });
  if (!key) return;
  listenGame(key, renderWar);
  showGameView('war');
}

async function flipWar() {
  if (!activeGameKey) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data || data.status !== 'active' || data.phase !== 'flip') return;
  const isP1 = data.startedBy === user;
  const myDeck = isP1 ? 'deck1' : 'deck2';
  const mySlot = isP1 ? 'p1' : 'p2';
  const deck = data[myDeck] || [];
  if (!deck.length) return;
  const played = data.played || { p1: null, p2: null };
  if (played[mySlot]) return;
  const card = deck.shift();
  played[mySlot] = card;
  const updates = { played };
  updates[myDeck] = deck;
  const otherSlot = isP1 ? 'p2' : 'p1';
  if (played[otherSlot]) updates.phase = 'reveal';
  await db.ref('games/sessions/' + activeGameKey).update(updates);
}

async function resolveWar() {
  if (!activeGameKey) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data || data.phase !== 'reveal') return;
  const p = data.played || {};
  if (!p.p1 || !p.p2) return;
  const pile = data.warPile || [];
  const allCards = [...pile, p.p1, p.p2];
  let deck1 = data.deck1 || [];
  let deck2 = data.deck2 || [];

  if (p.p1.value > p.p2.value) {
    deck1 = [...deck1, ...allCards.sort(() => Math.random() - 0.5)];
    await db.ref('games/sessions/' + activeGameKey).update({
      deck1,
      deck2,
      played: { p1: null, p2: null },
      warPile: [],
      phase: 'flip',
      round: (data.round || 0) + 1,
      lastWinner: 'p1'
    });
  } else if (p.p2.value > p.p1.value) {
    deck2 = [...deck2, ...allCards.sort(() => Math.random() - 0.5)];
    await db.ref('games/sessions/' + activeGameKey).update({
      deck1,
      deck2,
      played: { p1: null, p2: null },
      warPile: [],
      phase: 'flip',
      round: (data.round || 0) + 1,
      lastWinner: 'p2'
    });
  } else {
    const faceDown1 = deck1.splice(0, Math.min(3, deck1.length));
    const faceDown2 = deck2.splice(0, Math.min(3, deck2.length));
    const newPile = [...allCards, ...faceDown1, ...faceDown2];
    await db.ref('games/sessions/' + activeGameKey).update({
      deck1,
      deck2,
      played: { p1: null, p2: null },
      warPile: newPile,
      phase: 'flip',
      round: (data.round || 0) + 1,
      lastWinner: 'war'
    });
  }
  const updated = (await db.ref('games/sessions/' + activeGameKey).once('value')).val();
  if (updated && updated.status === 'active') {
    if (!(updated.deck1 || []).length && !updated.played?.p1) {
      await endGame(activeGameKey, 'war', updated.startedBy === 'partner2' ? 'partner1' : 'partner2');
    } else if (!(updated.deck2 || []).length && !updated.played?.p2) {
      await endGame(activeGameKey, 'war', updated.startedBy);
    }
  }
}

function cardDisplay(card) {
  if (!card) return '<div class="war-card facedown">?</div>';
  const color = card.suit === '♥' || card.suit === '♦' ? 'red' : 'black';
  return `<div class="war-card ${color}">${card.rank}<span>${card.suit}</span></div>`;
}

function renderWar(data, key) {
  const el = document.getElementById('war-board');
  if (!el) return;
  const isP1 = data.startedBy === user;
  const myDeck = isP1 ? data.deck1 : data.deck2;
  const theirDeck = isP1 ? data.deck2 : data.deck1;
  const myPlayed = isP1 ? data.played?.p1 : data.played?.p2;
  const theirPlayed = isP1 ? data.played?.p2 : data.played?.p1;
  const warPile = data.warPile || [];

  let html = `<div class="war-scores">
    <span class="me">${NAMES[user]}: ${(myDeck || []).length}</span>
    <span class="war-round">Round ${(data.round || 0) + 1}</span>
    <span>${NAMES[partner]}: ${(theirDeck || []).length}</span>
  </div>`;

  html += '<div class="war-field">';
  html += `<div class="war-side"><div class="war-label">${NAMES[partner]}</div>${theirPlayed && data.phase === 'reveal' ? cardDisplay(theirPlayed) : theirPlayed ? '<div class="war-card facedown">?</div>' : '<div class="war-card-slot"></div>'}</div>`;
  if (warPile.length) html += `<div class="war-pile-badge">WAR! ${warPile.length} cards</div>`;
  html += `<div class="war-side"><div class="war-label">${NAMES[user]}</div>${myPlayed ? cardDisplay(myPlayed) : '<div class="war-card-slot"></div>'}</div>`;
  html += '</div>';

  if (data.lastWinner && data.phase === 'flip') {
    const msg =
      data.lastWinner === 'war'
        ? 'WAR! Tied - play again!'
        : (data.lastWinner === 'p1') === isP1
          ? 'You won the round!'
          : NAMES[partner] + ' won the round!';
    html += `<div class="war-result">${msg}</div>`;
  }

  if (data.status === 'active') {
    if (data.phase === 'flip') {
      if (!myPlayed) {
        html += `<button class="game-btn war-flip-btn" onclick="flipWar()">Flip Card</button>`;
      } else {
        html += `<div class="game-status turn">Waiting for ${NAMES[partner]} to flip...</div>`;
      }
    } else if (data.phase === 'reveal') {
      html += `<button class="game-btn" onclick="resolveWar()">Continue</button>`;
    }
  } else {
    html += `<div class="game-status">${data.winner === user ? 'You won the war!' : NAMES[partner] + ' won!'}</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newWar()">Play Again</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ===== CHECKERS =====
function initCheckersBoard() {
  const board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { color: 'dark', king: false };
    }
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) board[r][c] = { color: 'light', king: false };
    }
  return board;
}

let checkersSelected = null;

async function newCheckers() {
  const board = initCheckersBoard();
  const key = await startGame('checkers', {
    board,
    turn: user,
    lightPlayer: user,
    darkPlayer: partner
  });
  if (!key) return;
  checkersSelected = null;
  listenGame(key, renderCheckers);
  showGameView('checkers');
}

function getCheckerMoves(board, r, c, piece) {
  if (!piece) return [];
  const moves = [];
  const dirs =
    piece.color === 'light'
      ? [
          [-1, -1],
          [-1, 1]
        ]
      : [
          [1, -1],
          [1, 1]
        ];
  if (piece.king) {
    dirs.push(
      ...(piece.color === 'light'
        ? [
            [1, -1],
            [1, 1]
          ]
        : [
            [-1, -1],
            [-1, 1]
          ])
    );
  }
  dirs.forEach(([dr, dc]) => {
    const nr = r + dr,
      nc = c + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      if (!board[nr][nc]) {
        moves.push({ r: nr, c: nc, jump: false });
      } else if (board[nr][nc].color !== piece.color) {
        const jr = nr + dr,
          jc = nc + dc;
        if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && !board[jr][jc]) {
          moves.push({ r: jr, c: jc, jump: true, captureR: nr, captureC: nc });
        }
      }
    }
  });
  return moves;
}

async function clickChecker(r, c) {
  if (!activeGameKey) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data || data.status !== 'active' || data.turn !== user) return;
  const board = data.board;
  const myColor = data.lightPlayer === user ? 'light' : 'dark';

  if (checkersSelected) {
    const { sr, sc } = checkersSelected;
    const piece = board[sr][sc];
    if (!piece || piece.color !== myColor) {
      checkersSelected = null;
      return;
    }
    const moves = getCheckerMoves(board, sr, sc, piece);
    const move = moves.find(m => m.r === r && m.c === c);
    if (!move) {
      if (board[r][c] && board[r][c].color === myColor) {
        checkersSelected = { sr: r, sc: c };
        renderCheckers(data, activeGameKey);
      } else {
        checkersSelected = null;
        renderCheckers(data, activeGameKey);
      }
      return;
    }
    board[r][c] = piece;
    board[sr][sc] = null;
    if (move.jump) board[move.captureR][move.captureC] = null;
    if (piece.color === 'light' && r === 0) piece.king = true;
    if (piece.color === 'dark' && r === 7) piece.king = true;

    let extraJumps = [];
    if (move.jump) {
      extraJumps = getCheckerMoves(board, r, c, piece).filter(m => m.jump);
    }

    checkersSelected = null;
    if (move.jump && extraJumps.length) {
      checkersSelected = { sr: r, sc: c };
      await db.ref('games/sessions/' + activeGameKey).update({ board });
    } else {
      const opColor = myColor === 'light' ? 'dark' : 'light';
      let opPieces = 0;
      board.forEach(row =>
        row.forEach(cell => {
          if (cell && cell.color === opColor) opPieces++;
        })
      );
      if (opPieces === 0) {
        await db.ref('games/sessions/' + activeGameKey).update({ board });
        await endGame(activeGameKey, 'checkers', user);
      } else {
        await db.ref('games/sessions/' + activeGameKey).update({ board, turn: partner });
      }
    }
  } else {
    if (board[r][c] && board[r][c].color === myColor) {
      checkersSelected = { sr: r, sc: c };
      renderCheckers(data, activeGameKey);
    }
  }
}

function renderCheckers(data, key) {
  const el = document.getElementById('checkers-board');
  if (!el) return;
  const board = data.board;
  const myColor = data.lightPlayer === user ? 'light' : 'dark';
  const isMyTurn = data.turn === user;

  let lightCount = 0,
    darkCount = 0;
  board.forEach(row =>
    row.forEach(cell => {
      if (cell) {
        if (cell.color === 'light') lightCount++;
        else darkCount++;
      }
    })
  );
  const myCount = myColor === 'light' ? lightCount : darkCount;
  const theirCount = myColor === 'light' ? darkCount : lightCount;

  let html = `<div class="ck-scores"><span class="me">${NAMES[user]}: ${myCount}</span><span>${NAMES[partner]}: ${theirCount}</span></div>`;

  let validMoves = [];
  if (checkersSelected && isMyTurn) {
    const { sr, sc } = checkersSelected;
    const piece = board[sr][sc];
    if (piece) validMoves = getCheckerMoves(board, sr, sc, piece);
  }

  const flip = myColor === 'dark';
  html += '<div class="ck-grid">';
  for (let ri = 0; ri < 8; ri++) {
    for (let ci = 0; ci < 8; ci++) {
      const r = flip ? 7 - ri : ri;
      const c = flip ? 7 - ci : ci;
      const isDark = (r + c) % 2 === 1;
      const cell = board[r][c];
      const isSelected = checkersSelected && checkersSelected.sr === r && checkersSelected.sc === c;
      const isValidDest = validMoves.some(m => m.r === r && m.c === c);
      let cls = isDark ? 'ck-cell dark' : 'ck-cell light';
      if (isSelected) cls += ' selected';
      if (isValidDest) cls += ' valid-move';
      let inner = '';
      if (cell) {
        inner = `<div class="ck-piece ${cell.color}${cell.king ? ' king' : ''}">${cell.king ? '♛' : ''}</div>`;
      } else if (isValidDest) {
        inner = '<div class="ck-dot"></div>';
      }
      html += `<div class="${cls}" onclick="clickChecker(${r},${c})">${inner}</div>`;
    }
  }
  html += '</div>';

  if (data.status === 'active') {
    html += `<div class="game-status${isMyTurn ? '' : ' turn'}">${isMyTurn ? 'Your turn' : 'Waiting for ' + NAMES[partner] + '...'}</div>`;
  } else {
    html += `<div class="game-status">${data.winner === user ? 'You won!' : NAMES[partner] + ' won!'}</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newCheckers()">Play Again</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ===== GO FISH =====
function buildGoFishDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  suits.forEach(s => ranks.forEach(r => deck.push({ rank: r, suit: s })));
  return deck.sort(() => Math.random() - 0.5);
}

async function newGoFish() {
  const deck = buildGoFishDeck();
  const hand1 = deck.splice(0, 7);
  const hand2 = deck.splice(0, 7);
  const key = await startGame('gofish', {
    deck,
    hands: { partner2: user === 'partner2' ? hand1 : hand2, partner1: user === 'partner2' ? hand2 : hand1 },
    books: { partner2: 0, partner1: 0 },
    turn: user,
    lastAction: '',
    phase: 'ask'
  });
  if (!key) return;
  listenGame(key, renderGoFish);
  showGameView('gofish');
}

function checkBooks(hand) {
  const counts = {};
  hand.forEach(c => {
    counts[c.rank] = (counts[c.rank] || 0) + 1;
  });
  let books = 0;
  const bookRanks = [];
  Object.entries(counts).forEach(([rank, count]) => {
    if (count >= 4) {
      books++;
      bookRanks.push(rank);
    }
  });
  const remaining = hand.filter(c => !bookRanks.includes(c.rank));
  return { books, remaining };
}

async function askGoFish(rank) {
  if (!activeGameKey) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data || data.status !== 'active' || data.turn !== user) return;
  const hands = data.hands;
  const myHand = hands[user];
  const theirHand = hands[partner];
  const deck = data.deck || [];

  const found = theirHand.filter(c => c.rank === rank);
  const notFound = theirHand.filter(c => c.rank !== rank);
  let action = '';

  if (found.length > 0) {
    const newMyHand = [...myHand, ...found];
    hands[user] = newMyHand;
    hands[partner] = notFound;
    action = `${NAMES[user]} asked for ${rank}s - got ${found.length}!`;
    const result = checkBooks(hands[user]);
    const bks = data.books || { partner2: 0, partner1: 0 };
    bks[user] += result.books;
    hands[user] = result.remaining;
    const updates = { hands, books: bks, lastAction: action, turn: user };
    if (bks.partner2 + bks.partner1 >= 13 || (!hands.partner2.length && !hands.partner1.length && !deck.length)) {
      await db.ref('games/sessions/' + activeGameKey).update(updates);
      const w = bks[user] > bks[partner] ? user : bks[partner] > bks[user] ? partner : 'draw';
      await endGame(activeGameKey, 'gofish', w);
    } else {
      await db.ref('games/sessions/' + activeGameKey).update(updates);
    }
  } else {
    action = `${NAMES[user]} asked for ${rank}s - Go Fish!`;
    if (deck.length) {
      const drawn = deck.shift();
      myHand.push(drawn);
      if (drawn.rank === rank) action += ` Drew a ${rank}!`;
    }
    hands[user] = myHand;
    const result = checkBooks(hands[user]);
    const bks = data.books || { partner2: 0, partner1: 0 };
    bks[user] += result.books;
    hands[user] = result.remaining;
    const updates = { hands, books: bks, deck, lastAction: action, turn: partner };
    if (bks.partner2 + bks.partner1 >= 13 || (!hands.partner2.length && !hands.partner1.length && !deck.length)) {
      await db.ref('games/sessions/' + activeGameKey).update(updates);
      const w = bks[user] > bks[partner] ? user : bks[partner] > bks[user] ? partner : 'draw';
      await endGame(activeGameKey, 'gofish', w);
    } else {
      if (!hands[user].length && deck.length) hands[user] = [deck.shift()];
      await db.ref('games/sessions/' + activeGameKey).update(updates);
    }
  }
}

function renderGoFish(data, key) {
  const el = document.getElementById('gofish-board');
  if (!el) return;
  const myHand = (data.hands && data.hands[user]) || [];
  const theirCount = ((data.hands && data.hands[partner]) || []).length;
  const deckCount = (data.deck || []).length;
  const books = data.books || { him: 0, her: 0 };
  const isMyTurn = data.turn === user;

  let html = `<div class="gf-scorebar">
    <span class="me">${NAMES[user]}: ${books[user]} books</span>
    <span class="gf-deck">${deckCount} in deck</span>
    <span>${NAMES[partner]}: ${books[partner]} books</span>
  </div>`;

  if (data.lastAction) html += `<div class="gf-action">${esc(data.lastAction)}</div>`;

  html += `<div class="gf-opponent"><div class="gf-label">${NAMES[partner]}'s hand</div><div class="gf-count">${theirCount} cards</div></div>`;

  if (data.status === 'active') {
    if (isMyTurn && myHand.length) html += `<div class="gf-prompt">Tap a card to ask for that rank</div>`;
    else if (!isMyTurn) html += `<div class="game-status turn">Waiting for ${NAMES[partner]}...</div>`;
    html += '<div class="gf-hand">';
    const sorted = [...myHand].sort((a, b) => {
      const r = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      return r.indexOf(a.rank) - r.indexOf(b.rank);
    });
    sorted.forEach(card => {
      const color = card.suit === '♥' || card.suit === '♦' ? 'red' : 'black';
      const clickable = isMyTurn ? `onclick="askGoFish('${card.rank}')"` : '';
      html += `<div class="gf-card ${color}${isMyTurn ? ' active' : ''}" ${clickable}>${card.rank}<span>${card.suit}</span></div>`;
    });
    html += '</div>';
  } else {
    html += `<div class="game-status">${data.winner === 'draw' ? "It's a tie!" : data.winner === user ? 'You won!' : NAMES[partner] + ' won!'}</div>`;
    html += `<div style="text-align:center;font-size:14px;color:var(--t2);margin:8px 0">${books[user]} - ${books[partner]} books</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newGoFish()">Play Again</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ===== HANGMAN =====
const HANGMAN_WORDS = [
  { word: 'ADVENTURE', hint: 'Something exciting to do together' },
  { word: 'CHOCOLATE', hint: 'Sweet treat' },
  { word: 'SUNSET', hint: 'Romantic sky view' },
  { word: 'BUTTERFLY', hint: 'Feeling when you first fell in love' },
  { word: 'HONEYMOON', hint: 'Post-wedding trip' },
  { word: 'SOULMATE', hint: 'The one meant for you' },
  { word: 'STARGAZING', hint: 'Looking up on a clear night' },
  { word: 'CUDDLE', hint: 'Cozy closeness' },
  { word: 'PARADISE', hint: 'Perfect place' },
  { word: 'MOONLIGHT', hint: 'Romantic illumination' },
  { word: 'TREASURE', hint: 'Something precious' },
  { word: 'BLOSSOM', hint: 'Flowers opening up' },
  { word: 'PROMISE', hint: 'A commitment made' },
  { word: 'SERENITY', hint: 'Perfect peace' },
  { word: 'WANDERLUST', hint: 'Desire to travel' },
  { word: 'FOREVER', hint: 'How long this lasts' },
  { word: 'CHERISH', hint: 'To hold dear' },
  { word: 'HARMONY', hint: 'Being in sync' },
  { word: 'EMBRACE', hint: 'A warm hold' },
  { word: 'DEVOTION', hint: 'Deep commitment' }
];

async function newHangman() {
  const pick = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
  const key = await startGame('hangman', {
    word: pick.word,
    hint: pick.hint,
    guessed: [],
    wrong: 0,
    maxWrong: 6,
    guesser: partner,
    setter: user
  });
  if (!key) return;
  listenGame(key, renderHangman);
  showGameView('hangman');
}

async function guessHangmanLetter(letter) {
  if (!activeGameKey) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data || data.status !== 'active' || data.guesser !== user) return;
  const guessed = data.guessed || [];
  if (guessed.includes(letter)) return;
  guessed.push(letter);
  const isCorrect = data.word.includes(letter);
  const wrong = isCorrect ? data.wrong : (data.wrong || 0) + 1;
  const updates = { guessed, wrong };

  // Check win/lose
  const wordLetters = [...new Set(data.word.split(''))];
  const allGuessed = wordLetters.every(l => guessed.includes(l));
  if (allGuessed) {
    await db.ref('games/sessions/' + activeGameKey).update(updates);
    await endGame(activeGameKey, 'hangman', data.guesser);
  } else if (wrong >= (data.maxWrong || 6)) {
    await db.ref('games/sessions/' + activeGameKey).update(updates);
    await endGame(activeGameKey, 'hangman', data.setter);
  } else {
    await db.ref('games/sessions/' + activeGameKey).update(updates);
  }
}

function renderHangman(data, key) {
  const el = document.getElementById('hangman-board');
  if (!el) return;
  const isGuesser = data.guesser === user;
  const guessed = data.guessed || [];
  const wrong = data.wrong || 0;
  const maxWrong = data.maxWrong || 6;

  // Hangman SVG
  const parts = [
    '<circle cx="50" cy="25" r="10" fill="none" stroke="var(--cream)" stroke-width="2"/>', // head
    '<line x1="50" y1="35" x2="50" y2="60" stroke="var(--cream)" stroke-width="2"/>', // body
    '<line x1="50" y1="42" x2="35" y2="55" stroke="var(--cream)" stroke-width="2"/>', // left arm
    '<line x1="50" y1="42" x2="65" y2="55" stroke="var(--cream)" stroke-width="2"/>', // right arm
    '<line x1="50" y1="60" x2="38" y2="78" stroke="var(--cream)" stroke-width="2"/>', // left leg
    '<line x1="50" y1="60" x2="62" y2="78" stroke="var(--cream)" stroke-width="2"/>' // right leg
  ];

  let html = `<div class="hm-display">
    <svg viewBox="0 0 100 90" class="hm-svg">
      <line x1="20" y1="85" x2="80" y2="85" stroke="var(--t3)" stroke-width="2"/>
      <line x1="30" y1="85" x2="30" y2="5" stroke="var(--t3)" stroke-width="2"/>
      <line x1="30" y1="5" x2="50" y2="5" stroke="var(--t3)" stroke-width="2"/>
      <line x1="50" y1="5" x2="50" y2="15" stroke="var(--t3)" stroke-width="2"/>
      ${parts.slice(0, wrong).join('')}
    </svg>
    <div class="hm-wrong">${wrong} / ${maxWrong}</div>
  </div>`;

  // Word display
  const wordDisplay = data.word
    .split('')
    .map(l => (guessed.includes(l) || data.status === 'finished' ? l : '_'))
    .join(' ');
  html += `<div class="hm-word">${wordDisplay}</div>`;
  html += `<div class="hm-hint">${data.hint}</div>`;

  if (data.status === 'active') {
    if (isGuesser) {
      html += '<div class="hm-keyboard">';
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l => {
        const used = guessed.includes(l);
        const correct = used && data.word.includes(l);
        const cls = used ? (correct ? 'correct' : 'wrong') : '';
        html += `<button class="hm-key ${cls}" ${used ? 'disabled' : `onclick="guessHangmanLetter('${l}')"`}>${l}</button>`;
      });
      html += '</div>';
    } else {
      html += `<div class="game-status turn">The word is: <strong>${data.word}</strong><br>${NAMES[partner]} is guessing...</div>`;
    }
  } else {
    const won = data.winner === user;
    html += `<div class="game-status">${won ? 'You won!' : NAMES[partner] + ' won!'}</div>`;
    html += `<div style="text-align:center;font-size:14px;color:var(--t2);margin:8px 0">The word was: <strong>${data.word}</strong></div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newHangman()">Play Again</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ===== BATTLESHIP =====
function initBattleGrid() {
  return Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
}

function placeShipsRandom(grid) {
  const ships = [4, 3, 3, 2, 2]; // ship lengths
  ships.forEach(len => {
    let placed = false;
    while (!placed) {
      const horizontal = Math.random() > 0.5;
      const r = Math.floor(Math.random() * 8);
      const c = Math.floor(Math.random() * 8);
      if (horizontal && c + len <= 8) {
        let ok = true;
        for (let i = 0; i < len; i++) if (grid[r][c + i] !== null) ok = false;
        if (ok) {
          for (let i = 0; i < len; i++) grid[r][c + i] = 'ship';
          placed = true;
        }
      } else if (!horizontal && r + len <= 8) {
        let ok = true;
        for (let i = 0; i < len; i++) if (grid[r + i][c] !== null) ok = false;
        if (ok) {
          for (let i = 0; i < len; i++) grid[r + i][c] = 'ship';
          placed = true;
        }
      }
    }
  });
  return grid;
}

async function newBattleship() {
  const myGrid = placeShipsRandom(initBattleGrid());
  const partnerGrid = placeShipsRandom(initBattleGrid());
  const key = await startGame('battleship', {
    grids: { [user]: myGrid, [partner]: partnerGrid },
    shots: { [user]: [], [partner]: [] },
    turn: user,
    shipsLeft: { [user]: 14, [partner]: 14 } // 4+3+3+2+2 = 14 cells
  });
  if (!key) return;
  listenGame(key, renderBattleship);
  showGameView('battleship');
}

async function fireBattleship(r, c) {
  if (!activeGameKey) return;
  const snap = await db.ref('games/sessions/' + activeGameKey).once('value');
  const data = snap.val();
  if (!data || data.status !== 'active' || data.turn !== user) return;
  const shots = data.shots || {};
  const myShots = shots[user] || [];
  if (myShots.some(s => s.r === r && s.c === c)) return; // already fired here

  const partnerGrid = data.grids[partner];
  const isHit = partnerGrid[r][c] === 'ship';
  myShots.push({ r, c, hit: isHit });
  shots[user] = myShots;
  const shipsLeft = data.shipsLeft || {};
  if (isHit) shipsLeft[partner] = (shipsLeft[partner] || 14) - 1;

  if (shipsLeft[partner] <= 0) {
    await db.ref('games/sessions/' + activeGameKey).update({ shots, shipsLeft });
    await endGame(activeGameKey, 'battleship', user);
  } else {
    await db.ref('games/sessions/' + activeGameKey).update({ shots, shipsLeft, turn: partner });
  }
}

function renderBattleship(data, key) {
  const el = document.getElementById('battleship-board');
  if (!el) return;
  const isMyTurn = data.turn === user;
  const myShots = (data.shots && data.shots[user]) || [];
  const theirShots = (data.shots && data.shots[partner]) || [];
  const myGrid = data.grids[user];
  const shipsLeft = data.shipsLeft || {};

  let html = `<div class="bs-scores">
    <span class="me">${NAMES[user]}: ${shipsLeft[partner] || 0} to sink</span>
    <span>${NAMES[partner]}: ${shipsLeft[user] || 0} to sink</span>
  </div>`;

  if (data.status === 'active') {
    html += `<div class="game-status${isMyTurn ? '' : ' turn'}">${isMyTurn ? 'Your turn - fire!' : 'Waiting for ' + NAMES[partner] + '...'}</div>`;
  }

  // Enemy grid (where I shoot)
  html += `<div class="bs-label">${NAMES[partner]}'s Waters</div>`;
  html += '<div class="bs-grid">';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const shot = myShots.find(s => s.r === r && s.c === c);
      let cls = 'bs-cell';
      let inner = '';
      if (shot) {
        cls += shot.hit ? ' hit' : ' miss';
        inner = shot.hit ? '💥' : '·';
      } else if (isMyTurn && data.status === 'active') {
        cls += ' target';
      }
      const click = !shot && isMyTurn && data.status === 'active' ? `onclick="fireBattleship(${r},${c})"` : '';
      html += `<div class="${cls}" ${click}>${inner}</div>`;
    }
  }
  html += '</div>';

  // My grid (showing my ships and their shots)
  html += `<div class="bs-label" style="margin-top:16px">Your Waters</div>`;
  html += '<div class="bs-grid mine">';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isShip = myGrid[r][c] === 'ship';
      const shot = theirShots.find(s => s.r === r && s.c === c);
      let cls = 'bs-cell';
      let inner = '';
      if (shot && shot.hit) {
        cls += ' hit';
        inner = '💥';
      } else if (shot) {
        cls += ' miss';
        inner = '·';
      } else if (isShip) {
        cls += ' ship';
      }
      html += `<div class="${cls}">${inner}</div>`;
    }
  }
  html += '</div>';

  if (data.status === 'finished') {
    html += `<div class="game-status">${data.winner === user ? 'You sank their fleet!' : NAMES[partner] + ' sank your fleet!'}</div>`;
    html += `<div class="game-actions"><button class="game-btn" onclick="newBattleship()">Play Again</button><button class="game-btn secondary" onclick="showGameLobby()">Back</button></div>`;
  }
  el.innerHTML = html;
}

// ========================================
// ===== COUPLE CHALLENGES =====
// ========================================

const CHALLENGE_PACKS = {
  love7: {
    name: '7 Days of Love',
    emoji: '💕',
    days: 7,
    tasks: [
      'Write 3 things you love about your partner and share them',
      'Give your partner a surprise hug from behind',
      'Cook or order their favorite meal',
      'Send a sweet text in the middle of the day',
      "Look into each other's eyes for 2 minutes without talking",
      'Create a playlist of songs that remind you of them',
      "Write a short love note and hide it somewhere they'll find"
    ]
  },
  comm14: {
    name: '14-Day Communication',
    emoji: '💬',
    days: 14,
    tasks: [
      'Share your high and low of the day - listen without fixing',
      'Ask "What can I do to make your day better?"',
      "Share a childhood memory you've never told them",
      'Practice active listening: repeat back what they said',
      'Write down 3 things you appreciate about how they communicate',
      'Have a 10-minute phone-free conversation',
      'Share one fear you have about the future',
      'Tell them something they do that makes you feel safe',
      'Ask what their ideal Sunday looks like',
      'Share your love language and ask about theirs',
      'Discuss a goal you want to achieve together this year',
      'Ask "What\'s something you wish I knew about you?"',
      "Share a dream you haven't told anyone",
      'Tell them your favorite memory together and why'
    ]
  },
  adventure21: {
    name: '21-Day Adventure',
    emoji: '🌟',
    days: 21,
    tasks: [
      'Try a food neither of you has eaten before',
      "Take a walk in a neighborhood you've never explored",
      'Watch a movie in a genre you normally avoid',
      'Learn 5 words in a language neither of you speaks',
      'Do a random act of kindness together',
      'Take silly photos together in public',
      'Try a new workout or stretch routine together',
      "Visit a local shop you've never been to",
      'Cook a dish from a country you want to visit',
      "Have a picnic - even if it's indoors",
      'Stargaze or watch the sunset together',
      'Draw portraits of each other (no skill required!)',
      'Create a time capsule with items from today',
      'Have a tech-free evening with board games or cards',
      'Write a short story together, alternating sentences',
      'Create a bucket list for the next 12 months',
      'Try to build something with your hands',
      'Rearrange a room in your home together',
      'Learn a TikTok dance or song together',
      "Do each other's morning routine for a day",
      'Plan your dream trip - no budget limits!'
    ]
  },
  intimacy30: {
    name: '30-Day Intimacy',
    emoji: '🔥',
    days: 30,
    tasks: [
      'Hold hands for an entire walk',
      'Give a 10-minute massage',
      'Slow dance in the kitchen to a love song',
      'Share your favorite physical touch',
      'Fall asleep holding each other',
      'Express one thing that attracts you to them',
      'Create a "date jar" with ideas for just the two of you',
      'Kiss for 30 seconds - slowly',
      'Shower or bath together',
      'Write a letter about what intimacy means to you',
      'Share a fantasy or dream you have',
      'Touch foreheads and breathe together for 2 min',
      "Try a new form of affection you haven't tried",
      'Tell them 3 things about their body you love',
      'Have a candlelit evening',
      'Give each other a foot rub',
      'Share your idea of a perfect romantic evening',
      'Cuddle for 20 minutes with no screens',
      'Whisper something sweet in their ear',
      'Leave a love note on the bathroom mirror',
      'Plan a surprise romantic gesture',
      'Share what makes you feel most desired',
      'Recreate your first kiss',
      "Stare into each other's eyes for 4 minutes",
      'Share one way to deepen your connection',
      'Do something flirty in public',
      'Share a dream about your future intimacy',
      'Create a "no phones in bed" ritual',
      'Express gratitude for your physical connection',
      'Celebrate completing this together!'
    ]
  },
  gratitude7: {
    name: '7 Days of Gratitude',
    emoji: '🙏',
    days: 7,
    tasks: [
      "Write 5 things about your partner you're grateful for",
      'Thank them for something small they did recently',
      'Tell their family or friend something great about them',
      'Express gratitude for a challenge you overcame together',
      'Write a thank-you letter for something they did long ago',
      "Share what you're most grateful for in your relationship",
      'Create a "gratitude jar" and add your first notes'
    ]
  },
  fun14: {
    name: '14-Day Fun Factor',
    emoji: '🎉',
    days: 14,
    tasks: [
      'Have a pillow fight',
      'Build a blanket fort and watch a movie in it',
      'Play a video game or board game together',
      'Do karaoke at home',
      'Have a water balloon fight or splash fight',
      'Do impersonations of each other',
      'Create a TikTok or silly video together',
      'Have a themed dinner night',
      'Go on a scavenger hunt around your neighborhood',
      'Play truth or dare',
      'Have a bake-off challenge',
      'Learn a magic trick and perform for each other',
      'Have a photo shoot - dress up fancy!',
      'Write and perform a 2-person skit'
    ]
  }
};

function listenChallenges() {
  if (!db) return;
  db.ref('challenges').on('value', snap => {
    renderChallenges(snap.val() || {});
  });
}

function renderChallenges(data) {
  const activeEl = document.getElementById('ch-active');
  const completedEl = document.getElementById('ch-completed');
  if (!activeEl) return;

  const active = data.active;
  if (!active) {
    activeEl.innerHTML = '<div class="empty">No active challenge - start one below!</div>';
  } else {
    const pack = CHALLENGE_PACKS[active.packId];
    if (!pack) {
      activeEl.innerHTML = '';
      return;
    }
    const completedDays = active.completed || {};
    const completedCount = Object.keys(completedDays).length;
    const progress = Math.round((completedCount / pack.days) * 100);
    const today = new Date().toISOString().split('T')[0];
    const todayDone = completedDays[today];

    let html = `<div class="ch-active-card">
      <div class="ch-active-header">
        <span class="ch-active-emoji">${pack.emoji}</span>
        <div>
          <div class="ch-active-name">${pack.name}</div>
          <div class="ch-active-progress">${completedCount}/${pack.days} days complete</div>
        </div>
      </div>
      <div class="ch-progress-bar"><div class="ch-progress-fill" style="width:${progress}%"></div></div>`;

    const dayIndex = Math.min(completedCount, pack.days - 1);
    if (completedCount < pack.days) {
      html += `<div class="ch-today-task">
        <div class="ch-today-label">Day ${dayIndex + 1} Challenge</div>
        <div class="ch-today-text">${pack.tasks[dayIndex]}</div>
        ${
          todayDone
            ? '<div class="ch-done-badge">Done today ✓</div>'
            : `<button class="dq-submit" onclick="completeChallenge()" style="margin-top:10px;width:100%;background:var(--grad-fitness)">Mark Complete ✓</button>`
        }
      </div>`;
    } else {
      html += `<div class="ch-today-task"><div class="ch-done-badge" style="font-size:14px">Challenge Complete! 🎉</div></div>`;
    }

    html += `<button class="btn-sm" onclick="abandonChallenge()" style="color:var(--t3);margin-top:8px;font-size:11px">Abandon Challenge</button>
    </div>`;
    activeEl.innerHTML = html;
  }

  const history = data.history
    ? Object.values(data.history).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    : [];
  if (completedEl) {
    if (!history.length) {
      completedEl.innerHTML = '<div class="empty">Complete a challenge pack to see it here</div>';
    } else {
      completedEl.innerHTML = history
        .map(h => {
          const pack = CHALLENGE_PACKS[h.packId];
          if (!pack) return '';
          return `<div class="card" style="margin-bottom:8px;display:flex;align-items:center;gap:12px">
          <div style="font-size:24px">${pack.emoji}</div>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600;color:var(--cream)">${pack.name}</div>
            <div style="font-size:11px;color:var(--t3)">${new Date(h.completedAt).toLocaleDateString()} · ${h.daysCompleted || pack.days} days</div>
          </div>
          <div style="font-size:18px">🏆</div>
        </div>`;
        })
        .join('');
    }
  }
}

async function startChallenge(packId) {
  if (!db) return;
  const pack = CHALLENGE_PACKS[packId];
  if (!pack) return;
  const snap = await db.ref('challenges/active').once('value');
  if (snap.val()) {
    openModal(`<div style="text-align:center">
      <p style="font-size:15px;color:var(--t1);margin:0 0 6px;font-weight:600">Replace Challenge?</p>
      <p style="font-size:13px;color:var(--t3);margin:0 0 16px">You already have an active challenge. Replace it?</p>
      <div style="display:flex;gap:8px">
        <button class="btn-sm" onclick="closeModal()" style="flex:1;background:var(--card-bg);color:var(--t2)">Cancel</button>
        <button class="btn-sm" onclick="closeModal();confirmStartChallenge('${packId}')" style="flex:1">Replace</button>
      </div>
    </div>`);
    return;
  }
  confirmStartChallenge(packId);
}
async function confirmStartChallenge(packId) {
  const pack = CHALLENGE_PACKS[packId];
  if (!pack) return;
  await db.ref('challenges/active').set({
    packId,
    startedAt: Date.now(),
    startedBy: user,
    completed: {}
  });
  toast(pack.name + ' started!');
}

async function completeChallenge() {
  if (!db) return;
  const today = new Date().toISOString().split('T')[0];
  await db.ref('challenges/active/completed/' + today).set({
    by: user,
    at: Date.now()
  });
  toast('Day completed! 🎉');
  const snap = await db.ref('challenges/active').once('value');
  const active = snap.val();
  if (active) {
    const pack = CHALLENGE_PACKS[active.packId];
    const completedCount = active.completed ? Object.keys(active.completed).length : 0;
    if (pack && completedCount >= pack.days) {
      await db.ref('challenges/history').push({
        packId: active.packId,
        startedAt: active.startedAt,
        completedAt: Date.now(),
        daysCompleted: completedCount
      });
      await db.ref('challenges/active').remove();
      toast('Challenge COMPLETE! 🏆🎉');
    }
  }
}

function abandonChallenge() {
  if (!db) return;
  openModal(`<div style="text-align:center">
    <p style="font-size:15px;color:var(--t1);margin:0 0 6px;font-weight:600">Abandon Challenge?</p>
    <p style="font-size:13px;color:var(--t3);margin:0 0 16px">Progress will be lost.</p>
    <div style="display:flex;gap:8px">
      <button class="btn-sm" onclick="closeModal()" style="flex:1;background:var(--card-bg);color:var(--t2)">Cancel</button>
      <button class="btn-sm" onclick="closeModal();confirmAbandonChallenge()" style="flex:1;background:var(--red);color:#fff">Abandon</button>
    </div>
  </div>`);
}
async function confirmAbandonChallenge() {
  await db.ref('challenges/active').remove();
  toast('Challenge abandoned');
}

// ===== LISTEN TOGETHER =====
// Real-time music sync - when one partner shares a song, both hear it live
var LT = { active: false, listener: null, embedReady: false };

function ltParseMusicLink(url) {
  url = (url || '').trim();
  // Spotify track/album/playlist
  var sp = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (sp)
    return {
      platform: 'spotify',
      type: sp[1],
      id: sp[2],
      embedUrl: 'https://open.spotify.com/embed/' + sp[1] + '/' + sp[2] + '?utm_source=generator&theme=0'
    };
  // Spotify URI
  var spUri = url.match(/spotify:(track|album|playlist):([a-zA-Z0-9]+)/);
  if (spUri)
    return {
      platform: 'spotify',
      type: spUri[1],
      id: spUri[2],
      embedUrl: 'https://open.spotify.com/embed/' + spUri[1] + '/' + spUri[2] + '?utm_source=generator&theme=0'
    };
  // YouTube - standard, short, and music URLs
  var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (yt)
    return {
      platform: 'youtube',
      type: 'video',
      id: yt[1],
      embedUrl: 'https://www.youtube.com/embed/' + yt[1] + '?autoplay=1&rel=0'
    };
  // Apple Music
  var am = url.match(/music\.apple\.com\/([a-z]{2})\/([a-z-]+)\/[^/]+\/(\d+)/);
  if (am)
    return {
      platform: 'apple',
      type: am[2],
      id: am[3],
      embedUrl: 'https://embed.music.apple.com/' + am[1] + '/' + am[2] + '/' + am[3]
    };
  return null;
}

function ltShareSong() {
  if (!db || !user) {
    toast('Not connected');
    return;
  }
  var input = document.getElementById('lt-link-input');
  if (!input) return;
  var url = input.value.trim();
  if (!url) {
    toast('Paste a music link first');
    return;
  }
  var parsed = ltParseMusicLink(url);
  if (!parsed) {
    toast('Paste a valid Spotify, YouTube, or Apple Music link');
    return;
  }
  // Write session to Firebase - both partners will pick it up
  var session = {
    platform: parsed.platform,
    type: parsed.type,
    id: parsed.id,
    embedUrl: parsed.embedUrl,
    originalUrl: url,
    sharedBy: user,
    sharedByName: typeof NAMES !== 'undefined' ? NAMES[user] : user,
    startedAt: Date.now(),
    active: true
  };
  db.ref('listenTogether').set(session);
  input.value = '';
  toast('Song shared - listening together');
  if (navigator.vibrate) navigator.vibrate(50);
}

function ltStartListening() {
  if (!db) return;
  if (LT.listener) return; // already listening
  var firstLoad = true;
  LT.listener = db.ref('listenTogether').on('value', function (snap) {
    var data = snap.val();
    if (!data || !data.active) {
      if (LT.active) ltClearUI();
      firstLoad = false;
      return;
    }
    // Notify when partner shares a new song (not on first load)
    if (!firstLoad && data.sharedBy !== user && data.startedAt && data.startedAt > Date.now() - 8000) {
      var partnerName = typeof NAMES !== 'undefined' ? NAMES[data.sharedBy] : 'Partner';
      toast(partnerName + ' wants to listen together');
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    }
    firstLoad = false;
    ltShowSession(data);
  });
  // Also listen to partner presence changes to update "listening together" status
  var partnerRole = user === 'partner1' ? 'partner2' : 'partner1';
  db.ref('presence/' + partnerRole).on('value', function (snap) {
    if (!LT.active) return;
    db.ref('listenTogether').once('value', function (s) {
      var d = s.val();
      if (d && d.active) {
        var p = snap.val() || {};
        ltUpdateStatus(d, !!p.online);
      }
    });
  });
}

function ltShowSession(data) {
  LT.active = true;
  // Check if partner is online
  var partnerRole = user === 'partner1' ? 'partner2' : 'partner1';
  db.ref('presence/' + partnerRole).once('value', function (snap) {
    var p = snap.val() || {};
    var bothOnline = !!p.online;
    ltUpdateStatus(data, bothOnline);
  });
  ltLoadEmbed(data);
  ltUpdateMiniPlayer(data);
}

function ltUpdateStatus(data, bothOnline) {
  var dot = document.getElementById('lt-status-dot');
  var text = document.getElementById('lt-status-text');
  if (!dot || !text) return;
  var sharedByMe = data.sharedBy === user;
  var partnerName = typeof NAMES !== 'undefined' ? NAMES[user === 'partner1' ? 'partner2' : 'partner1'] : 'Partner';
  if (bothOnline) {
    dot.className = 'lt-status-dot lt-live';
    text.textContent = 'Listening together with ' + partnerName;
  } else {
    dot.className = 'lt-status-dot lt-solo';
    text.textContent = sharedByMe
      ? 'Waiting for ' + partnerName + ' to join...'
      : (data.sharedByName || 'Partner') + ' shared a song';
  }
}

function ltLoadEmbed(data) {
  var wrap = document.getElementById('lt-embed-wrap');
  var np = document.getElementById('lt-now-playing');
  if (!wrap || !np) return;
  // Show now-playing info
  np.style.display = 'flex';
  var nameEl = document.getElementById('lt-track-name');
  var byEl = document.getElementById('lt-track-by');
  if (nameEl)
    nameEl.textContent =
      data.platform === 'spotify' ? 'Spotify ' + data.type : data.platform === 'youtube' ? 'YouTube' : 'Apple Music';
  if (byEl) byEl.textContent = 'Shared by ' + (data.sharedBy === user ? 'you' : data.sharedByName || 'partner');
  // Only reload embed if song changed
  var currentId = wrap.getAttribute('data-song-id');
  if (currentId === data.id) return;
  wrap.setAttribute('data-song-id', data.id);
  wrap.style.display = 'block';
  // Build embed
  var h;
  if (data.platform === 'spotify') {
    h = data.type === 'track' ? 152 : 352;
    wrap.innerHTML =
      '<iframe src="' +
      data.embedUrl +
      '" width="100%" height="' +
      h +
      '" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" style="border-radius:12px"></iframe>';
  } else if (data.platform === 'youtube') {
    wrap.innerHTML =
      '<iframe src="' +
      data.embedUrl +
      '" width="100%" height="200" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:12px"></iframe>';
  } else if (data.platform === 'apple') {
    wrap.innerHTML =
      '<iframe src="' +
      data.embedUrl +
      '" width="100%" height="175" frameBorder="0" allow="autoplay; encrypted-media" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation" style="border-radius:12px"></iframe>';
  }
}

function ltUpdateMiniPlayer(data) {
  var mini = document.getElementById('lt-mini');
  if (!mini) return;
  mini.style.display = 'flex';
  var nameEl = document.getElementById('lt-mini-name');
  var byEl = document.getElementById('lt-mini-by');
  if (nameEl)
    nameEl.textContent =
      data.platform === 'spotify' ? 'Spotify ' + data.type : data.platform === 'youtube' ? 'YouTube' : 'Apple Music';
  if (byEl) byEl.textContent = data.sharedBy === user ? 'You shared' : (data.sharedByName || 'Partner') + ' shared';
}

function ltClearUI() {
  LT.active = false;
  var wrap = document.getElementById('lt-embed-wrap');
  var np = document.getElementById('lt-now-playing');
  var mini = document.getElementById('lt-mini');
  var dot = document.getElementById('lt-status-dot');
  var text = document.getElementById('lt-status-text');
  if (wrap) {
    wrap.innerHTML = '';
    wrap.style.display = 'none';
    wrap.removeAttribute('data-song-id');
  }
  if (np) np.style.display = 'none';
  if (mini) mini.style.display = 'none';
  if (dot) dot.className = 'lt-status-dot';
  if (text) text.textContent = 'Share a Spotify or YouTube link';
}

function ltEndSession() {
  if (!db) return;
  db.ref('listenTogether').set({ active: false, endedBy: user, endedAt: Date.now() });
  toast('Listening session ended');
}

// ===== WAKE UP TOGETHER =====

let wuListener = null;
let wuRituals = {};

function getMyTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return 'Unknown';
  }
}

function getTimezoneAbbr(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' }).formatToParts(new Date());
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : tz;
  } catch (e) {
    return tz;
  }
}

function getTimezoneOffset(tz) {
  try {
    const now = new Date();
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    return (local - utc) / 60000; // minutes
  } catch (e) {
    return 0;
  }
}

function convertTimeToTimezone(timeStr, fromTz, toTz) {
  if (!timeStr || !fromTz || !toTz) return '--:--';
  const [h, m] = timeStr.split(':').map(Number);
  const fromOffset = getTimezoneOffset(fromTz);
  const toOffset = getTimezoneOffset(toTz);
  const diffMin = toOffset - fromOffset;
  let totalMin = h * 60 + m + diffMin;
  if (totalMin < 0) totalMin += 1440;
  if (totalMin >= 1440) totalMin -= 1440;
  const nh = Math.floor(totalMin / 60);
  const nm = totalMin % 60;
  const ampm = nh >= 12 ? 'PM' : 'AM';
  const h12 = nh === 0 ? 12 : nh > 12 ? nh - 12 : nh;
  return h12 + ':' + String(nm).padStart(2, '0') + ' ' + ampm;
}

function formatTime12(timeStr) {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm;
}

function initWakeUp() {
  if (!db) return;
  const myTz = getMyTimezone();
  const tzDisplay = document.getElementById('wu-my-tz');
  if (tzDisplay) tzDisplay.textContent = getTimezoneAbbr(myTz) + ' (' + myTz.replace(/_/g, ' ') + ')';

  // Set names
  if (typeof NAMES !== 'undefined') {
    const herName = document.getElementById('wu-name-partner1');
    const himName = document.getElementById('wu-name-partner2');
    if (herName) herName.textContent = NAMES.partner1 || 'Partner 1';
    if (himName) himName.textContent = NAMES.partner2 || 'Partner 2';
  }

  // Update partner time preview on input change
  const timeInput = document.getElementById('wu-time-input');
  if (timeInput) {
    timeInput.addEventListener('change', updatePartnerTimePreview);
    updatePartnerTimePreview();
  }

  // Load today's rituals from localStorage
  const today = localDate();
  wuRituals = JSON.parse(localStorage.getItem('met_wu_rituals_' + today) || '{}');
  Object.keys(wuRituals).forEach(function (key) {
    if (wuRituals[key]) {
      var check = document.getElementById('ritual-' + key);
      if (check) check.classList.add('checked');
      var item = check ? check.closest('.wu-ritual-item') : null;
      if (item) item.classList.add('done');
    }
  });

  // Listen for wake-up data
  listenWakeUp();
}

function updatePartnerTimePreview() {
  const timeInput = document.getElementById('wu-time-input');
  const partnerTimeEl = document.getElementById('wu-partner-local-time');
  if (!timeInput || !partnerTimeEl) return;

  const myTz = getMyTimezone();
  // Get partner's timezone from firebase data
  db.ref('wakeup/timezone').once('value', function (snap) {
    const tzData = snap.val() || {};
    const partnerTz = tzData[partner] || myTz;
    const converted = convertTimeToTimezone(timeInput.value, myTz, partnerTz);
    partnerTimeEl.textContent = converted;

    // Show time difference
    const diffEl = document.getElementById('wu-time-diff');
    if (diffEl && partnerTz !== myTz) {
      const myOffset = getTimezoneOffset(myTz);
      const partnerOffset = getTimezoneOffset(partnerTz);
      const diffHours = Math.abs((partnerOffset - myOffset) / 60);
      const ahead = partnerOffset > myOffset;
      diffEl.textContent =
        (typeof NAMES !== 'undefined' ? NAMES[partner] : 'Partner') +
        ' is ' +
        diffHours +
        'h ' +
        (ahead ? 'ahead' : 'behind') +
        ' of you';
      diffEl.style.display = 'block';
    }
  });
}

function setWakeUpTime() {
  if (!db || !user) return;
  const timeInput = document.getElementById('wu-time-input');
  const btn = document.getElementById('wu-set-btn');
  if (!timeInput) return;

  const myTz = getMyTimezone();
  const today = localDate();

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Setting...';
  }

  // Save timezone
  db.ref('wakeup/timezone/' + user).set(myTz);

  // Save alarm
  db.ref('wakeup/alarms/' + today + '/' + user)
    .set({
      time: timeInput.value,
      timezone: myTz,
      setAt: Date.now(),
      wokenUp: false,
      userName: typeof NAMES !== 'undefined' ? NAMES[user] : user
    })
    .then(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Alarm Set';
      }
      setTimeout(function () {
        if (btn) btn.textContent = 'Update Alarm';
      }, 2000);
      toast('Alarm set for ' + formatTime12(timeInput.value));
    });
}

function sendGoodnightMsg() {
  if (!db || !user) return;
  const input = document.getElementById('wu-goodnight-msg');
  if (!input || !input.value.trim()) {
    toast('Write a goodnight message first');
    return;
  }

  const today = localDate();
  db.ref('wakeup/goodnight/' + today + '/' + user)
    .set({
      message: input.value.trim(),
      timestamp: Date.now(),
      from: user,
      fromName: typeof NAMES !== 'undefined' ? NAMES[user] : user
    })
    .then(function () {
      toast('Goodnight message sent');
      input.value = '';
    });
}

function wuQuickMsg(msg) {
  var input = document.getElementById('wu-goodnight-msg');
  if (input) input.value = msg;
}

function sendWakeUp() {
  if (!db || !user) return;
  const today = localDate();
  const btn = document.getElementById('wu-wake-btn');

  db.ref('wakeup/wakeups/' + today)
    .push({
      from: user,
      fromName: typeof NAMES !== 'undefined' ? NAMES[user] : user,
      to: partner,
      timestamp: Date.now(),
      type: 'wake'
    })
    .then(function () {
      if (btn) btn.classList.add('d-none');
      const resp = document.getElementById('wu-wake-response');
      if (resp) {
        resp.classList.remove('d-none');
        resp.innerHTML = '<div class="wu-wake-sent">Rise and shine! You woke them up</div>';
      }
      toast('Wake up sent!');

      // Mark their alarm as woken up
      db.ref('wakeup/alarms/' + today + '/' + partner + '/wokenUp').set(true);
    });
}

function toggleRitual(el, key) {
  const today = localDate();
  wuRituals[key] = !wuRituals[key];
  localStorage.setItem('met_wu_rituals_' + today, JSON.stringify(wuRituals));

  var check = document.getElementById('ritual-' + key);
  if (check) check.classList.toggle('checked', wuRituals[key]);
  el.classList.toggle('done', wuRituals[key]);

  // Sync ritual to firebase
  if (db && user) {
    db.ref('wakeup/rituals/' + today + '/' + user + '/' + key).set(wuRituals[key]);
  }

  // Check if all rituals done
  const allDone = ['said-love', 'shared-day', 'gratitude', 'tomorrow', 'prayer'].every(function (k) {
    return wuRituals[k];
  });
  if (allDone) toast('Beautiful bedtime ritual complete');
}

function listenWakeUp() {
  if (!db) return;
  const today = localDate();

  // Listen for alarm changes
  if (wuListener) db.ref('wakeup').off('value', wuListener);

  wuListener = db.ref('wakeup').on('value', function (snap) {
    const data = snap.val() || {};
    const alarms = (data.alarms && data.alarms[today]) || {};
    const goodnights = (data.goodnight && data.goodnight[today]) || {};
    const timezones = data.timezone || {};
    const wakeups = (data.wakeups && data.wakeups[today]) || {};

    // Update partner statuses
    ['partner1', 'partner2'].forEach(function (who) {
      const alarm = alarms[who];
      const statusEl = document.getElementById('wu-status-' + who);
      const tzEl = document.getElementById('wu-tz-' + who);

      if (alarm) {
        if (statusEl) statusEl.textContent = formatTime12(alarm.time);
        if (statusEl) statusEl.classList.add('set');
        if (tzEl) tzEl.textContent = getTimezoneAbbr(alarm.timezone || '');
      } else {
        if (statusEl) {
          statusEl.textContent = 'Not set yet';
          statusEl.classList.remove('set');
        }
        if (tzEl) tzEl.textContent = '';
      }
    });

    // Update hero card based on time of day
    updateWakeUpHero();

    // Show morning section if partner has goodnight message or alarm
    const partnerGN = goodnights[partner];
    const partnerAlarm = alarms[partner];
    const morningEmpty = document.getElementById('wu-morning-empty');
    const morningActive = document.getElementById('wu-morning-active');
    const greetingEl = document.getElementById('wu-morning-greeting');
    const gnMsgEl = document.getElementById('wu-morning-gn-msg');

    if (partnerGN || partnerAlarm) {
      if (morningEmpty) morningEmpty.classList.add('d-none');
      if (morningActive) morningActive.classList.remove('d-none');

      if (greetingEl) {
        const pName = typeof NAMES !== 'undefined' ? NAMES[partner] : 'Your love';
        greetingEl.textContent =
          pName + (partnerAlarm ? ' set their alarm for ' + formatTime12(partnerAlarm.time) : ' is thinking of you');
      }
      if (gnMsgEl && partnerGN) {
        gnMsgEl.innerHTML =
          '<div class="wu-gn-label">Their goodnight message:</div><div class="wu-gn-text">"' +
          (typeof esc === 'function' ? esc(partnerGN.message) : partnerGN.message) +
          '"</div>';
      }

      // Check if already woken up
      const alreadyWoke = Object.values(wakeups).some(function (w) {
        return w.from === user && w.to === partner;
      });
      const wakeBtn = document.getElementById('wu-wake-btn');
      const wakeResp = document.getElementById('wu-wake-response');
      if (alreadyWoke) {
        if (wakeBtn) wakeBtn.classList.add('d-none');
        if (wakeResp) {
          wakeResp.classList.remove('d-none');
          wakeResp.innerHTML = '<div class="wu-wake-sent">You already sent a wake-up today</div>';
        }
      } else {
        if (wakeBtn) wakeBtn.classList.remove('d-none');
        if (wakeResp) wakeResp.classList.add('d-none');
      }
    } else {
      if (morningEmpty) morningEmpty.classList.remove('d-none');
      if (morningActive) morningActive.classList.add('d-none');
    }

    // Update partner time preview
    updatePartnerTimePreview();

    // Build history
    buildWakeUpHistory(data);
  });
}

function updateWakeUpHero() {
  const heroIcon = document.getElementById('wu-hero-icon');
  const heroTitle = document.getElementById('wu-hero-title');
  const heroSub = document.getElementById('wu-hero-sub');
  if (!heroIcon) return;

  const hour = new Date().getHours();
  var sunSvg =
    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>';
  var moonSvg =
    '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
  if (hour >= 5 && hour < 12) {
    // Morning
    heroIcon.innerHTML = sunSvg;
    if (heroTitle) heroTitle.textContent = 'Good Morning';
    if (heroSub) heroSub.textContent = 'Rise and shine together';
  } else if (hour >= 12 && hour < 17) {
    // Afternoon
    heroIcon.innerHTML = sunSvg;
    if (heroTitle) heroTitle.textContent = 'Good Afternoon';
    if (heroSub) heroSub.textContent = "Plan tonight's goodnight ritual";
  } else if (hour >= 17 && hour < 21) {
    // Evening
    heroIcon.innerHTML = moonSvg;
    if (heroTitle) heroTitle.textContent = 'Good Evening';
    if (heroSub) heroSub.textContent = 'Time for your goodnight ritual';
  } else {
    // Night (9pm-5am)
    heroIcon.innerHTML = moonSvg;
    if (heroTitle) heroTitle.textContent = 'Goodnight Ritual';
    if (heroSub) heroSub.textContent = 'Set your alarms together, even miles apart';
  }
}

function buildWakeUpHistory(data) {
  const container = document.getElementById('wu-history');
  if (!container) return;

  const allAlarms = data.alarms || {};
  const allGoodnights = data.goodnight || {};
  const dates = Object.keys(allAlarms).sort().reverse().slice(0, 7);

  if (dates.length === 0) {
    container.innerHTML = '<div class="empty">Your shared nights will appear here</div>';
    return;
  }

  let html = '';
  dates.forEach(function (date) {
    const alarms = allAlarms[date] || {};
    const gn = allGoodnights[date] || {};
    const herAlarm = alarms.partner1;
    const himAlarm = alarms.partner2;
    const herGN = gn.partner1;
    const himGN = gn.partner2;

    const herName = typeof NAMES !== 'undefined' ? NAMES.partner1 : 'Partner 1';
    const himName = typeof NAMES !== 'undefined' ? NAMES.partner2 : 'Partner 2';

    // Format date nicely
    const d = new Date(date + 'T12:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    html += '<div class="wu-history-item">';
    html += '<div class="wu-history-date">' + dayName + '</div>';
    html += '<div class="wu-history-details">';
    if (herAlarm) html += '<span class="wu-history-time">' + herName + ': ' + formatTime12(herAlarm.time) + '</span>';
    if (himAlarm) html += '<span class="wu-history-time">' + himName + ': ' + formatTime12(himAlarm.time) + '</span>';
    if (herGN || himGN) html += '<span class="wu-history-gn">Goodnight messages exchanged</span>';
    html += '</div></div>';
  });

  container.innerHTML = html;
}

/* ========================================================================
   ALARM ENGINE — timer, sound, overlay, snooze, partner notifications
   ======================================================================== */

var wuAlarmTimer = null;       // setTimeout id
var wuAlarmAudioCtx = null;    // Web Audio context
var wuAlarmOscillators = [];   // active oscillator nodes
var wuAlarmPlaying = false;    // is alarm currently sounding
var wuSnoozeCount = 0;         // how many times snoozed today
var WU_SNOOZE_MINUTES = 5;

/* ---------- schedule / cancel ---------- */

function scheduleAlarm() {
  clearAlarm();
  if (!db || !user) return;
  var today = localDate();
  db.ref('wakeup/alarms/' + today + '/' + user).once('value', function (snap) {
    var alarm = snap.val();
    if (!alarm || !alarm.time || alarm.wokenUp) return;
    var ms = msUntilAlarm(alarm.time, alarm.timezone || getMyTimezone());
    if (ms <= 0 || ms > 24 * 3600 * 1000) return; // past or >24h away
    wuAlarmTimer = setTimeout(function () { fireAlarm(alarm); }, ms);
    localStorage.setItem('met_wu_scheduled', JSON.stringify({
      time: alarm.time, tz: alarm.timezone, date: today
    }));
  });
}

function msUntilAlarm(timeStr, tz) {
  var now = new Date();
  var parts = timeStr.split(':').map(Number);
  // Build a date in the alarm's timezone
  var todayStr = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
  var alarmDate = new Date(todayStr + 'T' + timeStr + ':00');
  // Convert to UTC by subtracting timezone offset
  var tzOffsetMs = getTimezoneOffset(tz) * 60000;
  var alarmUTC = alarmDate.getTime() - tzOffsetMs;
  return alarmUTC - now.getTime();
}

function clearAlarm() {
  if (wuAlarmTimer) { clearTimeout(wuAlarmTimer); wuAlarmTimer = null; }
  stopAlarmSound();
}

/* ---------- fire alarm ---------- */

function fireAlarm(alarm) {
  wuAlarmPlaying = true;
  // Play sound
  startAlarmSound();
  // Vibrate
  if (navigator.vibrate) navigator.vibrate([300, 200, 300, 200, 300, 200, 300]);
  // Fetch partner's goodnight message, then show overlay
  var today = localDate();
  db.ref('wakeup/goodnight/' + today + '/' + partner).once('value', function (snap) {
    var gn = snap.val();
    showWakeUpOverlay(alarm, gn);
  });
  // Notify partner that our alarm fired
  notifyPartnerAlarmFired();
  // Mark alarm as wokenUp (fired)
  db.ref('wakeup/alarms/' + today + '/' + user + '/firedAt').set(Date.now());
}

/* ---------- Web Audio alarm tone ---------- */

function startAlarmSound() {
  try {
    if (!wuAlarmAudioCtx) {
      wuAlarmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (wuAlarmAudioCtx.state === 'suspended') wuAlarmAudioCtx.resume();
    playAlarmLoop();
  } catch (e) { /* audio not available */ }
}

function playAlarmLoop() {
  if (!wuAlarmPlaying || !wuAlarmAudioCtx) return;
  // Gentle ascending chime pattern (C5 E5 G5 C6)
  var notes = [523.25, 659.25, 783.99, 1046.50];
  var ctx = wuAlarmAudioCtx;
  var t = ctx.currentTime;

  notes.forEach(function (freq, i) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + i * 0.35);
    gain.gain.linearRampToValueAtTime(0.15, t + i * 0.35 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.35 + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + i * 0.35);
    osc.stop(t + i * 0.35 + 0.7);
    wuAlarmOscillators.push(osc);
  });
  // Repeat pattern every 3 seconds
  setTimeout(function () { playAlarmLoop(); }, 3000);
}

function stopAlarmSound() {
  wuAlarmPlaying = false;
  wuAlarmOscillators.forEach(function (o) {
    try { o.stop(); } catch (e) { /* already stopped */ }
  });
  wuAlarmOscillators = [];
}

/* ---------- wake-up overlay ---------- */

function showWakeUpOverlay(alarm, goodnightData) {
  // Remove existing overlay if any
  var existing = document.getElementById('wu-alarm-overlay');
  if (existing) existing.remove();

  var partnerName = (typeof NAMES !== 'undefined' ? NAMES[partner] : 'Your love');
  var userName = (typeof NAMES !== 'undefined' ? NAMES[user] : 'you');
  var gnMessage = goodnightData ? goodnightData.message : '';
  var hour = new Date().getHours();
  var greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  var overlay = document.createElement('div');
  overlay.id = 'wu-alarm-overlay';
  overlay.className = 'wu-overlay';
  overlay.innerHTML =
    '<div class="wu-overlay-bg"></div>' +
    '<div class="wu-overlay-content">' +
      '<div class="wu-ov-sun">' +
        '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="5"/>' +
          '<line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>' +
          '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
          '<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>' +
          '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' +
        '</svg>' +
      '</div>' +
      '<div class="wu-ov-greeting">' + greeting + '</div>' +
      '<div class="wu-ov-name">' + (typeof esc === 'function' ? esc(userName) : userName) + '</div>' +
      '<div class="wu-ov-time">' + formatTime12(alarm.time) + '</div>' +
      (gnMessage
        ? '<div class="wu-ov-gn-card">' +
            '<div class="wu-ov-gn-from">' + (typeof esc === 'function' ? esc(partnerName) : partnerName) + ' said last night:</div>' +
            '<div class="wu-ov-gn-msg">"' + (typeof esc === 'function' ? esc(gnMessage) : gnMessage) + '"</div>' +
          '</div>'
        : '') +
      '<button class="wu-ov-dismiss" onclick="dismissAlarm()">' +
        'I\'m Awake!' +
      '</button>' +
      '<button class="wu-ov-snooze" onclick="snoozeAlarm()">' +
        '5 more minutes...' +
      '</button>' +
      '<div class="wu-ov-snooze-count" id="wu-snooze-count">' +
        (wuSnoozeCount > 0 ? 'Snoozed ' + wuSnoozeCount + ' time' + (wuSnoozeCount > 1 ? 's' : '') : '') +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  // Trigger entrance animation
  requestAnimationFrame(function () {
    overlay.classList.add('wu-overlay-in');
  });
}

function hideWakeUpOverlay() {
  var overlay = document.getElementById('wu-alarm-overlay');
  if (!overlay) return;
  overlay.classList.add('wu-overlay-out');
  setTimeout(function () { overlay.remove(); }, 500);
}

/* ---------- dismiss (I'm awake!) ---------- */

function dismissAlarm() {
  stopAlarmSound();
  if (navigator.vibrate) navigator.vibrate(0); // cancel vibration

  var today = localDate();
  if (db && user) {
    // Mark alarm as confirmed awake
    db.ref('wakeup/alarms/' + today + '/' + user + '/wokenUp').set(true);
    db.ref('wakeup/alarms/' + today + '/' + user + '/wokeAt').set(Date.now());
    // Record confirmation so partner sees it
    db.ref('wakeup/confirmations/' + today + '/' + user).set({
      timestamp: Date.now(),
      userName: typeof NAMES !== 'undefined' ? NAMES[user] : user,
      snoozeCount: wuSnoozeCount
    });
  }
  // Notify partner
  notifyPartnerAwake();
  hideWakeUpOverlay();
  wuSnoozeCount = 0;
  toast('Rise and shine!');
}

/* ---------- snooze ---------- */

function snoozeAlarm() {
  stopAlarmSound();
  if (navigator.vibrate) navigator.vibrate(0);
  wuSnoozeCount++;
  hideWakeUpOverlay();

  // Notify partner about snooze
  if (db && user) {
    var today = localDate();
    db.ref('wakeup/snoozes/' + today).push({
      from: user,
      fromName: typeof NAMES !== 'undefined' ? NAMES[user] : user,
      timestamp: Date.now(),
      count: wuSnoozeCount
    });
  }
  notifyPartnerSnoozed();
  toast('Snoozing for ' + WU_SNOOZE_MINUTES + ' minutes...');

  // Re-fire after snooze duration
  wuAlarmTimer = setTimeout(function () {
    wuAlarmPlaying = true;
    startAlarmSound();
    if (navigator.vibrate) navigator.vibrate([300, 200, 300, 200, 300, 200, 300]);
    // Re-show overlay with updated snooze count
    var today = localDate();
    db.ref('wakeup/alarms/' + today + '/' + user).once('value', function (snap) {
      var alarm = snap.val();
      if (!alarm) return;
      db.ref('wakeup/goodnight/' + today + '/' + partner).once('value', function (gnSnap) {
        showWakeUpOverlay(alarm, gnSnap.val());
      });
    });
  }, WU_SNOOZE_MINUTES * 60 * 1000);
}

/* ---------- partner notifications ---------- */

function notifyPartnerAlarmFired() {
  var name = typeof NAMES !== 'undefined' ? NAMES[user] : 'Your partner';
  if (typeof sendPushNotification === 'function') {
    sendPushNotification(
      'Alarm Ringing!',
      name + '\'s alarm is going off right now',
      'icons/icon-192x192.png'
    );
  }
  if (typeof sendInAppNotif === 'function') {
    sendInAppNotif('wakeup', name + '\'s alarm is ringing!', '');
  }
}

function notifyPartnerAwake() {
  var name = typeof NAMES !== 'undefined' ? NAMES[user] : 'Your partner';
  var msg = wuSnoozeCount > 0
    ? name + ' is finally awake! (snoozed ' + wuSnoozeCount + ' time' + (wuSnoozeCount > 1 ? 's' : '') + ')'
    : name + ' is awake! Good morning!';
  if (typeof sendPushNotification === 'function') {
    sendPushNotification('Good Morning!', msg, 'icons/icon-192x192.png');
  }
  if (typeof sendInAppNotif === 'function') {
    sendInAppNotif('wakeup', msg, '');
  }
}

function notifyPartnerSnoozed() {
  var name = typeof NAMES !== 'undefined' ? NAMES[user] : 'Your partner';
  if (typeof sendPushNotification === 'function') {
    sendPushNotification(
      '5 more minutes...',
      name + ' hit snooze (' + wuSnoozeCount + ' time' + (wuSnoozeCount > 1 ? 's' : '') + ')',
      'icons/icon-192x192.png'
    );
  }
}

/* ---------- listen for partner wake events ---------- */

function listenPartnerWakeEvents() {
  if (!db || !user) return;
  var today = localDate();

  // Partner confirmed awake
  db.ref('wakeup/confirmations/' + today + '/' + partner).on('value', function (snap) {
    var conf = snap.val();
    if (!conf) return;
    var partnerName = typeof NAMES !== 'undefined' ? NAMES[partner] : 'Your partner';
    var snoozeTxt = conf.snoozeCount > 0
      ? ' (after ' + conf.snoozeCount + ' snooze' + (conf.snoozeCount > 1 ? 's' : '') + ')'
      : '';
    // Update the morning section
    var greetingEl = document.getElementById('wu-morning-greeting');
    if (greetingEl) {
      greetingEl.innerHTML = partnerName + ' is awake!' + snoozeTxt +
        ' <span style="font-size:12px;color:var(--t3)">' +
        new Date(conf.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        '</span>';
    }
  });

  // Partner snoozed
  db.ref('wakeup/snoozes/' + today).orderByChild('from').equalTo(partner)
    .on('child_added', function (snap) {
      var s = snap.val();
      if (!s || Date.now() - s.timestamp > 10000) return; // only show fresh snoozes
      var partnerName = typeof NAMES !== 'undefined' ? NAMES[partner] : 'Your love';
      toast(partnerName + ' hit snooze... ' + WU_SNOOZE_MINUTES + ' more minutes');
    });
}

/* ---------- hook into setWakeUpTime to auto-schedule ---------- */

var _origSetWakeUpTime = setWakeUpTime;
setWakeUpTime = function () {
  _origSetWakeUpTime();
  // Schedule alarm after a short delay so Firebase write completes
  setTimeout(scheduleAlarm, 1500);
};

/* ---------- restore alarm on page load ---------- */

function restoreAlarmOnLoad() {
  var stored = localStorage.getItem('met_wu_scheduled');
  if (!stored) return;
  try {
    var data = JSON.parse(stored);
    if (data.date !== localDate()) {
      localStorage.removeItem('met_wu_scheduled');
      return;
    }
    scheduleAlarm();
  } catch (e) { /* ignore */ }
}

/* ---------- patch initWakeUp to include alarm engine ---------- */

var _origInitWakeUp = initWakeUp;
initWakeUp = function () {
  _origInitWakeUp();
  restoreAlarmOnLoad();
  listenPartnerWakeEvents();
};

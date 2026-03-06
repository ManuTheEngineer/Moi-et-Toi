// ===== MOOD =====
let selectedEnergy = 3;
let selectedSleep = 0;
let selectedStress = 0;
let selectedTags = [];

function selMood(val, el) {
  selectedMood = val;
  document.querySelectorAll('#mood-grid .pill-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
}

function selEnergy(val, el) {
  selectedEnergy = val;
  document.querySelectorAll('#energy-grid .pill-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
}

function selSleep(val, el) {
  selectedSleep = val;
  document.querySelectorAll('#sleep-grid .pill-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
}

function selStress(val, el) {
  selectedStress = val;
  document.querySelectorAll('#stress-grid .pill-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
}

function toggleTag(el) {
  const tag = el.dataset.tag;
  el.classList.toggle('sel');
  if (selectedTags.includes(tag)) {
    selectedTags = selectedTags.filter(t => t !== tag);
  } else {
    selectedTags.push(tag);
  }
}

async function submitMood() {
  if (!selectedMood) { toast('Pick a mood first'); return; }
  const btn = document.getElementById('mood-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  const entry = {
    mood: selectedMood,
    energy: selectedEnergy,
    note: document.getElementById('mood-note').value.trim(),
    user: user,
    userName: NAMES[user],
    timestamp: Date.now(),
    date: localDate()
  };
  if (selectedSleep) entry.sleep = selectedSleep;
  if (selectedStress) entry.stress = selectedStress;
  if (selectedTags.length) entry.tags = selectedTags;
  const dedicated = document.getElementById('mood-dedicate-check');
  if (dedicated && dedicated.checked) entry.dedicatedTo = partner;

  const key = db.ref('moods').push().key;
  await db.ref('moods/' + key).set(entry);
  document.getElementById('mood-note').value = '';
  if (dedicated) dedicated.checked = false;
  selectedMood = 0;
  selectedEnergy = 3;
  selectedSleep = 0;
  selectedStress = 0;
  selectedTags = [];
  document.querySelectorAll('#mood-grid .pill-btn, #energy-grid .pill-btn, #sleep-grid .pill-btn, #stress-grid .pill-btn').forEach(b => b.classList.remove('sel'));
  document.querySelectorAll('.mood-tag').forEach(b => b.classList.remove('sel'));
  updateStreak();
  if (typeof logActivity === 'function') logActivity('mood', 'checked in');
  if (entry.dedicatedTo) toast('Dedicated to ' + NAMES[partner] + ' 💕');
  else toast('Checked in');
  if (btn) { btn.textContent = 'Saved'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Check in'; }, 1500); }
}

function listenMoods() {
  db.ref('moods').orderByChild('timestamp').limitToLast(50).on('value', snap => {
    const moods = [];
    snap.forEach(c => moods.push(c.val()));
    moods.reverse();
    renderMoodFeed(moods);
    renderDashMoods(moods);
  });
}

function renderMoodFeed(moods) {
  const el = document.getElementById('mood-feed');
  if (!moods.length) { el.innerHTML = '<div class="empty">Your mood story starts with one check-in</div>'; return; }
  const emojis = ['', '😴', '😐', '🙂', '😊', '🔥'];
  const energyLbls = ['', 'Drained', 'Low', 'Steady', 'Strong', 'On fire'];
  const sleepLbls = ['', 'Awful', 'Poor', 'Okay', 'Good', 'Amazing'];
  const stressLbls = ['', 'Calm', 'Light', 'Some', 'High', 'Max'];
  el.innerHTML = moods.map(m => {
    const t = new Date(m.timestamp);
    const ts = timeAgo(t);
    let details = [energyLbls[m.energy] + ' energy'];
    if (m.sleep) details.push(sleepLbls[m.sleep] + ' sleep');
    if (m.stress) details.push(stressLbls[m.stress] + ' stress');
    const tagHtml = m.tags ? m.tags.map(t => `<span class="mh-tag">#${t}</span>`).join('') : '';
    const dedicateHtml = m.dedicatedTo ? `<div class="mh-dedicate">💕 For ${m.dedicatedTo === user ? 'you' : NAMES[m.dedicatedTo]}</div>` : '';
    return `<div class="mh-item">
      <div class="mh-emoji">${emojis[m.mood]}</div>
      <div class="mh-info">
        <div class="mh-name">${m.user === user ? 'You' : (m.userName || '?')}</div>
        <div class="mh-detail">${details.join(' · ')}</div>
        ${tagHtml ? `<div class="mh-tags">${tagHtml}</div>` : ''}
        ${m.note ? `<div class="mh-note">${esc(m.note)}</div>` : ''}
        ${dedicateHtml}
      </div>
      <div class="mh-time">${ts}</div>
    </div>`;
  }).join('');
}

function renderDashMoods(moods) {
  const emojis = ['', '😴', '😐', '🙂', '😊', '🔥'];
  const labels = ['', 'Low', 'Meh', 'Good', 'Great', 'Amazing'];
  const today = localDate();

  const myToday = moods.find(m => m.user === user && m.date === today);
  const partnerToday = moods.find(m => m.user === partner && m.date === today);

  // Compact inline mood indicators (inside pulse card)
  const myEl = document.getElementById('today-mood');
  if (myEl) {
    if (myToday) {
      myEl.innerHTML = `<span style="font-size:20px">${emojis[myToday.mood]}</span><span style="font-size:11px;color:var(--cream)">You: ${labels[myToday.mood]}</span>`;
    } else {
      myEl.innerHTML = `<span style="font-size:11px;color:var(--t3);cursor:pointer" onclick="event.stopPropagation();go('mood')">You: Tap to check in</span>`;
    }
  }

  const pEl = document.getElementById('partner-mood');
  if (pEl) {
    if (partnerToday) {
      pEl.innerHTML = `<span style="font-size:20px">${emojis[partnerToday.mood]}</span><span style="font-size:11px;color:var(--cream)">${NAMES[partner]}: ${labels[partnerToday.mood]}</span>`;
    } else {
      pEl.innerHTML = `<span style="font-size:11px;color:var(--t3)">${NAMES[partner]}: Waiting...</span>`;
    }
  }

  // Update partner name on dashboard
  const partnerNameEl = document.getElementById('dash-partner-name');
  if (partnerNameEl) partnerNameEl.textContent = NAMES[partner];

  // Render dashboard mood chart and mood page analytics
  renderMoodChart(moods);
  renderMoodDonut(moods);
}

// ===== SVG MOOD TREND CHART (Dashboard) =====
function renderMoodChart(moods) {
  // Render sparkline for compact dashboard view
  if (typeof renderDashSparkline === 'function') renderDashSparkline(moods);

  const line = document.getElementById('chart-line');
  const area = document.getElementById('chart-area');
  if (!line || !area) return;

  // Get last 7 days of mood data
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(localDate(d));
  }

  const myMoods = days.map(d => {
    const m = moods.find(x => x.user === user && x.date === d);
    return m ? m.mood : null;
  });
  const partnerMoods = days.map(d => {
    const m = moods.find(x => x.user === partner && x.date === d);
    return m ? m.mood : null;
  });

  // Chart dimensions
  const xStart = 25, xEnd = 310, yTop = 10, yBot = 90;
  const xStep = (xEnd - xStart) / 6;

  function moodToY(v) { return yBot - ((v - 1) / 4) * (yBot - yTop); }

  // Build path for user's moods
  let lineD = '', areaD = '', first = true;
  myMoods.forEach((v, i) => {
    if (v === null) return;
    const x = xStart + i * xStep, y = moodToY(v);
    if (first) { lineD = `M${x},${y}`; areaD = `M${x},${yBot} L${x},${y}`; first = false; }
    else { lineD += ` L${x},${y}`; areaD += ` L${x},${y}`; }
  });
  if (!first) areaD += ` L${xStart + (myMoods.length - 1 - [...myMoods].reverse().findIndex(v => v !== null)) * xStep},${yBot} Z`;

  line.setAttribute('d', lineD || `M${xStart},50`);
  area.setAttribute('d', areaD || `M${xStart},${yBot} L${xEnd},${yBot}`);

  // Add partner line if exists
  const svg = document.getElementById('mood-chart');
  let pLine = svg.querySelector('.chart-line-partner');
  if (!pLine) {
    pLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pLine.classList.add('chart-line-partner');
    pLine.setAttribute('fill', 'none');
    pLine.setAttribute('stroke', 'var(--chart-2)');
    pLine.setAttribute('stroke-width', '2');
    pLine.setAttribute('stroke-dasharray', '4 3');
    pLine.setAttribute('opacity', '0.7');
    svg.appendChild(pLine);
  }
  let pLineD = '', pFirst = true;
  partnerMoods.forEach((v, i) => {
    if (v === null) return;
    const x = xStart + i * xStep, y = moodToY(v);
    if (pFirst) { pLineD = `M${x},${y}`; pFirst = false; }
    else { pLineD += ` L${x},${y}`; }
  });
  pLine.setAttribute('d', pLineD || '');

  // Add day labels
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let existingLabels = svg.querySelectorAll('.chart-day-label');
  existingLabels.forEach(l => l.remove());
  days.forEach((d, i) => {
    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.classList.add('chart-day-label');
    txt.setAttribute('x', xStart + i * xStep);
    txt.setAttribute('y', 110);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('fill', 'var(--t3)');
    txt.setAttribute('font-size', '8');
    txt.setAttribute('font-family', 'Outfit, sans-serif');
    txt.textContent = dayNames[new Date(d + 'T12:00:00').getDay()];
    svg.appendChild(txt);
  });

  // Add dots for user's data points
  svg.querySelectorAll('.chart-dot').forEach(d => d.remove());
  myMoods.forEach((v, i) => {
    if (v === null) return;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.classList.add('chart-dot');
    circle.setAttribute('cx', xStart + i * xStep);
    circle.setAttribute('cy', moodToY(v));
    circle.setAttribute('r', '3.5');
    circle.setAttribute('fill', 'var(--chart-1)');
    svg.appendChild(circle);
  });
}

// ===== MOOD DISTRIBUTION DONUT (Mood Page) =====
function renderMoodDonut(moods) {
  const svg = document.getElementById('mood-donut');
  const avgEl = document.getElementById('donut-avg');
  const legendEl = document.getElementById('donut-legend');
  if (!svg || !avgEl || !legendEl) return;

  // Get user's moods from last 30 days
  const cutoff = Date.now() - 30 * 86400000;
  const myMoods = moods.filter(m => m.user === user && m.timestamp > cutoff);

  if (!myMoods.length) {
    avgEl.textContent = '--';
    legendEl.innerHTML = '<div style="font-size:11px;color:var(--t3)">Check in to see your distribution</div>';
    return;
  }

  // Count distribution
  const counts = [0, 0, 0, 0, 0]; // moods 1-5
  myMoods.forEach(m => { if (m.mood >= 1 && m.mood <= 5) counts[m.mood - 1]++; });
  const total = myMoods.length;
  const avg = (myMoods.reduce((s, m) => s + m.mood, 0) / total).toFixed(1);
  avgEl.textContent = avg;

  const moodLabels = ['Low', 'Meh', 'Good', 'Great', 'Amazing'];
  const colors = ['var(--chart-3)', 'var(--chart-5)', 'var(--chart-1)', 'var(--chart-4)', 'var(--chart-2)'];

  // Remove old segments
  svg.querySelectorAll('.donut-seg').forEach(s => s.remove());

  // Draw donut segments
  const r = 52, circumference = 2 * Math.PI * r;
  let offset = 0;
  counts.forEach((count, i) => {
    if (count === 0) return;
    const pct = count / total;
    const dash = pct * circumference;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.classList.add('donut-seg');
    circle.setAttribute('cx', '70');
    circle.setAttribute('cy', '70');
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', colors[i]);
    circle.setAttribute('stroke-width', '28');
    circle.setAttribute('stroke-dasharray', `${dash} ${circumference - dash}`);
    circle.setAttribute('stroke-dashoffset', String(-offset));
    circle.setAttribute('transform', 'rotate(-90 70 70)');
    svg.appendChild(circle);
    offset += dash;
  });

  // Build legend
  legendEl.innerHTML = counts.map((c, i) => {
    if (c === 0) return '';
    const pct = Math.round(c / total * 100);
    return `<div class="chart-legend-item"><div class="chart-legend-dot" style="background:${colors[i]}"></div>${moodLabels[i]} <span style="color:var(--t3);margin-left:4px">${pct}%</span></div>`;
  }).filter(Boolean).join('');
}

// ===== STREAK CALENDAR (Mood Page) =====
function renderStreakCalendar() {
  const el = document.getElementById('streak-cal');
  if (!el || !db) return;

  db.ref('moods').orderByChild('timestamp').limitToLast(100).once('value', snap => {
    const moods = [];
    snap.forEach(c => moods.push(c.val()));

    // Build a map of date -> which users checked in
    const dayMap = {};
    moods.forEach(m => {
      if (!m.date) return;
      if (!dayMap[m.date]) dayMap[m.date] = new Set();
      dayMap[m.date].add(m.user);
    });

    // Generate last 28 days
    const today = new Date();
    const todayStr = localDate(today);
    let html = '';
    for (let i = 27; i >= 0; i--) {
      const d = new Date(); d.setDate(today.getDate() - i);
      const dateStr = localDate(d);
      const users = dayMap[dateStr];
      const isToday = dateStr === todayStr;
      const hasMe = users && users.has(user);
      const hasBoth = users && users.has(user) && users.has(partner);

      let cls = 'streak-day';
      if (hasMe) cls += ' active';
      if (hasBoth) cls += ' both';
      if (isToday) cls += ' today';
      html += `<div class="${cls}" title="${dateStr}">${d.getDate()}</div>`;
    }
    el.innerHTML = html;
  });
}

// ===== AI CHAT =====
let aiContext = 'general';
const AI_CONTEXTS = {
  general: { label: 'General', icon: '💬', desc: 'Casual chat, advice, brainstorming' },
  relationship: { label: 'Relationship', icon: '💕', desc: 'Mood data, health score, coaching' },
  fitness: { label: 'Fitness', icon: '🏋️', desc: 'Workouts, goals, progress' },
  finances: { label: 'Finances', icon: '💰', desc: 'Spending, budgets, savings' },
  goals: { label: 'Goals', icon: '🎯', desc: 'Goals, habits, growth' },
  planning: { label: 'Planning', icon: '📅', desc: 'Calendar, dates, coordination' }
};

const AI_TOOLS = [
  {
    name: 'log_mood',
    description: 'Log a mood check-in for the current user. Use when the user tells you how they feel.',
    input_schema: {
      type: 'object',
      properties: {
        mood: { type: 'integer', minimum: 1, maximum: 5, description: '1=struggling, 2=low, 3=okay, 4=good, 5=thriving' },
        energy: { type: 'integer', minimum: 1, maximum: 5, description: '1=drained to 5=energized' },
        note: { type: 'string', description: 'Optional note about the mood' }
      },
      required: ['mood', 'energy']
    }
  },
  {
    name: 'get_mood_stats',
    description: 'Get mood statistics for a user over a time period. Returns averages, trends, streaks.',
    input_schema: {
      type: 'object',
      properties: {
        user: { type: 'string', enum: ['her', 'him', 'both'], description: 'Whose mood stats to get' },
        period: { type: 'string', enum: ['7d', '30d', '90d', 'all'], description: 'Time period' }
      },
      required: ['user', 'period']
    }
  },
  {
    name: 'add_expense',
    description: 'Log an expense to the shared finance tracker.',
    input_schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Amount in dollars' },
        category: { type: 'string', enum: ['food', 'transport', 'housing', 'entertainment', 'shopping', 'health', 'subscriptions', 'other'] },
        note: { type: 'string', description: 'What the expense was for' }
      },
      required: ['amount', 'category']
    }
  },
  {
    name: 'send_note',
    description: 'Send a love note/letter to the partner.',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'The note/letter content' }
      },
      required: ['message']
    }
  },
  {
    name: 'get_relationship_health',
    description: 'Get the relationship health score with detailed breakdown. Shows mood sync, communication, goals, fitness, and financial alignment.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'add_calendar_event',
    description: 'Add an event to the shared calendar.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        notes: { type: 'string', description: 'Optional notes' }
      },
      required: ['title', 'date']
    }
  },
  {
    name: 'create_goal',
    description: 'Create a new personal or shared goal.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Goal title' },
        type: { type: 'string', enum: ['personal', 'shared'], description: 'Personal or shared with partner' }
      },
      required: ['title']
    }
  },
  {
    name: 'get_financial_summary',
    description: 'Get spending summary for the current month. Returns total spent, by category, budget remaining.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['this_month', 'last_month', 'this_week'], description: 'Time period' }
      },
      required: ['period']
    }
  }
];

function setAIContext(ctx) {
  aiContext = ctx;
  document.querySelectorAll('.ai-ctx-pill').forEach(el => {
    el.classList.toggle('active', el.dataset.ctx === ctx);
  });
  const placeholder = {
    general: 'Ask me anything...',
    relationship: 'How are we doing this week?',
    fitness: 'Create a workout plan for me',
    finances: 'How much did we spend this month?',
    goals: 'Help me set a new goal',
    planning: 'Plan a date night for us'
  };
  const input = document.getElementById('chat-input');
  if (input) input.placeholder = placeholder[ctx] || 'Ask me anything...';
}

function buildAISystemPrompt() {
  let prompt = `You are the AI inside "Moi et Toi," a private relationship app for ${NAMES.him} and ${NAMES.her}. The current user is ${NAMES[user]} (${user}).

WHO THEY ARE:
- ${NAMES.him} (him) is from Togo, West Africa. Ewe, Mina, French. Togolese traditions, values, and food.
- ${NAMES.her} (her) is from Texas. Southern roots, Texan culture, American traditions.
- They're an intercultural couple — young, ambitious, building toward marriage and family.

YOUR ROLE:
- Their trusted friend. Part of the inner circle. Not a chatbot.
- Be warm, honest, direct, and concise. Use their names.
- You have TOOLS that let you read and write data in the app. Use them proactively when the conversation calls for it — don't just chat, take action.
- When a user tells you how they feel, log their mood. When they mention spending, log an expense. Be proactive.`;

  // Add context-specific data
  if (aiContext === 'relationship' && typeof MET !== 'undefined' && MET._ready) {
    const moodStats = MET.mood.stats || {};
    prompt += `\n\nRELATIONSHIP CONTEXT:
- Relationship health score: ${MET.relationship.score || 'not yet computed'}
- Breakdown: ${JSON.stringify(MET.relationship.breakdown || {})}
- ${NAMES.her}'s 7-day mood avg: ${moodStats.her?.avg7d?.toFixed(1) || 'no data'}
- ${NAMES.him}'s 7-day mood avg: ${moodStats.him?.avg7d?.toFixed(1) || 'no data'}
- Mood sync score: ${moodStats.joint?.syncScore ? Math.round(moodStats.joint.syncScore * 100) + '%' : 'no data'}
- Check-in streak: ${moodStats.joint?.streak || 0} days
Use this data to provide specific, personalized relationship insights.`;
  }

  if (aiContext === 'fitness' && typeof MET !== 'undefined' && MET._ready) {
    const fitStats = MET.fitness.stats || {};
    prompt += `\n\nFITNESS CONTEXT:
- ${NAMES[user]}'s workouts last 7 days: ${fitStats[user]?.last7 || 0}
- ${NAMES[user]}'s workouts last 30 days: ${fitStats[user]?.last30 || 0}
- Total volume trend: ${fitStats[user]?.volumeTrend || 'no data'}
- Partner sync days: ${fitStats.syncDays || 0}
Use this data to help with workout planning and fitness coaching.`;
  }

  if (aiContext === 'finances' && typeof MET !== 'undefined' && MET._ready) {
    const finStats = MET.finance.stats || {};
    prompt += `\n\nFINANCE CONTEXT:
- This month total: $${finStats.thisMonth?.total?.toFixed(2) || '0'}
- Top category: ${finStats.thisMonth?.topCategory || 'no data'}
- Budget utilization: ${finStats.thisMonth?.budgetPct ? Math.round(finStats.thisMonth.budgetPct * 100) + '%' : 'no data'}
Use this data to help with budgeting and spending analysis.`;
  }

  if (aiContext === 'goals') {
    prompt += `\n\nGOALS CONTEXT: Help with setting, tracking, and achieving goals. Both personal development and shared couple goals. Be a supportive coach.`;
  }

  if (aiContext === 'planning') {
    prompt += `\n\nPLANNING CONTEXT: Help plan dates, coordinate schedules, suggest activities. Consider both Togolese and Texan cultural activities. Be creative and specific.`;
  }

  return prompt;
}

async function executeAITool(toolName, toolInput) {
  switch (toolName) {
    case 'log_mood': {
      if (!db) return { error: 'Database not connected' };
      const today = new Date().toISOString().split('T')[0];
      await db.ref('moods').push({
        mood: toolInput.mood,
        energy: toolInput.energy,
        note: toolInput.note || '',
        user, userName: NAMES[user],
        timestamp: Date.now(), date: today
      });
      return { success: true, message: `Mood logged: ${toolInput.mood}/5, energy ${toolInput.energy}/5` };
    }
    case 'get_mood_stats': {
      if (!MET._ready) return { error: 'Metrics not loaded yet' };
      const target = toolInput.user;
      const stats = MET.mood.stats;
      if (target === 'both') {
        return {
          him: { avg7d: stats.him?.avg7d, avg30d: stats.him?.avg30d, streak: stats.him?.streak, total: stats.him?.total },
          her: { avg7d: stats.her?.avg7d, avg30d: stats.her?.avg30d, streak: stats.her?.streak, total: stats.her?.total },
          joint: { syncScore: stats.joint?.syncScore, bestDay: stats.joint?.bestDay, streak: stats.joint?.streak }
        };
      }
      const s = stats[target] || {};
      return { avg7d: s.avg7d, avg30d: s.avg30d, avg90d: s.avg90d, streak: s.streak, total: s.total, trend: s.trend };
    }
    case 'add_expense': {
      if (!db) return { error: 'Database not connected' };
      const today = new Date().toISOString().split('T')[0];
      await db.ref('finances/expenses').push({
        amount: toolInput.amount,
        category: toolInput.category,
        note: toolInput.note || '',
        paidBy: user,
        date: today,
        timestamp: Date.now()
      });
      return { success: true, message: `Expense logged: $${toolInput.amount} (${toolInput.category})` };
    }
    case 'send_note': {
      if (!db) return { error: 'Database not connected' };
      await db.ref('letters').push({
        from: user, fromName: NAMES[user],
        message: toolInput.message,
        timestamp: Date.now(), read: false
      });
      return { success: true, message: 'Note sent to ' + NAMES[partner] };
    }
    case 'get_relationship_health': {
      if (!MET._ready) return { error: 'Metrics not loaded yet' };
      return { score: MET.relationship.score, breakdown: MET.relationship.breakdown };
    }
    case 'add_calendar_event': {
      if (!db) return { error: 'Database not connected' };
      await db.ref('calendar').push({
        title: toolInput.title,
        date: toolInput.date,
        notes: toolInput.notes || '',
        createdBy: user,
        timestamp: Date.now()
      });
      return { success: true, message: `Event "${toolInput.title}" added for ${toolInput.date}` };
    }
    case 'create_goal': {
      if (!db) return { error: 'Database not connected' };
      const isShared = toolInput.type === 'shared';
      const path = isShared ? 'personalGoals/shared' : 'personalGoals/' + user;
      await db.ref(path).push({
        title: toolInput.title,
        done: false,
        timestamp: Date.now()
      });
      return { success: true, message: `Goal created: "${toolInput.title}"` };
    }
    case 'get_financial_summary': {
      if (!MET._ready) return { error: 'Metrics not loaded yet' };
      const stats = MET.finance.stats;
      if (toolInput.period === 'this_month') {
        return stats.thisMonth || { total: 0, byCategory: {}, message: 'No expenses this month' };
      }
      return stats[toolInput.period] || { message: 'No data for this period' };
    }
    default:
      return { error: 'Unknown tool: ' + toolName };
  }
}

async function sendAI() {
  // Check for API key
  if (!CLAUDE_API_KEY) {
    const key = prompt('Enter your Anthropic API key (one-time setup, works for both of you):');
    if (!key || !key.startsWith('sk-ant-')) { toast('Invalid API key'); return; }
    CLAUDE_API_KEY = key;
    await db.ref('profiles/apiKey').set(key);
    toast('API key saved');
  }

  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const msgEl = document.getElementById('chat-messages');
  msgEl.innerHTML += `<div class="chat-msg user"><div class="msg-from">${NAMES[user]}</div>${esc(text)}</div>`;

  chatHistory.push({ role: 'user', content: `[${NAMES[user]}]: ${text}` });

  document.getElementById('typing').classList.add('on');
  msgEl.scrollTop = msgEl.scrollHeight;

  try {
    // Build request with tools
    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildAISystemPrompt(),
      messages: chatHistory,
      tools: AI_TOOLS
    };

    let response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify(requestBody)
    });
    let data = await response.json();

    // Handle tool use loop (max 5 iterations)
    let iterations = 0;
    while (data.stop_reason === 'tool_use' && iterations < 5) {
      iterations++;
      const assistantContent = data.content || [];
      chatHistory.push({ role: 'assistant', content: assistantContent });

      // Process all tool calls
      const toolResults = [];
      for (const block of assistantContent) {
        if (block.type === 'tool_use') {
          // Show tool use in UI
          const toolLabel = { log_mood: '📊 Logging mood', get_mood_stats: '📈 Getting mood stats', add_expense: '💳 Logging expense', send_note: '💌 Sending note', get_relationship_health: '💕 Checking relationship health', add_calendar_event: '📅 Adding event', create_goal: '🎯 Creating goal', get_financial_summary: '💰 Getting finances' };
          msgEl.innerHTML += `<div class="chat-tool-call">${toolLabel[block.name] || '🔧 ' + block.name}</div>`;
          msgEl.scrollTop = msgEl.scrollHeight;

          const result = await executeAITool(block.name, block.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result)
          });
        }
      }

      chatHistory.push({ role: 'user', content: toolResults });

      // Continue conversation with tool results
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: buildAISystemPrompt(),
          messages: chatHistory,
          tools: AI_TOOLS
        })
      });
      data = await response.json();
    }

    // Extract final text response
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    const reply = textBlocks.map(b => b.text).join('\n') || 'Done!';
    chatHistory.push({ role: 'assistant', content: data.content || reply });

    document.getElementById('typing').classList.remove('on');
    msgEl.innerHTML += `<div class="chat-msg ai"><div class="msg-from">Claude</div>${formatAIReply(reply)}</div>`;
    msgEl.scrollTop = msgEl.scrollHeight;
  } catch (err) {
    document.getElementById('typing').classList.remove('on');
    msgEl.innerHTML += `<div class="chat-msg ai"><div class="msg-from">Claude</div>Connection error. Check your API key in the config.</div>`;
  }
}

function formatAIReply(text) {
  // Basic markdown-ish formatting
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// ===== WORKOUT LOG =====
function openLog(type) {
  logType = type; logExercises = [];
  document.getElementById('log-type').textContent = type;
  document.getElementById('ex-list').innerHTML = '';
  document.getElementById('log-notes').value = '';
  document.getElementById('lmod').classList.add('on');
  updLogSliders();
}
function closeLog() { document.getElementById('lmod').classList.remove('on'); }

function addEx() {
  const n = document.getElementById('ex-n').value.trim();
  const s = document.getElementById('ex-s').value.trim();
  const r = document.getElementById('ex-r').value.trim();
  if (!n) return;
  logExercises.push({ name: n, sets: s, reps: r });
  document.getElementById('ex-list').innerHTML += `<div class="lei"><span>${n}</span><span>${s ? s + 's ' : ''}${r ? r + 'r' : ''}</span></div>`;
  document.getElementById('ex-n').value = '';
  document.getElementById('ex-s').value = '';
  document.getElementById('ex-r').value = '';
  document.getElementById('ex-n').focus();
}

function updLogSliders() {
  const eLabels = ['', 'Drained', 'Low', 'Steady', 'Strong', 'On fire'];
  const mLabels = ['', 'Tough', 'Okay', 'Good', 'Great', 'Amazing'];
  document.getElementById('log-e').oninput = function() { document.getElementById('log-ev').textContent = eLabels[this.value]; };
  document.getElementById('log-m').oninput = function() { document.getElementById('log-mv').textContent = mLabels[this.value]; };
}

async function submitLog() {
  const entry = {
    workoutType: logType,
    exercises: logExercises,
    energy: parseInt(document.getElementById('log-e').value),
    mood: parseInt(document.getElementById('log-m').value),
    notes: document.getElementById('log-notes').value.trim(),
    user: user,
    userName: NAMES[user],
    timestamp: Date.now(),
    date: localDate()
  };
  const key = db.ref('workoutLogs').push().key;
  await db.ref('workoutLogs/' + key).set(entry);
  closeLog();
  if (typeof logActivity === 'function') logActivity('fitness', 'logged a workout');
  toast('Workout logged');
}

// ===== TAPS (Thinking of You) =====
const TAP_MSGS = {
  hug: 'Sending a warm hug',
  kiss: 'Blowing a kiss',
  love: 'Sending all my love',
  miss: 'Missing you right now',
  thinking: 'Thinking of you'
};
const TAP_EMOJIS = { hug:'🤗', kiss:'💋', love:'❤️', miss:'🥺', thinking:'💭' };

async function sendTap(e, type, emoji) {
  if (!db || !user) return;
  const btn = e.currentTarget;
  const entry = {
    type: type,
    from: user,
    fromName: NAMES[user],
    timestamp: Date.now()
  };
  await db.ref('taps').push(entry);
  if (typeof logActivity === 'function') logActivity('taps', 'sent ' + type);
  // Haptic feedback if available
  if (navigator.vibrate) navigator.vibrate(50);
  // Show sent animation on the button
  if (btn) { btn.classList.add('sent'); setTimeout(() => btn.classList.remove('sent'), 500); }
  toast(TAP_MSGS[type] + ' ♡');
}

function listenTaps() {
  db.ref('taps').orderByChild('timestamp').limitToLast(20).on('value', snap => {
    const taps = [];
    snap.forEach(c => taps.push(c.val()));
    taps.reverse();
    renderTapFeed(taps);
    // Check for new incoming tap to show overlay
    if (taps.length > 0) {
      const latest = taps[0];
      if (latest.from !== user && Date.now() - latest.timestamp < 5000) {
        showTapOverlay(latest.type);
      }
    }
  });
}

function renderTapFeed(taps) {
  const el = document.getElementById('tap-feed');
  if (!el) return;
  if (!taps.length) { el.innerHTML = '<div class="empty">Send a quick tap — let them know you are thinking of them</div>'; return; }
  el.innerHTML = taps.slice(0, 15).map(t => {
    const time = new Date(t.timestamp);
    const ts = timeAgo(time);
    const emoji = TAP_EMOJIS[t.type] || '♡';
    const isMe = t.from === user;
    return `<div class="tap-item">
      <div class="tap-type">${emoji}</div>
      <div class="tap-from">${isMe ? 'You' : t.fromName} <span style="color:var(--t3);font-weight:300;font-size:10px">${TAP_MSGS[t.type] || ''}</span></div>
      <div class="tap-time">${ts}</div>
    </div>`;
  }).join('');
}

function showTapOverlay(type) {
  const overlay = document.getElementById('tap-overlay');
  const emoji = document.getElementById('tap-big-emoji');
  const msg = document.getElementById('tap-big-msg');
  if (!overlay || !emoji || !msg) return;
  emoji.textContent = TAP_EMOJIS[type] || '♡';
  msg.textContent = NAMES[partner] + ' ' + (TAP_MSGS[type] || 'sent you love');
  overlay.classList.add('on');
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  setTimeout(() => overlay.classList.remove('on'), 2200);
}

// ===== LOVE LETTERS =====
function letterFormat(before, after) {
  const ta = document.getElementById('letter-input');
  if (!ta) return;
  const start = ta.selectionStart, end = ta.selectionEnd;
  const text = ta.value;
  const selected = text.substring(start, end) || 'text';
  ta.value = text.substring(0, start) + before + selected + after + text.substring(end);
  ta.focus();
  ta.setSelectionRange(start + before.length, start + before.length + selected.length);
}

function letterInsert(emoji) {
  const ta = document.getElementById('letter-input');
  if (!ta) return;
  const start = ta.selectionStart;
  ta.value = ta.value.substring(0, start) + emoji + ta.value.substring(ta.selectionEnd);
  ta.focus();
  ta.setSelectionRange(start + emoji.length, start + emoji.length);
}

function formatLetterText(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function toggleOpenWhen() {
  const check = document.getElementById('ow-check');
  const select = document.getElementById('ow-tag');
  if (select) select.style.display = check.checked ? 'block' : 'none';
}

async function sendLetter() {
  if (!db || !user) return;
  const input = document.getElementById('letter-input');
  const btn = document.getElementById('letter-send-btn');
  const text = input.value.trim();
  if (!text) { toast('Write something first'); return; }

  const owCheck = document.getElementById('ow-check');
  const owTag = document.getElementById('ow-tag');
  const isOpenWhen = owCheck && owCheck.checked && owTag && owTag.value;

  if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

  if (isOpenWhen) {
    // Save as sealed "open when" letter
    await db.ref('openWhenLetters').push({
      from: user, fromName: NAMES[user],
      message: text, openWhen: owTag.value,
      timestamp: Date.now(), opened: false
    });
    owCheck.checked = false;
    owTag.style.display = 'none';
    owTag.value = '';
    toast('Sealed letter saved 💌');
  } else {
    const entry = {
      from: user, fromName: NAMES[user],
      message: text, timestamp: Date.now(), read: false
    };
    await db.ref('letters').push(entry);
    toast('Delivered');
  }
  input.value = '';
  if (typeof logActivity === 'function') logActivity('letters', 'sent a letter');
  if (btn) { btn.textContent = 'Sent'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Send'; }, 1500); }
}

function listenOpenWhenLetters() {
  if (!db) return;
  db.ref('openWhenLetters').orderByChild('timestamp').on('value', snap => {
    const letters = [];
    snap.forEach(c => { const v = c.val(); v._key = c.key; letters.push(v); });
    letters.reverse();
    renderOpenWhenLetters(letters);
  });
}

function renderOpenWhenLetters(letters) {
  const el = document.getElementById('ow-letters');
  if (!el) return;
  // Show only letters addressed to me (from partner)
  const forMe = letters.filter(l => l.from === partner);
  const fromMe = letters.filter(l => l.from === user);
  if (!letters.length) { el.innerHTML = '<div class="empty">No sealed letters yet</div>'; return; }

  const owLabels = { sad: '😢 When you\'re sad', miss: '💭 When you miss me', happy: '😊 When you\'re happy', stressed: '😰 When you\'re stressed', angry: '😤 When you\'re angry at me', bored: '🥱 When you\'re bored', proud: '💪 When you\'re proud', love: '❤️ When you need love', birthday: '🎂 On your birthday', anniversary: '💍 On our anniversary' };

  let html = '';
  if (forMe.length) {
    html += forMe.map(l => {
      if (l.opened) {
        return `<div class="ow-card opened"><div class="ow-tag">${owLabels[l.openWhen] || l.openWhen}</div><div class="ow-msg">${formatLetterText(l.message)}</div><div class="ow-from">From ${l.fromName} · ${timeAgo(l.timestamp)}</div></div>`;
      }
      return `<div class="ow-card sealed" onclick="openSealedLetter('${l._key}')"><div class="ow-seal">💌</div><div class="ow-tag">${owLabels[l.openWhen] || l.openWhen}</div><div class="ow-hint">Tap to open</div></div>`;
    }).join('');
  }
  if (fromMe.length) {
    html += `<div style="font-size:11px;color:var(--t3);margin:12px 0 6px;letter-spacing:1px;text-transform:uppercase">Sent by you</div>`;
    html += fromMe.map(l => {
      return `<div class="ow-card sent"><div class="ow-tag">${owLabels[l.openWhen] || l.openWhen}</div><div class="ow-status">${l.opened ? 'Opened' : 'Sealed'}</div></div>`;
    }).join('');
  }
  el.innerHTML = html;
}

async function openSealedLetter(key) {
  if (!db) return;
  await db.ref('openWhenLetters/' + key + '/opened').set(true);
  toast('Letter opened 💌');
}

function listenLetters() {
  db.ref('letters').orderByChild('timestamp').limitToLast(30).on('value', snap => {
    const letters = [];
    snap.forEach(c => { const v = c.val(); v._key = c.key; letters.push(v); });
    letters.reverse();
    renderLetterFeed(letters);
    // Mark unread letters from partner as read
    letters.forEach(l => {
      if (l.from !== user && !l.read) {
        db.ref('letters/' + l._key + '/read').set(true);
      }
    });
  });
}

function renderLetterFeed(letters) {
  const el = document.getElementById('letter-feed');
  if (!el) return;
  if (!letters.length) { el.innerHTML = '<div class="empty">Write something only they will read</div>'; return; }
  el.innerHTML = letters.map(l => {
    const time = new Date(l.timestamp);
    const ts = timeAgo(time);
    const isMe = l.from === user;
    return `<div class="letter-card ${isMe ? 'from-me' : 'from-them'}">
      <div class="letter-header">
        <span class="letter-from">${isMe ? 'You' : l.fromName}${!isMe && !l.read ? '<span class="letter-unread"></span>' : ''}</span>
        <span class="letter-time">${ts}</span>
      </div>
      <div class="letter-body">${formatLetterText(l.message)}</div>
    </div>`;
  }).join('');
}

// ===== MILESTONES & TIMELINE =====
function toggleMsForm() {
  document.getElementById('ms-form').classList.toggle('on');
}

async function saveMilestone() {
  if (!db || !user) return;
  const title = document.getElementById('ms-title').value.trim();
  const date = document.getElementById('ms-date').value;
  const emoji = document.getElementById('ms-emoji').value.trim() || '✨';
  const desc = document.getElementById('ms-desc').value.trim();
  if (!title || !date) { toast('Title and date required'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  const entry = {
    title, date, emoji, description: desc,
    user: user, userName: NAMES[user], timestamp: Date.now()
  };
  await db.ref('milestones').push(entry);
  document.getElementById('ms-title').value = '';
  document.getElementById('ms-date').value = '';
  document.getElementById('ms-emoji').value = '';
  document.getElementById('ms-desc').value = '';
  if (btn) { btn.disabled = false; btn.textContent = 'Save milestone'; }
  toggleMsForm();
  toast('Milestone saved');
}

function listenMilestones() {
  db.ref('milestones').orderByChild('date').on('value', snap => {
    const milestones = [];
    snap.forEach(c => milestones.push(c.val()));
    milestones.reverse();
    renderTimeline(milestones);
  });
}

function renderTimeline(milestones) {
  const el = document.getElementById('timeline');
  if (!el) return;
  if (!milestones.length) { el.innerHTML = '<div class="empty">Add your first milestone together</div>'; return; }
  el.innerHTML = milestones.map(m => {
    const d = new Date(m.date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `<div class="tl-item">
      <div class="tl-date">${dateStr}</div>
      <div class="tl-title"><span class="tl-emoji">${m.emoji || '✨'}</span>${m.title}</div>
      ${m.description ? `<div class="tl-desc">${m.description}</div>` : ''}
    </div>`;
  }).join('');
}

// ===== COUNTDOWNS =====
function toggleCdForm() {
  document.getElementById('cd-form').classList.toggle('on');
}

async function saveCountdown() {
  if (!db || !user) return;
  const title = document.getElementById('cd-title').value.trim();
  const date = document.getElementById('cd-date').value;
  const emoji = document.getElementById('cd-emoji').value.trim() || '⏳';
  if (!title || !date) { toast('Title and date required'); return; }
  const btn = event?.target; if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  const entry = {
    title, date, emoji,
    createdBy: user, timestamp: Date.now()
  };
  await db.ref('countdowns').push(entry);
  document.getElementById('cd-title').value = '';
  document.getElementById('cd-date').value = '';
  document.getElementById('cd-emoji').value = '';
  if (btn) { btn.disabled = false; btn.textContent = 'Add countdown'; }
  toggleCdForm();
  toast('Countdown added');
}

function listenCountdowns() {
  db.ref('countdowns').on('value', snap => {
    const countdowns = [];
    snap.forEach(c => countdowns.push(c.val()));
    renderCountdowns(countdowns);
  });
}

function renderCountdowns(countdowns) {
  const el = document.getElementById('countdown-grid');
  if (!el) return;
  const now = new Date();
  now.setHours(0,0,0,0);
  const cards = countdowns
    .map(c => {
      const target = new Date(c.date + 'T00:00:00');
      const diff = Math.ceil((target - now) / (1000*60*60*24));
      return { ...c, daysLeft: diff };
    })
    .filter(c => c.daysLeft >= 0)
    .sort((a,b) => a.daysLeft - b.daysLeft);

  let html = cards.map(c => `<div class="cd-card">
    <div class="cd-emoji">${c.emoji || '⏳'}</div>
    <div class="cd-days">${c.daysLeft}</div>
    <div class="cd-unit">${c.daysLeft === 1 ? 'day' : 'days'}</div>
    <div class="cd-title">${c.title}</div>
    <div class="cd-date">${new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
  </div>`).join('');
  html += '<div class="cd-add" onclick="toggleCdForm()"><span>+</span><div>Add Countdown</div></div>';
  el.innerHTML = html;
}

// ===== DAILY QUESTIONS =====
const QUESTIONS = [
  {q:"What's a memory of us you replay in your head?",c:"Memory"},
  {q:"What's something small I do that makes your day?",c:"Deep"},
  {q:"If we could teleport anywhere right now, where would you pick?",c:"Fun"},
  {q:"What song makes you think of us?",c:"Memory"},
  {q:"What's one thing you'd love for us to try together?",c:"Future"},
  {q:"What was your first impression of me?",c:"Memory"},
  {q:"What quality do you admire most in me?",c:"Deep"},
  {q:"Describe your perfect lazy Sunday with me.",c:"Fun"},
  {q:"What's a goal you want us to achieve together this year?",c:"Future"},
  {q:"What's the funniest moment we've shared?",c:"Memory"},
  {q:"What do you think makes our relationship unique?",c:"Deep"},
  {q:"If you wrote a book about us, what would the title be?",c:"Fun"},
  {q:"What's something new you've learned about yourself because of us?",c:"Deep"},
  {q:"What's a place you've always wanted to visit with me?",c:"Future"},
  {q:"What's one thing I do that always makes you smile?",c:"Deep"},
  {q:"What's your favorite meal we've had together?",c:"Memory"},
  {q:"If we had a whole week off together, what would we do?",c:"Future"},
  {q:"What's a challenge we've overcome that made us stronger?",c:"Deep"},
  {q:"What do you love most about how we communicate?",c:"Deep"},
  {q:"What's a tradition you'd love for us to start?",c:"Future"},
  {q:"What's the best surprise you've ever gotten from me?",c:"Memory"},
  {q:"What does 'home' feel like to you?",c:"Deep"},
  {q:"What would our couple superpower be?",c:"Fun"},
  {q:"What's a lesson love has taught you?",c:"Deep"},
  {q:"What's on your relationship bucket list?",c:"Future"},
  {q:"What's a movie or show that reminds you of us?",c:"Fun"},
  {q:"How do you know when I'm thinking about you?",c:"Deep"},
  {q:"What's the bravest thing you've done for love?",c:"Deep"},
  {q:"If you could relive one day with me, which would it be?",c:"Memory"},
  {q:"What does your dream future with me look like?",c:"Future"},
  {q:"What's something you've never told me but want to?",c:"Deep"},
  {q:"What's your favorite inside joke we have?",c:"Fun"},
  {q:"What do you need more of in our relationship?",c:"Deep"},
  {q:"What's a skill you'd love for us to learn together?",c:"Future"},
  {q:"What moment made you realize this was real?",c:"Memory"},
  {q:"What does unconditional love mean to you?",c:"Deep"},
  {q:"Beach vacation or mountain getaway with me?",c:"Fun"},
  {q:"What's the hardest part about missing each other?",c:"Deep"},
  {q:"What's a date idea you've been wanting to try?",c:"Future"},
  {q:"What's the most thoughtful thing I've done for you?",c:"Memory"},
];

function getTodayQuestion() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(),0,0)) / (1000*60*60*24));
  return QUESTIONS[dayOfYear % QUESTIONS.length];
}

function loadDailyQuestion() {
  const q = getTodayQuestion();
  const catEl = document.getElementById('dq-category');
  const qEl = document.getElementById('dq-question');
  if (catEl) catEl.textContent = q.c;
  if (qEl) qEl.textContent = q.q;
}

async function submitDailyAnswer() {
  if (!db || !user) return;
  const input = document.getElementById('dq-answer');
  const btn = document.getElementById('dq-submit-btn');
  const answer = input.value.trim();
  if (!answer) { toast('Write an answer first'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }
  const today = localDate();
  await db.ref('dailyAnswers/' + today + '/' + user).set({
    answer, userName: NAMES[user], timestamp: Date.now()
  });
  input.value = '';
  if (typeof logActivity === 'function') logActivity('daily-q', 'answered the daily question');
  if (typeof renderSmartNudges === 'function') renderSmartNudges();
  if (btn) { btn.textContent = 'Saved'; }
  toast('Answer submitted');
}

function listenDailyAnswers() {
  const today = localDate();
  db.ref('dailyAnswers/' + today).on('value', snap => {
    const data = snap.val() || {};
    renderDailyAnswers(data);
  });
}

function renderDailyAnswers(data) {
  const el = document.getElementById('dq-answers');
  const inputRow = document.getElementById('dq-answer');
  const submitBtn = inputRow ? inputRow.nextElementSibling : null;
  if (!el) return;

  const myAnswer = data[user];
  const theirAnswer = data[partner];

  if (myAnswer && inputRow) {
    inputRow.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'none';
  }

  let html = '';
  if (myAnswer) {
    html += `<div class="dq-answer mine"><div class="dq-answer-name">You</div>${myAnswer.answer}</div>`;
  }
  if (theirAnswer) {
    html += `<div class="dq-answer theirs"><div class="dq-answer-name">${NAMES[partner]}</div>${theirAnswer.answer}</div>`;
  } else if (myAnswer) {
    html += '<div class="dq-waiting">' + NAMES[partner] + ' hasn\'t answered yet</div>';
  }
  el.innerHTML = html;
}

// ===== STREAKS =====
function listenStreak() {
  db.ref('streaks').on('value', snap => {
    const data = snap.val() || { current: 0, longest: 0 };
    const countEl = document.getElementById('streak-count');
    if (countEl) countEl.textContent = data.current || 0;
    updateDashStreak(data);
  });
}

async function updateStreak() {
  if (!db || !user) return;
  const today = localDate();
  const snap = await db.ref('streaks').once('value');
  const data = snap.val() || { current: 0, longest: 0, lastCheckIn: {} };
  if (!data.lastCheckIn) data.lastCheckIn = {};
  data.lastCheckIn[user] = today;

  // Check if both checked in today
  const yesterday = localDate(new Date(Date.now() - 86400000));
  const herToday = data.lastCheckIn.her === today;
  const himToday = data.lastCheckIn.him === today;
  const herYesterday = data.lastCheckIn.her === yesterday || data.lastCheckIn.her === today;
  const himYesterday = data.lastCheckIn.him === yesterday || data.lastCheckIn.him === today;

  if (herToday && himToday) {
    if (!herYesterday || !himYesterday) data.current = 1;
    else data.current = (data.current || 0) + 1;
    if (data.current > (data.longest || 0)) data.longest = data.current;
  }

  await db.ref('streaks').set(data);
}

// ===== GRATITUDE =====
async function submitGratitude() {
  if (!db || !user) return;
  const input = document.getElementById('grat-input');
  const btn = document.getElementById('grat-submit-btn');
  const text = input.value.trim();
  if (!text) { toast('Write something first'); return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Sharing...'; }
  const entry = {
    from: user,
    fromName: NAMES[user],
    message: text,
    date: localDate(),
    timestamp: Date.now()
  };
  await db.ref('gratitude').push(entry);
  input.value = '';
  if (typeof logActivity === 'function') logActivity('gratitude', 'shared gratitude');
  if (btn) { btn.textContent = 'Shared'; setTimeout(() => { btn.disabled = false; btn.textContent = 'Share'; }, 1500); }
  toast('Shared');
}

function listenGratitude() {
  db.ref('gratitude').orderByChild('timestamp').limitToLast(20).on('value', snap => {
    const entries = [];
    snap.forEach(c => entries.push(c.val()));
    entries.reverse();
    renderGratitude(entries);
  });
}

function renderGratitude(entries) {
  const el = document.getElementById('grat-feed');
  if (!el) return;
  if (!entries.length) { el.innerHTML = '<div class="empty">Tell them what you are grateful for today</div>'; return; }
  el.innerHTML = entries.map(g => {
    const time = new Date(g.timestamp);
    const ts = timeAgo(time);
    const isMe = g.from === user;
    return `<div class="grat-card">
      <div class="grat-from">${isMe ? 'You' : g.fromName} · ${ts}</div>
      <div class="grat-msg">${g.message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </div>`;
  }).join('');
}


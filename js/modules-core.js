// ===== MOOD =====
let selectedEnergy = 3;
let selectedSleep = 0;
let selectedStress = 0;
let selectedTags = [];

function selGrid(gridId, val, el) {
  var setters = { 'mood-grid': function(v) { selectedMood = v; }, 'energy-grid': function(v) { selectedEnergy = v; }, 'sleep-grid': function(v) { selectedSleep = v; }, 'stress-grid': function(v) { selectedStress = v; } };
  if (setters[gridId]) setters[gridId](val);
  document.querySelectorAll('#' + gridId + ' .pill-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
}
function selMood(val, el) { selGrid('mood-grid', val, el); }
function selEnergy(val, el) { selGrid('energy-grid', val, el); }
function selSleep(val, el) { selGrid('sleep-grid', val, el); }
function selStress(val, el) { selGrid('stress-grid', val, el); }

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
  if (!selectedMood) {
    toast('Pick a mood first');
    return;
  }
  const btn = document.getElementById('mood-submit-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
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

  const key = coupleRef('moods').push().key;
  await coupleRef('moods/' + key).set(entry);
  document.getElementById('mood-note').value = '';
  if (dedicated) dedicated.checked = false;
  selectedMood = 0;
  selectedEnergy = 3;
  selectedSleep = 0;
  selectedStress = 0;
  selectedTags = [];
  document
    .querySelectorAll('#mood-grid .pill-btn, #energy-grid .pill-btn, #sleep-grid .pill-btn, #stress-grid .pill-btn')
    .forEach(b => b.classList.remove('sel'));
  document.querySelectorAll('.mood-tag').forEach(b => b.classList.remove('sel'));
  updateStreak();
  if (typeof logActivity === 'function') logActivity('mood', 'checked in');
  if (entry.dedicatedTo) toast('Dedicated to ' + NAMES[partner] + ' 💕');
  else toast('Checked in');
  if (btn) {
    btn.textContent = 'Saved';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Check in';
    }, 1500);
  }
}

function listenMoods() {
  coupleRef('moods')
    .orderByChild('timestamp')
    .limitToLast(50)
    .on('value', snap => {
      const moods = [];
      snap.forEach(c => moods.push(c.val()));
      moods.reverse();
      renderMoodFeed(moods);
      renderDashMoods(moods);
    });
}

function renderMoodFeed(moods) {
  const el = document.getElementById('mood-feed');
  if (!moods.length) {
    el.innerHTML = '<div class="empty">Your mood story starts with one check-in</div>';
    return;
  }
  const emojis = ['', '😴', '😐', '🙂', '😊', '🔥'];
  const energyLbls = ['', 'Drained', 'Low', 'Steady', 'Strong', 'On fire'];
  const sleepLbls = ['', 'Awful', 'Poor', 'Okay', 'Good', 'Amazing'];
  const stressLbls = ['', 'Calm', 'Light', 'Some', 'High', 'Max'];
  el.innerHTML = moods
    .map(m => {
      const t = new Date(m.timestamp);
      const ts = timeAgo(t);
      let details = [energyLbls[m.energy] + ' energy'];
      if (m.sleep) details.push(sleepLbls[m.sleep] + ' sleep');
      if (m.stress) details.push(stressLbls[m.stress] + ' stress');
      const tagHtml = m.tags ? m.tags.map(t => `<span class="mh-tag">#${t}</span>`).join('') : '';
      const dedicateHtml = m.dedicatedTo
        ? `<div class="mh-dedicate">💕 For ${m.dedicatedTo === user ? 'you' : NAMES[m.dedicatedTo]}</div>`
        : '';
      return `<div class="mh-item">
      <div class="mh-emoji">${emojis[m.mood]}</div>
      <div class="mh-info">
        <div class="mh-name">${m.user === user ? 'You' : m.userName || '?'}</div>
        <div class="mh-detail">${details.join(' · ')}</div>
        ${tagHtml ? `<div class="mh-tags">${tagHtml}</div>` : ''}
        ${m.note ? `<div class="mh-note">${esc(m.note)}</div>` : ''}
        ${dedicateHtml}
      </div>
      <div class="mh-time">${ts}</div>
    </div>`;
    })
    .join('');
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
      pEl.innerHTML = `<span style="font-size:20px">${emojis[partnerToday.mood]}</span><span style="font-size:11px;color:var(--cream)">${esc(NAMES[partner])}: ${labels[partnerToday.mood]}</span>`;
    } else {
      pEl.innerHTML = `<span style="font-size:11px;color:var(--t3)">${esc(NAMES[partner])}: Waiting...</span>`;
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
    const d = new Date();
    d.setDate(d.getDate() - i);
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
  const xStart = 25,
    xEnd = 310,
    yTop = 10,
    yBot = 90;
  const xStep = (xEnd - xStart) / 6;

  function moodToY(v) {
    return yBot - ((v - 1) / 4) * (yBot - yTop);
  }

  // Build path for user's moods
  let lineD = '',
    areaD = '',
    first = true;
  myMoods.forEach((v, i) => {
    if (v === null) return;
    const x = xStart + i * xStep,
      y = moodToY(v);
    if (first) {
      lineD = `M${x},${y}`;
      areaD = `M${x},${yBot} L${x},${y}`;
      first = false;
    } else {
      lineD += ` L${x},${y}`;
      areaD += ` L${x},${y}`;
    }
  });
  if (!first)
    areaD += ` L${xStart + (myMoods.length - 1 - [...myMoods].reverse().findIndex(v => v !== null)) * xStep},${yBot} Z`;

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
  let pLineD = '',
    pFirst = true;
  partnerMoods.forEach((v, i) => {
    if (v === null) return;
    const x = xStart + i * xStep,
      y = moodToY(v);
    if (pFirst) {
      pLineD = `M${x},${y}`;
      pFirst = false;
    } else {
      pLineD += ` L${x},${y}`;
    }
  });
  pLine.setAttribute('d', pLineD || '');

  // Add day labels
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
  myMoods.forEach(m => {
    if (m.mood >= 1 && m.mood <= 5) counts[m.mood - 1]++;
  });
  const total = myMoods.length;
  const avg = (myMoods.reduce((s, m) => s + m.mood, 0) / total).toFixed(1);
  avgEl.textContent = avg;

  const moodLabels = ['Low', 'Meh', 'Good', 'Great', 'Amazing'];
  const colors = ['var(--chart-3)', 'var(--chart-5)', 'var(--chart-1)', 'var(--chart-4)', 'var(--chart-2)'];

  // Remove old segments
  svg.querySelectorAll('.donut-seg').forEach(s => s.remove());

  // Draw donut segments
  const r = 52,
    circumference = 2 * Math.PI * r;
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
  legendEl.innerHTML = counts
    .map((c, i) => {
      if (c === 0) return '';
      const pct = Math.round((c / total) * 100);
      return `<div class="chart-legend-item"><div class="chart-legend-dot" style="background:${colors[i]}"></div>${moodLabels[i]} <span style="color:var(--t3);margin-left:4px">${pct}%</span></div>`;
    })
    .filter(Boolean)
    .join('');
}

// ===== STREAK CALENDAR (Mood Page) =====
function renderStreakCalendar() {
  const el = document.getElementById('streak-cal');
  if (!el || !db) return;

  coupleRef('moods')
    .orderByChild('timestamp')
    .limitToLast(100)
    .once('value', snap => {
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
        const d = new Date();
        d.setDate(today.getDate() - i);
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
        mood: {
          type: 'integer',
          minimum: 1,
          maximum: 5,
          description: '1=struggling, 2=low, 3=okay, 4=good, 5=thriving'
        },
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
        user: { type: 'string', enum: ['partner1', 'partner2', 'both'], description: 'Whose mood stats to get' },
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
        category: {
          type: 'string',
          enum: ['food', 'transport', 'housing', 'entertainment', 'shopping', 'health', 'subscriptions', 'other']
        },
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
    description:
      'Get the relationship health score with detailed breakdown. Shows mood sync, communication, goals, fitness, and financial alignment.',
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
  let prompt = `You are the AI inside "Moi et Toi," a private relationship app for ${NAMES.partner1} and ${NAMES.partner2}. The current user is ${NAMES[user]} (${user}).

WHO THEY ARE:
- ${NAMES.partner1} (partner1) is from Togo, West Africa. Ewe, Mina, French. Togolese traditions, values, and food.
- ${NAMES.partner2} (partner2) is from Texas. Southern roots, Texan culture, American traditions.
- They're an intercultural couple - young, ambitious, building toward marriage and family.

YOUR ROLE:
- Their trusted friend. Part of the inner circle. Not a chatbot.
- Be warm, honest, direct, and concise. Use their names.
- You have TOOLS that let you read and write data in the app. Use them proactively when the conversation calls for it - don't just chat, take action.
- When a user tells you how they feel, log their mood. When they mention spending, log an expense. Be proactive.`;

  // Add context-specific data
  if (aiContext === 'relationship' && typeof MET !== 'undefined' && MET._ready) {
    const moodStats = MET.mood.stats || {};
    prompt += `\n\nRELATIONSHIP CONTEXT:
- Relationship health score: ${MET.relationship.score || 'not yet computed'}
- Breakdown: ${JSON.stringify(MET.relationship.breakdown || {})}
- ${NAMES.partner2}'s 7-day mood avg: ${moodStats.partner2?.avg7d?.toFixed(1) || 'no data'}
- ${NAMES.partner1}'s 7-day mood avg: ${moodStats.partner1?.avg7d?.toFixed(1) || 'no data'}
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
      await coupleRef('moods').push({
        mood: toolInput.mood,
        energy: toolInput.energy,
        note: toolInput.note || '',
        user,
        userName: NAMES[user],
        timestamp: Date.now(),
        date: today
      });
      return { success: true, message: `Mood logged: ${toolInput.mood}/5, energy ${toolInput.energy}/5` };
    }
    case 'get_mood_stats': {
      if (!MET._ready) return { error: 'Metrics not loaded yet' };
      const target = toolInput.user;
      const stats = MET.mood.stats;
      if (target === 'both') {
        return {
          partner1: {
            avg7d: stats.partner1?.avg7d,
            avg30d: stats.partner1?.avg30d,
            streak: stats.partner1?.streak,
            total: stats.partner1?.total
          },
          partner2: {
            avg7d: stats.partner2?.avg7d,
            avg30d: stats.partner2?.avg30d,
            streak: stats.partner2?.streak,
            total: stats.partner2?.total
          },
          joint: { syncScore: stats.joint?.syncScore, bestDay: stats.joint?.bestDay, streak: stats.joint?.streak }
        };
      }
      const s = stats[target] || {};
      return { avg7d: s.avg7d, avg30d: s.avg30d, avg90d: s.avg90d, streak: s.streak, total: s.total, trend: s.trend };
    }
    case 'add_expense': {
      if (!db) return { error: 'Database not connected' };
      const today = new Date().toISOString().split('T')[0];
      await coupleRef('finances/expenses').push({
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
      await coupleRef('letters').push({
        from: user,
        fromName: NAMES[user],
        message: toolInput.message,
        timestamp: Date.now(),
        read: false
      });
      return { success: true, message: 'Note sent to ' + NAMES[partner] };
    }
    case 'get_relationship_health': {
      if (!MET._ready) return { error: 'Metrics not loaded yet' };
      return { score: MET.relationship.score, breakdown: MET.relationship.breakdown };
    }
    case 'add_calendar_event': {
      if (!db) return { error: 'Database not connected' };
      await coupleRef('calendar').push({
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
      await coupleRef(path).push({
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

function aiFetchHeaders() {
  if (AI_PROXY_URL) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    'x-api-key': CLAUDE_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };
}

async function sendAI() {
  // Rate limit check
  if (!checkAIRateLimit()) {
    toast('Slow down — too many AI requests. Try again in a minute.');
    return;
  }
  // Check for API key
  if (!CLAUDE_API_KEY && !AI_PROXY_URL) {
    openModal(`<div style="text-align:left">
      <h3 style="margin:0 0 8px;font-size:16px;color:var(--t1)">AI Setup</h3>
      <p style="font-size:13px;color:var(--t3);margin:0 0 12px">Enter your Anthropic API key (one-time setup, works for both of you)</p>
      <input id="ai-key-input" type="text" class="form-input" placeholder="sk-ant-..." style="width:100%;font-size:14px;font-family:monospace">
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn-sm" onclick="closeModal()" style="flex:1;background:var(--card-bg);color:var(--t2)">Cancel</button>
        <button class="btn-sm" onclick="submitAIKey()" style="flex:1">Save &amp; Send</button>
      </div>
    </div>`);
    setTimeout(function () {
      var el = document.getElementById('ai-key-input');
      if (el) el.focus();
    }, 100);
    return;
  }

  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  if (text.length > 2000) { toast('Message too long (max 2000 chars)'); return; }
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

    const aiEndpoint = AI_PROXY_URL || 'https://api.anthropic.com/v1/messages';

    let response = await fetch(aiEndpoint, {
      method: 'POST',
      headers: aiFetchHeaders(),
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
          const toolLabel = {
            log_mood: '📊 Logging mood',
            get_mood_stats: '📈 Getting mood stats',
            add_expense: '💳 Logging expense',
            send_note: '💌 Sending note',
            get_relationship_health: '💕 Checking relationship health',
            add_calendar_event: '📅 Adding event',
            create_goal: '🎯 Creating goal',
            get_financial_summary: '💰 Getting finances'
          };
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
      response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: aiFetchHeaders(),
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

async function submitAIKey() {
  var key = (document.getElementById('ai-key-input') || {}).value || '';
  key = key.trim();
  if (!key || !key.startsWith('sk-ant-')) {
    toast('Invalid API key');
    return;
  }
  CLAUDE_API_KEY = key;
  await coupleRef('profiles/apiKey').set(key);
  closeModal();
  toast('API key saved');
  sendAI();
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
  logType = type;
  logExercises = [];
  document.getElementById('log-type').textContent = type;
  document.getElementById('ex-list').innerHTML = '';
  document.getElementById('log-notes').value = '';
  document.getElementById('lmod').classList.add('on');
  updLogSliders();
}
function closeLog() {
  document.getElementById('lmod').classList.remove('on');
}

function addEx() {
  const n = document.getElementById('ex-n').value.trim();
  const s = document.getElementById('ex-s').value.trim();
  const r = document.getElementById('ex-r').value.trim();
  if (!n) return;
  logExercises.push({ name: n, sets: s, reps: r });
  document.getElementById('ex-list').innerHTML +=
    `<div class="lei"><span>${esc(n)}</span><span>${s ? esc(s) + 's ' : ''}${r ? esc(r) + 'r' : ''}</span></div>`;
  document.getElementById('ex-n').value = '';
  document.getElementById('ex-s').value = '';
  document.getElementById('ex-r').value = '';
  document.getElementById('ex-n').focus();
}

function updLogSliders() {
  const eLabels = ['', 'Drained', 'Low', 'Steady', 'Strong', 'On fire'];
  const mLabels = ['', 'Tough', 'Okay', 'Good', 'Great', 'Amazing'];
  document.getElementById('log-e').oninput = function () {
    document.getElementById('log-ev').textContent = eLabels[this.value];
  };
  document.getElementById('log-m').oninput = function () {
    document.getElementById('log-mv').textContent = mLabels[this.value];
  };
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
  const key = coupleRef('workoutLogs').push().key;
  await coupleRef('workoutLogs/' + key).set(entry);
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
const TAP_EMOJIS = { hug: '🤗', kiss: '💋', love: '❤️', miss: '🥺', thinking: '💭' };

async function sendTap(e, type, emoji) {
  if (!db || !user) return;
  const btn = e.currentTarget;
  const entry = {
    type: type,
    from: user,
    fromName: NAMES[user],
    timestamp: Date.now()
  };
  await coupleRef('taps').push(entry);
  if (typeof logActivity === 'function') logActivity('taps', 'sent ' + type);
  // Haptic feedback if available
  if (navigator.vibrate) navigator.vibrate(50);
  // Show sent animation on the button
  if (btn) {
    btn.classList.add('sent');
    setTimeout(() => btn.classList.remove('sent'), 500);
  }
  toast(TAP_MSGS[type] + ' ♡');
}

function listenTaps() {
  coupleRef('taps')
    .orderByChild('timestamp')
    .limitToLast(20)
    .on('value', snap => {
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
  if (!taps.length) {
    el.innerHTML = '<div class="empty">Send a quick tap - let them know you are thinking of them</div>';
    return;
  }
  el.innerHTML = taps
    .slice(0, 15)
    .map(t => {
      const time = new Date(t.timestamp);
      const ts = timeAgo(time);
      const emoji = TAP_EMOJIS[t.type] || '♡';
      const isMe = t.from === user;
      return `<div class="tap-item">
      <div class="tap-type">${emoji}</div>
      <div class="tap-from">${isMe ? 'You' : esc(t.fromName || '')} <span style="color:var(--t3);font-weight:300;font-size:10px">${TAP_MSGS[t.type] || ''}</span></div>
      <div class="tap-time">${ts}</div>
    </div>`;
    })
    .join('');
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
  const start = ta.selectionStart,
    end = ta.selectionEnd;
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
  if (select) {
    if (check.checked) showEl(select);
    else hideEl(select);
  }
}

async function sendLetter() {
  if (!db || !user) return;
  const input = document.getElementById('letter-input');
  const btn = document.getElementById('letter-send-btn');
  const text = input.value.trim();
  if (!text) {
    toast('Write something first');
    return;
  }

  const owCheck = document.getElementById('ow-check');
  const owTag = document.getElementById('ow-tag');
  const isOpenWhen = owCheck && owCheck.checked && owTag && owTag.value;

  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sending...';
  }

  if (isOpenWhen) {
    // Save as sealed "open when" letter
    await coupleRef('openWhenLetters').push({
      from: user,
      fromName: NAMES[user],
      message: text,
      openWhen: owTag.value,
      timestamp: Date.now(),
      opened: false
    });
    owCheck.checked = false;
    hideEl(owTag);
    owTag.value = '';
    toast('Sealed letter saved 💌');
  } else {
    const entry = {
      from: user,
      fromName: NAMES[user],
      message: text,
      timestamp: Date.now(),
      read: false
    };
    await coupleRef('letters').push(entry);
    if (typeof sendInAppNotif === 'function') sendInAppNotif('letter', 'Sent you a letter', '💌');
    toast('Delivered');
  }
  input.value = '';
  if (typeof logActivity === 'function') logActivity('letters', 'sent a letter');
  if (btn) {
    btn.textContent = 'Sent';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Send';
    }, 1500);
  }
}

function listenOpenWhenLetters() {
  if (!db) return;
  coupleRef('openWhenLetters')
    .orderByChild('timestamp')
    .on('value', snap => {
      const letters = [];
      snap.forEach(c => {
        const v = c.val();
        v._key = c.key;
        letters.push(v);
      });
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
  if (!letters.length) {
    el.innerHTML = '<div class="empty">No sealed letters yet</div>';
    return;
  }

  const owLabels = {
    sad: "😢 When you're sad",
    miss: '💭 When you miss me',
    happy: "😊 When you're happy",
    stressed: "😰 When you're stressed",
    angry: "😤 When you're angry at me",
    bored: "🥱 When you're bored",
    proud: "💪 When you're proud",
    love: '❤️ When you need love',
    birthday: '🎂 On your birthday',
    anniversary: 'On our anniversary'
  };

  let html = '';
  if (forMe.length) {
    html += forMe
      .map(l => {
        if (l.opened) {
          return `<div class="ow-card opened"><div class="ow-tag">${owLabels[l.openWhen] || esc(l.openWhen || '')}</div><div class="ow-msg">${formatLetterText(l.message)}</div><div class="ow-from">From ${esc(l.fromName || '')} · ${timeAgo(l.timestamp)}</div></div>`;
        }
        return `<div class="ow-card sealed" onclick="openSealedLetter('${l._key}')"><div class="ow-seal">💌</div><div class="ow-tag">${owLabels[l.openWhen] || l.openWhen}</div><div class="ow-hint">Tap to open</div></div>`;
      })
      .join('');
  }
  if (fromMe.length) {
    html += `<div class="t-label c-t3 mt-12 mb-6">Sent by you</div>`;
    html += fromMe
      .map(l => {
        return `<div class="ow-card sent"><div class="ow-tag">${owLabels[l.openWhen] || l.openWhen}</div><div class="ow-status">${l.opened ? 'Opened' : 'Sealed'}</div></div>`;
      })
      .join('');
  }
  el.innerHTML = html;
}

async function openSealedLetter(key) {
  if (!db) return;
  await coupleRef('openWhenLetters/' + key + '/opened').set(true);
  toast('Letter opened 💌');
}

function listenLetters() {
  coupleRef('letters')
    .orderByChild('timestamp')
    .limitToLast(30)
    .on('value', snap => {
      const letters = [];
      snap.forEach(c => {
        const v = c.val();
        v._key = c.key;
        letters.push(v);
      });
      letters.reverse();
      renderLetterFeed(letters);
      // Mark unread letters from partner as read
      letters.forEach(l => {
        if (l.from !== user && !l.read) {
          coupleRef('letters/' + l._key + '/read').set(true);
        }
      });
    });
}

function renderLetterFeed(letters) {
  const el = document.getElementById('letter-feed');
  if (!el) return;
  if (!letters.length) {
    el.innerHTML = '<div class="empty">Write something only they will read</div>';
    return;
  }
  el.innerHTML = letters
    .map(l => {
      const time = new Date(l.timestamp);
      const ts = timeAgo(time);
      const isMe = l.from === user;
      return `<div class="letter-card ${isMe ? 'from-me' : 'from-them'}">
      <div class="letter-header">
        <span class="letter-from">${isMe ? 'You' : esc(l.fromName || '')}${!isMe && !l.read ? '<span class="letter-unread"></span>' : ''}</span>
        <span class="letter-time">${ts}</span>
      </div>
      <div class="letter-body">${formatLetterText(l.message)}</div>
    </div>`;
    })
    .join('');
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
  if (!title || !date) {
    toast('Title and date required');
    return;
  }
  const btn = event?.target;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  const entry = {
    title,
    date,
    emoji,
    description: desc,
    user: user,
    userName: NAMES[user],
    timestamp: Date.now()
  };
  await coupleRef('milestones').push(entry);
  document.getElementById('ms-title').value = '';
  document.getElementById('ms-date').value = '';
  document.getElementById('ms-emoji').value = '';
  document.getElementById('ms-desc').value = '';
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Save milestone';
  }
  toggleMsForm();
  toast('Milestone saved');
}

function listenMilestones() {
  coupleRef('milestones')
    .orderByChild('date')
    .on('value', snap => {
      const milestones = [];
      snap.forEach(c => milestones.push(c.val()));
      milestones.reverse();
      renderTimeline(milestones);
    });
}

function renderTimeline(milestones) {
  const el = document.getElementById('timeline');
  if (!el) return;
  if (!milestones.length) {
    el.innerHTML = '<div class="empty" onclick="toggleMsForm()" style="cursor:pointer">Add your first milestone together <span style="opacity:.5">— tap here</span></div>';
    return;
  }
  el.innerHTML = milestones
    .map(m => {
      const d = new Date(m.date + 'T00:00:00');
      const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return `<div class="tl-item">
      <div class="tl-date">${dateStr}</div>
      <div class="tl-title"><span class="tl-emoji">${m.emoji || '✨'}</span>${m.title}</div>
      ${m.description ? `<div class="tl-desc">${m.description}</div>` : ''}
    </div>`;
    })
    .join('');
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
  if (!title || !date) {
    toast('Title and date required');
    return;
  }
  const btn = event?.target;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  const entry = {
    title,
    date,
    emoji,
    createdBy: user,
    timestamp: Date.now()
  };
  await coupleRef('countdowns').push(entry);
  document.getElementById('cd-title').value = '';
  document.getElementById('cd-date').value = '';
  document.getElementById('cd-emoji').value = '';
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Add countdown';
  }
  toggleCdForm();
  toast('Countdown added');
}

function listenCountdowns() {
  coupleRef('countdowns').on('value', snap => {
    const countdowns = [];
    snap.forEach(c => countdowns.push(c.val()));
    renderCountdowns(countdowns);
  });
}

function renderCountdowns(countdowns) {
  const el = document.getElementById('countdown-grid');
  if (!el) return;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cards = countdowns
    .map(c => {
      const target = new Date(c.date + 'T00:00:00');
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      return { ...c, daysLeft: diff };
    })
    .filter(c => c.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  let html = cards
    .map(
      c => `<div class="cd-card">
    <div class="cd-emoji">${c.emoji || '⏳'}</div>
    <div class="cd-days">${c.daysLeft}</div>
    <div class="cd-unit">${c.daysLeft === 1 ? 'day' : 'days'}</div>
    <div class="cd-title">${c.title}</div>
    <div class="cd-date">${new Date(c.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
  </div>`
    )
    .join('');
  html += '<div class="cd-add" onclick="toggleCdForm()"><span>+</span><div>Add Countdown</div></div>';
  el.innerHTML = html;
}

// ===== DAILY QUESTIONS =====
const QUESTIONS = [
  { q: "What's a memory of us you replay in your head?", c: 'Memory' },
  { q: "What's something small I do that makes your day?", c: 'Deep' },
  { q: 'If we could teleport anywhere right now, where would you pick?', c: 'Fun' },
  { q: 'What song makes you think of us?', c: 'Memory' },
  { q: "What's one thing you'd love for us to try together?", c: 'Future' },
  { q: 'What was your first impression of me?', c: 'Memory' },
  { q: 'What quality do you admire most in me?', c: 'Deep' },
  { q: 'Describe your perfect lazy Sunday with me.', c: 'Fun' },
  { q: "What's a goal you want us to achieve together this year?", c: 'Future' },
  { q: "What's the funniest moment we've shared?", c: 'Memory' },
  { q: 'What do you think makes our relationship unique?', c: 'Deep' },
  { q: 'If you wrote a book about us, what would the title be?', c: 'Fun' },
  { q: "What's something new you've learned about yourself because of us?", c: 'Deep' },
  { q: "What's a place you've always wanted to visit with me?", c: 'Future' },
  { q: "What's one thing I do that always makes you smile?", c: 'Deep' },
  { q: "What's your favorite meal we've had together?", c: 'Memory' },
  { q: 'If we had a whole week off together, what would we do?', c: 'Future' },
  { q: "What's a challenge we've overcome that made us stronger?", c: 'Deep' },
  { q: 'What do you love most about how we communicate?', c: 'Deep' },
  { q: "What's a tradition you'd love for us to start?", c: 'Future' },
  { q: "What's the best surprise you've ever gotten from me?", c: 'Memory' },
  { q: "What does 'home' feel like to you?", c: 'Deep' },
  { q: 'What would our couple superpower be?', c: 'Fun' },
  { q: "What's a lesson love has taught you?", c: 'Deep' },
  { q: "What's on your relationship bucket list?", c: 'Future' },
  { q: "What's a movie or show that reminds you of us?", c: 'Fun' },
  { q: "How do you know when I'm thinking about you?", c: 'Deep' },
  { q: "What's the bravest thing you've done for love?", c: 'Deep' },
  { q: 'If you could relive one day with me, which would it be?', c: 'Memory' },
  { q: 'What does your dream future with me look like?', c: 'Future' },
  { q: "What's something you've never told me but want to?", c: 'Deep' },
  { q: "What's your favorite inside joke we have?", c: 'Fun' },
  { q: 'What do you need more of in our relationship?', c: 'Deep' },
  { q: "What's a skill you'd love for us to learn together?", c: 'Future' },
  { q: 'What moment made you realize this was real?', c: 'Memory' },
  { q: 'What does unconditional love mean to you?', c: 'Deep' },
  { q: 'Beach vacation or mountain getaway with me?', c: 'Fun' },
  { q: "What's the hardest part about missing each other?", c: 'Deep' },
  { q: "What's a date idea you've been wanting to try?", c: 'Future' },
  { q: "What's the most thoughtful thing I've done for you?", c: 'Memory' }
];

function getTodayQuestion() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
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
  if (!answer) {
    toast('Write an answer first');
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  const today = localDate();
  await coupleRef('dailyAnswers/' + today + '/' + user).set({
    answer,
    userName: NAMES[user],
    timestamp: Date.now()
  });
  input.value = '';
  if (typeof logActivity === 'function') logActivity('daily-q', 'answered the daily question');
  if (typeof renderSmartNudges === 'function') renderSmartNudges();
  if (btn) {
    btn.textContent = 'Saved';
  }
  toast('Answer submitted');
}

function listenDailyAnswers() {
  const today = localDate();
  coupleRef('dailyAnswers/' + today).on('value', snap => {
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
    html += `<div class="dq-answer mine"><div class="dq-answer-name">You</div>${esc(myAnswer.answer)}</div>`;
  }
  if (theirAnswer) {
    html += `<div class="dq-answer theirs"><div class="dq-answer-name">${NAMES[partner]}</div>${esc(theirAnswer.answer)}</div>`;
  } else if (myAnswer) {
    html += '<div class="dq-waiting">' + NAMES[partner] + " hasn't answered yet</div>";
  }
  el.innerHTML = html;
}

// ===== STREAKS =====
function listenStreak() {
  coupleRef('streaks').on('value', snap => {
    const data = snap.val() || { current: 0, longest: 0 };
    const countEl = document.getElementById('streak-count');
    if (countEl) countEl.textContent = data.current || 0;
    updateDashStreak(data);
  });
}

async function updateStreak() {
  if (!db || !user) return;
  const today = localDate();
  const snap = await coupleRef('streaks').once('value');
  const data = snap.val() || { current: 0, longest: 0, lastCheckIn: {} };
  if (!data.lastCheckIn) data.lastCheckIn = {};
  data.lastCheckIn[user] = today;

  // Check if both checked in today
  const yesterday = localDate(new Date(Date.now() - 86400000));
  const partner2Today = data.lastCheckIn.partner2 === today;
  const partner1Today = data.lastCheckIn.partner1 === today;

  if (partner2Today && partner1Today) {
    // Guard: only bump once per day
    if (data.lastBump === today) {
      // Already counted today — just save the lastCheckIn update
    } else {
      // Check if BOTH had checked in yesterday (continuity for streak)
      const partner2HadYesterday = data.prevCheckIn && data.prevCheckIn.partner2 === yesterday;
      const partner1HadYesterday = data.prevCheckIn && data.prevCheckIn.partner1 === yesterday;
      if (partner2HadYesterday && partner1HadYesterday) {
        data.current = (data.current || 0) + 1;
      } else {
        data.current = 1;
      }
      if (data.current > (data.longest || 0)) data.longest = data.current;
      data.lastBump = today;
    }
  }
  // Store previous check-in dates before overwriting (for next day's continuity check)
  if (!data.prevCheckIn) data.prevCheckIn = {};
  if (data.lastCheckIn.partner2 && data.lastCheckIn.partner2 !== today) data.prevCheckIn.partner2 = data.lastCheckIn.partner2;
  if (data.lastCheckIn.partner1 && data.lastCheckIn.partner1 !== today) data.prevCheckIn.partner1 = data.lastCheckIn.partner1;

  await coupleRef('streaks').set(data);
}

// ===== GRATITUDE =====
async function submitGratitude() {
  if (!db || !user) return;
  const input = document.getElementById('grat-input');
  const btn = document.getElementById('grat-submit-btn');
  const text = input.value.trim();
  if (!text) {
    toast('Write something first');
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Sharing...';
  }
  const entry = {
    from: user,
    fromName: NAMES[user],
    message: text,
    date: localDate(),
    timestamp: Date.now()
  };
  await coupleRef('gratitude').push(entry);
  input.value = '';
  if (typeof logActivity === 'function') logActivity('gratitude', 'shared gratitude');
  if (btn) {
    btn.textContent = 'Shared';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Share';
    }, 1500);
  }
  toast('Shared');
}

function listenGratitude() {
  coupleRef('gratitude')
    .orderByChild('timestamp')
    .limitToLast(20)
    .on('value', snap => {
      const entries = [];
      snap.forEach(c => entries.push(c.val()));
      entries.reverse();
      renderGratitude(entries);
    });
}

function renderGratitude(entries) {
  const el = document.getElementById('grat-feed');
  if (!el) return;
  if (!entries.length) {
    el.innerHTML = '<div class="empty">Tell them what you are grateful for today</div>';
    return;
  }
  el.innerHTML = entries
    .map(g => {
      const time = new Date(g.timestamp);
      const ts = timeAgo(time);
      const isMe = g.from === user;
      return `<div class="grat-card">
      <div class="grat-from">${isMe ? 'You' : esc(g.fromName || '')} · ${ts}</div>
      <div class="grat-msg">${esc(g.message)}</div>
    </div>`;
    })
    .join('');
}

// ========================================
// ===== AI BACKGROUND SERVICE =====
// ========================================
// Defines roles the AI fills behind the scenes to keep the app fresh and current.
// These run silently — no chat UI needed. The AI writes data directly to Firebase.

const AI_ROLES = {
  // 1. Content Curator — keeps daily questions, prompts, and activities fresh
  contentCurator: {
    name: 'Content Curator',
    desc: 'Generates fresh daily questions, conversation starters, date ideas, and affirmations',
    interval: 24 * 60 * 60 * 1000, // daily
    lastRunKey: 'ai_role_content_curator'
  },
  // 2. Relationship Monitor — watches mood patterns and flags concerns
  relationshipMonitor: {
    name: 'Relationship Monitor',
    desc: 'Analyzes mood trends, detects low streaks, and sends gentle nudges',
    interval: 12 * 60 * 60 * 1000, // twice daily
    lastRunKey: 'ai_role_rel_monitor'
  },
  // 3. Milestone Tracker — remembers dates and creates reminders
  milestoneTracker: {
    name: 'Milestone Tracker',
    desc: 'Tracks anniversaries, birthdays, and special dates; creates countdown reminders',
    interval: 24 * 60 * 60 * 1000,
    lastRunKey: 'ai_role_milestone'
  },
  // 4. Goal Coach — checks progress on goals and provides encouragement
  goalCoach: {
    name: 'Goal Coach',
    desc: 'Reviews personal and shared goals, sends progress updates and motivation',
    interval: 24 * 60 * 60 * 1000,
    lastRunKey: 'ai_role_goals'
  },
  // 5. Wellness Advisor — nutrition, fitness, and health insights
  wellnessAdvisor: {
    name: 'Wellness Advisor',
    desc: 'Analyzes nutrition and fitness data, suggests improvements, celebrates streaks',
    interval: 24 * 60 * 60 * 1000,
    lastRunKey: 'ai_role_wellness'
  },
  // 6. Finance Guardian — budget alerts and spending insights
  financeGuardian: {
    name: 'Finance Guardian',
    desc: 'Monitors spending patterns, alerts on budget overruns, suggests savings tips',
    interval: 24 * 60 * 60 * 1000,
    lastRunKey: 'ai_role_finance'
  }
};

// AI nudge storage — small, non-intrusive messages the AI writes for the dashboard
let aiNudges = [];

function initAIBackgroundService() {
  if (!db || !CLAUDE_API_KEY) return;
  // Check each role and run if overdue
  Object.entries(AI_ROLES).forEach(([key, role]) => {
    coupleRef('ai/roles/' + role.lastRunKey).once('value', snap => {
      const lastRun = snap.val() || 0;
      const now = Date.now();
      if (now - lastRun > role.interval) {
        // Schedule with random delay to avoid burst (5-30s after login)
        const delay = 5000 + Math.random() * 25000;
        setTimeout(() => runAIRole(key, role), delay);
      }
    });
  });
  // Listen for nudges
  coupleRef('ai/nudges/' + user)
    .orderByChild('timestamp')
    .limitToLast(5)
    .on('value', snap => {
      aiNudges = [];
      snap.forEach(c => {
        const n = c.val();
        if (n && !n.dismissed) aiNudges.push({ ...n, key: c.key });
      });
      if (typeof renderAINudgesEnhanced === 'function') renderAINudgesEnhanced();
      else renderAINudges();
    });
}

async function runAIRole(roleKey, role) {
  if (!CLAUDE_API_KEY || !db) return;
  const now = Date.now();

  try {
    let prompt = '';
    let data = {};

    switch (roleKey) {
      case 'contentCurator':
        prompt = buildContentCuratorPrompt();
        break;
      case 'relationshipMonitor':
        data = await gatherMoodData();
        prompt = buildRelMonitorPrompt(data);
        break;
      case 'milestoneTracker':
        data = await gatherMilestoneData();
        prompt = buildMilestonePrompt(data);
        break;
      case 'goalCoach':
        data = await gatherGoalData();
        prompt = buildGoalCoachPrompt(data);
        break;
      case 'wellnessAdvisor':
        data = await gatherWellnessData();
        prompt = buildWellnessPrompt(data);
        break;
      case 'financeGuardian':
        data = await gatherFinanceData();
        prompt = buildFinancePrompt(data);
        break;
      default:
        return;
    }

    const result = await callAIBackground(prompt);
    if (result) {
      await processAIRoleResult(roleKey, result);
      await coupleRef('ai/roles/' + role.lastRunKey).set(now);
    }
  } catch (e) {
    console.warn('AI role ' + roleKey + ' failed:', e);
  }
}

function buildContentCuratorPrompt() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return `You are the AI content curator for Moi et Toi, a couples app for ${NAMES.partner1} and ${NAMES.partner2}.

Today is ${today}. Generate fresh content for the app. Return a JSON object with these keys:
- "dailyQuestion": A thoughtful relationship question for them to answer together
- "dateIdea": A creative date night idea (consider both Togolese/West African and Texan influences)
- "affirmation": A personalized affirmation for the day
- "conversationStarter": A fun/deep conversation topic
- "challenge": A small couples challenge for the day (e.g., "Cook a meal together from a new cuisine")

Keep each value to 1-2 sentences. Be warm, specific, and culturally aware. Return ONLY valid JSON, no markdown.`;
}

function buildRelMonitorPrompt(data) {
  return `You are the relationship wellness monitor for ${NAMES.partner1} and ${NAMES.partner2}'s app.

Here is their recent mood data:
${JSON.stringify(data)}

Analyze their mood patterns. Return a JSON object:
- "status": "good" | "attention" | "concern"
- "insight": A brief insight about their emotional patterns (1 sentence)
- "nudgePartner1": A gentle, supportive message for ${NAMES.partner1} (or null if not needed)
- "nudgePartner2": A gentle, supportive message for ${NAMES.partner2} (or null if not needed)
- "suggestion": One actionable suggestion to strengthen their connection

Be warm and empathetic, never judgmental. Return ONLY valid JSON.`;
}

function buildMilestonePrompt(data) {
  return `You are the milestone tracker for ${NAMES.partner1} and ${NAMES.partner2}'s relationship app.

Here are their upcoming dates and milestones:
${JSON.stringify(data)}

Today is ${new Date().toISOString().split('T')[0]}.

Return a JSON object:
- "upcoming": Array of { "event": string, "daysAway": number, "reminder": string } for anything within 14 days
- "suggestion": A thoughtful way to celebrate the nearest milestone (or null if nothing soon)

Return ONLY valid JSON.`;
}

function buildGoalCoachPrompt(data) {
  return `You are the goal coach for ${NAMES.partner1} and ${NAMES.partner2}'s couples app.

Their current goals and progress:
${JSON.stringify(data)}

Return a JSON object:
- "nudgePartner1": Motivational message about ${NAMES.partner1}'s goals (or null)
- "nudgePartner2": Motivational message about ${NAMES.partner2}'s goals (or null)
- "sharedInsight": Comment on their shared goals progress (or null)
- "tip": One productivity or goal-setting tip

Keep it concise and encouraging. Return ONLY valid JSON.`;
}

function buildWellnessPrompt(data) {
  return `You are the wellness advisor for ${NAMES.partner1} and ${NAMES.partner2}'s app.

Recent wellness data:
${JSON.stringify(data)}

Return a JSON object:
- "nutritionTip": A nutrition insight or tip based on their tracking
- "fitnessTip": A fitness insight based on their workout data
- "celebration": Something to celebrate (a streak, a PR, consistency) or null
- "nudge": A gentle wellness nudge if something needs attention, or null

Be supportive and specific. Return ONLY valid JSON.`;
}

function buildFinancePrompt(data) {
  return `You are the finance guardian for ${NAMES.partner1} and ${NAMES.partner2}'s shared finances.

Recent spending data:
${JSON.stringify(data)}

Return a JSON object:
- "status": "on_track" | "watch" | "over_budget"
- "insight": Brief spending pattern insight
- "tip": A money-saving tip relevant to their spending
- "alert": An alert message if overspending detected, or null

Be helpful and non-judgmental. Return ONLY valid JSON.`;
}

async function gatherMoodData() {
  if (!db) return {};
  const snap = await coupleRef('moods').orderByChild('timestamp').limitToLast(30).once('value');
  const moods = [];
  snap.forEach(c => moods.push(c.val()));
  return { recentMoods: moods, count: moods.length };
}

async function gatherMilestoneData() {
  if (!db) return {};
  const [msSnap, cdSnap, calSnap] = await Promise.all([
    coupleRef('milestones').once('value'),
    coupleRef('countdowns').once('value'),
    coupleRef('calendar').once('value')
  ]);
  return {
    milestones: msSnap.val() || {},
    countdowns: cdSnap.val() || {},
    calendarEvents: calSnap.val() || {}
  };
}

async function gatherGoalData() {
  if (!db) return {};
  const [partner2Goals, partner1Goals, shared] = await Promise.all([
    coupleRef('personalGoals/partner2').once('value'),
    coupleRef('personalGoals/partner1').once('value'),
    coupleRef('personalGoals/shared').once('value')
  ]);
  return {
    partner2: partner2Goals.val() || {},
    partner1: partner1Goals.val() || {},
    shared: shared.val() || {}
  };
}

async function gatherWellnessData() {
  if (!db) return {};
  const today = new Date().toISOString().split('T')[0];
  const [nutrSnap, fitSnap] = await Promise.all([
    coupleRef('nutrition/' + user + '/meals/' + today).once('value'),
    coupleRef('fitness/workouts').orderByChild('timestamp').limitToLast(10).once('value')
  ]);
  const workouts = [];
  fitSnap.forEach(c => workouts.push(c.val()));
  return { todayMeals: nutrSnap.val() || {}, recentWorkouts: workouts };
}

async function gatherFinanceData() {
  if (!db) return {};
  const snap = await coupleRef('finances/expenses').orderByChild('timestamp').limitToLast(30).once('value');
  const expenses = [];
  snap.forEach(c => expenses.push(c.val()));
  return { recentExpenses: expenses };
}

// ===== AI RATE LIMITING =====
const _aiRateLimit = { calls: [], maxPerMinute: 8, maxPerHour: 40 };

function checkAIRateLimit() {
  const now = Date.now();
  // Clean old entries
  _aiRateLimit.calls = _aiRateLimit.calls.filter(t => now - t < 3600000);
  const lastMinute = _aiRateLimit.calls.filter(t => now - t < 60000).length;
  if (lastMinute >= _aiRateLimit.maxPerMinute) return false;
  if (_aiRateLimit.calls.length >= _aiRateLimit.maxPerHour) return false;
  _aiRateLimit.calls.push(now);
  return true;
}

async function callAIBackground(prompt) {
  if (!CLAUDE_API_KEY && !AI_PROXY_URL) return null;
  if (!checkAIRateLimit()) {
    console.warn('AI rate limit reached — skipping call');
    return null;
  }
  const headers = aiFetchHeaders();
  const endpoint = AI_PROXY_URL || 'https://api.anthropic.com/v1/messages';

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: 'You are a background service for a couples app. Return ONLY valid JSON, no explanation or markdown.',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await resp.json();
  const text = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function processAIRoleResult(roleKey, result) {
  if (!db || !result) return;
  const now = Date.now();

  switch (roleKey) {
    case 'contentCurator': {
      // Write fresh content to Firebase
      const today = new Date().toISOString().split('T')[0];
      if (result.dailyQuestion) await coupleRef('ai/content/' + today + '/dailyQuestion').set(result.dailyQuestion);
      if (result.dateIdea) await coupleRef('ai/content/' + today + '/dateIdea').set(result.dateIdea);
      if (result.affirmation) await coupleRef('ai/content/' + today + '/affirmation').set(result.affirmation);
      if (result.conversationStarter)
        await coupleRef('ai/content/' + today + '/conversationStarter').set(result.conversationStarter);
      if (result.challenge) await coupleRef('ai/content/' + today + '/challenge').set(result.challenge);
      break;
    }
    case 'relationshipMonitor': {
      if (result.nudgePartner1)
        await coupleRef('ai/nudges/partner1').push({ message: result.nudgePartner1, type: 'relationship', timestamp: now });
      if (result.nudgePartner2)
        await coupleRef('ai/nudges/partner2').push({ message: result.nudgePartner2, type: 'relationship', timestamp: now });
      if (result.insight)
        await db
          .ref('ai/insights/relationship')
          .push({ insight: result.insight, status: result.status, timestamp: now });
      break;
    }
    case 'milestoneTracker': {
      if (result.upcoming && result.upcoming.length > 0) {
        result.upcoming.forEach(async item => {
          if (item.daysAway <= 3) {
            await coupleRef('ai/nudges/partner1').push({ message: item.reminder, type: 'milestone', timestamp: now });
            await coupleRef('ai/nudges/partner2').push({ message: item.reminder, type: 'milestone', timestamp: now });
          }
        });
      }
      break;
    }
    case 'goalCoach': {
      if (result.nudgePartner1)
        await coupleRef('ai/nudges/partner1').push({ message: result.nudgePartner1, type: 'goals', timestamp: now });
      if (result.nudgePartner2)
        await coupleRef('ai/nudges/partner2').push({ message: result.nudgePartner2, type: 'goals', timestamp: now });
      break;
    }
    case 'wellnessAdvisor': {
      const nudge = result.celebration || result.nudge;
      if (nudge) {
        await coupleRef('ai/nudges/partner1').push({ message: nudge, type: 'wellness', timestamp: now });
        await coupleRef('ai/nudges/partner2').push({ message: nudge, type: 'wellness', timestamp: now });
      }
      break;
    }
    case 'financeGuardian': {
      if (result.alert) {
        await coupleRef('ai/nudges/partner1').push({ message: result.alert, type: 'finance', timestamp: now });
        await coupleRef('ai/nudges/partner2').push({ message: result.alert, type: 'finance', timestamp: now });
      } else if (result.tip) {
        await coupleRef('ai/nudges/partner1').push({ message: result.tip, type: 'finance', timestamp: now });
        await coupleRef('ai/nudges/partner2').push({ message: result.tip, type: 'finance', timestamp: now });
      }
      break;
    }
  }
}

function renderAINudges() {
  const container = document.getElementById('ai-nudges');
  if (!container) return;
  if (!aiNudges.length) {
    container.innerHTML = '';
    return;
  }
  const typeIcons = { relationship: '💕', milestone: '📅', goals: '🎯', wellness: '💪', finance: '💰' };
  container.innerHTML = aiNudges
    .map(
      n => `
    <div class="ai-nudge-card">
      <span class="ai-nudge-icon">${typeIcons[n.type] || '✨'}</span>
      <div class="ai-nudge-text">${esc(n.message)}</div>
      <button class="ai-nudge-dismiss" onclick="dismissAINudge('${n.key}')" aria-label="Dismiss">&times;</button>
    </div>
  `
    )
    .join('');
}

async function dismissAINudge(key) {
  if (!db) return;
  // Animate out the card before removing
  var btn = event && event.currentTarget;
  var card = btn ? btn.closest('.ai-nudge-card') : null;
  if (card) {
    card.classList.add('nudge-dismiss');
    card.addEventListener('animationend', function () { card.remove(); });
  }
  await coupleRef('ai/nudges/' + user + '/' + key + '/dismissed').set(true);
}

// Load AI-generated daily content for dashboard
async function loadAIDailyContent() {
  if (!db) return;
  const today = new Date().toISOString().split('T')[0];
  const snap = await coupleRef('ai/content/' + today).once('value');
  const content = snap.val();
  if (!content) return;
  // Show the card
  const card = document.getElementById('dash-ai-daily');
  if (card) card.classList.remove('d-none');
  // Populate dashboard elements if they exist
  const aiDateIdea = document.getElementById('ai-date-idea');
  if (aiDateIdea && content.dateIdea) aiDateIdea.textContent = content.dateIdea;
  const aiChallenge = document.getElementById('ai-challenge');
  if (aiChallenge && content.challenge) aiChallenge.textContent = content.challenge;
  const aiConvo = document.getElementById('ai-convo-starter');
  if (aiConvo && content.conversationStarter) aiConvo.textContent = content.conversationStarter;
}

// ========================================
// ===== C1: WEEKLY INSIGHTS REPORT =====
// ========================================

let insightsWeekOffset = 0;

function getWeekKey(offset) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + (offset * 7)); // Sunday of target week
  return d.toISOString().split('T')[0];
}

function getWeekLabel(offset) {
  if (offset === 0) return 'This Week';
  if (offset === -1) return 'Last Week';
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + (offset * 7));
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' – ' +
    end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function loadWeeklyReport(weekKey) {
  if (!db) return;
  const snap = await coupleRef('ai/weeklyReports/' + weekKey).once('value');
  const report = snap.val();
  if (report) {
    renderInsightsReport(report);
    return true;
  }
  return false;
}

async function gatherWeeklyData() {
  if (!db) return {};
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const [moodsSnap, lettersSnap, gratSnap, gamesSnap, goalsSnap, checkinSnap, tapsSnap, fitSnap, finSnap] =
    await Promise.all([
      coupleRef('moods').orderByChild('timestamp').startAt(weekAgo).once('value'),
      coupleRef('letters').orderByChild('timestamp').startAt(weekAgo).once('value'),
      coupleRef('gratitude').orderByChild('timestamp').startAt(weekAgo).once('value'),
      coupleRef('games/tot').orderByChild('timestamp').startAt(weekAgo).once('value'),
      coupleRef('personalGoals/shared').once('value'),
      coupleRef('checkins').orderByChild('timestamp').startAt(weekAgo).once('value'),
      coupleRef('taps').orderByChild('timestamp').startAt(weekAgo).once('value'),
      coupleRef('fitness/workouts').orderByChild('timestamp').startAt(weekAgo).once('value'),
      coupleRef('finances/expenses').orderByChild('timestamp').startAt(weekAgo).once('value')
    ]);

  const collect = snap => { const arr = []; snap.forEach(c => arr.push(c.val())); return arr; };

  return {
    moods: collect(moodsSnap),
    letters: collect(lettersSnap),
    gratitude: collect(gratSnap),
    games: collect(gamesSnap),
    goals: goalsSnap.val() || {},
    checkins: collect(checkinSnap),
    taps: collect(tapsSnap),
    workouts: collect(fitSnap),
    expenses: collect(finSnap),
    partner1Name: NAMES.partner1,
    partner2Name: NAMES.partner2,
    currentUser: NAMES[user]
  };
}

async function generateWeeklyReport() {
  if (!CLAUDE_API_KEY) { toast('Set up AI in settings first'); return; }
  const btn = document.getElementById('insights-gen-btn');
  const loading = document.getElementById('insights-loading');
  const empty = document.getElementById('insights-empty');

  if (btn) { btn.disabled = true; btn.textContent = 'Generating...'; }
  if (loading) loading.classList.remove('d-none');
  if (empty) empty.classList.add('d-none');

  try {
    const data = await gatherWeeklyData();
    const weekKey = getWeekKey(insightsWeekOffset);

    const prompt = `You are the weekly insights engine for Moi et Toi, a couples app for ${NAMES.partner1} and ${NAMES.partner2}.

Analyze their week and generate a comprehensive relationship report. Here is their data:
${JSON.stringify(data)}

Return a JSON object with these keys:
- "score": Number 0-100, overall relationship engagement score for the week
- "scoreLabel": "Thriving" | "Strong" | "Growing" | "Warming Up" | "Getting Started"
- "scoreTrend": "up" | "stable" | "down" (compared to typical engagement)
- "pulseDetail": 1-2 sentences about their emotional connection this week
- "highlights": Array of 3-5 strings — positive things that happened (be specific with names and data)
- "growthAreas": Array of 1-3 strings — areas where engagement could improve (gentle, not judgmental)
- "recommendations": Array of 3 objects with { "action": string, "reason": string } — actionable suggestions
- "appreciation1": A sentence about how ${NAMES.partner1} showed love this week (based on data, or encouraging if sparse)
- "appreciation2": A sentence about how ${NAMES.partner2} showed love this week

Be warm, specific, and use their names. Reference actual data points. Return ONLY valid JSON.`;

    const result = await callAIBackground(prompt);
    if (result) {
      await coupleRef('ai/weeklyReports/' + weekKey).set({ ...result, generatedAt: Date.now() });
      renderInsightsReport(result);
    } else {
      if (empty) empty.classList.remove('d-none');
      toast('Could not generate report — try again');
    }
  } catch (e) {
    console.warn('Weekly report generation failed:', e);
    if (empty) empty.classList.remove('d-none');
    toast('Report generation failed');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Report'; }
    if (loading) loading.classList.add('d-none');
  }
}

function renderInsightsReport(report) {
  const container = document.getElementById('insights-report');
  const empty = document.getElementById('insights-empty');
  if (!container) return;

  if (empty) empty.classList.add('d-none');
  container.classList.remove('d-none');

  // Score
  const scoreEl = document.getElementById('ir-score');
  const labelEl = document.getElementById('ir-score-label');
  const detailEl = document.getElementById('ir-pulse-detail');
  if (scoreEl) scoreEl.textContent = report.score || '--';
  if (labelEl) {
    labelEl.textContent = report.scoreLabel || '';
    const trendIcon = report.scoreTrend === 'up' ? ' ↑' : report.scoreTrend === 'down' ? ' ↓' : '';
    labelEl.textContent += trendIcon;
  }
  if (detailEl) detailEl.textContent = report.pulseDetail || '';

  // Highlights
  const hlEl = document.getElementById('ir-highlights');
  if (hlEl && report.highlights) {
    hlEl.innerHTML = report.highlights.map(h => '<div class="ir-item ir-hl">✨ ' + esc(h) + '</div>').join('');
  }

  // Growth areas
  const grEl = document.getElementById('ir-growth');
  if (grEl && report.growthAreas) {
    grEl.innerHTML = report.growthAreas.map(g => '<div class="ir-item ir-gr">🌱 ' + esc(g) + '</div>').join('');
  }

  // Recommendations
  const recEl = document.getElementById('ir-recs');
  if (recEl && report.recommendations) {
    recEl.innerHTML = report.recommendations
      .map(r => '<div class="ir-rec"><div class="ir-rec-action">💡 ' + esc(r.action) + '</div><div class="ir-rec-reason">' + esc(r.reason) + '</div></div>')
      .join('');
  }

  // Appreciation
  const appEl = document.getElementById('ir-appreciation');
  if (appEl) {
    let html = '';
    if (report.appreciation1) html += '<div class="ir-item ir-app">💝 ' + esc(report.appreciation1) + '</div>';
    if (report.appreciation2) html += '<div class="ir-item ir-app">💝 ' + esc(report.appreciation2) + '</div>';
    appEl.innerHTML = html;
  }

  // Week label
  const weekEl = document.getElementById('insights-week');
  if (weekEl) weekEl.textContent = getWeekLabel(insightsWeekOffset);

  // Nav buttons
  const nextBtn = document.getElementById('ir-next');
  if (nextBtn) nextBtn.disabled = insightsWeekOffset >= 0;
}

async function prevWeekReport() {
  insightsWeekOffset--;
  const weekKey = getWeekKey(insightsWeekOffset);
  document.getElementById('insights-week').textContent = getWeekLabel(insightsWeekOffset);
  document.getElementById('ir-next').disabled = false;
  const found = await loadWeeklyReport(weekKey);
  if (!found) {
    document.getElementById('insights-report').classList.add('d-none');
    document.getElementById('insights-empty').classList.remove('d-none');
  }
}

async function nextWeekReport() {
  if (insightsWeekOffset >= 0) return;
  insightsWeekOffset++;
  const weekKey = getWeekKey(insightsWeekOffset);
  document.getElementById('insights-week').textContent = getWeekLabel(insightsWeekOffset);
  document.getElementById('ir-next').disabled = insightsWeekOffset >= 0;
  const found = await loadWeeklyReport(weekKey);
  if (!found) {
    document.getElementById('insights-report').classList.add('d-none');
    document.getElementById('insights-empty').classList.remove('d-none');
  }
}

// Auto-generate on Sunday
function checkAutoInsights() {
  if (!db || !CLAUDE_API_KEY) return;
  const now = new Date();
  if (now.getDay() !== 0) return; // Sunday only
  const weekKey = getWeekKey(0);
  coupleRef('ai/weeklyReports/' + weekKey).once('value', snap => {
    if (!snap.val()) generateWeeklyReport();
  });
}

// Load current week's report on page visit
function initInsightsPage() {
  insightsWeekOffset = 0;
  const weekKey = getWeekKey(0);
  loadWeeklyReport(weekKey);
  if (typeof renderEngagementDashboard === 'function') renderEngagementDashboard();
}

// ========================================
// ===== C2: PROACTIVE COACH =====
// ========================================

async function runProactiveCoach() {
  if (!CLAUDE_API_KEY || !db) return;

  try {
    const data = await gatherCoachData();
    if (!data || !data.hasEnoughData) return;

    const prompt = buildProactiveCoachPrompt(data);
    const result = await callAIBackground(prompt);
    if (result && result.nudges) {
      const now = Date.now();
      for (const nudge of result.nudges) {
        if (!nudge.message) continue;
        const nudgeData = {
          message: nudge.message,
          type: 'coach',
          timestamp: now,
          action: nudge.action || null,
          actionLabel: nudge.actionLabel || null
        };
        const target = nudge.target || 'both';
        if (target === 'both' || target === 'partner1') {
          await coupleRef('ai/nudges/partner1').push(nudgeData);
        }
        if (target === 'both' || target === 'partner2') {
          await coupleRef('ai/nudges/partner2').push(nudgeData);
        }
      }
      await coupleRef('ai/roles/ai_role_coach').set(Date.now());
    }
  } catch (e) {
    console.warn('Proactive coach failed:', e);
  }
}

async function gatherCoachData() {
  if (!db) return null;
  const now = Date.now();
  const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const [moodsSnap, lettersSnap, tapsSnap, gamesSnap, goalsSnap] = await Promise.all([
    coupleRef('moods').orderByChild('timestamp').startAt(weekAgo).once('value'),
    coupleRef('letters').orderByChild('timestamp').startAt(threeDaysAgo).once('value'),
    coupleRef('taps').orderByChild('timestamp').startAt(threeDaysAgo).once('value'),
    coupleRef('games/tot').orderByChild('timestamp').startAt(threeDaysAgo).once('value'),
    coupleRef('personalGoals/shared').once('value')
  ]);

  const moods = [];
  moodsSnap.forEach(c => moods.push(c.val()));

  const recentLetters = [];
  lettersSnap.forEach(c => recentLetters.push(c.val()));

  const recentTaps = [];
  tapsSnap.forEach(c => recentTaps.push(c.val()));

  const recentGames = [];
  gamesSnap.forEach(c => recentGames.push(c.val()));

  // Detect patterns
  const p1Moods = moods.filter(m => m.user === 'partner1').sort((a, b) => a.timestamp - b.timestamp);
  const p2Moods = moods.filter(m => m.user === 'partner2').sort((a, b) => a.timestamp - b.timestamp);

  const lastP1Mood = p1Moods[p1Moods.length - 1];
  const lastP2Mood = p2Moods[p2Moods.length - 1];

  // Check for declining moods (3+ days trending down)
  function detectDecline(userMoods) {
    if (userMoods.length < 3) return false;
    const last3 = userMoods.slice(-3);
    return last3[0].mood > last3[1].mood && last3[1].mood > last3[2].mood;
  }

  // Check for big mood swing
  function detectSwing(userMoods) {
    if (userMoods.length < 2) return false;
    const last2 = userMoods.slice(-2);
    return Math.abs(last2[1].mood - last2[0].mood) >= 3;
  }

  // Check for mood divergence between partners
  function detectDivergence() {
    if (!lastP1Mood || !lastP2Mood) return false;
    return Math.abs(lastP1Mood.mood - lastP2Mood.mood) >= 2;
  }

  // Days since last check-in
  function daysSince(userMoods) {
    if (!userMoods.length) return 99;
    return Math.floor((now - userMoods[userMoods.length - 1].timestamp) / (24 * 60 * 60 * 1000));
  }

  // Goals stalled check
  const goals = goalsSnap.val() || {};
  const stalledGoals = Object.values(goals).filter(g => {
    if (g.completed) return false;
    const updated = g.updatedAt || g.createdAt || 0;
    return (now - updated) > 7 * 24 * 60 * 60 * 1000;
  });

  const patterns = {
    p1Declining: detectDecline(p1Moods),
    p2Declining: detectDecline(p2Moods),
    p1Swing: detectSwing(p1Moods),
    p2Swing: detectSwing(p2Moods),
    diverging: detectDivergence(),
    p1DaysSinceCheckin: daysSince(p1Moods),
    p2DaysSinceCheckin: daysSince(p2Moods),
    recentlyConnected: recentLetters.length > 0 || recentTaps.length > 0 || recentGames.length > 0,
    stalledGoalCount: stalledGoals.length,
    stalledGoalNames: stalledGoals.slice(0, 3).map(g => g.title || 'Untitled')
  };

  // Only send to AI if there's something worth addressing
  const hasEnoughData = moods.length >= 2;
  const hasPatterns = patterns.p1Declining || patterns.p2Declining || patterns.p1Swing || patterns.p2Swing ||
    patterns.diverging || patterns.p1DaysSinceCheckin >= 3 || patterns.p2DaysSinceCheckin >= 3 ||
    patterns.stalledGoalCount > 0;

  return {
    hasEnoughData: hasEnoughData && hasPatterns,
    patterns,
    moods: moods.slice(-10),
    partner1Name: NAMES.partner1,
    partner2Name: NAMES.partner2
  };
}

function buildProactiveCoachPrompt(data) {
  return `You are the proactive relationship coach for ${data.partner1Name} and ${data.partner2Name}'s app.

DETECTED PATTERNS:
${JSON.stringify(data.patterns)}

RECENT MOODS (last 10):
${JSON.stringify(data.moods)}

Based on these patterns, generate targeted, empathetic nudges. Rules:
- Only generate nudges for patterns that actually need attention
- If they've recently connected (letters/taps/games), don't push connection nudges
- Reference actual data (e.g., "Your mood has been lower the past few days")
- Be warm, never nagging. Max 3 nudges.

Return a JSON object:
{
  "nudges": [
    {
      "message": "The nudge text (1-2 sentences, warm and specific)",
      "target": "partner1" | "partner2" | "both",
      "action": "mood" | "connect" | "deeptalk" | "games" | null,
      "actionLabel": "Log mood" | "Send a note" | "Start a deep talk" | "Play a game" | null
    }
  ]
}

Return ONLY valid JSON. If no nudges are needed, return { "nudges": [] }.`;
}

// Replace relationship monitor with proactive coach
function initProactiveCoach() {
  if (!db || !CLAUDE_API_KEY) return;
  coupleRef('ai/roles/ai_role_coach').once('value', snap => {
    const lastRun = snap.val() || 0;
    const sixHours = 6 * 60 * 60 * 1000;
    if (Date.now() - lastRun > sixHours) {
      const delay = 10000 + Math.random() * 20000;
      setTimeout(() => runProactiveCoach(), delay);
    }
  });
}

// Enhanced nudge renderer with action buttons
function renderAINudgesEnhanced() {
  const container = document.getElementById('ai-nudges');
  if (!container) return;
  if (!aiNudges.length) { container.innerHTML = ''; return; }

  const typeIcons = { relationship: '💕', milestone: '📅', goals: '🎯', wellness: '💪', finance: '💰', coach: '🤝' };
  const actionPages = { mood: 'mood', connect: 'connect', deeptalk: 'together', games: 'games' };

  container.innerHTML = aiNudges.map(n => {
    let actionBtn = '';
    if (n.action && n.actionLabel) {
      const page = actionPages[n.action] || n.action;
      actionBtn = '<button class="nudge-action-btn" onclick="go(\'' + page + '\'); dismissAINudge(\'' + n.key + '\')">' + esc(n.actionLabel) + '</button>';
    }
    return '<div class="ai-nudge-card">' +
      '<span class="ai-nudge-icon">' + (typeIcons[n.type] || '✨') + '</span>' +
      '<div class="ai-nudge-body">' +
        '<div class="ai-nudge-text">' + esc(n.message) + '</div>' +
        actionBtn +
      '</div>' +
      '<button class="ai-nudge-dismiss" onclick="dismissAINudge(\'' + n.key + '\')" aria-label="Dismiss">&times;</button>' +
    '</div>';
  }).join('');
}

// ========================================
// ===== C3: AI CONVERSATION FACILITATOR =====
// ========================================

let aiDTCat = 'thisweek';
let aiDTSession = null; // { intro, question, followUps, history }

function toggleAIFacilitator(enabled) {
  const standard = document.getElementById('dt-standard');
  const aiPanel = document.getElementById('dt-ai-mode-panel');
  if (standard) standard.classList.toggle('d-none', enabled);
  if (aiPanel) aiPanel.classList.toggle('d-none', !enabled);
  if (enabled) startAIDeepTalk();
}

function setAIDTCat(cat, el) {
  aiDTCat = cat;
  document.querySelectorAll('.dt-ai-cat').forEach(e => e.classList.remove('on'));
  if (el) el.classList.add('on');
  startAIDeepTalk();
}

async function startAIDeepTalk() {
  if (!CLAUDE_API_KEY) { toast('Set up AI in settings first'); return; }

  const loading = document.getElementById('dt-ai-loading');
  const session = document.getElementById('dt-ai-session');
  const controls = document.getElementById('dt-ai-controls');
  const summary = document.getElementById('dt-ai-summary');

  if (loading) loading.classList.remove('d-none');
  if (session) session.style.display = 'none';
  if (controls) controls.style.display = 'none';
  if (summary) { summary.classList.add('d-none'); summary.innerHTML = ''; }

  try {
    const context = await gatherFacilitatorContext();
    const prompt = buildFacilitatorPrompt(context);
    const result = await callAIBackground(prompt);

    if (result) {
      aiDTSession = {
        intro: result.intro || '',
        question: result.question || '',
        followUps: result.followUps || [],
        history: [result.question],
        context
      };
      renderAIDTSession();
    } else {
      toast('Could not generate conversation — try again');
    }
  } catch (e) {
    console.warn('AI facilitator failed:', e);
    toast('Failed to create conversation');
  } finally {
    if (loading) loading.classList.add('d-none');
  }
}

async function gatherFacilitatorContext() {
  if (!db) return {};
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const [moodsSnap, healthScore] = await Promise.all([
    coupleRef('moods').orderByChild('timestamp').startAt(weekAgo).once('value'),
    typeof MET !== 'undefined' && MET._ready ? Promise.resolve(MET.relationship) : Promise.resolve({})
  ]);

  const moods = [];
  moodsSnap.forEach(c => moods.push(c.val()));

  return {
    category: aiDTCat,
    recentMoods: moods.slice(-6),
    healthScore: healthScore.score || null,
    healthBreakdown: healthScore.breakdown || {},
    partner1Name: NAMES.partner1,
    partner2Name: NAMES.partner2
  };
}

function buildFacilitatorPrompt(ctx) {
  const catInstructions = {
    thisweek: `Generate a conversation topic based on their recent moods and events this week. Reference actual emotions or patterns you see in the data.`,
    growth: `Look at their relationship health breakdown and find the weakest area. Create a conversation topic that gently addresses it. Areas: mood sync, communication, shared goals, games/fun, fitness sync, financial alignment.`,
    celebrate: `Find something positive in their data — a streak, consistent check-ins, high moods, good sync — and create a conversation topic that celebrates it and deepens appreciation.`
  };

  return `You are an AI conversation facilitator for ${ctx.partner1Name} and ${ctx.partner2Name}'s deep talk session.

THEIR DATA:
- Recent moods: ${JSON.stringify(ctx.recentMoods)}
- Relationship health score: ${ctx.healthScore || 'not computed'}
- Health breakdown: ${JSON.stringify(ctx.healthBreakdown)}

CATEGORY: ${ctx.category}
${catInstructions[ctx.category] || catInstructions.thisweek}

Return a JSON object:
{
  "intro": "A warm 1-sentence introduction setting the tone (e.g., 'This week has been a mix of highs and lows for you both...')",
  "question": "The main conversation question (thoughtful, specific to their data, not generic)",
  "whoFirst": "${ctx.partner1Name}" or "${ctx.partner2Name}" (suggest who should answer first based on context),
  "followUps": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}

Be warm, specific, culturally aware (Togolese + Texan couple). Make the question feel tailored, not generic. Return ONLY valid JSON.`;
}

function renderAIDTSession() {
  const session = document.getElementById('dt-ai-session');
  const controls = document.getElementById('dt-ai-controls');
  if (!session || !aiDTSession) return;

  session.style.display = 'block';
  if (controls) controls.style.display = 'flex';

  const introEl = document.getElementById('dt-ai-intro');
  const questionEl = document.getElementById('dt-ai-question');
  const followEl = document.getElementById('dt-ai-followups');

  if (introEl) introEl.textContent = aiDTSession.intro;
  if (questionEl) questionEl.textContent = aiDTSession.question;
  if (followEl && aiDTSession.followUps.length) {
    followEl.innerHTML = '<div class="dt-ai-fu-label">When you\'re ready, explore deeper:</div>' +
      aiDTSession.followUps.map((f, i) =>
        '<button class="dt-ai-fu-btn" onclick="useFollowUp(' + i + ')">' + esc(f) + '</button>'
      ).join('');
  }
}

function useFollowUp(idx) {
  if (!aiDTSession || !aiDTSession.followUps[idx]) return;
  const q = aiDTSession.followUps[idx];
  aiDTSession.history.push(q);
  aiDTSession.question = q;
  aiDTSession.followUps.splice(idx, 1);
  renderAIDTSession();
}

async function getAIFollowUp() {
  if (!CLAUDE_API_KEY || !aiDTSession) return;

  const prompt = `You are facilitating a deep talk for ${NAMES.partner1} and ${NAMES.partner2}.

Questions discussed so far: ${JSON.stringify(aiDTSession.history)}

Generate ONE new follow-up question that goes deeper based on their conversation journey. Make it specific and emotionally rich.

Return a JSON object: { "question": "The follow-up question" }
Return ONLY valid JSON.`;

  const result = await callAIBackground(prompt);
  if (result && result.question) {
    aiDTSession.history.push(result.question);
    aiDTSession.question = result.question;
    renderAIDTSession();
  }
}

async function endAISession() {
  if (!aiDTSession) return;

  const controls = document.getElementById('dt-ai-controls');
  if (controls) controls.style.display = 'none';

  const summary = document.getElementById('dt-ai-summary');
  if (!summary) return;
  summary.classList.remove('d-none');
  summary.innerHTML = '<div class="insights-loading-text">Reflecting on your conversation...</div>';

  if (CLAUDE_API_KEY) {
    const prompt = `You facilitated a deep talk for ${NAMES.partner1} and ${NAMES.partner2}.

Questions they discussed: ${JSON.stringify(aiDTSession.history)}

Write a brief, warm summary (3-4 sentences) reflecting on what they explored. End with one small action item they could do this week to keep the conversation going.

Return a JSON object: { "summary": "...", "actionItem": "..." }
Return ONLY valid JSON.`;

    const result = await callAIBackground(prompt);
    if (result) {
      summary.innerHTML =
        '<div class="dt-ai-summary-title">Conversation Reflection</div>' +
        '<div class="dt-ai-summary-text">' + esc(result.summary || '') + '</div>' +
        (result.actionItem ? '<div class="dt-ai-action-item">This week: ' + esc(result.actionItem) + '</div>' : '');

      // Save to journal
      if (db) {
        await coupleRef('ai/conversations').push({
          questions: aiDTSession.history,
          summary: result.summary,
          actionItem: result.actionItem,
          category: aiDTCat,
          timestamp: Date.now(),
          user
        });
      }
    }
  }
  aiDTSession = null;
}

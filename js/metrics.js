// ===== PHASE 15: HISTORICAL DATA ENGINE & COMPUTATION LAYER =====
// Client-side indexing, computed metrics, and data aggregation.
// Rebuilt on data load, updated incrementally on changes.

const MET = window.MET = {
  mood: { byUser: {}, byDate: {}, byWeek: {}, byMonth: {}, all: [], stats: {} },
  fitness: { workouts: [], stats: {} },
  finance: { expenses: [], stats: {} },
  relationship: { score: 0, breakdown: {}, history: [] },
  _ready: false,
  _listeners: []
};

// ===== HELPERS =====
function weekId(d) {
  d = d || new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const wn = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + String(wn).padStart(2, '0');
}
function monthId(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function dayOfWeek(dateStr) { return new Date(dateStr + 'T12:00:00').getDay(); } // 0=Sun

// ===== MOOD INDEX =====
function buildMoodIndex(moods) {
  const idx = { byUser: { her: [], him: [] }, byDate: {}, byWeek: {}, byMonth: {}, all: [], stats: {} };
  moods.sort((a, b) => a.timestamp - b.timestamp);
  idx.all = moods;

  moods.forEach(m => {
    // By user
    if (m.user && idx.byUser[m.user]) idx.byUser[m.user].push(m);
    // By date
    if (m.date) {
      if (!idx.byDate[m.date]) idx.byDate[m.date] = [];
      idx.byDate[m.date].push(m);
    }
    // By week
    if (m.date) {
      const d = new Date(m.date + 'T12:00:00');
      const wk = weekId(d);
      if (!idx.byWeek[wk]) idx.byWeek[wk] = [];
      idx.byWeek[wk].push(m);
    }
    // By month
    if (m.date) {
      const mo = m.date.substring(0, 7);
      if (!idx.byMonth[mo]) idx.byMonth[mo] = [];
      idx.byMonth[mo].push(m);
    }
  });

  // Compute stats per user
  ['her', 'him'].forEach(u => {
    const um = idx.byUser[u] || [];
    idx.stats[u] = computeMoodStats(um);
  });

  // Joint stats
  idx.stats.joint = computeJointMoodStats(idx);

  MET.mood = idx;
  MET._ready = true;
  MET._listeners.forEach(fn => fn('mood'));
}

function computeMoodStats(moods) {
  if (!moods.length) return { avg7d: 0, avg30d: 0, avg90d: 0, streak: 0, total: 0, trend: 'stable', dayOfWeek: [] };
  const now = Date.now();
  const d7 = now - 7 * 86400000, d30 = now - 30 * 86400000, d90 = now - 90 * 86400000;
  const m7 = moods.filter(m => m.timestamp > d7);
  const m30 = moods.filter(m => m.timestamp > d30);
  const m90 = moods.filter(m => m.timestamp > d90);

  const avg = arr => arr.length ? +(arr.reduce((s, m) => s + m.mood, 0) / arr.length).toFixed(2) : 0;
  const avgE = arr => arr.length ? +(arr.reduce((s, m) => s + (m.energy || 3), 0) / arr.length).toFixed(2) : 0;

  // Rolling averages
  const avg7d = avg(m7), avg30d = avg(m30), avg90d = avg(m90);
  const energy7d = avgE(m7), energy30d = avgE(m30);

  // Trend direction: compare last 7d avg to previous 7d avg
  const d14 = now - 14 * 86400000;
  const prev7 = moods.filter(m => m.timestamp > d14 && m.timestamp <= d7);
  const prevAvg = avg(prev7);
  const trend = avg7d > prevAvg + 0.3 ? 'improving' : avg7d < prevAvg - 0.3 ? 'declining' : 'stable';

  // Streak (consecutive days checked in)
  let streak = 0;
  const today = localDate();
  let checkDate = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = localDate(checkDate);
    const found = moods.some(m => m.date === ds);
    if (found) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else if (ds === today) { checkDate.setDate(checkDate.getDate() - 1); } // today might not be checked yet
    else break;
  }

  // Day-of-week averages (for heatmap)
  const dow = [0, 0, 0, 0, 0, 0, 0]; // Sum
  const dowC = [0, 0, 0, 0, 0, 0, 0]; // Count
  m30.forEach(m => {
    if (!m.date) return;
    const d = dayOfWeek(m.date);
    dow[d] += m.mood; dowC[d]++;
  });
  const dayOfWeekAvg = dow.map((s, i) => dowC[i] ? +(s / dowC[i]).toFixed(1) : 0);

  // Mood distribution (last 30d)
  const dist = [0, 0, 0, 0, 0]; // 1-5
  m30.forEach(m => { if (m.mood >= 1 && m.mood <= 5) dist[m.mood - 1]++; });

  // Mood-energy correlation (Pearson r, last 30d)
  let correlation = 0;
  const paired = m30.filter(m => m.energy != null);
  if (paired.length >= 5) {
    const mA = paired.reduce((s, m) => s + m.mood, 0) / paired.length;
    const eA = paired.reduce((s, m) => s + m.energy, 0) / paired.length;
    let num = 0, denM = 0, denE = 0;
    paired.forEach(m => {
      const dm = m.mood - mA, de = m.energy - eA;
      num += dm * de; denM += dm * dm; denE += de * de;
    });
    correlation = denM && denE ? +(num / Math.sqrt(denM * denE)).toFixed(2) : 0;
  }

  return { avg7d, avg30d, avg90d, energy7d, energy30d, streak, total: moods.length,
    trend, dayOfWeek: dayOfWeekAvg, distribution: dist, moodEnergyCorr: correlation };
}

function computeJointMoodStats(idx) {
  // Sync score: % of days (last 30) where both checked in and moods within 1 of each other
  const now = Date.now();
  let syncDays = 0, bothDays = 0;
  for (let i = 0; i < 30; i++) {
    const ds = localDate(daysAgo(i));
    const dayMoods = idx.byDate[ds] || [];
    const herM = dayMoods.find(m => m.user === 'her');
    const himM = dayMoods.find(m => m.user === 'him');
    if (herM && himM) {
      bothDays++;
      if (Math.abs(herM.mood - himM.mood) <= 1) syncDays++;
    }
  }
  const syncScore = bothDays ? +(syncDays / bothDays).toFixed(2) : 0;

  // His mood vs her mood correlation (last 30d, on days both checked in)
  const pairs = [];
  for (let i = 0; i < 30; i++) {
    const ds = localDate(daysAgo(i));
    const dayMoods = idx.byDate[ds] || [];
    const herM = dayMoods.find(m => m.user === 'her');
    const himM = dayMoods.find(m => m.user === 'him');
    if (herM && himM) pairs.push({ her: herM.mood, him: himM.mood });
  }
  let crossCorrelation = 0;
  if (pairs.length >= 5) {
    const hA = pairs.reduce((s, p) => s + p.her, 0) / pairs.length;
    const mA = pairs.reduce((s, p) => s + p.him, 0) / pairs.length;
    let num = 0, dH = 0, dM = 0;
    pairs.forEach(p => {
      const dh = p.her - hA, dm = p.him - mA;
      num += dh * dm; dH += dh * dh; dM += dm * dm;
    });
    crossCorrelation = dH && dM ? +(num / Math.sqrt(dH * dM)).toFixed(2) : 0;
  }

  // Best day together (highest combined mood)
  let bestDay = null, bestScore = 0;
  Object.keys(idx.byDate).forEach(ds => {
    const dayMoods = idx.byDate[ds];
    const herM = dayMoods.find(m => m.user === 'her');
    const himM = dayMoods.find(m => m.user === 'him');
    if (herM && himM && herM.mood + himM.mood > bestScore) {
      bestScore = herM.mood + himM.mood;
      bestDay = ds;
    }
  });

  // Joint streak: consecutive days BOTH checked in
  let jointStreak = 0;
  const today = localDate();
  let cd = new Date();
  for (let i = 0; i < 365; i++) {
    const ds = localDate(cd);
    const dayMoods = idx.byDate[ds] || [];
    const both = dayMoods.some(m => m.user === 'her') && dayMoods.some(m => m.user === 'him');
    if (both) { jointStreak++; cd.setDate(cd.getDate() - 1); }
    else if (ds === today) { cd.setDate(cd.getDate() - 1); }
    else break;
  }

  return { syncScore, crossCorrelation, bestDay, bothDays, jointStreak };
}

// ===== FITNESS INDEX =====
function buildFitnessIndex(workouts) {
  if (!workouts || !workouts.length) { MET.fitness = { workouts: [], stats: {} }; return; }
  workouts.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  MET.fitness.workouts = workouts;

  const now = Date.now();
  const d7 = now - 7 * 86400000, d30 = now - 30 * 86400000;
  const w7 = workouts.filter(w => (w.timestamp || new Date(w.date).getTime()) > d7);
  const w30 = workouts.filter(w => (w.timestamp || new Date(w.date).getTime()) > d30);

  // Frequency
  const freq7d = w7.length;
  const freq30d = w30.length;

  // Volume tracking (sets × reps × weight)
  const totalVol7d = w7.reduce((s, w) => s + (w.totalVolume || calcVolume(w)), 0);
  const totalVol30d = w30.reduce((s, w) => s + (w.totalVolume || calcVolume(w)), 0);

  // Per-user stats
  const userStats = {};
  ['her', 'him'].forEach(u => {
    const uw = workouts.filter(w => w.user === u);
    const uw7 = uw.filter(w => (w.timestamp || new Date(w.date).getTime()) > d7);
    const uw30 = uw.filter(w => (w.timestamp || new Date(w.date).getTime()) > d30);
    userStats[u] = { total: uw.length, freq7d: uw7.length, freq30d: uw30.length };
  });

  // Partner sync: days both worked out in last 30d
  let syncDays = 0;
  for (let i = 0; i < 30; i++) {
    const ds = localDate(daysAgo(i));
    const her = w30.some(w => w.user === 'her' && w.date === ds);
    const him = w30.some(w => w.user === 'him' && w.date === ds);
    if (her && him) syncDays++;
  }

  // Muscle group distribution (last 30d)
  const muscleGroups = {};
  w30.forEach(w => (w.exercises || []).forEach(e => {
    const cat = e.category || e.muscles || 'other';
    const key = Array.isArray(cat) ? cat[0] : cat;
    if (key) muscleGroups[key] = (muscleGroups[key] || 0) + 1;
  }));

  // Personal records
  const prs = {};
  workouts.forEach(w => (w.exercises || []).forEach(e => {
    if (e.weight && e.name) {
      const key = e.name.toLowerCase();
      if (!prs[key] || e.weight > prs[key].weight) {
        prs[key] = { weight: e.weight, date: w.date, user: w.user };
      }
    }
  }));

  MET.fitness.stats = { freq7d, freq30d, totalVol7d, totalVol30d, userStats, syncDays, muscleGroups, prs };
}

function calcVolume(workout) {
  return (workout.exercises || []).reduce((s, e) =>
    s + (e.sets || 1) * (e.reps || 1) * (e.weight || 0), 0);
}

// ===== FINANCE INDEX =====
function buildFinanceIndex(expenses, budgets, savingsGoals) {
  if (!expenses) expenses = [];
  MET.finance.expenses = expenses;

  const now = Date.now();
  const thisMonth = monthId();
  const d30 = now - 30 * 86400000;

  // Monthly totals
  const monthlyTotals = {};
  const categoryTotals = {};
  const userTotals = { her: 0, him: 0 };
  let total30d = 0;

  expenses.forEach(e => {
    const mo = (e.date || '').substring(0, 7);
    if (mo) monthlyTotals[mo] = (monthlyTotals[mo] || 0) + (e.amount || 0);
    const cat = e.category || 'other';
    if (mo === thisMonth) {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
      if (e.paidBy) userTotals[e.paidBy] = (userTotals[e.paidBy] || 0) + (e.amount || 0);
    }
    if (e.timestamp > d30 || (e.date && new Date(e.date + 'T12:00:00').getTime() > d30)) {
      total30d += (e.amount || 0);
    }
  });

  // Budget utilization
  const budget = budgets || {};
  const utilization = {};
  const budgetCategories = budget.categories || {};
  Object.keys(budgetCategories).forEach(cat => {
    const spent = categoryTotals[cat] || 0;
    const limit = budgetCategories[cat] || 0;
    utilization[cat] = { spent, limit, pct: limit ? Math.round(spent / limit * 100) : 0 };
  });
  const totalBudget = budget.totalBudget || Object.values(budgetCategories).reduce((s, v) => s + v, 0);
  const totalSpent = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

  // Spending trend (compare this month so far vs last month same period)
  const today = new Date();
  const dayOfMonth = today.getDate();
  const lastMonth = new Date(today); lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthId = monthId(lastMonth);
  const lastMonthSameDay = expenses.filter(e => {
    if (!e.date) return false;
    const mo = e.date.substring(0, 7);
    if (mo !== lastMonthId) return false;
    const d = parseInt(e.date.substring(8, 10));
    return d <= dayOfMonth;
  }).reduce((s, e) => s + (e.amount || 0), 0);
  const spendTrend = totalSpent > lastMonthSameDay * 1.1 ? 'increasing' : totalSpent < lastMonthSameDay * 0.9 ? 'decreasing' : 'stable';

  // Partner balance
  const balance = userTotals.him - userTotals.her; // positive = him paid more

  // Savings goal progress
  const goals = (savingsGoals || []).map(g => ({
    ...g,
    pct: g.target ? Math.round((g.current || 0) / g.target * 100) : 0,
    remaining: (g.target || 0) - (g.current || 0),
    projectedDate: g.target && g.current && g.createdAt ? projectDate(g) : null
  }));

  MET.finance.stats = {
    thisMonth: totalSpent, total30d, monthlyTotals, categoryTotals, utilization,
    totalBudget, spendTrend, balance, userTotals, savingsGoals: goals
  };
}

function projectDate(goal) {
  const elapsed = Date.now() - goal.createdAt;
  const rate = goal.current / (elapsed / 86400000); // per day
  if (rate <= 0) return null;
  const remaining = goal.target - goal.current;
  const daysLeft = remaining / rate;
  const proj = new Date(Date.now() + daysLeft * 86400000);
  return localDate(proj);
}

// ===== RELATIONSHIP HEALTH SCORE V2 =====
// Weighted: mood frequency 20%, sync 15%, notes 15%, goals 15%, games 10%, fitness sync 10%, finance 10%, quiz 5%
function computeRelationshipHealth() {
  if (!db || !user) return;
  const today = localDate();
  const now = Date.now();
  const weekMs = 7 * 86400000;

  Promise.all([
    db.ref('moods').orderByChild('timestamp').limitToLast(60).once('value'),
    db.ref('letters').orderByChild('timestamp').limitToLast(20).once('value'),
    db.ref('goals').once('value'),
    db.ref('games/wyr').once('value'),
    db.ref('games/tot').once('value'),
    db.ref('workoutLogs').orderByChild('timestamp').limitToLast(30).once('value'),
    db.ref('finances/expenses').orderByChild('timestamp').limitToLast(30).once('value'),
    db.ref('gratitude').orderByChild('timestamp').limitToLast(10).once('value'),
    db.ref('deepTalkJournal').orderByChild('timestamp').limitToLast(5).once('value'),
    db.ref('checkins/' + weekId()).once('value'),
  ]).then(([moodSnap, letterSnap, goalSnap, wyrSnap, totSnap, fitSnap, expSnap, gratSnap, dtSnap, ciSnap]) => {
    const breakdown = {};
    let totalWeight = 0, totalScore = 0;

    // 1. Mood check-in frequency (20%)
    const weight1 = 20;
    totalWeight += weight1;
    let moodDays = 0;
    const moodDates = new Set();
    if (moodSnap.exists()) moodSnap.forEach(c => {
      const m = c.val();
      if (m.date && now - m.timestamp < weekMs) moodDates.add(m.user + ':' + m.date);
    });
    // Count days both checked in this week
    for (let i = 0; i < 7; i++) {
      const ds = localDate(daysAgo(i));
      if (moodDates.has('her:' + ds) && moodDates.has('him:' + ds)) moodDays++;
    }
    const moodScore = Math.min(1, moodDays / 5); // 5 out of 7 is perfect
    breakdown.moodFrequency = { score: moodScore, weight: weight1, detail: moodDays + '/7 days both' };
    totalScore += moodScore * weight1;

    // 2. Mood sync (15%)
    const weight2 = 15;
    totalWeight += weight2;
    const syncScore = MET.mood.stats.joint ? MET.mood.stats.joint.syncScore : 0;
    breakdown.moodSync = { score: syncScore, weight: weight2, detail: Math.round(syncScore * 100) + '% aligned' };
    totalScore += syncScore * weight2;

    // 3. Notes/communication (15%)
    const weight3 = 15;
    totalWeight += weight3;
    let recentNotes = 0, recentGrat = 0, recentDeep = 0;
    if (letterSnap.exists()) letterSnap.forEach(c => { if (now - c.val().timestamp < weekMs) recentNotes++; });
    if (gratSnap.exists()) gratSnap.forEach(c => { if (now - c.val().timestamp < weekMs) recentGrat++; });
    if (dtSnap.exists()) dtSnap.forEach(c => { if (now - c.val().timestamp < weekMs * 2) recentDeep++; });
    const commScore = Math.min(1, (recentNotes * 0.15 + recentGrat * 0.1 + recentDeep * 0.2));
    breakdown.communication = { score: commScore, weight: weight3, detail: recentNotes + ' notes, ' + recentGrat + ' gratitude' };
    totalScore += commScore * weight3;

    // 4. Goals progress (15%)
    const weight4 = 15;
    totalWeight += weight4;
    let sharedDone = 0, sharedTotal = 0;
    if (goalSnap.exists()) goalSnap.forEach(c => {
      const g = c.val();
      if (g.type === 'shared') { sharedTotal++; if (g.completedAt) sharedDone++; }
    });
    const goalScore = sharedTotal ? Math.min(1, (sharedDone / sharedTotal) + 0.3) : 0.3;
    breakdown.goals = { score: goalScore, weight: weight4, detail: sharedDone + '/' + sharedTotal + ' shared goals' };
    totalScore += goalScore * weight4;

    // 5. Games/fun (10%)
    const weight5 = 10;
    totalWeight += weight5;
    let gamesPlayed = 0;
    if (wyrSnap.exists()) wyrSnap.forEach(c => { const d = c.val(); if (d && d.her && d.him) gamesPlayed++; });
    if (totSnap.exists()) totSnap.forEach(c => { const d = c.val(); if (d && d.her && d.him) gamesPlayed++; });
    const gameScore = Math.min(1, gamesPlayed * 0.1);
    breakdown.games = { score: gameScore, weight: weight5, detail: gamesPlayed + ' played together' };
    totalScore += gameScore * weight5;

    // 6. Fitness sync (10%)
    const weight6 = 10;
    totalWeight += weight6;
    const fitSync = MET.fitness.stats.syncDays || 0;
    const fitScore = Math.min(1, fitSync * 0.15);
    breakdown.fitness = { score: fitScore, weight: weight6, detail: fitSync + ' sync days this month' };
    totalScore += fitScore * weight6;

    // 7. Financial alignment (10%)
    const weight7 = 10;
    totalWeight += weight7;
    const budgetUtil = MET.finance.stats.totalBudget ?
      Math.min(1, 1 - Math.abs(MET.finance.stats.thisMonth / MET.finance.stats.totalBudget - 1)) : 0.5;
    const finScore = Math.max(0, budgetUtil);
    breakdown.finance = { score: finScore, weight: weight7, detail: 'Budget utilization' };
    totalScore += finScore * weight7;

    // 8. Weekly check-in (5%)
    const weight8 = 5;
    totalWeight += weight8;
    let ciDone = 0;
    if (ciSnap.exists()) {
      const ci = ciSnap.val();
      if (ci && ci.her) ciDone++;
      if (ci && ci.him) ciDone++;
    }
    const ciScore = ciDone / 2;
    breakdown.weeklyCheckin = { score: ciScore, weight: weight8, detail: ciDone + '/2 completed' };
    totalScore += ciScore * weight8;

    const pct = totalWeight ? Math.round(totalScore / totalWeight * 100) : 0;

    MET.relationship = { score: pct, breakdown, timestamp: now };

    // Update dashboard UI
    const ring = document.getElementById('dash-pulse-ring');
    const scoreEl = document.getElementById('dash-pulse-score');
    const labelEl = document.getElementById('dash-pulse-label');
    const tipEl = document.getElementById('dash-pulse-tip');
    if (ring) ring.setAttribute('stroke-dashoffset', String(314 - (pct / 100) * 314));
    if (scoreEl) scoreEl.textContent = pct;
    if (pct >= 80) { if (labelEl) labelEl.textContent = 'Thriving'; if (tipEl) tipEl.textContent = 'You two are on fire together'; }
    else if (pct >= 60) { if (labelEl) labelEl.textContent = 'Strong'; if (tipEl) tipEl.textContent = 'Keep the momentum going'; }
    else if (pct >= 40) { if (labelEl) labelEl.textContent = 'Growing'; if (tipEl) tipEl.textContent = 'Try a game or deep talk'; }
    else if (pct >= 20) { if (labelEl) labelEl.textContent = 'Warming up'; if (tipEl) tipEl.textContent = 'Check in with each other today'; }
    else { if (labelEl) labelEl.textContent = 'Getting started'; if (tipEl) tipEl.textContent = 'Start with a mood check-in'; }

    // Store weekly snapshot
    storeWeeklyAnalytics(pct);

    MET._listeners.forEach(fn => fn('relationship'));
  });
}

// ===== WEEKLY ANALYTICS SNAPSHOT =====
function storeWeeklyAnalytics(healthScore) {
  if (!db) return;
  const wk = weekId();
  const stats = {
    moodAvg: { her: MET.mood.stats.her?.avg7d || 0, him: MET.mood.stats.him?.avg7d || 0 },
    workoutCount: { her: MET.fitness.stats.userStats?.her?.freq7d || 0, him: MET.fitness.stats.userStats?.him?.freq7d || 0 },
    expenseTotal: MET.finance.stats.total30d || 0,
    relationshipHealthScore: healthScore || 0,
    updatedAt: Date.now()
  };
  db.ref('analytics/weekly/' + wk).update(stats);
}

// ===== CHART RENDERERS =====

// Day-of-week mood heatmap (7 cells, one per day)
function renderMoodHeatmap(containerId, userFilter) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const stats = userFilter ? MET.mood.stats[userFilter] : MET.mood.stats.her; // default to current user
  if (!stats || !stats.dayOfWeek) { el.innerHTML = '<div class="empty" style="padding:8px;font-size:11px">Not enough data</div>'; return; }
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const max = Math.max(...stats.dayOfWeek.filter(v => v > 0), 1);
  el.innerHTML = stats.dayOfWeek.map((v, i) => {
    const intensity = v ? Math.round((v / 5) * 100) : 0;
    return `<div style="text-align:center;flex:1" title="${days[i]}: ${v}">
      <div style="width:100%;aspect-ratio:1;border-radius:6px;background:rgba(196,120,74,${intensity / 100 * 0.6 + 0.05});margin-bottom:2px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--cream);font-weight:500">${v || ''}</div>
      <div style="font-size:8px;color:var(--t3)">${days[i]}</div>
    </div>`;
  }).join('');
}

// Bar chart for weekly workout frequency or spending
function renderBarChart(containerId, data, options) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const opts = options || {};
  const max = Math.max(...data.map(d => d.value), 1);
  const barColor = opts.color || 'var(--gold)';
  el.innerHTML = data.map(d => {
    const h = Math.max((d.value / max) * 100, 3);
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
      <div style="font-size:9px;color:var(--t3)">${opts.formatValue ? opts.formatValue(d.value) : d.value}</div>
      <div style="width:100%;max-width:24px;background:var(--bg3);border-radius:4px;height:60px;position:relative;overflow:hidden">
        <div style="position:absolute;bottom:0;width:100%;height:${h}%;background:${barColor};border-radius:4px;transition:height .6s ease"></div>
      </div>
      <div style="font-size:8px;color:var(--t3)">${d.label}</div>
    </div>`;
  }).join('');
}

// Radar/spider chart for partner comparison (quiz profiles, wellness dimensions)
function renderRadarChart(containerId, dimensions) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const n = dimensions.length;
  if (n < 3) return;
  const size = 140, cx = size / 2, cy = size / 2, r = size / 2 - 20;
  const angleStep = (2 * Math.PI) / n;

  // Grid lines
  let gridLines = '';
  [0.25, 0.5, 0.75, 1].forEach(scale => {
    let pts = '';
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      pts += `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)} `;
    }
    gridLines += `<polygon points="${pts}" fill="none" stroke="var(--bg3)" stroke-width="0.5"/>`;
  });

  // Axis lines
  let axes = '';
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI / 2;
    axes += `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(angle)}" y2="${cy + r * Math.sin(angle)}" stroke="var(--bg3)" stroke-width="0.5"/>`;
  }

  // Data polygons
  function dataPolygon(values, color, opacity) {
    let pts = '';
    values.forEach((v, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const vr = (v / 5) * r; // assume 1-5 scale
      pts += `${cx + vr * Math.cos(angle)},${cy + vr * Math.sin(angle)} `;
    });
    return `<polygon points="${pts}" fill="${color}" fill-opacity="${opacity}" stroke="${color}" stroke-width="1.5"/>`;
  }

  const herPoly = dataPolygon(dimensions.map(d => d.her || 0), 'var(--rose)', 0.15);
  const himPoly = dataPolygon(dimensions.map(d => d.him || 0), 'var(--teal)', 0.15);

  // Labels
  let labels = '';
  dimensions.forEach((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const lx = cx + (r + 14) * Math.cos(angle);
    const ly = cy + (r + 14) * Math.sin(angle);
    labels += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="var(--t3)" font-size="8" font-family="Outfit">${d.label}</text>`;
  });

  el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="overflow:visible">${gridLines}${axes}${herPoly}${himPoly}${labels}</svg>
    <div style="display:flex;gap:12px;justify-content:center;margin-top:6px;font-size:9px">
      <span style="color:var(--rose)">● ${typeof NAMES !== 'undefined' ? NAMES.her : 'Her'}</span>
      <span style="color:var(--teal)">● ${typeof NAMES !== 'undefined' ? NAMES.him : 'Him'}</span>
    </div>`;
}

// Scatter plot for mood vs energy correlation
function renderScatterPlot(containerId, userKey) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const moods = MET.mood.byUser[userKey || user] || [];
  const recent = moods.filter(m => m.energy != null).slice(-30);
  if (recent.length < 3) { el.innerHTML = '<div class="empty" style="padding:8px;font-size:11px">Need more data</div>'; return; }
  const w = 160, h = 120, pad = 20;
  let dots = '';
  recent.forEach(m => {
    const x = pad + ((m.mood - 1) / 4) * (w - 2 * pad);
    const y = h - pad - ((m.energy - 1) / 4) * (h - 2 * pad);
    dots += `<circle cx="${x}" cy="${y}" r="3" fill="var(--gold)" opacity="0.6"/>`;
  });
  el.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="var(--bg3)" stroke-width="0.5"/>
    <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="var(--bg3)" stroke-width="0.5"/>
    <text x="${w / 2}" y="${h - 2}" text-anchor="middle" fill="var(--t3)" font-size="8" font-family="Outfit">Mood →</text>
    <text x="4" y="${h / 2}" text-anchor="middle" fill="var(--t3)" font-size="8" font-family="Outfit" transform="rotate(-90 4 ${h / 2})">Energy →</text>
    ${dots}
  </svg>`;
}

// Spending by category donut
function renderSpendingDonut(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const cats = MET.finance.stats.categoryTotals || {};
  const entries = Object.entries(cats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (!entries.length) { el.innerHTML = '<div class="empty" style="padding:8px;font-size:11px">No spending data</div>'; return; }
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const colors = ['var(--gold)', 'var(--rose)', 'var(--teal)', 'var(--emerald)', 'var(--lavender)', 'var(--amber)'];
  const r = 40, circumference = 2 * Math.PI * r;
  let offset = 0, segments = '';
  entries.forEach(([, v], i) => {
    const pct = v / total;
    const dash = pct * circumference;
    segments += `<circle cx="50" cy="50" r="${r}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="20" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 50 50)"/>`;
    offset += dash;
  });
  const legend = entries.slice(0, 5).map(([cat, v], i) =>
    `<div style="display:flex;align-items:center;gap:6px;font-size:10px"><div style="width:8px;height:8px;border-radius:50%;background:${colors[i % colors.length]}"></div><span style="color:var(--cream)">${cat}</span><span style="color:var(--t3);margin-left:auto">$${v.toFixed(0)}</span></div>`
  ).join('');
  el.innerHTML = `<div style="display:flex;align-items:center;gap:16px">
    <svg width="100" height="100" viewBox="0 0 100 100">${segments}
      <text x="50" y="48" text-anchor="middle" fill="var(--gold)" font-size="14" font-weight="600" font-family="Outfit">$${total.toFixed(0)}</text>
      <text x="50" y="60" text-anchor="middle" fill="var(--t3)" font-size="7" font-family="Outfit">this month</text>
    </svg>
    <div style="flex:1;display:flex;flex-direction:column;gap:4px">${legend}</div>
  </div>`;
}

// ===== TIME MACHINE =====
function getTimeMachineData(dateStr) {
  // Get a snapshot of what the app looked like on a given date
  const target = new Date(dateStr + 'T23:59:59');
  const targetTs = target.getTime();
  const dayStart = new Date(dateStr + 'T00:00:00').getTime();

  // Moods on that day
  const dayMoods = MET.mood.byDate[dateStr] || [];

  // Moods leading up to that date (7d rolling)
  const d7 = targetTs - 7 * 86400000;
  const trailing7 = MET.mood.all.filter(m => m.timestamp >= d7 && m.timestamp <= targetTs);
  const avg7d = trailing7.length ? +(trailing7.reduce((s, m) => s + m.mood, 0) / trailing7.length).toFixed(1) : null;

  // Workouts on that day
  const dayWorkouts = MET.fitness.workouts.filter(w => w.date === dateStr);

  return { date: dateStr, moods: dayMoods, avg7d, workouts: dayWorkouts };
}

function renderTimeMachine(containerId, dateStr) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const data = getTimeMachineData(dateStr);
  const formatted = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const emojis = { 1: '😴', 2: '😕', 3: '😊', 4: '😃', 5: '🔥' };

  let moodHtml = '';
  if (data.moods.length) {
    moodHtml = data.moods.map(m =>
      `<div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">${emojis[m.mood] || '?'}</span><span style="font-size:12px;color:var(--cream)">${m.userName || m.user}</span>${m.note ? `<span style="font-size:11px;color:var(--t3);font-style:italic">"${esc(m.note)}"</span>` : ''}</div>`
    ).join('');
  } else {
    moodHtml = '<div style="font-size:11px;color:var(--t3)">No check-ins</div>';
  }

  let workoutHtml = '';
  if (data.workouts.length) {
    workoutHtml = data.workouts.map(w =>
      `<div style="font-size:11px;color:var(--cream)">${w.userName || w.user} — ${w.workoutType || 'Workout'} (${(w.exercises || []).length} exercises)</div>`
    ).join('');
  }

  el.innerHTML = `<div style="padding:16px;background:var(--card-bg);border-radius:16px;box-shadow:var(--card-shadow);border:1px solid var(--bdr-s)">
    <div style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--gold);font-weight:600;margin-bottom:8px">Time Machine</div>
    <div style="font-size:14px;color:var(--cream);margin-bottom:4px">${formatted}</div>
    ${data.avg7d != null ? `<div style="font-size:11px;color:var(--t3);margin-bottom:10px">7-day mood avg: ${data.avg7d}</div>` : ''}
    <div style="margin-bottom:8px">${moodHtml}</div>
    ${workoutHtml ? `<div style="border-top:1px solid var(--bdr-s);padding-top:8px;margin-top:8px">${workoutHtml}</div>` : ''}
  </div>`;
}

// "This time last..." comparisons
function getThisTimeLast(period) {
  const now = new Date();
  let compareDate;
  if (period === 'week') { compareDate = new Date(now); compareDate.setDate(compareDate.getDate() - 7); }
  else if (period === 'month') { compareDate = new Date(now); compareDate.setMonth(compareDate.getMonth() - 1); }
  else if (period === 'year') { compareDate = new Date(now); compareDate.setFullYear(compareDate.getFullYear() - 1); }
  else return null;
  return getTimeMachineData(localDate(compareDate));
}

// ===== DATA LOADING ORCHESTRATOR =====
// Call from finishLogin() to build all indexes
function initMetricsEngine() {
  if (!db) return;

  // Load moods
  db.ref('moods').orderByChild('timestamp').limitToLast(500).once('value', snap => {
    const moods = [];
    if (snap.exists()) snap.forEach(c => { const m = c.val(); m._key = c.key; moods.push(m); });
    buildMoodIndex(moods);
  });

  // Load workouts
  db.ref('workoutLogs').orderByChild('timestamp').limitToLast(200).once('value', snap => {
    const workouts = [];
    if (snap.exists()) snap.forEach(c => { const w = c.val(); w._key = c.key; workouts.push(w); });
    buildFitnessIndex(workouts);
  });

  // Load finances
  Promise.all([
    db.ref('finances/expenses').orderByChild('timestamp').limitToLast(300).once('value'),
    db.ref('finances/budgets/' + monthId()).once('value'),
    db.ref('finances/savingsGoals').once('value'),
  ]).then(([expSnap, budSnap, savSnap]) => {
    const expenses = [];
    if (expSnap.exists()) expSnap.forEach(c => { const e = c.val(); e._key = c.key; expenses.push(e); });
    const budget = budSnap.val() || {};
    const goals = [];
    if (savSnap.exists()) savSnap.forEach(c => { const g = c.val(); g._key = c.key; goals.push(g); });
    buildFinanceIndex(expenses, budget, goals);
  });

  // Compute relationship health after a short delay (let indexes build)
  setTimeout(() => computeRelationshipHealth(), 2000);
}

// Listen for incremental mood updates
function listenMoodUpdates() {
  if (!db) return;
  db.ref('moods').orderByChild('timestamp').limitToLast(1).on('child_added', () => {
    // Debounced rebuild
    clearTimeout(MET._moodDebounce);
    MET._moodDebounce = setTimeout(() => {
      db.ref('moods').orderByChild('timestamp').limitToLast(500).once('value', snap => {
        const moods = [];
        if (snap.exists()) snap.forEach(c => { const m = c.val(); m._key = c.key; moods.push(m); });
        buildMoodIndex(moods);
      });
    }, 1000);
  });
}

// Subscribe to metric changes
function onMetricsUpdate(fn) {
  MET._listeners.push(fn);
}

// ===== PULSE BREAKDOWN =====
function togglePulseBreakdown() {
  const el = document.getElementById('dash-pulse-breakdown');
  if (!el) return;
  const isHidden = el.classList.contains('d-none');
  toggleEl(el);
  if (isHidden) renderPulseBreakdown();
}

function renderPulseBreakdown() {
  const el = document.getElementById('dash-pulse-bars');
  if (!el || !MET.relationship.breakdown) return;
  const bd = MET.relationship.breakdown;
  const labels = {
    moodFrequency: 'Mood Check-ins', moodSync: 'Mood Sync', communication: 'Communication',
    goals: 'Shared Goals', games: 'Games & Fun', fitness: 'Fitness Sync',
    finance: 'Financial', weeklyCheckin: 'Weekly Check-in'
  };
  el.innerHTML = Object.keys(bd).map(key => {
    const item = bd[key];
    const pct = Math.round(item.score * 100);
    const color = pct >= 70 ? 'var(--emerald)' : pct >= 40 ? 'var(--gold)' : 'var(--rose)';
    return `<div style="margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px">
        <span style="color:var(--cream)">${labels[key] || key}</span>
        <span style="color:var(--t3)">${item.detail}</span>
      </div>
      <div style="height:4px;background:var(--bg3);border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:2px;transition:width .6s ease"></div>
      </div>
    </div>`;
  }).join('');
}

// ===== AUTO-UPDATE UI WHEN METRICS CHANGE =====
onMetricsUpdate(function(type) {
  if (type === 'mood') updateMoodPageAnalytics();
});

function updateMoodPageAnalytics() {
  const u = typeof user !== 'undefined' ? user : 'him';
  const stats = MET.mood.stats[u];
  if (!stats) return;

  // Rolling averages
  const a7 = document.getElementById('mood-avg-7d');
  const a30 = document.getElementById('mood-avg-30d');
  const trendEl = document.getElementById('mood-trend-dir');
  if (a7) a7.textContent = stats.avg7d || '--';
  if (a30) a30.textContent = stats.avg30d || '--';
  if (trendEl) {
    const arrows = { improving: '↑', declining: '↓', stable: '→' };
    const colors = { improving: 'var(--emerald)', declining: 'var(--rose)', stable: 'var(--t3)' };
    trendEl.textContent = arrows[stats.trend] || '--';
    trendEl.style.color = colors[stats.trend] || 'var(--t3)';
  }

  // Sync score
  const joint = MET.mood.stats.joint;
  if (joint) {
    const syncBar = document.getElementById('mood-sync-bar');
    const syncPct = document.getElementById('mood-sync-pct');
    if (syncBar) syncBar.style.width = Math.round(joint.syncScore * 100) + '%';
    if (syncPct) syncPct.textContent = Math.round(joint.syncScore * 100) + '%';
  }

  // Heatmap and scatter
  renderMoodHeatmap('mood-dow-heatmap', u);
  renderScatterPlot('mood-scatter', u);

  // Time machine default: show this time last week
  const lastWeek = getThisTimeLast('week');
  if (lastWeek) {
    const tmResult = document.getElementById('tm-result');
    if (tmResult && !tmResult.dataset.custom) renderTimeMachine('tm-result', lastWeek.date);
  }

  // Update Me dashboard stats if visible
  const meAvg = document.getElementById('dash-me-mood-avg');
  if (meAvg && stats.avg30d) meAvg.textContent = stats.avg30d;
}

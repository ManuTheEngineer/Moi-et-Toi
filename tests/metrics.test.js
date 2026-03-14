import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const metricsSrc = readFileSync(resolve(__dirname, '../js/metrics.js'), 'utf-8');

function createEnv() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    runScripts: 'dangerously'
  });
  const { window } = dom;

  // Provide globals that metrics.js depends on
  window.MET = {
    mood: { byUser: {}, byDate: {}, byWeek: {}, byMonth: {}, all: [], stats: {} },
    fitness: { workouts: [], stats: {} },
    finance: { expenses: [], stats: {} },
    relationship: { score: 0, breakdown: {}, history: [] },
    _ready: false,
    _listeners: []
  };
  window.localDate = (d) => {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const script = window.document.createElement('script');
  script.textContent = metricsSrc;
  window.document.body.appendChild(script);
  return window;
}

function makeMood(user, mood, daysAgo, energy) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return { user, mood, energy: energy || 3, timestamp: d.getTime(), date };
}

describe('weekId() — week identifier', () => {
  let win;
  beforeEach(() => { win = createEnv(); });

  it('returns format YYYY-Wnn', () => {
    const result = win.weekId(new Date(2025, 0, 15));
    expect(result).toMatch(/^2025-W\d{2}$/);
  });

  it('uses current date when no arg', () => {
    const result = win.weekId();
    const year = new Date().getFullYear();
    expect(result).toMatch(new RegExp('^' + year + '-W\\d{2}$'));
  });
});

describe('monthId() — month identifier', () => {
  let win;
  beforeEach(() => { win = createEnv(); });

  it('returns YYYY-MM format', () => {
    expect(win.monthId(new Date(2025, 5, 1))).toBe('2025-06');
  });

  it('pads single-digit months', () => {
    expect(win.monthId(new Date(2025, 0, 1))).toBe('2025-01');
  });
});

describe('dayOfWeek() — day of week from date string', () => {
  let win;
  beforeEach(() => { win = createEnv(); });

  it('returns 0 for Sunday', () => {
    expect(win.dayOfWeek('2025-01-05')).toBe(0);
  });

  it('returns 1 for Monday', () => {
    expect(win.dayOfWeek('2025-01-06')).toBe(1);
  });
});

describe('computeMoodStats() — mood statistics', () => {
  let win;
  beforeEach(() => { win = createEnv(); });

  it('returns zeroed stats for empty array', () => {
    const stats = win.computeMoodStats([]);
    expect(stats.avg7d).toBe(0);
    expect(stats.avg30d).toBe(0);
    expect(stats.total).toBe(0);
    expect(stats.trend).toBe('stable');
  });

  it('computes correct averages for recent moods', () => {
    const moods = [
      makeMood('partner1', 4, 1),
      makeMood('partner1', 5, 2),
      makeMood('partner1', 3, 3),
    ];
    const stats = win.computeMoodStats(moods);
    expect(stats.avg7d).toBe(4);
    expect(stats.total).toBe(3);
  });

  it('computes 30-day average separately', () => {
    const moods = [
      makeMood('partner1', 5, 1),
      makeMood('partner1', 2, 10),
      makeMood('partner1', 3, 20),
    ];
    const stats = win.computeMoodStats(moods);
    expect(stats.avg7d).toBe(5);
    expect(stats.avg30d).toBeCloseTo(3.33, 1);
  });

  it('detects improving trend', () => {
    const moods = [];
    for (let i = 8; i <= 13; i++) moods.push(makeMood('partner1', 2, i));
    for (let i = 1; i <= 6; i++) moods.push(makeMood('partner1', 5, i));
    const stats = win.computeMoodStats(moods);
    expect(stats.trend).toBe('improving');
  });

  it('computes mood distribution', () => {
    const moods = [
      makeMood('partner1', 1, 1),
      makeMood('partner1', 3, 2),
      makeMood('partner1', 5, 3),
      makeMood('partner1', 5, 4),
    ];
    const stats = win.computeMoodStats(moods);
    expect(stats.distribution[0]).toBe(1);
    expect(stats.distribution[2]).toBe(1);
    expect(stats.distribution[4]).toBe(2);
  });
});

describe('buildMoodIndex() — mood indexing', () => {
  let win;
  beforeEach(() => { win = createEnv(); });

  it('indexes moods by user', () => {
    const moods = [
      makeMood('partner1', 4, 1),
      makeMood('partner2', 3, 1),
      makeMood('partner1', 5, 2),
    ];
    win.buildMoodIndex(moods);
    expect(win.MET.mood.byUser.partner1.length).toBe(2);
    expect(win.MET.mood.byUser.partner2.length).toBe(1);
  });

  it('indexes moods by date', () => {
    const d = new Date();
    const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const moods = [
      makeMood('partner1', 4, 0),
      makeMood('partner2', 3, 0),
    ];
    win.buildMoodIndex(moods);
    expect(win.MET.mood.byDate[today].length).toBe(2);
  });

  it('sets _ready flag', () => {
    win.buildMoodIndex([makeMood('partner1', 4, 1)]);
    expect(win.MET._ready).toBe(true);
  });

  it('fires listeners', () => {
    let fired = false;
    win.MET._listeners.push(() => { fired = true; });
    win.buildMoodIndex([makeMood('partner1', 4, 1)]);
    expect(fired).toBe(true);
  });
});

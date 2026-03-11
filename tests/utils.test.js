import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const utilsSrc = readFileSync(resolve(__dirname, '../js/utils.js'), 'utf-8');

function createEnv() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    runScripts: 'dangerously'
  });
  const { window } = dom;
  window._prefersReducedMotion = true;
  window.renderLivingSky = () => {};
  window.renderMountainTerrain = () => {};
  window.renderBeachTerrain = () => {};
  window.renderMeadowTerrain = () => {};
  window.currentSkyTheme = 'mixed';
  const script = window.document.createElement('script');
  script.textContent = utilsSrc;
  window.document.body.appendChild(script);
  return window;
}

describe('esc() — HTML escaping', () => {
  let win;
  beforeEach(() => { win = createEnv(); });

  it('escapes HTML special characters', () => {
    expect(win.esc('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('escapes ampersands', () => {
    expect(win.esc('a & b')).toBe('a &amp; b');
  });

  it('returns empty string for falsy input', () => {
    expect(win.esc('')).toBe('');
    expect(win.esc(null)).toBe('');
    expect(win.esc(undefined)).toBe('');
  });

  it('passes through safe strings unchanged', () => {
    expect(win.esc('hello world')).toBe('hello world');
  });
});

describe('localDate() — date formatting', () => {
  let win;
  beforeEach(() => { win = createEnv(); });

  it('formats a specific date as YYYY-MM-DD', () => {
    expect(win.localDate(new Date(2025, 0, 5))).toBe('2025-01-05');
  });

  it('pads single-digit months and days', () => {
    expect(win.localDate(new Date(2024, 2, 3))).toBe('2024-03-03');
  });

  it('returns today when no arg is given', () => {
    const result = win.localDate();
    const today = new Date();
    const expected = today.getFullYear() + '-'
      + String(today.getMonth() + 1).padStart(2, '0') + '-'
      + String(today.getDate()).padStart(2, '0');
    expect(result).toBe(expected);
  });
});

describe('timeAgo() — relative time', () => {
  let win;
  beforeEach(() => { win = createEnv(); });

  it('returns "just now" for recent timestamps', () => {
    expect(win.timeAgo(new Date(Date.now() - 10000))).toBe('just now');
  });

  it('returns minutes ago', () => {
    expect(win.timeAgo(new Date(Date.now() - 300000))).toBe('5m ago');
  });

  it('returns hours ago', () => {
    expect(win.timeAgo(new Date(Date.now() - 7200000))).toBe('2h ago');
  });

  it('returns "yesterday" for 1 day ago', () => {
    expect(win.timeAgo(new Date(Date.now() - 86400000))).toBe('yesterday');
  });

  it('returns days ago for 2-6 days', () => {
    expect(win.timeAgo(new Date(Date.now() - 3 * 86400000))).toBe('3d ago');
  });

  it('returns weeks ago for 7+ days', () => {
    expect(win.timeAgo(new Date(Date.now() - 14 * 86400000))).toBe('2w ago');
  });

  it('returns empty string for null', () => {
    expect(win.timeAgo(null)).toBe('');
  });
});

describe('getTimeOfDay() — time-of-day classification', () => {
  let win;
  beforeEach(() => { win = createEnv(); });

  it('returns a valid time period', () => {
    const result = win.getTimeOfDay();
    expect(['dawn', 'morning', 'afternoon', 'golden', 'evening', 'night']).toContain(result);
  });
});

describe('showEl/hideEl — visibility toggling', () => {
  let win;
  beforeEach(() => {
    win = createEnv();
    const el = win.document.createElement('div');
    el.id = 'test-el';
    el.classList.add('d-none');
    win.document.body.appendChild(el);
  });

  it('showEl removes d-none class', () => {
    win.showEl('test-el');
    expect(win.document.getElementById('test-el').classList.contains('d-none')).toBe(false);
  });

  it('hideEl adds d-none class', () => {
    win.showEl('test-el');
    win.hideEl('test-el');
    expect(win.document.getElementById('test-el').classList.contains('d-none')).toBe(true);
  });

  it('handles non-existent elements gracefully', () => {
    expect(() => win.showEl('nonexistent')).not.toThrow();
    expect(() => win.hideEl('nonexistent')).not.toThrow();
  });
});

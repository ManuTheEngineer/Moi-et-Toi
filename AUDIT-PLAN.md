# Moi-et-Toi Audit Cleanup Plan

Based on the comprehensive audit of 28 pages across ~57K lines of frontend code.

---

## Phase 1: Quick Wins (Low Risk, High Impact)

### 1.1 Remove Duplicate Meal Planning UI
**Problem:** Nearly identical meal planning forms exist in both `pg-homelife` (lines 4224-4243) and `pg-nutrition` (lines 4870-4887). They write to different DB paths (`homelife/meals` vs `nutrition/mealPlans/{weekKey}`), fragmenting user data.

**Fix:**
- Remove the meal planning section from `pg-nutrition` (it's inside a `us-only` wrapper — less discoverable)
- Keep `pg-homelife` as the single meal planning location (it's in the "Home Life" hub where meals logically belong)
- Remove `addMealPlan()` and `loadMealPlans()` from `modules-track.js`
- Add a "Meal Ideas →" shortcut link in `pg-nutrition` that calls `go('homelife')` so users aren't stranded

**Files:** `index.html`, `js/modules-track.js`

### 1.2 Consolidate Mood Sound Buttons into Single Dynamic Renderer
**Problem:** 38 mood-sound buttons hardcoded across 3 pages (`pg-connect`: 10, `pg-datenight`: 18, `pg-settings`: 10). `renderMoodSoundsGrid()` already exists in `weather.js:2922` and dynamically generates these grids.

**Fix:**
- Replace all 3 hardcoded button grids with empty containers (`<div id="mood-sounds-grid"></div>`, etc.)
- Ensure `renderMoodSoundsGrid()` populates all 3 containers on page load
- Verify the function already handles different onclick handlers per grid (it does: `toggleMoodSound` vs `sendMoodToPartner`)
- Delete ~60 lines of redundant HTML

**Files:** `index.html`, verify `js/weather.js`

### 1.3 Comment Workout Page Containers
**Problem:** `pg-w1`, `pg-w2`, `pg-w3` (lines 2808-2810) are single-line empty `<div>` containers with zero HTML. Content is 100% JS-injected.

**Fix:** No action needed — these are intentionally dynamic. Add a brief HTML comment for maintainability.

**Files:** `index.html` (comment only)

---

## Phase 2: Reduce Overlap & Consolidate (Medium Risk)

### 2.1 Merge Dreams & Shared Goals
**Problem:** `pg-dreams` and `pg-values` (Shared Goals section) both track future aspirations with overlapping categories (Home, Career, Finance). Data splits across `dreams` and `goals/shared` DB paths.

**Fix:**
- Remove "Shared Goals" section from `pg-values` (lines 5559-5575)
- Add a "Shared Goals" category/filter to `pg-dreams` instead
- Migrate `goals/shared` data to `dreams` with a `type: 'shared'` flag (one-time migration script)
- Remove `addSharedGoal()`, `loadSharedGoals()`, `toggleGoalComplete()` from `modules-life.js`
- Add a "Goals →" shortcut in `pg-values` Foundation tab pointing to `go('dreams')`

**Files:** `index.html`, `js/modules-life.js`, migration script

### 2.2 Clarify Gratitude vs Blessings
**Problem:** `pg-gratitude` (gratitude logging) and `pg-values` Spiritual tab (Blessings Journal) serve similar purposes.

**Fix:** Keep both — they're semantically different (daily gratitude vs spiritual blessings). Add distinct placeholder text to reinforce the difference:
- Gratitude: "What are you grateful for today?"
- Blessings: "Count a blessing you've received"

**Files:** `index.html` (placeholder text only)

---

## Phase 3: Code Quality & Structure (Medium Risk)

### 3.1 Reduce index.html Size
**Problem:** 6,421 lines in a single HTML file. Hard to maintain.

**Fix:** Extract the 5 largest pages into separate HTML partials loaded by `template-loader.js` (which already exists at 84 lines):
- `pg-dreamhome` (920 lines) → `partials/dreamhome.html`
- `pg-games` (301 lines) → `partials/games.html`
- `pg-fitness` (329 lines) → `partials/fitness.html`
- `pg-nutrition` (329 lines) → `partials/nutrition.html`
- `pg-settings` (357 lines) → `partials/settings.html`

This removes ~2,236 lines from index.html (35% reduction).

**Files:** `index.html`, `js/template-loader.js`, new `partials/` directory

### 3.2 Split Oversized JS Modules
**Problem:** `modules-social.js` (4,604 lines), `weather.js` (3,440 lines), `modules-track.js` (3,376 lines) are very large.

**Fix:** Lower priority — these work and splitting creates loading complexity. Defer unless actively causing merge conflicts or performance issues.

---

## Phase 4: UX Polish (Low Risk)

### 4.1 Add Empty State CTAs
**Problem:** Multiple pages show generic empty states with no actionable guidance.

**Fix:** Upgrade empty states on these pages with contextual CTAs:
- `pg-story`: "Add your first milestone →" button that opens the add form
- `pg-memories`: "Upload your first photo →" button that triggers file picker
- `pg-lists` (bucket): "Add your first bucket list item →" button
- `pg-checkin`: "Start your first weekly check-in →" button

**Files:** `index.html`, minimal JS for CTA click handlers

### 4.2 Unhide Useful Sections
**Problem:** Several sections are `d-none` by default and may never be discovered:
- `pg-memories`: "On This Day" section (line 5283)
- `pg-knowyou`: "Do You Know?" quiz (line 5057)
- `pg-lists`: Wishlist tab (line 5821)

**Fix:**
- "On This Day" — show when there's matching data, hide otherwise (logic-driven)
- "Do You Know?" quiz — add a visible "Quiz Me!" button at top of pg-knowyou
- Wishlist — default to showing whichever tab has more items

**Files:** `index.html`, JS logic in relevant modules

---

## Phase 5: Data Integrity (Higher Risk — Requires Care)

### 5.1 Audit Firebase Paths for Orphaned Data
**Problem:** With overlapping features, some DB paths may accumulate orphaned data.

**Fix:**
- Map all `db.ref()` calls to their read/write counterparts
- Identify paths written but never read (dead data)
- Identify paths read but potentially stale
- Clean up unused listeners

**Files:** All JS files with Firebase calls

---

## Execution Order

| Priority | Task | Risk | Effort | Impact |
|----------|------|------|--------|--------|
| 1 | 1.1 Remove duplicate meal planning | Low | Small | Medium |
| 2 | 1.2 Consolidate mood sound buttons | Low | Small | Medium |
| 3 | 1.3 Comment workout containers | None | Tiny | Low |
| 4 | 4.1 Empty state CTAs | Low | Small | Medium |
| 5 | 2.2 Clarify gratitude vs blessings | None | Tiny | Low |
| 6 | 2.1 Merge dreams & shared goals | Medium | Medium | High |
| 7 | 4.2 Unhide useful sections | Low | Small | Medium |
| 8 | 3.1 Extract HTML partials | Medium | Large | High |
| 9 | 5.1 Audit Firebase paths | Medium | Medium | Medium |
| 10 | 3.2 Split JS modules | Low | Large | Low (defer) |

# Consolidate & Flatten — Implementation Plan

## New Navigation Structure

**Bottom Nav (5 tabs):** Home | Together | Wellness | Plan | More

### Tab: HOME (pg-dash) — unchanged
- Dashboard with Us/Me toggle, daily snapshot

### Tab: TOGETHER (pg-together) — flattened, no sub-hub
Merges: connect, games, challenges, deeptalk+question, datenight, checkin, knowyou
- Remove hub hero/cards click-through — put features directly on the page
- Sections on the Together page itself:
  1. Daily Question (inline, was pg-question) + Deep Talk prompts (was pg-deeptalk) → merged "Talk" section
  2. Love Letters (was pg-connect) — keep as sub-page (has complex compose UI)
  3. Games + Challenges → merged "Play" section as sub-page (was pg-games + pg-challenges)
  4. Check-in (was pg-checkin) — keep as sub-page
  5. Date Night (was pg-datenight) — keep as sub-page
  6. Know Your Person (was pg-knowyou) — keep as sub-page

Removed from Together:
- pg-lovelang → move quiz to Settings/About Us
- pg-attachment → move quiz to Settings/About Us

### Tab: WELLNESS (was "Track", pg-track) — flattened
Merges: mood, fitness, nutrition, gratitude, grow, herspace, hisspace
- Remove hub hero/cards click-through
- Sections on Wellness page:
  1. Today's Mood (quick mood entry inline)
  2. Quick links row: Mood Journal, Fitness, Nutrition, Gratitude
- Sub-pages kept: mood, fitness (with w1/w2/w3), nutrition, gratitude

Removed from Wellness:
- pg-herspace / pg-hisspace → fold personal goals into mood/dashboard
- pg-grow → fold into gratitude or remove (guided lessons are underused)

### Tab: PLAN (was "Build", pg-build) — flattened
Merges: dreams+dreamhome+family, homelife, calendar, story, foundation+culture+spiritual, bucket+wishlist
- Remove hub hero/cards click-through
- Sections on Plan page:
  1. Quick links row: Calendar, Finances, Dreams, Lists
- Sub-pages:
  - pg-calendar — keep
  - pg-homelife (Finances) — keep
  - pg-dreams — absorb Dream Home + Family Planning content into this page
  - pg-lists (new) — merge Bucket List + Wishlists into one page
  - pg-story (Timeline) — keep
  - pg-values (new) — merge Foundation + Culture + Spiritual into one page

Removed as separate pages:
- pg-dreamhome → section within Dreams
- pg-family → section within Dreams
- pg-foundation → section within Values
- pg-culture → section within Values
- pg-spiritual → section within Values
- pg-bucket → merged into Lists
- pg-wishlist → merged into Lists

### Tab: MORE (was "Explore", pg-explore)
- Simple list/grid of: Memories, AI Chat, Achievements, Settings
- Remove the massive categorized directory
- Add Love Languages quiz + Attachment Style quiz to Settings

## Summary of Changes

### Pages KEPT as-is (sub-pages): 11
dash, connect, games (absorbs challenges), checkin, datenight, knowyou,
mood, fitness, nutrition, gratitude, calendar, homelife, story, memories, ai, settings

### Pages MERGED into others: 10
- deeptalk + question → inline on Together page ("Talk" section)
- challenges → absorbed into games page
- dreamhome + family → sections on dreams page
- foundation + culture + spiritual → new "values" page
- bucket + wishlist → new "lists" page

### Pages REMOVED: 4
- pg-explore (redundant directory → becomes simple "More" page)
- pg-herspace (fold goals into dashboard)
- pg-hisspace (fold goals into dashboard)
- pg-grow (underused guided lessons)

### Hub pages CONVERTED from click-through to direct content: 3
- pg-together: quick actions become inline sections
- pg-track → pg-wellness: quick links go direct to features
- pg-build → pg-plan: quick links go direct to features

### Net result: ~22 pages (from 40)

## Files to Modify

1. **js/nav.js** — Update TAB_MAP, TAB_ORDER, PAGE_META
2. **index.html** — Restructure hub pages, merge page content, update bottom nav
3. **js/dashboard.js** — Update any hub-specific initialization
4. **js/modules-core.js** — Update any page-specific init functions
5. **css/modules.css** — Add styles for new merged sections
6. **css/nav.css** — Update bottom nav labels/icons

## Implementation Order

1. Update nav.js (TAB_MAP, TAB_ORDER, PAGE_META)
2. Update bottom nav HTML (labels: Together, Wellness, Plan, More)
3. Restructure pg-together hub → flatten with inline sections + quick nav
4. Restructure pg-track → pg-wellness with inline quick links
5. Restructure pg-build → pg-plan with inline quick links
6. Convert pg-explore → simple "More" page
7. Merge deeptalk + question content into Together page
8. Merge challenges into games page
9. Merge dreamhome + family into dreams page
10. Create new pg-values (foundation + culture + spiritual)
11. Create new pg-lists (bucket + wishlist)
12. Remove herspace, hisspace, grow pages
13. Move lovelang + attachment to settings
14. Clean up unused CSS and JS references

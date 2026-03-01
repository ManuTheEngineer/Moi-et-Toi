# Moi et Toi - Setup Guide

## What You Have

```
moiettoi/
  index.html       - The entire app (single file)
  manifest.json    - PWA config
  sw.js            - Offline support
  icons/           - App icons
  README.md        - This file
```

## 3 Things To Configure

Open `index.html` and scroll to the bottom. Find the `<script>` section and edit:

### 1. Firebase (Free Real-Time Database)

**Create a Firebase project (5 minutes):**

1. Go to https://console.firebase.google.com
2. Click "Create a project" (name it anything, like "moiettoi")
3. Skip Google Analytics (not needed)
4. Once created, click the web icon `</>` to add a web app
5. Name it "Moi et Toi" and click Register
6. You'll see a config object. Copy those values into the `FIREBASE_CONFIG` section in index.html

**Enable the Realtime Database:**

1. In Firebase console, go to "Build" > "Realtime Database"
2. Click "Create Database"
3. Choose your region (us-central1 is fine)
4. Start in **test mode** (we'll add security later)
5. Done. Your databaseURL will look like: `https://moiettoi-xxxxx-default-rtdb.firebaseio.com`

### 2. Claude API Key

Replace `YOUR_ANTHROPIC_API_KEY` with your actual key.

**Important:** This key is visible in the source code. For a 2-person private app this is fine. If you ever make this public, we'd move the key to a backend.

### 3. Names

Change the names to whatever you two call each other:

```javascript
const NAMES = { her: "Babe", him: "King" };
```

## Deploy to GitHub Pages (Free)

1. Go to https://github.com and create an account (or log in)
2. Click "New repository"
3. Name it `moiettoi` (or whatever you want)
4. Make it **Private** (just you two)
5. Upload all the files from this folder
6. Go to Settings > Pages
7. Source: Deploy from a branch
8. Branch: main, folder: / (root)
9. Save
10. Wait 1-2 minutes. Your app will be at: `https://yourusername.github.io/moiettoi`

## Install on Phones

### iPhone (Safari only)
1. Open the link in Safari
2. Tap Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the link in Chrome
2. Tap 3 dots menu > "Install app" or "Add to Home Screen"
3. Tap "Install"

## How It Works

**Login:** Tap your name to enter. Simple toggle, no passwords.

**Dashboard:** See both your moods for today at a glance.

**Mood Check-ins:** Pick mood (1-5), set energy level, add a note. Both of you see each other's check-ins in real-time.

**Waist Where? Workouts:** All 3 levels (Foundation, Elevated, Full Body). Log button at the bottom of each workout tracks exercises, energy, and mood.

**AI Chat:** Talk to Claude directly in the app. Ask it to help with meal plans, advice, planning. It knows both your names and that you're a couple.

## Rolling Updates

This is the beauty of GitHub:

1. Edit files locally or directly on GitHub
2. Push/save changes
3. GitHub Pages auto-deploys in ~1 minute
4. Both phones get the update next time they open the app

## Coming Soon (When You're Ready)

Tell me when you want to add:
- Meal Planning (AI assisted)
- Notes / Letters to each other
- Shared Goals + Vision Board
- Shared Calendar / Date Planning
- Photo Memories
- Budget Tracker
- Whatever else you need

The architecture is built to grow. Each new feature is just a new page in the shell.

## Firebase Security (Do This After Testing)

Once everything works, go to Firebase > Realtime Database > Rules and replace with:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

This is open for testing. Later we can lock it down to authenticated users only.

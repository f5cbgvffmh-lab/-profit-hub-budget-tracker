# PROFIT HUB V5 — UPLOAD INSTRUCTIONS

## YOUR DATA IS SAFE
All your data lives in Firebase. This update only changes the code files.
After uploading, log in and everything will be exactly where you left it.

## HOW TO UPLOAD TO GITHUB

Since V5 has multiple files and folders, the easiest way is to replace everything at once.

### Step 1: Delete old files on GitHub
1. Go to your GitHub repo: github.com/f5cbgvffmh-lab/-profit-hub-budget-tracker
2. Click "src" folder
3. Delete each file inside (App.jsx, firebase.js, main.jsx):
   - Click the file → three dots (top right) → Delete file → Commit
4. Go back to root and delete: package.json, index.html, vite.config.js, .gitignore
   - Same process for each

### Step 2: Upload new files
1. Extract the profit-hub-v5.zip on your computer
2. Open the profit-hub-v5 folder
3. Go to your GitHub repo (should be mostly empty now)
4. Click "Add file" → "Upload files"
5. Drag ALL the files and folders from inside profit-hub-v5:
   - src/ (folder with all the files inside)
   - public/ (empty folder, skip if GitHub won't accept)
   - package.json
   - index.html
   - vite.config.js
   - .gitignore
6. Click "Commit changes"

### Step 3: Wait for Vercel
Vercel auto-deploys in ~30 seconds. Check vercel.com to see if build passes.

### If the build fails:
- Check the error in Vercel build logs
- Screenshot it and send to Claude

## WHAT'S NEW IN V5

### Structure (multi-file)
- src/firebase.js — Firebase config
- src/App.jsx — Main app orchestrator
- src/utils/constants.js — Colors, helpers, defaults
- src/components/UI.jsx — Shared components (charts, modals, buttons)
- src/components/Forms.jsx — All form components
- src/components/Auth.jsx — Login/signup screen
- src/components/Sidebar.jsx — Navigation sidebar
- src/components/Onboarding.jsx — How-to guide
- src/pages/Dashboard.jsx — Dashboard page
- src/pages/Pages.jsx — All other pages

### New Features
1. Mobile responsive — hamburger menu on phones, stacked layouts
2. Floating quick-add button — always visible "+" to add transactions fast
3. Search & filter on transactions page
4. Confirmation dialog before deleting anything
5. Spending insights — comparisons vs last month
6. How-to guide — appears on first login, accessible via "How to Use" in sidebar
7. All V4 features intact (auth, gamification, amortization, etc.)

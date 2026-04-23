# PROFIT HUB V6 — UPLOAD INSTRUCTIONS

## WHAT'S NEW IN V6

1. **Local Cache** — App loads instantly from localStorage, Firebase syncs in background. No more staring at a blank screen.
2. **Accounts: Balance History Sparkline** — Each account card shows a mini graph of the balance over time.
3. **Accounts: Transaction Feed** — Click any account card to see every transaction tied to that account.
4. **Accounts: Health Score** — Flags low balance, high credit utilization, low savings.
5. **Accounts: Credit Card Fields** — Credit limit, utilization %, shown with a thermometer bar.
6. **Accounts: Transfer Between Accounts** — Move money between accounts without messing up income/expense totals.
7. **Accounts: Totals Breakdown** — Bank total, investment total, credit owed shown at the top.
8. **Auto-Balance Sync** — Adding/editing/deleting a transaction automatically updates the tagged account's balance.
9. **Wipe All Data** — Double-confirmed reset button in the Customize/Theme page.
10. **Full Color Customization** — Every color in the app is changeable and saves to Firebase.
11. **Skeleton Loaders** — Placeholder cards show while data loads so it doesn't look blank.

---

## HOW TO UPLOAD TO GITHUB

### Step 1: Delete old files
1. Go to your GitHub repo: github.com/f5cbgvffmh-lab/-profit-hub-budget-tracker
2. Delete everything in the `src/` folder (App.jsx, firebase.js, main.jsx, and any subfolders)
3. Delete root files: package.json, index.html, vite.config.js, .gitignore

### Step 2: Upload new files
1. Extract profit-hub-v6.zip on your computer
2. Open the `profit-hub-v6` folder
3. Go to your GitHub repo → "Add file" → "Upload files"
4. Select ALL files inside the profit-hub-v6 folder (Ctrl+A)
5. Drag them into GitHub
6. Click "Commit changes"

### Step 3: Wait for Vercel
- Vercel auto-deploys in ~30 seconds
- Check vercel.com if it doesn't update
- Your data is 100% safe in Firebase — nothing changes on the database side

---

## FILE STRUCTURE

```
src/
  App.jsx              — main orchestrator, all state + Firebase
  firebase.js          — Firebase config
  main.jsx             — entry point
  utils/
    constants.js       — colors, theme, helpers, defaults
  components/
    Auth.jsx           — login/signup screen
    Sidebar.jsx        — navigation
    UI.jsx             — modals, charts, buttons, loaders
    Forms.jsx          — transaction form
    Onboarding.jsx     — how-to guide
  pages/
    Dashboard.jsx      — dashboard page
    Pages.jsx          — all other pages (Transactions, Budget, Savings, Debt, Investments, Net Worth, Accounts, Badges, Theme)
package.json
index.html
vite.config.js
.gitignore
```

---

## IF BUILD FAILS

- Check Vercel build logs for the error
- Screenshot it and send to Claude
- Your data will still be safe in Firebase

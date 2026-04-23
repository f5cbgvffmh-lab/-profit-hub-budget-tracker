import React, { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs } from "firebase/firestore";
import { db, auth } from "./firebase.js";
import {
  C, applyTheme, DEFAULT_THEME, genId, fmt,
  defaultAccounts, defaultGoals, defaultDebts, defaultInvestments, defaultBudget, seedTransactions
} from "./utils/constants.js";
import { Modal, QuickAddButton, SkeletonCard, Confetti } from "./components/UI.jsx";
import { AuthScreen } from "./components/Auth.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { OnboardingGuide } from "./components/Onboarding.jsx";
import { DashboardPage } from "./pages/Dashboard.jsx";
import {
  TransactionsPage, BudgetPage, SavingsPage, DebtPage,
  InvestmentsPage, NetWorthPage, AccountsPage, BadgesPage, ThemePage
} from "./pages/Pages.jsx";
import { TxnForm } from "./components/Forms.jsx";

// ── FIREBASE HELPERS ──
function userCol(uid, name) { return collection(db, "users", uid, name); }
function userDoc(uid, name, id) { return doc(db, "users", uid, name, id); }
async function fbSet(uid, col, id, data) {
  try { await setDoc(userDoc(uid, col, id), data); } catch(e) { console.error(e); }
}
async function fbDel(uid, col, id) {
  try { await deleteDoc(userDoc(uid, col, id)); } catch(e) { console.error(e); }
}

// ── LOCAL CACHE HELPERS ──
function cacheKey(uid, col) { return `ph6_${uid}_${col}`; }
function saveCache(uid, col, data) {
  try { localStorage.setItem(cacheKey(uid, col), JSON.stringify(data)); } catch(e) {}
}
function loadCache(uid, col) {
  try { const d = localStorage.getItem(cacheKey(uid, col)); return d ? JSON.parse(d) : null; } catch(e) { return null; }
}
function clearCache(uid) {
  const keys = ["txns","accounts","goals","debts","investments","nwHistory","budget","theme"];
  keys.forEach(k => { try { localStorage.removeItem(cacheKey(uid, k)); } catch(e) {} });
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Data state
  const [txns, setTxns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [nwHistory, setNwHistory] = useState([]);
  const [budget, setBudget] = useState(defaultBudget);
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // ── AUTH ──
  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
      if (!u) { setLoading(false); setTxns([]); setAccounts([]); setGoals([]); setDebts([]); setInvestments([]); setNwHistory([]); setBudget(defaultBudget); }
    });
  }, []);

  // ── LOAD FROM CACHE INSTANTLY THEN SUBSCRIBE ──
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    // Load from cache immediately for instant display
    const cachedTxns = loadCache(uid, "txns");
    const cachedAccts = loadCache(uid, "accounts");
    const cachedGoals = loadCache(uid, "goals");
    const cachedDebts = loadCache(uid, "debts");
    const cachedInv = loadCache(uid, "investments");
    const cachedNw = loadCache(uid, "nwHistory");
    const cachedBudget = loadCache(uid, "budget");
    const cachedTheme = loadCache(uid, "theme");

    if (cachedTxns) setTxns(cachedTxns);
    if (cachedAccts) setAccounts(cachedAccts);
    if (cachedGoals) setGoals(cachedGoals);
    if (cachedDebts) setDebts(cachedDebts);
    if (cachedInv) setInvestments(cachedInv);
    if (cachedNw) setNwHistory(cachedNw);
    if (cachedBudget) setBudget(cachedBudget);
    if (cachedTheme) { setTheme(cachedTheme); applyTheme(cachedTheme); }

    // Check if first login (no cache) → show guide and seed data
    const isFirstLogin = !cachedAccts;

    // Subscribe to Firestore and sync
    const subs = [];

    function sub(colName, setter) {
      const unsub = onSnapshot(userCol(uid, colName), snap => {
        const data = snap.docs.map(d => d.data());
        setter(data);
        saveCache(uid, colName, data);
        setLoading(false);
      });
      subs.push(unsub);
    }

    sub("txns", setTxns);
    sub("accounts", setAccounts);
    sub("goals", setGoals);
    sub("debts", setDebts);
    sub("investments", setInvestments);
    sub("nwHistory", setNwHistory);

    // Budget (single doc)
    const unsubBudget = onSnapshot(doc(db, "users", uid, "settings", "budget"), snap => {
      if (snap.exists()) {
        const b = snap.data();
        setBudget(b);
        saveCache(uid, "budget", b);
      }
    });
    subs.push(unsubBudget);

    // Theme (single doc)
    const unsubTheme = onSnapshot(doc(db, "users", uid, "settings", "theme"), snap => {
      if (snap.exists()) {
        const th = snap.data();
        setTheme(th);
        applyTheme(th);
        saveCache(uid, "theme", th);
      }
    });
    subs.push(unsubTheme);

    // Seed first-time data after a short delay
    if (isFirstLogin) {
      setTimeout(async () => {
        const existing = await getDocs(userCol(uid, "accounts"));
        if (existing.empty) {
          setShowGuide(true);
          const batch = writeBatch(db);
          defaultAccounts.forEach(a => batch.set(userDoc(uid,"accounts",a.id), a));
          defaultGoals.forEach(g => batch.set(userDoc(uid,"goals",g.id), g));
          defaultDebts.forEach(d => batch.set(userDoc(uid,"debts",d.id), d));
          defaultInvestments.forEach(i => batch.set(userDoc(uid,"investments",i.id), i));
          seedTransactions.forEach(t => batch.set(userDoc(uid,"txns",t.id), t));
          await batch.commit();
          await setDoc(doc(db,"users",uid,"settings","budget"), defaultBudget);
        }
      }, 500);
    }

    setLoading(false);
    return () => subs.forEach(u => u());
  }, [user]);

  // ── CRUD HELPERS ──
  const uid = user?.uid;

  // Transactions — auto-update account balance
  async function addTxn(t) {
    await fbSet(uid, "txns", t.id, t);
    // Update account balance
    const acct = accounts.find(a=>a.id===t.accountId);
    if (acct) {
      const delta = t.type==="income" ? parseFloat(t.amount)||0 : -(parseFloat(t.amount)||0);
      const updated = { ...acct, balance: (parseFloat(acct.balance)||0) + delta };
      await fbSet(uid, "accounts", acct.id, updated);
    }
  }

  async function editTxn(t) {
    const old = txns.find(x=>x.id===t.id);
    // Reverse old effect on account
    if (old && old.accountId) {
      const acct = accounts.find(a=>a.id===old.accountId);
      if (acct) {
        const reverseDelta = old.type==="income" ? -(parseFloat(old.amount)||0) : (parseFloat(old.amount)||0);
        const newDelta = t.type==="income" ? parseFloat(t.amount)||0 : -(parseFloat(t.amount)||0);
        const updated = { ...acct, balance: (parseFloat(acct.balance)||0) + reverseDelta + newDelta };
        await fbSet(uid, "accounts", acct.id, updated);
      }
    }
    await fbSet(uid, "txns", t.id, t);
  }

  async function delTxn(id) {
    const t = txns.find(x=>x.id===id);
    if (t && t.accountId) {
      const acct = accounts.find(a=>a.id===t.accountId);
      if (acct) {
        const reverseDelta = t.type==="income" ? -(parseFloat(t.amount)||0) : (parseFloat(t.amount)||0);
        const updated = { ...acct, balance: (parseFloat(acct.balance)||0) + reverseDelta };
        await fbSet(uid, "accounts", acct.id, updated);
      }
    }
    await fbDel(uid, "txns", id);
  }

  // Account transfer
  async function doTransfer({ fromId, toId, amount }) {
    const amt = parseFloat(amount)||0;
    const from = accounts.find(a=>a.id===fromId);
    const to = accounts.find(a=>a.id===toId);
    if (!from || !to || amt<=0) return;
    await fbSet(uid, "accounts", fromId, { ...from, balance: (parseFloat(from.balance)||0)-amt });
    await fbSet(uid, "accounts", toId, { ...to, balance: (parseFloat(to.balance)||0)+amt });
  }

  // Generic CRUD
  const crud = (col) => ({
    add: (item) => fbSet(uid, col, item.id, item),
    edit: (item) => fbSet(uid, col, item.id, item),
    del: (id) => fbDel(uid, col, id),
  });

  async function goalDeposit(goalId, amount) {
    const g = goals.find(x=>x.id===goalId);
    if (!g) return;
    await fbSet(uid, "goals", goalId, { ...g, saved: (parseFloat(g.saved)||0)+amount });
  }

  async function nwSnapshot(value) {
    const snap = { id:genId(), value, date:new Date().toISOString().split("T")[0] };
    await fbSet(uid, "nwHistory", snap.id, snap);
  }

  async function saveBudget(b) {
    await setDoc(doc(db,"users",uid,"settings","budget"), b);
    setBudget(b);
    saveCache(uid, "budget", b);
  }

  async function saveTheme(th) {
    await setDoc(doc(db,"users",uid,"settings","theme"), th);
    setTheme(th);
    applyTheme(th);
    saveCache(uid, "theme", th);
  }

  async function resetTheme() {
    await setDoc(doc(db,"users",uid,"settings","theme"), DEFAULT_THEME);
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    saveCache(uid, "theme", DEFAULT_THEME);
  }

  // ── WIPE ALL DATA ──
  async function wipeAllData() {
    const cols = ["txns","accounts","goals","debts","investments","nwHistory"];
    for (const col of cols) {
      const snap = await getDocs(userCol(uid, col));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    await setDoc(doc(db,"users",uid,"settings","budget"), defaultBudget);
    clearCache(uid);
    setTxns([]); setAccounts([]); setGoals([]); setDebts([]); setInvestments([]); setNwHistory([]);
    setBudget(defaultBudget);
  }

  if (authLoading) {
    return <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:C.textMid, fontSize:14 }}>Loading...</div>
    </div>;
  }

  if (!user) return <AuthScreen />;

  function renderPage() {
    if (loading && !txns.length && !accounts.length) {
      return <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
        {[1,2,3,4].map(i=><SkeletonCard key={i}/>)}
      </div>;
    }
    switch(page) {
      case "dashboard": return <DashboardPage txns={txns} accounts={accounts} investments={investments} debts={debts} goals={goals} period={period} setPeriod={setPeriod} loading={loading} />;
      case "transactions": return <TransactionsPage txns={txns} accounts={accounts} onAdd={addTxn} onEdit={editTxn} onDelete={delTxn} />;
      case "budget": return <BudgetPage budget={budget} txns={txns} onSaveBudget={saveBudget} />;
      case "savings": return <SavingsPage goals={goals} onAdd={crud("goals").add} onEdit={crud("goals").edit} onDelete={crud("goals").del} onDeposit={goalDeposit} />;
      case "debt": return <DebtPage debts={debts} onAdd={crud("debts").add} onEdit={crud("debts").edit} onDelete={crud("debts").del} />;
      case "investments": return <InvestmentsPage investments={investments} onAdd={crud("investments").add} onEdit={crud("investments").edit} onDelete={crud("investments").del} />;
      case "networth": return <NetWorthPage accounts={accounts} investments={investments} debts={debts} nwHistory={nwHistory} onSnapshot={nwSnapshot} />;
      case "accounts": return <AccountsPage accounts={accounts} txns={txns} onAdd={crud("accounts").add} onEdit={crud("accounts").edit} onDelete={crud("accounts").del} onTransfer={doTransfer} />;
      case "badges": return <BadgesPage txns={txns} goals={goals} debts={debts} investments={investments} accounts={accounts} />;
      case "theme": return <ThemePage theme={theme} onSave={saveTheme} onReset={resetTheme} onWipeData={wipeAllData} />;
      case "onboarding": return null;
      default: return null;
    }
  }

  if (page === "onboarding") {
    return <OnboardingGuide onClose={()=>setPage("dashboard")} />;
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'IBM Plex Sans',sans-serif" }}>
      <Sidebar page={page} setPage={setPage} user={user} />

      {/* Main content */}
      <div style={{ marginLeft:0, padding:"24px 20px 80px" }} className="main-content">
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          {renderPage()}
        </div>
      </div>

      {/* Quick add */}
      <QuickAddButton onClick={()=>setShowQuickAdd(true)} />

      {/* Quick add modal */}
      {showQuickAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, width:"100%", maxWidth:440 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:700, color:C.text }}>Quick Add Transaction</div>
              <button onClick={()=>setShowQuickAdd(false)} style={{ background:"transparent", border:"none", color:C.textMid, cursor:"pointer", fontSize:20 }}>✕</button>
            </div>
            <div style={{ padding:20 }}>
              <TxnForm accounts={accounts} onSave={t=>{ addTxn(t); setShowQuickAdd(false); }} onClose={()=>setShowQuickAdd(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Onboarding guide */}
      {showGuide && <OnboardingGuide onClose={()=>setShowGuide(false)} />}

      <style>{`
        @media (min-width: 768px) { .main-content { margin-left: 220px !important; } }
        @media (max-width: 767px) { .main-content { padding-top: 60px !important; } }
      `}</style>
    </div>
  );
}

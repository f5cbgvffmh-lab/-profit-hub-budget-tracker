import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, getDocs } from "firebase/firestore";
import { db, auth } from "./firebase.js";
import { C, applyTheme, DEFAULT_THEME, genId, defaultBudget } from "./utils/constants.js";
import { Modal, QuickAddButton, SkeletonCard } from "./components/UI.jsx";
import { AuthScreen } from "./components/Auth.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { OnboardingGuide } from "./components/Onboarding.jsx";
import { DashboardPage } from "./pages/Dashboard.jsx";
import { TransactionsPage, BudgetPage, SavingsPage, DebtPage, InvestmentsPage, NetWorthPage, AccountsPage, BadgesPage, ThemePage } from "./pages/Pages.jsx";
import { TxnForm } from "./components/Forms.jsx";

function userCol(uid, name) { return collection(db, "users", uid, name); }
function userDoc(uid, name, id) { return doc(db, "users", uid, name, id); }
async function fbSet(uid, col, id, data) { try { await setDoc(userDoc(uid,col,id), data); } catch(e) { console.error(e); } }
async function fbDel(uid, col, id) { try { await deleteDoc(userDoc(uid,col,id)); } catch(e) { console.error(e); } }

function cacheKey(uid, col) { return `ph6_${uid}_${col}`; }
function saveCache(uid, col, data) { try { localStorage.setItem(cacheKey(uid,col), JSON.stringify(data)); } catch(e) {} }
function loadCache(uid, col) { try { const d=localStorage.getItem(cacheKey(uid,col)); return d?JSON.parse(d):null; } catch(e) { return null; } }
function clearCache(uid) { ["txns","accounts","goals","debts","investments","nwHistory","budget","theme"].forEach(k=>{ try { localStorage.removeItem(cacheKey(uid,k)); } catch(e) {} }); }

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const [txns, setTxns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [nwHistory, setNwHistory] = useState([]);
  const [budget, setBudget] = useState(defaultBudget);
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthLoading(false);
      if (!u) { setLoading(false); setTxns([]); setAccounts([]); setGoals([]); setDebts([]); setInvestments([]); setNwHistory([]); setBudget(defaultBudget); }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const uid = user.uid;

    const cachedTxns=loadCache(uid,"txns"); const cachedAccts=loadCache(uid,"accounts");
    const cachedGoals=loadCache(uid,"goals"); const cachedDebts=loadCache(uid,"debts");
    const cachedInv=loadCache(uid,"investments"); const cachedNw=loadCache(uid,"nwHistory");
    const cachedBudget=loadCache(uid,"budget"); const cachedTheme=loadCache(uid,"theme");

    if (cachedTxns) setTxns(cachedTxns);
    if (cachedAccts) setAccounts(cachedAccts);
    if (cachedGoals) setGoals(cachedGoals);
    if (cachedDebts) setDebts(cachedDebts);
    if (cachedInv) setInvestments(cachedInv);
    if (cachedNw) setNwHistory(cachedNw);
    if (cachedBudget) setBudget(cachedBudget);
    if (cachedTheme) { setTheme(cachedTheme); applyTheme(cachedTheme); }

    // SEED DISABLED — never overwrites real data
    const isFirstLogin = false;

    const subs = [];
    function sub(colName, setter) {
      const unsub = onSnapshot(userCol(uid,colName), snap => {
        const data = snap.docs.map(d=>d.data());
        setter(data); saveCache(uid,colName,data); setLoading(false);
      });
      subs.push(unsub);
    }

    sub("txns",setTxns); sub("accounts",setAccounts); sub("goals",setGoals);
    sub("debts",setDebts); sub("investments",setInvestments); sub("nwHistory",setNwHistory);

    subs.push(onSnapshot(doc(db,"users",uid,"settings","budget"), snap => {
      if (snap.exists()) { const b=snap.data(); setBudget(b); saveCache(uid,"budget",b); }
    }));
    subs.push(onSnapshot(doc(db,"users",uid,"settings","theme"), snap => {
      if (snap.exists()) { const th=snap.data(); setTheme(th); applyTheme(th); saveCache(uid,"theme",th); }
    }));

    setLoading(false);
    return () => subs.forEach(u=>u());
  }, [user]);

  const uid = user?.uid;

  // ── TRANSFER HANDLER ──
  // Transfers move money between accounts but don't count as income or expense
  async function addTxn(t) {
    await fbSet(uid, "txns", t.id, t);

    if (t.type === "transfer") {
      // Deduct from source, add to destination
      const from = accounts.find(a=>a.id===t.accountId);
      const to = accounts.find(a=>a.id===t.toAccountId);
      if (from) await fbSet(uid,"accounts",from.id,{...from, balance:(parseFloat(from.balance)||0)-(parseFloat(t.amount)||0)});
      if (to) await fbSet(uid,"accounts",to.id,{...to, balance:(parseFloat(to.balance)||0)+(parseFloat(t.amount)||0)});
    } else {
      const acct = accounts.find(a=>a.id===t.accountId);
      if (acct) {
        const delta = t.type==="income" ? parseFloat(t.amount)||0 : -(parseFloat(t.amount)||0);
        await fbSet(uid,"accounts",acct.id,{...acct, balance:(parseFloat(acct.balance)||0)+delta});
      }
    }
  }

  async function editTxn(t) {
    const old = txns.find(x=>x.id===t.id);
    // Reverse old effect
    if (old) {
      if (old.type==="transfer") {
        const from = accounts.find(a=>a.id===old.accountId);
        const to = accounts.find(a=>a.id===old.toAccountId);
        if (from) await fbSet(uid,"accounts",from.id,{...from, balance:(parseFloat(from.balance)||0)+(parseFloat(old.amount)||0)});
        if (to) await fbSet(uid,"accounts",to.id,{...to, balance:(parseFloat(to.balance)||0)-(parseFloat(old.amount)||0)});
      } else {
        const acct = accounts.find(a=>a.id===old.accountId);
        if (acct) {
          const rev = old.type==="income" ? -(parseFloat(old.amount)||0) : (parseFloat(old.amount)||0);
          await fbSet(uid,"accounts",acct.id,{...acct, balance:(parseFloat(acct.balance)||0)+rev});
        }
      }
    }
    // Apply new effect
    await fbSet(uid,"txns",t.id,t);
    if (t.type==="transfer") {
      const from = accounts.find(a=>a.id===t.accountId);
      const to = accounts.find(a=>a.id===t.toAccountId);
      if (from) await fbSet(uid,"accounts",from.id,{...from, balance:(parseFloat(from.balance)||0)-(parseFloat(t.amount)||0)});
      if (to) await fbSet(uid,"accounts",to.id,{...to, balance:(parseFloat(to.balance)||0)+(parseFloat(t.amount)||0)});
    } else {
      const acct = accounts.find(a=>a.id===t.accountId);
      if (acct) {
        const nd = t.type==="income" ? parseFloat(t.amount)||0 : -(parseFloat(t.amount)||0);
        await fbSet(uid,"accounts",acct.id,{...acct, balance:(parseFloat(acct.balance)||0)+nd});
      }
    }
  }

  async function delTxn(id) {
    const t = txns.find(x=>x.id===id);
    if (t) {
      if (t.type==="transfer") {
        const from = accounts.find(a=>a.id===t.accountId);
        const to = accounts.find(a=>a.id===t.toAccountId);
        if (from) await fbSet(uid,"accounts",from.id,{...from, balance:(parseFloat(from.balance)||0)+(parseFloat(t.amount)||0)});
        if (to) await fbSet(uid,"accounts",to.id,{...to, balance:(parseFloat(to.balance)||0)-(parseFloat(t.amount)||0)});
      } else {
        const acct = accounts.find(a=>a.id===t.accountId);
        if (acct) {
          const rev = t.type==="income" ? -(parseFloat(t.amount)||0) : (parseFloat(t.amount)||0);
          await fbSet(uid,"accounts",acct.id,{...acct, balance:(parseFloat(acct.balance)||0)+rev});
        }
      }
    }
    await fbDel(uid,"txns",id);
  }

  async function doTransfer({ fromId, toId, amount }) {
    const amt = parseFloat(amount)||0;
    const from = accounts.find(a=>a.id===fromId);
    const to = accounts.find(a=>a.id===toId);
    if (!from||!to||amt<=0) return;
    const txn = { id:genId(), type:"transfer", amount:amt, description:"Account Transfer", category:"Transfer", date:new Date().toISOString().split("T")[0], accountId:fromId, toAccountId:toId };
    await fbSet(uid,"txns",txn.id,txn);
    await fbSet(uid,"accounts",fromId,{...from, balance:(parseFloat(from.balance)||0)-amt});
    await fbSet(uid,"accounts",toId,{...to, balance:(parseFloat(to.balance)||0)+amt});
  }

  const crud = (col) => ({
    add:(item)=>fbSet(uid,col,item.id,item),
    edit:(item)=>fbSet(uid,col,item.id,item),
    del:(id)=>fbDel(uid,col,id),
  });

  async function goalDeposit(goalId, amount) {
    const g = goals.find(x=>x.id===goalId);
    if (!g) return;
    await fbSet(uid,"goals",goalId,{...g, saved:(parseFloat(g.saved)||0)+amount});
  }

  async function nwSnapshot(value) {
    const snap = { id:genId(), value, date:new Date().toISOString().split("T")[0] };
    await fbSet(uid,"nwHistory",snap.id,snap);
  }

  async function saveBudget(b) { await setDoc(doc(db,"users",uid,"settings","budget"),b); setBudget(b); saveCache(uid,"budget",b); }
  async function saveTheme(th) { await setDoc(doc(db,"users",uid,"settings","theme"),th); setTheme(th); applyTheme(th); saveCache(uid,"theme",th); }
  async function resetTheme() { await setDoc(doc(db,"users",uid,"settings","theme"),DEFAULT_THEME); setTheme(DEFAULT_THEME); applyTheme(DEFAULT_THEME); saveCache(uid,"theme",DEFAULT_THEME); }

  async function wipeAllData() {
    for (const col of ["txns","accounts","goals","debts","investments","nwHistory"]) {
      const snap = await getDocs(userCol(uid,col));
      const batch = writeBatch(db);
      snap.docs.forEach(d=>batch.delete(d.ref));
      await batch.commit();
    }
    await setDoc(doc(db,"users",uid,"settings","budget"),defaultBudget);
    clearCache(uid);
    setTxns([]); setAccounts([]); setGoals([]); setDebts([]); setInvestments([]); setNwHistory([]);
    setBudget(defaultBudget);
  }

  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:C.textMid, fontSize:14 }}>Loading...</div>
    </div>
  );

  if (!user) return <AuthScreen />;
  if (page==="onboarding") return <OnboardingGuide onClose={()=>setPage("dashboard")} />;

  function renderPage() {
    if (loading && !txns.length && !accounts.length) {
      return <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:16 }}>
        {[1,2,3,4].map(i=><SkeletonCard key={i}/>)}
      </div>;
    }
    switch(page) {
      case "dashboard": return <DashboardPage txns={txns} accounts={accounts} investments={investments} debts={debts} goals={goals} loading={loading} />;
      case "transactions": return <TransactionsPage txns={txns} accounts={accounts} onAdd={addTxn} onEdit={editTxn} onDelete={delTxn} />;
      case "budget": return <BudgetPage budget={budget} txns={txns} onSaveBudget={saveBudget} />;
      case "savings": return <SavingsPage goals={goals} onAdd={crud("goals").add} onEdit={crud("goals").edit} onDelete={crud("goals").del} onDeposit={goalDeposit} />;
      case "debt": return <DebtPage debts={debts} onAdd={crud("debts").add} onEdit={crud("debts").edit} onDelete={crud("debts").del} />;
      case "investments": return <InvestmentsPage investments={investments} onAdd={crud("investments").add} onEdit={crud("investments").edit} onDelete={crud("investments").del} />;
      case "networth": return <NetWorthPage accounts={accounts} investments={investments} debts={debts} nwHistory={nwHistory} onSnapshot={nwSnapshot} />;
      case "accounts": return <AccountsPage accounts={accounts} txns={txns} onAdd={crud("accounts").add} onEdit={crud("accounts").edit} onDelete={crud("accounts").del} onTransfer={doTransfer} />;
      case "badges": return <BadgesPage txns={txns} goals={goals} debts={debts} investments={investments} accounts={accounts} />;
      case "theme": return <ThemePage theme={theme} onSave={saveTheme} onReset={resetTheme} onWipeData={wipeAllData} />;
      default: return null;
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'IBM Plex Sans',sans-serif" }}>
      <Sidebar page={page} setPage={setPage} user={user} />
      <div style={{ marginLeft:0, padding:"24px 20px 80px" }} className="main-content">
        <div style={{ maxWidth:900, margin:"0 auto" }}>{renderPage()}</div>
      </div>

      <QuickAddButton onClick={()=>setShowQuickAdd(true)} />

      {showQuickAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, width:"100%", maxWidth:440 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:700, color:C.text }}>Quick Add</div>
              <button onClick={()=>setShowQuickAdd(false)} style={{ background:"transparent", border:"none", color:C.textMid, cursor:"pointer", fontSize:20 }}>✕</button>
            </div>
            <div style={{ padding:20 }}>
              <TxnForm accounts={accounts} onSave={t=>{ addTxn(t); setShowQuickAdd(false); }} onClose={()=>setShowQuickAdd(false)} />
            </div>
          </div>
        </div>
      )}

      {showGuide && <OnboardingGuide onClose={()=>setShowGuide(false)} />}

      <style>{`
        @media (min-width: 768px) { .main-content { margin-left: 220px !important; } }
        @media (max-width: 767px) { .main-content { padding-top: 60px !important; } }
      `}</style>
    </div>
  );
}

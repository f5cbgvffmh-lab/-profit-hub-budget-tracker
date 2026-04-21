import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db, auth } from "./firebase.js";
import { C, MONTHS, BADGES, genId, fmt, filterTxns, getMonthlyData, getCatBreakdown, getSavingsStreak, getSpendingInsights, getWeek, defaultAccounts, defaultGoals, defaultDebts, defaultInvestments, defaultBudget, seedTransactions } from "./utils/constants.js";
import { Confetti, SpendingPulse, QuickAddButton, Modal } from "./components/UI.jsx";
import { TxnForm } from "./components/Forms.jsx";
import { AuthScreen } from "./components/Auth.jsx";
import { Sidebar, NAV_ITEMS } from "./components/Sidebar.jsx";
import { OnboardingGuide } from "./components/Onboarding.jsx";
import { DashboardPage } from "./pages/Dashboard.jsx";
import { TransactionsPage, BudgetPage, SavingsPage, DebtPage, InvestmentsPage, NetWorthPage, AccountsPage, BadgesPage } from "./pages/Pages.jsx";

function userCol(uid, name) { return collection(db, "users", uid, name); }
function userDoc(uid, name, id) { return doc(db, "users", uid, name, id); }
async function fbSet(uid, c, id, data) { try { await setDoc(userDoc(uid, c, id), data); } catch (e) { console.error(e); } }
async function fbDel(uid, c, id) { try { await deleteDoc(userDoc(uid, c, id)); } catch (e) { console.error(e); } }
async function fbSeed(uid, c, items) { const b = writeBatch(db); items.forEach(i => { b.set(userDoc(uid, c, i.id), i); }); await b.commit(); }

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
    return () => unsub();
  }, []);

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", animation: "pulse 1.5s infinite" }}>P</div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );

  if (!user) return <AuthScreen />;
  return <AppMain user={user} />;
}

function AppMain({ user }) {
  const uid = user.uid;
  const [page, setPage] = useState("dashboard");
  const [view, setView] = useState("monthly");
  const [year] = useState(2026);
  const [month, setMonth] = useState(new Date().getMonth());
  const [week, setWeek] = useState(1);
  const [isMobile] = useState(window.innerWidth < 768);

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [budget, setBudget] = useState(defaultBudget);
  const [debtStrategy, setDebtStrategy] = useState("snowball");
  const [extraPay, setExtraPay] = useState(200);
  const [nwHistory, setNwHistory] = useState([]);

  const [loaded, setLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [showConfetti, setShowConfetti] = useState(false);
  const [nwMilestone, setNwMilestone] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const seeded = useRef(false);
  const prevNW = useRef(0);
  const isFirstLoad = useRef(true);

  // Firebase listeners
  useEffect(() => {
    const unsubs = [];
    unsubs.push(onSnapshot(userCol(uid, "transactions"), s => {
      if (s.empty && !seeded.current) { seeded.current = true; fbSeed(uid, "transactions", seedTransactions()); return; }
      setTransactions(s.docs.map(d => d.data()).sort((a, b) => a.date.localeCompare(b.date)));
    }));
    unsubs.push(onSnapshot(userCol(uid, "accounts"), s => { if (s.empty && !seeded.current) { fbSeed(uid, "accounts", defaultAccounts); return; } setAccounts(s.docs.map(d => d.data())); }));
    unsubs.push(onSnapshot(userCol(uid, "goals"), s => { if (s.empty && !seeded.current) { fbSeed(uid, "goals", defaultGoals); return; } setGoals(s.docs.map(d => d.data())); }));
    unsubs.push(onSnapshot(userCol(uid, "debts"), s => { if (s.empty && !seeded.current) { fbSeed(uid, "debts", defaultDebts); return; } setDebts(s.docs.map(d => d.data())); }));
    unsubs.push(onSnapshot(userCol(uid, "investments"), s => { if (s.empty && !seeded.current) { fbSeed(uid, "investments", defaultInvestments); return; } setInvestments(s.docs.map(d => d.data())); }));
    unsubs.push(onSnapshot(doc(db, "users", uid, "settings", "budget"), s => { if (!s.exists()) { setDoc(doc(db, "users", uid, "settings", "budget"), defaultBudget); return; } setBudget(s.data()); }));
    unsubs.push(onSnapshot(doc(db, "users", uid, "settings", "preferences"), s => {
      if (!s.exists()) { setDoc(doc(db, "users", uid, "settings", "preferences"), { extraPay: 200, debtStrategy: "snowball", hasSeenGuide: false }); return; }
      const d = s.data();
      setExtraPay(d.extraPay ?? 200);
      setDebtStrategy(d.debtStrategy ?? "snowball");
      if (isFirstLoad.current && !d.hasSeenGuide) { setShowGuide(true); isFirstLoad.current = false; }
      else { isFirstLoad.current = false; }
    }));
    unsubs.push(onSnapshot(doc(db, "users", uid, "settings", "nwHistory"), s => { if (!s.exists()) { setDoc(doc(db, "users", uid, "settings", "nwHistory"), { months: [] }); return; } setNwHistory(s.data().months || []); }));
    setTimeout(() => setLoaded(true), 800);
    return () => unsubs.forEach(u => u());
  }, [uid]);

  // Computed
  const filtered = filterTxns(transactions, view, year, month, week);
  const income = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings = income - expenses;

  const allIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const allExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const txnNet = allIncome - allExpenses;

  const { monthlyInc, monthlyExp, monthlySavings } = getMonthlyData(transactions, year);
  const catEntries = getCatBreakdown(filtered);

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalInvested = investments.reduce((s, i) => s + i.value, 0);
  const totalGain = investments.reduce((s, i) => s + (i.value - i.cost), 0);
  const acctBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const netWorth = acctBalance + txnNet + totalInvested - totalDebt;
  const totalAssets = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0) + totalInvested + Math.max(txnNet, 0);
  const totalLiab = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0) + totalDebt + Math.abs(Math.min(txnNet, 0));

  const monthlyNW = monthlyInc.map((v, i) => { const cum = monthlySavings.slice(0, i + 1).reduce((s, x) => s + x, 0); return acctBalance + cum + totalInvested - totalDebt; });

  const budgetIncome = (budget.income || []).reduce((s, v) => s + v, 0);
  const budgetTotal = (budget.allocations || []).reduce((s, a) => s + a.amount, 0);
  const sortedDebts = debtStrategy === "snowball" ? [...debts].sort((a, b) => a.balance - b.balance) : [...debts].sort((a, b) => b.rate - a.rate);

  const streak = getSavingsStreak(transactions, year);
  const insights = getSpendingInsights(monthlyInc, monthlyExp, month);
  const todaySpend = transactions.filter(t => { const d = new Date(t.date); const now = new Date(); return d.toDateString() === now.toDateString() && t.type === "expense"; }).reduce((s, t) => s + t.amount, 0);
  const avgDailySpend = allExpenses / Math.max(new Date().getDate(), 1);
  const pulseRate = avgDailySpend > 0 ? Math.min(todaySpend / avgDailySpend, 1) : 0;
  const challenge = catEntries[0] ? { cat: catEntries[0][0], current: catEntries[0][1], target: Math.round(catEntries[0][1] * 0.85), message: `Keep ${catEntries[0][0]} under ${fmt(Math.round(catEntries[0][1] * 0.85))} this month` } : null;
  const earnedBadges = BADGES.filter(b => b.check(transactions, goals, debts, netWorth));

  // NW milestones
  useEffect(() => {
    const milestones = [100000, 50000, 25000, 10000];
    for (const m of milestones) { if (netWorth >= m && prevNW.current < m) { setNwMilestone(m); setShowConfetti(true); setTimeout(() => { setShowConfetti(false); setNwMilestone(null); }, 4000); break; } }
    prevNW.current = netWorth;
  }, [netWorth]);

  // CRUD
  const saveTxn = d => { const item = d.id ? d : { ...d, id: genId() }; fbSet(uid, "transactions", item.id, item); };
  const deleteTxn = id => fbDel(uid, "transactions", id);
  const saveGoal = d => { const item = d.id ? d : { ...d, id: genId() }; fbSet(uid, "goals", item.id, item); };
  const deleteGoal = id => fbDel(uid, "goals", id);
  const depositToGoal = (id, amt) => { const g = goals.find(x => x.id === id); if (g) fbSet(uid, "goals", id, { ...g, saved: g.saved + amt }); };
  const saveDebt = d => { const item = d.id ? d : { ...d, id: genId() }; fbSet(uid, "debts", item.id, item); };
  const deleteDebt = id => fbDel(uid, "debts", id);
  const saveInv = d => { const item = d.id ? d : { ...d, id: genId() }; fbSet(uid, "investments", item.id, item); };
  const deleteInv = id => fbDel(uid, "investments", id);
  const saveAcct = d => { const item = d.id ? d : { ...d, id: genId() }; fbSet(uid, "accounts", item.id, item); };
  const deleteAcct = id => fbDel(uid, "accounts", id);
  const updateBudget = b => { setBudget(b); setDoc(doc(db, "users", uid, "settings", "budget"), b); };
  const updatePrefs = p => setDoc(doc(db, "users", uid, "settings", "preferences"), { ...p, hasSeenGuide: true });
  const saveNwSnapshot = () => { const e = { month: MONTHS[month], year, netWorth, assets: totalAssets, liabilities: totalLiab, date: new Date().toISOString() }; const u = [...nwHistory.filter(h => !(h.month === MONTHS[month] && h.year === year)), e]; setDoc(doc(db, "users", uid, "settings", "nwHistory"), { months: u }); };
  const triggerConfetti = () => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000); };

  const dashViews = ["daily", "weekly", "biweekly", "monthly", "semi-annual", "yearly"];
  const budgetViews = ["monthly", "weekly", "daily"];
  const curViews = page === "budget" ? budgetViews : dashViews;

  const getDashPeriods = () => {
    if (view === "daily") return Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => ({ l: `${i + 1}`, v: i + 1 }));
    if (view === "weekly") return Array.from({ length: 52 }, (_, i) => ({ l: `W${i + 1}`, v: i + 1 }));
    if (view === "biweekly") return Array.from({ length: 26 }, (_, i) => ({ l: `BW${i + 1}`, v: i + 1 }));
    if (view === "monthly") return MONTHS.map((m, i) => ({ l: m, v: i }));
    if (view === "semi-annual") return [{ l: "H1", v: 0 }, { l: "H2", v: 6 }];
    return [{ l: "2026", v: 0 }];
  };

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", animation: "pulse 1.5s infinite" }}>P</div>
      <div style={{ color: C.textMid, fontSize: 13, fontFamily: "'IBM Plex Sans',system-ui,sans-serif" }}>Syncing your data...</div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );

  const mainMargin = isMobile ? 0 : (sidebarOpen ? 210 : 56);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'IBM Plex Sans','DM Sans',system-ui,sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');@keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}@keyframes pulse2{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:0.6}}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}`}</style>

      <Confetti show={showConfetti} />
      {nwMilestone && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 150, background: `linear-gradient(135deg, ${C.amber}, ${C.green})`, color: "#000", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700, animation: "modalIn 0.3s ease" }}>🎉 Net Worth Milestone: {fmt(nwMilestone)}!</div>}
      {showGuide && <OnboardingGuide onClose={() => { setShowGuide(false); updatePrefs({ extraPay, debtStrategy, hasSeenGuide: true }); }} />}

      <Sidebar page={page} setPage={p => { setPage(p); if (p === "budget") setView("monthly"); }} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} netWorth={netWorth} onShowGuide={() => setShowGuide(true)} isMobile={isMobile} />

      <div style={{ marginLeft: mainMargin, padding: isMobile ? "60px 16px 80px" : "20px 24px 40px", transition: "margin-left 0.25s ease" }}>
        {/* Timeline */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, margin: 0 }}>{NAV_ITEMS.find(n => n.id === page)?.label}</h1>
              {page === "dashboard" && <SpendingPulse rate={pulseRate} />}
              {page === "dashboard" && streak > 0 && <div style={{ fontSize: 10, color: C.amber, fontWeight: 600 }}>🔥 {streak}w streak</div>}
            </div>
          </div>
          {(page === "dashboard" || page === "transactions" || page === "budget") && <>
            <div style={{ display: "flex", gap: 2, background: C.surface, borderRadius: 10, padding: 3, border: `1px solid ${C.border}`, marginBottom: 10 }}>
              {curViews.map(v => <button key={v} onClick={() => { setView(v); setWeek(1); }} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", cursor: "pointer", background: view === v ? C.accent : "transparent", color: view === v ? "#fff" : C.textMid, fontSize: 10.5, fontWeight: view === v ? 600 : 400, transition: "all 0.15s", fontFamily: "inherit", textTransform: "capitalize" }}>{v === "semi-annual" ? "6-Mo" : v}</button>)}
            </div>
            {view !== "yearly" && <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>{getDashPeriods().map(o => { const active = (view === "monthly" || view === "semi-annual" ? month : week) === o.v; return <button key={o.v} onClick={() => { if (view === "monthly" || view === "semi-annual") setMonth(o.v); else setWeek(o.v); }} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${active ? C.accent : C.border}`, background: active ? C.accentDim : "transparent", color: active ? C.accent : C.textDim, fontSize: 10.5, fontWeight: active ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.12s" }}>{o.l}</button>; })}</div>}
          </>}
        </div>

        {/* Pages */}
        {page === "dashboard" && <DashboardPage filtered={filtered} income={income} expenses={expenses} savings={savings} monthlyInc={monthlyInc} monthlyExp={monthlyExp} monthlySavings={monthlySavings} monthlyNW={monthlyNW} totalInvested={totalInvested} netWorth={netWorth} catEntries={catEntries} streak={streak} pulseRate={pulseRate} challenge={challenge} insights={insights} setPage={setPage} />}
        {page === "transactions" && <TransactionsPage filtered={filtered} accounts={accounts} saveTxn={saveTxn} deleteTxn={deleteTxn} />}
        {page === "budget" && <BudgetPage budget={budget} updateBudget={updateBudget} month={month} year={year} transactions={transactions} budgetIncome={budgetIncome} budgetTotal={budgetTotal} />}
        {page === "savings" && <SavingsPage goals={goals} saveGoal={saveGoal} deleteGoal={deleteGoal} depositToGoal={depositToGoal} />}
        {page === "debt" && <DebtPage debts={debts} sortedDebts={sortedDebts} debtStrategy={debtStrategy} setDebtStrategy={setDebtStrategy} extraPay={extraPay} setExtraPay={setExtraPay} totalDebt={totalDebt} saveDebt={saveDebt} deleteDebt={deleteDebt} updatePrefs={p => updatePrefs({ ...p, hasSeenGuide: true })} showConfetti={triggerConfetti} />}
        {page === "investments" && <InvestmentsPage investments={investments} totalInvested={totalInvested} totalGain={totalGain} saveInv={saveInv} deleteInv={deleteInv} />}
        {page === "networth" && <NetWorthPage netWorth={netWorth} totalAssets={totalAssets} totalLiab={totalLiab} acctBalance={acctBalance} txnNet={txnNet} totalInvested={totalInvested} totalDebt={totalDebt} accounts={accounts} debts={debts} monthlyInc={monthlyInc} monthlyExp={monthlyExp} monthlySavings={monthlySavings} monthlyNW={monthlyNW} nwHistory={nwHistory} saveNwSnapshot={saveNwSnapshot} month={month} />}
        {page === "accounts" && <AccountsPage accounts={accounts} saveAcct={saveAcct} deleteAcct={deleteAcct} />}
        {page === "badges" && <BadgesPage earnedBadges={earnedBadges} />}
      </div>

      {/* Quick Add FAB */}
      <QuickAddButton onClick={() => setShowQuickAdd(true)} />
      <Modal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} title="Quick Add Transaction">
        <TxnForm initial={null} onSave={d => { saveTxn(d); setShowQuickAdd(false); }} onDelete={null} onConfirmDelete={null} accounts={accounts} />
      </Modal>
    </div>
  );
}

import React, { useState, useEffect, useCallback, useRef } from "react";
import { db } from "./firebase";
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch
} from "firebase/firestore";

// ─── DEFAULTS (used for first-time seeding) ───
const defaultAccounts = [
  { id: "a1", name: "Checking", type: "Bank", balance: 8420, icon: "🏦" },
  { id: "a2", name: "Savings", type: "Bank", balance: 15780, icon: "💰" },
  { id: "a3", name: "Credit Card", type: "Credit", balance: -2340, icon: "💳" },
  { id: "a4", name: "Investment", type: "Investment", balance: 42650, icon: "📈" },
];

const defaultGoals = [
  { id: "g1", name: "Emergency Fund", saved: 8500, goal: 15000, color: "#10B981" },
  { id: "g2", name: "Vacation", saved: 2400, goal: 5000, color: "#06B6D4" },
  { id: "g3", name: "New Car", saved: 6200, goal: 20000, color: "#8B5CF6" },
  { id: "g4", name: "Home Down Payment", saved: 18000, goal: 60000, color: "#F59E0B" },
];

const defaultDebts = [
  { id: "d1", name: "Credit Card A", balance: 4200, rate: 22.9, minPay: 120 },
  { id: "d2", name: "Credit Card B", balance: 1800, rate: 19.5, minPay: 50 },
  { id: "d3", name: "Student Loan", balance: 18500, rate: 5.5, minPay: 220 },
  { id: "d4", name: "Car Loan", balance: 12000, rate: 6.9, minPay: 350 },
];

const defaultInvestments = [
  { id: "i1", name: "S&P 500 Index", cost: 19200, value: 22400 },
  { id: "i2", name: "Bond Fund", cost: 8080, value: 8500 },
  { id: "i3", name: "Tech ETF", cost: 5700, value: 6800 },
  { id: "i4", name: "Real Estate REIT", cost: 5230, value: 4950 },
];

const defaultBudget = {
  income: [3200, 3200, 850, 0, 0],
  allocations: [
    { cat: "Housing", group: "Fixed", amount: 1800 },
    { cat: "Utilities", group: "Fixed", amount: 220 },
    { cat: "Food", group: "Needs", amount: 500 },
    { cat: "Transport", group: "Needs", amount: 200 },
    { cat: "Insurance", group: "Fixed", amount: 140 },
    { cat: "Health", group: "Needs", amount: 100 },
    { cat: "Entertainment", group: "Wants", amount: 80 },
    { cat: "Shopping", group: "Wants", amount: 150 },
    { cat: "Savings", group: "Savings", amount: 600 },
    { cat: "Investments", group: "Growth", amount: 800 },
    { cat: "Debt Payments", group: "Fixed", amount: 500 },
    { cat: "Personal Care", group: "Wants", amount: 50 },
    { cat: "Education", group: "Growth", amount: 0 },
    { cat: "Gifts", group: "Wants", amount: 50 },
  ],
};

const CATEGORIES = ["Housing","Food","Transport","Entertainment","Health","Shopping","Utilities","Insurance","Savings","Investments","Debt Payments","Personal Care","Education","Gifts","Income"];

function genId() { return Math.random().toString(36).substr(2, 9); }

function seedTransactions() {
  const txns = [];
  const cats = [
    { cat: "Housing", sub: "Rent", avg: 1800, freq: 1 },
    { cat: "Utilities", sub: "Electric", avg: 140, freq: 1 },
    { cat: "Food", sub: "Groceries", avg: 85, freq: 4 },
    { cat: "Food", sub: "Dining Out", avg: 42, freq: 3 },
    { cat: "Transport", sub: "Gas", avg: 52, freq: 3 },
    { cat: "Entertainment", sub: "Streaming", avg: 15, freq: 1 },
    { cat: "Health", sub: "Gym", avg: 50, freq: 1 },
    { cat: "Shopping", sub: "Clothing", avg: 90, freq: 1 },
    { cat: "Insurance", sub: "Auto", avg: 140, freq: 1 },
  ];
  for (let m = 0; m < 4; m++) {
    txns.push({ id: genId(), date: `2026-${String(m+1).padStart(2,"0")}-01`, desc: "Salary", category: "Income", account: "Checking", amount: 3200, type: "income" });
    txns.push({ id: genId(), date: `2026-${String(m+1).padStart(2,"0")}-15`, desc: "Salary", category: "Income", account: "Checking", amount: 3200, type: "income" });
    txns.push({ id: genId(), date: `2026-${String(m+1).padStart(2,"0")}-20`, desc: "Freelance", category: "Income", account: "Checking", amount: 800 + Math.round(Math.random()*200), type: "income" });
    cats.forEach(c => {
      for (let f = 0; f < c.freq; f++) {
        txns.push({ id: genId(), date: `2026-${String(m+1).padStart(2,"0")}-${String(Math.min(28, 3+f*7+Math.floor(Math.random()*5))).padStart(2,"0")}`, desc: c.sub, category: c.cat, account: Math.random()>0.3?"Checking":"Credit Card", amount: Math.round(c.avg*(0.8+Math.random()*0.4)), type: "expense" });
      }
    });
  }
  return txns.sort((a,b) => a.date.localeCompare(b.date));
}

// ─── COLORS ───
const C = {
  bg: "#06080F", surface: "#0D1117", card: "#161B22", cardHover: "#1C2333",
  border: "#21262D", borderLight: "#30363D",
  accent: "#58A6FF", accentDim: "rgba(88,166,255,0.12)",
  green: "#3FB950", greenDim: "rgba(63,185,80,0.12)",
  red: "#F85149", redDim: "rgba(248,81,73,0.12)",
  amber: "#D29922", amberDim: "rgba(210,153,34,0.12)",
  purple: "#BC8CFF", purpleDim: "rgba(188,140,255,0.12)",
  cyan: "#39D2C0", cyanDim: "rgba(57,210,192,0.12)",
  pink: "#F778BA",
  text: "#E6EDF3", textMid: "#8B949E", textDim: "#484F58",
};

const fmt = n => `$${Math.abs(n).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:0})}`;
const pct = n => `${(n*100).toFixed(1)}%`;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const getWeek = d => { const s = new Date(d.getFullYear(),0,1); return Math.ceil(((d-s)/864e5+s.getDay()+1)/7); };

// ─── MICRO COMPONENTS ───
function Donut({ value, max, color, size=72, stroke=7 }) {
  const p = max===0?0:Math.min(value/max,1);
  const r = (size-stroke)/2, circ = 2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ*(1-p)} strokeLinecap="round"
        style={{transition:"stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)"}}/>
    </svg>
  );
}

function Spark({ data, color, w=100, h=28 }) {
  if(data.length<2) return null;
  const mx=Math.max(...data), mn=Math.min(...data), rng=mx-mn||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-mn)/rng)*(h-4)-2}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function ProgressBar({ value, max, color, h=6 }) {
  const p = max===0?0:Math.min(value/max,1)*100;
  return (
    <div style={{height:h,borderRadius:h/2,background:C.border,overflow:"hidden"}}>
      <div style={{height:"100%",borderRadius:h/2,width:`${p}%`,background:color,transition:"width 0.6s ease"}}/>
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if(!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"24px 28px",width:460,maxHeight:"80vh",overflowY:"auto",animation:"modalIn 0.2s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontSize:15,fontWeight:700,color:C.text}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.textMid,fontSize:18,cursor:"pointer",padding:"4px 8px"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:11,color:C.textMid,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%",boxSizing:"border-box",padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,
  background:C.surface,color:C.text,fontSize:13,fontFamily:"inherit",outline:"none",
};
const selectStyle = { ...inputStyle, cursor:"pointer" };
const btnPrimary = {
  padding:"10px 20px",borderRadius:8,border:"none",background:C.accent,color:"#fff",
  fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
};
const btnSecondary = { ...btnPrimary, background:"transparent", border:`1px solid ${C.border}`, color:C.textMid };
const btnDanger = { ...btnPrimary, background:C.red };
const btnSmall = {
  padding:"5px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",
  color:C.textMid,fontSize:11,cursor:"pointer",fontFamily:"inherit",
};

// ─── FIRESTORE HELPERS ───
async function fbSet(collName, id, data) {
  try { await setDoc(doc(db, collName, id), data); } catch(e) { console.error("Firestore write error:", e); }
}
async function fbDelete(collName, id) {
  try { await deleteDoc(doc(db, collName, id)); } catch(e) { console.error("Firestore delete error:", e); }
}
async function fbSeedCollection(collName, items) {
  const batch = writeBatch(db);
  items.forEach(item => { batch.set(doc(db, collName, item.id), item); });
  await batch.commit();
}

// ─── MAIN APP ───
export default function ProfitHub() {
  const [page, setPage] = useState("dashboard");
  const [view, setView] = useState("monthly");
  const [year] = useState(2026);
  const [month, setMonth] = useState(3);
  const [week, setWeek] = useState(1);

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [budget, setBudget] = useState(defaultBudget);
  const [debtStrategy, setDebtStrategy] = useState("snowball");
  const [extraPay, setExtraPay] = useState(200);

  const [showTxnModal, setShowTxnModal] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [editDebt, setEditDebt] = useState(null);
  const [showInvModal, setShowInvModal] = useState(false);
  const [editInv, setEditInv] = useState(null);
  const [showAcctModal, setShowAcctModal] = useState(false);
  const [editAcct, setEditAcct] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositGoal, setDepositGoal] = useState(null);

  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const seeded = useRef(false);

  // ─── FIRESTORE REAL-TIME LISTENERS ───
  useEffect(() => {
    const unsubs = [];

    // Transactions
    unsubs.push(onSnapshot(collection(db, "transactions"), snap => {
      if (snap.empty && !seeded.current) {
        seeded.current = true;
        const seed = seedTransactions();
        fbSeedCollection("transactions", seed);
        return;
      }
      const items = snap.docs.map(d => d.data());
      setTransactions(items.sort((a,b) => a.date.localeCompare(b.date)));
    }));

    // Accounts
    unsubs.push(onSnapshot(collection(db, "accounts"), snap => {
      if (snap.empty && !seeded.current) {
        fbSeedCollection("accounts", defaultAccounts);
        return;
      }
      setAccounts(snap.docs.map(d => d.data()));
    }));

    // Goals
    unsubs.push(onSnapshot(collection(db, "goals"), snap => {
      if (snap.empty && !seeded.current) {
        fbSeedCollection("goals", defaultGoals);
        return;
      }
      setGoals(snap.docs.map(d => d.data()));
    }));

    // Debts
    unsubs.push(onSnapshot(collection(db, "debts"), snap => {
      if (snap.empty && !seeded.current) {
        fbSeedCollection("debts", defaultDebts);
        return;
      }
      setDebts(snap.docs.map(d => d.data()));
    }));

    // Investments
    unsubs.push(onSnapshot(collection(db, "investments"), snap => {
      if (snap.empty && !seeded.current) {
        fbSeedCollection("investments", defaultInvestments);
        return;
      }
      setInvestments(snap.docs.map(d => d.data()));
    }));

    // Budget (single document)
    unsubs.push(onSnapshot(doc(db, "settings", "budget"), snap => {
      if (!snap.exists()) {
        setDoc(doc(db, "settings", "budget"), defaultBudget);
        return;
      }
      setBudget(snap.data());
    }));

    // Settings (extra pay, strategy)
    unsubs.push(onSnapshot(doc(db, "settings", "preferences"), snap => {
      if (!snap.exists()) {
        setDoc(doc(db, "settings", "preferences"), { extraPay: 200, debtStrategy: "snowball" });
        return;
      }
      const data = snap.data();
      setExtraPay(data.extraPay ?? 200);
      setDebtStrategy(data.debtStrategy ?? "snowball");
    }));

    setTimeout(() => { setLoaded(true); setSyncing(false); }, 800);

    return () => unsubs.forEach(u => u());
  }, []);

  // ─── FILTERING ───
  const filtered = transactions.filter(t => {
    const d = new Date(t.date);
    if(d.getFullYear()!==year) return false;
    if(view==="monthly") return d.getMonth()===month;
    if(view==="weekly") return getWeek(d)===week;
    if(view==="biweekly") return Math.ceil(getWeek(d)/2)===week;
    if(view==="semi-annual") return (d.getMonth()<6?"H1":"H2")===(month<6?"H1":"H2");
    if(view==="daily") return d.getMonth()===month && d.getDate()===week;
    return true;
  });

  const income = filtered.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expenses = filtered.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const savings = income - expenses;

  const catBreakdown = {};
  filtered.filter(t=>t.type==="expense").forEach(t=>{ catBreakdown[t.category]=(catBreakdown[t.category]||0)+t.amount; });
  const catEntries = Object.entries(catBreakdown).sort((a,b)=>b[1]-a[1]);
  const catColors = [C.accent,C.purple,C.amber,C.cyan,C.green,C.red,C.pink,"#F97316"];

  const monthlyInc = Array(12).fill(0), monthlyExp = Array(12).fill(0);
  transactions.filter(t=>new Date(t.date).getFullYear()===year).forEach(t=>{
    const m=new Date(t.date).getMonth();
    if(t.type==="income") monthlyInc[m]+=t.amount; else monthlyExp[m]+=t.amount;
  });

  const totalDebt = debts.reduce((s,d)=>s+d.balance,0);
  const totalInvested = investments.reduce((s,i)=>s+i.value,0);
  const totalGain = investments.reduce((s,i)=>s+(i.value-i.cost),0);
  const totalAssets = accounts.filter(a=>a.balance>0).reduce((s,a)=>s+a.balance,0)+totalInvested;
  const totalLiab = accounts.filter(a=>a.balance<0).reduce((s,a)=>s+Math.abs(a.balance),0)+totalDebt;
  const netWorth = totalAssets - totalLiab;

  const budgetIncome = (budget.income||[]).reduce((s,v)=>s+v,0);
  const budgetTotal = (budget.allocations||[]).reduce((s,a)=>s+a.amount,0);

  const sortedDebts = debtStrategy==="snowball"
    ? [...debts].sort((a,b)=>a.balance-b.balance)
    : [...debts].sort((a,b)=>b.rate-a.rate);

  const periodOpts = () => {
    if(view==="daily") return Array.from({length:new Date(year,month+1,0).getDate()},(_,i)=>({l:`${i+1}`,v:i+1}));
    if(view==="weekly") return Array.from({length:52},(_,i)=>({l:`W${i+1}`,v:i+1}));
    if(view==="biweekly") return Array.from({length:26},(_,i)=>({l:`BW${i+1}`,v:i+1}));
    if(view==="monthly") return MONTHS.map((m,i)=>({l:m,v:i}));
    if(view==="semi-annual") return [{l:"H1",v:0},{l:"H2",v:6}];
    return [{l:"2026",v:0}];
  };

  // ─── CRUD (writes to Firestore, listeners auto-update state) ───
  const saveTxn = (data) => {
    const item = data.id ? data : { ...data, id: genId() };
    fbSet("transactions", item.id, item);
    setShowTxnModal(false); setEditTxn(null);
  };
  const deleteTxn = (id) => { fbDelete("transactions", id); setShowTxnModal(false); setEditTxn(null); };

  const saveGoal = (data) => {
    const item = data.id ? data : { ...data, id: genId() };
    fbSet("goals", item.id, item);
    setShowGoalModal(false); setEditGoal(null);
  };
  const deleteGoal = (id) => { fbDelete("goals", id); setShowGoalModal(false); setEditGoal(null); };

  const depositToGoal = (id, amt) => {
    const goal = goals.find(g => g.id === id);
    if (goal) fbSet("goals", id, { ...goal, saved: goal.saved + amt });
    setShowDepositModal(false); setDepositGoal(null);
  };

  const saveDebt = (data) => {
    const item = data.id ? data : { ...data, id: genId() };
    fbSet("debts", item.id, item);
    setShowDebtModal(false); setEditDebt(null);
  };
  const deleteDebt = (id) => { fbDelete("debts", id); setShowDebtModal(false); setEditDebt(null); };

  const saveInv = (data) => {
    const item = data.id ? data : { ...data, id: genId() };
    fbSet("investments", item.id, item);
    setShowInvModal(false); setEditInv(null);
  };
  const deleteInv = (id) => { fbDelete("investments", id); setShowInvModal(false); setEditInv(null); };

  const saveAcct = (data) => {
    const item = data.id ? data : { ...data, id: genId() };
    fbSet("accounts", item.id, item);
    setShowAcctModal(false); setEditAcct(null);
  };
  const deleteAcct = (id) => { fbDelete("accounts", id); setShowAcctModal(false); setEditAcct(null); };

  const updateBudget = (newBudget) => {
    setBudget(newBudget);
    setDoc(doc(db, "settings", "budget"), newBudget);
  };

  const updatePrefs = (prefs) => {
    setDoc(doc(db, "settings", "preferences"), prefs);
  };

  const navItems = [
    { id:"dashboard", icon:"◆", label:"Dashboard" },
    { id:"transactions", icon:"⟷", label:"Transactions" },
    { id:"budget", icon:"◎", label:"Budget" },
    { id:"savings", icon:"◈", label:"Savings Goals" },
    { id:"debt", icon:"▽", label:"Debt Payoff" },
    { id:"investments", icon:"△", label:"Investments" },
    { id:"networth", icon:"◇", label:"Net Worth" },
    { id:"accounts", icon:"▣", label:"Accounts" },
  ];

  const views = ["daily","weekly","biweekly","monthly","semi-annual","yearly"];
  const card = { background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 22px", position:"relative", overflow:"hidden" };

  // ─── LOADING SCREEN ───
  if (!loaded) {
    return (
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
        <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${C.accent},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#fff",animation:"pulse 1.5s infinite"}}>P</div>
        <div style={{color:C.textMid,fontSize:13,fontFamily:"'IBM Plex Sans',system-ui,sans-serif"}}>Syncing your data...</div>
        <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:"'IBM Plex Sans','DM Sans',system-ui,sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:${C.bg}; } ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
        input[type=number]::-webkit-inner-spin-button { opacity:1; }
      `}</style>

      {/* SIDEBAR */}
      <div style={{position:"fixed",left:0,top:0,bottom:0,width:sidebarOpen?210:56,background:`linear-gradient(180deg,${C.surface} 0%,${C.bg} 100%)`,borderRight:`1px solid ${C.border}`,padding:"16px 0",display:"flex",flexDirection:"column",zIndex:10,transition:"width 0.25s ease",overflow:"hidden"}}>
        <div style={{padding:"0 16px",marginBottom:24,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setSidebarOpen(!sidebarOpen)}>
          <div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${C.accent},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff",flexShrink:0}}>P</div>
          {sidebarOpen && <div><div style={{fontSize:14,fontWeight:700,letterSpacing:"-0.3px",whiteSpace:"nowrap"}}>PROFIT HUB</div><div style={{fontSize:9,color:C.textDim,letterSpacing:1.5}}>BUDGET TRACKER</div></div>}
        </div>
        <div style={{flex:1}}>
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} title={n.label}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:sidebarOpen?"9px 16px":"9px 0",border:"none",cursor:"pointer",
                background:page===n.id?C.accentDim:"transparent",color:page===n.id?C.accent:C.textMid,
                borderLeft:page===n.id?`2px solid ${C.accent}`:"2px solid transparent",
                fontSize:12,fontWeight:page===n.id?600:400,transition:"all 0.15s",fontFamily:"inherit",justifyContent:sidebarOpen?"flex-start":"center"}}>
              <span style={{fontSize:13,width:20,textAlign:"center",flexShrink:0}}>{n.icon}</span>
              {sidebarOpen && <span style={{whiteSpace:"nowrap"}}>{n.label}</span>}
            </button>
          ))}
        </div>
        <div style={{padding:"12px 16px",borderTop:`1px solid ${C.border}`}}>
          {sidebarOpen && <><div style={{fontSize:9,color:C.textDim,letterSpacing:1}}>NET WORTH</div>
          <div style={{fontSize:16,fontWeight:700,color:netWorth>=0?C.green:C.red}}>{netWorth>=0?"+":"-"}{fmt(netWorth)}</div>
          <div style={{fontSize:9,color:C.green,marginTop:2}}>● Synced</div></>}
        </div>
      </div>

      {/* MAIN */}
      <div style={{marginLeft:sidebarOpen?210:56,padding:"20px 24px 40px",transition:"margin-left 0.25s ease"}}>
        {/* TIMELINE CONTROLS */}
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <h1 style={{fontSize:20,fontWeight:700,margin:0,letterSpacing:"-0.3px"}}>{navItems.find(n=>n.id===page)?.label}</h1>
              <p style={{margin:"2px 0 0",fontSize:11,color:C.textDim}}>{view} view • {year}</p>
            </div>
          </div>
          <div style={{display:"flex",gap:2,background:C.surface,borderRadius:10,padding:3,border:`1px solid ${C.border}`,marginBottom:10}}>
            {views.map(v=>(
              <button key={v} onClick={()=>{setView(v);setWeek(1);}} style={{flex:1,padding:"7px 4px",borderRadius:8,border:"none",cursor:"pointer",background:view===v?C.accent:"transparent",color:view===v?"#fff":C.textMid,fontSize:10.5,fontWeight:view===v?600:400,transition:"all 0.15s",fontFamily:"inherit",textTransform:"capitalize"}}>
                {v==="semi-annual"?"6-Month":v}
              </button>
            ))}
          </div>
          {view!=="yearly" && (
            <div style={{display:"flex",gap:3,overflowX:"auto",paddingBottom:4}}>
              {periodOpts().map(o=>{
                const active = (view==="monthly"||view==="semi-annual"?month:week)===o.v;
                return (
                  <button key={o.v} onClick={()=>{if(view==="monthly"||view==="semi-annual")setMonth(o.v);else setWeek(o.v);}}
                    style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${active?C.accent:C.border}`,background:active?C.accentDim:"transparent",color:active?C.accent:C.textDim,fontSize:10.5,fontWeight:active?600:400,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",transition:"all 0.12s"}}>
                    {o.l}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══ DASHBOARD ═══ */}
        {page==="dashboard" && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
              {[
                {label:"Income",value:fmt(income),color:C.green,glow:C.greenDim,spark:monthlyInc},
                {label:"Expenses",value:fmt(expenses),color:C.red,glow:C.redDim,spark:monthlyExp},
                {label:"Savings",value:income===0?"0%":pct(savings/income),color:C.cyan,glow:C.cyanDim,spark:monthlyInc.map((v,i)=>v-monthlyExp[i])},
                {label:"Invested",value:fmt(totalInvested),color:C.purple,glow:C.purpleDim,spark:[38e3,39e3,40e3,41e3,42e3,totalInvested]},
                {label:"Net Worth",value:fmt(netWorth),color:C.amber,glow:C.amberDim,spark:[48e3,52e3,55e3,58e3,62e3,netWorth]},
              ].map((k,i)=>(
                <div key={i} style={{...card,padding:"14px 16px"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color,opacity:0.5}}/>
                  <div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>{k.label}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                    <div style={{fontSize:18,fontWeight:700,color:k.color}}>{k.value}</div>
                    <Spark data={k.spark} color={k.color} w={60} h={24}/>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
              <div style={card}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:14}}>Income vs Expenses</div>
                <div style={{display:"flex",gap:10,marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:C.green}}/><span style={{fontSize:10,color:C.textMid}}>Income</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:C.red}}/><span style={{fontSize:10,color:C.textMid}}>Expenses</span></div>
                </div>
                <div style={{display:"flex",alignItems:"flex-end",gap:4,height:130}}>
                  {monthlyInc.map((inc,i)=>{
                    const mx=Math.max(...monthlyInc,...monthlyExp,1);
                    return (
                      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <div style={{display:"flex",gap:1,alignItems:"flex-end",height:106}}>
                          <div style={{width:10,borderRadius:"3px 3px 0 0",height:`${Math.max((inc/mx)*96,2)}px`,background:C.green,transition:"height 0.5s"}}/>
                          <div style={{width:10,borderRadius:"3px 3px 0 0",height:`${Math.max((monthlyExp[i]/mx)*96,2)}px`,background:C.red,transition:"height 0.5s"}}/>
                        </div>
                        <span style={{fontSize:9,color:C.textDim}}>{MONTHS[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={card}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:14}}>Expense Breakdown</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {catEntries.slice(0,7).map(([cat,amt],i)=>(
                    <div key={cat}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:10.5,color:C.textMid}}>{cat}</span>
                        <span style={{fontSize:10.5,fontWeight:600}}>{fmt(amt)}</span>
                      </div>
                      <ProgressBar value={amt} max={catEntries[0]?.[1]||1} color={catColors[i%catColors.length]}/>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontSize:12,fontWeight:600}}>Recent Transactions</span>
                <button onClick={()=>setPage("transactions")} style={btnSmall}>View All</button>
              </div>
              {[...filtered].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6).map(t=>(
                <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}22`}}>
                  <div><div style={{fontSize:11.5,fontWeight:500}}>{t.desc}</div><div style={{fontSize:9,color:C.textDim}}>{t.date} • {t.category}</div></div>
                  <span style={{fontSize:12,fontWeight:600,color:t.type==="income"?C.green:C.red}}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TRANSACTIONS ═══ */}
        {page==="transactions" && (
          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <span style={{fontSize:12,fontWeight:600}}>Transactions ({filtered.length})</span>
              <button onClick={()=>{setEditTxn(null);setShowTxnModal(true);}} style={btnPrimary}>+ Add Transaction</button>
            </div>
            <div style={{maxHeight:500,overflowY:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                  {["Date","Description","Category","Account","Amount",""].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"7px 8px",color:C.textDim,fontWeight:500,fontSize:10,textTransform:"uppercase",letterSpacing:0.8,position:"sticky",top:0,background:C.card}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[...filtered].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>(
                    <tr key={t.id} style={{borderBottom:`1px solid ${C.border}15`,cursor:"pointer"}} onClick={()=>{setEditTxn(t);setShowTxnModal(true);}}>
                      <td style={{padding:"7px 8px",color:C.textMid}}>{t.date}</td>
                      <td style={{padding:"7px 8px"}}>{t.desc}</td>
                      <td style={{padding:"7px 8px"}}><span style={{padding:"2px 8px",borderRadius:4,background:t.type==="income"?C.greenDim:C.accentDim,color:t.type==="income"?C.green:C.accent,fontSize:10}}>{t.category}</span></td>
                      <td style={{padding:"7px 8px",color:C.textMid}}>{t.account}</td>
                      <td style={{padding:"7px 8px",fontWeight:600,color:t.type==="income"?C.green:C.red}}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</td>
                      <td style={{padding:"7px 8px"}}><button onClick={e=>{e.stopPropagation();deleteTxn(t.id);}} style={{...btnSmall,color:C.red,borderColor:C.red+"44",fontSize:10}}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ BUDGET ═══ */}
        {page==="budget" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              {[{l:"Total Income",v:fmt(budgetIncome),c:C.green},{l:"Budgeted",v:fmt(budgetTotal),c:C.accent},{l:"Remaining",v:fmt(budgetIncome-budgetTotal),c:budgetIncome-budgetTotal>=0?C.green:C.red}].map((k,i)=>(
                <div key={i} style={{...card,textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>{k.l}</div><div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div></div>
              ))}
            </div>
            <div style={card}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:12}}>Income Sources</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                {["Paycheck 1","Paycheck 2","Side Income","Bonus","Other"].map((lbl,i)=>(
                  <div key={i}>
                    <div style={{fontSize:10,color:C.textDim,marginBottom:3}}>{lbl}</div>
                    <input type="number" value={(budget.income||[])[i]||0} onChange={e=>{const v=[...(budget.income||[])];v[i]=Number(e.target.value)||0;updateBudget({...budget,income:v});}}
                      style={{...inputStyle,textAlign:"center",fontSize:13,fontWeight:600,color:C.green}}/>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:12}}>Budget Allocation</div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 80px",gap:"6px 10px",alignItems:"center"}}>
                <div style={{fontSize:10,color:C.textDim,fontWeight:600}}>CATEGORY</div>
                <div style={{fontSize:10,color:C.textDim,fontWeight:600}}>GROUP</div>
                <div style={{fontSize:10,color:C.textDim,fontWeight:600}}>AMOUNT</div>
                <div style={{fontSize:10,color:C.textDim,fontWeight:600}}>% OF INCOME</div>
                {(budget.allocations||[]).map((a,i)=>(
                  <React.Fragment key={i}>
                    <div style={{fontSize:12,fontWeight:500}}>{a.cat}</div>
                    <div style={{fontSize:11,color:C.textMid}}>{a.group}</div>
                    <input type="number" value={a.amount} onChange={e=>{const allocs=[...(budget.allocations||[])];allocs[i]={...allocs[i],amount:Number(e.target.value)||0};updateBudget({...budget,allocations:allocs});}}
                      style={{...inputStyle,textAlign:"right",padding:"5px 8px",fontSize:12,color:C.accent}}/>
                    <div style={{fontSize:11,color:C.textMid,textAlign:"right"}}>{budgetIncome===0?"0%":pct(a.amount/budgetIncome)}</div>
                  </React.Fragment>
                ))}
              </div>
              <div style={{marginTop:14}}>
                <ProgressBar value={budgetTotal} max={budgetIncome} color={budgetTotal>budgetIncome?C.red:C.green} h={8}/>
              </div>
            </div>
          </div>
        )}

        {/* ═══ SAVINGS ═══ */}
        {page==="savings" && (
          <div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
              <button onClick={()=>{setEditGoal(null);setShowGoalModal(true);}} style={btnPrimary}>+ Add Goal</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {goals.map(g=>(
                <div key={g.id} style={{...card,cursor:"pointer"}} onClick={()=>{setEditGoal(g);setShowGoalModal(true);}}>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <Donut value={g.saved} max={g.goal} color={g.color} size={80} stroke={8}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{g.name}</div>
                      <div style={{fontSize:20,fontWeight:700,color:g.color}}>{g.goal===0?"-":Math.round(g.saved/g.goal*100)}%</div>
                      <div style={{fontSize:10,color:C.textDim}}>{fmt(g.saved)} of {fmt(g.goal)}</div>
                      <div style={{fontSize:10,color:C.textMid,marginTop:2}}>{fmt(Math.max(g.goal-g.saved,0))} remaining</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();setDepositGoal(g);setShowDepositModal(true);}}
                      style={{...btnSmall,color:C.green,borderColor:C.green+"66"}}>+ Deposit</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ DEBT ═══ */}
        {page==="debt" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
              <div style={{...card,textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Total Debt</div><div style={{fontSize:20,fontWeight:700,color:C.red}}>{fmt(totalDebt)}</div></div>
              <div style={{...card,textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Min Payments</div><div style={{fontSize:20,fontWeight:700}}>{fmt(debts.reduce((s,d)=>s+d.minPay,0))}</div></div>
              <div style={{...card,textAlign:"center"}}>
                <div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Extra Payment</div>
                <input type="number" value={extraPay} onChange={e=>{const v=Number(e.target.value)||0;setExtraPay(v);updatePrefs({extraPay:v,debtStrategy});}}
                  style={{...inputStyle,textAlign:"center",fontSize:18,fontWeight:700,color:C.cyan,border:"none",background:"transparent",width:100,padding:0}}/>
              </div>
              <div style={{...card,textAlign:"center"}}>
                <div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Strategy</div>
                <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                  {["snowball","avalanche"].map(s=>(
                    <button key={s} onClick={()=>{setDebtStrategy(s);updatePrefs({extraPay,debtStrategy:s});}}
                      style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${debtStrategy===s?C.accent:C.border}`,background:debtStrategy===s?C.accentDim:"transparent",color:debtStrategy===s?C.accent:C.textMid,fontSize:10.5,fontWeight:debtStrategy===s?600:400,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontSize:12,fontWeight:600}}>Payoff Order ({debtStrategy==="snowball"?"Lowest Balance":"Highest Interest"} First)</span>
                <button onClick={()=>{setEditDebt(null);setShowDebtModal(true);}} style={btnPrimary}>+ Add Debt</button>
              </div>
              {sortedDebts.map((d,i)=>(
                <div key={d.id} style={{display:"flex",alignItems:"center",gap:14,padding:"11px 0",borderBottom:i<sortedDebts.length-1?`1px solid ${C.border}22`:"none",cursor:"pointer"}}
                  onClick={()=>{setEditDebt(d);setShowDebtModal(true);}}>
                  <div style={{width:26,height:26,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",background:i===0?C.accentDim:`${C.border}44`,color:i===0?C.accent:C.textDim,fontSize:11,fontWeight:700}}>{i+1}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:500}}>{d.name}</div>
                    <div style={{fontSize:10,color:C.textDim}}>{d.rate}% APR</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.red}}>{fmt(d.balance)}</div>
                    <div style={{fontSize:10,color:i===0?C.accent:C.textDim}}>
                      {fmt(i===0?d.minPay+extraPay:d.minPay)}/mo
                      {i===0&&<span style={{color:C.green,marginLeft:4}}>+{fmt(extraPay)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ INVESTMENTS ═══ */}
        {page==="investments" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
              <div style={{...card,textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Portfolio Value</div><div style={{fontSize:22,fontWeight:700}}>{fmt(totalInvested)}</div></div>
              <div style={{...card,textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Total Gain/Loss</div><div style={{fontSize:22,fontWeight:700,color:totalGain>=0?C.green:C.red}}>{totalGain>=0?"+":"-"}{fmt(totalGain)}</div></div>
              <div style={{...card,textAlign:"center"}}><div style={{fontSize:9,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Return</div><div style={{fontSize:22,fontWeight:700,color:totalGain>=0?C.green:C.red}}>{totalGain>=0?"+":""}{((totalGain/(totalInvested-totalGain||1))*100).toFixed(1)}%</div></div>
            </div>
            <div style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontSize:12,fontWeight:600}}>Holdings</span>
                <button onClick={()=>{setEditInv(null);setShowInvModal(true);}} style={btnPrimary}>+ Add Investment</button>
              </div>
              {investments.map((inv,i)=>{
                const gain=inv.value-inv.cost;
                return (
                  <div key={inv.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:i<investments.length-1?`1px solid ${C.border}22`:"none",cursor:"pointer"}}
                    onClick={()=>{setEditInv(inv);setShowInvModal(true);}}>
                    <Donut value={inv.value} max={totalInvested} color={catColors[i%catColors.length]} size={42} stroke={5}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:500}}>{inv.name}</div>
                      <div style={{fontSize:10,color:C.textDim}}>{((inv.value/totalInvested)*100).toFixed(1)}% of portfolio</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:13,fontWeight:600}}>{fmt(inv.value)}</div>
                      <div style={{fontSize:11,color:gain>=0?C.green:C.red,fontWeight:500}}>{gain>=0?"+":""}{((gain/(inv.cost||1))*100).toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ NET WORTH ═══ */}
        {page==="networth" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{...card,textAlign:"center",padding:"28px 22px"}}>
              <div style={{fontSize:10,color:C.textDim,textTransform:"uppercase",letterSpacing:2,marginBottom:6}}>Total Net Worth</div>
              <div style={{fontSize:34,fontWeight:800,color:netWorth>=0?C.green:C.red,letterSpacing:"-1px"}}>{netWorth>=0?"+":"-"}{fmt(netWorth)}</div>
              <Spark data={[48e3,52e3,55e3,58e3,62e3,netWorth]} color={C.green} w={240} h={40}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={card}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:12,color:C.green}}>Assets — {fmt(totalAssets)}</div>
                {accounts.filter(a=>a.balance>0).map(a=>(
                  <div key={a.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}22`}}>
                    <span style={{fontSize:11.5}}>{a.icon} {a.name}</span>
                    <span style={{fontSize:11.5,fontWeight:600,color:C.green}}>+{fmt(a.balance)}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}22`}}>
                  <span style={{fontSize:11.5}}>📈 Investments</span>
                  <span style={{fontSize:11.5,fontWeight:600,color:C.green}}>+{fmt(totalInvested)}</span>
                </div>
              </div>
              <div style={card}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:12,color:C.red}}>Liabilities — {fmt(totalLiab)}</div>
                {accounts.filter(a=>a.balance<0).map(a=>(
                  <div key={a.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}22`}}>
                    <span style={{fontSize:11.5}}>{a.icon} {a.name}</span>
                    <span style={{fontSize:11.5,fontWeight:600,color:C.red}}>-{fmt(Math.abs(a.balance))}</span>
                  </div>
                ))}
                {debts.map(d=>(
                  <div key={d.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}22`}}>
                    <span style={{fontSize:11.5}}>📋 {d.name}</span>
                    <span style={{fontSize:11.5,fontWeight:600,color:C.red}}>-{fmt(d.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ACCOUNTS ═══ */}
        {page==="accounts" && (
          <div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
              <button onClick={()=>{setEditAcct(null);setShowAcctModal(true);}} style={btnPrimary}>+ Add Account</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {accounts.map(a=>(
                <div key={a.id} style={{...card,cursor:"pointer"}} onClick={()=>{setEditAcct(a);setShowAcctModal(true);}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                    <span style={{fontSize:26}}>{a.icon}</span>
                    <div><div style={{fontSize:13,fontWeight:600}}>{a.name}</div><div style={{fontSize:10,color:C.textDim}}>{a.type}</div></div>
                  </div>
                  <div style={{fontSize:26,fontWeight:700,color:a.balance>=0?C.green:C.red}}>{a.balance>=0?"":"-"}{fmt(a.balance)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ MODALS ═══ */}
      <Modal open={showTxnModal} onClose={()=>{setShowTxnModal(false);setEditTxn(null);}} title={editTxn?"Edit Transaction":"Add Transaction"}>
        <TransactionForm initial={editTxn} onSave={saveTxn} onDelete={editTxn?()=>deleteTxn(editTxn.id):null} accounts={accounts}/>
      </Modal>
      <Modal open={showGoalModal} onClose={()=>{setShowGoalModal(false);setEditGoal(null);}} title={editGoal?"Edit Goal":"Add Goal"}>
        <GoalForm initial={editGoal} onSave={saveGoal} onDelete={editGoal?()=>deleteGoal(editGoal.id):null}/>
      </Modal>
      <Modal open={showDepositModal} onClose={()=>{setShowDepositModal(false);setDepositGoal(null);}} title={`Deposit to ${depositGoal?.name||""}`}>
        <DepositForm goal={depositGoal} onDeposit={depositToGoal}/>
      </Modal>
      <Modal open={showDebtModal} onClose={()=>{setShowDebtModal(false);setEditDebt(null);}} title={editDebt?"Edit Debt":"Add Debt"}>
        <DebtForm initial={editDebt} onSave={saveDebt} onDelete={editDebt?()=>deleteDebt(editDebt.id):null}/>
      </Modal>
      <Modal open={showInvModal} onClose={()=>{setShowInvModal(false);setEditInv(null);}} title={editInv?"Edit Investment":"Add Investment"}>
        <InvestmentForm initial={editInv} onSave={saveInv} onDelete={editInv?()=>deleteInv(editInv.id):null}/>
      </Modal>
      <Modal open={showAcctModal} onClose={()=>{setShowAcctModal(false);setEditAcct(null);}} title={editAcct?"Edit Account":"Add Account"}>
        <AccountForm initial={editAcct} onSave={saveAcct} onDelete={editAcct?()=>deleteAcct(editAcct.id):null}/>
      </Modal>
    </div>
  );
}

// ─── FORMS ───
function TransactionForm({ initial, onSave, onDelete, accounts }) {
  const [date, setDate] = useState(initial?.date||new Date().toISOString().split("T")[0]);
  const [desc, setDesc] = useState(initial?.desc||"");
  const [category, setCategory] = useState(initial?.category||"Food");
  const [account, setAccount] = useState(initial?.account||"Checking");
  const [amount, setAmount] = useState(initial?.amount||0);
  const [type, setType] = useState(initial?.type||"expense");
  return (
    <div>
      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {["income","expense"].map(t=>(
          <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:"8px",borderRadius:8,border:`1px solid ${type===t?(t==="income"?C.green:C.red):C.border}`,background:type===t?(t==="income"?C.greenDim:C.redDim):"transparent",color:type===t?(t==="income"?C.green:C.red):C.textMid,fontSize:12,fontWeight:type===t?600:400,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{t}</button>
        ))}
      </div>
      <Field label="Date"><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inputStyle}/></Field>
      <Field label="Description"><input value={desc} onChange={e=>setDesc(e.target.value)} style={inputStyle} placeholder="e.g. Groceries at Trader Joe's"/></Field>
      <Field label="Category"><select value={category} onChange={e=>setCategory(e.target.value)} style={selectStyle}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></Field>
      <Field label="Account"><select value={account} onChange={e=>setAccount(e.target.value)} style={selectStyle}>{(accounts||[]).map(a=><option key={a.id}>{a.name}</option>)}</select></Field>
      <Field label="Amount"><input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value)||0)} style={inputStyle} min="0"/></Field>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <button onClick={()=>onSave({...initial,date,desc,category,account,amount,type})} style={btnPrimary}>Save</button>
        {onDelete && <button onClick={onDelete} style={btnDanger}>Delete</button>}
      </div>
    </div>
  );
}

function GoalForm({ initial, onSave, onDelete }) {
  const [name, setName] = useState(initial?.name||"");
  const [saved, setSaved] = useState(initial?.saved||0);
  const [goal, setGoal] = useState(initial?.goal||0);
  const [color, setColor] = useState(initial?.color||"#10B981");
  const colors = ["#10B981","#06B6D4","#8B5CF6","#F59E0B","#F85149","#58A6FF","#F778BA","#3FB950"];
  return (
    <div>
      <Field label="Goal Name"><input value={name} onChange={e=>setName(e.target.value)} style={inputStyle} placeholder="e.g. Emergency Fund"/></Field>
      <Field label="Amount Saved"><input type="number" value={saved} onChange={e=>setSaved(Number(e.target.value)||0)} style={inputStyle}/></Field>
      <Field label="Target Amount"><input type="number" value={goal} onChange={e=>setGoal(Number(e.target.value)||0)} style={inputStyle}/></Field>
      <Field label="Color">
        <div style={{display:"flex",gap:6}}>
          {colors.map(c=><button key={c} onClick={()=>setColor(c)} style={{width:28,height:28,borderRadius:6,background:c,border:color===c?"2px solid #fff":"2px solid transparent",cursor:"pointer"}}/>)}
        </div>
      </Field>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <button onClick={()=>onSave({...initial,name,saved,goal,color})} style={btnPrimary}>Save</button>
        {onDelete && <button onClick={onDelete} style={btnDanger}>Delete</button>}
      </div>
    </div>
  );
}

function DepositForm({ goal, onDeposit }) {
  const [amt, setAmt] = useState(100);
  if(!goal) return null;
  return (
    <div>
      <div style={{textAlign:"center",marginBottom:16}}>
        <Donut value={goal.saved} max={goal.goal} color={goal.color} size={90} stroke={9}/>
        <div style={{fontSize:13,fontWeight:600,marginTop:8}}>{fmt(goal.saved)} of {fmt(goal.goal)}</div>
      </div>
      <Field label="Deposit Amount"><input type="number" value={amt} onChange={e=>setAmt(Number(e.target.value)||0)} style={inputStyle} min="0"/></Field>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[50,100,250,500].map(v=><button key={v} onClick={()=>setAmt(v)} style={{...btnSmall,color:amt===v?C.accent:C.textMid,borderColor:amt===v?C.accent:C.border}}>${v}</button>)}
      </div>
      <button onClick={()=>onDeposit(goal.id,amt)} style={btnPrimary}>Deposit {fmt(amt)}</button>
    </div>
  );
}

function DebtForm({ initial, onSave, onDelete }) {
  const [name, setName] = useState(initial?.name||"");
  const [balance, setBalance] = useState(initial?.balance||0);
  const [rate, setRate] = useState(initial?.rate||0);
  const [minPay, setMinPay] = useState(initial?.minPay||0);
  return (
    <div>
      <Field label="Debt Name"><input value={name} onChange={e=>setName(e.target.value)} style={inputStyle} placeholder="e.g. Student Loan"/></Field>
      <Field label="Balance"><input type="number" value={balance} onChange={e=>setBalance(Number(e.target.value)||0)} style={inputStyle}/></Field>
      <Field label="Interest Rate (%)"><input type="number" value={rate} onChange={e=>setRate(Number(e.target.value)||0)} style={inputStyle} step="0.1"/></Field>
      <Field label="Minimum Payment"><input type="number" value={minPay} onChange={e=>setMinPay(Number(e.target.value)||0)} style={inputStyle}/></Field>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <button onClick={()=>onSave({...initial,name,balance,rate,minPay})} style={btnPrimary}>Save</button>
        {onDelete && <button onClick={onDelete} style={btnDanger}>Delete</button>}
      </div>
    </div>
  );
}

function InvestmentForm({ initial, onSave, onDelete }) {
  const [name, setName] = useState(initial?.name||"");
  const [cost, setCost] = useState(initial?.cost||0);
  const [value, setValue] = useState(initial?.value||0);
  return (
    <div>
      <Field label="Investment Name"><input value={name} onChange={e=>setName(e.target.value)} style={inputStyle} placeholder="e.g. S&P 500 Index"/></Field>
      <Field label="Cost Basis"><input type="number" value={cost} onChange={e=>setCost(Number(e.target.value)||0)} style={inputStyle}/></Field>
      <Field label="Current Value"><input type="number" value={value} onChange={e=>setValue(Number(e.target.value)||0)} style={inputStyle}/></Field>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <button onClick={()=>onSave({...initial,name,cost,value})} style={btnPrimary}>Save</button>
        {onDelete && <button onClick={onDelete} style={btnDanger}>Delete</button>}
      </div>
    </div>
  );
}

function AccountForm({ initial, onSave, onDelete }) {
  const [name, setName] = useState(initial?.name||"");
  const [type, setType] = useState(initial?.type||"Bank");
  const [balance, setBalance] = useState(initial?.balance||0);
  const [icon, setIcon] = useState(initial?.icon||"🏦");
  const icons = ["🏦","💰","💳","📈","🏠","💵","🪙","📊"];
  return (
    <div>
      <Field label="Account Name"><input value={name} onChange={e=>setName(e.target.value)} style={inputStyle} placeholder="e.g. Chase Checking"/></Field>
      <Field label="Type"><select value={type} onChange={e=>setType(e.target.value)} style={selectStyle}>{["Bank","Credit","Investment","Retirement","Cash"].map(t=><option key={t}>{t}</option>)}</select></Field>
      <Field label="Balance"><input type="number" value={balance} onChange={e=>setBalance(Number(e.target.value))} style={inputStyle}/></Field>
      <Field label="Icon">
        <div style={{display:"flex",gap:6}}>
          {icons.map(i=><button key={i} onClick={()=>setIcon(i)} style={{fontSize:22,padding:"4px 8px",borderRadius:6,border:icon===i?`2px solid ${C.accent}`:"2px solid transparent",background:icon===i?C.accentDim:"transparent",cursor:"pointer"}}>{i}</button>)}
        </div>
      </Field>
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <button onClick={()=>onSave({...initial,name,type,balance,icon})} style={btnPrimary}>Save</button>
        {onDelete && <button onClick={onDelete} style={btnDanger}>Delete</button>}
      </div>
    </div>
  );
}

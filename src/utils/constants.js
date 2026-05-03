// ── DEFAULT THEME ──
export const DEFAULT_THEME = {
  bg: "#06080F", surface: "#0D1117", card: "#161B22", border: "#21262D",
  sidebar: "#0D1117", accent: "#58A6FF", green: "#3FB950", red: "#F85149",
  amber: "#D29922", purple: "#BC8CFF", cyan: "#39D2C0", pink: "#F778BA",
  text: "#E6EDF3", textMid: "#8B949E", textDim: "#484F58",
  chart1: "#58A6FF", chart2: "#BC8CFF", chart3: "#D29922", chart4: "#39D2C0",
  chart5: "#3FB950", chart6: "#F85149", chart7: "#F778BA", chart8: "#F97316",
};

export let C = { ...DEFAULT_THEME };
export function applyTheme(theme) { Object.assign(C, theme); }

export const CATEGORIES = [
  "Housing","Food","Transport","Entertainment","Health","Shopping",
  "Utilities","Insurance","Savings","Investments","Debt Payments",
  "Personal Care","Education","Gifts","Income"
];

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const ACCOUNT_ICONS = ["🏦","💳","💰","📈","🏠","🚗","💎","🌐","🏧","💵"];
export const ACCOUNT_TYPES = ["Checking","Savings","Credit Card","Investment","Crypto","Cash","Other"];

// Transfer type — excluded from income/expense totals everywhere
export const TXN_TYPES = ["income","expense","transfer"];

export const QUOTES = [
  "A budget is telling your money where to go instead of wondering where it went. — Dave Ramsey",
  "Do not save what is left after spending, but spend what is left after saving. — Warren Buffett",
  "The habit of saving is itself an education. — T.T. Munger",
  "Money is a terrible master but an excellent servant. — P.T. Barnum",
  "Wealth is not about having a lot of money; it's about having a lot of options. — Chris Rock",
  "It's not your salary that makes you rich, it's your spending habits. — Charles Jaffe",
  "Financial freedom is available to those who learn about it and work for it. — Robert Kiyosaki",
  "Every dollar you save is a dollar working for your future self.",
  "Small daily improvements over time lead to stunning results.",
  "Rich is not what you have, it's what you keep.",
];

export const BADGES = [
  { id:"first_txn", name:"First Step", desc:"Log your first transaction", icon:"🎯", check:(t)=>t.length>=1 },
  { id:"ten_txn", name:"Getting Going", desc:"Log 10 transactions", icon:"🔥", check:(t)=>t.length>=10 },
  { id:"fifty_txn", name:"Data Driven", desc:"Log 50 transactions", icon:"📊", check:(t)=>t.length>=50 },
  { id:"debt_free", name:"Debt Slayer", desc:"Pay off a debt completely", icon:"⚔️", check:(t,g,d)=>d.some(x=>x.balance<=0) },
  { id:"goal_done", name:"Goal Getter", desc:"Complete a savings goal", icon:"🏆", check:(t,g)=>g.some(x=>x.saved>=x.target) },
  { id:"five_accounts", name:"Diversified", desc:"Track 5+ accounts", icon:"🌐", check:(t,g,d,i,a)=>a.length>=5 },
  { id:"investor", name:"Investor", desc:"Add your first investment", icon:"📈", check:(t,g,d,i)=>i.length>=1 },
  { id:"saver", name:"Saver", desc:"Add a savings goal", icon:"💰", check:(t,g)=>g.length>=1 },
];

export function genId() { return Math.random().toString(36).substr(2,9); }

export function fmt(n, decimals=2) {
  const num = parseFloat(n) || 0;
  return "$" + Math.abs(num).toLocaleString("en-US", { minimumFractionDigits:decimals, maximumFractionDigits:decimals });
}

export function fmtShort(n) {
  const num = Math.abs(parseFloat(n) || 0);
  if (num >= 1000000) return "$" + (num/1000000).toFixed(1) + "M";
  if (num >= 1000) return "$" + (num/1000).toFixed(1) + "K";
  return fmt(num);
}

export function getWeek(d) {
  const s = new Date(d.getFullYear(),0,1);
  return Math.ceil(((d-s)/864e5+s.getDay()+1)/7);
}

// Only count income and expense — never transfer
export function calcIncome(txns) {
  return txns.filter(t=>t.type==="income").reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
}
export function calcExpenses(txns) {
  return txns.filter(t=>t.type==="expense").reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
}

export function filterTxns(txns, period, refDate) {
  const now = refDate || new Date();
  return txns.filter(t => {
    const d = new Date(t.date);
    switch(period) {
      case "daily": return d.toDateString()===now.toDateString();
      case "weekly": return getWeek(d)===getWeek(now) && d.getFullYear()===now.getFullYear();
      case "biweekly": { const diff = Math.floor((now-d)/864e5); return diff>=0 && diff<14; }
      case "monthly": return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
      case "semiannual": { const diff2 = (now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth()); return diff2>=0 && diff2<6; }
      case "yearly": return d.getFullYear()===now.getFullYear();
      default: return true;
    }
  });
}

export function filterTxnsByMonthAndPeriod(txns, year, month, subPeriod) {
  const monthTxns = txns.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear()===year && d.getMonth()===month;
  });
  if (!subPeriod || subPeriod==="monthly") return monthTxns;
  const now = new Date();
  const isCurrentMonth = now.getFullYear()===year && now.getMonth()===month;
  if (!isCurrentMonth) return monthTxns;
  return monthTxns.filter(t => {
    const d = new Date(t.date);
    switch(subPeriod) {
      case "daily": return d.toDateString()===now.toDateString();
      case "weekly": return getWeek(d)===getWeek(now) && d.getFullYear()===now.getFullYear();
      case "biweekly": { const diff = Math.floor((now-d)/864e5); return diff>=0 && diff<14; }
      case "semiannual": { const diff2 = (now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth()); return diff2>=0 && diff2<6; }
      case "yearly": return d.getFullYear()===now.getFullYear();
      default: return true;
    }
  });
}

export function getAvailableMonths() {
  const now = new Date();
  const months = [];
  for (let i=11; i>=0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push({ year:d.getFullYear(), month:d.getMonth(), label:MONTHS[d.getMonth()], yearShort:d.getFullYear().toString().slice(2), isCurrent:i===0 });
  }
  return months;
}

export function getMonthlyData(txns) {
  const map = {};
  // exclude transfers from chart
  txns.filter(t=>t.type!=="transfer").forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map[key]) map[key] = { label:MONTHS[d.getMonth()]+" '"+d.getFullYear().toString().slice(2), income:0, expenses:0 };
    if (t.type==="income") map[key].income += parseFloat(t.amount)||0;
    else map[key].expenses += parseFloat(t.amount)||0;
  });
  return Object.values(map).slice(-12);
}

export function getCatBreakdown(txns) {
  const map = {};
  txns.filter(t=>t.type==="expense").forEach(t => {
    map[t.category] = (map[t.category]||0) + (parseFloat(t.amount)||0);
  });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>({cat,amt}));
}

export function getSavingsStreak(txns) {
  const monthlyNet = {};
  txns.filter(t=>t.type!=="transfer").forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`;
    if (!monthlyNet[key]) monthlyNet[key] = 0;
    if (t.type==="income") monthlyNet[key] += parseFloat(t.amount)||0;
    else monthlyNet[key] -= parseFloat(t.amount)||0;
  });
  const sorted = Object.entries(monthlyNet).sort((a,b)=>a[0].localeCompare(b[0]));
  let streak = 0;
  for (let i=sorted.length-1; i>=0; i--) {
    if (sorted[i][1]>0) streak++;
    else break;
  }
  return streak;
}

export function getSpendingInsights(txns) {
  const now = new Date();
  const thisMonth = txns.filter(t=>{ const d=new Date(t.date); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()&&t.type==="expense"; });
  const lastMonth = txns.filter(t=>{ const d=new Date(t.date); const lm=new Date(now.getFullYear(),now.getMonth()-1,1); return d.getMonth()===lm.getMonth()&&d.getFullYear()===lm.getFullYear()&&t.type==="expense"; });
  const thisTotal = thisMonth.reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const lastTotal = lastMonth.reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  return { thisTotal, lastTotal, diff: Math.round(lastTotal>0?((thisTotal-lastTotal)/lastTotal)*100:0) };
}

// ── DEFAULTS ──
export const defaultAccounts = [
  { id:"a1", name:"Checking", type:"Checking", balance:2500, icon:"🏦", color:"#58A6FF", creditLimit:null },
  { id:"a2", name:"Savings", type:"Savings", balance:8000, icon:"💰", color:"#3FB950", creditLimit:null },
  { id:"a3", name:"Chase Sapphire", type:"Credit Card", balance:-1200, icon:"💳", color:"#F85149", creditLimit:5000 },
];
export const defaultGoals = [
  { id:"g1", name:"Emergency Fund", target:10000, saved:8000, color:"#58A6FF", icon:"🛡️" },
  { id:"g2", name:"New Laptop", target:2000, saved:650, color:"#BC8CFF", icon:"💻" },
];
export const defaultDebts = [
  { id:"d1", name:"Car Loan", balance:8500, rate:6.9, minPayment:280, icon:"🚗" },
  { id:"d2", name:"Credit Card", balance:1200, rate:24.99, minPayment:35, icon:"💳" },
];
export const defaultInvestments = [
  { id:"i1", name:"VOO", shares:10, costBasis:380, currentPrice:420, icon:"📈" },
  { id:"i2", name:"Bitcoin", shares:0.15, costBasis:42000, currentPrice:67000, icon:"₿" },
];
export const defaultBudget = {
  income: [
    { label:"Primary Job", amount:3200 }, { label:"Side Hustle", amount:800 },
    { label:"Amazon FBA", amount:600 }, { label:"TikTok/Content", amount:400 }, { label:"Other", amount:0 },
  ],
  allocations: [
    { cat:"Housing", pct:28 }, { cat:"Food", pct:12 }, { cat:"Transport", pct:10 },
    { cat:"Entertainment", pct:5 }, { cat:"Health", pct:5 }, { cat:"Shopping", pct:8 },
    { cat:"Utilities", pct:5 }, { cat:"Insurance", pct:5 }, { cat:"Savings", pct:10 },
    { cat:"Investments", pct:8 }, { cat:"Debt Payments", pct:8 }, { cat:"Personal Care", pct:3 },
    { cat:"Education", pct:2 }, { cat:"Gifts", pct:1 },
  ]
};
export const seedTransactions = [
  { id:"t1", type:"income", amount:3200, category:"Income", description:"Paycheck", date:new Date().toISOString().split("T")[0], accountId:"a1" },
  { id:"t2", type:"expense", amount:1200, category:"Housing", description:"Rent", date:new Date().toISOString().split("T")[0], accountId:"a1" },
  { id:"t3", type:"expense", amount:85, category:"Food", description:"Groceries", date:new Date().toISOString().split("T")[0], accountId:"a3" },
  { id:"t4", type:"income", amount:600, category:"Income", description:"Amazon FBA", date:new Date().toISOString().split("T")[0], accountId:"a1" },
  { id:"t5", type:"expense", amount:45, category:"Transport", description:"Gas", date:new Date().toISOString().split("T")[0], accountId:"a3" },
];

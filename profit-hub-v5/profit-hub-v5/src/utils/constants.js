// ── COLORS ──
export const C = {
  bg: "#06080F", surface: "#0D1117", card: "#161B22", border: "#21262D",
  accent: "#58A6FF", accentDim: "rgba(88,166,255,0.12)",
  green: "#3FB950", greenDim: "rgba(63,185,80,0.12)",
  red: "#F85149", redDim: "rgba(248,81,73,0.12)",
  amber: "#D29922", amberDim: "rgba(210,153,34,0.12)",
  purple: "#BC8CFF", purpleDim: "rgba(188,140,255,0.12)",
  cyan: "#39D2C0", cyanDim: "rgba(57,210,192,0.12)",
  pink: "#F778BA",
  text: "#E6EDF3", textMid: "#8B949E", textDim: "#484F58",
};

export const CATEGORIES = [
  "Housing", "Food", "Transport", "Entertainment", "Health", "Shopping",
  "Utilities", "Insurance", "Savings", "Investments", "Debt Payments",
  "Personal Care", "Education", "Gifts", "Income"
];

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const CAT_COLORS = [C.accent, C.purple, C.amber, C.cyan, C.green, C.red, C.pink, "#F97316"];

export const QUOTES = [
  "A budget is telling your money where to go instead of wondering where it went. — Dave Ramsey",
  "The habit of saving is itself an education. — T.T. Munger",
  "Do not save what is left after spending, but spend what is left after saving. — Warren Buffett",
  "Money is a terrible master but an excellent servant. — P.T. Barnum",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Wealth is not about having a lot of money; it's about having a lot of options. — Chris Rock",
  "Financial freedom is available to those who learn about it and work for it. — Robert Kiyosaki",
  "It's not your salary that makes you rich, it's your spending habits. — Charles Jaffe",
  "Every dollar you save is a dollar working for your future self.",
  "Small daily improvements over time lead to stunning results. — Robin Sharma",
  "Rich is not what you have, it's what you keep.",
  "Beware of little expenses. A small leak will sink a great ship. — Benjamin Franklin",
];

export const BADGES = [
  { id: "first_txn", name: "First Step", desc: "Logged your first transaction", icon: "🎯", check: (t) => t.length >= 1 },
  { id: "ten_txns", name: "Getting Started", desc: "Logged 10 transactions", icon: "📝", check: (t) => t.length >= 10 },
  { id: "fifty_txns", name: "Consistent Tracker", desc: "Logged 50 transactions", icon: "🔥", check: (t) => t.length >= 50 },
  { id: "first_save", name: "Saver", desc: "Made your first savings deposit", icon: "💰", check: (t, g) => g.some(x => x.saved > 0) },
  { id: "goal_50", name: "Halfway There", desc: "Reached 50% on a savings goal", icon: "⭐", check: (t, g) => g.some(x => x.goal > 0 && x.saved / x.goal >= 0.5) },
  { id: "goal_100", name: "Goal Crusher", desc: "Completed a savings goal", icon: "🏆", check: (t, g) => g.some(x => x.goal > 0 && x.saved >= x.goal) },
  { id: "debt_paid", name: "Debt Slayer", desc: "Paid off a debt completely", icon: "⚔️", check: (t, g, d) => d.some(x => x.balance === 0) },
  { id: "nw_10k", name: "$10K Club", desc: "Net worth reached $10,000", icon: "💎", check: (t, g, d, nw) => nw >= 10000 },
  { id: "nw_25k", name: "Quarter Way", desc: "Net worth reached $25,000", icon: "🚀", check: (t, g, d, nw) => nw >= 25000 },
  { id: "nw_50k", name: "Halfway to 100K", desc: "Net worth reached $50,000", icon: "🌟", check: (t, g, d, nw) => nw >= 50000 },
  { id: "nw_100k", name: "Six Figures", desc: "Net worth reached $100,000", icon: "👑", check: (t, g, d, nw) => nw >= 100000 },
];

// ── HELPERS ──
export function genId() { return Math.random().toString(36).substr(2, 9); }
export const fmt = n => `$${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
export const pct = n => `${(n * 100).toFixed(1)}%`;
export const getWeek = d => { const s = new Date(d.getFullYear(), 0, 1); return Math.ceil(((d - s) / 864e5 + s.getDay() + 1) / 7); };

export const getTodayQuote = () => QUOTES[Math.floor(new Date().getDate() * 7 + new Date().getMonth()) % QUOTES.length];

export function filterTxns(transactions, view, year, month, week) {
  return transactions.filter(t => {
    const d = new Date(t.date);
    if (d.getFullYear() !== year) return false;
    if (view === "monthly") return d.getMonth() === month;
    if (view === "weekly") return getWeek(d) === week;
    if (view === "biweekly") return Math.ceil(getWeek(d) / 2) === week;
    if (view === "semi-annual") return (d.getMonth() < 6 ? "H1" : "H2") === (month < 6 ? "H1" : "H2");
    if (view === "daily") return d.getMonth() === month && d.getDate() === week;
    return true;
  });
}

export function getMonthlyData(transactions, year) {
  const inc = Array(12).fill(0);
  const exp = Array(12).fill(0);
  transactions.filter(t => new Date(t.date).getFullYear() === year).forEach(t => {
    const m = new Date(t.date).getMonth();
    if (t.type === "income") inc[m] += t.amount; else exp[m] += t.amount;
  });
  return { monthlyInc: inc, monthlyExp: exp, monthlySavings: inc.map((v, i) => v - exp[i]) };
}

export function getCatBreakdown(filtered) {
  const map = {};
  filtered.filter(t => t.type === "expense").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

export function getDebtRec(debts, extraPay) {
  if (debts.length === 0) return null;
  const highRate = Math.max(...debts.map(d => d.rate));
  const smallBal = Math.min(...debts.map(d => d.balance));
  const hd = debts.find(d => d.rate === highRate);
  const sd = debts.find(d => d.balance === smallBal);
  const mtp = sd ? Math.ceil(sd.balance / (sd.minPay + extraPay)) : 0;
  const intSaved = hd ? (hd.balance * (hd.rate / 100) / 12 * 3).toFixed(0) : 0;
  if (highRate > 18 && hd.balance > 3000) return { rec: "avalanche", reason: `Avalanche saves ~$${intSaved} in interest every 3 months by targeting ${hd.name} (${hd.rate}% APR) first.` };
  if (smallBal < 2500) return { rec: "snowball", reason: `Snowball pays off ${sd.name} (${fmt(smallBal)}) in ~${mtp} months for a quick win, freeing up $${sd.minPay}/mo.` };
  return { rec: "avalanche", reason: `Avalanche recommended — target the highest rate (${highRate}%) to save the most over time.` };
}

export function getAmortization(sortedDebts, extraPay) {
  if (sortedDebts.length === 0) return [];
  const rows = [];
  let balances = sortedDebts.map(d => ({ ...d, bal: d.balance }));
  let mo = 0;
  while (balances.some(d => d.bal > 0) && mo < 360) {
    mo++;
    const row = { month: mo, debts: [] };
    balances.forEach((d, i) => {
      if (d.bal <= 0) { row.debts.push({ name: d.name, payment: 0, interest: 0, principal: 0, remaining: 0 }); return; }
      const interest = d.bal * (d.rate / 100 / 12);
      let payment = d.minPay + (i === 0 ? extraPay : 0);
      payment = Math.min(payment, d.bal + interest);
      const principal = payment - interest;
      d.bal = Math.max(d.bal - principal, 0);
      row.debts.push({ name: d.name, payment: Math.round(payment), interest: Math.round(interest), principal: Math.round(principal), remaining: Math.round(d.bal) });
    });
    rows.push(row);
    if (mo > 120) break;
  }
  return rows;
}

export function getSavingsStreak(transactions, year) {
  let streak = 0;
  const now = new Date();
  for (let w = getWeek(now); w > 0; w--) {
    const weekTxns = transactions.filter(t => { const d = new Date(t.date); return d.getFullYear() === year && getWeek(d) === w; });
    const wInc = weekTxns.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const wExp = weekTxns.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    if (wInc > wExp && weekTxns.length > 0) streak++;
    else if (weekTxns.length > 0) break;
  }
  return streak;
}

export function getSpendingInsights(monthlyInc, monthlyExp, month) {
  if (month === 0) return [];
  const insights = [];
  const curExp = monthlyExp[month];
  const prevExp = monthlyExp[month - 1];
  if (prevExp > 0 && curExp > 0) {
    const change = ((curExp - prevExp) / prevExp * 100).toFixed(0);
    if (change > 10) insights.push({ type: "warning", text: `Spending is up ${change}% vs last month` });
    else if (change < -10) insights.push({ type: "good", text: `Spending is down ${Math.abs(change)}% vs last month — nice!` });
  }
  const curInc = monthlyInc[month];
  if (curInc > 0) {
    const saveRate = ((curInc - curExp) / curInc * 100).toFixed(0);
    if (saveRate >= 20) insights.push({ type: "good", text: `Saving ${saveRate}% of income this month` });
    else if (saveRate < 10) insights.push({ type: "warning", text: `Only saving ${saveRate}% — try to hit 20%` });
  }
  return insights;
}

// ── DEFAULTS ──
export const defaultAccounts = [
  { id: "a1", name: "Checking", type: "Bank", balance: 8420, icon: "🏦" },
  { id: "a2", name: "Savings", type: "Bank", balance: 15780, icon: "💰" },
  { id: "a3", name: "Credit Card", type: "Credit", balance: -2340, icon: "💳" },
  { id: "a4", name: "Investment", type: "Investment", balance: 42650, icon: "📈" },
];
export const defaultGoals = [
  { id: "g1", name: "Emergency Fund", saved: 8500, goal: 15000, color: "#10B981" },
  { id: "g2", name: "Vacation", saved: 2400, goal: 5000, color: "#06B6D4" },
  { id: "g3", name: "New Car", saved: 6200, goal: 20000, color: "#8B5CF6" },
  { id: "g4", name: "Home Down Payment", saved: 18000, goal: 60000, color: "#F59E0B" },
];
export const defaultDebts = [
  { id: "d1", name: "Credit Card A", balance: 4200, rate: 22.9, minPay: 120 },
  { id: "d2", name: "Credit Card B", balance: 1800, rate: 19.5, minPay: 50 },
  { id: "d3", name: "Student Loan", balance: 18500, rate: 5.5, minPay: 220 },
  { id: "d4", name: "Car Loan", balance: 12000, rate: 6.9, minPay: 350 },
];
export const defaultInvestments = [
  { id: "i1", name: "S&P 500 Index", cost: 19200, value: 22400 },
  { id: "i2", name: "Bond Fund", cost: 8080, value: 8500 },
  { id: "i3", name: "Tech ETF", cost: 5700, value: 6800 },
  { id: "i4", name: "Real Estate REIT", cost: 5230, value: 4950 },
];
export const defaultBudget = {
  income: [3200, 3200, 850, 0, 0],
  allocations: [
    { cat: "Housing", group: "Fixed", amount: 1800 }, { cat: "Utilities", group: "Fixed", amount: 220 },
    { cat: "Food", group: "Needs", amount: 500 }, { cat: "Transport", group: "Needs", amount: 200 },
    { cat: "Insurance", group: "Fixed", amount: 140 }, { cat: "Health", group: "Needs", amount: 100 },
    { cat: "Entertainment", group: "Wants", amount: 80 }, { cat: "Shopping", group: "Wants", amount: 150 },
    { cat: "Savings", group: "Savings", amount: 600 }, { cat: "Investments", group: "Growth", amount: 800 },
    { cat: "Debt Payments", group: "Fixed", amount: 500 }, { cat: "Personal Care", group: "Wants", amount: 50 },
    { cat: "Education", group: "Growth", amount: 0 }, { cat: "Gifts", group: "Wants", amount: 50 },
  ],
};

export function seedTransactions() {
  const txns = [];
  const cats = [
    { cat: "Housing", sub: "Rent", avg: 1800, freq: 1 }, { cat: "Utilities", sub: "Electric", avg: 140, freq: 1 },
    { cat: "Food", sub: "Groceries", avg: 85, freq: 4 }, { cat: "Food", sub: "Dining Out", avg: 42, freq: 3 },
    { cat: "Transport", sub: "Gas", avg: 52, freq: 3 }, { cat: "Entertainment", sub: "Streaming", avg: 15, freq: 1 },
    { cat: "Health", sub: "Gym", avg: 50, freq: 1 }, { cat: "Shopping", sub: "Clothing", avg: 90, freq: 1 },
    { cat: "Insurance", sub: "Auto", avg: 140, freq: 1 },
  ];
  for (let m = 0; m < 4; m++) {
    txns.push({ id: genId(), date: `2026-${String(m + 1).padStart(2, "0")}-01`, desc: "Salary", category: "Income", account: "Checking", amount: 3200, type: "income" });
    txns.push({ id: genId(), date: `2026-${String(m + 1).padStart(2, "0")}-15`, desc: "Salary", category: "Income", account: "Checking", amount: 3200, type: "income" });
    txns.push({ id: genId(), date: `2026-${String(m + 1).padStart(2, "0")}-20`, desc: "Freelance", category: "Income", account: "Checking", amount: 800 + Math.round(Math.random() * 200), type: "income" });
    cats.forEach(c => {
      for (let f = 0; f < c.freq; f++) {
        txns.push({ id: genId(), date: `2026-${String(m + 1).padStart(2, "0")}-${String(Math.min(28, 3 + f * 7 + Math.floor(Math.random() * 5))).padStart(2, "0")}`, desc: c.sub, category: c.cat, account: Math.random() > 0.3 ? "Checking" : "Credit Card", amount: Math.round(c.avg * (0.8 + Math.random() * 0.4)), type: "expense" });
      }
    });
  }
  return txns.sort((a, b) => a.date.localeCompare(b.date));
}

// ── STYLES ──
export const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: 8,
  border: `1px solid ${C.border}`, background: C.surface, color: C.text,
  fontSize: 13, fontFamily: "inherit", outline: "none",
};
export const selectStyle = { ...inputStyle, cursor: "pointer" };
export const btnPrimary = { padding: "10px 20px", borderRadius: 8, border: "none", background: C.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
export const btnDanger = { ...btnPrimary, background: C.red };
export const btnSmall = { padding: "5px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textMid, fontSize: 11, cursor: "pointer", fontFamily: "inherit" };
export const cardStyle = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", position: "relative", overflow: "hidden" };

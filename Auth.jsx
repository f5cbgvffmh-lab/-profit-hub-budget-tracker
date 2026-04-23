import React, { useState } from "react";
import { C } from "../utils/constants.js";
import { Modal } from "./UI.jsx";

const SECTIONS = [
  {
    icon:"📊", title:"Dashboard",
    when:"Every day — your financial pulse at a glance.",
    desc:"The dashboard is your home base. It shows your total income, expenses, savings rate, and net worth for any time period you choose. The bar chart shows income vs expenses month by month, and the donut chart breaks down where your money is going by category. Check this daily to stay aware of your financial picture.",
    tips:["Switch the time period (Daily → Yearly) to zoom in or out","Green numbers = you're ahead. Red = overspending","Net worth going up month over month = you're winning"]
  },
  {
    icon:"💸", title:"Transactions",
    when:"Every time money moves — income or expense.",
    desc:"This is where you log every dollar in and out. Hit the + button at the bottom right to add a transaction. Tag it to an account (like your Chase card or checking account) and the account balance updates automatically. Use the search bar to find old transactions or filter by category.",
    tips:["Tag every transaction to an account for accurate balances","Income transactions bump your account balance up","Expense transactions pull the balance down automatically","Use descriptions so you remember what each charge was"]
  },
  {
    icon:"📋", title:"Budget",
    when:"Monthly — set it at the start of each month.",
    desc:"The budget page lets you set your income sources and allocate percentages to each spending category. It pulls your actual transactions and shows you Budget vs Actual side by side — so you instantly see where you're over or under. Think of this as your financial blueprint for the month.",
    tips:["Start with your fixed expenses (rent, car, insurance)","Aim to allocate every dollar — zero-based budgeting","Red = over budget. Green = under budget","Update income sources when a new stream starts"]
  },
  {
    icon:"🎯", title:"Savings Goals",
    when:"Whenever you have a target you're saving toward.",
    desc:"Create goals for anything — emergency fund, vacation, new gear, down payment. Each goal tracks how much you've saved vs the target and shows a progress ring. Hit the deposit button to log money going toward a goal. Your savings streak counts consecutive months you've added to goals.",
    tips:["Emergency fund first — 3-6 months of expenses","One goal at a time keeps you focused","The streak counter motivates consistency"]
  },
  {
    icon:"⚔️", title:"Debt Payoff",
    when:"Monthly — review your payoff progress and strategy.",
    desc:"Add all your debts here — credit cards, car loans, student loans. Choose between Snowball (smallest balance first — builds momentum) or Avalanche (highest interest first — saves the most money). The amortization table shows exactly when each debt will be paid off and your debt-free date.",
    tips:["Avalanche saves more money. Snowball feels better psychologically","Add any extra monthly payment to accelerate payoff","Confetti fires when you zero out a debt 🎉","Your debt-free date updates in real time as you pay"]
  },
  {
    icon:"📈", title:"Investments",
    when:"Weekly or monthly — track your portfolio growth.",
    desc:"Log your stocks, ETFs, and crypto here with your cost basis (what you paid) and current price. The app calculates your total gain/loss, return percentage, and how much of your net worth is invested. Great for tracking your path to long-term wealth.",
    tips:["Update current prices periodically to see real gain/loss","Cost basis = what you originally paid per share","Green return = winning. Red = still holding 😅","Your investment total flows into your Net Worth automatically"]
  },
  {
    icon:"💎", title:"Net Worth",
    when:"Monthly — snapshot your overall wealth picture.",
    desc:"Net worth = Assets (accounts + investments) minus Liabilities (debts). This page auto-calculates it and logs monthly snapshots so you can track the trend over time. This is the most important number in personal finance — as long as it goes up month over month, you're building wealth.",
    tips:["Hit 'Take Snapshot' at the start of each month to track the trend","Don't panic at dips — net worth is a long game","Investing grows assets. Paying off debt shrinks liabilities. Both help."]
  },
  {
    icon:"🏦", title:"Accounts",
    when:"Whenever you open a new account or need to check balances.",
    desc:"Track every account you have — checking, savings, credit cards, crypto wallets, investment accounts. Balances update automatically when you log transactions. For credit cards you can set your credit limit and see your utilization percentage. Click into any account to see its transaction history and balance over time.",
    tips:["Credit utilization below 30% is good for your credit score","Transfers between accounts don't count as income or expense","Account health score flags things that need attention","Balance graph shows if an account is trending up or down"]
  },
  {
    icon:"🎨", title:"Customize",
    when:"Whenever you want — make it yours.",
    desc:"Change any color in the app — background, sidebar, cards, accent colors, chart colors. Your theme saves to your account and syncs across all your devices. You can also reset everything back to the default dark theme anytime.",
    tips:["Wipe All Data button is here too — requires double confirmation","Theme saves to Firebase so it follows you everywhere","Try a lighter background for daytime use"]
  },
];

export function OnboardingGuide({ onClose }) {
  const [step, setStep] = useState(0);
  const s = SECTIONS[step];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:13, color:C.textMid, marginBottom:2 }}>How to Use Profit Hub</div>
            <div style={{ fontSize:11, color:C.textDim }}>{step+1} of {SECTIONS.length}</div>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMid, cursor:"pointer", fontSize:20 }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ height:3, background:C.border }}>
          <div style={{ width:`${((step+1)/SECTIONS.length)*100}%`, height:"100%", background:C.accent, transition:"width 0.3s ease" }} />
        </div>

        {/* Content */}
        <div style={{ padding:28 }}>
          <div style={{ fontSize:42, marginBottom:12 }}>{s.icon}</div>
          <div style={{ fontSize:22, fontWeight:700, color:C.text, marginBottom:4 }}>{s.title}</div>
          <div style={{ fontSize:12, color:C.accent, fontWeight:600, marginBottom:16 }}>🕐 {s.when}</div>
          <div style={{ fontSize:14, color:C.textMid, lineHeight:1.7, marginBottom:20 }}>{s.desc}</div>

          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
            <div style={{ fontSize:11, color:C.textDim, fontWeight:600, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Pro Tips</div>
            {s.tips.map((tip,i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:8 }}>
                <span style={{ color:C.accent, fontSize:12, marginTop:2 }}>→</span>
                <span style={{ fontSize:13, color:C.textMid }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding:"16px 28px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} style={{
            padding:"8px 16px", background:C.surface, border:`1px solid ${C.border}`,
            borderRadius:8, color: step===0 ? C.textDim : C.text, cursor: step===0 ? "not-allowed" : "pointer", fontSize:13
          }}>← Back</button>
          <div style={{ flex:1, display:"flex", gap:4, justifyContent:"center" }}>
            {SECTIONS.map((_,i) => (
              <div key={i} onClick={()=>setStep(i)} style={{
                width: i===step ? 20 : 6, height:6, borderRadius:3,
                background: i===step ? C.accent : C.border, cursor:"pointer", transition:"all 0.2s"
              }} />
            ))}
          </div>
          {step < SECTIONS.length-1
            ? <button onClick={()=>setStep(s=>s+1)} style={{ padding:"8px 16px", background:C.accent, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>Next →</button>
            : <button onClick={onClose} style={{ padding:"8px 16px", background:C.green, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>Let's Go! 🚀</button>
          }
        </div>

        {/* Section jump */}
        <div style={{ padding:"0 28px 20px", display:"flex", flexWrap:"wrap", gap:6 }}>
          {SECTIONS.map((s2,i) => (
            <button key={i} onClick={()=>setStep(i)} style={{
              padding:"3px 8px", borderRadius:20, border:`1px solid ${i===step?C.accent:C.border}`,
              background:"transparent", color: i===step ? C.accent : C.textDim, cursor:"pointer", fontSize:11
            }}>{s2.icon} {s2.title}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

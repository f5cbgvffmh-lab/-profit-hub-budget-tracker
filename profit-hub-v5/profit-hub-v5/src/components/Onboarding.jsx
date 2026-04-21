import React, { useState } from "react";
import { C, btnPrimary } from "../utils/constants.js";

const GUIDE_STEPS = [
  {
    icon: "◆",
    title: "Dashboard",
    desc: "Your financial command center. See income, expenses, savings rate, investments, and net worth at a glance. The sparkline charts track your real data month to month — green means trending up, red means down. The spending pulse beats faster on heavy spending days.",
    tip: "If you're a daily tracker, use the Daily view to see exactly what happened today. For a bigger picture, switch to Monthly or Yearly."
  },
  {
    icon: "⟷",
    title: "Transactions",
    desc: "Every dollar in and out goes here. Log your income, bills, groceries, subscriptions — everything. Each transaction automatically feeds into your Dashboard, Budget, and Net Worth. Use the search bar to find specific entries.",
    tip: "Use the floating + button in the bottom right to quickly add transactions from any page."
  },
  {
    icon: "◎",
    title: "Budget",
    desc: "Set your monthly income and allocate amounts to each spending category. The Budget vs Actual view shows what you planned vs what you actually spent — pulled directly from your transactions. Green means under budget, red means over.",
    tip: "Start with your fixed expenses (rent, insurance) then allocate the rest. Aim to budget every dollar."
  },
  {
    icon: "◈",
    title: "Savings Goals",
    desc: "Create goals for anything — emergency fund, vacation, new car. Track how much you've saved with donut charts that fill up as you get closer. Hit the Deposit button to add money toward a goal.",
    tip: "Set realistic targets and make small, consistent deposits. You'll unlock achievement badges as you hit milestones!"
  },
  {
    icon: "▽",
    title: "Debt Payoff",
    desc: "Enter all your debts and the app recommends whether Snowball (smallest balance first) or Avalanche (highest interest first) is better for your situation. The amortization table shows exactly when each debt gets paid off, month by month.",
    tip: "Even $50 extra per month can shave years off your debt. Use the Extra Payment field to see the impact."
  },
  {
    icon: "△",
    title: "Investments",
    desc: "Track your portfolio — stocks, funds, crypto, whatever. Enter what you paid (cost basis) and what it's worth now. The app calculates your gain/loss and return percentage for each holding.",
    tip: "Update your investment values monthly to keep your net worth accurate."
  },
  {
    icon: "◇",
    title: "Net Worth",
    desc: "The big picture. Net Worth = Your Account Balances + Cash Flow from Transactions + Investment Values - Debt Balances. This updates live with every transaction you log. Save monthly snapshots to track your progress over time.",
    tip: "This is the most important number in personal finance. Watch it grow!"
  },
  {
    icon: "▣",
    title: "Accounts",
    desc: "Add your bank accounts, credit cards, and cash balances. These represent your starting position when you first set up the app. Your transactions then track all the movement from that point forward.",
    tip: "Enter your actual current balances when you first set up — this is your financial starting line."
  },
  {
    icon: "🏆",
    title: "Achievements",
    desc: "Unlock badges by hitting milestones — log your first transaction, reach 50% on a savings goal, pay off a debt, hit $10K net worth, and more. Confetti celebrates your wins!",
    tip: "Check back often to see which badges you're close to unlocking."
  },
];

export function OnboardingGuide({ onClose }) {
  const [step, setStep] = useState(0);
  const s = GUIDE_STEPS[step];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "90%", maxWidth: 520, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "32px 28px", animation: "modalIn 0.3s ease" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            {step === 0 ? "Welcome to Profit Hub" : `${step + 1} of ${GUIDE_STEPS.length}`}
          </div>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.accentDim, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 12 }}>
            {s.icon}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0 }}>{s.title}</h2>
        </div>

        {/* Content */}
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>{s.desc}</div>
        <div style={{ padding: "12px 16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.amber, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>💡 Pro Tip</div>
          <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{s.tip}</div>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {GUIDE_STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? C.accent : C.border, cursor: "pointer",
              transition: "all 0.2s ease"
            }} />
          ))}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : onClose()} style={{
            padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.border}`,
            background: "transparent", color: C.textMid, fontSize: 13, cursor: "pointer", fontFamily: "inherit"
          }}>{step === 0 ? "Skip" : "Back"}</button>
          <button onClick={() => step < GUIDE_STEPS.length - 1 ? setStep(step + 1) : onClose()} style={btnPrimary}>
            {step === GUIDE_STEPS.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

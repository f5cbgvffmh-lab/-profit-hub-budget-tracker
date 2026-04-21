import React from "react";
import { C, MONTHS, fmt, pct, cardStyle, btnSmall, CAT_COLORS, getTodayQuote, getSpendingInsights } from "../utils/constants.js";
import { Spark, ProgressBar, SpendingPulse } from "../components/UI.jsx";

export function DashboardPage({ filtered, income, expenses, savings, monthlyInc, monthlyExp, monthlySavings, monthlyNW, totalInvested, netWorth, catEntries, streak, pulseRate, challenge, insights, setPage }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Quote */}
      <div style={{ padding: "10px 16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 11, color: C.textMid, fontStyle: "italic" }}>
        💡 {getTodayQuote()}
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {insights.map((ins, i) => (
            <div key={i} style={{ padding: "8px 14px", borderRadius: 8, background: ins.type === "good" ? C.greenDim : C.amberDim, border: `1px solid ${ins.type === "good" ? C.green : C.amber}33`, fontSize: 11, color: ins.type === "good" ? C.green : C.amber }}>
              {ins.type === "good" ? "📈" : "⚠️"} {ins.text}
            </div>
          ))}
        </div>
      )}

      {/* Challenge */}
      {challenge && (
        <div style={{ ...cardStyle, padding: "14px 18px", borderLeft: `3px solid ${C.amber}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: C.amber, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>🎯 Monthly Challenge</div>
              <div style={{ fontSize: 12, color: C.text }}>{challenge.message}</div>
            </div>
            <div style={{ width: 60 }}>
              <ProgressBar value={challenge.current} max={challenge.target} color={challenge.current > challenge.target ? C.red : C.green} h={6} />
              <div style={{ fontSize: 9, color: C.textDim, textAlign: "right", marginTop: 2 }}>{fmt(challenge.current)}/{fmt(challenge.target)}</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {[
          { label: "Income", value: fmt(income), color: C.green, spark: monthlyInc },
          { label: "Expenses", value: fmt(expenses), color: C.red, spark: monthlyExp },
          { label: "Savings", value: income === 0 ? "0%" : pct(savings / income), color: C.cyan, spark: monthlySavings },
          { label: "Invested", value: fmt(totalInvested), color: C.purple, spark: [totalInvested] },
          { label: "Net Worth", value: fmt(netWorth), color: C.amber, spark: monthlyNW },
        ].map((k, i) => (
          <div key={i} style={{ ...cardStyle, padding: "14px 16px" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: k.color, opacity: 0.5 }} />
            <div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{k.label}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</div>
              <Spark data={k.spark.length > 1 ? k.spark : [0, 0]} color="auto" w={60} h={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Income vs Expenses</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: C.green }} /><span style={{ fontSize: 10, color: C.textMid }}>Income</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: C.red }} /><span style={{ fontSize: 10, color: C.textMid }}>Expenses</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 130 }}>
            {monthlyInc.map((inc, i) => {
              const mx = Math.max(...monthlyInc, ...monthlyExp, 1);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ display: "flex", gap: 1, alignItems: "flex-end", height: 106 }}>
                    <div style={{ width: 10, borderRadius: "3px 3px 0 0", height: `${Math.max((inc / mx) * 96, 2)}px`, background: C.green, transition: "height 0.5s" }} />
                    <div style={{ width: 10, borderRadius: "3px 3px 0 0", height: `${Math.max((monthlyExp[i] / mx) * 96, 2)}px`, background: C.red, transition: "height 0.5s" }} />
                  </div>
                  <span style={{ fontSize: 9, color: C.textDim }}>{MONTHS[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Expense Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {catEntries.slice(0, 7).map(([cat, amt], i) => (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10.5, color: C.textMid }}>{cat}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600 }}>{fmt(amt)}</span>
                </div>
                <ProgressBar value={amt} max={catEntries[0]?.[1] || 1} color={CAT_COLORS[i % CAT_COLORS.length]} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Recent Transactions</span>
          <button onClick={() => setPage("transactions")} style={btnSmall}>View All</button>
        </div>
        {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map(t => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}22` }}>
            <div><div style={{ fontSize: 11.5, fontWeight: 500 }}>{t.desc}</div><div style={{ fontSize: 9, color: C.textDim }}>{t.date} • {t.category}</div></div>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.type === "income" ? C.green : C.red }}>{t.type === "income" ? "+" : "-"}{fmt(t.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

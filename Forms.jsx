import React from "react";
import { C, fmt, fmtShort, MONTHS, getCatBreakdown, getMonthlyData, getSpendingInsights, filterTxns, QUOTES } from "../utils/constants.js";
import { KpiCard, SectionCard, BarChart, DonutChart, PeriodTabs, Sparkline } from "../components/UI.jsx";

const CAT_COLORS = [C.chart1,C.chart2,C.chart3,C.chart4,C.chart5,C.chart6,C.chart7,C.chart8];

export function DashboardPage({ txns=[], accounts=[], investments=[], debts=[], goals=[], period, setPeriod, loading }) {
  const filtered = filterTxns(txns, period);
  const income = filtered.filter(t=>t.type==="income").reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const expenses = filtered.filter(t=>t.type==="expense").reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const net = income - expenses;
  const savingsRate = income > 0 ? Math.round((net/income)*100) : 0;

  const totalAssets = accounts.filter(a=>a.balance>0).reduce((s,a)=>s+(parseFloat(a.balance)||0),0)
    + investments.reduce((s,i)=>s+(parseFloat(i.shares||0)*parseFloat(i.currentPrice||0)),0);
  const totalDebts = debts.reduce((s,d)=>s+(parseFloat(d.balance)||0),0)
    + accounts.filter(a=>a.balance<0).reduce((s,a)=>s+Math.abs(parseFloat(a.balance)||0),0);
  const netWorth = totalAssets - totalDebts;

  const monthlyData = getMonthlyData(txns);
  const catBreakdown = getCatBreakdown(filtered);
  const insights = getSpendingInsights(txns);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const recentTxns = [...txns].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);

  const grid4 = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 };
  const grid2 = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Quote */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 18px", borderLeft:`3px solid ${C.accent}` }}>
        <div style={{ fontSize:12, color:C.textMid, fontStyle:"italic" }}>💡 {quote}</div>
      </div>

      {/* Period picker */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Financial Overview</div>
        <PeriodTabs value={period} onChange={setPeriod} />
      </div>

      {/* Insights banner */}
      {insights.diff !== 0 && (
        <div style={{
          background: insights.diff > 0 ? C.red+"18" : C.green+"18",
          border:`1px solid ${insights.diff>0?C.red:C.green}44`,
          borderRadius:10, padding:"10px 16px", fontSize:13,
          color: insights.diff > 0 ? C.red : C.green
        }}>
          {insights.diff > 0
            ? `⚠️ You've spent ${insights.diff}% more than last month ($${Math.round(insights.thisTotal)} vs $${Math.round(insights.lastTotal)})`
            : `✅ You've spent ${Math.abs(insights.diff)}% less than last month — great discipline!`
          }
        </div>
      )}

      {/* KPIs */}
      <div style={grid4}>
        <KpiCard label="Income" value={fmtShort(income)} icon="💚" color={C.green} loading={loading} sub={`${period} total`} />
        <KpiCard label="Expenses" value={fmtShort(expenses)} icon="🔴" color={C.red} loading={loading} sub={`${period} total`} />
        <KpiCard label="Savings Rate" value={`${savingsRate}%`} icon="🎯" color={savingsRate>20?C.green:savingsRate>0?C.amber:C.red} loading={loading} sub={net>=0?`+${fmt(net)} saved`:`${fmt(Math.abs(net))} deficit`} />
        <KpiCard label="Net Worth" value={fmtShort(netWorth)} icon="💎" color={netWorth>=0?C.accent:C.red} loading={loading} sub={`${totalDebts>0?fmt(totalDebts)+' in debts':''}`} />
      </div>

      {/* Charts */}
      <div style={grid2}>
        <SectionCard title="Income vs Expenses">
          <div style={{ overflowX:"auto" }}>
            <BarChart data={monthlyData} width={340} height={140} />
            <div style={{ display:"flex", gap:16, marginTop:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textMid }}><div style={{ width:10, height:10, background:C.green, borderRadius:2 }} />Income</div>
              <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textMid }}><div style={{ width:10, height:10, background:C.red, borderRadius:2 }} />Expenses</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Spending by Category">
          {catBreakdown.length === 0
            ? <div style={{ color:C.textDim, fontSize:13, textAlign:"center", padding:20 }}>No expenses yet</div>
            : <div style={{ display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
                <DonutChart segments={catBreakdown.slice(0,8).map((c,i)=>({value:c.amt,color:CAT_COLORS[i%CAT_COLORS.length]}))} size={100} thickness={16} />
                <div style={{ flex:1, minWidth:120 }}>
                  {catBreakdown.slice(0,6).map((c,i)=>(
                    <div key={c.cat} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:CAT_COLORS[i%CAT_COLORS.length] }} />
                        <span style={{ fontSize:11, color:C.textMid }}>{c.cat}</span>
                      </div>
                      <span style={{ fontSize:11, color:C.text, fontWeight:600 }}>{fmt(c.amt,0)}</span>
                    </div>
                  ))}
                </div>
              </div>
          }
        </SectionCard>
      </div>

      {/* Account balances summary */}
      <SectionCard title="Account Balances">
        {accounts.length === 0
          ? <div style={{ color:C.textDim, fontSize:13, textAlign:"center", padding:20 }}>No accounts yet</div>
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
              {accounts.map(a => (
                <div key={a.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{a.icon}</div>
                  <div style={{ fontSize:11, color:C.textMid, marginBottom:2 }}>{a.name}</div>
                  <div style={{ fontSize:15, fontWeight:700, color: parseFloat(a.balance)<0?C.red:C.text }}>{fmt(a.balance)}</div>
                </div>
              ))}
            </div>
        }
      </SectionCard>

      {/* Recent transactions */}
      <SectionCard title="Recent Transactions">
        {recentTxns.length === 0
          ? <div style={{ color:C.textDim, fontSize:13, textAlign:"center", padding:20 }}>No transactions yet — hit + to add one</div>
          : recentTxns.map(t => (
              <div key={t.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:13, color:C.text }}>{t.description||t.category}</div>
                  <div style={{ fontSize:11, color:C.textMid }}>{t.category} · {t.date}</div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:t.type==="income"?C.green:C.red }}>
                  {t.type==="income"?"+":"-"}{fmt(t.amount)}
                </div>
              </div>
            ))
        }
      </SectionCard>
    </div>
  );
}

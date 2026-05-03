import React, { useState, useMemo } from "react";
import { C, fmt, fmtShort, getCatBreakdown, getMonthlyData, filterTxnsByMonthAndPeriod, getAvailableMonths, calcIncome, calcExpenses, QUOTES, MONTHS } from "../utils/constants.js";
import { KpiCard, SectionCard, BarChart, DonutChart } from "../components/UI.jsx";

const CAT_COLORS = [C.chart1,C.chart2,C.chart3,C.chart4,C.chart5,C.chart6,C.chart7,C.chart8];

const SUB_PERIODS = [
  { value:"daily", label:"Daily" },
  { value:"weekly", label:"Weekly" },
  { value:"biweekly", label:"Biweekly" },
  { value:"monthly", label:"Full Month" },
  { value:"semiannual", label:"Semi-Annual" },
  { value:"yearly", label:"Yearly" },
];

function MonthTabs({ selected, onChange }) {
  const months = getAvailableMonths();
  return (
    <div style={{ overflowX:"auto", paddingBottom:4 }}>
      <div style={{ display:"flex", gap:4, minWidth:"max-content" }}>
        {months.map(m => {
          const active = selected.year===m.year && selected.month===m.month;
          return (
            <button key={`${m.year}-${m.month}`} onClick={()=>onChange(m)} style={{
              padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12,
              background: active ? C.accent : C.surface,
              color: active ? "#fff" : m.isCurrent ? C.text : C.textMid,
              fontWeight: active ? 700 : m.isCurrent ? 600 : 400,
              outline: m.isCurrent && !active ? `1px solid ${C.border}` : "none",
              whiteSpace:"nowrap"
            }}>
              {m.label}{m.isCurrent ? " ★" : ` '${m.yearShort}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubPeriodFilter({ value, onChange, disabled }) {
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
      <span style={{ fontSize:11, color:C.textDim, marginRight:2 }}>Filter:</span>
      {SUB_PERIODS.map(p => {
        const off = disabled && p.value!=="monthly";
        return (
          <button key={p.value} onClick={()=>!off&&onChange(p.value)} style={{
            padding:"4px 10px", borderRadius:20, border:"none", cursor:off?"not-allowed":"pointer",
            fontSize:11, background:value===p.value?C.accent:C.surface,
            color:value===p.value?"#fff":off?C.textDim:C.textMid,
            fontWeight:value===p.value?600:400, opacity:off?0.4:1
          }}>{p.label}</button>
        );
      })}
      {disabled && <span style={{ fontSize:10, color:C.textDim }}>· sub-filters apply to current month only</span>}
    </div>
  );
}

export function DashboardPage({ txns=[], accounts=[], investments=[], debts=[], goals=[], loading }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState({
    year:now.getFullYear(), month:now.getMonth(),
    label:MONTHS[now.getMonth()], yearShort:now.getFullYear().toString().slice(2), isCurrent:true
  });
  const [subPeriod, setSubPeriod] = useState("monthly");
  const isCurrentMonth = selectedMonth.year===now.getFullYear() && selectedMonth.month===now.getMonth();

  const filtered = useMemo(() =>
    filterTxnsByMonthAndPeriod(txns, selectedMonth.year, selectedMonth.month, subPeriod),
    [txns, selectedMonth, subPeriod]
  );

  // Exclude transfers from all financial calculations
  const income = useMemo(() => calcIncome(filtered), [filtered]);
  const expenses = useMemo(() => calcExpenses(filtered), [filtered]);
  const net = income - expenses;
  const savingsRate = income > 0 ? Math.round((net/income)*100) : 0;

  const totalAssets = accounts.filter(a=>a.balance>0).reduce((s,a)=>s+(parseFloat(a.balance)||0),0)
    + investments.reduce((s,i)=>s+(parseFloat(i.shares||0)*parseFloat(i.currentPrice||0)),0);
  const totalDebts = debts.reduce((s,d)=>s+(parseFloat(d.balance)||0),0)
    + accounts.filter(a=>a.balance<0).reduce((s,a)=>s+Math.abs(parseFloat(a.balance)||0),0);
  const netWorth = totalAssets - totalDebts;

  const monthlyData = useMemo(() => getMonthlyData(txns), [txns]);
  const catBreakdown = useMemo(() => getCatBreakdown(filtered), [filtered]);

  const insights = useMemo(() => {
    const prev = selectedMonth.month===0
      ? { year:selectedMonth.year-1, month:11 }
      : { year:selectedMonth.year, month:selectedMonth.month-1 };
    const prevTxns = filterTxnsByMonthAndPeriod(txns, prev.year, prev.month, "monthly");
    const thisTotal = calcExpenses(filtered);
    const lastTotal = calcExpenses(prevTxns);
    return { thisTotal, lastTotal, diff: Math.round(lastTotal>0?((thisTotal-lastTotal)/lastTotal)*100:0) };
  }, [filtered, txns, selectedMonth]);

  const recentTxns = useMemo(() =>
    [...filtered].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5),
    [filtered]
  );

  const quote = QUOTES[now.getDay()%QUOTES.length];
  const periodLabel = subPeriod==="monthly"
    ? `${selectedMonth.label} ${selectedMonth.year}`
    : `${SUB_PERIODS.find(p=>p.value===subPeriod)?.label} · ${selectedMonth.label} ${selectedMonth.year}`;

  const grid4 = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:12 };
  const grid2 = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Quote */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px", borderLeft:`3px solid ${C.accent}` }}>
        <div style={{ fontSize:12, color:C.textMid, fontStyle:"italic" }}>💡 {quote}</div>
      </div>

      {/* Month tabs + sub-period */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ fontSize:12, fontWeight:600, color:C.textMid, textTransform:"uppercase", letterSpacing:1 }}>📅 Month</div>
        <MonthTabs selected={selectedMonth} onChange={m=>{ setSelectedMonth(m); if(!m.isCurrent) setSubPeriod("monthly"); }} />
        <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
          <SubPeriodFilter value={subPeriod} onChange={setSubPeriod} disabled={!isCurrentMonth} />
        </div>
      </div>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Overview — {periodLabel}</div>
        {!isCurrentMonth && (
          <div style={{ fontSize:11, color:C.amber, background:C.amber+"18", padding:"3px 10px", borderRadius:20, border:`1px solid ${C.amber}33` }}>Historical</div>
        )}
      </div>

      {/* Insight banner */}
      {insights.diff!==0 && insights.lastTotal>0 && (
        <div style={{
          background:insights.diff>0?C.red+"18":C.green+"18",
          border:`1px solid ${insights.diff>0?C.red:C.green}44`,
          borderRadius:10, padding:"10px 16px", fontSize:13,
          color:insights.diff>0?C.red:C.green
        }}>
          {insights.diff>0
            ? `⚠️ Spent ${insights.diff}% more than previous month ($${Math.round(insights.thisTotal)} vs $${Math.round(insights.lastTotal)})`
            : `✅ Spent ${Math.abs(insights.diff)}% less than previous month — great discipline!`}
        </div>
      )}

      {/* KPIs */}
      <div style={grid4}>
        <KpiCard label="Income" value={fmtShort(income)} icon="💚" color={C.green} loading={loading} sub={periodLabel} />
        <KpiCard label="Expenses" value={fmtShort(expenses)} icon="🔴" color={C.red} loading={loading} sub={periodLabel} />
        <KpiCard label="Savings Rate" value={`${savingsRate}%`} icon="🎯"
          color={savingsRate>20?C.green:savingsRate>0?C.amber:C.red} loading={loading}
          sub={net>=0?`+${fmt(net)} saved`:`${fmt(Math.abs(net))} deficit`} />
        <KpiCard label="Net Worth" value={fmtShort(netWorth)} icon="💎"
          color={netWorth>=0?C.accent:C.red} loading={loading} sub="all accounts" />
      </div>

      {/* Charts */}
      <div style={grid2}>
        <SectionCard title="12-Month Income vs Expenses">
          <div style={{ overflowX:"auto" }}>
            <BarChart data={monthlyData} width={340} height={140} />
            <div style={{ display:"flex", gap:16, marginTop:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textMid }}>
                <div style={{ width:10, height:10, background:C.green, borderRadius:2 }} />Income
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.textMid }}>
                <div style={{ width:10, height:10, background:C.red, borderRadius:2 }} />Expenses
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={`Spending — ${periodLabel}`}>
          {catBreakdown.length===0
            ? <div style={{ color:C.textDim, fontSize:13, textAlign:"center", padding:20 }}>No expenses for this period</div>
            : <div style={{ display:"flex", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
                <DonutChart segments={catBreakdown.slice(0,8).map((c,i)=>({value:c.amt,color:CAT_COLORS[i%8]}))} size={100} thickness={16} />
                <div style={{ flex:1, minWidth:120 }}>
                  {catBreakdown.slice(0,6).map((c,i)=>(
                    <div key={c.cat} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background:CAT_COLORS[i%8] }} />
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

      {/* Account balances */}
      <SectionCard title="Account Balances">
        {accounts.length===0
          ? <div style={{ color:C.textDim, fontSize:13, textAlign:"center", padding:20 }}>No accounts yet</div>
          : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
              {accounts.map(a=>(
                <div key={a.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:18, marginBottom:4 }}>{a.icon}</div>
                  <div style={{ fontSize:11, color:C.textMid, marginBottom:2 }}>{a.name}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:parseFloat(a.balance)<0?C.red:C.text }}>{fmt(a.balance)}</div>
                </div>
              ))}
            </div>
        }
      </SectionCard>

      {/* Recent transactions */}
      <SectionCard title={`Recent Transactions — ${periodLabel}`}>
        {recentTxns.length===0
          ? <div style={{ color:C.textDim, fontSize:13, textAlign:"center", padding:20 }}>No transactions for this period</div>
          : recentTxns.map(t=>(
              <div key={t.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <div>
                  <div style={{ fontSize:13, color:C.text }}>{t.description||t.category}</div>
                  <div style={{ fontSize:11, color:C.textMid }}>
                    {t.type==="transfer" ? "🔄 Transfer" : t.category} · {t.date}
                  </div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:t.type==="income"?C.green:t.type==="transfer"?C.cyan:C.red }}>
                  {t.type==="income"?"+":t.type==="transfer"?"↔":"-"}{fmt(t.amount)}
                </div>
              </div>
            ))
        }
      </SectionCard>
    </div>
  );
}

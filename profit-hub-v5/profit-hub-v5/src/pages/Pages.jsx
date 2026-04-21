import React, { useState } from "react";
import { C, MONTHS, MONTH_FULL, BADGES, fmt, pct, cardStyle, btnPrimary, btnDanger, btnSmall, inputStyle, CAT_COLORS, getAmortization, getDebtRec } from "../utils/constants.js";
import { Donut, ProgressBar, Spark, NumInput, Modal, ConfirmDialog } from "../components/UI.jsx";
import { TxnForm, GoalForm, DepositForm, DebtForm, InvForm, AcctForm } from "../components/Forms.jsx";

// ── TRANSACTIONS ──
export function TransactionsPage({ filtered, accounts, saveTxn, deleteTxn }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [confirmDel, setConfirmDel] = useState(null);

  const cats = ["All", ...new Set(filtered.map(t => t.category))];
  const displayed = filtered.filter(t => {
    if (search && !t.desc.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== "All" && t.category !== filterCat) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Transactions ({displayed.length})</span>
        <button onClick={() => { setEditItem(null); setShowModal(true); }} style={btnPrimary}>+ Add</button>
      </div>
      {/* Search & Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, maxWidth: 200 }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...inputStyle, maxWidth: 150, cursor: "pointer" }}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ maxHeight: 500, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {["Date", "Description", "Category", "Account", "Amount", ""].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "7px 8px", color: C.textDim, fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8, position: "sticky", top: 0, background: C.card }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{displayed.map(t => (
            <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}15`, cursor: "pointer" }} onClick={() => { setEditItem(t); setShowModal(true); }}>
              <td style={{ padding: "7px 8px", color: C.textMid }}>{t.date}</td>
              <td style={{ padding: "7px 8px" }}>{t.desc}</td>
              <td style={{ padding: "7px 8px" }}><span style={{ padding: "2px 8px", borderRadius: 4, background: t.type === "income" ? C.greenDim : C.accentDim, color: t.type === "income" ? C.green : C.accent, fontSize: 10 }}>{t.category}</span></td>
              <td style={{ padding: "7px 8px", color: C.textMid }}>{t.account}</td>
              <td style={{ padding: "7px 8px", fontWeight: 600, color: t.type === "income" ? C.green : C.red }}>{t.type === "income" ? "+" : "-"}{fmt(t.amount)}</td>
              <td style={{ padding: "7px 8px" }}><button onClick={e => { e.stopPropagation(); setConfirmDel(t.id); }} style={{ ...btnSmall, color: C.red, borderColor: C.red + "44", fontSize: 10 }}>✕</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? "Edit Transaction" : "Add Transaction"}>
        <TxnForm initial={editItem} onSave={d => { saveTxn(d); setShowModal(false); setEditItem(null); }} onDelete={editItem ? () => deleteTxn(editItem.id) : null} onConfirmDelete={() => setConfirmDel(editItem?.id)} accounts={accounts} />
      </Modal>
      <ConfirmDialog open={!!confirmDel} message="Delete this transaction?" onConfirm={() => { deleteTxn(confirmDel); setConfirmDel(null); setShowModal(false); setEditItem(null); }} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}

// ── BUDGET ──
export function BudgetPage({ budget, updateBudget, month, year, transactions, budgetIncome, budgetTotal }) {
  const getBudgetActual = (cat) => transactions.filter(t => { const d = new Date(t.date); return d.getFullYear() === year && d.getMonth() === month && t.type === "expense" && t.category === cat; }).reduce((s, t) => s + t.amount, 0);
  const totalActual = (budget.allocations || []).reduce((s, a) => s + getBudgetActual(a.cat), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {[{ l: "Total Income", v: fmt(budgetIncome), c: C.green }, { l: "Budgeted", v: fmt(budgetTotal), c: C.accent }, { l: "Remaining", v: fmt(budgetIncome - budgetTotal), c: budgetIncome - budgetTotal >= 0 ? C.green : C.red }].map((k, i) => (
          <div key={i} style={{ ...cardStyle, textAlign: "center" }}><div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{k.l}</div><div style={{ fontSize: 22, fontWeight: 700, color: k.c }}>{k.v}</div></div>
        ))}
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Income Sources</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
          {["Paycheck 1", "Paycheck 2", "Side Income", "Bonus", "Other"].map((lbl, i) => (
            <div key={i}><div style={{ fontSize: 10, color: C.textDim, marginBottom: 3 }}>{lbl}</div>
              <NumInput value={(budget.income || [])[i] || 0} onChange={e => { const v = [...(budget.income || [])]; v[i] = Number(e.target.value) || 0; updateBudget({ ...budget, income: v }); }} style={{ ...inputStyle, textAlign: "center", fontSize: 13, fontWeight: 600, color: C.green }} />
            </div>
          ))}
        </div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Budget vs Actual — {MONTH_FULL[month] || "All"}</div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", gap: "6px 10px", alignItems: "center", minWidth: 500 }}>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>CATEGORY</div>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>BUDGETED</div>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>ACTUAL</div>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>LEFT</div>
            <div style={{ fontSize: 10, color: C.textDim, fontWeight: 600 }}>STATUS</div>
            {(budget.allocations || []).map((a, i) => {
              const actual = getBudgetActual(a.cat);
              const rem = a.amount - actual;
              const over = actual > a.amount && a.amount > 0;
              return (
                <React.Fragment key={i}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{a.cat}</div>
                  <NumInput value={a.amount} onChange={e => { const al = [...(budget.allocations || [])]; al[i] = { ...al[i], amount: Number(e.target.value) || 0 }; updateBudget({ ...budget, allocations: al }); }} style={{ ...inputStyle, textAlign: "right", padding: "5px 8px", fontSize: 12, color: C.accent }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: actual > 0 ? C.red : C.textDim }}>{fmt(actual)}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: rem >= 0 ? C.green : C.red }}>{rem >= 0 ? "" : "-"}{fmt(rem)}</div>
                  <div>{a.amount > 0 && <ProgressBar value={actual} max={a.amount} color={over ? C.red : actual > a.amount * 0.75 ? C.amber : C.green} h={5} />}</div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 80px", gap: "6px 10px", borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>TOTAL</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>{fmt(budgetTotal)}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.red }}>{fmt(totalActual)}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: budgetTotal - totalActual >= 0 ? C.green : C.red }}>{fmt(budgetTotal - totalActual)}</div>
          <div />
        </div>
      </div>
    </div>
  );
}

// ── SAVINGS ──
export function SavingsPage({ goals, saveGoal, deleteGoal, depositToGoal }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositItem, setDepositItem] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={() => { setEditItem(null); setShowModal(true); }} style={btnPrimary}>+ Add Goal</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {goals.map(g => (
          <div key={g.id} style={{ ...cardStyle, cursor: "pointer" }} onClick={() => { setEditItem(g); setShowModal(true); }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Donut value={g.saved} max={g.goal} color={g.color} size={80} stroke={8} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{g.name}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: g.color }}>{g.goal === 0 ? "-" : Math.round(g.saved / g.goal * 100)}%</div>
                <div style={{ fontSize: 10, color: C.textDim }}>{fmt(g.saved)} of {fmt(g.goal)}</div>
                <div style={{ fontSize: 10, color: C.textMid, marginTop: 2 }}>{fmt(Math.max(g.goal - g.saved, 0))} left</div>
              </div>
              <button onClick={e => { e.stopPropagation(); setDepositItem(g); setShowDeposit(true); }} style={{ ...btnSmall, color: C.green, borderColor: C.green + "66" }}>+ Deposit</button>
            </div>
          </div>
        ))}
      </div>
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? "Edit Goal" : "Add Goal"}>
        <GoalForm initial={editItem} onSave={d => { saveGoal(d); setShowModal(false); setEditItem(null); }} onDelete={editItem ? () => deleteGoal(editItem.id) : null} onConfirmDelete={() => setConfirmDel(editItem?.id)} />
      </Modal>
      <Modal open={showDeposit} onClose={() => { setShowDeposit(false); setDepositItem(null); }} title={`Deposit to ${depositItem?.name || ""}`}>
        <DepositForm goal={depositItem} onDeposit={(id, amt) => { depositToGoal(id, amt); setShowDeposit(false); setDepositItem(null); }} />
      </Modal>
      <ConfirmDialog open={!!confirmDel} message="Delete this goal?" onConfirm={() => { deleteGoal(confirmDel); setConfirmDel(null); setShowModal(false); setEditItem(null); }} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}

// ── DEBT ──
export function DebtPage({ debts, sortedDebts, debtStrategy, setDebtStrategy, extraPay, setExtraPay, totalDebt, saveDebt, deleteDebt, updatePrefs, showConfetti }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const debtRec = getDebtRec(debts, extraPay);
  const amort = getAmortization(sortedDebts, extraPay);
  const debtFreeDate = new Date();
  debtFreeDate.setMonth(debtFreeDate.getMonth() + amort.length);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {debtRec && <div style={{ ...cardStyle, borderLeft: `3px solid ${debtRec.rec === "snowball" ? C.cyan : C.amber}`, padding: "14px 18px" }}><div style={{ fontSize: 11, fontWeight: 600, color: debtRec.rec === "snowball" ? C.cyan : C.amber, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>💡 Recommendation</div><div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>{debtRec.reason}</div></div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <div style={{ ...cardStyle, textAlign: "center" }}><div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Total Debt</div><div style={{ fontSize: 20, fontWeight: 700, color: C.red }}>{fmt(totalDebt)}</div></div>
        <div style={{ ...cardStyle, textAlign: "center" }}><div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Debt Free By</div><div style={{ fontSize: 16, fontWeight: 700, color: C.green }}>{amort.length > 0 ? debtFreeDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A"}</div></div>
        <div style={{ ...cardStyle, textAlign: "center" }}><div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Extra Payment</div><NumInput value={extraPay} onChange={e => { const v = Number(e.target.value) || 0; setExtraPay(v); updatePrefs({ extraPay: v, debtStrategy }); }} style={{ ...inputStyle, textAlign: "center", fontSize: 18, fontWeight: 700, color: C.cyan, border: "none", background: "transparent", width: 100, padding: 0 }} /></div>
        <div style={{ ...cardStyle, textAlign: "center" }}><div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>Strategy</div><div style={{ display: "flex", gap: 4, justifyContent: "center" }}>{["snowball", "avalanche"].map(s => <button key={s} onClick={() => { setDebtStrategy(s); updatePrefs({ extraPay, debtStrategy: s }); }} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${debtStrategy === s ? C.accent : C.border}`, background: debtStrategy === s ? C.accentDim : "transparent", color: debtStrategy === s ? C.accent : C.textMid, fontSize: 10.5, fontWeight: debtStrategy === s ? 600 : 400, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{s}</button>)}</div></div>
      </div>

      {/* Thermometer */}
      <div style={cardStyle}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Payoff Progress</div><div style={{ height: 24, borderRadius: 12, background: C.border, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 12, background: `linear-gradient(90deg, ${C.green}, ${C.cyan})`, width: `${totalDebt > 0 ? Math.max(5, 100 - ((totalDebt / (totalDebt + 10000)) * 100)) : 100}%`, transition: "width 1s ease" }} /></div><div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: C.textDim }}><span>Debt: {fmt(totalDebt)}</span><span>🎉 Debt Free</span></div></div>

      {/* Payoff order */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Payoff Order</span>
          <button onClick={() => { setEditItem(null); setShowModal(true); }} style={btnPrimary}>+ Add Debt</button>
        </div>
        {sortedDebts.map((d, i) => (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderBottom: i < sortedDebts.length - 1 ? `1px solid ${C.border}22` : "none", cursor: "pointer" }} onClick={() => { setEditItem(d); setShowModal(true); }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: i === 0 ? C.accentDim : `${C.border}44`, color: i === 0 ? C.accent : C.textDim, fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{d.name}</div><div style={{ fontSize: 10, color: C.textDim }}>{d.rate}% APR</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 600, color: C.red }}>{fmt(d.balance)}</div><div style={{ fontSize: 10, color: i === 0 ? C.accent : C.textDim }}>{fmt(i === 0 ? d.minPay + extraPay : d.minPay)}/mo{i === 0 && <span style={{ color: C.green, marginLeft: 4 }}>+{fmt(extraPay)}</span>}</div></div>
          </div>
        ))}
      </div>

      {/* Amortization */}
      {amort.length > 0 && <div style={cardStyle}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Amortization (First 24 Months)</div><div style={{ maxHeight: 400, overflowY: "auto", overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 400 }}><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}><th style={{ padding: "6px 8px", color: C.textDim, fontWeight: 500, fontSize: 10, textAlign: "left" }}>Mo</th>{sortedDebts.map(d => <th key={d.id} style={{ padding: "6px 8px", color: C.textDim, fontWeight: 500, fontSize: 10, textAlign: "right" }}>{d.name}</th>)}<th style={{ padding: "6px 8px", color: C.textDim, fontWeight: 500, fontSize: 10, textAlign: "right" }}>Total</th></tr></thead><tbody>{amort.slice(0, 24).map(r => { const totalRem = r.debts.reduce((s, d) => s + d.remaining, 0); const origTotal = debts.reduce((s, d) => s + d.balance, 0); return <tr key={r.month} style={{ borderBottom: `1px solid ${C.border}15` }}><td style={{ padding: "6px 8px", fontWeight: 500 }}>{r.month}</td>{r.debts.map((d, i) => <td key={i} style={{ padding: "6px 8px", textAlign: "right" }}><div style={{ fontSize: 11, color: d.remaining === 0 ? C.green : C.text }}>{d.remaining === 0 ? "✓" : fmt(d.remaining)}</div><div style={{ height: 3, borderRadius: 2, background: C.border, marginTop: 2 }}><div style={{ height: "100%", borderRadius: 2, background: d.remaining === 0 ? C.green : C.red, width: `${origTotal > 0 ? (d.remaining / origTotal) * 100 : 0}%`, transition: "width 0.3s" }} /></div></td>)}<td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600, color: totalRem === 0 ? C.green : C.text }}>{totalRem === 0 ? "🎉" : fmt(totalRem)}</td></tr>; })}</tbody></table></div></div>}

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? "Edit Debt" : "Add Debt"}>
        <DebtForm initial={editItem} onSave={d => { if (d.id && d.balance === 0) showConfetti(); saveDebt(d); setShowModal(false); setEditItem(null); }} onDelete={editItem ? () => deleteDebt(editItem.id) : null} onConfirmDelete={() => setConfirmDel(editItem?.id)} />
      </Modal>
      <ConfirmDialog open={!!confirmDel} message="Delete this debt?" onConfirm={() => { deleteDebt(confirmDel); setConfirmDel(null); setShowModal(false); setEditItem(null); }} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}

// ── INVESTMENTS ──
export function InvestmentsPage({ investments, totalInvested, totalGain, saveInv, deleteInv }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <div style={{ ...cardStyle, textAlign: "center" }}><div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Portfolio</div><div style={{ fontSize: 22, fontWeight: 700 }}>{fmt(totalInvested)}</div></div>
        <div style={{ ...cardStyle, textAlign: "center" }}><div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Gain/Loss</div><div style={{ fontSize: 22, fontWeight: 700, color: totalGain >= 0 ? C.green : C.red }}>{totalGain >= 0 ? "+" : "-"}{fmt(totalGain)}</div></div>
        <div style={{ ...cardStyle, textAlign: "center" }}><div style={{ fontSize: 9, color: C.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Return</div><div style={{ fontSize: 22, fontWeight: 700, color: totalGain >= 0 ? C.green : C.red }}>{totalGain >= 0 ? "+" : ""}{((totalGain / (totalInvested - totalGain || 1)) * 100).toFixed(1)}%</div></div>
      </div>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><span style={{ fontSize: 12, fontWeight: 600 }}>Holdings</span><button onClick={() => { setEditItem(null); setShowModal(true); }} style={btnPrimary}>+ Add</button></div>
        {investments.map((inv, i) => { const gain = inv.value - inv.cost; return (
          <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: i < investments.length - 1 ? `1px solid ${C.border}22` : "none", cursor: "pointer" }} onClick={() => { setEditItem(inv); setShowModal(true); }}>
            <Donut value={inv.value} max={totalInvested} color={CAT_COLORS[i % CAT_COLORS.length]} size={42} stroke={5} />
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 500 }}>{inv.name}</div><div style={{ fontSize: 10, color: C.textDim }}>{((inv.value / totalInvested) * 100).toFixed(1)}%</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(inv.value)}</div><div style={{ fontSize: 11, color: gain >= 0 ? C.green : C.red, fontWeight: 500 }}>{gain >= 0 ? "+" : ""}{((gain / (inv.cost || 1)) * 100).toFixed(1)}%</div></div>
          </div>); })}
      </div>
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? "Edit Investment" : "Add Investment"}>
        <InvForm initial={editItem} onSave={d => { saveInv(d); setShowModal(false); setEditItem(null); }} onDelete={editItem ? () => deleteInv(editItem.id) : null} onConfirmDelete={() => setConfirmDel(editItem?.id)} />
      </Modal>
      <ConfirmDialog open={!!confirmDel} message="Delete this investment?" onConfirm={() => { deleteInv(confirmDel); setConfirmDel(null); setShowModal(false); setEditItem(null); }} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}

// ── NET WORTH ──
export function NetWorthPage({ netWorth, totalAssets, totalLiab, acctBalance, txnNet, totalInvested, totalDebt, accounts, debts, monthlyInc, monthlyExp, monthlySavings, monthlyNW, nwHistory, saveNwSnapshot, month }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...cardStyle, textAlign: "center", padding: "28px 22px" }}>
        <div style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Total Net Worth</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: netWorth >= 0 ? C.green : C.red, letterSpacing: "-1px" }}>{netWorth >= 0 ? "+" : "-"}{fmt(netWorth)}</div>
        <Spark data={monthlyNW.length > 1 ? monthlyNW : [0, netWorth]} color="auto" w={240} h={40} />
        <div style={{ fontSize: 10, color: C.textDim, marginTop: 8 }}>= Accounts ({fmt(acctBalance)}) + Cash Flow ({fmt(txnNet)}) + Investments ({fmt(totalInvested)}) - Debt ({fmt(totalDebt)})</div>
        <button onClick={saveNwSnapshot} style={{ ...btnSmall, marginTop: 12, color: C.accent, borderColor: C.accent }}>📸 Save Snapshot</button>
      </div>
      <div style={cardStyle}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Monthly Tracker</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 400 }}><thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{["Month", "Income", "Expenses", "Net", "Cumulative"].map(h => <th key={h} style={{ textAlign: "left", padding: "7px 8px", color: C.textDim, fontWeight: 500, fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}</tr></thead><tbody>{MONTHS.map((m, i) => { const cum = monthlySavings.slice(0, i + 1).reduce((s, x) => s + x, 0); if (monthlyInc[i] === 0 && monthlyExp[i] === 0) return null; return <tr key={i} style={{ borderBottom: `1px solid ${C.border}15` }}><td style={{ padding: "7px 8px", fontWeight: 500 }}>{m}</td><td style={{ padding: "7px 8px", color: C.green }}>{fmt(monthlyInc[i])}</td><td style={{ padding: "7px 8px", color: C.red }}>{fmt(monthlyExp[i])}</td><td style={{ padding: "7px 8px", fontWeight: 600, color: monthlySavings[i] >= 0 ? C.green : C.red }}>{monthlySavings[i] >= 0 ? "+" : "-"}{fmt(monthlySavings[i])}</td><td style={{ padding: "7px 8px", fontWeight: 600, color: cum >= 0 ? C.green : C.red }}>{cum >= 0 ? "+" : "-"}{fmt(cum)}</td></tr>; })}</tbody></table></div></div>
      {nwHistory.length > 0 && <div style={cardStyle}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Snapshots</div>{nwHistory.sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((h, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}22` }}><span style={{ fontWeight: 500 }}>{h.month} {h.year}</span><span style={{ fontWeight: 700, color: (h.netWorth || 0) >= 0 ? C.green : C.red }}>{fmt(h.netWorth || 0)}</span></div>)}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
        <div style={cardStyle}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: C.green }}>Assets — {fmt(totalAssets)}</div>{accounts.filter(a => a.balance > 0).map(a => <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}><span style={{ fontSize: 11.5 }}>{a.icon} {a.name}</span><span style={{ fontSize: 11.5, fontWeight: 600, color: C.green }}>+{fmt(a.balance)}</span></div>)}{txnNet > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}><span style={{ fontSize: 11.5 }}>💵 Cash Flow</span><span style={{ fontSize: 11.5, fontWeight: 600, color: C.green }}>+{fmt(txnNet)}</span></div>}<div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span style={{ fontSize: 11.5 }}>📈 Investments</span><span style={{ fontSize: 11.5, fontWeight: 600, color: C.green }}>+{fmt(totalInvested)}</span></div></div>
        <div style={cardStyle}><div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: C.red }}>Liabilities — {fmt(totalLiab)}</div>{accounts.filter(a => a.balance < 0).map(a => <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}><span style={{ fontSize: 11.5 }}>{a.icon} {a.name}</span><span style={{ fontSize: 11.5, fontWeight: 600, color: C.red }}>-{fmt(Math.abs(a.balance))}</span></div>)}{debts.map(d => <div key={d.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}22` }}><span style={{ fontSize: 11.5 }}>📋 {d.name}</span><span style={{ fontSize: 11.5, fontWeight: 600, color: C.red }}>-{fmt(d.balance)}</span></div>)}</div>
      </div>
    </div>
  );
}

// ── ACCOUNTS ──
export function AccountsPage({ accounts, saveAcct, deleteAcct }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}><button onClick={() => { setEditItem(null); setShowModal(true); }} style={btnPrimary}>+ Add Account</button></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
        {accounts.map(a => (
          <div key={a.id} style={{ ...cardStyle, cursor: "pointer" }} onClick={() => { setEditItem(a); setShowModal(true); }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}><span style={{ fontSize: 26 }}>{a.icon}</span><div><div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 10, color: C.textDim }}>{a.type}</div></div></div>
            <div style={{ fontSize: 26, fontWeight: 700, color: a.balance >= 0 ? C.green : C.red }}>{a.balance >= 0 ? "" : "-"}{fmt(a.balance)}</div>
          </div>
        ))}
      </div>
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditItem(null); }} title={editItem ? "Edit Account" : "Add Account"}>
        <AcctForm initial={editItem} onSave={d => { saveAcct(d); setShowModal(false); setEditItem(null); }} onDelete={editItem ? () => deleteAcct(editItem.id) : null} onConfirmDelete={() => setConfirmDel(editItem?.id)} />
      </Modal>
      <ConfirmDialog open={!!confirmDel} message="Delete this account?" onConfirm={() => { deleteAcct(confirmDel); setConfirmDel(null); setShowModal(false); setEditItem(null); }} onCancel={() => setConfirmDel(null)} />
    </div>
  );
}

// ── BADGES ──
export function BadgesPage({ earnedBadges }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
      {BADGES.map(b => {
        const earned = earnedBadges.some(e => e.id === b.id);
        return (
          <div key={b.id} style={{ ...cardStyle, textAlign: "center", opacity: earned ? 1 : 0.4, padding: "20px 16px" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{b.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: earned ? C.text : C.textDim }}>{b.name}</div>
            <div style={{ fontSize: 10, color: C.textMid, marginTop: 4 }}>{b.desc}</div>
            {earned && <div style={{ fontSize: 9, color: C.green, marginTop: 6 }}>✓ Unlocked</div>}
          </div>
        );
      })}
    </div>
  );
}

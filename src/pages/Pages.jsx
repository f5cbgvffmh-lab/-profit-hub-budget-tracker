import React, { useState, useMemo } from "react";
import { C, fmt, fmtShort, CATEGORIES, MONTHS, ACCOUNT_ICONS, ACCOUNT_TYPES, BADGES, genId, filterTxns, getCatBreakdown, DEFAULT_THEME, applyTheme } from "../utils/constants.js";
import { Modal, ConfirmDialog, Input, Select, SectionCard, Thermometer, MiniBar, DonutChart, PeriodTabs, Sparkline, Confetti, BadgeChip } from "../components/UI.jsx";

// ── SHARED FORM HELPERS ──
function Btn({ children, onClick, color, outline, small, danger, style={} }) {
  const bg = danger ? C.red : outline ? "transparent" : (color||C.accent);
  return (
    <button onClick={onClick} style={{
      padding: small ? "5px 10px" : "9px 16px",
      background: bg, border: outline ? `1px solid ${C.border}` : "none",
      borderRadius:8, color: outline ? C.textMid : "#fff", cursor:"pointer",
      fontSize: small ? 11 : 13, fontWeight:600, ...style
    }}>{children}</button>
  );
}

function Row({ children, style={} }) {
  return <div style={{ display:"flex", gap:8, alignItems:"flex-start", flexWrap:"wrap", ...style }}>{children}</div>;
}

// ── TRANSACTIONS PAGE ──
export function TransactionsPage({ txns=[], accounts=[], onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [period, setPeriod] = useState("monthly");
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    let t = filterTxns(txns, period);
    if (filterType !== "All") t = t.filter(x=>x.type===filterType);
    if (filterCat !== "All") t = t.filter(x=>x.category===filterCat);
    if (search) t = t.filter(x=>(x.description||"").toLowerCase().includes(search.toLowerCase())||x.category.toLowerCase().includes(search.toLowerCase()));
    return t.sort((a,b)=>new Date(b.date)-new Date(a.date));
  }, [txns, period, filterType, filterCat, search]);

  const income = filtered.filter(t=>t.type==="income").reduce((s,t)=>s+(parseFloat(t.amount)||0),0);
  const expenses = filtered.filter(t=>t.type==="expense").reduce((s,t)=>s+(parseFloat(t.amount)||0),0);

  function getAcctName(id) { return accounts.find(a=>a.id===id)?.name || "—"; }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {confirm && <ConfirmDialog message="Delete this transaction?" onConfirm={()=>{ onDelete(confirm); setConfirm(null); }} onCancel={()=>setConfirm(null)} />}
      {(showForm||editing) && (
        <Modal title={editing?"Edit Transaction":"Add Transaction"} onClose={()=>{ setShowForm(false); setEditing(null); }}>
          <TxnFormInline accounts={accounts} initial={editing} onSave={editing?onEdit:onAdd} onClose={()=>{ setShowForm(false); setEditing(null); }} />
        </Modal>
      )}

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:10 }}>
        {[["Income",income,C.green,"💚"],["Expenses",expenses,C.red,"🔴"],["Net",income-expenses,income-expenses>=0?C.green:C.red,"📊"]].map(([l,v,c,i])=>(
          <div key={l} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:C.textMid, marginBottom:4 }}>{i} {l}</div>
            <div style={{ fontSize:16, fontWeight:700, color:c }}>{v>=0?fmt(v):"-"+fmt(Math.abs(v))}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:14, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..." style={{
          flex:"1 1 160px", padding:"8px 12px", background:C.surface, border:`1px solid ${C.border}`,
          borderRadius:8, color:C.text, fontSize:13, outline:"none"
        }} />
        <PeriodTabs value={period} onChange={setPeriod} />
        <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={{ padding:"6px 10px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12 }}>
          {["All","income","expense"].map(v=><option key={v} value={v}>{v==="All"?"All Types":v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
        </select>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{ padding:"6px 10px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12 }}>
          {["All",...CATEGORIES].map(v=><option key={v} value={v}>{v}</option>)}
        </select>
        <Btn onClick={()=>setShowForm(true)}>+ Add</Btn>
      </div>

      {/* List */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
        {filtered.length === 0
          ? <div style={{ padding:32, textAlign:"center", color:C.textDim }}>No transactions found</div>
          : filtered.map(t => (
              <div key={t.id} style={{ display:"flex", alignItems:"center", padding:"12px 16px", borderBottom:`1px solid ${C.border}`, gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, color:C.text, fontWeight:500 }}>{t.description||t.category}</div>
                  <div style={{ fontSize:11, color:C.textMid }}>{t.category} · {getAcctName(t.accountId)} · {t.date}</div>
                </div>
                <div style={{ fontSize:14, fontWeight:700, color:t.type==="income"?C.green:C.red, minWidth:80, textAlign:"right" }}>
                  {t.type==="income"?"+":"-"}{fmt(t.amount)}
                </div>
                <div style={{ display:"flex", gap:4 }}>
                  <Btn small outline onClick={()=>setEditing(t)}>✏️</Btn>
                  <Btn small danger onClick={()=>setConfirm(t.id)}>🗑</Btn>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}

function TxnFormInline({ accounts=[], initial=null, onSave, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState(initial||{ type:"expense", amount:"", category:"Food", description:"", date:today, accountId:accounts[0]?.id||"" });
  function set(k,v){ setForm(f=>({...f,[k]:v})); }
  function save(){
    if(!form.amount||isNaN(parseFloat(form.amount))) return;
    onSave({...form, id:form.id||genId(), amount:parseFloat(form.amount)});
    onClose();
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ display:"flex", gap:4, background:C.surface, padding:3, borderRadius:8, marginBottom:10 }}>
        {["income","expense"].map(v=>(
          <button key={v} onClick={()=>set("type",v)} style={{ flex:1, padding:"7px", border:"none", borderRadius:6, cursor:"pointer",
            background:form.type===v?(v==="income"?C.green:C.red):"transparent",
            color:form.type===v?"#fff":C.textMid, fontWeight:form.type===v?600:400, fontSize:13
          }}>{v==="income"?"💚 Income":"🔴 Expense"}</button>
        ))}
      </div>
      <Input label="Amount ($)" type="number" placeholder="0.00" value={form.amount} onChange={e=>set("amount",e.target.value)} />
      <Input label="Description" placeholder="What was this?" value={form.description} onChange={e=>set("description",e.target.value)} />
      <Select label="Category" value={form.category} onChange={e=>set("category",e.target.value)} options={CATEGORIES} />
      <Select label="Account" value={form.accountId} onChange={e=>set("accountId",e.target.value)} options={accounts.map(a=>({value:a.id,label:`${a.icon} ${a.name}`}))} />
      <Input label="Date" type="date" value={form.date} onChange={e=>set("date",e.target.value)} />
      <Row style={{ marginTop:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:"9px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, cursor:"pointer" }}>Cancel</button>
        <button onClick={save} style={{ flex:1, padding:"9px", background:C.accent, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontWeight:600 }}>{initial?"Update":"Add"}</button>
      </Row>
    </div>
  );
}

// ── BUDGET PAGE ──
export function BudgetPage({ budget, txns=[], onSaveBudget }) {
  const [b, setB] = useState(budget);
  const [period, setPeriod] = useState("monthly");

  const totalIncome = b.income.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
  const filtered = filterTxns(txns, period);
  const catActuals = {};
  filtered.filter(t=>t.type==="expense").forEach(t=>{ catActuals[t.category]=(catActuals[t.category]||0)+(parseFloat(t.amount)||0); });

  function setIncome(i, field, val) {
    const inc = [...b.income]; inc[i]={...inc[i],[field]:val};
    setB(prev=>({...prev,income:inc}));
  }
  function setAlloc(i, val) {
    const a=[...b.allocations]; a[i]={...a[i],pct:parseFloat(val)||0};
    setB(prev=>({...prev,allocations:a}));
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Budget Planner</div>
        <Row>
          <PeriodTabs value={period} onChange={setPeriod} />
          <Btn onClick={()=>onSaveBudget(b)}>Save</Btn>
        </Row>
      </div>

      {/* Income sources */}
      <SectionCard title="Income Sources">
        {b.income.map((src,i)=>(
          <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
            <input value={src.label} onChange={e=>setIncome(i,"label",e.target.value)} style={{ flex:1, padding:"8px 10px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, outline:"none" }} />
            <input value={src.amount} type="number" onChange={e=>setIncome(i,"amount",e.target.value)} onFocus={e=>e.target.select()} style={{ width:110, padding:"8px 10px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, outline:"none" }} />
          </div>
        ))}
        <div style={{ marginTop:8, fontWeight:700, color:C.accent }}>Total Income: {fmt(totalIncome)}</div>
      </SectionCard>

      {/* Allocations */}
      <SectionCard title="Budget vs Actual">
        {b.allocations.map((alloc,i) => {
          const budgeted = (alloc.pct/100)*totalIncome;
          const actual = catActuals[alloc.cat]||0;
          const over = actual > budgeted;
          return (
            <div key={alloc.cat} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:C.text }}>{alloc.cat}</span>
                <div style={{ display:"flex", gap:12, fontSize:11 }}>
                  <span style={{ color:C.textMid }}>Budget: {fmt(budgeted,0)}</span>
                  <span style={{ color: over?C.red:C.green, fontWeight:600 }}>Actual: {fmt(actual,0)}</span>
                  <input value={alloc.pct} type="number" onChange={e=>setAlloc(i,e.target.value)} onFocus={e=>e.target.select()}
                    style={{ width:46, padding:"2px 6px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:4, color:C.accent, fontSize:11, outline:"none", textAlign:"center" }} />
                  <span style={{ color:C.textMid }}>%</span>
                </div>
              </div>
              <Thermometer pct={budgeted>0?(actual/budgeted)*100:0} color={over?C.red:C.green} />
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

// ── SAVINGS PAGE ──
export function SavingsPage({ goals=[], onAdd, onEdit, onDelete, onDeposit }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [depositGoal, setDepositGoal] = useState(null);
  const [depositAmt, setDepositAmt] = useState("");

  const COLORS = [C.accent, C.purple, C.green, C.amber, C.cyan, C.pink];
  const ICONS = ["🎯","💻","🏠","✈️","🚗","💍","🎓","🏖️","🛡️","💰"];

  function GoalForm({ initial, onSave, onClose }) {
    const [f, setF] = useState(initial||{ name:"", target:"", saved:"0", color:COLORS[0], icon:"🎯" });
    function set(k,v){ setF(p=>({...p,[k]:v})); }
    function save(){ if(!f.name||!f.target) return; onSave({...f,id:f.id||genId(),target:parseFloat(f.target),saved:parseFloat(f.saved)||0}); onClose(); }
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        <Input label="Goal Name" value={f.name} onChange={e=>set("name",e.target.value)} />
        <Input label="Target Amount ($)" type="number" value={f.target} onChange={e=>set("target",e.target.value)} />
        <Input label="Already Saved ($)" type="number" value={f.saved} onChange={e=>set("saved",e.target.value)} />
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:C.textMid, marginBottom:6 }}>Color</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {COLORS.map(c=><div key={c} onClick={()=>set("color",c)} style={{ width:24, height:24, borderRadius:"50%", background:c, cursor:"pointer", border:f.color===c?`3px solid #fff`:"3px solid transparent" }} />)}
          </div>
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:12, color:C.textMid, marginBottom:6 }}>Icon</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {ICONS.map(ic=><button key={ic} onClick={()=>set("icon",ic)} style={{ width:32, height:32, background:f.icon===ic?C.accent+"33":C.surface, border:`1px solid ${f.icon===ic?C.accent:C.border}`, borderRadius:8, cursor:"pointer", fontSize:16 }}>{ic}</button>)}
          </div>
        </div>
        <Row style={{ marginTop:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, cursor:"pointer" }}>Cancel</button>
          <button onClick={save} style={{ flex:1, padding:"9px", background:C.accent, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontWeight:600 }}>{initial?"Update":"Add Goal"}</button>
        </Row>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {confirm && <ConfirmDialog message="Delete this goal?" onConfirm={()=>{ onDelete(confirm); setConfirm(null); }} onCancel={()=>setConfirm(null)} />}
      {(showForm||editing) && (
        <Modal title={editing?"Edit Goal":"New Savings Goal"} onClose={()=>{ setShowForm(false); setEditing(null); }}>
          <GoalForm initial={editing} onSave={editing?onEdit:onAdd} onClose={()=>{ setShowForm(false); setEditing(null); }} />
        </Modal>
      )}
      {depositGoal && (
        <Modal title={`Deposit to ${depositGoal.name}`} onClose={()=>setDepositGoal(null)}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[50,100,250,500].map(a=>(
                <button key={a} onClick={()=>setDepositAmt(String(a))} style={{ padding:"6px 12px", background:depositAmt===String(a)?C.accent:C.surface, border:`1px solid ${depositAmt===String(a)?C.accent:C.border}`, borderRadius:8, color:depositAmt===String(a)?"#fff":C.text, cursor:"pointer", fontSize:13 }}>${a}</button>
              ))}
            </div>
            <Input label="Custom Amount" type="number" value={depositAmt} onChange={e=>setDepositAmt(e.target.value)} />
            <Row>
              <button onClick={()=>setDepositGoal(null)} style={{ flex:1, padding:"9px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{ if(depositAmt&&parseFloat(depositAmt)>0){ onDeposit(depositGoal.id, parseFloat(depositAmt)); setDepositGoal(null); setDepositAmt(""); } }} style={{ flex:1, padding:"9px", background:C.green, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontWeight:600 }}>Deposit</button>
            </Row>
          </div>
        </Modal>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Savings Goals</div>
        <Btn onClick={()=>setShowForm(true)}>+ New Goal</Btn>
      </div>

      {goals.length === 0
        ? <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:40, textAlign:"center", color:C.textDim }}>No goals yet. Create your first one!</div>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
            {goals.map(g => {
              const pct = Math.min(100,(g.saved/g.target)*100)||0;
              const done = g.saved >= g.target;
              return (
                <div key={g.id} style={{ background:C.card, border:`1px solid ${done?g.color:C.border}`, borderRadius:14, padding:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:24 }}>{g.icon}</span>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{g.name}</div>
                        {done && <div style={{ fontSize:10, color:C.green }}>✅ Complete!</div>}
                      </div>
                    </div>
                    <DonutChart segments={[{value:pct,color:g.color},{value:100-pct,color:C.border}]} size={50} thickness={8} />
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                      <span style={{ color:C.textMid }}>Saved: <b style={{ color:g.color }}>{fmt(g.saved)}</b></span>
                      <span style={{ color:C.textMid }}>Goal: {fmt(g.target)}</span>
                    </div>
                    <Thermometer pct={pct} color={g.color} />
                  </div>
                  <Row>
                    <Btn small onClick={()=>setDepositGoal(g)} color={g.color}>+ Deposit</Btn>
                    <Btn small outline onClick={()=>setEditing(g)}>✏️</Btn>
                    <Btn small danger onClick={()=>setConfirm(g.id)}>🗑</Btn>
                  </Row>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}

// ── DEBT PAGE ──
export function DebtPage({ debts=[], onAdd, onEdit, onDelete }) {
  const [strategy, setStrategy] = useState("avalanche");
  const [extra, setExtra] = useState(100);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confetti, setConfetti] = useState(false);

  const sorted = [...debts].sort((a,b)=>
    strategy==="snowball" ? parseFloat(a.balance)-parseFloat(b.balance) : parseFloat(b.rate)-parseFloat(a.rate)
  );
  const totalDebt = debts.reduce((s,d)=>s+(parseFloat(d.balance)||0),0);
  const totalMin = debts.reduce((s,d)=>s+(parseFloat(d.minPayment)||0),0);

  function getPayoffMonths(debt, extraPay) {
    let bal = parseFloat(debt.balance)||0;
    const rate = (parseFloat(debt.rate)||0)/100/12;
    const pmt = (parseFloat(debt.minPayment)||0) + extraPay;
    if (pmt <= 0 || bal <= 0) return "—";
    let months = 0;
    while (bal > 0 && months < 600) { bal = bal*(1+rate)-pmt; months++; }
    if (months >= 600) return "600+ mo";
    const d = new Date(); d.setMonth(d.getMonth()+months);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function DebtForm({ initial, onSave, onClose }) {
    const ICONS2=["💳","🚗","🏠","🎓","💊","🏦","💵","📱"];
    const [f,setF]=useState(initial||{name:"",balance:"",rate:"",minPayment:"",icon:"💳"});
    function set(k,v){setF(p=>({...p,[k]:v}));}
    function save(){if(!f.name||!f.balance)return; const saved={...f,id:f.id||genId(),balance:parseFloat(f.balance),rate:parseFloat(f.rate)||0,minPayment:parseFloat(f.minPayment)||0}; if(saved.balance<=0){setConfetti(true);setTimeout(()=>setConfetti(false),4000);} onSave(saved); onClose();}
    return(
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <Input label="Debt Name" value={f.name} onChange={e=>set("name",e.target.value)}/>
        <Input label="Balance ($)" type="number" value={f.balance} onChange={e=>set("balance",e.target.value)}/>
        <Input label="Interest Rate (%)" type="number" value={f.rate} onChange={e=>set("rate",e.target.value)}/>
        <Input label="Min Payment ($)" type="number" value={f.minPayment} onChange={e=>set("minPayment",e.target.value)}/>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:C.textMid,marginBottom:6}}>Icon</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{ICONS2.map(ic=><button key={ic} onClick={()=>set("icon",ic)} style={{width:32,height:32,background:f.icon===ic?C.accent+"33":C.surface,border:`1px solid ${f.icon===ic?C.accent:C.border}`,borderRadius:8,cursor:"pointer",fontSize:16}}>{ic}</button>)}</div>
        </div>
        <Row style={{marginTop:8}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,cursor:"pointer"}}>Cancel</button>
          <button onClick={save} style={{flex:1,padding:"9px",background:C.accent,border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontWeight:600}}>{initial?"Update":"Add Debt"}</button>
        </Row>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <Confetti active={confetti} />
      {confirm && <ConfirmDialog message="Delete this debt?" onConfirm={()=>{ onDelete(confirm); setConfirm(null); }} onCancel={()=>setConfirm(null)} />}
      {(showForm||editing) && (
        <Modal title={editing?"Edit Debt":"Add Debt"} onClose={()=>{ setShowForm(false); setEditing(null); }}>
          <DebtForm initial={editing} onSave={editing?onEdit:onAdd} onClose={()=>{ setShowForm(false); setEditing(null); }} />
        </Modal>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Debt Payoff</div>
        <Row>
          {["avalanche","snowball"].map(s=>(
            <button key={s} onClick={()=>setStrategy(s)} style={{ padding:"6px 12px", background:strategy===s?C.accent:C.surface, border:`1px solid ${strategy===s?C.accent:C.border}`, borderRadius:8, color:strategy===s?"#fff":C.textMid, cursor:"pointer", fontSize:12, fontWeight:600 }}>
              {s==="avalanche"?"🏔 Avalanche":"❄️ Snowball"}
            </button>
          ))}
          <Btn onClick={()=>setShowForm(true)}>+ Add Debt</Btn>
        </Row>
      </div>

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10 }}>
        {[["Total Debt",fmt(totalDebt),C.red],["Min Payments",fmt(totalMin)+"/mo",C.amber],["Debts",debts.length,C.text]].map(([l,v,c])=>(
          <div key={l} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:C.textMid, marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:700, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Extra payment */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
        <div style={{ fontSize:13, color:C.textMid, marginBottom:8 }}>Extra monthly payment toward debt:</div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {[50,100,200,500].map(a=>(
            <button key={a} onClick={()=>setExtra(a)} style={{ padding:"5px 10px", background:extra===a?C.accent:C.surface, border:`1px solid ${extra===a?C.accent:C.border}`, borderRadius:8, color:extra===a?"#fff":C.text, cursor:"pointer", fontSize:12 }}>${a}</button>
          ))}
          <input type="number" value={extra} onChange={e=>setExtra(parseFloat(e.target.value)||0)} onFocus={e=>e.target.select()} style={{ width:80, padding:"5px 10px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:12, outline:"none" }} />
        </div>
      </div>

      {/* Debt list */}
      {sorted.length === 0
        ? <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:40, textAlign:"center", color:C.textDim }}>No debts! 🎉</div>
        : sorted.map((d, idx) => {
            const pct = 100; // placeholder visual
            const payoffDate = getPayoffMonths(d, idx===0?extra:0);
            const interest = ((parseFloat(d.rate)||0)/100/12)*(parseFloat(d.balance)||0);
            return (
              <div key={d.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontSize:24 }}>{d.icon}</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{d.name}</div>
                      <div style={{ fontSize:11, color:C.textMid }}>{d.rate}% APR · Min ${d.minPayment}/mo</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:700, color:C.red }}>{fmt(d.balance)}</div>
                    <div style={{ fontSize:10, color:C.textMid }}>{fmt(interest)}/mo interest</div>
                  </div>
                </div>
                {idx===0 && <div style={{ fontSize:11, color:C.amber, marginBottom:8 }}>⚡ Focus here ({strategy})</div>}
                <div style={{ fontSize:11, color:C.textMid, marginBottom:6 }}>Payoff by: <b style={{ color:C.accent }}>{payoffDate}</b></div>
                <MiniBar pct={75} color={idx===0?C.amber:C.textDim} />
                <Row style={{ marginTop:12 }}>
                  <Btn small outline onClick={()=>setEditing(d)}>✏️ Edit</Btn>
                  <Btn small danger onClick={()=>setConfirm(d.id)}>🗑 Delete</Btn>
                </Row>
              </div>
            );
          })
      }
    </div>
  );
}

// ── INVESTMENTS PAGE ──
export function InvestmentsPage({ investments=[], onAdd, onEdit, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const totalValue = investments.reduce((s,i)=>s+(parseFloat(i.shares||0)*parseFloat(i.currentPrice||0)),0);
  const totalCost = investments.reduce((s,i)=>s+(parseFloat(i.shares||0)*parseFloat(i.costBasis||0)),0);
  const totalGain = totalValue - totalCost;

  const ICONS3=["📈","💰","₿","🏦","🌐","⚡","🔶","🏠"];

  function InvForm({ initial, onSave, onClose }) {
    const [f,setF]=useState(initial||{name:"",shares:"",costBasis:"",currentPrice:"",icon:"📈"});
    function set(k,v){setF(p=>({...p,[k]:v}));}
    function save(){if(!f.name||!f.shares)return; onSave({...f,id:f.id||genId(),shares:parseFloat(f.shares),costBasis:parseFloat(f.costBasis)||0,currentPrice:parseFloat(f.currentPrice)||0}); onClose();}
    return(
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <Input label="Name / Ticker" value={f.name} onChange={e=>set("name",e.target.value)}/>
        <Input label="Shares / Units" type="number" value={f.shares} onChange={e=>set("shares",e.target.value)}/>
        <Input label="Cost Basis (per share)" type="number" value={f.costBasis} onChange={e=>set("costBasis",e.target.value)}/>
        <Input label="Current Price (per share)" type="number" value={f.currentPrice} onChange={e=>set("currentPrice",e.target.value)}/>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:C.textMid,marginBottom:6}}>Icon</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{ICONS3.map(ic=><button key={ic} onClick={()=>set("icon",ic)} style={{width:32,height:32,background:f.icon===ic?C.accent+"33":C.surface,border:`1px solid ${f.icon===ic?C.accent:C.border}`,borderRadius:8,cursor:"pointer",fontSize:16}}>{ic}</button>)}</div>
        </div>
        <Row style={{marginTop:8}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,cursor:"pointer"}}>Cancel</button>
          <button onClick={save} style={{flex:1,padding:"9px",background:C.accent,border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontWeight:600}}>{initial?"Update":"Add Investment"}</button>
        </Row>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {confirm && <ConfirmDialog message="Delete this investment?" onConfirm={()=>{ onDelete(confirm); setConfirm(null); }} onCancel={()=>setConfirm(null)} />}
      {(showForm||editing) && (
        <Modal title={editing?"Edit Investment":"Add Investment"} onClose={()=>{ setShowForm(false); setEditing(null); }}>
          <InvForm initial={editing} onSave={editing?onEdit:onAdd} onClose={()=>{ setShowForm(false); setEditing(null); }} />
        </Modal>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Investments</div>
        <Btn onClick={()=>setShowForm(true)}>+ Add</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10 }}>
        {[["Portfolio Value",fmt(totalValue),C.accent],["Total Cost",fmt(totalCost),C.textMid],["Total Gain",fmt(Math.abs(totalGain)),totalGain>=0?C.green:C.red],["Return",`${totalCost>0?((totalGain/totalCost)*100).toFixed(1):0}%`,totalGain>=0?C.green:C.red]].map(([l,v,c])=>(
          <div key={l} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:C.textMid, marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:16, fontWeight:700, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {investments.length===0
        ? <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:40, textAlign:"center", color:C.textDim }}>No investments yet</div>
        : investments.map(inv => {
            const value = parseFloat(inv.shares||0)*parseFloat(inv.currentPrice||0);
            const cost = parseFloat(inv.shares||0)*parseFloat(inv.costBasis||0);
            const gain = value - cost;
            const ret = cost>0?(gain/cost)*100:0;
            return (
              <div key={inv.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:18 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontSize:24 }}>{inv.icon}</span>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{inv.name}</div>
                      <div style={{ fontSize:11, color:C.textMid }}>{inv.shares} shares @ {fmt(inv.currentPrice)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{fmt(value)}</div>
                    <div style={{ fontSize:12, color:gain>=0?C.green:C.red }}>{gain>=0?"+":""}{fmt(gain)} ({ret.toFixed(1)}%)</div>
                  </div>
                </div>
                <Row style={{ marginTop:12 }}>
                  <Btn small outline onClick={()=>setEditing(inv)}>✏️</Btn>
                  <Btn small danger onClick={()=>setConfirm(inv.id)}>🗑</Btn>
                </Row>
              </div>
            );
          })
      }
    </div>
  );
}

// ── NET WORTH PAGE ──
export function NetWorthPage({ accounts=[], investments=[], debts=[], nwHistory=[], onSnapshot }) {
  const totalAssets = accounts.filter(a=>a.balance>0).reduce((s,a)=>s+(parseFloat(a.balance)||0),0)
    + investments.reduce((s,i)=>s+(parseFloat(i.shares||0)*parseFloat(i.currentPrice||0)),0);
  const totalLiabilities = debts.reduce((s,d)=>s+(parseFloat(d.balance)||0),0)
    + accounts.filter(a=>a.balance<0).reduce((s,a)=>s+Math.abs(parseFloat(a.balance)||0),0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Net Worth</div>

      <div style={{ background:C.card, border:`2px solid ${netWorth>=0?C.accent:C.red}`, borderRadius:14, padding:28, textAlign:"center" }}>
        <div style={{ fontSize:12, color:C.textMid, marginBottom:8 }}>TOTAL NET WORTH</div>
        <div style={{ fontSize:40, fontWeight:800, color:netWorth>=0?C.accent:C.red }}>{netWorth>=0?fmt(netWorth):"-"+fmt(Math.abs(netWorth))}</div>
        <div style={{ fontSize:12, color:C.textMid, marginTop:8 }}>Assets − Liabilities = Net Worth</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
          <div style={{ fontSize:12, color:C.green, fontWeight:600, marginBottom:10 }}>✅ Assets</div>
          <div style={{ fontSize:11, color:C.textMid, marginBottom:4 }}>Bank Accounts: <b style={{ color:C.text }}>{fmt(accounts.filter(a=>a.balance>0).reduce((s,a)=>s+(parseFloat(a.balance)||0),0))}</b></div>
          <div style={{ fontSize:11, color:C.textMid, marginBottom:8 }}>Investments: <b style={{ color:C.text }}>{fmt(investments.reduce((s,i)=>s+(parseFloat(i.shares||0)*parseFloat(i.currentPrice||0)),0))}</b></div>
          <div style={{ fontSize:14, fontWeight:700, color:C.green }}>{fmt(totalAssets)}</div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
          <div style={{ fontSize:12, color:C.red, fontWeight:600, marginBottom:10 }}>❌ Liabilities</div>
          <div style={{ fontSize:11, color:C.textMid, marginBottom:4 }}>Debts: <b style={{ color:C.text }}>{fmt(debts.reduce((s,d)=>s+(parseFloat(d.balance)||0),0))}</b></div>
          <div style={{ fontSize:11, color:C.textMid, marginBottom:8 }}>Credit Balances: <b style={{ color:C.text }}>{fmt(accounts.filter(a=>a.balance<0).reduce((s,a)=>s+Math.abs(parseFloat(a.balance)||0),0))}</b></div>
          <div style={{ fontSize:14, fontWeight:700, color:C.red }}>{fmt(totalLiabilities)}</div>
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <Btn onClick={()=>onSnapshot(netWorth)}>📸 Take Monthly Snapshot</Btn>
      </div>

      {nwHistory.length > 0 && (
        <SectionCard title="Net Worth History">
          {[...nwHistory].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(snap => (
            <div key={snap.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
              <span style={{ fontSize:12, color:C.textMid }}>{snap.date}</span>
              <span style={{ fontSize:13, fontWeight:700, color:parseFloat(snap.value)>=0?C.accent:C.red }}>{parseFloat(snap.value)>=0?fmt(snap.value):"-"+fmt(Math.abs(snap.value))}</span>
            </div>
          ))}
        </SectionCard>
      )}
    </div>
  );
}

// ── ACCOUNTS PAGE (V6 UPGRADED) ──
export function AccountsPage({ accounts=[], txns=[], onAdd, onEdit, onDelete, onTransfer }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transfer, setTransfer] = useState({ fromId:"", toId:"", amount:"" });

  const totalBank = accounts.filter(a=>a.type!=="Credit Card"&&a.type!=="Investment"&&a.balance>0).reduce((s,a)=>s+(parseFloat(a.balance)||0),0);
  const totalInv = accounts.filter(a=>a.type==="Investment").reduce((s,a)=>s+(parseFloat(a.balance)||0),0);
  const totalCredit = accounts.filter(a=>a.balance<0).reduce((s,a)=>s+Math.abs(parseFloat(a.balance)||0),0);

  function getAccountTxns(acctId) {
    return txns.filter(t=>t.accountId===acctId).sort((a,b)=>new Date(b.date)-new Date(a.date));
  }

  function getBalanceHistory(acctId, acct) {
    const acctTxns = getAccountTxns(acctId).reverse();
    let bal = parseFloat(acct.balance)||0;
    const history = [bal];
    // walk backwards to reconstruct
    acctTxns.forEach(t=>{
      if(t.type==="income") bal -= parseFloat(t.amount)||0;
      else bal += parseFloat(t.amount)||0;
      history.unshift(bal);
    });
    return history.slice(-12);
  }

  function getHealthScore(acct) {
    const issues = [];
    const bal = parseFloat(acct.balance)||0;
    if (acct.type==="Checking" && bal < 500) issues.push("Low balance");
    if (acct.type==="Credit Card" && acct.creditLimit) {
      const util = Math.abs(bal)/parseFloat(acct.creditLimit)*100;
      if (util > 30) issues.push(`High utilization (${Math.round(util)}%)`);
    }
    if (acct.type==="Savings" && bal < 1000) issues.push("Low savings");
    return issues;
  }

  function AcctForm({ initial, onSave, onClose }) {
    const [f,setF]=useState(initial||{name:"",type:"Checking",balance:"",icon:"🏦",color:"#58A6FF",creditLimit:""});
    function set(k,v){setF(p=>({...p,[k]:v}));}
    function save(){if(!f.name)return; onSave({...f,id:f.id||genId(),balance:parseFloat(f.balance)||0,creditLimit:f.creditLimit?parseFloat(f.creditLimit):null}); onClose();}
    return(
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        <Input label="Account Name" value={f.name} onChange={e=>set("name",e.target.value)}/>
        <Select label="Account Type" value={f.type} onChange={e=>set("type",e.target.value)} options={ACCOUNT_TYPES}/>
        <Input label="Current Balance ($)" type="number" value={f.balance} onChange={e=>set("balance",e.target.value)}/>
        {f.type==="Credit Card"&&<Input label="Credit Limit ($)" type="number" value={f.creditLimit||""} onChange={e=>set("creditLimit",e.target.value)}/>}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,color:C.textMid,marginBottom:6}}>Icon</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{ACCOUNT_ICONS.map(ic=><button key={ic} onClick={()=>set("icon",ic)} style={{width:32,height:32,background:f.icon===ic?C.accent+"33":C.surface,border:`1px solid ${f.icon===ic?C.accent:C.border}`,borderRadius:8,cursor:"pointer",fontSize:16}}>{ic}</button>)}</div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:C.textMid,marginBottom:6}}>Color</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{["#58A6FF","#3FB950","#F85149","#BC8CFF","#D29922","#39D2C0","#F778BA","#F97316"].map(c=><div key={c} onClick={()=>set("color",c)} style={{width:24,height:24,borderRadius:"50%",background:c,cursor:"pointer",border:f.color===c?"3px solid #fff":"3px solid transparent"}}/>)}</div>
        </div>
        <Row style={{marginTop:8}}>
          <button onClick={onClose} style={{flex:1,padding:"9px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,cursor:"pointer"}}>Cancel</button>
          <button onClick={save} style={{flex:1,padding:"9px",background:C.accent,border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontWeight:600}}>{initial?"Update":"Add Account"}</button>
        </Row>
      </div>
    );
  }

  const selAcct = accounts.find(a=>a.id===selected);
  const selTxns = selected ? getAccountTxns(selected) : [];
  const selHistory = selAcct ? getBalanceHistory(selected, selAcct) : [];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {confirm && <ConfirmDialog message="Delete this account?" onConfirm={()=>{ onDelete(confirm); setConfirm(null); setSelected(null); }} onCancel={()=>setConfirm(null)} />}
      {(showForm||editing) && (
        <Modal title={editing?"Edit Account":"Add Account"} onClose={()=>{ setShowForm(false); setEditing(null); }}>
          <AcctForm initial={editing} onSave={editing?onEdit:onAdd} onClose={()=>{ setShowForm(false); setEditing(null); }} />
        </Modal>
      )}
      {showTransfer && (
        <Modal title="Transfer Between Accounts" onClose={()=>setShowTransfer(false)}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <Select label="From Account" value={transfer.fromId} onChange={e=>setTransfer(p=>({...p,fromId:e.target.value}))} options={accounts.map(a=>({value:a.id,label:`${a.icon} ${a.name}`}))} />
            <Select label="To Account" value={transfer.toId} onChange={e=>setTransfer(p=>({...p,toId:e.target.value}))} options={accounts.map(a=>({value:a.id,label:`${a.icon} ${a.name}`}))} />
            <Input label="Amount ($)" type="number" value={transfer.amount} onChange={e=>setTransfer(p=>({...p,amount:e.target.value}))} />
            <Row style={{ marginTop:8 }}>
              <button onClick={()=>setShowTransfer(false)} style={{ flex:1, padding:"9px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, cursor:"pointer" }}>Cancel</button>
              <button onClick={()=>{ if(transfer.fromId&&transfer.toId&&transfer.amount&&transfer.fromId!==transfer.toId){ onTransfer(transfer); setShowTransfer(false); setTransfer({fromId:"",toId:"",amount:""}); } }} style={{ flex:1, padding:"9px", background:C.accent, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontWeight:600 }}>Transfer</button>
            </Row>
          </div>
        </Modal>
      )}

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Accounts</div>
        <Row>
          <Btn outline onClick={()=>setShowTransfer(true)}>↔ Transfer</Btn>
          <Btn onClick={()=>setShowForm(true)}>+ Add Account</Btn>
        </Row>
      </div>

      {/* Totals */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10 }}>
        {[["🏦 Bank Total",fmt(totalBank),C.green],["📈 Investments",fmt(totalInv),C.accent],["💳 Credit Owed",fmt(totalCredit),C.red]].map(([l,v,c])=>(
          <div key={l} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
            <div style={{ fontSize:10, color:C.textMid, marginBottom:4 }}>{l}</div>
            <div style={{ fontSize:16, fontWeight:700, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Account cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
        {accounts.map(a => {
          const bal = parseFloat(a.balance)||0;
          const issues = getHealthScore(a);
          const util = a.type==="Credit Card"&&a.creditLimit ? Math.abs(bal)/parseFloat(a.creditLimit)*100 : null;
          const history = getBalanceHistory(a.id, a);
          const isSelected = selected===a.id;

          return (
            <div key={a.id} onClick={()=>setSelected(isSelected?null:a.id)} style={{
              background:C.card, border:`2px solid ${isSelected?a.color||C.accent:C.border}`,
              borderRadius:14, padding:18, cursor:"pointer",
              boxShadow: isSelected ? `0 0 0 1px ${a.color||C.accent}44` : "none"
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <div style={{ fontSize:24 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{a.name}</div>
                    <div style={{ fontSize:10, color:C.textMid }}>{a.type}</div>
                  </div>
                </div>
                <Sparkline data={history} width={60} height={28} positive={history[history.length-1]>=history[0]} />
              </div>

              <div style={{ fontSize:22, fontWeight:800, color:bal<0?C.red:(a.color||C.text), marginBottom:6 }}>{bal<0?"-":""}{fmt(Math.abs(bal))}</div>

              {util!==null && (
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontSize:10, color:C.textMid, marginBottom:3 }}>Credit Utilization: {Math.round(util)}%</div>
                  <Thermometer pct={util} color={util>30?C.red:C.green} />
                  <div style={{ fontSize:10, color:C.textMid, marginTop:2 }}>Limit: {fmt(a.creditLimit)}</div>
                </div>
              )}

              {issues.length>0 && (
                <div style={{ background:C.amber+"18", border:`1px solid ${C.amber}44`, borderRadius:8, padding:"6px 10px", marginBottom:8 }}>
                  {issues.map(i=><div key={i} style={{ fontSize:10, color:C.amber }}>⚠️ {i}</div>)}
                </div>
              )}

              <Row style={{ marginTop:8 }}>
                <Btn small outline onClick={e=>{ e.stopPropagation(); setEditing(a); }}>✏️</Btn>
                <Btn small danger onClick={e=>{ e.stopPropagation(); setConfirm(a.id); }}>🗑</Btn>
              </Row>
            </div>
          );
        })}
      </div>

      {/* Account detail panel */}
      {selAcct && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontWeight:600, fontSize:14, color:C.text }}>{selAcct.icon} {selAcct.name} — Transaction History</div>
            <button onClick={()=>setSelected(null)} style={{ background:"transparent", border:"none", color:C.textMid, cursor:"pointer", fontSize:18 }}>✕</button>
          </div>
          <div style={{ padding:16, maxHeight:400, overflowY:"auto" }}>
            {selTxns.length===0
              ? <div style={{ textAlign:"center", color:C.textDim, padding:24 }}>No transactions for this account</div>
              : selTxns.map(t=>(
                  <div key={t.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize:13, color:C.text }}>{t.description||t.category}</div>
                      <div style={{ fontSize:10, color:C.textMid }}>{t.category} · {t.date}</div>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:t.type==="income"?C.green:C.red }}>
                      {t.type==="income"?"+":"-"}{fmt(t.amount)}
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ── BADGES PAGE ──
export function BadgesPage({ txns=[], goals=[], debts=[], investments=[], accounts=[] }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:16, fontWeight:700, color:C.text }}>Achievements</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
        {BADGES.map(b => {
          const earned = b.check(txns,goals,debts,investments,accounts);
          return (
            <div key={b.id} style={{
              background:C.card, border:`1px solid ${earned?C.amber:C.border}`,
              borderRadius:12, padding:20, textAlign:"center", opacity:earned?1:0.5
            }}>
              <div style={{ fontSize:32, marginBottom:8 }}>{b.icon}</div>
              <div style={{ fontSize:13, fontWeight:600, color:earned?C.text:C.textDim }}>{b.name}</div>
              <div style={{ fontSize:11, color:C.textMid, marginTop:4 }}>{b.desc}</div>
              {earned && <div style={{ fontSize:10, color:C.green, marginTop:8 }}>✓ Unlocked</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── THEME PAGE ──
export function ThemePage({ theme, onSave, onReset, onWipeData }) {
  const [t, setT] = useState(theme);
  const [wipeConfirm, setWipeConfirm] = useState(false);
  const [wipeConfirm2, setWipeConfirm2] = useState(false);

  const COLOR_FIELDS = [
    { key:"bg", label:"Background" },
    { key:"surface", label:"Surface" },
    { key:"card", label:"Cards" },
    { key:"sidebar", label:"Sidebar" },
    { key:"border", label:"Borders" },
    { key:"accent", label:"Accent / Blue" },
    { key:"green", label:"Green" },
    { key:"red", label:"Red" },
    { key:"amber", label:"Amber" },
    { key:"purple", label:"Purple" },
    { key:"cyan", label:"Cyan" },
    { key:"pink", label:"Pink" },
    { key:"text", label:"Text" },
    { key:"textMid", label:"Text (Muted)" },
    { key:"chart1", label:"Chart Color 1" },
    { key:"chart2", label:"Chart Color 2" },
    { key:"chart3", label:"Chart Color 3" },
    { key:"chart4", label:"Chart Color 4" },
  ];

  function set(k,v){ setT(p=>({...p,[k]:v})); }

  function save() { applyTheme(t); onSave(t); }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {wipeConfirm && (
        <ConfirmDialog
          message="⚠️ Are you sure? This will permanently delete ALL your data — transactions, accounts, budgets, goals, debts, investments, everything. This cannot be undone."
          onConfirm={()=>{ setWipeConfirm(false); setWipeConfirm2(true); }}
          onCancel={()=>setWipeConfirm(false)}
        />
      )}
      {wipeConfirm2 && (
        <ConfirmDialog
          message="🚨 Final confirmation. Your app will reset to zero. Are you absolutely sure?"
          onConfirm={()=>{ setWipeConfirm2(false); onWipeData(); }}
          onCancel={()=>setWipeConfirm2(false)}
        />
      )}

      <div style={{ fontSize:16, fontWeight:700, color:C.text }}>🎨 Customize Theme</div>

      <SectionCard title="Colors">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 }}>
          {COLOR_FIELDS.map(f => (
            <div key={f.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:C.textMid }}>{f.label}</span>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <input type="color" value={t[f.key]||"#000000"} onChange={e=>set(f.key,e.target.value)}
                  style={{ width:32, height:28, border:"none", borderRadius:6, cursor:"pointer", background:"transparent" }} />
                <span style={{ fontSize:10, color:C.textDim, fontFamily:"monospace" }}>{t[f.key]}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Preview */}
      <SectionCard title="Preview">
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {["accent","green","red","amber","purple","cyan"].map(k=>(
            <div key={k} style={{ padding:"6px 12px", borderRadius:20, background:t[k]+"33", border:`1px solid ${t[k]}`, fontSize:11, color:t[k] }}>{k}</div>
          ))}
        </div>
        <div style={{ marginTop:12, padding:12, background:t.surface, border:`1px solid ${t.border}`, borderRadius:10 }}>
          <div style={{ fontSize:12, color:t.textMid, marginBottom:4 }}>Sample card</div>
          <div style={{ fontSize:18, fontWeight:700, color:t.accent }}>$12,345.67</div>
          <div style={{ fontSize:11, color:t.textMid, marginTop:2 }}>Your net worth</div>
        </div>
      </SectionCard>

      <Row>
        <Btn onClick={save}>💾 Save Theme</Btn>
        <Btn outline onClick={()=>{ setT({...DEFAULT_THEME}); applyTheme(DEFAULT_THEME); onReset(); }}>Reset to Default</Btn>
      </Row>

      {/* Danger zone */}
      <div style={{ background:C.red+"11", border:`1px solid ${C.red}44`, borderRadius:12, padding:20 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.red, marginBottom:8 }}>⚠️ Danger Zone</div>
        <div style={{ fontSize:12, color:C.textMid, marginBottom:14 }}>Wipe all data resets the app completely — all transactions, accounts, goals, debts, investments, and net worth history will be permanently deleted. Your login stays active.</div>
        <button onClick={()=>setWipeConfirm(true)} style={{ padding:"10px 20px", background:C.red, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontWeight:700, fontSize:13 }}>
          🗑 Wipe All Data
        </button>
      </div>
    </div>
  );
}

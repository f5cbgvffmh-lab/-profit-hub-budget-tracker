import React, { useState } from "react";
import { C, CATEGORIES, inputStyle, selectStyle, btnPrimary, btnDanger, btnSmall, fmt } from "../utils/constants.js";
import { Field, NumInput, Donut } from "./UI.jsx";

export function TxnForm({ initial, onSave, onDelete, accounts, onConfirmDelete }) {
  const [date, setDate] = useState(initial?.date || new Date().toISOString().split("T")[0]);
  const [desc, setDesc] = useState(initial?.desc || "");
  const [category, setCategory] = useState(initial?.category || "Food");
  const [account, setAccount] = useState(initial?.account || "Checking");
  const [amount, setAmount] = useState(initial?.amount || "");
  const [type, setType] = useState(initial?.type || "expense");

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["income", "expense"].map(t => (
          <button key={t} onClick={() => setType(t)} style={{
            flex: 1, padding: "8px", borderRadius: 8,
            border: `1px solid ${type === t ? (t === "income" ? C.green : C.red) : C.border}`,
            background: type === t ? (t === "income" ? C.greenDim : C.redDim) : "transparent",
            color: type === t ? (t === "income" ? C.green : C.red) : C.textMid,
            fontSize: 12, fontWeight: type === t ? 600 : 400, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize"
          }}>{t}</button>
        ))}
      </div>
      <Field label="Date"><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} /></Field>
      <Field label="Description"><input value={desc} onChange={e => setDesc(e.target.value)} style={inputStyle} placeholder="e.g. Groceries" /></Field>
      <Field label="Category">
        <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Account">
        <select value={account} onChange={e => setAccount(e.target.value)} style={selectStyle}>
          {(accounts || []).map(a => <option key={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label="Amount"><NumInput value={amount} onChange={e => setAmount(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} placeholder="0" min="0" /></Field>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => onSave({ ...initial, date, desc, category, account, amount: Number(amount) || 0, type })} style={btnPrimary}>Save</button>
        {onDelete && <button onClick={onConfirmDelete} style={btnDanger}>Delete</button>}
      </div>
    </div>
  );
}

export function GoalForm({ initial, onSave, onDelete, onConfirmDelete }) {
  const [name, setName] = useState(initial?.name || "");
  const [saved, setSaved] = useState(initial?.saved ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [color, setColor] = useState(initial?.color || "#10B981");
  const colors = ["#10B981", "#06B6D4", "#8B5CF6", "#F59E0B", "#F85149", "#58A6FF", "#F778BA", "#3FB950"];

  return (
    <div>
      <Field label="Goal Name"><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. Emergency Fund" /></Field>
      <Field label="Amount Saved"><NumInput value={saved} onChange={e => setSaved(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} /></Field>
      <Field label="Target"><NumInput value={goal} onChange={e => setGoal(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} /></Field>
      <Field label="Color">
        <div style={{ display: "flex", gap: 6 }}>
          {colors.map(c => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: 6, background: c, border: color === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }} />)}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => onSave({ ...initial, name, saved: Number(saved) || 0, goal: Number(goal) || 0, color })} style={btnPrimary}>Save</button>
        {onDelete && <button onClick={onConfirmDelete} style={btnDanger}>Delete</button>}
      </div>
    </div>
  );
}

export function DepositForm({ goal, onDeposit }) {
  const [amt, setAmt] = useState(100);
  if (!goal) return null;
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Donut value={goal.saved} max={goal.goal} color={goal.color} size={90} stroke={9} />
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>{fmt(goal.saved)} of {fmt(goal.goal)}</div>
      </div>
      <Field label="Deposit Amount"><NumInput value={amt} onChange={e => setAmt(Number(e.target.value) || 0)} style={inputStyle} min="0" /></Field>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[50, 100, 250, 500].map(v => <button key={v} onClick={() => setAmt(v)} style={{ ...btnSmall, color: amt === v ? C.accent : C.textMid, borderColor: amt === v ? C.accent : C.border }}>${v}</button>)}
      </div>
      <button onClick={() => onDeposit(goal.id, amt)} style={btnPrimary}>Deposit {fmt(amt)}</button>
    </div>
  );
}

export function DebtForm({ initial, onSave, onDelete, onConfirmDelete }) {
  const [name, setName] = useState(initial?.name || "");
  const [balance, setBalance] = useState(initial?.balance ?? "");
  const [rate, setRate] = useState(initial?.rate ?? "");
  const [minPay, setMinPay] = useState(initial?.minPay ?? "");

  return (
    <div>
      <Field label="Debt Name"><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. Student Loan" /></Field>
      <Field label="Balance"><NumInput value={balance} onChange={e => setBalance(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} /></Field>
      <Field label="Interest Rate (%)"><NumInput value={rate} onChange={e => setRate(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} step="0.1" /></Field>
      <Field label="Min Payment"><NumInput value={minPay} onChange={e => setMinPay(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} /></Field>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => onSave({ ...initial, name, balance: Number(balance) || 0, rate: Number(rate) || 0, minPay: Number(minPay) || 0 })} style={btnPrimary}>Save</button>
        {onDelete && <button onClick={onConfirmDelete} style={btnDanger}>Delete</button>}
      </div>
    </div>
  );
}

export function InvForm({ initial, onSave, onDelete, onConfirmDelete }) {
  const [name, setName] = useState(initial?.name || "");
  const [cost, setCost] = useState(initial?.cost ?? "");
  const [value, setValue] = useState(initial?.value ?? "");

  return (
    <div>
      <Field label="Investment Name"><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. S&P 500" /></Field>
      <Field label="Cost Basis"><NumInput value={cost} onChange={e => setCost(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} /></Field>
      <Field label="Current Value"><NumInput value={value} onChange={e => setValue(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} /></Field>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => onSave({ ...initial, name, cost: Number(cost) || 0, value: Number(value) || 0 })} style={btnPrimary}>Save</button>
        {onDelete && <button onClick={onConfirmDelete} style={btnDanger}>Delete</button>}
      </div>
    </div>
  );
}

export function AcctForm({ initial, onSave, onDelete, onConfirmDelete }) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState(initial?.type || "Bank");
  const [balance, setBalance] = useState(initial?.balance ?? "");
  const [icon, setIcon] = useState(initial?.icon || "🏦");
  const icons = ["🏦", "💰", "💳", "📈", "🏠", "💵", "🪙", "📊"];

  return (
    <div>
      <Field label="Account Name"><input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. Chase Checking" /></Field>
      <Field label="Type">
        <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
          {["Bank", "Credit", "Investment", "Retirement", "Cash"].map(t => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field label="Starting Balance"><NumInput value={balance} onChange={e => setBalance(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle} /></Field>
      <Field label="Icon">
        <div style={{ display: "flex", gap: 6 }}>
          {icons.map(i => <button key={i} onClick={() => setIcon(i)} style={{ fontSize: 22, padding: "4px 8px", borderRadius: 6, border: icon === i ? `2px solid ${C.accent}` : "2px solid transparent", background: icon === i ? C.accentDim : "transparent", cursor: "pointer" }}>{i}</button>)}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => onSave({ ...initial, name, type, balance: Number(balance) || 0, icon })} style={btnPrimary}>Save</button>
        {onDelete && <button onClick={onConfirmDelete} style={btnDanger}>Delete</button>}
      </div>
    </div>
  );
}

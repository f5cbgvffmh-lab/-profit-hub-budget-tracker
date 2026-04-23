import React, { useState } from "react";
import { C, CATEGORIES, genId } from "../utils/constants.js";
import { Input, Select } from "./UI.jsx";

export function TxnForm({ onSave, onClose, accounts=[], initial=null }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState(initial || {
    type:"expense", amount:"", category:"Food", description:"", date:today, accountId:accounts[0]?.id||""
  });

  function set(k,v) { setForm(f=>({...f,[k]:v})); }

  function save() {
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    onSave({ ...form, id: form.id||genId(), amount: parseFloat(form.amount) });
    onClose();
  }

  const btn = (active, label, val) => (
    <button onClick={()=>set("type",val)} style={{
      flex:1, padding:"8px", border:"none", borderRadius:6, cursor:"pointer",
      background: active ? (val==="income" ? C.green : C.red) : C.surface,
      color: active ? "#fff" : C.textMid, fontWeight: active ? 600 : 400, fontSize:13
    }}>{label}</button>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
      <div style={{ display:"flex", gap:4, background:C.surface, padding:3, borderRadius:8, marginBottom:12 }}>
        {btn(form.type==="income","💚 Income","income")}
        {btn(form.type==="expense","🔴 Expense","expense")}
      </div>
      <Input label="Amount ($)" type="number" placeholder="0.00" value={form.amount} onChange={e=>set("amount",e.target.value)} />
      <Input label="Description" placeholder="What was this for?" value={form.description} onChange={e=>set("description",e.target.value)} />
      <Select label="Category" value={form.category} onChange={e=>set("category",e.target.value)} options={CATEGORIES} />
      <Select label="Account" value={form.accountId} onChange={e=>set("accountId",e.target.value)}
        options={accounts.map(a=>({value:a.id,label:`${a.icon} ${a.name}`}))} />
      <Input label="Date" type="date" value={form.date} onChange={e=>set("date",e.target.value)} />
      <div style={{ display:"flex", gap:10, marginTop:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:"10px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, cursor:"pointer" }}>Cancel</button>
        <button onClick={save} style={{ flex:1, padding:"10px", background:C.accent, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontWeight:600 }}>
          {initial ? "Update" : "Add Transaction"}
        </button>
      </div>
    </div>
  );
}

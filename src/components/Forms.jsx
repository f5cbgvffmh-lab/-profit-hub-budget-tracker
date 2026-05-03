import React, { useState } from "react";
import { C, CATEGORIES, genId } from "../utils/constants.js";
import { Input, Select } from "./UI.jsx";

export function TxnForm({ onSave, onClose, accounts=[], initial=null }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState(initial || {
    type:"expense", amount:"", category:"Food", description:"",
    date:today, accountId:accounts[0]?.id||"", toAccountId:""
  });

  function set(k,v) { setForm(f=>({...f,[k]:v})); }

  function save() {
    if (!form.amount || isNaN(parseFloat(form.amount))) return;
    if (form.type==="transfer" && form.accountId===form.toAccountId) return;
    onSave({ ...form, id:form.id||genId(), amount:parseFloat(form.amount) });
    onClose();
  }

  const typeBtn = (type, label, color) => (
    <button onClick={()=>set("type",type)} style={{
      flex:1, padding:"8px", border:"none", borderRadius:6, cursor:"pointer",
      background: form.type===type ? color : C.surface,
      color: form.type===type ? "#fff" : C.textMid,
      fontWeight: form.type===type ? 600 : 400, fontSize:12
    }}>{label}</button>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
      {/* Type selector */}
      <div style={{ display:"flex", gap:3, background:C.surface, padding:3, borderRadius:8, marginBottom:12 }}>
        {typeBtn("income","💚 Income", C.green)}
        {typeBtn("expense","🔴 Expense", C.red)}
        {typeBtn("transfer","🔄 Transfer", C.cyan)}
      </div>

      {/* Transfer note */}
      {form.type==="transfer" && (
        <div style={{ background:C.cyan+"18", border:`1px solid ${C.cyan}44`, borderRadius:8, padding:"8px 12px", marginBottom:8, fontSize:12, color:C.cyan }}>
          Transfers move money between accounts and are excluded from income/expense totals.
        </div>
      )}

      <Input label="Amount ($)" type="number" placeholder="0.00" value={form.amount} onChange={e=>set("amount",e.target.value)} />
      <Input label="Description" placeholder="What was this?" value={form.description} onChange={e=>set("description",e.target.value)} />

      {form.type!=="transfer" && (
        <Select label="Category" value={form.category} onChange={e=>set("category",e.target.value)} options={CATEGORIES} />
      )}

      <Select
        label={form.type==="transfer" ? "From Account" : "Account"}
        value={form.accountId}
        onChange={e=>set("accountId",e.target.value)}
        options={accounts.map(a=>({value:a.id,label:`${a.icon} ${a.name}`}))}
      />

      {form.type==="transfer" && (
        <Select
          label="To Account"
          value={form.toAccountId}
          onChange={e=>set("toAccountId",e.target.value)}
          options={[{value:"",label:"Select account..."},...accounts.filter(a=>a.id!==form.accountId).map(a=>({value:a.id,label:`${a.icon} ${a.name}`}))]}
        />
      )}

      <Input label="Date" type="date" value={form.date} onChange={e=>set("date",e.target.value)} />

      <div style={{ display:"flex", gap:10, marginTop:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:"10px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, cursor:"pointer" }}>Cancel</button>
        <button onClick={save} style={{ flex:1, padding:"10px", background: form.type==="transfer"?C.cyan:form.type==="income"?C.green:C.accent, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontWeight:600 }}>
          {initial?"Update":form.type==="transfer"?"Transfer":"Add Transaction"}
        </button>
      </div>
    </div>
  );
}

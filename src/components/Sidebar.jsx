import React, { useState } from "react";
import { auth } from "../firebase.js";
import { signOut } from "firebase/auth";
import { C } from "../utils/constants.js";

export const NAV_ITEMS = [
  { id:"dashboard", label:"Dashboard", icon:"📊" },
  { id:"transactions", label:"Transactions", icon:"💸" },
  { id:"budget", label:"Budget", icon:"📋" },
  { id:"savings", label:"Savings Goals", icon:"🎯" },
  { id:"debt", label:"Debt Payoff", icon:"⚔️" },
  { id:"investments", label:"Investments", icon:"📈" },
  { id:"networth", label:"Net Worth", icon:"💎" },
  { id:"accounts", label:"Accounts", icon:"🏦" },
  { id:"badges", label:"Achievements", icon:"🏅" },
  { id:"theme", label:"Customize", icon:"🎨" },
  { id:"onboarding", label:"How to Use", icon:"📖" },
];

export function Sidebar({ page, setPage, user }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", padding:"16px 0" }}>
      <div style={{ padding:"0 16px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontSize:20, fontWeight:700, color:C.text }}>💰 Profit Hub</div>
        <div style={{ fontSize:11, color:C.textMid, marginTop:2 }}>{user?.email}</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
        {NAV_ITEMS.map(n => (
          <button key={n.id} onClick={()=>{ setPage(n.id); setMobileOpen(false); }} style={{
            width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
            background: page===n.id ? C.accent+"22" : "transparent",
            border:"none", borderLeft: page===n.id ? `3px solid ${C.accent}` : "3px solid transparent",
            color: page===n.id ? C.accent : C.textMid, cursor:"pointer", fontSize:13,
            fontWeight: page===n.id ? 600 : 400, textAlign:"left"
          }}>
            <span>{n.icon}</span><span>{n.label}</span>
          </button>
        ))}
      </div>
      <div style={{ padding:"12px 16px", borderTop:`1px solid ${C.border}` }}>
        <button onClick={()=>signOut(auth)} style={{
          width:"100%", padding:"8px 12px", background:"transparent", border:`1px solid ${C.border}`,
          borderRadius:8, color:C.textMid, cursor:"pointer", fontSize:12
        }}>Sign Out</button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div style={{
        width:220, minHeight:"100vh", background:C.sidebar, borderRight:`1px solid ${C.border}`,
        position:"fixed", left:0, top:0, zIndex:100,
        display:"flex", flexDirection:"column"
      }} className="desktop-sidebar">
        {sidebarContent}
      </div>

      {/* Mobile hamburger */}
      <button onClick={()=>setMobileOpen(true)} style={{
        position:"fixed", top:12, left:12, zIndex:200, background:C.card,
        border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 10px",
        color:C.text, cursor:"pointer", fontSize:18
      }} className="mobile-hamburger">☰</button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex" }}>
          <div onClick={()=>setMobileOpen(false)} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)" }} />
          <div style={{ position:"relative", width:240, background:C.sidebar, height:"100%", zIndex:1 }}>
            <button onClick={()=>setMobileOpen(false)} style={{
              position:"absolute", top:10, right:10, background:"transparent",
              border:"none", color:C.textMid, cursor:"pointer", fontSize:18
            }}>✕</button>
            {sidebarContent}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .mobile-hamburger { display: none !important; } }
        @media (max-width: 767px) { .desktop-sidebar { display: none !important; } }
      `}</style>
    </>
  );
}

import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import { C, fmt, btnSmall } from "../utils/constants.js";

const NAV_ITEMS = [
  { id: "dashboard", icon: "◆", label: "Dashboard" },
  { id: "transactions", icon: "⟷", label: "Transactions" },
  { id: "budget", icon: "◎", label: "Budget" },
  { id: "savings", icon: "◈", label: "Savings Goals" },
  { id: "debt", icon: "▽", label: "Debt Payoff" },
  { id: "investments", icon: "△", label: "Investments" },
  { id: "networth", icon: "◇", label: "Net Worth" },
  { id: "accounts", icon: "▣", label: "Accounts" },
  { id: "badges", icon: "🏆", label: "Achievements" },
];

export { NAV_ITEMS };

export function Sidebar({ page, setPage, sidebarOpen, setSidebarOpen, user, netWorth, onShowGuide, isMobile }) {
  const handleNav = (id) => {
    setPage(id);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9 }} onClick={() => setSidebarOpen(false)} />
      )}

      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0,
        width: sidebarOpen ? 210 : (isMobile ? 0 : 56),
        background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`,
        borderRight: `1px solid ${C.border}`, padding: sidebarOpen ? "16px 0" : (isMobile ? 0 : "16px 0"),
        display: "flex", flexDirection: "column", zIndex: 10,
        transition: "width 0.25s ease", overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          onClick={() => !isMobile && setSidebarOpen(!sidebarOpen)}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0 }}>P</div>
          {sidebarOpen && <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>PROFIT HUB</div>
            <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1.5 }}>BUDGET TRACKER</div>
          </div>}
        </div>

        {/* Nav */}
        <div style={{ flex: 1 }}>
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => handleNav(n.id)} title={n.label}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: sidebarOpen ? "9px 16px" : "9px 0", border: "none", cursor: "pointer",
                background: page === n.id ? C.accentDim : "transparent",
                color: page === n.id ? C.accent : C.textMid,
                borderLeft: page === n.id ? `2px solid ${C.accent}` : "2px solid transparent",
                fontSize: 12, fontWeight: page === n.id ? 600 : 400,
                transition: "all 0.15s", fontFamily: "inherit",
                justifyContent: sidebarOpen ? "flex-start" : "center"
              }}>
              <span style={{ fontSize: 13, width: 20, textAlign: "center", flexShrink: 0 }}>{n.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: "nowrap" }}>{n.label}</span>}
            </button>
          ))}
          {sidebarOpen && (
            <button onClick={onShowGuide} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "9px 16px", border: "none", cursor: "pointer",
              background: "transparent", color: C.textDim,
              borderLeft: "2px solid transparent",
              fontSize: 12, fontWeight: 400, fontFamily: "inherit",
              marginTop: 8
            }}>
              <span style={{ fontSize: 13, width: 20, textAlign: "center" }}>❓</span>
              <span>How to Use</span>
            </button>
          )}
        </div>

        {/* Footer */}
        {sidebarOpen && (
          <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 1 }}>SIGNED IN</div>
            <div style={{ fontSize: 10, color: C.text, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email || user.displayName}
            </div>
            <div style={{ fontSize: 9, color: C.green, marginBottom: 4 }}>● Synced</div>
            <div style={{ fontSize: 9, color: C.textDim, marginBottom: 6 }}>Net Worth: <span style={{ color: netWorth >= 0 ? C.green : C.red, fontWeight: 700 }}>{netWorth >= 0 ? "+" : "-"}{fmt(netWorth)}</span></div>
            <button onClick={() => signOut(auth)} style={{ ...btnSmall, width: "100%", color: C.red, borderColor: C.red + "44", fontSize: 10 }}>Log Out</button>
          </div>
        )}
      </div>

      {/* Mobile hamburger */}
      {isMobile && !sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} style={{
          position: "fixed", top: 12, left: 12, zIndex: 11, width: 40, height: 40,
          borderRadius: 10, background: C.surface, border: `1px solid ${C.border}`,
          color: C.text, fontSize: 20, cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center"
        }}>☰</button>
      )}
    </>
  );
}

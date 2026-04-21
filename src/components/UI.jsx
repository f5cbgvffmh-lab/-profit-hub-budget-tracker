import React, { useState } from "react";
import { C, inputStyle } from "../utils/constants.js";

export function Spark({ data, color, w = 100, h = 28 }) {
  if (data.length < 2) return null;
  const mx = Math.max(...data), mn = Math.min(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) - 2}`).join(" ");
  const c2 = color === "auto" ? (data[data.length - 1] >= data[0] ? C.green : C.red) : color;
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={c2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function Donut({ value, max, color, size = 72, stroke = 7 }) {
  const p = max === 0 ? 0 : Math.min(value / max, 1);
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - p)} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
}

export function ProgressBar({ value, max, color, h = 6 }) {
  const p = max === 0 ? 0 : Math.min(value / max, 1) * 100;
  return (
    <div style={{ height: h, borderRadius: h / 2, background: C.border, overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: h / 2, width: `${p}%`, background: color, transition: "width 0.6s ease" }} />
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 28px", width: "90%", maxWidth: 460, maxHeight: "80vh", overflowY: "auto", animation: "modalIn 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMid, fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onConfirm, onCancel, message }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 28px", width: "90%", maxWidth: 360, animation: "modalIn 0.2s ease", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: C.text, marginBottom: 20, lineHeight: 1.5 }}>{message || "Are you sure?"}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button onClick={onCancel} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.textMid, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: C.red, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, color: C.textMid, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>
      {children}
    </div>
  );
}

export function NumInput({ value, onChange, style: s, ...props }) {
  return <input type="number" value={value} onChange={onChange} onFocus={e => e.target.select()} style={s || inputStyle} {...props} />;
}

export function Confetti({ show }) {
  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none" }}>
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", left: `${Math.random() * 100}%`, top: -20,
          width: 8 + Math.random() * 8, height: 8 + Math.random() * 8,
          background: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"][i % 8],
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          animation: `confettiFall ${2 + Math.random() * 3}s ease-in forwards`,
          animationDelay: `${Math.random() * 0.5}s`
        }} />
      ))}
    </div>
  );
}

export function SpendingPulse({ rate }) {
  const speed = Math.max(0.3, 2 - rate * 1.5);
  return (
    <div style={{
      width: 12, height: 12, borderRadius: "50%",
      background: rate > 0.7 ? C.red : rate > 0.4 ? C.amber : C.green,
      animation: `pulse2 ${speed}s ease-in-out infinite`
    }} />
  );
}

export function QuickAddButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
      background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, border: "none",
      color: "#fff", fontSize: 28, fontWeight: 300, cursor: "pointer", zIndex: 50,
      boxShadow: "0 4px 20px rgba(88,166,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "transform 0.2s ease",
    }}
      onMouseEnter={e => e.target.style.transform = "scale(1.1)"}
      onMouseLeave={e => e.target.style.transform = "scale(1)"}>
      +
    </button>
  );
}

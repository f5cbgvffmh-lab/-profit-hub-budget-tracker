import React, { useEffect, useRef, useState } from "react";
import { C } from "../utils/constants.js";

// ── MODAL ──
export function Modal({ title, onClose, children, width=480 }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, width:"100%", maxWidth:width, maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontWeight:700, fontSize:16, color:C.text }}>{title}</div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:C.textMid, cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  );
}

// ── CONFIRM DIALOG ──
export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:28, maxWidth:360, width:"100%", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
        <div style={{ color:C.text, fontSize:15, marginBottom:20 }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"10px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, cursor:"pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:"10px", background:C.red, border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontWeight:600 }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── SKELETON LOADER ──
export function Skeleton({ width="100%", height=20, radius=6, style={} }) {
  return (
    <div style={{
      width, height, borderRadius:radius,
      background:`linear-gradient(90deg, ${C.card} 25%, ${C.border} 50%, ${C.card} 75%)`,
      backgroundSize:"200% 100%",
      animation:"shimmer 1.4s infinite",
      ...style
    }} />
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
      <Skeleton height={12} width="40%" style={{ marginBottom:12 }} />
      <Skeleton height={28} width="60%" style={{ marginBottom:8 }} />
      <Skeleton height={10} width="80%" />
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}

// ── SPARKLINE ──
export function Sparkline({ data=[], width=80, height=30, positive=true }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v,i) => {
    const x = (i/(data.length-1||1))*width;
    const y = height - ((v-min)/range)*height;
    return `${x},${y}`;
  }).join(" ");
  const color = positive ? C.green : C.red;
  return (
    <svg width={width} height={height} style={{ display:"block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

// ── DONUT CHART ──
export function DonutChart({ segments=[], size=120, thickness=18 }) {
  const r = (size-thickness)/2;
  const circ = 2*Math.PI*r;
  const total = segments.reduce((s,x)=>s+x.value,0)||1;
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ display:"block" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={thickness} />
      {segments.map((seg,i) => {
        const dash = (seg.value/total)*circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

// ── BAR CHART ──
export function BarChart({ data=[], width=300, height=140 }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.flatMap(d=>[d.income||0, d.expenses||0]), 1);
  const barW = Math.min(24, (width / (data.length*2+data.length)));
  const gap = width / data.length;

  return (
    <svg width={width} height={height} style={{ display:"block", overflow:"visible" }}>
      {data.map((d,i) => {
        const x = i*gap + gap/2;
        const incH = ((d.income||0)/maxVal)*(height-20);
        const expH = ((d.expenses||0)/maxVal)*(height-20);
        return (
          <g key={i}>
            <rect x={x-barW-2} y={height-20-incH} width={barW} height={incH} fill={C.green} rx={3} opacity={0.85} />
            <rect x={x+2} y={height-20-expH} width={barW} height={expH} fill={C.red} rx={3} opacity={0.85} />
            <text x={x} y={height-4} textAnchor="middle" fill={C.textDim} fontSize={9}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── MINI BAR (for debt amortization) ──
export function MiniBar({ pct, color }) {
  return (
    <div style={{ width:"100%", height:6, background:C.border, borderRadius:3, overflow:"hidden" }}>
      <div style={{ width:`${Math.min(100,pct)}%`, height:"100%", background:color, borderRadius:3 }} />
    </div>
  );
}

// ── THERMOMETER ──
export function Thermometer({ pct, color=C.green }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:8, background:C.border, borderRadius:4, overflow:"hidden" }}>
        <div style={{ width:`${Math.min(100,pct)}%`, height:"100%", background:color, borderRadius:4, transition:"width 0.5s ease" }} />
      </div>
      <div style={{ fontSize:11, color:C.textMid, minWidth:36, textAlign:"right" }}>{Math.round(pct)}%</div>
    </div>
  );
}

// ── CONFETTI ──
export function Confetti({ active }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!active || !ref.current) return;
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const pieces = Array.from({length:120},()=>({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height-canvas.height,
      r: Math.random()*6+3, color:["#58A6FF","#3FB950","#BC8CFF","#D29922","#F778BA"][Math.floor(Math.random()*5)],
      vx:(Math.random()-0.5)*3, vy:Math.random()*4+2, rot:Math.random()*360, vr:Math.random()*4-2
    }));
    let raf;
    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pieces.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180); ctx.fillStyle=p.color; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r); ctx.restore(); });
      raf = requestAnimationFrame(draw);
    }
    draw();
    const t = setTimeout(()=>cancelAnimationFrame(raf),3000);
    return ()=>{ cancelAnimationFrame(raf); clearTimeout(t); };
  },[active]);
  if (!active) return null;
  return <canvas ref={ref} style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:9999 }} />;
}

// ── SPENDING PULSE ──
export function SpendingPulse({ amount }) {
  const high = amount > 500;
  return (
    <div style={{ position:"relative", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{
        width:10, height:10, borderRadius:"50%", background: high ? C.red : C.green,
        boxShadow:`0 0 0 0 ${high?C.red:C.green}`,
        animation: "pulse 1.5s infinite"
      }} />
      <style>{`@keyframes pulse { 0%{box-shadow:0 0 0 0 currentColor66} 70%{box-shadow:0 0 0 8px transparent} 100%{box-shadow:0 0 0 0 transparent} }`}</style>
    </div>
  );
}

// ── QUICK ADD BUTTON ──
export function QuickAddButton({ onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        position:"fixed", bottom:24, right:24, zIndex:500,
        width:52, height:52, borderRadius:"50%",
        background: hover ? "#4090FF" : C.accent,
        border:"none", color:"#fff", fontSize:26, cursor:"pointer",
        boxShadow:"0 4px 20px rgba(88,166,255,0.4)",
        transform: hover ? "scale(1.1)" : "scale(1)",
        transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center"
      }}>+</button>
  );
}

// ── KPI CARD ──
export function KpiCard({ label, value, sub, color, icon, loading }) {
  if (loading) return <SkeletonCard />;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 20px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <div style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
        <div style={{ fontSize:18 }}>{icon}</div>
      </div>
      <div style={{ fontSize:24, fontWeight:700, color: color||C.text }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.textMid, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ── SECTION CARD ──
export function SectionCard({ title, children, action }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ fontWeight:600, fontSize:14, color:C.text }}>{title}</div>
        {action}
      </div>
      <div style={{ padding:18 }}>{children}</div>
    </div>
  );
}

// ── INPUT ──
export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12, color:C.textMid, marginBottom:6 }}>{label}</div>}
      <input {...props} onFocus={e=>e.target.select()} style={{
        width:"100%", padding:"10px 12px", background:C.surface,
        border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, outline:"none",
        ...(props.style||{})
      }} />
    </div>
  );
}

// ── SELECT ──
export function Select({ label, options=[], ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:12, color:C.textMid, marginBottom:6 }}>{label}</div>}
      <select {...props} style={{
        width:"100%", padding:"10px 12px", background:C.surface,
        border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, outline:"none",
        ...(props.style||{})
      }}>
        {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
    </div>
  );
}

// ── PERIOD TABS ──
export function PeriodTabs({ value, onChange }) {
  const periods = ["daily","weekly","biweekly","monthly","semiannual","yearly"];
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
      {periods.map(p => (
        <button key={p} onClick={()=>onChange(p)} style={{
          padding:"4px 10px", borderRadius:20, border:"none", cursor:"pointer", fontSize:11,
          background: value===p ? C.accent : C.surface,
          color: value===p ? "#fff" : C.textMid, fontWeight: value===p ? 600 : 400
        }}>{p.charAt(0).toUpperCase()+p.slice(1)}</button>
      ))}
    </div>
  );
}

// ── BADGE CHIP ──
export function BadgeChip({ earned, icon, name }) {
  return (
    <div style={{
      display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px",
      background: earned ? C.amber+"22" : C.surface,
      border:`1px solid ${earned ? C.amber : C.border}`, borderRadius:20, fontSize:11,
      color: earned ? C.amber : C.textDim
    }}>
      <span>{icon}</span><span>{name}</span>
    </div>
  );
}

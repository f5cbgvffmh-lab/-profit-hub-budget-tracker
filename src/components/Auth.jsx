import React, { useState } from "react";
import { auth, googleProvider } from "../firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { C } from "../utils/constants.js";

export function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const card = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, width: "100%", maxWidth: 400 };
  const inp = { width:"100%", padding:"12px 14px", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:14, outline:"none" };
  const btn = { width:"100%", padding:"12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:14, fontWeight:600 };

  async function submit() {
    setErr(""); setLoading(true);
    try {
      if (mode==="login") await signInWithEmailAndPassword(auth, email, pass);
      else await createUserWithEmailAndPassword(auth, email, pass);
    } catch(e) { setErr(e.message.replace("Firebase: ","").replace(/\(auth.*\)/,"")); }
    setLoading(false);
  }

  async function google() {
    try { await signInWithPopup(auth, googleProvider); }
    catch(e) { setErr(e.message); }
  }

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={card}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>💰</div>
          <div style={{ fontSize:24, fontWeight:700, color:C.text }}>Profit Hub</div>
          <div style={{ fontSize:13, color:C.textMid, marginTop:4 }}>Your financial command center</div>
        </div>

        <div style={{ display:"flex", background:C.surface, borderRadius:8, padding:3, marginBottom:20 }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={()=>setMode(m)} style={{
              flex:1, padding:"8px", border:"none", borderRadius:6, cursor:"pointer",
              background: mode===m ? C.accent : "transparent",
              color: mode===m ? "#fff" : C.textMid, fontWeight:600, fontSize:13
            }}>{m==="login" ? "Sign In" : "Sign Up"}</button>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <input style={inp} placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
          <input style={inp} placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} />
          {err && <div style={{ fontSize:12, color:C.red, padding:"8px 12px", background:C.red+"22", borderRadius:6 }}>{err}</div>}
          <button onClick={submit} disabled={loading} style={{ ...btn, background:C.accent, color:"#fff" }}>
            {loading ? "Loading..." : mode==="login" ? "Sign In" : "Create Account"}
          </button>
          <div style={{ textAlign:"center", color:C.textDim, fontSize:12 }}>or</div>
          <button onClick={google} style={{ ...btn, background:C.surface, color:C.text, border:`1px solid ${C.border}` }}>
            🔵 Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase.js";
import { C, inputStyle, btnPrimary } from "../utils/constants.js";
import { Field } from "./UI.jsx";

export function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmail = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") await signInWithEmailAndPassword(auth, email, pass);
      else await createUserWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      const msg =
        e.code === "auth/user-not-found" ? "No account found." :
        e.code === "auth/wrong-password" ? "Wrong password." :
        e.code === "auth/email-already-in-use" ? "Email already registered." :
        e.code === "auth/weak-password" ? "Password must be 6+ characters." :
        e.code === "auth/invalid-email" ? "Invalid email." :
        e.code === "auth/invalid-credential" ? "Invalid email or password." :
        e.message;
      setError(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { setError(e.message); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", padding: 16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <div style={{ width: "100%", maxWidth: 380, padding: "40px 32px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}, ${C.cyan})`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 12 }}>P</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>PROFIT HUB</div>
          <div style={{ fontSize: 11, color: C.textDim, letterSpacing: 2, marginTop: 2 }}>BUDGET TRACKER</div>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex: 1, padding: "8px", borderRadius: 8,
              border: `1px solid ${mode === m ? C.accent : C.border}`,
              background: mode === m ? C.accentDim : "transparent",
              color: mode === m ? C.accent : C.textMid,
              fontSize: 12, fontWeight: mode === m ? 600 : 400,
              cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize"
            }}>{m === "login" ? "Log In" : "Sign Up"}</button>
          ))}
        </div>
        <Field label="Email"><input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@email.com" type="email" /></Field>
        <Field label="Password"><input value={pass} onChange={e => setPass(e.target.value)} style={inputStyle} placeholder="••••••" type="password" onKeyDown={e => e.key === "Enter" && handleEmail()} /></Field>
        {error && <div style={{ color: C.red, fontSize: 11, marginBottom: 12, padding: "8px 12px", background: C.redDim, borderRadius: 8 }}>{error}</div>}
        <button onClick={handleEmail} disabled={loading} style={{ ...btnPrimary, width: "100%", marginBottom: 10, opacity: loading ? 0.6 : 1 }}>
          {loading ? "..." : (mode === "login" ? "Log In" : "Create Account")}
        </button>
        <div style={{ textAlign: "center", color: C.textDim, fontSize: 11, margin: "12px 0" }}>or</div>
        <button onClick={handleGoogle} style={{
          width: "100%", padding: "10px 20px", borderRadius: 8,
          border: `1px solid ${C.border}`, background: "transparent",
          color: C.text, fontSize: 13, fontWeight: 500, cursor: "pointer",
          fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          <span style={{ fontSize: 16 }}>G</span> Continue with Google
        </button>
      </div>
    </div>
  );
}

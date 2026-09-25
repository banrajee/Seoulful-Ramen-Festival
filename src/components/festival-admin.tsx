"use client";

import { type FormEvent, useEffect, useState } from "react";
import { FestivalEditor } from "./festival-editor";
import { createBrowserSupabaseClient, hasSupabaseConfig } from "@/lib/supabase";

export function FestivalAdmin() {
  const [supabase] = useState(() => createBrowserSupabaseClient());
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    void supabase.auth.getSession().then(({ data }) => { setLoggedIn(Boolean(data.session)); setChecking(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMessage(error ? error.message : "Signed in. Festival controls are ready.");
  }

  if (!hasSupabaseConfig()) return <main className="festival-admin-page"><section className="festival-admin-panel"><h1>Supabase setup needed</h1><p>Add the two public Supabase environment variables to this festival deployment.</p></section></main>;
  if (checking) return <main className="festival-admin-page"><section className="festival-admin-panel"><p>Checking owner session…</p></section></main>;
  if (!loggedIn) return <main className="festival-admin-page"><section className="festival-admin-panel"><h1>Festival Owner Login</h1><p>Use the existing Seoulful owner account. Authentication remains in the shared Supabase project.</p><form className="festival-login-form" onSubmit={login}><label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form>{message ? <p className="festival-admin-message">{message}</p> : null}</section></main>;

  return <main className="festival-admin-page"><section className="festival-admin-panel"><header className="festival-admin-header"><div><p>Seoulful Ramen</p><h1>Festival Admin</h1></div><button type="button" onClick={() => void supabase?.auth.signOut()}>Sign out</button></header><FestivalEditor /></section></main>;
}


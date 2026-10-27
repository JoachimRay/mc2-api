"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (creating) {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) setError(signUpError.message);
        else if (!data.session) setNotice("Account created. Check your email to confirm it, then sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) setError(signInError.message);
      }
    } catch {
      setError("Unable to connect to the authentication service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-77px)] items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[1px] text-zinc-400">BOARDING HOUSE / LEDGER</p>
          <h1 className="mt-3 text-3xl font-bold">{creating ? "Create a client account" : "Sign in"}</h1>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="border border-zinc-800 bg-black px-3 py-3 text-white outline-none focus:border-white" />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="border border-zinc-800 bg-black px-3 py-3 text-white outline-none focus:border-white" />
        </label>
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <button type="submit" disabled={loading} className="border border-white px-3 py-3 text-sm font-bold hover:bg-white hover:text-black disabled:opacity-50">
          {loading ? "Please wait..." : creating ? "Create account" : "Sign in"}
        </button>
        {notice && <p className="text-sm text-zinc-400" role="status">{notice}</p>}
        <button type="button" disabled={loading} onClick={() => { setCreating((value) => !value); setError(null); setNotice(null); }} className="text-left text-sm text-zinc-400 underline underline-offset-4 disabled:opacity-50">
          {creating ? "I already have an account" : "Create a client account"}
        </button>
      </form>
    </main>
  );
}

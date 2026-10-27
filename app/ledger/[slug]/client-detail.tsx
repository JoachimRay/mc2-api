"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/ledger";

type Customer = { id: string; name: string; balance: number; lastPaid: string };
type Entry = { id: string; kind: "due" | "payment"; amount: number; createdAt: string };

export function ClientLedgerDetail({ id }: { id: string }) {
  const profile = useProfile();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Please sign in to view this account.");
        const headers = { Authorization: `Bearer ${token}` };
        const [customerResponse, entriesResponse] = await Promise.all([
          fetch(`/api/customers/${encodeURIComponent(id)}`, { headers, cache: "no-store" }),
          fetch(`/api/customers/${encodeURIComponent(id)}/entries`, { headers, cache: "no-store" }),
        ]);
        if (!customerResponse.ok || !entriesResponse.ok) {
          if (customerResponse.status === 404 || entriesResponse.status === 404) throw new Error("This customer account was not found.");
          if (customerResponse.status === 401 || entriesResponse.status === 401) throw new Error("Your session expired. Sign in again.");
          throw new Error("Unable to load account history.");
        }
        const [nextCustomer, nextEntries] = await Promise.all([
          customerResponse.json() as Promise<Customer>,
          entriesResponse.json() as Promise<Entry[]>,
        ]);
        if (active) {
          setCustomer(nextCustomer);
          setEntries(nextEntries);
          setProblem("");
        }
      } catch (error) {
        if (active) setProblem(error instanceof Error ? error.message : "Unable to load account history.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, [id, attempt]);

  async function record(kind: Entry["kind"]) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || saving) return;
    if (kind === "payment" && customer && value > customer.balance) {
      setProblem("Payment cannot be more than the current balance.");
      return;
    }

    setSaving(true);
    setProblem("");
    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch(`/api/customers/${encodeURIComponent(id)}/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ kind, amount: value }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to save this entry.");
      setAmount("");
      setAttempt((current) => current + 1);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "Unable to save this entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-[calc(100%-32px)] max-w-[1000px] py-10 md:w-[calc(100%-48px)]">
      <Link href="/ledger" className="text-sm text-zinc-400">← Back to accounts</Link>
      {loading ? <p className="py-12 text-sm text-zinc-400">Loading account...</p> : problem && !customer ? (
        <p className="py-12 text-sm text-red-400" role="alert">{problem}</p>
      ) : customer && (
        <>
          <section className="mt-14 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="text-[11px] uppercase tracking-[1px] text-zinc-400">TENANT ACCOUNT / {customer.id.toUpperCase()}</p><h1 className="mt-3 text-4xl font-bold">{customer.name}</h1><p className="mt-3 text-zinc-400">Last payment recorded {customer.lastPaid}</p></div>
            <span className="border border-zinc-800 px-2.5 py-2 text-xs text-zinc-400">{customer.balance === 0 ? "Paid in full" : "Balance due"}</span>
          </section>
          <section className="my-9 grid gap-8 border-y border-zinc-800 py-7 md:grid-cols-2">
            <article className="flex flex-col gap-2"><span className="text-[11px] uppercase tracking-[1px] text-zinc-400">Current balance</span><strong className="text-4xl">{formatCurrency(customer.balance)}</strong><p className="text-zinc-400">{customer.balance > 0 ? `Outstanding balance of ${formatCurrency(customer.balance)}.` : "Account is fully paid."}</p></article>
            <article className="flex flex-col gap-2"><span className="text-[11px] uppercase tracking-[1px] text-zinc-400">Account ID</span><strong>{customer.id}</strong><span className="mt-3 text-[11px] uppercase tracking-[1px] text-zinc-400">Last payment</span><strong>{customer.lastPaid}</strong></article>
          </section>
          <section className="border-t border-zinc-800 pt-7">
            <div><p className="text-[11px] uppercase tracking-[1px] text-zinc-400">PAYMENT HISTORY</p><h2 className="mt-2 text-2xl font-bold">Ledger activity</h2></div>
            {problem && <p className="mt-4 text-sm text-red-400" role="alert">{problem}</p>}
            {profile?.role === "admin" && (
              <form className="mt-6 grid gap-3 border border-zinc-800 p-5 sm:grid-cols-[1fr_auto_auto] sm:items-end" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void record("due"); }}>
                <label className="flex flex-col gap-2 text-sm">Amount<input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} className="border border-zinc-800 bg-black px-3 py-3 outline-none focus:border-white" /></label>
                <button type="submit" disabled={saving || !amount} className="border border-white px-4 py-3 text-sm font-bold hover:bg-white hover:text-black disabled:opacity-50">{saving ? "Saving..." : "Add due"}</button>
                <button type="button" disabled={saving || !amount} onClick={() => void record("payment")} className="border border-white px-4 py-3 text-sm font-bold hover:bg-white hover:text-black disabled:opacity-50">{saving ? "Saving..." : "Record payment"}</button>
              </form>
            )}
            {entries.length === 0 ? <p className="mt-6 py-6 text-zinc-400">No dues or payments recorded yet.</p> : (
              <ul className="mt-6 divide-y divide-zinc-800 border-t border-zinc-800">
                {entries.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-4 py-4">
                    <div><strong>{entry.kind === "due" ? "Due" : "Payment"}</strong><p className="mt-1 text-sm text-zinc-400">{new Date(entry.createdAt).toLocaleString()}</p></div>
                    <strong>{entry.kind === "due" ? "+" : "−"}{formatCurrency(entry.amount)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

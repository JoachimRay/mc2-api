"use client";

import { useEffect, useState } from "react";
import { AddCustomer } from "./add-customer";
import { ProjectSearch } from "./search";
import { formatCurrency, type Project } from "@/lib/ledger";
import { supabase } from "@/lib/supabase";

type Customer = { id: string; name: string; balance: number; lastPaid: string };

export function ClientLedgerPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Please sign in to view the ledger.");

        const response = await fetch("/api/customers", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again." : "Unable to load customer accounts.");

        const customers = (await response.json()) as Customer[];
        if (!active) return;
        setProjects(customers.map((customer) => ({
          ...customer,
          slug: customer.id,
          title: customer.name,
          year: customer.lastPaid,
          summary: customer.balance > 0
            ? `Outstanding balance of ${formatCurrency(customer.balance)}.`
            : "Account is fully paid.",
        })));
        setProblem("");
      } catch (error) {
        if (active) setProblem(error instanceof Error ? error.message : "Unable to load customer accounts.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, []);

  const outstanding = projects.reduce((total, project) => total + project.balance, 0);
  const paidAccounts = projects.filter((project) => project.balance === 0).length;

  return (
    <main className="mx-auto w-[calc(100%-32px)] max-w-[1000px] py-12 md:w-[calc(100%-48px)] md:py-16">
      <section className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div>
          <p className="text-[11px] uppercase tracking-[1px] text-zinc-400">BOARDING HOUSE / LEDGER</p>
          <h1 className="mt-3 text-4xl font-bold md:text-[44px]">Accounts overview</h1>
          <p className="mt-3 text-zinc-400">Track tenant balances and payment activity in one place.</p>
        </div>
      </section>
      {problem && <p className="mt-8 text-sm text-red-400" role="alert">{problem}</p>}
      {loading ? <p className="py-12 text-sm text-zinc-400">Loading accounts...</p> : (
        <>
          <section className="my-10 grid gap-6 md:my-14 md:grid-cols-3" aria-label="Ledger summary">
            <article className="flex flex-col gap-2"><span className="text-[11px] uppercase tracking-[1px] text-zinc-400">Total outstanding</span><strong className="text-3xl">{formatCurrency(outstanding)}</strong><span className="text-xs text-zinc-400">Across {projects.length} accounts</span></article>
            <article className="flex flex-col gap-2"><span className="text-[11px] uppercase tracking-[1px] text-zinc-400">Active accounts</span><strong className="text-3xl">{projects.length}</strong><span className="text-xs text-zinc-400">Tenants on the ledger</span></article>
            <article className="flex flex-col gap-2"><span className="text-[11px] uppercase tracking-[1px] text-zinc-400">Paid in full</span><strong className="text-3xl">{paidAccounts}</strong><span className="text-xs text-zinc-400">No balance due</span></article>
          </section>
          <section className="border-t border-zinc-800 pt-7">
            <div className="flex items-start justify-between gap-6">
              <div><p className="text-[11px] uppercase tracking-[1px] text-zinc-400">ACCOUNT LEDGER</p><h2 className="mt-2 text-2xl font-bold">Tenant accounts</h2></div>
              <span className="text-xs text-zinc-400">{projects.length} records</span>
            </div>
            <ProjectSearch projects={projects} />
            <AddCustomer />
          </section>
        </>
      )}
    </main>
  );
}

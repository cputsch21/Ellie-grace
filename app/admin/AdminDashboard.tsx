"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { Order } from "@/lib/orders";
import {
  archiveAction,
  logoutAction,
  markStatusAction,
  restoreAction,
} from "./actions";

type Tab = "new" | "done" | "archived";

type OptAction =
  | { type: "status"; id: string; status: "new" | "done" }
  | { type: "archive"; id: string }
  | { type: "restore"; id: string };

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminDashboard({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
  const [tab, setTab] = useState<Tab>("new");
  const [pending, startTransition] = useTransition();
  const [orders, applyOptimistic] = useOptimistic(
    initialOrders,
    (state: Order[], action: OptAction) => {
      switch (action.type) {
        case "status":
          return state.map((o) =>
            o.id === action.id ? { ...o, status: action.status } : o,
          );
        case "archive":
          return state.map((o) =>
            o.id === action.id
              ? { ...o, deletedAt: new Date().toISOString() }
              : o,
          );
        case "restore":
          return state.map((o) =>
            o.id === action.id ? { ...o, deletedAt: null } : o,
          );
      }
    },
  );

  const live = orders.filter((o) => !o.deletedAt);
  const newOrders = live.filter((o) => o.status === "new");
  const doneOrders = live.filter((o) => o.status === "done");
  const archived = orders.filter((o) => o.deletedAt);

  const earned = doneOrders.reduce((s, o) => s + o.total, 0);
  const waiting = newOrders.reduce((s, o) => s + o.total, 0);

  function setDone(id: string, done: boolean) {
    startTransition(async () => {
      applyOptimistic({ type: "status", id, status: done ? "done" : "new" });
      await markStatusAction(id, done ? "done" : "new");
    });
  }
  function archive(id: string) {
    startTransition(async () => {
      applyOptimistic({ type: "archive", id });
      await archiveAction(id);
    });
  }
  function restore(id: string) {
    startTransition(async () => {
      applyOptimistic({ type: "restore", id });
      await restoreAction(id);
    });
  }

  const list =
    tab === "new" ? newOrders : tab === "done" ? doneOrders : archived;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "new", label: "New", count: newOrders.length },
    { key: "done", label: "Done", count: doneOrders.length },
    { key: "archived", label: "Archived", count: archived.length },
  ];

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ellie &amp; Grace&rsquo;s Rainbow Loom Shop
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
          >
            View shop ↗
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      {/* Earnings */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-4xl bg-gradient-to-br from-sunshine-100 to-bubblegum-50 p-5 shadow-card">
          <p className="text-sm font-bold text-amber-600">🎉 Money earned</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">
            ${earned}
          </p>
          <p className="text-xs text-slate-500">from finished orders</p>
        </div>
        <div className="rounded-4xl bg-gradient-to-br from-grape-50 to-sky-50 p-5 shadow-card">
          <p className="text-sm font-bold text-grape-500">🧵 Still to make</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">
            ${waiting}
          </p>
          <p className="text-xs text-slate-500">
            {newOrders.length} new {newOrders.length === 1 ? "order" : "orders"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-7 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-150 ${
              tab === t.key
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}{" "}
            <span
              className={tab === t.key ? "text-slate-300" : "text-slate-400"}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-5 space-y-4" aria-busy={pending}>
        {list.length === 0 ? (
          <p className="rounded-4xl bg-white/70 p-10 text-center text-slate-500 ring-1 ring-slate-100">
            {tab === "new"
              ? "No new orders yet — they'll show up here! 🌈"
              : tab === "done"
                ? "No finished orders yet."
                : "Nothing archived."}
          </p>
        ) : (
          list.map((o) => (
            <article
              key={o.id}
              className="rounded-4xl bg-white p-6 shadow-card ring-1 ring-slate-100"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {o.customerName}
                  </h2>
                  <a
                    href={`tel:${o.phone.replace(/[^\d+]/g, "")}`}
                    className="text-sm font-semibold text-sky-600 hover:underline"
                  >
                    📞 {o.phone}
                  </a>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-grape-600">
                    ${o.total}
                  </div>
                  <div className="text-xs text-slate-400" title={formatWhen(o.createdAt)}>
                    {timeAgo(o.createdAt)}
                  </div>
                </div>
              </div>

              <ul className="mt-4 space-y-1 rounded-3xl bg-slate-50 p-4 text-sm">
                {o.items.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between text-slate-700"
                  >
                    <span className="font-semibold">
                      {i.name}{" "}
                      <span className="text-slate-400">× {i.qty}</span>
                    </span>
                    <span className="font-bold">${i.price * i.qty}</span>
                  </li>
                ))}
              </ul>

              {o.note && (
                <p className="mt-3 rounded-3xl bg-sunshine-100 px-4 py-3 text-sm text-amber-800">
                  <span className="font-bold">✏️ Special request:</span>{" "}
                  {o.note}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {!o.deletedAt && o.status === "new" && (
                  <button
                    onClick={() => setDone(o.id, true)}
                    disabled={pending}
                    className="rounded-full bg-grape-500 px-5 py-2 text-sm font-extrabold text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-grape-600 disabled:opacity-60"
                  >
                    ✓ Mark done
                  </button>
                )}
                {!o.deletedAt && o.status === "done" && (
                  <button
                    onClick={() => setDone(o.id, false)}
                    disabled={pending}
                    className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-60"
                  >
                    ↩ Reopen
                  </button>
                )}
                {o.deletedAt ? (
                  <button
                    onClick={() => restore(o.id)}
                    disabled={pending}
                    className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-60"
                  >
                    ↩ Restore
                  </button>
                ) : (
                  <button
                    onClick={() => archive(o.id)}
                    disabled={pending}
                    className="rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-400 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-60"
                  >
                    Archive
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}

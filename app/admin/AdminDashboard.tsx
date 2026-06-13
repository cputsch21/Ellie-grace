"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { BraceletStatus, Order, PaymentStatus } from "@/lib/orders";
import { logoutAction, setBraceletAction, setPaidAction } from "./actions";

type Tab = BraceletStatus;

type OptAction =
  | { type: "bracelet"; id: string; bracelet: BraceletStatus }
  | { type: "paid"; id: string; paid: PaymentStatus };

const braceletOptions: { value: BraceletStatus; label: string }[] = [
  { value: "not_made", label: "Not made" },
  { value: "made", label: "Made" },
  { value: "delivered", label: "Delivered" },
];

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
  const [tab, setTab] = useState<Tab>("not_made");
  const [pending, startTransition] = useTransition();
  const [orders, applyOptimistic] = useOptimistic(
    initialOrders,
    (state: Order[], action: OptAction) => {
      switch (action.type) {
        case "bracelet":
          return state.map((o) =>
            o.id === action.id ? { ...o, bracelet: action.bracelet } : o,
          );
        case "paid":
          return state.map((o) =>
            o.id === action.id ? { ...o, paid: action.paid } : o,
          );
      }
    },
  );

  const notMade = orders.filter((o) => o.bracelet === "not_made");
  const made = orders.filter((o) => o.bracelet === "made");
  const delivered = orders.filter((o) => o.bracelet === "delivered");

  // Money already collected, no matter the bracelet stage.
  const earned = orders
    .filter((o) => o.paid === "paid")
    .reduce((s, o) => s + o.total, 0);
  // Made (or delivered) but not yet fully closed out (delivered AND paid).
  const madeOutstanding = orders
    .filter(
      (o) =>
        o.bracelet !== "not_made" &&
        !(o.bracelet === "delivered" && o.paid === "paid"),
    )
    .reduce((s, o) => s + o.total, 0);
  const stillToMake = notMade.reduce((s, o) => s + o.total, 0);

  function setBracelet(id: string, bracelet: BraceletStatus) {
    startTransition(async () => {
      applyOptimistic({ type: "bracelet", id, bracelet });
      await setBraceletAction(id, bracelet);
    });
  }
  function setPaid(id: string, paid: PaymentStatus) {
    startTransition(async () => {
      applyOptimistic({ type: "paid", id, paid });
      await setPaidAction(id, paid);
    });
  }

  const list = tab === "not_made" ? notMade : tab === "made" ? made : delivered;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "not_made", label: "Not made", count: notMade.length },
    { key: "made", label: "Made", count: made.length },
    { key: "delivered", label: "Delivered", count: delivered.length },
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
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-4xl bg-gradient-to-br from-sunshine-100 to-bubblegum-50 p-5 shadow-card">
          <p className="text-sm font-bold text-amber-600">🎉 Money earned</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">
            ${earned}
          </p>
          <p className="text-xs text-slate-500">from paid orders</p>
        </div>
        <div className="rounded-4xl bg-gradient-to-br from-bubblegum-50 to-sunshine-100 p-5 shadow-card">
          <p className="text-sm font-bold text-bubblegum-500">
            📦 Made, not delivered
          </p>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">
            ${madeOutstanding}
          </p>
          <p className="text-xs text-slate-500">made but not wrapped up</p>
        </div>
        <div className="rounded-4xl bg-gradient-to-br from-grape-50 to-sky-50 p-5 shadow-card">
          <p className="text-sm font-bold text-grape-500">🧵 Still to make</p>
          <p className="mt-1 text-3xl font-extrabold text-slate-800">
            ${stillToMake}
          </p>
          <p className="text-xs text-slate-500">
            {notMade.length} {notMade.length === 1 ? "order" : "orders"}
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
            {tab === "not_made"
              ? "Nothing to make right now — new orders show up here! 🌈"
              : tab === "made"
                ? "No made bracelets waiting."
                : "Nothing delivered yet."}
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

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Bracelet
                  </p>
                  <div className="flex gap-1.5">
                    {braceletOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setBracelet(o.id, opt.value)}
                        disabled={pending}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-150 disabled:opacity-60 ${
                          o.bracelet === opt.value
                            ? "bg-slate-800 text-white"
                            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Money
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setPaid(o.id, "paid")}
                      disabled={pending}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-150 disabled:opacity-60 ${
                        o.paid === "paid"
                          ? "bg-emerald-500 text-white"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Paid
                    </button>
                    <button
                      onClick={() => setPaid(o.id, "not_paid")}
                      disabled={pending}
                      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-150 disabled:opacity-60 ${
                        o.paid === "not_paid"
                          ? "bg-slate-800 text-white"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Not paid
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}

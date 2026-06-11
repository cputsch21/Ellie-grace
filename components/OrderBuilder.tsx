"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/products";
import { placeOrderAction } from "@/app/actions";

type DoneState = {
  name: string;
  phone: string;
  total: number;
  items: { name: string; qty: number; price: number }[];
};

export default function OrderBuilder({ products }: { products: Product[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<DoneState | null>(null);
  const successRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (done) {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [done]);

  const selected = useMemo(
    () =>
      products
        .map((p) => ({ ...p, qty: quantities[p.id] || 0 }))
        .filter((p) => p.qty > 0),
    [products, quantities],
  );
  const total = useMemo(
    () => selected.reduce((sum, p) => sum + p.price * p.qty, 0),
    [selected],
  );
  const itemCount = selected.reduce((sum, p) => sum + p.qty, 0);
  const hasCustom = selected.some((p) => p.id === "custom");

  function setQty(id: string, qty: number) {
    setQuantities((q) => ({ ...q, [id]: Math.max(0, Math.min(99, qty)) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (selected.length === 0) {
      setError("Pick at least one thing to order!");
      return;
    }
    setSubmitting(true);
    const res = await placeOrderAction({
      customerName: name,
      phone,
      note,
      quantities,
    });
    setSubmitting(false);
    if (res.ok) {
      setDone({
        name: name.trim(),
        phone: phone.trim(),
        total: res.order.total,
        items: res.order.items,
      });
      setQuantities({});
      setName("");
      setPhone("");
      setNote("");
    } else {
      setError(res.error);
    }
  }

  if (done) {
    return (
      <section id="order" ref={successRef} className="scroll-mt-6 px-6 py-16">
        <div className="mx-auto max-w-lg animate-pop rounded-5xl bg-white p-8 text-center shadow-soft ring-1 ring-bubblegum-100 sm:p-10">
          <div className="text-5xl">🎉</div>
          <h2 className="mt-3 text-3xl font-bold text-slate-800">
            Order placed!
          </h2>
          <p className="mt-2 text-slate-600">
            Thank you, {done.name}! Ellie &amp; Grace got your order.
          </p>

          <ul className="mt-6 space-y-2 rounded-4xl bg-grape-50 p-5 text-left">
            {done.items.map((i) => (
              <li
                key={i.name}
                className="flex items-center justify-between text-slate-700"
              >
                <span className="font-semibold">
                  {i.name}{" "}
                  <span className="text-slate-400">× {i.qty}</span>
                </span>
                <span className="font-bold">${i.price * i.qty}</span>
              </li>
            ))}
            <li className="mt-2 flex items-center justify-between border-t border-grape-200 pt-3 text-lg">
              <span className="font-bold text-slate-800">Total</span>
              <span className="font-extrabold text-grape-600">
                ${done.total}
              </span>
            </li>
          </ul>

          <p className="mt-6 text-slate-600">
            We&rsquo;ll text you at{" "}
            <span className="font-bold text-slate-800">{done.phone}</span> to
            set up pickup. Cash only 💕
          </p>

          <button
            onClick={() => setDone(null)}
            className="mt-7 inline-flex items-center justify-center rounded-full bg-bubblegum-500 px-7 py-3 text-base font-extrabold text-white shadow-lift transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-bubblegum-600"
          >
            Place another order
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="order" className="scroll-mt-6 px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div id="shop" className="scroll-mt-6 text-center">
          <h2 className="text-3xl font-bold text-slate-800 sm:text-4xl">
            What we make
          </h2>
          <p className="mx-auto mt-3 max-w-md text-slate-600">
            Tap the <span className="font-bold text-bubblegum-500">+</span> to
            add goodies to your order. The total adds up as you go!
          </p>
        </div>

        {/* Products */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const qty = quantities[p.id] || 0;
            const active = qty > 0;
            return (
              <div
                key={p.id}
                className={`flex flex-col rounded-4xl bg-white/90 p-6 shadow-card ring-1 transition-all duration-150 ease-out ${
                  active
                    ? "-translate-y-0.5 ring-2 ring-bubblegum-300"
                    : "ring-slate-100 hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-4xl" aria-hidden>
                    {p.emoji}
                  </span>
                  {p.badge && (
                    <span className="rounded-full bg-sunshine-100 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-amber-600">
                      {p.badge}
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-800">
                  {p.name}
                </h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500">
                  {p.blurb}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-grape-500">
                    ${p.price}
                  </span>

                  {qty === 0 ? (
                    <button
                      onClick={() => setQty(p.id, 1)}
                      className="inline-flex items-center gap-1 rounded-full bg-bubblegum-500 px-5 py-2 text-sm font-extrabold text-white transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-bubblegum-600"
                    >
                      <span aria-hidden>+</span> Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 rounded-full bg-grape-50 p-1">
                      <button
                        onClick={() => setQty(p.id, qty - 1)}
                        aria-label={`Remove one ${p.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-bold text-grape-500 shadow-sm transition-transform duration-150 ease-out hover:-translate-y-0.5"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-lg font-extrabold text-slate-800">
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty(p.id, qty + 1)}
                        aria-label={`Add one ${p.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-bubblegum-500 text-xl font-bold text-white shadow-sm transition-transform duration-150 ease-out hover:-translate-y-0.5"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order form */}
        <form
          id="order-form"
          onSubmit={handleSubmit}
          className="mx-auto mt-12 max-w-2xl scroll-mt-6 rounded-5xl bg-white p-7 shadow-soft ring-1 ring-grape-100 sm:p-9"
        >
          <h3 className="text-2xl font-bold text-slate-800">Your order</h3>

          {selected.length === 0 ? (
            <p className="mt-4 rounded-4xl bg-grape-50 p-5 text-center text-slate-500">
              Tap <span className="font-bold text-bubblegum-500">+ Add</span> on
              the goodies above to start your order. 💖
            </p>
          ) : (
            <ul className="mt-4 space-y-2 rounded-4xl bg-grape-50 p-5">
              {selected.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-slate-700"
                >
                  <span className="font-semibold">
                    {p.name}{" "}
                    <span className="text-slate-400">× {p.qty}</span>
                  </span>
                  <span className="font-bold">${p.price * p.qty}</span>
                </li>
              ))}
              <li className="mt-2 flex items-center justify-between border-t border-grape-200 pt-3 text-lg">
                <span className="font-bold text-slate-800">Total</span>
                <span className="font-extrabold text-grape-600">${total}</span>
              </li>
            </ul>
          )}

          {hasCustom && (
            <p className="mt-4 rounded-3xl bg-sunshine-100 px-4 py-3 text-sm font-semibold text-amber-700">
              💡 You picked a custom item! Tell us the colors, initials, or
              design in the special requests box below.
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-bold text-slate-700"
              >
                Your name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Grandma Sue"
                className="mt-1.5 w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 ring-1 ring-transparent transition-shadow duration-150 ease-out focus:bg-white focus:outline-none focus:ring-2 focus:ring-bubblegum-300"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-bold text-slate-700"
              >
                Phone number
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                autoComplete="tel"
                placeholder="(555) 123-4567"
                className="mt-1.5 w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 ring-1 ring-transparent transition-shadow duration-150 ease-out focus:bg-white focus:outline-none focus:ring-2 focus:ring-bubblegum-300"
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="note"
              className="block text-sm font-bold text-slate-700"
            >
              Special requests{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Colors, initials, hearts, flowers, sizes... anything special!"
              className="mt-1.5 w-full resize-none rounded-2xl border-0 bg-slate-50 px-4 py-3 text-slate-800 placeholder:text-slate-400 ring-1 ring-transparent transition-shadow duration-150 ease-out focus:bg-white focus:outline-none focus:ring-2 focus:ring-bubblegum-300"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-3xl bg-bubblegum-50 px-4 py-3 text-center text-sm font-bold text-bubblegum-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || total === 0}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-bubblegum-500 px-7 py-4 text-lg font-extrabold text-white shadow-lift transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-bubblegum-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting
              ? "Placing your order..."
              : total > 0
                ? `Place order · $${total}`
                : "Place order"}
          </button>
          <p className="mt-3 text-center text-sm font-semibold text-slate-500">
            💵 Cash only · We&rsquo;ll text you to arrange pickup
          </p>
        </form>
      </div>

      {/* Sticky running total on phones */}
      {total > 0 && (
        <a
          href="#order-form"
          className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-full bg-grape-500 px-6 py-3.5 text-white shadow-lift lg:hidden"
        >
          <span className="font-bold">
            🛍️ {itemCount} {itemCount === 1 ? "item" : "items"} · ${total}
          </span>
          <span className="font-extrabold">Order →</span>
        </a>
      )}
    </section>
  );
}

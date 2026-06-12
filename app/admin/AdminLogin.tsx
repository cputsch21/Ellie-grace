"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function AdminLogin() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-5xl bg-white p-8 text-center shadow-soft ring-1 ring-grape-100"
      >
        <div className="text-4xl">🔒</div>
        <h1 className="mt-3 text-2xl font-bold text-slate-800">
          Orders &mdash; private
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the password to see your orders.
        </p>

        <input
          name="password"
          type="text"
          autoFocus
          autoComplete="off"
          placeholder="Password"
          className="mt-6 w-full rounded-2xl border-0 bg-slate-50 px-4 py-3 text-center text-slate-800 placeholder:text-slate-400 ring-1 ring-transparent transition-shadow duration-150 ease-out focus:bg-white focus:outline-none focus:ring-2 focus:ring-grape-300"
        />

        {state?.error && (
          <p className="mt-3 text-sm font-bold text-bubblegum-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-grape-500 px-6 py-3 text-base font-extrabold text-white shadow-lift transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-grape-600 disabled:opacity-60"
        >
          {pending ? "Checking..." : "Unlock"}
        </button>
      </form>
    </main>
  );
}

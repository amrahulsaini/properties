"use client";

import { useState } from "react";
import { defaultBranding } from "@/lib/brand";

export function LoginScreen() {
  const [email, setEmail] = useState("admin@samarthdevelopers.local");
  const [password, setPassword] = useState("Admin@12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Login failed.");
      }

      window.location.href = "/dashboard";
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="section-grid min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[36px] border border-line bg-white/60 shadow-soft backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <section className="relative flex flex-col justify-between overflow-hidden bg-black px-6 py-8 text-white md:px-10 md:py-10">
          <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute left-0 top-32 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-200">
              {defaultBranding.productTitle}
            </p>
            <h1 className="display-font mt-5 max-w-xl text-4xl leading-tight md:text-6xl">
              Sales, GST, bookings, land buying, and site control on one dashboard.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-300 md:text-base">
              {defaultBranding.heroSubtitle}
            </p>
            <p className="display-font mt-8 max-w-lg text-sm leading-7 text-orange-100">
              “Plot Sale, Purchase, Construction Accounting, Development Monitoring,
              आणि Investor Follow-up” एकाच सिस्टीममध्ये.
            </p>
          </div>

          <div className="relative grid gap-4 sm:grid-cols-2">
            {[
              "Advance booking PDF + WhatsApp / Email flow",
              "Plot, purchase, sale, GST and profit reporting",
              "Agent commission, attendance, and salary tracking",
              "Document vault for Aadhar, PAN, 7/12, agreements",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-sm text-zinc-200 backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-8 md:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                Secure Access
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-ink">
                Multi-user login
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">
                Admin, agent, accountant, and engineer roles with a unified Next.js,
                Electron, and mobile API stack.
              </p>
            </div>

            <form className="glass space-y-5 rounded-[30px] p-6" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Email
                </span>
                <input
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  value={email}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  Password
                </span>
                <input
                  className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              <button
                className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
                type="submit"
              >
                {loading ? "Signing in..." : "Enter PropertySuite"}
              </button>
            </form>

            <div className="mt-6 text-sm leading-7 text-muted">
              <p>{defaultBranding.companyName}</p>
              <p>{defaultBranding.locationMr}</p>
              <p>GSTIN: {defaultBranding.gstin}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

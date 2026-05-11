"use client";

import Link from "next/link";
import { useState } from "react";
import { defaultBranding } from "@/lib/brand";

type Step = "email" | "otp" | "password";

export function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to send OTP.");

      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Invalid OTP.");

      setResetToken(payload.resetToken);
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to reset password.");

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  const stepLabels: Record<Step, string> = {
    email: "Enter your email",
    otp: "Enter the OTP",
    password: "Set new password",
  };

  const stepNumbers: Record<Step, number> = { email: 1, otp: 2, password: 3 };

  return (
    <main className="section-grid min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[36px] border border-line bg-white/60 shadow-soft backdrop-blur md:grid-cols-[1.1fr_0.9fr]">
        <section className="order-2 relative flex flex-col justify-between overflow-hidden bg-black px-6 py-8 text-white md:order-1 md:px-10 md:py-10">
          <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
          <div className="absolute left-0 top-32 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-200">
              {defaultBranding.productTitle}
            </p>
            <h1 className="display-font mt-5 max-w-xl text-4xl leading-tight md:text-6xl">
              Reset your password in three simple steps.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-300 md:text-base">
              Enter your registered email, verify the OTP we send you, and choose a new password.
            </p>
          </div>

          <div className="relative space-y-3">
            {(["email", "otp", "password"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 text-sm transition ${
                  step === s
                    ? "border-accent/60 bg-accent/10 text-white"
                    : stepNumbers[step] > i + 1
                      ? "border-white/20 bg-white/6 text-zinc-400 line-through"
                      : "border-white/10 bg-white/4 text-zinc-500"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step === s ? "bg-accent text-white" : stepNumbers[step] > i + 1 ? "bg-white/20 text-zinc-400" : "bg-white/10 text-zinc-600"
                  }`}
                >
                  {stepNumbers[step] > i + 1 ? "✓" : i + 1}
                </span>
                {stepLabels[s]}
              </div>
            ))}
          </div>
        </section>

        <section className="order-1 flex items-center justify-center px-6 py-8 md:order-2 md:px-10">
          <div className="w-full max-w-md">
            {success ? (
              <div className="text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-ink">Password Reset!</h2>
                <p className="mt-3 text-sm text-muted">
                  Your password has been updated successfully. You can now log in with your new password.
                </p>
                <Link
                  href="/login"
                  className="mt-6 inline-block w-full rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105"
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Password Recovery
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-ink">
                    {step === "email" && "Forgot your password?"}
                    {step === "otp" && "Check your email"}
                    {step === "password" && "Create new password"}
                  </h2>
                  {step === "otp" && (
                    <p className="mt-2 text-sm text-muted">
                      We sent a 6-digit OTP to <span className="font-medium text-ink">{email}</span>
                    </p>
                  )}
                </div>

                {step === "email" && (
                  <form className="glass space-y-5 rounded-[30px] p-6" onSubmit={handleSendOtp}>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                        Registered Email
                      </span>
                      <input
                        className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        value={email}
                        required
                        placeholder="you@example.com"
                      />
                    </label>

                    {error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <button
                      className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={loading}
                      type="submit"
                    >
                      {loading ? "Sending OTP..." : "Send OTP"}
                    </button>
                  </form>
                )}

                {step === "otp" && (
                  <form className="glass space-y-5 rounded-[30px] p-6" onSubmit={handleVerifyOtp}>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                        6-Digit OTP
                      </span>
                      <input
                        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-center text-xl font-semibold tracking-[0.5em] outline-none transition focus:border-accent"
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        value={otp}
                        required
                        maxLength={6}
                        placeholder="------"
                      />
                    </label>

                    {error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <button
                      className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={loading || otp.length !== 6}
                      type="submit"
                    >
                      {loading ? "Verifying..." : "Verify OTP"}
                    </button>

                    <button
                      type="button"
                      className="w-full text-center text-xs text-muted hover:text-accent transition-colors"
                      onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                    >
                      Wrong email? Go back
                    </button>
                  </form>
                )}

                {step === "password" && (
                  <form className="glass space-y-5 rounded-[30px] p-6" onSubmit={handleResetPassword}>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                        New Password
                      </span>
                      <input
                        className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        value={password}
                        required
                        minLength={6}
                        placeholder="Min. 6 characters"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                        Confirm Password
                      </span>
                      <input
                        className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type="password"
                        value={confirmPassword}
                        required
                        placeholder="Repeat new password"
                      />
                    </label>

                    {error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <button
                      className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={loading}
                      type="submit"
                    >
                      {loading ? "Resetting..." : "Reset Password"}
                    </button>
                  </form>
                )}

                <div className="mt-6 text-center text-sm text-muted">
                  <Link href="/login" className="hover:text-accent transition-colors">
                    Back to Login
                  </Link>
                </div>
              </>
            )}

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

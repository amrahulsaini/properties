"use client";

import { useState } from "react";
import { defaultBranding } from "@/lib/brand";

type Mode = "login" | "forgot-email" | "forgot-otp" | "forgot-newpass" | "forgot-success";

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Login failed.");

      window.location.href = "/dashboard";
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleSendOtp(event: React.FormEvent) {
    event.preventDefault();
    setForgotLoading(true);
    setForgotError("");

    try {
      const response = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to send OTP.");

      setMode("forgot-otp");
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Failed to send OTP.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setForgotLoading(true);
    setForgotError("");

    try {
      const response = await fetch("/api/v1/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Invalid OTP.");

      setResetToken(payload.resetToken);
      setMode("forgot-newpass");
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Invalid OTP.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");

    try {
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password: newPassword }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Failed to reset password.");

      setMode("forgot-success");
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  }

  function backToLogin() {
    setMode("login");
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetToken("");
    setForgotError("");
  }

  const isForgot = mode !== "login";

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
              {isForgot
                ? "Reset your password in three simple steps."
                : "Keep sales, bookings, and property records in one simple place."}
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-300 md:text-base">
              {isForgot
                ? "Enter your registered email, verify the OTP we send you, and choose a new password."
                : "Simple access for your team to manage customers, payments, and documents without extra clutter."}
            </p>
            {!isForgot && (
              <p className="display-font mt-8 max-w-lg text-sm leading-7 text-orange-100">
                A clean, secure workspace for everyday property business tasks.
              </p>
            )}
          </div>

          <div className="relative">
            {isForgot ? (
              <div className="space-y-3">
                {(["forgot-email", "forgot-otp", "forgot-newpass"] as Mode[]).map((s, i) => {
                  const labels: Record<string, string> = {
                    "forgot-email": "Enter your email",
                    "forgot-otp": "Enter the OTP",
                    "forgot-newpass": "Set new password",
                  };
                  const currentIdx = ["forgot-email", "forgot-otp", "forgot-newpass"].indexOf(mode);
                  const isActive = mode === s;
                  const isDone = currentIdx > i;

                  return (
                    <div
                      key={s}
                      className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 text-sm ${
                        isActive
                          ? "border-accent/60 bg-accent/10 text-white"
                          : isDone
                            ? "border-white/20 bg-white/6 text-zinc-400"
                            : "border-white/10 bg-white/4 text-zinc-500"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isActive ? "bg-accent text-white" : isDone ? "bg-white/20 text-zinc-400" : "bg-white/10 text-zinc-600"
                        }`}
                      >
                        {isDone ? "✓" : i + 1}
                      </span>
                      {labels[s]}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Book customer visits and advance payments easily",
                  "See sales, purchases, and balances at a glance",
                  "Track team activity, attendance, and payouts",
                  "Store IDs, agreements, and property papers safely",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-white/10 bg-white/6 p-4 text-sm text-zinc-200 backdrop-blur"
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="order-1 flex items-center justify-center px-6 py-8 md:order-2 md:px-10">
          <div className="w-full max-w-md">
            {mode === "login" && (
              <>
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Secure Access
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-ink">Multi-user login</h2>
                </div>

                <form className="glass space-y-5 rounded-[30px] p-6" onSubmit={handleLogin}>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                      Email
                    </span>
                    <input
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(e) => setEmail(e.target.value)}
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
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      value={password}
                    />
                  </label>

                  {loginError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {loginError}
                    </div>
                  )}

                  <button
                    className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={loginLoading}
                    type="submit"
                  >
                    {loginLoading ? "Signing in..." : "Enter PropertySuite"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode("forgot-email")}
                      className="text-xs text-muted transition-colors hover:text-accent"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </>
            )}

            {mode === "forgot-email" && (
              <>
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Password Recovery
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-ink">Forgot your password?</h2>
                  <p className="mt-2 text-sm text-muted">
                    Enter your registered email and we will send you a 6-digit OTP.
                  </p>
                </div>

                <form className="glass space-y-5 rounded-[30px] p-6" onSubmit={handleSendOtp}>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                      Registered Email
                    </span>
                    <input
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(e) => setForgotEmail(e.target.value)}
                      type="email"
                      value={forgotEmail}
                      required
                      placeholder="you@example.com"
                    />
                  </label>

                  {forgotError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {forgotError}
                    </div>
                  )}

                  <button
                    className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={forgotLoading}
                    type="submit"
                  >
                    {forgotLoading ? "Sending OTP..." : "Send OTP"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={backToLogin}
                      className="text-xs text-muted transition-colors hover:text-accent"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </>
            )}

            {mode === "forgot-otp" && (
              <>
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Password Recovery
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-ink">Check your email</h2>
                  <p className="mt-2 text-sm text-muted">
                    We sent a 6-digit OTP to{" "}
                    <span className="font-medium text-ink">{forgotEmail}</span>
                  </p>
                </div>

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

                  {forgotError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {forgotError}
                    </div>
                  )}

                  <button
                    className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={forgotLoading || otp.length !== 6}
                    type="submit"
                  >
                    {forgotLoading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => { setMode("forgot-email"); setOtp(""); setForgotError(""); }}
                      className="text-xs text-muted transition-colors hover:text-accent"
                    >
                      Wrong email? Go back
                    </button>
                  </div>
                </form>
              </>
            )}

            {mode === "forgot-newpass" && (
              <>
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                    Password Recovery
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-ink">Create new password</h2>
                </div>

                <form className="glass space-y-5 rounded-[30px] p-6" onSubmit={handleResetPassword}>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                      New Password
                    </span>
                    <input
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
                      onChange={(e) => setNewPassword(e.target.value)}
                      type="password"
                      value={newPassword}
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

                  {forgotError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {forgotError}
                    </div>
                  )}

                  <button
                    className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={forgotLoading}
                    type="submit"
                  >
                    {forgotLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              </>
            )}

            {mode === "forgot-success" && (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-ink">Password Reset!</h2>
                <p className="mt-3 text-sm text-muted">
                  Your password has been updated. You can now log in with your new password.
                </p>
                <button
                  onClick={backToLogin}
                  className="mt-6 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white transition hover:brightness-105"
                >
                  Go to Login
                </button>
              </div>
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

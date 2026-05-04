"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Briefcase,
  Building2,
  ChevronRight,
  FileText,
  FolderLock,
  Hammer,
  HardHat,
  Handshake,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  MapPinCheck,
  MapPinned,
  Menu,
  MessagesSquare,
  Palette,
  Receipt,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { defaultBranding } from "@/lib/brand";
import { getModuleSections } from "@/lib/modules";
import type { SessionUser } from "@/lib/types";

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Building2,
  MapPinned,
  Handshake,
  ReceiptText: Receipt,
  FileSignature: FileText,
  Users,
  BriefcaseBusiness: Briefcase,
  MapPinCheckInside: MapPinCheck,
  WalletCards: Wallet,
  TrendingUp,
  MessagesSquare,
  BadgeIndianRupee: IndianRupee,
  Hammer,
  HardHat,
  FolderLock,
  Palette,
};

interface AppShellProps {
  children: React.ReactNode;
  user: SessionUser;
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sections = getModuleSections();

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const isDashboard = pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-app">
      <div className="flex w-full">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[290px] min-w-[290px] border-r border-[#222] bg-black/95 p-6 text-white shadow-soft transition md:sticky md:top-0 md:h-screen subtle-scrollbar overflow-y-auto ${
            open ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
          }`}
        >
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-200">
                {defaultBranding.appName}
              </p>
              <h2 className="mt-3 text-2xl font-semibold leading-tight">
                {defaultBranding.companyName}
              </h2>
            </div>
            <button className="md:hidden" onClick={() => setOpen(false)} type="button">
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-6 pb-10">
            <Link
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-accent ${
                isDashboard ? "bg-white text-black" : "text-white hover:bg-white/10"
              }`}
              href="/dashboard"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard size={18} />
              <span className={isDashboard ? "text-black" : "text-white"}>Dashboard</span>
            </Link>

            {Object.entries(sections).map(([section, modules]) => (
              <div key={section}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
                  {section}
                </p>
                <div className="space-y-2">
                  {modules.map((module) => {
                    const Icon = iconMap[module.icon] ?? Building2;
                    const active = pathname === `/${module.slug}`;

                    return (
                      <Link
                        key={module.slug}
                        className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-accent ${
                          active
                            ? "bg-accent text-white"
                            : "text-white hover:bg-white/10"
                        }`}
                        href={`/${module.slug}`}
                        onClick={() => setOpen(false)}
                      >
                        <span className={`flex items-center gap-3 ${active ? "" : "text-white"}`}>
                          <Icon size={18} />
                          <span className={active ? "text-white" : "text-white"}>{module.title}</span>
                        </span>
                        <ChevronRight size={16} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {open ? (
          <button
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/45 md:hidden"
            onClick={() => setOpen(false)}
            type="button"
          />
        ) : null}

        <div className="min-w-0 flex-1 overflow-x-auto p-4 md:p-6">
          <header className="glass mb-4 flex items-center justify-between rounded-[28px] px-5 py-4">
            <div className="flex items-center gap-3">
              <button
                className="rounded-full border border-line bg-white p-2 md:hidden"
                onClick={() => setOpen(true)}
                type="button"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  {isDashboard ? "Operations overview" : "Module workspace"}
                </p>
                <h1 className="mt-1 text-xl font-semibold text-ink">
                  {isDashboard
                    ? "Analytics & Dashboard"
                    : pathname.replace("/", "").replace(/-/g, " ")}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-line bg-white px-4 py-2 text-right sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  {user.role}
                </p>
                <p className="text-sm font-semibold text-ink">{user.name}</p>
              </div>
              <button
                className="flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                onClick={logout}
                type="button"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </header>

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}

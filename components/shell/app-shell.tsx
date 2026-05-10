"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Briefcase,
  Building2,
  ChevronRight,
  Coins,
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
  Coins,
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
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    } else {
      const top = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";

      if (top) {
        const scrollY = -parseInt(top || "0", 10) || 0;
        window.scrollTo(0, scrollY);
      }
    }

    return () => {
      const top = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";

      if (top) {
        const scrollY = -parseInt(top || "0", 10) || 0;
        window.scrollTo(0, scrollY);
      }
    };
  }, [open]);
  const sections = getModuleSections();

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const isDashboard = pathname === "/dashboard";

  return (
    <div className="min-h-screen min-h-dvh bg-app">
      <div className="flex w-full">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[272px] min-w-[272px] border-r border-[#222] bg-black/95 p-5 text-white shadow-soft transition-transform duration-300 md:sticky md:top-0 md:h-screen subtle-scrollbar overflow-y-auto ${
            open ? "translate-x-0" : "-translate-x-[120%] md:translate-x-0"
          }`}
        >
          <div className="mb-8 flex items-start justify-between gap-3">
            {/* Logo in a white pill so it reads on the dark sidebar */}
            <div className="flex-1 rounded-2xl bg-white px-3 py-2">
              <Image
                src="/samarth-logo.webp"
                alt={defaultBranding.companyName}
                width={200}
                height={56}
                priority
                className="h-10 w-full object-contain object-left"
              />
            </div>
            <button className="cursor-pointer shrink-0 text-white/70 hover:text-white transition md:hidden" onClick={() => setOpen(false)} type="button">
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-6 pb-10">
            <Link
              className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-150 focus:outline-none active:scale-95 ${
                isDashboard
                  ? "bg-accent text-white shadow-md"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
              href="/dashboard"
              onClick={() => setOpen(false)}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>

            {Object.entries(sections).map(([section, modules]) => (
              <div key={section}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">
                  {section}
                </p>
                <div className="space-y-1">
                  {modules.map((module) => {
                    const Icon = iconMap[module.icon] ?? Building2;
                    const active = pathname === `/${module.slug}`;

                    return (
                      <Link
                        key={module.slug}
                        className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 focus:outline-none active:scale-95 ${
                          active
                            ? "bg-accent text-white shadow-md"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                        href={`/${module.slug}`}
                        onClick={() => setOpen(false)}
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={16} className={active ? "text-white" : "text-white/60"} />
                          <span>{module.title}</span>
                        </span>
                        {active && <ChevronRight size={14} className="opacity-70" />}
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

        <div className="min-w-0 flex-1 overflow-x-hidden p-3 md:p-6">
          <header className="glass mb-4 flex items-center justify-between rounded-[22px] px-4 py-3 md:rounded-[28px] md:px-5 md:py-4">
            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <button
                className="shrink-0 cursor-pointer rounded-full border border-line bg-white p-2 transition hover:bg-zinc-100 md:hidden"
                onClick={() => setOpen(true)}
                type="button"
              >
                <Menu size={16} />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {isDashboard ? "Overview" : "Module"}
                </p>
                <h1 className="mt-0.5 truncate text-base font-semibold text-ink sm:text-lg md:text-xl">
                  {isDashboard
                    ? "Analytics & Dashboard"
                    : pathname.replace("/", "").replace(/-/g, " ")}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              <div className="hidden rounded-full border border-line bg-white px-3 py-1.5 text-right sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
                  {user.role}
                </p>
                <p className="text-xs font-semibold text-ink">{user.name}</p>
              </div>
              <button
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800 active:scale-95 md:gap-2 md:px-4"
                onClick={logout}
                type="button"
              >
                <LogOut size={14} />
                <span className="hidden xs:inline sm:inline">Logout</span>
              </button>
            </div>
          </header>

          <div className="animate-fade-in">{children}</div>
        </div>
      </div>
    </div>
  );
}

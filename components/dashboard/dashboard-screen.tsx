"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { formatCurrency } from "@/lib/format";

interface DashboardPayload {
  totals: {
    sales: number;
    expenses: number;
    profit: number;
    bookings: number;
  };
  monthly: Array<{
    month: string;
    sales: number;
    expenses: number;
    profit: number;
  }>;
  highlights: {
    topAgent: string;
    topProject: string;
    topLocation: string;
  };
  reminders: Array<{
    id: number;
    title: string;
    remind_at: string;
    status: string;
  }>;
  recentBookings: Array<{
    id: number;
    customer_name: string;
    village: string;
    advance_amount: number;
    remaining_amount: number;
  }>;
}

export function DashboardScreen() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/v1/dashboard");
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load dashboard.");
        }

        if (active) {
          setData(payload);
        }
      } catch (nextError) {
        if (active) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "Failed to load dashboard.",
          );
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <Card className="text-sm text-red-600">
        {error}
      </Card>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-[28px] border border-line bg-white/70"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Sales" tone="accent" value={formatCurrency(data.totals.sales)} />
        <StatCard
          label="Total Expenses"
          tone="warning"
          value={formatCurrency(data.totals.expenses)}
        />
        <StatCard label="Profit" tone="success" value={formatCurrency(data.totals.profit)} />
        <StatCard
          label="Advance Bookings"
          value={String(data.totals.bookings)}
          
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.8fr]">
        <Card>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Monthly trend
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Sales, expenses, and profit
            </h2>
          </div>
          <OverviewCharts data={data.monthly} />
        </Card>

        <Card className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Highlights
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Top performers
            </h2>
          </div>

          {[
            { label: "Top agent", value: data.highlights.topAgent },
            { label: "Top project", value: data.highlights.topProject },
            { label: "Top location", value: data.highlights.topLocation },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] border border-line bg-white/80 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                {item.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-ink">{item.value}</p>
            </div>
          ))}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Recent bookings
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Advance memo activity
            </h2>
          </div>
          <div className="space-y-3">
            {data.recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col justify-between gap-3 rounded-[20px] border border-line bg-white/80 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-semibold text-ink">{booking.customer_name}</p>
                  <p className="text-sm text-muted">{booking.village}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted">
                    Advance:{" "}
                    <span className="font-semibold text-ink">
                      {formatCurrency(booking.advance_amount)}
                    </span>
                  </p>
                  <p className="text-muted">
                    Remaining:{" "}
                    <span className="font-semibold text-ink">
                      {formatCurrency(booking.remaining_amount)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Follow-ups
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              Reminders
            </h2>
          </div>
          <div className="space-y-3">
            {data.reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="rounded-[20px] border border-line bg-white/80 p-4"
              >
                <p className="font-semibold text-ink">{reminder.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {new Date(reminder.remind_at).toLocaleString("en-IN")}
                </p>
                <p className="mt-2 inline-flex rounded-full border border-line px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">
                  {reminder.status}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  tone?: "neutral" | "accent" | "success" | "warning";
  hint?: string;
}

export function StatCard({
  label,
  value,
  tone = "neutral",
  hint,
}: StatCardProps) {
  const tones = {
    neutral: "text-ink",
    accent: "text-accent",
    success: "text-success",
    warning: "text-warning",
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-accent-soft blur-2xl" />
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-semibold ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </Card>
  );
}

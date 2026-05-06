import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  action?: ReactNode;
  className?: string;
  description: string;
  eyebrow?: string;
  title: string;
}

export function EmptyState({
  action,
  className,
  description,
  eyebrow = "No data",
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[26px] border border-dashed border-line-strong bg-[#fbf7f1] px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

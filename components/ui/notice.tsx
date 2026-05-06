import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type NoticeTone = "info" | "success" | "warning" | "danger";

const toneStyles: Record<NoticeTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-800",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-800",
};

interface NoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  description?: ReactNode;
  title?: ReactNode;
  tone?: NoticeTone;
}

export function Notice({
  children,
  className,
  description,
  title,
  tone = "info",
  ...props
}: NoticeProps) {
  return (
    <div
      className={cn("rounded-[22px] border px-4 py-3", toneStyles[tone], className)}
      {...props}
    >
      {title ? <p className="text-sm font-semibold">{title}</p> : null}
      {description ? <p className="mt-1 text-sm leading-6">{description}</p> : null}
      {children ? <div className={cn(title || description ? "mt-2" : "", "text-sm")}>{children}</div> : null}
    </div>
  );
}

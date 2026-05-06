import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "contrast";

type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonStyleOptions {
  className?: string;
  fullWidth?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-accent text-white shadow-[0_16px_32px_rgba(201,106,30,0.22)] hover:bg-accent-strong",
  secondary:
    "border-line-strong bg-white text-ink hover:border-accent/35 hover:bg-[#fff6eb]",
  ghost: "border-transparent bg-transparent text-muted hover:bg-black/5 hover:text-ink",
  danger:
    "border-transparent bg-[var(--danger)] text-white shadow-[0_16px_32px_rgba(180,35,24,0.2)] hover:bg-[#961c14]",
  contrast: "border-white/15 bg-white/[0.10] text-white hover:bg-white/[0.18]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 text-xs tracking-[0.18em]",
  md: "min-h-11 px-5 text-[0.78rem] tracking-[0.2em]",
  lg: "min-h-12 px-6 text-sm tracking-[0.22em]",
  icon: "h-11 w-11 px-0",
};

export function buttonStyles({
  className,
  fullWidth,
  size = "md",
  variant = "secondary",
}: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full border font-semibold uppercase transition duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent/45 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-55",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonStyleOptions {}

export function Button({
  children,
  className,
  fullWidth,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ className, fullWidth, size, variant })}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

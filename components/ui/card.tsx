import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div className={`glass rounded-[28px] p-6 text-ink ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

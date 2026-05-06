"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

interface DialogProps {
  children: React.ReactNode;
  description?: string;
  onClose: () => void;
  title: string;
  widthClassName?: string;
}

export function Dialog({
  children,
  description,
  onClose,
  title,
  widthClassName = "max-w-lg",
}: DialogProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div
        className={cn(
          "panel relative z-10 w-full rounded-[30px] p-6 shadow-[0_40px_120px_rgba(17,13,9,0.2)] md:p-7",
          widthClassName,
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Confirmation
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-ink">{title}</h3>
            {description ? (
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p>
            ) : null}
          </div>
          <Button
            aria-label="Close dialog"
            className="shrink-0"
            onClick={onClose}
            size="icon"
            variant="ghost"
          >
            <X size={18} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

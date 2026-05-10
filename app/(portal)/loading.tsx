import { OrbitalLoader } from "@/components/ui/orbital-loader";

export default function PortalLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5">
      <OrbitalLoader size={100} />
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Loading…</p>
    </div>
  );
}

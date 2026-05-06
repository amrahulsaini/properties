export default function PortalLoading() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="h-32 animate-pulse rounded-[28px] border border-line bg-white/75"
            key={index}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="h-[420px] animate-pulse rounded-[30px] border border-line bg-white/75" />
        <div className="space-y-5">
          <div className="h-48 animate-pulse rounded-[30px] border border-line bg-white/75" />
          <div className="h-40 animate-pulse rounded-[30px] border border-line bg-white/75" />
        </div>
      </div>

      <div className="h-[360px] animate-pulse rounded-[30px] border border-line bg-white/75" />
    </div>
  );
}

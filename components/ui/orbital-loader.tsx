"use client";

export function OrbitalLoader({ size = 120 }: { size?: number }) {
  const scale = size / 120;

  return (
    <>
      <style>{`
        @keyframes ol-orbit1 {
          from { transform: rotate(0deg) translateX(52px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(52px) rotate(-360deg); }
        }
        @keyframes ol-orbit2 {
          from { transform: rotate(180deg) translateX(40px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(40px) rotate(-540deg); }
        }
        @keyframes ol-orbit3 {
          from { transform: rotate(60deg) translateX(46px) rotate(-60deg); }
          to   { transform: rotate(420deg) translateX(46px) rotate(-420deg); }
        }
        @keyframes ol-core-pulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.3); }
        }
      `}</style>

      <div
        aria-label="Loading"
        role="status"
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* 120×120 base, scaled uniformly */}
        <div style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
          <div style={{ position: "relative", width: 120, height: 120 }}>
            {/* outer blob — orange accent */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: "#F26A1B",
                animation: "ol-orbit1 1.8s linear infinite",
              }} />
            </div>

            {/* mid blob — dark */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", background: "#111",
                animation: "ol-orbit2 1.4s linear infinite",
              }} />
            </div>

            {/* inner blob — grey */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: 14, height: 14, borderRadius: "50%", background: "#999",
                animation: "ol-orbit3 2.2s linear infinite",
              }} />
            </div>

            {/* core */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              width: 18, height: 18, margin: "-9px",
              borderRadius: "50%", background: "#222",
              animation: "ol-core-pulse 1.8s ease-in-out infinite",
            }} />
          </div>
        </div>
      </div>
    </>
  );
}

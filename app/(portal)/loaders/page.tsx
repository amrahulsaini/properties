export default function LoadersPage() {
  return (
    <>
      <style>{`
        @keyframes blob-morph {
          0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: rotate(0deg) scale(1); }
          25%     { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: rotate(90deg) scale(1.07); }
          50%     { border-radius: 50% 60% 30% 60% / 30% 60% 70% 40%; transform: rotate(180deg) scale(0.95); }
          75%     { border-radius: 60% 40% 60% 30% / 60% 30% 40% 70%; transform: rotate(270deg) scale(1.05); }
        }
        @keyframes blob-morph2 {
          0%,100% { border-radius: 40% 60% 50% 70% / 50% 40% 60% 50%; transform: rotate(0deg); }
          33%     { border-radius: 70% 30% 60% 40% / 40% 70% 30% 60%; transform: rotate(120deg) scale(1.1); }
          66%     { border-radius: 30% 70% 40% 60% / 60% 30% 70% 40%; transform: rotate(240deg) scale(0.9); }
        }
        @keyframes blob-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes blob-pulse {
          0%,100% { transform: scale(1);   opacity: 1; }
          50%     { transform: scale(1.18); opacity: 0.7; }
        }
        @keyframes blob-pulse-delay {
          0%,100% { transform: scale(0.9);  opacity: 0.5; }
          50%     { transform: scale(1.15); opacity: 1; }
        }
        @keyframes blob-orbit {
          from { transform: rotate(0deg) translateX(52px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(52px) rotate(-360deg); }
        }
        @keyframes blob-orbit2 {
          from { transform: rotate(180deg) translateX(40px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(40px) rotate(-540deg); }
        }
        @keyframes blob-orbit3 {
          from { transform: rotate(60deg) translateX(60px) rotate(-60deg); }
          to   { transform: rotate(420deg) translateX(60px) rotate(-420deg); }
        }
        @keyframes ripple {
          0%   { transform: scale(0.1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes wave-bounce {
          0%,100% { transform: translateY(0px) scaleY(1); }
          50%     { transform: translateY(-22px) scaleY(0.8); }
        }
        @keyframes jelly {
          0%,100% { border-radius: 50%; transform: scaleX(1) scaleY(1); }
          25%     { border-radius: 50%; transform: scaleX(1.25) scaleY(0.75); }
          50%     { border-radius: 50%; transform: scaleX(0.85) scaleY(1.2); }
          75%     { border-radius: 50%; transform: scaleX(1.15) scaleY(0.85); }
        }
        @keyframes worm {
          0%   { transform: rotate(0deg)   scaleX(2.4) scaleY(0.65); border-radius: 50%; }
          25%  { transform: rotate(90deg)  scaleX(0.65) scaleY(2.4); border-radius: 50%; }
          50%  { transform: rotate(180deg) scaleX(2.4) scaleY(0.65); border-radius: 50%; }
          75%  { transform: rotate(270deg) scaleX(0.65) scaleY(2.4); border-radius: 50%; }
          100% { transform: rotate(360deg) scaleX(2.4) scaleY(0.65); border-radius: 50%; }
        }
        @keyframes inflate {
          0%,100% { transform: scale(0.6); border-radius: 50%; opacity: 0.7; }
          50%     { transform: scale(1.2); border-radius: 40% 60% 55% 45% / 45% 55% 65% 35%; opacity: 1; }
        }
        @keyframes split-a {
          0%,100% { transform: translateX(0px) scale(1); border-radius: 50%; }
          40%,60% { transform: translateX(-28px) scale(0.75); border-radius: 50%; }
        }
        @keyframes split-b {
          0%,100% { transform: translateX(0px) scale(1); border-radius: 50%; }
          40%,60% { transform: translateX(28px) scale(0.75); border-radius: 50%; }
        }
        @keyframes swarm-a {
          0%,100% { transform: translate(0px, 0px) scale(1); }
          25%     { transform: translate(18px,-14px) scale(1.15); }
          50%     { transform: translate(-10px, 20px) scale(0.85); }
          75%     { transform: translate(-20px,-8px) scale(1.1); }
        }
        @keyframes swarm-b {
          0%,100% { transform: translate(0px, 0px) scale(1); }
          25%     { transform: translate(-22px, 10px) scale(0.9); }
          50%     { transform: translate(12px,-18px) scale(1.2); }
          75%     { transform: translate(18px, 16px) scale(0.8); }
        }
        @keyframes swarm-c {
          0%,100% { transform: translate(0px, 0px); }
          33%     { transform: translate(14px, 20px) scale(1.1); }
          66%     { transform: translate(-18px, -6px) scale(0.9); }
        }
        @keyframes dot-fade {
          0%,100% { transform: scale(0.5); opacity: 0.3; }
          50%     { transform: scale(1.3); opacity: 1; }
        }
        @keyframes melt {
          0%,100% { border-radius: 50% 50% 50% 50% / 50% 50% 70% 70%; transform: scaleY(1); }
          40%     { border-radius: 50% 50% 60% 60% / 40% 40% 80% 80%; transform: scaleY(1.12); }
          60%     { border-radius: 50% 50% 70% 70% / 35% 35% 90% 90%; transform: scaleY(0.9); }
        }
        @keyframes heartbeat {
          0%,100% { transform: scale(1); }
          14%     { transform: scale(1.22); }
          28%     { transform: scale(1); }
          42%     { transform: scale(1.14); }
          56%     { transform: scale(1); }
        }
        @keyframes petal-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pour {
          0%    { transform: translateY(-30px) scaleX(0.5) scaleY(0.5); opacity: 0; }
          30%   { opacity: 1; }
          70%   { transform: translateY(0px) scaleX(1) scaleY(1); opacity: 1; }
          100%  { transform: translateY(30px) scaleX(1.3) scaleY(0.4); opacity: 0; }
        }
        @keyframes arc-spin {
          from { stroke-dashoffset: 0; transform: rotate(0deg); }
          to   { stroke-dashoffset: -280; transform: rotate(720deg); }
        }
        @keyframes arc-morph {
          0%,100% { stroke-dasharray: 60 220; }
          50%     { stroke-dasharray: 180 100; }
        }
        @keyframes trail-fade {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.2); }
        }
        @keyframes squircle-morph {
          0%,100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: rotate(0deg); }
          25%     { border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%; transform: rotate(90deg) scale(1.1); }
          50%     { border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%; transform: rotate(180deg); }
          75%     { border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%; transform: rotate(270deg) scale(0.9); }
        }
      `}</style>

      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">Design System</p>
        <h2 className="mt-1 text-2xl font-semibold text-ink">Organic Loaders</h2>
        <p className="mt-1 text-sm text-muted">20 indeterminate loading indicators — blobby, organic, black &amp; white.</p>
      </div>

      <div className="flex flex-wrap gap-4">

        {/* 1. Breathing Blob */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{
            width: 90, height: 90, background: "#111",
            animation: "blob-morph 3.6s ease-in-out infinite",
          }} />
        </div>

        {/* 2. Tri-Orbit */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{ position: "relative", width: 120, height: 120 }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#111", animation: "blob-orbit 1.8s linear infinite" }} />
            </div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#555", animation: "blob-orbit2 1.4s linear infinite" }} />
            </div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#999", animation: "blob-orbit3 2.2s linear infinite" }} />
            </div>
            <div style={{ position: "absolute", inset: "50%", width: 18, height: 18, margin: "-9px", borderRadius: "50%", background: "#222" }} />
          </div>
        </div>

        {/* 3. Ripple */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20, overflow: "hidden" }}>
          <div style={{ position: "relative", width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {[0, 0.5, 1.0, 1.5].map((delay) => (
              <div key={delay} style={{
                position: "absolute", borderRadius: "50%",
                border: "2px solid #111", width: "100%", height: "100%",
                animation: `ripple 2s ease-out ${delay}s infinite`,
              }} />
            ))}
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#111" }} />
          </div>
        </div>

        {/* 4. Wave Blobs */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            {[0, 0.12, 0.24, 0.36, 0.48].map((delay, i) => (
              <div key={i} style={{
                width: 22, height: 22,
                background: i % 2 === 0 ? "#111" : "#666",
                borderRadius: "50%",
                animation: `wave-bounce 0.9s ease-in-out ${delay}s infinite`,
              }} />
            ))}
          </div>
        </div>

        {/* 5. Jelly */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{
            width: 80, height: 80, background: "#111",
            animation: "jelly 1.2s ease-in-out infinite",
          }} />
        </div>

        {/* 6. Worm Spinner */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{
            width: 36, height: 36, background: "#111",
            animation: "worm 1.6s ease-in-out infinite",
          }} />
        </div>

        {/* 7. Inflate */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 70, height: 70, background: "#111", animation: "inflate 2s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: 6, background: "#f9f9f9", borderRadius: "50%", animation: "inflate 2s ease-in-out infinite 0.1s" }} />
          </div>
        </div>

        {/* 8. Split & Merge */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{ position: "relative", width: 80, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", width: 36, height: 36, background: "#111", animation: "split-a 1.8s ease-in-out infinite" }} />
            <div style={{ position: "absolute", width: 36, height: 36, background: "#555", animation: "split-b 1.8s ease-in-out infinite" }} />
          </div>
        </div>

        {/* 9. Swarm */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{ position: "relative", width: 80, height: 80 }}>
            <div style={{ position: "absolute", width: 32, height: 32, background: "#111", borderRadius: "50%", top: 0, left: 0, animation: "swarm-a 2.4s ease-in-out infinite" }} />
            <div style={{ position: "absolute", width: 24, height: 24, background: "#555", borderRadius: "50%", bottom: 0, right: 0, animation: "swarm-b 2s ease-in-out infinite" }} />
            <div style={{ position: "absolute", width: 18, height: 18, background: "#999", borderRadius: "50%", top: "50%", left: "50%", animation: "swarm-c 2.8s ease-in-out infinite" }} />
          </div>
        </div>

        {/* 10. Dot Ring */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{ position: "relative", width: 100, height: 100 }}>
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const r = 40;
              const x = 50 + r * Math.cos(angle) - 8;
              const y = 50 + r * Math.sin(angle) - 8;
              return (
                <div key={i} style={{
                  position: "absolute", width: 16, height: 16, borderRadius: "50%",
                  background: "#111", left: x, top: y,
                  animation: `dot-fade 1.4s ease-in-out ${i * 0.175}s infinite`,
                }} />
              );
            })}
          </div>
        </div>

        {/* 11. Melt */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{
            width: 80, height: 80, background: "#111",
            animation: "melt 2.2s ease-in-out infinite",
          }} />
        </div>

        {/* 12. Heartbeat */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{
            width: 74, height: 74, background: "#111",
            borderRadius: "42% 58% 62% 38% / 43% 43% 57% 57%",
            animation: "heartbeat 1.3s ease-in-out infinite",
          }} />
        </div>

        {/* 13. Petal Spinner */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{ position: "relative", width: 100, height: 100, animation: "petal-spin 2.4s linear infinite" }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{
                position: "absolute", width: 28, height: 48,
                background: i % 2 === 0 ? "#111" : "#888",
                borderRadius: "50%",
                top: "50%", left: "50%",
                transformOrigin: "50% 100%",
                transform: `translateX(-50%) rotate(${i * 60}deg)`,
                opacity: 0.6 + (i / 6) * 0.4,
              }} />
            ))}
          </div>
        </div>

        {/* 14. Pour / Flow */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20, overflow: "hidden" }}>
          <div style={{ position: "relative", height: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            {[0, 0.3, 0.6, 0.9].map((delay, i) => (
              <div key={i} style={{
                width: 30 - i * 4, height: 30 - i * 4,
                borderRadius: "50% 50% 60% 60% / 40% 40% 60% 60%",
                background: "#111",
                animation: `pour 1.6s ease-in-out ${delay}s infinite`,
                marginTop: i === 0 ? 0 : -8,
              }} />
            ))}
          </div>
        </div>

        {/* 15. SVG Arc Spinner */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <svg width="100" height="100" viewBox="0 0 100 100" style={{ overflow: "visible" }}>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e5e5" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#111" strokeWidth="8"
              strokeLinecap="round"
              style={{
                strokeDasharray: "90 175",
                transformOrigin: "50% 50%",
                animation: "blob-spin 1.1s linear infinite, arc-morph 2.2s ease-in-out infinite",
              }}
            />
          </svg>
        </div>

        {/* 16. Squircle Morph */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{
            width: 80, height: 80, background: "#111",
            animation: "squircle-morph 3s ease-in-out infinite",
          }} />
        </div>

        {/* 17. Morph Blob 2 */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{
            width: 86, height: 86, background: "#111",
            animation: "blob-morph2 4s ease-in-out infinite",
          }} />
        </div>

        {/* 18. Pulse Pair */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{ position: "relative", width: 80, height: 80 }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "#111",
              borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
              animation: "blob-pulse 1.5s ease-in-out infinite",
            }} />
            <div style={{
              position: "absolute", inset: 12,
              background: "#f9f9f9",
              borderRadius: "40% 60% 70% 30% / 40% 70% 30% 60%",
              animation: "blob-pulse-delay 1.5s ease-in-out infinite",
            }} />
          </div>
        </div>

        {/* 19. Spiral Trail */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{ position: "relative", width: 110, height: 110, animation: "blob-spin 1.6s linear infinite" }}>
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const r = 30 + i * 3;
              const size = 20 - i * 2;
              return (
                <div key={i} style={{
                  position: "absolute",
                  width: size, height: size,
                  borderRadius: "50%",
                  background: "#111",
                  top: "50%", left: "50%",
                  marginLeft: -size / 2, marginTop: -size / 2,
                  transform: `rotate(${i * 45}deg) translateX(${r}px)`,
                  opacity: 1 - i * 0.1,
                }} />
              );
            })}
          </div>
        </div>

        {/* 20. Dual Counter-Rotate */}
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f9", borderRadius: 20 }}>
          <div style={{ position: "relative", width: 100, height: 100 }}>
            <div style={{
              position: "absolute", inset: 0,
              border: "none",
              animation: "blob-spin 2s linear infinite",
            }}>
              {[0, 90, 180, 270].map((deg) => (
                <div key={deg} style={{
                  position: "absolute", width: 22, height: 22,
                  borderRadius: "50% 50% 50% 20%",
                  background: "#111",
                  top: "50%", left: "50%",
                  marginLeft: -11, marginTop: -11,
                  transform: `rotate(${deg}deg) translateY(-38px)`,
                }} />
              ))}
            </div>
            <div style={{
              position: "absolute", inset: 16,
              animation: "blob-spin 1.4s linear infinite reverse",
            }}>
              {[45, 135, 225, 315].map((deg) => (
                <div key={deg} style={{
                  position: "absolute", width: 14, height: 14,
                  borderRadius: "20% 50% 50% 50%",
                  background: "#888",
                  top: "50%", left: "50%",
                  marginLeft: -7, marginTop: -7,
                  transform: `rotate(${deg}deg) translateY(-22px)`,
                }} />
              ))}
            </div>
            <div style={{
              position: "absolute", inset: "50%", width: 12, height: 12,
              margin: "-6px", borderRadius: "50%", background: "#111",
            }} />
          </div>
        </div>

      </div>
    </>
  );
}

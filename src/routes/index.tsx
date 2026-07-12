import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import heroDish from "@/assets/hero-dish.png";

export const Route = createFileRoute("/")({
  component: SplashScreen,
});

function SplashScreen() {
  const nav = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in immediately
    const t1 = setTimeout(() => setVisible(true), 50);
    // Navigate after 2 seconds
    const t2 = setTimeout(() => {
      nav({ to: "/home" });
    }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [nav]);

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #c0392b 0%, #e74c3c 45%, #ff6b5b 100%)",
        transition: "opacity 0.4s ease",
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Radial glow behind dish */}
      <div
        className="absolute"
        style={{
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -55%)",
        }}
      />

      {/* Dish image — animated float */}
      <div
        style={{
          width: 240,
          height: 240,
          marginBottom: 8,
          animation: "splashFloat 2.5s ease-in-out infinite",
          filter: "drop-shadow(0 20px 32px rgba(0,0,0,0.32))",
          position: "relative",
          zIndex: 2,
        }}
      >
        <img
          src={heroDish}
          alt="Delicious meal"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* Brand name */}
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'Outfit', 'Inter', sans-serif",
            fontWeight: 900,
            fontSize: 48,
            color: "#fff",
            letterSpacing: "-0.03em",
            lineHeight: 1,
            textShadow: "0 4px 16px rgba(0,0,0,0.25)",
          }}
        >
          Meal<span style={{ color: "#ffe0dc" }}>BAE</span>
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.75)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Before Anything Else
        </div>
      </div>

      {/* Pulsing dots loader */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          gap: 8,
          position: "relative",
          zIndex: 2,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.7)",
              animation: `splashDot 1s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Keyframe styles injected inline */}
      <style>{`
        @keyframes splashFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes splashDot {
          0%, 100% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

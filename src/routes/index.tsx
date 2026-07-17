import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: SplashScreen,
});

const TAGLINE = "Your favourite meal, Before Anything Else.";
// Each character types at 45ms → full string ≈ 45 * 42 chars ≈ ~1.9s
const CHAR_DELAY_MS = 45;
// Wait this long after last char before navigating
const POST_TYPE_DELAY_MS = 800;

function SplashScreen() {
  const nav = useNavigate();
  const [visible, setVisible] = useState(false);
  const [typed, setTyped] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  // Fade in, then start typing after logo settles
  useEffect(() => {
    const tFade = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(tFade);
  }, []);

  // Start typewriter once visible
  useEffect(() => {
    if (!visible) return;
    let index = 0;
    const typeNext = () => {
      index += 1;
      setTyped(TAGLINE.slice(0, index));
      if (index < TAGLINE.length) {
        setTimeout(typeNext, CHAR_DELAY_MS);
      } else {
        setTypingDone(true);
      }
    };
    // Small delay so logo animation finishes first
    const tStart = setTimeout(typeNext, 600);
    return () => clearTimeout(tStart);
  }, [visible]);

  // Navigate once typing is done + short pause
  useEffect(() => {
    if (!typingDone) return;
    const t = setTimeout(() => nav({ to: "/home" }), POST_TYPE_DELAY_MS);
    return () => clearTimeout(t);
  }, [typingDone, nav]);

  const foodPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='%23ff3008' fill-opacity='0.025' stroke='%23ff3008' stroke-opacity='0.025' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 30h16M22 30a6 6 0 0 1 12 0' fill='none'/%3E%3Ccircle cx='28' cy='23' r='1'/%3E%3Cpath d='M65 24h12l-2 10H67z' fill='none'/%3E%3Cpath d='M71 24V18h2' fill='none'/%3E%3Cpath d='M24 68v10M22 68h4M22 71h4M32 68v10M30 68v3a2 2 0 0 0 4 0v-3' fill='none'/%3E%3Cpath d='M68 68l10 8H68z' fill='none'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-8 overflow-hidden"
      style={{
        backgroundColor: "#ffffff",
        backgroundImage: foodPattern,
        backgroundRepeat: "repeat",
        transition: "opacity 0.45s ease",
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Centered Splash Logo Image */}
      <div
        className="w-full max-w-[260px] sm:max-w-[320px] px-6"
        style={{
          transition: "transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.7s ease",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.92) translateY(8px)",
          opacity: visible ? 1 : 0,
        }}
      >
        <img
          src="/splash.png"
          alt="MealBAE"
          className="w-full h-auto object-contain"
          style={{ filter: "drop-shadow(0 4px 24px rgba(255,48,8,0.08))" }}
        />
      </div>

      {/* Typewriter tagline */}
      <div
        className="text-center px-6"
        style={{
          transition: "opacity 0.5s ease",
          opacity: typed.length > 0 ? 1 : 0,
          minHeight: "2.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            fontSize: "clamp(14px, 3.8vw, 17px)",
            fontWeight: 500,
            color: "#555",
            letterSpacing: "0.01em",
            lineHeight: 1.55,
            maxWidth: 320,
          }}
        >
          {typed}
          {/* Blinking cursor — only show while still typing */}
          {!typingDone && (
            <span
              style={{
                display: "inline-block",
                width: 2,
                height: "1em",
                background: "#ff3008",
                borderRadius: 1,
                marginLeft: 2,
                verticalAlign: "text-bottom",
                animation: "blink 0.7s step-end infinite",
              }}
            />
          )}
        </p>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

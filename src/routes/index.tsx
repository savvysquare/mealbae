import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [nav]);

  const foodPattern = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='%23ff3008' fill-opacity='0.025' stroke='%23ff3008' stroke-opacity='0.025' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'%3E%3C!-- Cloche --%3E%3Cpath d='M20 30h16M22 30a6 6 0 0 1 12 0' fill='none'/%3E%3Ccircle cx='28' cy='23' r='1'/%3E%3C!-- Drink --%3E%3Cpath d='M65 24h12l-2 10H67z' fill='none'/%3E%3Cpath d='M71 24V18h2' fill='none'/%3E%3C!-- Fork & Spoon --%3E%3Cpath d='M24 68v10M22 68h4M22 71h4M32 68v10M30 68v3a2 2 0 0 0 4 0v-3' fill='none'/%3E%3C!-- Pizza --%3E%3Cpath d='M68 68l10 8H68z' fill='none'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#ffffff",
        backgroundImage: foodPattern,
        backgroundRepeat: "repeat",
        transition: "opacity 0.4s ease",
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Centered Splash Image */}
      <div
        className="w-full max-w-[280px] sm:max-w-[340px] px-6 transition-all duration-700"
        style={{
          transform: visible ? "scale(1)" : "scale(0.95)",
          opacity: visible ? 1 : 0,
        }}
      >
        <img
          src="/splash.png"
          alt="MealBAE"
          className="w-full h-auto object-contain drop-shadow-[0_4px_20px_rgba(255,48,8,0.06)]"
        />
      </div>
    </div>
  );
}

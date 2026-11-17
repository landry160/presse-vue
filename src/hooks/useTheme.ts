"use client";
import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type Preset = "ocean" | "nature" | "crepuscule" | "royal" | "mono";
export type Theme = { mode: ThemeMode; preset: Preset };

export const PRESETS: { id: Preset; label: string; bg: string }[] = [
  { id: "ocean", label: "Océan", bg: "linear-gradient(135deg,#00C6FF,#0078FF)" },
  { id: "nature", label: "Nature", bg: "linear-gradient(135deg,#5EE6B0,#0FA66B)" },
  { id: "crepuscule", label: "Crépuscule", bg: "linear-gradient(135deg,#FFA62B,#FF6B00)" },
  { id: "royal", label: "Royal", bg: "linear-gradient(135deg,#9b2cfa,#2c62fa)" },
  { id: "mono", label: "Monochrome", bg: "linear-gradient(135deg,#64748b,#1e293b)" },
];

const DEFAULT: Theme = { mode: "system", preset: "ocean" };

function read(): Theme {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem("ui_theme") || "{}") }; }
  catch { return DEFAULT; }
}

function apply(t: Theme) {
  const dark = t.mode === "dark" || (t.mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.preset = t.preset;
}

/** Thème persistant (clé ui_theme), qui suit le réglage du système en direct en mode « Système ». */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(DEFAULT);

  useEffect(() => {
    const t = read();
    // Lecture unique au montage : localStorage n'existe pas pendant le rendu statique.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(t);
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => { const cur = read(); if (cur.mode === "system") apply(cur); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((patch: Partial<Theme>) => {
    setThemeState((prev) => {
      const next = { ...prev, ...patch };
      apply(next);
      try { localStorage.setItem("ui_theme", JSON.stringify(next)); } catch { /* stockage indisponible */ }
      return next;
    });
  }, []);

  return { theme, setTheme };
}

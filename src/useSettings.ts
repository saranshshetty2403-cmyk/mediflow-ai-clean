/**
 * useSettings — MediFlow AI
 * Persists all user preferences to localStorage.
 * Apply settings by reading the returned values and passing them as
 * data-* attributes or CSS variables on the root element.
 */
import { useState, useEffect, useCallback } from "react";

export type Theme = "dark" | "light" | "system";
export type AccentColour = "cyan" | "violet" | "emerald" | "amber" | "rose";
export type FontSize = "compact" | "default" | "comfortable";
export type SidebarPosition = "left" | "right";
export type DefaultView = "automation" | "queue" | "metrics";

export interface AppSettings {
  theme: Theme;
  accentColour: AccentColour;
  fontSize: FontSize;
  sidebarPosition: SidebarPosition;
  defaultView: DefaultView;
  denseMode: boolean;
  soundEnabled: boolean;
}

const STORAGE_KEY = "mediflow_settings";

const DEFAULTS: AppSettings = {
  theme: "dark",
  accentColour: "cyan",
  fontSize: "default",
  sidebarPosition: "left",
  defaultView: "automation",
  denseMode: false,
  soundEnabled: false,
};

// Accent colour CSS values
export const ACCENT_COLOURS: Record<AccentColour, { primary: string; glow: string; muted: string }> = {
  cyan:    { primary: "#00d4ff", glow: "rgba(0,212,255,0.25)",   muted: "rgba(0,212,255,0.08)" },
  violet:  { primary: "#a78bfa", glow: "rgba(167,139,250,0.25)", muted: "rgba(167,139,250,0.08)" },
  emerald: { primary: "#34d399", glow: "rgba(52,211,153,0.25)",  muted: "rgba(52,211,153,0.08)" },
  amber:   { primary: "#fbbf24", glow: "rgba(251,191,36,0.25)",  muted: "rgba(251,191,36,0.08)" },
  rose:    { primary: "#fb7185", glow: "rgba(251,113,133,0.25)", muted: "rgba(251,113,133,0.08)" },
};

// Font size rem values
const FONT_SIZES: Record<FontSize, string> = {
  compact:     "13px",
  default:     "15px",
  comfortable: "17px",
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function saveSettings(s: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore quota errors
  }
}

/** Resolve "system" theme to actual dark/light based on OS preference */
function resolveTheme(theme: Theme): "dark" | "light" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Apply all settings to the document root */
function applySettings(s: AppSettings) {
  const root = document.documentElement;
  const resolved = resolveTheme(s.theme);

  // Theme
  root.setAttribute("data-theme", resolved);
  root.classList.toggle("light-theme", resolved === "light");

  // Accent colour
  const accent = ACCENT_COLOURS[s.accentColour];
  root.style.setProperty("--accent-primary", accent.primary);
  root.style.setProperty("--accent-glow",    accent.glow);
  root.style.setProperty("--accent-muted",   accent.muted);

  // Font size
  root.style.setProperty("--app-font-size", FONT_SIZES[s.fontSize]);
  root.style.fontSize = FONT_SIZES[s.fontSize];

  // Dense mode
  root.classList.toggle("dense-mode", s.denseMode);
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);

  // Apply on mount and whenever settings change
  useEffect(() => {
    applySettings(settings);
  }, [settings]);

  // Listen for OS theme changes when using "system"
  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applySettings(settings);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettingsState(prev => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }, []);

  /** Play a short chime using Web Audio API */
  const playChime = useCallback(() => {
    if (!settings.soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Web Audio not available
    }
  }, [settings.soundEnabled]);

  return { settings, updateSetting, playChime };
}

/**
 * SettingsPage — MediFlow AI
 * Full-page settings overlay. Fully theme-aware — works in both dark and light mode.
 */
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Sun, Moon, Monitor, Volume2, VolumeX,
  AlignLeft, AlignRight, ListOrdered, BarChart3, Zap,
  Type, Cpu, Cloud, Info, Settings2, Palette, Layout,
  Bell, Sliders
} from "lucide-react";
import type { AppSettings, AccentColour, Theme, FontSize, SidebarPosition, DefaultView, ProviderMode } from "./useSettings";
import { ACCENT_COLOURS } from "./useSettings";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

// Resolve the current theme to "dark" or "light"
function resolvedTheme(t: Theme): "dark" | "light" {
  if (t !== "system") return t;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// ── Theme-aware style helpers ─────────────────────────────────────────────

function useThemeStyles(theme: Theme) {
  const isDark = resolvedTheme(theme) === "dark";
  return {
    isDark,
    pageBg:       isDark ? "rgba(2,8,23,0.97)"          : "rgba(240,244,248,0.98)",
    gridLine:     isDark ? "rgba(0,212,255,0.025)"       : "rgba(13,115,119,0.04)",
    cardBg:       isDark ? "rgba(255,255,255,0.03)"      : "rgba(255,255,255,0.80)",
    cardBorder:   isDark ? "rgba(255,255,255,0.07)"      : "rgba(0,0,0,0.09)",
    rowBorder:    isDark ? "rgba(255,255,255,0.04)"      : "rgba(0,0,0,0.06)",
    labelText:    isDark ? "rgba(255,255,255,0.80)"      : "#1e293b",
    descText:     isDark ? "#8892a4"                     : "#64748b",
    segBg:        isDark ? "rgba(255,255,255,0.05)"      : "rgba(0,0,0,0.05)",
    segBorder:    isDark ? "rgba(255,255,255,0.06)"      : "rgba(0,0,0,0.08)",
    segInactiveText: isDark ? "#8892a4"                  : "#64748b",
    toggleOff:    isDark ? "rgba(255,255,255,0.10)"      : "rgba(0,0,0,0.12)",
    inputBg:      isDark ? "rgba(255,255,255,0.06)"      : "rgba(255,255,255,0.90)",
    inputBorder:  isDark ? "rgba(255,255,255,0.12)"      : "rgba(0,0,0,0.14)",
    inputText:    isDark ? "rgba(255,255,255,0.80)"      : "#1e293b",
    inputPlaceholder: isDark ? "#8892a4"                 : "#94a3b8",
    closeBtnBg:   isDark ? "rgba(255,255,255,0.03)"      : "rgba(0,0,0,0.04)",
    closeBtnBorder: isDark ? "rgba(255,255,255,0.08)"    : "rgba(0,0,0,0.10)",
    closeBtnText: isDark ? "#8892a4"                     : "#475569",
    footerText:   isDark ? "rgba(136,146,164,0.50)"      : "rgba(71,85,105,0.50)",
    titleText:    isDark ? "#ffffff"                     : "#0f172a",
    subtitleText: isDark ? "#8892a4"                     : "#64748b",
    amberBg:      isDark ? "rgba(217,119,6,0.07)"        : "rgba(217,119,6,0.08)",
    amberBorder:  isDark ? "rgba(217,119,6,0.18)"        : "rgba(217,119,6,0.25)",
    amberText:    isDark ? "rgba(252,211,77,0.80)"       : "#92400e",
    amberTitle:   isDark ? "#fcd34d"                     : "#78350f",
    amberCode:    isDark ? "#fde68a"                     : "#92400e",
    amberCodeBg:  isDark ? "rgba(217,119,6,0.10)"        : "rgba(217,119,6,0.10)",
    amberFaint:   isDark ? "rgba(252,211,77,0.50)"       : "#a16207",
  };
}

// ── Primitives ────────────────────────────────────────────────────────────

function SectionCard({ icon, title, children, s }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  s: ReturnType<typeof useThemeStyles>;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: s.cardBg, border: `1px solid ${s.cardBorder}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: "var(--accent-primary)" }}>{icon}</span>
        <h3
          className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em]"
          style={{ color: "var(--accent-primary)", opacity: 0.7 }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, description, children, s }: {
  label: string;
  description?: string;
  children: React.ReactNode;
  s: ReturnType<typeof useThemeStyles>;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-3 last:border-0"
      style={{ borderBottom: `1px solid ${s.rowBorder}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium" style={{ color: s.labelText }}>{label}</div>
        {description && (
          <div className="text-[11px] mt-0.5 leading-snug" style={{ color: s.descText }}>
            {description}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, s }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  s: ReturnType<typeof useThemeStyles>;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-10 rounded-full transition-all duration-200 focus:outline-none"
      style={{
        height: "22px",
        background: checked ? "var(--accent-primary)" : s.toggleOff,
      }}
      role="switch"
      aria-checked={checked}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

function SegmentedControl<T extends string>({
  options, value, onChange, s,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  s: ReturnType<typeof useThemeStyles>;
}) {
  return (
    <div
      className="flex gap-1 p-0.5 rounded-lg"
      style={{ background: s.segBg, border: `1px solid ${s.segBorder}` }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono transition-all"
          style={
            value === opt.value
              ? {
                  background: "var(--accent-muted)",
                  color: "var(--accent-primary)",
                  border: "1px solid rgba(var(--accent-primary-rgb,0,212,255),0.30)",
                  boxShadow: "0 0 8px var(--accent-glow)",
                }
              : {
                  color: s.segInactiveText,
                  border: "1px solid transparent",
                }
          }
        >
          {opt.icon && <span className="w-3.5 h-3.5">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SettingsDrawer({ open, onClose, settings, onUpdate }: Props) {
  const s = useThemeStyles(settings.theme);

  const handleProviderChange = (v: ProviderMode) => {
    // When switching to Ollama, clear both fields so they start empty
    if (v === "ollama") {
      onUpdate("ollamaUrl", "");
      onUpdate("ollamaModel", "");
    }
    onUpdate("providerMode", v);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="settings-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[70] overflow-y-auto"
          style={{ background: s.pageBg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
        >
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${s.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${s.gridLine} 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Page container */}
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-16">

            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--accent-muted)", border: "1px solid rgba(var(--accent-primary-rgb,0,212,255),0.20)" }}
                  >
                    <Settings2 className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  </div>
                  <h1 className="text-xl font-semibold tracking-tight" style={{ color: s.titleText }}>
                    Settings
                  </h1>
                </div>
                <p className="text-[12px] font-mono tracking-widest ml-12" style={{ color: s.subtitleText }}>
                  MEDIFLOW AI · PREFERENCES
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-mono transition-all hover:opacity-80"
                style={{ color: s.closeBtnText, border: `1px solid ${s.closeBtnBorder}`, background: s.closeBtnBg }}
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>

            {/* ── Two-column grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* APPEARANCE */}
              <SectionCard icon={<Palette className="w-4 h-4" />} title="Appearance" s={s}>
                <SettingRow label="Theme" description="Controls the overall colour scheme" s={s}>
                  <SegmentedControl<Theme>
                    value={settings.theme}
                    onChange={(v) => onUpdate("theme", v)}
                    s={s}
                    options={[
                      { value: "dark",   label: "Dark",  icon: <Moon className="w-3.5 h-3.5" /> },
                      { value: "light",  label: "Light", icon: <Sun className="w-3.5 h-3.5" /> },
                      { value: "system", label: "Auto",  icon: <Monitor className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </SettingRow>

                <SettingRow label="Accent Colour" description="Primary glow and highlight colour" s={s}>
                  <div className="flex gap-2">
                    {(Object.keys(ACCENT_COLOURS) as AccentColour[]).map((colour) => (
                      <button
                        key={colour}
                        onClick={() => onUpdate("accentColour", colour)}
                        title={colour.charAt(0).toUpperCase() + colour.slice(1)}
                        className="w-6 h-6 rounded-full transition-all"
                        style={{
                          backgroundColor: ACCENT_COLOURS[colour].primary,
                          outline: settings.accentColour === colour ? `2px solid ${ACCENT_COLOURS[colour].primary}` : "none",
                          outlineOffset: "2px",
                          opacity: settings.accentColour === colour ? 1 : 0.55,
                          transform: settings.accentColour === colour ? "scale(1.15)" : "scale(1)",
                          boxShadow: settings.accentColour === colour ? `0 0 10px ${ACCENT_COLOURS[colour].glow}` : "none",
                        }}
                      />
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Font Size" description="Base text size across the dashboard" s={s}>
                  <SegmentedControl<FontSize>
                    value={settings.fontSize}
                    onChange={(v) => onUpdate("fontSize", v)}
                    s={s}
                    options={[
                      { value: "compact",     label: "S", icon: <Type className="w-3 h-3" /> },
                      { value: "default",     label: "M", icon: <Type className="w-3.5 h-3.5" /> },
                      { value: "comfortable", label: "L", icon: <Type className="w-4 h-4" /> },
                    ]}
                  />
                </SettingRow>
              </SectionCard>

              {/* LAYOUT */}
              <SectionCard icon={<Layout className="w-4 h-4" />} title="Layout" s={s}>
                <SettingRow label="Sidebar Position" description="Desktop only — mobile uses bottom nav" s={s}>
                  <SegmentedControl<SidebarPosition>
                    value={settings.sidebarPosition}
                    onChange={(v) => onUpdate("sidebarPosition", v)}
                    s={s}
                    options={[
                      { value: "left",  label: "Left",  icon: <AlignLeft className="w-3.5 h-3.5" /> },
                      { value: "right", label: "Right", icon: <AlignRight className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </SettingRow>

                <SettingRow label="Default View" description="Which view opens when you enter the dashboard" s={s}>
                  <SegmentedControl<DefaultView>
                    value={settings.defaultView}
                    onChange={(v) => onUpdate("defaultView", v)}
                    s={s}
                    options={[
                      { value: "automation", label: "Run",     icon: <Zap className="w-3.5 h-3.5" /> },
                      { value: "queue",      label: "Queue",   icon: <ListOrdered className="w-3.5 h-3.5" /> },
                      { value: "metrics",    label: "Metrics", icon: <BarChart3 className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </SettingRow>

                <SettingRow label="Dense Mode" description="Reduce padding and spacing to fit more on screen" s={s}>
                  <Toggle checked={settings.denseMode} onChange={(v) => onUpdate("denseMode", v)} s={s} />
                </SettingRow>
              </SectionCard>

              {/* NOTIFICATIONS */}
              <SectionCard icon={<Bell className="w-4 h-4" />} title="Notifications" s={s}>
                <SettingRow label="Sound on AI Complete" description="Play a chime when processing finishes" s={s}>
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled
                      ? <Volume2 className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                      : <VolumeX className="w-4 h-4" style={{ color: s.descText }} />
                    }
                    <Toggle checked={settings.soundEnabled} onChange={(v) => onUpdate("soundEnabled", v)} s={s} />
                  </div>
                </SettingRow>
              </SectionCard>

              {/* AI PROVIDER */}
              <SectionCard icon={<Sliders className="w-4 h-4" />} title="AI Provider" s={s}>
                <SettingRow label="Inference Engine" description="Switch between Gemma cloud and local Ollama" s={s}>
                  <SegmentedControl<ProviderMode>
                    value={settings.providerMode}
                    onChange={handleProviderChange}
                    s={s}
                    options={[
                      { value: "gemma",  label: "Gemma 4", icon: <Cloud className="w-3.5 h-3.5" /> },
                      { value: "ollama", label: "Ollama",  icon: <Cpu   className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </SettingRow>

                {settings.providerMode === "ollama" && (
                  <>
                    <SettingRow label="Ollama Server URL" description="Leave empty to use the public test server" s={s}>
                      <input
                        type="text"
                        value={settings.ollamaUrl}
                        onChange={(e) => onUpdate("ollamaUrl", e.target.value)}
                        placeholder="http://5.149.249.212:11434"
                        className="w-[200px] px-2.5 py-1.5 rounded-md text-[12px] font-mono focus:outline-none transition-all"
                        style={{
                          background: s.inputBg,
                          border: `1px solid ${s.inputBorder}`,
                          color: s.inputText,
                        }}
                      />
                    </SettingRow>

                    <SettingRow label="Ollama Model" description="Leave empty to use gemma2:2b (public server default)" s={s}>
                      <input
                        type="text"
                        value={settings.ollamaModel}
                        onChange={(e) => onUpdate("ollamaModel", e.target.value)}
                        placeholder="gemma2:2b"
                        className="w-[200px] px-2.5 py-1.5 rounded-md text-[12px] font-mono focus:outline-none transition-all"
                        style={{
                          background: s.inputBg,
                          border: `1px solid ${s.inputBorder}`,
                          color: s.inputText,
                        }}
                      />
                    </SettingRow>

                    {/* Judge info card */}
                    <div
                      className="flex gap-2.5 mt-3 p-3.5 rounded-xl text-[11px] leading-relaxed"
                      style={{ background: s.amberBg, border: `1px solid ${s.amberBorder}`, color: s.amberText }}
                    >
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: s.amberTitle }} />
                      <div className="space-y-1.5">
                        <div>
                          <span className="font-semibold" style={{ color: s.amberTitle }}>
                            Hackathon judges — quick start:
                          </span>{" "}
                          Select <span className="font-semibold">Ollama</span> above and leave both fields empty.
                          The public test server and model are used automatically as defaults.
                        </div>
                        <div>
                          Custom values: URL{" "}
                          <code
                            className="font-mono px-1 rounded"
                            style={{ color: s.amberCode, background: s.amberCodeBg }}
                          >
                            http://5.149.249.212:11434
                          </code>
                          {" · "}model{" "}
                          <code
                            className="font-mono px-1 rounded"
                            style={{ color: s.amberCode, background: s.amberCodeBg }}
                          >
                            gemma2:2b
                          </code>.
                        </div>
                        <div style={{ color: s.amberFaint }}>
                          Image-based modules (Prescription Scan, Image Extraction) always use Gemini vision regardless of this setting.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </SectionCard>

            </div>{/* end grid */}

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="text-[10px] font-mono tracking-widest" style={{ color: s.footerText }}>
                ALL PREFERENCES SAVED AUTOMATICALLY · MEDIFLOW AI v3.0
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * SettingsPage — MediFlow AI
 * Full-page settings overlay with Dark Biopunk Glass design language.
 * Replaces the old side drawer with a rich two-column layout.
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

// ── Primitives ────────────────────────────────────────────────────────────

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-white/[0.07] p-5 space-y-1"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[--accent-primary]">{icon}</span>
        <h3 className="text-[11px] font-mono font-semibold uppercase tracking-[0.15em] text-[--accent-primary]/70">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-white/80 font-medium">{label}</div>
        {description && <div className="text-[11px] text-[#8892a4] mt-0.5 leading-snug">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-primary] ${
        checked ? "bg-[--accent-primary]" : "bg-white/10"
      }`}
      style={{ height: "22px" }}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
          checked ? "left-[calc(100%-18px)]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.05] border border-white/[0.06]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono transition-all ${
            value === opt.value
              ? "bg-[--accent-muted] text-[--accent-primary] border border-[--accent-primary]/30 shadow-[0_0_8px_var(--accent-glow)]"
              : "text-[#8892a4] hover:text-white"
          }`}
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
          style={{
            background: "rgba(2, 8, 23, 0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {/* Circuit grid background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)",
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
                    style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)" }}
                  >
                    <Settings2 className="w-4.5 h-4.5 text-[--accent-primary]" />
                  </div>
                  <h1 className="text-xl font-semibold text-white tracking-tight">Settings</h1>
                </div>
                <p className="text-[12px] font-mono text-[#8892a4] tracking-widest ml-12">
                  MEDIFLOW AI · PREFERENCES
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#8892a4] hover:text-white transition-all text-[12px] font-mono"
                style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>

            {/* ── Two-column grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── APPEARANCE ── */}
              <SectionCard icon={<Palette className="w-4 h-4" />} title="Appearance">
                <SettingRow label="Theme" description="Controls the overall colour scheme">
                  <SegmentedControl<Theme>
                    value={settings.theme}
                    onChange={(v) => onUpdate("theme", v)}
                    options={[
                      { value: "dark",   label: "Dark",   icon: <Moon className="w-3.5 h-3.5" /> },
                      { value: "light",  label: "Light",  icon: <Sun className="w-3.5 h-3.5" /> },
                      { value: "system", label: "Auto",   icon: <Monitor className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </SettingRow>

                <SettingRow label="Accent Colour" description="Primary glow and highlight colour">
                  <div className="flex gap-2">
                    {(Object.keys(ACCENT_COLOURS) as AccentColour[]).map((colour) => (
                      <button
                        key={colour}
                        onClick={() => onUpdate("accentColour", colour)}
                        title={colour.charAt(0).toUpperCase() + colour.slice(1)}
                        className={`w-6 h-6 rounded-full transition-all ${
                          settings.accentColour === colour
                            ? "scale-110"
                            : "opacity-60 hover:opacity-100 hover:scale-105"
                        }`}
                        style={{
                          backgroundColor: ACCENT_COLOURS[colour].primary,
                          outline: settings.accentColour === colour ? `2px solid ${ACCENT_COLOURS[colour].primary}` : "none",
                          outlineOffset: "2px",
                          boxShadow: settings.accentColour === colour
                            ? `0 0 10px ${ACCENT_COLOURS[colour].glow}`
                            : "none",
                        }}
                      />
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Font Size" description="Base text size across the dashboard">
                  <SegmentedControl<FontSize>
                    value={settings.fontSize}
                    onChange={(v) => onUpdate("fontSize", v)}
                    options={[
                      { value: "compact",     label: "S", icon: <Type className="w-3 h-3" /> },
                      { value: "default",     label: "M", icon: <Type className="w-3.5 h-3.5" /> },
                      { value: "comfortable", label: "L", icon: <Type className="w-4 h-4" /> },
                    ]}
                  />
                </SettingRow>
              </SectionCard>

              {/* ── LAYOUT ── */}
              <SectionCard icon={<Layout className="w-4 h-4" />} title="Layout">
                <SettingRow label="Sidebar Position" description="Desktop only — mobile uses bottom nav">
                  <SegmentedControl<SidebarPosition>
                    value={settings.sidebarPosition}
                    onChange={(v) => onUpdate("sidebarPosition", v)}
                    options={[
                      { value: "left",  label: "Left",  icon: <AlignLeft className="w-3.5 h-3.5" /> },
                      { value: "right", label: "Right", icon: <AlignRight className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </SettingRow>

                <SettingRow label="Default View" description="Which view opens when you enter the dashboard">
                  <SegmentedControl<DefaultView>
                    value={settings.defaultView}
                    onChange={(v) => onUpdate("defaultView", v)}
                    options={[
                      { value: "automation", label: "Run",     icon: <Zap className="w-3.5 h-3.5" /> },
                      { value: "queue",      label: "Queue",   icon: <ListOrdered className="w-3.5 h-3.5" /> },
                      { value: "metrics",    label: "Metrics", icon: <BarChart3 className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </SettingRow>

                <SettingRow label="Dense Mode" description="Reduce padding and spacing to fit more on screen">
                  <Toggle
                    checked={settings.denseMode}
                    onChange={(v) => onUpdate("denseMode", v)}
                  />
                </SettingRow>
              </SectionCard>

              {/* ── NOTIFICATIONS ── */}
              <SectionCard icon={<Bell className="w-4 h-4" />} title="Notifications">
                <SettingRow label="Sound on AI Complete" description="Play a chime when processing finishes">
                  <div className="flex items-center gap-2">
                    {settings.soundEnabled
                      ? <Volume2 className="w-4 h-4 text-[--accent-primary]" />
                      : <VolumeX className="w-4 h-4 text-[#8892a4]" />
                    }
                    <Toggle
                      checked={settings.soundEnabled}
                      onChange={(v) => onUpdate("soundEnabled", v)}
                    />
                  </div>
                </SettingRow>
              </SectionCard>

              {/* ── AI PROVIDER ── */}
              <SectionCard icon={<Sliders className="w-4 h-4" />} title="AI Provider">
                <SettingRow label="Inference Engine" description="Switch between Gemma cloud and local Ollama">
                  <SegmentedControl<ProviderMode>
                    value={settings.providerMode}
                    onChange={(v) => onUpdate("providerMode", v)}
                    options={[
                      { value: "gemma",  label: "Gemma 4", icon: <Cloud className="w-3.5 h-3.5" /> },
                      { value: "ollama", label: "Ollama",  icon: <Cpu   className="w-3.5 h-3.5" /> },
                    ]}
                  />
                </SettingRow>

                {settings.providerMode === "ollama" && (
                  <>
                    <SettingRow label="Ollama Server URL" description="Leave empty to use the public test server">
                      <input
                        type="text"
                        value={settings.ollamaUrl}
                        onChange={(e) => onUpdate("ollamaUrl", e.target.value)}
                        placeholder="http://5.149.249.212:11434"
                        className="w-[200px] px-2.5 py-1.5 rounded-md text-[12px] font-mono bg-white/[0.06] border border-white/[0.12] text-white/80 placeholder-[#8892a4] focus:outline-none focus:border-[--accent-primary]/50 focus:bg-white/[0.08] transition-all"
                      />
                    </SettingRow>

                    <SettingRow label="Ollama Model" description="Leave empty to use gemma2:2b (public server default)">
                      <input
                        type="text"
                        value={settings.ollamaModel}
                        onChange={(e) => onUpdate("ollamaModel", e.target.value)}
                        placeholder="gemma2:2b"
                        className="w-[200px] px-2.5 py-1.5 rounded-md text-[12px] font-mono bg-white/[0.06] border border-white/[0.12] text-white/80 placeholder-[#8892a4] focus:outline-none focus:border-[--accent-primary]/50 focus:bg-white/[0.08] transition-all"
                      />
                    </SettingRow>

                    {/* Judge info card */}
                    <div className="flex gap-2.5 mt-3 p-3.5 rounded-xl bg-amber-500/[0.07] border border-amber-500/[0.18] text-[11px] text-amber-300/80 leading-relaxed">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
                      <div className="space-y-1.5">
                        <div>
                          <span className="font-semibold text-amber-300">Hackathon judges — quick start:</span>{" "}
                          Select <span className="font-semibold">Ollama</span> above and leave both fields empty.
                          The public test server and model are used automatically as defaults.
                        </div>
                        <div>
                          Custom values: URL{" "}
                          <code className="font-mono text-amber-200 bg-amber-500/10 px-1 rounded">http://5.149.249.212:11434</code>
                          {" · "}model{" "}
                          <code className="font-mono text-amber-200 bg-amber-500/10 px-1 rounded">gemma2:2b</code>.
                        </div>
                        <div className="text-amber-300/60">
                          Image-based modules (Prescription Scan, Image Extraction) always use Gemini vision regardless of this setting.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </SectionCard>

            </div>{/* end grid */}

            {/* ── Footer ── */}
            <div className="mt-8 text-center">
              <div className="text-[10px] font-mono text-[#8892a4]/50 tracking-widest">
                ALL PREFERENCES SAVED AUTOMATICALLY · MEDIFLOW AI v3.0
              </div>
            </div>

          </div>{/* end page container */}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

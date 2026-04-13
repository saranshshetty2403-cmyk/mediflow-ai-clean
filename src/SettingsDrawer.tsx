/**
 * SettingsDrawer — MediFlow AI
 * Slide-in settings panel matching the Dark Biopunk Glass design language.
 */
import { motion, AnimatePresence } from "framer-motion";
import { X, Sun, Moon, Monitor, Volume2, VolumeX, AlignLeft, AlignRight, Layers, LayoutDashboard, ListOrdered, BarChart3, Zap, Type, Cpu, Cloud, Info } from "lucide-react";
import type { AppSettings, AccentColour, Theme, FontSize, SidebarPosition, DefaultView, ProviderMode } from "./useSettings";
import { ACCENT_COLOURS } from "./useSettings";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
}

// ── Small reusable primitives ──────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-[--accent-primary]/40 px-1 mb-2 mt-5 first:mt-0">
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
      className={`relative w-10 h-5.5 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-primary] ${
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
        <>
          {/* Backdrop */}
          <motion.div
            key="settings-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="settings-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-[70] w-80 max-w-[90vw] flex flex-col"
            style={{
              background: "rgba(8, 14, 28, 0.97)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              borderLeft: "1px solid rgba(var(--accent-primary-rgb, 0,212,255), 0.15)",
              boxShadow: "-12px 0 60px rgba(0,0,0,0.7), 0 0 40px var(--accent-glow)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <div className="text-white font-semibold text-[14px] tracking-wide">Settings</div>
                <div className="text-[10px] font-mono text-[#8892a4] tracking-widest mt-0.5">PREFERENCES</div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8892a4] hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 pb-8">

              {/* ── APPEARANCE ── */}
              <SectionLabel>Appearance</SectionLabel>

              {/* Theme */}
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

              {/* Accent Colour */}
              <SettingRow label="Accent Colour" description="Primary glow and highlight colour">
                <div className="flex gap-2">
                  {(Object.keys(ACCENT_COLOURS) as AccentColour[]).map((colour) => (
                    <button
                      key={colour}
                      onClick={() => onUpdate("accentColour", colour)}
                      title={colour.charAt(0).toUpperCase() + colour.slice(1)}
                      className={`w-6 h-6 rounded-full transition-all ${
                        settings.accentColour === colour
                          ? "ring-2 ring-offset-2 ring-offset-[#080e1c] scale-110"
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

              {/* Font Size */}
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

              {/* ── LAYOUT ── */}
              <SectionLabel>Layout</SectionLabel>

              {/* Sidebar Position */}
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

              {/* Default Landing View */}
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

              {/* Dense Mode */}
              <SettingRow label="Dense Mode" description="Reduce padding and spacing to fit more on screen">
                <Toggle
                  checked={settings.denseMode}
                  onChange={(v) => onUpdate("denseMode", v)}
                />
              </SettingRow>

              {/* ── NOTIFICATIONS ── */}
              <SectionLabel>Notifications</SectionLabel>

              {/* Sound */}
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

              {/* ── AI PROVIDER ── */}
              <SectionLabel>AI Provider</SectionLabel>

              {/* Provider Mode Toggle */}
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

              {/* Ollama-specific fields — shown only when Ollama is selected */}
              {settings.providerMode === "ollama" && (
                <>
                  <SettingRow label="Ollama Server URL" description="Base URL of your Ollama instance">
                    <input
                      type="text"
                      value={settings.ollamaUrl}
                      onChange={(e) => onUpdate("ollamaUrl", e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-[200px] px-2.5 py-1.5 rounded-md text-[12px] font-mono bg-white/[0.06] border border-white/[0.12] text-white/80 placeholder-[#8892a4] focus:outline-none focus:border-[--accent-primary]/50 focus:bg-white/[0.08] transition-all"
                    />
                  </SettingRow>

                  <SettingRow label="Ollama Model" description="Model tag to use (must be pulled on the server)">
                    <input
                      type="text"
                      value={settings.ollamaModel}
                      onChange={(e) => onUpdate("ollamaModel", e.target.value)}
                      placeholder="gemma3:4b"
                      className="w-[200px] px-2.5 py-1.5 rounded-md text-[12px] font-mono bg-white/[0.06] border border-white/[0.12] text-white/80 placeholder-[#8892a4] focus:outline-none focus:border-[--accent-primary]/50 focus:bg-white/[0.08] transition-all"
                    />
                  </SettingRow>

                  {/* Public test server hint for hackathon judges */}
                  <div className="flex gap-2 mt-2 mb-1 p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/[0.18] text-[11px] text-amber-300/80 leading-relaxed">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400" />
                    <div>
                      <span className="font-semibold text-amber-300">Hackathon judges:</span> Use the public test server at{" "}
                      <code className="font-mono text-amber-200 bg-amber-500/10 px-1 rounded">http://5.149.249.212:11434</code>{" "}
                      with model{" "}
                      <code className="font-mono text-amber-200 bg-amber-500/10 px-1 rounded">gemma2:2b</code>.
                      {" "}Image-based modules (Prescription Scan, Image Extraction) always use Gemini vision regardless of this setting.
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/[0.06]">
              <div className="text-[10px] font-mono text-[#8892a4] text-center tracking-wide">
                All preferences saved automatically
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

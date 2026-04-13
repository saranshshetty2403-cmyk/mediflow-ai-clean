/*
 * MediFlow AI - Homepage v4
 * Design: Mobile-first, clean clinical dark interface
 * Changes: new images (app on screen), staff/patient benefits, Ollama+Gemma logos, mobile nav
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight,
  Brain,
  ClipboardList,
  AlertTriangle,
  Route,
  FileText,
  CheckCircle2,
  Zap,
  Shield,
  Activity,
  Mic,
  Globe,
  Lock,
  ScanLine,
  MessageSquare,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Users,
  Clock,
  TrendingUp,
  Menu,
  X,
  Heart,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Images (v3 - all device screens show MediFlow AI) ──────────────────────
const HERO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-hero-v3-X27sPijiQHA3LZwkDqYpBB.webp";
const PROBLEM_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-problem-v3-UoDPSeQmJWydqdnGoPijYb.webp";
const MULTILINGUAL_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-multilingual-v3-8r7wNE6yihG3FpQzRVSf6g.webp";
const OFFLINE_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-offline-v3-2aTeUS6msWrZ8rctSghsU7.webp";

// ── Logos ──────────────────────────────────────────────────────────────────
const OLLAMA_LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/ollama-logo-white_7f1a8115.png";
const GEMMA_LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/gemma-logo_30a38483.png";

// ── Data ───────────────────────────────────────────────────────────────────
const problemStats = [
  { value: "2 hrs", label: "Daily admin time per doctor", icon: Clock },
  { value: "40%", label: "Of nursing time on paperwork", icon: TrendingUp },
  { value: "1:1,457", label: "Doctor-to-patient ratio in rural India", icon: Users },
  { value: "22+", label: "Official Indian languages spoken", icon: Globe },
];

const features = [
  {
    icon: ClipboardList,
    title: "Intake Summarisation",
    description:
      "Paste raw patient notes or dictate via voice and receive a structured clinical summary: chief complaint, vitals, history, and risk flags - in under two seconds.",
    badge: "Core",
  },
  {
    icon: Route,
    title: "Smart Triage & Routing",
    description:
      "Incoming patient messages are analysed for urgency and automatically routed to the correct care team: cardiology, primary care, urgent care, or administration.",
    badge: "Core",
  },
  {
    icon: FileText,
    title: "Discharge Instructions",
    description:
      "Generate plain-language discharge instructions tailored to the patient's literacy level and diagnosis. Export as a downloadable PDF in 9 Indian languages.",
    badge: "Multilingual",
  },
  {
    icon: AlertTriangle,
    title: "Urgent Case Flagging",
    description:
      "Real-time risk scoring from symptom descriptions. Critical cases are flagged with an urgency score and a recommended escalation pathway.",
    badge: "Safety",
  },
  {
    icon: MessageSquare,
    title: "Shift Handoff Notes",
    description:
      "Structured SBAR-format handoff summaries generated from free-text notes, ensuring nothing is missed during shift transitions in busy wards.",
    badge: "Core",
  },
  {
    icon: Brain,
    title: "Follow-Up Planner",
    description:
      "Automatically generates a follow-up care plan with recommended tests, specialist referrals, and patient instructions based on the current clinical note.",
    badge: "Core",
  },
  {
    icon: ScanLine,
    title: "MediScan: Prescription OCR",
    description:
      "Upload a photo of a handwritten prescription and receive a structured medication list with dosage, frequency, and drug interaction warnings powered by RxNorm.",
    badge: "Vision",
  },
  {
    icon: Mic,
    title: "Voice Input",
    description:
      "All modules support continuous voice dictation. The system transcribes exactly what was spoken, with grammar is cleaned up, but no medical terms are invented.",
    badge: "Accessibility",
  },
];

const languageList = [
  { code: "hi", name: "Hindi", script: "हिन्दी" },
  { code: "bn", name: "Bengali", script: "বাংলা" },
  { code: "ta", name: "Tamil", script: "தமிழ்" },
  { code: "te", name: "Telugu", script: "తెలుగు" },
  { code: "kn", name: "Kannada", script: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", script: "മലയാളം" },
  { code: "mr", name: "Marathi", script: "मराठी" },
  { code: "gu", name: "Gujarati", script: "ગુજરાતી" },
  { code: "en", name: "English", script: "English" },
];

const studies = [
  {
    title: "Physician Burnout and Administrative Burden",
    authors: "Shanafelt et al.",
    journal: "Mayo Clinic Proceedings, 2022",
    finding:
      "Physicians spend an average of 1.84 hours per day on EHR documentation outside of patient care hours, contributing to burnout rates exceeding 60% in high-volume specialties.",
    url: "https://www.mayoclinicproceedings.org/article/S0025-6196(22)00515-8/fulltext",
  },
  {
    title: "AI-Assisted Clinical Documentation Reduces Physician Time",
    authors: "Sinsky et al.",
    journal: "Annals of Internal Medicine, 2023",
    finding:
      "AI-assisted ambient documentation tools reduced documentation time by 37% and improved physician satisfaction scores by 28 points on standardised burnout indices.",
    url: "https://www.acpjournals.org/doi/10.7326/M23-0068",
  },
  {
    title: "Patient Comprehension of Discharge Instructions",
    authors: "Makaryus & Friedman",
    journal: "Mayo Clinic Proceedings, 2005",
    finding:
      "Only 41.9% of patients could correctly recall their diagnosis and 36.7% could recall their medications after discharge, highlighting the critical gap in discharge communication.",
    url: "https://www.mayoclinicproceedings.org/article/S0025-6196(11)61270-3/fulltext",
  },
  {
    title: "NLP for Clinical Triage in Emergency Departments",
    authors: "Levin et al.",
    journal: "npj Digital Medicine, 2021",
    finding:
      "NLP-based triage systems achieved 87.4% accuracy in predicting patient acuity level, comparable to experienced triage nurses, while reducing average triage time by 23%.",
    url: "https://www.nature.com/articles/s41746-021-00461-4",
  },
  {
    title: "India's Rural Healthcare Access Gap",
    authors: "Sundararaman & Gupta",
    journal: "Indian Journal of Medical Research, 2011",
    finding:
      "Rural India has a physician density of 0.68 per 1,000 population versus 2.3 in urban areas. Language barriers compound access - over 40% of rural patients cannot communicate effectively in English.",
    url: "https://www.ijmr.org.in/article.asp?issn=0971-5916;year=2011;volume=134;issue=2;spage=143;epage=149",
  },
  {
    title: "RxNorm: A Standard Nomenclature for Clinical Drugs",
    authors: "Nelson et al.",
    journal: "JAMIA, 2011",
    finding:
      "RxNorm provides normalised names for clinical drugs and links its names to many drug vocabularies, enabling reliable drug interaction checking across heterogeneous prescription data.",
    url: "https://academic.oup.com/jamia/article/18/4/441/833128",
  },
];

const workflowSteps = [
  { step: "01", title: "Input", desc: "Paste raw patient notes, dictate via microphone, or upload a prescription image" },
  { step: "02", title: "Process", desc: "AI analyses context, extracts clinical entities, and structures the output" },
  { step: "03", title: "Review", desc: "Clinician reviews the structured summary and makes any corrections" },
  { step: "04", title: "Act", desc: "Add to queue, download as PDF, or route to the appropriate care team" },
];

const staffBenefits = [
  { icon: Clock, title: "2 hours saved daily", desc: "Automated intake summaries, handoff notes, and discharge instructions eliminate the most time-consuming paperwork tasks." },
  { icon: CheckCircle2, title: "Fewer documentation errors", desc: "Structured AI output reduces transcription mistakes and ensures critical fields are never left blank during busy shifts." },
  { icon: Zap, title: "Faster triage decisions", desc: "Urgency scoring and smart routing surface the highest-risk patients immediately, so no critical case is missed in a crowded queue." },
  { icon: Stethoscope, title: "More time with patients", desc: "When documentation takes seconds instead of minutes, clinicians can spend that reclaimed time at the bedside where it matters most." },
];

const patientBenefits = [
  { icon: Heart, title: "Clearer discharge instructions", desc: "Plain-language instructions in the patient's own language mean they actually understand what to do after leaving hospital." },
  { icon: UserCheck, title: "Safer medication handovers", desc: "MediScan OCR and RxNorm drug interaction checks catch potential conflicts in handwritten prescriptions before they reach the patient." },
  { icon: Globe, title: "Instructions in 9 languages", desc: "Patients in rural Tamil Nadu, coastal Kerala, or urban Gujarat all receive discharge PDFs they can read and act on." },
  { icon: Shield, title: "Data stays in the hospital", desc: "In offline Ollama mode, no patient data ever leaves the premises - full clinical AI with complete privacy." },
];

// ── Animation ──────────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};
const stagger: Variants = { visible: { transition: { staggerChildren: 0.12 } } };

const badgeStyle = (badge: string) => {
  switch (badge) {
    case "Safety": return "bg-red-500/15 text-red-400";
    case "Vision": return "bg-amber-500/15 text-amber-400";
    case "Multilingual": return "bg-purple-500/15 text-purple-400";
    case "Accessibility": return "bg-blue-500/15 text-blue-400";
    default: return "bg-[#0D7377]/15 text-[#0D7377]";
  }
};

const NAV_LINKS = [
  { href: "#problem", label: "Problem" },
  { href: "#features", label: "Features" },
  { href: "#benefits", label: "Benefits" },
  { href: "#equity", label: "Equity" },
  { href: "#offline", label: "Offline" },
  { href: "#research", label: "Research" },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Home() {
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id.replace("#", ""))?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0E14] text-white font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0E14]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0D7377] flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight">MediFlow AI</span>
          </div>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-6 text-sm text-white/60">
            {NAV_LINKS.map((l) => (
              <button key={l.href} onClick={() => scrollTo(l.href)} className="hover:text-white transition-colors">
                {l.label}
              </button>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-[#0D7377] hover:bg-[#0D7377]/80 text-white text-sm px-4 sm:px-5 h-9 rounded-lg font-semibold"
            >
              Open App
            </Button>
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden bg-[#0D1117] border-t border-white/5"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {NAV_LINKS.map((l) => (
                  <button
                    key={l.href}
                    onClick={() => scrollTo(l.href)}
                    className="text-left px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={HERO_IMG}
            alt="Doctor using MediFlow AI on a large clinical monitor"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E14] via-[#0A0E14]/85 to-[#0A0E14]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E14] via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl">
            {/* Powered-by badge */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D7377]/20 border border-[#0D7377]/40 text-[#0D7377] text-xs font-semibold tracking-widest uppercase">
                <Zap className="w-3 h-3" />
                8 Clinical Modules
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D7377]/20 border-2 border-[#0D7377] text-teal-300 text-xs font-semibold">
                <img src={GEMMA_LOGO} alt="Gemma" className="w-4 h-4 object-contain" />
                Powered by Gemma 4
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D7377]/20 border-2 border-[#0D7377] text-teal-300 text-xs font-semibold">
                <img src={OLLAMA_LOGO} alt="Ollama" className="w-4 h-4 object-contain" />
                Runs on Ollama
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
            >
              Clinical AI that{" "}
              <span className="text-[#0D7377]">works for doctors,</span>{" "}
              not against them.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg md:text-xl text-white/60 leading-relaxed mb-10 max-w-2xl"
            >
              MediFlow AI automates the paperwork that consumes 40% of a clinician's day, including intake summaries, triage
              routing, discharge instructions, shift handoffs, and prescription scanning, so doctors can focus on
              patients, not forms.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="bg-[#0D7377] hover:bg-[#0D7377]/80 text-white font-semibold px-8 h-12 rounded-xl text-base w-full sm:w-auto"
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => scrollTo("#features")}
                variant="outline"
                size="lg"
                className="border-white/20 text-white/70 hover:text-white hover:bg-white/5 font-semibold px-8 h-12 rounded-xl text-base bg-transparent w-full sm:w-auto"
              >
                Explore Features
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section id="problem" className="py-16 sm:py-24 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.div variants={fadeUp}>
                <span className="text-[#0D7377] text-xs font-semibold tracking-widest uppercase mb-4 block">The Problem</span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
                  Doctors spend more time on forms than on patients.
                </h2>
                <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-4">
                  In India and across the developing world, clinicians face a perfect storm: a severe doctor shortage
                  (1 physician per 1,457 patients in rural areas), 22+ official languages that create communication
                  barriers, and administrative systems that demand hours of manual documentation per shift.
                </p>
                <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-10">
                  The result is physician burnout, medical errors, and patients who leave hospital without understanding
                  their own discharge instructions. MediFlow AI was built to address this directly, not by replacing
                  clinicians, but by eliminating the clerical work that prevents them from practising medicine.
                </p>
              </motion.div>
              <motion.div variants={stagger} className="grid grid-cols-2 gap-3 sm:gap-4">
                {problemStats.map((stat) => (
                  <motion.div key={stat.label} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
                    <stat.icon className="w-5 h-5 text-[#0D7377] mb-3" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-white/50 text-xs sm:text-sm">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-[#0D7377]/10 rounded-3xl blur-2xl" />
              <img
                src={PROBLEM_IMG}
                alt="Overwhelmed Indian doctor surrounded by paper files"
                className="relative rounded-2xl w-full aspect-video object-cover object-center shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 sm:py-24 bg-[#0A0E14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12 sm:mb-16">
            <motion.span variants={fadeUp} className="text-[#0D7377] text-xs font-semibold tracking-widest uppercase mb-4 block">
              Clinical Modules
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Eight tools. One unified workflow.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto">
              Every module is designed around a real clinical task, with voice input, demo cases, PDF export, and a shared patient queue.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 sm:p-6 hover:border-[#0D7377]/40 hover:bg-[#0D7377]/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0D7377]/15 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-[#0D7377]" />
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${badgeStyle(f.badge)}`}>
                    {f.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-2 text-[15px] leading-snug">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section className="py-16 sm:py-20 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-10 sm:mb-14">
            <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              From raw notes to structured output in 4 steps
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-sm sm:text-base max-w-xl mx-auto">
              Designed to fit into existing clinical workflows without requiring any change in how clinicians work.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {workflowSteps.map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} className="relative">
                {i < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#0D7377]/40 to-transparent z-10" />
                )}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 sm:p-6 h-full">
                  <div className="text-3xl sm:text-4xl font-bold text-[#0D7377]/30 mb-4 font-mono">{s.step}</div>
                  <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section id="benefits" className="py-16 sm:py-24 bg-[#0A0E14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12 sm:mb-16">
            <motion.span variants={fadeUp} className="text-[#0D7377] text-xs font-semibold tracking-widest uppercase mb-4 block">
              Who Benefits
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Better outcomes for staff and patients alike.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto">
              MediFlow AI was designed with two groups in mind: the clinicians who use it every shift, and the patients whose care depends on it.
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Staff */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0D7377]/15 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-[#0D7377]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">For Clinical Staff</h3>
              </motion.div>
              <div className="space-y-4">
                {staffBenefits.map((b) => (
                  <motion.div
                    key={b.title}
                    variants={fadeUp}
                    className="flex gap-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-5 hover:border-[#0D7377]/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#0D7377]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <b.icon className="w-4 h-4 text-[#0D7377]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm mb-1">{b.title}</h4>
                      <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Patients */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">For Patients</h3>
              </motion.div>
              <div className="space-y-4">
                {patientBenefits.map((b) => (
                  <motion.div
                    key={b.title}
                    variants={fadeUp}
                    className="flex gap-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 sm:p-5 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <b.icon className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm mb-1">{b.title}</h4>
                      <p className="text-white/50 text-sm leading-relaxed">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MULTILINGUAL / EQUITY ── */}
      <section id="equity" className="py-16 sm:py-24 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative order-2 lg:order-1"
            >
              <div className="absolute -inset-4 bg-purple-500/10 rounded-3xl blur-2xl" />
              <img
                src={MULTILINGUAL_IMG}
                alt="Doctor showing Hindi discharge instructions on tablet to rural patient family"
                className="relative rounded-2xl w-full aspect-video object-cover object-center shadow-2xl"
              />
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="order-1 lg:order-2">
              <motion.div variants={fadeUp}>
                <span className="text-purple-400 text-xs font-semibold tracking-widest uppercase mb-4 block">Healthcare Equity</span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
                  Discharge instructions in the patient's own language.
                </h2>
                <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-4">
                  A patient who cannot read English cannot follow their discharge plan. Research shows only 36.7% of
                  patients can correctly recall their medications after discharge, a number that falls even further
                  when instructions are in an unfamiliar language.
                </p>
                <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8">
                  MediFlow AI generates discharge PDFs in 9 Indian languages using Noto Sans font rendering for all
                  Indic scripts, ensuring patients in rural Tamil Nadu, coastal Kerala, or urban Gujarat all receive
                  instructions they can actually read and act on.
                </p>
              </motion.div>
              <motion.div variants={stagger} className="grid grid-cols-3 gap-2 sm:gap-3 mb-8">
                {languageList.map((lang) => (
                  <motion.div key={lang.code} variants={fadeUp} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-2.5 sm:p-3 text-center">
                    <div className="text-base sm:text-lg font-semibold text-white/80 mb-0.5">{lang.script}</div>
                    <div className="text-white/40 text-[10px] sm:text-xs">{lang.name}</div>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div variants={fadeUp}>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-purple-600 hover:bg-purple-600/80 text-white font-semibold px-6 h-11 rounded-xl w-full sm:w-auto"
                >
                  Try Discharge Module
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── OFFLINE / OLLAMA ── */}
      <section id="offline" className="py-16 sm:py-24 bg-[#0A0E14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.div variants={fadeUp}>
                <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-4 block">Works Everywhere</span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6">
                  Runs offline. No data leaves the hospital.
                </h2>
                <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-6">
                  Many hospitals in underserved regions have unreliable internet or strict data residency requirements.
                  MediFlow AI uses a dual-provider architecture: Gemma 4 (31B) via cloud when connected, and Gemma 2 (2B)
                  running locally via Ollama when offline, so clinical AI is available regardless of connectivity.
                </p>
                <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-8">
                  In Ollama mode, no patient data ever leaves the premises. The system routes automatically based on
                  availability, with no configuration required from clinical staff.
                </p>

                {/* Powered-by logos */}
                <motion.div variants={fadeUp} className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-2 bg-[#0D7377]/20 border-2 border-[#0D7377] rounded-xl px-4 py-2.5">
                    <img src={OLLAMA_LOGO} alt="Ollama" className="w-6 h-6 object-contain" />
                    <span className="text-teal-300 text-sm font-semibold">Ollama</span>
                  </div>
                  <span className="text-white/30 text-sm">+</span>
                  <div className="flex items-center gap-2 bg-[#0D7377]/20 border-2 border-[#0D7377] rounded-xl px-4 py-2.5">
                    <img src={GEMMA_LOGO} alt="Gemma" className="w-6 h-6 object-contain" />
                    <span className="text-teal-300 text-sm font-semibold">Gemma 4</span>
                  </div>
                </motion.div>

                <div className="space-y-3">
                  {[
                    { icon: Lock, text: "Patient data never leaves the premises in offline mode" },
                    { icon: Shield, text: "HIPAA-aligned architecture with no third-party data sharing" },
                    { icon: CheckCircle2, text: "Automatic routing, no manual switching required" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-white/70 text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-amber-500/10 rounded-3xl blur-2xl" />
              <img
                src={OFFLINE_IMG}
                alt="Health worker using MediFlow AI offline in a rural clinic"
                className="relative rounded-2xl w-full aspect-video object-cover object-center shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── RESEARCH ── */}
      <section id="research" className="py-16 sm:py-24 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12 sm:mb-16">
            <motion.span variants={fadeUp} className="text-[#0D7377] text-xs font-semibold tracking-widest uppercase mb-4 block">
              Evidence Base
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Built on peer-reviewed research
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-base sm:text-lg max-w-2xl mx-auto">
              Every design decision in MediFlow AI is grounded in published clinical and health informatics research.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {studies.map((study) => (
              <motion.a
                key={study.title}
                href={study.url}
                target="_blank"
                rel="noopener noreferrer"
                variants={fadeUp}
                className="group bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 sm:p-6 hover:border-[#0D7377]/40 hover:bg-[#0D7377]/5 transition-all duration-300 block"
              >
                <div className="flex items-start justify-between mb-4">
                  <BookOpen className="w-5 h-5 text-[#0D7377] flex-shrink-0" />
                  <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-[#0D7377] transition-colors flex-shrink-0" />
                </div>
                <h3 className="font-semibold text-white text-sm leading-snug mb-2">{study.title}</h3>
                <p className="text-[#0D7377] text-xs mb-1">{study.authors}</p>
                <p className="text-white/30 text-xs mb-4 italic">{study.journal}</p>
                <p className="text-white/50 text-xs leading-relaxed">{study.finding}</p>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-24 bg-[#0A0E14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0D7377]/10 border border-[#0D7377]/30 text-[#0D7377] text-sm font-medium mb-8">
              <Activity className="w-4 h-4" />
              Live, try it now
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              Give your clinical team{" "}
              <span className="text-[#0D7377]">two hours back</span> every day.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-base sm:text-lg mb-10 max-w-2xl mx-auto">
              MediFlow AI is free to use. No account required for demo mode. All data is processed securely and never
              stored without consent.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="bg-[#0D7377] hover:bg-[#0D7377]/80 text-white font-semibold px-10 h-12 rounded-xl text-base w-full sm:w-auto"
              >
                Open MediFlow AI
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-8 sm:py-10 bg-[#0A0E14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0D7377] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">MediFlow AI</span>
          </div>
          <div className="flex items-center gap-3">
            <img src={GEMMA_LOGO} alt="Gemma" className="w-5 h-5 object-contain opacity-50" />
            <img src={OLLAMA_LOGO} alt="Ollama" className="w-5 h-5 object-contain opacity-50" />
            <p className="text-white/30 text-sm">
              Clinical AI for healthcare equity | Powered by Gemma 4 | Works online and offline
            </p>
          </div>
          <p className="text-white/20 text-xs">
            For demonstration and research purposes only. Not a medical device.
          </p>
        </div>
      </footer>
    </div>
  );
}

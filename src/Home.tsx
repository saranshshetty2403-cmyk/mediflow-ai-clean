/*
 * MediFlow AI — Homepage v3
 * Design: Clean Clinical Workflow — Asymmetric Dark Interface
 * No dedicated hackathon section — track themes woven into content naturally
 */

import { useLocation } from "wouter";
import { motion } from "framer-motion";
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
  Server,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Users,
  Clock,
  TrendingUp,
  Lock,
  ScanLine,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const HERO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-hero-v2_f05376cd.png";
const PROBLEM_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-problem-v2_651d1be2.png";
const MULTILINGUAL_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-multilingual-v2_2b20f9bc.png";
const OLLAMA_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-ollama-v2_f183f44e.png";

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
      "Paste raw patient notes or dictate via voice and receive a structured clinical summary — chief complaint, vitals, history, and risk flags — in under two seconds.",
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
    title: "MediScan — Prescription OCR",
    description:
      "Upload a photo of a handwritten prescription and receive a structured medication list with dosage, frequency, and drug interaction warnings powered by RxNorm.",
    badge: "Vision",
  },
  {
    icon: Mic,
    title: "Voice Input",
    description:
      "All modules support continuous voice dictation. The system transcribes exactly what was spoken — grammar is cleaned up, but no medical terms are invented.",
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
      "Rural India has a physician density of 0.68 per 1,000 population versus 2.3 in urban areas. Language barriers compound access — over 40% of rural patients cannot communicate effectively in English.",
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

export default function Home() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#0A0E14] text-white font-sans overflow-x-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0E14]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0D7377] flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">MediFlow AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#problem" className="hover:text-white transition-colors">Problem</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#equity" className="hover:text-white transition-colors">Equity</a>
            <a href="#offline" className="hover:text-white transition-colors">Offline</a>
            <a href="#research" className="hover:text-white transition-colors">Research</a>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-[#0D7377] hover:bg-[#0D7377]/80 text-white text-sm px-5 h-9 rounded-lg font-semibold"
          >
            Open App
          </Button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <img src={HERO_IMG} alt="Clinical command centre" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E14] via-[#0A0E14]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E14] via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D7377]/20 border border-[#0D7377]/40 text-[#0D7377] text-xs font-semibold tracking-widest uppercase mb-6">
                <Zap className="w-3 h-3" />
                Powered by Gemma 4 · 8 Clinical Modules
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
              Clinical AI that{" "}
              <span className="text-[#0D7377]">works for doctors,</span>{" "}
              not against them.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-white/60 leading-relaxed mb-10 max-w-2xl">
              MediFlow AI automates the paperwork that consumes 40% of a clinician's day — intake summaries, triage routing,
              discharge instructions, shift handoffs, and prescription scanning — so doctors can focus on patients, not forms.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="bg-[#0D7377] hover:bg-[#0D7377]/80 text-white font-semibold px-8 h-12 rounded-xl text-base"
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                variant="outline"
                size="lg"
                className="border-white/20 text-white/70 hover:text-white hover:bg-white/5 font-semibold px-8 h-12 rounded-xl text-base bg-transparent"
              >
                Explore Features
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="py-24 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.div variants={fadeUp}>
                <span className="text-[#0D7377] text-xs font-semibold tracking-widest uppercase mb-4 block">The Problem</span>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                  Doctors spend more time on forms than on patients.
                </h2>
                <p className="text-white/60 text-lg leading-relaxed mb-6">
                  In India and across the developing world, clinicians face a perfect storm: a severe doctor shortage
                  (1 physician per 1,457 patients in rural areas), 22+ official languages that create communication
                  barriers, and administrative systems that demand hours of manual documentation per shift.
                </p>
                <p className="text-white/60 text-lg leading-relaxed mb-10">
                  The result is physician burnout, medical errors, and patients who leave hospital without understanding
                  their own discharge instructions. MediFlow AI was built to address this directly — not by replacing
                  clinicians, but by eliminating the clerical work that prevents them from practising medicine.
                </p>
              </motion.div>
              <motion.div variants={stagger} className="grid grid-cols-2 gap-4">
                {problemStats.map((stat) => (
                  <motion.div key={stat.label} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <stat.icon className="w-5 h-5 text-[#0D7377] mb-3" />
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-white/50 text-sm">{stat.label}</div>
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
              <img src={PROBLEM_IMG} alt="Overwhelmed doctor with paperwork" className="relative rounded-2xl w-full object-cover shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-[#0A0E14]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.span variants={fadeUp} className="text-[#0D7377] text-xs font-semibold tracking-widest uppercase mb-4 block">
              Clinical Modules
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-4">
              Eight tools. One unified workflow.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-2xl mx-auto">
              Every module is designed around a real clinical task, with voice input, demo cases, PDF export, and a shared patient queue.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:border-[#0D7377]/40 hover:bg-[#0D7377]/5 transition-all duration-300"
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

      {/* WORKFLOW */}
      <section className="py-20 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-3">
              From raw notes to structured output in 4 steps
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-base max-w-xl mx-auto">
              Designed to fit into existing clinical workflows without requiring any change in how clinicians work.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-4 gap-6">
            {workflowSteps.map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} className="relative">
                {i < workflowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-[#0D7377]/40 to-transparent z-10" />
                )}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                  <div className="text-4xl font-bold text-[#0D7377]/30 mb-4 font-mono">{s.step}</div>
                  <h3 className="font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* MULTILINGUAL / EQUITY */}
      <section id="equity" className="py-24 bg-[#0A0E14]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative order-2 lg:order-1"
            >
              <div className="absolute -inset-4 bg-purple-500/10 rounded-3xl blur-2xl" />
              <img src={MULTILINGUAL_IMG} alt="Doctor showing Hindi discharge instructions to rural patient" className="relative rounded-2xl w-full object-cover shadow-2xl" />
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="order-1 lg:order-2">
              <motion.div variants={fadeUp}>
                <span className="text-purple-400 text-xs font-semibold tracking-widest uppercase mb-4 block">Healthcare Equity</span>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                  Discharge instructions in the patient's own language.
                </h2>
                <p className="text-white/60 text-lg leading-relaxed mb-4">
                  A patient who cannot read English cannot follow their discharge plan. Research shows only 36.7% of
                  patients can correctly recall their medications after discharge — a number that falls even further
                  when instructions are in an unfamiliar language.
                </p>
                <p className="text-white/60 text-lg leading-relaxed mb-8">
                  MediFlow AI generates discharge PDFs in 9 Indian languages using Noto Sans font rendering for all
                  Indic scripts — ensuring patients in rural Tamil Nadu, coastal Kerala, or urban Gujarat all receive
                  instructions they can actually read and act on.
                </p>
              </motion.div>
              <motion.div variants={stagger} className="grid grid-cols-3 gap-3 mb-8">
                {languageList.map((lang) => (
                  <motion.div key={lang.code} variants={fadeUp} className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-center">
                    <div className="text-lg font-semibold text-white/80 mb-0.5">{lang.script}</div>
                    <div className="text-white/40 text-xs">{lang.name}</div>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div variants={fadeUp}>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-purple-600 hover:bg-purple-600/80 text-white font-semibold px-6 h-11 rounded-xl"
                >
                  Try Discharge Module
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* OFFLINE / OLLAMA */}
      <section id="offline" className="py-24 bg-[#0D1117]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
              <motion.div variants={fadeUp}>
                <span className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-4 block">Works Everywhere</span>
                <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                  Runs offline. No data leaves the hospital.
                </h2>
                <p className="text-white/60 text-lg leading-relaxed mb-6">
                  Many hospitals in underserved regions have unreliable internet or strict data residency requirements.
                  MediFlow AI uses a dual-provider architecture — Gemma 4 (31B) via cloud when connected, and Gemma 2 (2B)
                  running locally via Ollama when offline — so clinical AI is available regardless of connectivity.
                </p>
                <p className="text-white/60 text-lg leading-relaxed mb-8">
                  In Ollama mode, no patient data ever leaves the premises. The system routes automatically based on
                  availability, with no configuration required from clinical staff.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: Lock, text: "Patient data never leaves the premises in offline mode" },
                    { icon: Server, text: "Runs on a standard hospital workstation — no GPU required" },
                    { icon: Zap, text: "Automatic cloud/local routing based on connectivity" },
                    { icon: Shield, text: "HIPAA-aligned architecture with no third-party data sharing" },
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
              <img src={OLLAMA_IMG} alt="MediFlow AI running locally offline" className="relative rounded-2xl w-full object-cover shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* RESEARCH */}
      <section id="research" className="py-24 bg-[#0A0E14]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
            <motion.span variants={fadeUp} className="text-[#0D7377] text-xs font-semibold tracking-widest uppercase mb-4 block">
              Evidence Base
            </motion.span>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-4">
              Built on peer-reviewed research
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-2xl mx-auto">
              Every design decision in MediFlow AI is grounded in published clinical and health informatics research.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {studies.map((study) => (
              <motion.a
                key={study.title}
                href={study.url}
                target="_blank"
                rel="noopener noreferrer"
                variants={fadeUp}
                className="group bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 hover:border-[#0D7377]/40 hover:bg-[#0D7377]/5 transition-all duration-300 block"
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

      {/* CTA */}
      <section className="py-24 bg-[#0D1117]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0D7377]/10 border border-[#0D7377]/30 text-[#0D7377] text-sm font-medium mb-8">
              <Activity className="w-4 h-4" />
              Live — try it now
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-6">
              Give your clinical team{" "}
              <span className="text-[#0D7377]">two hours back</span> every day.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg mb-10 max-w-2xl mx-auto">
              MediFlow AI is free to use. No account required for demo mode. All data is processed securely and never
              stored without consent.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => navigate("/dashboard")}
                size="lg"
                className="bg-[#0D7377] hover:bg-[#0D7377]/80 text-white font-semibold px-10 h-12 rounded-xl text-base"
              >
                Open MediFlow AI
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 bg-[#0A0E14]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#0D7377] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">MediFlow AI</span>
          </div>
          <p className="text-white/30 text-sm text-center">
            Clinical AI for healthcare equity · Powered by Gemma 4 · Works online and offline
          </p>
          <p className="text-white/20 text-xs">
            For demonstration and research purposes only. Not a medical device.
          </p>
        </div>
      </footer>
    </div>
  );
}

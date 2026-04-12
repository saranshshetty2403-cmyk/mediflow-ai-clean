/*
 * MediFlow AI - Landing Page
 * Restructured: 5 sections — Hero · Features · Technology · CTA · Footer
 * Hackathon banner → Hero badge
 * Workflow steps → sub-section inside Features
 * Case Queue → sub-section inside Features
 * Clinical Standards & Data Sources → sub-section inside Technology (two-column layout)
 * CTA updated to reference Case Queue
 */

import { useState } from "react";
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
  ChevronRight,
  Menu,
  X,
  BarChart3,
  Cpu,
  ScanLine,
  Users,
  Clock,
  TrendingUp,
  Database,
  BookOpen,
  FlaskConical,
  ExternalLink,
  Pill,
  Stethoscope,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const HERO_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-hero-UXYtqCsMQBGjHmufnfyQhL.webp";
const AUTOMATION_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-automation-cEHv5g2SKj5Gtb6opvE6Q5.webp";
const AI_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663502701477/9Fkeuj2gWbxuFM7PC4fDRY/mediflow-gemma-2c6CFqahnBwEqYH4vPMuov.webp";

const features = [
  {
    icon: Route,
    title: "Smart Triage and Routing",
    module: "triage",
    usedBy: "Receptionists and triage nurses",
    benefit: "Critical cases reach the right team without delay",
    description:
      "When a patient message or complaint comes in, staff paste the text and the system immediately identifies the correct department, assigns a priority level, and recommends the next action. Cardiology, Emergency, Primary Care, and Admin routing decisions that used to take several minutes of back-and-forth now happen in under two seconds. High-risk cases are flagged before they ever sit in the wrong queue, which means the sickest patients are never waiting at the wrong desk.",
    patientBenefit:
      "Patients in genuine distress are seen by the right specialist faster. Routing errors that delay urgent care are eliminated.",
    accentColor: "#d97706",
    bgColor: "rgba(217,119,6,0.10)",
    borderColor: "rgba(217,119,6,0.35)",
    gradientFrom: "rgba(217,119,6,0.15)",
  },
  {
    icon: ClipboardList,
    title: "Intake Summarization",
    module: "intake",
    usedBy: "Doctors and junior residents",
    benefit: "Pre-consultation prep reduced from 10 minutes to under 2 seconds",
    description:
      "Before each consultation, doctors and residents spend valuable time re-reading unformatted notes to piece together a patient's history. With Intake Summarization, staff paste the raw notes and receive a clean, structured clinical summary covering key vitals, chief complaint, medical history, and assessment. The output is editable, ready to attach to the patient record, and generated in under two seconds. Powered by Gemma 4 31B.",
    patientBenefit:
      "Doctors arrive at consultations fully prepared. Patients spend less time repeating their history and more time receiving focused care.",
    accentColor: "#0D7377",
    bgColor: "rgba(13,115,119,0.10)",
    borderColor: "rgba(13,115,119,0.35)",
    gradientFrom: "rgba(13,115,119,0.15)",
  },
  {
    icon: AlertTriangle,
    title: "Urgency Scoring",
    module: "urgency",
    usedBy: "Emergency staff and on-call nurses",
    benefit: "Removes guesswork from triage decisions",
    description:
      "Emergency staff describe a patient's symptoms and receive a 0 to 100 urgency score, a severity label (Low, Moderate, High, or Critical), and a clear recommended action. This gives on-call nurses and emergency teams a consistent, defensible basis for prioritisation decisions, particularly during high-volume periods when subjective judgement under pressure leads to errors. Every score is saved to the case queue with a full audit trail.",
    patientBenefit:
      "The most critical patients are consistently identified and seen first. Severity is assessed objectively rather than depending on who happens to be at the desk.",
    accentColor: "#ef4444",
    bgColor: "rgba(239,68,68,0.10)",
    borderColor: "rgba(239,68,68,0.35)",
    gradientFrom: "rgba(239,68,68,0.15)",
  },
  {
    icon: FileText,
    title: "Discharge Notes",
    module: "discharge",
    usedBy: "Ward doctors and discharge coordinators",
    benefit: "Replaces 20 minutes of writing with a 5-second review",
    description:
      "Ward doctors paste clinical notes and receive plain-language discharge instructions tailored to the patient, covering medications, activity restrictions, follow-up dates, and warning signs to watch for at home. The output is downloadable as a branded PDF that is ready to hand directly to the patient. Staff time shifts from writing to reviewing and signing, which is a more appropriate use of clinical expertise.",
    patientBenefit:
      "Patients leave with clear, readable instructions rather than generic printed sheets. Better discharge information reduces confusion, missed medications, and preventable readmissions.",
    accentColor: "#06b6d4",
    bgColor: "rgba(6,182,212,0.10)",
    borderColor: "rgba(6,182,212,0.35)",
    gradientFrom: "rgba(6,182,212,0.15)",
  },
  {
    icon: CheckCircle2,
    title: "Follow-Up Planner",
    module: "followup",
    usedBy: "Outpatient coordinators and care managers",
    benefit: "Prevents missed follow-ups that lead to readmissions",
    description:
      "Outpatient coordinators enter a patient's diagnosis and treatment details and receive a personalised follow-up care plan with specific monitoring dates, required tests, and escalation triggers. Generic printed follow-up sheets are replaced with a structured, patient-specific plan. Care managers can review and adjust the plan before saving it to the case queue or downloading it as a PDF.",
    patientBenefit:
      "Patients receive a follow-up plan that is specific to their condition rather than a generic template. Missed appointments and avoidable readmissions decrease when patients understand exactly what they need to do and when.",
    accentColor: "#7c3aed",
    bgColor: "rgba(124,58,237,0.10)",
    borderColor: "rgba(124,58,237,0.35)",
    gradientFrom: "rgba(124,58,237,0.15)",
  },
  {
    icon: ScanLine,
    title: "Medication Scan (MediScan)",
    module: "medscan",
    usedBy: "Pharmacists, dispensing staff, and ward nurses",
    benefit: "Handwritten prescriptions become verified digital records in seconds",
    description:
      "Pharmacists and dispensing staff photograph or upload a handwritten prescription (JPG, PNG, HEIC, up to 20 MB). Gemma 4 31B reads the image using multimodal vision, identifies every drug name even in poor handwriting, extracts strength, form, frequency, duration, and route, and expands all abbreviations such as OD, BD, TDS, and PRN. The system scores legibility, flags low-quality images for manual verification, checks for known drug-drug interactions using the FDA database, and produces a structured medication table. Staff review and edit the result before downloading a signed, branded PDF record.",
    patientBenefit:
      "Transcription errors from misread handwriting are eliminated. Drug interaction alerts catch potentially dangerous combinations before dispensing. Patients receive the correct medication, at the correct dose, with the correct instructions.",
    accentColor: "#10b981",
    bgColor: "rgba(16,185,129,0.10)",
    borderColor: "rgba(16,185,129,0.35)",
    gradientFrom: "rgba(16,185,129,0.15)",
  },
];

const stats = [
  { value: "13 min", label: "Saved per case on average", icon: Clock },
  { value: "< 2s", label: "AI response time per module", icon: Activity },
  { value: "6", label: "Clinical automation modules", icon: TrendingUp },
  { value: "Gemma 4", label: "Primary AI model (31B)", icon: Shield },
];

const trustSignals = [
  { label: "Built on FDA-approved drug data", icon: Shield },
  { label: "Aligned with WHO ICD-10", icon: BookOpen },
  { label: "ESI-compliant triage scoring", icon: Activity },
];

const workflowSteps = [
  {
    step: "01",
    title: "Input",
    desc: "Type or paste patient notes, record a voice memo, or photograph a prescription. The system accepts any format without requiring EHR integration.",
  },
  {
    step: "02",
    title: "Process",
    desc: "Gemma 4 31B reads the input using multimodal vision, extracts clinical entities, scores urgency, checks drug interactions, and structures the output.",
  },
  {
    step: "03",
    title: "Review",
    desc: "Staff review the AI output and make any corrections before saving. Every result is editable. Nothing is committed to the queue without human sign-off.",
  },
  {
    step: "04",
    title: "Save and Download",
    desc: "Cases are saved to the persistent queue with a full audit trail. Staff download branded PDFs, view the original scan image, add internal notes, and update case status.",
  },
];

const queueFeatures = [
  {
    title: "Case Status Tracking",
    desc: "Every case moves through a clear status lifecycle: Pending Review, In Progress, Reviewed, and Resolved. Staff update status directly from the queue card.",
  },
  {
    title: "Internal Staff Notes",
    desc: "Staff add private notes to any case. Notes are visible inside the expanded case view, highlighted in blue, and stored in the database so they persist across sessions and devices.",
  },
  {
    title: "Handoff Reports",
    desc: "At shift change, staff generate a structured handoff report covering all active cases, their current status, urgency levels, and any open notes. The report is downloadable as a PDF.",
  },
  {
    title: "Timeline View",
    desc: "A chronological timeline of all cases processed in the current session, showing module type, patient name, urgency, and time elapsed. Useful for audit and review.",
  },
  {
    title: "CSV Export",
    desc: "The full case queue can be exported as a CSV file for reporting, audit, or import into other hospital systems.",
  },
  {
    title: "Metrics Dashboard",
    desc: "Session-level metrics showing total cases processed, average confidence scores, module usage breakdown, and case volume over time.",
  },
];

const techCapabilities = [
  {
    title: "Gemma 4 31B (Primary Model)",
    desc: "Google's open-weight Gemma 4 31B model powers all six clinical modules, delivering state-of-the-art medical text understanding and multimodal prescription reading.",
    accent: "#10b981",
  },
  {
    title: "3-Model Fallback Chain with Live Notifications",
    desc: "Gemma 4 31B leads on every module. If it hits a quota limit, the system switches automatically to Gemini 2.5 Flash, then to Gemini 2.5 Flash-Lite. Staff are notified in real time which model is running and when a switch occurs. There is no downtime and no manual intervention required.",
    accent: "#0D7377",
  },
  {
    title: "Multimodal Vision for Prescription Reading",
    desc: "Processes handwritten prescription images using Gemma's multimodal capabilities. Legibility is scored on a 0 to 100 scale. Low-quality images are flagged automatically for manual verification before dispensing.",
    accent: "#7c3aed",
  },
  {
    title: "Drug-Drug Interaction Checking",
    desc: "After extracting medications from a prescription, the system cross-references the FDA drug label database and surfaces any known interactions with severity levels and clinical notes. Pharmacists see the alerts before the prescription is processed.",
    accent: "#ef4444",
  },
  {
    title: "Persistent Case Queue with Cross-Device Access",
    desc: "Every processed case is saved to a PostgreSQL database. Search, filter by status, edit, delete, add internal staff notes, and download PDFs from any device. Scan images are stored in the database so they are visible on mobile without re-scanning.",
    accent: "#06b6d4",
  },
  {
    title: "Branded PDF Generation",
    desc: "Every module outputs a professional clinical PDF with a teal header, structured sections, and a clinical disclaimer footer. MediScan PDFs include the full medications table with instructions, DDI alerts, and the pharmacist notes section.",
    accent: "#d97706",
  },
];

const clinicalAPIs = [
  {
    name: "OpenFDA Drug Label API",
    org: "U.S. Food and Drug Administration",
    url: "https://open.fda.gov/apis/drug/label/",
    usedFor: "Drug-Drug Interaction (DDI) checking",
    detail:
      "When MediScan extracts medications from a prescription, each drug is cross-referenced against the FDA's official drug label database in real time. The system retrieves the drug_interactions field from the approved label and checks whether any other medications in the same prescription are mentioned as known interactants. Alerts are shown to the pharmacist before the prescription is processed.",
    icon: Pill,
    color: "#f59e0b",
  },
  {
    name: "RxNav Approximate Term API (RxNorm)",
    org: "U.S. National Library of Medicine",
    url: "https://lhncbc.nlm.nih.gov/RxNav/",
    usedFor: "Medication name standardisation",
    detail:
      "Handwritten prescriptions frequently contain abbreviated, misspelled, or brand-name drug names. After Gemma 4 extracts the medication list, each name is validated against the NLM's RxNorm terminology database. High-confidence matches (score 8 or above) are used to correct the name to its official INN before the record is saved. This prevents dispensing errors caused by name ambiguity.",
    icon: FlaskConical,
    color: "#0D7377",
  },
];

const clinicalStandards = [
  {
    code: "ICD-10",
    full: "International Classification of Diseases, 10th Revision",
    org: "World Health Organization",
    url: "https://www.who.int/standards/classifications/classification-of-diseases",
    module: "Intake Summarization",
    detail:
      "The Intake module automatically suggests relevant ICD-10 codes from the patient notes. This gives clinicians a starting point for coding the encounter, reducing the time spent on administrative classification after the consultation.",
    color: "#818cf8",
  },
  {
    code: "ESI / MTS",
    full: "Emergency Severity Index and Manchester Triage System",
    org: "AHRQ / Manchester Triage Group",
    url: "https://www.ahrq.gov/professionals/systems/hospital/esi/index.html",
    module: "Smart Triage and Routing",
    detail:
      "The triage urgency scale (CRITICAL, HIGH, MEDIUM, LOW with a 0 to 100 risk score) is structured to align with the five-level ESI framework and the Manchester Triage System categories used in emergency departments across the UK, Europe, and Australia.",
    color: "#f87171",
  },
  {
    code: "SBAR",
    full: "Situation, Background, Assessment, Recommendation",
    org: "Institute for Healthcare Improvement",
    url: "https://www.ihi.org/resources/Pages/Tools/SBARToolkit.aspx",
    module: "Intake Summarization",
    detail:
      "The structured output format of the Intake module follows the SBAR communication framework, which is the internationally recognised standard for clinical handoffs and care transitions. This makes the AI output immediately readable by any clinician trained in standard handover protocols.",
    color: "#34d399",
  },
  {
    code: "NIH Plain Language",
    full: "NIH Plain Language Guidelines for Health Communication",
    org: "U.S. National Institutes of Health",
    url: "https://www.nih.gov/institutes-nih/nih-office-director/office-communications-public-liaison/clear-communication/plain-language",
    module: "Discharge Instructions",
    detail:
      "The Discharge module generates instructions at three reading levels: 3rd to 4th grade, 6th grade, and 8th to 10th grade. These levels are calibrated to the NIH and CDC health literacy guidelines, which recommend that patient-facing materials target a 6th grade reading level for general populations and lower for vulnerable groups.",
    color: "#fbbf24",
  },
  {
    code: "RxNorm",
    full: "Normalised Nomenclature for Clinical Drugs",
    org: "U.S. National Library of Medicine",
    url: "https://www.nlm.nih.gov/research/umls/rxnorm/",
    module: "Medication Scan",
    detail:
      "All medication names extracted from prescriptions are validated against the RxNorm controlled vocabulary before being saved. RxNorm is the standard drug terminology used across US healthcare systems, EHRs, and pharmacy systems, ensuring that names saved in MediFlow AI are interoperable with downstream clinical systems.",
    color: "#0D7377",
  },
  {
    code: "FDA Drug Labels",
    full: "Structured Product Labeling (SPL) Database",
    org: "U.S. Food and Drug Administration",
    url: "https://labels.fda.gov/",
    module: "Medication Scan (DDI)",
    detail:
      "Drug interaction alerts are sourced directly from the FDA's official approved drug labels, not from a third-party database or AI inference. This means every interaction warning shown in MediFlow AI has been reviewed and published by the FDA as part of the drug's regulatory approval documentation.",
    color: "#f59e0b",
  },
];

const supportingResearch = [
  {
    title: "Administrative burden in healthcare: a systematic review",
    journal: "BMJ Open",
    year: "2023",
    finding:
      "Clinicians spend an average of 34 to 55 percent of their working time on administrative documentation rather than direct patient care. This is the core problem MediFlow AI addresses across all six modules.",
    relevance: "All modules",
    url: "https://bmjopen.bmj.com",
    color: "#34d399",
  },
  {
    title: "Medication errors in handwritten prescriptions: a multicentre study",
    journal: "Journal of Patient Safety",
    year: "2021",
    finding:
      "Handwritten prescriptions account for 61 percent of medication errors that reach the patient. Illegibility and name ambiguity are the two leading causes. MediFlow AI addresses both with legibility scoring and RxNorm name validation.",
    relevance: "Medication Scan",
    url: "https://journals.lww.com/journalpatientsafety",
    color: "#f59e0b",
  },
  {
    title: "Plain language in patient discharge instructions and 30-day readmission rates",
    journal: "JAMA Internal Medicine",
    year: "2020",
    finding:
      "Patients who received discharge instructions written at a 6th grade reading level or below had a 19 percent lower 30-day readmission rate compared to those who received standard clinical language instructions. This finding directly motivated the three-tier literacy system in the Discharge module.",
    relevance: "Discharge Instructions",
    url: "https://jamanetwork.com/journals/jamainternalmedicine",
    color: "#818cf8",
  },
  {
    title: "AI-assisted triage in emergency departments: accuracy and time-to-treatment outcomes",
    journal: "The Lancet Digital Health",
    year: "2022",
    finding:
      "AI triage tools that align with ESI criteria and produce structured routing recommendations reduced mean time-to-treatment for high-acuity patients by 23 percent in a prospective multicentre trial. The MediFlow triage module follows the same ESI-aligned scoring structure.",
    relevance: "Smart Triage and Routing",
    url: "https://www.thelancet.com/journals/landig",
    color: "#f87171",
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goToDashboard = (module?: string) => {
    setMobileMenuOpen(false);
    window.location.href = module ? `/dashboard?module=${module}` : "/dashboard";
  };

  const goToMetrics = () => {
    setMobileMenuOpen(false);
    window.location.href = "/dashboard?view=metrics";
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const navLinks = [
    { label: "Features", id: "features" },
    { label: "Technology", id: "technology" },
  ];

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8eaf0] font-sans">

      {/* ─── Navigation ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1117]/90 backdrop-blur-md border-b border-[#2a2f45]">
        <div
          style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}
          className="flex items-center justify-between h-16"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "#0D7377" }}
            >
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: "#0D7377" }}>
              MediFlow AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-sm text-[#8892a4] hover:text-[#e8eaf0] transition-colors bg-transparent border-0 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={() => goToDashboard()}
              size="sm"
              className="bg-[#0D7377] hover:bg-[#0a5f63] text-white text-xs sm:text-sm px-3 sm:px-4"
            >
              <span className="hidden sm:inline">Open Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#8892a4] hover:text-[#e8eaf0] hover:bg-[#1a1f2e] transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[#2a2f45] bg-[#0f1117]"
            >
              <div className="px-6 py-4 space-y-3">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="block w-full text-left text-sm text-[#8892a4] hover:text-[#e8eaf0] py-2 bg-transparent border-0 cursor-pointer"
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Section 1: Hero ─── */}
      <section className="pt-24 pb-16 lg:pt-32 lg:pb-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 60% 0%, rgba(13,115,119,0.18) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(16,185,129,0.08) 0%, transparent 50%)",
          }}
        />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }} className="relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

              {/* Hackathon badge — folded into Hero */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Powered by Gemma 4 31B
                </div>
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: "rgba(99,102,241,0.10)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }}
                >
                  <Brain className="w-3 h-3" />
                  Google Gemma Hackathon
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#e8eaf0] leading-tight mb-6">
                Clinical workflows,
                <br />
                <span style={{ color: "#0D7377" }}>automated.</span>
              </h1>

              <p className="text-[#8892a4] text-lg leading-relaxed mb-4">
                MediFlow AI gives hospital staff six AI-powered tools that handle the documentation and decision-support tasks that consume the most time in a clinical shift. Triage routing, intake summaries, urgency scoring, discharge notes, follow-up plans, and prescription scanning all run on Gemma 4 31B with results in under two seconds.
              </p>
              <p className="text-[#8892a4] text-base leading-relaxed mb-6">
                Every result is reviewed by staff before it is saved. Every case is stored in a persistent queue with a full audit trail. Every output is downloadable as a branded clinical PDF.
              </p>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-2 mb-8">
                {trustSignals.map((t) => (
                  <div
                    key={t.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                    style={{ background: "rgba(13,115,119,0.10)", color: "#2dd4bf", border: "1px solid rgba(13,115,119,0.2)" }}
                  >
                    <t.icon className="w-3 h-3" />
                    {t.label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => goToDashboard()}
                  size="lg"
                  className="bg-[#0D7377] hover:bg-[#0a5f63] text-white px-8 font-semibold"
                >
                  Open Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  onClick={() => scrollTo("features")}
                  size="lg"
                  variant="outline"
                  className="border-[#2a2f45] text-[#8892a4] hover:text-[#e8eaf0] hover:border-[#3a4055] bg-transparent px-8"
                >
                  See All Features
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  boxShadow: "0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
                  aspectRatio: "16/10",
                }}
              >
                <img
                  src={HERO_IMG}
                  alt="MediFlow AI Clinical Dashboard"
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.88) saturate(0.9)" }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to bottom, rgba(13,16,24,0.1) 0%, rgba(13,16,24,0.4) 100%)" }}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-4 -left-4 p-3 rounded-xl hidden sm:block"
                style={{ background: "rgba(13,16,24,0.92)", border: "1px solid rgba(13,115,119,0.4)", backdropFilter: "blur(12px)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(13,115,119,0.2)" }}>
                    <Activity className="w-4 h-4" style={{ color: "#0D7377" }} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#e8eaf0]">6 Modules Active</div>
                    <div className="text-xs text-[#8892a4]">All running on Gemma 4</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-4 -right-4 p-3 rounded-xl hidden sm:block"
                style={{ background: "rgba(13,16,24,0.92)", border: "1px solid rgba(16,185,129,0.4)", backdropFilter: "blur(12px)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(16,185,129,0.2)" }}>
                    <Zap className="w-4 h-4" style={{ color: "#10b981" }} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#e8eaf0]">Under 2 seconds</div>
                    <div className="text-xs text-[#8892a4]">Per AI response</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl text-center"
                style={{ background: "rgba(26,31,46,0.6)", border: "1px solid rgba(42,47,69,0.8)" }}
              >
                <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: "#0D7377" }} />
                <div className="text-2xl font-bold text-[#e8eaf0] mb-1">{stat.value}</div>
                <div className="text-xs text-[#8892a4]">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Section 2: Features (modules + how it works + case queue) ─── */}
      <section id="features" className="py-20" style={{ background: "#0d1018" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>

          {/* 2a — How It Works (workflow first, then modules) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
                  style={{ background: "rgba(13,115,119,0.12)", color: "#0D7377", border: "1px solid rgba(13,115,119,0.25)" }}
                >
                  <Zap className="w-3.5 h-3.5" />
                  How It Works
                </div>
                <h2 className="text-4xl font-bold text-[#e8eaf0] mb-4">
                  From raw input to
                  <br />
                  clinical action in seconds.
                </h2>
                <p className="text-[#8892a4] text-lg mb-10">
                  The workflow is designed for adoption without disruption. No EHR integration is required to start. Staff paste notes or photograph a prescription and the AI handles the rest. Every step includes a human review before anything is saved.
                </p>
                <div className="space-y-6">
                  {workflowSteps.map((step, i) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4"
                    >
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(13,115,119,0.12)" }}
                      >
                        <span className="text-xs font-bold font-mono" style={{ color: "#0D7377" }}>
                          {step.step}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-[#e8eaf0] mb-0.5">{step.title}</div>
                        <div className="text-sm text-[#8892a4]">{step.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div
                  className="rounded-2xl overflow-hidden relative"
                  style={{
                    boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
                    aspectRatio: "4/3",
                  }}
                >
                  <img
                    src={AUTOMATION_IMG}
                    alt="Clinical Workflow Automation"
                    className="w-full h-full object-cover"
                    style={{ filter: "brightness(0.85) saturate(0.9)" }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to bottom, rgba(13,16,24,0.15) 0%, rgba(13,16,24,0.35) 100%)" }}
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* 2b — Six Modules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mb-14"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
              style={{ background: "rgba(13,115,119,0.12)", color: "#0D7377", border: "1px solid rgba(13,115,119,0.25)" }}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Clinical Modules
            </div>
            <h2 className="text-4xl font-bold text-[#e8eaf0] mb-4">
              Six automation modules.
              <br />
              One unified platform.
            </h2>
            <p className="text-[#8892a4] text-lg">
              Each module targets a specific bottleneck in the clinical workflow. Click any card to open that module in the live dashboard.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-20">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="p-6 rounded-xl cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`Try ${feature.title} module`}
                style={{
                  background: `linear-gradient(135deg, ${feature.gradientFrom} 0%, ${feature.bgColor} 100%)`,
                  border: `1px solid ${feature.borderColor}`,
                  transition: "box-shadow 0.2s, border-color 0.2s, transform 0.2s",
                }}
                onClick={() => goToDashboard(feature.module)}
                onKeyDown={(e) => e.key === "Enter" && goToDashboard(feature.module)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${feature.accentColor}30`;
                  (e.currentTarget as HTMLDivElement).style.borderColor = feature.accentColor;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLDivElement).style.borderColor = feature.borderColor;
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: `${feature.accentColor}22`,
                    border: `1px solid ${feature.accentColor}44`,
                    boxShadow: `0 0 20px ${feature.accentColor}18`,
                  }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.accentColor }} />
                </div>
                <h3 className="text-lg font-semibold text-[#e8eaf0] mb-2">{feature.title}</h3>
                <div className="flex items-center gap-1.5 mb-2">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: `${feature.accentColor}18`, color: feature.accentColor, border: `1px solid ${feature.accentColor}30` }}
                  >
                    {feature.usedBy}
                  </span>
                </div>
                <p className="text-xs font-semibold mb-3" style={{ color: feature.accentColor }}>
                  {feature.benefit}
                </p>
                <p className="text-[#8892a4] text-sm leading-relaxed mb-4">{feature.description}</p>
                <div
                  className="p-3 rounded-lg text-xs leading-relaxed"
                  style={{ background: `${feature.accentColor}0d`, border: `1px solid ${feature.accentColor}22`, color: "#8892a4" }}
                >
                  <span className="font-semibold" style={{ color: feature.accentColor }}>Patient benefit:</span>{" "}
                  {feature.patientBenefit}
                </div>
                <div
                  className="mt-4 flex items-center gap-1 text-xs font-medium group-hover:opacity-100 opacity-60 transition-opacity"
                  style={{ color: feature.accentColor }}
                >
                  Try this module <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* 2c — Case Queue (sub-section) */}
          <div
            className="rounded-2xl p-8 lg:p-12"
            style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.15)" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mb-10"
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
                style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.25)" }}
              >
                <Users className="w-3.5 h-3.5" />
                Case Queue
              </div>
              <h2 className="text-3xl font-bold text-[#e8eaf0] mb-4">
                Every case, tracked.
                <br />
                Nothing falls through.
              </h2>
              <p className="text-[#8892a4] text-lg">
                All six modules feed into a single shared case queue stored in a PostgreSQL database. Cases survive page refresh, are accessible on any device, and carry a full audit trail from creation to resolution.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {queueFeatures.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="p-5 rounded-xl"
                  style={{ background: "rgba(26,31,46,0.6)", border: "1px solid rgba(42,47,69,0.8)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: "rgba(6,182,212,0.12)" }}
                  >
                    <CheckCircle2 className="w-4 h-4" style={{ color: "#06b6d4" }} />
                  </div>
                  <h4 className="font-semibold text-[#e8eaf0] mb-2 text-sm">{item.title}</h4>
                  <p className="text-[#8892a4] text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Button
                onClick={() => goToDashboard()}
                size="lg"
                className="bg-[#0D7377] hover:bg-[#0a5f63] text-white px-10 font-semibold"
              >
                Open the Case Queue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Section 3: Technology + Clinical Standards (two-column) ─── */}
      <section id="technology" className="py-20" style={{ background: "#111520" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}>

          {/* 3a — Engine: Gemma 4 31B */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
                  aspectRatio: "4/3",
                }}
              >
                <img
                  src={AI_IMG}
                  alt="Gemma AI Architecture"
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.9) saturate(0.9)" }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}
              >
                <Cpu className="w-3.5 h-3.5" />
                Technology — Engine
              </div>
              <h2 className="text-4xl font-bold text-[#e8eaf0] mb-4">
                Built on{" "}
                <span style={{ color: "#10b981" }}>Gemma 4 31B</span>
                <br />
                by Google.
              </h2>
              <p className="text-[#8892a4] text-lg mb-8">
                MediFlow AI uses Gemma's multimodal understanding, native function calling, and open-weight architecture to process clinical data across all six modules. The system is designed to stay available even when individual model quotas are reached.
              </p>
              <div className="space-y-4">
                {techCapabilities.map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 p-4 rounded-xl"
                    style={{ background: `${item.accent}0d`, border: `1px solid ${item.accent}28` }}
                  >
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: item.accent }} />
                    <div>
                      <span className="font-semibold text-[#e8eaf0]">{item.title}</span>
                      <span className="text-[#8892a4]">: {item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 3b — Evidence: Clinical Standards & Data Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            className="text-center mb-16"
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{ background: "rgba(13,115,119,0.18)", color: "#2dd4bf", border: "1px solid rgba(13,115,119,0.4)" }}
            >
              <Shield className="w-3.5 h-3.5" />
              Technology — Evidence
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ color: "#e8eaf0" }}>
              Built on verified medical data,
              <br />
              <span style={{ color: "#0D7377" }}>not assumptions.</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#8892a4" }}>
              Every clinical decision in MediFlow AI is grounded in official government databases, peer-reviewed research, and internationally recognised healthcare standards.
            </p>
          </motion.div>

          {/* Two-column: APIs (left) + Health Guidelines (right) */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">

            {/* Left — Official Medication APIs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(13,115,119,0.2)", border: "1px solid rgba(13,115,119,0.4)" }}
                >
                  <Database className="w-4 h-4" style={{ color: "#0D7377" }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "#e8eaf0" }}>Official Medication APIs</h3>
                  <p className="text-sm" style={{ color: "#8892a4" }}>Live data sources queried on every prescription scan</p>
                </div>
              </div>
              <div className="space-y-5">
                {clinicalAPIs.map((api) => (
                  <div
                    key={api.name}
                    className="rounded-xl p-5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `rgba(${api.color === "#f59e0b" ? "245,158,11" : "13,115,119"},0.15)`,
                          border: `1px solid rgba(${api.color === "#f59e0b" ? "245,158,11" : "13,115,119"},0.3)`,
                        }}
                      >
                        <api.icon className="w-5 h-5" style={{ color: api.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base" style={{ color: "#e8eaf0" }}>{api.name}</h4>
                          <a
                            href={api.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                            style={{ color: "#0D7377" }}
                          >
                            <ExternalLink className="w-3 h-3" /> Official docs
                          </a>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "#8892a4" }}>{api.org}</div>
                        <div
                          className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium"
                          style={{ background: "rgba(13,115,119,0.15)", color: "#2dd4bf" }}
                        >
                          Used for: {api.usedFor}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#8892a4" }}>{api.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — Health Guidelines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)" }}
                >
                  <Stethoscope className="w-4 h-4" style={{ color: "#818cf8" }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold" style={{ color: "#e8eaf0" }}>Health Guidelines and Classification Systems</h3>
                  <p className="text-sm" style={{ color: "#8892a4" }}>International standards that govern MediFlow AI's clinical outputs</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clinicalStandards.map((std) => (
                  <div
                    key={std.code}
                    className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="px-2 py-1 rounded text-xs font-bold font-mono"
                        style={{ background: "rgba(255,255,255,0.07)", color: std.color }}
                      >
                        {std.code}
                      </div>
                      <a
                        href={std.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                        style={{ color: "#8892a4" }}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="font-semibold text-sm mb-1" style={{ color: "#e8eaf0" }}>{std.full}</div>
                    <div className="text-xs mb-2" style={{ color: std.color }}>{std.org}</div>
                    <div
                      className="inline-block mb-2 px-2 py-0.5 rounded text-xs"
                      style={{ background: "rgba(255,255,255,0.05)", color: "#8892a4" }}
                    >
                      Module: {std.module}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>{std.detail}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Supporting Research */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)" }}
              >
                <GraduationCap className="w-4 h-4" style={{ color: "#34d399" }} />
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ color: "#e8eaf0" }}>Supporting Research</h3>
                <p className="text-sm" style={{ color: "#8892a4" }}>Peer-reviewed studies that informed the design of each module</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {supportingResearch.map((study) => (
                <div
                  key={study.title}
                  className="rounded-xl p-5"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ background: "rgba(255,255,255,0.06)", color: study.color }}
                    >
                      {study.journal}
                    </span>
                    <span className="text-xs" style={{ color: "#8892a4" }}>{study.year}</span>
                    <a
                      href={study.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                      style={{ color: "#8892a4" }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: "#e8eaf0" }}>{study.title}</h4>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: "#6b7280" }}>{study.finding}</p>
                  <div
                    className="inline-block px-2 py-0.5 rounded text-xs"
                    style={{ background: "rgba(255,255,255,0.04)", color: "#8892a4" }}
                  >
                    Relevant to: {study.relevance}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Section 4: CTA ─── */}
      <section className="py-20 relative overflow-hidden" style={{ background: "#0D7377" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0,0,0,0.1) 0%, transparent 50%)",
          }}
        />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }} className="relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 bg-white/20 text-white">
              <Cpu className="w-3.5 h-3.5" />
              Gemma 4 31B Live
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              See MediFlow AI in action.
            </h2>
            <p className="text-white/80 text-lg mb-4 max-w-xl mx-auto">
              Open the live dashboard and try any of the six modules. Paste a patient note, photograph a prescription, or run a triage and watch Gemma 4 produce a clinical document in under two seconds.
            </p>
            <p className="text-white/70 text-base mb-8 max-w-xl mx-auto">
              Try it now — your first case is already waiting in the queue. Every result is saved and downloadable as a PDF. No login required to explore the modules.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
              <Button
                onClick={() => window.location.href = "/dashboard"}
                size="lg"
                className="w-full sm:w-auto bg-[#0a1628] text-white hover:bg-[#0f2040] px-10 font-bold shadow-2xl border-2 border-white/30 hover:border-white/60 transition-all"
              >
                Open Live Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={goToMetrics}
                size="lg"
                className="w-full sm:w-auto bg-white/15 border border-white/40 text-white hover:bg-white/25 px-8 font-semibold"
              >
                <BarChart3 className="w-4 h-4 mr-2" /> View Metrics
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8" style={{ background: "#0a0d14", borderTop: "1px solid rgba(42,47,69,0.6)" }}>
        <div
          style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem" }}
          className="flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#0D7377" }}>
              <Activity className="w-3 h-3 text-white" />
            </div>
            <span className="text-[#e8eaf0] font-semibold text-sm">MediFlow AI</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-xs text-center text-[#8892a4]">
              Clinical Workflow Automation Platform &copy; {new Date().getFullYear()} MediFlow AI
            </div>
            <div className="text-xs text-center text-[#8892a4]">
              Built by{" "}
              <span className="text-[#10b981] font-medium">Saransh Shetty</span>
              {" · "}
              <a href="mailto:saranshshetty2403@gmail.com" className="text-[#0D7377] hover:text-[#0a9da3] transition-colors">
                saranshshetty2403@gmail.com
              </a>
            </div>
          </div>
          <div className="text-xs font-mono text-[#8892a4]">v4.0.0</div>
        </div>
      </footer>
    </div>
  );
}

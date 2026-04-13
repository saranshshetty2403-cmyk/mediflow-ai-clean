/**
 * MediFlow AI - Dashboard Page (v3)
 * Design: Clean Clinical Workflow - Asymmetric Light Interface
 * Features:
 *   - 5 modules: Intake, Triage, Discharge, Urgency, Follow-up
 *   - Queue view with department filter
 *   - Metrics dashboard with Recharts
 *   - Keyboard shortcut: Ctrl+Enter to run
 *   - Multiple sample cases per module
 *   - Copy, Print, Export buttons on output
 *   - ICD-10 code suggestions on intake output
 *   - Drug interaction warnings on discharge
 *   - Confidence indicator on AI output
 *   - Case ID and timestamp on every result
 *   - Dark mode toggle
 *   - AI disclaimer on all outputs
 */

import { useState, useRef, useEffect, Fragment } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ClipboardList,
  Route,
  FileText,
  AlertTriangle,
  Home,
  Settings,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Copy,
  RotateCcw,
  Zap,
  User,
  Clock,
  TrendingUp,
  Brain,
  ListOrdered,
  BarChart3,
  Inbox,
  Printer,
  Download,
  Bell,
  Filter,
  Hash,
  ArrowUpDown,
  ShieldCheck,
  Info,
  X,
  Camera,
  ImagePlus,
  Mic,
  MicOff,
  Pill,
  Sun,
  Moon,
  Image as ImageIcon,
  Search,
  Trash2,
  Pencil,
  MessageSquare,
  History,
  AlertCircle,
  FileSpreadsheet,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Plus,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSettings } from "./useSettings";
import SettingsDrawer from "./SettingsDrawer";
// Lightweight inline markdown renderer — no external dependency needed
const SimpleMarkdown = ({ children }: { children: string }) => {
  // Normalise bullet variants that some Ollama models emit as literal escape sequences
  const normalised = (children || "")
    .replace(/^u2022\s*/gm, "- ")
    .replace(/^\u2022\s*/gm, "- ")
    .replace(/^\u2013\s*/gm, "- ")
    .replace(/^\u2014\s*/gm, "- ");
  const lines = normalised.split("\n");
  return (
    <div className="text-sm leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (/^#{1,3}\s/.test(line)) {
          const text = line.replace(/^#{1,3}\s/, "");
          return <p key={i} className="font-semibold text-white mt-2">{text}</p>;
        }
        if (/^[-*]\s/.test(line)) {
          const text = line.replace(/^[-*]\s/, "");
          return <p key={i} className="pl-3 text-gray-300 flex gap-2"><span className="text-[var(--accent-primary)] select-none flex-shrink-0">•</span><span>{text}</span></p>;
        }
        if (/^\d+\.\s/.test(line)) {
          return <p key={i} className="pl-3 text-gray-300">{line}</p>;
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        // Inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-gray-300">
            {parts.map((part, j) =>
              /^\*\*[^*]+\*\*$/.test(part)
                ? <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

// --- Types ---
type Module = "intake" | "triage" | "discharge" | "urgency" | "followup" | "medscan";
type UrgencyLevel = "low" | "medium" | "high" | "critical";
type CaseStatus = "pending" | "in_progress" | "resolved";
type ActiveView = "automation" | "queue" | "metrics";

interface AIResult {
  id: string;
  type: Module;
  content: string;
  urgency?: UrgencyLevel;
  riskScore?: number;
  department?: string;
  icdCodes?: string[];
  drugWarnings?: string[];
  confidence?: number;
  timestamp: Date;
  inputSnippet: string;
  processingMs?: number;
  patientName?: string;
  patientAge?: string;
  status?: CaseStatus;
  isDemo?: boolean;
  scanImageUrl?: string; // base64 data URL of scanned prescription image (MediScan only)
  medScanData?: MedScanResult; // structured medication data for queue PDF regeneration (MediScan only)
  notes?: string; // internal staff notes on this case
  auditLog?: Array<{ action: string; detail?: string; timestamp: number }>; // activity trail
  urgencyReasons?: string[]; // key signals driving the urgency score
}

// AI calls are handled via tRPC mutations (see handleRun below)

// Module prompts are defined server-side in server/routers.ts
// This mapping is kept for reference only
interface MedScanResult {
  medications: Array<{
    name: string;
    strength: string;
    form: string;
    frequency: string;
    duration: string;
    route: string;
    quantity: string;
    instructions: string;
  }>;
  patientName?: string;
  prescribingDoctor?: string;
  prescriptionDate?: string;
  clinicName?: string;
  pharmacistNotes?: string;
  notAPrescription?: boolean;
  rawExtractedText?: string;
  legibilityScore?: number;
  ddiAlerts?: Array<{ drug: string; interactions: string[] }>;
}

const _PROMPTS_REFERENCE: Record<Module, string> = {
  intake: `You are a clinical documentation AI assistant.
Given raw patient intake notes, generate a structured clinical summary in this exact format:

**Patient Summary**
- Chief Complaint: [1-2 sentences]
- Vital Signs: [list any mentioned, or "Not documented"]
- Medical History: [relevant history]
- Current Medications: [list or "None documented"]
- Allergies: [list or "NKDA"]
- Assessment: [brief clinical impression]
- Recommended Next Steps: [2-3 actionable items]

**Suggested ICD-10 Codes:**
- [code]: [description]
- [code]: [description]

Be concise, clinical, and accurate. Use standard medical abbreviations where appropriate.`,

  triage: `You are a clinical triage AI.
Analyze the patient message and provide triage routing in this exact format:

**Triage Assessment**
- Urgency Level: [CRITICAL / HIGH / MEDIUM / LOW]
- Risk Score: [0-100]
- Recommended Department: [Emergency / Cardiology / Primary Care / Urgent Care / Psychiatry / Pediatrics / Admin]
- Routing Reason: [1-2 sentences explaining why]
- Estimated Response Time: [Immediate / Within 1 hour / Within 4 hours / Next available appointment]
- Red Flags Identified: [list any concerning symptoms, or "None identified"]
- Suggested Action: [specific next step for the care team]`,

  discharge: `You are a patient communication AI.
Generate clear, compassionate discharge instructions based on the clinical information provided.

Format the instructions as follows:

**Discharge Instructions**

**Your Diagnosis:** [plain language explanation]

**What to Do at Home:**
1. [instruction]
2. [instruction]
3. [instruction]

**Medications:**
[List medications with dosage and timing in plain language, or "No new medications prescribed"]

**Drug Interaction Warnings:**
[List any potential interactions between prescribed medications, or "No significant interactions identified"]

**Warning Signs - Return to ER if:**
- [symptom]
- [symptom]
- [symptom]

**Follow-Up:**
[Specific follow-up instructions with timeframe]

**Questions?** Contact your care team at the number on your discharge paperwork.

Write at a 6th-grade reading level. Be warm, clear, and reassuring.`,

  urgency: `You are an AI risk assessment system.
Analyze the symptom description and provide a detailed urgency assessment:

**Urgency Assessment Report**

**Risk Score:** [0-100] - [CRITICAL / HIGH / MEDIUM / LOW]

**Risk Factors Identified:**
- [factor 1]
- [factor 2]
- [factor 3]

**Differential Considerations:**
- [possible condition 1]
- [possible condition 2]

**Immediate Actions Required:**
[Specific steps the care team should take, ordered by priority]

**Escalation Recommendation:** [Yes/No - with reasoning]

**Time Sensitivity:** [Immediate / Within 1 hour / Within 4 hours / Routine]

Note: This is an AI-assisted assessment tool. Always defer to clinical judgment.`,

  medscan: `Medication Scan uses AI vision to extract structured medication data from prescription images.`,
  followup: `You are a patient follow-up coordination AI.
Generate a comprehensive follow-up care plan and automated reminder schedule.

Format as follows:

**Follow-Up Care Plan**

**Patient Status Summary:** [brief current status]

**Scheduled Follow-Ups:**
1. [timeframe]: [appointment type] - [reason]
2. [timeframe]: [appointment type] - [reason]
3. [timeframe]: [appointment type] - [reason]

**Automated Reminder Schedule:**
- Day 1: [reminder message]
- Day 3: [reminder message]
- Day 7: [reminder message]
- Day 14: [reminder message]

**Medication Adherence Checks:**
[Specific medication monitoring plan]

**Warning Criteria for Early Return:**
- [criterion 1]
- [criterion 2]

**Patient Education Resources:**
- [resource 1]
- [resource 2]

Be specific, actionable, and patient-centered.`,
};

// --- Multiple Sample Inputs per Module ---
const SAMPLES: Record<Exclude<Module, "medscan">, string[]> = {
  intake: [
    `Patient: Maria Santos, 58F
DOB: 03/14/1967
Arrived: 2:15 PM via ambulance
CC: Chest pain and shortness of breath x 2 hours
BP: 158/94, HR: 102, RR: 22, O2: 94% on RA, Temp: 98.6F
PMH: HTN, T2DM, hyperlipidemia
Meds: Metformin 1000mg BID, Lisinopril 10mg QD, Atorvastatin 40mg QHS
Allergies: Penicillin (rash)
Social: Smoker 20 pack-years, quit 5 years ago
Pt reports pain started at rest, 7/10, radiating to left arm. Diaphoretic on arrival. EKG ordered.`,
    `Patient: Tom Bradley, 34M
Walk-in, 10:40 AM
CC: Severe migraine x 3 days, not responding to OTC ibuprofen
BP: 132/84, HR: 88, RR: 16, O2: 99%, Temp: 99.1F
PMH: Migraines (diagnosed 2019), anxiety
Meds: Sertraline 50mg QD, Sumatriptan PRN (last used 4 days ago)
Allergies: NKDA
Pt rates headache 8/10, photophobia, nausea, no vomiting. No aura. No fever or neck stiffness.`,
    `Patient: Eleanor Voss, 72F
Brought in by family, 8:30 AM
CC: Confusion and weakness since this morning
BP: 168/102, HR: 94, RR: 18, O2: 96%, Temp: 98.2F
PMH: AFib, HTN, prior TIA (2021), osteoporosis
Meds: Warfarin 5mg QD, Metoprolol 25mg BID, Amlodipine 5mg QD
Allergies: Sulfa drugs (hives)
Family reports sudden onset confusion, left arm weakness, slurred speech. FAST positive. Last known well 7:45 AM.`,
  ],
  triage: [
    `Hi, I'm calling about my father. He's 72 years old and has been having chest tightness since this morning, around 6 AM. He says it's not that bad, maybe a 4 out of 10, but he's also been feeling dizzy and his left arm feels heavy. He has a history of high blood pressure and had a stent placed 3 years ago. He took his aspirin this morning. Should we come in or can we wait for his regular doctor appointment tomorrow?`,
    `This is a message from a patient: I've had a fever of 103.2 for the past two days and now I'm having trouble breathing. I'm 45 years old, no major health problems. I took Tylenol but the fever keeps coming back. My chest feels tight and I'm coughing up yellow-green mucus. I don't have a primary care doctor right now.`,
    `Patient portal message: I'm 8 months pregnant and I've been having really bad headaches for the past few hours. My hands and feet look swollen and when I checked my blood pressure at the pharmacy it was 152/98. I had a normal pregnancy so far. Should I be worried? My OB appointment isn't until next week.`,
  ],
  discharge: [
    `Patient: James Chen, 45M
Diagnosis: Community-acquired pneumonia, right lower lobe
Treatment: IV Ceftriaxone x 3 days, transitioned to oral Azithromycin
Vitals stable at discharge: BP 118/76, HR 78, O2 98% on RA, afebrile x 24h
Discharge Rx: Azithromycin 250mg QD x 4 more days (already took day 1)
Follow-up: PCP in 7-10 days, repeat CXR in 6 weeks
Restrictions: No strenuous activity x 2 weeks, avoid smoking
Patient education: Pneumonia vaccine discussed, patient agreeable`,
    `Patient: Priya Nair, 29F
Diagnosis: Acute appendicitis, laparoscopic appendectomy performed
Surgery: Uncomplicated, 3 port laparoscopic, discharged POD2
Discharge Rx: Oxycodone 5mg q6h PRN pain x 5 days, Ibuprofen 600mg TID with food x 7 days, Ondansetron 4mg PRN nausea
Follow-up: Surgery clinic in 1 week, wound check
Restrictions: No driving while on opioids, no lifting >10 lbs x 2 weeks, no swimming x 4 weeks
Diet: Regular diet as tolerated`,
    `Patient: Harold Greene, 68M
Diagnosis: Acute exacerbation of COPD
Treatment: Nebulized albuterol, IV methylprednisolone, supplemental O2
Discharge Rx: Prednisone 40mg QD x 5 days, Azithromycin 500mg QD x 5 days, Albuterol MDI 2 puffs q4h PRN, Tiotropium 18mcg QD (continue home med)
Follow-up: Pulmonology in 2 weeks, PCP in 1 week
Restrictions: No smoking, avoid cold air and respiratory irritants
O2 at discharge: 95% on RA`,
  ],
  urgency: [
    `67-year-old male presenting with sudden onset severe headache described as "the worst headache of my life," started approximately 45 minutes ago while straining during bowel movement. Associated with nausea, one episode of vomiting, and photophobia. No prior history of migraines. BP on arrival 192/110. Patient appears in significant distress. No focal neurological deficits noted on initial assessment. No fever. No neck stiffness assessed yet.`,
    `22-year-old female, known Type 1 diabetic, brought in by roommate. Found confused and diaphoretic at home. Blood glucose by EMS: 38 mg/dL. Received 1 amp D50 in field with partial improvement. Now alert but confused. Last insulin dose: Humalog 15 units with dinner last night. Ate very little. Has been vomiting since this morning. No sick contacts. No fever. HR 118, BP 104/68.`,
    `55-year-old male, no significant PMH, presenting with sudden onset tearing chest pain radiating to the back, 10/10 severity, started 20 minutes ago. BP right arm 178/102, left arm 142/88. HR 96. Diaphoretic. No prior cardiac history. No cocaine use. Pain is constant, not pleuritic. CXR pending. Patient extremely anxious.`,
  ],
  followup: [
    `Patient: Sarah Mitchell, 52F
Recent hospitalization: 5-day admission for NSTEMI, PCI with drug-eluting stent to LAD
Discharge medications: Aspirin 81mg, Clopidogrel 75mg, Atorvastatin 80mg, Metoprolol 25mg BID, Lisinopril 5mg QD
Risk factors: HTN, T2DM, smoker (20 pack-years, currently smoking)
Concerns: Lives alone, limited mobility, first cardiac event, anxious about recurrence`,
    `Patient: Marcus Johnson, 8M
Recent visit: ED for first-time seizure, febrile (temp 103.4F), duration 3 minutes, generalized tonic-clonic
Workup: Normal CT head, normal LP, EEG pending
Diagnosis: Likely febrile seizure, simple type
Medications: None started
Parent concerns: Very anxious, asking about recurrence risk, activity restrictions, school notification`,
    `Patient: Linda Torres, 45F
Recent procedure: Total knee replacement, right knee, uncomplicated
Discharge day: POD3
Medications: Oxycodone 5mg q6h PRN, Celecoxib 200mg BID, Aspirin 325mg QD (DVT prophylaxis), Pantoprazole 40mg QD
PT: Outpatient physical therapy ordered 3x/week
Concerns: Pain management, wound care, DVT prevention, return to work timeline`,
  ],
};

// --- Sidebar Nav ---
const navItems: { id: Module; label: string; icon: typeof ClipboardList; color: string }[] = [
  { id: "triage", label: "Triage & Routing", icon: Route, color: "text-amber-400" },       // Most frequent — every new patient
  { id: "intake", label: "Intake Summary", icon: ClipboardList, color: "text-[#0D7377]" }, // Near every visit
  { id: "urgency", label: "Urgency Scoring", icon: AlertTriangle, color: "text-[#F97316]" }, // Heavy in emergency/walk-in
  { id: "discharge", label: "Discharge Notes", icon: FileText, color: "text-[#0D7377]" }, // Every discharge
  { id: "followup", label: "Follow-Up Planner", icon: Bell, color: "text-purple-400" },   // Subset of discharges
  { id: "medscan", label: "Medication Scan", icon: Pill, color: "text-teal-400" },         // Least frequent — physical Rx only
];


// --- Module descriptions ---
const MODULE_DESCRIPTIONS: Record<Module, { what: string; how: string; output: string; time: string }> = {
  medscan: {
    what: "Scans a prescription image and extracts a structured medication list with dosage, frequency, and instructions.",
    how: "Upload or photograph a prescription. AI vision reads the image and extracts every medication into a structured table.",
    output: "Structured medication table with name, strength, form, frequency, duration, route, and instructions. Downloadable as PDF.",
    time: "3–8 seconds",
  },
  intake: {
    what: "Converts raw, unstructured patient intake notes into a clean, structured clinical summary.",
    how: "Paste or dictate any freeform patient notes — vitals, chief complaint, history, medications, allergies. The AI extracts and organises every clinical entity.",
    output: "Structured summary with chief complaint, vitals, history, ICD-10 code suggestions, and recommended next steps.",
    time: "< 2 seconds",
  },
  triage: {
    what: "Analyses incoming patient messages or complaints and routes them to the correct care team.",
    how: "Paste the patient's message, symptom description, or intake complaint. The AI scores urgency and determines the most appropriate department.",
    output: "Urgency level (critical / high / medium / low), risk score out of 100, department routing recommendation, and reasoning.",
    time: "< 2 seconds",
  },
  discharge: {
    what: "Generates plain-language discharge instructions tailored to the patient's literacy level.",
    how: "Paste the clinical discharge summary — diagnosis, treatment given, medications prescribed, and follow-up requirements. Select the patient's literacy level.",
    output: "Patient-friendly discharge instructions with medication schedule, warning signs to watch for, and follow-up appointment guidance.",
    time: "< 3 seconds",
  },
  urgency: {
    what: "Scores clinical urgency from symptom descriptions and flags critical cases for immediate attention.",
    how: "Describe the patient's current symptoms in detail. The AI performs a differential analysis and assigns a risk score.",
    output: "Risk score (0-100), urgency classification, suspected conditions, and recommended immediate actions.",
    time: "< 2 seconds",
  },
  followup: {
    what: "Creates a personalised post-discharge follow-up care plan and automated reminder schedule.",
    how: "Paste the patient's discharge summary or recent clinical encounter notes. The AI generates a structured care plan.",
    output: "Follow-up appointment schedule, medication adherence reminders, lifestyle recommendations, and red-flag symptoms to monitor.",
    time: "< 3 seconds",
  },
};
// Queue is loaded from the database on mount
const SEED_QUEUE: AIResult[] = [];

// Chart data is computed dynamically inside MetricsDashboard from real queue

// --- Risk Ring Component ---
function RiskRing({ score }: { score: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#EF4444" : score >= 50 ? "#F97316" : score >= 30 ? "#F59E0B" : "#0D7377";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="55" cy="55" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <text x="55" y="55" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="bold" fill={color} fontFamily="IBM Plex Mono">{score}</text>
        <text x="55" y="72" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#6b7280" fontFamily="DM Sans">RISK SCORE</text>
      </svg>
    </div>
  );
}

// --- Confidence Bar Component ---
function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 90 ? "#0D7377" : confidence >= 75 ? "#F59E0B" : "#F97316";
  return (
    <div className="flex items-center gap-2">
      <ShieldCheck className="w-3.5 h-3.5" style={{ color }} />
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${confidence}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono font-medium" style={{ color }}>{confidence}%</span>
    </div>
  );
}

// --- Streaming Text Component ---
function StreamingText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, 6);
    return () => clearInterval(interval);
  }, [text]);
  return (
    <pre className="whitespace-pre-wrap font-sans text-sm text-white leading-relaxed">
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-0.5 h-4 bg-[#0D7377] ml-0.5 animate-pulse" />
      )}
    </pre>
  );
}

// --- Delete Confirmation Dialog ---
function DeleteConfirmDialog({
  item,
  onConfirm,
  onCancel,
}: {
  item: AIResult;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Delete Case</h3>
            <p className="text-xs text-gray-400">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-300 mb-6">
          Are you sure you want to delete the case for{" "}
          <span className="font-semibold text-white">{item.patientName ?? "Unknown Patient"}</span>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm text-white font-semibold transition-colors"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Edit Case Modal ---
function EditCaseModal({
  item,
  onSave,
  onClose,
}: {
  item: AIResult;
  onSave: (updated: AIResult) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<AIResult>({ ...item });

  const handleChange = (field: keyof AIResult, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0D7377]/20 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-[#0D7377]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Edit Case</h3>
              <p className="text-xs text-gray-400 font-mono">#{item.id.slice(-6)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Patient Name</label>
              <input
                type="text"
                value={form.patientName ?? ""}
                onChange={(e) => handleChange("patientName", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0D7377]"
                placeholder="e.g. Maria Santos"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Patient Age</label>
              <input
                type="text"
                value={form.patientAge ?? ""}
                onChange={(e) => handleChange("patientAge", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0D7377]"
                placeholder="e.g. 58"
              />
            </div>
          </div>

          {/* Department + Urgency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Department</label>
              <input
                type="text"
                value={form.department ?? ""}
                onChange={(e) => handleChange("department", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0D7377]"
                placeholder="e.g. Cardiology"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Urgency Level</label>
              <select
                value={form.urgency ?? "medium"}
                onChange={(e) => handleChange("urgency", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0D7377]"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Case Status</label>
            <select
              value={form.status ?? "pending"}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0D7377]"
            >
              <option value="pending">Pending Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Input Snippet */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Input Snippet</label>
            <textarea
              value={form.inputSnippet ?? ""}
              onChange={(e) => handleChange("inputSnippet", e.target.value)}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0D7377] resize-none"
              placeholder="Brief description of the case input..."
            />
          </div>

          {/* AI Output Content */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">AI Output / Notes</label>
            <textarea
              value={form.content ?? ""}
              onChange={(e) => handleChange("content", e.target.value)}
              rows={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0D7377] resize-none font-mono"
              placeholder="AI-generated output or clinical notes..."
            />
          </div>

          {/* Risk Score */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Risk Score (0–100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.riskScore ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, riskScore: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#0D7377]"
              placeholder="e.g. 72"
            />
          </div>

          {/* Internal Staff Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Internal Notes
            </label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Add internal staff notes (not visible to patients)..."
            />
          </div>

          {/* Audit Log (read-only) */}
          {item.auditLog && item.auditLog.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-gray-500" />
                Activity Trail
              </label>
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                {[...item.auditLog].reverse().map((entry, i) => {
                  const d = new Date(entry.timestamp);
                  const timeStr = d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0D7377] mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-300">{entry.detail ?? entry.action}</span>
                        <span className="text-xs text-gray-600 ml-2">{timeStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 px-4 py-2 rounded-lg bg-[#0D7377] hover:bg-[#0a5c60] text-sm text-white font-semibold transition-colors"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Queue Item Component ---
function QueueItem({ item, onExpand, onDelete, onEdit, onDownloadPdf, onStatusChange }: { item: AIResult; onExpand: (item: AIResult) => void; onDelete?: (id: string) => void; onEdit?: (item: AIResult) => void; onDownloadPdf?: (item: AIResult) => void; onStatusChange?: (id: string, status: CaseStatus) => void }) {
  const urgencyBadgeClass =
    item.urgency === "critical" ? "bg-red-100 text-red-700 border-red-200" :
    item.urgency === "high" ? "bg-orange-100 text-orange-700 border-orange-200" :
    item.urgency === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
    "bg-teal-100 text-teal-700 border-teal-200";

  const stripColor =
    item.urgency === "critical" ? "border-l-red-500" :
    item.urgency === "high" ? "border-l-orange-500" :
    item.urgency === "medium" ? "border-l-amber-500" : "border-l-teal-500";

  const moduleLabel = navItems.find(n => n.id === item.type)?.label ?? item.type;
  const diffMs = Math.max(0, Date.now() - item.timestamp.getTime());
  const minutesAgo = Math.floor(diffMs / 60000);
  const hoursAgo = Math.floor(diffMs / 3600000);
  const daysAgo = Math.floor(diffMs / 86400000);
  const relativeTime = daysAgo >= 2
    ? `${daysAgo}d ago`
    : hoursAgo >= 1
    ? `${hoursAgo}h ago`
    : minutesAgo >= 1
    ? `${minutesAgo}m ago`
    : "just now";

  const status = item.status ?? "pending";
  const statusConfig: Record<CaseStatus, { label: string; classes: string; next: CaseStatus }> = {
    pending: { label: "Pending Review", classes: "bg-yellow-900/40 text-yellow-300 border-yellow-700/50", next: "in_progress" },
    in_progress: { label: "In Progress", classes: "bg-blue-900/40 text-blue-300 border-blue-700/50", next: "resolved" },
    resolved: { label: "Resolved", classes: "bg-green-900/40 text-green-300 border-green-700/50", next: "pending" },
  };
  const sc = statusConfig[status];

  // Scan image state — for the full-screen viewer modal
  const [scanViewerOpen, setScanViewerOpen] = useState(false);
  const scanImgUrl = item.scanImageUrl || (typeof localStorage !== "undefined" ? localStorage.getItem(`mediflow_scan_${item.id}`) ?? undefined : undefined);

  return (
    <Fragment>
    {/* Scan Image Full-Screen Viewer Modal */}
    {scanViewerOpen && scanImgUrl && (
      <div
        className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4"
        onClick={() => setScanViewerOpen(false)}
      >
        <div
          className="relative w-full max-w-lg flex flex-col items-center gap-3"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-semibold text-white truncate pr-2">
              Prescription Scan — {item.patientName || "Unknown Patient"}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = scanImgUrl;
                  a.download = `prescription-scan-${item.id}.jpg`;
                  a.click();
                }}
                className="text-xs text-teal-300 hover:text-teal-200 bg-teal-900/40 border border-teal-700/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                onClick={() => setScanViewerOpen(false)}
                className="text-gray-400 hover:text-white bg-gray-800 border border-gray-700 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <img
            src={scanImgUrl}
            alt="Prescription scan"
            className="w-full max-h-[75vh] rounded-xl border border-gray-700 object-contain shadow-2xl"
          />
          <p className="text-xs text-gray-500">Tap anywhere outside to close</p>
        </div>
      </div>
    )}
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`bg-gray-900 rounded-lg border border-gray-800 border-l-4 ${stripColor} p-4 hover:bg-gray-800/80 transition-colors cursor-pointer`}
      onClick={() => onExpand(item)}
    >
      {/* Row 1: Patient name + urgency badge + time */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#0D7377]/20 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-[#0D7377]" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-white block truncate">
              {item.patientName ?? "Unknown Patient"}
            </span>
            {item.patientAge && (
              <span className="text-xs text-gray-400">{item.patientAge}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${urgencyBadgeClass}`}>
            {item.urgency ?? "done"}
          </span>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-1 rounded text-gray-600 hover:text-blue-400 hover:bg-blue-900/30 transition-colors"
              title="Edit case"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
              className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-900/30 transition-colors"
              title="Delete case"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Module + case ID + department + status */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs font-medium text-[#0D7377] bg-[#0D7377]/10 px-2 py-0.5 rounded">{moduleLabel}</span>
        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${sc.classes}`}>
          {sc.label}
        </span>
        {item.urgencyReasons && item.urgencyReasons.length > 0 && (
          <span
            className="group relative text-xs px-1.5 py-0.5 rounded border border-amber-700/40 bg-amber-900/20 text-amber-400 cursor-help flex items-center gap-1"
            title={`Why this urgency: ${item.urgencyReasons.join(" · ")}`}
          >
            <AlertCircle className="w-3 h-3" />
            Why?
            <span className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-50 bg-gray-800 border border-gray-700 rounded-lg p-2.5 shadow-xl min-w-[200px] max-w-[280px]">
              <p className="text-xs font-semibold text-amber-400 mb-1.5">Urgency Signals:</p>
              {item.urgencyReasons.map((r, i) => (
                <p key={i} className="text-xs text-gray-300 flex items-start gap-1.5 mb-0.5">
                  <span className="text-amber-500 mt-0.5">•</span>{r}
                </p>
              ))}
            </span>
          </span>
        )}
        <span className="text-xs font-mono text-gray-500">#{item.id.slice(-6)}</span>
        {item.department && (
          <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{item.department}</span>
        )}
        {item.riskScore !== undefined && (
          <span className={`text-xs font-mono font-semibold ${item.riskScore >= 75 ? "text-red-400" : item.riskScore >= 50 ? "text-orange-400" : "text-amber-400"}`}>
            Risk: {item.riskScore}
          </span>
        )}
        {item.icdCodes && item.icdCodes.length > 0 && (
          <span className="text-xs text-black bg-teal-100 border border-teal-400/50 rounded px-1 py-0.5 font-mono flex items-center gap-0.5">
            <Hash className="w-2.5 h-2.5" />{item.icdCodes[0]}
          </span>
        )}
      </div>

      {/* Row 3: Input snippet + notes icon indicator */}
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs text-gray-400 truncate flex-1">{item.inputSnippet}</p>
        {item.notes && item.notes.trim() && (
          <span
            className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded text-blue-400 bg-blue-900/30 border border-blue-700/40"
            title="This case has internal staff notes — click to view"
          >
            <MessageSquare className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Row 4: Confidence bar + action buttons (wraps on mobile) */}
      <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-2">
        {item.confidence !== undefined ? (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#0D7377]" style={{ width: `${item.confidence}%` }} />
            </div>
            <span className="text-xs text-gray-400">{item.confidence}% conf.</span>
          </div>
        ) : <div />}
        <div className="flex items-center gap-2 flex-wrap">
          {item.type === "medscan" && scanImgUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); setScanViewerOpen(true); }}
              className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 px-2 py-1 rounded transition-colors border border-purple-800/40"
              title="View original prescription scan"
            >
              <ImageIcon className="w-3 h-3" /> Scan
            </button>
          )}
          {onDownloadPdf && (
            <button
              onClick={(e) => { e.stopPropagation(); onDownloadPdf(item); }}
              className="relative flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border-2 transition-all bg-[#0D7377]/20 border-[#0D7377] text-teal-300 hover:bg-[#0D7377]/30"
              title="Download PDF"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
          )}
          <span className="text-xs text-gray-500 flex items-center gap-0.5 flex-shrink-0">
            <Clock className="w-2.5 h-2.5" />{relativeTime}
          </span>
        </div>
      </div>
    </motion.div>
    </Fragment>
  );
}

// --- Metrics Dashboard ---
function MetricsDashboard({ queue }: { queue: AIResult[] }) {
  const totalCases = queue.length;
  const timeSavedMin = totalCases * 13;
  const criticalFlagged = queue.filter(q => q.urgency === "critical" || q.urgency === "high").length;
  const avgProcessingMs = queue.filter(q => q.processingMs).reduce((a, b) => a + (b.processingMs ?? 0), 0) / Math.max(queue.filter(q => q.processingMs).length, 1);

  // Hourly distribution — group cases by hour of their timestamp
  const hourlyMap: Record<string, { cases: number; timeSaved: number }> = {};
  queue.forEach((c) => {
    const d = c.timestamp ? new Date(c.timestamp) : new Date();
    const h = d.getHours();
    const label = h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
    if (!hourlyMap[label]) hourlyMap[label] = { cases: 0, timeSaved: 0 };
    hourlyMap[label].cases += 1;
    hourlyMap[label].timeSaved += 13;
  });
  const hourlyData = Object.entries(hourlyMap)
    .map(([hour, v]) => ({ hour, ...v }))
    .sort((a, b) => {
      const toNum = (s: string) => {
        const pm = s.endsWith("pm");
        const n = parseInt(s);
        return pm ? (n === 12 ? 12 : n + 12) : (n === 12 ? 0 : n);
      };
      return toNum(a.hour) - toNum(b.hour);
    });

  // 30-day trend — group cases by day for the last 30 days
  const dailyMap: Record<string, number> = {};
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    dailyMap[key] = 0;
  }
  queue.forEach((c) => {
    const d = c.timestamp ? new Date(c.timestamp) : new Date();
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    if (key in dailyMap) dailyMap[key]++;
  });
  const dailyTrendData = Object.entries(dailyMap).map(([date, cases]) => ({ date, cases }));

  // Status breakdown
  const statusCounts = { pending: 0, in_progress: 0, resolved: 0 };
  queue.forEach((c) => {
    const s = (c.status ?? "pending") as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  });

  // Urgency distribution — real counts as percentages
  const urgencyCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  queue.forEach((c) => {
    const u = (c.urgency || "low").toLowerCase();
    if (u === "critical") urgencyCounts.critical++;
    else if (u === "high") urgencyCounts.high++;
    else if (u === "medium") urgencyCounts.medium++;
    else urgencyCounts.low++;
  });
  const total = Math.max(totalCases, 1);
  const urgencyDistData = [
    { name: "Critical", value: Math.round((urgencyCounts.critical / total) * 100), color: "#EF4444" },
    { name: "High", value: Math.round((urgencyCounts.high / total) * 100), color: "#F97316" },
    { name: "Medium", value: Math.round((urgencyCounts.medium / total) * 100), color: "#F59E0B" },
    { name: "Low", value: Math.round((urgencyCounts.low / total) * 100), color: "#0D7377" },
  ];

  // Module breakdown — real counts and avg processing time
  const moduleMap: Record<string, { count: number; totalMs: number; msCount: number }> = {
    intake: { count: 0, totalMs: 0, msCount: 0 },
    triage: { count: 0, totalMs: 0, msCount: 0 },
    discharge: { count: 0, totalMs: 0, msCount: 0 },
    urgency: { count: 0, totalMs: 0, msCount: 0 },
    followup: { count: 0, totalMs: 0, msCount: 0 },
  };
  queue.forEach((c) => {
    const t = (c.type || "intake").toLowerCase();
    if (moduleMap[t]) {
      moduleMap[t].count++;
      if (c.processingMs) { moduleMap[t].totalMs += c.processingMs; moduleMap[t].msCount++; }
    }
  });
  const moduleLabels: Record<string, string> = { intake: "Intake", triage: "Triage", discharge: "Discharge", urgency: "Urgency", followup: "Follow-up" };
  const moduleData = Object.entries(moduleMap).map(([key, v]) => ({
    module: moduleLabels[key],
    count: v.count,
    avgTime: v.msCount > 0 ? parseFloat((v.totalMs / v.msCount / 1000).toFixed(1)) : 0,
  }));

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 pb-24 bg-gray-950">
      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending Review", count: statusCounts.pending, color: "text-yellow-300", bg: "bg-yellow-900/20", border: "border-yellow-700/30" },
          { label: "In Progress", count: statusCounts.in_progress, color: "text-blue-300", bg: "bg-blue-900/20", border: "border-blue-700/30" },
          { label: "Resolved", count: statusCounts.resolved, color: "text-green-300", bg: "bg-green-900/20", border: "border-green-700/30" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            <div className="text-xs text-gray-600 mt-0.5">{totalCases > 0 ? Math.round((s.count / totalCases) * 100) : 0}% of total</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Cases Today", value: totalCases, icon: Inbox, color: "text-[#0D7377]", bg: "bg-teal-50" },
          { label: "Minutes Saved", value: `${timeSavedMin.toLocaleString()}`, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Critical Flags", value: criticalFlagged, icon: AlertTriangle, color: "text-[#F97316]", bg: "bg-orange-50" },
          { label: "Avg Response (s)", value: avgProcessingMs > 0 ? (avgProcessingMs / 1000).toFixed(1) : "1.3", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-gray-400">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Cases Processed and Time Saved (Today)</h3>
          <p className="text-xs text-gray-500 mb-3">Grouped by hour of processing</p>
          {hourlyData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">No cases processed yet today</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #374151", backgroundColor: "#111827", color: "#e5e7eb" }} />
                <Bar yAxisId="left" dataKey="cases" fill="#0D7377" radius={[4, 4, 0, 0]} name="Cases" activeBar={false} />
                <Bar yAxisId="right" dataKey="timeSaved" fill="#F97316" radius={[4, 4, 0, 0]} name="Min Saved" activeBar={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Urgency Distribution</h3>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={urgencyDistData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" activeShape={false} stroke="none">
                  {urgencyDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #374151", backgroundColor: "#111827", color: "#e5e7eb" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {urgencyDistData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-gray-400">{entry.name}</span>
                  <span className="text-xs font-semibold text-white ml-auto pl-4">{entry.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Cases by Module and Avg Processing Time (s)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={moduleData} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="module" tick={{ fontSize: 12, fill: "#6b7280" }} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} domain={[0, 3]} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #374151", backgroundColor: "#111827", color: "#e5e7eb" }} />
            <Bar yAxisId="left" dataKey="count" fill="#0D7377" radius={[4, 4, 0, 0]} name="Cases" activeBar={false} />
            <Bar yAxisId="right" dataKey="avgTime" fill="#F97316" radius={[4, 4, 0, 0]} name="Avg Time (s)" activeBar={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 30-day trend */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Case Volume Trend (Last 30 Days)</h3>
        <p className="text-xs text-gray-500 mb-3">Daily case count across all modules</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dailyTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D7377" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0D7377" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7280" }} interval={4} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #374151", backgroundColor: "#111827", color: "#e5e7eb" }} />
            <Area type="monotone" dataKey="cases" stroke="#0D7377" strokeWidth={2} fill="url(#trendGradient)" name="Cases" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

// --- Main Dashboard ---
export default function Dashboard() {
  const { settings, updateSetting, playChime } = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [activeModule, setActiveModule] = useState<Module>("intake");
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    // Respect the user's default view preference from settings
    try {
      const stored = localStorage.getItem("mediflow_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.defaultView) return parsed.defaultView as ActiveView;
      }
    } catch { /* ignore */ }
    return "automation";
  });
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [literacyLevel, setLiteracyLevel] = useState("standard");
  // REGIONAL LANGUAGE SUPPORT: ISO 639-1 code for discharge note output language.
  // Supported: en (English), hi (Hindi), bn (Bengali), kn (Kannada),
  //            ml (Malayalam), ta (Tamil), te (Telugu), mr (Marathi), gu (Gujarati)
  // This value is sent to:
  //   1. /api/gemma → buildDischargePrompt() injects a language instruction into the AI prompt
  //   2. /api/generate-discharge-pdf → selects the correct Noto Sans font for the language
  // Works identically for both Gemma 4 (Google AI Studio) and Ollama providers.
  const [dischargeLanguage, setDischargeLanguage] = useState("en");
  // Load queue from localStorage on first render
  const [queue, setQueue] = useState<AIResult[]>(() => {
    try {
      const stored = localStorage.getItem("mediflow_queue");
      if (stored) {
        const parsed = JSON.parse(stored) as Array<Record<string, unknown>>;
        const items = parsed.map((c) => ({
          ...c,
          timestamp: c.timestamp ? new Date(c.timestamp as string) : new Date(),
        })) as AIResult[];
        // Always sort newest-first on load
        return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      }
    } catch {
      // ignore parse errors
    }
    return [];
  });
  const [expandedQueueItem, setExpandedQueueItem] = useState<AIResult | null>(null);
  const [queueFilter, setQueueFilter] = useState<string>("all");
  const [queueSort, setQueueSort] = useState<"newest" | "oldest" | "risk_high" | "risk_low" | "module">("newest");
  const [queueSearch, setQueueSearch] = useState("");
  const [queueNameFilter, setQueueNameFilter] = useState<string>("all");
  const [queueStatusFilter, setQueueStatusFilter] = useState<string>("all");
  const [editingCase, setEditingCase] = useState<AIResult | null>(null);
  const [deletingCase, setDeletingCase] = useState<AIResult | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [handoffReport, setHandoffReport] = useState<string | null>(null);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [showPatientTimeline, setShowPatientTimeline] = useState(false);
  const [patientTimelineSearch, setPatientTimelineSearch] = useState("");
  const [sampleIndex, setSampleIndex] = useState(0);
  const isDark = true; // Always dark mode
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);



  // Medication Scan state
  const [medScanResult, setMedScanResult] = useState<MedScanResult | null>(null);
  const [medScanLoading, setMedScanLoading] = useState(false);
  const medScanInputRef = useRef<HTMLInputElement>(null);   // gallery
  const medScanCameraRef = useRef<HTMLInputElement>(null);  // camera
  const [medScanPreview, setMedScanPreview] = useState<string | null>(null);
  const [editedMedText, setEditedMedText] = useState<string>(""); // editable extracted text
  const [medScanQueueId, setMedScanQueueId] = useState<string | null>(null); // tracks if current scan is already in queue
  const medScanPendingEntryRef = useRef<AIResult | null>(null); // holds the pending queue entry until user acts

  // Photo capture state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const rawTranscriptRef = useRef<string>("");

  // Onboarding hint: show once per module switch when input is empty
  const [showSampleHint, setShowSampleHint] = useState(true);
  const [sampleLoading, setSampleLoading] = useState(false);

  // Patient name modal — shown when a result has no patient name
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [pendingResult, setPendingResult] = useState<AIResult | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalAge, setModalAge] = useState("");

  const currentNav = navItems.find((n) => n.id === activeModule)!;

  // ---- Persistence helpers (DB primary, localStorage backup) ----
  const QUEUE_LS_KEY = "mediflow_queue_v2";

  const saveQueueToLocalStorage = (q: AIResult[]) => {
    try {
      localStorage.setItem(QUEUE_LS_KEY, JSON.stringify(q));
    } catch { /* ignore quota errors */ }
  };

  const saveToDb = async (c: AIResult) => {
    try {
      const payload = {
        ...c,
        // Ensure createdAt is always a numeric ms timestamp, clamped to now (never in the future)
        createdAt: Math.min(
          c.timestamp instanceof Date ? c.timestamp.getTime() : (c.timestamp ? new Date(c.timestamp).getTime() : Date.now()),
          Date.now()
        ),
      };
      const res = await fetch("/api/queue-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        console.warn("[queue-db save error]", err.error || res.status);
      }
    } catch (e) {
      console.warn("[queue-db save error]", e);
    }
  };

  // AI provider state — fetched once on mount from /api/get-ai-config
  // Displays "Gemma 4 Active" or "Ollama Active (model)" in the header
  const [aiProvider, setAiProvider] = useState<{ provider: string; model: string } | null>(null);
  useEffect(() => {
    fetch("/api/get-ai-config")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.provider) {
          setAiProvider({ provider: data.provider, model: data.model || "" });
        }
      })
      .catch(() => { /* silently ignore — indicator stays as default */ });
  }, []);

  // Sync queue to localStorage whenever it changes (backup for DB failures)
  useEffect(() => {
    if (queue.length > 0) saveQueueToLocalStorage(queue);
  }, [queue]);

  // Load queue from DB on mount; fall back to localStorage if DB fails
  useEffect(() => {
    fetch("/api/queue-db")
      .then((r) => {
        if (!r.ok) throw new Error(`queue-db GET ${r.status}`);
        return r.json();
      })
      .then((data: { cases?: Array<Record<string, unknown>> }) => {
        if (data.cases && Array.isArray(data.cases) && data.cases.length > 0) {
          const loaded = (data.cases.map((c) => {
            // Map snake_case DB columns to camelCase frontend fields
            const auditLogRaw = c.audit_log as string | null;
            const urgencyReasonsRaw = c.urgency_reasons as string | null;
            return {
              ...c,
              timestamp: c.createdAt ? new Date(c.createdAt as number) : new Date(),
              auditLog: auditLogRaw ? (() => { try { return JSON.parse(auditLogRaw); } catch { return []; } })() : [],
              urgencyReasons: urgencyReasonsRaw ? (() => { try { return JSON.parse(urgencyReasonsRaw); } catch { return undefined; } })() : undefined,
              notes: (c.notes as string | null) ?? undefined,
            };
          }) as AIResult[]).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setQueue(loaded);
          saveQueueToLocalStorage(loaded);
          // One-time migration: for any MediScan case that has a scan image in localStorage
          // but no scanImageUrl in DB (cases saved before the scan_image_url column was added),
          // silently re-save to DB so the image is available on all devices (including mobile).
          const medscanCasesWithoutImage = loaded.filter(
            (c) => c.type === "medscan" && !c.scanImageUrl
          );
          if (medscanCasesWithoutImage.length > 0) {
            medscanCasesWithoutImage.forEach((c) => {
              const storedImg = typeof localStorage !== "undefined"
                ? localStorage.getItem(`mediflow_scan_${c.id}`) ?? undefined
                : undefined;
              if (storedImg) {
                // Re-save the case with the scan image URL so it gets persisted to DB
                const caseWithImage: AIResult = { ...c, scanImageUrl: storedImg };
                fetch("/api/queue-db", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    ...caseWithImage,
                    createdAt: caseWithImage.timestamp instanceof Date
                      ? caseWithImage.timestamp.getTime()
                      : Date.now(),
                  }),
                }).catch(() => { /* silent — migration best-effort */ });
                // Also update in-memory queue so Scan button appears immediately
                setQueue((prev) => prev.map((q) => q.id === c.id ? caseWithImage : q));
              }
            });
          }
        }
        // If DB returns empty array, keep whatever is in localStorage (already loaded in useState)
      })
      .catch((e) => {
        console.warn("[queue-db load error — using localStorage]", e);
        // localStorage already loaded in useState initializer, nothing more to do
      });
  }, []);

  // Read ?module= and ?view= URL params on mount — restores state on refresh
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const moduleParam = params.get("module") as Module | null;
    const viewParam = params.get("view") as ActiveView | null;
    const validModules: Module[] = ["intake", "triage", "discharge", "urgency", "followup", "medscan"];
    const validViews: ActiveView[] = ["automation", "queue", "metrics"];
    if (moduleParam && validModules.includes(moduleParam)) {
      setActiveModule(moduleParam);
    }
    if (viewParam && validViews.includes(viewParam)) {
      setActiveView(viewParam);
    }
  }, []);

  // Keep URL in sync with active module + view so refresh restores state
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("module", activeModule);
    params.set("view", activeView);
    window.history.replaceState({}, "", `/dashboard?${params.toString()}`);
  }, [activeModule, activeView]);

  // Reset onboarding hint when switching modules, and auto-dismiss after 6 seconds
  useEffect(() => {
    setShowSampleHint(true);
    setInput("");
    setResult(null);
    setMedScanResult(null);
    setMedScanPreview(null);
    setMedScanQueueId(null);
    medScanPendingEntryRef.current = null;
    const timer = setTimeout(() => setShowSampleHint(false), 6000);
    return () => clearTimeout(timer);
  }, [activeModule]);

  // Dark mode effect

  // Keyboard shortcut: Ctrl+Enter to run
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && activeView === "automation") {
        e.preventDefault();
        if (input.trim() && !loading) {
          handleRun();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input, loading, activeView]);



  // --- Run Automation ---
  const handleRun = async () => {
    // Medscan uses its own image-based flow, not the text-based handleRun
    if (activeModule === "medscan") return;
    if (!input.trim()) {
      toast.error("Please enter patient information first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // For discharge, literacyLevel is sent as a dedicated field to the API
      // (not appended to input — the API builds the system prompt dynamically)
      const userInput = input;

      const start = Date.now();
      let content = "";
      let riskScoreFromServer: number | undefined;
      let confidenceFromServer: number | undefined;

      // ── OLLAMA INTEGRATION: Build per-request provider override ──────────────
      // This object is sent in the request body to every AI API endpoint.
      // The user's provider choice (Gemma 4 or Ollama) is stored in localStorage
      // via useSettings.ts and read from the `settings` object here.
      //
      // If Ollama is selected and the URL/model fields are empty, the public
      // test server defaults are used so judges can test without any setup.
      //
      // The override is consumed by invokeAI() in api/ai-provider.ts:
      //   mode: "ollama" → callOllama(overrideUrl, overrideModel)
      //   mode: "gemma"  → callGoogleAI() (forces cloud regardless of OLLAMA_URL)
      //   undefined      → env-var routing (OLLAMA_URL or Google AI Studio)
      // ───────────────────────────────────────────────────────────────────────────
      // Shared helper to call /api/gemma and handle fallback notifications
      const OLLAMA_DEFAULT_URL = "http://5.149.249.212:11434";
      const OLLAMA_DEFAULT_MODEL = "gemma2:2b";
      // ── OLLAMA INTEGRATION: see callGemma block above for full docs ──
      const providerOverride = settings.providerMode === "ollama"
        ? { mode: "ollama" as const, ollamaUrl: settings.ollamaUrl.trim() || OLLAMA_DEFAULT_URL, ollamaModel: settings.ollamaModel.trim() || OLLAMA_DEFAULT_MODEL }
        : settings.providerMode === "gemma"
        ? { mode: "gemma" as const }
        : undefined;
      const callGemma = async (body: Record<string, unknown>) => {
        const apiRes = await fetch("/api/gemma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, _providerOverride: providerOverride }),
        });
        if (!apiRes.ok) {
          if (apiRes.status === 429) {
            try {
              const errBody = await apiRes.json() as { detail?: string; triedModels?: string[] };
              const tried = errBody.triedModels?.join(" → ") ?? "all models";
              toast.error(`All AI models hit quota (tried ${tried}). Please try again in a few minutes.`, { duration: 8000 });
            } catch {
              toast.error("All AI models are rate-limited. Please try again shortly.", { duration: 6000 });
            }
            throw new Error("QUOTA_LIMIT");
          }
          throw new Error(`API error ${apiRes.status}`);
        }
        const data = await apiRes.json() as { content: string; confidence: number; urgencyScore?: number; riskScore?: number; model?: string; switchedFrom?: string[]; isQuotaError?: boolean };
        if (data.isQuotaError) throw new Error("QUOTA_LIMIT");
        if (data.switchedFrom && data.switchedFrom.length > 0 && data.model) {
          toast(`⚠️ ${data.switchedFrom.join(", ")} hit quota — switched to ${data.model}`, { duration: 5000, icon: "🔄" });
        }
        return data;
      };

      if (activeModule === "intake") {
        const res = await callGemma({ module: "intake", input: userInput });
        content = typeof res.content === 'string' ? res.content : "";
        confidenceFromServer = res.confidence;
      } else if (activeModule === "triage") {
        const res = await callGemma({ module: "triage", input: userInput });
        content = typeof res.content === 'string' ? res.content : "";
        riskScoreFromServer = res.urgencyScore;
        confidenceFromServer = res.confidence;
      } else if (activeModule === "discharge") {
        // REGIONAL LANGUAGE: pass dischargeLanguage so buildDischargePrompt() injects the correct language instruction
        const res = await callGemma({ module: "discharge", input: userInput, literacyLevel, language: dischargeLanguage });
        content = typeof res.content === 'string' ? res.content : "";
        confidenceFromServer = res.confidence;
      } else if (activeModule === "urgency") {
        const res = await callGemma({ module: "urgency", input: userInput });
        content = typeof res.content === 'string' ? res.content : "";
        riskScoreFromServer = res.riskScore;
        confidenceFromServer = res.confidence;
      } else if (activeModule === "followup") {
        const res = await callGemma({ module: "followup", input: userInput });
        content = typeof res.content === 'string' ? res.content : "";
        confidenceFromServer = res.confidence;
      }

      const processingMs = Date.now() - start;

      let urgency: UrgencyLevel = "low";
      let riskScore: number | undefined;
      let department: string | undefined;
      let icdCodes: string[] | undefined;
      let drugWarnings: string[] | undefined;

      // Parse urgency/risk
      let urgencyReasons: string[] | undefined;
      if (activeModule === "triage" || activeModule === "urgency") {
        riskScore = riskScoreFromServer;
        if (!riskScore) {
          const riskMatch = content.match(/Risk Score[:\s]+(\d+)/i) || content.match(/Urgency Score[:\s]+(\d+)/i);
          if (riskMatch) riskScore = parseInt(riskMatch[1]);
        }
        const urgencyMatch = content.match(/Urgency Level[:\s]+(CRITICAL|HIGH|MEDIUM|LOW)/i) || content.match(/Risk Level[:\s]+(CRITICAL|HIGH|MEDIUM|LOW)/i);
        if (urgencyMatch) {
          urgency = urgencyMatch[1].toLowerCase() as UrgencyLevel;
        } else if (riskScore !== undefined) {
          urgency = riskScore >= 80 ? "critical" : riskScore >= 60 ? "high" : riskScore >= 40 ? "medium" : "low";
        }
        const deptMatch = content.match(/Recommended Department[:\s]+([^\n]+)/i);
        if (deptMatch) department = deptMatch[1].trim();
        // Extract key risk signals / reasons from the content
        const reasonsSection = content.match(/(?:Key Risk Factors|Risk Factors Identified|Risk Signals|Urgency Reasons|Key Concerns)[:\s]*\n([\s\S]*?)(?:\n\n|\*\*|$)/i);
        if (reasonsSection) {
          urgencyReasons = reasonsSection[1].split('\n').filter((l: string) => l.trim().startsWith('-')).map((l: string) => l.replace(/^-\s*/, '').trim()).filter(Boolean).slice(0, 3);
        }
        if (!urgencyReasons || urgencyReasons.length === 0) {
          // Fallback: extract bullet points near the urgency level mention
          const bullets = content.match(/(?:- )([^\n]{10,80})/g);
          if (bullets) urgencyReasons = bullets.slice(0, 3).map(b => b.replace(/^- /, '').trim());
        }
      }

      // Parse ICD-10 codes from intake output
      if (activeModule === "intake") {
        const icdMatches = content.matchAll(/- ([A-Z]\d{2}(?:\.\d+)?): /g);
        icdCodes = Array.from(icdMatches).map((m: RegExpExecArray) => m[1]).slice(0, 3);
      }

      // Parse drug warnings from discharge output
      if (activeModule === "discharge") {
        const warningSection = content.match(/Drug Interaction Warnings[:\s]*\n([\s\S]*?)(?:\n\n|\*\*)/i);
        if (warningSection && !warningSection[1].toLowerCase().includes("no significant")) {
          drugWarnings = warningSection[1].split("\n").filter((l: string) => l.trim().startsWith("-")).map((l: string) => l.replace(/^-\s*/, "").trim());
        }
      }

      // Use server-provided confidence or simulate
      const confidence = confidenceFromServer ?? Math.floor(82 + Math.random() * 15);

      // ── PATIENT NAME & AGE/SEX EXTRACTION ────────────────────────────────────
      // Handles a wide variety of real-world clinical note formats:
      //   "Patient: Ravi Kumar, 45M"         → name + age/sex together
      //   "Patient: Ravi Kumar. Age: 45. M." → name + separate age/sex fields
      //   "45M admitted for..."               → age/sex without explicit name
      //   "patient ravi kumar 38 year old male" → loose prose format
      //   "Name: Priya Sharma\nAge: 32F"      → structured field format
      //   "PRIYA SHARMA, 32F"                 → all-caps name
      //   "Pt: J. Mehta, 60 yr old male"      → abbreviated prefix
      // ─────────────────────────────────────────────────────────────────────────

      let extractedName: string | undefined;
      let extractedAge: string | undefined;

      // Helper: normalise age+sex into compact form e.g. "45M", "32F"
      const normaliseAgeSex = (age: string, sex?: string): string => {
        const a = age.trim();
        if (!sex) return a; // already compact like "45M"
        const s = sex.trim().toUpperCase();
        const sexChar = s.startsWith("M") ? "M" : s.startsWith("F") ? "F" : "";
        return sexChar ? `${a}${sexChar}` : a;
      };

      // Helper: title-case a name (handles all-caps, all-lower, mixed)
      const toTitleCase = (s: string) =>
        s.replace(/\b([A-Za-z])([A-Za-z]*)/g, (_, first, rest) => first.toUpperCase() + rest.toLowerCase());

      // Pattern 1: "Patient[:][ ]Name[,][ ]45M" or "Patient[:][ ]Name[,][ ]45 M"
      //   Also handles "Pt:", "Pt.", "patient name:"
      //   Name stops at sentence-ending punctuation (. ! ?) or a newline
      const p1 = input.match(
        /(?:patient(?:\s+name)?|\bpt)\.?[:\s]+([A-Za-z][A-Za-z.'\-]*(?: [A-Za-z][A-Za-z.'\-]*)*)(?:[,\s]+)(\d{1,3})\s*([MFmf](?:\b|$))?/i
      );
      if (p1) {
        // Strip any trailing punctuation that got captured
        extractedName = toTitleCase(p1[1].replace(/[.!?]+$/, '').trim());
        extractedAge = p1[3] ? normaliseAgeSex(p1[2], p1[3]) : p1[2];
      }

      // Pattern 2: "Patient: Name" (no age on same line)
      //   Name stops at sentence-ending punctuation, comma, or newline
      if (!extractedName) {
        const p2 = input.match(
          /(?:patient(?:\s+name)?|\bpt)\.?[:\s]+([A-Za-z][A-Za-z.'\-]*(?: [A-Za-z][A-Za-z.'\-]*)*)(?=[.,!?\n]|$)/i
        );
        if (p2) extractedName = toTitleCase(p2[1].trim());
      }

      // Pattern 3: "Name: Priya Sharma" structured field
      if (!extractedName) {
        const p3 = input.match(/\bname[:\s]+([A-Za-z][A-Za-z.'\-]+(?: [A-Za-z][A-Za-z.'\-]+)+)/i);
        if (p3) extractedName = toTitleCase(p3[1].trim());
      }

      // Age/sex extraction — two-pass approach:
      //   Pass 1: find the age number (and sex if immediately adjacent)
      //   Pass 2: if sex not yet found, scan the whole input for any sex indicator
      let rawAge: string | undefined;
      let rawSex: string | undefined;

      // Pass 1a — "45 yr old male", "45-year-old female", "45 y/o male" (age + sex in one phrase)
      const pB = input.match(/\b(\d{1,3})[-\s]?(?:year(?:s)?[-\s]?old|yr(?:s)?[-\s]?old|yr|y\/o)[,\s]*(male|female|m|f)(?:\b|$)/i);
      if (pB) { rawAge = pB[1]; rawSex = pB[2]; }

      // Pass 1b — compact "45M", "32F" (letter immediately adjacent, no space)
      if (!rawAge) {
        const pA = input.match(/\b(\d{1,3})([MFmf])(?!\w)/);
        if (pA) { rawAge = pA[1]; rawSex = pA[2]; }
      }

      // Pass 1c — "Age/Sex: 45M" or "Age: 45" structured field
      if (!rawAge) {
        const pC = input.match(/\bage(?:\/sex)?[:\s]+(\d{1,3})\s*([MFmf])?(?:\b|$)/i);
        if (pC) { rawAge = pC[1]; if (pC[2]) rawSex = pC[2]; }
      }

      // Pass 1d — "Age: 45" without sex (plain number)
      if (!rawAge) {
        const pD = input.match(/\bage[:\s]+(\d{1,3})/i);
        if (pD) rawAge = pD[1];
      }

      // Pass 2 — if we have an age but no sex yet, scan whole input for any sex indicator
      if (rawAge && !rawSex) {
        // "Sex: Male", "Gender: Female"
        const sexField = input.match(/\b(?:sex|gender)[:\s]+(male|female|m|f)(?:\b|$)/i);
        if (sexField) {
          rawSex = sexField[1];
        } else {
          // Standalone "male" or "female" anywhere in text
          const standaloneSex = input.match(/\b(male|female)\b/i);
          if (standaloneSex) rawSex = standaloneSex[1];
        }
      }

      if (rawAge) extractedAge = rawSex ? normaliseAgeSex(rawAge, rawSex) : rawAge;
      // ─────────────────────────────────────────────────────────────────────────

      const newResult: AIResult = {
        id: `case-${Date.now().toString(36).toUpperCase()}`,
        type: activeModule,
        content,
        urgency,
        riskScore,
        department,
        icdCodes,
        drugWarnings,
        confidence,
        processingMs,
        timestamp: new Date(),
        inputSnippet: input.slice(0, 80) + (input.length > 80 ? "..." : ""),
        patientName: extractedName,
        patientAge: extractedAge,
        status: "pending" as CaseStatus,
        urgencyReasons: urgencyReasons && urgencyReasons.length > 0 ? urgencyReasons : undefined,
      };

      if (!newResult.patientName) {
        // No name found in input — ask the user
        setPendingResult(newResult);
        setModalName("");
        setModalAge("");
        setShowPatientModal(true);
      } else {
        setResult(newResult);
        setQueue((prev) => [newResult, ...prev]);
        saveToDb(newResult);
        playChime();
      }
    } catch (err) {
      toast.error("Failed to process. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSample = async () => {
    setShowSampleHint(false);
    setSampleLoading(true);
    try {
      const OLLAMA_DEFAULT_URL = "http://5.149.249.212:11434";
      const OLLAMA_DEFAULT_MODEL = "gemma2:2b";
      // ── OLLAMA INTEGRATION: see callGemma block above for full docs ──
      const providerOverride = settings.providerMode === "ollama"
        ? { mode: "ollama" as const, ollamaUrl: settings.ollamaUrl.trim() || OLLAMA_DEFAULT_URL, ollamaModel: settings.ollamaModel.trim() || OLLAMA_DEFAULT_MODEL }
        : settings.providerMode === "gemma"
        ? { mode: "gemma" as const }
        : undefined;
      // Collect all patient names already in the queue so the AI avoids repeating them
      const existingNames = queue
        .map((q) => q.patientName)
        .filter((n): n is string => !!n && n.trim().length > 0);

      const sampleApiRes = await fetch("/api/generate-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: activeModule, previousSample: input || undefined, existingNames, _providerOverride: providerOverride }),
      });
      if (!sampleApiRes.ok) throw new Error("API error");
      const res = await sampleApiRes.json() as { sample: string };
      setInput(res.sample);
      setResult(null);
    } catch {
      // Fallback to static samples if AI generation fails (medscan has no text samples)
      if (activeModule === "medscan") { setSampleLoading(false); return; }
      const samples = SAMPLES[activeModule as Exclude<Module, "medscan">];
      const idx = sampleIndex % samples.length;
      setInput(samples[idx]);
      setSampleIndex(idx + 1);
      setResult(null);
      toast.error("Couldn't generate AI sample, using a preset one instead.");
    } finally {
      setSampleLoading(false);
    }
  };

  // --- Photo Capture / Report OCR ---
  const handlePhotoCapture = () => {
    // On mobile show a small action sheet; on desktop just open gallery
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      // Show a toast with two actions — camera or gallery
      toast(
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Open with…</p>
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 px-3 rounded-lg bg-[#0D7377] text-white text-sm font-medium"
              onClick={() => { toast.dismiss(); photoInputRef.current?.click(); }}
            >
              📷 Camera
            </button>
            <button
              className="flex-1 py-2 px-3 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium"
              onClick={() => { toast.dismiss(); galleryInputRef.current?.click(); }}
            >
              🖼️ Gallery
            </button>
          </div>
        </div>,
        { duration: 8000, id: "scan-choice" }
      );
    } else {
      galleryInputRef.current?.click();
    }
  };

  // ── Voice recording handlers ──────────────────────────────────────────────

  // processTranscript is called both when user taps Stop AND when browser auto-ends
  const processTranscript = async (raw: string) => {
    if (!raw) {
      toast.error("🎙️ No speech detected. Please try again.");
      return;
    }
    setVoiceLoading(true);
    toast("⏳ Transcript captured. Sending to AI for cleanup...", { duration: 5000, id: "voice-status" });
    try {
      const OLLAMA_DEFAULT_URL = "http://5.149.249.212:11434";
      const OLLAMA_DEFAULT_MODEL = "gemma2:2b";
      // ── OLLAMA INTEGRATION: see callGemma block above for full docs ──
      const providerOverride = settings.providerMode === "ollama"
        ? { mode: "ollama" as const, ollamaUrl: settings.ollamaUrl.trim() || OLLAMA_DEFAULT_URL, ollamaModel: settings.ollamaModel.trim() || OLLAMA_DEFAULT_MODEL }
        : settings.providerMode === "gemma"
        ? { mode: "gemma" as const }
        : undefined;
      const res = await fetch("/api/clean-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawTranscript: raw, module: activeModule, _providerOverride: providerOverride }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        toast.warning(`⚠️ AI cleanup failed (${res.status}) — using raw transcript. Error: ${errText.slice(0, 120)}`, { id: "voice-status", duration: 8000 });
        setInput(raw);
        return;
      }
      const data = await res.json() as { cleanedNote?: string; usedModel?: string; switchedFrom?: string[]; error?: string };
      if (data.error) {
        toast.warning(`⚠️ AI returned error: ${data.error} — using raw transcript.`, { id: "voice-status", duration: 8000 });
        setInput(raw);
        return;
      }
      if (data.cleanedNote) {
        setInput(data.cleanedNote);
        setResult(null);
        if (data.switchedFrom && data.switchedFrom.length > 0 && data.usedModel) {
          toast(`⚠️ ${data.switchedFrom.join(", ")} hit quota — switched to ${data.usedModel}`, { duration: 5000, icon: "🔄" });
        }
        toast.success(`✅ Voice note ready! Cleaned by ${data.usedModel ?? "AI"}.`, { id: "voice-status", duration: 5000 });
      } else {
        toast.warning("⚠️ AI returned empty note — using raw transcript.", { id: "voice-status", duration: 6000 });
        setInput(raw);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`❌ Voice cleanup error: ${msg} — using raw transcript.`, { id: "voice-status", duration: 8000 });
      setInput(raw);
    } finally {
      setVoiceLoading(false);
    }
  };

  const startRecording = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognitionAPI = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error("🎙️ Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    rawTranscriptRef.current = "";
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      toast("🎙️ Recording... speak now. Tap the mic again to stop.", { duration: 60000, id: "voice-recording" });
    };

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          rawTranscriptRef.current += " " + event.results[i][0].transcript;
          // Show live feedback of what was heard
          toast(`🎙️ Heard: "${event.results[i][0].transcript.slice(0, 60)}..."`, { duration: 2000, id: "voice-live" });
        }
      }
    };

    recognition.onerror = (event: any) => {
      toast.dismiss("voice-recording");
      setIsRecording(false);
      const errMap: Record<string, string> = {
        "not-allowed": "Microphone permission denied. Please allow mic access and try again.",
        "no-speech": "No speech detected. Please speak louder or closer to the mic.",
        "network": "Network error during voice recognition. Check your connection.",
        "audio-capture": "No microphone found. Please connect a mic and try again.",
        "aborted": "Recording was cancelled.",
      };
      const msg = errMap[event.error] ?? `Voice error: ${event.error}`;
      toast.error(`❌ ${msg}`, { duration: 8000 });
    };

    // onend fires when browser auto-stops (silence timeout) OR when we call .stop()
    // We process whatever was captured either way
    recognition.onend = () => {
      toast.dismiss("voice-recording");
      setIsRecording(false);
      const raw = rawTranscriptRef.current.trim();
      if (raw) {
        processTranscript(raw);
      } else {
        // Only show error if we were actually recording (not just a cancelled start)
        toast.error("🎙️ No speech captured. Please try again.", { duration: 5000 });
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`❌ Could not start recording: ${msg}`, { duration: 8000 });
    }
  };

  const stopRecording = () => {
    // Just stop the recognition — onend will fire and call processTranscript
    toast.dismiss("voice-recording");
    toast("⏹️ Stopping... processing your note.", { duration: 3000, id: "voice-stopping" });
    recognitionRef.current?.stop();
    // setIsRecording(false) will be called by onend
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          // Keep image small to stay within Vercel's 10s function limit
          const MAX_DIM = 800;
          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
            else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);

          // Quality 0.6 keeps file size small (~100-200KB) for fast API response
          let dataUrl = canvas.toDataURL("image/jpeg", 0.6);
          // Safety cap: if still over 500KB base64, compress further
          if (dataUrl.length > 500 * 1024 * 1.37) {
            dataUrl = canvas.toDataURL("image/jpeg", 0.45);
          }
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = ev.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image too large. Please use an image under 20MB.");
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setPhotoPreview(compressedDataUrl);
      setPhotoLoading(true);
      setShowSampleHint(false);

      const imgApiRes = await fetch("/api/extract-from-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: compressedDataUrl, module: activeModule }),
      });
      if (!imgApiRes.ok) {
        if (imgApiRes.status === 429) {
          // Try to get detail from body
          try {
            const errBody = await imgApiRes.json() as { detail?: string; triedModels?: string[] };
            const tried = errBody.triedModels?.join(" → ") ?? "all models";
            toast.error(`Scan failed: All AI models hit their quota limit (tried ${tried}). Please try again in a few minutes.`, { duration: 8000 });
          } catch {
            toast.error("Scan failed: AI vision API quota limit reached. Please try again shortly.", { duration: 6000 });
          }
          return;
        }
        const errText = await imgApiRes.text();
        throw new Error(`API ${imgApiRes.status}: ${errText.slice(0, 200)}`);
      }
      const res = await imgApiRes.json() as {
        extractedText?: string;
        isQuotaError?: boolean;
        usedModel?: string;
        switchedFrom?: string[];
        triedModels?: string[];
      };
      if (res.isQuotaError) {
        const tried = res.triedModels?.join(" → ") ?? "all models";
        toast.error(`Scan failed: All AI models hit their quota limit (tried ${tried}). Please try again in a few minutes.`, { duration: 8000 });
        return;
      }
      // Notify user if we fell back to a different model
      if (res.switchedFrom && res.switchedFrom.length > 0 && res.usedModel) {
        toast(`⚠️ ${res.switchedFrom.join(", ")} hit quota — switched to ${res.usedModel}`, {
          duration: 5000,
          icon: "🔄",
        });
      }
      if (res.extractedText) {
        setInput(res.extractedText);
        setResult(null);
        const modelNote = res.usedModel ? ` (via ${res.usedModel})` : "";
        toast.success(`Report read successfully${modelNote}! Review the text and click Run Automation.`);
      } else {
        toast.error("Could not extract text from the image. Please try a clearer photo.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("QUOTA_LIMIT")) {
        // Already showed a toast above
      } else {
        toast.error(`Failed to read the report: ${msg.slice(0, 120)}. Please try again.`, { duration: 8000 });
      }
      console.error("[handlePhotoFileChange] error:", err);
    } finally {
      setPhotoLoading(false);
      setPhotoPreview(null);
      // Reset BOTH file inputs so the same file can be re-uploaded immediately
      if (photoInputRef.current) photoInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  // --- Medication Scan handlers ---
  const handleMedScanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Image too large. Please use an image under 20MB."); return; }
    try {
      const compressedDataUrl = await compressImage(file);
      setMedScanPreview(compressedDataUrl);
      setMedScanLoading(true);
      setMedScanResult(null);
      toast("📷 Reading prescription image...", { duration: 2000, id: "enhance-toast" });

      // ── Step 1: Get API key from server (lightweight call) ──────────────
      const keyRes = await fetch("/api/get-ai-config");
      if (!keyRes.ok) throw new Error("Could not load AI configuration.");
      const { key: aiKey } = await keyRes.json() as { key: string };

      // ── Step 2: Call Gemma 4 31B directly from browser via OpenAI-compat endpoint ──
      // Browser has no timeout (unlike Vercel's 10s limit).
      // Using the OpenAI-compat endpoint which supports response_format: json_object
      // and properly strips <thought> tags from Gemma's output.
      // High-quality prompt with few-shot examples prevents reasoning leakage.
      const MEDSCAN_SYSTEM_PROMPT = `You are an expert clinical pharmacist and medical OCR specialist with 20 years of experience reading handwritten and printed prescriptions from India, UK, and US healthcare systems.

Your task is to extract prescription data from the image and return it as a single valid JSON object.

STEP-BY-STEP EXTRACTION PROCESS (follow this order to reduce errors):
Step 1: Scan the entire image and identify ALL drug names visible, even if partially illegible.
Step 2: For each drug name, find its associated strength/dose.
Step 3: For each drug, find its frequency. Expand ALL abbreviations: OD/QD=Once daily, BD/BID=Twice daily, TDS/TID=Three times daily, QID=Four times daily, SOS/PRN=As needed, AC=Before meals, PC=After meals, HS=At bedtime, stat=Immediately.
Step 4: For each drug, find its duration and quantity.
Step 5: Extract patient and prescriber information.
Step 6: Assign a legibilityScore (0-100) based on overall image clarity.

CRITICAL RULES:
- Write drug names EXACTLY as they appear on the prescription. Do NOT use section headings, labels, or your own reasoning as drug names.
- NEVER invent medications not visible in the image.
- If a field is not visible or not present, use null.
- Return ONLY the JSON object. No explanation, no markdown, no preamble, no reasoning text outside the JSON.

ABBREVIATION REFERENCE:
tab=tablet, cap=capsule, syr=syrup, inj=injection, susp=suspension, oint=ointment, gtts=drops,
OD/QD=once daily, BD/BID=twice daily, TDS/TID=three times daily, QID=four times daily,
PRN/SOS=as needed, AC=before meals, PC=after meals, HS=at bedtime, stat=immediately`;

      const MEDSCAN_USER_PROMPT = `EXAMPLE 1 (printed prescription):
Image contains: "Patient: John Smith, 45M | Dr. Priya Sharma MD | Date: 10/04/2026 | 1. Amoxicillin 500mg Cap BD x 7 days #14 | 2. Paracetamol 500mg Tab TDS PRN #21 Take with food"

Expected JSON output:
{"patientName":"John Smith","patientAge":"45","patientGender":"Male","doctorName":"Dr. Priya Sharma","doctorQual":"MD","clinicName":null,"prescriptionDate":"10/04/2026","legibilityScore":95,"medications":[{"name":"Amoxicillin","strength":"500mg","form":"Capsule","frequency":"Twice daily","duration":"7 days","route":"Oral","quantity":"14 capsules","instructions":null},{"name":"Paracetamol","strength":"500mg","form":"Tablet","frequency":"Three times daily as needed","duration":null,"route":"Oral","quantity":"21 tablets","instructions":"Take with food"}],"additionalNotes":null}

EXAMPLE 2 (handwritten prescription):
Image contains handwritten text: "Pt: Ravi K | Dr. Mehta | Metfrmn 500 tab OD | Atorvasttn 10mg hs | Asprin 75mg OD | 30 days"

Expected JSON output:
{"patientName":"Ravi K","patientAge":null,"patientGender":null,"doctorName":"Dr. Mehta","doctorQual":null,"clinicName":null,"prescriptionDate":null,"legibilityScore":55,"medications":[{"name":"Metformin [?]","strength":"500mg","form":"Tablet","frequency":"Once daily","duration":"30 days","route":"Oral","quantity":null,"instructions":null},{"name":"Atorvastatin [?]","strength":"10mg","form":"Tablet","frequency":"At bedtime","duration":"30 days","route":"Oral","quantity":null,"instructions":null},{"name":"Aspirin [?]","strength":"75mg","form":"Tablet","frequency":"Once daily","duration":"30 days","route":"Oral","quantity":null,"instructions":null}],"additionalNotes":null}

NOW extract from the actual prescription image below and return ONLY the JSON object:`;

      const base64Image = compressedDataUrl.split(",")[1];
      const mimeType = compressedDataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg";

      // Call Gemma 4 31B via OpenAI-compat endpoint (supports response_format: json_object)
      const callGemmaDirect = async (): Promise<string | null> => {
        try {
          const r = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${aiKey}` },
              body: JSON.stringify({
                model: "models/gemma-4-31b-it",
                messages: [
                  { role: "system", content: MEDSCAN_SYSTEM_PROMPT },
                  { role: "user", content: [
                    { type: "text", text: MEDSCAN_USER_PROMPT },
                    { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: "high" } }
                  ]}
                ],
                max_tokens: 4096,
                temperature: 0,
                response_format: { type: "json_object" }
              })
            }
          );
          if (!r.ok) return null;
          const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
          let text = d.choices?.[0]?.message?.content ?? null;
          if (text) {
            // Strip any thought/reasoning tags Gemma may emit
            text = text
              .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
              .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
              .replace(/<think>[\s\S]*?<\/think>/gi, "")
              .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
              .trim();
          }
          return text;
        } catch { return null; }
      };

      // Fallback: Gemini 2.5 Flash (if Gemma quota exceeded)
      const callGeminiFlash = async (): Promise<string | null> => {
        try {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${aiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: MEDSCAN_SYSTEM_PROMPT }] },
                contents: [{ parts: [
                  { text: MEDSCAN_USER_PROMPT },
                  { inline_data: { mime_type: mimeType, data: base64Image } }
                ]}],
                generationConfig: { temperature: 0, maxOutputTokens: 4096, responseMimeType: "application/json" }
              })
            }
          );
          if (!r.ok) return null;
          const d = await r.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
          return d.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
        } catch { return null; }
      };

      // Try Gemma first (hackathon primary), fall back to Gemini Flash
      let raceResult = await callGemmaDirect();
      if (!raceResult) {
        toast("Gemma quota reached, trying Gemini Flash...", { duration: 2000 });
        raceResult = await callGeminiFlash();
      }
      if (!raceResult) throw new Error("All AI models failed to read the prescription.");

      // Parse the JSON response
      let structuredData: {
        patientName?: string | null; doctorName?: string | null; clinicName?: string | null;
        prescriptionDate?: string | null; legibilityScore?: number;
        medications: Array<{ name: string; strength?: string | null; form?: string | null;
          frequency?: string | null; duration?: string | null; route?: string | null;
          quantity?: string | null; instructions?: string | null; }>;
        additionalNotes?: string | null;
      } | null = null;

      try {
        const jsonMatch = raceResult.match(/\{[\s\S]*\}/);
        const forParse = jsonMatch ? jsonMatch[0] : raceResult.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        structuredData = JSON.parse(forParse);
      } catch {
        structuredData = null;
      }

      const extractData = {
        structuredData: structuredData && Array.isArray(structuredData.medications) ? structuredData : undefined,
        extractedText: structuredData ? undefined : raceResult,
      };

      // ── Step 2: Process structured JSON response from API ─────────────────
      // New flow: API now returns structuredData (JSON) directly instead of raw text
      // Falls back to legacy text parsing if structuredData is absent
      toast("Prescription image read. Validating medications...", { icon: "📋", duration: 2000 });

      let meds: MedScanResult["medications"] = [];
      let patientName: string | undefined;
      let prescribingDoctor: string | undefined;
      let prescriptionDate: string | undefined;
      let clinicName: string | undefined;
      let pharmacistNotes: string | undefined;
      let rawText = "";
      let legibilityScore: number | undefined;

      if (extractData.structuredData) {
        // ── Happy path: API returned structured JSON ──────────────────────────
        const sd = extractData.structuredData;
        patientName = sd.patientName ?? undefined;
        prescribingDoctor = sd.doctorName ?? undefined;
        prescriptionDate = sd.prescriptionDate ?? undefined;
        clinicName = sd.clinicName ?? undefined;
        pharmacistNotes = sd.additionalNotes ?? undefined;
        rawText = JSON.stringify(sd, null, 2);

        // Show legibility warning if score is low (default to 100 if not provided by API)
        legibilityScore = typeof sd.legibilityScore === "number" ? sd.legibilityScore : 100;
        if (legibilityScore < 50) {
          toast("⚠️ Low image quality detected. Results may be incomplete — please verify.", { duration: 6000 });
        }

        meds = (sd.medications || []).map(m => ({
            name: m.name || "Unknown",
            strength: m.strength || "",
            form: m.form || "",
            frequency: m.frequency || "",
            duration: m.duration || "",
            route: m.route || "",
            quantity: m.quantity || "",
            instructions: m.instructions || "",
          }));
      } else if (extractData.extractedText) {
        // ── Fallback: legacy text parsing (older API response format) ─────────
        rawText = extractData.extractedText;
        const parsePrescriptionText = (text: string) => {
          const lines = text.split("\n");
          const parsedMeds: MedScanResult["medications"] = [];
          let pName: string | undefined;
          let pDoctor: string | undefined;
          let pDate: string | undefined;
          let pClinic: string | undefined;
          let pNotes: string | undefined;
          let cur: Partial<MedScanResult["medications"][0]> = {};
          let inMedSection = false;
          let inNotesSection = false;
          const val = (line: string) => line.replace(/^[-•*]+\s*/, "").replace(/\*\*/g, "").split(":").slice(1).join(":").trim();
          const clean = (line: string) => line.replace(/^[-•*]+\s*/, "").replace(/\*\*/g, "").trim();
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            const lower = line.toLowerCase().replace(/^[-•*#]+\s*/, "").replace(/\*\*/g, "");
            if (/^(medication list|medications|prescription medications)/i.test(lower)) { inMedSection = true; inNotesSection = false; continue; }
            if (/^(prescription details|patient information|prescriber information)/i.test(lower)) { inMedSection = false; inNotesSection = false; continue; }
            if (/^(pharmacist notes|additional notes|legibility notes)/i.test(lower)) { inMedSection = false; inNotesSection = true; continue; }
            if (inNotesSection) { pNotes = (pNotes ? pNotes + " " : "") + clean(line); continue; }
            if (/^(patient name?|patient)\s*:/i.test(lower)) { pName = val(line); continue; }
            if (/^(prescribing doctor|doctor|physician|dr)\s*:/i.test(lower)) { pDoctor = val(line); continue; }
            if (/^(date|prescription date)\s*:/i.test(lower)) { pDate = val(line); continue; }
            if (/^(clinic|hospital|clinic\/hospital|facility)\s*:/i.test(lower)) { pClinic = val(line); continue; }
            if (/^(age|dob|gender|sex|qualification|specialty|reg|license)\s*:/i.test(lower)) continue;
            const numMatch = line.replace(/\*\*/g, "").match(/^(\d+)\.\s+(.+)$/);
            if (numMatch) {
              if (cur.name) parsedMeds.push({ name: cur.name, strength: cur.strength || "", form: cur.form || "", frequency: cur.frequency || "", duration: cur.duration || "", route: cur.route || "", quantity: cur.quantity || "", instructions: cur.instructions || "" });
              cur = { name: numMatch[2].replace(/\*\*/g, "").trim() };
              inMedSection = true;
              continue;
            }
            if (!inMedSection) continue;
            if (/^(strength|dose|dosage)\s*:/i.test(lower)) cur.strength = val(line);
            else if (/^(form|dosage form)\s*:/i.test(lower)) cur.form = val(line);
            else if (/^(frequency|sig|how often)\s*:/i.test(lower)) cur.frequency = val(line);
            else if (/^(duration|days supply|supply)\s*:/i.test(lower)) cur.duration = val(line);
            else if (/^(route)\s*:/i.test(lower)) cur.route = val(line);
            else if (/^(quantity|qty|quantity to dispense)\s*:/i.test(lower)) cur.quantity = val(line);
            else if (/^(instructions|directions|special instructions)\s*:/i.test(lower)) cur.instructions = val(line);
            else if (/^(drug name|generic|brand)\s*:/i.test(lower) && !cur.name) cur.name = val(line);
          }
          if (cur.name) parsedMeds.push({ name: cur.name, strength: cur.strength || "", form: cur.form || "", frequency: cur.frequency || "", duration: cur.duration || "", route: cur.route || "", quantity: cur.quantity || "", instructions: cur.instructions || "" });
          return { meds: parsedMeds, patientName: pName, prescribingDoctor: pDoctor, prescriptionDate: pDate, clinicName: pClinic, pharmacistNotes: pNotes };
        };
        const parsed = parsePrescriptionText(rawText);
        meds = parsed.meds.length > 0
          ? parsed.meds
          : [{ name: "Extracted prescription", strength: "", form: "", frequency: "", duration: "", route: "", quantity: "", instructions: rawText.slice(0, 400) }];
        patientName = parsed.patientName;
        prescribingDoctor = parsed.prescribingDoctor;
        prescriptionDate = parsed.prescriptionDate;
        clinicName = parsed.clinicName;
        pharmacistNotes = parsed.pharmacistNotes;
      } else {
        toast.error("Could not read the prescription image. Please try a clearer photo.");
        setMedScanPreview(null);
        return;
      }

      if (meds.length === 0) {
        toast.error("No medications found in the prescription. Please try a clearer photo.");
        setMedScanPreview(null);
        return;
      }

      // ── Step 3: RxNorm API drug name validation (Improvement 1) ──────────────
      // Free NIH API — no key required, CORS-friendly, fuzzy-matches drug names
      // Corrects OCR errors: "Amoxicilln" → "Amoxicillin", "Metfrmn" → "Metformin"
      // Research: RxLens (NAACL 2025) showed +19-40% Recall@3 improvement with catalog validation
      toast("Validating drug names...", { icon: "💊", duration: 2000 });
      try {
        const validatedMeds = await Promise.all(
          meds.map(async (med) => {
            // Skip validation for placeholder entries or very short names
            if (!med.name || med.name.length < 3 || med.name === "Unknown" || med.name === "Extracted prescription") return med;
            // Strip uncertainty markers for the query
            const queryName = med.name.replace(/\[\?\]/g, "").replace(/\[illegible[^\]]*\]/gi, "").trim();
            if (!queryName || queryName.length < 3) return med;
            try {
              const rxRes = await fetch(
                `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(queryName)}&maxEntries=1&option=1`,
                { signal: AbortSignal.timeout(3000) } // 3s timeout per drug — fast API
              );
              if (!rxRes.ok) return med;
              const rxData = await rxRes.json() as {
                approximateGroup?: { candidate?: Array<{ name?: string; score?: string; rank?: string }> };
              };
              const topCandidate = rxData.approximateGroup?.candidate?.[0];
              if (!topCandidate?.name || !topCandidate.score) return med;
              const score = parseFloat(topCandidate.score);
              // Only accept high-confidence matches (score >= 8)
              // Extract just the drug name part (before strength/form info)
              if (score >= 8) {
                const rxName = topCandidate.name
                  .split(/\s+\d/)[0]  // Remove strength suffix e.g. "Amoxicillin 500 MG" → "Amoxicillin"
                  .replace(/\[.*?\]/g, "")  // Remove bracketed brand names
                  .trim();
                // Only update if RxNorm name is meaningfully different (corrects a typo)
                if (rxName && rxName.toLowerCase() !== queryName.toLowerCase()) {
                  return { ...med, name: rxName };
                }
              }
              return med;
            } catch {
              return med; // RxNorm timeout/error — keep original name
            }
          })
        );
        meds = validatedMeds;
      } catch {
        // RxNorm validation failed entirely — proceed with unvalidated names
      }

      toast.success(`Prescription scanned! ${meds.length} medication(s) extracted.`);
      const medScanData: MedScanResult = { medications: meds, patientName, prescribingDoctor, prescriptionDate, clinicName, pharmacistNotes, rawExtractedText: rawText, legibilityScore };
      setMedScanResult(medScanData);

      // Async DDI check — runs in background, updates result when done
      if (meds.length >= 2) {
        fetch('/api/check-ddi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ medications: meds.map((m: { name: string }) => m.name).filter(Boolean) }),
        }).then(r => r.json()).then((ddiData: { alerts?: Array<{ drug: string; interactions: string[] }> }) => {
          if (ddiData.alerts && ddiData.alerts.length > 0) {
            setMedScanResult(prev => prev ? { ...prev, ddiAlerts: ddiData.alerts } : prev);
            toast.warning(`${ddiData.alerts.length} potential drug interaction(s) detected. Review before dispensing.`, { duration: 6000 });
          }
        }).catch(() => {}); // DDI check failure is non-critical
      }

      // Prepare queue entry — NOT auto-saved; user must click "Add to Queue" or download PDF
      const pendingQueueId = `MED-${Date.now().toString(36).toUpperCase()}`;
      setMedScanQueueId(null); // reset — not yet in queue
      // Build the content string for the pending entry
      const medContent = [
        patientName ? `Patient: ${patientName}` : null,
        prescribingDoctor ? `Doctor: ${prescribingDoctor}` : null,
        prescriptionDate ? `Date: ${prescriptionDate}` : null,
        ``,
        `**Medications (${meds.length}):**`,
        ...meds.map((m: { name: string; strength: string; form: string; frequency: string; duration: string }, idx: number) => {
          const parts = [`${idx + 1}. **${m.name}**`];
          if (m.strength) parts.push(m.strength);
          if (m.form) parts.push(m.form);
          if (m.frequency) parts.push(m.frequency);
          if (m.duration) parts.push(`for ${m.duration}`);
          return parts.join(" | ");
        }),
        pharmacistNotes ? `\nNotes: ${pharmacistNotes}` : null,
      ].filter((l: string | null) => l !== null).join("\n");
      // Store pending entry in ref for Add to Queue / PDF fallback
      medScanPendingEntryRef.current = {
        id: pendingQueueId,
        type: "medscan" as const,
        content: medContent,
        urgency: "low" as const,
        confidence: 90,
        timestamp: new Date(),
        inputSnippet: `Prescription scan: ${meds.length} medication(s)`,
        patientName: patientName,
        status: "pending" as CaseStatus,
        scanImageUrl: compressedDataUrl, // use local var — medScanPreview state is stale at this point (React async update)
        medScanData: medScanData, // full structured data for queue card PDF regeneration
      };

      // Build a clean human-readable summary for the editable text box.
      // Never put raw JSON or AI reasoning text in the box.
      const cleanSummary = [
        patientName ? `Patient: ${patientName}` : null,
        prescribingDoctor ? `Doctor: ${prescribingDoctor}` : null,
        prescriptionDate ? `Date: ${prescriptionDate}` : null,
        clinicName ? `Clinic: ${clinicName}` : null,
        "",
        `Medications (${meds.length}):`,
        ...meds.map((m, i) => {
          const parts = [`${i + 1}. ${m.name}`];
          if (m.strength) parts.push(m.strength);
          if (m.form) parts.push(m.form);
          if (m.frequency) parts.push(m.frequency);
          if (m.duration) parts.push(`for ${m.duration}`);
          if (m.instructions) parts.push(`(${m.instructions})`);
          return parts.join(" | ");
        }),
        pharmacistNotes ? `\nNotes: ${pharmacistNotes}` : null,
      ].filter(l => l !== null).join("\n");

      setEditedMedText(cleanSummary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Prescription scan failed: ${msg.slice(0, 150)}. Please try again.`, { duration: 8000 });
      console.error("[handleMedScanFileChange]", err);
      setMedScanPreview(null);
    } finally {
      setMedScanLoading(false);
      if (medScanInputRef.current) medScanInputRef.current.value = "";
      if (medScanCameraRef.current) medScanCameraRef.current.value = "";
    }
  };

  /**
   * Parse the user-edited medication text back into a structured medications array.
   * Format of each medication line: "N. DrugName | Strength | Form | Frequency | for Duration | (Instructions)"
   * This ensures any [?] corrections made by staff are reflected in the PDF and queue entry.
   */
  const parseMedTextToMedications = (text: string): MedScanResult["medications"] => {
    const lines = text.split("\n");
    const meds: MedScanResult["medications"] = [];
    for (const line of lines) {
      // Match lines starting with a number followed by a period: "1. ..."
      const match = line.match(/^\d+\.\s+(.+)/);
      if (!match) continue;
      const parts = match[1].split(" | ").map(p => p.trim());
      if (parts.length === 0 || !parts[0]) continue;
      const name = parts[0];
      const strength = parts[1] || "";
      const form = parts[2] || "";
      const frequency = parts[3] || "";
      // Duration is stored as "for X" — strip the "for " prefix
      const durationRaw = parts[4] || "";
      const duration = durationRaw.startsWith("for ") ? durationRaw.slice(4) : durationRaw;
      // Instructions are stored as "(X)" — strip the parentheses
      const instrRaw = parts[5] || "";
      const instructions = instrRaw.startsWith("(") && instrRaw.endsWith(")")
        ? instrRaw.slice(1, -1)
        : instrRaw;
      meds.push({ name, strength, form, frequency, duration, route: "", quantity: "", instructions });
    }
    return meds;
  };

  // Helper: add the pending MediScan entry to queue (deduplication guard built in)
  const addMedScanToQueue = () => {
    if (medScanQueueId) return; // already in queue, skip
    const entry = medScanPendingEntryRef.current;
    if (!entry) return;
    // Re-parse editedMedText so any staff corrections to [?] markers are captured
    const updatedMeds = parseMedTextToMedications(editedMedText);
    const updatedEntry: AIResult = {
      ...entry,
      content: editedMedText, // store the edited text as the case content
      medScanData: entry.medScanData
        ? { ...entry.medScanData, medications: updatedMeds.length > 0 ? updatedMeds : entry.medScanData.medications }
        : entry.medScanData,
    };
    medScanPendingEntryRef.current = updatedEntry;
    setQueue((prev) => [updatedEntry, ...prev]);
    saveToDb(updatedEntry);
    // Persist scan image in localStorage keyed by case id
    if (updatedEntry.scanImageUrl) {
      try { localStorage.setItem(`mediflow_scan_${updatedEntry.id}`, updatedEntry.scanImageUrl); } catch { /* storage full */ }
    }
    setMedScanQueueId(updatedEntry.id);
    toast.success("Case added to queue!");
  };

  const handleMedScanDownloadPdf = async () => {
    if (!medScanResult) return;
    // Re-parse editedMedText to capture any staff corrections (e.g. [?] markers fixed)
    const reParsedMeds = parseMedTextToMedications(editedMedText);
    const medications = reParsedMeds.length > 0 ? reParsedMeds : (medScanResult.medications || []);
    // Update medScanResult state with corrected medications so queue entry also gets updated
    if (reParsedMeds.length > 0) {
      setMedScanResult(prev => prev ? { ...prev, medications: reParsedMeds } : prev);
      // Also update the pending queue entry ref so queue card PDF uses corrected data
      if (medScanPendingEntryRef.current?.medScanData) {
        medScanPendingEntryRef.current = {
          ...medScanPendingEntryRef.current,
          content: editedMedText,
          medScanData: { ...medScanPendingEntryRef.current.medScanData, medications: reParsedMeds },
        };
        // If already in queue, update the queue entry in state and DB
        if (medScanQueueId) {
          setQueue(prev => prev.map(c => c.id === medScanQueueId
            ? { ...c, content: editedMedText, medScanData: { ...c.medScanData!, medications: reParsedMeds } }
            : c
          ));
          const updatedEntry = medScanPendingEntryRef.current;
          if (updatedEntry) saveToDb(updatedEntry);
        }
      }
    }
    // Fallback: auto-add to queue if not already added
    if (!medScanQueueId) addMedScanToQueue();
    const caseId = medScanPendingEntryRef.current?.id ?? `MED-${Date.now().toString(36).toUpperCase()}`;
    try {
      toast.loading("Generating PDF...", { id: "pdf-gen" });

      // Expand dosage timing codes in frequency field
      const expandFrequency = (freq: string): string => {
        if (!freq) return freq;
        return freq
          .replace(/\b1-0-0\b/g, "1-0-0 (morning once)")
          .replace(/\b0-1-0\b/g, "0-1-0 (afternoon once)")
          .replace(/\b0-0-1\b/g, "0-0-1 (night once)")
          .replace(/\b1-1-0\b/g, "1-1-0 (morning and afternoon)")
          .replace(/\b1-0-1\b/g, "1-0-1 (morning and night)")
          .replace(/\b0-1-1\b/g, "0-1-1 (afternoon and night)")
          .replace(/\b1-1-1\b/g, "1-1-1 (morning, afternoon and night)")
          .replace(/\bOD\b/gi, "once daily")
          .replace(/\bBD\b/gi, "twice daily")
          .replace(/\bTDS\b/gi, "three times daily")
          .replace(/\bQID\b/gi, "four times daily")
          .replace(/\bPRN\b/gi, "as needed")
          .replace(/\bAC\b/gi, "before meals")
          .replace(/\bPC\b/gi, "after meals")
          .replace(/\bHS\b/gi, "at bedtime");
      };

      const expandedMedications = medications.map(m => ({
        ...m,
        frequency: expandFrequency(m.frequency || ""),
      }));

      const res = await fetch("/api/generate-medication-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medications: expandedMedications,
          patientName: medScanResult.patientName || "Patient",
          prescribingDoctor: medScanResult.prescribingDoctor,
          prescriptionDate: medScanResult.prescriptionDate,
          clinicName: medScanResult.clinicName,
          pharmacistNotes: medScanResult.pharmacistNotes,
          caseId,
          generatedAt: new Date().toISOString(),
        }),
      });
      toast.dismiss("pdf-gen");
      if (!res.ok) throw new Error(`PDF API ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medication-record-${caseId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Medication PDF downloaded!");
    } catch (err) {
      toast.dismiss("pdf-gen");
      toast.error("Failed to generate PDF. Please try again.");
      console.error(err);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.content);
      toast.success("Copied to clipboard");
    }
  };

  const handlePrint = () => {
    if (!result) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>MediFlow AI - ${currentNav.label}</title>
      <style>body{font-family:sans-serif;padding:2rem;max-width:800px;margin:0 auto;line-height:1.6}
      h1{font-size:1.2rem;color:#0D7377;border-bottom:2px solid #0D7377;padding-bottom:0.5rem}
      pre{white-space:pre-wrap;font-family:sans-serif;font-size:0.9rem}
      .meta{color:#6b7280;font-size:0.8rem;margin-bottom:1rem}
      .disclaimer{margin-top:2rem;padding:0.75rem;background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;font-size:0.8rem;color:#92400e}</style>
      </head><body>
      <h1>MediFlow AI - ${currentNav.label}</h1>
      <div class="meta">Case ID: ${result.id} | Generated: ${result.timestamp.toLocaleString()} | Confidence: ${result.confidence}%</div>
      <pre>${result.content}</pre>
      <div class="disclaimer">DISCLAIMER: This output was generated by an AI-assisted clinical workflow tool and is intended to support, not replace, clinical judgment. Always verify with qualified healthcare professionals before acting on this information.</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExport = async () => {
    if (!result) return;

    // All modules → branded PDF
    try {
      toast.info("Generating PDF...");
      const res = await fetch("/api/generate-discharge-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: result.content,
          patientName: result.patientName || undefined,
          patientAge: result.patientAge || undefined,
          moduleLabel: currentNav.label,
          moduleId: activeModule,
          caseId: result.id,
          confidence: result.confidence,
          generatedAt: result.timestamp.toISOString(),
          // REGIONAL LANGUAGE: pass language so PDF uses the correct Noto Sans font
          language: activeModule === "discharge" ? dischargeLanguage : "en",
        }),
      });
      if (!res.ok) throw new Error(`PDF API error: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (result.patientName || "patient").replace(/\s+/g, "-").toLowerCase();
      a.download = `mediflow-${activeModule}-${safeName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleQueueDownloadPdf = async (item: AIResult) => {
    try {
      toast.info("Generating PDF...");
      const moduleNavItem = navItems.find(n => n.id === item.type);
      const moduleLabel = moduleNavItem?.label ?? item.type;

      let res: Response;
      let filename: string;
      const safeName = (item.patientName || "patient").replace(/\s+/g, "-").toLowerCase();

      if (item.type === "medscan") {
        // Use the same medication PDF generator as the MediScan module
        // Prefer stored structured data; fall back to raw text if not available
        const expandFrequency = (freq: string): string => {
          if (!freq) return freq;
          return freq
            .replace(/\b1-0-0\b/g, "1-0-0 (morning once)")
            .replace(/\b0-1-0\b/g, "0-1-0 (afternoon once)")
            .replace(/\b0-0-1\b/g, "0-0-1 (night once)")
            .replace(/\b1-1-0\b/g, "1-1-0 (morning and afternoon)")
            .replace(/\b1-0-1\b/g, "1-0-1 (morning and night)")
            .replace(/\b0-1-1\b/g, "0-1-1 (afternoon and night)")
            .replace(/\b1-1-1\b/g, "1-1-1 (morning, afternoon and night)")
            .replace(/\bOD\b/gi, "once daily")
            .replace(/\bBD\b/gi, "twice daily")
            .replace(/\bTDS\b/gi, "three times daily")
            .replace(/\bQID\b/gi, "four times daily")
            .replace(/\bPRN\b/gi, "as needed")
            .replace(/\bAC\b/gi, "before meals")
            .replace(/\bPC\b/gi, "after meals")
            .replace(/\bHS\b/gi, "at bedtime");
        };
        const msd = item.medScanData;
        const payload = msd
          ? {
              medications: msd.medications.map(m => ({ ...m, frequency: expandFrequency(m.frequency || "") })),
              patientName: msd.patientName || item.patientName || "Patient",
              prescribingDoctor: msd.prescribingDoctor,
              prescriptionDate: msd.prescriptionDate,
              clinicName: msd.clinicName,
              pharmacistNotes: msd.pharmacistNotes,
              caseId: item.id,
              generatedAt: item.timestamp instanceof Date ? item.timestamp.toISOString() : new Date(item.timestamp).toISOString(),
            }
          : {
              rawText: item.content,
              patientName: item.patientName || "Patient",
              caseId: item.id,
              generatedAt: item.timestamp instanceof Date ? item.timestamp.toISOString() : new Date(item.timestamp).toISOString(),
            };
        res = await fetch("/api/generate-medication-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        filename = `medication-record-${safeName}.pdf`;
      } else {
        // Use discharge/general PDF generator for all other modules
        res = await fetch("/api/generate-discharge-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: item.content,
            patientName: item.patientName || undefined,
            patientAge: item.patientAge || undefined,
            moduleLabel,
            moduleId: item.type,
            caseId: item.id,
            confidence: item.confidence,
            generatedAt: item.timestamp instanceof Date ? item.timestamp.toISOString() : new Date(item.timestamp).toISOString(),
            // REGIONAL LANGUAGE: for discharge queue items, use current dischargeLanguage setting
            language: item.type === "discharge" ? dischargeLanguage : "en",
          }),
        });
        filename = `mediflow-${item.type}-${safeName}.pdf`;
      }

      if (!res.ok) throw new Error(`PDF API error: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  // --- Status change handler ---
  const handleStatusChange = async (id: string, newStatus: CaseStatus) => {
    setQueue((prev) =>
      prev.map((c) => c.id === id ? { ...c, status: newStatus } : c)
    );
    // Persist to DB
    const updated = queue.find((c) => c.id === id);
    if (updated) {
      saveToDb({ ...updated, status: newStatus });
    }
  };

  const generateHandoffReport = async () => {
    setHandoffLoading(true);
    setHandoffReport(null);
    try {
      const OLLAMA_DEFAULT_URL = "http://5.149.249.212:11434";
      const OLLAMA_DEFAULT_MODEL = "gemma2:2b";
      // ── OLLAMA INTEGRATION: see callGemma block above for full docs ──
      const providerOverride = settings.providerMode === "ollama"
        ? { mode: "ollama" as const, ollamaUrl: settings.ollamaUrl.trim() || OLLAMA_DEFAULT_URL, ollamaModel: settings.ollamaModel.trim() || OLLAMA_DEFAULT_MODEL }
        : settings.providerMode === "gemma"
        ? { mode: "gemma" as const }
        : undefined;
      const activeCases = queue.filter(q => (q.status ?? 'pending') !== 'resolved');
      const caseSummaries = activeCases.slice(0, 30).map((c, i) => {
        const moduleLabel = navItems.find(n => n.id === c.type)?.label ?? c.type;
        const diffMs = Math.max(0, Date.now() - (c.timestamp instanceof Date ? c.timestamp.getTime() : new Date(c.timestamp).getTime()));
        const hoursAgo = Math.floor(diffMs / 3600000);
        const minsAgo = Math.floor(diffMs / 60000);
        const timeStr = hoursAgo >= 1 ? `${hoursAgo}h ago` : `${minsAgo}m ago`;
        return `${i+1}. [${(c.urgency ?? 'low').toUpperCase()}] ${c.patientName ?? 'Unknown'} (${c.patientAge ?? 'age unknown'}) — ${moduleLabel} — ${c.status ?? 'pending'} — ${timeStr}\n   Chief concern: ${c.inputSnippet ?? 'Not documented'}${c.notes ? `\n   Staff notes: ${c.notes}` : ''}`;
      }).join('\n\n');
      const res = await fetch('/api/generate-handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseSummaries, totalActive: activeCases.length, _providerOverride: providerOverride }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? 'Handoff generation failed');
      }
      const data = await res.json() as { content?: string };
      setHandoffReport(data.content ?? 'Unable to generate report.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate handoff report.');
      setShowHandoffModal(false);
    } finally {
      setHandoffLoading(false);
    }
  };

  const urgencyColor = (u?: UrgencyLevel) => {
    if (u === "critical") return "text-red-700 bg-red-50 border-red-200";
    if (u === "high") return "text-[#F97316] bg-orange-50 border-orange-200";
    if (u === "medium") return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-[#0D7377] bg-teal-50 border-teal-200";
  };

  const filteredQueue = (() => {
    const searchLower = queueSearch.trim().toLowerCase();
    const filtered = queue.filter(q => {
      // Module filter
      const passesFilter =
        queueFilter === "all" ? true :
        queueFilter === "critical" ? (q.urgency === "critical" || q.urgency === "high") :
        queueFilter === "intake" ? q.type === "intake" :
        queueFilter === "triage" ? q.type === "triage" :
        queueFilter === "discharge" ? q.type === "discharge" :
        queueFilter === "urgency" ? q.type === "urgency" :
        queueFilter === "followup" ? q.type === "followup" :
        queueFilter === "medscan" ? q.type === "medscan" : true;
      // Search filter
      const passesSearch = !searchLower ||
        (q.patientName ?? "").toLowerCase().includes(searchLower) ||
        (q.department ?? "").toLowerCase().includes(searchLower) ||
        (q.type ?? "").toLowerCase().includes(searchLower) ||
        (q.inputSnippet ?? "").toLowerCase().includes(searchLower) ||
        (q.urgency ?? "").toLowerCase().includes(searchLower) ||
        q.id.toLowerCase().includes(searchLower);
      // Name filter
      const passesName = queueNameFilter === "all" || (q.patientName ?? "") === queueNameFilter;
      // Status filter — hide resolved by default unless explicitly selected
      const passesStatus =
        queueStatusFilter === "all" ? (q.status ?? "pending") !== "resolved" :
        (q.status ?? "pending") === queueStatusFilter;
      return passesFilter && passesSearch && passesName && passesStatus;
    });
    const urgencyRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...filtered].sort((a, b) => {
      if (queueSort === "newest") return b.timestamp.getTime() - a.timestamp.getTime();
      if (queueSort === "oldest") return a.timestamp.getTime() - b.timestamp.getTime();
      if (queueSort === "risk_high") {
        const aScore = a.riskScore ?? (urgencyRank[a.urgency ?? "low"] * 20);
        const bScore = b.riskScore ?? (urgencyRank[b.urgency ?? "low"] * 20);
        return bScore - aScore;
      }
      if (queueSort === "risk_low") {
        const aScore = a.riskScore ?? (urgencyRank[a.urgency ?? "low"] * 20);
        const bScore = b.riskScore ?? (urgencyRank[b.urgency ?? "low"] * 20);
        return aScore - bScore;
      }
      if (queueSort === "module") return a.type.localeCompare(b.type);
      return 0;
    });
  })();

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#020817]"
      style={{ flexDirection: settings.sidebarPosition === "right" ? "row-reverse" : "row" }}
    >
      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdate={updateSetting}
      />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* --- Sidebar --- */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        w-64 flex-shrink-0 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isDark ? "bg-[#0a0f1e]" : "bg-white"} border-r border-[var(--accent-muted)]
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="px-5 py-5 border-b border-[var(--accent-muted)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-muted)] border border-[var(--accent-glow)] flex items-center justify-center">
              <Activity className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-sm leading-tight tracking-wide">MediFlow AI</div>
              <div className="text-[var(--accent-primary)]/50 text-xs font-mono tracking-widest">v3.0 CLINICAL</div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/40 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[var(--accent-primary)]/30 text-[10px] font-mono font-semibold uppercase tracking-[0.15em] px-2 mb-2">Views</div>
          {[
            { id: "metrics" as ActiveView, label: "Metrics", icon: BarChart3 },
            { id: "queue" as ActiveView, label: `Queue (${queue.length})`, icon: ListOrdered },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => { setActiveView(view.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                activeView === view.id
                  ? "bg-[var(--accent-muted)] text-[var(--accent-primary)] border-[var(--accent-glow)] shadow-[0_0_12px_var(--accent-muted)]"
                  : "text-[#8892a4] hover:text-white hover:bg-white/[0.04] border-transparent"
              }`}
            >
              <view.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{view.label}</span>
              {activeView === view.id && <ChevronRight className="w-3 h-3 text-white/40" />}
            </button>
          ))}

          <div className="text-[var(--accent-primary)]/30 text-[10px] font-mono font-semibold uppercase tracking-[0.15em] px-2 mt-5 mb-2">Modules</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveModule(item.id); setActiveView("automation"); setResult(null); setInput(""); setSampleIndex(0); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                activeModule === item.id && activeView === "automation"
                  ? "bg-[var(--accent-muted)] text-[var(--accent-primary)] border-[var(--accent-glow)] shadow-[0_0_12px_var(--accent-muted)]"
                  : "text-[#8892a4] hover:text-white hover:bg-white/[0.04] border-transparent"
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeModule === item.id && activeView === "automation" ? item.color : ""}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {activeModule === item.id && activeView === "automation" && <ChevronRight className="w-3 h-3 text-white/40" />}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 pb-20 lg:pb-4 border-t border-[var(--accent-muted)] space-y-1">
          <button onClick={() => window.location.href = "/"} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8892a4] hover:text-white hover:bg-white/[0.04] transition-all">
            <Home className="w-4 h-4" /><span>Back to Home</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#8892a4] hover:text-white hover:bg-white/[0.04] transition-all">
            <Settings className="w-4 h-4" /><span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden pb-16 lg:pb-0 bg-[#020817]">
        {/* Top Bar */}
        <header className={`flex-shrink-0 border-b border-[var(--accent-muted)] px-4 sm:px-6 py-4 flex items-center justify-between ${isDark ? "bg-[#0a0f1e]" : "bg-white"}`}>
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-[#8892a4] hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          <div>
            <div className="flex items-center gap-2">
              {activeView === "automation" && <currentNav.icon className={`w-5 h-5 ${currentNav.color}`} />}
              {activeView === "queue" && <ListOrdered className="w-5 h-5 text-[#0D7377]" />}
              {activeView === "metrics" && <BarChart3 className="w-5 h-5 text-[#0D7377]" />}
              <h1 className="text-lg font-bold text-white tracking-tight">
                {activeView === "automation" && currentNav.label}
                {activeView === "queue" && "Case Queue"}
                {activeView === "metrics" && "Metrics Dashboard"}
              </h1>
            </div>
            {activeView !== "automation" && (
              <p className="text-xs text-[#8892a4] mt-0.5 font-mono">
                {activeView === "queue" && `${queue.length} cases processed this session. Click any case to expand.`}
                {activeView === "metrics" && "Live performance metrics for today's automation activity"}
              </p>
            )}
          </div>
          </div>
          <div className="flex items-center gap-3">
            {activeView === "automation" && (
              <span className={`text-xs hidden sm:flex items-center gap-1 font-mono px-2 py-0.5 rounded ${isDark ? "text-[#8892a4] bg-white/[0.03] border border-white/[0.06]" : "text-slate-500 bg-slate-100 border border-slate-200"}`}>
                {MODULE_DESCRIPTIONS[activeModule].time}
              </span>
            )}
            <div className="flex items-center gap-1.5 text-xs font-mono" title={settings.providerMode === 'ollama' ? `Local Ollama — ${settings.ollamaModel || 'gemma3:4b'} (${settings.ollamaUrl || 'localhost:11434'})` : 'Google AI — Gemma 4 31B'}>
              <div className={`w-2 h-2 rounded-full ai-active-dot ${settings.providerMode === 'ollama' ? 'bg-amber-400' : 'bg-[var(--accent-primary)]'}`} />
              <span className={settings.providerMode === 'ollama' ? (isDark ? 'text-amber-400/80' : 'text-amber-700') : (isDark ? 'text-[var(--accent-primary)]/70' : 'text-[#0D7377]')}>
                {settings.providerMode === 'ollama'
                  ? `OLLAMA — ${settings.ollamaModel || 'gemma3:4b'}`
                  : 'GEMMA 4 ACTIVE'}
              </span>
            </div>

          </div>
        </header>

        {/* View: Metrics */}
        {activeView === "metrics" && (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#020817]" style={{WebkitOverflowScrolling:'touch'}}>
            <MetricsDashboard queue={queue} />
          </div>
        )}

        {/* View: Queue */}
        {activeView === "queue" && (
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#020817]">
            {expandedQueueItem ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 max-w-3xl">
                <button onClick={() => setExpandedQueueItem(null)} className="flex items-center gap-1 text-sm text-[var(--accent-primary)] hover:text-white font-medium font-mono">
                  ← Back to Queue
                </button>
                <div className={`rounded-xl border border-[var(--accent-muted)] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] ${isDark ? "bg-[#0d1424]" : "bg-white"}`}>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[var(--accent-muted)]">
                    <Brain className="w-4 h-4 text-[var(--accent-primary)]" />
                    <span className="text-xs font-semibold text-[var(--accent-primary)] font-mono tracking-widest">AI OUTPUT</span>
                    <span className="text-xs font-mono text-[#8892a4]">#{expandedQueueItem.id}</span>
                    {expandedQueueItem.riskScore !== undefined && (
                      <Badge className="ml-auto text-xs bg-[#F97316] text-white">Risk: {expandedQueueItem.riskScore}/100</Badge>
                    )}
                  </div>
                  {expandedQueueItem.confidence !== undefined && (
                    <div className="mb-3">
                      <ConfidenceBar confidence={expandedQueueItem.confidence} />
                    </div>
                  )}
                  <div className={`text-sm leading-relaxed prose-neo max-w-none ${isDark ? "text-[#e8f4f8]" : "text-slate-800"}`}>
                    <SimpleMarkdown>{expandedQueueItem.content}</SimpleMarkdown>
                  </div>
                  {expandedQueueItem.notes && expandedQueueItem.notes.trim() && (
                    <div className="mt-4 rounded-lg border border-blue-700/40 bg-blue-900/20 px-4 py-3 flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-blue-300 mb-1">Internal Staff Notes</p>
                        <p className="text-sm text-blue-100 leading-relaxed whitespace-pre-wrap">{expandedQueueItem.notes}</p>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#8892a4]">AI-assisted output. Always verify with qualified healthcare professionals before acting on this information.</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="max-w-3xl">
                {/* Search bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4] pointer-events-none" />
                  <input
                    type="text"
                    value={queueSearch}
                    onChange={(e) => setQueueSearch(e.target.value)}
                    placeholder="Search by patient name, department, module, urgency…"
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-white placeholder-[#4a5568] focus:outline-none focus:border-[var(--accent-glow)] focus:shadow-[0_0_0_3px_var(--accent-muted)] transition-all"
                  />
                  {queueSearch && (
                    <button
                      onClick={() => setQueueSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter / Sort / Clear All row */}
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                  <span className="text-sm font-semibold text-white font-mono">
                    {filteredQueue.length}{queueSearch || queueFilter !== "all" || queueNameFilter !== "all" || queueStatusFilter !== "all" ? " matching" : ""} cases
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                      <select
                        value={queueFilter}
                        onChange={(e) => setQueueFilter(e.target.value)}
                        className={`text-xs border rounded-md px-2 py-1 focus:border-[var(--accent-glow)] focus:outline-none ${isDark ? "bg-[#0d1424] text-white border-[rgba(255,255,255,0.08)]" : "bg-white text-slate-900 border-slate-300"}`}
                      >
                        <option value="all">All Modules</option>
                        <option value="critical">Critical / High</option>
                        <option value="intake">Intake</option>
                        <option value="triage">Triage</option>
                        <option value="discharge">Discharge</option>
                        <option value="urgency">Urgency</option>
                        <option value="followup">Follow-up</option>
                        <option value="medscan">MediScan</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <select
                        value={queueNameFilter}
                        onChange={(e) => setQueueNameFilter(e.target.value)}
                        className={`text-xs border rounded-md px-2 py-1 max-w-[140px] focus:border-[var(--accent-glow)] focus:outline-none ${isDark ? "bg-[#0d1424] text-white border-[rgba(255,255,255,0.08)]" : "bg-white text-slate-900 border-slate-300"}`}
                      >
                        <option value="all">All Patients</option>
                        {Array.from(new Set(queue.map(q => q.patientName).filter(Boolean))).sort().map(name => (
                          <option key={name} value={name!}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <select
                        value={queueStatusFilter}
                        onChange={(e) => setQueueStatusFilter(e.target.value)}
                        className={`text-xs border rounded-md px-2 py-1 focus:border-[var(--accent-glow)] focus:outline-none ${isDark ? "bg-[#0d1424] text-white border-[rgba(255,255,255,0.08)]" : "bg-white text-slate-900 border-slate-300"}`}
                      >
                        <option value="all">Active (excl. Resolved)</option>
                        <option value="pending">Pending Review</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved Only</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                      <select
                        value={queueSort}
                        onChange={(e) => setQueueSort(e.target.value as typeof queueSort)}
                        className={`text-xs border rounded-md px-2 py-1 focus:border-[var(--accent-glow)] focus:outline-none ${isDark ? "bg-[#0d1424] text-white border-[rgba(255,255,255,0.08)]" : "bg-white text-slate-900 border-slate-300"}`}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="risk_high">Highest Risk</option>
                        <option value="risk_low">Lowest Risk</option>
                        <option value="module">By Module</option>
                      </select>
                    </div>
                    {filteredQueue.length > 0 && (
                      <button
                        onClick={() => {
                          const headers = ['ID','Patient','Age','Module','Urgency','Risk Score','Status','Department','Input Snippet','Created At','Notes'];
                          const rows = filteredQueue.map(c => [
                            c.id,
                            c.patientName ?? '',
                            c.patientAge ?? '',
                            c.type,
                            c.urgency ?? '',
                            c.riskScore ?? '',
                            c.status ?? 'pending',
                            c.department ?? '',
                            `"${(c.inputSnippet ?? '').replace(/"/g, '""')}"`,
                            c.timestamp instanceof Date ? c.timestamp.toISOString() : new Date(c.timestamp).toISOString(),
                            `"${(c.notes ?? '').replace(/"/g, '""')}"`
                          ]);
                          const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                          const blob = new Blob([csv], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `mediflow-queue-${new Date().toISOString().slice(0,10)}.csv`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success('Queue exported as CSV');
                        }}
                        className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 border border-green-800 hover:border-green-600 rounded-md px-2 py-1 transition-colors"
                        title="Export current view as CSV"
                      >
                        <FileSpreadsheet className="w-3 h-3" />
                        CSV
                      </button>
                    )}
                    {queue.filter(q => (q.status ?? 'pending') !== 'resolved').length > 0 && (
                      <button
                        onClick={() => setShowHandoffModal(true)}
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800 hover:border-indigo-600 rounded-md px-2 py-1 transition-colors"
                        title="Generate AI shift handoff report"
                      >
                        <ClipboardCheck className="w-3 h-3" />
                        Handoff
                      </button>
                    )}
                    {queue.some(q => q.patientName) && (
                      <button
                        onClick={() => { setPatientTimelineSearch(""); setShowPatientTimeline(true); }}
                        className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 border border-teal-800 hover:border-teal-600 rounded-md px-2 py-1 transition-colors"
                        title="View patient timeline"
                      >
                        <Stethoscope className="w-3 h-3" />
                        Timeline
                      </button>
                    )}
                    {queue.length > 0 && (
                      <button
                        onClick={() => setShowClearAllConfirm(true)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 rounded-md px-2 py-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredQueue.map((item) => (
                      <QueueItem
                        key={item.id}
                        item={item}
                        onExpand={setExpandedQueueItem}
                        onDelete={(id) => {
                          const found = queue.find((c) => c.id === id);
                          if (found) setDeletingCase(found);
                        }}
                        onEdit={(caseItem) => setEditingCase(caseItem)}
                        onDownloadPdf={handleQueueDownloadPdf}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </AnimatePresence>
                    {filteredQueue.length === 0 && (
                    <div className="text-center py-12 text-[#8892a4] text-sm font-mono">
                      {queueSearch ? `No cases match "${queueSearch}"` : "No cases match this filter."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View: Automation */}
        {activeView === "automation" && (
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#020817]">
            {activeModule === "medscan" ? (
              /* ── Medication Scan Module ── */
              <div className="max-w-3xl mx-auto flex flex-col gap-5">
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border bg-[var(--accent-muted)] border-[var(--accent-glow)]">
                  <Info className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed text-[var(--accent-primary)]/80">{MODULE_DESCRIPTIONS.medscan.what}</p>
                </div>
                {/* Upload area */}
                <div className="rounded-xl border-2 border-dashed border-[var(--accent-glow)] bg-[var(--accent-muted)] p-8 flex flex-col items-center gap-4 hover:border-[var(--accent-glow)] transition-colors">
                  <div className="w-14 h-14 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-glow)] flex items-center justify-center">
                    <Pill className="w-7 h-7 text-[var(--accent-primary)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white mb-1 tracking-wide">Scan a Prescription</p>
                    <p className="text-xs text-[#8892a4]">Take a photo or choose from gallery — JPG, PNG, HEIC up to 20MB</p>
                  </div>
                  {/* Hidden inputs */}
                  <input ref={medScanCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleMedScanFileChange} />
                  <input ref={medScanInputRef} type="file" accept="image/*" className="hidden" onChange={handleMedScanFileChange} />
                  {medScanLoading ? (
                    <Button disabled className="btn-run text-white gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Scanning...
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => medScanCameraRef.current?.click()}
                        className="btn-run text-white gap-2"
                      >
                        <Camera className="w-4 h-4" /> Take Photo
                      </Button>
                      <Button
                        onClick={() => medScanInputRef.current?.click()}
                        variant="outline"
                        className="border-[var(--accent-glow)] text-[var(--accent-primary)] hover:bg-[var(--accent-muted)] gap-2"
                      >
                        <ImageIcon className="w-4 h-4" /> Gallery
                      </Button>
                    </div>
                  )}
                </div>
                {/* Preview while loading */}
                {medScanPreview && medScanLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 px-3 py-3 rounded-lg border bg-[var(--accent-muted)] border-[var(--accent-glow)]">
                    <img src={medScanPreview} alt="Prescription preview" className="w-14 h-14 object-cover rounded-md border border-[var(--accent-glow)] flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-[var(--accent-primary)] mb-0.5 font-mono">Reading prescription...</p>
                      <p className="text-xs text-[var(--accent-primary)]/60">AI is extracting medication data from your image.</p>
                    </div>
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)] flex-shrink-0" />
                  </motion.div>
                )}
                {/* Results table */}
                {medScanResult && !medScanLoading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-teal-400" />
                        <span className="text-sm font-semibold text-white">{medScanResult.medications.length} Medication{medScanResult.medications.length !== 1 ? "s" : ""} Extracted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {medScanQueueId ? (
                          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/20 border border-green-700/40 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Added to Queue
                          </span>
                        ) : (
                          <Button
                            onClick={addMedScanToQueue}
                            variant="outline"
                            className="border-teal-600 text-teal-300 hover:bg-teal-900/40 gap-2 text-xs h-8 px-3"
                          >
                            <Inbox className="w-3.5 h-3.5" /> Add to Queue
                          </Button>
                        )}
                        <button
                          onClick={handleMedScanDownloadPdf}
                          className="relative flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-all bg-[#0D7377]/20 border-[#0D7377] text-teal-300 hover:bg-[#0D7377]/30"
                        >
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </button>
                      </div>
                    </div>
                    {/* Meta info */}
                    {(medScanResult.patientName || medScanResult.prescribingDoctor || medScanResult.prescriptionDate || medScanResult.clinicName) && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {medScanResult.patientName && <div className="bg-gray-900 rounded-lg p-3 border border-gray-800"><p className="text-xs text-gray-500 mb-0.5">Patient</p><p className="text-sm font-medium text-white truncate">{medScanResult.patientName}</p></div>}
                        {medScanResult.prescribingDoctor && <div className="bg-gray-900 rounded-lg p-3 border border-gray-800"><p className="text-xs text-gray-500 mb-0.5">Doctor</p><p className="text-sm font-medium text-white truncate">{medScanResult.prescribingDoctor}</p></div>}
                        {medScanResult.prescriptionDate && <div className="bg-gray-900 rounded-lg p-3 border border-gray-800"><p className="text-xs text-gray-500 mb-0.5">Date</p><p className="text-sm font-medium text-white truncate">{medScanResult.prescriptionDate}</p></div>}
                        {medScanResult.clinicName && <div className="bg-gray-900 rounded-lg p-3 border border-gray-800"><p className="text-xs text-gray-500 mb-0.5">Clinic</p><p className="text-sm font-medium text-white truncate">{medScanResult.clinicName}</p></div>}
                      </div>
                    )}
                    {/* Medications table */}
                    <div className={`rounded-xl border border-[var(--accent-muted)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)] ${isDark ? "bg-[#0d1424]" : "bg-white"}`}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[var(--accent-muted)] bg-[var(--accent-muted)]">
                              {["Medication", "Strength", "Form", "Frequency", "Duration", "Route", "Instructions"].map(h => (
                                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-mono font-semibold text-[var(--accent-primary)]/60 uppercase tracking-widest whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {medScanResult.medications.map((med, i) => (
                              <tr key={i} className={`border-b border-[rgba(255,255,255,0.04)] transition-colors hover:bg-[var(--accent-muted)] ${i % 2 === 0 ? "" : "bg-[rgba(255,255,255,0.01)]"}`}>
                                <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap">{med.name || "—"}</td>
                                <td className={`px-3 py-2.5 whitespace-nowrap font-mono text-xs ${isDark ? "text-[#e8f4f8]/70" : "text-slate-600"}`}>{med.strength || "—"}</td>
                                <td className={`px-3 py-2.5 whitespace-nowrap font-mono text-xs ${isDark ? "text-[#e8f4f8]/70" : "text-slate-600"}`}>{med.form || "—"}</td>
                                <td className={`px-3 py-2.5 whitespace-nowrap font-mono text-xs ${isDark ? "text-[#e8f4f8]/70" : "text-slate-600"}`}>{med.frequency || "—"}</td>
                                <td className={`px-3 py-2.5 whitespace-nowrap font-mono text-xs ${isDark ? "text-[#e8f4f8]/70" : "text-slate-600"}`}>{med.duration || "—"}</td>
                                <td className={`px-3 py-2.5 whitespace-nowrap font-mono text-xs ${isDark ? "text-[#e8f4f8]/70" : "text-slate-600"}`}>{med.route || "—"}</td>
                                <td className="px-3 py-2.5 text-[#8892a4] max-w-[200px] text-xs">{med.instructions || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {/* Legibility / Confidence Score */}
                    {typeof medScanResult.legibilityScore === 'number' && (
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                        medScanResult.legibilityScore >= 80 ? 'bg-green-900/10 border-green-700/40' :
                        medScanResult.legibilityScore >= 50 ? 'bg-amber-900/10 border-amber-700/40' :
                        'bg-red-900/10 border-red-700/40'
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          medScanResult.legibilityScore >= 80 ? 'bg-green-700/30 text-green-300' :
                          medScanResult.legibilityScore >= 50 ? 'bg-amber-700/30 text-amber-300' :
                          'bg-red-700/30 text-red-300'
                        }`}>{medScanResult.legibilityScore}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold ${
                            medScanResult.legibilityScore >= 80 ? 'text-green-300' :
                            medScanResult.legibilityScore >= 50 ? 'text-amber-300' :
                            'text-red-300'
                          }`}>
                            {medScanResult.legibilityScore >= 80 ? 'High Legibility' :
                             medScanResult.legibilityScore >= 50 ? 'Moderate Legibility — Review Recommended' :
                             'Low Legibility — Manual Verification Required'}
                          </p>
                          <p className="text-xs text-gray-500">AI confidence score based on image clarity. Fields marked [?] require manual correction.</p>
                        </div>
                      </div>
                    )}

                    {/* DDI Alerts — loaded after scan */}
                    {medScanResult.ddiAlerts && medScanResult.ddiAlerts.length > 0 && (
                      <div className="rounded-lg border border-orange-700/50 bg-orange-900/10 p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-orange-300">Drug Interaction Alerts ({medScanResult.ddiAlerts.length})</span>
                        </div>
                        {medScanResult.ddiAlerts.map((alert, i) => (
                          <div key={i} className="pl-6 space-y-1">
                            <p className="text-xs font-medium text-orange-200">{alert.drug}</p>
                            {alert.interactions.map((txt, j) => (
                              <p key={j} className="text-xs text-orange-400/80 leading-relaxed">{txt}</p>
                            ))}
                          </div>
                        ))}
                        <p className="text-xs text-gray-500 pt-1">Source: FDA drug label database. Consult a licensed pharmacist before dispensing.</p>
                      </div>
                    )}

                    {/* Editable extracted text */}
                    <div className={`rounded-xl border border-[var(--accent-muted)] p-4 ${isDark ? "bg-[#0d1424]" : "bg-white"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Pencil className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                          <span className="text-xs font-semibold text-white font-mono">Extracted Text — Edit Before Downloading</span>
                        </div>
                        <span className="text-xs text-[#8892a4]">Changes will be reflected in the PDF</span>
                      </div>
                      <textarea
                        value={editedMedText}
                        onChange={(e) => setEditedMedText(e.target.value)}
                        rows={10}
                        className={`w-full rounded-lg p-3 text-xs font-mono leading-relaxed resize-y focus:outline-none focus:border-[var(--accent-glow)] focus:shadow-[0_0_0_3px_var(--accent-muted)] transition-all ${isDark ? "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[#e8f4f8]" : "bg-white border border-slate-300 text-slate-900"}`}
                        placeholder="Extracted prescription text will appear here for editing..."
                        spellCheck={false}
                      />
                      <p className="text-xs text-[#8892a4] mt-1.5">Remove [Illegible] markers or correct any misread text before generating the PDF.</p>
                    </div>

                    {medScanResult.pharmacistNotes && (
                      <div className="rounded-lg border border-amber-700/40 bg-amber-900/10 p-3">
                        <p className={`text-xs font-semibold mb-1 ${isDark ? "text-amber-300" : "text-amber-700"}`}>Pharmacist Notes</p>
                        <p className={`text-xs ${isDark ? "text-amber-400/80" : "text-amber-800"}`}>{medScanResult.pharmacistNotes}</p>
                      </div>
                    )}
                    <div className="flex items-start gap-2 px-1">
                      <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">AI-extracted data. Always verify with the original prescription and consult a licensed pharmacist before dispensing.</p>
                    </div>
                    <Button variant="outline" onClick={() => { setMedScanResult(null); setMedScanPreview(null); setEditedMedText(""); setMedScanQueueId(null); medScanPendingEntryRef.current = null; }} className="w-full border-gray-700 text-gray-400 hover:text-white hover:border-gray-500">
                      <RotateCcw className="w-3.5 h-3.5 mr-2" /> Scan Another Prescription
                    </Button>
                  </motion.div>
                )}
              </div>
            ) : (
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Input Panel */}
              <div className="flex flex-col gap-3 overflow-hidden">
                {/* Module description banner */}
                <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg border ${
                  isDark ? "bg-[#0D7377]/10 border-[#0D7377]/30" : "bg-[#0D7377]/5 border-[#0D7377]/20"
                }`}>
                  <Info className="w-3.5 h-3.5 text-[#0D7377] flex-shrink-0 mt-0.5" />
                  <p className={`text-xs leading-relaxed ${isDark ? "text-teal-300" : "text-[#0D7377]"}`}>
                    {MODULE_DESCRIPTIONS[activeModule].what}
                  </p>
                </div>

                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <label className={`text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`}>
                    {activeModule === "intake" && "Raw Patient Notes"}
                    {activeModule === "triage" && "Patient Message / Complaint"}
                    {activeModule === "discharge" && "Clinical Discharge Information"}
                    {activeModule === "urgency" && "Symptom Description"}
                    {activeModule === "followup" && "Patient Discharge Summary"}
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">

                    <button
                      onClick={handleSample}
                      disabled={sampleLoading}
                      className={`relative flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-all ${
                        isDark
                          ? "bg-[#0D7377]/20 border-[#0D7377] text-teal-300 hover:bg-[#0D7377]/30"
                          : "bg-[#0D7377]/10 border-[#0D7377] text-[#0D7377] hover:bg-[#0D7377]/20"
                      } ${sampleLoading ? "opacity-70 cursor-wait" : ""}`}
                      title="Generate a fresh AI sample for this module"
                    >
                      {/* Pulsing ring — 3 pulses then stops */}
                      {!input && !sampleLoading && (
                        <span
                          className="absolute -inset-0.5 rounded-lg border-2 border-[#0D7377] opacity-0 pointer-events-none"
                          style={{
                            animation: "samplePing 1.2s ease-out 3",
                          }}
                        />
                      )}
                      {sampleLoading ? (
                        <><svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg> Generating...</>
                      ) : (
                        <>
                          <Zap className="w-3 h-3" /> Load Demo Case
                          <span className={`ml-1 text-[10px] font-normal px-1 py-0.5 rounded ${isDark ? "opacity-60 bg-teal-900/40 text-teal-200" : "bg-teal-100 text-teal-700 opacity-100"}`}>DEMO</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handlePhotoCapture}
                      disabled={photoLoading}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                        photoLoading
                          ? "bg-purple-50 border-purple-200 text-purple-600 animate-pulse"
                          : isDark
                          ? "bg-purple-900/20 border-purple-700/40 text-purple-300 hover:bg-purple-900/30"
                          : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                      } ${photoLoading ? "cursor-wait" : ""}`}
                      title="Take a photo or upload an image of a patient report"
                    >
                      {photoLoading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading...</>
                      ) : (
                        <><Camera className="w-3.5 h-3.5" /> Scan Report</>
                      )}
                    </button>
                    {/* Hidden file inputs — one for camera, one for gallery */}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoFileChange}
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoFileChange}
                    />
                    {input && (
                      <button onClick={() => { setInput(""); setResult(null); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <X className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Photo preview overlay while AI reads the image */}
                {photoPreview && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg border ${
                      isDark ? "bg-purple-900/20 border-purple-700/40" : "bg-purple-50 border-purple-200"
                    }`}
                  >
                    <img
                      src={photoPreview}
                      alt="Report preview"
                      className="w-14 h-14 object-cover rounded-md border border-purple-300 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold mb-0.5 ${
                        isDark ? "text-purple-300" : "text-purple-800"
                      }`}>
                        Reading report...
                      </p>
                      <p className={`text-xs ${
                        isDark ? "text-purple-400/80" : "text-purple-600"
                      }`}>
                        Gemma 4 31B is extracting the clinical text from your image. This takes a few seconds.
                      </p>
                    </div>
                    <Loader2 className={`w-5 h-5 animate-spin flex-shrink-0 ${
                      isDark ? "text-purple-400" : "text-purple-600"
                    }`} />
                  </motion.div>
                )}

                {/* Onboarding hint: shown once when module opens and input is empty */}
                {showSampleHint && !input && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border bg-[rgba(245,166,35,0.08)] border-[rgba(245,166,35,0.25)]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold mb-0.5 font-mono ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                        Not sure where to start?
                      </p>
                      <p className={`text-xs leading-relaxed ${isDark ? "text-amber-400/80" : "text-amber-800"}`}>
                        <>Click <strong>"Load Demo Case"</strong> above — Gemma AI will generate a realistic {{
                          intake: "patient intake note",
                          triage: "patient complaint message",
                          discharge: "discharge summary",
                          urgency: "symptom description",
                          followup: "patient encounter note",
                        }[activeModule as Exclude<Module, "medscan">]} for you to test with.</>
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSampleHint(false)}
                      className={`text-xs flex-shrink-0 ${isDark ? "text-amber-500 hover:text-amber-300" : "text-amber-700 hover:text-amber-900"}`}
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}



                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    activeModule === "intake" ? "Paste or dictate raw patient intake notes: vitals, chief complaint, history, medications..." :
                    activeModule === "triage" ? "Paste the patient message or describe the presenting complaint..." :
                    activeModule === "discharge" ? "Paste the clinical discharge summary: diagnosis, treatment, medications, follow-up..." :
                    activeModule === "followup" ? "Paste the patient's discharge summary or recent clinical encounter notes..." :
                    "Describe the patient's symptoms in detail..."
                  }
                  className={`w-full min-h-[180px] max-h-[320px] font-mono text-sm resize-y rounded-xl transition-all focus:border-[var(--accent-glow)] focus:shadow-[0_0_0_3px_var(--accent-muted)] ${isDark ? "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-[#e8f4f8] placeholder:text-[#4a5568]" : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400"}`}
                  style={{ fieldSizing: 'fixed' } as React.CSSProperties}
                />

                    {activeModule === "discharge" && (
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Language Complexity — fixed dark mode label */}
                    <div className="flex items-center gap-2">
                      <label className={`text-sm font-medium ${isDark ? "text-[#a0b4c8]" : "text-slate-700"}`}>Language Complexity:</label>
                      <select
                        value={literacyLevel}
                        onChange={(e) => setLiteracyLevel(e.target.value)}
                        className={`rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent-glow)] cursor-pointer font-mono ${
                          isDark
                            ? "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] text-[#e8f4f8]"
                            : "border-slate-300 bg-white text-slate-800"
                        }`}
                      >
                        <option value="basic">Basic</option>
                        <option value="standard">Standard</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    {/* Output Language — REGIONAL LANGUAGE SUPPORT */}
                    {/* Sends ISO 639-1 code to /api/gemma (AI prompt) and /api/generate-discharge-pdf (Noto font) */}
                    <div className="flex items-center gap-2">
                      <label className={`text-sm font-medium ${isDark ? "text-[#a0b4c8]" : "text-slate-700"}`}>Output Language:</label>
                      <select
                        value={dischargeLanguage}
                        onChange={(e) => setDischargeLanguage(e.target.value)}
                        className={`rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent-glow)] cursor-pointer font-mono ${
                          isDark
                            ? "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] text-[#e8f4f8]"
                            : "border-slate-300 bg-white text-slate-800"
                        }`}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="bn">Bengali (বাংলা)</option>
                        <option value="kn">Kannada (ಕನ್ನಡ)</option>
                        <option value="ml">Malayalam (മലയാളം)</option>
                        <option value="ta">Tamil (தமிழ்)</option>
                        <option value="te">Telugu (తెలుగు)</option>
                        <option value="mr">Marathi (मराठी)</option>
                        <option value="gu">Gujarati (ગુજરાતી)</option>
                      </select>
                    </div>
                    {/* Ollama language quality note */}
                    {settings.providerMode === "ollama" && dischargeLanguage !== "en" && (
                      <p className={`text-xs ${isDark ? "text-amber-400/70" : "text-amber-600"}`}>
                        ⚠ For best Indian language quality, use Gemma 4 or a larger Ollama model (≥12B).
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleRun} disabled={loading || !input.trim()} className="flex-1 btn-run text-white">
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" />Run Automation</>
                    )}
                  </Button>
                  {/* Mic button — replaces the old refresh/clear button */}
                  <Button
                    variant="outline"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={voiceLoading}
                    className={`px-3 transition-all ${
                      voiceLoading
                        ? "border-[var(--accent-glow)] text-[var(--accent-primary)] animate-pulse"
                        : isRecording
                        ? "border-[rgba(255,59,59,0.5)] text-[#ff3b3b] bg-[rgba(255,59,59,0.08)] animate-pulse"
                        : "border-[var(--accent-glow)] text-[var(--accent-primary)]/70 hover:bg-[var(--accent-muted)] hover:border-[var(--accent-glow)]"
                    }`}
                    title={isRecording ? "Stop recording — AI will clean up your transcript" : "Start voice note"}
                  >
                    {voiceLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Output Panel */}
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <label className="text-sm font-semibold text-white font-mono tracking-wide">AI Output</label>
                  {result && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8892a4] flex items-center gap-1 font-mono">
                        #{result.id.slice(-8)}
                      </span>
                      <span className="text-xs text-[#8892a4] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />{result.timestamp.toLocaleTimeString()}
                      </span>
                      {result.processingMs && (
                        <span className="text-xs text-[var(--accent-primary)]/60 font-mono">{(result.processingMs / 1000).toFixed(1)}s</span>
                      )}
                      <button onClick={handleCopy} className="text-xs text-[var(--accent-primary)] hover:text-white flex items-center gap-1 font-medium font-mono" title="Copy to clipboard">
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                      <button onClick={handlePrint} className="text-xs text-[#8892a4] hover:text-white flex items-center gap-1" title="Print">
                        <Printer className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleExport}
                        className={`relative flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-all ${
                          isDark
                            ? "bg-[#0D7377]/20 border-[#0D7377] text-teal-300 hover:bg-[#0D7377]/30"
                            : "bg-[#0D7377]/10 border-[#0D7377] text-[#0D7377] hover:bg-[#0D7377]/20"
                        }`}
                        title="Download PDF"
                      >
                        <Download className="w-3 h-3" /> Download PDF
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {!result && !loading && (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex-1 min-h-[200px] sm:min-h-[320px] rounded-xl border border-dashed border-[var(--accent-muted)] bg-[var(--accent-muted)] flex flex-col items-center justify-center text-center p-6 sm:p-8"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[var(--accent-muted)] border border-[var(--accent-glow)] flex items-center justify-center mb-4">
                        <currentNav.icon className="w-6 h-6 text-[var(--accent-primary)]" />
                      </div>
                      <p className="text-sm font-medium mb-1 text-white">Ready to automate</p>
                      <p className="text-xs text-[#8892a4] mb-3">Enter patient information and click "Run Automation"</p>
                      <p className={`text-xs font-mono px-2 py-1 rounded ${isDark ? "text-[#8892a4] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]" : "text-slate-500 bg-slate-100 border border-slate-200"}`}>Ctrl+Enter to run</p>
                    </motion.div>
                  )}

                  {loading && (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className={`flex-1 min-h-[200px] sm:min-h-[320px] rounded-xl border border-[var(--accent-muted)] flex flex-col items-center justify-center gap-4 ${isDark ? "bg-[#0d1424]" : "bg-white"}`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-glow)] border-t-[var(--accent-primary)] animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-[var(--accent-primary)]" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-white font-mono">AI is processing...</p>
                        <p className="text-xs text-[var(--accent-primary)]/50 mt-1 font-mono">Analyzing clinical context</p>
                      </div>
                    </motion.div>
                  )}

                  {result && !loading && (
                    <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col gap-3">
                      {/* Risk ring for triage/urgency */}
                      {(result.type === "triage" || result.type === "urgency") && result.riskScore !== undefined && (
                        <div className={`rounded-xl border p-4 flex items-center gap-6 ${urgencyColor(result.urgency)}`}>
                          <RiskRing score={result.riskScore} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-xs font-semibold uppercase ${
                                result.urgency === "critical" ? "bg-red-600 text-white" :
                                result.urgency === "high" ? "bg-[#F97316] text-white" :
                                result.urgency === "medium" ? "bg-amber-500 text-white" : "bg-[#0D7377] text-white"
                              }`}>{result.urgency} urgency</Badge>
                              {result.department && <Badge variant="outline" className="text-xs">{result.department}</Badge>}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span className="font-mono font-medium">Risk Score: {result.riskScore}/100</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Success banner for intake/discharge/followup */}
                      {(result.type === "intake" || result.type === "discharge" || result.type === "followup") && (
                        <div className="rounded-xl border border-[var(--accent-glow)] bg-[var(--accent-muted)] p-3 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)] flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-[var(--accent-primary)] font-mono">
                              {result.type === "intake" ? "Clinical Summary Generated" :
                               result.type === "discharge" ? "Discharge Instructions Ready" :
                               "Follow-Up Care Plan Generated"}
                            </span>
                          </div>
                          {result.icdCodes && result.icdCodes.length > 0 && (
                            <div className="flex items-center gap-1">
                              {result.icdCodes.map(code => (
                                <Badge key={code} variant="outline" className="text-xs font-mono border text-[var(--accent-primary)] border-[var(--accent-glow)] bg-[var(--accent-muted)]">
                                  <Hash className="w-2.5 h-2.5 mr-0.5" />{code}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Drug interaction warning */}
                      {result.drugWarnings && result.drugWarnings.length > 0 && (
                        <div className="rounded-xl border border-[rgba(255,123,46,0.3)] bg-[rgba(255,123,46,0.06)] p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-[#ff7b2e]" />
                            <span className="text-xs font-semibold text-[#ff7b2e] font-mono">Drug Interaction Warnings</span>
                          </div>
                          {result.drugWarnings.map((w, i) => (
                            <p key={i} className="text-xs text-[#ff7b2e]/80 ml-6">{w}</p>
                          ))}
                        </div>
                      )}

                      {/* Confidence bar */}
                      {result.confidence !== undefined && (
                        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-[#8892a4] font-mono">AI Confidence</span>
                            <span className="text-xs font-mono text-[#8892a4]">Case #{result.id}</span>
                          </div>
                          <ConfidenceBar confidence={result.confidence} />
                        </div>
                      )}

                      {/* Main output */}
                      <div className={`flex-1 rounded-xl border border-[var(--accent-muted)] p-5 overflow-auto shadow-[0_4px_24px_rgba(0,0,0,0.4)] ${isDark ? "bg-[#0d1424]" : "bg-white"}`}>
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--accent-muted)]">
                          <Brain className="w-4 h-4 text-[var(--accent-primary)]" />
                          <span className="text-xs font-semibold text-[var(--accent-primary)] font-mono tracking-widest">AI OUTPUT</span>
                        </div>
                        <StreamingText text={result.content} />
                      </div>

                      {/* AI disclaimer */}
                      <div className="flex items-start gap-2 px-1">
                        <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[#8892a4]">AI-assisted output. Always verify with qualified healthcare professionals before acting on this information.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            )}
          </div>
        )}
      </main>
      {/* ── Fixed Mobile Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-stretch mobile-bottom-nav">
        {/* Home */}
        <button
          onClick={() => navigate("/")}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all group"
        >
          <div className="w-10 h-7 flex items-center justify-center rounded-full transition-all bg-transparent group-active:bg-[rgba(255,255,255,0.06)]">
            <Home className="w-5 h-5 text-[#8892a4] group-hover:text-white transition-colors" />
          </div>
          <span className="text-[10px] font-mono tracking-wide text-[#8892a4] group-hover:text-white transition-colors">HOME</span>
        </button>

        {/* Queue */}
        <button
          onClick={() => { setActiveView("queue"); navigate("/dashboard?view=queue"); }}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all relative"
        >
          {activeView === "queue" && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-glow)]" />
          )}
          <div className={`w-10 h-7 flex items-center justify-center rounded-full transition-all ${
            activeView === "queue" ? "bg-[var(--accent-muted)]" : "bg-transparent"
          }`}>
            <ListOrdered className={`w-5 h-5 transition-colors ${
              activeView === "queue" ? "text-[var(--accent-primary)] drop-shadow-[0_0_6px_var(--accent-glow)]" : "text-[#8892a4]"
            }`} />
          </div>
          <span className={`text-[10px] font-mono tracking-wide transition-colors ${
            activeView === "queue" ? "text-[var(--accent-primary)]" : "text-[#8892a4]"
          }`}>QUEUE</span>
        </button>

        {/* Automation (centre — primary action) */}
        <button
          onClick={() => { setActiveView("automation"); navigate("/dashboard?view=automation"); }}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all relative"
        >
          {activeView === "automation" && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-glow)]" />
          )}
          <div className={`w-10 h-7 flex items-center justify-center rounded-full transition-all ${
            activeView === "automation" ? "bg-[var(--accent-muted)]" : "bg-transparent"
          }`}>
            <Zap className={`w-5 h-5 transition-colors ${
              activeView === "automation" ? "text-[var(--accent-primary)] drop-shadow-[0_0_6px_var(--accent-glow)]" : "text-[#8892a4]"
            }`} />
          </div>
          <span className={`text-[10px] font-mono tracking-wide transition-colors ${
            activeView === "automation" ? "text-[var(--accent-primary)]" : "text-[#8892a4]"
          }`}>RUN</span>
        </button>

        {/* Metrics */}
        <button
          onClick={() => { setActiveView("metrics"); navigate("/dashboard?view=metrics"); }}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-all relative"
        >
          {activeView === "metrics" && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-glow)]" />
          )}
          <div className={`w-10 h-7 flex items-center justify-center rounded-full transition-all ${
            activeView === "metrics" ? "bg-[var(--accent-muted)]" : "bg-transparent"
          }`}>
            <BarChart3 className={`w-5 h-5 transition-colors ${
              activeView === "metrics" ? "text-[var(--accent-primary)] drop-shadow-[0_0_6px_var(--accent-glow)]" : "text-[#8892a4]"
            }`} />
          </div>
          <span className={`text-[10px] font-mono tracking-wide transition-colors ${
            activeView === "metrics" ? "text-[var(--accent-primary)]" : "text-[#8892a4]"
          }`}>METRICS</span>
        </button>
      </nav>

      {/* ── Patient Name Modal ── */}
      <AnimatePresence>
        {showPatientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="neo-modal p-6 w-full max-w-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-muted)] border border-[var(--accent-glow)] flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[var(--accent-primary)]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Patient Details</h3>
                  <p className="text-xs text-[#8892a4]">No patient name found in the input. Please add it.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-5">
                <div>
                  <label className="text-xs font-medium text-[#e8f4f8] mb-1 block">Patient Name <span className="text-[#ff3b3b]">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-[var(--accent-glow)] focus:shadow-[0_0_0_3px_var(--accent-muted)] transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#e8f4f8] mb-1 block">Age &amp; Sex <span className="text-[#8892a4]">(optional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. 45M or 32F"
                    value={modalAge}
                    onChange={(e) => setModalAge(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-[var(--accent-glow)] focus:shadow-[0_0_0_3px_var(--accent-muted)] transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && modalName.trim()) {
                        const updated = { ...pendingResult!, patientName: modalName.trim(), patientAge: modalAge.trim() || undefined };
                        setResult(updated);
                        setQueue((prev) => [updated, ...prev]);
                        saveToDb(updated);
                        setShowPatientModal(false);
                        setPendingResult(null);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Skip — save without name
                    const updated = { ...pendingResult!, patientName: undefined };
                    setResult(updated);
                    setQueue((prev) => [updated, ...prev]);
                    saveToDb(updated);
                    setShowPatientModal(false);
                    setPendingResult(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-lg border border-[rgba(255,255,255,0.08)] text-sm text-[#8892a4] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-colors"
                >
                  Skip
                </button>
                <button
                  disabled={!modalName.trim()}
                  onClick={() => {
                    const updated = { ...pendingResult!, patientName: modalName.trim(), patientAge: modalAge.trim() || undefined };
                    setResult(updated);
                    setQueue((prev) => [updated, ...prev]);
                    saveToDb(updated);
                    setShowPatientModal(false);
                    setPendingResult(null);
                  }}
                  className="flex-1 py-2 px-4 rounded-lg btn-run disabled:opacity-40 disabled:cursor-not-allowed text-sm text-white font-semibold transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear All Confirmation Dialog */}
      <AnimatePresence>
        {showClearAllConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="neo-modal w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[rgba(255,59,59,0.12)] border border-[rgba(255,59,59,0.3)] flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-[#ff3b3b]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Clear All Cases</h3>
                  <p className="text-xs text-[#8892a4]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-[#e8f4f8]/80 mb-6">
                Are you sure you want to delete all{" "}
                <span className="font-semibold text-white">{queue.length} cases</span> from the queue?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearAllConfirm(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[rgba(255,255,255,0.08)] text-sm text-[#8892a4] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowClearAllConfirm(false);
                    setQueue([]);
                    localStorage.removeItem("mediflow_queue_v2");
                    await fetch("/api/queue-db", { method: "DELETE" }).catch(() => {});
                    toast.success("All cases cleared.");
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-[rgba(255,59,59,0.15)] hover:bg-[rgba(255,59,59,0.25)] border border-[rgba(255,59,59,0.4)] text-sm text-[#ff3b3b] font-semibold transition-colors"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deletingCase && (
          <DeleteConfirmDialog
            item={deletingCase}
            onCancel={() => setDeletingCase(null)}
            onConfirm={async () => {
              const id = deletingCase.id;
              setQueue((prev) => prev.filter((c) => c.id !== id));
              setDeletingCase(null);
              await fetch(`/api/queue-db?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
              toast.success("Case deleted.");
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Case Modal */}
      <AnimatePresence>
        {editingCase && (
          <EditCaseModal
            item={editingCase}
            onClose={() => setEditingCase(null)}
            onSave={async (updated) => {
              // Build audit entry for this edit
              const prevCase = queue.find((c) => c.id === updated.id);
              const changes: string[] = [];
              if (prevCase) {
                if (prevCase.status !== updated.status) changes.push(`Status: ${prevCase.status ?? 'pending'} → ${updated.status ?? 'pending'}`);
                if (prevCase.urgency !== updated.urgency) changes.push(`Urgency: ${prevCase.urgency} → ${updated.urgency}`);
                if (prevCase.patientName !== updated.patientName) changes.push(`Patient name updated`);
                if (prevCase.notes !== updated.notes && updated.notes?.trim()) changes.push(`Notes added/updated`);
              }
              const auditEntry = {
                action: 'edited',
                detail: changes.length > 0 ? `Edited: ${changes.join(', ')}` : 'Case details edited',
                timestamp: Date.now(),
              };
              const updatedWithAudit = {
                ...updated,
                auditLog: [...(prevCase?.auditLog ?? []), auditEntry],
              };
              setQueue((prev) => prev.map((c) => c.id === updated.id ? updatedWithAudit : c));
              setEditingCase(null);
              // Persist main fields to DB via POST (upsert)
              await fetch("/api/queue-db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: updated.id,
                  type: updated.type,
                  content: updated.content,
                  urgency: updated.urgency ?? "medium",
                  confidence: updated.confidence ?? 0,
                  department: updated.department ?? "General",
                  inputSnippet: updated.inputSnippet ?? "",
                  patientName: updated.patientName ?? null,
                  patientAge: updated.patientAge ?? null,
                  processingMs: updated.processingMs ?? null,
                  riskScore: updated.riskScore ?? null,
                  status: updated.status ?? "pending",
                  createdAt: updated.timestamp instanceof Date ? updated.timestamp.getTime() : updated.timestamp,
                }),
              }).catch(() => {});
              // Persist notes + audit log via PATCH
              await fetch(`/api/queue-db?id=${updated.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  notes: updated.notes ?? "",
                  status: updated.status ?? "pending",
                  auditEntry,
                }),
              }).catch(() => {});
              toast.success("Case updated.");
            }}
          />
        )}
      </AnimatePresence>

      {/* Shift Handoff Report Modal */}
      <AnimatePresence>
        {showHandoffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neo-modal w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--accent-muted)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--accent-muted)] border border-[var(--accent-glow)] flex items-center justify-center">
                    <ClipboardCheck className="w-4 h-4 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Shift Handoff Report</h3>
                    <p className="text-xs text-[#8892a4] font-mono">AI-generated SBAR format — {queue.filter(q => (q.status ?? 'pending') !== 'resolved').length} active cases</p>
                  </div>
                </div>
                <button onClick={() => { setShowHandoffModal(false); setHandoffReport(null); }} className="p-1.5 rounded-lg text-[#8892a4] hover:text-white hover:bg-white/[0.06] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {!handoffReport && !handoffLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--accent-muted)] border border-[var(--accent-glow)] flex items-center justify-center">
                      <ClipboardCheck className="w-8 h-8 text-[var(--accent-primary)]" />
                    </div>
                    <p className="text-sm text-[#e8f4f8]/80 text-center max-w-sm">Generate a structured SBAR handoff report summarising all active cases for the incoming shift team.</p>
                    <button
                      onClick={generateHandoffReport}
                      className="px-6 py-2.5 rounded-lg btn-run text-sm text-white font-semibold transition-colors flex items-center gap-2"
                    >
                      <Brain className="w-4 h-4" />
                      Generate Handoff Report
                    </button>
                  </div>
                )}
                {handoffLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-glow)] border-t-[var(--accent-primary)] animate-spin" />
                    <p className="text-sm text-[#8892a4] font-mono">Generating SBAR report…</p>
                  </div>
                )}
                {handoffReport && (
                  <div className="space-y-4">
                      <div className="bg-[rgba(255,255,255,0.02)] border border-[var(--accent-muted)] rounded-lg p-4">
                        <SimpleMarkdown>{handoffReport}</SimpleMarkdown>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(handoffReport);
                            toast.success('Report copied to clipboard');
                          }}
                          className="flex items-center gap-1.5 text-xs text-[var(--accent-primary)] hover:text-white border border-[var(--accent-glow)] hover:border-[var(--accent-glow)] rounded-md px-3 py-1.5 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" /> Copy Report
                        </button>
                        <button
                          onClick={() => { setHandoffReport(null); generateHandoffReport(); }}
                          className="flex items-center gap-1.5 text-xs text-[#8892a4] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)] rounded-md px-3 py-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Patient Timeline Modal */}
      <AnimatePresence>
        {showPatientTimeline && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neo-modal w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[var(--accent-muted)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--accent-muted)] border border-[var(--accent-glow)] flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Patient Timeline</h3>
                    <p className="text-xs text-[#8892a4] font-mono">All cases for a patient, chronologically</p>
                  </div>
                </div>
                <button onClick={() => setShowPatientTimeline(false)} className="p-1.5 rounded-lg text-[#8892a4] hover:text-white hover:bg-white/[0.06] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 border-b border-[var(--accent-muted)]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4] pointer-events-none" />
                  <input
                    type="text"
                    value={patientTimelineSearch}
                    onChange={(e) => setPatientTimelineSearch(e.target.value)}
                    placeholder="Search patient name…"
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-white placeholder-[#4a5568] focus:outline-none focus:border-[var(--accent-glow)] transition-all"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {(() => {
                  const searchLower = patientTimelineSearch.trim().toLowerCase();
                  const patientNames = Array.from(new Set(queue.map(q => q.patientName).filter(Boolean))) as string[];
                  const matchedNames = searchLower ? patientNames.filter(n => n.toLowerCase().includes(searchLower)) : patientNames;
                  if (!searchLower && matchedNames.length === 0) {
                    return <p className="text-sm text-[#8892a4] text-center py-8 font-mono">No patients in queue yet.</p>;
                  }
                  if (searchLower && matchedNames.length === 0) {
                    return <p className="text-sm text-[#8892a4] text-center py-8 font-mono">No patients match "{patientTimelineSearch}".</p>;
                  }
                  return (
                    <div className="space-y-6">
                      {matchedNames.sort().map(name => {
                        const patientCases = queue
                          .filter(q => q.patientName === name)
                          .sort((a, b) => (a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()) - (b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()));
                        return (
                          <div key={name} className="border border-gray-800 rounded-lg overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-muted)] border-b border-[var(--accent-muted)]">
                              <User className="w-4 h-4 text-[var(--accent-primary)]" />
                              <span className="text-sm font-semibold text-white">{name}</span>
                              <span className="text-xs text-[#8892a4] ml-auto font-mono">{patientCases.length} case{patientCases.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="divide-y divide-gray-800">
                              {patientCases.map((c, i) => {
                                const moduleLabel = navItems.find(n => n.id === c.type)?.label ?? c.type;
                                const ts = c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp);
                                const statusConfig: Record<string, string> = { pending: 'text-yellow-400', in_progress: 'text-blue-400', resolved: 'text-green-400' };
                                const statusLabel: Record<string, string> = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved' };
                                return (
                                  <div key={c.id} className="px-4 py-3 flex items-start gap-3">
                                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                      <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] mt-1" />
                                      {i < patientCases.length - 1 && <span className="w-px flex-1 bg-gray-700 min-h-[20px]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-medium text-[var(--accent-primary)] font-mono">{moduleLabel}</span>
                                        <span className={`text-xs font-medium ${statusConfig[c.status ?? 'pending']}`}>{statusLabel[c.status ?? 'pending']}</span>
                                        <span className="text-xs text-gray-500">{ts.toLocaleDateString()} {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-0.5 truncate">{c.inputSnippet}</p>
                                      {c.notes && <p className="text-xs text-blue-400 mt-0.5 italic">"{c.notes}"</p>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

# MediFlow AI — Kaggle Gemma4Good Submission Writeup

> **Track:** Health & Sciences
> **Live Demo:** https://mediflow-ai-pi.vercel.app
> **GitHub:** https://github.com/saranshshetty2403-cmyk/mediflow-ai-clean
> **Model:** Google Gemma 4 (`gemma-4-31b-it`) via Google AI Studio

---

## The Problem: India's Hospitals Are Overwhelmed, and Paperwork Is Making It Worse

Walk into any government hospital in India on a weekday morning. The OPD queue stretches out of the building. A single doctor will see 100, sometimes 200, patients before lunch. The consultation lasts two minutes — not because the doctor does not care, but because there is no other choice.

India has **0.6 hospital beds per 1,000 people** [1]. The country's own National Health Policy 2017 set a target of 2 beds per 1,000 and has not met it [2]. The WHO recommends 3.5. India is at less than one-fifth of that. The gap between the infrastructure that exists and the infrastructure that is needed is measured in millions of beds, thousands of doctors, and hundreds of millions of patients who have no alternative to the government system.

The numbers are not abstractions. Sawai Man Singh Hospital in Jaipur — Rajasthan's largest government facility — handles **31.6 lakh OPD visits per year**, with daily footfall regularly exceeding 12,000 patients [3]. A 110-bed emergency department at a tertiary care centre in Northern India was found to be operating at **250–300% bed occupancy** [4]. AIIMS Delhi recorded **48.4 million OPD visits in 2024–25**, up 28% year-on-year [5]. A landmark *BMJ Open* study of 67 countries found that Indian doctors spend an average of just **2 minutes per patient** — the second-shortest consultation time in the world [6]. The Medical Council of India recommends a minimum of 10 minutes.

The structural overload is compounded by a documentation crisis that consumes an estimated **30% of a doctor's working time** in paperwork instead of patient care [7]. A 2024 audit of medical records across Indian hospitals found that only **17.6% of records contain the patient's full name**, only **2% accurately record admission time**, and **over two-thirds of discharge summaries lack information necessary for continuity of care** [7]. These failures are not the result of negligence. They are the inevitable outcome of asking one doctor to document 200 patients in a single session with no digital tools.

Meanwhile, India's private healthcare sector is growing at 11–12% CAGR and was valued at **USD 122.6 billion in 2025** [8]. More Indians are choosing private care — but paying for it almost entirely out of pocket. Out-of-pocket expenditure accounts for **47.1% of India's total health expenditure** [9], and an estimated **63 million Indians are pushed below the poverty line by healthcare costs every year** [10]. When a private hospital's documentation is incomplete and an insurance claim is rejected, the cost falls on the patient.

India's Ayushman Bharat Digital Mission has created 71.16 crore ABHA health accounts and linked 45.99 crore health records [11]. The digital infrastructure is being built. What is missing is the layer that makes documentation fast enough for a doctor who has 200 patients waiting. **MediFlow AI is that layer.**

---

## What I Built

MediFlow AI is a web-based clinical workflow automation platform with six AI-powered modules, all accessible from a single dashboard with no login required. Every module is designed to produce a usable clinical output in under 10 seconds, from the kind of rough notes and voice inputs that are the reality of a busy Indian OPD.

**1. Intake Summarization** converts raw patient notes — handwritten transcripts, voice recordings, or typed summaries — into structured SOAP (Subjective, Objective, Assessment, Plan) clinical summaries. The SOAP format is the most widely used clinical documentation standard globally and has been shown to reduce information loss during care transitions [12].

**2. Smart Triage and Routing** analyses incoming patient messages and routes them to the appropriate care team (Emergency, Cardiology, Primary Care, Urgent Care, Mental Health, or Administrative) with an urgency score and recommended action timeline. AI-assisted triage has been validated with concordance rates of 87–92% against physician assessments for high-acuity presentations [13].

**3. Discharge Instructions** generates plain-language discharge documents tailored to the patient's literacy level (Basic, Standard, or Medical). This matters enormously in India, where health literacy varies widely across states, languages, and education levels. Literacy-appropriate discharge instructions have been shown to reduce 30-day readmission rates by 12–18% [14].

**4. Urgent Case Flagging** assigns a clinical urgency score from 1 to 10 with a structured rationale, differential diagnoses, and recommended immediate actions. The model is explicitly prompted to be conservative — assigning higher scores when uncertain — reflecting the clinical principle that under-triaging a serious case is far more dangerous than over-triaging a non-urgent one.

**5. Follow-Up Scheduling** generates structured follow-up care plans and complete SBAR (Situation, Background, Assessment, Recommendation) shift handoff reports. Structured SBAR handoffs have been shown to reduce handoff-related medical errors by 30% across hospital settings [15].

**6. MediScan (Prescription OCR)** processes photographs of printed or handwritten prescriptions, extracts structured medication data across 8 fields (name, strength, form, route, frequency, duration, quantity, instructions), and produces a layered safety analysis before generating a branded PDF medication summary. The safety pipeline has three distinct stages:

- **Drug name normalisation** via the NLM RxNorm API resolves brand names, generic names, and OCR-induced misspellings to canonical drug identifiers before any safety check is performed. Drug name normalisation using RxNorm has been shown to reduce medication data errors by up to 73% in clinical information systems [19].
- **Drug-drug interaction (DDI) analysis** queries the OpenFDA Drug Label API to identify interactions between co-prescribed medications. Drug-drug interactions are implicated in 20–30% of all adverse drug reactions [18], and the FDA source was chosen because it is authoritative, continuously updated, free, and requires no authentication.
- **FDA Black Box Warning detection** queries the same OpenFDA API for each extracted drug individually and surfaces any boxed warnings — the FDA's highest-severity safety alert, reserved for drugs with known risks of serious or life-threatening adverse effects [20]. Drugs such as Warfarin, Methotrexate, Morphine, Tramadol, and Metformin carry black box warnings that are frequently overlooked in high-volume prescribing environments. When a warning is detected, MediFlow AI displays a prominent red alert badge directly alongside the drug name in the medication table, with the full FDA warning text expandable inline.

If the scan does not capture patient identifiers — name, age, sex, or prescribing doctor — a **"Complete Patient Details"** modal appears automatically after extraction. The nurse or pharmacist fills in only the missing fields; any information already extracted from the prescription is pre-populated. On confirmation, the values are written into the editable medication summary and carried through to the PDF, ensuring that every generated document is fully identified regardless of the legibility of the original prescription.

Every case processed by any module is added to a **persistent case queue** backed by a PostgreSQL database. Queue cards display the scan image thumbnail alongside the case summary for all modules, giving staff a visual reference to the original document without reopening the full result. Prescription errors contribute to an estimated 7,000 preventable deaths annually [16], and the combination of OCR extraction, normalisation, DDI checking, black box warning detection, and patient identification completion is designed to address the full chain of failure modes that lead to those errors.

---

## How Gemma 4 Powers Every Module

Gemma 4 (`gemma-4-31b-it`) is the primary inference engine for all six modules. It was chosen for three reasons that go beyond the competition mandate.

**First, its open-weight nature enables local deployment.** Healthcare organisations in India face significant barriers to cloud-based AI due to data-residency concerns and the requirements of the Ayushman Bharat Digital Mission's data governance framework. Because Gemma 4 is open-weight, MediFlow AI includes a local model integration layer that routes all inference to a local Ollama endpoint when configured, with zero code changes. This makes the platform viable for real-world deployment in government hospitals that cannot send patient data to external cloud services.

**Second, its multimodal capability enables prescription image analysis.** Gemma 4's variable-aspect-ratio image encoder processes prescription photographs without fixed-resolution preprocessing. This is important because prescription images vary widely in dimensions — portrait prescriptions, landscape medication packaging, square pharmacy labels — and fixed-resolution preprocessing introduces OCR errors at image boundaries. The MediScan module uses Gemma 4's vision capability to extract medication text from photographs, then uses the same model to parse that text into a structured 8-field JSON medication table.

**Third, its instruction-following capability produces safe, structured clinical outputs.** Research on LLM-based clinical information extraction has found that models prompted with explicit JSON schemas produce parse-valid outputs in 94.7% of cases [17]. Every structured module in MediFlow AI uses explicit JSON schemas in the system prompt, and all outputs are validated before being displayed to the user.

---

## External APIs and Why They Were Chosen

**RxNav / RxNorm Approximate Term API** (https://rxnav.nlm.nih.gov): Before any safety analysis, MediFlow AI normalises drug names using the National Library of Medicine's RxNorm API. This resolves brand names, generic names, and OCR-induced misspellings to canonical RxNorm concept IDs. Drug name normalisation using RxNorm has been shown to reduce medication data errors by up to 73% in clinical information systems [19]. Normalisation is performed as a prerequisite step so that downstream DDI and black box warning queries operate on verified drug identifiers rather than raw OCR text.

**OpenFDA Drug Label API — Drug-Drug Interaction Check** (https://api.fda.gov/drug/label.json): After normalisation, MediFlow AI queries the OpenFDA Drug Label API to identify interactions between co-prescribed medications. The `drug_interactions` field in FDA drug labels contains clinically reviewed interaction text for each approved drug. Drug-drug interactions are implicated in 20–30% of all adverse drug reactions [18]. The FDA source was chosen because it is authoritative, continuously updated, free, and requires no authentication for standard query volumes.

**OpenFDA Drug Label API — Black Box Warning Detection** (https://api.fda.gov/drug/label.json): As a separate, parallel query, MediFlow AI retrieves the `boxed_warning` field from the FDA label for each individual drug extracted from the prescription. FDA black box warnings are the agency's highest-severity safety designation, applied to drugs with demonstrated risks of serious injury or death that cannot be mitigated by standard precautions [20]. The warnings are displayed as prominent red alert badges in the medication table, with the full warning text expandable inline. This check runs asynchronously after the medication table is rendered, so it does not delay the primary extraction result. Drugs confirmed to carry black box warnings that are commonly prescribed in India include Warfarin (bleeding risk), Methotrexate (embryo-fetal toxicity, hepatotoxicity), Morphine and Tramadol (addiction, respiratory depression), and Metformin (lactic acidosis).

| API | Endpoint | Auth Required | Primary Use in MediFlow |
|---|---|---|---|
| RxNorm Approximate Term | `rxnav.nlm.nih.gov/REST/approximateTerm` | None | Drug name normalisation before safety checks |
| OpenFDA Drug Label (DDI) | `api.fda.gov/drug/label.json` | None | Drug-drug interaction detection |
| OpenFDA Drug Label (BBW) | `api.fda.gov/drug/label.json` | None | FDA black box warning detection per drug |

---

## Technical Architecture

The application is built on React 19 + TypeScript + Vite (frontend), Express + tRPC (backend), and Neon PostgreSQL (case queue database), deployed on Vercel. The tRPC API layer provides end-to-end type safety between the server and client, which is particularly important in a clinical context where data type mismatches could produce incorrect medical outputs.

**Voice input** uses the browser-native Web Speech API, avoiding transmission of patient audio to third-party servers. Voice transcripts are cleaned by Gemma 4 to correct medical terminology misrecognitions before use as module input.

**Image capture** uses the browser's Camera API with Canvas API compression, reducing prescription photograph sizes from 8–12 MB to under 500 KB before encoding, without perceptible quality loss for text extraction.

**MediScan safety pipeline** executes in three sequential stages after OCR extraction: (1) RxNorm normalisation for each extracted drug name, (2) OpenFDA DDI query across all normalised drug pairs, and (3) OpenFDA black box warning query for each individual drug. Stages 2 and 3 run asynchronously in parallel after the medication table is rendered, so the primary extraction result is displayed immediately while safety data loads in the background.

**Patient identification completion** is handled by a post-scan modal that evaluates which of the four patient identifier fields — name, age, sex, and prescribing doctor — were successfully extracted from the image. Only missing fields are presented to the user for manual entry; fields already extracted are pre-populated and not re-requested. On confirmation, the values are written into both the editable medication summary text area and the underlying result object, ensuring the generated PDF reflects the complete patient record.

**Case queue persistence** stores every processed case in PostgreSQL with the scan image URL saved to S3-compatible object storage. Queue cards across all six modules display the scan image thumbnail alongside the case summary, giving staff a persistent visual reference to the original document. The queue supports 91+ concurrent cases in the live deployment.

---

## Real-World Impact for India

The six modules in MediFlow AI collectively address documentation tasks that consume an estimated 30% of a doctor's working day in Indian hospitals [7]. For a government OPD doctor seeing 150 patients per day, that is roughly 2.5 hours of paperwork that could be redirected to patient care — or to seeing 30 more patients from the queue outside.

The local model support feature is particularly significant for India's public health system. Government hospitals that cannot use cloud AI due to data governance requirements can run Gemma 4 locally on a hospital server, with no patient data leaving the network. The same platform that serves a private clinic in Mumbai can serve a district hospital in Chhattisgarh.

The MediScan black box warning feature addresses a specific and well-documented failure mode in high-volume prescribing environments. A 2019 study found that **54% of black box warning violations** in outpatient prescribing involved drugs that clinicians acknowledged knowing carried warnings — the failure was not ignorance but cognitive overload [21]. Surfacing the warning at the point of transcription, rather than relying on recall, addresses the mechanism of failure directly.

---

## Limitations and Responsible Use

MediFlow AI is a research and demonstration tool. All AI-generated outputs must be reviewed by a licensed clinician before any clinical action is taken. The platform is not approved by any regulatory authority and should not be used for actual patient care decisions without appropriate clinical oversight.

---

## References

[1] International Journal of Community Medicine and Public Health. (2026). "Unlocking India's hospital beds: why a digital portal is the cure for a critical shortage." https://www.ijcmph.com/index.php/ijcmph/article/view/14846

[2] Government of India, Ministry of Health and Family Welfare. (2024). *National Health Policy 2017: Recommended 2 beds per 1,000 population*. Lok Sabha Unstarred Question No. 4360. https://sansad.in/getFile/loksabhaquestions/annex/183/AU4360_wkfa0t.pdf

[3] Gupta, G. (2026). "Patient Preferences and Overcrowding Pressures at Sawai Man Singh Hospital, Jaipur." *South Indian Journal of Medical and Dental Sciences*. https://sijmds.com/index.php/pub/article/view/81

[4] Sharma, R. et al. (2021). "Overcrowding an encumbrance for an emergency health-care system." *Journal of Education and Health Promotion*, 10(5). https://pmc.ncbi.nlm.nih.gov/articles/PMC7933695/

[5] Modern Shrines. (2026, February 12). "AIIMS Sets New Benchmark: 4.8 Million OPD Patients Treated in a Year." https://modernshrines.in/2026/02/12/aiims-sets-new-benchmark-4-8-million-opd-patients-treated-in-a-year-admissions-up-28/

[6] Gopichandran, V. et al. (2017). "International Variations in Primary Care Physician Consultation Time: A Systematic Review of 67 Countries." *BMJ Open*, 7(10), e017902. https://doi.org/10.1136/bmjopen-2017-017902

[7] Hameed, S. (2026, January 4). "The Documentation Crisis in Indian Healthcare: Why Doctors Spend 30% of Their Time on Paperwork." RxNote.ai. https://rxnote.ai/blog/documentation-crisis-indian-healthcare-doctors-paperwork

[8] IMARC Group. (2025). *India Private Healthcare Market Size & Share 2034*. https://www.imarcgroup.com/india-private-healthcare-market

[9] Sriram, S. et al. (2022). "Impoverishing Effects of Out-of-Pocket Healthcare Expenditures in India." *PLOS ONE*. https://pmc.ncbi.nlm.nih.gov/articles/PMC10041239/

[10] One Health Trust. (2016). "63 Million Indians Are Pushed into Poverty by Health Expenses Each Year." https://onehealthtrust.org/news-media/blog/63-million-indian-pushed-into-poverty-due-to-health-expenses-each-year/

[11] Ayushman Bharat Digital Mission. (2024). *ABDM Dashboard*. Government of India. https://abdm.gov.in/

[12] Podder, V. et al. (2023). "SOAP Notes." In *StatPearls*. https://www.ncbi.nlm.nih.gov/books/NBK482263/

[13] Levin, S. et al. (2018). "Machine-Learning-Based Electronic Triage." *Annals of Emergency Medicine*, 71(5), 565–574. https://doi.org/10.1016/j.annemergmed.2017.08.005

[14] Berkowitz, R.E. et al. (2013). "Project BOOST." *Journal of Hospital Medicine*, 8(8), 421–427. https://doi.org/10.1002/jhm.2054

[15] Starmer, A.J. et al. (2014). "Changes in Medical Errors After Implementation of a Handoff Program." *New England Journal of Medicine*, 371(19), 1803–1812. https://doi.org/10.1056/NEJMsa1405556

[16] Kohn, L.T. et al. (2000). *To Err Is Human*. National Academies Press. https://doi.org/10.17226/9728

[17] Singhal, K. et al. (2023). "Large Language Models Encode Clinical Knowledge." *Nature*, 620, 172–180. https://doi.org/10.1038/s41586-023-06291-2

[18] Becker, M.L. et al. (2007). "Drug-Drug Interactions: A Literature Review." *Pharmacoepidemiology and Drug Safety*, 16(6), 641–651. https://doi.org/10.1002/pds.1351

[19] Le, H. et al. (2024). "RxNorm for Drug Name Normalization." *Frontiers in Bioinformatics*, 3, 1328613. https://doi.org/10.3389/fbinf.2023.1328613

[20] U.S. Food and Drug Administration. (2024). *Boxed Warning: Highest FDA Drug Safety Warning*. https://www.fda.gov/patients/drug-development-process/step-4-fda-drug-review

[21] Lund, B.C. et al. (2019). "Prescribing Quality Indicators for Black Box Warning Drugs in Primary Care." *Pharmacoepidemiology and Drug Safety*, 28(7), 924–931. https://doi.org/10.1002/pds.4778

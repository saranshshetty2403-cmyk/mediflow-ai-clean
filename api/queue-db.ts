import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

// Prefer the unpooled connection for DDL (CREATE TABLE) and DML operations.
// Neon's pooled URL (DATABASE_URL) uses PgBouncer which doesn't support all
// statement types. DATABASE_URL_UNPOOLED is the direct connection.
const getDb = () => {
  const url =
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.STORAGE_URL;
  if (!url) throw new Error("No database URL configured");
  return neon(url);
};

// Ensure the table exists — called on every request (cheap after first run)
async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS queue_cases (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      urgency TEXT NOT NULL,
      confidence REAL NOT NULL,
      department TEXT NOT NULL,
      input_snippet TEXT NOT NULL,
      patient_name TEXT,
      patient_age TEXT,
      processing_ms INTEGER,
      risk_score INTEGER,
      created_at BIGINT NOT NULL
    )
  `;
  // Add columns that may be missing in older table versions (safe to run repeatedly)
  await sql`ALTER TABLE queue_cases ADD COLUMN IF NOT EXISTS processing_ms INTEGER`;
  await sql`ALTER TABLE queue_cases ADD COLUMN IF NOT EXISTS risk_score INTEGER`;
  await sql`ALTER TABLE queue_cases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`;
  await sql`ALTER TABLE queue_cases ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT ''`;
  await sql`ALTER TABLE queue_cases ADD COLUMN IF NOT EXISTS audit_log TEXT DEFAULT '[]'`;
  await sql`ALTER TABLE queue_cases ADD COLUMN IF NOT EXISTS urgency_reasons TEXT DEFAULT '[]'`;
  await sql`ALTER TABLE queue_cases ADD COLUMN IF NOT EXISTS med_scan_data TEXT DEFAULT NULL`;
  await sql`ALTER TABLE queue_cases ADD COLUMN IF NOT EXISTS scan_image_url TEXT DEFAULT NULL`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    await ensureTable();
    const sql = getDb();

    if (req.method === "GET") {
      const rows = await sql`
        SELECT * FROM queue_cases ORDER BY created_at DESC LIMIT 200
      `;
      const cases = rows.map((r) => ({
        id: r.id,
        type: r.type,
        content: r.content,
        urgency: r.urgency,
        confidence: Number(r.confidence),
        department: r.department,
        inputSnippet: r.input_snippet,
        patientName: r.patient_name,
        patientAge: r.patient_age,
        processingMs: r.processing_ms ? Number(r.processing_ms) : undefined,
        riskScore: r.risk_score ? Number(r.risk_score) : undefined,
        status: r.status ?? "pending",
        createdAt: Number(r.created_at),
        notes: r.notes ?? "",
        auditLog: (() => { try { return JSON.parse(r.audit_log ?? "[]"); } catch { return []; } })(),
        urgencyReasons: (() => { try { return JSON.parse(r.urgency_reasons ?? "[]"); } catch { return []; } })(),
        medScanData: (() => { try { return r.med_scan_data ? JSON.parse(r.med_scan_data) : undefined; } catch { return undefined; } })(),
        scanImageUrl: r.scan_image_url ?? undefined,
      }));
      return res.status(200).json({ cases });
    }

    if (req.method === "POST") {
      const c = req.body;
      if (!c || !c.id) return res.status(400).json({ error: "Invalid case — missing id" });

      const urgencyReasonsJson = JSON.stringify(Array.isArray(c.urgencyReasons) ? c.urgencyReasons : []);
      // Serialise medScanData for MediScan cases; null for all others
      const medScanDataJson = (c.type === "medscan" && c.medScanData)
        ? JSON.stringify(c.medScanData)
        : null;
      // Build initial audit log entry for case creation
      const initAuditLog = JSON.stringify([{
        action: "created",
        timestamp: Date.now(),
        detail: `Case created via ${c.type ?? "unknown"} module`,
      }]);

      await sql`
        INSERT INTO queue_cases (
          id, type, content, urgency, confidence, department,
          input_snippet, patient_name, patient_age,
          processing_ms, risk_score, status, created_at,
          notes, audit_log, urgency_reasons, med_scan_data, scan_image_url
        )
        VALUES (
          ${c.id},
          ${c.type ?? "unknown"},
          ${c.content ?? ""},
          ${c.urgency ?? "low"},
          ${Number(c.confidence) || 0},
          ${c.department ?? "General"},
          ${c.inputSnippet ?? ""},
          ${c.patientName ?? null},
          ${c.patientAge ?? null},
          ${c.processingMs ? Number(c.processingMs) : null},
          ${c.riskScore ? Number(c.riskScore) : null},
          ${c.status ?? "pending"},
          ${Number(c.createdAt) || Date.now()},
          ${c.notes ?? ""},
          ${initAuditLog},
          ${urgencyReasonsJson},
          ${medScanDataJson},
          ${(c.type === "medscan" && c.scanImageUrl) ? c.scanImageUrl : null}
        )
        ON CONFLICT (id) DO UPDATE SET
          content          = EXCLUDED.content,
          urgency          = EXCLUDED.urgency,
          confidence       = EXCLUDED.confidence,
          patient_name     = EXCLUDED.patient_name,
          patient_age      = EXCLUDED.patient_age,
          processing_ms    = EXCLUDED.processing_ms,
          risk_score       = EXCLUDED.risk_score,
          status           = EXCLUDED.status,
          urgency_reasons  = EXCLUDED.urgency_reasons,
          med_scan_data    = COALESCE(EXCLUDED.med_scan_data, queue_cases.med_scan_data),
          scan_image_url   = COALESCE(EXCLUDED.scan_image_url, queue_cases.scan_image_url)
      `;
      return res.status(200).json({ ok: true });
    }

    // PATCH — partial update: notes, audit_log append, status change
    if (req.method === "PATCH") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Missing id" });
      const body = req.body as {
        notes?: string;
        auditEntry?: { action: string; detail?: string; timestamp?: number };
        status?: string;
        medScanData?: unknown;
      };

      // Fetch current audit_log
      const rows = await sql`SELECT audit_log, notes, status, med_scan_data FROM queue_cases WHERE id = ${id as string}`;
      if (!rows.length) return res.status(404).json({ error: "Case not found" });

      let currentLog: Array<Record<string, unknown>> = [];
      try { currentLog = JSON.parse(rows[0].audit_log ?? "[]"); } catch { currentLog = []; }

      if (body.auditEntry) {
        currentLog.push({ ...body.auditEntry, timestamp: body.auditEntry.timestamp ?? Date.now() });
      }

      const newNotes = body.notes !== undefined ? body.notes : rows[0].notes;
      const newStatus = body.status !== undefined ? body.status : rows[0].status;
      const newLog = JSON.stringify(currentLog);
      // Allow updating medScanData via PATCH (e.g. after editing extracted text)
      const newMedScanData = body.medScanData !== undefined
        ? JSON.stringify(body.medScanData)
        : rows[0].med_scan_data;

      await sql`
        UPDATE queue_cases
        SET notes = ${newNotes}, audit_log = ${newLog}, status = ${newStatus}, med_scan_data = ${newMedScanData}
        WHERE id = ${id as string}
      `;
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (id) {
        await sql`DELETE FROM queue_cases WHERE id = ${id as string}`;
      } else {
        await sql`DELETE FROM queue_cases`;
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[queue-db error]", message);
    return res.status(500).json({ error: message });
  }
}

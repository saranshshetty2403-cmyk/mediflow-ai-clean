import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Read .env.local manually
let dbUrl;
try {
  const env = readFileSync("/home/ubuntu/mediflow-vercel/.env.local", "utf8");
  for (const line of env.split("\n")) {
    if (line.startsWith("DATABASE_URL_UNPOOLED=")) dbUrl = line.split("=").slice(1).join("=").trim();
    if (!dbUrl && line.startsWith("DATABASE_URL=")) dbUrl = line.split("=").slice(1).join("=").trim();
  }
} catch {}

if (!dbUrl) {
  console.error("No DB URL found in .env.local");
  process.exit(1);
}

const sql = neon(dbUrl);

// Check current timestamps
const rows = await sql`SELECT id, patient_name, created_at FROM queue_cases ORDER BY created_at DESC LIMIT 20`;
console.log("Current top 20 rows by created_at:");
rows.forEach(r => {
  const ts = Number(r.created_at);
  const date = ts > 0 ? new Date(ts).toISOString() : "INVALID";
  console.log(`  ${r.patient_name?.padEnd(25)} created_at=${r.created_at} => ${date}`);
});

// Check how many have the same timestamp
const allRows = await sql`SELECT id, patient_name, created_at FROM queue_cases ORDER BY id`;
const tsCounts = {};
for (const r of allRows) {
  const ts = String(r.created_at);
  tsCounts[ts] = (tsCounts[ts] || 0) + 1;
}
const duplicates = Object.entries(tsCounts).filter(([, count]) => count > 1);
console.log(`\nTotal rows: ${allRows.length}`);
console.log(`Unique timestamps: ${Object.keys(tsCounts).length}`);
console.log(`Timestamps with duplicates: ${duplicates.length}`);
if (duplicates.length > 0) {
  console.log("Sample duplicate timestamps:", duplicates.slice(0, 3));
}

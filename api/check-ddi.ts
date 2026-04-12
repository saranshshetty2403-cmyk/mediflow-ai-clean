import type { VercelRequest, VercelResponse } from "@vercel/node";

interface DDIResult {
  drug: string;
  interactions: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { medications } = req.body as { medications: string[] };

  if (!medications || medications.length < 2) {
    return res.json({ alerts: [] });
  }

  const alerts: DDIResult[] = [];

  // Check each drug against OpenFDA drug interaction endpoint
  for (const drug of medications.slice(0, 6)) { // limit to 6 drugs max
    const cleanName = drug.trim().toLowerCase().replace(/\s+/g, "+");
    if (!cleanName) continue;

    try {
      const url = `https://api.fda.gov/drug/label.json?search=drug_interactions:"${encodeURIComponent(drug.trim())}"&limit=1`;
      const fdaRes = await fetch(url, {
        headers: { "User-Agent": "MediFlow-AI/1.0" },
        signal: AbortSignal.timeout(5000),
      });

      if (!fdaRes.ok) continue;

      const fdaData = await fdaRes.json() as {
        results?: Array<{ drug_interactions?: string[] }>;
      };

      const interactions = fdaData.results?.[0]?.drug_interactions ?? [];
      if (interactions.length === 0) continue;

      // Parse the interaction text to find mentions of other drugs in the prescription
      const interactionText = interactions[0];
      const mentionedDrugs = medications.filter(
        (other) =>
          other !== drug &&
          interactionText.toLowerCase().includes(other.toLowerCase().split(" ")[0])
      );

      if (mentionedDrugs.length > 0) {
        // Extract a short snippet about the interaction
        const snippets: string[] = [];
        for (const mention of mentionedDrugs) {
          const keyword = mention.split(" ")[0].toLowerCase();
          const idx = interactionText.toLowerCase().indexOf(keyword);
          if (idx >= 0) {
            const start = Math.max(0, idx - 30);
            const end = Math.min(interactionText.length, idx + 120);
            snippets.push(`...${interactionText.slice(start, end).trim()}...`);
          }
        }
        if (snippets.length > 0) {
          alerts.push({
            drug,
            interactions: snippets.slice(0, 2),
          });
        }
      }
    } catch {
      // Silently skip FDA lookup failures — non-critical
      continue;
    }
  }

  return res.json({ alerts });
}

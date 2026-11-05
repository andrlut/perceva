/**
 * Partner content in the Recanto (migration 20261104000009). A sponsored
 * material carries a "Patrocinado · {name}" badge (`learning.sponsorWith`,
 * drawn by components/learning/SponsorLine) on every surface it reaches —
 * cover, material screen, idea screen, idea cards, Explorar — and is never
 * locked by the free window (learnGate).
 */
export interface SponsorInfo {
  name: string;
  /** `partner_campaign.id` the material belongs to, when there is one —
   *  the material screen's CTA opens `/campaign/<id>`. */
  campaignId: string | null;
}

function cleanText(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

/**
 * The sponsor of a row, tolerant of every shape it arrives in: a material
 * row (`sponsor` jsonb), a `learning_idea_public` row (`sponsor_name` /
 * `sponsor_campaign_id`, flattened by the view), a row cached before the
 * column existed (no field at all) or a malformed jsonb. Never throws — the
 * same contract as `categoryOf()`. A blank name is no sponsor.
 */
export function sponsorOf(
  row:
    | {
        sponsor?: unknown;
        sponsor_name?: string | null;
        sponsor_campaign_id?: string | null;
      }
    | null
    | undefined,
): SponsorInfo | null {
  if (!row) return null;
  const s = row.sponsor;
  if (s != null && typeof s === 'object' && !Array.isArray(s)) {
    const obj = s as Record<string, unknown>;
    const name = cleanText(obj.name);
    if (name) return { name, campaignId: cleanText(obj.campaign_id) };
  }
  const name = cleanText(row.sponsor_name);
  if (name) return { name, campaignId: cleanText(row.sponsor_campaign_id) };
  return null;
}

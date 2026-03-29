import { prisma } from "@/lib/db";

export type PromptCheckResult =
  | { ok: true }
  | { ok: false; reason: string; matchedTerm?: string };

function normalize(s: string) {
  return s.toLowerCase().replace(/[^\w\s]/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export async function checkPromptForBlockedTerms(prompt: string): Promise<PromptCheckResult> {
  const p = prompt.toLowerCase();
  if (p.includes("in the style of")) {
    return { ok: false, reason: "Artist/style imitation phrasing is not allowed." };
  }

  const envTerms = (process.env.BLOCKED_TERMS ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const dbTerms = await prisma.blockedTerm.findMany({ select: { term: true } });
  const all = [...envTerms, ...dbTerms.map((t) => t.term)];
  
  const normalizedPrompt = normalize(p);
  const promptWords = normalizedPrompt.split(/\s+/).filter(Boolean);
  const promptNoSpaces = normalizedPrompt.replace(/\s+/g, "");

  for (const termDef of all) {
    // Support aliases via |
    const aliases = termDef.split("|").map(a => a.trim().toLowerCase()).filter(Boolean);
    
    for (const alias of aliases) {
      // 1. Exact substring with word boundaries
      const boundaryRegex = new RegExp(`\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (boundaryRegex.test(p)) {
        return { ok: false, reason: "Contains blocked artist/label term (exact match).", matchedTerm: termDef };
      }

      const normalizedAlias = normalize(alias);
      if (!normalizedAlias) continue;
      
      // 2. Space-removed match (e.g. "daft punk" vs "daftpunk")
      const aliasNoSpaces = normalizedAlias.replace(/\s+/g, "");
      if (aliasNoSpaces.length > 4 && promptNoSpaces.includes(aliasNoSpaces)) {
        return { ok: false, reason: "Contains blocked artist/label term (obfuscated match).", matchedTerm: termDef };
      }

      // 3. Fuzzy match (Levenshtein) on single words
      // Only do this for single-word aliases > 4 chars to avoid false positives
      const aliasWords = normalizedAlias.split(/\s+/).filter(Boolean);
      if (aliasWords.length === 1 && aliasWords[0].length > 4) {
        const target = aliasWords[0];
        for (const word of promptWords) {
          if (Math.abs(word.length - target.length) <= 2) {
            const dist = levenshtein(word, target);
            if (dist <= 1) {
              return { ok: false, reason: "Contains blocked artist/label term (fuzzy match).", matchedTerm: termDef };
            }
          }
        }
      }
    }
  }
  
  return { ok: true };
}


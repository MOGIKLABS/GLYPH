export function serializeStyleRefs(refs: string[]) {
  return JSON.stringify(refs);
}

export function deserializeStyleRefs(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
    return [];
  } catch {
    return [];
  }
}


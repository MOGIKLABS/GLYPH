export type EffectName = "reverb" | "delay" | "distortion" | "chorus";
export type EffectState = Record<EffectName, { enabled: boolean; amount: number }>;

export const GEMINI_MODELS = [
  // ── Gemini 3 Series (más recientes) ──────────────────────────────
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro',
    description: 'Máximo razonamiento — quizzes complejos, multi-paso y código avanzado',
    tier: 'pro' as const,
  },
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    description: 'Rendimiento de frontera a bajo costo — ideal para generación y evaluación de quizzes',
    tier: 'flash' as const,
  },
  {
    id: 'gemini-3.1-flash-lite-preview',
    label: 'Gemini 3.1 Flash Lite',
    description: 'El más económico — perfecto para preguntas de refinamiento y tags',
    tier: 'lite' as const,
  },
  // ── Gemini 2.5 Series (estables) ─────────────────────────────────
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'Razonamiento profundo y estable — quizzes técnicos exigentes y evaluación de código',
    tier: 'pro' as const,
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Equilibrio precio/rendimiento — generación de quiz fluida y chat tutor responsivo',
    tier: 'flash' as const,
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    description: 'Más rápido y económico — refinamiento de tema, Anki cards y tareas ligeras',
    tier: 'lite' as const,
  },
] as const;

export type GeminiModelTier = typeof GEMINI_MODELS[number]['tier'];
export type GeminiModelId = typeof GEMINI_MODELS[number]['id'];
export const DEFAULT_MODEL: GeminiModelId = 'gemini-2.5-flash';

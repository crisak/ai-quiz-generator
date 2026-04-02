export const GEMINI_MODELS = [
  // ── Gemini 3 Series (más recientes) ──────────────────────────────
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro',
    description: 'El modelo más potente disponible. Ideal para generar quizzes muy complejos con múltiples tipos de preguntas, código avanzado y razonamiento profundo.',
    tier: 'pro' as const,
  },
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    description: 'Rendimiento de frontera a bajo costo. Excelente para generación de quizzes, evaluación de respuestas y chat tutor con alta calidad y velocidad aceptable.',
    tier: 'flash' as const,
  },
  {
    id: 'gemini-3.1-flash-lite-preview',
    label: 'Gemini 3.1 Flash Lite',
    description: 'El más económico de la serie 3. Perfecto para tareas ligeras como sugerencias de tema, generación de tags y tarjetas Anki simples.',
    tier: 'lite' as const,
  },
  // ── Gemini 2.5 Series (estables) ─────────────────────────────────
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'Razonamiento profundo y estable. Recomendado para generar quizzes técnicos exigentes, evaluar código y preguntas de respuesta abierta con alta precisión.',
    tier: 'pro' as const,
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'El mejor equilibrio entre velocidad y calidad. Ideal para el chat con tutor IA: respuestas fluidas, contexto largo y costo moderado.',
    tier: 'flash' as const,
  },
  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    description: 'El más rápido y económico de los modelos estables. Perfecto para sugerencias de refinamiento, generación de tags y tarjetas Anki.',
    tier: 'lite' as const,
  },
  // ── Gemini 2.0 Series (cuota gratuita) ───────────────────────────
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2 Flash',
    description: 'Modelo rápido de la serie 2.0, incluido en la cuota gratuita. Buen rendimiento para chat y generación de quizzes básicos a costo cero.',
    tier: 'flash' as const,
  },
  {
    id: 'gemini-2.0-flash-lite',
    label: 'Gemini 2 Flash Lite',
    description: 'La opción más económica de la serie 2.0. Perfecto para sugerencias ligeras y tarjetas Anki con máxima velocidad en cuota gratuita.',
    tier: 'lite' as const,
  },
] as const;

export type GeminiModelTier = typeof GEMINI_MODELS[number]['tier'];
export type GeminiModelId = typeof GEMINI_MODELS[number]['id'];
export type ModelUseCase = 'suggestions' | 'quiz' | 'chat' | 'anki';

export interface ModelConfig {
  modelSuggestions: GeminiModelId;
  modelQuiz: GeminiModelId;
  modelChat: GeminiModelId;
  modelAnki: GeminiModelId;
}

export const DEFAULT_MODEL_CONFIG: ModelConfig = {
  modelSuggestions: 'gemini-2.5-flash-lite',
  modelQuiz: 'gemini-2.5-pro',
  modelChat: 'gemini-2.5-flash',
  modelAnki: 'gemini-2.5-flash-lite',
};

export const USE_CASE_META: Record<ModelUseCase, { title: string; description: string; modelKey: keyof ModelConfig }> = {
  suggestions: {
    title: 'Sugerencias de tema',
    description: 'Genera las 3 preguntas de refinamiento antes del quiz. Tarea ligera — velocidad sobre potencia.',
    modelKey: 'modelSuggestions',
  },
  quiz: {
    title: 'Generación de quiz',
    description: 'Crea todas las preguntas del quiz y evalúa respuestas abiertas y código. Usa el modelo más potente para mayor calidad.',
    modelKey: 'modelQuiz',
  },
  chat: {
    title: 'Chat con tutor IA',
    description: 'Responde dudas durante el quiz con contexto de la pregunta. Necesita ser fluido, responsivo y manejar conversaciones largas.',
    modelKey: 'modelChat',
  },
  anki: {
    title: 'Tarjetas Anki',
    description: 'Analiza la conversación del tutor y genera tarjetas de repaso. Tarea ligera sin necesidad de razonamiento profundo.',
    modelKey: 'modelAnki',
  },
};

// Backward-compat alias
export const DEFAULT_MODEL: GeminiModelId = DEFAULT_MODEL_CONFIG.modelChat;

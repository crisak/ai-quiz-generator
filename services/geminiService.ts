
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { Question, RefinementQuestion, AnkiCard, AnkiSuggestion, QuestionType, ChatMessage, DocumentContext } from "../types";

// Get API key from runtime config (set in index.html, NOT from import.meta.env to avoid compilation)
const getApiKey = (): string => {
  // Check window config first (injected at runtime, not compiled)
  const windowConfig = (window as any).__QUIZ_IA_CONFIG__;
  if (windowConfig?.GEMINI_API_KEY) {
    return windowConfig.GEMINI_API_KEY;
  }

  // Fallback to direct window variable
  if ((window as any).__GEMINI_API_KEY__) {
    return (window as any).__GEMINI_API_KEY__;
  }

  return '';
};

const apiKey = getApiKey();
if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY not configured. Please set VITE_GEMINI_API_KEY in .env.local');
}

const ai = new GoogleGenAI({ apiKey });

// Custom error class for API errors
export class GeminiAPIError extends Error {
  constructor(
    public statusCode: number | null,
    public status: string | null,
    public retryAfter: number | null,
    message: string
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

// Extract useful information from Gemini API error responses
function parseGeminiError(error: any): { message: string; statusCode: number | null; status: string | null; retryAfter: number | null } {
  let message = "Error desconocido al conectar con la IA.";
  let statusCode: number | null = null;
  let status: string | null = null;
  let retryAfter: number | null = null;

  // Handle Gemini API error format
  if (error?.error) {
    const errorObj = error.error;
    statusCode = errorObj.code || null;
    status = errorObj.status || null;

    // Extract retry delay from RetryInfo if available
    if (errorObj.details) {
      const retryInfo = errorObj.details.find((d: any) => d['@type']?.includes('RetryInfo'));
      if (retryInfo?.retryDelay) {
        // Parse duration string like "41.784300701s"
        const match = retryInfo.retryDelay.match(/(\d+(?:\.\d+)?)/);
        if (match) {
          retryAfter = Math.ceil(parseFloat(match[1]));
        }
      }
    }

    // Map status codes to user-friendly messages
    if (statusCode === 429 || status === 'RESOURCE_EXHAUSTED') {
      message = `Cuota de API excedida. ${retryAfter ? `Intenta nuevamente en ${retryAfter} segundos.` : 'Intenta más tarde.'}`;
    } else if (statusCode === 401 || status === 'UNAUTHENTICATED') {
      message = "Clave de API no válida o expirada. Verifica tu GEMINI_API_KEY en .env.local.";
    } else if (statusCode === 403 || status === 'PERMISSION_DENIED') {
      message = "Permiso denegado. Verifica tu cuenta de Gemini API.";
    } else if (errorObj.message) {
      // Use the original error message if available
      message = `Error de API: ${errorObj.message.split('\n')[0]}`;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return { message, statusCode, status, retryAfter };
}

// Build the `contents` value for generateContent calls.
// - Text files: appended inline to the prompt string.
// - PDF files: passed as a separate inlineData part (multimodal).
function buildContents(promptText: string, docCtx?: DocumentContext): any {
  if (docCtx?.base64) {
    return [
      { text: promptText },
      { inlineData: { mimeType: docCtx.mimeType, data: docCtx.base64 } },
    ];
  }
  if (docCtx?.text) {
    const MAX_CHARS = 40_000;
    const content =
      docCtx.text.length > MAX_CHARS
        ? docCtx.text.slice(0, MAX_CHARS) + '\n[... contenido truncado ...]'
        : docCtx.text;
    return `${promptText}\n\nCONTEXTO DEL DOCUMENTO ADJUNTO ("${docCtx.name}"):\n---\n${content}\n---\nUsa este documento como fuente principal.`;
  }
  return promptText;
}

export const generateRefinementQuestions = async (topic: string, documentContext?: DocumentContext): Promise<RefinementQuestion[]> => {
  try {
    const basePrompt = documentContext
      ? `El usuario quiere un quiz sobre: "${topic}" y ha adjuntado un documento de referencia. Genera 3 preguntas breves para refinar el enfoque del quiz basado en el documento (ej: nivel de dificultad, secciones específicas a priorizar, enfoque teórico vs práctico).`
      : `El usuario quiere un quiz sobre: "${topic}". Genera 3 preguntas breves para refinar su enfoque (ej: nivel de dificultad, subtemas específicos, enfoque teórico vs práctico).`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: buildContents(basePrompt, documentContext),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
            },
            required: ["id", "text"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error: any) {
    const { message, statusCode, status, retryAfter } = parseGeminiError(error);
    throw new GeminiAPIError(statusCode, status, retryAfter, message);
  }
};

export const generateQuiz = async (topic: string, count: number, refinements: Record<string, string>, questionTypes: QuestionType[] = ['single'], documentContext?: DocumentContext): Promise<Question[]> => {
  try {
    const refinementContext = Object.entries(refinements).map(([q, a]) => `${q}: ${a}`).join('; ');
    const docNote = documentContext
      ? ' Usa el documento adjunto como fuente principal; extrae conceptos, definiciones y ejemplos directamente de él.'
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: buildContents(`Genera un quiz sobre "${topic}".${docNote}
      Contexto adicional: ${refinementContext}.
      El quiz debe tener exactamente ${count} preguntas.

      REGLAS CRÍTICAS DE CONTENIDO:
      1. Si la pregunta requiere analizar un fragmento de código (ej: "¿Cuál es la salida de este código?"), el código DEBE estar incluido obligatoriamente dentro del campo 'question' usando bloques de código markdown (ej: \`\`\`python ... \`\`\`). NUNCA dejes la pregunta sin el código si haces referencia a él.
      2. Asegúrate de que el código tenga una indentación y formato perfectos para que sea legible.
      3. NUNCA uses backticks simples (\`) para fragmentos de código multilínea.

      Tipos de preguntas a generar (distribúyelas proporcionalmente entre los tipos seleccionados: ${questionTypes.join(', ')}):
      - "single": una opción correcta. Requiere correctIndex (integer) y options (4 opciones). correctIndices debe ser [].
      - "multi": múltiples opciones correctas (mínimo 2). Requiere correctIndices (array of integers) y options (4-5 opciones). correctIndex debe ser -1.
      - "open": sin opciones. El usuario escribe la respuesta. Requiere correctAnswer (string con la respuesta modelo). options debe ser []. correctIndex debe ser -1.
      - "code": desafío de programación interactivo. El usuario escribe/completa código en un editor. Requiere:
          starterCode (string): plantilla inicial con la firma de función y comentarios guía. Si el desafío es desde cero, puede ser solo un comentario o string vacío.
          codeLanguage (string): lenguaje sugerido (ej: "python", "javascript", "java", "cpp", "typescript", "go", "rust"). Elige el más natural para el tema.
          correctAnswer (string): solución completa de referencia en el codeLanguage sugerido.
          options debe ser []. correctIndex debe ser -1. correctIndices debe ser [].`, documentContext),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              questionType: { type: Type.STRING, description: "Tipo: 'single', 'multi', 'open', o 'code'" },
              question: { type: Type.STRING, description: "La pregunta completa. Si hay código, inclúyelo aquí con bloques de markdown." },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctIndex: { type: Type.INTEGER },
              correctIndices: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: "Para 'multi': todos los índices correctos"
              },
              correctAnswer: { type: Type.STRING, description: "Para 'open'/'code': respuesta/solución de referencia" },
              starterCode: { type: Type.STRING, description: "Para 'code': plantilla inicial con firma de función y comentarios guía" },
              codeLanguage: { type: Type.STRING, description: "Para 'code': lenguaje sugerido (python, javascript, java, cpp, etc.)" },
              explanation: { type: Type.STRING, description: "Explicación detallada. Usa Markdown." },
              wrongOptionExplanations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Explicación de por qué cada opción incorrecta no es válida."
              }
            },
            required: ["id", "questionType", "question", "options", "correctIndex", "explanation", "wrongOptionExplanations"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (parseError) {
      console.error("Error parsing quiz JSON:", parseError);
      throw new GeminiAPIError(null, null, null, "Error procesando respuesta de la IA. Intenta de nuevo.");
    }
  } catch (error: any) {
    if (error instanceof GeminiAPIError) {
      throw error;
    }
    const { message, statusCode, status, retryAfter } = parseGeminiError(error);
    throw new GeminiAPIError(statusCode, status, retryAfter, message);
  }
};

export const evaluateOpenAnswer = async (
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<{ isCorrect: boolean; feedback: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Evalúa la respuesta del usuario a esta pregunta de quiz.
Pregunta: ${question}
Respuesta correcta de referencia: ${correctAnswer}
Respuesta del usuario: ${userAnswer}

Determina si la respuesta del usuario es sustancialmente correcta (aunque no sea literal).
Da un feedback breve y educativo en español (máximo 2 oraciones).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ["isCorrect", "feedback"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error: any) {
    const { message, statusCode, status, retryAfter } = parseGeminiError(error);
    throw new GeminiAPIError(statusCode, status, retryAfter, message);
  }
};

export const evaluateCodeAnswer = async (
  question: string,
  correctAnswer: string,
  userCode: string,
  language: string
): Promise<{ isCorrect: boolean; feedback: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres un evaluador de código experto. Evalúa si el código del estudiante resuelve correctamente el siguiente desafío de programación.

Desafío: ${question}

Solución de referencia (${language}):
\`\`\`${language}
${correctAnswer}
\`\`\`

Código del estudiante (${language}):
\`\`\`${language}
${userCode}
\`\`\`

Criterios de evaluación:
1. ¿El código resuelve el problema planteado?
2. ¿La lógica es correcta?
3. ¿Maneja los casos básicos correctamente?

IMPORTANTE: No evalúes estilo de código, eficiencia, ni si usa exactamente el mismo algoritmo que la referencia. Solo importa que resuelva el problema correctamente.
Da un feedback educativo y constructivo en español (máximo 3 oraciones). Si hay un error específico en el código, señálalo.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ["isCorrect", "feedback"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error: any) {
    const { message, statusCode, status, retryAfter } = parseGeminiError(error);
    throw new GeminiAPIError(statusCode, status, retryAfter, message);
  }
};

export const createChatSession = (questionContext: string, chatHistory?: ChatMessage[]): Chat => {
  const history = chatHistory && chatHistory.length > 0
    ? chatHistory.map(msg => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.text }],
      }))
    : undefined;

  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `Eres un tutor experto. Estás ayudando a un estudiante con una pregunta específica de un quiz.

Contexto de la pregunta actual:
${questionContext}

Tus respuestas deben ser educativas, alentadoras y usar Markdown para formato.
Si necesitas mostrar diagramas, usa bloques de Mermaid: \`\`\`mermaid ... \`\`\`.
REGLA DE FORMATO: Asegúrate de que los bloques de código estén bien formateados.
REGLA DE CONTEXTO: Enfócate exclusivamente en esta pregunta. Cuando el estudiante haga una pregunta corta o ambigua (ej: "¿qué es X?", "¿por qué?", "explícame esto"), infiere que se refiere al contexto de esta pregunta específica y respóndela directamente sin pedir aclaraciones. No menciones otras preguntas del quiz a menos que el estudiante lo solicite explícitamente.`,
    },
    history,
  });
};

export const analyzeConversationForAnki = async (
  question: Question,
  explanation: string,
  chatHistory: string
): Promise<AnkiSuggestion[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza la siguiente conversación entre un tutor y un estudiante sobre una pregunta de un quiz.
      Identifica los términos o conceptos clave que el estudiante parece necesitar reforzar basándote en sus dudas y errores.

      Pregunta: ${question.question}
      Explicación: ${explanation}
      Chat: ${chatHistory}

      Genera un máximo de 10 sugerencias. Cada sugerencia debe ser un término con su definición técnica y el por qué es importante reforzarlo.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              definition: { type: Type.STRING },
              importance: { type: Type.STRING }
            },
            required: ["term", "definition", "importance"]
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error: any) {
    const { message, statusCode, status, retryAfter } = parseGeminiError(error);
    throw new GeminiAPIError(statusCode, status, retryAfter, message);
  }
};

export const generateAnkiCardsFromSuggestions = async (
  suggestions: AnkiSuggestion[],
  topic: string
): Promise<AnkiCard[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Convierte las siguientes sugerencias de estudio en tarjetas de Anki optimizadas.
      Tema General: ${topic}
      Sugerencias: ${JSON.stringify(suggestions)}

      REGLAS CRÍTICAS PARA LAS TARJETAS:
      1. Cada tarjeta debe ser COMPLETAMENTE AUTÓNOMA. NUNCA uses frases como "el fragmento anterior", "el ejemplo proporcionado", "el código visto", "como se mencionó", "el contexto dado", "el fragmento de política", "el escenario dado", etc.
      2. Si la pregunta implica código o un ejemplo específico, INCLUYE ese código o ejemplo directamente dentro del campo "front".
      3. Si la pregunta hace referencia a una situación concreta, describe esa situación completa dentro de la tarjeta.
      4. El estudiante debe poder responder correctamente la tarjeta sin ningún contexto externo adicional.

      Formato de salida esperado (JSON):
      {
        "cards": [
          {
            "front": "Pregunta clara y autónoma (incluye todo el contexto necesario)",
            "back": "Respuesta HTML: <b>negrita</b>, <br>, <code>código</code>",
            "tags": ["tag1"]
          }
        ]
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["front", "back", "tags"]
              }
            }
          },
          required: ["cards"]
        }
      }
    });
    const parsed = JSON.parse(response.text);
    return parsed.cards.map((c: any, i: number) => ({ ...c, id: `card-${Date.now()}-${i}` }));
  } catch (error: any) {
    const { message, statusCode, status, retryAfter } = parseGeminiError(error);
    throw new GeminiAPIError(statusCode, status, retryAfter, message);
  }
};

// Generates 3-5 short tags for a completed quiz session (async, non-blocking)
export const generateQuizTags = async (
  topic: string,
  questionTypes: QuestionType[]
): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Genera 3 a 5 tags cortos y descriptivos en español para un quiz sobre: "${topic}" con tipos de preguntas: ${questionTypes.join(', ')}.
Ejemplos de tags: "React", "Hooks", "avanzado", "frontend", "JavaScript", "anatomía", "cálculo".
Devuelve solo las tags relevantes al tema, sin repetir el tipo de pregunta.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['tags']
        }
      }
    });
    const parsed = JSON.parse(response.text);
    return (parsed.tags as string[]).slice(0, 5);
  } catch {
    return [];
  }
};

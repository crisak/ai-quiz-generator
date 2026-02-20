
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { Question, RefinementQuestion, AnkiCard, AnkiSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateRefinementQuestions = async (topic: string): Promise<RefinementQuestion[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `El usuario quiere un quiz sobre: "${topic}". Genera 3 preguntas breves para refinar su enfoque (ej: nivel de dificultad, subtemas específicos, enfoque teórico vs práctico).`,
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
};

export const generateQuiz = async (topic: string, count: number, refinements: Record<string, string>): Promise<Question[]> => {
  const refinementContext = Object.entries(refinements).map(([q, a]) => `${q}: ${a}`).join('; ');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Genera un quiz sobre "${topic}". 
    Contexto adicional: ${refinementContext}. 
    El quiz debe tener exactamente ${count} preguntas.
    
    REGLAS CRÍTICAS DE CONTENIDO:
    1. Si la pregunta requiere analizar un fragmento de código (ej: "¿Cuál es la salida de este código?"), el código DEBE estar incluido obligatoriamente dentro del campo 'question' usando bloques de código markdown (ej: \`\`\`python ... \`\`\`). NUNCA dejes la pregunta sin el código si haces referencia a él.
    2. Asegúrate de que el código tenga una indentación y formato perfectos para que sea legible. 
    3. NUNCA uses backticks simples (\`) para fragmentos de código multilínea.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING, description: "La pregunta completa. Si hay código, inclúyelo aquí con bloques de markdown." },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING, description: "Explicación detallada. Usa Markdown." },
            wrongOptionExplanations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Explicación de por qué cada opción incorrecta no es válida."
            }
          },
          required: ["id", "question", "options", "correctIndex", "explanation", "wrongOptionExplanations"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error parsing quiz JSON:", error);
    throw new Error("Failed to generate valid quiz data.");
  }
};

export const createChatSession = (questionContext: string): Chat => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `Eres un tutor experto. Estás ayudando a un estudiante con una pregunta específica de un quiz.
      Contexto de la pregunta: ${questionContext}
      Tus respuestas deben ser educativas, alentadoras y usar Markdown para formato.
      Si necesitas mostrar diagramas, usa bloques de Mermaid: \`\`\`mermaid ... \`\`\`.
      REGLA DE FORMATO: Asegúrate de que los bloques de código estén bien formateados.
      REGLA DE CONTEXTO: Enfócate exclusivamente en esta pregunta. No menciones otras preguntas del quiz a menos que el usuario lo haga explícitamente.`
    }
  });
};

export const analyzeConversationForAnki = async (
  question: Question,
  explanation: string,
  chatHistory: string
): Promise<AnkiSuggestion[]> => {
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
};

export const generateAnkiCardsFromSuggestions = async (
  suggestions: AnkiSuggestion[],
  topic: string
): Promise<AnkiCard[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Convierte las siguientes sugerencias de estudio en tarjetas de Anki optimizadas.
    Tema General: ${topic}
    Sugerencias: ${JSON.stringify(suggestions)}
    
    Formato de salida esperado (JSON):
    {
      "cards": [
        {
          "front": "Pregunta clara",
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
};

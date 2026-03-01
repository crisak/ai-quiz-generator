
export type QuestionType = 'single' | 'multi' | 'open' | 'code';
// 'code' = interactive coding challenge evaluated by AI (Monaco editor, not a textarea)

export interface Question {
  id: string;
  questionType: QuestionType;
  question: string;
  options: string[];          // For 'single'/'multi'. Empty [] for 'open'/'code'
  correctIndex: number;       // For 'single' (backward compat)
  correctIndices?: number[];  // For 'multi': all correct indices
  correctAnswer?: string;     // For 'open'/'code': reference answer
  starterCode?: string;       // For 'code': initial code template in the editor
  codeLanguage?: string;      // For 'code': suggested language (e.g. 'python', 'javascript')
  explanation: string;
  wrongOptionExplanations: string[]; // For 'single'/'multi'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface QuestionState {
  questionId: string;
  selectedIndices: number[];  // Selection for single/multi
  openAnswer: string;         // Text for open questions
  codeAnswer?: string;        // Code written by user for 'code' questions
  codeLanguage?: string;      // Language selected by user for 'code' questions
  aiFeedback?: string;        // AI feedback for open/code answer
  isCorrect: boolean;
  isFinished: boolean;
  chatHistory: ChatMessage[];
  vocabTerms: VocabTerm[];    // Per-question vocabulary queue
}

export interface QuizState {
  topic: string;
  questions: Question[];
  currentQuestionIndex: number;
  results: QuestionState[];
  isCompleted: boolean;
}

export interface RefinementQuestion {
  id: string;
  text: string;
  options?: string[];
}

export interface AnkiCard {
  id: string;
  questionId: string;
  front: string;
  back: string;
  tags: string[];
}

export interface VocabTerm {
  id: string;
  text: string;
}

export interface AnkiSuggestion {
  term: string;
  definition: string;
  importance: string;
}

export interface QuizExport {
  version: '1';
  exportedAt: string;
  topic: string;
  questionCount: number;
  questionTypes: QuestionType[];
  refinementAnswers: Record<string, string>;
  questions: Question[];
  pastResults: QuestionState[] | null;
  score: number | null;
}

export interface DocumentContext {
  name: string;
  text?: string;   // For .txt / .md files
  base64?: string; // For .pdf files (base64-encoded)
  mimeType: string;
}

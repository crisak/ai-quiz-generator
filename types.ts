
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  wrongOptionExplanations: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface QuestionState {
  questionId: string;
  attempts: number[];
  isCorrect: boolean;
  isFinished: boolean;
  chatHistory: ChatMessage[];
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

export interface AnkiSuggestion {
  term: string;
  definition: string;
  importance: string;
}

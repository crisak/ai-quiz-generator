
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import { QuizState, AnkiCard, QuestionType, RefinementQuestion } from '../types';

interface QuizStore {
  // Persisted data
  topic: string;
  questionCount: number;
  selectedTypes: QuestionType[];
  quiz: QuizState | null;
  globalAnkiCards: AnkiCard[];
  refinementQuestions: RefinementQuestion[] | null;
  refinementAnswers: Record<string, string>;
  currentSessionId: string | null;    // RxDB session id for auto-save
  selectedProjectId: string | null;   // project selected in sidebar

  // Setters
  setTopic: (topic: string) => void;
  setQuestionCount: (count: number) => void;
  toggleType: (type: QuestionType) => void;
  /** Supports plain value or functional updater */
  setQuiz: (quiz: QuizState | null | ((prev: QuizState | null) => QuizState | null)) => void;
  setRefinementQuestions: (q: RefinementQuestion[] | null) => void;
  setRefinementAnswers: (a: Record<string, string>) => void;
  addGlobalAnkiCards: (cards: AnkiCard[]) => void;
  removeGlobalAnkiCard: (id: string) => void;
  clearGlobalAnkiCards: () => void;
  setCurrentSessionId: (id: string | null) => void;
  setSelectedProjectId: (id: string | null) => void;
  /** Reset all state to initial values (used by "Nuevo Quiz") */
  resetAll: () => void;
}

const initialState = {
  topic: '',
  questionCount: 5,
  selectedTypes: ['single'] as QuestionType[],
  quiz: null,
  globalAnkiCards: [] as AnkiCard[],
  refinementQuestions: null,
  refinementAnswers: {} as Record<string, string>,
  currentSessionId: null as string | null,
  selectedProjectId: null as string | null,
};

/** Returns true once Zustand has rehydrated from localStorage */
export function useStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // Zustand persist rehydrates synchronously in the same tick when localStorage is available,
    // but the component may render before the effect runs. This effect fires after mount,
    // which is always after rehydration has completed.
    setHydrated(true);
  }, []);
  return hydrated;
}

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      ...initialState,

      setTopic: (topic) => set({ topic }),
      setQuestionCount: (questionCount) => set({ questionCount }),
      toggleType: (type) =>
        set((state) => ({
          selectedTypes: state.selectedTypes.includes(type)
            ? state.selectedTypes.filter((t) => t !== type)
            : [...state.selectedTypes, type],
        })),
      setQuiz: (quizOrUpdater) => {
        if (typeof quizOrUpdater === 'function') {
          set((state) => ({ quiz: quizOrUpdater(state.quiz) }));
        } else {
          set({ quiz: quizOrUpdater });
        }
      },
      setRefinementQuestions: (refinementQuestions) => set({ refinementQuestions }),
      setRefinementAnswers: (refinementAnswers) => set({ refinementAnswers }),
      addGlobalAnkiCards: (cards) =>
        set((state) => ({ globalAnkiCards: [...state.globalAnkiCards, ...cards] })),
      removeGlobalAnkiCard: (id) =>
        set((state) => ({ globalAnkiCards: state.globalAnkiCards.filter((c) => c.id !== id) })),
      clearGlobalAnkiCards: () => set({ globalAnkiCards: [] }),
      setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
      setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
      resetAll: () => set(initialState),
    }),
    {
      name: 'quiz-ia-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        topic: state.topic,
        questionCount: state.questionCount,
        selectedTypes: state.selectedTypes,
        quiz: state.quiz,
        globalAnkiCards: state.globalAnkiCards,
        refinementQuestions: state.refinementQuestions,
        refinementAnswers: state.refinementAnswers,
        currentSessionId: state.currentSessionId,
        selectedProjectId: state.selectedProjectId,
      }),
    }
  )
);

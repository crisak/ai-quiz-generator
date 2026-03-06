
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Question, QuestionType, QuizState, QuestionState, ChatMessage, RefinementQuestion, AnkiCard, VocabTerm, QuizExport, DocumentContext } from './types';
import { generateQuiz, generateRefinementQuestions, evaluateOpenAnswer, evaluateCodeAnswer, generateQuizTags, GeminiAPIError } from './services/geminiService';
import { useQuizStore } from './store/quizStore';
import { useRepositories } from './repositories/RepositoryContext';
import { HistorySidebar } from './components/history/HistorySidebar';
import { QuizBrowserMain } from './components/history/QuizBrowserMain';
import { CURRENT_USER_ID } from './constants/auth';
import type { QuizSession } from './repositories/interfaces';
import ChatSidebar from './components/ChatSidebar';
import CodeEditor from './components/CodeEditor';
import MarkdownRenderer from './components/MarkdownRenderer';
import SelectionTooltip from './components/SelectionTooltip';
import MarkdownWithHighlights from './components/MarkdownWithHighlights';
import HighlightedText from './components/HighlightedText';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './hooks/useTheme';
import {
  Brain,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  MessageCircle,
  Trophy,
  Info,
  Loader2,
  Download,
  BookOpen,
  Trash2,
  Library,
  X,
  PartyPopper,
  CheckSquare,
  Square,
  AlignLeft,
  Upload,
  FileDown,
  Code2,
  Paperclip,
  FileText,
  Lightbulb,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { nanoid } from 'nanoid';

const QUESTION_TYPES: { type: QuestionType; label: string; description: string; icon: React.ReactNode }[] = [
  { type: 'single', label: 'Única respuesta', description: 'Selecciona la opción correcta', icon: <CheckCircle2 size={18} /> },
  { type: 'multi', label: 'Multirespuesta', description: 'Selecciona todas las opciones correctas', icon: <CheckSquare size={18} /> },
  { type: 'open', label: 'Respuesta abierta', description: 'Escribe tu respuesta y la IA la evalúa', icon: <AlignLeft size={18} /> },
  { type: 'code', label: 'Practicar código', description: 'Resuelve un desafío en tu lenguaje preferido', icon: <Code2 size={18} /> },
];

const EXAMPLE_PROMPTS = [
  { emoji: '💻', label: 'React Hooks',       topic: 'React Hooks: useState, useEffect, useCallback y useMemo' },
  { emoji: '💻', label: 'SQL avanzado',      topic: 'SQL avanzado: JOINs, subconsultas y optimización de queries' },
  { emoji: '💻', label: 'Big O / Algoritmos', topic: 'Complejidad algorítmica Big O y estructuras de datos (árbol, hash, grafo)' },
  { emoji: '🩺', label: 'Sistema nervioso',  topic: 'Anatomía y fisiología del sistema nervioso central y periférico' },
  { emoji: '🩺', label: 'Farmacología',      topic: 'Mecanismos de acción, usos y efectos adversos de antibióticos' },
  { emoji: '📐', label: 'Cálculo diferencial', topic: 'Derivadas, regla de la cadena y optimización en cálculo diferencial' },
  { emoji: '📐', label: 'Álgebra lineal',    topic: 'Matrices, determinantes, espacios vectoriales y transformaciones lineales' },
  { emoji: '📄', label: 'Desde archivo',     topic: 'Conceptos clave del documento adjunto' },
] as const;

const App: React.FC = () => {
  useTheme();

  // Persisted data state (survives page reload)
  const {
    topic, setTopic,
    questionCount, setQuestionCount,
    selectedTypes, toggleType,
    quiz, setQuiz,
    globalAnkiCards, addGlobalAnkiCards, removeGlobalAnkiCard, clearGlobalAnkiCards,
    refinementQuestions, setRefinementQuestions,
    refinementAnswers, setRefinementAnswers,
    currentSessionId, setCurrentSessionId,
    selectedProjectId, setSelectedProjectId,
    resetAll,
  } = useQuizStore();

  const { quizSessions } = useRepositories();

  // Transient UI state (not persisted)
  const [loading, setLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluatingOpen, setEvaluatingOpen] = useState(false);
  const [showStudyList, setShowStudyList] = useState(false);
  const [showCodeSolution, setShowCodeSolution] = useState(false);

  // Pending chat message (from tooltip direct-search)
  const [pendingChatMessage, setPendingChatMessage] = useState<{ text: string; id: number } | null>(null);
  const pendingMsgCounter = React.useRef(0);

  // Import dialog
  const [importDialogData, setImportDialogData] = useState<QuizExport | null>(null);
  const importFileRef = React.useRef<HTMLInputElement>(null);

  // Context document attached by the user
  const [contextFile, setContextFile] = useState<DocumentContext | null>(null);
  const contextFileRef = React.useRef<HTMLInputElement>(null);

  const addUnknownTerm = useCallback((text: string) => {
    setQuiz(prev => {
      if (!prev) return prev;
      const idx = prev.currentQuestionIndex;
      const current = prev.results[idx];
      if (current.vocabTerms.some(t => t.text.toLowerCase() === text.toLowerCase())) return prev;
      const results = [...prev.results];
      results[idx] = { ...current, vocabTerms: [...current.vocabTerms, { id: nanoid(8), text }] };
      return { ...prev, results };
    });
  }, []);

  const removeUnknownTerm = useCallback((id: string) => {
    setQuiz(prev => {
      if (!prev) return prev;
      const idx = prev.currentQuestionIndex;
      const current = prev.results[idx];
      const results = [...prev.results];
      results[idx] = { ...current, vocabTerms: current.vocabTerms.filter(t => t.id !== id) };
      return { ...prev, results };
    });
  }, []);

  const editUnknownTerm = useCallback((termId: string, newText: string) => {
    setQuiz(prev => {
      if (!prev) return prev;
      const idx = prev.currentQuestionIndex;
      const current = prev.results[idx];
      const results = [...prev.results];
      results[idx] = {
        ...current,
        vocabTerms: current.vocabTerms.map(t => t.id === termId ? { ...t, text: newText } : t),
      };
      return { ...prev, results };
    });
  }, []);

  const clearUnknownTerms = useCallback(() => {
    setQuiz(prev => {
      if (!prev) return prev;
      const idx = prev.currentQuestionIndex;
      const results = [...prev.results];
      results[idx] = { ...results[idx], vocabTerms: [] };
      return { ...prev, results };
    });
  }, []);

  const directSearchTerm = useCallback((text: string) => {
    setShowChat(true);
    pendingMsgCounter.current += 1;
    setPendingChatMessage({ text: `¿Qué significa el término "${text}"?`, id: pendingMsgCounter.current });
  }, []);

  const requestRefinement = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const questions = await generateRefinementQuestions(topic, contextFile ?? undefined);
      setRefinementQuestions(questions);
    } catch (e) {
      if (e instanceof GeminiAPIError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error conectando con la IA. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const questions = await generateQuiz(topic, questionCount, refinementAnswers, selectedTypes, contextFile ?? undefined);
      const freshResults = questions.map(q => ({
        questionId: q.id,
        selectedIndices: [],
        openAnswer: '',
        codeAnswer: q.questionType === 'code' ? (q.starterCode || '') : undefined,
        codeLanguage: q.questionType === 'code' ? (q.codeLanguage || 'python') : undefined,
        isCorrect: false,
        isFinished: false,
        chatHistory: [],
        vocabTerms: [],
      }));
      setQuiz({
        topic,
        questions,
        currentQuestionIndex: 0,
        results: freshResults,
        isCompleted: false
      });
      clearGlobalAnkiCards();

      // Auto-save: create RxDB session
      try {
        const session = await quizSessions.create({
          userId: CURRENT_USER_ID,
          projectId: selectedProjectId ?? undefined,
          topic,
          questionCount,
          questionTypes: selectedTypes,
          tags: [],
          questions,
          results: freshResults,
          refinementAnswers,
          score: null,
          ankiCards: [],
          chatHistories: {},
        });
        setCurrentSessionId(session.id);
      } catch (dbErr) {
        console.warn('Could not save session to history:', dbErr);
      }
    } catch (e) {
      if (e instanceof GeminiAPIError) {
        setError(e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error generando quiz. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateChatHistory = useCallback((history: ChatMessage[]) => {
    setQuiz(prev => {
      if (!prev) return prev;
      const results = [...prev.results];
      results[prev.currentQuestionIndex] = { ...results[prev.currentQuestionIndex], chatHistory: history };
      return { ...prev, results };
    });
  }, [setQuiz]);

  const saveToGlobalAnki = useCallback((newCards: AnkiCard[]) => {
    addGlobalAnkiCards(newCards);
  }, [addGlobalAnkiCards]);

  const removeAnkiCard = (id: string) => {
    removeGlobalAnkiCard(id);
  };

  const downloadAllAnki = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ cards: globalAnkiCards }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `anki_cards_${topic.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const exportQuiz = useCallback(() => {
    if (!quiz) return;
    const correct = quiz.results.filter((r, i) => {
      const q = quiz.questions[i];
      if (q.questionType === 'open') return r.isCorrect && r.isFinished;
      return r.selectedIndices.length > 0 && r.isCorrect;
    }).length;
    const currentScore = Math.round((correct / quiz.questions.length) * 100);
    const quizExport: QuizExport = {
      version: '1',
      exportedAt: new Date().toISOString(),
      topic: quiz.topic,
      questionCount: quiz.questions.length,
      questionTypes: selectedTypes,
      refinementAnswers,
      questions: quiz.questions,
      pastResults: quiz.results,
      score: currentScore,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(quizExport, null, 2));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `quiz_${quiz.topic.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [quiz, selectedTypes, refinementAnswers]);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as QuizExport;
        if (!data.questions || !data.topic) throw new Error('Formato inválido');
        setImportDialogData(data);
        setError(null);
      } catch {
        setError('El archivo no es un quiz válido. Asegúrate de importar un archivo generado por Quiz IA.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleContextFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name;
    const mimeType = file.type || (name.endsWith('.md') ? 'text/markdown' : 'text/plain');

    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const blob = new Blob([ev.target?.result as ArrayBuffer]);
        const r2 = new FileReader();
        r2.onload = () => {
          const base64 = (r2.result as string).split(',')[1];
          setContextFile({ name, base64, mimeType: 'application/pdf' });
        };
        r2.readAsDataURL(blob);
      };
      reader.readAsArrayBuffer(file);
    } else {
      // .txt / .md
      const reader = new FileReader();
      reader.onload = (ev) => {
        setContextFile({ name, text: ev.target?.result as string, mimeType });
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleImportOption = async (option: 'retomar' | 'rehacer' | 'nuevo') => {
    if (!importDialogData) return;

    const freshResults = importDialogData.questions.map(q => ({
      questionId: q.id,
      selectedIndices: [] as number[],
      openAnswer: '',
      codeAnswer: q.questionType === 'code' ? (q.starterCode || '') : undefined,
      codeLanguage: q.questionType === 'code' ? (q.codeLanguage || 'python') : undefined,
      isCorrect: false,
      isFinished: false,
      chatHistory: [] as ChatMessage[],
      vocabTerms: [] as VocabTerm[],
    }));

    if (option === 'retomar') {
      const pastResults = importDialogData.pastResults!.map(r => ({
        ...r,
        vocabTerms: r.vocabTerms || [],
      }));
      const firstUnanswered = pastResults.findIndex(r => !r.isFinished);
      setQuiz({
        topic: importDialogData.topic,
        questions: importDialogData.questions,
        currentQuestionIndex: firstUnanswered >= 0 ? firstUnanswered : 0,
        results: pastResults,
        isCompleted: false,
      });
      setTopic(importDialogData.topic);
      clearGlobalAnkiCards();
      setImportDialogData(null);
    } else if (option === 'rehacer') {
      setQuiz({
        topic: importDialogData.topic,
        questions: importDialogData.questions,
        currentQuestionIndex: 0,
        results: freshResults,
        isCompleted: false,
      });
      setTopic(importDialogData.topic);
      clearGlobalAnkiCards();
      setImportDialogData(null);
    } else {
      // 'nuevo' — AI generates new questions on the same topic
      setLoading(true);
      setError(null);
      try {
        const questions = await generateQuiz(
          importDialogData.topic,
          importDialogData.questionCount,
          importDialogData.refinementAnswers || {},
          importDialogData.questionTypes || ['single'],
          contextFile ?? undefined
        );
        setQuiz({
          topic: importDialogData.topic,
          questions,
          currentQuestionIndex: 0,
          results: questions.map(q => ({
            questionId: q.id,
            selectedIndices: [],
            openAnswer: '',
            codeAnswer: q.questionType === 'code' ? (q.starterCode || '') : undefined,
            codeLanguage: q.questionType === 'code' ? (q.codeLanguage || 'python') : undefined,
            isCorrect: false,
            isFinished: false,
            chatHistory: [],
            vocabTerms: [],
          })),
          isCompleted: false,
        });
        setTopic(importDialogData.topic);
        clearGlobalAnkiCards();
        setImportDialogData(null);
      } catch (e) {
        if (e instanceof GeminiAPIError) setError(e.message);
        else if (e instanceof Error) setError(e.message);
        else setError('Error generando quiz. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const currentResult = quiz ? quiz.results[quiz.currentQuestionIndex] : null;
  const currentQuestion = quiz ? quiz.questions[quiz.currentQuestionIndex] : null;
  const currentVocabTerms = currentResult?.vocabTerms ?? [];

  const score = useMemo(() => {
    if (!quiz) return 0;
    const correct = quiz.results.filter((r, i) => {
      const q = quiz.questions[i];
      if (q.questionType === 'open' || q.questionType === 'code') return r.isCorrect && r.isFinished;
      return r.selectedIndices.length > 0 && r.isCorrect;
    }).length;
    return Math.round((correct / quiz.questions.length) * 100);
  }, [quiz]);

  // Reset code solution toggle when navigating questions
  useEffect(() => {
    setShowCodeSolution(false);
  }, [quiz?.currentQuestionIndex]);

  // Handle Confetti on Completion
  useEffect(() => {
    if (quiz?.isCompleted && score >= 80) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#ffffff']
      });
    }
  }, [quiz?.isCompleted, score]);

  const handleCheck = async () => {
    if (!quiz || !currentQuestion || !currentResult) return;

    if (currentQuestion.questionType === 'code') {
      if (!(currentResult.codeAnswer || '').trim()) return;
      setEvaluatingOpen(true);
      try {
        const result = await evaluateCodeAnswer(
          currentQuestion.question,
          currentQuestion.correctAnswer || '',
          currentResult.codeAnswer || '',
          currentResult.codeLanguage || currentQuestion.codeLanguage || 'python'
        );
        const updatedResults = [...quiz.results];
        updatedResults[quiz.currentQuestionIndex] = {
          ...currentResult,
          isCorrect: result.isCorrect,
          isFinished: true,
          aiFeedback: result.feedback,
        };
        setQuiz({ ...quiz, results: updatedResults });
      } finally {
        setEvaluatingOpen(false);
      }
    } else if (currentQuestion.questionType === 'open') {
      if (!currentResult.openAnswer.trim()) return;
      setEvaluatingOpen(true);
      try {
        const result = await evaluateOpenAnswer(
          currentQuestion.question,
          currentQuestion.correctAnswer || '',
          currentResult.openAnswer
        );
        const updatedResults = [...quiz.results];
        updatedResults[quiz.currentQuestionIndex] = {
          ...currentResult,
          isCorrect: result.isCorrect,
          isFinished: true,
          aiFeedback: result.feedback
        };
        setQuiz({ ...quiz, results: updatedResults });
      } finally {
        setEvaluatingOpen(false);
      }
    } else if (currentQuestion.questionType === 'multi') {
      const selected = [...currentResult.selectedIndices].sort();
      const correct = [...(currentQuestion.correctIndices || [])].sort();
      const isCorrect = selected.length === correct.length && selected.every((v, i) => v === correct[i]);
      const updatedResults = [...quiz.results];
      updatedResults[quiz.currentQuestionIndex] = { ...currentResult, isCorrect, isFinished: true };
      setQuiz({ ...quiz, results: updatedResults });
    } else {
      // single
      const isCorrect = currentResult.selectedIndices[0] === currentQuestion.correctIndex;
      const updatedResults = [...quiz.results];
      updatedResults[quiz.currentQuestionIndex] = { ...currentResult, isCorrect, isFinished: true };
      setQuiz({ ...quiz, results: updatedResults });
    }
  };

  const handleContinue = async () => {
    if (!quiz) return;
    if (quiz.currentQuestionIndex < quiz.questions.length - 1) {
      const updatedQuiz = { ...quiz, currentQuestionIndex: quiz.currentQuestionIndex + 1 };
      setQuiz(updatedQuiz);

      // Auto-save progress
      if (currentSessionId) {
        const correct = updatedQuiz.results.filter((r, i) => {
          const q = updatedQuiz.questions[i];
          if (q.questionType === 'open' || q.questionType === 'code') return r.isCorrect && r.isFinished;
          return r.selectedIndices.length > 0 && r.isCorrect;
        }).length;
        const currentScore = Math.round((correct / updatedQuiz.questions.length) * 100);
        quizSessions.update(currentSessionId, {
          results: updatedQuiz.results,
          score: currentScore,
        }).catch(err => console.warn('Session update failed:', err));
      }
    } else {
      // Quiz completed
      const completedQuiz = { ...quiz, isCompleted: true };
      setQuiz(completedQuiz);

      // Auto-save completion
      if (currentSessionId) {
        const correct = completedQuiz.results.filter((r, i) => {
          const q = completedQuiz.questions[i];
          if (q.questionType === 'open' || q.questionType === 'code') return r.isCorrect && r.isFinished;
          return r.selectedIndices.length > 0 && r.isCorrect;
        }).length;
        const finalScore = Math.round((correct / completedQuiz.questions.length) * 100);
        const chatHistories: Record<string, any[]> = {};
        completedQuiz.results.forEach((r, i) => {
          if (r.chatHistory.length > 0) chatHistories[completedQuiz.questions[i].id] = r.chatHistory;
        });

        quizSessions.update(currentSessionId, {
          results: completedQuiz.results,
          score: finalScore,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          ankiCards: globalAnkiCards,
          chatHistories,
        }).then(() => {
          // Generate tags async (non-blocking)
          generateQuizTags(completedQuiz.topic, selectedTypes).then(tags => {
            if (tags.length > 0 && currentSessionId) {
              quizSessions.update(currentSessionId, { tags });
            }
          }).catch(() => {});
        }).catch(err => console.warn('Session completion update failed:', err));
      }
    }
  };

  const handleSelectSingle = (idx: number) => {
    if (!quiz || !currentResult || currentResult.isFinished) return;
    const updatedResults = [...quiz.results];
    updatedResults[quiz.currentQuestionIndex] = { ...currentResult, selectedIndices: [idx] };
    setQuiz({ ...quiz, results: updatedResults });
  };

  const handleToggleMulti = (idx: number) => {
    if (!quiz || !currentResult || currentResult.isFinished) return;
    const prev = currentResult.selectedIndices;
    const next = prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx];
    const updatedResults = [...quiz.results];
    updatedResults[quiz.currentQuestionIndex] = { ...currentResult, selectedIndices: next };
    setQuiz({ ...quiz, results: updatedResults });
  };

  const handleOpenAnswer = (text: string) => {
    if (!quiz || !currentResult || currentResult.isFinished) return;
    const updatedResults = [...quiz.results];
    updatedResults[quiz.currentQuestionIndex] = { ...currentResult, openAnswer: text };
    setQuiz({ ...quiz, results: updatedResults });
  };

  const handleCodeAnswer = (code: string) => {
    if (!quiz || !currentResult || currentResult.isFinished) return;
    const updatedResults = [...quiz.results];
    updatedResults[quiz.currentQuestionIndex] = { ...currentResult, codeAnswer: code };
    setQuiz({ ...quiz, results: updatedResults });
  };

  const handleCodeLanguage = (lang: string) => {
    if (!quiz || !currentResult || currentResult.isFinished) return;
    const updatedResults = [...quiz.results];
    updatedResults[quiz.currentQuestionIndex] = { ...currentResult, codeLanguage: lang };
    setQuiz({ ...quiz, results: updatedResults });
  };

  const canCheck = () => {
    if (!currentResult || !currentQuestion) return false;
    if (currentResult.isFinished) return false;
    if (currentQuestion.questionType === 'open') return currentResult.openAnswer.trim().length > 0;
    if (currentQuestion.questionType === 'code') return (currentResult.codeAnswer || '').trim().length > 0;
    return currentResult.selectedIndices.length > 0;
  };

  // Load a past quiz session from history sidebar
  const handleSelectSession = (session: QuizSession) => {
    const exported: QuizExport = {
      version: '1',
      exportedAt: session.startedAt,
      topic: session.topic,
      questionCount: session.questionCount,
      questionTypes: session.questionTypes as QuestionType[],
      refinementAnswers: session.refinementAnswers,
      questions: session.questions as Question[],
      pastResults: session.results.length > 0 ? session.results as QuestionState[] : null,
      score: session.score,
    };
    setImportDialogData(exported);
  };

  // Import dialog (shared across all stages — rendered as a portal-like overlay)
  const importDialog = importDialogData ? (
    <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8">
          <h2 className="text-2xl font-black text-white mb-1">Importar Quiz</h2>
          <p className="text-slate-400 text-sm mb-1">
            <span className="text-white font-bold">{importDialogData.topic}</span>
            {' · '}{importDialogData.questionCount} preguntas
          </p>
          <p className="text-slate-600 text-xs mb-8">¿Cómo quieres cargar este quiz?</p>

          <div className="space-y-3">
            {importDialogData.pastResults && (
              <button
                onClick={() => handleImportOption('retomar')}
                disabled={loading}
                className="w-full text-left p-4 rounded-2xl border-2 border-slate-700 bg-slate-800 hover:border-primary hover:bg-primary/10 transition-all disabled:opacity-40"
              >
                <div className="font-bold text-white">Retomar quiz anterior</div>
                <div className="text-xs text-slate-400 mt-1">Carga con tus respuestas anteriores para revisar</div>
              </button>
            )}
            <button
              onClick={() => handleImportOption('rehacer')}
              disabled={loading}
              className="w-full text-left p-4 rounded-2xl border-2 border-slate-700 bg-slate-800 hover:border-green-500 hover:bg-green-500/10 transition-all disabled:opacity-40"
            >
              <div className="font-bold text-white">Rehacer el quiz</div>
              <div className="text-xs text-slate-400 mt-1">Las mismas preguntas, pero tus respuestas en blanco</div>
            </button>
            <button
              onClick={() => handleImportOption('nuevo')}
              disabled={loading}
              className="w-full text-left p-4 rounded-2xl border-2 border-slate-700 bg-slate-800 hover:border-blue-500 hover:bg-blue-500/10 transition-all disabled:opacity-40"
            >
              <div className="font-bold text-white flex items-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                Nuevo quiz, mismo tema
              </div>
              <div className="text-xs text-slate-400 mt-1">La IA genera preguntas nuevas sobre "{importDialogData.topic}"</div>
            </button>
          </div>

          {error && <p className="text-red-400 text-xs text-center mt-4">{error}</p>}

          <button
            onClick={() => { setImportDialogData(null); setError(null); }}
            disabled={loading}
            className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-400 transition-all disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Initial State: Home (browse history or create new quiz)
  if (!quiz && !refinementQuestions) {
    return (
      <>
      <div className="h-screen bg-slate-950 flex overflow-hidden">
        <HistorySidebar
          userId={CURRENT_USER_ID}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
        />

        {showQuizForm ? (
          /* ── Quiz creation form ── */
          <main className="flex-1 overflow-y-auto flex items-start justify-center p-4 pt-8">
            <div className="max-w-md w-full space-y-4">
              {/* Back button */}
              <button
                onClick={() => setShowQuizForm(false)}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
              >
                <ArrowLeft size={15} /> Volver al historial
              </button>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                    <Brain className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-center text-white mb-2">Nuevo Quiz</h1>
                {selectedProjectId && (
                  <p className="text-blue-400/70 text-center text-xs mb-1">
                    Se guardará en el proyecto seleccionado
                  </p>
                )}
                <p className="text-slate-400 text-center mb-8 text-sm">Aprende interactivamente sobre cualquier tema.</p>
                <div className="space-y-6">
                  {/* Topic input + file attachment */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Tema (ej: React, Historia...)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none text-white focus:ring-2 focus:ring-primary"
                      onKeyDown={(e) => e.key === 'Enter' && !loading && topic.trim() && selectedTypes.length > 0 && requestRefinement()}
                      autoFocus
                    />

                    {/* File attachment row */}
                    {contextFile ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded-xl">
                        <FileText size={13} className="text-primary flex-shrink-0" />
                        <span className="text-xs text-primary font-medium truncate flex-1">{contextFile.name}</span>
                        <span className="text-[10px] text-primary/60 hidden sm:block flex-shrink-0">La IA usará este archivo como contexto</span>
                        <button
                          onClick={() => setContextFile(null)}
                          className="text-primary/50 hover:text-red-400 transition-colors flex-shrink-0 ml-1"
                          title="Quitar archivo"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => contextFileRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors px-1"
                      >
                        <Paperclip size={12} />
                        Adjuntar contexto (pdf, txt, md)
                      </button>
                    )}
                    <input ref={contextFileRef} type="file" accept=".pdf,.txt,.md" onChange={handleContextFile} className="hidden" />

                    {/* Example prompts */}
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Lightbulb size={11} className="text-slate-700" />
                        <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">Prueba con</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {EXAMPLE_PROMPTS.map((ex) => (
                          <button
                            key={ex.label}
                            onClick={() => setTopic(ex.topic)}
                            title={ex.topic}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                              ex.emoji === '📄'
                                ? 'bg-primary/10 border-primary/25 text-primary/60 hover:border-primary/60 hover:text-primary'
                                : 'bg-slate-800/50 border-slate-700/50 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                            }`}
                          >
                            <span>{ex.emoji}</span>
                            <span>{ex.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Preguntas</label>
                    <div className="flex gap-2">
                      {[3, 5, 10].map((n) => (
                        <button key={n} onClick={() => setQuestionCount(n)} className={`flex-1 py-2.5 rounded-xl border font-bold transition-all ${questionCount === n ? 'bg-primary border-primary text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tipos de preguntas</label>
                    <div className="space-y-2">
                      {QUESTION_TYPES.map(({ type, label, description, icon }) => {
                        const selected = selectedTypes.includes(type);
                        return (
                          <button
                            key={type}
                            onClick={() => toggleType(type)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${selected ? 'border-primary bg-primary/10 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}`}
                          >
                            <div className={`flex-shrink-0 ${selected ? 'text-primary' : 'text-slate-600'}`}>
                              {selected ? <CheckSquare size={18} /> : <Square size={18} />}
                            </div>
                            <div className={selected ? 'text-primary' : 'text-slate-500'}>{icon}</div>
                            <div>
                              <div className="font-bold text-sm">{label}</div>
                              <div className="text-xs text-slate-500">{description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {error && <p className="text-red-400 text-xs text-center">{error}</p>}
                  <button onClick={requestRefinement} disabled={loading || !topic.trim() || selectedTypes.length === 0} className="w-full bg-primary py-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                    {loading ? <Loader2 className="animate-spin" /> : 'Siguiente'}
                  </button>
                  <div className="text-center pt-1">
                    <button
                      onClick={() => importFileRef.current?.click()}
                      className="text-slate-600 hover:text-slate-400 text-xs flex items-center gap-1.5 mx-auto transition-colors"
                    >
                      <Upload size={13} /> Importar quiz existente (.json)
                    </button>
                    <input ref={importFileRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </div>
                </div>
              </div>
            </div>
          </main>
        ) : (
          /* ── Quiz browser (history) ── */
          <QuizBrowserMain
            userId={CURRENT_USER_ID}
            selectedProjectId={selectedProjectId}
            onSelectSession={handleSelectSession}
            onNewQuiz={() => setShowQuizForm(true)}
          />
        )}
      </div>
      {importDialog}
      </>
    );
  }

  // Stage 2: Refinement
  if (!quiz && refinementQuestions) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <PartyPopper className="text-primary" />
            <h2 className="text-2xl font-bold text-white">Casi listo</h2>
          </div>

          {/* Context file indicator */}
          {contextFile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl mb-4 text-xs">
              <FileText size={12} className="text-primary flex-shrink-0" />
              <span className="text-primary/70 truncate">{contextFile.name} — la IA usará este documento para refinar las preguntas</span>
            </div>
          )}
          <div className="space-y-6">
            {refinementQuestions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm text-slate-400 mb-2">{q.text}</label>
                <input type="text" placeholder="Tu respuesta..." onChange={(e) => setRefinementAnswers({ ...refinementAnswers, [q.text]: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none text-white focus:ring-2 focus:ring-primary" />
              </div>
            ))}
            <div className="pt-4 flex gap-3">
              <button onClick={() => setRefinementQuestions(null)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-400">Atrás</button>
              <button onClick={startQuiz} disabled={loading} className="flex-[2] py-3 bg-primary rounded-xl font-bold text-white shadow-lg flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" /> : 'Generar Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage 3: Completion Screen
  if (quiz?.isCompleted) {
    const perfectAnswers = quiz.results.filter((r, i) => {
      const q = quiz.questions[i];
      if (q.questionType === 'open' || q.questionType === 'code') return r.isCorrect && r.isFinished;
      return r.selectedIndices.length > 0 && r.isCorrect;
    }).length;
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center py-16 px-4 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="max-w-5xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Header Results Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-primary opacity-50" />
            <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
              <Trophy className={`w-12 h-12 ${score >= 80 ? 'text-yellow-500' : 'text-primary'}`} />
            </div>
            <h2 className="text-5xl font-black text-white mb-3">
              {score >= 80 ? '¡Excelente Trabajo!' : '¡Buen Intento!'}
            </h2>
            <p className="text-slate-400 text-lg mb-12">Has terminado el quiz de <span className="text-white font-bold">{quiz.topic}</span></p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
              <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50">
                <span className="text-4xl font-black text-primary block mb-1">{score}%</span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Puntaje</span>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50">
                <span className="text-4xl font-black text-white block mb-1">{perfectAnswers} / {quiz.questions.length}</span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Correctas</span>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50">
                <span className="text-4xl font-black text-blue-400 block mb-1">{globalAnkiCards.length}</span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Anki Cards</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => { resetAll(); setShowQuizForm(false); }}
                className="px-10 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
              >
                <RotateCcw size={20} /> Nuevo Quiz
              </button>
              <button
                onClick={exportQuiz}
                className="px-10 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all"
              >
                <FileDown size={20} /> Exportar Quiz
              </button>
              {globalAnkiCards.length > 0 && (
                <button
                  onClick={downloadAllAnki}
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-blue-900/20"
                >
                  <Download size={20} /> Descargar {globalAnkiCards.length} Cards
                </button>
              )}
            </div>
          </div>

          {/* Anki Review Section */}
          {globalAnkiCards.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Library size={24} /></div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Resumen de Estudio</h3>
                    <p className="text-slate-400 text-sm">Conceptos guardados durante la sesión.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {globalAnkiCards.map((card) => (
                  <div key={card.id} className="group relative bg-slate-800/30 border border-slate-700/50 p-6 rounded-[2rem] hover:border-blue-500/50 transition-all flex flex-col justify-between">
                    <button
                      onClick={() => removeAnkiCard(card.id)}
                      className="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors"
                      title="Eliminar de la lista"
                    >
                      <Trash2 size={18}/>
                    </button>
                    <div>
                      <div className="text-slate-100 font-bold mb-3 pr-8 leading-snug">{card.front}</div>
                      <div className="text-slate-400 text-sm italic leading-relaxed line-clamp-3" dangerouslySetInnerHTML={{ __html: card.back }} />
                    </div>
                    <div className="mt-6 flex gap-2 flex-wrap">
                      {card.tags.map(t => (
                        <span key={t} className="px-2 py-1 bg-slate-900/50 text-[10px] font-bold rounded-lg text-slate-500 border border-slate-800">#{t}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Stage 4: Active Quiz View
  const correctIndices = currentQuestion?.correctIndices || [];

  const getOptionClass = (idx: number) => {
    if (!currentResult || !currentQuestion) return 'border-slate-800 bg-slate-900/50 text-slate-300';
    if (!currentResult.isFinished) {
      if (currentQuestion.questionType === 'single') {
        return currentResult.selectedIndices[0] === idx
          ? 'border-primary bg-primary/10 text-white'
          : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900';
      }
      // multi
      return currentResult.selectedIndices.includes(idx)
        ? 'border-primary bg-primary/10 text-white'
        : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900';
    }
    // After check
    if (currentQuestion.questionType === 'single') {
      if (idx === currentQuestion.correctIndex) return 'border-green-500 bg-green-500/10 text-green-400';
      if (idx === currentResult.selectedIndices[0]) return 'border-red-500 bg-red-500/10 text-red-400';
      return 'border-slate-800 bg-slate-900/30 text-slate-600';
    }
    // multi
    const isCorrectOpt = correctIndices.includes(idx);
    const isSelected = currentResult.selectedIndices.includes(idx);
    if (isCorrectOpt && isSelected) return 'border-green-500 bg-green-500/10 text-green-400';
    if (isCorrectOpt && !isSelected) return 'border-orange-500 bg-orange-500/10 text-orange-400'; // missed correct
    if (!isCorrectOpt && isSelected) return 'border-red-500 bg-red-500/10 text-red-400';
    return 'border-slate-800 bg-slate-900/30 text-slate-600';
  };

  const getOptionIcon = (idx: number) => {
    if (!currentResult || !currentQuestion || !currentResult.isFinished) return null;
    if (currentQuestion.questionType === 'single') {
      if (idx === currentQuestion.correctIndex) return <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />;
      if (idx === currentResult.selectedIndices[0]) return <XCircle className="text-red-500 flex-shrink-0" size={20} />;
      return null;
    }
    const isCorrectOpt = correctIndices.includes(idx);
    const isSelected = currentResult.selectedIndices.includes(idx);
    if (isCorrectOpt) return <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />;
    if (isSelected && !isCorrectOpt) return <XCircle className="text-red-500 flex-shrink-0" size={20} />;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="sticky top-0 z-[100] bg-slate-950/80 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <Brain className="text-primary w-8 h-8 flex-shrink-0" />
            <h1 className="font-black text-lg truncate hidden sm:block tracking-tight">{quiz!.topic}</h1>
            <div className="h-1.5 w-24 sm:w-40 bg-slate-800 rounded-full ml-4 overflow-hidden hidden md:block">
              <div
                className="h-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${((quiz!.currentQuestionIndex + 1) / quiz!.questions.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
             <button
              onClick={() => setShowStudyList(true)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl flex items-center gap-2 relative transition-all"
              title="Mi Lista de Estudio"
            >
              <Library size={20} />
              <span className="hidden sm:inline font-bold text-xs uppercase tracking-widest">Estudio</span>
              {globalAnkiCards.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 text-white text-[10px] flex items-center justify-center rounded-full font-black border-2 border-slate-950 animate-in zoom-in">
                  {globalAnkiCards.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${showChat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-800 text-primary hover:bg-slate-700'}`}
            >
              <MessageCircle size={20} />
              <span className="hidden sm:inline text-xs uppercase tracking-widest">Tutor IA</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 py-12 relative">
        {currentQuestion && currentResult && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Question type badge */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
                currentQuestion.questionType === 'code'
                  ? 'bg-violet-900/30 text-violet-400 border-violet-700/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {currentQuestion.questionType === 'single' && 'Única respuesta'}
                {currentQuestion.questionType === 'multi' && 'Multirespuesta — selecciona todas las correctas'}
                {currentQuestion.questionType === 'open' && 'Respuesta abierta'}
                {currentQuestion.questionType === 'code' && (
                  <span className="flex items-center gap-1.5">
                    <Code2 size={11} /> Desafío de código
                  </span>
                )}
              </span>
              <span className="text-slate-600 text-xs">{quiz!.currentQuestionIndex + 1} / {quiz!.questions.length}</span>
            </div>

            {/* Question + Answer wrapped in SelectionTooltip */}
            <SelectionTooltip onAddTerm={addUnknownTerm} onDirectSearch={directSearchTerm}>
              <MarkdownWithHighlights
                content={currentQuestion.question}
                terms={currentVocabTerms}
                onRemoveTerm={removeUnknownTerm}
                className="prose prose-invert max-w-none text-xl"
              />

              {/* Answer Area */}
              {currentQuestion.questionType === 'open' ? (
                <div className="space-y-3 mt-8">
                  <textarea
                    disabled={currentResult.isFinished}
                    value={currentResult.openAnswer}
                    onChange={(e) => handleOpenAnswer(e.target.value)}
                    placeholder="Escribe tu respuesta aquí..."
                    rows={5}
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 outline-none text-white focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              ) : currentQuestion.questionType === 'code' ? (
                <div className="mt-6">
                  <CodeEditor
                    starterCode={currentQuestion.starterCode || ''}
                    value={currentResult.codeAnswer || ''}
                    language={currentResult.codeLanguage || currentQuestion.codeLanguage || 'python'}
                    onChange={handleCodeAnswer}
                    onLanguageChange={handleCodeLanguage}
                    disabled={currentResult.isFinished}
                  />
                </div>
              ) : (
                <div className="grid gap-4 mt-8">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      disabled={currentResult.isFinished}
                      onClick={() => currentQuestion.questionType === 'single' ? handleSelectSingle(idx) : handleToggleMulti(idx)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-start gap-4 active:scale-[0.99] group shadow-sm ${getOptionClass(idx)}`}
                    >
                      <span className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 font-black text-sm ${
                        currentResult.selectedIndices.includes(idx) && !currentResult.isFinished
                          ? 'border-primary text-primary'
                          : 'border-slate-700 group-hover:border-primary/50'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <HighlightedText
                        text={option}
                        terms={currentVocabTerms}
                        onRemoveTerm={removeUnknownTerm}
                        className="flex-1 pt-0.5 font-medium"
                      />
                      {getOptionIcon(idx)}
                    </button>
                  ))}
                </div>
              )}
            </SelectionTooltip>

            {/* Check Button */}
            {!currentResult.isFinished && (
              <div className="flex justify-end">
                <button
                  onClick={handleCheck}
                  disabled={!canCheck() || evaluatingOpen}
                  className="px-10 py-4 bg-primary text-white rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                >
                  {evaluatingOpen ? (
                    <><Loader2 className="animate-spin" size={20} /> Evaluando...</>
                  ) : (
                    'Comprobar'
                  )}
                </button>
              </div>
            )}

            {/* Result Banner + Feedback */}
            {currentResult.isFinished && (
              <SelectionTooltip onAddTerm={addUnknownTerm} onDirectSearch={directSearchTerm}>
              <div className={`p-8 rounded-[2.5rem] shadow-2xl space-y-6 animate-in zoom-in duration-500 backdrop-blur-sm relative overflow-hidden border ${
                currentResult.isCorrect
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}>
                <div className={`flex items-center gap-3 font-black uppercase tracking-[0.2em] text-xs ${currentResult.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                  {currentResult.isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  <span>{currentResult.isCorrect ? '¡Correcto!' : 'Incorrecto'}</span>
                </div>

                {/* Open answer feedback */}
                {currentQuestion.questionType === 'open' && (
                  <div className="space-y-4">
                    {currentResult.aiFeedback && (
                      <MarkdownWithHighlights
                        content={currentResult.aiFeedback}
                        terms={currentVocabTerms}
                        onRemoveTerm={removeUnknownTerm}
                        className="leading-relaxed text-slate-200"
                      />
                    )}
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Respuesta de referencia</div>
                      <MarkdownWithHighlights
                        content={currentQuestion.correctAnswer || ''}
                        terms={currentVocabTerms}
                        onRemoveTerm={removeUnknownTerm}
                        className="text-slate-300 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Code challenge feedback */}
                {currentQuestion.questionType === 'code' && (
                  <div className="space-y-4">
                    {currentResult.aiFeedback && (
                      <MarkdownWithHighlights
                        content={currentResult.aiFeedback}
                        terms={currentVocabTerms}
                        onRemoveTerm={removeUnknownTerm}
                        className="leading-relaxed text-slate-200"
                      />
                    )}
                    {/* Collapsible reference solution */}
                    <div className="rounded-2xl border border-slate-700/50 overflow-hidden">
                      <button
                        onClick={() => setShowCodeSolution(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-800 transition-colors text-xs font-bold text-slate-400 hover:text-slate-200 uppercase tracking-widest"
                      >
                        <span className="flex items-center gap-2"><Code2 size={13} /> Ver solución de referencia</span>
                        <span className={`transition-transform duration-200 ${showCodeSolution ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {showCodeSolution && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                          <MarkdownRenderer
                            content={`\`\`\`${currentResult.codeLanguage || currentQuestion.codeLanguage || 'python'}\n${currentQuestion.correctAnswer || ''}\n\`\`\``}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Single/Multi explanation */}
                {currentQuestion.questionType !== 'open' && currentQuestion.questionType !== 'code' && (
                  <MarkdownWithHighlights
                    content={currentQuestion.explanation}
                    terms={currentVocabTerms}
                    onRemoveTerm={removeUnknownTerm}
                    className="leading-relaxed text-slate-200"
                  />
                )}

                {/* Action buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <button
                    onClick={() => setShowChat(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-800 text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-all border border-slate-700"
                  >
                    <MessageCircle size={18} /> Explica mi respuesta
                  </button>
                  <button
                    onClick={handleContinue}
                    className="w-full sm:w-auto px-10 py-4 bg-primary text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20 group"
                  >
                    {quiz!.currentQuestionIndex === quiz!.questions.length - 1 ? 'Finalizar Quiz' : 'Continuar'}
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
              </SelectionTooltip>
            )}
          </div>
        )}

        {/* Floating Study List Modal */}
        {showStudyList && (
          <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="p-10 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-[1.25rem] flex items-center justify-center text-blue-400"><Library size={28} /></div>
                  <div>
                    <h2 className="text-3xl font-black text-white">Centro de Estudio</h2>
                    <p className="text-slate-500 text-sm">{globalAnkiCards.length} tarjetas en memoria</p>
                  </div>
                </div>
                <button onClick={() => setShowStudyList(false)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-slate-400 hover:text-white shadow-lg">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                {globalAnkiCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-6 opacity-30">
                    <BookOpen size={64} />
                    <p className="font-black text-xl tracking-tighter">Tu lista de estudio está vacía</p>
                  </div>
                ) : (
                  Array.from(new Set(globalAnkiCards.map(c => c.questionId))).map(qId => (
                    <div key={qId} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 border border-slate-700">PREGUNTA {qId}</span>
                        <div className="flex-1 h-px bg-slate-800" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {globalAnkiCards.filter(c => c.questionId === qId).map(card => (
                          <div key={card.id} className="group relative bg-slate-800/20 border border-slate-700/50 p-6 rounded-[2rem] hover:border-blue-500/50 transition-all shadow-sm">
                            <button
                              onClick={() => removeAnkiCard(card.id)}
                              className="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={18}/>
                            </button>
                            <div className="text-slate-200 font-bold mb-3 text-sm leading-snug">{card.front}</div>
                            <div className="text-slate-500 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: card.back }} />
                            <div className="mt-6 flex gap-2 flex-wrap">
                              {card.tags.map(t => <span key={t} className="px-2 py-0.5 bg-slate-900 text-[9px] font-black rounded border border-slate-800 text-slate-600">#{t}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-10 border-t border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-6">
                <button onClick={() => setShowStudyList(false)} className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all text-sm">Cerrar vista</button>
                <div className="flex gap-4">
                  <button
                    onClick={downloadAllAnki}
                    disabled={globalAnkiCards.length === 0}
                    className="px-10 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-2xl font-black shadow-xl shadow-blue-900/20 flex items-center gap-3 transition-all"
                  >
                    <Download size={20} /> Descargar JSON para Anki
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-950 p-4 border-t border-slate-800 shadow-2xl">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-slate-500 text-xs font-black tracking-widest uppercase">
          <button
            onClick={() => setQuiz({...quiz!, currentQuestionIndex: Math.max(0, quiz!.currentQuestionIndex-1)})}
            disabled={quiz!.currentQuestionIndex === 0}
            className="hover:text-white disabled:opacity-20 transition-all px-4 py-2 flex items-center gap-2"
          >
            <ChevronLeft size={16}/> Anterior
          </button>

          <div className="flex gap-2">
            {quiz!.results.map((r, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === quiz!.currentQuestionIndex
                    ? 'w-10 bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                    : r.isFinished
                      ? r.isCorrect ? 'bg-green-500' : 'bg-red-500'
                      : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => { if(currentResult!.isFinished) setQuiz({...quiz!, currentQuestionIndex: Math.min(quiz!.questions.length-1, quiz!.currentQuestionIndex+1)}) }}
            disabled={!currentResult!.isFinished || quiz!.currentQuestionIndex === quiz!.questions.length - 1}
            className="hover:text-white disabled:opacity-20 transition-all px-4 py-2 flex items-center gap-2"
          >
            Siguiente <ChevronRight size={16}/>
          </button>
        </div>
      </footer>

      {importDialog}

      {currentQuestion && (
        <ChatSidebar
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          question={currentQuestion}
          questionResult={currentResult ?? undefined}
          explanation={currentQuestion.explanation}
          history={currentResult?.chatHistory || []}
          onUpdateHistory={updateChatHistory}
          onSaveCards={saveToGlobalAnki}
          unknownTerms={currentVocabTerms}
          onRemoveTerm={removeUnknownTerm}
          onEditTerm={editUnknownTerm}
          onAddTerm={addUnknownTerm}
          onClearTerms={clearUnknownTerms}
          pendingMessage={pendingChatMessage}
          onPendingConsumed={() => setPendingChatMessage(null)}
        />
      )}
    </div>
  );
};

export default App;

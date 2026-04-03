
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatMessage, Question, QuestionState, AnkiSuggestion, AnkiCard, VocabTerm } from '../types';
import { createChatSession, analyzeConversationForAnki, generateAnkiCardsFromSuggestions, GeminiAPIError } from '../services/geminiService';
import { type GeminiModelId, DEFAULT_MODEL_CONFIG } from '../constants/geminiModels';
import { ButtonDropdown } from './ButtonDropdown';
import MarkdownRenderer from './MarkdownRenderer';
import {
  Send, Bot, User, X, MessageSquare, Loader2, Sparkles,
  BookOpen, CheckCircle2, Download, Save, ListChecks,
  BookMarked, Zap, AlignJustify, AlignLeft, Plus, Pencil, Check
} from 'lucide-react';

type ResponseStyle = 'concise' | 'normal' | 'extensive';

const STYLE_CONFIG: Record<ResponseStyle, { label: string; icon: React.ReactNode; prefix: string; title: string }> = {
  concise: {
    label: 'Conciso',
    icon: <Zap size={12} />,
    prefix: '[INSTRUCCIÓN DE FORMATO: Responde de forma MUY BREVE, máximo 2-3 oraciones cortas. Solo los puntos clave, sin elaboración extra.]\n\n',
    title: 'Respuestas cortas y directas',
  },
  normal: {
    label: 'Normal',
    icon: <AlignLeft size={12} />,
    prefix: '[INSTRUCCIÓN DE FORMATO: Responde de forma balanceada: claro y completo pero sin extenderte demasiado.]\n\n',
    title: 'Equilibrio entre brevedad y detalle',
  },
  extensive: {
    label: 'Extenso',
    icon: <AlignJustify size={12} />,
    prefix: '',
    title: 'Explicaciones detalladas y completas',
  },
};

interface PendingMessage {
  text: string;
  id: number;
}

interface Props {
  question: Question;
  questionResult?: QuestionState;
  explanation: string;
  isOpen: boolean;
  onClose: () => void;
  history: ChatMessage[];
  onUpdateHistory: (history: ChatMessage[]) => void;
  onSaveCards: (cards: AnkiCard[]) => void;
  unknownTerms: VocabTerm[];
  onRemoveTerm: (id: string) => void;
  onEditTerm: (id: string, newText: string) => void;
  onAddTerm: (text: string) => void;
  onClearTerms: () => void;
  pendingMessage: PendingMessage | null;
  onPendingConsumed: () => void;
}

const ChatSidebar: React.FC<Props> = ({
  question,
  questionResult,
  explanation,
  isOpen,
  onClose,
  history,
  onUpdateHistory,
  onSaveCards,
  unknownTerms,
  onRemoveTerm,
  onEditTerm,
  onAddTerm,
  onClearTerms,
  pendingMessage,
  onPendingConsumed,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>('normal');
  const [localModelOverride, setLocalModelOverride] = useState<string | undefined>(undefined);

  // Vocab CRUD local state
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [newTermText, setNewTermText] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Anki Suggestions State
  const [isAnalyzingAnki, setIsAnalyzingAnki] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [ankiSuggestions, setAnkiSuggestions] = useState<AnkiSuggestion[] | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  const chatRef = useRef<any>(null);
  const historyRef = useRef(history);
  historyRef.current = history; // Always-current ref (updated every render)
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingIdRef = useRef<number | null>(null);

  const suggestedQuestions = useMemo(() => [
    "¿Por qué las otras opciones no son válidas?",
    "¿Puedes explicar el concepto clave de esta pregunta?",
    "Dame un ejemplo práctico de este tema."
  ], []);

  useEffect(() => {
    // Create a fresh session when question changes OR when the answer is submitted (isFinished changes to true)
    // This ensures the AI always has the user's answer context when they ask follow-up questions
    chatRef.current = null;
    setAnkiSuggestions(null);
    setSelectedSuggestions(new Set());

    // Build rich context so the AI can answer ambiguous questions (e.g. "what is X?") in scope
    const optionsList = question.options.length > 0
      ? '\n\nOpciones:\n' + question.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isCorrect = question.questionType === 'multi'
            ? (question.correctIndices || []).includes(i)
            : i === question.correctIndex;
          return `  ${letter}. ${opt}${isCorrect ? ' [CORRECTA]' : ''}`;
        }).join('\n')
      : question.questionType === 'code'
        ? `\n\nLenguaje sugerido: ${question.codeLanguage || 'N/A'}${
            question.starterCode
              ? `\n\nCódigo de inicio:\n\`\`\`${question.codeLanguage || ''}\n${question.starterCode}\n\`\`\``
              : ''
          }\n\nSolución de referencia:\n\`\`\`${question.codeLanguage || ''}\n${question.correctAnswer || ''}\n\`\`\``
        : question.correctAnswer
          ? `\n\nRespuesta de referencia: ${question.correctAnswer}`
          : '';

    // Include the student's answer when available so the AI can reference it
    let userAnswerSection = '';
    if (questionResult?.isFinished) {
      if (question.questionType === 'single') {
        const userIdx = questionResult.selectedIndices[0];
        const userOpt = userIdx !== undefined && question.options[userIdx] !== undefined
          ? `Opción ${String.fromCharCode(65 + userIdx)}: "${question.options[userIdx]}"`
          : 'No respondió';
        userAnswerSection = `\n\nRESPUESTA DEL ESTUDIANTE:\n${userOpt}\nResultado: ${questionResult.isCorrect ? '✓ CORRECTO' : '✗ INCORRECTO'}`;
      } else if (question.questionType === 'multi') {
        const selectedList = questionResult.selectedIndices.length > 0
          ? questionResult.selectedIndices.map(i => `  - Opción ${String.fromCharCode(65 + i)}: "${question.options[i] ?? ''}"`).join('\n')
          : '  (ninguna seleccionada)';
        userAnswerSection = `\n\nRESPUESTA DEL ESTUDIANTE (opciones seleccionadas):\n${selectedList}\nResultado: ${questionResult.isCorrect ? '✓ CORRECTO' : '✗ INCORRECTO'}`;
      } else if (question.questionType === 'open') {
        userAnswerSection = `\n\nRESPUESTA DEL ESTUDIANTE:\n"${questionResult.openAnswer}"\nEvaluación IA: ${questionResult.aiFeedback || ''}\nResultado: ${questionResult.isCorrect ? '✓ CORRECTO' : '✗ INCORRECTO'}`;
      } else if (question.questionType === 'code') {
        const lang = questionResult.codeLanguage || question.codeLanguage || '';
        userAnswerSection = `\n\nCÓDIGO DEL ESTUDIANTE (${lang || 'desconocido'}):\n\`\`\`${lang}\n${questionResult.codeAnswer || ''}\n\`\`\`\nEvaluación IA: ${questionResult.aiFeedback || ''}\nResultado: ${questionResult.isCorrect ? '✓ CORRECTO' : '✗ INCORRECTO'}`;
      }
    }

    const context = `${question.question}${optionsList}${userAnswerSection}\n\nExplicación: ${explanation}`;

    // Pass existing history so session can be reconstructed after page reload
    chatRef.current = createChatSession(
      context,
      historyRef.current.length > 0 ? historyRef.current : undefined,
      localModelOverride
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, questionResult?.isFinished, localModelOverride]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  }, [input]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading, ankiSuggestions]);

  // Focus add-term input when revealed
  useEffect(() => {
    if (showAddInput) setTimeout(() => addInputRef.current?.focus(), 30);
  }, [showAddInput]);

  // Handle pending message from tooltip direct-search
  useEffect(() => {
    if (!pendingMessage || pendingMessage.id === pendingIdRef.current) return;
    pendingIdRef.current = pendingMessage.id;
    const timer = setTimeout(() => {
      sendMessage(pendingMessage.text);
      onPendingConsumed();
    }, 80);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMessage?.id]);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 320 && newWidth < window.innerWidth * 0.9) {
      window.requestAnimationFrame(() => setWidth(newWidth));
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', () => setIsResizing(false));
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', () => setIsResizing(false));
    };
  }, [isResizing, resize]);

  const sendMessage = async (textToSend: string = input, skipStylePrefix = false) => {
    const finalInput = textToSend.trim();
    if (!finalInput || isLoading) return;

    const stylePrefix = skipStylePrefix ? '' : STYLE_CONFIG[responseStyle].prefix;
    const messageToSend = stylePrefix + finalInput;

    const userMessage: ChatMessage = { role: 'user', text: finalInput }; // show without prefix
    const newHistory = [...history, userMessage];
    onUpdateHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: messageToSend });
      onUpdateHistory([...newHistory, { role: 'model', text: response.text || '...' }]);
    } catch (error) {
      let errorMessage = "Error de conexión.";
      if (error instanceof GeminiAPIError) errorMessage = error.message;
      else if (error instanceof Error) errorMessage = error.message;
      onUpdateHistory([...newHistory, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchAllTerms = async () => {
    if (unknownTerms.length === 0 || isLoading) return;
    const lines = unknownTerms.map(t => `- ¿Qué significa el término "${t.text}"?`).join('\n');
    const message = `Tengo varias dudas sobre algunos términos. Por favor explica cada uno brevemente:\n${lines}`;
    await sendMessage(message, true);
    onClearTerms();
  };

  const startEdit = (term: VocabTerm) => {
    setEditingTermId(term.id);
    setEditingText(term.text);
    setTimeout(() => editInputRef.current?.focus(), 30);
  };

  const commitEdit = () => {
    if (editingTermId && editingText.trim()) {
      onEditTerm(editingTermId, editingText.trim());
    }
    setEditingTermId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingTermId(null);
    setEditingText('');
  };

  const commitAdd = () => {
    if (newTermText.trim()) {
      onAddTerm(newTermText.trim());
      setNewTermText('');
    }
    setShowAddInput(false);
  };

  const loadAnkiSuggestions = async () => {
    setIsAnalyzingAnki(true);
    try {
      const chatStr = history.map(m => `${m.role}: ${m.text}`).join('\n');
      const suggestions = await analyzeConversationForAnki(question, explanation, chatStr);
      setAnkiSuggestions(suggestions);
      setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
    } catch (e) {
      let errorMessage = "Error analizando la conversación.";
      if (e instanceof GeminiAPIError) errorMessage = e.message;
      else if (e instanceof Error) errorMessage = e.message;
      alert(errorMessage);
    } finally {
      setIsAnalyzingAnki(false);
    }
  };

  const handleSaveAnki = async (downloadImmediately: boolean = false) => {
    if (!ankiSuggestions || selectedSuggestions.size === 0) return;
    setIsGeneratingCards(true);
    try {
      const toGenerate = ankiSuggestions.filter((_, i) => selectedSuggestions.has(i));
      const cards = await generateAnkiCardsFromSuggestions(toGenerate, question.question);
      const cardsWithContext = cards.map(c => ({ ...c, questionId: question.id }));
      onSaveCards(cardsWithContext);

      if (downloadImmediately) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ cards }, null, 2));
        const a = document.createElement('a');
        a.setAttribute("href", dataStr);
        a.setAttribute("download", `anki_cards_${question.id}.json`);
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      setAnkiSuggestions(null);
      alert("Tarjetas guardadas correctamente.");
    } catch (e) {
      let errorMessage = "Error generando tarjetas.";
      if (e instanceof GeminiAPIError) errorMessage = e.message;
      else if (e instanceof Error) errorMessage = e.message;
      alert(errorMessage);
    } finally {
      setIsGeneratingCards(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-[110] animate-in slide-in-from-right duration-300 select-none"
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-primary/50 transition-colors z-[70] group"
      >
        <div className="w-px h-12 bg-slate-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:bg-white/50" />
      </div>

      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-hidden">
          <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
          <h3 className="font-bold text-slate-100 truncate">Q: {question.id}</h3>
        </div>
        <div className="flex items-center gap-2">
          <ButtonDropdown
            selectedModel={(localModelOverride as GeminiModelId) ?? null}
            onChange={(id) => setLocalModelOverride(id ?? undefined)}
            defaultModel={DEFAULT_MODEL_CONFIG.modelChat}
            allowDefault
            compact
            align="right"
          />
          <button
            onClick={loadAnkiSuggestions}
            disabled={isAnalyzingAnki || history.length === 0}
            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all disabled:opacity-30 flex items-center gap-2 text-xs font-bold"
            title="Sugerir repasos Anki"
          >
            {isAnalyzingAnki ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            <span className="hidden lg:inline">Sugerir Anki</span>
          </button>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 select-text custom-scrollbar" ref={scrollRef}>
        {ankiSuggestions ? (
          <div className="bg-slate-800/50 border border-blue-500/30 rounded-3xl p-6 space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <ListChecks size={20} />
                <h4 className="font-bold">Análisis de Estudio</h4>
              </div>
              <button onClick={() => setAnkiSuggestions(null)} className="text-slate-500 hover:text-white"><X size={16}/></button>
            </div>

            <p className="text-sm text-slate-400">He identificado estos conceptos clave basados en nuestra conversación:</p>

            <div className="space-y-3">
              {ankiSuggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => {
                    const next = new Set(selectedSuggestions);
                    if (next.has(i)) next.delete(i); else next.add(i);
                    setSelectedSuggestions(next);
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedSuggestions.has(i) ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${selectedSuggestions.has(i) ? 'bg-blue-500 text-white' : 'border-2 border-slate-700'}`}>
                      {selectedSuggestions.has(i) && <CheckCircle2 size={14} />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-200">{s.term}</p>
                      <p className="text-xs text-slate-400 mt-1">{s.definition}</p>
                      <div className="mt-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">{s.importance}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700">
              <button
                onClick={() => handleSaveAnki(true)}
                disabled={isGeneratingCards || selectedSuggestions.size === 0}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
              >
                {isGeneratingCards ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                Solo Descargar
              </button>
              <button
                onClick={() => handleSaveAnki(false)}
                disabled={isGeneratingCards || selectedSuggestions.size === 0}
                className="py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                {isGeneratingCards ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar en Lista
              </button>
            </div>
          </div>
        ) : (
          <>
            {history.length === 0 && (
              <div className="text-center py-10 space-y-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto"><Sparkles className="text-primary w-6 h-6" /></div>
                <h4 className="font-bold text-slate-200">¿Dudas con esta pregunta?</h4>
                <div className="grid gap-2 px-4">
                  {suggestedQuestions.map((q, idx) => (
                    <button key={idx} onClick={() => sendMessage(q)} className="p-3 text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all text-slate-300">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-lg ${msg.role === 'user' ? 'bg-primary' : 'bg-slate-800 border border-slate-700'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} className="text-primary" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50'}`}>
                    <MarkdownRenderer content={msg.text} />
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start items-center gap-3 text-slate-400">
                <Bot size={14} className="animate-pulse text-primary" />
                <div className="flex gap-1">
                  <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '-0.3s'}} />
                  <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '-0.15s'}} />
                  <span className="w-1 h-1 bg-slate-600 rounded-full animate-bounce" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Vocab CRUD Panel — always visible when terms exist OR add input is open */}
      {(unknownTerms.length > 0 || showAddInput) && (
        <div className="border-t border-slate-800 px-4 py-3 bg-slate-900/80 space-y-2.5 animate-in slide-in-from-bottom-2 duration-300">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <BookMarked size={13} className="text-amber-400" />
              <span>Vocabulario ({unknownTerms.length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowAddInput(v => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all border ${
                  showAddInput
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
                title="Agregar término manualmente"
              >
                <Plus size={11} /> Agregar
              </button>
              {unknownTerms.length > 0 && (
                <button
                  onClick={searchAllTerms}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-bold transition-all disabled:opacity-30 border border-amber-500/30"
                  title="Preguntar todos los términos de una vez"
                >
                  {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                  Preguntar todos
                </button>
              )}
            </div>
          </div>

          {/* Manual add input */}
          {showAddInput && (
            <div className="flex items-center gap-1.5 animate-in slide-in-from-top-2 duration-200">
              <input
                ref={addInputRef}
                value={newTermText}
                onChange={(e) => setNewTermText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitAdd();
                  if (e.key === 'Escape') { setShowAddInput(false); setNewTermText(''); }
                }}
                placeholder="Escribe un término..."
                className="flex-1 bg-slate-800 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-amber-500/60 placeholder:text-slate-500"
              />
              <button
                onClick={commitAdd}
                disabled={!newTermText.trim()}
                className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-all disabled:opacity-30"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => { setShowAddInput(false); setNewTermText(''); }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-500 rounded-lg transition-all"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Term chips with inline edit */}
          {unknownTerms.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {unknownTerms.map((term) => (
                <span key={term.id} className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg text-xs group">
                  {editingTermId === term.id ? (
                    // Edit mode
                    <span className="flex items-center gap-1 pl-1.5 pr-1 py-1">
                      <input
                        ref={editInputRef}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="w-28 bg-slate-700 border border-amber-500/50 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:ring-1 focus:ring-amber-500/60"
                      />
                      <button onClick={commitEdit} className="p-0.5 text-green-400 hover:text-green-300">
                        <Check size={11} />
                      </button>
                      <button onClick={cancelEdit} className="p-0.5 text-slate-500 hover:text-slate-300">
                        <X size={11} />
                      </button>
                    </span>
                  ) : (
                    // Display mode
                    <span className="flex items-center gap-0.5 pl-2 pr-1 py-1">
                      <span className="max-w-[110px] truncate text-amber-300/90">{term.text}</span>
                      <button
                        onClick={() => startEdit(term)}
                        className="ml-1 p-0.5 rounded hover:bg-slate-600 text-slate-600 hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100"
                        title="Editar"
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={() => onRemoveTerm(term.id)}
                        className="p-0.5 rounded hover:bg-slate-600 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Eliminar"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add button when panel is hidden but chat is open */}
      {unknownTerms.length === 0 && !showAddInput && (
        <div className="border-t border-slate-800 px-4 py-2 bg-slate-900/80">
          <button
            onClick={() => setShowAddInput(true)}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-amber-400 transition-colors font-bold"
          >
            <BookMarked size={12} /> <Plus size={10} /> Agregar vocabulario
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md space-y-2">
        {/* Style selector */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-600 font-bold uppercase tracking-widest mr-1">Estilo:</span>
          {(Object.keys(STYLE_CONFIG) as ResponseStyle[]).map((style) => {
            const cfg = STYLE_CONFIG[style];
            const active = responseStyle === style;
            return (
              <button
                key={style}
                onClick={() => setResponseStyle(style)}
                title={cfg.title}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                  active
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                }`}
              >
                {cfg.icon}
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Textarea + send */}
        <div className="relative flex items-end gap-2 bg-slate-800 border border-slate-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Pregunta algo..."
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-2 text-slate-200 placeholder:text-slate-500 max-h-[180px] custom-scrollbar"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim() || !!ankiSuggestions}
            className="p-2.5 bg-primary text-white rounded-xl disabled:opacity-30 shadow-lg"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;

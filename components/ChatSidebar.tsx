
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatMessage, Question, AnkiSuggestion, AnkiCard } from '../types';
import { createChatSession, analyzeConversationForAnki, generateAnkiCardsFromSuggestions } from '../services/geminiService';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  Send, Bot, User, X, MessageSquare, Loader2, Sparkles, 
  BookOpen, CheckCircle2, ListPlus, Download, Save, ListChecks
} from 'lucide-react';

interface Props {
  question: Question;
  explanation: string;
  isOpen: boolean;
  onClose: () => void;
  history: ChatMessage[];
  onUpdateHistory: (history: ChatMessage[]) => void;
  onSaveCards: (cards: AnkiCard[]) => void;
}

const ChatSidebar: React.FC<Props> = ({ 
  question, 
  explanation,
  isOpen, 
  onClose, 
  history, 
  onUpdateHistory,
  onSaveCards 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  
  // Anki Suggestions State
  const [isAnalyzingAnki, setIsAnalyzingAnki] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [ankiSuggestions, setAnkiSuggestions] = useState<AnkiSuggestion[] | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestedQuestions = useMemo(() => [
    "¿Por qué las otras opciones no son válidas?",
    "¿Puedes explicar el concepto clave de esta pregunta?",
    "Dame un ejemplo práctico de este tema."
  ], []);

  useEffect(() => {
    if (!chatRef.current) {
      const context = `Pregunta: ${question.question}. Opciones: ${question.options.join(', ')}. Respuesta correcta: ${question.options[question.correctIndex]}.`;
      chatRef.current = createChatSession(context);
    }
  }, [question]);

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

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 320 && newWidth < window.innerWidth * 0.9) {
      // Use requestAnimationFrame for smoother resizing
      window.requestAnimationFrame(() => {
        setWidth(newWidth);
      });
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

  const sendMessage = async (textToSend: string = input) => {
    const finalInput = textToSend.trim();
    if (!finalInput || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: finalInput };
    const newHistory = [...history, userMessage];
    onUpdateHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: finalInput });
      onUpdateHistory([...newHistory, { role: 'model', text: response.text || '...' }]);
    } catch (error) {
      onUpdateHistory([...newHistory, { role: 'model', text: "Error de conexión." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnkiSuggestions = async () => {
    setIsAnalyzingAnki(true);
    try {
      const chatStr = history.map(m => `${m.role}: ${m.text}`).join('\n');
      const suggestions = await analyzeConversationForAnki(question, explanation, chatStr);
      setAnkiSuggestions(suggestions);
      setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
    } catch (e) {
      alert("Error analizando la conversación.");
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
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `anki_cards_${question.id}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }

      setAnkiSuggestions(null);
      alert("Tarjetas guardadas correctamente.");
    } catch (e) {
      alert("Error generando tarjetas.");
    } finally {
      setIsGeneratingCards(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-y-0 right-0 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-[60] animate-in slide-in-from-right duration-300 select-none"
      style={{ width: `${width}px` }}
    >
      <div 
        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-primary/50 transition-colors z-[70] group"
      >
        <div className="w-px h-12 bg-slate-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:bg-white/50" />
      </div>

      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-hidden">
          <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />
          <h3 className="font-bold text-slate-100 truncate">Q: {question.id}</h3>
        </div>
        <div className="flex items-center gap-2">
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
                    <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center ${selectedSuggestions.has(i) ? 'bg-blue-500 text-white' : 'border-2 border-slate-700'}`}>
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

      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md">
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


import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Question, QuizState, QuestionState, ChatMessage, RefinementQuestion, AnkiCard } from './types';
import { generateQuiz, generateRefinementQuestions } from './services/geminiService';
import ChatSidebar from './components/ChatSidebar';
import MarkdownRenderer from './components/MarkdownRenderer';
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
  ArrowRight,
  PartyPopper
} from 'lucide-react';
import confetti from 'canvas-confetti';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refinement Stage
  const [refinementQuestions, setRefinementQuestions] = useState<RefinementQuestion[] | null>(null);
  const [refinementAnswers, setRefinementAnswers] = useState<Record<string, string>>({});
  
  // Anki Global Memory
  const [globalAnkiCards, setGlobalAnkiCards] = useState<AnkiCard[]>([]);
  const [showStudyList, setShowStudyList] = useState(false);

  const requestRefinement = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const questions = await generateRefinementQuestions(topic);
      setRefinementQuestions(questions);
    } catch (e) {
      setError("Error conectando con la IA.");
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const questions = await generateQuiz(topic, questionCount, refinementAnswers);
      setQuiz({
        topic,
        questions,
        currentQuestionIndex: 0,
        results: questions.map(q => ({
          questionId: q.id,
          attempts: [],
          isCorrect: false,
          isFinished: false,
          chatHistory: []
        })),
        isCompleted: false
      });
      setGlobalAnkiCards([]);
    } catch (e) {
      setError("Error generando quiz.");
    } finally {
      setLoading(false);
    }
  };

  const updateChatHistory = useCallback((history: ChatMessage[]) => {
    if (!quiz) return;
    const updatedResults = [...quiz.results];
    updatedResults[quiz.currentQuestionIndex] = {
      ...updatedResults[quiz.currentQuestionIndex],
      chatHistory: history
    };
    setQuiz({ ...quiz, results: updatedResults });
  }, [quiz]);

  const saveToGlobalAnki = useCallback((newCards: AnkiCard[]) => {
    setGlobalAnkiCards(prev => [...prev, ...newCards]);
  }, []);

  const removeAnkiCard = (id: string) => {
    setGlobalAnkiCards(prev => prev.filter(c => c.id !== id));
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

  const currentResult = quiz ? quiz.results[quiz.currentQuestionIndex] : null;
  const currentQuestion = quiz ? quiz.questions[quiz.currentQuestionIndex] : null;

  const score = useMemo(() => {
    if (!quiz) return 0;
    const correctOnFirst = quiz.results.filter(r => r.attempts.length === 1 && r.isCorrect).length;
    return Math.round((correctOnFirst / quiz.questions.length) * 100);
  }, [quiz]);

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

  // Initial State: Topic Selection
  if (!quiz && !refinementQuestions) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center"><Brain className="w-10 h-10 text-primary" /></div></div>
          <h1 className="text-3xl font-bold text-center text-white mb-2">Quiz IA</h1>
          <p className="text-slate-400 text-center mb-8 text-sm">Aprende interactivamente sobre cualquier tema.</p>
          <div className="space-y-6">
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tema (ej: React, Historia...)" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none text-white focus:ring-2 focus:ring-primary" />
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Preguntas</label>
              <div className="flex gap-2">
                {[3, 5, 10].map((n) => (
                  <button key={n} onClick={() => setQuestionCount(n)} className={`flex-1 py-2.5 rounded-xl border font-bold transition-all ${questionCount === n ? 'bg-primary border-primary text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{n}</button>
                ))}
              </div>
            </div>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button onClick={requestRefinement} disabled={loading || !topic.trim()} className="w-full bg-primary py-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stage 2: Refinement
  if (!quiz && refinementQuestions) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <PartyPopper className="text-primary" />
            <h2 className="text-2xl font-bold text-white">Casi listo</h2>
          </div>
          <div className="space-y-6">
            {refinementQuestions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm text-slate-400 mb-2">{q.text}</label>
                <input type="text" placeholder="Tu respuesta..." onChange={(e) => setRefinementAnswers(prev => ({ ...prev, [q.text]: e.target.value }))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 outline-none text-white focus:ring-2 focus:ring-primary" />
              </div>
            ))}
            <div className="pt-4 flex gap-3">
              <button onClick={() => setRefinementQuestions(null)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-400">Atrás</button>
              <button onClick={startQuiz} disabled={loading} className="flex-[2] py-3 bg-primary rounded-xl font-bold text-white shadow-lg">
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
    const perfectAnswers = quiz.results.filter(r => r.attempts.length === 1 && r.isCorrect).length;
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center py-16 px-4">
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
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Perfectas</span>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50">
                <span className="text-4xl font-black text-blue-400 block mb-1">{globalAnkiCards.length}</span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Anki Cards</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="px-10 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
              >
                <RotateCcw size={20} /> Nuevo Quiz
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
        {currentQuestion && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="prose prose-invert max-w-none text-xl">
              <MarkdownRenderer content={currentQuestion.question} />
            </div>
            
            <div className="grid gap-4">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = idx === currentQuestion.correctIndex;
                const attempted = currentResult!.attempts.includes(idx);
                let btnClass = "border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-900";
                if (attempted) btnClass = isCorrect ? "border-green-500 bg-green-500/10 text-green-400" : "border-red-500 bg-red-500/10 text-red-400";
                
                return (
                  <div key={idx} className="space-y-2">
                    <button 
                      disabled={currentResult!.isFinished} 
                      onClick={() => {
                        const newAttempts = [...currentResult!.attempts, idx];
                        const ok = idx === currentQuestion.correctIndex;
                        const results = [...quiz!.results];
                        results[quiz!.currentQuestionIndex] = { ...currentResult!, attempts: newAttempts, isCorrect: ok, isFinished: ok };
                        setQuiz({ ...quiz!, results });
                      }} 
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-start gap-4 active:scale-[0.99] group shadow-sm ${btnClass}`}
                    >
                      <span className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 font-black text-sm ${attempted ? 'border-current' : 'border-slate-700 group-hover:border-primary/50'}`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 pt-0.5 font-medium">{option}</span>
                      {attempted && (isCorrect ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />)}
                    </button>
                    {attempted && !isCorrect && (
                      <div className="ml-12 p-4 bg-red-500/5 border-l-4 border-red-500/50 text-red-400/90 text-sm rounded-r-2xl animate-in slide-in-from-top-2 duration-300">
                        <MarkdownRenderer content={currentQuestion.wrongOptionExplanations[idx]} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {currentResult!.isFinished && (
              <div className="p-8 bg-slate-900/50 border border-green-500/20 rounded-[2.5rem] shadow-2xl space-y-6 animate-in zoom-in duration-500 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-bl-[100%] pointer-events-none" />
                <div className="flex items-center gap-3 text-green-400 font-black uppercase tracking-[0.2em] text-xs">
                  <Info size={18} />
                  <span>Explicación del Experto</span>
                </div>
                <div className="leading-relaxed text-slate-200">
                  <MarkdownRenderer content={currentQuestion.explanation} />
                </div>
                <div className="pt-6 flex justify-end">
                  <button 
                    onClick={() => {
                      if (quiz!.currentQuestionIndex < quiz!.questions.length - 1) {
                        setQuiz({...quiz!, currentQuestionIndex: quiz!.currentQuestionIndex + 1});
                      } else {
                        setQuiz({...quiz!, isCompleted: true});
                      }
                    }} 
                    className="px-10 py-4 bg-primary text-white rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-primary/20 group"
                  >
                    {quiz!.currentQuestionIndex === quiz!.questions.length - 1 ? 'Finalizar Quiz' : 'Siguiente'}
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
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
                      ? 'bg-green-500' 
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

      {currentQuestion && (
        <ChatSidebar
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          question={currentQuestion}
          explanation={currentQuestion.explanation}
          history={currentResult?.chatHistory || []}
          onUpdateHistory={updateChatHistory}
          onSaveCards={saveToGlobalAnki}
        />
      )}
    </div>
  );
};

export default App;

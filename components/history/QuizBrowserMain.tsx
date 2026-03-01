
import React, { useEffect, useState, useCallback } from 'react';
import { Search, X, Plus, CheckCircle, Clock, Trash2, BookOpen, Tag } from 'lucide-react';
import { useRepositories } from '../../repositories/RepositoryContext';
import type { QuizSession } from '../../repositories/interfaces';

interface QuizBrowserMainProps {
  userId: string;
  selectedProjectId: string | null;
  onSelectSession: (session: QuizSession) => void;
  onNewQuiz: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora mismo';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months > 1 ? 'es' : ''}`;
}

interface QuizCardProps {
  session: QuizSession;
  onClick: () => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ session, onClick }) => {
  const { quizSessions } = useRepositories();
  const [deleting, setDeleting] = useState(false);

  const completedCount = session.results.filter((r: any) => r.isFinished).length;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este quiz del historial?')) return;
    setDeleting(true);
    await quizSessions.delete(session.id);
  };

  return (
    <div
      onClick={onClick}
      className={`group bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer hover:border-slate-600 hover:bg-slate-800/60 transition-all relative ${
        deleting ? 'opacity-30 pointer-events-none' : ''
      }`}
    >
      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
        title="Eliminar"
      >
        <Trash2 size={14} />
      </button>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-3">
        {session.isCompleted ? (
          <>
            <CheckCircle size={13} className="text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-400 text-xs font-semibold">
              {session.score !== null ? `${session.score}%` : 'Completado'}
            </span>
          </>
        ) : (
          <>
            <Clock size={13} className="text-amber-400 flex-shrink-0" />
            <span className="text-amber-400 text-xs font-semibold">
              {completedCount}/{session.questionCount} preguntas
            </span>
          </>
        )}
        <span className="text-slate-600 text-xs ml-auto">{timeAgo(session.startedAt)}</span>
      </div>

      {/* Topic */}
      <p className="text-white text-sm font-semibold leading-snug mb-3 line-clamp-2 pr-6">
        {session.topic}
      </p>

      {/* Progress bar for in-progress */}
      {!session.isCompleted && session.questionCount > 0 && (
        <div className="h-1 bg-slate-800 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-amber-400/60 rounded-full transition-all"
            style={{ width: `${(completedCount / session.questionCount) * 100}%` }}
          />
        </div>
      )}

      {/* Tags */}
      {session.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {session.tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full"
            >
              <Tag size={9} />
              {tag}
            </span>
          ))}
          {session.tags.length > 4 && (
            <span className="text-slate-600 text-xs px-1">+{session.tags.length - 4}</span>
          )}
        </div>
      )}
    </div>
  );
};

export const QuizBrowserMain: React.FC<QuizBrowserMainProps> = ({
  userId,
  selectedProjectId,
  onSelectSession,
  onNewQuiz,
}) => {
  const { quizSessions } = useRepositories();
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  useEffect(() => {
    const filters = selectedProjectId ? { projectId: selectedProjectId } : undefined;
    const sub = quizSessions.observe(userId, filters).subscribe(setSessions);
    return () => sub.unsubscribe();
  }, [quizSessions, userId, selectedProjectId]);

  // All unique tags from visible sessions
  const allTags = Array.from(new Set(sessions.flatMap(s => s.tags))).sort();

  // Local filter: search by topic + tags, and tag chip filter
  const filtered = sessions.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      s.topic.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q));
    const matchesTag = !activeTagFilter || s.tags.includes(activeTagFilter);
    return matchesSearch && matchesTag;
  });

  const handleTagFilter = useCallback((tag: string) => {
    setActiveTagFilter(prev => (prev === tag ? null : tag));
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 border-b border-slate-800/60 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white mb-5">
          {selectedProjectId ? 'Quizzes del proyecto' : 'Todos los quizzes'}
        </h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por tema o tags..."
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-10 pr-9 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-600/60 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagFilter(tag)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  activeTagFilter === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tag}
              </button>
            ))}
            {activeTagFilter && (
              <button
                onClick={() => setActiveTagFilter(null)}
                className="text-xs px-2 py-1 text-slate-500 hover:text-white transition-colors flex items-center gap-1"
              >
                <X size={10} /> Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Session grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-slate-800/60 rounded-3xl flex items-center justify-center mb-5">
              <BookOpen size={32} className="text-slate-600" />
            </div>
            <p className="text-slate-300 font-semibold text-lg mb-2">
              {sessions.length === 0 ? 'Aún no hay quizzes' : 'Sin coincidencias'}
            </p>
            <p className="text-slate-500 text-sm max-w-xs">
              {sessions.length === 0
                ? 'Crea tu primer quiz con el botón "New quiz"'
                : 'Prueba con otro término o limpia los filtros'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(session => (
              <QuizCard
                key={session.id}
                session={session}
                onClick={() => onSelectSession(session)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onNewQuiz}
        className="fixed bottom-8 right-8 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/25 transition-all hover:scale-105 z-50"
      >
        <Plus size={18} />
        New quiz
      </button>
    </div>
  );
};

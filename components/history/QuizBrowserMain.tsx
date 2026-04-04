
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, X, Plus, CheckCircle, Clock, Trash2, BookOpen, Tag, Pencil, Check } from 'lucide-react';
import { useRepositories } from '../../repositories/RepositoryContext';
import type { QuizSession } from '../../repositories/interfaces';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(session.topic);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const completedCount = session.results.filter((r: any) => r.isFinished).length;
  const correctCount = session.results.filter((r: any) => r.isFinished && r.isCorrect).length;
  const wrongCount = session.results.filter((r: any) => r.isFinished && !r.isCorrect).length;
  const progressPercent = session.questionCount > 0
    ? (completedCount / session.questionCount) * 100
    : 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este quiz del historial?')) return;
    setDeleting(true);
    await quizSessions.delete(session.id);
  };

  const handleEditTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleSaveTitle = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== session.topic) {
      await quizSessions.update(session.id, { topic: trimmed });
    } else {
      setTitleValue(session.topic);
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') { setTitleValue(session.topic); setEditingTitle(false); }
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'group bg-slate-900 border-slate-800 rounded-2xl cursor-pointer hover:border-slate-600 hover:bg-slate-800/60 transition-all relative',
        deleting && 'opacity-30 pointer-events-none',
      )}
    >
      <CardContent className="p-5">
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEditTitleClick}
            title="Editar título"
            className="h-6 w-6 text-slate-500 hover:text-blue-400"
          >
            <Pencil size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            title="Eliminar"
            className="h-6 w-6 text-slate-600 hover:text-red-400"
          >
            <Trash2 size={14} />
          </Button>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 mb-3">
          {session.isCompleted ? (
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1 text-xs">
              <CheckCircle size={11} />
              {session.score !== null ? `${session.score}%` : 'Completado'}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 gap-1 text-xs">
              <Clock size={11} />
              {completedCount}/{session.questionCount} preguntas
            </Badge>
          )}
          <span className="text-slate-600 text-xs ml-auto">{timeAgo(session.startedAt)}</span>
        </div>

        {/* Topic / editable title */}
        {editingTitle ? (
          <div className="flex items-center gap-1.5 mb-3" onClick={e => e.stopPropagation()}>
            <Input
              ref={titleInputRef}
              type="text"
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={() => handleSaveTitle()}
              className="flex-1 bg-slate-800 border-blue-600/50 text-white text-sm h-7 py-1 focus-visible:ring-blue-500"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveTitle}
              className="h-7 w-7 text-blue-400 hover:text-blue-300 flex-shrink-0"
            >
              <Check size={14} />
            </Button>
          </div>
        ) : (
          <p className="text-white text-sm font-semibold leading-snug mb-3 line-clamp-2 pr-6">
            {session.topic}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3 text-xs">
          <span className="text-slate-500">{session.questionCount} preguntas</span>
          {completedCount > 0 && (
            <>
              <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                <Check size={10} /> {correctCount}
              </span>
              {wrongCount > 0 && (
                <span className="text-red-400 font-medium flex items-center gap-0.5">
                  <X size={10} /> {wrongCount}
                </span>
              )}
            </>
          )}
        </div>

        {/* Progress bar for in-progress */}
        {!session.isCompleted && session.questionCount > 0 && (
          <Progress
            value={progressPercent}
            className="h-1 bg-slate-800 mb-3 [&>div]:bg-amber-400/60"
          />
        )}

        {/* Tags */}
        {session.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {session.tags.slice(0, 4).map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 gap-1 rounded-full"
              >
                <Tag size={9} />
                {tag}
              </Badge>
            ))}
            {session.tags.length > 4 && (
              <span className="text-slate-600 text-xs px-1">+{session.tags.length - 4}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
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

  const allTags = Array.from(new Set(sessions.flatMap(s => s.tags))).sort();

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
          <Input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por tema o tags..."
            className="bg-slate-800/60 border-slate-700/50 pl-10 pr-9 text-white placeholder:text-slate-500 focus-visible:border-blue-600/60 focus-visible:ring-0"
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
              <Button
                key={tag}
                variant="ghost"
                size="sm"
                onClick={() => handleTagFilter(tag)}
                className={cn(
                  'text-xs h-7 px-2.5 rounded-full font-medium transition-colors',
                  activeTagFilter === tag
                    ? 'bg-blue-600 text-white hover:bg-blue-600'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700',
                )}
              >
                {tag}
              </Button>
            ))}
            {activeTagFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTagFilter(null)}
                className="text-xs h-7 px-2 text-slate-500 hover:text-white gap-1"
              >
                <X size={10} /> Limpiar
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Session grid */}
      <ScrollArea className="flex-1 px-8 py-6">
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
      </ScrollArea>

      {/* Floating Action Button */}
      <Button
        onClick={onNewQuiz}
        className="fixed bottom-8 right-8 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold px-5 py-3 h-auto rounded-2xl shadow-lg shadow-blue-600/25 hover:scale-105 z-50"
      >
        <Plus size={18} />
        New quiz
      </Button>
    </div>
  );
};

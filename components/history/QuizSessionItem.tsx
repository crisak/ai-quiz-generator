import React, { useState, useRef } from 'react';
import { Trash2, Plus, X, CheckCircle, Clock, Check } from 'lucide-react';
import { useRepositories } from '../../repositories/RepositoryContext';
import type { QuizSession } from '../../repositories/interfaces';

interface QuizSessionItemProps {
  session: QuizSession;
  onClick: () => void;
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

export const QuizSessionItem: React.FC<QuizSessionItemProps> = ({ session, onClick }) => {
  const { quizSessions } = useRepositories();
  const [tags, setTags] = useState<string[]>(session.tags);
  const [addingTag, setAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(session.topic);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const completedCount = session.results.filter((r: any) => r.isFinished).length;
  const totalCount = session.questionCount;
  const correctCount = session.results.filter((r: any) => r.isFinished && r.isCorrect).length;
  const wrongCount = session.results.filter((r: any) => r.isFinished && !r.isCorrect).length;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este quiz del historial?')) return;
    setDeleting(true);
    await quizSessions.delete(session.id);
  };

  const handleAddTag = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t)) { setTagInput(''); setAddingTag(false); return; }
    const newTags = [...tags, t];
    setTags(newTags);
    setTagInput('');
    setAddingTag(false);
    await quizSessions.update(session.id, { tags: newTags });
  };

  const handleRemoveTag = async (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    await quizSessions.update(session.id, { tags: newTags });
  };

  const handleTitleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleSaveTitle = async () => {
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
    <div
      onClick={onClick}
      className={`group px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-800/60 ${
        deleting ? 'opacity-30 pointer-events-none' : ''
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        {editingTitle ? (
          <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
            <input
              ref={titleInputRef}
              type="text"
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={handleSaveTitle}
              className="flex-1 bg-slate-700 border border-blue-600/50 rounded px-1.5 py-0.5 text-white text-xs outline-none"
            />
            <button onClick={e => { e.stopPropagation(); handleSaveTitle(); }} className="text-blue-400 hover:text-blue-300 flex-shrink-0">
              <Check size={11} />
            </button>
          </div>
        ) : (
          <p
            className="text-white text-xs font-medium leading-snug line-clamp-2 flex-1"
            onDoubleClick={handleTitleDoubleClick}
            title="Doble click para editar"
          >
            {session.topic}
          </p>
        )}
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
          title="Eliminar"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        {session.isCompleted ? (
          <>
            <CheckCircle size={11} className="text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-400 text-xs font-medium">
              {session.score !== null ? `${session.score}%` : 'Completado'}
            </span>
          </>
        ) : (
          <>
            <Clock size={11} className="text-amber-400 flex-shrink-0" />
            <span className="text-amber-400 text-xs">
              {completedCount}/{totalCount} preguntas
            </span>
          </>
        )}
        {completedCount > 0 && (
          <>
            <span className="text-emerald-400 text-xs flex items-center gap-0.5">
              <Check size={9} />{correctCount}
            </span>
            {wrongCount > 0 && (
              <span className="text-red-400 text-xs flex items-center gap-0.5">
                <X size={9} />{wrongCount}
              </span>
            )}
          </>
        )}
        <span className="text-slate-500 text-xs ml-auto">{timeAgo(session.startedAt)}</span>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap gap-1 items-center" onClick={e => e.stopPropagation()}>
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 bg-slate-700/60 text-slate-300 text-xs px-1.5 py-0.5 rounded-full"
          >
            {tag}
            <button onClick={e => handleRemoveTag(e, tag)} className="text-slate-400 hover:text-red-400 transition-colors">
              <X size={9} />
            </button>
          </span>
        ))}

        {addingTag ? (
          <input
            autoFocus
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            onBlur={() => { setAddingTag(false); setTagInput(''); }}
            placeholder="tag..."
            className="bg-slate-700 text-white text-xs px-1.5 py-0.5 rounded-full w-16 outline-none"
          />
        ) : (
          <button
            onClick={e => { e.stopPropagation(); setAddingTag(true); }}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Agregar tag"
          >
            <Plus size={11} />
          </button>
        )}
      </div>
    </div>
  );
};

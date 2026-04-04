import React, { useEffect, useState } from 'react';
import { Plus, X, FolderOpen, Loader2 } from 'lucide-react';
import { useRepositories } from '../../repositories/RepositoryContext';
import { CreateProjectModal } from './CreateProjectModal';
import type { Project } from '../../repositories/interfaces';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

interface ProjectsSectionProps {
  userId: string;
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  userId,
  selectedProjectId,
  onSelectProject,
}) => {
  const { projects } = useRepositories();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const sub = projects.observe(userId).subscribe(setProjectList);
    return () => sub.unsubscribe();
  }, [projects, userId]);

  const handleCreate = async (data: { name: string; description?: string; color?: string }) => {
    await projects.create(userId, data);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este proyecto? Los quizzes quedarán sin proyecto asignado.')) return;
    setDeletingId(id);
    try {
      await projects.delete(id);
      if (selectedProjectId === id) onSelectProject(null);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-slate-400">
          <FolderOpen size={12} />
          <span className="text-xs font-medium uppercase tracking-wider">Proyectos</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowModal(true)}
          title="Nuevo proyecto"
          className="h-5 w-5 text-slate-500 hover:text-slate-300"
        >
          <Plus size={14} />
        </Button>
      </div>

      <ScrollArea className="max-h-64">
        <div className="space-y-0.5 px-2">
          <Button
            variant="ghost"
            onClick={() => onSelectProject(null)}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 h-auto rounded-lg text-sm transition-colors justify-start',
              selectedProjectId === null
                ? 'bg-slate-700/50 text-white hover:bg-slate-700/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50',
            )}
          >
            <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
            <span className="truncate text-xs">Todos</span>
          </Button>

          {projectList.map(project => (
            <Button
              key={project.id}
              variant="ghost"
              onClick={() => onSelectProject(project.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 h-auto rounded-lg text-sm transition-colors justify-start group',
                selectedProjectId === project.id
                  ? 'bg-slate-700/50 text-white hover:bg-slate-700/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50',
              )}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color ?? '#3b82f6' }}
              />
              <span className="truncate text-xs flex-1 text-left">{project.name}</span>
              <span
                onClick={e => handleDelete(e, project.id)}
                className={cn(
                  'opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all cursor-pointer',
                  deletingId === project.id && 'opacity-100',
                )}
                title="Eliminar proyecto"
              >
                {deletingId === project.id
                  ? <Loader2 size={12} className="animate-spin" />
                  : <X size={12} />
                }
              </span>
            </Button>
          ))}
        </div>
      </ScrollArea>

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

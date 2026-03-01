import React, { useEffect, useState } from 'react';
import { Plus, X, FolderOpen } from 'lucide-react';
import { useRepositories } from '../../repositories/RepositoryContext';
import { CreateProjectModal } from './CreateProjectModal';
import type { Project } from '../../repositories/interfaces';

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
        <button
          onClick={() => setShowModal(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Nuevo proyecto"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-0.5 px-2">
        <button
          onClick={() => onSelectProject(null)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left ${
            selectedProjectId === null
              ? 'bg-slate-700/50 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
          <span className="truncate text-xs">Todos</span>
        </button>

        {projectList.map(project => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left group ${
              selectedProjectId === project.id
                ? 'bg-slate-700/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color ?? '#3b82f6' }}
            />
            <span className="truncate text-xs flex-1">{project.name}</span>
            <span
              onClick={e => handleDelete(e, project.id)}
              className={`opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all cursor-pointer ${
                deletingId === project.id ? 'opacity-100 animate-spin' : ''
              }`}
              title="Eliminar proyecto"
            >
              <X size={12} />
            </span>
          </button>
        ))}
      </div>

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};


import React from 'react';
import { PanelLeftClose, PanelLeft, Brain } from 'lucide-react';
import { ProjectsSection } from './ProjectsSection';

interface HistorySidebarProps {
  userId: string;
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  userId,
  selectedProjectId,
  onSelectProject,
  collapsed,
  onCollapse,
}) => {
  if (collapsed) {
    return (
      <div className="w-12 flex-shrink-0 flex flex-col items-center pt-4 gap-4 border-r border-slate-800 bg-slate-950">
        <button
          onClick={() => onCollapse(false)}
          className="text-slate-500 hover:text-white transition-colors"
          title="Abrir sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <div className="w-6 h-6 bg-blue-600/20 rounded-lg flex items-center justify-center">
          <Brain size={13} className="text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-950 h-full overflow-hidden">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600/20 rounded-lg flex items-center justify-center">
            <Brain size={13} className="text-blue-400" />
          </div>
          <span className="text-slate-200 text-sm font-semibold">Quiz IA</span>
        </div>
        <button
          onClick={() => onCollapse(true)}
          className="text-slate-500 hover:text-white transition-colors"
          title="Cerrar sidebar"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Projects section */}
      <div className="flex-1 overflow-y-auto py-3">
        <ProjectsSection
          userId={userId}
          selectedProjectId={selectedProjectId}
          onSelectProject={onSelectProject}
        />
      </div>
    </div>
  );
};

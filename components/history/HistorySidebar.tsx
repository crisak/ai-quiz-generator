
import React from 'react';
import { PanelLeftClose, PanelLeft, Brain, Key } from 'lucide-react';
import { ProjectsSection } from './ProjectsSection';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

interface HistorySidebarProps {
  userId: string;
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onShowApiKeyModal?: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  userId,
  selectedProjectId,
  onSelectProject,
  collapsed,
  onCollapse,
  onShowApiKeyModal,
}) => {
  if (collapsed) {
    return (
      <div className="w-12 flex-shrink-0 flex flex-col items-center pt-4 gap-4 border-r border-slate-800 bg-slate-950">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapse(false)}
          title="Abrir sidebar"
          className="h-8 w-8 text-slate-500 hover:text-white"
        >
          <PanelLeft size={18} />
        </Button>
        {onShowApiKeyModal && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onShowApiKeyModal}
            title="Cambiar API Key"
            className="h-8 w-8 text-slate-500 hover:text-white"
          >
            <Key size={18} />
          </Button>
        )}
        <div className="w-6 h-6 bg-blue-600/20 rounded-lg flex items-center justify-center">
          <Brain size={13} className="text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-950 h-full overflow-hidden">
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600/20 rounded-lg flex items-center justify-center">
            <Brain size={13} className="text-blue-400" />
          </div>
          <span className="text-slate-200 text-sm font-semibold">Quiz IA</span>
        </div>
        <div className="flex items-center gap-1">
          {onShowApiKeyModal && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onShowApiKeyModal}
              title="Cambiar API Key"
              className="h-7 w-7 text-slate-500 hover:text-white"
            >
              <Key size={14} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapse(true)}
            title="Cerrar sidebar"
            className="h-7 w-7 text-slate-500 hover:text-white"
          >
            <PanelLeftClose size={15} />
          </Button>
        </div>
      </div>

      <Separator className="bg-slate-800/60" />

      {/* Projects section */}
      <ScrollArea className="flex-1 py-3">
        <ProjectsSection
          userId={userId}
          selectedProjectId={selectedProjectId}
          onSelectProject={onSelectProject}
        />
      </ScrollArea>

      {/* Footer: theme toggle */}
      <Separator className="bg-slate-800" />
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between">
        <span className="text-slate-500 text-xs">Tema</span>
        <ThemeToggle />
      </div>
    </div>
  );
};

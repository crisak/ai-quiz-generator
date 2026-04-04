
import React from 'react';
import { Trash2 } from 'lucide-react';
import type { VocabTerm } from '../types';
import { Popover, PopoverContent, PopoverAnchor } from './ui/popover';
import { Button } from './ui/button';

interface Props {
  term: VocabTerm;
  /** Viewport X center of the highlighted element */
  x: number;
  /** Viewport Y top of the highlighted element */
  y: number;
  onDelete: () => void;
  onClose: () => void;
}

const VocabHighlightTooltip: React.FC<Props> = ({ term, x, y, onDelete, onClose }) => {
  return (
    <Popover open onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* Invisible anchor pinned to the click position */}
      <PopoverAnchor asChild>
        <span
          className="fixed pointer-events-none"
          style={{ left: x, top: y, width: 1, height: 1 }}
        />
      </PopoverAnchor>

      <PopoverContent
        side="top"
        align="center"
        className="w-[240px] p-3 bg-slate-800 border border-amber-500/40 shadow-2xl"
        onInteractOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
          Vocabulario guardado
        </div>
        <div className="text-sm font-bold text-amber-300 mb-3 leading-snug break-words">
          {term.text}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold h-7 px-3"
          >
            <Trash2 size={12} /> Eliminar
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-slate-500 hover:text-slate-300 hover:bg-slate-700"
          >
            ✕
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default VocabHighlightTooltip;

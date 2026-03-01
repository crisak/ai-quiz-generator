
import React, { useEffect, useRef } from 'react';
import { Trash2, X } from 'lucide-react';
import type { VocabTerm } from '../types';

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay so the same click that opened the tooltip doesn't close it immediately
    const timer = setTimeout(() => {
      const handler = (e: PointerEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener('pointerdown', handler);
      return () => document.removeEventListener('pointerdown', handler);
    }, 60);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[400] bg-slate-800 border border-amber-500/40 rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, calc(-100% - 10px))',
        minWidth: '200px',
        maxWidth: '260px',
      }}
    >
      {/* Caret */}
      <div className="absolute left-1/2 -bottom-[7px] -translate-x-1/2 w-3.5 h-2 overflow-hidden pointer-events-none">
        <div className="w-3 h-3 bg-slate-800 border-r border-b border-amber-500/40 rotate-45 translate-y-[-50%] mx-auto" />
      </div>

      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
        Vocabulario guardado
      </div>
      <div className="text-sm font-bold text-amber-300 mb-3 leading-snug break-words">
        {term.text}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-all"
        >
          <Trash2 size={12} /> Eliminar
        </button>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-700"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default VocabHighlightTooltip;

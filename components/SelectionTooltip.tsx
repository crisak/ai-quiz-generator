
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

interface Props {
  children: React.ReactNode;
  onAddTerm: (term: string) => void;
  onDirectSearch: (term: string) => void;
}

const SelectionTooltip: React.FC<Props> = ({ children, onAddTerm, onDirectSearch }) => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const clearTooltip = useCallback(() => setTooltip(null), []);

  const handleMouseUp = useCallback(() => {
    // Defer so the browser finalizes the selection
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setTooltip(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length < 2 || text.length > 100) {
        setTooltip(null);
        return;
      }

      if (!containerRef.current) return;
      const range = selection.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        setTooltip(null);
        return;
      }

      const rect = range.getBoundingClientRect();
      setTooltip({
        text,
        x: rect.left + rect.width / 2,
        y: rect.top, // viewport-relative (fixed positioning)
      });
    }, 10);
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (tooltipRef.current?.contains(e.target as Node)) return;
      setTooltip(null);
    };
    const handleScroll = () => setTooltip(null);

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleMouseUp]);

  return (
    <div ref={containerRef} className="select-text">
      {children}

      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-[300] flex items-center gap-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, calc(-100% - 8px))',
          }}
        >
          {/* Small caret */}
          <div
            className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-1.5 overflow-hidden"
          >
            <div className="w-3 h-3 bg-slate-600 rotate-45 translate-y-[-60%] mx-auto" />
          </div>

          <span className="max-w-[120px] px-2 py-0.5 text-xs text-slate-400 truncate border-r border-slate-600 mr-0.5 italic">
            {tooltip.text.length > 24 ? `"${tooltip.text.slice(0, 24)}…"` : `"${tooltip.text}"`}
          </span>

          <button
            onMouseDown={(e) => e.preventDefault()} // prevent deselection
            onClick={() => {
              onDirectSearch(tooltip.text);
              clearTooltip();
              window.getSelection()?.removeAllRanges();
            }}
            title="Preguntar directamente al tutor IA"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 hover:bg-primary/40 text-primary transition-colors text-xs font-bold"
          >
            <Search size={12} />
            <span>Preguntar</span>
          </button>

          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onAddTerm(tooltip.text);
              clearTooltip();
              window.getSelection()?.removeAllRanges();
            }}
            title="Agregar a lista de vocabulario"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors text-xs font-bold"
          >
            <Plus size={12} />
            <span>Guardar</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectionTooltip;

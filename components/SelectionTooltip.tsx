
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from './ui/popover';
import { Button } from './ui/button';

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

  const clearTooltip = useCallback(() => setTooltip(null), []);

  const handleMouseUp = useCallback(() => {
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
        y: rect.top,
      });
    }, 10);
  }, []);

  useEffect(() => {
    const handleScroll = () => setTooltip(null);

    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleMouseUp]);

  return (
    <div ref={containerRef} className="select-text">
      {children}

      {tooltip && (
        <Popover open onOpenChange={(open) => { if (!open) clearTooltip(); }}>
          <PopoverAnchor asChild>
            <span
              className="fixed pointer-events-none"
              style={{ left: tooltip.x, top: tooltip.y, width: 1, height: 1 }}
            />
          </PopoverAnchor>

          <PopoverContent
            side="top"
            align="center"
            className="w-auto p-1.5 bg-slate-800 border-slate-600 shadow-2xl"
            onInteractOutside={clearTooltip}
            onEscapeKeyDown={clearTooltip}
          >
            <div className="flex items-center gap-1">
              <span className="max-w-[120px] px-2 py-0.5 text-xs text-slate-400 truncate border-r border-slate-600 mr-0.5 italic">
                {tooltip.text.length > 24 ? `"${tooltip.text.slice(0, 24)}…"` : `"${tooltip.text}"`}
              </span>

              <Button
                variant="ghost"
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onDirectSearch(tooltip.text);
                  clearTooltip();
                  window.getSelection()?.removeAllRanges();
                }}
                title="Preguntar directamente al tutor IA"
                className="flex items-center gap-1 h-7 px-2 bg-primary/20 hover:bg-primary/40 text-primary hover:text-primary text-xs font-bold"
              >
                <Search size={12} />
                <span>Preguntar</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onAddTerm(tooltip.text);
                  clearTooltip();
                  window.getSelection()?.removeAllRanges();
                }}
                title="Agregar a lista de vocabulario"
                className="flex items-center gap-1 h-7 px-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-300 text-xs font-bold"
              >
                <Plus size={12} />
                <span>Guardar</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default SelectionTooltip;

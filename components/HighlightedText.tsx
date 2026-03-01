
import React, { useState } from 'react';
import VocabHighlightTooltip from './VocabHighlightTooltip';
import type { VocabTerm } from '../types';

interface Segment {
  type: 'text' | 'term';
  content: string;
  termId?: string;
}

function splitIntoSegments(text: string, terms: VocabTerm[]): Segment[] {
  if (terms.length === 0) return [{ type: 'text', content: text }];

  // Longest-first prevents partial matches
  const sorted = [...terms].sort((a, b) => b.text.length - a.text.length);
  let segments: Segment[] = [{ type: 'text', content: text }];

  for (const term of sorted) {
    const next: Segment[] = [];
    for (const seg of segments) {
      if (seg.type === 'term') { next.push(seg); continue; }

      const lower = seg.content.toLowerCase();
      const lowerTerm = term.text.toLowerCase();
      const idx = lower.indexOf(lowerTerm);

      if (idx === -1) { next.push(seg); continue; }

      if (idx > 0) next.push({ type: 'text', content: seg.content.slice(0, idx) });
      next.push({ type: 'term', content: seg.content.slice(idx, idx + term.text.length), termId: term.id });
      const after = seg.content.slice(idx + term.text.length);
      if (after) next.push({ type: 'text', content: after });
    }
    segments = next;
  }
  return segments;
}

interface ActiveTooltip {
  id: string;
  x: number;
  y: number;
}

interface Props {
  text: string;
  terms: VocabTerm[];
  onRemoveTerm: (id: string) => void;
  className?: string;
}

const HighlightedText: React.FC<Props> = ({ text, terms, onRemoveTerm, className }) => {
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);
  const segments = splitIntoSegments(text, terms);

  const tooltipTerm = activeTooltip ? terms.find(t => t.id === activeTooltip.id) : null;

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.content}</span>;

        const isActive = activeTooltip?.id === seg.termId;
        return (
          <mark
            key={i}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setActiveTooltip(prev =>
                prev?.id === seg.termId ? null : { id: seg.termId!, x: rect.left + rect.width / 2, y: rect.top }
              );
            }}
            title="Término guardado — clic para ver opciones"
            style={{
              cursor: 'pointer',
              background: isActive ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.15)',
              color: '#fbbf24',
              borderRadius: '3px',
              padding: '0 2px',
              borderBottom: '1.5px solid rgba(251,191,36,0.5)',
              transition: 'background 0.15s',
              // Override pointer-events:none from disabled parent buttons
              pointerEvents: 'all',
            }}
          >
            {seg.content}
          </mark>
        );
      })}

      {activeTooltip && tooltipTerm && (
        <VocabHighlightTooltip
          term={tooltipTerm}
          x={activeTooltip.x}
          y={activeTooltip.y}
          onDelete={() => {
            onRemoveTerm(activeTooltip.id);
            setActiveTooltip(null);
          }}
          onClose={() => setActiveTooltip(null)}
        />
      )}
    </span>
  );
};

export default HighlightedText;

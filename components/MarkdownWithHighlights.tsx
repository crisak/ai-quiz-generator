
import React, { useRef, useLayoutEffect, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import VocabHighlightTooltip from './VocabHighlightTooltip';
import type { VocabTerm } from '../types';

interface Props {
  content: string;
  terms: VocabTerm[];
  onRemoveTerm: (id: string) => void;
  className?: string;
}

interface ActiveTooltip {
  id: string;
  x: number;
  y: number;
}

function applyHighlights(
  container: HTMLElement,
  terms: VocabTerm[],
  onMarkClick: (id: string, x: number, y: number) => void
) {
  // Remove existing marks
  container.querySelectorAll('[data-vocab-id]').forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  });
  container.normalize();

  if (terms.length === 0) return;

  const sortedTerms = [...terms].sort((a, b) => b.text.length - a.text.length);

  const getTextNodes = (root: HTMLElement): Text[] => {
    const result: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let el = node.parentElement;
        while (el && el !== root) {
          if (el.tagName === 'CODE' || el.tagName === 'PRE') return NodeFilter.FILTER_REJECT;
          el = el.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n: Node | null;
    while ((n = walker.nextNode())) result.push(n as Text);
    return result;
  };

  const nodes = getTextNodes(container);

  for (let i = 0; i < nodes.length; i++) {
    const textNode = nodes[i];
    for (const term of sortedTerms) {
      const val = textNode.nodeValue ?? '';
      const idx = val.toLowerCase().indexOf(term.text.toLowerCase());
      if (idx === -1) continue;

      const mark = document.createElement('mark');
      mark.setAttribute('data-vocab-id', term.id);
      mark.textContent = val.slice(idx, idx + term.text.length);
      mark.title = 'Término guardado — clic para ver opciones';
      mark.style.cssText = [
        'cursor:pointer',
        'background:rgba(251,191,36,0.15)',
        'color:#fbbf24',
        'border-radius:3px',
        'padding:0 2px',
        'border-bottom:1.5px solid rgba(251,191,36,0.5)',
        'transition:background 0.15s',
        'pointer-events:all',
      ].join(';');

      mark.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = mark.getBoundingClientRect();
        onMarkClick(term.id, rect.left + rect.width / 2, rect.top);
      });
      mark.addEventListener('mouseenter', () => { mark.style.background = 'rgba(251,191,36,0.3)'; });
      mark.addEventListener('mouseleave', () => { mark.style.background = 'rgba(251,191,36,0.15)'; });

      const parent = textNode.parentNode!;
      if (idx > 0) parent.insertBefore(document.createTextNode(val.slice(0, idx)), textNode);
      parent.insertBefore(mark, textNode);

      const after = val.slice(idx + term.text.length);
      if (after.length > 0) {
        textNode.nodeValue = after;
        nodes.splice(i + 1, 0, textNode);
      } else {
        parent.removeChild(textNode);
      }
      break;
    }
  }
}

const MarkdownWithHighlights: React.FC<Props> = ({ content, terms, onRemoveTerm, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);

  // Stable ref so DOM handlers always dispatch to latest setter
  const dispatchRef = useRef((id: string, x: number, y: number) => {
    setActiveTooltip(prev => (prev?.id === id ? null : { id, x, y }));
  });

  const onRemoveRef = useRef(onRemoveTerm);
  onRemoveRef.current = onRemoveTerm;

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    applyHighlights(containerRef.current, terms, (id, x, y) => dispatchRef.current(id, x, y));
    // If the active tooltip's term was removed, close the tooltip
    setActiveTooltip(prev => (prev && !terms.find(t => t.id === prev.id) ? null : prev));
  }, [terms, content]);

  const tooltipTerm = activeTooltip ? terms.find(t => t.id === activeTooltip.id) : null;

  return (
    <div ref={containerRef} className={className}>
      <MarkdownRenderer content={content} />
      {activeTooltip && tooltipTerm && (
        <VocabHighlightTooltip
          term={tooltipTerm}
          x={activeTooltip.x}
          y={activeTooltip.y}
          onDelete={() => {
            onRemoveRef.current(activeTooltip.id);
            setActiveTooltip(null);
          }}
          onClose={() => setActiveTooltip(null)}
        />
      )}
    </div>
  );
};

export default MarkdownWithHighlights;


import React, { Component, useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { Maximize2, X, Plus, Minus, RotateCcw, Code, Eye } from 'lucide-react';
import { createPortal } from 'react-dom';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'monospace',
  suppressErrors: true,
});

// Cleans any error SVGs mermaid injected directly into document.body
const cleanMermaidBodyRemnants = (id: string) => {
  // Mermaid may leave elements with the render id or with "-error" suffix
  [`#${id}`, `#${id}-error`, `#d${id}`].forEach(selector => {
    try {
      const el = document.querySelector(selector);
      if (el && el.parentElement === document.body) el.remove();
    } catch {}
  });
  // Also remove any error SVGs mermaid left at root level
  document.querySelectorAll('body > svg[id^="mermaid"]').forEach(el => el.remove());
  document.querySelectorAll('body > [id^="mermaid"]').forEach(el => el.remove());
};

// Renders Mermaid in a detached node so it never conflicts with React's DOM tree
const renderMermaidSafely = async (chart: string, id: string): Promise<string> => {
  const tempDiv = document.createElement('div');
  tempDiv.id = `container-${id}`;
  tempDiv.style.cssText = 'visibility:hidden;position:absolute;top:-9999px;left:-9999px;pointer-events:none';
  document.body.appendChild(tempDiv);
  try {
    const { svg } = await mermaid.render(id, chart);
    return svg;
  } finally {
    // Remove our wrapper
    if (document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
    }
    // Remove any error elements mermaid left behind in document.body
    cleanMermaidBodyRemnants(id);
  }
};

// Error Boundary to prevent Mermaid DOM errors from crashing the app
interface BoundaryState { hasError: boolean; }
class MermaidErrorBoundary extends Component<{ children: React.ReactNode }, BoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error('Mermaid boundary caught:', error.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="my-6 p-4 rounded-2xl border border-slate-700/50 bg-slate-900/30 text-slate-500 text-xs font-mono italic">
          [Diagrama no disponible]
        </div>
      );
    }
    return this.props.children;
  }
}

interface MermaidProps {
  chart: string;
}

const MermaidInner: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'diagram' | 'code'>('diagram');
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [modalSvg, setModalSvg] = useState<string | null>(null);
  const baseId = useId().replace(/:/g, '');

  // Render inline diagram — stores SVG in state, React controls the DOM
  useEffect(() => {
    if (isExpanded) return;
    let cancelled = false;

    renderMermaidSafely(chart, `mermaid-${baseId}-main-${Date.now()}`)
      .then((result) => {
        if (!cancelled) {
          setSvg(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Mermaid inline error:', err);
          setError(err.message?.split('\n')[0] || 'Error de sintaxis en Mermaid');
        }
      });

    return () => { cancelled = true; };
  }, [chart, isExpanded]);

  // Render modal diagram — same pattern
  useEffect(() => {
    if (!isExpanded || viewMode !== 'diagram') return;
    let cancelled = false;

    const timer = setTimeout(() => {
      renderMermaidSafely(chart, `mermaid-${baseId}-modal-${Date.now()}`)
        .then((result) => {
          if (!cancelled) setModalSvg(result);
        })
        .catch((err) => {
          if (!cancelled) console.error('Mermaid modal error:', err);
        });
    }, 80);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isExpanded, viewMode, chart]);

  const handleOpen = () => {
    setModalSvg(null);
    setZoom(1);
    setViewMode('diagram');
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
    setModalSvg(null);
  };

  return (
    <div className="relative group w-full animate-in fade-in duration-500">
      <div className="my-6 rounded-2xl border border-slate-700/50 bg-slate-900/30 overflow-hidden shadow-inner">
        {error ? (
          <div className="p-6 text-xs font-mono text-red-400 bg-red-950/20 border-l-4 border-red-500">
            <p className="font-bold mb-2">Error de Mermaid:</p>
            <p className="opacity-80 break-words line-clamp-3">{error}</p>
            <button
              onClick={handleOpen}
              className="mt-4 px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2 text-slate-300"
            >
              <Code size={14} /> Ver código
            </button>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="p-6 overflow-x-auto custom-scrollbar flex justify-center min-h-[120px] items-center"
          >
            {svg
              ? <div dangerouslySetInnerHTML={{ __html: svg }} className="w-full flex justify-center" />
              : <div className="text-slate-600 animate-pulse text-xs italic">Cargando diagrama...</div>
            }
          </div>
        )}

        {!error && (
          <button
            onClick={handleOpen}
            className="absolute top-4 right-4 p-2 bg-slate-800/90 hover:bg-primary text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10 shadow-2xl backdrop-blur-md"
            title="Expandir diagrama"
          >
            <Maximize2 size={18} />
          </button>
        )}
      </div>

      {isExpanded && createPortal(
        <div className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/80 border border-slate-700 p-2 rounded-2xl shadow-2xl z-[210] backdrop-blur-md">
            <div className="flex bg-slate-800 rounded-xl p-1 mr-2">
              <button
                onClick={() => setViewMode('diagram')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'diagram' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <Eye size={14} /> Vista
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'code' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <Code size={14} /> Código
              </button>
            </div>

            {viewMode === 'diagram' && (
              <>
                <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.2))} className="p-2 hover:bg-slate-700 rounded-xl text-white transition-colors"><Minus size={20} /></button>
                <button onClick={() => setZoom(1)} className="px-5 py-2 hover:bg-slate-700 rounded-xl text-white font-mono text-sm tracking-tighter">{Math.round(zoom * 100)}%</button>
                <button onClick={() => setZoom(z => Math.min(z + 0.2, 5))} className="p-2 hover:bg-slate-700 rounded-xl text-white transition-colors"><Plus size={20} /></button>
                <div className="w-px h-6 bg-slate-700 mx-1" />
                <button onClick={() => setZoom(1)} className="p-2 hover:bg-slate-700 rounded-xl text-white transition-colors" title="Restablecer"><RotateCcw size={18} /></button>
              </>
            )}
          </div>

          <button
            onClick={handleClose}
            className="absolute top-8 right-8 p-4 bg-slate-800 hover:bg-red-900 text-white rounded-full transition-all z-[210] shadow-2xl"
          >
            <X size={28} />
          </button>

          <div className="w-full h-full flex items-center justify-center overflow-auto p-12">
            {viewMode === 'diagram' ? (
              <div
                className="transition-transform duration-300 ease-out origin-center"
                style={{ transform: `scale(${zoom})` }}
              >
                <div
                  ref={modalRef}
                  className="p-12 bg-slate-900/40 rounded-[3rem] border border-slate-800/50 shadow-2xl flex items-center justify-center min-w-[500px] min-h-[300px]"
                >
                  {modalSvg
                    ? <div dangerouslySetInnerHTML={{ __html: modalSvg }} className="w-full flex justify-center" />
                    : <div className="text-slate-500 italic animate-pulse">Renderizando diagrama...</div>
                  }
                </div>
              </div>
            ) : (
              <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl font-mono text-sm animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                  <h4 className="text-primary font-black uppercase tracking-widest text-xs">Mermaid Source Code</h4>
                  <button
                    onClick={() => navigator.clipboard.writeText(chart)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Copiar Código
                  </button>
                </div>
                <pre className="text-green-400 overflow-auto max-h-[60vh] custom-scrollbar bg-slate-950 p-8 rounded-3xl border border-slate-800 leading-relaxed">
                  {chart}
                </pre>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const Mermaid: React.FC<MermaidProps> = ({ chart }) => (
  <MermaidErrorBoundary>
    <MermaidInner chart={chart} />
  </MermaidErrorBoundary>
);

export default Mermaid;

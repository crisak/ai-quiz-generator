
import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { Maximize2, X, Plus, Minus, RotateCcw, Code, Eye } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'diagram' | 'code'>('diagram');
  const [error, setError] = useState<string | null>(null);
  const baseId = useId().replace(/:/g, '');

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'monospace',
    });
  }, []);

  const renderToElement = async (element: HTMLDivElement | null, suffix: string) => {
    if (!element || !chart) return;
    try {
      element.innerHTML = '';
      const { svg } = await mermaid.render(`mermaid-${baseId}-${suffix}`, chart);
      element.innerHTML = svg;
      setError(null);
    } catch (err: any) {
      console.error(`Mermaid error (${suffix}):`, err);
      setError(err.message || "Error de sintaxis en Mermaid");
    }
  };

  // Render original diagram
  useEffect(() => {
    if (!isExpanded) {
      renderToElement(containerRef.current, 'main');
    }
  }, [chart, isExpanded]);

  // Render modal diagram when expanded
  useEffect(() => {
    if (isExpanded && viewMode === 'diagram') {
      // Small timeout to ensure Portal is mounted
      const timer = setTimeout(() => {
        renderToElement(modalRef.current, 'modal');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded, viewMode, chart]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setZoom(1);
    setViewMode('diagram');
  };

  return (
    <div className="relative group w-full animate-in fade-in duration-500">
      <div className="my-6 rounded-2xl border border-slate-700/50 bg-slate-900/30 overflow-hidden shadow-inner">
        {error ? (
          <div className="p-6 text-xs font-mono text-red-400 bg-red-950/20 border-l-4 border-red-500">
            <p className="font-bold mb-2">Error de Mermaid:</p>
            <p className="opacity-80 break-words line-clamp-3">{error}</p>
            <button 
              onClick={toggleExpand}
              className="mt-4 px-4 py-2 bg-slate-800 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2 text-slate-300"
            >
              <Code size={14} /> Ver código y arreglar
            </button>
          </div>
        ) : (
          <div className="p-6 overflow-x-auto custom-scrollbar flex justify-center min-h-[120px] items-center" ref={containerRef}>
            {/* Mermaid SVG injected here */}
            <div className="text-slate-600 animate-pulse text-xs italic">Cargando diagrama...</div>
          </div>
        )}
        
        {!error && (
          <button 
            onClick={toggleExpand}
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
            onClick={toggleExpand}
            className="absolute top-8 right-8 p-4 bg-slate-800 hover:bg-destructive text-white rounded-full transition-all z-[210] shadow-2xl"
          >
            <X size={28} />
          </button>

          <div className="w-full h-full flex items-center justify-center overflow-auto p-12">
            {viewMode === 'diagram' ? (
              <div 
                className="transition-transform duration-300 ease-out origin-center"
                style={{ transform: `scale(${zoom})` }}
              >
                <div ref={modalRef} className="mermaid-expanded p-12 bg-slate-900/40 rounded-[3rem] border border-slate-800/50 shadow-2xl flex items-center justify-center min-w-[500px] min-h-[300px]">
                   <div className="text-slate-500 italic animate-pulse">Renderizando diagrama de alta resolución...</div>
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

export default Mermaid;

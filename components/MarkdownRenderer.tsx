
import React from 'react';
import ReactMarkdown from 'react-markdown';
import Mermaid from './Mermaid';

interface Props {
  content: string;
}

const MarkdownRenderer: React.FC<Props> = ({ content }) => {
  return (
    <div className="markdown-content w-full break-words overflow-hidden">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const value = String(children).replace(/\n$/, '');
            const language = match ? match[1] : '';

            // Handle Mermaid Diagrams
            if (!inline && language === 'mermaid') {
              return <Mermaid chart={value} />;
            }

            // Handle Inline Code (e.g. `code`)
            if (inline) {
              return (
                <code 
                  className="bg-slate-800 text-pink-400 px-1.5 py-0.5 rounded font-mono text-[0.9em] border border-slate-700/50 whitespace-nowrap" 
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Handle Code Blocks (e.g. ```python)
            return (
              <div className="my-6 rounded-2xl overflow-hidden border border-slate-700/50 bg-[#0d1117] shadow-2xl group relative">
                <div className="bg-slate-800/40 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-700/50 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    <span className="ml-2">{language || 'code'}</span>
                  </span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(value)}
                    className="hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Copy
                  </button>
                </div>
                <pre className="p-5 overflow-x-auto custom-scrollbar leading-relaxed">
                  <code className={`${className} font-mono text-sm block text-slate-300`} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          p: ({ children }) => <p className="mb-4 leading-relaxed last:mb-0 text-slate-300">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-2 text-slate-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-2 text-slate-300">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-2xl font-black mb-4 border-b border-slate-800 pb-2 text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-slate-100">{children}</h2>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 bg-primary/5 px-6 py-4 italic my-6 rounded-r-2xl text-slate-400">
              {children}
            </blockquote>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

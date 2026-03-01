
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
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

            // Detect inline: explicit prop OR no language class with no newlines (react-markdown v10 compat)
            const isInlineCode = inline === true || (!className && !value.includes('\n'));

            // Handle Mermaid Diagrams
            if (!isInlineCode && language === 'mermaid') {
              return <Mermaid chart={value} />;
            }

            // Handle Inline Code (e.g. `code`)
            if (isInlineCode) {
              return (
                <code
                  className="bg-slate-800 text-pink-400 px-1.5 py-0.5 rounded font-mono text-[0.9em] border border-slate-700/50 inline"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Handle Code Blocks (e.g. ```python) with syntax highlighting
            return (
              <div className="my-6 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl group relative" key={`code-${Math.random()}`}>
                <div className="bg-slate-800/40 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-700/50 flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    <span className="ml-2">{language || 'code'}</span>
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(value)}
                    className="hover:text-white transition-colors opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded hover:bg-slate-700"
                  >
                    Copy
                  </button>
                </div>
                <SyntaxHighlighter
                  language={language || 'text'}
                  style={oneDark}
                  className="!bg-[#0d1117] !m-0 rounded-none"
                  customStyle={{
                    padding: '1.25rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.5rem',
                    overflowX: 'auto'
                  }}
                  showLineNumbers={language ? true : false}
                  wrapLines={true}
                  codeTagProps={{
                    style: {
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }
                  }}
                >
                  {value}
                </SyntaxHighlighter>
              </div>
            );
          },
          p: ({ children, node, ...rest }: any) => {
            // Filter out block-level code components from paragraph children
            if (!Array.isArray(children)) {
              return <p className="mb-4 leading-relaxed last:mb-0 text-slate-300">{children}</p>;
            }

            const filteredChildren: any[] = [];
            const blockElements: any[] = [];

            children.forEach((child: any, idx: number) => {
              // Check if child is a block-level code element
              if (
                (typeof child === 'object' && child?.props?.className?.includes('my-6')) ||
                child?.type?.name === 'Mermaid'
              ) {
                // If we have filtered children, wrap them in a paragraph first
                if (filteredChildren.length > 0) {
                  blockElements.push(
                    <p key={`p-${idx}`} className="mb-4 leading-relaxed last:mb-0 text-slate-300">
                      {filteredChildren.splice(0)}
                    </p>
                  );
                }
                blockElements.push(child);
              } else {
                filteredChildren.push(child);
              }
            });

            // Render remaining inline content
            if (filteredChildren.length > 0) {
              blockElements.push(
                <p key="p-final" className="mb-4 leading-relaxed last:mb-0 text-slate-300">
                  {filteredChildren}
                </p>
              );
            }

            // If no block elements were found, render normally
            if (blockElements.length === 0) {
              return <p className="mb-4 leading-relaxed last:mb-0 text-slate-300">{children}</p>;
            }

            return <>{blockElements}</>;
          },
          ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-2 text-slate-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-2 text-slate-300">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
          h1: ({ children }) => <h1 className="text-2xl font-black mb-4 border-b border-slate-800 pb-2 text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-slate-100">{children}</h2>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 bg-primary/5 px-6 py-4 italic my-6 rounded-r-2xl text-slate-400">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-2xl border border-slate-700/50 shadow-sm">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-800 text-slate-200">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-700/40">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-slate-800/30 transition-colors">{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left font-bold text-slate-200 border-b border-slate-700/50 whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-slate-300 border-t border-slate-700/20 align-top">
              {children}
            </td>
          ),
        }}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;

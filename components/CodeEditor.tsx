
import React, { useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Code2, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'c', label: 'C' },
  { id: 'csharp', label: 'C#' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'swift', label: 'Swift' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'sql', label: 'SQL' },
  { id: 'shell', label: 'Bash' },
];

interface Props {
  starterCode: string;
  value: string;
  language: string;
  onChange: (code: string) => void;
  onLanguageChange: (lang: string) => void;
  disabled?: boolean;
}

const CodeEditor: React.FC<Props> = ({
  starterCode,
  value,
  language,
  onChange,
  onLanguageChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const editorRef = React.useRef<any>(null);

  const currentLang = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.addCommand(2, () => {
      editor.trigger('keyboard', 'tab', null);
    });
  };

  const handleReset = () => {
    if (starterCode && !disabled) {
      onChange(starterCode);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl group/editor">
      {/* Toolbar */}
      <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700/50">
        {/* Left: dots + label */}
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <Code2 size={13} className="text-slate-500 ml-1" />
          <span className="text-[11px] text-slate-500 font-mono">editor de código</span>
        </div>

        {/* Right: language selector + reset */}
        <div className="flex items-center gap-2">
          <DropdownMenu open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 h-auto bg-slate-700/70 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentLang.label}
                <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-slate-800 border-slate-700 rounded-xl shadow-2xl w-40 max-h-64 overflow-y-auto"
            >
              {LANGUAGES.map(lang => (
                <DropdownMenuItem
                  key={lang.id}
                  onClick={() => { onLanguageChange(lang.id); setOpen(false); }}
                  className={`text-xs font-bold cursor-pointer flex items-center justify-between px-3 py-2 ${
                    lang.id === language
                      ? 'bg-primary/20 text-primary focus:bg-primary/30 focus:text-primary'
                      : 'text-slate-300 focus:bg-slate-700 focus:text-slate-100'
                  }`}
                >
                  {lang.label}
                  {lang.id === language && <Check size={11} />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {starterCode && !disabled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              title="Restaurar código inicial"
              className="h-7 w-7 bg-slate-700/70 hover:bg-slate-700 text-slate-500 hover:text-slate-200 border border-slate-600/50"
            >
              <RotateCcw size={12} />
            </Button>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <Editor
        height="380px"
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val ?? '')}
        onMount={handleMount}
        loading={
          <div className="h-[380px] bg-[#1e1e1e] flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Code2 size={16} className="animate-pulse" />
              <span>Cargando editor...</span>
            </div>
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly: disabled,
          wordWrap: 'on',
          tabSize: 2,
          insertSpaces: true,
          padding: { top: 16, bottom: 16 },
          folding: false,
          glyphMargin: false,
          lineDecorationsWidth: 4,
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          contextmenu: false,
        }}
      />
    </div>
  );
};

export default CodeEditor;

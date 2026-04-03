import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { GoogleGenAI } from '@google/genai';
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Brain,
  Cpu,
  Shield,
  Star,
  Sparkles,
} from 'lucide-react';
import {
  GEMINI_MODELS,
  DEFAULT_MODEL_CONFIG,
  USE_CASE_META,
  type GeminiModelId,
  type ModelUseCase,
} from '../constants/geminiModels';

type TestState = 'idle' | 'loading' | 'success' | 'error';

interface ButtonDropdownProps {
  /** Use case context (shows title + description in panel header). Optional for standalone usage. */
  useCase?: ModelUseCase;
  /** The currently selected model */
  selectedModel: GeminiModelId | null;
  /** System-recommended model for this use case (shows "Default" badge) */
  defaultModel?: GeminiModelId;
  /** Called when a model is selected */
  onChange: (id: GeminiModelId | null) => void;
  /** If true, shows a "Modelo por defecto" option at the top (for session override scenarios) */
  allowDefault?: boolean;
  /** API key used by the "Test" button — if omitted, test button is hidden */
  apiKey?: string;
  /** Compact mode for tight spaces (no use-case description, smaller trigger) */
  compact?: boolean;
  /** Popover alignment relative to trigger */
  align?: 'left' | 'right';
}

const TIER_GROUPS = [
  { tier: 'pro' as const,   label: 'Pro',   icon: <Brain size={12} />,   desc: 'Máxima capacidad' },
  { tier: 'flash' as const, label: 'Flash', icon: <Zap size={12} />,     desc: 'Velocidad y calidad' },
  { tier: 'lite' as const,  label: 'Lite',  icon: <Sparkles size={12} />, desc: 'Más económico' },
];

function tierBadgeClass(tier: 'pro' | 'flash' | 'lite') {
  const base = 'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md';
  if (tier === 'pro')   return `${base} bg-amber-500/20 text-amber-400`;
  if (tier === 'lite')  return `${base} bg-sky-500/20 text-sky-400`;
  return `${base} bg-slate-700/60 text-slate-300`;
}

function tierDotClass(tier: 'pro' | 'flash' | 'lite') {
  if (tier === 'pro')   return 'bg-amber-400';
  if (tier === 'lite')  return 'bg-sky-400';
  return 'bg-slate-400';
}

function useCaseIcon(uc: ModelUseCase) {
  if (uc === 'suggestions') return <Cpu size={14} />;
  if (uc === 'quiz')        return <Brain size={14} />;
  if (uc === 'chat')        return <Zap size={14} />;
  return <Sparkles size={14} />;
}

export const ButtonDropdown: React.FC<ButtonDropdownProps> = ({
  useCase,
  selectedModel,
  defaultModel,
  onChange,
  allowDefault = false,
  apiKey,
  compact = false,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [testStates, setTestStates] = useState<Partial<Record<GeminiModelId, TestState>>>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleMouse = (e: MouseEvent) => {
      if (
        !panelRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleMouse);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleMouse);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  // Position panel via fixed coords from trigger rect
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = compact ? 300 : 380;
    const margin = 8;
    let left = align === 'right'
      ? rect.right - panelWidth
      : rect.left;
    // clamp to viewport
    if (left + panelWidth + margin > window.innerWidth) {
      left = window.innerWidth - panelWidth - margin;
    }
    if (left < margin) left = margin;
    // prefer below, fallback above
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > 200 ? rect.bottom + 6 : rect.top - 6;
    const transformOrigin = spaceBelow > 200 ? 'top' : 'bottom';
    setPanelStyle({
      position: 'fixed',
      top: spaceBelow > 200 ? top : undefined,
      bottom: spaceBelow <= 200 ? window.innerHeight - rect.top + 6 : undefined,
      left,
      width: panelWidth,
      zIndex: 400,
      transformOrigin,
    });
  }, [isOpen, align, compact]);

  const selectedModelInfo = selectedModel
    ? GEMINI_MODELS.find(m => m.id === selectedModel)
    : null;

  const handleTest = useCallback(async (modelId: GeminiModelId, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!apiKey) return;
    setTestStates(prev => ({ ...prev, [modelId]: 'loading' }));
    try {
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({
        model: modelId,
        contents: 'Say "OK".',
        config: { maxOutputTokens: 5 },
      });
      setTestStates(prev => ({ ...prev, [modelId]: 'success' }));
    } catch {
      setTestStates(prev => ({ ...prev, [modelId]: 'error' }));
    }
  }, [apiKey]);

  const handleSelect = (id: GeminiModelId | null) => {
    onChange(id);
    setIsOpen(false);
  };

  const panel = isOpen ? ReactDOM.createPortal(
    <div
      ref={panelRef}
      style={panelStyle}
      className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Panel header */}
      {useCase && !compact && (
        <div className="px-4 pt-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-300 mb-1">
            <span className="text-primary">{useCaseIcon(useCase)}</span>
            <span className="text-sm font-bold">{USE_CASE_META[useCase].title}</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{USE_CASE_META[useCase].description}</p>
        </div>
      )}

      <div className="max-h-[340px] overflow-y-auto py-2">
        {/* "Use default" option */}
        {allowDefault && (
          <button
            onClick={() => handleSelect(null)}
            className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors hover:bg-slate-800 ${
              selectedModel === null ? 'bg-slate-800/60' : ''
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedModel === null ? 'bg-primary' : 'bg-slate-700'}`} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-300">Modelo por defecto</span>
            </div>
            {selectedModel === null && <CheckCircle2 size={14} className="text-primary flex-shrink-0" />}
          </button>
        )}

        {/* Models grouped by tier */}
        {TIER_GROUPS.map(group => {
          const models = GEMINI_MODELS.filter(m => m.tier === group.tier);
          if (models.length === 0) return null;
          return (
            <div key={group.tier}>
              {/* Tier group header */}
              <div className="flex items-center gap-2 px-4 py-1.5 mt-1">
                <span className={`flex items-center gap-1 ${
                  group.tier === 'pro' ? 'text-amber-400' :
                  group.tier === 'lite' ? 'text-sky-400' : 'text-slate-400'
                } text-[11px] font-bold uppercase tracking-wider`}>
                  {group.icon}
                  {group.label}
                </span>
                <span className="text-slate-700 text-[10px]">— {group.desc}</span>
              </div>

              {models.map(model => {
                const isSelected = selectedModel === model.id;
                const isDefault = defaultModel === model.id;
                const testState = testStates[model.id as GeminiModelId] ?? 'idle';

                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id as GeminiModelId)}
                    className={`w-full px-4 py-2.5 flex items-start gap-3 text-left transition-colors hover:bg-slate-800 ${
                      isSelected ? 'bg-slate-800/60' : ''
                    }`}
                  >
                    {/* Selection dot */}
                    <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? tierDotClass(model.tier) : 'bg-slate-700'}`} />

                    {/* Model info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {model.label}
                        </span>
                        {isDefault && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-primary/20 text-primary">
                            <Star size={9} />
                            Default
                          </span>
                        )}
                        <span className={tierBadgeClass(model.tier)}>{group.label}</span>
                      </div>
                      {!compact && (
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5 pr-2">{model.description}</p>
                      )}
                    </div>

                    {/* Right side: test button + status */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5" onClick={e => e.stopPropagation()}>
                      {apiKey && (
                        <>
                          {testState === 'loading' && (
                            <Loader2 size={13} className="animate-spin text-slate-500" />
                          )}
                          {testState === 'success' && (
                            <CheckCircle2 size={13} className="text-emerald-400" />
                          )}
                          {testState === 'error' && (
                            <XCircle size={13} className="text-red-400" />
                          )}
                          {testState === 'idle' && (
                            <button
                              onClick={(e) => handleTest(model.id as GeminiModelId, e)}
                              className="flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-slate-300 border border-slate-700 hover:border-slate-600 rounded-md px-1.5 py-0.5 transition-colors"
                              title={`Probar ${model.label}`}
                            >
                              <Shield size={10} />
                              Test
                            </button>
                          )}
                        </>
                      )}
                      {isSelected && testState === 'idle' && (
                        <CheckCircle2 size={13} className="text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  ) : null;

  // Trigger button label — resolve actual default model name when "default" is selected
  const resolvedDefaultInfo = selectedModel === null && allowDefault && defaultModel
    ? GEMINI_MODELS.find(m => m.id === defaultModel)
    : null;
  const triggerLabel = selectedModel === null
    ? (resolvedDefaultInfo?.label ?? 'Modelo por defecto')
    : (selectedModelInfo?.label ?? selectedModel);
  const triggerTier = selectedModelInfo?.tier ?? resolvedDefaultInfo?.tier;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className={`flex items-center justify-between gap-2 w-full bg-slate-800 border border-slate-700 rounded-xl transition-colors hover:border-slate-600 outline-none focus:border-slate-500 ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2.5 text-sm'
        } ${isOpen ? 'border-slate-600' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {triggerTier && (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${tierDotClass(triggerTier)}`} />
          )}
          <span className={`font-medium truncate ${compact ? 'text-slate-400 max-w-[110px]' : 'text-white'}`}>
            {triggerLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {triggerTier && !compact && (
            <span className={tierBadgeClass(triggerTier)}>
              {triggerTier === 'pro' ? 'Pro' : triggerTier === 'lite' ? 'Lite' : 'Flash'}
            </span>
          )}
          <ChevronDown
            size={compact ? 12 : 14}
            className={`text-slate-500 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {panel}
    </div>
  );
};

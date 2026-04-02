import React, { useState } from 'react';
import { Cpu } from 'lucide-react';
import { GEMINI_MODELS, type GeminiModelId } from '../constants/geminiModels';

interface ModelPickerProps {
  selectedModel: GeminiModelId;
  onChange: (id: GeminiModelId) => void;
  onValidationReset?: () => void;
}

export function ModelPicker({ selectedModel, onChange, onValidationReset }: ModelPickerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentTier = GEMINI_MODELS.find(m => m.id === selectedModel)?.tier;
  const tierLabel =
    currentTier === 'pro'  ? 'Alto rendimiento' :
    currentTier === 'lite' ? 'Máxima velocidad y economía' :
                             'Equilibrio velocidad / calidad';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
          <Cpu size={12} />
          Modelo
        </label>
        <span className="text-xs text-slate-600">{tierLabel}</span>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {GEMINI_MODELS.map((model) => {
          const isActive   = selectedModel === model.id;
          const isExpanded = expandedId === model.id;

          return (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onChange(model.id);
                onValidationReset?.();
              }}
              className={[
                'flex items-start justify-between px-4 py-3 rounded-xl border text-left',
                'transition-all duration-150',
                isActive
                  ? 'bg-slate-800/60 border-amber-500/60'
                  : 'bg-transparent border-slate-800 hover:border-slate-700 hover:bg-slate-800/30',
              ].join(' ')}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={[
                  'w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 transition-all duration-150',
                  isActive ? 'bg-amber-400' : 'bg-slate-700',
                ].join(' ')} />
                <div className="min-w-0 flex-1">
                  <div className={[
                    'text-sm font-semibold leading-none mb-1 transition-colors duration-150',
                    isActive ? 'text-white' : 'text-slate-300',
                  ].join(' ')}>
                    {model.label}
                  </div>
                  <div className={[
                    'text-xs text-slate-500 leading-relaxed transition-all duration-150',
                    isExpanded ? '' : 'truncate',
                  ].join(' ')}>
                    {model.description}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedId(prev => prev === model.id ? null : model.id);
                    }}
                    className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors mt-0.5"
                  >
                    {isExpanded ? 'Ver menos' : 'Ver más'}
                  </button>
                </div>
              </div>
              <span className={[
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ml-3 flex-shrink-0 mt-0.5 transition-all duration-150',
                model.tier === 'pro'
                  ? isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
                  : model.tier === 'lite'
                  ? isActive ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-500'
                  : isActive ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-800/50 text-slate-600',
              ].join(' ')}>
                {model.tier === 'pro' ? 'Pro' : model.tier === 'lite' ? 'Lite' : 'Flash'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Key, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Shield, Trash2, Cpu } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODELS, DEFAULT_MODEL, type GeminiModelId } from '../constants/geminiModels';

interface ApiKeyModalProps {
  onClose: () => void;
  onSave: (apiKey: string, model: GeminiModelId) => Promise<void>;
  onSaveModelOnly: (model: GeminiModelId) => void;
  onClear: () => void;
  currentModel: GeminiModelId;
}

type ValidationState = 'idle' | 'loading' | 'success' | 'error';

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  onClose,
  onSave,
  onSaveModelOnly,
  onClear,
  currentModel,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModelId>(currentModel || DEFAULT_MODEL);

  // Track whether the model changed vs the persisted one
  const modelChanged = selectedModel !== currentModel;
  // Key is filled and validated
  const keyValidated = validationState === 'success';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const testConnection = useCallback(async () => {
    if (!apiKey.trim()) return;

    setValidationState('loading');
    setErrorMessage('');

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      await ai.models.generateContent({
        model: selectedModel,
        contents: 'Say "OK" if you can hear me.',
        config: { maxOutputTokens: 5 },
      });
      setValidationState('success');
    } catch (err: any) {
      setValidationState('error');
      if (err?.error?.code === 401 || err?.status === 'UNAUTHENTICATED') {
        setErrorMessage('API key no válida. Verifica que sea correcta.');
      } else if (err?.error?.code === 429) {
        setErrorMessage('Cuota excedida. Prueba con un modelo Flash o intenta más tarde.');
      } else if (err?.message) {
        setErrorMessage(err.message.split('\n')[0]);
      } else {
        setErrorMessage('Error al conectar. Verifica tu conexión.');
      }
    }
  }, [apiKey, selectedModel]);

  const handleSave = useCallback(async () => {
    if (keyValidated) {
      // Save both new key + model
      setIsSaving(true);
      try {
        await onSave(apiKey.trim(), selectedModel);
        onClose();
      } catch {
        setErrorMessage('Error al guardar. Intenta de nuevo.');
        setIsSaving(false);
      }
    } else if (modelChanged && !apiKey.trim()) {
      // Save model only (no new key entered)
      onSaveModelOnly(selectedModel);
      onClose();
    }
  }, [apiKey, selectedModel, keyValidated, modelChanged, onSave, onSaveModelOnly, onClose]);

  const handleClear = useCallback(() => {
    onClear();
    setApiKey('');
    setValidationState('idle');
    onClose();
  }, [onClear, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && validationState !== 'success' && apiKey.trim()) {
      testConnection();
    }
  };

  // Can save if: key validated OR model changed (without a new key)
  const canSave = keyValidated || (modelChanged && !apiKey.trim());

  const modalContent = (
    <div
      className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                <Key size={20} className="text-slate-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Configuración de API</h2>
                <p className="text-slate-500 text-xs">API key y modelo de Gemini</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:text-slate-400 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* API Key field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                Nueva API Key
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                  <Key size={16} />
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (validationState !== 'idle') {
                      setValidationState('idle');
                      setErrorMessage('');
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Deja vacío para mantener la actual"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-12 py-3.5 outline-none text-white placeholder-slate-600 focus:border-slate-600 transition-colors text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errorMessage && (
                <p className="text-red-400 text-xs flex items-center gap-1.5 mt-2">
                  <XCircle size={12} />
                  {errorMessage}
                </p>
              )}
            </div>

            {/* Model selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <Cpu size={12} />
                  Modelo
                </label>
                <span className="text-xs text-slate-600">
                  {GEMINI_MODELS.find(m => m.id === selectedModel)?.tier === 'pro'
                    ? 'Alto rendimiento'
                    : GEMINI_MODELS.find(m => m.id === selectedModel)?.tier === 'lite'
                    ? 'Máxima velocidad y economía'
                    : 'Equilibrio velocidad / calidad'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {GEMINI_MODELS.map((model) => {
                  const isActive = selectedModel === model.id;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => {
                        setSelectedModel(model.id);
                        if (keyValidated) setValidationState('idle');
                      }}
                      className={[
                        'flex items-center justify-between px-4 py-3 rounded-xl border text-left',
                        'transition-all duration-150',
                        isActive
                          ? 'bg-slate-800/60 border-amber-500/60'
                          : 'bg-transparent border-slate-800 hover:border-slate-700 hover:bg-slate-800/30',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={[
                          'w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-150',
                          isActive ? 'bg-amber-400' : 'bg-slate-700',
                        ].join(' ')} />
                        <div className="min-w-0">
                          <div className={[
                            'text-sm font-semibold leading-none mb-1 transition-colors duration-150',
                            isActive ? 'text-white' : 'text-slate-300',
                          ].join(' ')}>
                            {model.label}
                          </div>
                          <div className="text-xs text-slate-500 leading-none truncate">
                            {model.description}
                          </div>
                        </div>
                      </div>
                      <span className={[
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ml-3 flex-shrink-0 transition-all duration-150',
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

            {validationState === 'success' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                <CheckCircle2 size={16} />
                Conexión exitosa
              </div>
            )}

            <div className="space-y-3">
              {/* Show "Test" button only when there's a new key that hasn't been validated */}
              {apiKey.trim() && validationState !== 'success' && (
                <button
                  onClick={testConnection}
                  disabled={validationState === 'loading'}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
                >
                  {validationState === 'loading' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Shield size={16} />
                      Probar conexión
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className="w-full py-3 bg-primary hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold text-slate-950 text-sm transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : keyValidated ? (
                  'Guardar nueva key y modelo'
                ) : modelChanged ? (
                  'Guardar modelo'
                ) : (
                  'Guardar'
                )}
              </button>

              <button
                onClick={handleClear}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Eliminar configuración
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-slate-600 text-xs text-center leading-relaxed">
              Tu API key se cifra y almacena localmente.{'\n'}
              Nunca se envía a ningún servidor externo.
            </p>
          </div>
        </div>

        <div className="px-8 pb-8 text-center">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-400 text-xs transition-colors underline underline-offset-4"
          >
            Obtener una API key en Google AI Studio
          </a>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

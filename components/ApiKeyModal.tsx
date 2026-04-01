import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Key, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Shield, Trash2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ApiKeyModalProps {
  onClose: () => void;
  onSave: (apiKey: string) => Promise<void>;
  onClear: () => void;
}

type ValidationState = 'idle' | 'loading' | 'success' | 'error';

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onClose, onSave, onClear }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
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
        model: 'gemini-3-flash-preview',
        contents: 'Say "OK" if you can hear me.',
        config: {
          maxOutputTokens: 5,
        },
      });
      setValidationState('success');
    } catch (err: any) {
      setValidationState('error');
      if (err?.error?.code === 401 || err?.status === 'UNAUTHENTICATED') {
        setErrorMessage('API key no válida. Verifica que sea correcta.');
      } else if (err?.error?.code === 429) {
        setErrorMessage('Cuota excedida. Intenta más tarde.');
      } else if (err?.message) {
        setErrorMessage(err.message.split('\n')[0]);
      } else {
        setErrorMessage('Error al conectar. Verifica tu conexión.');
      }
    }
  }, [apiKey]);

  const handleSave = useCallback(async () => {
    if (validationState !== 'success') return;

    setIsSaving(true);
    try {
      await onSave(apiKey.trim());
      onClose();
    } catch {
      setErrorMessage('Error al guardar. Intenta de nuevo.');
      setIsSaving(false);
    }
  }, [apiKey, validationState, onSave, onClose]);

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

  const modalContent = (
    <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                <Key size={20} className="text-slate-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Configuración de API</h2>
                <p className="text-slate-500 text-xs">Cambia tu clave de API de Gemini</p>
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
                    if (validationState === 'error') {
                      setValidationState('idle');
                      setErrorMessage('');
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Pega tu nueva API key aquí"
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

            {validationState === 'success' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                <CheckCircle2 size={16} />
                Conexión exitosa
              </div>
            )}

            <div className="space-y-3">
              {validationState !== 'success' ? (
                <button
                  onClick={testConnection}
                  disabled={!apiKey.trim() || validationState === 'loading'}
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
              ) : null}

              <button
                onClick={handleSave}
                disabled={validationState !== 'success' || isSaving}
                className="w-full py-3 bg-primary hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold text-slate-950 text-sm transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar nueva key'
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

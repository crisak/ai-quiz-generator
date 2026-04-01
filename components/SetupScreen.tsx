import React, { useState, useCallback } from 'react';
import { Brain, Key, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useConfig } from '../hooks/useConfig';

interface SetupScreenProps {
  onComplete: () => void;
}

type ValidationState = 'idle' | 'loading' | 'success' | 'error';

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const { saveApiKey } = useConfig();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleStart = useCallback(async () => {
    if (validationState !== 'success') return;

    setIsSaving(true);
    try {
      await saveApiKey(apiKey.trim());
      onComplete();
    } catch {
      setErrorMessage('Error al guardar. Intenta de nuevo.');
      setIsSaving(false);
    }
  }, [apiKey, validationState, saveApiKey, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && validationState !== 'success' && apiKey.trim()) {
      testConnection();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center">
            <Brain className="w-10 h-10 text-slate-400" />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Quiz IA</h1>
          <p className="text-slate-500 text-sm">Configura tu clave de API para comenzar</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                Gemini API Key
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
                  placeholder="Pega tu API key aquí"
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

            <div className="pt-2 space-y-3">
              {validationState !== 'success' ? (
                <button
                  onClick={testConnection}
                  disabled={!apiKey.trim() || validationState === 'loading'}
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
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
                onClick={handleStart}
                disabled={validationState !== 'success' || isSaving}
                className="w-full py-3.5 bg-primary hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold text-slate-950 text-sm transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Comenzar'
                )}
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

        <div className="mt-8 text-center">
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
};

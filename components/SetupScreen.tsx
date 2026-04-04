import React, { useState, useCallback } from 'react';
import { Brain, Key, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Shield, Cpu } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useConfig } from '../hooks/useConfig';
import {
  DEFAULT_MODEL_CONFIG,
  USE_CASE_META,
  type ModelConfig,
  type ModelUseCase,
  type GeminiModelId,
} from '../constants/geminiModels';
import { ButtonDropdown } from './ButtonDropdown';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface SetupScreenProps {
  onComplete: () => void;
}

type ValidationState = 'idle' | 'loading' | 'success' | 'error';

const USE_CASES: ModelUseCase[] = ['suggestions', 'quiz', 'chat', 'anki'];

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const { saveApiKey } = useConfig();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);

  const updateModel = (uc: ModelUseCase, id: GeminiModelId) => {
    setModelConfig(prev => ({ ...prev, [USE_CASE_META[uc].modelKey]: id }));
    if (validationState === 'success') setValidationState('idle');
  };

  const testConnection = useCallback(async () => {
    if (!apiKey.trim()) return;
    setValidationState('loading');
    setErrorMessage('');
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      await ai.models.generateContent({
        model: modelConfig.modelChat,
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
  }, [apiKey, modelConfig.modelChat]);

  const handleStart = useCallback(async () => {
    if (validationState !== 'success') return;
    setIsSaving(true);
    try {
      await saveApiKey(apiKey.trim(), modelConfig);
      onComplete();
    } catch {
      setErrorMessage('Error al guardar. Intenta de nuevo.');
      setIsSaving(false);
    }
  }, [apiKey, modelConfig, validationState, saveApiKey, onComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && validationState !== 'success' && apiKey.trim()) {
      testConnection();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-10">
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center">
            <Brain className="w-10 h-10 text-slate-400" />
          </div>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Quiz IA</h1>
          <p className="text-slate-500 text-sm">Configura tu clave de API para comenzar</p>
        </div>

        <Card className="bg-slate-900 border-slate-800 rounded-3xl shadow-2xl">
          <CardContent className="p-8 space-y-6">
            {/* API Key field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                Gemini API Key
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                  <Key size={16} />
                </div>
                <Input
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
                  placeholder="Pega tu API key aquí"
                  className="bg-slate-800 border-slate-700 pl-11 pr-12 py-3.5 h-auto text-white placeholder:text-slate-600 focus-visible:ring-slate-600"
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

            {/* Divider */}
            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-slate-800" />
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                <Cpu size={12} />
                Modelos por caso de uso
              </span>
              <Separator className="flex-1 bg-slate-800" />
            </div>

            {/* 4 use-case model selectors */}
            <div className="space-y-4">
              {USE_CASES.map((uc) => {
                const meta = USE_CASE_META[uc];
                const currentModelId = modelConfig[meta.modelKey];
                return (
                  <div key={uc} className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">{meta.title}</label>
                    <ButtonDropdown
                      useCase={uc}
                      selectedModel={currentModelId}
                      defaultModel={DEFAULT_MODEL_CONFIG[meta.modelKey]}
                      onChange={(id) => id && updateModel(uc, id)}
                      apiKey={apiKey.trim() || undefined}
                      align="left"
                    />
                  </div>
                );
              })}
            </div>

            {validationState === 'success' && (
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                <CheckCircle2 size={16} />
                Conexión exitosa
              </div>
            )}

            <div className="pt-2 space-y-3">
              {validationState !== 'success' && (
                <Button
                  onClick={testConnection}
                  disabled={!apiKey.trim() || validationState === 'loading'}
                  variant="secondary"
                  className="w-full py-3.5 h-auto bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 font-bold text-white text-sm"
                >
                  {validationState === 'loading' ? (
                    <><Loader2 size={16} className="animate-spin" />Verificando...</>
                  ) : (
                    <><Shield size={16} />Probar conexión</>
                  )}
                </Button>
              )}

              <Button
                onClick={handleStart}
                disabled={validationState !== 'success' || isSaving}
                className="w-full py-3.5 h-auto bg-primary hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 font-bold text-slate-950 text-sm disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <><Loader2 size={16} className="animate-spin" />Guardando...</>
                ) : (
                  'Comenzar'
                )}
              </Button>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <p className="text-slate-600 text-xs text-center leading-relaxed">
                Tu API key se cifra y almacena localmente.{'\n'}
                Nunca se envía a ningún servidor externo.
              </p>
            </div>
          </CardContent>
        </Card>

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

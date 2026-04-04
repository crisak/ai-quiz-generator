import React, { useState, useCallback, useEffect } from 'react';
import { Key, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Shield, Trash2, Cpu } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import {
  DEFAULT_MODEL_CONFIG,
  USE_CASE_META,
  type ModelConfig,
  type ModelUseCase,
  type GeminiModelId,
} from '../constants/geminiModels';
import { ButtonDropdown } from './ButtonDropdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface ApiKeyModalProps {
  onClose: () => void;
  onSave: (apiKey: string, config: ModelConfig) => Promise<void>;
  onSaveConfigOnly?: (config: ModelConfig) => void;
  onClear: () => void;
  currentConfig: ModelConfig;
  currentApiKey?: string | null;
}

type ValidationState = 'idle' | 'loading' | 'success' | 'error';

const USE_CASES: ModelUseCase[] = ['suggestions', 'quiz', 'chat', 'anki'];

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  onClose,
  onSave,
  onSaveConfigOnly,
  onClear,
  currentConfig,
  currentApiKey,
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey ?? '');
  const [showKey, setShowKey] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ModelConfig>(currentConfig || DEFAULT_MODEL_CONFIG);

  const keyValidated = validationState === 'success';
  const keyChanged = apiKey.trim() !== (currentApiKey ?? '').trim();
  const configChanged = USE_CASES.some(
    uc => selectedConfig[USE_CASE_META[uc].modelKey] !== currentConfig[USE_CASE_META[uc].modelKey]
  );
  const canSave = keyValidated || (configChanged && !keyChanged);

  const testConnection = useCallback(async () => {
    if (!apiKey.trim()) return;
    setValidationState('loading');
    setErrorMessage('');
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      await ai.models.generateContent({
        model: selectedConfig.modelChat,
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
  }, [apiKey, selectedConfig.modelChat]);

  const handleSave = useCallback(async () => {
    if (keyValidated) {
      setIsSaving(true);
      try {
        await onSave(apiKey.trim(), selectedConfig);
        onClose();
      } catch {
        setErrorMessage('Error al guardar. Intenta de nuevo.');
        setIsSaving(false);
      }
    } else if (configChanged && !keyChanged) {
      onSaveConfigOnly?.(selectedConfig);
      onClose();
    }
  }, [apiKey, selectedConfig, keyValidated, configChanged, keyChanged, onSave, onSaveConfigOnly, onClose]);

  const handleClear = useCallback(() => {
    onClear();
    setApiKey('');
    setValidationState('idle');
    onClose();
  }, [onClear, onClose]);

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && validationState !== 'success' && apiKey.trim()) {
      testConnection();
    }
  };

  const updateModel = (uc: ModelUseCase, id: GeminiModelId) => {
    setSelectedConfig(prev => ({ ...prev, [USE_CASE_META[uc].modelKey]: id }));
    if (keyValidated) setValidationState('idle');
  };

  const saveLabel = isSaving ? 'Guardando...' :
    keyValidated ? 'Guardar key y modelos' :
    configChanged ? 'Guardar modelos' : 'Guardar';

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-slate-900 border border-slate-800 max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                <Key size={20} className="text-slate-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-white">Configuración de API</DialogTitle>
                <p className="text-slate-500 text-xs mt-0.5">API key y modelos por caso de uso</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* API Key field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                {currentApiKey ? 'API Key (activa)' : 'Nueva API Key'}
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
                  onKeyDown={handleInputKeyDown}
                  placeholder={currentApiKey ? 'Tu API key actual' : 'Deja vacío para mantener la actual'}
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
                const currentModelId = selectedConfig[meta.modelKey];
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

            <div className="space-y-3">
              {apiKey.trim() && keyChanged && validationState !== 'success' && (
                <Button
                  onClick={testConnection}
                  disabled={validationState === 'loading'}
                  variant="secondary"
                  className="w-full py-3 h-auto bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 font-bold text-white text-sm"
                >
                  {validationState === 'loading' ? (
                    <><Loader2 size={16} className="animate-spin" />Verificando...</>
                  ) : (
                    <><Shield size={16} />Probar conexión</>
                  )}
                </Button>
              )}

              <Button
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className="w-full py-3 h-auto bg-primary hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 font-bold text-slate-950 text-sm disabled:cursor-not-allowed"
              >
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                {saveLabel}
              </Button>

              <Button
                onClick={handleClear}
                variant="ghost"
                className="w-full py-3 h-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-400 font-bold text-sm"
              >
                <Trash2 size={16} />
                Eliminar configuración
              </Button>
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
      </DialogContent>
    </Dialog>
  );
};

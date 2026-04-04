import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    // Clear only the quiz state — NOT the API key config (quiz-ia-config)
    try {
      localStorage.removeItem('quiz-ia-storage');
    } catch {
      // ignore
    }
    // Also strip the ?quiz= param so the URL restore doesn't re-trigger the error
    const url = new URL(window.location.href);
    url.searchParams.delete('quiz');
    window.location.href = url.pathname;
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 text-center px-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center">
            <span className="text-red-400 text-3xl">⚠</span>
          </div>
          <Card className="bg-slate-900 border-slate-800 max-w-xs">
            <CardContent className="pt-6 space-y-3">
              <h2 className="text-white font-bold text-xl">Algo salió mal</h2>
              <p className="text-slate-400 text-sm">
                Ocurrió un error inesperado. Se limpiará el estado guardado para recuperar la app.
              </p>
              <Button
                onClick={this.handleReset}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              >
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

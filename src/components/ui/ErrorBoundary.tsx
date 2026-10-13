import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { sanitizeErrorMessage } from '../../utils/errorUtils';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught application error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const sanitized = sanitizeErrorMessage(
        this.state.error,
        'An unexpected display issue occurred. Your flower basket and saved details are safe.'
      );

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-[#FCF9F6] flex flex-col items-center justify-center p-6 text-center"
        >
          <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200/90 p-8 shadow-xl space-y-6 animate-fade-in">
            {/* Visual Icon */}
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-bold text-stone-900">
                {this.props.fallbackTitle || 'Something went wrong. Please try again.'}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {sanitized}
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-6 py-3 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 px-6 py-3 rounded-xl text-xs font-semibold transition-all active:scale-95"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>Return to Homepage</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

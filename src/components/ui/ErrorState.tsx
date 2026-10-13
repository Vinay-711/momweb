import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, ArrowLeft, MessageCircle } from 'lucide-react';
import { sanitizeErrorMessage } from '../../utils/errorUtils';
import * as whatsappService from '../../services/whatsappService';

export interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  retryLabel?: string;
  secondaryAction?: {
    label: string;
    to?: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: 'card' | 'banner' | 'fullPage';
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong. Please try again.',
  error,
  onRetry,
  retryLabel = 'Try Again',
  secondaryAction,
  variant = 'card',
  className = '',
}) => {
  const sanitizedMessage = error
    ? sanitizeErrorMessage(error, 'We encountered a momentary issue. Please try again or reach out to our team.')
    : 'We encountered a momentary issue. Please try again or reach out to our team.';

  // 1. Compact Banner Variant
  if (variant === 'banner') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`p-4 bg-red-50/90 border border-red-200/90 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-red-900 text-xs shadow-2xs animate-fade-in ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">{title}</p>
            <p className="text-red-700/90">{sanitizedMessage}</p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="touch-target-44 self-end sm:self-auto inline-flex items-center gap-1.5 bg-[#143D2B] hover:bg-[#1e5a3f] text-white font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-xs flex-shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{retryLabel}</span>
          </button>
        )}
      </div>
    );
  }

  // 2. Full Page Variant
  if (variant === 'fullPage') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto space-y-5 animate-fade-in ${className}`}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-inner">
          <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            {sanitizedMessage}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>{retryLabel}</span>
            </button>
          )}

          {secondaryAction ? (
            secondaryAction.to ? (
              <Link
                to={secondaryAction.to}
                className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 border border-stone-200"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 border border-stone-200"
              >
                <span>{secondaryAction.label}</span>
              </button>
            )
          ) : (
            <a
              href={whatsappService.getGreetingUrl('Hello Padma, I encountered an issue on your website.')}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target-44 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>Contact on WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    );
  }

  // 3. Card Variant (Default)
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`text-center py-10 sm:py-14 px-6 bg-red-50/50 rounded-3xl border border-red-200/90 shadow-2xs space-y-4 max-w-lg mx-auto animate-fade-in ${className}`}
    >
      <div className="w-14 h-14 mx-auto rounded-full bg-red-100/80 flex items-center justify-center text-red-600">
        <AlertCircle className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          {sanitizedMessage}
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="touch-target-44 inline-flex items-center justify-center gap-2 bg-[#143D2B] hover:bg-[#1e5a3f] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{retryLabel}</span>
          </button>
        )}

        {secondaryAction?.to ? (
          <Link
            to={secondaryAction.to}
            className="touch-target-44 inline-flex items-center justify-center gap-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{secondaryAction.label}</span>
          </Link>
        ) : null}
      </div>
    </div>
  );
};

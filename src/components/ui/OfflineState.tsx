import React, { useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export interface OfflineStateProps {
  title?: string;
  description?: string;
  className?: string;
  variant?: 'card' | 'banner';
}

export const OfflineState: React.FC<OfflineStateProps> = ({
  title = "You're currently offline",
  description = "You can still browse our fresh flower arrangements and lookbook, but placing orders and live delivery tracking require an active internet connection.",
  className = '',
  variant = 'card',
}) => {
  const { checkConnection } = useNetworkStatus();
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    await checkConnection();
    setTimeout(() => setIsChecking(false), 600);
  };

  if (variant === 'banner') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`p-4 bg-amber-950 text-amber-100 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md animate-fade-in ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <WifiOff className="w-5 h-5 text-amber-400 flex-shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold text-white">{title}</p>
            <p className="text-amber-200/90 leading-tight">{description}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={isChecking}
          className="touch-target-44 self-end sm:self-auto px-4 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-white font-bold flex items-center gap-1.5 transition-colors border border-amber-400/30 flex-shrink-0 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{isChecking ? 'Checking...' : 'Check Connection'}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`text-center py-12 px-6 bg-amber-950/90 text-amber-100 rounded-3xl border border-amber-500/40 shadow-xl space-y-4 max-w-lg mx-auto animate-fade-in ${className}`}
    >
      <div className="w-16 h-16 mx-auto rounded-full bg-amber-900/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
        <WifiOff className="w-8 h-8" aria-hidden="true" />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="pt-2 flex justify-center">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isChecking}
          className="touch-target-44 inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-sm active:scale-95 disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} aria-hidden="true" />
          <span>{isChecking ? 'Checking Connection...' : 'Check Connection'}</span>
        </button>
      </div>
    </div>
  );
};

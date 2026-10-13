import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const OfflineNotice: React.FC = () => {
  const { isOnline, wasOffline, checkConnection } = useNetworkStatus();
  const [isChecking, setIsChecking] = useState(false);
  const [showRestoredToast, setShowRestoredToast] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowRestoredToast(true);
      const timer = setTimeout(() => {
        setShowRestoredToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleManualRetry = async () => {
    setIsChecking(true);
    await checkConnection();
    setTimeout(() => setIsChecking(false), 500);
  };

  // 1. Connection Restored Toast
  if (showRestoredToast && isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-[#143D2B] text-white py-2 px-4 shadow-md sticky top-0 z-50 animate-fade-in border-b border-[#D4AF37]/30"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-pulse" aria-hidden="true" />
            <span className="font-semibold">
              Internet connection restored. You can now place orders and track live deliveries!
            </span>
          </div>
          <button
            onClick={() => setShowRestoredToast(false)}
            aria-label="Dismiss connection restored notification"
            className="text-stone-300 hover:text-white text-[11px] underline min-h-[36px] px-2 flex items-center"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // 2. Offline Banner
  if (!isOnline) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="bg-amber-950 text-amber-100 py-2.5 px-4 shadow-lg sticky top-0 z-50 border-b border-amber-500/40 animate-fade-in"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Browsing in Offline Mode</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-normal">
                  No Connection
                </span>
              </p>
              <p className="text-amber-200/90 text-[11px] leading-tight">
                Cached flower collections are available to view, but <strong className="text-white underline decoration-amber-400">placing orders requires an active internet connection</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={handleManualRetry}
            disabled={isChecking}
            aria-label="Check internet connection status"
            className="touch-target-44 self-end sm:self-auto px-3 py-1.5 rounded-lg bg-amber-500/30 hover:bg-amber-500/40 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-amber-400/30 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{isChecking ? 'Checking...' : 'Check Connection'}</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};

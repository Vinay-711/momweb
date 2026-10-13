import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  isSlowConnection: boolean;
  isSaveData: boolean;
  effectiveType?: string;
  checkConnection: () => Promise<boolean>;
}

function getNetworkInfo() {
  if (typeof navigator === 'undefined') return { isSlow: false, isSaveData: false, effectiveType: undefined };
  // @ts-expect-error - navigator.connection is experimental
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return { isSlow: false, isSaveData: false, effectiveType: undefined };

  const isSaveData = Boolean(conn.saveData);
  const effectiveType = conn.effectiveType;
  const isSlow = isSaveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
  return { isSlow, isSaveData, effectiveType };
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [{ isSlow: isSlowConnection, isSaveData, effectiveType }, setNetInfo] = useState(getNetworkInfo);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    try {
      // Lightweight cache-busted ping to verify real upstream connectivity
      const response = await fetch('/favicon.svg?t=' + Date.now(), {
        method: 'HEAD',
        cache: 'no-store',
      });
      const online = response.ok;
      setIsOnline(online);
      return online;
    } catch {
      setIsOnline(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Briefly trigger check to verify real internet
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    // Connection change listener (Network Information API)
    // @ts-expect-error - navigator.connection is experimental
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const handleConnChange = () => {
      setNetInfo(getNetworkInfo());
    };
    if (conn && conn.addEventListener) {
      conn.addEventListener('change', handleConnChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn && conn.removeEventListener) {
        conn.removeEventListener('change', handleConnChange);
      }
    };
  }, [checkConnection]);

  return { isOnline, wasOffline, isSlowConnection, isSaveData, effectiveType, checkConnection };
}

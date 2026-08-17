'use client';

import { useEffect } from 'react';

export function DevHmrAutoReload() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Auto reload page when Webpack chunk 500 error or ChunkLoadError occurs
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('500') ||
        msg.includes('Failed to load resource')
      ) {
        console.warn('[HMR Guard] Detected missing chunk / 500 error. Auto reloading...');
        window.location.reload();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || '');
      if (
        reason.includes('Loading chunk') ||
        reason.includes('ChunkLoadError') ||
        reason.includes('500')
      ) {
        console.warn('[HMR Guard] Detected unhandled rejection chunk error. Auto reloading...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}

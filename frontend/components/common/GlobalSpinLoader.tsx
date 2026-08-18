'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { affiliateStore } from '@/lib/affiliate-store';
import { setCookie } from '@/lib/auth-store';

declare global {
  interface Window {
    showGlobalSpinner?: () => void;
    hideGlobalSpinner?: () => void;
  }
}

function SpinLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-track incoming referral link clicks globally across all pages
  useEffect(() => {
    if (!mounted) return;
    const refCode = searchParams.get('ref') || searchParams.get('referralCode');
    if (refCode) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ocv_pending_ref_code', refCode);
        setCookie('ocv_pending_ref_code', refCode, 30);
      }
      affiliateStore.recordLinkClick(refCode);
    }
  }, [searchParams, mounted]);

  // Trigger spinner briefly on route changes
  useEffect(() => {
    if (!mounted) return;
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [pathname, searchParams, mounted]);

  // Intercept anchor clicks for instant visual feedback on navigation
  useEffect(() => {
    if (!mounted) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href && target.href.startsWith(window.location.origin)) {
        const href = target.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('javascript:')) {
          setIsLoading(true);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, [mounted]);

  // Expose global window methods for manual trigger
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showGlobalSpinner = () => setIsLoading(true);
      window.hideGlobalSpinner = () => setIsLoading(false);
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.showGlobalSpinner;
        delete window.hideGlobalSpinner;
      }
    };
  }, []);

  if (!mounted || !isLoading) return null;

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none select-none flex flex-col items-center justify-between">
      {/* Top Loading Progress Bar */}
      <div className="w-full h-1 bg-slate-100 overflow-hidden relative shadow-sm">
        <div className="h-full bg-gradient-to-r from-[#fa3131] via-[#0c3ed0] to-emerald-500 animate-pulse w-full" />
      </div>

      {/* Center Spinner Badge */}
      <div className="my-auto bg-white/90 backdrop-blur-md border border-slate-200 text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150">
        <Loader2 className="w-5 h-5 text-[#fa3131] animate-spin shrink-0" />
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-tight">OrderChinaViet</span>
          <span className="text-[10px] text-slate-500 font-mono">Đang tải dữ liệu...</span>
        </div>
      </div>

      <div />
    </div>
  );
}

export function GlobalSpinLoader() {
  return (
    <Suspense fallback={null}>
      <SpinLoaderContent />
    </Suspense>
  );
}

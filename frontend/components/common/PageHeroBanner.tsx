'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Home, Zap } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeroBannerProps {
  badge?: string;
  title: string;
  summary?: string;
  breadcrumbs?: BreadcrumbItem[];
  bgImage?: string;
  children?: React.ReactNode;
}

// Shared high-quality China-Vietnam container shipping & logistics background image
const DEFAULT_LOGISTICS_BG = 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=85';

export function PageHeroBanner({
  badge,
  title,
  summary,
  breadcrumbs,
  bgImage = DEFAULT_LOGISTICS_BG,
  children,
}: PageHeroBannerProps) {
  useEffect(() => {
    if (typeof document !== 'undefined' && title) {
      document.title = `${title} | OrderChinaViet`;
    }
  }, [title]);

  return (
    <section className="pt-32 sm:pt-36 pb-14 sm:pb-16 px-4 sm:px-6 lg:px-8 relative bg-slate-950 text-white overflow-hidden border-b border-slate-800">
      {/* High-Resolution Background Image with Logistics Theme */}
      <div className="absolute inset-0 z-0">
        <Image
          src={bgImage}
          alt="OrderChinaViet Logistics Service Background"
          fill
          className="object-cover object-center scale-105 transition-transform duration-10000 ease-linear"
          priority
        />
        {/* Sleek Dark Gradient Overlay for Maximum Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/85 to-primary-950/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
      </div>

      {/* Decorative Brand Accent Light */}
      <div className="absolute top-1/2 left-10 -translate-y-1/2 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
        {/* Breadcrumb Navigation */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trang Chủ</span>
            </Link>
            {breadcrumbs.map((b, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                {b.href ? (
                  <Link href={b.href} className="hover:text-emerald-400 transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-white font-bold">{b.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Category/Status Badge */}
        {badge && (
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{badge}</span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
          {title}
        </h1>

        {/* Summary */}
        {summary && (
          <p className="text-base sm:text-lg text-slate-200 max-w-3xl leading-relaxed font-normal">
            {summary}
          </p>
        )}

        {/* Optional Actions or Custom Buttons */}
        {children && <div className="pt-2">{children}</div>}
      </div>
    </section>
  );
}

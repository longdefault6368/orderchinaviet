'use client';

import { usePathname } from 'next/navigation';
import { FloatingContact } from './FloatingContact';
import { ScrollToTop } from './ScrollToTop';
import { ChatWidget } from './ChatWidget';

export function GlobalFloatingWidgets() {
  const pathname = usePathname() || '';

  // Suppress floating contact widget on admin, customer dashboard, orders, and internal pages
  const isInternalArea =
    pathname.includes('/admin') ||
    pathname.includes('/dashboard') ||
    pathname.includes('/orders') ||
    pathname.includes('/consignments') ||
    pathname.includes('/deliveries') ||
    pathname.includes('/waybills') ||
    pathname.includes('/finance') ||
    pathname.includes('/disputes') ||
    pathname.includes('/withdrawals') ||
    pathname.includes('/guides') ||
    pathname.includes('/affiliate') ||
    pathname.includes('/packages') ||
    pathname.includes('/shipments') ||
    pathname.includes('/reports') ||
    pathname.includes('/customers') ||
    pathname.includes('/logs');

  return (
    <>
      {!isInternalArea && <FloatingContact />}
      <ScrollToTop />
      {!isInternalArea && <ChatWidget />}
    </>
  );
}

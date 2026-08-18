'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Locale } from '@/lib/i18n';

export default function AffiliateLeaderboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${locale}/affiliate/dashboard`);
  }, [locale, router]);

  return (
    <div className="py-20 text-center text-slate-500 text-sm">
      Tính năng Bảng Vinh Danh đang tạm ẩn. Đang chuyển hướng về Bảng điều khiển...
    </div>
  );
}

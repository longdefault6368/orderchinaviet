'use client';
import { use, useEffect, useState } from 'react';

import Link from 'next/link';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FloatingContact } from '@/components/common/FloatingContact';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';
import { apiFetch } from '@/lib/api-client';

const ANNOUNCEMENTS = [
  {
    id: 1,
    title: 'Thông Báo Hoạt Động Xuyên Suốt Kho Quảng Châu & Xe Container Đường Bộ',
    priority: 'HIGH',
    date: '11/08/2026',
    content: 'Hệ thống kho Quảng Châu và kho phân phối TP.HCM / Hà Nội của OrderChinaViet hoạt động liên tục 24/7. Tiến độ vận chuyển xe container thông quan chính ngạch đường bộ hiện duy trì ổn định từ 3 - 5 ngày làm việc.',
  },
  {
    id: 2,
    title: 'Cập Nhật Tỷ Giá Hối Đoái Nhân Dân Tệ (CNY/VND) Tuần Mới',
    priority: 'NORMAL',
    date: '10/08/2026',
    content: 'Tỷ giá hối đoái quy đổi tiền tệ được áp dụng niêm yết cố định: 1 ¥ = 3.650 ₫. Tất cả các đơn hàng nạp cọc trong ngày được bảo hộ tỷ giá không thay đổi.',
  },
  {
    id: 3,
    title: 'Nâng Cấp Hệ Thống Quét Barcode Mã Vạch Real-time Tại Kho Quảng Châu',
    priority: 'NORMAL',
    date: '05/08/2026',
    content: 'OrderChinaViet hoàn tất nâng cấp máy quét mã vạch không dây siêu tốc tại kho Quảng Châu. Kiện hàng sau khi nhân viên kho nhận sẽ tự động gửi Push Notification lên ứng dụng mobile trong vòng 30 giây.',
  },
];

export default function AnnouncementsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  useEffect(() => {
    apiFetch('/cms/announcements', {}, false).then(async (response) => {
      if (!response.ok) return;
      const json = await response.json();
      setAnnouncements(json.data.map((item: any) => ({ ...item, date: new Date(item.createdAt).toLocaleDateString('vi-VN') })));
    });
  }, []);
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900  flex flex-col antialiased relative">
      <Header locale={locale} dict={null} />

      <main className="flex-1 pb-16">
        {/* Global Page Hero Banner */}
        <PageHeroBanner
          badge="Bản Tin Hệ Thống"
          title="Thông Báo & Lịch Hoạt Động Kho Bãi"
          summary="Cập nhật tin tức lịch xe container, tiến độ thông quan cửa khẩu & thông báo vận hành từ OrderChinaViet."
          breadcrumbs={[{ label: 'Bản Tin & Thông Báo' }]}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          {announcements.map((ann) => (
            <div key={ann.id} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${ann.priority === 'HIGH'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-primary-50 text-primary-700 border-primary-200'
                  }`}>
                  {ann.priority === 'HIGH' ? 'Quan Trọng' : 'Thông Báo'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{ann.date}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{ann.title}</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{ann.content}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer locale={locale} dict={null} />
      <FloatingContact />
    </div>
  );
}



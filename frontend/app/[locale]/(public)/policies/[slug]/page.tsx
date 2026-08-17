'use client';

import { use } from 'react';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FloatingContact } from '@/components/common/FloatingContact';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';

const POLICIES_DATA: Record<string, {
  title: string;
  category: string;
  summary: string;
  sections: { title: string; content: string }[];
}> = {
  'mua-hang': {
    title: 'Chính Sách Mua Hàng & Đặt Cọc Đơn Hàng',
    category: 'Chính Sách Mua Hàng',
    summary: 'Quy định thời gian mua hàng, tỷ giá niêm yết và trách nhiệm của OrderChinaViet.',
    sections: [
      {
        title: '1. Thời Gian Mua Hàng & Thanh Toán Với Seller',
        content: 'OrderChinaViet cam kết tiến hành mua hàng và thanh toán tiền cho nhà cung cấp trên 1688 / Taobao / Tmall trong vòng 8h-24h kể từ khi khách nạp cọc thành công.',
      },
      {
        title: '2. Tỷ Giá Hối Đoái Niêm Yết',
        content: 'Tỷ giá hối đoái Nhân Dân Tệ (CNY) được chốt cố định tại thời điểm khách tạo đơn và cọc tiền. Mọi sự biến động tỷ giá sau đó sẽ không ảnh hưởng tới đơn hàng đã cọc.',
      },
      {
        title: '3. Quy Định Hủy Đơn Hàng',
        content: 'Khách hàng có quyền yêu cầu hủy đơn nếu nhà cung cấp chưa phát hàng. Trường hợp nhà cung cấp đã phát hàng, phí vận chuyển phát sinh do trả hàng sẽ do khách hàng chi trả.',
      },
    ],
  },

  'khieu-nai': {
    title: 'Chính Sách Khiếu Nại & Đền Bù Hàng Hóa',
    category: 'Chính Sách Đền Bù',
    summary: 'Cam kết bồi thường 100% khi kiện hàng mất mát hoặc hỏng hóc do lỗi vận chuyển.',
    sections: [
      {
        title: '1. Thời Gian Tiếp Nhận Khiếu Nại',
        content: 'OrderChinaViet tiếp nhận mọi khiếu nại về thiếu hàng, sai màu, hỏng hóc trong vòng 7 ngày kể từ khi khách hàng nhận được kiện hàng tại Việt Nam.',
      },
      {
        title: '2. Chính Sách Đền Bù Mất Mát Kiện Hàng',
        content: 'Đối với khách hàng có sử dụng Bảo hiểm hàng hóa (0.5%), chúng tôi cam kết bồi thường 100% giá trị kiện hàng nếu xảy ra thất lạc trong quá trình vận chuyển.',
      },
      {
        title: '3. Hỗ Trợ Đòi Tiền Xưởng 1688 / Taobao',
        content: 'Trường hợp xưởng Trung Quốc phát thiếu hoặc phát sai mẫu, nhân viên OrderChinaViet đại diện khách hàng khiếu nại sàn 1688 để hoàn lại tiền vào tài khoản.',
      },
    ],
  },

  'dong-go': {
    title: 'Chính Sách Đóng Gỗ Bảo Vệ Hàng Hóa Dễ Vỡ',
    category: 'Chính Sách Đóng Gói',
    summary: 'Gia cố khung gỗ tại kho Quảng Châu cho các mặt hàng máy móc, mĩ nghệ, đồ gốm sứ.',
    sections: [
      {
        title: '1. Đối Tượng Áp Dụng Đóng Gỗ',
        content: 'Khuyến nghị đóng khung gỗ cho hàng máy móc công nghiệp, TV màn hình lớn, đồ sứ dễ vỡ, đèn chùm và linh kiện điện tử đắt tiền.',
      },
      {
        title: '2. Cách Tính Phí Đóng Gỗ Kho TQ',
        content: 'Chi phí đóng gỗ được tính theo thể tích m³ gỗ thực tế sử dụng đóng kiện tại kho Quảng Châu, được cập nhật minh bạch trước khi xuất container.',
      },
    ],
  },

  'kiem-hang': {
    title: 'Chính Sách Kiểm Đếm Hàng Hóa Tại Kho Quảng Châu',
    category: 'Chính Sách Kiểm Hàng',
    summary: 'Mở bọc đối chiếu số lượng, mẫu mã, màu sắc sản phẩm trước khi đóng hàng xuất kho.',
    sections: [
      {
        title: '1. Nội Dung Kiểm Hàng',
        content: 'Nhân viên kho mở thùng kiểm tra đúng số lượng sản phẩm, màu sắc, kích thước cơ bản theo đúng chi tiết đơn hàng khách đặt.',
      },
      {
        title: '2. Giới Hạn Kiểm Hàng',
        content: 'Dịch vụ kiểm hàng không áp dụng kiểm tra chất lượng kỹ thuật sâu, thử tải máy móc hoặc kiểm định chất liệu vải cao cấp.',
      },
    ],
  },
};

export default function PolicyDetailPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = use(params);
  const policy = POLICIES_DATA[slug];

  if (!policy) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Chính sách không tồn tại</h1>
        <Link href={`/${locale}`} className="btn-primary">Trở về Trang Chủ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900  flex flex-col antialiased relative">
      <Header locale={locale} dict={null} />

      <main className="flex-1 pb-16">
        {/* Global Page Hero Banner */}
        <PageHeroBanner
          badge={policy.category}
          title={policy.title}
          summary={policy.summary}
          breadcrumbs={[
            { label: 'Chính Sách' },
            { label: policy.title },
          ]}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          {policy.sections.map((sec, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                {sec.title}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed sm:pl-7">{sec.content}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer locale={locale} dict={null} />
      <FloatingContact />
    </div>
  );
}



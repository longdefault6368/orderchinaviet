import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chương Trình Tiếp Thị Liên Kết Nhận Thưởng 250.000 ₫ & Hoa Hồng 50%',
  description: 'Kiếm thu nhập thụ động bền vững cùng OrderChinaViet. Tặng ngay 250.000 ₫ vào ví thưởng, hoa hồng lên đến 50% trọn đời trên mọi đơn hàng. Rút tiền nhanh 24/7 về mọi ngân hàng Việt Nam.',
  openGraph: {
    title: 'Tiếp Thị Liên Kết OrderChinaViet - Tặng Ngay 250.000 ₫ Chào Mừng',
    description: 'Chính sách hoa hồng lên đến 50% trọn đời. Công cụ link & mã QR độc quyền, thống kê real-time, rút tiền siêu tốc từ 50.000 ₫.',
    type: 'website',
  },
};

export default function AffiliatePortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

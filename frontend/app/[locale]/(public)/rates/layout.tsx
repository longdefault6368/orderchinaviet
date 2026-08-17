import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Biểu Phí Vận Chuyển Hàng Trung - Việt Siêu Rẻ Từ 18.000 ₫/kg',
  description: 'Tra cứu bảng giá cước vận chuyển trọn gói từ kho Quảng Châu, Bằng Tường về Hà Nội và TP.HCM. Công cụ tính cước thông minh tự động, bảo hiểm 100%.',
  openGraph: {
    title: 'Biểu Phí Cước Vận Chuyển Trung - Việt Minh Bạch | OrderChinaViet',
    description: 'Bảng giá cước vận chuyển hàng Taobao, 1688, Tmall từ 18.000 ₫/kg. Hàng về sau 3 - 5 ngày, không phát sinh phụ phí ẩn.',
    type: 'website',
  },
};

export default function RatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

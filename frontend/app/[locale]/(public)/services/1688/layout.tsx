import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dịch Vụ Đặt Hàng 1688 Tận Xưởng Giá Gốc Siêu Tốc',
  description: 'Hỗ trợ tìm nguồn hàng sản xuất trực tiếp trên 1688.com, đàm phán giá xưởng số lượng lớn, thanh toán hộ Alipay và vận chuyển về Việt Nam an toàn chỉ từ 3-5 ngày.',
  openGraph: {
    title: 'Dịch Vụ Mua Hộ 1688 Tận Gốc Giá Xưởng | OrderChinaViet',
    description: 'Nhập hàng sỉ 1688 giá tận gốc không qua trung gian. Phí dịch vụ chỉ từ 1%, đền bù 100% khi mất mát hàng.',
    type: 'website',
  },
};

export default function Service1688Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

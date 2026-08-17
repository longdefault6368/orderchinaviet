import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tuyển Dụng Đối Tác Kinh Doanh & CTV Online (Lương Cứng 2.000.000 ₫)',
  description: 'Gia nhập đội ngũ Đối tác Tiếp thị OrderChinaViet: Nhận lương cứng 2.000.000 ₫/tháng, hoa hồng lên đến 50% trọn đời, tặng ngay 250k chào mừng. Làm việc remote 100% tại nhà.',
  openGraph: {
    title: 'Tuyển Dụng Đối Tác Kinh Doanh & CTV Online (Lương Cứng 2.000.000 ₫) | OrderChinaViet',
    description: 'Cơ hội việc làm online remote thu nhập 5 - 15 triệu/tháng. Lương cứng 2Tr + Hoa hồng 50%, thưởng nóng 250k. Ứng tuyển nhanh trong 1 phút!',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tuyển Dụng CTV Online Lương Cứng 2Tr + Hoa Hồng 50% | OrderChinaViet',
    description: 'Ứng tuyển đối tác kinh doanh logistics làm việc tại nhà, không cần vốn, hỗ trợ đào tạo 1-1.',
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

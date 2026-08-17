'use client';

import { use } from 'react';

import Link from 'next/link';
import {
  ShoppingBag,
  Award,
  Boxes,
  Truck,
  FileCheck,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FloatingContact } from '@/components/common/FloatingContact';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';
import { FullServiceOrderWidget } from '@/components/common/FullServiceOrderWidget';

const SERVICES_DATA: Record<string, {
  title: string;
  category: string;
  badge: string;
  summary: string;
  description: string[];
  benefits: string[];
  process: { step: string; title: string; desc: string }[];
  pricing?: { name: string; price: string; note: string }[];
}> = {
  '1688': {
    title: 'Dịch Vụ Đặt Hàng 1688.com Sỉ Tận Xưởng',
    category: 'Mua Hộ 1688',
    badge: 'Phí Dịch Vụ Từ 1%',
    summary: 'Tìm kiếm nhà sản xuất 1688 uy tín, đàm phán giá sỉ gốc tận xưởng, thanh toán tiền tệ và vận chuyển trọn gói về Việt Nam.',
    description: [
      '1688.com là chợ đầu mối sỉ lớn nhất Trung Quốc thuộc tập đoàn Alibaba. Nơi đây tập trung hàng trăm nghìn xưởng sản xuất trực tiếp với giá gốc chưa qua trung gian.',
      'OrderChinaViet cung cấp giải pháp đặt hàng 1688 trọn gói: hỗ trợ tìm kiếm xưởng có huy hiệu Đầu Trâu uy tín, đại diện đàm phán giá theo số lượng, hỗ trợ thanh toán an toàn và gom hàng kho Quảng Châu vận chuyển về Việt Nam.',
    ],
    benefits: [
      'Phí mua hộ siêu rẻ chỉ từ 1% - 3% giá trị đơn hàng',
      'Đội ngũ tiếng Trung chuyên nghiệp đàm phán giảm giá từ 5-10% với Seller',
      'Bảo hiểm 100% giá trị kiện hàng khi có sự cố thất lạc',
      'Kho Quảng Châu 2.000m² kiểm đếm, chụp ảnh thực tế 24/7',
      'Thời gian xe container về Việt Nam chỉ 3 - 5 ngày làm việc',
    ],
    process: [
      { step: '01', title: 'Gửi Link Sản Phẩm', desc: 'Dán đường dẫn sản phẩm 1688 vào công cụ đặt hàng hoặc gửi cho CSKH.' },
      { step: '02', title: 'Đặt Cọc Đơn Hàng', desc: 'Nạp tiền thanh toán cọc từ 70% - 100% giá trị đơn hàng.' },
      { step: '03', title: 'Thanh Toán & Nhận Hàng Kho TQ', desc: 'Nhân viên thanh toán với Seller 1688 và nhận hàng tại kho Quảng Châu.' },
      { step: '04', title: 'Vận Chuyển & Giao Tận Nhà', desc: 'Hàng về kho Việt Nam (HN/TP.HCM), khách nhận hàng tại kho hoặc giao tận nơi.' },
    ],
    pricing: [
      { name: 'Đơn từ 1 triệu - 10 triệu', price: '3% Phí mua hộ', note: 'Áp dụng cho khách hàng lẻ & shop nhỏ' },
      { name: 'Đơn từ 10 triệu - 50 triệu', price: '2% Phí mua hộ', note: 'Ưu đãi cho khách mua sỉ thường xuyên' },
      { name: 'Đơn trên 50 triệu', price: '1% Phí mua hộ', note: 'Gói doanh nghiệp & chủ đại lý lớn' },
    ],
  },

  'tmall': {
    title: 'Dịch Vụ Đặt Hàng Tmall.com Chính Hãng',
    category: 'Mua Hộ Tmall',
    badge: '100% Hàng Hiệu Flagship',
    summary: 'Săn hàng hiệu chính hãng cao cấp từ các gian hàng Flagship Store trên Tmall.com với coupon giảm giá tốt nhất.',
    description: [
      'Tmall.com (Thiên Mèo) là trang thương mại điện tử chuyên bán sản phẩm chính hãng hàng đầu Trung Quốc, nơi hội tụ các thương hiệu quốc tế như Nike, Adidas, Zara, Uniqlo, Xiaomi, Huawei...',
      'OrderChinaViet hỗ trợ bạn mua hàng Tmall dễ dàng, cập nhật các đợt Sale lớn (11/11, 12/12, 618), săn voucher độc quyền và khiếu nại nhà bán nếu hàng giao bị lỗi hoặc thiếu.',
    ],
    benefits: [
      'Đảm bảo 100% hàng chính hãng từ gian hàng Flagship Store',
      'Hỗ trợ săn Deal Sale sập sàn các đợt 11/11, 12/12, Black Friday',
      'Kiểm đếm kĩ lưỡng màu sắc, kích thước, bao bì nhãn mác nguyên vẹn',
      'Đóng bọc xốp bóng khí gia cố chống va đập miễn phí',
    ],
    process: [
      { step: '01', title: 'Chọn Mẫu Trên Tmall', desc: 'Copy link món đồ yêu thích từ Tmall.com.' },
      { step: '02', title: 'Xác Nhận Đơn & Đặt Cọc', desc: 'Hệ thống quy đổi giá tệ sang VNĐ chính xác theo tỷ giá thực.' },
      { step: '03', title: 'Nhập Kho & Kiểm Tra', desc: 'Hàng tới kho Quảng Châu được kiểm tra tem nhãn mác chính hãng.' },
      { step: '04', title: 'Giao Hàng Nhanh', desc: 'Vận chuyển về Việt Nam và phát hàng tận nhà.' },
    ],
  },

  'nhap-hang': {
    title: 'Giải Pháp Nhập Hàng Trung Quốc Cho Doanh Nghiệp',
    category: 'Sỉ Container',
    badge: 'Giá Gốc Thương Mại',
    summary: 'Ủy thác nhập khẩu trọn gói số lượng lớn cho chủ shop, chuỗi cửa hàng và doanh nghiệp sản xuất tại Việt Nam.',
    description: [
      'Bạn là doanh nghiệp hoặc chủ chuỗi cửa hàng cần nhập hàng nguyên chuyến xe container hoặc lô hàng giá trị lớn từ các xưởng sản xuất Trung Quốc?',
      'OrderChinaViet cung cấp dịch vụ tìm xưởng độc quyền, ký hợp đồng thương mại quốc tế, đàm phán bảo hành và vận chuyển chính ngạch có đầy đủ hóa đơn VAT.',
    ],
    benefits: [
      'Tìm kiếm đối tác sản xuất OEM/ODM theo yêu cầu riêng',
      'Ủy thác nhập khẩu chính ngạch cung cấp hóa đơn đỏ VAT hợp pháp',
      'Chiết khấu cước vận chuyển nguyên xe container cực ưu đãi',
      'Hỗ trợ kiểm tra xưởng thực tế tại Trung Quốc trước khi đặt tiền',
    ],
    process: [
      { step: '01', title: 'Tiếp Nhận Nhu Cầu', desc: 'Gửi thông tin mẫu hàng, số lượng và tiêu chuẩn chất lượng.' },
      { step: '02', title: 'Tìm Xưởng & Báo Giá', desc: 'Đội ngũ tiếng Trung khảo sát xưởng, đàm phán hợp đồng thương mại.' },
      { step: '03', title: 'Ký Hợp Đồng & Đóng Hàng', desc: 'Ký hợp đồng nhập khẩu chính ngạch tại Việt Nam, nghiệm thu hàng hóa.' },
      { step: '04', title: 'Thông Quan & Giao Kho', desc: 'Thông quan chính ngạch cửa khẩu, xuất hóa đơn VAT và giao tận kho.' },
    ],
  },

  'van-chuyen': {
    title: 'Dịch Vụ Vận Chuyển Trung – Việt Lộ Trình 3–7 Ngày',
    category: 'Vận Tải Logistics',
    badge: 'Chính Ngạch Đường Bộ',
    summary: 'Tuyến xe container chuyên tuyến Quảng Châu về TP.HCM & Hà Nội chạy liên tục mỗi ngày, cam kết bồi thường 100% giá trị kiện hàng.',
    description: [
      'Dịch vụ vận chuyển hàng hóa hai chiều Trung Quốc - Việt Nam là thế mạnh hàng đầu của OrderChinaViet với đội xe container đường bộ chạy cố định hàng ngày.',
      'Chúng tôi sở hữu hệ thống kho bãi hiện đại 2.000m² tại Quảng Châu cùng kho phân phối tại Hà Nội và TP.HCM, ứng dụng công nghệ quét mã barcode tự động giúp bạn tra cứu hành trình kiện hàng theo thời gian thực.',
    ],
    benefits: [
      'Thời gian vận chuyển nhanh chóng: Hà Nội (2-5 ngày), TP.HCM (3-7 Ngày)',
      'Giá cước cạnh tranh chỉ từ 18.000đ/kg hoặc 1.800.000đ/m³',
      'Miễn phí lưu kho tại Việt Nam lên đến 7 ngày',
      'Đền bù 100% giá trị hàng hóa nếu xảy ra thất lạc hỏng hóc',
    ],
    process: [
      { step: '01', title: 'Nhận Hàng Kho Quảng Châu', desc: 'Quét mã vạch ký nhận kiện hàng từ các hãng chuyển phát TQ.' },
      { step: '02', title: 'Đóng Container Xuất Kho', desc: 'Xếp dỡ cẩn thận, đóng seal container và xuất kho trong ngày.' },
      { step: '03', title: 'Thông Quan Cửa Khẩu', desc: 'Làm thủ tục thông quan chính ngạch đường bộ nhanh chóng.' },
      { step: '04', title: 'Giao Nhận Tại Việt Nam', desc: 'Hàng nhập kho VN, thông báo báo giá và hỗ trợ giao tận nhà.' },
    ],
  },

  'chinh-ngach': {
    title: 'Ủy Thác Xuất Nhập Khẩu Chính Ngạch & Form E',
    category: 'Hải Quan & Thuế',
    badge: 'Thuế Xuất Nhập Khẩu 0%',
    summary: 'Khai báo hải quan chính ngạch, cung cấp hóa đơn GTGT (VAT) và chứng nhận xuất xứ Form E giảm thuế nhập khẩu về 0%.',
    description: [
      'Nhập khẩu chính ngạch là con đường duy nhất giúp doanh nghiệp kinh doanh hợp pháp, minh bạch hóa dòng tiền và có đầy đủ hóa đơn chứng từ đầu vào.',
      'OrderChinaViet cung cấp dịch vụ thông quan chính ngạch trọn gói: đại diện xin cấp C/O Form E, kê khai tờ khai hải quan điện tử, nộp thuế và giao hàng tận nơi.',
    ],
    benefits: [
      'Hóa đơn giá trị gia tăng (VAT) hợp pháp 100% cho kế toán',
      'Chứng nhận xuất xứ C/O Form E giúp giảm thuế nhập khẩu về 0%',
      'Tư vấn mã HS Code và tối ưu chi phí thuế hải quan',
      'Hồ sơ minh bạch, an toàn pháp lý tuyệt đối',
    ],
    process: [
      { step: '01', title: 'Tra Cứu Mã HS Code', desc: 'Xác định thuế suất và chuẩn bị hồ sơ hải quan.' },
      { step: '02', title: 'Xin C/O Form E', desc: 'Yêu cầu xưởng TQ cung cấp chứng nhận xuất xứ Form E.' },
      { step: '03', title: 'Mở Tờ Khai Hải Quan', desc: 'Truyền tờ khai hải quan điện tử và nộp thuế nhập khẩu.' },
      { step: '04', title: 'Thông Quan & Phát Hàng', desc: 'Lấy hàng khỏi cảng/cửa khẩu và bàn giao hóa đơn VAT cho doanh nghiệp.' },
    ],
  },

  'alipay': {
    title: 'Dịch Vụ Thanh Toán Hộ Ví Alipay & Ngân Hàng TQ',
    category: 'Tài Chính & Ví Tệ',
    badge: 'Xử Lý Trong 5 Phút',
    summary: 'Thanh toán hộ đơn hàng 1688, Taobao, Tmall qua Alipay hoặc chuyển khoản trực tiếp ngân hàng Trung Quốc tỷ giá tốt.',
    description: [
      'Bạn không có thẻ ngân hàng Trung Quốc hoặc tài khoản Alipay bị giới hạn hạn mức thanh toán?',
      'OrderChinaViet nhận thanh toán hộ lệnh mua hàng (代付) trên 1688/Taobao hoặc nạp tiền ví Alipay/WeChat Pay an toàn, xử lý tức thì trong 5-10 phút.',
    ],
    benefits: [
      'Tỷ giá hối thoái Nhân Dân Tệ (CNY) niêm yết minh bạch theo ngày',
      'Xử lý nhanh chóng 24/7 trong 5 phút kể từ khi nhận khoản nạp',
      'Cam kết tiền sạch 100% từ tài khoản ngân hàng chính chủ',
      'Cung cấp ủy nhiệm chi và hóa đơn xác nhận thanh toán đầy đủ',
    ],
    process: [
      { step: '01', title: 'Gửi Lệnh Thanh Toán Hộ', desc: 'Ủy quyền lệnh 代付 trên 1688/Taobao cho tài khoản Alipay của chúng tôi.' },
      { step: '02', title: 'Tính Tiền VNĐ', desc: 'Quy đổi số tiền tệ theo tỷ giá niêm yết realtime.' },
      { step: '03', title: 'Chuyển Khoản VNĐ', desc: 'Khách hàng chuyển khoản tiền VNĐ tương ứng.' },
      { step: '04', title: 'Xác Nhận Thành Công', desc: 'Nhân viên bấm xác nhận thanh toán lệnh trên Alipay ngay lập tức.' },
    ],
  },
};

export default function ServiceDetailPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = use(params);
  const service = SERVICES_DATA[slug];

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Dịch vụ không tồn tại</h1>
        <p className="text-sm text-slate-500 mb-6">Đường dẫn bạn truy cập không hợp lệ hoặc đã bị thay đổi.</p>
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
          badge={service.badge}
          title={service.title}
          summary={service.summary}
          breadcrumbs={[
            { label: 'Dịch Vụ Khác' },
            { label: service.category },
          ]}
        >
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href={`/${locale}/orders`}
              className="px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-primary-600/30 transition-all flex items-center gap-2"
            >
              <span>Sử Dụng Dịch Vụ Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${locale}/rates`}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              Xem Bảng Giá Cước
            </Link>
          </div>
        </PageHeroBanner>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 border-b border-slate-100 pb-3">
              Giới Thiệu Chi Tiết Dịch Vụ
            </h2>
            {service.description.map((paragraph, idx) => (
              <p key={idx} className="text-sm text-slate-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Ưu Điểm Vượt Trội Tại OrderChinaViet
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {service.benefits.map((benefit, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Quy Trình Xử Lý Dịch Vụ</h2>
              <p className="text-xs text-slate-500 mt-1">4 bước đơn giản để bắt đầu sử dụng dịch vụ</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {service.process.map((p, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-2 relative">
                  <span className="text-2xl font-bold font-mono text-primary-600">{p.step}</span>
                  <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {service.pricing && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Bảng Phí Dịch Vụ Niêm Yết</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Gói Hàng / Hạn Mức</th>
                      <th className="pb-3">Mức Phí</th>
                      <th className="pb-3">Ghi Chú Áp Dụng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {service.pricing.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3.5 font-bold text-slate-900">{row.name}</td>
                        <td className="py-3.5 font-mono font-bold text-emerald-600">{row.price}</td>
                        <td className="py-3.5 text-slate-500">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <FullServiceOrderWidget locale={locale} />
        </div>
      </main>

      <Footer locale={locale} dict={null} />
    </div>
  );
}



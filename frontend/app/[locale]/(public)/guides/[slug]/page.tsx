'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Download,
  CreditCard,
  Wallet,
  QrCode,
  ShoppingBag,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Clock,
  Boxes,
  Truck,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FloatingContact } from '@/components/common/FloatingContact';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';
import { VideoPlayer } from '@/components/common/VideoPlayer';

interface GuideStep {
  stepNo: string;
  title: string;
  desc: string;
  tip?: string;
  features?: string[];
}

interface GuideData {
  title: string;
  category: string;
  summary: string;
  videoSrc?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  steps: GuideStep[];
  highlights?: { title: string; desc: string; icon: any }[];
}

const GUIDES_DATA: Record<string, GuideData> = {
  'dat-hang': {
    title: 'Hướng Dẫn Đặt Hàng 1688 & Taobao Trọn Gói',
    category: 'HƯỚNG DẪN MUA HÀNG',
    summary: 'Quy trình tìm kiếm nguồn hàng xưởng tận gốc, đặt mua qua Extension 1-Click hoặc dán link web, đặt cọc và theo dõi hành trình đơn hàng về Việt Nam.',
    videoSrc: '/huong-dan-dat-hang.mp4',
    ctaText: 'Tạo Đơn Mua Hộ Ngay',
    ctaLink: '/orders',
    secondaryCtaText: 'Tải Extension 1-Click (.zip)',
    secondaryCtaLink: '/extension/orderchinaviet-extension.zip',
    highlights: [
      {
        title: 'Tỷ Giá Niêm Yết Minh Bạch',
        desc: 'Quy đổi giá Tệ (RMB) sang VNĐ realtime, phí mua hộ ưu đãi chỉ từ 2%.',
        icon: Sparkles,
      },
      {
        title: 'Extension Chrome 1-Click',
        desc: 'Tự động bóc tách tên, phân loại, size, màu sắc & thêm thẳng vào giỏ hàng.',
        icon: Zap,
      },
      {
        title: 'Bảo Hiểm Hàng Hóa 100%',
        desc: 'Hỗ trợ đàm phán giá xưởng và bảo vệ khiếu nại nhà cung cấp khi sai hàng.',
        icon: ShieldCheck,
      },
    ],
    steps: [
      {
        stepNo: '01',
        title: 'Cài Đặt Tiện Ích Extension Hoặc Đăng Nhập Website',
        desc: 'Đăng nhập tài khoản OrderChinaViet để nhận Mã Khách Hàng (VD: OCV000001). Bạn có thể tải tiện ích mở rộng Chrome / Cốc Cốc để trải nghiệm mua sắm tiện lợi nhất.',
        tip: 'Khuyên dùng Extension OrderChinaViet 1-Click để được tự động quy đổi giá sang VNĐ khi lướt web trên 1688, Taobao, Tmall.',
        features: [
          'Tải file zip tiện ích và bật chế độ Developer Mode trên Chrome để cài đặt trong 30 giây',
          'Tự động nhận diện phân loại sản phẩm, màu sắc, size và giá gốc RMB',
        ],
      },
      {
        stepNo: '02',
        title: 'Chọn Sản Phẩm & Thêm Vào Đơn Mua Hộ',
        desc: 'Bạn có thể chọn sản phẩm theo 2 cách cực kỳ linh hoạt:',
        features: [
          'Cách 1 (Qua Extension): Mở link sản phẩm trên 1688 / Taobao / Tmall -> Chọn phân loại hàng -> Bấm nút "Thêm vào giỏ OrderChinaViet" trên thanh công cụ nổi.',
          'Cách 2 (Dán Link Web): Copy đường link sản phẩm -> Vào mục "Đơn Mua Hộ" trên website -> Dán link và điền số lượng, phân loại, giá tiền.',
        ],
      },
      {
        stepNo: '03',
        title: 'Đặt Cọc Đơn Hàng Bằng Số Dư Ví',
        desc: 'Vào giỏ hàng / danh sách đơn mua hộ, chọn tỷ lệ đặt cọc (từ 70% đến 100%) và xác nhận đặt cọc từ số dư ví OrderChinaViet.',
        tip: 'Nếu số dư chưa đủ, bạn có thể nạp tiền nhanh 30 giây qua cổng VietQR tự động tại mục Tài Chính.',
      },
      {
        stepNo: '04',
        title: 'OrderChinaViet Mua Hàng & Vận Chuyển Về VN',
        desc: 'Đội ngũ chuyên viên mua hàng liên hệ đàm phán với xưởng Trung Quốc, hoàn tất thanh toán trong 1–3 giờ và cập nhật mã vận đơn nội địa TQ.',
        features: [
          'Hàng được nhận và kiểm đếm, chụp ảnh tại kho Quảng Châu 2.000m²',
          'Container xuất bến mỗi ngày về Hà Nội (2–5 ngày) và TP.HCM (3–7 ngày)',
          'Nhận thông báo chuông và Email tự động khi hàng cập bến kho Việt Nam',
        ],
      },
    ],
  },

  'doi-tien': {
    title: 'Hướng Dẫn Đổi Tiền Tệ (CNY ⇄ VNĐ) & Nạp Ví Alipay / WeChat',
    category: 'HƯỚNG DẪN TÀI CHÍNH',
    summary: 'Quy trình đổi tiền Nhân Dân Tệ tỷ giá ưu đãi, nạp ví Alipay, WeChat Pay hoặc chuyển khoản trực tiếp vào tài khoản ngân hàng Trung Quốc an toàn 100% nguồn tiền sạch.',
    ctaText: 'Tạo Lệnh Đổi Tiền Ngay',
    ctaLink: '/finance',
    secondaryCtaText: 'Xem Bảng Tỷ Giá Hôm Nay',
    secondaryCtaLink: '/exchange-rate',
    highlights: [
      {
        title: 'Xử Lý Nhanh 3–5 Phút',
        desc: 'Bắn tiền Tệ trực tiếp vào ví Alipay, WeChat Pay hoặc số thẻ ngân hàng TQ.',
        icon: Zap,
      },
      {
        title: 'Nguồn Tiền Sạch 100%',
        desc: 'Cam kết bảo hiểm nguồn tiền hợp pháp, không lo bị phong tỏa tài khoản.',
        icon: ShieldCheck,
      },
      {
        title: 'Tỷ Giá Cạnh Tranh Nhất',
        desc: 'Tỷ giá cập nhật liên tục theo thị trường tiền tệ quốc tế, không phí ẩn.',
        icon: Sparkles,
      },
    ],
    steps: [
      {
        stepNo: '01',
        title: 'Tra Cứu Tỷ Giá & Nhập Số Tiền Cần Đổi',
        desc: 'Truy cập mục "Đổi Tiền / Tài Chính" trên hệ thống để xem tỷ giá Nhân Dân Tệ (CNY) niêm yết theo thời gian thực.',
        tip: 'Bạn có thể chọn chiều giao dịch: Đổi VNĐ sang CNY (Mua Tệ) hoặc Đổi CNY sang VNĐ (Bán Tệ).',
        features: [
          'Hệ thống tự động tính thành tiền tương ứng theo tỷ giá áp dụng',
          'Niêm yết công khai, không thu thêm bất kỳ phụ phí ẩn nào',
        ],
      },
      {
        stepNo: '02',
        title: 'Chọn Phương Thức Nhận Tiền Tệ Trung Quốc',
        desc: 'Lựa chọn hình thức nhận tiền Tệ phù hợp với nhu cầu của bạn:',
        features: [
          'Ví Alipay: Điền Số điện thoại / Email đăng ký Alipay + Họ tên thật tài khoản Alipay',
          'Ví WeChat Pay: Tải ảnh mã QR nhận tiền cá nhân trên WeChat của bạn',
          'Ngân Hàng Trung Quốc: Cung cấp Tên ngân hàng, Số tài khoản/thẻ ngân hàng TQ và Tên chủ tài khoản (viết hoa không dấu)',
          'Thanh Toán Hộ (Ủy Thác Taobao/1688): Gửi link nhờ thanh toán hộ để nhân viên duyệt ngay',
        ],
      },
      {
        stepNo: '03',
        title: 'Thanh Toán VNĐ Bằng Quét Mã VietQR Hoặc Số Dư Ví',
        desc: 'Thực hiện thanh toán số tiền VNĐ tương ứng bằng cách quét mã VietQR tự động (khớp nội dung ngay) hoặc trích từ số dư ví OrderChinaViet.',
      },
      {
        stepNo: '04',
        title: 'Nhận Tiền Tệ Trong 3–5 Phút & Nhận Email Xác Nhận',
        desc: 'Bộ phận ngân quỹ tiến hành chuyển Tệ ngay lập tức vào tài khoản Trung Quốc của bạn, đính kèm mã giao dịch tham chiếu.',
        tip: 'Sau khi hoàn tất, hệ thống tự động gửi thông báo trên website và Email biên lai giao dịch thành công cho bạn.',
      },
    ],
  },

  'nap-tien': {
    title: 'Hướng Dẫn Nạp Tiền Ví Dư Tự Động 24/7 Trong 30 Giây',
    category: 'HƯỚNG DẪN TÀI CHÍNH',
    summary: 'Quy trình nạp tiền vào ví điện tử OrderChinaViet qua cổng VietQR tự động, PayOS hoặc PayPal để thanh toán cọc đơn mua hộ và cước vận chuyển tức thì.',
    ctaText: 'Nạp Tiền Vào Ví Ngay',
    ctaLink: '/finance',
    secondaryCtaText: 'Xem Lịch Sử Giao Dịch',
    secondaryCtaLink: '/finance',
    highlights: [
      {
        title: 'Khớp Tiền Tự Động 30 Giây',
        desc: 'Quét mã VietQR là số dư ví tự động nhảy số 24/7 kể cả ban đêm hay ngày lễ.',
        icon: Zap,
      },
      {
        title: 'Đa Dạng Cổng Thanh Toán',
        desc: 'Hỗ trợ VietQR, PayOS, chuyển khoản ngân hàng nội địa và thẻ quốc tế PayPal.',
        icon: CreditCard,
      },
      {
        title: 'An Toàn Tuyệt Đối',
        desc: 'Mỗi giao dịch đều có mã tham chiếu và được bảo mật theo tiêu chuẩn ngân hàng.',
        icon: ShieldCheck,
      },
    ],
    steps: [
      {
        stepNo: '01',
        title: 'Truy Cập Trang "Tài Chính & Ví Dư"',
        desc: 'Đăng nhập vào tài khoản OrderChinaViet -> Bấm vào biểu tượng Ví hoặc vào mục "Tài Chính" -> Chọn tab "Nạp Tiền".',
        features: [
          'Nhập số tiền VNĐ bạn muốn nạp (tối thiểu 50.000 ₫)',
          'Hoặc bấm chọn nhanh các mệnh giá phổ biến: 500.000 ₫, 1.000.000 ₫, 5.000.000 ₫, 10.000.000 ₫...',
        ],
      },
      {
        stepNo: '02',
        title: 'Chọn Phương Thức Nạp Phù Hợp',
        desc: 'Lựa chọn phương thức thanh toán tiện lợi nhất cho bạn:',
        features: [
          'Cổng 1 (VietQR Tự Động - Khuyên Dùng): Hệ thống sinh mã QR ngân hàng có sẵn số tiền và cú pháp chuẩn, quét mã chuyển tiền tự động duyệt trong 30 giây.',
          'Cổng 2 (PayOS VietQR Pro): Cổng thanh toán trực tuyến bảo mật cao, kết nối trực tiếp với 40+ ngân hàng Việt Nam.',
          'Cổng 3 (PayPal Quốc Tế): Dành cho khách hàng thanh toán bằng thẻ Visa/Mastercard hoặc tài khoản PayPal toàn cầu.',
          'Cổng 4 (Chuyển Khoản Kèm Upload Biên Lai): Chuyển khoản theo thông tin ngân hàng hiển thị và đính kèm ảnh chụp biên lai giao dịch.',
        ],
      },
      {
        stepNo: '03',
        title: 'Quét Mã QR Bằng App Ngân Hàng',
        desc: 'Mở ứng dụng Mobile Banking trên điện thoại (Vietcombank, MBBank, Techcombank, ACB, VPBank, TPBank...) -> Chọn tính năng Quét QR -> Quét mã hiển thị trên màn hình.',
        tip: 'Vui lòng giữ nguyên nội dung chuyển khoản do hệ thống tự sinh để máy chủ đối soát và cộng tiền tự động 100%.',
      },
      {
        stepNo: '04',
        title: 'Số Dư Khả Dụng & Nhận Thông Báo Hoàn Tất',
        desc: 'Ngay khi tài khoản ngân hàng báo trừ tiền thành công, hệ thống OrderChinaViet sẽ tự động tăng số dư ví của bạn trong vòng 30–60 giây.',
        features: [
          'Nhận thông báo chuông trực tiếp trên website và Email xác nhận nạp tiền',
          'Số dư ví sẵn sàng dùng để đặt cọc đơn mua hộ, thanh toán cước vận chuyển hoặc đổi tiền ngay lập tức',
        ],
      },
    ],
  },

  'van-chuyen': {
    title: 'Hướng Dẫn Ký Gửi & Vận Chuyển Hàng Trung Quốc Về Việt Nam',
    category: 'HƯỚNG DẪN VẬN CHUYỂN',
    summary: 'Quy trình lấy địa chỉ kho Trung Quốc, tự mua hàng và ký gửi vận chuyển chính ngạch/tiểu ngạch về kho Hà Nội & TP.HCM an toàn, tiết kiệm và theo dõi lộ trình 24/7.',
    ctaText: 'Tạo Đơn Ký Gửi Ngay',
    ctaLink: '/shipments',
    secondaryCtaText: 'Xem Bảng Giá Cước Vận Chuyển',
    secondaryCtaLink: '/pricing',
    highlights: [
      {
        title: 'Kho Bãi Hiện Đại 2.000m²',
        desc: 'Kho bãi tại Đông Hưng & Quảng Châu tiếp nhận và kiểm đếm hàng chuyên nghiệp.',
        icon: Boxes,
      },
      {
        title: 'Thời Gian Về Siêu Tốc',
        desc: 'Chỉ 2–5 ngày về kho Hà Nội và 3–7 ngày về kho TP.HCM và các tỉnh toàn quốc.',
        icon: Zap,
      },
      {
        title: 'Bảo Hiểm Hàng Hóa 100%',
        desc: 'Chính sách bồi thường 100% giá trị kiện hàng khi phát sinh sự cố thất lạc hoặc hư hỏng.',
        icon: ShieldCheck,
      },
    ],
    steps: [
      {
        stepNo: '01',
        title: 'Lấy Địa Chỉ Kho Trung Quốc Kèm Mã Khách Hàng',
        desc: 'Đăng nhập vào OrderChinaViet -> Vào mục "Địa Chỉ Kho" -> Copy địa chỉ kho Đông Hưng (Quảng Tây) hoặc kho Quảng Châu có gắn kèm Mã Khách Hàng của bạn (Ví dụ: OCV000123).',
        tip: 'Bắt buộc phải điền Mã Khách Hàng (Mã OCV) vào phần Tên Người Nhận hoặc Địa chỉ chi tiết để kho tự động nhận diện hàng của bạn khi cập bến.',
      },
      {
        stepNo: '02',
        title: 'Cài Đặt Địa Chỉ Nhận Hàng Trên App Mua Sắm',
        desc: 'Dán địa chỉ kho đã copy vào mục cài đặt địa chỉ nhận hàng trên Taobao, 1688, Tmall, Pinduoduo, JD hoặc gửi cho xưởng sản xuất Trung Quốc.',
      },
      {
        stepNo: '03',
        title: 'Tạo Đơn Ký Gửi Khi Shop Giao Hàng',
        desc: 'Khi người bán Trung Quốc phát hàng và cung cấp Mã Vận Đơn nội địa TQ (Ví dụ: SF..., YT..., ZTO...), bạn vào website OrderChinaViet mục "Ký Gửi" -> Bấm "Tạo Đơn Ký Gửi" -> Điền mã vận đơn và tên hàng hóa.',
        features: [
          'Có thể chọn thêm các dịch vụ gia tăng: Kiểm đếm số lượng, Đóng gỗ chống vỡ, Bọc túi khí chống sốc',
          'Theo dõi trạng thái kiện hàng theo thời gian thực từ khi nhận tại kho TQ đến khi xuất kho về VN',
        ],
      },
      {
        stepNo: '04',
        title: 'Nhận Hàng Tại Việt Nam & Thanh Toán Cước',
        desc: 'Khi hàng về kho Hà Nội hoặc TP.HCM, bạn sẽ nhận được thông báo chuông và Email. Bạn có thể đến kho nhận trực tiếp hoặc yêu cầu giao hàng tận nhà qua Viettel Post / GHTK / Shipper nội thành.',
      },
    ],
  },

  'app': {
    title: 'Hướng Dẫn Cài Đặt & Sử Dụng Tiện Ích Extension 1-Click',
    category: 'CÔNG CỤ HỖ TRỢ',
    summary: 'Cài đặt extension trên Chrome và Cốc Cốc để trải nghiệm mua sắm thông minh, đổi giá realtime và thêm sản phẩm trực tiếp từ 1688 / Taobao / Tmall.',
    videoSrc: '/tai-extension.mp4',
    ctaText: 'Tải Extension (.zip)',
    ctaLink: '/extension/orderchinaviet-extension.zip',
    steps: [
      {
        stepNo: '01',
        title: 'Tải Tệp Cài Đặt Extension (.zip)',
        desc: 'Tải file nén tiện ích mở rộng OrderChinaViet Extension (.zip) về máy tính từ nút tải trên website.',
      },
      {
        stepNo: '02',
        title: 'Giải Nén Tệp Tin Vừa Tải',
        desc: 'Nhấp chuột phải vào file zip -> Chọn "Extract All" (Giải nén) ra một thư mục cố định trên máy tính.',
      },
      {
        stepNo: '03',
        title: 'Mở Quản Lý Tiện Ích Trên Trình Duyệt',
        desc: 'Mở Chrome hoặc Cốc Cốc -> Gõ "chrome://extensions" vào thanh địa chỉ -> Bật công tắc "Developer mode" (Chế độ dành cho nhà phát triển) ở góc trên bên phải.',
      },
      {
        stepNo: '04',
        title: 'Tải Tiện Ích Đã Giải Nén (Load Unpacked)',
        desc: 'Bấm nút "Load unpacked" (Tải tiện ích đã giải nén) -> Chọn thư mục bạn vừa giải nén ở Bước 2 -> Hoàn tất cài đặt!',
        tip: 'Ghim biểu tượng OrderChinaViet lên thanh công cụ trình duyệt để tiện theo dõi giỏ hàng bất cứ lúc nào.',
      },
    ],
  },

  'rut-tien': {
    title: 'Hướng Dẫn Rút Tiền Số Dư Thừa Về Tài Khoản Ngân Hàng',
    category: 'HƯỚNG DẪN TÀI CHÍNH',
    summary: 'Quy trình gửi yêu cầu rút tiền số dư ví chưa sử dụng về tài khoản ngân hàng cá nhân nhanh chóng, an toàn và minh bạch.',
    ctaText: 'Yêu Cầu Rút Tiền',
    ctaLink: '/finance',
    steps: [
      {
        stepNo: '01',
        title: 'Vào Mục Quản Lý Tài Chính & Ví Dư',
        desc: 'Đăng nhập tài khoản -> Vào mục "Tài Chính" -> Chọn tab "Rút Tiền" hoặc bấm nút "Yêu Cầu Rút Tiền".',
      },
      {
        stepNo: '02',
        title: 'Nhập Số Tiền & Thông Tin Thụ Hưởng',
        desc: 'Điền số tiền VNĐ cần rút (nhỏ hơn hoặc bằng số dư khả dụng), chọn Tên ngân hàng, Số tài khoản và Tên chủ tài khoản (viết hoa không dấu).',
      },
      {
        stepNo: '03',
        title: 'Kế Toán Đối Soát & Chuyển Tiền',
        desc: 'Kế toán OrderChinaViet đối soát yêu cầu và chuyển tiền về tài khoản ngân hàng của bạn trong vòng 1–2 giờ làm việc.',
        tip: 'Mọi biến động số dư và trạng thái duyệt tiền đều được gửi thông báo chuông và Email tức thì.',
      },
    ],
  },
};

export default function GuideDetailPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = use(params);
  const guide = GUIDES_DATA[slug];

  if (!guide) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Bài hướng dẫn không tồn tại</h1>
        <p className="text-xs text-slate-500 mb-4">Vui lòng kiểm tra lại đường dẫn hoặc chọn bài hướng dẫn khác</p>
        <Link href={`/${locale}/guides`} className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all">
          Vào Trung Tâm Hướng Dẫn
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased relative justify-between">
      <Header locale={locale as any} dict={null} />

      <main className="flex-grow pb-16">
        {/* Global Page Hero Banner */}
        <PageHeroBanner
          badge={guide.category}
          title={guide.title}
          summary={guide.summary}
          breadcrumbs={[
            { label: 'Hướng Dẫn Dịch Vụ', href: `/${locale}/guides` },
            { label: guide.title },
          ]}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          {/* Highlights Row (if present) */}
          {guide.highlights && (
            <div className="grid sm:grid-cols-3 gap-4">
              {guide.highlights.map((h, i) => {
                const Icon = h.icon;
                return (
                  <div key={i} className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#fa3131] border border-rose-200 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{h.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{h.desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Video Section (if present) */}
          {guide.videoSrc && (
            <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#fa3131] border border-rose-200 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Video Hướng Dẫn Trực Quan 60 Giây</h3>
                    <p className="text-[11px] text-slate-500">Xem video để nắm bắt thao tác thực hiện dễ dàng</p>
                  </div>
                </div>
              </div>

              <div className="max-w-3xl mx-auto">
                <VideoPlayer src={guide.videoSrc} />
              </div>
            </div>
          )}

          {/* Step by step guide */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#fa3131]" />
                <span>Các Bước Thực Hiện Chi Tiết</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {guide.steps.length} bước đơn giản
              </span>
            </div>

            <div className="space-y-4">
              {guide.steps.map((s, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-3 relative overflow-hidden group hover:border-[#fa3131]/40 transition-all">
                  <div className="flex items-center gap-3.5">
                    <span className="w-10 h-10 rounded-2xl bg-rose-50 text-[#fa3131] font-mono font-bold text-base flex items-center justify-center border border-rose-200 shrink-0 group-hover:bg-[#fa3131] group-hover:text-white transition-colors">
                      {s.stepNo}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed sm:pl-13">
                    {s.desc}
                  </p>

                  {s.features && s.features.length > 0 && (
                    <div className="sm:pl-13 space-y-1.5 pt-1">
                      {s.features.map((f, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {s.tip && (
                    <div className="sm:ml-13 p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 font-medium flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-amber-950">Mẹo hữu ích:</strong> {s.tip}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer Call To Action */}
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-base font-bold text-slate-900">Sẵn Sàng Bắt Đầu Trải Nghiệm?</h3>
              <p className="text-xs text-slate-500">
                Thực hiện thao tác ngay bây giờ hoặc liên hệ bộ phận CSKH để được hỗ trợ 24/7.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {guide.ctaLink && (
                <Link
                  href={`/${locale}${guide.ctaLink.startsWith('/') ? guide.ctaLink : '/' + guide.ctaLink}`}
                  className="w-full sm:w-auto py-3 px-6 bg-[#fa3131] hover:bg-[#d62828] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <span>{guide.ctaText || 'Bắt Đầu Ngay'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {guide.secondaryCtaLink && (
                <a
                  href={guide.secondaryCtaLink}
                  download={guide.secondaryCtaLink.endsWith('.zip') ? true : undefined}
                  className="w-full sm:w-auto py-3 px-5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {guide.secondaryCtaLink.endsWith('.zip') ? <Download className="w-4 h-4 text-sky-600" /> : <ExternalLink className="w-4 h-4" />}
                  <span>{guide.secondaryCtaText}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer locale={locale as any} dict={null} />
      <FloatingContact />
    </div>
  );
}

'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowLeftRight,
  Truck,
  ShoppingBag,
  Laptop,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Clock,
  Boxes,
  FileText,
  CreditCard,
  QrCode,
  Download,
  Info,
  ChevronRight,
  PhoneCall,
  MessageSquare,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FloatingContact } from '@/components/common/FloatingContact';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';

interface GuideStep {
  stepNo: string;
  title: string;
  desc: string;
  tip?: string;
  features?: string[];
}

interface GuideCategory {
  id: string;
  slug: string;
  tabLabel: string;
  badge: string;
  icon: any;
  title: string;
  summary: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  highlights: { title: string; desc: string; icon: any }[];
  steps: GuideStep[];
  faqs?: { q: string; a: string }[];
}

const GUIDES_LIST: GuideCategory[] = [
  {
    id: 'nap-tien',
    slug: 'nap-tien',
    tabLabel: 'Nạp Tiền Vào Ví',
    badge: 'Tài Chính 24/7',
    icon: Wallet,
    title: 'Hướng Dẫn Nạp Tiền Ví Dư Tự Động 24/7 Trong 30 Giây',
    summary:
      'Quy trình nạp tiền vào ví điện tử OrderChinaViet qua cổng VietQR Napas247 tự động, PayOS hoặc PayPal để thanh toán cọc đơn mua hộ và cước vận chuyển tức thì.',
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
    faqs: [
      {
        q: 'Nạp tiền vào ban đêm hoặc ngày lễ có được cộng tiền tự động không?',
        a: 'Có. Hệ thống cổng VietQR Napas247 và PayOS hoạt động tự động 24/7 xuyên suốt 365 ngày, số dư ví sẽ được cộng ngay sau khi tài khoản ngân hàng nhận được tiền.',
      },
      {
        q: 'Nếu tôi chuyển khoản sai cú pháp thì làm thế nào?',
        a: 'Nếu bạn vô tình nhập sai cú pháp nội dung chuyển khoản, hãy vào mục "Khiếu Nại & Hỗ Trợ" hoặc nhắn tin trực tiếp cho CSKH qua Zalo/WhatsApp kèm ảnh chụp bill để kế toán tra soát và cộng tiền thủ công trong 5 phút.',
      },
    ],
  },

  {
    id: 'doi-tien',
    slug: 'doi-tien',
    tabLabel: 'Đổi Tiền & Alipay/WeChat',
    badge: 'Tỷ Giá Realtime',
    icon: ArrowLeftRight,
    title: 'Hướng Dẫn Đổi Tiền Tệ (CNY ⇄ VNĐ) & Nạp Ví Alipay / WeChat',
    summary:
      'Quy trình đổi tiền Nhân Dân Tệ tỷ giá ưu đãi, nạp ví Alipay, WeChat Pay hoặc chuyển khoản trực tiếp vào tài khoản ngân hàng Trung Quốc an toàn 100% nguồn tiền sạch.',
    ctaText: 'Tạo Lệnh Đổi Tiền Ngay',
    ctaLink: '/exchange-rate',
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
    faqs: [
      {
        q: 'Tôi nạp tiền vào ví Alipay có sợ bị khóa tài khoản không?',
        a: 'OrderChinaViet cam kết 100% nguồn tiền Tệ sạch từ hoạt động xuất nhập khẩu chính ngạch, có đầy đủ chứng từ ngân hàng, an toàn tuyệt đối cho tài khoản Alipay và WeChat Pay của bạn.',
      },
      {
        q: 'Thời gian đổi tiền và nhận Tệ mất bao lâu?',
        a: 'Thông thường chỉ mất từ 3 đến 5 phút sau khi hệ thống nhận được tiền VNĐ của bạn.',
      },
    ],
  },

  {
    id: 'van-chuyen',
    slug: 'van-chuyen',
    tabLabel: 'Vận Chuyển Hàng Ký Gửi',
    badge: 'Logistics 2–5 Ngày',
    icon: Truck,
    title: 'Hướng Dẫn Ký Gửi & Vận Chuyển Hàng Trung Quốc Về Việt Nam',
    summary:
      'Quy trình lấy địa chỉ kho Trung Quốc, tự mua hàng và ký gửi vận chuyển chính ngạch/tiểu ngạch về kho Hà Nội & TP.HCM an toàn, tiết kiệm và theo dõi lộ trình 24/7.',
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
    faqs: [
      {
        q: 'Hàng về Việt Nam có được kiểm tra trước khi nhận không?',
        a: 'Khách hàng hoàn toàn được phép đồng kiểm tình trạng kiện hàng, cân nặng và chụp ảnh đối soát trước khi thanh toán và nhận hàng.',
      },
      {
        q: 'Cước vận chuyển được tính theo cân nặng hay thể tích?',
        a: 'Cước vận chuyển được tính theo cân nặng thực tế (kg). Đối với hàng cồng kềnh, quy đổi thể tích theo công thức chuẩn quốc tế: (Dài x Rộng x Cao) / 6000.',
      },
    ],
  },

  {
    id: 'dat-hang',
    slug: 'dat-hang',
    tabLabel: 'Đặt Hàng 1688 & Taobao',
    badge: 'Mua Hộ Trọn Gói',
    icon: ShoppingBag,
    title: 'Hướng Dẫn Đặt Mua Hàng 1688, Taobao, Tmall Trọn Gói',
    summary:
      'Quy trình tìm kiếm nguồn hàng xưởng tận gốc, đặt mua qua Extension 1-Click hoặc dán link web, đặt cọc và theo dõi hành trình đơn hàng về Việt Nam an toàn.',
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
        desc: 'Đăng nhập tài khoản OrderChinaViet để nhận Mã Khách Hàng. Bạn có thể tải tiện ích mở rộng Chrome / Cốc Cốc để trải nghiệm mua sắm tiện lợi nhất.',
        tip: 'Khuyên dùng Extension OrderChinaViet 1-Click để được tự động quy đổi giá sang VNĐ khi lướt web trên 1688, Taobao, Tmall.',
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
          'Hàng được nhận và kiểm đếm, chụp ảnh tại kho Trung Quốc',
          'Xe xuất bến mỗi ngày về Hà Nội (2–5 ngày) và TP.HCM (3–7 ngày)',
          'Nhận thông báo chuông và Email tự động khi hàng cập bến kho Việt Nam',
        ],
      },
    ],
    faqs: [
      {
        q: 'Thời gian mua hàng sau khi đặt cọc là bao lâu?',
        a: 'OrderChinaViet cam kết tiến hành liên hệ xưởng và thanh toán đơn hàng trong vòng 1–3 giờ làm việc kể từ lúc khách hàng đặt cọc thành công.',
      },
      {
        q: 'Nếu người bán giao sai hàng hoặc thiếu hàng thì xử lý thế nào?',
        a: 'Bộ phận khiếu nại của OrderChinaViet sẽ đại diện khách hàng đàm phán trực tiếp với shop Trung Quốc để yêu cầu phát bù hoặc hoàn lại 100% tiền hàng.',
      },
    ],
  },

  {
    id: 'app',
    slug: 'app',
    tabLabel: 'Cài Đặt Extension 1-Click',
    badge: 'Tiện Ích Trình Duyệt',
    icon: Laptop,
    title: 'Hướng Dẫn Cài Đặt & Sử Dụng Tiện Ích Extension 1-Click',
    summary:
      'Cài đặt extension trên Chrome và Cốc Cốc để trải nghiệm mua sắm thông minh, đổi giá realtime và thêm sản phẩm trực tiếp từ 1688 / Taobao / Tmall vào giỏ hàng.',
    ctaText: 'Tải Extension (.zip)',
    ctaLink: '/extension/orderchinaviet-extension.zip',
    secondaryCtaText: 'Xem Video Hướng Dẫn',
    secondaryCtaLink: '#video',
    highlights: [
      {
        title: 'Dịch Tự Động Tiếng Việt',
        desc: 'Hiển thị giao diện tiếng Việt trực tiếp trên các trang 1688, Taobao, Tmall.',
        icon: Sparkles,
      },
      {
        title: 'Bóc Tách Thuộc Tính Chuẩn',
        desc: 'Tự động chọn size, màu sắc, phân loại hàng hóa không sợ nhầm lẫn.',
        icon: Zap,
      },
      {
        title: 'Cài Đặt Nhanh 30 Giây',
        desc: 'Tương thích hoàn hảo với Google Chrome, Cốc Cốc, Microsoft Edge, Brave.',
        icon: Laptop,
      },
    ],
    steps: [
      {
        stepNo: '01',
        title: 'Tải Tệp Cài Đặt Extension (.zip)',
        desc: 'Tải file nén tiện ích mở rộng OrderChinaViet Extension (.zip) về máy tính từ nút tải trên website.',
      },
      {
        stepNo: '02',
        title: 'Giải Nén Tệp Tin Vừa Tải',
        desc: 'Nhấp chuột phải vào file zip vừa tải về -> Chọn "Extract All" (Giải nén) ra một thư mục cố định trên máy tính.',
      },
      {
        stepNo: '03',
        title: 'Mở Quản Lý Tiện Ích Trên Trình Duyệt',
        desc: 'Mở Chrome hoặc Cốc Cốc -> Gõ "chrome://extensions" vào thanh địa chỉ trình duyệt -> Bật công tắc "Developer mode" (Chế độ dành cho nhà phát triển) ở góc trên bên phải.',
      },
      {
        stepNo: '04',
        title: 'Tải Tiện Ích Đã Giải Nén (Load Unpacked)',
        desc: 'Bấm nút "Load unpacked" (Tải tiện ích đã giải nén) -> Chọn thư mục bạn vừa giải nén ở Bước 2 -> Hoàn tất cài đặt!',
        tip: 'Ghim biểu tượng OrderChinaViet lên thanh công cụ trình duyệt để tiện theo dõi giỏ hàng bất cứ lúc nào.',
      },
    ],
    faqs: [
      {
        q: 'Extension có an toàn cho máy tính và tài khoản không?',
        a: 'Tuyệt đối an toàn. Tiện ích chỉ hoạt động bóc tách thông tin sản phẩm công khai trên web 1688/Taobao và không thu thập bất kỳ dữ liệu cá nhân nào.',
      },
    ],
  },
];

export default function GuidesHubPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [activeTabId, setActiveTabId] = useState<string>('nap-tien');

  const activeGuide = GUIDES_LIST.find((g) => g.id === activeTabId) || GUIDES_LIST[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased justify-between">
      <Header locale={locale as any} dict={null} />

      <main className="flex-grow pb-16">
        {/* Top Hero Banner */}
        <PageHeroBanner
          badge="TRUNG TÂM HƯỚNG DẪN"
          title="Cẩm Nang Hướng Dẫn Sử Dụng Dịch Vụ OrderChinaViet"
          summary="Tổng hợp toàn bộ quy trình nạp tiền, đổi tiền Tệ, ký gửi vận chuyển và đặt mua hàng 1688/Taobao từng bước chi tiết, trực quan và dễ hiểu nhất."
          breadcrumbs={[{ label: 'Trang Chủ', href: `/${locale}` }, { label: 'Hướng Dẫn Dịch Vụ' }]}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* ── INTERACTIVE TAB SELECTOR ── */}
          <div className="bg-white p-2 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
              {GUIDES_LIST.map((guide) => {
                const Icon = guide.icon;
                const isActive = guide.id === activeTabId;
                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setActiveTabId(guide.id)}
                    className={`flex items-center justify-center sm:justify-start gap-2.5 px-3.5 py-3 rounded-xl sm:rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{guide.tabLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── ACTIVE GUIDE CONTENT CARD ── */}
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Guide Header & Highlights */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{activeGuide.badge}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {activeGuide.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {activeGuide.summary}
                  </p>
                </div>

                {/* Quick Action CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <Link
                    href={`/${locale}${activeGuide.ctaLink}`}
                    className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all text-center flex items-center justify-center gap-2"
                  >
                    <span>{activeGuide.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {activeGuide.secondaryCtaText && activeGuide.secondaryCtaLink && (
                    <Link
                      href={
                        activeGuide.secondaryCtaLink.startsWith('http') ||
                        activeGuide.secondaryCtaLink.startsWith('/')
                          ? activeGuide.secondaryCtaLink
                          : `/${locale}${activeGuide.secondaryCtaLink}`
                      }
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors text-center flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>{activeGuide.secondaryCtaText}</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Highlights 3-Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {activeGuide.highlights.map((h, i) => {
                  const Icon = h.icon;
                  return (
                    <div
                      key={i}
                      className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-rose-600 flex items-center justify-center font-bold shadow-2xs">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{h.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{h.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── STEP-BY-STEP WORKFLOW ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Quy Trình Thực Hiện Từng Bước Chi Tiết
                </h3>
              </div>

              <div className="space-y-4">
                {activeGuide.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-white border border-slate-200 hover:border-slate-300 rounded-3xl shadow-xs transition-all flex flex-col md:flex-row gap-5 items-start"
                  >
                    {/* Step Badge */}
                    <div className="flex md:flex-col items-center gap-2 shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold text-lg font-mono">
                        {step.stepNo}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Bước {idx + 1}
                      </span>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 space-y-3">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {step.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {step.desc}
                      </p>

                      {/* Features List */}
                      {step.features && step.features.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {step.features.map((feat, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex items-start gap-2 text-xs text-slate-700 font-medium"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Helpful Tip */}
                      {step.tip && (
                        <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="leading-relaxed font-medium">
                            <strong>Mẹo hữu ích:</strong> {step.tip}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── FAQ ACCORDION (IF AVAILABLE) ── */}
            {activeGuide.faqs && activeGuide.faqs.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <HelpCircle className="w-5 h-5 text-rose-600" />
                  <h3 className="text-base font-bold text-slate-900">Câu Hỏi Thường Gặp (FAQ)</h3>
                </div>

                <div className="space-y-3">
                  {activeGuide.faqs.map((faq, fIdx) => (
                    <div key={fIdx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="text-rose-600 font-mono font-bold">Q:</span>
                        <span>{faq.q}</span>
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed pl-5">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── BOTTOM DIRECT LINK BANNER ── */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-bold text-white">Bạn cần hỗ trợ trực tiếp từ CSKH?</h4>
                <p className="text-xs text-slate-300">
                  Đội ngũ chăm sóc khách hàng trực tuyến 24/7 sẵn sàng giải đáp mọi thắc mắc và hướng dẫn chi tiết.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/${locale}/guides/${activeGuide.slug}`}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <span>Xem Chi Tiết Bài Viết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Liên Hệ CSKH</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FloatingContact />
      <Footer locale={locale as any} dict={null} />
    </div>
  );
}

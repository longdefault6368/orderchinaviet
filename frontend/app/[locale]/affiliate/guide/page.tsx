'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Compass,
  Users,
  Target,
  Search,
  CheckCircle2,
  DollarSign,
  Gift,
  ExternalLink,
  ShieldCheck,
  Truck,
  ShoppingBag,
  Wallet,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Share2,
  Calendar,
  Layers,
  ArrowUpRight,
  Clock,
  FileText,
  BadgeCheck,
  MapPin,
  Check,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

export default function AffiliateGuidePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = use(params);
  const [activeTab, setActiveTab] = useState<'guide' | 'features' | 'policy'>('guide');

  return (
    <div className="space-y-6 text-slate-900 pb-16">
      {/* ── TOP HERO BANNER ── */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-md">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tài Liệu Đào Tạo &amp; Hướng Dẫn Thực Chiến</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Cẩm Nang &amp; Hướng Dẫn Tìm Khách Hàng CTV
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tất cả những gì bạn cần để thành công: 4 nhóm khách hàng tiềm năng, kênh tìm kiếm, 4 bước làm việc, 8 chức năng cốt lõi và chính sách đãi ngộ tốt nhất.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/${locale}/affiliate/links`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Lấy Link Giới Thiệu</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 4 CORE HIGHLIGHT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hình Thức Làm Việc</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">100% Online</p>
          <p className="text-[11px] text-slate-500 font-medium">Làm việc tại nhà, không cần đến văn phòng</p>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Lương Cứng &amp; Thưởng</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-indigo-950">2.000.000 ₫ + 250k</p>
          <p className="text-[11px] text-indigo-700 font-medium">Nhận thưởng 250k khi có 3 khách nạp đơn</p>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Hoa Hồng Trọn Đời</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-950">5% – 50%</p>
          <p className="text-[11px] text-emerald-700 font-medium">Thu nhập từ 2tr đến 100tr/tháng</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 sm:p-5 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Cam Kết Uy Tín</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-amber-950">Không Đặt Cọc</p>
          <p className="text-[11px] text-amber-700 font-medium">Không thu bất kỳ khoản phí nào khi nhận việc</p>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-thin">
        {[
          { id: 'guide', label: '1. Cẩm Nang & Quy Trình Tìm Khách', icon: BookOpen },
          { id: 'features', label: '2. 8 Chức Năng Cốt Lõi Khách Hàng', icon: Layers },
          { id: 'policy', label: '3. Chính Sách Lương & Quyền Lợi', icon: DollarSign },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
         TAB 1: CẨM NANG & QUY TRÌNH TÌM KHÁCH
         ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* Section 1: 4 Target Customer Groups */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">1. CTV Cần Tìm Những Khách Hàng Nào?</h3>
                <p className="text-xs text-slate-500 font-medium">Tập trung khai thác 4 nhóm khách hàng có nhu cầu giao dịch cao nhất</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Chủ Shop Online</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Bán hàng trên Shopee, TikTok Shop, Facebook, Lazada... cần nguồn hàng thời trang, gia dụng, phụ kiện giá gốc tại xưởng.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Tiểu Thương / Khách Sỉ</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Các chủ buôn tại các chợ đầu mối hoặc doanh nghiệp cần nhập hàng số lượng lớn, bao cont, vận chuyển chính ngạch có hóa đơn.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                  <Compass className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Khách Tự Order Taobao/1688</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Khách đã biết tự tìm sản phẩm và thanh toán, chỉ cần kho nhận tại Quảng Châu / Đông Hưng để ký gửi vận chuyển về Việt Nam.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Khách Cần Đổi Tiền CNY</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Khách cần đổi VNĐ sang CNY, nạp ví Alipay, WeChat Pay hoặc chuyển khoản trực tiếp vào tài khoản ngân hàng của xưởng Trung Quốc.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Where to find customers */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">2. Tìm Khách Hàng Ở Đâu? (4 Kênh Thực Chiến)</h3>
                <p className="text-xs text-slate-500 font-medium">Bạn có thể chủ động tiếp cận hàng ngàn khách hàng tiềm năng mỗi ngày</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 space-y-1.5">
                <h4 className="font-bold text-blue-950 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Facebook Groups Nhập Hàng</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tham gia các hội nhóm: <em>"Hội nhập hàng Taobao 1688", "Nguồn hàng sỉ Quảng Châu", "Cộng đồng kinh doanh online", "Chia sẻ nguồn hàng Trung Quốc"...</em> Thường xuyên bình luận hỗ trợ, chia sẻ mẹo tìm xưởng và để lại link đăng ký.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-1.5">
                <h4 className="font-bold text-rose-950 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span>TikTok / Reels / YouTube Shorts</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đăng video ngắn unboxing sản phẩm hot trend, hướng dẫn tìm nguồn hàng giá rẻ, hướng dẫn cài extension OrderChinaViet quy đổi tỷ giá trực tiếp trên Taobao. Gắn link bio để hút khách tự động.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-1.5">
                <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Zalo &amp; Facebook Cá Nhân</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Đăng bài trên trang cá nhân giới thiệu dịch vụ vận chuyển nhanh 3-5 ngày, hỗ trợ đặt hàng không qua trung gian, hoàn tiền cọc minh bạch và tỷ giá cạnh tranh cho bạn bè, người quen đang kinh doanh.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-1.5">
                <h4 className="font-bold text-amber-950 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span>Diễn Đàn &amp; Hội Nhóm Bán Hàng</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tham gia các nhóm kinh doanh trên Zalo, Telegram, các diễn đàn bán sỉ để kết nối trực tiếp với các chủ shop đang tìm kiếm đối tác vận chuyển ổn định, bảo hiểm 100% khi mất mát.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: 4-Step Workflow */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">3. Quy Trình 4 Bước Làm Việc Của CTV</h3>
                <p className="text-xs text-slate-500 font-medium">Quy trình rõ ràng, đơn giản và được hệ thống tự động ghi nhận hoa hồng</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Xác Định Nhu Cầu</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Khách cần: Mua hộ Taobao/1688, Ký gửi vận chuyển hàng có sẵn, hay Đổi tiền CNY thanh toán xưởng.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Gửi Link / QR Cá Nhân</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Lấy link giới thiệu trong mục <em>Tạo Link &amp; Mã QR</em> gửi khách đăng ký. Hệ thống tự động ghi nhận khách vĩnh viễn.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Hướng Dẫn Tạo Đơn</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Hướng dẫn khách dán link sản phẩm hoặc điền mã vận đơn ký gửi, nạp tiền ví qua VietQR tự động.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 relative">
                <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                  4
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Chấm Công &amp; Nhận Tiền</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Điểm danh check-in Thứ 2 – Thứ 7, nhận lương cứng 2 triệu vào ngày 05 và rút hoa hồng bất kỳ lúc nào.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Focus & Separation of Concerns (Updated Gradient) */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 text-white shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="font-bold text-white text-base">CTV Chỉ Cần Tập Trung Vào 3 Việc</h3>
            </div>

            <div className="grid sm:grid-cols-3 gap-3.5 pt-1">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1">
                <span className="text-amber-300 font-bold text-xs">Việc 1:</span>
                <h4 className="font-bold text-white text-sm">Tìm Kiếm Khách Hàng</h4>
                <p className="text-[11px] text-slate-300">Tiếp cận các chủ shop, tiểu thương và người có nhu cầu nhập hàng.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1">
                <span className="text-amber-300 font-bold text-xs">Việc 2:</span>
                <h4 className="font-bold text-white text-sm">Giới Thiệu Đăng Ký</h4>
                <p className="text-[11px] text-slate-300">Gửi link affiliate hoặc mã QR để khách tạo tài khoản trên hệ thống.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1">
                <span className="text-amber-300 font-bold text-xs">Việc 3:</span>
                <h4 className="font-bold text-white text-sm">Hướng Dẫn Khởi Đầu</h4>
                <p className="text-[11px] text-slate-300">Hỗ trợ khách tạo đơn hoặc khai báo mã kiện đầu tiên.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-xs text-slate-200">
              <p className="font-bold text-amber-300 mb-1">OrderChinaViet lo toàn bộ khâu vận hành còn lại:</p>
              <p className="leading-relaxed">
                Mua hàng ➔ Thanh toán bên Trung Quốc ➔ Tiếp nhận tại kho TQ ➔ Vận chuyển quốc tế ➔ Khai báo hải quan ➔ Kho Việt Nam ➔ Giao hàng tận tay khách.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
         TAB 2: 8 CHỨC NĂNG CỐT LÕI KHÁCH HÀNG
         ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Hệ Thống &amp; Tiện Ích Khách Hàng Sử Dụng</h3>
              <p className="text-xs text-slate-500 font-medium">Nắm vững các tính năng để tư vấn chính xác và thuyết phục khách hàng</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {[
                {
                  icon: ShoppingBag,
                  title: '1. Mua Hộ TMĐT Trung Quốc',
                  color: 'text-blue-600 bg-blue-50 border-blue-200',
                  desc: 'Dán link từ Taobao, 1688, Tmall, Pinduoduo. Hỗ trợ extension tự động quy đổi giá sang VNĐ.',
                },
                {
                  icon: Truck,
                  title: '2. Ký Gửi & Vận Chuyển',
                  color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                  desc: 'Khách tự mua hàng khai báo mã vận đơn nội địa TQ để gửi về kho, theo dõi cân nặng và ảnh kiện.',
                },
                {
                  icon: Search,
                  title: '3. Tra Cứu Vận Đơn Nhanh',
                  color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
                  desc: 'Nhập mã vận đơn tại trang Tracking để kiểm tra hành trình ngay lập tức mà không cần đăng nhập.',
                },
                {
                  icon: MapPin,
                  title: '4. Yêu Cầu Giao Hàng VN',
                  color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                  desc: 'Khi hàng về kho VN, khách chọn nhiều kiện để gộp đơn, chọn nhận tại kho hoặc giao hỏa tốc tận nhà.',
                },
                {
                  icon: Wallet,
                  title: '5. Ví Tiền & Nạp VietQR',
                  color: 'text-amber-600 bg-amber-50 border-amber-200',
                  desc: 'Quét mã VietQR nạp tiền tự động 24/7, dùng số dư đặt cọc và thanh toán cước phí an toàn.',
                },
                {
                  icon: DollarSign,
                  title: '6. Đổi Tiền CNY / VND',
                  color: 'text-rose-600 bg-rose-50 border-rose-200',
                  desc: 'Tạo yêu cầu đổi tiền, nạp ví Alipay, WeChat Pay hoặc chuyển khoản cho xưởng sản xuất tại TQ.',
                },
                {
                  icon: ShieldCheck,
                  title: '7. Rút Tiền Về Ngân Hàng',
                  color: 'text-purple-600 bg-purple-50 border-purple-200',
                  desc: 'Khách hàng có thể tạo yêu cầu rút số dư ví về tài khoản ngân hàng Việt Nam bất cứ lúc nào.',
                },
                {
                  icon: Layers,
                  title: '8. Quản Lý Tập Trung',
                  color: 'text-slate-700 bg-slate-100 border-slate-200',
                  desc: 'Theo dõi toàn bộ đơn mua hộ, kiện hàng, công nợ, số dư ví và lịch sử trên một tài khoản duy nhất.',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className={`w-8 h-8 rounded-xl border ${item.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Slogan Box */}
            <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 space-y-1">
              <span className="font-bold uppercase tracking-wider text-[11px] text-blue-800">
                Câu Slogan Chuẩn Để CTV Giới Thiệu Với Khách Hàng:
              </span>
              <p className="font-semibold italic leading-relaxed text-sm">
                “OrderChinaViet giúp bạn mua hàng Trung Quốc, ký gửi vận chuyển, theo dõi kiện hàng, quản lý ví, đổi tiền CNY/VND và yêu cầu giao hàng tại Việt Nam — tất cả trong một hệ thống duy nhất.”
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
         TAB 3: CHÍNH SÁCH LƯƠNG & QUYỀN LỢI
         ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'policy' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cơ Cấu Thu Nhập &amp; Quyền Lợi CTV</h3>
                <p className="text-xs text-slate-500 font-medium">Chính sách minh bạch, thanh toán đúng hạn và không giới hạn trần thu nhập</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">1. Lương Cứng</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Hàng Tháng</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">2.000.000 ₫</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Áp dụng cho thành viên hoàn thành chấm công check-in từ Thứ 2 đến Thứ 7 trên hệ thống. Chi trả vào ngày 05 hàng tháng.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-800 uppercase">2. Thưởng Khởi Đầu</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200 text-indigo-800">1 Lần</span>
                </div>
                <p className="text-2xl font-bold text-indigo-950">250.000 ₫</p>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Thưởng nóng ngay sau khi tạo tài khoản và giới thiệu được 3 khách hàng đầu tiên nạp ví / đặt đơn.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">3. Hoa Hồng Đơn</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">Trọn Đời</span>
                </div>
                <p className="text-2xl font-bold text-emerald-950">5% – 50%</p>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Hưởng % trên mọi đơn mua hộ, cước vận chuyển và phí đổi tiền phát sinh từ khách hàng do bạn giới thiệu.
                </p>
              </div>
            </div>

            {/* Checklist of commitments */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                Cam Kết Vàng Từ OrderChinaViet Dành Cho CTV:
              </h4>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% làm việc online tại nhà hoặc bất cứ đâu.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Không yêu cầu đặt cọc tiền hay bảo lãnh tài chính.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Không thu bất kỳ khoản phí nào trong suốt quá trình làm việc.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Được đào tạo chi tiết về quy trình và tài liệu quảng cáo sẵn có.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Share2,
  Copy,
  Check,
  Download,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Send,
  Video,
  FileText,
  ImageIcon,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowUpRight,
  CheckCircle2,
  Zap,
  ShoppingBag,
  Truck,
  Building2,
  Package,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { affiliateStore, AffiliateAccount } from '@/lib/affiliate-store';
import { authStore } from '@/lib/auth-store';
import { SITE_URL } from '@/lib/api-client';

export default function AffiliateMediaPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [affiliate, setAffiliate] = useState<AffiliateAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'chats' | 'video' | 'banners' | 'guidelines'>('posts');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const getBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin.replace(/\/$/, '');
    }
    return (SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  };

  const baseUrl = getBaseUrl();

  useEffect(() => {
    const currentSession = authStore.getUser();
    const data = affiliateStore.getAffiliate();
    if (currentSession?.customerCode && currentSession.customerCode.startsWith('OCV_AFF')) {
      data.affiliateCode = currentSession.customerCode;
    }
    setAffiliate(data);
  }, []);

  const partnerCode = affiliate?.affiliateCode || 'OCV_AFF_888888';
  const partnerLink = `${baseUrl}/${locale}/register?ref=${partnerCode}&utm_source=media_kit`;

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const shareToZalo = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex('zalo_action');
    setTimeout(() => setCopiedIndex(null), 2500);
    window.open('https://chat.zalo.me', '_blank');
  };

  const shareToFacebook = (url: string) => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'width=600,height=500');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORIZED CONTENT ASSETS WITH AUTO-INJECTED PARTNER LINK
  // ═══════════════════════════════════════════════════════════════════════════

  const socialPostTemplates = [
    {
      id: 'post_1',
      title: 'Bài Đăng Bán Hàng: Nhập Hàng Tận Xưởng 1688 / Taobao Cước Siêu Rẻ',
      target: 'Dành cho nhóm sỉ Facebook, Zalo & trang cá nhân',
      badge: 'Chuyển Đổi Cao Nhất',
      content: `NHẬP HÀNG TRUNG QUỐC TẬN GỐC 1688 - TAOBAO VỀ VIỆT NAM CHỈ TỪ 3 - 5 NGÀY

Bạn đang kinh doanh thời trang, gia dụng, linh kiện điện tử nhưng muốn tối ưu giá vốn nhập hàng tận xưởng?

OrderChinaViet - Đơn vị vận chuyển & ủy thác nhập hàng Trung - Việt hàng đầu:
- Cước vận chuyển đường bộ siêu tốc chỉ từ 18.000 ₫/kg.
- Hệ thống kho bãi hiện đại tại Quảng Châu, Bằng Tường kiểm hàng và quét mã barcode tự động.
- Đội ngũ mua hộ đàm phán giá xưởng chuyên nghiệp, bảo hiểm hàng hóa 100%.
- Hỗ trợ thanh toán hộ Alipay, WeChat Pay an toàn tuyệt đối.

Đăng ký tài khoản nhận ngay ưu đãi cước vận chuyển và hỗ trợ tìm nguồn hàng 1-1 tại đây:
${partnerLink}

(Nhập mã đối tác: ${partnerCode} để được hỗ trợ chuyên sâu)`,
    },
    {
      id: 'post_2',
      title: 'Bài Đăng Tư Vấn: Giải Pháp Dành Cho Chủ Shop TMĐT Shopee / TikTok Shop',
      target: 'Dành cho hội nhóm kinh doanh TMĐT & người mới khởi nghiệp',
      badge: 'Chủ Shop TMĐT',
      content: `BÍ QUYẾT TÌM NGUỒN HÀNG TẬN XƯỞNG GIÁ GỐC ĐỂ CẠNH TRANH TRÊN TIKTOK SHOP & SHOPEE

Rất nhiều chủ shop đã gia tăng gấp đôi lợi nhuận khi tự chủ nguồn hàng nhập thẳng từ các xưởng sản xuất lớn tại Trung Quốc thay vì lấy lại qua các đầu nậu trung gian.

Đến với OrderChinaViet:
1. Tìm nguồn hàng chuẩn xưởng theo hình ảnh hoặc link sản phẩm.
2. Quản lý toàn bộ lộ trình vận chuyển real-time trên website tiện lợi.
3. Không lo tắc biên, hàng về kho Hà Nội & TP.HCM liên tục mỗi ngày.
4. Đầy đủ hóa đơn chứng từ chính ngạch khi khách hàng yêu cầu.

Trải nghiệm dịch vụ và nhận tư vấn miễn phí ngay hôm nay:
${partnerLink}`,
    },
    {
      id: 'post_3',
      title: 'Bài Đăng Ngắn Gọn: Chia Sẻ Cơ Hội & Ưu Đãi Mở Tài Khoản Mới',
      target: 'Dành cho Story, Threads & bài đăng nhanh Zalo',
      badge: 'Ngắn Gọn & Súc Tích',
      content: `Cần nhập hàng 1688, Taobao, Tmall giá gốc từ xưởng Trung Quốc?
OrderChinaViet hỗ trợ đặt hàng, thanh toán hộ và vận chuyển về tận tay an toàn, nhanh chóng chỉ từ 3-5 ngày!

Bấm link đăng ký nhận hỗ trợ trực tiếp từ nhân sự phụ trách:
${partnerLink}
Mã giới thiệu: ${partnerCode}`,
    },
  ];

  const chatScriptTemplates = [
    {
      id: 'chat_1',
      title: 'Kịch Bản 1: Tin Nhắn Chào Mừng & Giới Thiệu Dịch Vụ',
      target: 'Gửi khi khách hỏi tư vấn tìm nguồn hàng',
      badge: 'Chào Khách Mới',
      content: `Chào bạn! Mình nhận thấy bạn đang quan tâm đến việc tìm nguồn hàng Trung Quốc chất lượng giá xưởng.

Bên mình là OrderChinaViet, chuyên mua hộ và vận chuyển hàng chính ngạch từ 1688, Taobao, Tmall về Việt Nam với giá cước chỉ từ 18.000 ₫/kg.

Bạn có thể tạo tài khoản miễn phí tại đây để xem bảng giá cước chi tiết và được nhân sự bên mình hỗ trợ tìm xưởng nhé:
${partnerLink}

(Mã hỗ trợ của bạn: ${partnerCode})`,
    },
    {
      id: 'chat_2',
      title: 'Kịch Bản 2: Báo Giá Nhanh & Cam Kết Thời Gian Vận Chuyển',
      target: 'Gửi khi khách so sánh giá cước hoặc hỏi thời gian hàng về',
      badge: 'Báo Giá & Chốt Đơn',
      content: `Dạ chào bạn! Biểu phí vận chuyển bên OrderChinaViet hiện đang tốt nhất thị trường:
- Tuyến Quảng Châu - Hà Nội: 3 - 5 ngày làm việc.
- Tuyến Quảng Châu - TP.HCM: 4 - 7 ngày làm việc.
- Phí mua hộ chỉ từ 1% giá trị đơn hàng.
- Cam kết bảo hiểm hàng hóa, mất mát đền bù 100%.

Bạn đăng ký tài khoản tại link này để bên mình kích hoạt chính sách giá ưu đãi cho bạn nhé:
${partnerLink}`,
    },
    {
      id: 'chat_3',
      title: 'Kịch Bản 3: Hướng Dẫn Khách Cài Extension Đặt Hàng 1-Click',
      target: 'Gửi sau khi khách đã tạo tài khoản để hướng dẫn thao tác',
      badge: 'Chăm Sóc & Hướng Dẫn',
      content: `Chào bạn! Để thuận tiện xem giá tiền Việt và thêm sản phẩm vào giỏ hàng ngay trên 1688/Taobao, bạn cài đặt công cụ OrderChinaViet Extension trên trình duyệt máy tính theo hướng dẫn nhé:
1. Đăng nhập tài khoản tại: ${partnerLink}
2. Bấm "Tải Extension OrderChinaViet" trên thanh công cụ.
3. Vào 1688.com chọn sản phẩm, công cụ sẽ tự động quy đổi tỷ giá và bấm "Thêm Vào Giỏ Hàng" là xong ạ!`,
    },
  ];

  const videoScriptTemplates = [
    {
      id: 'video_1',
      title: 'Kịch Bản TikTok / Reels: "3 Bước Nhập Hàng 1688 Tận Gốc Cho Người Mới"',
      duration: 'Thời lượng: 45 - 60 giây',
      badge: 'TikTok / Short Video',
      content: `[00:00 - 00:05] Hook: Bạn muốn kinh doanh online nhưng chưa biết nhập hàng ở đâu giá rẻ tận gốc? Xem ngay video này!
[00:06 - 00:20] Thân bài: Thay vì mua qua trung gian, bạn chỉ cần lên 1688.com, dùng công cụ OrderChinaViet để xem giá xưởng đã quy đổi sang tiền Việt.
[00:21 - 00:40] Lợi ích: OrderChinaViet sẽ lo từ khâu đàm phán, thanh toán tiền tệ đến vận chuyển về kho Hà Nội/Sài Gòn chỉ trong 3-5 ngày.
[00:41 - 00:55] Kêu gọi: Link đăng ký tài khoản mình để ở phần Bio trang cá nhân hoặc truy cập ngay: ${partnerLink}`,
    },
    {
      id: 'video_2',
      title: 'Kịch Bản Short Video: "Khám Phá Kho Hàng Quảng Châu Siêu To Khổng Lồ"',
      duration: 'Thời lượng: 30 - 45 giây',
      badge: 'Gia Tăng Uy Tín',
      content: `[00:00 - 00:08] Quay cận cảnh kho hàng tập kết kiện hàng tại Quảng Châu.
[00:09 - 00:25] Lồng tiếng: Đây là kho tập kết hàng OrderChinaViet tại Quảng Châu với diện tích hơn 2.000m², quét mã vạch kiểm đếm tự động từng kiện hàng.
[00:26 - 00:40] Hàng về liên tục mỗi ngày, không lo thất lạc, đền bù 100%. Đăng ký tài khoản nhận ưu đãi cước vận chuyển tại link Bio nhé!
${partnerLink}`,
    },
  ];

  const bannerGraphics = [
    {
      title: 'Banner Bảng Cước Vận Chuyển Trung - Việt',
      format: '1200 x 630 px (Tỉ lệ 1.91:1)',
      usage: 'Chuẩn kích thước ảnh bìa Facebook, Zalo Page & bài đăng mạng xã hội',
      category: 'Banner Ngang',
      url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&auto=format&fit=crop&q=80',
    },
    {
      title: 'Graphic Mua Hàng 1688 - Taobao Chuyên Nghiệp',
      format: '1080 x 1080 px (Tỉ lệ 1:1 Vuông)',
      usage: 'Chuẩn kích thước bài đăng Instagram, Facebook Post & Zalo Feed',
      category: 'Ảnh Vuông',
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1080&auto=format&fit=crop&q=80',
    },
    {
      title: 'Kho Hàng Quảng Châu & Quy Trình Đóng Gói Barcode',
      format: '1080 x 1920 px (Tỉ lệ 9:16 Dọc)',
      usage: 'Chuẩn kích thước Story Facebook, Zalo, TikTok Video Cover & Reels',
      category: 'Story / Dọc',
      url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1080&auto=format&fit=crop&q=80',
    },
    {
      title: 'Bộ Logo Chuẩn Nhận Diện OrderChinaViet (PNG Trong Suốt)',
      format: 'Vector & PNG High-Resolution',
      usage: 'Chèn vào hình ảnh quảng cáo, video hoặc banner cá nhân hóa',
      category: 'Bộ Nhận Diện Logo',
      url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-800 animate-in fade-in duration-200">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. HEADER BANNER — MARKETING & MEDIA TOOLKIT                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>KHO TÀI NGUYÊN TIẾP THỊ CHUYÊN NGHIỆP</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Banner Quảng Cáo &amp; Mẫu Bài Tư Vấn Chuẩn Sale
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Toàn bộ mẫu bài đăng, kịch bản tư vấn và hình ảnh đều được tự động gắn <strong className="text-amber-300 font-mono">Mã đối tác {partnerCode}</strong> của bạn. Chỉ cần 1-Click sao chép hoặc chia sẻ thẳng sang Zalo/Facebook!
          </p>
        </div>

        {/* Quick Partner Link Box */}
        <div className="w-full lg:w-80 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-2 shrink-0">
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
            <span>Link Của Bạn Sẽ Tự Động Chèn:</span>
          </div>
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-white/10 font-mono text-[11px] text-emerald-300 truncate">
            {partnerLink}
          </div>
          <button
            onClick={() => copyToClipboard(partnerLink, 'header_link')}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            {copiedIndex === 'header_link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedIndex === 'header_link' ? 'Đã Copy Link' : 'Copy Link Cá Nhân'}</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. TAB NAVIGATION FILTER                                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'posts', label: 'Mẫu Bài Đăng Mạng Xã Hội', icon: FileText, count: '3 Bài' },
          { id: 'chats', label: 'Kịch Bản Chat Tư Vấn 1-1', icon: MessageCircle, count: '3 Mẫu' },
          { id: 'video', label: 'Kịch Bản Video Ngắn TikTok', icon: Video, count: '2 Mẫu' },
          { id: 'banners', label: 'Bộ Ảnh Banner & Logo HD', icon: ImageIcon, count: '4 Ảnh' },
          { id: 'guidelines', label: 'Quy Chuẩn Thương Hiệu', icon: ShieldCheck, count: 'Lưu Ý' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-100'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. TAB CONTENT: SOCIAL POST TEMPLATES                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Mẫu Bài Viết Đăng Facebook, Zalo &amp; Nhóm Sỉ
              </h2>
              <p className="text-xs text-slate-500">
                Nội dung đã được biên soạn tối ưu tỷ lệ chuyển đổi, kèm link giới thiệu của bạn
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
              Đã Nhúng Sẵn Link Đối Tác
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {socialPostTemplates.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs hover:border-amber-400/80 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Facebook / Zalo</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{item.target}</p>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto select-all">
                    {item.content}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => copyToClipboard(item.content, item.id)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedIndex === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedIndex === item.id ? 'Đã Sao Chép Toàn Bộ Bài Viết' : 'Sao Chép Bài Viết Này'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => shareToZalo(item.content)}
                      className="py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Gửi Zalo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => shareToFacebook(partnerLink)}
                      className="py-2 bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold text-[11px] rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Facebook</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. TAB CONTENT: 1-1 CHAT CLOSING SCRIPTS                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'chats' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Kịch Bản Chat &amp; Tư Vấn Chốt Đơn 1-1 Qua Zalo / Messenger
              </h2>
              <p className="text-xs text-slate-500">
                Dùng khi nhắn tin trao đổi riêng với khách hàng có nhu cầu nhập hàng Trung Quốc
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full self-start sm:self-auto">
              Chuẩn Quy Trình Sale 1-1
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {chatScriptTemplates.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs hover:border-blue-400/80 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full">
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">Chat 1-1</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{item.target}</p>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto select-all">
                    {item.content}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => copyToClipboard(item.content, item.id)}
                    className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedIndex === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedIndex === item.id ? 'Đã Copy' : 'Sao Chép'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => shareToZalo(item.content)}
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Mở Zalo Chat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. TAB CONTENT: SHORT VIDEO & TIKTOK SCRIPTS                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'video' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Kịch Bản Video Ngắn TikTok / Facebook Reels / YouTube Shorts
              </h2>
              <p className="text-xs text-slate-500">
                Kịch bản phân cảnh chi tiết theo giây giúp bạn tự quay hoặc lồng tiếng video thu hút hàng ngàn lượt xem
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full self-start sm:self-auto">
              Viral Short Video Script
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {videoScriptTemplates.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs hover:border-purple-400/80 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-full">
                      {item.badge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{item.duration}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto select-all">
                    {item.content}
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(item.content, item.id)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedIndex === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedIndex === item.id ? 'Đã Sao Chép Kịch Bản Video' : 'Sao Chép Kịch Bản Này'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. TAB CONTENT: BANNER GRAPHICS & LOGO KIT                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Bộ Hình Ảnh Banner &amp; Logo Thiết Kế Chuẩn Kích Thước
              </h2>
              <p className="text-xs text-slate-500">
                Hình ảnh sắc nét chất lượng cao dùng cho bài đăng mạng xã hội, ảnh bìa fanpage và story
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full self-start sm:self-auto">
              Hình Ảnh Độ Nét Cao (HD)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bannerGraphics.map((bn, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all space-y-3 p-4 sm:p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-52 rounded-2xl overflow-hidden relative border border-slate-200 bg-slate-900 group">
                    <img src={bn.url} alt={bn.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold font-mono px-2.5 py-1 rounded-lg border border-white/20">
                      {bn.category}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900">{bn.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{bn.usage}</p>
                    <div className="text-[11px] text-amber-700 font-mono font-bold mt-1">{bn.format}</div>
                  </div>
                </div>

                <a
                  href={bn.url}
                  target="_blank"
                  rel="noreferrer"
                  download={`Banner_OrderChinaViet_${idx + 1}.jpg`}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Tải Ảnh Gốc Về Máy (HD)</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 7. TAB CONTENT: BRAND GUIDELINES & COMPLIANCE                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'guidelines' && (
        <div className="space-y-6">
          <div className="pb-2 border-b border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Quy Chuẩn Thương Hiệu &amp; Nguyên Tắc Truyền Thông
            </h2>
            <p className="text-xs text-slate-500">
              Tuân thủ các nguyên tắc dưới đây giúp đối tác bảo vệ uy tín cá nhân và thương hiệu OrderChinaViet
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* DO's */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span>Những Điều NÊN LÀM:</span>
              </div>
              <ul className="space-y-2.5 text-xs text-emerald-950 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>Sử dụng đúng link tiếp thị có gắn mã ref để đảm bảo được ghi nhận hoa hồng tự động.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>Tư vấn trung thực về biểu phí vận chuyển và thời gian hàng về (Hà Nội 3-5 ngày, TP.HCM 4-7 ngày).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>Hướng dẫn khách hàng cài đặt Extension OrderChinaViet để tự tìm hàng và lên đơn thuận tiện.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>Chủ động kết nối khách hàng với bộ phận CSKH OrderChinaViet khi có các đơn hàng giá trị lớn hoặc yêu cầu đặc thù.</span>
                </li>
              </ul>
            </div>

            {/* DONT's */}
            <div className="bg-rose-50/80 border border-rose-200 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <div className="w-8 h-8 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span>Những Điều NGHIÊM CẤM:</span>
              </div>
              <ul className="space-y-2.5 text-xs text-rose-950 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <span>Không gửi tin nhắn spam hàng loạt gây phiền toái cho người dùng trên mạng xã hội.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <span>Không cam kết sai lệch về thời gian hàng về trong các giai đoạn bão lũ hoặc hải quan kiểm hóa đột xuất.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <span>Tuyệt đối không yêu cầu khách hàng chuyển tiền cọc vào tài khoản cá nhân của bạn (khách phải nạp trực tiếp qua ví hệ thống OCV).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <span>Không nhận vận chuyển các mặt hàng cấm theo quy định của pháp luật Việt Nam và Trung Quốc.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

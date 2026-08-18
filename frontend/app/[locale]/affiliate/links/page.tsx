'use client';

import { use, useState, useEffect } from 'react';
import {
  Link2,
  QrCode,
  Copy,
  Check,
  Sparkles,
  Share2,
  Download,
  ExternalLink,
  Globe,
  ShoppingBag,
  Truck,
  MessageCircle,
  Send,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { affiliateStore, AffiliateAccount } from '@/lib/affiliate-store';
import { getClientOrigin } from '@/lib/api-client';

export default function AffiliateLinksPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [affiliate, setAffiliate] = useState<AffiliateAccount | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [campaignTag, setCampaignTag] = useState('facebook_ad');
  const [copied, setCopied] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);

  useEffect(() => {
    const origin = getClientOrigin();
    setBaseUrl(origin);
    setTargetUrl(`${origin}/${locale}`);
    const current = affiliateStore.getAffiliate();
    setAffiliate(current);
  }, [locale]);

  const effectiveBaseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const partnerCode = affiliate?.affiliateCode || 'OCV_AFF_888888';
  const effectiveTargetUrl = targetUrl || `${effectiveBaseUrl}/${locale}`;

  // Clean double slashes in URL path
  const cleanTargetUrl = effectiveTargetUrl.trim().replace(/([^:]\/)\/+/g, '$1');
  const hasQuery = cleanTargetUrl.includes('?');
  const generatedLink = `${cleanTargetUrl}${hasQuery ? '&' : '?'}ref=${partnerCode}&utm_source=${campaignTag}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1-Click Social Share Handlers
  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(generatedLink)}`;
    window.open(url, '_blank', 'width=600,height=500,location=no,menubar=no');
  };

  const handleShareTelegram = (customText?: string) => {
    const text = customText || `Dịch vụ nhập hàng & vận chuyển Trung - Việt uy tín OrderChinaViet: ${generatedLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(generatedLink)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareZalo = (customText?: string) => {
    // Copy content and open Zalo Web/App
    const msg = customText || `Xin chào! Mình gửi bạn link đăng ký tài khoản OrderChinaViet để nhận ưu đãi cước vận chuyển & nguồn hàng tận gốc: ${generatedLink} (Mã giới thiệu: ${partnerCode})`;
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    window.open('https://chat.zalo.me', '_blank');
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'OrderChinaViet - Nhập Hàng Trung Quốc Tận Gốc',
          text: `Đăng ký tài khoản nhập hàng Trung Quốc qua link đối tác: ${partnerCode}`,
          url: generatedLink,
        });
      } catch (e) {
        // Fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const presetPages = [
    { label: 'Trang Chủ OrderChinaViet', url: `${effectiveBaseUrl}/${locale}` },
    { label: 'Trang Đăng Ký Tài Khoản Khách Hàng', url: `${effectiveBaseUrl}/${locale}/register` },
    { label: 'Biểu Phí Vận Chuyển Trung - Việt', url: `${effectiveBaseUrl}/${locale}/rates` },
    { label: 'Dịch Vụ Đặt Hàng 1688 Tận Xưởng', url: `${effectiveBaseUrl}/${locale}/services/1688` },
    { label: 'Dịch Vụ Vận Chuyển Trọn Gói', url: `${effectiveBaseUrl}/${locale}/services/van-chuyen` },
    { label: 'Tìm Kiếm & Nhập Hàng Tận Gốc', url: `${effectiveBaseUrl}/${locale}/search` },
    { label: 'Tuyển Dụng Cộng Tác Viên (Careers)', url: `${effectiveBaseUrl}/${locale}/careers` },
  ];

  const preWrittenMessages = [
    {
      title: 'Mẫu 1: Dành Cho Khách Mới Bắt Đầu Nhập Hàng 1688/Taobao',
      badge: 'Phổ Biến Nhất',
      content: `Chào bạn! Nếu bạn đang muốn tìm nguồn hàng kinh doanh tận xưởng từ 1688, Taobao, Tmall giá gốc thì hãy đăng ký tài khoản OrderChinaViet qua link này nhé: ${generatedLink}\n(Mã giới thiệu: ${partnerCode}). Bạn sẽ được đội ngũ hỗ trợ 1-1 tìm nguồn hàng, đàm phán giá xưởng và vận chuyển hàng về tận nơi rất nhanh chóng!`,
    },
    {
      title: 'Mẫu 2: Dành Cho Khách Đang Tìm Đơn Vị Vận Chuyển Cước Rẻ',
      badge: 'Tỷ Lệ Chuyển Đổi Cao',
      content: `Bên mình hiện đang có biểu phí vận chuyển hàng Trung Quốc - Việt Nam siêu ưu đãi, bao trọn gói từ xưởng Trung Quốc về đến tay bạn. Đăng ký tài khoản nhận báo giá trực tiếp tại đây: ${generatedLink} (Mã đối tác: ${partnerCode})!`,
    },
    {
      title: 'Mẫu 3: Lời Mời Ngắn Gọn Gửi Nhóm Zalo / Chat 1-1',
      badge: 'Ngắn Gọn',
      content: `Link đăng ký tài khoản nhập hàng OrderChinaViet nhận ngay ưu đãi phí dịch vụ: ${generatedLink}`,
    },
  ];

  const handleCopyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
          <Link2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Công Cụ Tiếp Thị Liên Kết</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Tạo Link Giới Thiệu &amp; Chia Sẻ Nhanh 1-Click</h1>
        <p className="text-xs text-slate-300 mt-1">
          Tạo đường dẫn giới thiệu riêng cho từng chiến dịch quảng cáo và chia sẻ tức thì lên Zalo, Facebook, Telegram chỉ với 1 cú click chuột.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Custom Link Generator & 1-Click Share */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center font-bold">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Trình Tạo Link Giới Thiệu Tùy Chọn</h2>
              <p className="text-xs text-slate-500">Chọn trang đích trên hệ thống OrderChinaViet và kênh quảng cáo</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chọn Trang Đích Mẫu Có Sẵn
              </label>
              <select
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer shadow-2xs"
              >
                {presetPages.map((preset, idx) => (
                  <option key={idx} value={preset.url}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kênh Quảng Cáo (UTM Campaign Tag)
              </label>
              <select
                value={campaignTag}
                onChange={(e) => setCampaignTag(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary-500 cursor-pointer shadow-2xs"
              >
                <option value="zalo_chat">Zalo Chat &amp; Nhóm Sỉ</option>
                <option value="facebook_ad">Facebook Post &amp; Ads</option>
                <option value="telegram_group">Telegram Channel &amp; Group</option>
                <option value="tiktok_bio">TikTok Bio Link</option>
                <option value="youtube_desc">YouTube Video Description</option>
                <option value="direct_client">Gửi Trực Tiếp Cho Khách Hàng</option>
              </select>
            </div>

            {/* Resulting Generated Link Output Box */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 border border-slate-800">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono">
                Link Giới Thiệu Của Bạn (Đã Tích Hợp Mã {partnerCode})
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full bg-slate-950 px-3 py-2.5 rounded-xl text-xs font-mono text-emerald-300 border border-slate-800 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã Copy' : 'Sao Chép'}</span>
                </button>
              </div>

              {/* ── 1-CLICK QUICK SHARE ACTION BUTTONS ── */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-400 mb-2">Chia Sẻ Nhanh 1-Click:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Zalo Share */}
                  <button
                    type="button"
                    onClick={() => handleShareZalo()}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Sao chép tin nhắn kèm link và mở Zalo Web"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Gửi Zalo</span>
                  </button>

                  {/* Facebook Share */}
                  <button
                    type="button"
                    onClick={handleShareFacebook}
                    className="p-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Đăng bài hoặc chia sẻ lên Facebook"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Facebook</span>
                  </button>

                  {/* Telegram Share */}
                  <button
                    type="button"
                    onClick={() => handleShareTelegram()}
                    className="p-2.5 bg-[#229ed9] hover:bg-[#1e8dbf] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title="Gửi vào nhóm hoặc tin nhắn Telegram"
                  >
                    <Send className="w-4 h-4" />
                    <span>Telegram</span>
                  </button>

                  {/* Native Mobile Share */}
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    title="Mở bảng chia sẻ của thiết bị"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-400" />
                    <span>Khác...</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right QR Code Generator Display */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4 flex flex-col items-center justify-between text-center">
          <div className="space-y-2 w-full">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold mx-auto">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Mã QR Code Quảng Cáo</h3>
            <p className="text-xs text-slate-500">Khách hàng quét mã này sẽ tự động được ghi nhận mã giới thiệu của bạn!</p>
          </div>

          {/* Dynamic Generated QR Visual Display */}
          <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-md space-y-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generatedLink)}`}
              alt="Affiliate QR Code"
              className="w-44 h-44 object-contain mx-auto rounded-lg"
            />
            <div className="text-[10px] font-mono font-bold text-slate-600 uppercase">
              {partnerCode}
            </div>
          </div>

          <a
            href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generatedLink)}`}
            target="_blank"
            download={`QR_${partnerCode}.png`}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Tải Ảnh Mã QR Code Về Máy</span>
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PRE-WRITTEN INVITATION MESSAGES SECTION                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Mẫu Tin Nhắn Mời Khách Hàng (Đã Soạn Sẵn Kèm Link)</h3>
              <p className="text-xs text-slate-500">Chỉ cần bấm 1-Click để sao chép hoặc gửi trực tiếp cho khách qua Zalo/Telegram</p>
            </div>
          </div>
          <span className="text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
            3 Kịch Bản Mẫu Chuẩn Sale
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {preWrittenMessages.map((msg, idx) => (
            <div
              key={idx}
              className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:border-amber-400/60 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700">
                    {msg.badge}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{msg.title}</h4>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line max-h-40 overflow-y-auto">
                  {msg.content}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => handleCopyMessage(msg.content, idx)}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                    copiedMsgIdx === idx
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {copiedMsgIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedMsgIdx === idx ? 'Đã Copy' : 'Copy Mẫu'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareZalo(msg.content)}
                  className="py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Gửi Zalo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { use, useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Headphones,
  Phone,
  MessageCircle,
  Send,
  Mail,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  LifeBuoy,
  MessageSquare,
  FileQuestion,
  ChevronDown,
  ChevronUp,
  Inbox,
  ShieldCheck,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { settingsStore, ContactSettings, DEFAULT_CONTACT_SETTINGS } from '@/lib/settings-store';
import { apiFetch } from '@/lib/api-client';

// Brand Assets
import whatsappImg from '@/assets/images/whatsapp.png';
import zaloImg from '@/assets/images/zalo.png';
import telegramImg from '@/assets/images/telegram.webp';
import wechatImg from '@/assets/images/wechat.webp';
import facebookImg from '@/assets/images/facebook.webp';

interface SupportTicket {
  id: string;
  disputeCode: string;
  category: string;
  title: string;
  description: string;
  status: 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';
  resolution?: string;
  createdAt: string;
}

export default function AffiliateSupportPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);

  // Settings State
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState('COMMISSION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tickets List State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // FAQ Expand State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    setSettings(settingsStore.getSettings());
    const handleSettingsUpdate = () => {
      setSettings(settingsStore.getSettings());
    };

    window.addEventListener('orderchinaviet_settings_updated', handleSettingsUpdate);
    void settingsStore.refreshSettings(true).then((data) => {
      if (data) setSettings(data);
    });

    fetchTickets();

    return () => {
      window.removeEventListener('orderchinaviet_settings_updated', handleSettingsUpdate);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await apiFetch('/operations/disputes');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTickets(json.data);
      }
    } catch (e) {
      console.warn('Lỗi tải danh sách yêu cầu hỗ trợ:', e);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getWhatsappUrl = (val: string) => {
    if (!val) return 'https://wa.me/84352308304';
    if (val.startsWith('http')) return val;
    const cleanNumber = val.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitSuccess(false);

    if (!title.trim() || !description.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ tiêu đề và nội dung cần hỗ trợ.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/operations/disputes', {
        method: 'POST',
        body: JSON.stringify({
          category,
          title: `[Affiliate] ${title.trim()}`,
          description: description.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Không thể gửi yêu cầu hỗ trợ');
      }

      setSubmitSuccess(true);
      setTitle('');
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi gửi yêu cầu hỗ trợ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Đã Xử Lý
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            Đang Xử Lý
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Từ Chối
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Chờ Tiếp Nhận
          </span>
        );
    }
  };

  const faqs = [
    {
      q: 'Làm thế nào để tôi nhận được hoa hồng đối tác?',
      a: 'Khi bạn chia sẻ Link hoặc Mã QR cá nhân, khách hàng đăng ký và hoàn tất đơn hàng vận chuyển/mua hộ, hệ thống sẽ tự động trích từ 30% đến 50% hoa hồng trên phí dịch vụ vào ví của bạn.',
    },
    {
      q: 'Khi nào tôi được mở khóa rút 250.000 ₫ tiền thưởng đăng ký?',
      a: 'Tiền thưởng 250.000 ₫ được tặng ngay khi bạn tạo tài khoản đối tác thành công. Để mở khóa rút về tài khoản ngân hàng, bạn chỉ cần giới thiệu tối thiểu 3 khách hàng đầu tiên phát sinh đơn hàng tại OrderChinaViet.',
    },
    {
      q: 'Chính sách lương cố định 2.000.000 ₫/tháng áp dụng như thế nào?',
      a: 'Đối tác đã ký hợp đồng CTV tiếp thị chỉ cần chấm công online hằng ngày tại mục "Chấm Công". Lương cơ bản 2.000.000 ₫ sẽ được tính theo tỷ lệ số ngày làm việc thực tế và quyết toán vào ngày 05 hằng tháng.',
    },
    {
      q: 'Tôi có thể rút tiền về những ngân hàng nào và mất bao lâu?',
      a: 'Hệ thống hỗ trợ rút tiền về tất cả các ngân hàng nội địa Việt Nam (MB, Vietcombank, Techcombank, ACB, VPBank,...) qua cổng VietQR Napas247 tự động 24/7 chỉ trong 1–3 phút sau khi Admin duyệt.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200 pb-12">
      {/* ── TOP HERO HEADER ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Headphones className="w-3.5 h-3.5" />
              <span>Affiliate Helpdesk &amp; Support 24/7</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Trung Tâm Hỗ Trợ Đối Tác Tiếp Thị
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Đội ngũ Quản trị viên &amp; Chuyên viên CSKH OrderChinaViet luôn sẵn sàng hỗ trợ bạn về hoa hồng, công cụ tiếp thị, khiếu nại và kỹ thuật 24/7.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
              <span className="block text-xs text-slate-400 font-medium">Thời gian phản hồi</span>
              <span className="text-sm font-bold text-emerald-400">Dưới 5 phút</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center">
              <span className="block text-xs text-slate-400 font-medium">Kênh hỗ trợ</span>
              <span className="text-sm font-bold text-sky-400">Đa Kênh 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK CONTACT CHANNELS (COMPACT & NEAT) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">1. Kênh Liên Hệ Nhanh Trực Tiếp</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Hỗ trợ đa kênh 24/7 từ Ban Quản Trị
          </span>
        </div>

        {/* Compact Grid of Contact Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
          {/* WhatsApp */}
          {settings.showWhatsappLink !== false && (
            <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1 shrink-0">
                  <Image src={whatsappImg} alt="WhatsApp" width={20} height={20} className="w-full h-full object-contain" />
                </div>
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                  WhatsApp
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">WhatsApp</span>
                <span className="text-[10px] text-slate-500 font-mono block truncate" title={settings.whatsappLink || '+84 352 308 304'}>
                  {settings.whatsappLink || '+84 352 308 304'}
                </span>
              </div>
              <a
                href={getWhatsappUrl(settings.whatsappLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Chat</span>
              </a>
            </div>
          )}

          {/* Zalo */}
          {settings.showZaloLink !== false && (
            <div className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center p-1 shrink-0">
                  <Image src={zaloImg} alt="Zalo" width={20} height={20} className="w-full h-full object-contain" />
                </div>
                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md">
                  Zalo
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">Zalo Chat</span>
                <span className="text-[10px] text-slate-500 font-mono block truncate" title={settings.zaloLink || '0352308304'}>
                  {settings.zaloLink || '0352308304'}
                </span>
              </div>
              <a
                href={(settings.zaloLink || 'https://zalo.me/84352308304').startsWith('http') ? (settings.zaloLink || 'https://zalo.me/84352308304') : `https://${settings.zaloLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Mở Zalo</span>
              </a>
            </div>
          )}

          {/* Telegram */}
          {settings.showTelegramLink !== false && (
            <div className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center p-1 shrink-0">
                  <Image src={telegramImg} alt="Telegram" width={20} height={20} className="w-full h-full object-contain" />
                </div>
                <span className="text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded-md">
                  Telegram
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">Telegram</span>
                <span className="text-[10px] text-slate-500 font-mono block truncate" title={settings.telegramLink || '@orderchinaviet'}>
                  {settings.telegramLink || '@orderchinaviet'}
                </span>
              </div>
              <a
                href={(settings.telegramLink || 'https://t.me/orderchinaviet').startsWith('http') ? (settings.telegramLink || 'https://t.me/orderchinaviet') : `https://${settings.telegramLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 px-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Mở Chat</span>
              </a>
            </div>
          )}

          {/* WeChat */}
          {settings.showWechatId !== false && (
            <div className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1 shrink-0">
                  <Image src={wechatImg} alt="WeChat" width={20} height={20} className="w-full h-full object-contain" />
                </div>
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                  WeChat
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">WeChat ID</span>
                <span className="text-[10px] text-slate-500 font-mono block truncate" title={settings.wechatId || 'VN_Logistics_CN'}>
                  {settings.wechatId || 'VN_Logistics_CN'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(settings.wechatId || 'VN_Logistics_CN', 'wechat')}
                className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {copiedKey === 'wechat' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'wechat' ? 'Đã Chép' : 'Chép ID'}</span>
              </button>
            </div>
          )}

          {/* Hotline */}
          {settings.showHotline !== false && (
            <div className="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded-md">
                  Hotline
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">Tổng Đài</span>
                <span className="text-[10px] text-slate-500 font-mono block truncate" title={settings.hotline || '+84 352 308 304'}>
                  {settings.hotline || '+84 352 308 304'}
                </span>
              </div>
              <a
                href={`tel:${(settings.hotline || '+84352308304').replace(/\s+/g, '')}`}
                className="w-full py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Phone className="w-3 h-3" />
                <span>Gọi Ngay</span>
              </a>
            </div>
          )}

          {/* Email */}
          {settings.showEmail !== false && (
            <div className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md">
                  Email
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">Email CSKH</span>
                <span className="text-[10px] text-slate-500 font-mono block truncate" title={settings.email || 'support@orderchinaviet.com'}>
                  {settings.email || 'support@orderchinaviet.com'}
                </span>
              </div>
              <a
                href={`mailto:${settings.email || 'support@orderchinaviet.com'}`}
                className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Mail className="w-3 h-3" />
                <span>Gửi Mail</span>
              </a>
            </div>
          )}

          {/* Facebook */}
          {settings.showFacebookLink !== false && (
            <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center p-1 shrink-0">
                  <Image src={facebookImg} alt="Facebook" width={20} height={20} className="w-full h-full object-contain" />
                </div>
                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                  Cộng Đồng
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">Facebook</span>
                <span className="text-[10px] text-slate-500 block truncate" title="Group & Fanpage">
                  Group Đối Tác
                </span>
              </div>
              <a
                href={(settings.facebookLink || 'https://facebook.com/orderchinaviet').startsWith('http') ? (settings.facebookLink || 'https://facebook.com/orderchinaviet') : `https://${settings.facebookLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Vào Group</span>
              </a>
            </div>
          )}
        </div>

        {/* Slim Info Bar for Working Hours & Warehouse Locations */}
        <div className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span><strong>Giờ hỗ trợ:</strong> {settings.workingHours || 'Thứ 2 – Thứ 7: 8:00 AM – 18:00 PM'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate"><strong>Kho VN:</strong> {settings.addressVietnam || '22 Hữu Nghị, Móng Cái 1, Quảng Ninh'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate"><strong>Kho TQ:</strong> {settings.addressChina || 'Dongxing, Guangxi, China'}</span>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN: TICKET FORM & TICKET HISTORY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: SUBMIT TICKET FORM (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">2. Gửi Yêu Cầu Hỗ Trợ Trực Tuyến</h2>
              <p className="text-xs text-slate-500 font-medium">Báo cáo thắc mắc hoặc yêu cầu kiểm tra hoa hồng</p>
            </div>
          </div>

          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Gửi yêu cầu hỗ trợ thành công!</strong>
                <span>Ban quản trị và CSKH đã nhận được thông báo qua Telegram và sẽ phản hồi bạn trong thời gian sớm nhất.</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Danh Mục Hỗ Trợ <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
              >
                <option value="COMMISSION">Hoa Hồng &amp; Đối Soát Rút Tiền</option>
                <option value="TRACKING">Link Giới Thiệu, Mã QR &amp; Lượt Click</option>
                <option value="REFERRAL">Hỗ Trợ Khách Hàng Tuyến Dưới</option>
                <option value="SALARY">Lương Cố Định &amp; Chấm Công</option>
                <option value="TECHNICAL">Lỗi Kỹ Thuật / Tài Khoản</option>
                <option value="OTHER">Thắc Mắc &amp; Góp Ý Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tiêu Đề Yêu Cầu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Kiểm tra hoa hồng đơn hàng ORD-123456"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nội Dung Chi Tiết <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả cụ thể vấn đề hoặc thông tin khách hàng cần hỗ trợ để CSKH xử lý nhanh chóng..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang Gửi Yêu Cầu...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Yêu Cầu Hỗ Trợ Ngay</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT: TICKET HISTORY & FAQ (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TICKET HISTORY */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">Lịch Sử Yêu Cầu Đã Gửi</h3>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {tickets.length} yêu cầu
              </span>
            </div>

            {loadingTickets ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Đang tải lịch sử yêu cầu...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p>Bạn chưa gửi yêu cầu hỗ trợ nào.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-2xl space-y-2 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mr-2">
                          {t.disputeCode}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{t.title}</span>
                      </div>
                      {statusBadge(t.status)}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{t.description}</p>
                    {t.resolution && (
                      <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                        <strong className="block text-[11px] text-emerald-700 font-bold">Phản hồi từ Ban Quản Trị:</strong>
                        <span>{t.resolution}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 text-right">
                      {new Date(t.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FAQ SECTION */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <FileQuestion className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Câu Hỏi Thường Gặp Của Đối Tác (FAQ)</h3>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, idx) => {
                const isExpanded = expandedFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left text-xs font-bold text-slate-800 transition-colors cursor-pointer gap-3"
                    >
                      <span>{faq.q}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 py-3 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { use, useState, useEffect } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  X,
  Search,
  RotateCcw,
  Send,
  Truck,
  ShoppingBag,
  Wallet,
  Award,
  HelpCircle,
  XCircle,
  ExternalLink,
  ChevronDown,
  Filter,
  MessageSquare,
  Package,
  Layers,
  Sparkles,
  LifeBuoy,
  Headphones,
  Phone,
  Mail,
  Copy,
  Check,
  MapPin,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { apiFetch } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';
import { notificationStore } from '@/lib/notification-store';
import { settingsStore, ContactSettings, DEFAULT_CONTACT_SETTINGS } from '@/lib/settings-store';

// Brand Assets
import whatsappImg from '@/assets/images/whatsapp.png';
import zaloImg from '@/assets/images/zalo.png';
import telegramImg from '@/assets/images/telegram.webp';
import wechatImg from '@/assets/images/wechat.webp';
import facebookImg from '@/assets/images/facebook.webp';

export interface DisputeItem {
  id: string;
  disputeCode: string;
  category: string;
  parentCategory: string;
  typeLabel: string;
  parcelCode?: string;
  title: string;
  description: string;
  status: 'OPEN' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';
  statusLabel: string;
  statusClass: string;
  createdAt: string;
  updatedAt: string;
  adminReply?: string;
}

export interface DisputeCategoryGroup {
  id: string;
  name: string;
  badge: string;
  icon: any;
  placeholderCode: string;
  codeLabel: string;
  items: {
    value: string;
    label: string;
    description: string;
  }[];
}

export const DISPUTE_CATEGORY_GROUPS: DisputeCategoryGroup[] = [
  {
    id: 'SHIPPING',
    name: 'Vận Chuyển & Giao Nhận',
    badge: 'Logistics',
    icon: Truck,
    codeLabel: 'Mã Kiện Hàng / Vận Đơn TQ',
    placeholderCode: 'Ví dụ: SF12345678, YT987654321, OCV-PARCEL-...',
    items: [
      { value: 'SHIPPING_DELAY', label: 'Vận Chuyển Chậm Trễ', description: 'Kiện hàng về chậm quá lịch trình cam kết xuất kho' },
      { value: 'SHIPPING_DAMAGED', label: 'Hàng Bị Hư Hỏng / Bể Vỡ', description: 'Móp méo, rách bao bì, ướt hoặc vỡ nát trong quá trình vận chuyển' },
      { value: 'SHIPPING_LOST', label: 'Thất Lạc Kiện Hàng', description: 'Mã vận đơn không cập nhật hành trình hoặc thất lạc tại kho' },
      { value: 'SHIPPING_WRONG_WEIGHT', label: 'Sai Lệch Cân Nặng / Thể Tích', description: 'Khối lượng tính cước chênh lệch so với thực tế nhận hàng' },
      { value: 'SHIPPING_WRONG_ADDRESS', label: 'Giao Nhầm Địa Chỉ / Shipper', description: 'Giao sai người nhận hoặc shipper không liên hệ giao hàng' },
    ],
  },
  {
    id: 'ORDER',
    name: 'Đơn Mua Hộ (1688 / Taobao / Tmall)',
    badge: 'Mua Hộ',
    icon: ShoppingBag,
    codeLabel: 'Mã Đơn Mua Hộ (Order Code)',
    placeholderCode: 'Ví dụ: ORD-1786938..., OCV-BUY-...',
    items: [
      { value: 'ORDER_WRONG_ITEM', label: 'Giao Sai Mẫu / Sai Màu / Sai Size', description: 'Sản phẩm nhận được không đúng với link hoặc phân loại đã đặt' },
      { value: 'ORDER_MISSING_QUANTITY', label: 'Shop Giao Thiếu Số Lượng', description: 'Số lượng sản phẩm trong kiện ít hơn số lượng đặt mua' },
      { value: 'ORDER_SELLER_NOT_SHIPPED', label: 'Shop Trung Quốc Không Phát Hàng', description: 'Người bán trì hoãn giao hàng hoặc cung cấp mã vận đơn ảo' },
      { value: 'ORDER_PRICE_DISPUTE', label: 'Sai Lệch Giá Mua Hộ', description: 'Chênh lệch giữa giá trên web sàn và tiền trừ trong ví' },
      { value: 'ORDER_RETURN_REFUND', label: 'Yêu Cầu Đổi Trả & Hoàn Tiền', description: 'Đổi trả hàng cho shop Trung Quốc và thu hồi tiền hàng' },
    ],
  },
  {
    id: 'FINANCE',
    name: 'Tài Chính, Ví Tiền & Nạp Rút',
    badge: 'Ví & Nạp Rút',
    icon: Wallet,
    codeLabel: 'Mã Giao Dịch / Lệnh Nạp Rút',
    placeholderCode: 'Ví dụ: DEP-178..., WDR-178..., Mã giao dịch ngân hàng',
    items: [
      { value: 'FINANCE_DEPOSIT_NOT_CREDITED', label: 'Nạp Tiền Chưa Cộng Số Dư', description: 'Đã chuyển khoản thành công qua ngân hàng/VietQR nhưng ví chưa tăng tiền' },
      { value: 'FINANCE_WITHDRAWAL_DELAY', label: 'Yêu Cầu Rút Tiền Chậm Trễ', description: 'Lệnh rút tiền về tài khoản ngân hàng quá thời gian quy định' },
      { value: 'FINANCE_EXCHANGE_RATE', label: 'Thắc Mắc Tỷ Giá / Đổi Tiền Alipay', description: 'Tỷ giá áp dụng không khớp hoặc giao dịch đổi tiền có vấn đề' },
      { value: 'FINANCE_WRONG_DEDUCTION', label: 'Bị Trừ Tiền Không Rõ Lý Do', description: 'Trừ tiền sai đơn hàng hoặc trừ trùng nhiều lần' },
    ],
  },
  {
    id: 'AFFILIATE',
    name: 'Tiếp Thị Liên Kết (Affiliate Partner)',
    badge: 'Đối Tác',
    icon: Award,
    codeLabel: 'Mã Đối Tác / Mã Khách Tuyến Dưới',
    placeholderCode: 'Ví dụ: OCV_AFF_..., OCV123456...',
    items: [
      { value: 'AFFILIATE_MISSING_COMMISSION', label: 'Thiếu Hoa Hồng Đơn Khách Giới Thiệu', description: 'Khách tuyến dưới đã hoàn tất đơn nhưng hoa hồng chưa cộng vào ví' },
      { value: 'AFFILIATE_LINK_TRACKING', label: 'Lỗi Link / Mã QR Không Ghi Nhận', description: 'Khách hàng đăng ký qua link ref nhưng không vào danh sách thành viên' },
      { value: 'AFFILIATE_BONUS_UNLOCK', label: 'Mở Khóa Thưởng 250.000 ₫', description: 'Đã đạt điều kiện 3 khách phát sinh đơn nhưng chưa mở khóa rút tiền' },
      { value: 'AFFILIATE_SALARY_ATTENDANCE', label: 'Thắc Mắc Chấm Công & Lương Cứng', description: 'Sai lệch số ngày công hoặc mức lương cứng 2.000.000 ₫' },
    ],
  },
  {
    id: 'OTHER',
    name: 'Dịch Vụ, Tài Khoản & Khác',
    badge: 'Hỗ Trợ',
    icon: HelpCircle,
    codeLabel: 'Mã Tham Chiếu (Nếu Có)',
    placeholderCode: 'Mã đơn hàng, mã khiếu nại hoặc thông tin liên quan',
    items: [
      { value: 'ACCOUNT_LOGIN_ISSUE', label: 'Lỗi Tài Khoản / Đăng Nhập', description: 'Không nhận được mã xác thực, quên mật khẩu hoặc tài khoản bị khóa' },
      { value: 'CUSTOMER_SERVICE_FEEDBACK', label: 'Góp Ý Thái Độ Phục Vụ CSKH', description: 'Phản ánh thái độ làm việc của nhân viên hỗ trợ / kho bãi' },
      { value: 'OTHER_INQUIRY', label: 'Các Yêu Cầu Khác', description: 'Những vấn đề khác chưa được phân loại ở các mục trên' },
    ],
  },
];

export default function DisputesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [parentCategoryFilter, setParentCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Contact Settings State
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State
  const [parentCategory, setParentCategory] = useState<string>('SHIPPING');
  const [subCategory, setSubCategory] = useState<string>('SHIPPING_DELAY');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const [disputes, setDisputes] = useState<DisputeItem[]>([]);

  // Get active parent group
  const activeParentGroup = DISPUTE_CATEGORY_GROUPS.find((g) => g.id === parentCategory) || DISPUTE_CATEGORY_GROUPS[0];
  const activeSubItem = activeParentGroup.items.find((i) => i.value === subCategory) || activeParentGroup.items[0];

  const findSubItemInfo = (val: string) => {
    for (const g of DISPUTE_CATEGORY_GROUPS) {
      const match = g.items.find((item) => item.value === val);
      if (match) return { group: g, item: match };
    }
    return null;
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

  const fetchDisputes = async () => {
    try {
      const response = await apiFetch('/operations/disputes');
      if (!response.ok) throw new Error('Không thể tải khiếu nại');
      const json = await response.json();

      setDisputes(
        json.data.map((item: any) => {
          const info = findSubItemInfo(item.category);
          const typeLabel = info ? `${info.group.name} - ${info.item.label}` : item.category;
          const parentCategory = info ? info.group.id : 'OTHER';

          let statusLabel = 'Chờ Tiếp Nhận';
          let statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
          if (item.status === 'RESOLVED') {
            statusLabel = 'Đã Giải Quyết';
            statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          } else if (item.status === 'PROCESSING') {
            statusLabel = 'Đang Xử Lý';
            statusClass = 'bg-sky-50 text-sky-700 border-sky-200';
          } else if (item.status === 'REJECTED') {
            statusLabel = 'Từ Chối';
            statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
          }

          return {
            id: item.id,
            disputeCode: item.disputeCode,
            category: item.category,
            parentCategory,
            typeLabel,
            title: item.title,
            parcelCode: item.parcelId || undefined,
            description: item.description,
            status: item.status,
            statusLabel,
            statusClass,
            createdAt: new Date(item.createdAt).toLocaleString('vi-VN'),
            updatedAt: new Date(item.updatedAt).toLocaleString('vi-VN'),
            adminReply: item.resolution,
          };
        })
      );
    } catch (err) {
      console.error('Lỗi khi tải khiếu nại:', err);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSettings(settingsStore.getSettings());
    const handleSettingsUpdate = () => setSettings(settingsStore.getSettings());
    window.addEventListener('orderchinaviet_settings_updated', handleSettingsUpdate);
    void settingsStore.refreshSettings(true).then((data) => {
      if (data) setSettings(data);
    });

    fetchDisputes();

    return () => {
      window.removeEventListener('orderchinaviet_settings_updated', handleSettingsUpdate);
    };
  }, []);

  const handleParentCategoryChange = (newParent: string) => {
    setParentCategory(newParent);
    const group = DISPUTE_CATEGORY_GROUPS.find((g) => g.id === newParent) || DISPUTE_CATEGORY_GROUPS[0];
    if (group.items.length > 0) {
      setSubCategory(group.items[0].value);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!description.trim()) {
      setFormError('Vui lòng nhập nội dung mô tả chi tiết vấn đề.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedItem = activeParentGroup.items.find((i) => i.value === subCategory) || activeParentGroup.items[0];
      const finalTitle = customTitle.trim() || `[${activeParentGroup.name}] ${selectedItem.label}`;

      const response = await apiFetch('/operations/disputes', {
        method: 'POST',
        body: JSON.stringify({
          category: subCategory,
          parcelCode: referenceCode.trim() || undefined,
          title: finalTitle,
          description: description.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Không thể tạo khiếu nại');
      }

      setModalOpen(false);
      setReferenceCode('');
      setCustomTitle('');
      setDescription('');
      fetchDisputes();
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi tạo khiếu nại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    // Search
    const term = search.toLowerCase().trim();
    if (term) {
      const matchCode = d.disputeCode?.toLowerCase().includes(term);
      const matchTitle = d.title?.toLowerCase().includes(term);
      const matchDesc = d.description?.toLowerCase().includes(term);
      const matchParcel = d.parcelCode?.toLowerCase().includes(term);
      if (!matchCode && !matchTitle && !matchDesc && !matchParcel) return false;
    }

    // Parent Category Filter
    if (parentCategoryFilter !== 'ALL' && d.parentCategory !== parentCategoryFilter) return false;

    // Status Filter
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;

    return true;
  });

  const stats = {
    total: disputes.length,
    open: disputes.filter((d) => d.status === 'OPEN').length,
    processing: disputes.filter((d) => d.status === 'PROCESSING').length,
    resolved: disputes.filter((d) => d.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-6 text-slate-800 animate-in fade-in duration-200 pb-12">
      {/* ── TOP HEADER CARD ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Trung Tâm Hỗ Trợ &amp; Khiếu Nại Đơn Hàng</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Kênh liên hệ trực tiếp và tiếp nhận xử lý khiếu nại về Vận chuyển, Đơn mua hộ, Tài chính hoặc Đối tác.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError('');
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Khiếu Nại Mới</span>
        </button>
      </div>

      {/* ── SECTION 1: KÊNH LIÊN HỆ NHANH TRỰC TIẾP (FROM ADMIN SETTINGS & ASSETS) ── */}
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
                  Fanpage CSKH
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

      {/* ── SECTION 2: MINI KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs ${statusFilter === 'ALL' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Tổng Yêu Cầu</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{stats.total}</span>
        </div>

        <div
          onClick={() => setStatusFilter('OPEN')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs ${statusFilter === 'OPEN' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold text-amber-700 uppercase block">Chờ Tiếp Nhận</span>
          <span className="text-xl font-bold text-amber-600 font-mono mt-0.5 block">{stats.open}</span>
        </div>

        <div
          onClick={() => setStatusFilter('PROCESSING')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs ${statusFilter === 'PROCESSING' ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold text-sky-700 uppercase block">Đang Xử Lý</span>
          <span className="text-xl font-bold text-sky-600 font-mono mt-0.5 block">{stats.processing}</span>
        </div>

        <div
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-4 bg-white rounded-2xl border transition-all cursor-pointer shadow-2xs ${statusFilter === 'RESOLVED' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
            }`}
        >
          <span className="text-[11px] font-bold text-emerald-700 uppercase block">Đã Giải Quyết</span>
          <span className="text-xl font-bold text-emerald-600 font-mono mt-0.5 block">{stats.resolved}</span>
        </div>
      </div>

      {/* ── SECTION 3: SEARCH & MULTI-LEVEL FILTER TOOLBAR ── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã DSP-..., mã kiện, mã đơn, nội dung..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>

          {/* Parent Category Filter Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={parentCategoryFilter}
              onChange={(e) => setParentCategoryFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Tất cả Nhóm Khiếu Nại</option>
              <option value="SHIPPING">Vận Chuyển &amp; Giao Nhận</option>
              <option value="ORDER">Đơn Hàng Mua Hộ (1688 / Taobao)</option>
              <option value="FINANCE">Tài Chính, Ví Tiền &amp; Nạp Rút</option>
              <option value="AFFILIATE">Tiếp Thị Liên Kết (Affiliate)</option>
              <option value="OTHER">Dịch Vụ &amp; Khác</option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
            >
              <option value="ALL">Tất cả Trạng Thái</option>
              <option value="OPEN">Chờ Tiếp Nhận</option>
              <option value="PROCESSING">Đang Xử Lý</option>
              <option value="RESOLVED">Đã Giải Quyết</option>
              <option value="REJECTED">Bị Từ Chối</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: DISPUTES LIST ── */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-3">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-medium">Đang tải danh sách khiếu nại...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 stroke-1.5" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-800">Chưa có yêu cầu khiếu nại nào</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Nếu phát sinh sự cố về Vận chuyển, Đơn mua hộ hoặc Ví tiền, bạn có thể bấm nút &quot;Tạo Khiếu Nại Mới&quot; bên trên để Ban Quản Trị hỗ trợ giải quyết ngay.
              </p>
            </div>
          </div>
        ) : (
          filteredDisputes.map((d) => {
            const info = findSubItemInfo(d.category);
            const GroupIcon = info ? info.group.icon : AlertCircle;

            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl sm:rounded-3xl shadow-2xs border border-slate-200 hover:border-slate-300 p-5 sm:p-6 space-y-3.5 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-rose-600 text-xs sm:text-sm bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                      {d.disputeCode}
                    </span>

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${d.statusClass}`}>
                      {d.statusLabel}
                    </span>

                    {info && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                        <GroupIcon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{info.group.name}</span>
                      </span>
                    )}

                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                      {info ? info.item.label : d.category}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">{d.createdAt}</span>
                </div>

                {/* Body Row */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">{d.title}</h3>

                  {d.parcelCode && (
                    <p className="text-xs font-bold text-slate-600">
                      Mã Tham Chiếu / Kiện Hàng: <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">{d.parcelCode}</span>
                    </p>
                  )}

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-line">
                    {d.description}
                  </p>
                </div>

                {/* Admin Reply Section */}
                {d.adminReply && (
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px] uppercase tracking-wide">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Phản hồi từ OrderChinaViet Admin:</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-line">{d.adminReply}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── CREATE DISPUTE MODAL (TWO-TIER DROPDOWN) ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Tạo Yêu Cầu Khiếu Nại</h3>
                  <p className="text-xs text-slate-500 font-medium">Chọn nhóm vấn đề và nhập chi tiết để CSKH xử lý</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDispute} className="space-y-4">
              {/* 1. Parent Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Nhóm Vấn Đề Khiếu Nại <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={parentCategory}
                  onChange={(e) => handleParentCategoryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                >
                  {DISPUTE_CATEGORY_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Sub-Item / Child Reason Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Lý Do / Sự Cố Cụ Thể <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                >
                  {activeParentGroup.items.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                {activeSubItem?.description && (
                  <p className="text-[11px] text-slate-500 mt-1 italic pl-1">
                    Ghi chú: {activeSubItem.description}
                  </p>
                )}
              </div>

              {/* 3. Reference Code Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. {activeParentGroup.codeLabel}
                </label>
                <input
                  type="text"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value)}
                  placeholder={activeParentGroup.placeholderCode}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              {/* 4. Custom Title (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  4. Tiêu Đề Khiếu Nại (Tùy Chọn)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={`Mặc định: [${activeParentGroup.name}] ${activeSubItem.label}`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              {/* 5. Detailed Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  5. Mô Tả Chi Tiết Sự Cố &amp; Bằng Chứng <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả cụ thể sự việc: số lượng hàng bị ảnh hưởng, tình trạng bao bì khi nhận, mã bill chuyển khoản, thời gian phát sinh sự cố..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-rose-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang Gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi Khiếu Nại Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

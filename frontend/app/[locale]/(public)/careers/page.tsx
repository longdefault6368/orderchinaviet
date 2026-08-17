'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Briefcase,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  HelpCircle,
  Clock,
  DollarSign,
  Award,
  GraduationCap,
  HeartHandshake,
  Send,
  Building2,
  MapPin,
  Phone,
  Mail,
  User,
  AlertCircle,
  FileText,
  Calculator,
  MessageCircle,
  QrCode,
  Share2,
  Headphones,
  Check,
  ChevronDown,
  Star,
  Gift,
  ExternalLink,
  ChevronRight,
  BadgeCheck,
  Layers,
  Compass,
  Copy,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { FloatingContact } from '@/components/common/FloatingContact';
import { PageHeroBanner } from '@/components/common/PageHeroBanner';
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

const VIETNAM_PROVINCES = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
  'Tỉnh/Thành khác / Nước ngoài',
];

export default function CareersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Income Calculator Simulation State - Expanded scale
  const [simCustomers, setSimCustomers] = useState<number>(15);
  const [simWeight, setSimWeight] = useState<number>(1000);

  // Application Form State
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    position: 'Cộng tác viên kinh doanh Online (Remote)',
    city: 'Hà Nội',
    experience: 'Dưới 1 năm / Chưa có kinh nghiệm (Được đào tạo)',
    note: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    setSettings(settingsStore.getSettings());
    const handleUpdate = () => setSettings(settingsStore.getSettings());
    window.addEventListener('orderchinaviet_settings_updated', handleUpdate);
    void settingsStore.refreshSettings(true).then((data) => {
      if (data) setSettings(data);
    });

    const currentUser = authStore.getUser();
    if (currentUser) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || currentUser.fullName || '',
        phone: prev.phone || currentUser.phone || '',
        email: prev.email || currentUser.email || '',
      }));
    }
    return () => window.removeEventListener('orderchinaviet_settings_updated', handleUpdate);
  }, []);

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

  // Realistic Scalable Income Formula:
  // Base Salary = 2,000,000 VND
  // Commission = simWeight * 6,000 VND + simCustomers * 150,000 VND
  // Progressive KPI Bonus for high performers
  const calculatedBaseSalary = 2000000;
  const calculatedCommission = Math.round(simWeight * 6000 + simCustomers * 150000);
  const calculatedKpiBonus =
    simWeight >= 10000
      ? 25000000
      : simWeight >= 5000
        ? 12000000
        : simWeight >= 2500
          ? 6000000
          : simWeight >= 1000
            ? 3000000
            : simWeight >= 400
              ? 1500000
              : simWeight >= 200
                ? 800000
                : 0;
  const calculatedTotalIncome = calculatedBaseSalary + calculatedCommission + calculatedKpiBonus;

  const handleSelectPosition = (posName: string) => {
    setForm((prev) => ({ ...prev, position: posName }));
    const formElem = document.getElementById('apply-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!form.fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn');
      return;
    }
    if (!form.phone.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại hoặc Zalo liên hệ');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(
        '/cms/job-applications',
        {
          method: 'POST',
          body: JSON.stringify(form),
        },
        false
      );

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Gửi hồ sơ ứng tuyển thất bại');
      }

      setSubmitSuccess(resData.data);
      notificationStore.addNotification({
        title: 'Nộp Hồ Sơ Thành Công',
        message: `Đã gửi hồ sơ ứng tuyển vị trí [${form.position}]. Bộ phận tuyển dụng sẽ liên hệ trong 24 giờ.`,
        type: 'SYSTEM',
        targetRole: 'CUSTOMER',
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  const FAQS = [
    {
      q: 'Điều kiện để nhận lương cơ bản 2.000.000 ₫/tháng là gì?',
      a: 'Bạn chỉ cần hoàn thành các bước chấm công online hằng ngày tại mục "Chấm Công" và duy trì hỗ trợ khách hàng. Khoản lương cứng 2.000.000 ₫ được thanh toán thẳng vào tài khoản ngân hàng của bạn vào ngày 05 hằng tháng.',
    },
    {
      q: 'Tôi chưa có kinh nghiệm nhập hàng Trung Quốc có làm được không?',
      a: 'Hoàn toàn được! OrderChinaViet có chương trình đào tạo "Cầm tay chỉ việc" online từ A-Z: Cách tìm nguồn hàng xưởng 1688/Taobao tận gốc, cách tư vấn tính giá cước và cách sử dụng link/mã QR tiếp thị độc quyền.',
    },
    {
      q: 'Tiền hoa hồng đơn hàng được thanh toán như thế nào?',
      a: 'Hoa hồng được cộng realtime vào ví đối tác của bạn ngay khi đơn hàng của khách phát sinh và giao thành công. Bạn có thể bấm lệnh Rút tiền về bất kỳ tài khoản ngân hàng nào tại Việt Nam 24/7 (hỗ trợ VietQR Napas247).',
    },
    {
      q: 'Tôi có phải ôm hàng hoặc bỏ vốn đặt cọc tiền không?',
      a: 'Tuyệt đối KHÔNG! Bạn không cần bỏ vốn, không ôm hàng và không chịu rủi ro vận chuyển. Mọi quy trình thanh toán mua hàng, nhận hàng kho TQ và giao hàng tại VN đều do hệ thống OrderChinaViet đảm nhận.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative antialiased justify-between">
      <Header locale={locale as any} dict={null} />

      <main className="flex-grow pb-16">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* HERO BANNER SECTION                                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <PageHeroBanner
          badge="CHƯƠNG TRÌNH TUYỂN DỤNG TOÀN QUỐC 2026"
          title="Gia Nhập Đội Ngũ Kinh Doanh & Đối Tác OrderChinaViet"
          summary="Cơ hội bứt phá thu nhập từ 8.000.000 ₫ – 50.000.000 ₫+/tháng. Làm việc 100% online tại nhà, hưởng lương cứng 2.000.000 ₫ hàng tháng và nhận hoa hồng trọn đời đến 50%."
          breadcrumbs={[{ label: 'Trang Chủ', href: `/${locale}` }, { label: 'Cơ Hội Nghề Nghiệp' }]}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-12 sm:space-y-16">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TOP 1: CÁC VỊ TRÍ ĐANG TUYỂN DỤNG                                  */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div id="positions" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Vị Trí Tuyển Dụng Đang Mở
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lựa chọn vị trí phù hợp với thế mạnh và quỹ thời gian linh hoạt của bạn
                </p>
              </div>
              <span className="text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full w-fit">
                3 Vị Trí Đang Nhận Hồ Sơ
              </span>
            </div>

            <div className="grid gap-5">
              {/* Job 1 */}
              <div className="bg-white border border-slate-200 hover:border-rose-300 p-6 sm:p-8 rounded-3xl shadow-xs transition-all space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase">
                        HOT — TUYỂN LIÊN TỤC
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                        Làm Việc 100% Online
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
                      Cộng Tác Viên Kinh Doanh / Sales Online (Remote 100%)
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400 font-medium">Mức thu nhập:</div>
                      <div className="text-base sm:text-lg font-bold text-rose-600 font-mono">
                        2.000.000 ₫ + Hoa Hồng 30%–50%
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectPosition('Cộng tác viên kinh doanh Online (Remote)')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      Ứng Tuyển
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-rose-600" />
                      <span>Mô Tả Công Việc:</span>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-slate-600 leading-relaxed">
                      <li>Tìm kiếm khách hàng có nhu cầu nhập hàng kinh doanh từ 1688, Taobao, Tmall.</li>
                      <li>Tư vấn chính sách giá cước vận chuyển và gửi link đăng ký tài khoản.</li>
                      <li>Chăm sóc khách hàng và hỗ trợ khách lên đơn mua hộ.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Yêu Cầu Ứng Viên:</span>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-slate-600 leading-relaxed">
                      <li>Không yêu cầu bằng cấp hay kinh nghiệm, được đào tạo bài bản từ đầu.</li>
                      <li>Có điện thoại hoặc máy tính kết nối internet, biết sử dụng mạng xã hội.</li>
                      <li>Chăm chỉ, trung thực, có tinh thần cầu tiến và đam mê kinh doanh.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Job 2 */}
              <div className="bg-white border border-slate-200 hover:border-blue-300 p-6 sm:p-8 rounded-3xl shadow-xs transition-all space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase">
                        CHĂM SÓC KHÁCH HÀNG
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                        Hỗ Trợ Nguồn Hàng
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
                      Nhân Viên Tư Vấn &amp; Tìm Nguồn Hàng Xưởng Trung Quốc
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400 font-medium">Mức thu nhập:</div>
                      <div className="text-base sm:text-lg font-bold text-rose-600 font-mono">
                        2.000.000 ₫ + Thưởng Đơn Hàng
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectPosition('Nhân Viên Tư Vấn & Tìm Nguồn Hàng TQ')}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      Ứng Tuyển
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>Mô Tả Công Việc:</span>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-slate-600 leading-relaxed">
                      <li>Hỗ trợ khách tìm kiếm xưởng sản xuất uy tín tại Quảng Châu, Chiết Giang, Nghĩa Ô.</li>
                      <li>Hỗ trợ đàm phán giá sỉ và kiểm tra thông tin sản phẩm.</li>
                      <li>Giải đáp các thắc mắc về tiến độ vận chuyển cho khách hàng.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Yêu Cầu Ứng Viên:</span>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-slate-600 leading-relaxed">
                      <li>Ưu tiên ứng viên biết tiếng Trung cơ bản (hoặc sử dụng thành thạo Google Dịch).</li>
                      <li>Kỹ năng giao tiếp nhẹ nhàng, nhiệt tình, phản hồi tin nhắn nhanh chóng.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Job 3 */}
              <div className="bg-white border border-slate-200 hover:border-indigo-300 p-6 sm:p-8 rounded-3xl shadow-xs transition-all space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase">
                        ĐỐI TÁC KHU VỰC
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                        Phát Triển Tỉnh Thành
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
                      Đại Lý Phát Triển Tuyến Vận Chuyển Khu Vực Tỉnh / Thành
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400 font-medium">Mức thu nhập:</div>
                      <div className="text-base sm:text-lg font-bold text-indigo-700 font-mono">
                        Chia Sẻ Doanh Thu Đến 50%
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectPosition('Đại Lý Phát Triển Tuyến Vận Chuyển Khu Vực')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                    >
                      Ứng Tuyển
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span>Mô Tả Công Việc:</span>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-slate-600 leading-relaxed">
                      <li>Phát triển mạng lưới khách hàng doanh nghiệp, chủ xưởng may, shop kinh doanh tại địa bàn tỉnh.</li>
                      <li>Đại diện tiếp nhận và phân phối hàng hóa khu vực.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Yêu Cầu Ứng Viên:</span>
                    </div>
                    <ul className="space-y-1.5 pl-4 list-disc text-slate-600 leading-relaxed">
                      <li>Có mối quan hệ với các chủ shop, doanh nghiệp xuất nhập khẩu địa phương.</li>
                      <li>Ưu tiên có mặt bằng kho bãi hoặc phương tiện giao nhận.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* TOP 2: FORM ỨNG TUYỂN TRỰC TUYẾN (GỬI HỒ SƠ ỨNG TUYỂN NHANH)       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div id="apply-form" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold shrink-0">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase">
                      ỨNG TUYỂN TRỰC TUYẾN
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
                    Gửi Hồ Sơ Ứng Tuyển Nhanh
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Điền thông tin để gia nhập đội ngũ nhân sự OrderChinaViet với mức lương cơ bản 2.000.000 ₫
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-2xl text-xs text-emerald-800 font-bold shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Phản hồi trong 24 giờ làm việc</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {submitSuccess ? (
              <div className="p-8 bg-emerald-50/80 border border-emerald-200 rounded-3xl text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Gửi Hồ Sơ Ứng Tuyển Thành Công!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Mã hồ sơ ứng tuyển của bạn là{' '}
                  <strong className="text-slate-900 font-mono font-bold text-sm bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {submitSuccess.applicationCode}
                  </strong>
                  . Bộ phận nhân sự sẽ liên hệ phỏng vấn qua Số điện thoại / Zalo của bạn trong 24 giờ tới.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(null)}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Gửi Hồ Sơ Khác
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Họ và tên ứng viên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                      placeholder="VD: Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Số điện thoại / Zalo <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                      placeholder="VD: 0909 123 456"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email liên hệ</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Vị trí ứng tuyển <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.position}
                      onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                    >
                      <option value="Cộng tác viên kinh doanh Online (Remote)">
                        Cộng tác viên kinh doanh Online (Lương cứng 2Tr + Hoa hồng)
                      </option>
                      <option value="Nhân Viên Tư Vấn & Tìm Nguồn Hàng TQ">
                        Nhân Viên Tư Vấn &amp; Tìm Nguồn Hàng TQ
                      </option>
                      <option value="Đại Lý Phát Triển Tuyến Vận Chuyển Khu Vực">
                        Đại Lý Phát Triển Tuyến Vận Chuyển Khu Vực
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tỉnh / Thành phố sinh sống <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.city}
                      onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                    >
                      {VIETNAM_PROVINCES.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Kinh nghiệm làm việc</label>
                    <select
                      value={form.experience}
                      onChange={(e) => setForm((prev) => ({ ...prev, experience: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                    >
                      <option value="Dưới 1 năm / Chưa có kinh nghiệm (Được đào tạo)">
                        Dưới 1 năm / Chưa có kinh nghiệm (Được đào tạo)
                      </option>
                      <option value="1 - 2 năm trong ngành Sales / TMĐT">1 - 2 năm trong ngành Sales / TMĐT</option>
                      <option value="Trên 2 năm ngành Logistics / Nhập hàng TQ">
                        Trên 2 năm ngành Logistics / Nhập hàng TQ
                      </option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Giới thiệu bản thân / Ghi chú thêm
                    </label>
                    <textarea
                      rows={3}
                      value={form.note}
                      onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white resize-none"
                      placeholder="Chia sẻ ngắn về thế mạnh của bạn hoặc thời gian thuận tiện để nhân sự liên hệ..."
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
                    Mức đãi ngộ:{' '}
                    <strong className="text-rose-600 font-mono font-bold text-sm">
                      Lương cơ bản 2.000.000 ₫/tháng
                    </strong>{' '}
                    + Hoa hồng không giới hạn
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Đang Gửi Hồ Sơ...' : 'Nộp Hồ Sơ Ứng Tuyển Ngay'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: QUY TRÌNH 4 BƯỚC TUYỂN DỤNG & NHẬN VIỆC                  */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
                LỘ TRÌNH GIA NHẬP NHANH CHÓNG
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Quy Trình Ứng Tuyển &amp; Nhận Việc Trong 24 Giờ
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold font-mono text-base flex items-center justify-center">
                  01
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Nộp Hồ Sơ Online</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Điền thông tin vào biểu mẫu bên trên chỉ mất 1 phút để đăng ký vị trí mong muốn.
                </p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold font-mono text-base flex items-center justify-center">
                  02
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Hướng dẫn Online</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Chuyên viên nhân sự liên hệ phỏng vấn online qua Zalo / Điện thoại trong 24 giờ.
                </p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold font-mono text-base flex items-center justify-center">
                  03
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Đào Tạo Nghiệp Vụ</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Được hướng dẫn cách tìm nguồn hàng 1688, tính cước và sử dụng link giới thiệu.
                </p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono text-base flex items-center justify-center">
                  04
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">Nhận Việc &amp; Lương</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Kích hoạt tài khoản đối tác, bắt đầu làm việc và nhận lương cứng 2Tr hằng tháng.
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION 4: KÊNH LIÊN HỆ HỖ TRỢ TRỰC TIẾP 24/7 (ĐẦY ĐỦ LOGO ASSETS)  */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
                HỖ TRỢ ỨNG VIÊN TRỰC TIẾP
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Kênh Trao Đổi &amp; Hỗ Trợ Ứng Tuyển 24/7
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Bạn cần trao đổi trực tiếp trước khi nộp đơn? Đội ngũ nhân sự sẵn sàng tư vấn 1-1 qua các kênh dưới đây:
              </p>
            </div>

            {/* Compact Grid of Contact Cards with Assets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 pt-2">
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

              {/* Facebook */}
              {settings.showFacebookLink !== false && (
                <div className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center p-1 shrink-0">
                      <Image src={facebookImg} alt="Facebook" width={20} height={20} className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                      Fanpage
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">Facebook</span>
                    <span className="text-[10px] text-slate-500 block truncate" title="Group & Fanpage Tuyển Dụng">
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
                    <span>Vào Trang</span>
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
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION 5: CÔNG CỤ DỰ TOÁN THU NHẬP (FINTECH SIMULATOR WIDGET)       */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div id="calculator" className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold shrink-0">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase">
                      MÔ PHỎNG DỰ TOÁN
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
                    Thử Ước Tính Thu Nhập Hàng Tháng Của Bạn
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Kéo thanh trượt để xem thu nhập dự kiến dựa trên số khách hàng và sản lượng hàng hóa
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200 shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Thu Nhập Không Giới Hạn</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-center">
              {/* Sliders Input (Left 7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Slider 1: Customers (Up to 300 customers) */}
                <div className="space-y-3 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Số Khách Hàng Phát Sinh Đơn / Tháng:</span>
                    <span className="text-base text-rose-600 font-mono font-bold bg-white px-3 py-1 rounded-xl border border-rose-200 shadow-2xs">
                      {simCustomers} Khách
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="300"
                    step="1"
                    value={simCustomers}
                    onChange={(e) => setSimCustomers(parseInt(e.target.value) || 1)}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>1 Khách</span>
                    <span>100 Khách</span>
                    <span>200 Khách</span>
                    <span>300+ Khách</span>
                  </div>
                </div>

                {/* Slider 2: Weight (Up to 15,000 kg / 15 tons) */}
                <div className="space-y-3 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Tổng Sản Lượng Kiện Hàng Vận Chuyển:</span>
                    <span className="text-base text-rose-600 font-mono font-bold bg-white px-3 py-1 rounded-xl border border-rose-200 shadow-2xs">
                      {simWeight.toLocaleString('vi-VN')} kg / tháng
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="15000"
                    step="50"
                    value={simWeight}
                    onChange={(e) => setSimWeight(parseInt(e.target.value) || 50)}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>50 kg</span>
                    <span>5.000 kg (5 Tấn)</span>
                    <span>10.000 kg (10 Tấn)</span>
                    <span>15.000+ kg (15 Tấn)</span>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Hoa hồng được tính tự động và quyết toán tức thì vào ví đối tác của bạn ngay khi đơn hoàn tất.
                  </span>
                </div>
              </div>

              {/* High-Contrast Luxury Dark Result Box (Right 5 cols) */}
              <div className="lg:col-span-5 p-6 sm:p-7 bg-slate-900 text-white border border-slate-800 rounded-3xl space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center justify-between">
                  <span>Bảng Phân Bổ Thu Nhập</span>
                  <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                    Thực Nhận 100%
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                    <span className="text-slate-400">1. Lương Cơ Bản Cố Định:</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {calculatedBaseSalary.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                    <span className="text-slate-400">2. Hoa Hồng ({simCustomers} khách &bull; {simWeight.toLocaleString('vi-VN')}kg):</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      +{calculatedCommission.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                    <span className="text-slate-400">3. Thưởng Nóng Đạt KPI:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      +{calculatedKpiBonus.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1 text-center">
                  <div className="text-xs text-slate-400 font-medium">TỔNG THU NHẬP DỰ KIẾN / THÁNG:</div>
                  <div className="text-3xl sm:text-4xl font-bold text-emerald-400 font-mono tracking-tight">
                    {calculatedTotalIncome.toLocaleString('vi-VN')} ₫
                  </div>
                </div>

                <a
                  href="#apply-form"
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 block text-center cursor-pointer"
                >
                  <span>Ứng Tuyển Nhận Mức Thu Nhập Này</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION 6: CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION)                      */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3.5 py-1 rounded-full uppercase tracking-wider">
                GIẢI ĐÁP THẮC MẮC
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Câu Hỏi Thường Gặp Của Ứng Viên
              </h2>
            </div>

            <div className="space-y-3 pt-2">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 sm:p-5 text-left bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{faq.q}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-4 sm:p-5 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      <Footer locale={locale as any} dict={null} />
      <FloatingContact />
    </div>
  );
}

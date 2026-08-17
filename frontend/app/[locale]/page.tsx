'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Check,
  Search,
  Truck,
  Warehouse,
  Boxes,
  Radar,
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
  Package,
  ArrowRight,
  HelpCircle,
  Clock,
  Globe,
  AppWindow,
  Download,
  ShoppingBag,
} from 'lucide-react';
import { Locale, getDictionary, translate } from '@/lib/i18n';
import { Header, ContentModalItem } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { ScrollReveal } from '@/components/common/ScrollReveal';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { ChatWidget } from '@/components/common/ChatWidget';
import { FloatingContact } from '@/components/common/FloatingContact';
import { FullServiceOrderWidget } from '@/components/common/FullServiceOrderWidget';
import { OrderGuideModal } from '@/components/common/OrderGuideModal';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { SearchableSelect, SelectOption, parseVNDInput, formatVNDInput } from '@/components/common/SearchableSelect';
import { settingsStore, ContactSettings, DEFAULT_CONTACT_SETTINGS } from '@/lib/settings-store';

// -----------------------------------------------------------------------
// BANNER SLIDES
// -----------------------------------------------------------------------
const heroSlides = [
  {
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    tagline: 'UY TÍN — TẬN TÂM — CHUYÊN NGHIỆP',
    title: 'Vận Chuyển Trung – Việt',
    subtitle: 'Nhanh Chóng, An Toàn & Minh Bạch',
    description: 'Hệ thống gom hàng kho Quảng Châu 24/7 — Container đường bộ 3-7 Ngày về tận kho TP.HCM.',
    accentColor: '#0c3ed0',
  },
  {
    image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    tagline: 'KHO QUẢNG CHÂU 2,000M²',
    title: 'Kiểm Hàng Tận Xưởng',
    subtitle: 'Chụp Ảnh Thực Tế & Cân Đo Chuẩn Xác',
    description: 'Nhân viên kho Quảng Châu ký nhận, quét mã barcode, chụp ảnh và xếp kệ theo mã khách OCVxxxxxx.',
    accentColor: '#fa3131',
  },
  {
    image: 'https://images.unsplash.com/photo-1494412651409-8963ce7935a7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=85',
    tagline: 'ĐẶT HÀNG 1688 / TAOBAO / TMALL',
    title: 'Mua Hộ Tận Xưởng Trung Quốc',
    subtitle: 'Giá Sỉ Gốc – Không Qua Trung Gian',
    description: 'Đội ngũ thông thạo tiếng Trung hỗ trợ đàm phán giá, kiểm tra chất lượng và khiếu nại seller.',
    accentColor: '#0c3ed0',
  },
];

export default function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const dict = getDictionary(locale);

  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);

  // Single Page Modal Content Viewer state
  const [modalItem, setModalItem] = useState<ContentModalItem | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeGuideStep, setActiveGuideStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSettings(settingsStore.getSettings());
    const handleUpdate = () => setSettings(settingsStore.getSettings());
    window.addEventListener('orderchinaviet_settings_updated', handleUpdate);
    return () => window.removeEventListener('orderchinaviet_settings_updated', handleUpdate);
  }, []);

  // -----------------------------------------------------------------------
  // HERO SLIDER STATE
  // -----------------------------------------------------------------------
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  // Auto-play slider every 5s
  useEffect(() => {
    if (isSliderPaused) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, isSliderPaused]);

  // -----------------------------------------------------------------------
  // PLATFORM SEARCH FILTER STATE
  // -----------------------------------------------------------------------
  const platforms = [
    {
      id: '1688',
      label: '1688.com',
      url: 'https://s.1688.com/selloffer/offer_search.htm?keywords=',
      urlSuffix: '',
      icon: '/1688.png',
    },
    {
      id: 'taobao',
      label: 'Taobao.com',
      url: 'https://s.taobao.com/search?q=',
      urlSuffix: '',
      icon: '/taobao.png',
    },
    {
      id: 'pinduoduo',
      label: 'Pinduoduo',
      url: 'https://mobile.yangkeduo.com/search_result.html?search_key=',
      urlSuffix: '',
      icon: '/pinduoduo.webp',
    },
  ];
  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0]);
  const [platformOpen, setPlatformOpen] = useState(false);
  const platformBtnRef = useRef<HTMLButtonElement>(null);
  const platformDropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [searchMode, setSearchMode] = useState<'platform' | 'track'>('platform');

  // Open dropdown and calculate fixed position from button rect
  const handleToggleDropdown = () => {
    if (!platformOpen && platformBtnRef.current) {
      const rect = platformBtnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
      });
    }
    setPlatformOpen((prev) => !prev);
  };

  // Close platform dropdown when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isBtn = platformBtnRef.current?.contains(target);
      const isMenu = platformDropdownRef.current?.contains(target);
      if (!isBtn && !isMenu) setPlatformOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handlePlatformSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const finalUrl = selectedPlatform.url + encodeURIComponent(searchQuery.trim()) + selectedPlatform.urlSuffix;
    window.open(finalUrl, '_blank');
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;
    router.push(`/${locale}/track?code=${encodeURIComponent(trackingCode.trim())}`);
  };

  // -----------------------------------------------------------------------
  // RATE CALCULATOR STATE & OPTIONS
  // -----------------------------------------------------------------------
  const cargoValueOptions: SelectOption[] = [
    { id: 1000000, label: '1,000,000 ₫ (Dưới 1 triệu)', subLabel: 'Khai giá hàng nhỏ sỉ', numericValue: 1000000 },
    { id: 5000000, label: '5,000,000 ₫ (Từ 1 - 5 triệu)', subLabel: 'Hàng thời trang / Đồ dùng', numericValue: 5000000 },
    { id: 10000000, label: '10,000,000 ₫ (Từ 5 - 10 triệu)', subLabel: 'Hàng linh kiện / Thiết bị', numericValue: 10000000 },
    { id: 20000000, label: '20,000,000 ₫ (Từ 10 - 20 triệu)', subLabel: 'Lô hàng vừa', numericValue: 20000000 },
    { id: 50000000, label: '50,000,000 ₫ (Từ 20 - 50 triệu)', subLabel: 'Lô hàng máy móc / Đóng container', numericValue: 50000000 },
    { id: 100000000, label: '100,000,000 ₫ (Trên 50 triệu)', subLabel: 'Lô hàng giá trị cao', numericValue: 100000000 },
    { id: 'OTHER', label: 'Khác (Tự nhập giá trị)', subLabel: 'Tự nhập số tiền khai báo VNĐ' },
  ];

  const deliveryTimeOptions: SelectOption[] = [
    { id: 'EXPRESS', label: '2 - 3 Ngày (Hỏa tốc hàng không)', subLabel: 'Nhận hàng siêu tốc kho TP.HCM / HN' },
    { id: 'STANDARD', label: '3 - 5 Ngày (Chính ngạch đường bộ)', subLabel: 'Tuyến container tiêu chuẩn mỗi ngày' },
    { id: 'SAVINGS', label: '5 - 7 Ngày (Tiết kiệm sỉ container)', subLabel: 'Tối ưu chi phí hàng nặng' },
    { id: 'OTHER', label: 'Khác (Tự nhập thời gian)', subLabel: 'Nhập thời gian giao dự kiến tùy chỉnh' },
  ];

  const categoryOptions: SelectOption[] = [
    { id: 'CLOTHING', label: 'Quần áo / Thời trang / Giày dép', subLabel: 'Hàng dệt may, phụ kiện' },
    { id: 'ELECTRONICS', label: 'Linh kiện điện tử / Máy tính / Điện thoại', subLabel: 'Đồ công nghệ, chip, bo mạch' },
    { id: 'COSMETICS', label: 'Mỹ phẩm / Dụng cụ làm đẹp / Đồ gia dụng', subLabel: 'Hàng chăm sóc cá nhân, đồ gia đình' },
    { id: 'MACHINERY', label: 'Máy móc / Phụ tùng / Ô tô xe máy', subLabel: 'Hàng cơ khí, thiết bị công nghiệp' },
    { id: 'TOYS', label: 'Đồ chơi / Đồ mẹ và bé', subLabel: 'Sản phẩm trẻ em' },
    { id: 'PACKAGING', label: 'Bao bì / Vật liệu đóng gói', subLabel: 'Thùng carton, túi zip, màng co' },
    { id: 'OTHER', label: 'Khác (Tự nhập loại hàng)', subLabel: 'Nhập loại sản phẩm cụ thể khác' },
  ];

  const [cargoValueSelect, setCargoValueSelect] = useState<string | number>(5000000);
  const [customCargoValue, setCustomCargoValue] = useState<string>('15.000.000');
  const [deliveryTimeSelect, setDeliveryTimeSelect] = useState<string | number>('STANDARD');
  const [customDeliveryTime, setCustomDeliveryTime] = useState<string>('7-10 ngày làm việc');
  const [categorySelect, setCategorySelect] = useState<string | number>('CLOTHING');
  const [customCategory, setCustomCategory] = useState<string>('Đồ linh kiện máy móc');
  const [enableInsurance, setEnableInsurance] = useState<boolean>(true);

  const [weightInput, setWeightInput] = useState<number>(15);
  const [length, setLength] = useState<number>(30);
  const [width, setWidth] = useState<number>(20);
  const [height, setHeight] = useState<number>(20);

  // Volumetric weight (DxRxC / 6000)
  const volumetricWeight = (length * width * height) / 6000;
  const chargeableWeight = Math.max(weightInput || 0, volumetricWeight);

  // Base rate calculation per kg
  let basePricePerKg =
    chargeableWeight >= 50
      ? 18000
      : chargeableWeight >= 10
        ? 20000
        : 22000;

  if (deliveryTimeSelect === 'EXPRESS') basePricePerKg += 5000;
  if (deliveryTimeSelect === 'SAVINGS') basePricePerKg -= 2000;
  if (categorySelect === 'ELECTRONICS') basePricePerKg += 2000;

  const actualCargoValue =
    cargoValueSelect === 'OTHER'
      ? parseVNDInput(customCargoValue)
      : typeof cargoValueSelect === 'number'
        ? cargoValueSelect
        : Number(cargoValueSelect) || 0;

  const insuranceFee = enableInsurance ? Math.round(actualCargoValue * 0.005) : 0;
  const freightAmount = Math.round(chargeableWeight * basePricePerKg);
  const estimatedTotal = freightAmount + insuranceFee;

  const features = [
    {
      icon: <Boxes className="w-6 h-6 text-primary-600" />,
      iconBg: "bg-primary-50 border-primary-200/60",
      title: "Gom Hàng Kho Quảng Châu",
      description: "Nhân viên kho Quảng Châu trực tiếp nhận hàng, kiểm đếm số lượng, chụp ảnh thực tế và xếp kệ theo mã khách hàng OCVxxxxxx.",
    },
    {
      icon: <Truck className="w-6 h-6 text-emerald-600" />,
      iconBg: "bg-emerald-50 border-emerald-200/60",
      title: "Vận Chuyển Hỏa Tốc 3-7 Ngày",
      description: "Tuyến xe container đường bộ xuất kho liên tục mỗi ngày qua thông quan chính ngạch cửa khẩu Hữu Nghị / Móng Cái.",
    },
    {
      icon: <BadgeDollarSign className="w-6 h-6 text-amber-600" />,
      iconBg: "bg-amber-50 border-amber-200/60",
      title: "Giá Cước Minh Bạch 100%",
      description: "Bảng giá niêm yết theo cân nặng thực tế và quy đổi thể tích (DxRxC/6000). Không phát sinh phụ phí ẩn.",
    },
    {
      icon: <Radar className="w-6 h-6 text-purple-600" />,
      iconBg: "bg-purple-50 border-purple-200/60",
      title: "Theo Dõi Vận Đơn Realtime",
      description: "Theo dõi chính xác vị trí kiện hàng từ khi Shop giao đến kho Quảng Châu cho tới khi về kho Việt Nam và giao đến nhà.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-rose-600" />,
      iconBg: "bg-rose-50 border-rose-200/60",
      title: "Bảo Hiểm Hàng Hóa 100%",
      description: "Cam kết đền bù 100% giá trị kiện hàng bị mất mát, đứt gãy hoặc hư hỏng trong quá trình kho bãi vận chuyển.",
    },
    {
      icon: <UserCheck className="w-6 h-6 text-sky-600" />,
      iconBg: "bg-sky-50 border-sky-200/60",
      title: "Hỗ Trợ Khiếu Nại Seller",
      description: "Đội ngũ nhân viên thông thạo tiếng Trung hỗ trợ khiếu nại nhà cung cấp 1688, Taobao, Tmall khi hàng lỗi, thiếu.",
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Tạo Mã Khách Hàng',
      desc: 'Đăng ký tài khoản để nhận Mã Khách Hàng duy nhất (VD: OCV000001) và địa chỉ nhận hàng kho Quảng Châu.',
      icon: UserCheck,
      badgeColor: 'text-primary-700 bg-primary-50 border-primary-200',
    },
    {
      step: '02',
      title: 'Nhận Hàng Kho Quảng Châu',
      desc: 'Shop Trung Quốc phát hàng đến kho. Nhân viên quét mã ký nhận, cân ký, đo kích thước và chụp ảnh hàng.',
      icon: Warehouse,
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    {
      step: '03',
      title: 'Gom Lô & Vận Chuyển',
      desc: 'Hàng hóa được đưa vào container xuất kho Quảng Châu qua thông quan cửa khẩu đường bộ hoặc đường hàng không.',
      icon: Truck,
      badgeColor: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    {
      step: '04',
      title: 'Trả Hàng Tại Việt Nam',
      desc: 'Hàng về kho TP.HCM / Hà Nội. Khách hàng nhận thông báo giao tận nhà hoặc đến kho nhận trực tiếp.',
      icon: CheckCircle2,
      badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
  ];

  const faqItems = [
    {
      q: 'Thời gian vận chuyển hàng từ Trung Quốc về Việt Nam mất bao lâu?',
      a: 'Thời gian vận chuyển tuyến đường bộ thông quan chính ngạch từ Kho Quảng Châu về Kho Hà Nội là 2 - 4 ngày, về Kho TP.HCM là 3 - 5 ngày làm việc. Tuyến hỏa tốc đường hàng không nhận hàng siêu tốc từ 1 - 3 ngày.',
    },
    {
      q: 'Cách tính cước phí cân nặng thực tế và quy đổi thể tích (DxRxC / 6000) như thế nào?',
      a: 'Theo chuẩn logistics quốc tế, cước phí được tính theo giá trị lớn hơn giữa Cân nặng thực tế (kg) và Cân nặng thể tích (Dài x Rộng x Cao cm / 6000). Nếu kiện hàng cồng kềnh nhẹ cân, phí sẽ được tính theo cân nặng thể tích.',
    },
    {
      q: 'Chính sách bảo hiểm hàng hóa và đền bù rủi ro áp dụng như thế nào?',
      a: 'OrderChinaViet cam kết đền bù 100% giá trị kiện hàng đối với khách hàng có đăng ký Bảo hiểm hàng hóa (0.5% giá trị khai báo) nếu xảy ra sự cố thất lạc, mất mát hoặc hư hỏng nguyên vẹn kiện hàng do lỗi kho bãi & vận chuyển.',
    },
    {
      q: 'Làm sao để lấy Địa chỉ Kho Quảng Châu và Mã Khách Hàng OCVxxxxxx?',
      a: 'Sau khi đăng ký tài khoản thành công tại OrderChinaViet, bạn sẽ nhận được 1 Mã Khách Hàng duy nhất (VD: OCV000001). Địa chỉ kho Quảng Châu và cú pháp điền địa chỉ nhận hàng trên 1688 / Taobao / Pinduoduo sẽ được hiển thị chi tiết trong Bảng điều khiển tài khoản của bạn.',
    },
    {
      q: 'Quy trình ký nhận và nhập kho Quảng Châu diễn ra thế nào?',
      a: 'Nhân viên kho Quảng Châu làm việc 24/7, trực tiếp quét mã ký nhận với các đơn vị phát hàng Trung Quốc (ZTO, YTO, SF Express...), cân đo kích thước, chụp ảnh kiện hàng thực tế và xếp lên kệ theo Mã Khách Hàng. Thông tin kiện hàng được tự động cập nhật Realtime lên hệ thống.',
    },
    {
      q: 'OrderChinaViet có hỗ trợ thanh toán hộ tiền hàng (Alipay / WeChat Pay) không?',
      a: 'Có. Đội ngũ OrderChinaViet hỗ trợ thanh toán hộ đơn hàng Taobao, 1688, Tmall, Pinduoduo qua Alipay / Thẻ ngân hàng Trung Quốc với tỷ giá hối thoái cập nhật minh bạch theo từng ngày, bảo đảm giao dịch nhanh chóng và an toàn.',
    },
    {
      q: 'Có bị tính phí lưu kho nếu chưa thể đến lấy hàng ngay tại Việt Nam không?',
      a: 'OrderChinaViet hỗ trợ miễn phí lưu kho tại Việt Nam lên đến 7 ngày kể từ khi hàng về kho. Quá thời hạn 7 ngày, phí lưu kho nhẹ 5.000đ/ngày/kiện sẽ được áp dụng để hỗ trợ quản lý diện tích kho bãi.',
    },
    {
      q: 'Các loại mặt hàng nào bị cấm vận chuyển theo quy định pháp luật?',
      a: 'OrderChinaViet từ chối vận chuyển các loại hàng hóa thuộc danh mục cấm của nhà nước Việt Nam và Trung Quốc như: chất cháy nổ, chất hóa học độc hại, vũ khí, chất cấm, tiền tệ, động vật sống, hàng vi phạm bản quyền thương hiệu nặng không rõ nguồn gốc.',
    },
    {
      q: 'Hình thức giao hàng tận nhà tại Việt Nam như thế nào?',
      a: 'Khách hàng tại nội thành Hà Nội và TP.HCM có thể đăng ký nhận hàng qua Grab, AhaMove hoặc xe tải công ty. Khách hàng các tỉnh thành khác sẽ được chuyển phát nhanh qua Viettel Post, GHTK, J&T hoặc xe khách chành xe uy tín.',
    },
    {
      q: 'Nếu Shop Trung Quốc phát sai hàng, thiếu hàng hoặc hư hỏng thì xử lý thế nào?',
      a: 'Nhân viên CSKH OrderChinaViet thông thạo tiếng Trung sẽ trực tiếp đại diện khách hàng khiếu nại với Seller trên 1688 / Taobao để yêu cầu hoàn tiền hoặc đổi trả sản phẩm nhanh nhất.',
    },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col  relative overflow-x-hidden">
      {/* Background Soft Glow Accents */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-primary-100/60 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />
      <div className="fixed bottom-1/3 right-10 w-[500px] h-[500px] bg-red-100/50 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />

      {/* Dynamic Header */}
      <Header
        locale={locale}
        dict={dict}
        onOpenContentModal={(item) => setModalItem(item)}
      />

      {/* ================================================================= */}
      {/* HERO BANNER SLIDER */}
      {/* ================================================================= */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: 'min(90vh, 680px)', minHeight: '500px' }}
        onMouseEnter={() => setIsSliderPaused(true)}
        onMouseLeave={() => setIsSliderPaused(false)}
      >
        {/* Slides */}
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover scale-105 transition-transform duration-10000 ease-linear"
              priority={idx === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/65 to-slate-900/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
          </div>
        ))}

        {/* Slide Content */}
        <div className="relative z-20 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-20 w-full">
          <div className="max-w-3xl">
            {/* Tagline */}
            <div
              key={`tag-${currentSlide}`}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 text-white/95 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 animate-in fade-in slide-in-from-left-8 duration-700 shadow-md"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
              {heroSlides[currentSlide].tagline}
            </div>

            {/* Title */}
            <h1
              key={`title-${currentSlide}`}
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-3 tracking-tight animate-in fade-in slide-in-from-left-8 duration-700 delay-100"
            >
              {heroSlides[currentSlide].title}
            </h1>
            <p
              key={`sub-${currentSlide}`}
              className="text-lg sm:text-2xl font-bold mb-4 animate-in fade-in slide-in-from-left-8 duration-700 delay-150"
              style={{ color: heroSlides[currentSlide].accentColor === '#fa3131' ? '#fca5a5' : '#93c5fd' }}
            >
              {heroSlides[currentSlide].subtitle}
            </p>
            <p
              key={`desc-${currentSlide}`}
              className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl mb-8 animate-in fade-in slide-in-from-left-8 duration-700 delay-200"
            >
              {heroSlides[currentSlide].description}
            </p>

            {/* SEARCH / FILTER BAR */}
            <div
              key={`search-${currentSlide}`}
              className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300"
            >
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setSearchMode('platform')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${searchMode === 'platform'
                    ? 'bg-white text-primary-700 shadow-lg'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Tìm Kiếm Sản Phẩm</span>
                </button>
                <button
                  onClick={() => setSearchMode('track')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${searchMode === 'track'
                    ? 'bg-white text-accent-600 shadow-lg'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Tra Cứu Vận Đơn</span>
                </button>
              </div>

              {/* Platform Search Bar */}
              {searchMode === 'platform' && (
                <div className="max-w-2xl">
                  <div className="flex items-stretch bg-white rounded-2xl shadow-2xl overflow-visible">
                    <div className="relative shrink-0">
                      <button
                        ref={platformBtnRef}
                        type="button"
                        onClick={handleToggleDropdown}
                        className="h-full flex items-center gap-2 px-5 bg-white text-slate-900 border-r border-slate-200 text-xs sm:text-sm font-bold hover:bg-primary-50 hover:text-primary-700 transition-colors min-w-[130px] justify-between rounded-l-2xl"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 shrink-0 relative">
                            <Image src={selectedPlatform.icon} alt={selectedPlatform.label} fill sizes="20px" className="object-cover" />
                          </div>
                          <span>{selectedPlatform.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${platformOpen ? 'rotate-180 text-primary-600' : ''
                            }`}
                        />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handlePlatformSearch(e as any);
                      }}
                      placeholder={`Tìm sản phẩm trên ${selectedPlatform.label}...`}
                      className="flex-1 px-4 py-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-white"
                    />

                    <button
                      onClick={handlePlatformSearch}
                      type="button"
                      className="flex items-center gap-2 px-6 py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold transition-colors shrink-0 rounded-r-2xl"
                    >
                      <Search className="w-4 h-4" />
                      <span className="hidden sm:inline">Tìm kiếm</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tracking Bar */}
              {searchMode === 'track' && (
                <form
                  onSubmit={handleTrackSubmit}
                  className="flex items-stretch bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl"
                >
                  <div className="flex items-center gap-2 px-4 border-r border-slate-200 text-slate-500 shrink-0">
                    <Package className="w-4 h-4 text-accent-500" />
                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">Mã Vận Đơn</span>
                  </div>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Nhập mã vận đơn SF, YT, ZTO hoặc mã PKG..."
                    className="flex-1 px-4 py-3.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-white"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3.5 bg-accent-500 hover:bg-accent-600 text-white text-xs sm:text-sm font-bold transition-colors shrink-0"
                  >
                    <Search className="w-4 h-4" />
                    <span className="hidden sm:inline">Tra Cứu</span>
                  </button>
                </form>
              )}

              {/* Quick Feature Tags */}
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bảo Hiểm 100%</span>
                </div>
                <span className="text-white/30">·</span>
                <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                  <Warehouse className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kho Quảng Châu 24/7</span>
                </div>
                <span className="text-white/30">·</span>
                <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Thông Quan Chính Ngạch</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Overlay Bottom Right */}
        <div className="absolute bottom-6 right-6 z-20 hidden lg:grid grid-cols-3 gap-px bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
          {[
            { num: '50,000+', label: 'Kiện Hàng Ký Nhận' },
            { num: '99.8%', label: 'Đúng Tiến Độ' },
            { num: '3,500+', label: 'Chủ Hàng Tin Dùng' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center px-6 py-4 bg-white/5 hover:bg-white/10 transition-colors">
              <span className="text-xl font-bold text-white font-mono">{stat.num}</span>
              <span className="text-[10px] text-white/70 font-medium mt-0.5 whitespace-nowrap">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Arrow Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slide Dot Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`rounded-full transition-all duration-300 cursor-pointer ${idx === currentSlide
                ? 'w-8 h-2 bg-white shadow-lg'
                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
            />
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* HOW IT WORKS SECTION (Quy Trình 4 Bước) WITH SCROLL REVEAL */}
      {/* ================================================================= */}
      <section id="how-it-works" className="py-24 bg-slate-50 border-y border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-bold font-mono text-primary-700 bg-primary-50 border border-primary-200 px-3.5 py-1 rounded-full uppercase tracking-wider mb-3">
                QUY TRÌNH LOGISTICS
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">
                Vận Chuyển Qua <span className="gradient-text">4 Bước Đơn Giản</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Quy trình vận hành khép kín, minh bạch và an toàn từ kho Quảng Châu đến tận tay khách hàng.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, index) => {
              const Icon = st.icon;
              return (
                <ScrollReveal
                  key={st.step}
                  animation="fade-up"
                  delay={120 * index}
                >
                  <div className="glass-card-light-hover rounded-2xl p-6 relative group h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${st.badgeColor}`}>
                          Bước {st.step}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-primary-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-all duration-300">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-primary-700 transition-colors">
                        {st.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {st.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FEATURES / ADVANTAGES WITH STAGGERED SCROLL REVEAL */}
      {/* ================================================================= */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-bold font-mono text-accent-600 bg-red-50 border border-red-200 px-3.5 py-1 rounded-full uppercase tracking-wider mb-3">
                THẾ MẠNH VƯỢT TRỘI
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">
                Tại Sao Chọn <span className="gradient-text">OrderChinaViet?</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Hệ thống công nghệ tiên tiến giúp tối ưu hóa chi phí và thời gian giao nhận hàng hoá.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((item, index) => (
              <ScrollReveal
                key={index}
                animation="zoom-in"
                delay={100 * index}
              >
                <div className="glass-card-light-hover rounded-2xl p-6 h-full flex flex-col justify-between group">
                  <div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border transition-transform duration-300 group-hover:scale-110 ${item.iconBg}`}>
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-primary-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Big Feature Showcase Banner */}
          <ScrollReveal animation="fade-up" delay={200} className="mt-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden relative border border-slate-800">
              <div>
                <span className="text-xs font-bold font-mono text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
                  HỆ THỐNG KHO BÃI CHUYÊN NGHIỆP
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 leading-snug">
                  Kho Quảng Châu 2,000m² <br />
                  <span className="text-sky-400">Tiếp Nhận Hàng 24/7</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                  Được trang bị hệ thống băng chuyền tự động, camera giám sát góc rộng, cân điện tử đạt chuẩn xuất nhập khẩu và nhân sự vận hành chuyên nghiệp tại Quảng Châu.
                </p>
                <div className="space-y-3 text-xs text-slate-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Ký nhận kiện hàng tự động qua máy quét mã vạch</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Phân loại và xếp kệ theo mã khách hàng OCVxxxxxx</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Chụp ảnh thực tế sản phẩm &amp; tình trạng đóng gói</span>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden h-[300px] border border-slate-700 shadow-2xl group">
                <Image
                  src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  alt="Logistics Warehouse Operations"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300">Kho Quảng Châu Active</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Online 24/7
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================= */}
      {/* SOURCING & CHROME EXTENSION SHOWCASE SECTION */}
      {/* ================================================================= */}
      <section id="sourcing" className="py-24 bg-white border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-bold font-mono text-[#0c3ed0] bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full uppercase tracking-wider mb-3">
                DỊCH VỤ MUA HỘ TRỌN GÓI
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">
                Đặt Hàng Tận Gốc &amp; <span className="gradient-text">Chrome Extension 1-Click</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Dù bạn dán link trực tiếp trên web hay lướt xem hàng trên 1688 / Taobao / Pinduoduo, OrderChinaViet đều có giải pháp mua hộ tối ưu cho bạn.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Card 1: Giai đoạn 1 - Web Buy-For-Me Form */}
            <ScrollReveal animation="slide-right" delay={100}>
              <div className="bg-[#f7f7f7] rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-lg flex flex-col justify-between h-full hover:border-[#fa3131]/40 transition-all group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono bg-rose-50 text-[#fa3131] border border-rose-200 px-3 py-1 rounded-full uppercase tracking-wider">
                      GIAI ĐOẠN 1 — MUA HỘ QUA LINK WEB
                    </span>
                    <ShoppingBag className="w-6 h-6 text-[#fa3131]" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-[#fa3131] transition-colors">
                    Dán Link Sản Phẩm &amp; Nhận Báo Giá
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Chỉ cần copy đường dẫn sản phẩm từ 1688, Taobao, Tmall hoặc Pinduoduo và dán vào hệ thống. Đội ngũ OrderChinaViet sẽ kiểm tra hàng, đàm phán giá và mua hộ ngay cho bạn.
                  </p>

                  {/* Video Hướng Dẫn Đặt Hàng Trực Quan */}
                  <div className="my-2">
                    <VideoPlayer src="/huong-dan-dat-hang.mp4" />
                  </div>

                  <div className="space-y-2.5 pt-2 text-xs text-slate-700 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Tỷ giá tệ niêm yết minh bạch (1 ¥ = {(settings.rateBuyForMe || settings.rateCnyToVnd || settings.cnyRate || 3680).toLocaleString('vi-VN')} ₫)
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Phí dịch vụ mua hộ ưu đãi chỉ từ 2%</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Hỗ trợ khiếu nại nhà cung cấp 1688 / Taobao khi sai hàng</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Link
                    href={`/${locale}/orders`}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#fa3131] hover:bg-[#d62828] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                  >
                    <span>Tạo Đơn Mua Hộ Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 2: Giai đoạn 2 - Chrome Extension Tool */}
            <ScrollReveal animation="slide-left" delay={200}>
              <div className="bg-[#f7f7f7] rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-lg flex flex-col justify-between h-full hover:border-sky-400/40 transition-all group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono bg-sky-50 text-sky-700 border border-sky-200 px-3 py-1 rounded-full uppercase tracking-wider">
                      GIAI ĐOẠN 2 — CHROME EXTENSION
                    </span>
                    <AppWindow className="w-6 h-6 text-sky-600" />
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    Công Cụ Thêm Vào Giỏ OrderChinaViet 1-Click
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Cài đặt tiện ích mở rộng trên Chrome / Cốc Cốc để đổi giá sang VNĐ realtime và thêm sản phẩm trực tiếp khi lướt web trên 1688 / Taobao.
                  </p>

                  {/* Video Hướng Dẫn Cài Extension */}
                  <div className="my-2">
                    <VideoPlayer src="/tai-extension.mp4" />
                  </div>

                  <div className="space-y-2.5 pt-2 text-xs text-slate-700 font-semibold">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tự động bóc tách tên, ảnh, size, màu sắc &amp; giá RMB</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tự động quy đổi sang VNĐ theo tỷ giá thực tế</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Cài đặt dễ dàng trong 30 giây trên Chrome &amp; Cốc Cốc</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-3">
                  <a
                    href="/extension/orderchinaviet-extension.zip"
                    download
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải Extension Chrome (.zip)</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4 text-sky-600" />
                    <span>Xem Hướng Dẫn</span>
                  </button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* INTERACTIVE RATE CALCULATOR SECTION */}
      {/* ================================================================= */}
      <section id="rates" className="py-24 bg-slate-50 border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full uppercase tracking-wider mb-3">
                CÔNG CỤ DỰ TOÁN
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">
                Tính Cước Vận Chuyển <span className="gradient-text">Ước Tính</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                Công cụ dự toán cước phí dựa trên khối lượng thực tế và kích thước quy đổi (DxRxC)
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="zoom-in" delay={150}>
            <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 grid lg:grid-cols-2 gap-8 items-start">
              {/* Form Inputs with SearchableSelect */}
              <div className="space-y-5">
                {/* 1. Giá trị hàng hóa Searchable Select */}
                <SearchableSelect
                  label="Giá Trị Hàng Hóa (VNĐ)"
                  options={cargoValueOptions}
                  selectedId={cargoValueSelect}
                  onSelect={(opt) => setCargoValueSelect(opt.id)}
                  customValue={customCargoValue}
                  onCustomValueChange={(val) => setCustomCargoValue(val)}
                  placeholder="Tìm kiếm giá trị hàng hóa..."
                  customPlaceholder="Nhập số tiền khai báo hàng hóa (VD: 2.000.000)..."
                  isCurrencyFormat={true}
                />

                {/* 2. Thời gian giao Searchable Select */}
                <SearchableSelect
                  label="Thời Gian Giao Hàng Dự Kiến"
                  options={deliveryTimeOptions}
                  selectedId={deliveryTimeSelect}
                  onSelect={(opt) => setDeliveryTimeSelect(opt.id)}
                  customValue={customDeliveryTime}
                  onCustomValueChange={(val) => setCustomDeliveryTime(val)}
                  placeholder="Tìm kiếm thời gian giao..."
                  customPlaceholder="Nhập thời gian giao dự kiến (VD: 7-10 ngày)..."
                />

                {/* 3. Loại hàng hóa Searchable Select */}
                <SearchableSelect
                  label="Loại Hàng Hóa"
                  options={categoryOptions}
                  selectedId={categorySelect}
                  onSelect={(opt) => setCategorySelect(opt.id)}
                  customValue={customCategory}
                  onCustomValueChange={(val) => setCustomCategory(val)}
                  placeholder="Tìm kiếm loại hàng hóa..."
                  customPlaceholder="Nhập loại hàng hóa cụ thể..."
                />

                {/* 4. Cân nặng & kích thước */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Cân Nặng Thực Tế (kg)
                    </label>
                    <input
                      type="number"
                      value={weightInput}
                      onChange={(e) => setWeightInput(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-primary-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Dài x Rộng x Cao (cm)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <input
                        type="number"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        placeholder="Dài"
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 text-center"
                      />
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        placeholder="Rộng"
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 text-center"
                      />
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        placeholder="Cao"
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Insurance Checkbox Option */}
                <div className="pt-1">
                  <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableInsurance}
                      onChange={(e) => setEnableInsurance(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Đăng ký Bảo Hiểm Hàng Hóa 100% (Phí 0.5%)</span>
                      <span className="text-[10px] text-slate-500 leading-relaxed block mt-0.5">
                        Bồi thường 100% giá trị lô hàng nếu xảy ra sự cố thất lạc, hư hỏng trong quá trình vận chuyển.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Estimated Result Summary Card */}
              <div className="bg-gradient-to-br from-slate-50 via-white to-primary-50/30 rounded-2xl p-6 space-y-4 shadow-lg border border-primary-100/80">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <span className="text-xs text-slate-600 font-semibold">Giá Trị Hàng Khai Báo</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {actualCargoValue.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <span className="text-xs text-slate-600 font-semibold">Cân Nặng Thể Tích (DxRxC/6000)</span>
                  <span className="text-sm font-mono font-bold text-primary-600">{volumetricWeight.toFixed(2)} kg</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <span className="text-xs text-slate-600 font-semibold">Cân Nặng Tính Cước (Max)</span>
                  <span className="text-sm font-mono font-bold text-amber-600">{chargeableWeight.toFixed(2)} kg</span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                  <span className="text-xs text-slate-600 font-semibold">Phí Bảo Hiểm Khai Giá (0.5%)</span>
                  <span className="text-sm font-mono font-bold text-emerald-600">{insuranceFee.toLocaleString('vi-VN')} ₫</span>
                </div>

                <div className="pt-2 space-y-4">
                  <div>
                    <span className="text-xs text-slate-600 block mb-1 font-semibold">Tổng Cước Vận Chuyển Dự Kiến</span>
                    <span className="text-3xl font-mono font-bold text-primary-700 block">
                      {estimatedTotal.toLocaleString('vi-VN')} ₫
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      * Dự toán đã bao gồm phí đóng gói &amp; bảo hiểm 100% hàng hóa.
                    </span>
                  </div>

                  {/* Action Buttons: Đăng Ký Đặt Hàng & Đăng Ký Tài Khoản */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <Link
                      href={`/${locale}/orders`}
                      className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-primary-500 active:scale-[0.99]"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Đăng Ký Đặt Hàng Ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <Link
                        href={`/${locale}/register`}
                        className="text-slate-500 hover:text-primary-600 font-semibold underline underline-offset-2 flex items-center gap-1"
                      >
                        Chưa có tài khoản? Đăng ký tại đây
                      </Link>
                      <Link
                        href={`/${locale}/rates`}
                        className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1"
                      >
                        Bảng giá chi tiết <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================= */}
      {/* FAQ SECTION WITH SCROLL REVEAL */}
      {/* ================================================================= */}
      <section className="py-24 bg-white border-t border-slate-100 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-bold font-mono text-sky-700 bg-sky-50 border border-sky-200 px-3.5 py-1 rounded-full uppercase tracking-wider mb-3">
                GIẢI ĐÁP THẮC MẮC
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">
                Câu Hỏi <span className="gradient-text">Thường Gặp</span>
              </h2>
              <p className="text-sm text-slate-600">Những thắc mắc phổ biến về quy trình đặt hàng và vận chuyển Trung – Việt</p>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <ScrollReveal key={idx} animation="fade-up" delay={80 * idx}>
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md">
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-slate-900 hover:text-primary-700 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-primary-600 shrink-0" />
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${openFaq === idx ? 'rotate-180 text-primary-600' : ''
                        }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-600 border-t border-slate-200/80 leading-relaxed animate-in fade-in duration-200">
                      {item.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* CALL TO ACTION (CTA) BANNER */}
      {/* ================================================================= */}
      <section className="py-20 relative overflow-hidden bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="zoom-in">
            <div className="bg-gradient-to-r from-primary-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-14 shadow-2xl text-center relative overflow-hidden text-white">
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />

              <span className="inline-block text-xs font-bold font-mono text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3.5 py-1 rounded-full uppercase tracking-wider mb-4">
                BẮT ĐẦU NGAY HÔM NAY
              </span>
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
                Sẵn Sàng Nhập Hàng Tận Gốc <br className="hidden sm:inline" />
                <span className="text-sky-400">Trung Quốc Cùng OrderChinaViet?</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
                Tạo tài khoản miễn phí để nhận mã khách hàng và trải nghiệm dịch vụ vận chuyển chính ngạch 3-7 Ngày.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href={`/${locale}/register`} className="btn-primary text-sm px-8 py-3.5">
                  <span>Đăng Ký Tài Khoản Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href={`/${locale}/login`} className="btn-secondary text-sm px-8 py-3.5 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white">
                  <span>Đăng Nhập Hệ Thống</span>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer Component */}
      <footer id="footer">
        <Footer locale={locale} dict={dict} />
      </footer>

      {/* ------------------------------------------------------------------- */}
      {/* SINGLE PAGE DYNAMIC CONTENT MODAL */}
      {/* ------------------------------------------------------------------- */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Top Bar */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="inline-block text-[11px] font-bold font-mono bg-primary-50 text-primary-700 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                  {modalItem.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {modalItem.title}
                </h3>
              </div>
              <button
                onClick={() => setModalItem(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-800 font-semibold flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <p>{modalItem.summary}</p>
              </div>

              <div className="pt-2 space-y-3 whitespace-pre-line text-slate-600">
                {modalItem.content}
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
              <span className="text-[11px] text-slate-400 font-mono">OrderChinaViet Single-Page Viewer</span>
              <button
                onClick={() => setModalItem(null)}
                className="btn-primary"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* PLATFORM DROPDOWN PORTAL — fixed position, escapes ALL overflow   */}
      {/* ================================================================= */}
      {platformOpen && dropdownPos && (
        <div
          ref={platformDropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 99999,
            width: '220px',
          }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn nền tảng</span>
          </div>
          <div className="p-1.5 space-y-0.5">
            {platforms.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPlatform(p);
                  setPlatformOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-left ${selectedPlatform.id === p.id
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-primary-600'
                  }`}
              >
                <div className="relative w-6 h-6 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white p-0.5 shadow-2xs">
                  <Image src={p.icon} alt={p.label} fill sizes="24px" className="object-contain" />
                </div>
                <span className="truncate">{p.label}</span>
                {selectedPlatform.id === p.id && (
                  <Check className="w-4 h-4 text-emerald-600 ml-auto shrink-0 stroke-[2.5]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Utilities rendered globally via RootLayout */}

      {/* ── GLOBAL REUSABLE GUIDE MODAL ── */}
      <OrderGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        locale={locale}
      />
    </div>
  );
}



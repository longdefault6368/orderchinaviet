'use client';

import { useState, useEffect } from 'react';
import Image, { StaticImageData } from 'next/image';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  HelpCircle,
  X,
  UserCheck,
  Zap,
  Search,
  CreditCard,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
} from 'lucide-react';
import { authStore } from '@/lib/auth-store';

import dangKyImg from '@/assets/images/dang-ky.png';
import taoDonHang1Img from '@/assets/images/tao-don-hang-1.png';
import taoDonHang2Img from '@/assets/images/tao-don-hang-2.png';
import taoDonHang3Img from '@/assets/images/tao-don-hang-3.png';
import napTienImg from '@/assets/images/nap-tien-vao-vi.png';
import datCocImg from '@/assets/images/dat-coc-don-hang.png';

interface OrderGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
}

export function OrderGuideModal({ isOpen, onClose, locale = 'vi' }: OrderGuideModalProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<{ src: StaticImageData | string; title: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleCreateOrderClick = () => {
    onClose();
    const user = authStore.getUser();
    if (user && authStore.isLoggedIn()) {
      router.push(`/${locale}/orders`);
    } else {
      router.push(`/${locale}/login`);
    }
  };

  const guideSteps = [
    {
      step: 1,
      title: 'Bước 1: Đăng Ký Tài Khoản',
      summary: 'Tạo tài khoản thành viên miễn phí trên OrderChinaViet để quản lý đơn hàng, theo dõi mã vận đơn và nhận thông báo biến động số dư tức thì.',
      icon: UserCheck,
      badge: 'Đăng Ký Thành Viên',
    },
    {
      step: 2,
      title: 'Bước 2: Cài Đặt Công Cụ Mua Hàng',
      summary: 'Cài đặt Tiện ích Extension OrderChinaViet trên trình duyệt Chrome hoặc Cốc Cốc. Extension sẽ tự động quy đổi giá từ Nhân Dân Tệ (CNY) sang VNĐ ngay trên trang 1688, Taobao, Tmall.',
      icon: Zap,
      badge: 'Extension Chrome & Cốc Cốc',
    },
    {
      step: 3,
      title: 'Bước 3: Tạo Đơn Hàng',
      summary: 'Tìm kiếm sản phẩm ưa thích trên 1688, Taobao, Tmall. Thêm sản phẩm vào Giỏ Hàng OrderChinaViet và gửi yêu cầu tư vấn mua hộ trọn gói.',
      icon: Search,
      badge: '1688 / Taobao / Tmall',
    },
    {
      step: 4,
      title: 'Bước 4: Nạp Tiền Vào Ví',
      summary: 'Nạp tiền vào Ví dư tài khoản qua Chuyển khoản ngân hàng tự động 24/7 (PayOS VietQR), PayPal hoặc Ví Crypto để sẵn sàng đặt cọc mua hàng.',
      icon: CreditCard,
      badge: 'Ví Cước Tự Động 24/7',
    },
    {
      step: 5,
      title: 'Bước 5: Đặt Cọc Đơn Hàng',
      summary: 'Xác nhận đặt cọc (từ 70% - 100% giá trị đơn hàng). Chuyên viên mua hàng OrderChinaViet sẽ tiến hành phát hàng với chủ shop Trung Quốc trong 1-2 giờ.',
      icon: CheckCircle2,
      badge: 'Cọc Đơn Hàng 70%',
    },
    {
      step: 6,
      title: 'Bước 6: Nhận Hàng & Thanh Toán',
      summary: 'Kiện hàng được đóng gói, vận chuyển về kho Việt Nam (TP.HCM / Hà Nội). Bạn thanh toán số tiền còn lại và nhận hàng tận nhà trên 63 tỉnh thành.',
      icon: Truck,
      badge: 'Giao Hàng 63 Tỉnh Thành',
    },
  ];

  const step3Slides = [
    { src: taoDonHang1Img, title: 'Giao diện xem chi tiết sản phẩm và cài đặt số lượng' },
    { src: taoDonHang2Img, title: 'Bảng thuộc tính màu sắc, kích cỡ và giá tiền VNĐ quy đổi' },
    { src: taoDonHang3Img, title: 'Nút bấm thêm sản phẩm vào Giỏ Hàng OrderChinaViet' },
  ];

  const current = guideSteps.find((s) => s.step === activeStep) || guideSteps[0];
  const IconComp = current.icon;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] bg-white rounded-3xl max-w-2xl w-[92vw] sm:w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#fa3131] border border-rose-200 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Quy Trình Đặt Hàng Mua Hộ Trọn Gói</h3>
              <p className="text-xs text-slate-500">6 bước đơn giản chuẩn hóa để đặt mua sỉ hàng Trung Quốc tận xưởng về Việt Nam</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
          {guideSteps.map((st) => (
            <button
              key={st.step}
              onClick={() => {
                setActiveStep(st.step);
                if (st.step === 3) setSlideIndex(0);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeStep === st.step
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  activeStep === st.step ? 'bg-white text-primary-600' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {st.step}
              </span>
              <span>B{st.step}</span>
            </button>
          ))}
        </div>

        {/* Active Step Content Card */}
        <div className="space-y-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-primary-50 text-primary-700 font-bold text-xs rounded-lg border border-primary-200">
              {current.badge}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">Bước {current.step} / 6</span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">{current.title}</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">{current.summary}</p>
            </div>
          </div>

          {/* ── MEDIA SECTION PER STEP ── */}
          {/* Bước 1: Ảnh dang-ky.png (Click để xem to) */}
          {activeStep === 1 && (
            <div className="space-y-2 pt-1">
              <div
                onClick={() => setZoomImage({ src: dangKyImg, title: 'Bước 1: Hướng Dẫn Đăng Ký Tài Khoản OrderChinaViet' })}
                className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group cursor-pointer hover:border-primary-400 transition-all"
              >
                <div className="relative w-full h-52 sm:h-64 bg-slate-100">
                  <Image
                    src={dangKyImg}
                    alt="Hướng dẫn đăng ký tài khoản OrderChinaViet"
                    fill
                    className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                    <ZoomIn className="w-3.5 h-3.5 text-primary-400" />
                    <span>Bấm để phóng to ảnh</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-center text-slate-500 font-medium italic">
                (Click trực tiếp vào ảnh để mở ảnh kích thước lớn)
              </p>
            </div>
          )}

          {/* Bước 2: Video tai-extension.mp4 */}
          {activeStep === 2 && (
            <div className="space-y-2 pt-1">
              <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 shadow-md aspect-video">
                <video
                  src="/tai-extension.mp4"
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                >
                  Trình duyệt không hỗ trợ xem video. Vui lòng tải file để xem.
                </video>
              </div>
              <p className="text-[11px] text-center text-slate-500 font-medium italic">
                Video hướng dẫn các bước cài đặt tiện ích Extension Chrome &amp; Cốc Cốc
              </p>
            </div>
          )}

          {/* Bước 3: Slide 3 ảnh tao-don-hang-1.png, 2, 3 */}
          {activeStep === 3 && (
            <div className="space-y-3 pt-1">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group">
                <div
                  onClick={() =>
                    setZoomImage({
                      src: step3Slides[slideIndex].src,
                      title: `Bước 3: Tạo Đơn Hàng (Ảnh ${slideIndex + 1}/3 - ${step3Slides[slideIndex].title})`,
                    })
                  }
                  className="relative w-full h-52 sm:h-64 bg-slate-100 cursor-pointer"
                >
                  <Image
                    src={step3Slides[slideIndex].src}
                    alt={step3Slides[slideIndex].title}
                    fill
                    className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                      <ZoomIn className="w-3.5 h-3.5 text-primary-400" />
                      <span>Bấm để phóng to ảnh</span>
                    </div>
                  </div>
                </div>

                {/* Left / Right Slide Navigation Buttons */}
                <button
                  type="button"
                  onClick={() => setSlideIndex((prev) => (prev === 0 ? step3Slides.length - 1 : prev - 1))}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSlideIndex((prev) => (prev === step3Slides.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Slider Dots & Caption */}
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
                <span className="text-[11px] truncate max-w-[260px] sm:max-w-md font-semibold text-slate-700">
                  {slideIndex + 1}. {step3Slides[slideIndex].title}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {step3Slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSlideIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        slideIndex === idx ? 'w-5 bg-primary-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bước 4: Ảnh nap-tien-vao-vi.png (Click để xem to) */}
          {activeStep === 4 && (
            <div className="space-y-2 pt-1">
              <div
                onClick={() => setZoomImage({ src: napTienImg, title: 'Bước 4: Hướng Dẫn Nạp Tiền Vào Ví OrderChinaViet' })}
                className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group cursor-pointer hover:border-primary-400 transition-all"
              >
                <div className="relative w-full h-52 sm:h-64 bg-slate-100">
                  <Image
                    src={napTienImg}
                    alt="Hướng dẫn nạp tiền vào ví OrderChinaViet"
                    fill
                    className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                    <ZoomIn className="w-3.5 h-3.5 text-primary-400" />
                    <span>Bấm để phóng to ảnh</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-center text-slate-500 font-medium italic">
                (Click trực tiếp vào ảnh để mở ảnh kích thước lớn)
              </p>
            </div>
          )}

          {/* Bước 5: Ảnh dat-coc-don-hang.png (Click để xem to) */}
          {activeStep === 5 && (
            <div className="space-y-2 pt-1">
              <div
                onClick={() => setZoomImage({ src: datCocImg, title: 'Bước 5: Hướng Dẫn Đặt Cọc Đơn Hàng Mua Hộ' })}
                className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group cursor-pointer hover:border-primary-400 transition-all"
              >
                <div className="relative w-full h-52 sm:h-64 bg-slate-100">
                  <Image
                    src={datCocImg}
                    alt="Hướng dẫn đặt cọc đơn hàng OrderChinaViet"
                    fill
                    className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                    <ZoomIn className="w-3.5 h-3.5 text-primary-400" />
                    <span>Bấm để phóng to ảnh</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-center text-slate-500 font-medium italic">
                (Click trực tiếp vào ảnh để mở ảnh kích thước lớn)
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Đóng Hướng Dẫn
          </button>

          {activeStep === 1 && (
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/${locale}/register`);
              }}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Đăng Ký Tài Khoản Ngay</span>
            </button>
          )}

          {activeStep === 2 && (
            <a
              href="/extension/orderchinaviet-extension.zip"
              download
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Tải Extension Mua Hàng (.ZIP)</span>
            </a>
          )}

          {(activeStep === 3 || activeStep === 4 || activeStep === 5) && (
            <button
              type="button"
              onClick={handleCreateOrderClick}
              className="px-6 py-2.5 bg-gradient-to-r from-[#fa3131] to-[#0c3ed0] text-white font-bold rounded-xl text-xs transition-all shadow-md hover:scale-105 flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Tạo Đơn Hàng Ngay</span>
            </button>
          )}
        </div>
      </div>

      {/* ── IMAGE ZOOM LIGHTBOX MODAL ── */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-[20000] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-150 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-800 flex flex-col cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 px-2 text-white">
              <span className="text-xs sm:text-sm font-bold truncate pr-4 text-slate-200">{zoomImage.title}</span>
              <button
                onClick={() => setZoomImage(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full h-[65vh] sm:h-[75vh] mt-3">
              <Image
                src={zoomImage.src}
                alt={zoomImage.title}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

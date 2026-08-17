'use client';

import { useState } from 'react';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import {
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
  X,
  ArrowRight,
} from 'lucide-react';

import dangKyImg from '@/assets/images/dang-ky.png';
import taoDonHang1Img from '@/assets/images/tao-don-hang-1.png';
import taoDonHang2Img from '@/assets/images/tao-don-hang-2.png';
import taoDonHang3Img from '@/assets/images/tao-don-hang-3.png';
import napTienImg from '@/assets/images/nap-tien-vao-vi.png';
import datCocImg from '@/assets/images/dat-coc-don-hang.png';

interface OrderProcessGuideSectionProps {
  locale?: string;
}

export function OrderProcessGuideSection({ locale = 'vi' }: OrderProcessGuideSectionProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [slideIndex, setSlideIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState<{ src: StaticImageData | string; title: string } | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-[11px] font-bold border border-primary-200 uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />
          <span>Quy Trình Chuẩn Hóa</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Quy Trình Đặt Hàng 6 Bước Đơn Giản</h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Mọi khâu từ tạo tài khoản, đàm phán giá, thanh toán đến đóng gói vận chuyển đều được tối ưu hóa chuẩn xác từng bước.
        </p>
      </div>

      {/* Interactive 6-Step Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        {/* Step Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 pb-2 border-b border-slate-100">
          {guideSteps.map((st) => {
            const StIcon = st.icon;
            const isSelected = activeStep === st.step;
            return (
              <button
                key={st.step}
                type="button"
                onClick={() => {
                  setActiveStep(st.step);
                  if (st.step === 3) setSlideIndex(0);
                }}
                className={`p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between gap-2 border ${
                  isSelected
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-xl text-xs flex items-center justify-center font-bold ${
                      isSelected ? 'bg-white text-primary-600' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {st.step}
                  </span>
                  <StIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                </div>
                <div className="text-xs font-bold truncate">{st.badge}</div>
              </button>
            );
          })}
        </div>

        {/* Active Step Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Step Description & Actions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
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
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{current.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-medium">
                  {current.summary}
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center gap-3">
              {activeStep === 1 && (
                <Link
                  href={`/${locale}/register`}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Đăng Ký Tài Khoản Ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {activeStep === 2 && (
                <a
                  href="/extension/orderchinaviet-extension.zip"
                  download
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>Tải Extension Mua Hàng (.ZIP)</span>
                </a>
              )}

              {(activeStep === 3 || activeStep === 4 || activeStep === 5) && (
                <Link
                  href={`/${locale}/orders`}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Tạo Đơn Hàng Ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Media Preview (Images with Lightbox, Video Player, Slider) */}
          <div className="lg:col-span-7 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
            {/* Bước 1: Ảnh dang-ky.png (Click để xem to) */}
            {activeStep === 1 && (
              <div className="space-y-2">
                <div
                  onClick={() => setZoomImage({ src: dangKyImg, title: 'Bước 1: Hướng Dẫn Đăng Ký Tài Khoản OrderChinaViet' })}
                  className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group cursor-pointer hover:border-primary-400 transition-all"
                >
                  <div className="relative w-full h-56 sm:h-72 bg-slate-100">
                    <Image
                      src={dangKyImg}
                      alt="Hướng dẫn đăng ký tài khoản OrderChinaViet"
                      fill
                      className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                      <ZoomIn className="w-4 h-4 text-primary-400" />
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
              <div className="space-y-2">
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
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group">
                  <div
                    onClick={() =>
                      setZoomImage({
                        src: step3Slides[slideIndex].src,
                        title: `Bước 3: Tạo Đơn Hàng (Ảnh ${slideIndex + 1}/3 - ${step3Slides[slideIndex].title})`,
                      })
                    }
                    className="relative w-full h-56 sm:h-72 bg-slate-100 cursor-pointer"
                  >
                    <Image
                      src={step3Slides[slideIndex].src}
                      alt={step3Slides[slideIndex].title}
                      fill
                      className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                        <ZoomIn className="w-4 h-4 text-primary-400" />
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
                  <span className="text-[11px] truncate max-w-[240px] sm:max-w-md font-semibold text-slate-700">
                    {slideIndex + 1}. {step3Slides[slideIndex].title}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {step3Slides.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
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
              <div className="space-y-2">
                <div
                  onClick={() => setZoomImage({ src: napTienImg, title: 'Bước 4: Hướng Dẫn Nạp Tiền Vào Ví OrderChinaViet' })}
                  className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group cursor-pointer hover:border-primary-400 transition-all"
                >
                  <div className="relative w-full h-56 sm:h-72 bg-slate-100">
                    <Image
                      src={napTienImg}
                      alt="Hướng dẫn nạp tiền vào ví OrderChinaViet"
                      fill
                      className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                      <ZoomIn className="w-4 h-4 text-primary-400" />
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
              <div className="space-y-2">
                <div
                  onClick={() => setZoomImage({ src: datCocImg, title: 'Bước 5: Hướng Dẫn Đặt Cọc Đơn Hàng Mua Hộ' })}
                  className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs group cursor-pointer hover:border-primary-400 transition-all"
                >
                  <div className="relative w-full h-56 sm:h-72 bg-slate-100">
                    <Image
                      src={datCocImg}
                      alt="Hướng dẫn đặt cọc đơn hàng OrderChinaViet"
                      fill
                      className="object-contain p-2 group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg backdrop-blur-xs">
                      <ZoomIn className="w-4 h-4 text-primary-400" />
                      <span>Bấm để phóng to ảnh</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-center text-slate-500 font-medium italic">
                  (Click trực tiếp vào ảnh để mở ảnh kích thước lớn)
                </p>
              </div>
            )}

            {/* Bước 6: Nhận Hàng & Giao 63 Tỉnh Thành */}
            {activeStep === 6 && (
              <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-4 min-h-[280px]">
                <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center shadow-xs">
                  <Truck className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">Vận Chuyển An Toàn &amp; Giao Tận Nhà</h4>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                    Kiện hàng được kiểm đếm, đóng thùng gỗ hoặc bọc bóng khí an toàn trước khi thông quan về kho Hà Nội / TP.HCM và chuyển phát tới tận địa chỉ của bạn.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cam kết bảo hiểm 100% trong quá trình vận chuyển</span>
                </div>
              </div>
            )}
          </div>
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
                type="button"
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
    </div>
  );
}

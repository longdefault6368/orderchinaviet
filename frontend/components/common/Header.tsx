'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Menu as MenuIcon,
  X,
  LogOut,
  User,
  ChevronDown,
  ShoppingBag,
  Award,
  Boxes,
  Truck,
  FileCheck,
  CreditCard,
  BookOpen,
  HelpCircle,
  ShieldCheck,
  Bell,
  LayoutDashboard,
  Phone,
  Mail,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  MessageSquare,
  Search,
} from 'lucide-react';
import { Locale, translate } from '@/lib/i18n';
import { authStore, UserSession } from '@/lib/auth-store';
import { settingsStore, ContactSettings, DEFAULT_CONTACT_SETTINGS } from '@/lib/settings-store';
import { LanguageSwitcher } from './LanguageSwitcher';

import zaloImg from '@/assets/images/zalo.png';
import telegramImg from '@/assets/images/telegram.webp';
import whatsappImg from '@/assets/images/whatsapp.png';
import wechatImg from '@/assets/images/wechat.webp';
import facebookImg from '@/assets/images/facebook.webp';

export interface ContentModalItem {
  title: string;
  category: string;
  summary: string;
  content: string;
}

interface HeaderProps {
  locale: Locale;
  dict: any;
  onOpenContentModal?: (item: ContentModalItem) => void;
}

export function Header({ locale, dict, onOpenContentModal }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });

  const [contactSettings, setContactSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setUser(authStore.getUser());
    setContactSettings(settingsStore.getSettings());
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleSettingsUpdate = () => {
      setContactSettings(settingsStore.getSettings());
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('orderchinaviet_settings_updated', handleSettingsUpdate);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('orderchinaviet_settings_updated', handleSettingsUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await authStore.logoutWithApi();
    setUser(null);
    setIsOpen(false);
    router.push(`/${locale}`);
  };

  const handleMouseEnter = (name: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setIsContactModalOpen(false);
      setContactForm({ name: '', phone: '', email: '', message: '' });
    }, 2500);
  };

  const handleFeeCalculatorClick = (e: React.MouseEvent) => {
    if (pathname === `/${locale}` || pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('rates') || document.getElementById('calculator');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push(`/${locale}/rates`);
      }
    } else {
      router.push(`/${locale}/rates`);
    }
  };

  // Structured Menu Items
  const servicesMenu = [
    {
      title: 'Đặt hàng Trung quốc',
      category: 'Mua Hàng Hộ',
      summary: 'Mua hộ Taobao, 1688, Tmall giá gốc tận xưởng.',
      href: `/${locale}/services/order-china`,
      icon: ShoppingBag,
    },
    {
      title: 'Vận chuyển trung việt',
      category: 'Vận Chuyển',
      summary: 'Vận chuyển chính ngạch đường bộ & đường bay.',
      href: `/${locale}/services/van-chuyen`,
      icon: Truck,
    },
    {
      title: 'Đổi tiền/ Thanh toán hộ',
      category: 'Tài Chính & Ngoại Tệ',
      summary: 'Nạp ví Alipay, WeChat & thanh toán hộ an toàn.',
      href: `/${locale}/services/alipay`,
      icon: CreditCard,
    },
  ];

  const guidesMenu = [
    {
      title: 'Hướng dẫn đặt hàng',
      category: 'Hướng Dẫn Hệ Thống',
      summary: 'Các bước tạo đơn mua hộ và ủy thác đơn hàng.',
      href: `/${locale}/guides/dat-hang`,
      icon: HelpCircle,
    },
    {
      title: 'Hướng dẫn đổi tiền',
      category: 'Hướng Dẫn Tài Chính',
      summary: 'Quy trình đổi tiền Nhân Dân Tệ và nạp ví Alipay/WeChat.',
      href: `/${locale}/guides/doi-tien`,
      icon: CreditCard,
    },
    {
      title: 'Hướng dẫn nạp tiền',
      category: 'Hướng Dẫn Tài Chính',
      summary: 'Nạp tiền ví cước tự động cộng dư trong 60 giây.',
      href: `/${locale}/guides/nap-tien`,
      icon: BookOpen,
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* ── STOREFRONT TOPBAR (MÀU SÁNG SẮC NÉT) ── */}
      <div className="bg-slate-100/90 backdrop-blur-sm text-slate-800 border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1 sm:py-1.5 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Side: Mua Hộ | Đổi Tiền/ Thanh Toán Hộ | Tra Cứu Đơn */}
          <div className="flex items-center gap-1.5 sm:gap-3 font-bold text-[0.7rem] sm:text-xs text-slate-700">
            <Link
              href={`/${locale}/services/order-china`}
              className="hover:text-primary-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-600" />
              <span>Mua Hộ</span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href={`/${locale}/services/alipay`}
              className="hover:text-primary-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-600" />
              <span>Đổi Tiền </span>
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href={`/${locale}/track`}
              className="hover:text-primary-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary-600" />
              <span>Tra Cứu Đơn</span>
            </Link>
          </div>

          {/* Right Side: Tỷ Giá Đổi Tiền (CNY ➔ VNĐ) */}
          <div className="flex items-center gap-1.5 font-bold text-slate-600 text-[0.7rem] sm:text-xs shrink-0">
            <span className="hidden sm:inline text-slate-500">Tỷ giá:</span>
            <span className="font-mono font-bold text-primary-700 bg-white px-2 sm:px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs text-[0.7rem] sm:text-xs">
              1 ¥ = {contactSettings.rateCnyToVnd.toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div
        className={`transition-all duration-300 ${scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md h-16 border-b border-slate-100'
          : 'bg-white/90 backdrop-blur-sm h-16 border-b border-slate-100/80'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Logo Branding */}
            <Link
              href={`/${locale}`}
              onClick={(e) => {
                if (pathname === `/${locale}` || pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="inline-block group shrink-0"
            >
              <div className="relative h-11 w-44 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/logo-light.png"
                  alt="OrderChinaViet Logo"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation Menu */}
            <nav className="hidden lg:flex items-center space-x-7 text-sm font-bold text-slate-700">
              {/* Dịch Vụ Khác Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('services')}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center gap-1.5 hover:text-primary-600 transition-colors py-2 cursor-pointer text-sm font-bold">
                  <span>Dịch Vụ Khác</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'services' ? 'rotate-180 text-primary-600' : ''}`} />
                </button>

                {activeDropdown === 'services' && (
                  <div className="absolute top-full left-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 grid grid-cols-1 gap-1 animate-in fade-in zoom-in-95 duration-150 z-50">
                    {servicesMenu.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-slate-900 font-bold group-hover:text-primary-600 transition-colors text-sm">{item.title}</div>
                            <div className="text-xs text-slate-500 font-normal">{item.summary}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hướng Dẫn Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('guides')}
                onMouseLeave={handleMouseLeave}
              >
                <button className="flex items-center gap-1.5 hover:text-primary-600 transition-colors py-2 cursor-pointer text-sm font-bold">
                  <span>Hướng Dẫn</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'guides' ? 'rotate-180 text-primary-600' : ''}`} />
                </button>

                {activeDropdown === 'guides' && (
                  <div className="absolute top-full left-0 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 z-50">
                    {guidesMenu.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={idx}
                          href={item.href}
                          onClick={() => setActiveDropdown(null)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-all cursor-pointer group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                            <Icon className="w-4 h-4 shrink-0" />
                          </div>
                          <div>
                            <div className="text-slate-900 font-bold group-hover:text-primary-600 transition-colors text-sm">{item.title}</div>
                            <div className="text-xs text-slate-500 font-normal">{item.summary}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tính Giá */}
              <button
                onClick={handleFeeCalculatorClick}
                className="hover:text-primary-600 transition-colors py-2 cursor-pointer text-sm font-bold text-slate-700 bg-transparent border-none"
              >
                Tính Giá
              </button>

              {/* Tra Cứu Đơn */}
              <Link
                href={`/${locale}/track`}
                className="hover:text-primary-600 transition-colors py-2 cursor-pointer text-sm font-bold"
              >
                Tra Cứu Đơn
              </Link>

              {/* Blog */}
              <Link
                href={`/${locale}/blog`}
                className="hover:text-primary-600 transition-colors py-2 cursor-pointer text-sm font-bold"
              >
                Blog
              </Link>

              {/* Liên Hệ - Trigger Popup Modal */}
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="hover:text-primary-600 transition-colors py-2 cursor-pointer text-sm font-bold text-slate-700 bg-transparent border-none"
              >
                Liên Hệ
              </button>
            </nav>

            {/* Right Action Bar */}
            <div className="hidden lg:flex items-center space-x-4">
              <LanguageSwitcher currentLocale={locale} />

              {!mounted ? (
                <div className="w-28 h-8 rounded-full bg-slate-100 animate-pulse" />
              ) : user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 text-slate-700 hover:text-primary-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-1 rounded-full border border-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    {user.avatarUrl ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-primary-600 text-white flex items-center justify-center text-[10px] font-bold">
                        <img src={user.avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="truncate max-w-[120px]">{user.fullName}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180 text-primary-600' : 'text-slate-400'}`} />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 z-50">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <div className="text-xs font-bold text-slate-900 truncate">{user.fullName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
                      </div>

                      {/* Role-Based Portal Links */}
                      {(user.role === 'SUPER_ADMIN' || user.role === 'STAFF') && (
                        <Link
                          href={`/${locale}/admin`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-amber-700" />
                          <span>Trang Quản Trị Admin</span>
                        </Link>
                      )}

                      {(user.role === 'AFFILIATE' || user.customerCode?.startsWith('OCV_AFF')) && (
                        <Link
                          href={`/${locale}/affiliate/dashboard`}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>Cổng Tiếp Thị Liên Kết</span>
                        </Link>
                      )}

                      {(user.role === 'CUSTOMER' || !user.role) && (
                        <>
                          <Link
                            href={`/${locale}/dashboard`}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors"
                          >
                            <User className="w-4 h-4 text-primary-600" />
                            <span>Bảng Điều Khiển Khách Hàng</span>
                          </Link>

                          <Link
                            href={`/${locale}/orders`}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors"
                          >
                            <ShoppingBag className="w-4 h-4 text-primary-600" />
                            <span>Quản Lý Đơn Hàng</span>
                          </Link>
                        </>
                      )}

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Đăng Xuất Tài Khoản</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${locale}/login`}
                    className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-primary-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    className="px-4 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    Đăng Ký
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="flex lg:hidden items-center gap-3">
              <LanguageSwitcher currentLocale={locale} />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-slate-700 hover:text-primary-600 focus:outline-none cursor-pointer"
              >
                {isOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-4 pb-6 space-y-3 max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-top-5">
          <button
            onClick={() => {
              setIsOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="block text-slate-900 font-bold text-sm py-2 border-b border-slate-100 w-full text-left cursor-pointer"
          >
            Trang Chủ
          </button>

          {/* Mobile Services */}
          <div className="py-2 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dịch Vụ Khác</div>
            <div className="space-y-1.5 pl-2">
              {servicesMenu.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-sm font-semibold text-slate-700 py-1 hover:text-primary-600 cursor-pointer"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Guides */}
          <div className="py-2 border-b border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hướng Dẫn</div>
            <div className="space-y-1.5 pl-2">
              {guidesMenu.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-sm font-semibold text-slate-700 py-1 hover:text-primary-600 cursor-pointer"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>

          <button
            onClick={(e) => {
              setIsOpen(false);
              handleFeeCalculatorClick(e);
            }}
            className="block text-slate-900 font-bold text-sm py-2 border-b border-slate-100 w-full text-left cursor-pointer bg-transparent"
          >
            Tính Giá
          </button>
          <Link
            href={`/${locale}/track`}
            onClick={() => setIsOpen(false)}
            className="block text-slate-900 font-bold text-sm py-2 border-b border-slate-100 w-full text-left cursor-pointer"
          >
            Tra Cứu Đơn
          </Link>
          <Link
            href={`/${locale}/blog`}
            onClick={() => setIsOpen(false)}
            className="block text-slate-900 font-bold text-sm py-2 border-b border-slate-100 w-full text-left cursor-pointer"
          >
            Blog
          </Link>

          <button
            onClick={() => {
              setIsOpen(false);
              setIsContactModalOpen(true);
            }}
            className="block text-slate-900 font-bold text-sm py-2 border-b border-slate-100 w-full text-left cursor-pointer"
          >
            Liên Hệ
          </button>

          <div className="pt-3 flex flex-col gap-2">
            {user ? (
              <>
                {(user.role === 'SUPER_ADMIN' || user.role === 'STAFF') && (
                  <Link
                    href={`/${locale}/admin`}
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 text-center text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all"
                  >
                    Trang Quản Trị Admin
                  </Link>
                )}

                {(user.role === 'AFFILIATE' || user.customerCode?.startsWith('OCV_AFF')) && (
                  <Link
                    href={`/${locale}/affiliate/dashboard`}
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 text-center text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
                  >
                    Cổng Tiếp Thị Liên Kết
                  </Link>
                )}

                {(user.role === 'CUSTOMER' || !user.role) && (
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 text-center text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-sm"
                  >
                    Bảng Điều Khiển Khách Hàng
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full text-left text-rose-600 font-bold text-sm py-2 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Đăng Xuất
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href={`/${locale}/login`}
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-bold text-[#fa3131] bg-rose-50 border border-rose-200 rounded-xl transition-all"
                >
                  Đăng Nhập
                </Link>
                <Link
                  href={`/${locale}/register`}
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-[#fa3131] hover:bg-[#d62828] rounded-xl shadow-sm transition-all"
                >
                  Đăng Ký Tài Khoản Mới
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fixed Floating Contact Button & Modal rendered OUTSIDE header via Portal */}
      {mounted && createPortal(
        <>
          <button
            onClick={() => setIsContactModalOpen(true)}
            className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-[#fa3131] hover:bg-[#d62828] text-white py-3.5 px-2.5 rounded-l-2xl shadow-2xl flex flex-col items-center gap-2 font-bold text-xs cursor-pointer transition-all hover:pl-3.5 border-y border-l border-white/20"
            title="Liên hệ hỗ trợ 24/7"
          >
            <Phone className="w-4 h-4 animate-bounce text-amber-300" />
            <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-bold tracking-widest uppercase">LIÊN HỆ HỖ TRỢ</span>
          </button>

          {isContactModalOpen && (
            <div className="fixed inset-0 z-[999] bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white rounded-3xl max-w-xl w-[92vw] sm:w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto text-slate-800">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#fa3131] border border-rose-200 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Trung Tâm Hỗ Trợ</h3>
                      <p className="text-xs text-slate-500">Liên hệ trực tiếp CSKH hoặc gửi yêu cầu tư vấn 24/7</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsContactModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Contact Buttons Grid (Hotline, Telegram, Zalo, WhatsApp, Facebook) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {contactSettings.showHotline && contactSettings.hotline && (
                    <a
                      href={`tel:${contactSettings.hotline.split('/')[0].trim()}`}
                      className="p-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-2xl transition-all flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#fa3131] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Hotline CSKH</span>
                        <span className="font-mono font-bold text-slate-900 text-xs group-hover:text-[#fa3131] truncate block">{contactSettings.hotline}</span>
                      </div>
                    </a>
                  )}

                  {contactSettings.showZaloLink && contactSettings.zaloLink && (
                    <a
                      href={contactSettings.zaloLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-2xl transition-all flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 bg-white border border-slate-200 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Image src={zaloImg} alt="Zalo" width={28} height={28} className="object-contain w-full h-full" />
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Hỗ Trợ Zalo OA</span>
                        <span className="font-bold text-slate-900 text-xs group-hover:text-[#0068FF]">Chat Zalo Trực Tuyến</span>
                      </div>
                    </a>
                  )}

                  {contactSettings.showTelegramLink && contactSettings.telegramLink && (
                    <a
                      href={contactSettings.telegramLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 rounded-2xl transition-all flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 bg-white border border-slate-200 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Image src={telegramImg} alt="Telegram" width={28} height={28} className="object-contain w-full h-full" />
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Telegram Hỗ Trợ</span>
                        <span className="font-bold text-slate-900 text-xs group-hover:text-[#24A1DE]">Chat Telegram 24/7</span>
                      </div>
                    </a>
                  )}

                  {contactSettings.showWhatsappLink && contactSettings.whatsappLink && (
                    <a
                      href={contactSettings.whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-200 rounded-2xl transition-all flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 bg-white border border-slate-200 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Image src={whatsappImg} alt="WhatsApp" width={28} height={28} className="object-contain w-full h-full" />
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">WhatsApp Business</span>
                        <span className="font-bold text-slate-900 text-xs group-hover:text-[#25D366]">Chat WhatsApp CSKH</span>
                      </div>
                    </a>
                  )}

                  {contactSettings.showFacebookLink && contactSettings.facebookLink && (
                    <a
                      href={contactSettings.facebookLink}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl transition-all flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden relative shrink-0 bg-white border border-slate-200 p-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Image src={facebookImg} alt="Facebook" width={28} height={28} className="object-contain w-full h-full" />
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Fanpage Facebook</span>
                        <span className="font-bold text-slate-900 text-xs group-hover:text-[#1877F2]">OrderChinaViet Official</span>
                      </div>
                    </a>
                  )}
                </div>

                {/* Info Badges */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  {contactSettings.showEmail && contactSettings.email && (
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Mail className="w-4 h-4 text-[#fa3131] shrink-0" />
                      <span>Email hỗ trợ: <strong className="font-mono text-slate-900">{contactSettings.email}</strong></span>
                    </div>
                  )}
                  {contactSettings.showWorkingHours && contactSettings.workingHours && (
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Clock className="w-4 h-4 text-[#0c3ed0] shrink-0" />
                      <span>Thời gian làm việc: <strong className="text-slate-900">{contactSettings.workingHours}</strong></span>
                    </div>
                  )}
                  {contactSettings.showAddressVietnam && contactSettings.addressVietnam && (
                    <div className="flex items-start gap-2 text-slate-700 font-medium pt-1">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Địa chỉ văn phòng: <strong className="text-slate-900">{contactSettings.addressVietnam}</strong></span>
                    </div>
                  )}
                </div>

                {/* Direct Message Form */}
                {contactSubmitted ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 text-emerald-800">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="font-bold text-sm">Gửi Yêu Cầu Thành Công!</h4>
                    <p className="text-xs text-emerald-600">Đội ngũ CSKH OrderChinaViet sẽ phản hồi quý khách qua Zalo/SĐT trong vòng 15 phút.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Gửi Lời Nhắn Nhanh</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Họ và tên của bạn *"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#fa3131]"
                      />
                      <input
                        type="tel"
                        required
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        placeholder="Số điện thoại / Zalo *"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-[#fa3131]"
                      />
                    </div>

                    <textarea
                      rows={3}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Nội dung cần hỗ trợ (Tư vấn tỷ giá, tìm nguồn hàng, cước vận chuyển...)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#fa3131] resize-none"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsContactModalOpen(false)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-[#fa3131] to-[#0c3ed0] text-white font-bold rounded-xl text-xs transition-all shadow-md hover:scale-105 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi Yêu Cầu Hỗ Trợ</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </header>
  );
}

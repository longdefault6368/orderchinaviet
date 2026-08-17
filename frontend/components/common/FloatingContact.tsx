'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Headset,
  Copy,
  Check,
  QrCode,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { settingsStore, ContactSettings, DEFAULT_CONTACT_SETTINGS } from '@/lib/settings-store';

import zaloImg from '@/assets/images/zalo.png';
import telegramImg from '@/assets/images/telegram.webp';
import whatsappImg from '@/assets/images/whatsapp.png';
import wechatImg from '@/assets/images/wechat.webp';
import facebookImg from '@/assets/images/facebook.webp';

interface ContactOption {
  id: string;
  name: string;
  subtitle: string;
  imgSrc: any;
  url: string;
  isModal?: boolean;
}

export function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'wechat' | null>(null);
  const [copiedWeChat, setCopiedWeChat] = useState(false);
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ocv_floating_contact_dismissed', 'true');
    }
  };

  useEffect(() => {
    setSettings(settingsStore.getSettings());

    // Auto-open only if customer has never dismissed the popup before
    const isDismissed = typeof window !== 'undefined' && localStorage.getItem('ocv_floating_contact_dismissed') === 'true';
    if (!isDismissed) {
      setIsOpen(true);
    }

    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Dynamically generate contact options based on Admin settings
  const contactOptions: ContactOption[] = [];

  if (settings.showZaloLink && settings.zaloLink) {
    contactOptions.push({
      id: 'zalo',
      name: 'Zalo Hỗ Trợ',
      subtitle: settings.zaloLink.replace('https://zalo.me/', '') || 'Chat Zalo',
      imgSrc: zaloImg,
      url: settings.zaloLink,
    });
  }

  if (settings.showTelegramLink && settings.telegramLink) {
    contactOptions.push({
      id: 'telegram',
      name: 'Telegram CSKH',
      subtitle: `@${settings.telegramLink.split('/').pop() || 'orderchinaviet'}`,
      imgSrc: telegramImg,
      url: settings.telegramLink,
    });
  }

  if (settings.showWechatId && settings.wechatId) {
    contactOptions.push({
      id: 'wechat',
      name: 'WeChat Kho TQ',
      subtitle: `ID: ${settings.wechatId}`,
      imgSrc: wechatImg,
      url: '#',
      isModal: true,
    });
  }

  if (settings.showWhatsappLink && settings.whatsappLink) {
    contactOptions.push({
      id: 'whatsapp',
      name: 'WhatsApp Business',
      subtitle: settings.whatsappLink.replace('https://wa.me/', '+') || 'WhatsApp CSKH',
      imgSrc: whatsappImg,
      url: settings.whatsappLink,
    });
  }

  if (settings.showFacebookLink && settings.facebookLink) {
    contactOptions.push({
      id: 'facebook',
      name: 'Facebook Fanpage',
      subtitle: 'OrderChinaViet Official',
      imgSrc: facebookImg,
      url: settings.facebookLink,
    });
  }

  const handleOptionClick = (option: ContactOption) => {
    if (option.isModal) {
      if (option.id === 'wechat') {
        setActiveModal('wechat');
        handleClose();
      }
    } else {
      window.open(option.url, '_blank');
      handleClose();
    }
  };

  const copyWeChatId = () => {
    navigator.clipboard.writeText(settings.wechatId || 'OCV_Logistics_CN');
    setCopiedWeChat(true);
    setTimeout(() => setCopiedWeChat(false), 2000);
  };

  return (
    <>
      <div ref={menuRef} className="hidden sm:block fixed bottom-6 left-6 z-50 select-none">
        {/* Floating Options Card — Clean & Minimalist */}
        {isOpen && contactOptions.length > 0 && (
          <div className="absolute bottom-16 left-0 w-[260px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header: Bright Brand Primary Gradient */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-3.5 py-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                {/* Close Button on TOP-LEFT */}
                <button
                  onClick={handleClose}
                  title="Đóng"
                  className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-white tracking-wide">Liên Hệ Hỗ Trợ</span>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-400/40 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-100">Online</span>
              </div>
            </div>

            {/* Clean Contact Options List */}
            <div className="p-2 space-y-1">
              {contactOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleOptionClick(opt)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden relative shrink-0 bg-slate-100 flex items-center justify-center p-0.5 border border-slate-200/60">
                    <Image
                      src={opt.imgSrc}
                      alt={opt.name}
                      width={28}
                      height={28}
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 group-hover:text-primary-600 transition-colors leading-tight">
                      {opt.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                      {opt.subtitle}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2.5 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer border border-primary-500"
        >
          <Headset className="w-5 h-5" />
          <span className="text-xs font-bold">Liên Hệ Hỗ Trợ</span>
        </button>
      </div>

      {/* WeChat QR Modal */}
      {activeModal === 'wechat' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-center space-y-4 relative animate-in zoom-in-95 duration-150">
            {/* Close Button on TOP-LEFT */}
            <button
              onClick={() => setActiveModal(null)}
              title="Đóng"
              className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-11 h-11 rounded-xl overflow-hidden relative mx-auto bg-emerald-50 border border-emerald-200 p-1 flex items-center justify-center">
              <Image src={wechatImg} alt="WeChat" width={36} height={36} className="object-contain" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">WeChat Kho Quảng Châu</h3>
              <p className="text-xs text-slate-500 mt-1">Quét mã QR hoặc copy ID WeChat để liên hệ trực tiếp.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
              <div className="w-32 h-32 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-center">
                <QrCode className="w-28 h-28 text-slate-800" />
              </div>
              <div className="text-xs font-mono font-bold text-slate-800">
                WeChat ID: <span className="text-[#07C160]">{settings.wechatId || 'OCV_Logistics_CN'}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyWeChatId}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedWeChat ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWeChat ? 'Đã Sao Chép' : 'Sao Chép ID'}</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

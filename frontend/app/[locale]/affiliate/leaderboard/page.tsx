'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Sparkles,
  TrendingUp,
  Flame,
  ShieldCheck,
  Star,
  Zap,
  ChevronRight,
  Users,
  Wallet,
  Calendar,
  Gift,
  ArrowUpRight,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { authStore } from '@/lib/auth-store';
import { affiliateStore } from '@/lib/affiliate-store';

interface LeaderboardItem {
  rank: number;
  customerCode: string;
  fullName: string;
  avatarText: string;
  city: string;
  referredCustomers: number;
  totalVolumeKg: number;
  totalSpentVnd: number;
  commissionVnd: number;
  kpiBonusVnd: number;
  badgeTitle: string;
  badgeColor: string;
  isCurrentUser?: boolean;
}

const MOCK_LEADERBOARD_CURRENT_MONTH: LeaderboardItem[] = [
  {
    rank: 1,
    customerCode: 'OCV_AFF_998822',
    fullName: 'Nguyễn Hoàng Long',
    avatarText: 'NL',
    city: 'Hà Nội',
    referredCustomers: 28,
    totalVolumeKg: 3450,
    totalSpentVnd: 103500000,
    commissionVnd: 31050000,
    kpiBonusVnd: 3000000,
    badgeTitle: 'Quán Quân Xuất Sắc',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    rank: 2,
    customerCode: 'OCV_AFF_776611',
    fullName: 'Trần Thị Mai Phương',
    avatarText: 'MP',
    city: 'TP. Hồ Chí Minh',
    referredCustomers: 22,
    totalVolumeKg: 2890,
    totalSpentVnd: 86700000,
    commissionVnd: 26010000,
    kpiBonusVnd: 2000000,
    badgeTitle: 'Á Quân Bứt Phá',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    rank: 3,
    customerCode: 'OCV_AFF_554433',
    fullName: 'Vũ Đức Thành',
    avatarText: 'VT',
    city: 'Đà Nẵng',
    referredCustomers: 19,
    totalVolumeKg: 2240,
    totalSpentVnd: 67200000,
    commissionVnd: 20160000,
    kpiBonusVnd: 1000000,
    badgeTitle: 'Chiến Binh Tinh Anh',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    rank: 4,
    customerCode: 'OCV_AFF_663321',
    fullName: 'Lê Minh Quân',
    avatarText: 'MQ',
    city: 'Hải Phòng',
    referredCustomers: 16,
    totalVolumeKg: 1820,
    totalSpentVnd: 54600000,
    commissionVnd: 16380000,
    kpiBonusVnd: 500000,
    badgeTitle: 'Top Tăng Trưởng',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    rank: 5,
    customerCode: 'OCV_AFF_882299',
    fullName: 'Phạm Thu Trang',
    avatarText: 'TT',
    city: 'Bình Dương',
    referredCustomers: 14,
    totalVolumeKg: 1560,
    totalSpentVnd: 46800000,
    commissionVnd: 14040000,
    kpiBonusVnd: 500000,
    badgeTitle: 'Đối Tác Tiềm Năng',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    rank: 6,
    customerCode: 'OCV_AFF_331177',
    fullName: 'Đỗ Tuấn Kiệt',
    avatarText: 'TK',
    city: 'Cần Thơ',
    referredCustomers: 12,
    totalVolumeKg: 1340,
    totalSpentVnd: 40200000,
    commissionVnd: 12060000,
    kpiBonusVnd: 500000,
    badgeTitle: 'Chiến Binh Bền Bỉ',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    rank: 7,
    customerCode: 'OCV_AFF_448811',
    fullName: 'Hoàng Bích Ngọc',
    avatarText: 'BN',
    city: 'Bắc Ninh',
    referredCustomers: 11,
    totalVolumeKg: 1180,
    totalSpentVnd: 35400000,
    commissionVnd: 10620000,
    kpiBonusVnd: 500000,
    badgeTitle: 'Ngôi Sao Triển Vọng',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  {
    rank: 8,
    customerCode: 'OCV_AFF_227744',
    fullName: 'Bùi Gia Huy',
    avatarText: 'GH',
    city: 'Quảng Ninh',
    referredCustomers: 9,
    totalVolumeKg: 980,
    totalSpentVnd: 29400000,
    commissionVnd: 8820000,
    kpiBonusVnd: 500000,
    badgeTitle: 'Thành Viên Tích Cực',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  {
    rank: 9,
    customerCode: 'OCV_AFF_661188',
    fullName: 'Dương Kim Ngân',
    avatarText: 'KN',
    city: 'Nghệ An',
    referredCustomers: 8,
    totalVolumeKg: 850,
    totalSpentVnd: 25500000,
    commissionVnd: 7650000,
    kpiBonusVnd: 500000,
    badgeTitle: 'Thành Viên Tích Cực',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  {
    rank: 10,
    customerCode: 'OCV_AFF_119933',
    fullName: 'Cao Văn Hùng',
    avatarText: 'VH',
    city: 'Thanh Hóa',
    referredCustomers: 7,
    totalVolumeKg: 720,
    totalSpentVnd: 21600000,
    commissionVnd: 6480000,
    kpiBonusVnd: 500000,
    badgeTitle: 'Thành Viên Tích Cực',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
  },
];

const MOCK_LEADERBOARD_LAST_MONTH: LeaderboardItem[] = [
  {
    rank: 1,
    customerCode: 'OCV_AFF_776611',
    fullName: 'Trần Thị Mai Phương',
    avatarText: 'MP',
    city: 'TP. Hồ Chí Minh',
    referredCustomers: 32,
    totalVolumeKg: 4120,
    totalSpentVnd: 123600000,
    commissionVnd: 37080000,
    kpiBonusVnd: 3000000,
    badgeTitle: 'Quán Quân Tháng 07',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    rank: 2,
    customerCode: 'OCV_AFF_998822',
    fullName: 'Nguyễn Hoàng Long',
    avatarText: 'NL',
    city: 'Hà Nội',
    referredCustomers: 26,
    totalVolumeKg: 3200,
    totalSpentVnd: 96000000,
    commissionVnd: 28800000,
    kpiBonusVnd: 2000000,
    badgeTitle: 'Á Quân Tháng 07',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    rank: 3,
    customerCode: 'OCV_AFF_663321',
    fullName: 'Lê Minh Quân',
    avatarText: 'MQ',
    city: 'Hải Phòng',
    referredCustomers: 20,
    totalVolumeKg: 2450,
    totalSpentVnd: 73500000,
    commissionVnd: 22050000,
    kpiBonusVnd: 1000000,
    badgeTitle: 'Top 3 Tháng 07',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    rank: 4,
    customerCode: 'OCV_AFF_554433',
    fullName: 'Vũ Đức Thành',
    avatarText: 'VT',
    city: 'Đà Nẵng',
    referredCustomers: 18,
    totalVolumeKg: 2100,
    totalSpentVnd: 63000000,
    commissionVnd: 18900000,
    kpiBonusVnd: 500000,
    badgeTitle: 'Top 4 Tháng 07',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    rank: 5,
    customerCode: 'OCV_AFF_882299',
    fullName: 'Phạm Thu Trang',
    avatarText: 'TT',
    city: 'Bình Dương',
    referredCustomers: 15,
    totalVolumeKg: 1720,
    totalSpentVnd: 51600000,
    commissionVnd: 15480000,
    kpiBonusVnd: 500000,
    badgeTitle: 'Top 5 Tháng 07',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
];

export default function AffiliateLeaderboardPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [period, setPeriod] = useState<'current' | 'last' | 'alltime'>('current');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = authStore.getUser();
    setCurrentUser(user);
  }, []);

  const dataList = period === 'last' ? MOCK_LEADERBOARD_LAST_MONTH : MOCK_LEADERBOARD_CURRENT_MONTH;
  const top1 = dataList[0];
  const top2 = dataList[1];
  const top3 = dataList[2];
  const restList = dataList.slice(3);

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-800 animate-in fade-in duration-200">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. HEADER BANNER — VINH DANH ĐỐI TÁC                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs text-amber-100 border border-white/30 text-xs font-bold px-3 py-1 rounded-full">
            <Crown className="w-4 h-4 text-amber-200" />
            <span>BẢNG VINH DANH ĐỐI TÁC XUẤT SẮC</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Vinh Danh Top Đối Tác &amp; Thưởng Đua Top Tháng
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
            Ghi nhận và tri ân những nỗ lực bứt phá doanh số vận chuyển Trung - Việt. Tổng quỹ thưởng nóng hàng tháng lên đến <strong className="text-white font-mono font-bold">10.000.000 ₫</strong> dành riêng cho Top 10 đối tác dẫn đầu!
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-black/25 backdrop-blur-md rounded-2xl border border-white/20 shrink-0 self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setPeriod('current')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'current'
                ? 'bg-white text-amber-900 shadow-md scale-100'
                : 'text-amber-100 hover:text-white hover:bg-white/10'
            }`}
          >
            Tháng Này (08/2026)
          </button>
          <button
            onClick={() => setPeriod('last')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'last'
                ? 'bg-white text-amber-900 shadow-md scale-100'
                : 'text-amber-100 hover:text-white hover:bg-white/10'
            }`}
          >
            Tháng Trước (07/2026)
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. REWARD POLICY HIGHLIGHT CARDS                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-white border border-amber-300/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase font-mono">QUÁN QUÂN TOP 1</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-amber-700">+3.000.000 ₫</div>
          <p className="text-[11px] text-slate-500">Cúp Pha Lê OCV + Thưởng nóng ví</p>
        </div>

        <div className="bg-gradient-to-br from-slate-500/15 via-slate-500/5 to-white border border-slate-300 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase font-mono">Á QUÂN TOP 2</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Medal className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-800">+2.000.000 ₫</div>
          <p className="text-[11px] text-slate-500">Kỷ Niệm Chương + Thưởng nóng ví</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-white border border-orange-300 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-800 uppercase font-mono">QUÝ QUÂN TOP 3</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-orange-800">+1.000.000 ₫</div>
          <p className="text-[11px] text-slate-500">Bằng Vinh Danh + Thưởng nóng ví</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-white border border-emerald-300 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase font-mono">TOP 4 ĐẾN TOP 10</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700">+500.000 ₫/người</div>
          <p className="text-[11px] text-slate-500">Thưởng trực tiếp vào ví hoa hồng</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. PODIUM SECTION (TOP 1, 2, 3)                                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
        <div className="text-center space-y-1.5 pb-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>BỤC VINH DANH DANH DỰ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Top 3 Chiến Binh Xuất Sắc Nhất
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            Dẫn đầu bảng xếp hạng với sản lượng cước vận chuyển và số lượng khách hàng giới thiệu kỷ lục
          </p>
        </div>

        {/* Podium Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 pt-4 items-end">
          {/* Top 2 - Silver */}
          {top2 && (
            <div className="order-2 md:order-1 bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all text-center space-y-3 relative group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-700 text-white font-mono font-bold text-xs px-3 py-1 rounded-full shadow flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 text-slate-300" />
                <span>HẠNG 2</span>
              </div>

              <div className="w-20 h-20 rounded-full bg-slate-200 text-slate-700 border-4 border-slate-300 flex items-center justify-center font-bold text-xl mx-auto shadow-inner mt-2">
                {top2.avatarText}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{top2.fullName}</h3>
                <span className="text-[11px] font-mono text-slate-500 block">{top2.customerCode} • {top2.city}</span>
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${top2.badgeColor}`}>
                  {top2.badgeTitle}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sản lượng cước:</span>
                  <strong className="font-mono text-slate-900">{top2.totalVolumeKg.toLocaleString('vi-VN')} kg</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Khách giới thiệu:</span>
                  <strong className="font-mono text-slate-900">{top2.referredCustomers} khách</strong>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                  <span>Hoa hồng tháng:</span>
                  <strong className="font-mono text-emerald-700 font-bold">{top2.commissionVnd.toLocaleString('vi-VN')} ₫</strong>
                </div>
              </div>

              <div className="p-2.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-center gap-1 font-mono">
                <Gift className="w-4 h-4 text-slate-600" />
                <span>Thưởng Nóng: +{top2.kpiBonusVnd.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          )}

          {/* Top 1 - Gold (Center & Highlighted) */}
          {top1 && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all text-center space-y-4 relative group -mt-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-mono font-bold text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-200" />
                <span>QUÁN QUÂN TOP 1</span>
              </div>

              <div className="relative inline-block mt-3">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-950 border-4 border-amber-400 flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
                  {top1.avatarText}
                </div>
                <div className="absolute -bottom-2 -right-1 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">{top1.fullName}</h3>
                <span className="text-xs font-mono text-slate-500 block">{top1.customerCode} • {top1.city}</span>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${top1.badgeColor}`}>
                  {top1.badgeTitle}
                </span>
              </div>

              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Sản lượng cước:</span>
                  <strong className="font-mono text-slate-900 text-sm font-bold">{top1.totalVolumeKg.toLocaleString('vi-VN')} kg</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Khách giới thiệu:</span>
                  <strong className="font-mono text-slate-900 font-bold">{top1.referredCustomers} khách</strong>
                </div>
                <div className="flex justify-between text-slate-700 border-t border-amber-200/80 pt-1.5">
                  <span className="font-semibold">Hoa hồng tháng:</span>
                  <strong className="font-mono text-emerald-700 font-bold text-sm">{top1.commissionVnd.toLocaleString('vi-VN')} ₫</strong>
                </div>
              </div>

              <div className="p-3 bg-amber-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 font-mono shadow-md">
                <Gift className="w-4 h-4 text-amber-200" />
                <span>Thưởng Nóng Đua Top: +{top1.kpiBonusVnd.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          )}

          {/* Top 3 - Bronze */}
          {top3 && (
            <div className="order-3 bg-gradient-to-b from-orange-50/60 to-white border border-orange-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all text-center space-y-3 relative group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-700 text-white font-mono font-bold text-xs px-3 py-1 rounded-full shadow flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-orange-200" />
                <span>HẠNG 3</span>
              </div>

              <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-900 border-4 border-orange-300 flex items-center justify-center font-bold text-xl mx-auto shadow-inner mt-2">
                {top3.avatarText}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{top3.fullName}</h3>
                <span className="text-[11px] font-mono text-slate-500 block">{top3.customerCode} • {top3.city}</span>
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${top3.badgeColor}`}>
                  {top3.badgeTitle}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Sản lượng cước:</span>
                  <strong className="font-mono text-slate-900">{top3.totalVolumeKg.toLocaleString('vi-VN')} kg</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Khách giới thiệu:</span>
                  <strong className="font-mono text-slate-900">{top3.referredCustomers} khách</strong>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                  <span>Hoa hồng tháng:</span>
                  <strong className="font-mono text-emerald-700 font-bold">{top3.commissionVnd.toLocaleString('vi-VN')} ₫</strong>
                </div>
              </div>

              <div className="p-2.5 bg-orange-100 rounded-xl text-xs font-bold text-orange-900 flex items-center justify-center gap-1 font-mono">
                <Gift className="w-4 h-4 text-orange-700" />
                <span>Thưởng Nóng: +{top3.kpiBonusVnd.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. CURRENT USER RANKING STATS BANNER                                */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-slate-900 to-primary-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold font-mono text-lg shrink-0">
            #14
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">VỊ TRÍ CỦA BẠN TRÊN BẢNG XẾP HẠNG</span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-mono text-slate-300">
                {currentUser?.fullName || 'Tài khoản của bạn'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Bạn đang ở <strong>Hạng #14</strong> toàn hệ thống. Chỉ cần thêm <strong className="text-amber-300 font-mono">180 kg</strong> cước để lọt vào Top 10 và nhận thưởng nóng 500.000 ₫!
            </p>
          </div>
        </div>

        <Link
          href={`/${locale}/affiliate/links`}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center cursor-pointer"
        >
          <span>Lấy Link Chia Sẻ Ngay</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. TOP 4 - 10 LEADERBOARD TABLE                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Bảng Xếp Hạng Top 4 — Top 10</h3>
            <p className="text-xs text-slate-500">Cập nhật tự động theo thời gian thực (Real-time)</p>
          </div>
          <span className="text-xs font-bold font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            Tổng 10 Chiến Binh Dẫn Đầu
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden space-y-3">
          {restList.map((item) => (
            <div key={item.rank} className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-mono font-bold text-xs">
                    #{item.rank}
                  </span>
                  <span className="font-bold text-slate-900">{item.fullName}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                  {item.badgeTitle}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-mono text-[11px]">
                <span>{item.customerCode} • {item.city}</span>
                <span>{item.referredCustomers} khách</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Sản lượng cước</span>
                  <strong className="font-mono text-slate-900">{item.totalVolumeKg.toLocaleString('vi-VN')} kg</strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Hoa hồng thực nhận</span>
                  <strong className="font-mono text-emerald-700 font-bold text-sm">{item.commissionVnd.toLocaleString('vi-VN')} ₫</strong>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold text-[11px]">
                <th className="py-3 px-3.5 rounded-l-xl text-center">Hạng</th>
                <th className="py-3 px-3.5">Họ Và Tên Đối Tác</th>
                <th className="py-3 px-3.5">Khu Vực</th>
                <th className="py-3 px-3.5 text-center">Khách Giới Thiệu</th>
                <th className="py-3 px-3.5 text-right">Sản Lượng Vận Chuyển</th>
                <th className="py-3 px-3.5 text-right">Hoa Hồng Tháng</th>
                <th className="py-3 px-3.5 text-center rounded-r-xl">Thưởng Đua Top</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {restList.map((item) => (
                <tr key={item.rank} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3.5 text-center">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-800 font-mono font-bold inline-flex items-center justify-center border border-slate-200">
                      #{item.rank}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {item.avatarText}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{item.fullName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{item.customerCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 text-slate-600">{item.city}</td>
                  <td className="py-3.5 px-3.5 text-center font-mono font-bold text-slate-800">
                    {item.referredCustomers} Khách
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-900">
                    {item.totalVolumeKg.toLocaleString('vi-VN')} kg
                  </td>
                  <td className="py-3.5 px-3.5 text-right font-mono font-bold text-emerald-700 text-sm">
                    {item.commissionVnd.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="py-3.5 px-3.5 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                      +{item.kpiBonusVnd.toLocaleString('vi-VN')} ₫
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { use, useState } from 'react';
import { Settings, Warehouse, Shield, Globe, DollarSign, Bell, Key, Users, ChevronRight, Check } from 'lucide-react';
import { Locale } from '@/lib/i18n';

const warehouses = [
  {
    code: 'W-GZ-01',
    name: 'Kho Quảng Châu (Guangzhou Hub)',
    address: 'Haizhu District, Guangzhou, Guangdong Province, China 510000',
    phone: '+86 20 1234 5678',
    manager: 'Zheng Wei (郑伟)',
    capacity: '2,000 m²',
    status: 'ACTIVE',
  },
  {
    code: 'W-HCM-01',
    name: 'Kho TP.HCM (Ho Chi Minh Distribution Hub)',
    address: '123 Đường Hậu Giang, Phường 11, Quận 6, TP. Hồ Chí Minh',
    phone: '+84 28 9999 1234',
    manager: 'Nguyễn Trọng Nam',
    capacity: '800 m²',
    status: 'ACTIVE',
  },
  {
    code: 'W-HN-01',
    name: 'Kho Hà Nội (Hanoi Pickup Point)',
    address: '45 Đường Giải Phóng, Phường Đồng Tâm, Hai Bà Trưng, Hà Nội',
    phone: '+84 24 7777 5678',
    manager: 'Lê Văn Hùng',
    capacity: '350 m²',
    status: 'ACTIVE',
  },
];

const roles = [
  { code: 'SUPER_ADMIN', name: 'Super Administrator', permissions: ['Toàn quyền hệ thống', 'Quản lý tài khoản, giá cước, kho bãi'], color: 'bg-rose-50 text-[#fa3131] border-rose-200' },
  { code: 'ADMIN', name: 'Quản Trị Viên', permissions: ['Quản lý kiện hàng, lô hàng, khách hàng', 'Xem báo cáo tài chính'], color: 'bg-blue-50 text-[#0c3ed0] border-blue-200' },
  { code: 'CHINA_WAREHOUSE', name: 'Nhân Viên Kho Quảng Châu', permissions: ['Quét mã nhận hàng, cân đo, chụp ảnh', 'Đóng kiện & xếp lô container'], color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { code: 'VIETNAM_WAREHOUSE', name: 'Nhân Viên Kho Việt Nam', permissions: ['Nhận container, phân loại kiện', 'Tạo phiếu giao hàng tận nơi'], color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { code: 'ACCOUNTANT', name: 'Kế Toán Viên', permissions: ['Xác nhận nạp tiền vào ví', 'Xuất báo cáo doanh thu, công nợ'], color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { code: 'CUSTOMER', name: 'Khách Hàng', permissions: ['Đặt đơn mua hộ, ký gửi vận chuyển', 'Tra cứu kiện hàng, nạp tiền ví'], color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const exchangeRates = [
  { currency: 'CNY (Nhân Dân Tệ)', symbol: '¥', rateVnd: 3650, updated: '11/08/2026 08:00' },
  { currency: 'USD (Đô La Mỹ)', symbol: '$', rateVnd: 25450, updated: '11/08/2026 08:00' },
];

const SECTIONS = [
  { id: 'warehouses', label: 'Kho Bãi', icon: Warehouse },
  { id: 'roles', label: 'Phân Quyền RBAC', icon: Shield },
  { id: 'rates', label: 'Tỷ Giá & Ngoại Tệ', icon: DollarSign },
];

export default function SettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [activeSection, setActiveSection] = useState('warehouses');

  return (
    <div className="space-y-4 text-slate-800">
      <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200">
        <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600" />
          Cấu Hình Hệ Thống OrderChinaViet
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Quản lý kho bãi, phân quyền, tỷ giá tiền tệ.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Section Nav */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-2 lg:col-span-1 flex flex-row lg:flex-col gap-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 lg:flex-none ${
                  activeSection === s.id ? 'bg-[#fa3131] text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {activeSection === s.id && <ChevronRight className="w-3.5 h-3.5 hidden lg:block" />}
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        <div className="lg:col-span-3 space-y-3">
          {activeSection === 'warehouses' && (
            <>
              {warehouses.map((wh) => (
                <div key={wh.code} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#0c3ed0] text-xs bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">{wh.code}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">HOẠT ĐỘNG</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">{wh.name}</h3>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-semibold">
                    <div><span className="text-slate-400 text-[10px] block">Địa chỉ</span>{wh.address}</div>
                    <div>
                      <div><span className="text-slate-400 text-[10px] block">Người phụ trách</span>{wh.manager}</div>
                      <div className="mt-1"><span className="text-slate-400 text-[10px] block">Điện thoại</span>{wh.phone}</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeSection === 'roles' && (
            <div className="grid gap-3">
              {roles.map((role) => (
                <div key={role.code} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex items-start gap-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${role.color}`}>{role.code}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-xs">{role.name}</p>
                    <div className="mt-1.5 space-y-0.5">
                      {role.permissions.map((p, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'rates' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm">Tỷ Giá Ngoại Tệ Áp Dụng Hiện Tại</h3>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Đơn Vị Tiền Tệ</th>
                    <th className="py-3 px-4">Quy Đổi Ra VNĐ</th>
                    <th className="py-3 px-4">Cập Nhật Lúc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {exchangeRates.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{r.currency} ({r.symbol})</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">1 {r.symbol} = {r.rateVnd.toLocaleString('vi-VN')} ₫</td>
                      <td className="py-3.5 px-4 text-slate-500">{r.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



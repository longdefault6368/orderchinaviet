'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  RotateCcw,
  Filter,
  Wallet,
  ArrowUpRight,
  Phone,
  Mail,
  ShoppingBag,
  Package,
  CheckCircle2,
  X,
  User,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';

const mockCustomers = [
  {
    code: 'OCV000001',
    fullName: 'VÕ VĂN LONG',
    company: 'Long Fashion Imports',
    phone: '0901 234 567',
    email: 'customer1@orderchinaviet.com',
    province: 'TP. Hồ Chí Minh',
    balance: 5500000,
    totalOrders: 23,
    totalParcels: 142,
    status: 'ACTIVE',
    joinedAt: '15/01/2026',
  },
  {
    code: 'OCV000002',
    fullName: 'TRẦN THỊ BÍCH',
    company: 'Bich Fashion Studio',
    phone: '0923 456 789',
    email: 'customer2@orderchinaviet.com',
    province: 'Hà Nội',
    balance: 8200000,
    totalOrders: 41,
    totalParcels: 318,
    status: 'ACTIVE',
    joinedAt: '20/02/2026',
  },
  {
    code: 'OCV000003',
    fullName: 'PHẠM QUỐC CƯỜNG',
    company: 'TechImport Vietnam JSC',
    phone: '0934 567 890',
    email: 'customer3@orderchinaviet.com',
    province: 'Đà Nẵng',
    balance: 32000000,
    totalOrders: 87,
    totalParcels: 924,
    status: 'ACTIVE',
    joinedAt: '05/01/2026',
  },
  {
    code: 'OCV000007',
    fullName: 'TRẦN VĂN ĐỨC',
    company: 'Duc Electronic Imports',
    phone: '0912 888 999',
    email: 'customer7@orderchinaviet.com',
    province: 'Bình Dương',
    balance: 0,
    totalOrders: 31,
    totalParcels: 203,
    status: 'INACTIVE',
    joinedAt: '10/03/2026',
  },
  {
    code: 'OCV000012',
    fullName: 'NGUYỄN THỊ HOA',
    company: 'Hoa Homeware Trader',
    phone: '0978 123 456',
    email: 'customer12@orderchinaviet.com',
    province: 'Cần Thơ',
    balance: 12800000,
    totalOrders: 38,
    totalParcels: 411,
    status: 'ACTIVE',
    joinedAt: '22/04/2026',
  },
];

export default function CustomersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [customers] = useState<typeof mockCustomers>([]);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<typeof mockCustomers[0] | null>(null);

  const filtered = customers.filter((c) => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 text-slate-800">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0c3ed0]" />
            Quản Lý Khách Hàng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh sách tài khoản, số dư ví, lịch sử đơn hàng &amp; kiện hàng của toàn bộ khách hàng.
          </p>
        </div>
        <button className="flex items-center gap-1.5 bg-[#0c3ed0] hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0">
          <Plus className="w-4 h-4" />
          <span>Thêm Khách Hàng Mới</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-2 flex items-center gap-2">
        {[
          { key: 'ALL', label: 'Tất Cả' },
          { key: 'ACTIVE', label: 'Đang Hoạt Động' },
          { key: 'INACTIVE', label: 'Ngừng Hoạt Động' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === tab.key ? 'bg-[#0c3ed0] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã KH (OCV...), họ tên, SĐT, email, công ty..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#0c3ed0]"
          />
        </div>
        <button onClick={() => setSearch('')} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">
            Danh Sách Khách Hàng <span className="text-[#fa3131]">({filtered.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Mã KH</th>
                <th className="py-3 px-4">Họ Tên / Công Ty</th>
                <th className="py-3 px-4">Liên Hệ</th>
                <th className="py-3 px-4">Tỉnh / Thành</th>
                <th className="py-3 px-4">Số Dư Ví</th>
                <th className="py-3 px-4">Đơn / Kiện</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Ngày Tham Gia</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
              {filtered.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#fa3131] whitespace-nowrap">{c.code}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{c.fullName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{c.company}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 text-slate-600"><Phone className="w-3 h-3" /> {c.phone}</div>
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] mt-0.5"><Mail className="w-3 h-3" /> {c.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{c.province}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                    {c.balance.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-bold">{c.totalOrders} đơn</span>
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">{c.totalParcels} kiện</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {c.status === 'ACTIVE' ? 'Hoạt Động' : 'Tạm Dừng'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{c.joinedAt}</td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#0c3ed0] hover:bg-blue-50 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors border border-blue-200"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#fa3131] to-[#0c3ed0] flex items-center justify-center text-white text-xl font-bold shrink-0">
                {selectedCustomer.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedCustomer.fullName}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-[#fa3131] text-xs">{selectedCustomer.code}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedCustomer.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {selectedCustomer.status === 'ACTIVE' ? 'Hoạt Động' : 'Tạm Dừng'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Công Ty</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedCustomer.company || '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Địa Phương</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedCustomer.province}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Số Điện Thoại</p>
                <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedCustomer.phone}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Email</p>
                <p className="font-bold text-slate-700 mt-0.5 truncate">{selectedCustomer.email}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">Số Dư Ví</p>
                <p className="font-mono font-bold text-emerald-700 text-base mt-0.5">{selectedCustomer.balance.toLocaleString('vi-VN')} ₫</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wide">Thống Kê</p>
                <p className="font-bold text-[#0c3ed0] mt-0.5">{selectedCustomer.totalOrders} đơn · {selectedCustomer.totalParcels} kiện</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => router.push(`/${locale}/dashboard/transactions`)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Xem Lịch Sử Ví</span>
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Search,
  RotateCcw,
  ScanLine,
  ArrowUpRight,
  Weight,
  Warehouse,
  Clock,
  CheckCircle2,
  Truck,
  Filter,
  Plus,
  X,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { apiFetch } from '@/lib/api-client';

const mockPackages = [
  {
    id: 'PKG-2026-001842',
    waybillCode: 'SF13498192348',
    customerCode: 'OCV000001',
    customerName: 'VÕ VĂN LONG',
    product: 'Áo phông nam Cotton 100% — Xưởng Guangzhou',
    weight: 42.5,
    volumeWeight: 38.2,
    finalWeight: 42.5,
    dimensions: '60 × 45 × 35 cm',
    shelf: 'A-03-12',
    status: 'AT_CHINA_WH',
    statusLabel: 'Tại kho Quảng Châu',
    statusClass: 'bg-amber-50 text-amber-700 border-amber-200',
    receivedAt: '10/08/2026 09:30',
  },
  {
    id: 'PKG-2026-001841',
    waybillCode: 'YT98217391823',
    customerCode: 'OCV000003',
    customerName: 'PHẠM QUỐC CƯỜNG',
    product: 'Linh kiện điện tử gia dụng — Nguồn Yiwu',
    weight: 45.0,
    volumeWeight: 22.4,
    finalWeight: 45.0,
    dimensions: '40 × 35 × 30 cm',
    shelf: 'B-07-04',
    status: 'IN_TRANSIT',
    statusLabel: 'Đang vận chuyển',
    statusClass: 'bg-sky-50 text-sky-700 border-sky-200',
    receivedAt: '08/08/2026 11:15',
  },
  {
    id: 'PKG-2026-001838',
    waybillCode: 'GDEX82736192',
    customerCode: 'OCV000002',
    customerName: 'TRẦN THỊ BÍCH',
    product: 'Giày thể thao nam Size 39-44',
    weight: 28.3,
    volumeWeight: 51.2,
    finalWeight: 51.2,
    dimensions: '80 × 60 × 40 cm',
    shelf: 'D-01-08',
    status: 'DELIVERED_VN',
    statusLabel: 'Đã về kho VN',
    statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    receivedAt: '05/08/2026 14:00',
  },
  {
    id: 'PKG-2026-001835',
    waybillCode: 'JD91827364571',
    customerCode: 'OCV000012',
    customerName: 'NGUYỄN THỊ HOA',
    product: 'Đèn LED trang trí nội thất 5m',
    weight: 5.1,
    volumeWeight: 8.6,
    finalWeight: 8.6,
    dimensions: '50 × 20 × 20 cm',
    shelf: 'A-09-02',
    status: 'AT_VN_WH',
    statusLabel: 'Tại kho TP.HCM',
    statusClass: 'bg-purple-50 text-purple-700 border-purple-200',
    receivedAt: '09/08/2026 15:30',
  },
  {
    id: 'PKG-2026-001830',
    waybillCode: 'ZTO88271638291',
    customerCode: 'OCV000007',
    customerName: 'TRẦN VĂN ĐỨC',
    product: 'Phụ kiện điện thoại hỗn hợp',
    weight: 8.2,
    volumeWeight: 6.1,
    finalWeight: 8.2,
    dimensions: '30 × 25 × 25 cm',
    shelf: 'C-05-07',
    status: 'AT_CHINA_WH',
    statusLabel: 'Tại kho Quảng Châu',
    statusClass: 'bg-amber-50 text-amber-700 border-amber-200',
    receivedAt: '07/08/2026 09:00',
  },
];

const STATUS_TABS = [
  { key: 'ALL', label: 'Tất Cả' },
  { key: 'AT_CHINA_WH', label: 'Kho Quảng Châu' },
  { key: 'IN_TRANSIT', label: 'Đang Vận Chuyển' },
  { key: 'AT_VN_WH', label: 'Kho VN' },
  { key: 'DELIVERED_VN', label: 'Đã Về VN' },
];

export default function PackagesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [packages, setPackages] = useState<typeof mockPackages>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [parcelForm, setParcelForm] = useState({ trackingCodeChina: '', notes: '' });

  const loadPackages = () => {
    apiFetch('/packages').then(async (response) => {
      if (!response.ok) throw new Error('Không thể tải danh sách kiện');
      const json = await response.json();
      const statusMeta: Record<string, [string, string, string]> = {
        CREATED: ['CREATED', 'Mới tạo', 'bg-slate-50 text-slate-700 border-slate-200'],
        RECEIVED_CHINA: ['AT_CHINA_WH', 'Tại kho Quảng Châu', 'bg-amber-50 text-amber-700 border-amber-200'],
        IN_TRANSIT: ['IN_TRANSIT', 'Đang vận chuyển', 'bg-sky-50 text-sky-700 border-sky-200'],
        RECEIVED_VIETNAM: ['AT_VN_WH', 'Tại kho Việt Nam', 'bg-purple-50 text-purple-700 border-purple-200'],
        DELIVERED: ['DELIVERED_VN', 'Đã giao hàng', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
        CANCELLED: ['CANCELLED', 'Đã hủy', 'bg-red-50 text-red-700 border-red-200'],
      };
      setPackages(json.data.map((item: any) => {
        const meta = statusMeta[item.status] || statusMeta.CREATED;
        return {
          id: item.parcelCode,
          waybillCode: item.trackingCodeChina,
          customerCode: item.customer?.customerCode || '',
          customerName: item.customer?.fullName || '',
          product: item.notes || 'Kiện hàng vận chuyển',
          weight: item.weightKg,
          volumeWeight: Math.max(0, item.lengthCm * item.widthCm * item.heightCm / 6000),
          finalWeight: item.chargeableWeight,
          dimensions: `${item.lengthCm} × ${item.widthCm} × ${item.heightCm} cm`,
          shelf: item.currentWarehouse?.code || '—',
          status: meta[0], statusLabel: meta[1], statusClass: meta[2],
          receivedAt: new Date(item.createdAt).toLocaleString('vi-VN'),
        };
      }));
    }).catch(() => setPackages([]));
  };
  useEffect(() => { loadPackages(); }, []);

  const createParcel = async (event: React.FormEvent) => {
    event.preventDefault(); setCreating(true);
    try { const response = await apiFetch('/packages', { method: 'POST', body: JSON.stringify(parcelForm) }); const json = await response.json(); if (!response.ok) throw new Error(json.message || 'Không thể khai báo kiện'); setShowCreate(false); setParcelForm({ trackingCodeChina: '', notes: '' }); loadPackages(); }
    catch (error: any) { alert(error.message); } finally { setCreating(false); }
  };

  const filtered = packages.filter((p) => {
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        p.waybillCode.toLowerCase().includes(q) ||
        p.customerCode.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.product.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statCounts = {
    AT_CHINA_WH: packages.filter((p) => p.status === 'AT_CHINA_WH').length,
    IN_TRANSIT: packages.filter((p) => p.status === 'IN_TRANSIT').length,
    AT_VN_WH: packages.filter((p) => p.status === 'AT_VN_WH').length,
    DELIVERED_VN: packages.filter((p) => p.status === 'DELIVERED_VN').length,
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#fa3131]" />
            Quản Lý Kiện Hàng
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi toàn bộ kiện hàng từ lúc nhận tại Kho Quảng Châu đến khi giao tận tay khách hàng tại Việt Nam.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-[#fa3131] hover:bg-[#d62828] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Khai Báo Mã Vận Đơn</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tại Kho Quảng Châu', value: statCounts.AT_CHINA_WH, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Warehouse },
          { label: 'Đang Vận Chuyển', value: statCounts.IN_TRANSIT, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200', icon: Truck },
          { label: 'Tại Kho TP.HCM/HN', value: statCounts.AT_VN_WH, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: Package },
          { label: 'Đã Về Kho VN', value: statCounts.DELIVERED_VN, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${s.bg}`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500 font-semibold">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 p-2 flex items-center gap-2 overflow-x-auto">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === tab.key ? 'bg-[#fa3131] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
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
            placeholder="Tìm theo mã kiện (PKG-...), mã vận đơn, mã KH hoặc tên hàng..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#fa3131]"
          />
        </div>
        <button onClick={() => setSearch('')} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-sm">
            Danh Sách Kiện Hàng <span className="text-[#fa3131]">({filtered.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Mã Kiện</th>
                <th className="py-3 px-4">Mã VĐ (CN)</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Sản Phẩm</th>
                <th className="py-3 px-4">Cân Nặng (Tính Cước)</th>
                <th className="py-3 px-4">Kích Thước</th>
                <th className="py-3 px-4">Vị Trí Kệ</th>
                <th className="py-3 px-4">Trạng Thái</th>
                <th className="py-3 px-4">Nhận Lúc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Package className="w-10 h-10 text-slate-300 stroke-1" />
                      <p className="font-bold text-sm text-slate-700">Không tìm thấy kiện hàng nào</p>
                      <p className="text-xs text-slate-400">Không có kiện hàng nào khớp với tìm kiếm hoặc bộ lọc hiện tại.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#fa3131] whitespace-nowrap">{p.id}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">{p.waybillCode}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-[#0c3ed0] font-mono text-[10px]">{p.customerCode}</div>
                      <div className="text-slate-700 font-semibold">{p.customerName}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-semibold text-slate-800">{p.product}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{p.finalWeight} kg</div>
                      <div className="text-[10px] text-slate-400">Thực: {p.weight}kg / TT: {p.volumeWeight}kg</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">{p.dimensions}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0c3ed0]">{p.shelf}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${p.statusClass}`}>
                        {p.statusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{p.receivedAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"><form onSubmit={createParcel} className="relative w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl"><button type="button" onClick={()=>setShowCreate(false)} className="absolute right-4 top-4 rounded-full bg-slate-100 p-2"><X className="h-4 w-4"/></button><div><h2 className="text-lg font-bold">Khai Báo Kiện Vận Chuyển</h2><p className="text-xs text-slate-500">Nhập mã vận đơn do shop Trung Quốc cung cấp.</p></div><label className="block text-xs font-bold">Mã vận đơn Trung Quốc<input required value={parcelForm.trackingCodeChina} onChange={e=>setParcelForm({...parcelForm,trackingCodeChina:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5 font-mono" placeholder="SF, YT, ZTO..."/></label><label className="block text-xs font-bold">Tên hàng / ghi chú<textarea value={parcelForm.notes} onChange={e=>setParcelForm({...parcelForm,notes:e.target.value})} className="mt-1 w-full rounded-xl border px-3 py-2.5" placeholder="Mô tả để kho dễ nhận diện"/></label><button disabled={creating} className="w-full rounded-xl bg-[#fa3131] py-2.5 text-xs font-bold text-white disabled:opacity-50">{creating?'Đang khai báo...':'Xác Nhận Khai Báo'}</button></form></div>}
    </div>
  );
}


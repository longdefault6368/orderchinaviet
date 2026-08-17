'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  DollarSign,
  FileText,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  Sparkles,
  Award,
  ExternalLink,
  MessageCircle,
  Download,
  Building2,
  X,
  Check,
  GraduationCap,
  Link2,
  Copy,
  KeyRound,
  Share2,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { apiFetch } from '@/lib/api-client';
import { notificationStore } from '@/lib/notification-store';

interface JobApplication {
  id: string;
  applicationCode: string;
  fullName: string;
  phone: string;
  email?: string | null;
  position: string;
  city?: string | null;
  experience?: string | null;
  note?: string | null;
  cvUrl?: string | null;
  status: 'PENDING' | 'REVIEWING' | 'INTERVIEWED' | 'ACCEPTED' | 'REJECTED';
  adminNotes?: string | null;
  interviewDate?: string | null;
  salaryOffer?: string | null;
  activationToken?: string | null;
  tokenExpiresAt?: string | null;
  isActivated?: boolean;
  activatedUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
  PENDING: {
    label: 'Chờ Xử Lý',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Clock,
  },
  REVIEWING: {
    label: 'Đang Xem Xét',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: RefreshCw,
  },
  INTERVIEWED: {
    label: 'Đã Phỏng Vấn',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: Calendar,
  },
  ACCEPTED: {
    label: 'Đã Tuyển Dụng',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Chưa Phù Hợp',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    icon: XCircle,
  },
};

export default function AdminJobApplicationsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');

  // Selected Detail Modal
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editStatus, setEditStatus] = useState<string>('PENDING');
  const [editAdminNotes, setEditAdminNotes] = useState<string>('');
  const [editSalaryOffer, setEditSalaryOffer] = useState<string>('2.000.000 ₫ + Hoa hồng');
  const [editInterviewDate, setEditInterviewDate] = useState<string>('');

  // Activation Link Generation State
  const [generatingLinkAppId, setGeneratingLinkAppId] = useState<string | null>(null);
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);
  const [activeModalLink, setActiveModalLink] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/cms/job-applications/list', {}, true);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setApplications(data.data);
      }
    } catch (err) {
      console.error('Failed to load job applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleOpenDetail = (app: JobApplication) => {
    setSelectedApp(app);
    setEditStatus(app.status);
    setEditAdminNotes(app.adminNotes || '');
    setEditSalaryOffer(app.salaryOffer || '2.000.000 ₫ + Hoa hồng');
    setEditInterviewDate(app.interviewDate ? new Date(app.interviewDate).toISOString().slice(0, 16) : '');
    setActiveModalLink(app.activationToken ? `${window.location.origin}/vi/affiliate/activate?token=${app.activationToken}` : null);
  };

  const handleGenerateActivationLink = async (app: JobApplication, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setGeneratingLinkAppId(app.id);
    try {
      const res = await apiFetch(`/cms/job-applications/${app.id}/generate-link`, {
        method: 'POST',
      }, true);
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Lỗi tạo link');

      const url = resData.data.activationUrl;
      setActiveModalLink(url);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedAppId(app.id);
      setTimeout(() => setCopiedAppId(null), 3000);

      notificationStore.addNotification({
        title: 'Đã Tạo Link Kích Hoạt',
        message: `Đã sao chép link kích hoạt Affiliate cho [${app.fullName}]. Ứng viên chỉ cần mở link và đổi mật khẩu để bắt đầu làm việc.`,
        type: 'SYSTEM',
        targetRole: 'ADMIN',
      });
      fetchApplications();
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo link kích hoạt');
    } finally {
      setGeneratingLinkAppId(null);
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedApp) return;
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/cms/job-applications/${selectedApp.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: editStatus,
          adminNotes: editAdminNotes,
          salaryOffer: editSalaryOffer,
          interviewDate: editInterviewDate || null,
        }),
      }, true);

      const resData = await res.json();
      if (resData.success) {
        notificationStore.addNotification({
          title: 'Cập Nhật Hồ Sơ Thành Công',
          message: `Đã cập nhật trạng thái hồ sơ của ứng viên [${selectedApp.fullName}].`,
          type: 'SYSTEM',
          targetRole: 'ADMIN',
        });
        setSelectedApp(null);
        fetchApplications();
      } else {
        alert(resData.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteApp = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hồ sơ ứng viên "${name}"?`)) return;
    try {
      const res = await apiFetch(`/cms/job-applications/${id}`, {
        method: 'DELETE',
      }, true);
      const resData = await res.json();
      if (resData.success) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
        if (selectedApp?.id === id) setSelectedApp(null);
      }
    } catch (err) {
      console.error('Delete application failed:', err);
    }
  };

  // Filtered List
  const filteredApplications = applications.filter((app) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      app.fullName.toLowerCase().includes(q) ||
      app.phone.toLowerCase().includes(q) ||
      (app.email && app.email.toLowerCase().includes(q)) ||
      app.applicationCode.toLowerCase().includes(q) ||
      (app.city && app.city.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchPosition = positionFilter === 'ALL' || app.position.includes(positionFilter);

    return matchSearch && matchStatus && matchPosition;
  });

  // Statistics Counts
  const countPending = applications.filter((a) => a.status === 'PENDING').length;
  const countReviewing = applications.filter((a) => a.status === 'REVIEWING').length;
  const countInterviewed = applications.filter((a) => a.status === 'INTERVIEWED').length;
  const countAccepted = applications.filter((a) => a.status === 'ACCEPTED').length;

  return (
    <div className="space-y-6 text-slate-800 antialiased animate-in fade-in duration-200">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. HEADER BANNER                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
            <Briefcase className="w-3.5 h-3.5" />
            <span>QUẢN TRỊ NHÂN SỰ &amp; TUYỂN DỤNG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Danh Sách Hồ Sơ Ứng Viên Tuyển Dụng
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Tiếp nhận hồ sơ ứng tuyển CTV &amp; Sales trực tuyến, theo dõi tiến độ phỏng vấn và xét duyệt mức lương cứng 2.000.000 ₫ + hoa hồng.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={fetchApplications}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
          <a
            href={`/${locale}/careers`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 bg-[#fa3131] hover:bg-[#d62828] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Xem Trang Tuyển Dụng</span>
          </a>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. STATS CARDS                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Hồ Sơ</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-2">{applications.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tất cả ứng viên nộp đơn</div>
        </div>

        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Chờ Xử Lý</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-800 font-mono mt-2">{countPending}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Cần liên hệ trong 24h</div>
        </div>

        <div
          onClick={() => setStatusFilter('INTERVIEWED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'INTERVIEWED'
              ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Đang Phỏng Vấn</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-800 font-mono mt-2">{countInterviewed}</div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">Đã hẹn lịch trao đổi</div>
        </div>

        <div
          onClick={() => setStatusFilter('ACCEPTED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ACCEPTED'
              ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Đã Trúng Tuyển</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-800 font-mono mt-2">{countAccepted}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Đã bắt đầu làm việc</div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. SEARCH & FILTERS BAR                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Tên, SĐT, Email, Tỉnh thành, Mã hồ sơ..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="ALL">Tất Cả Trạng Thái</option>
            <option value="PENDING">Chờ Xử Lý</option>
            <option value="REVIEWING">Đang Xem Xét</option>
            <option value="INTERVIEWED">Đã Phỏng Vấn</option>
            <option value="ACCEPTED">Đã Tuyển Dụng</option>
            <option value="REJECTED">Chưa Phù Hợp</option>
          </select>

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer max-w-[180px] truncate"
          >
            <option value="ALL">Tất Cả Vị Trí</option>
            <option value="Cộng tác viên">Cộng Tác Viên Online</option>
            <option value="Tư Vấn">Tư Vấn Nguồn Hàng TQ</option>
            <option value="Đại Lý">Đại Lý Khu Vực</option>
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. APPLICATIONS DATA TABLE                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Đang tải danh sách hồ sơ ứng viên...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Chưa có hồ sơ ứng viên nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL' || positionFilter !== 'ALL'
                ? 'Không tìm thấy hồ sơ phù hợp với bộ lọc. Hãy thử tìm kiếm với từ khóa khác.'
                : 'Khi có ứng viên nộp hồ sơ tại trang Tuyển dụng, danh sách sẽ hiển thị đầy đủ tại đây.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Mã Hồ Sơ / Ngày Nộp</th>
                  <th className="px-5 py-3.5">Ứng Viên &amp; Liên Hệ</th>
                  <th className="px-5 py-3.5">Vị Trí &amp; Kinh Nghiệm</th>
                  <th className="px-5 py-3.5">Mức Lương Đề Xuất</th>
                  <th className="px-5 py-3.5">Trạng Thái</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplications.map((app) => {
                  const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(app)}
                    >
                      {/* Col 1: Code & Date */}
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-blue-700 text-xs">
                          {app.applicationCode}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {new Date(app.createdAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Col 2: Candidate Info */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-xs">{app.fullName}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                          <a
                            href={`tel:${app.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#fa3131] hover:underline font-mono font-bold flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{app.phone}</span>
                          </a>
                          {app.city && (
                            <span className="text-slate-400 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{app.city}</span>
                            </span>
                          )}
                        </div>
                        {app.email && (
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]">
                            {app.email}
                          </div>
                        )}
                      </td>

                      {/* Col 3: Position & Exp */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-bold text-slate-800 text-xs">{app.position}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{app.experience || 'Chưa cập nhật'}</span>
                        </div>
                      </td>

                      {/* Col 4: Salary Offer */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-800 text-xs">
                        {app.salaryOffer || '2.000.000 ₫ + Hoa hồng'}
                      </td>

                      {/* Col 5: Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusInfo.label}</span>
                        </span>
                      </td>

                      {/* Col 6: Actions */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleGenerateActivationLink(app, e)}
                            disabled={generatingLinkAppId === app.id}
                            className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                              copiedAppId === app.id
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : app.isActivated
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 opacity-70'
                                : 'hover:bg-amber-50 text-amber-600 border-transparent hover:border-amber-200'
                            }`}
                            title={app.isActivated ? 'Ứng viên đã đổi mật khẩu & kích hoạt thành công' : 'Lấy link kích hoạt tài khoản Affiliate (Chỉ cần dán link và đổi pass)'}
                          >
                            {copiedAppId === app.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Link2 className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDetail(app)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                            title="Xem chi tiết & Xét duyệt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <a
                            href={`https://zalo.me/${app.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-emerald-200"
                            title="Chat Zalo với ứng viên"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteApp(app.id, app.fullName)}
                            className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                            title="Xóa hồ sơ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. APPLICATION DETAIL & EVALUATION MODAL                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedApp.applicationCode}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Nộp ngày {new Date(selectedApp.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedApp.fullName}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Candidate Info Grid */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Số điện thoại / Zalo:</span>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-2">
                    <span>{selectedApp.phone}</span>
                    <a
                      href={`tel:${selectedApp.phone}`}
                      className="px-2 py-0.5 bg-rose-50 text-[#fa3131] border border-rose-200 rounded text-[10px] hover:bg-rose-100 font-bold"
                    >
                      Gọi Điện
                    </a>
                    <a
                      href={`https://zalo.me/${selectedApp.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] hover:bg-blue-100 font-bold"
                    >
                      Zalo
                    </a>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Email liên hệ:</span>
                  <div className="font-mono font-medium text-slate-900 text-xs mt-0.5">
                    {selectedApp.email || 'Chưa cung cấp'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Vị trí ứng tuyển:</span>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {selectedApp.position}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Tỉnh / Thành phố:</span>
                  <div className="font-bold text-slate-900 text-xs mt-0.5">
                    {selectedApp.city || 'Chưa cập nhật'}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Kinh nghiệm làm việc:</span>
                  <div className="font-medium text-slate-800 text-xs mt-0.5">
                    {selectedApp.experience || 'Chưa cập nhật'}
                  </div>
                </div>

                {selectedApp.note && (
                  <div className="sm:col-span-2 p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Giới thiệu bản thân / Ghi chú từ ứng viên:</span>
                    <p className="text-xs text-slate-700 leading-relaxed mt-1 whitespace-pre-wrap">
                      {selectedApp.note}
                    </p>
                  </div>
                )}
              </div>

              {/* Activation Link Section */}
              <div className="p-4.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Link Kích Hoạt &amp; Thiết Lập Mật Khẩu Đối Tác (Chỉ Cần Dán Link &amp; Đổi Pass)
                    </span>
                  </div>
                  {selectedApp.isActivated ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Đã Đổi Pass &amp; Kích Hoạt</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded">
                      Có hiệu lực 7 ngày (1 lần đổi pass)
                    </span>
                  )}
                </div>

                {selectedApp.isActivated ? (
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-3">
                    <div>
                      <strong className="font-bold">Tài khoản đã kích hoạt thành công:</strong> Ứng viên đã thiết lập mật khẩu và trở thành Đối tác Tiếp thị.
                    </div>
                    <Link
                      href={`/${locale}/admin/affiliates`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                    >
                      Xem Danh Sách Affiliate &rarr;
                    </Link>
                  </div>
                ) : activeModalLink ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={activeModalLink}
                        className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono text-amber-900 select-all"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (navigator.clipboard) await navigator.clipboard.writeText(activeModalLink);
                          setCopiedAppId(selectedApp.id);
                          setTimeout(() => setCopiedAppId(null), 2500);
                        }}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                      >
                        {copiedAppId === selectedApp.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedAppId === selectedApp.id ? 'Đã Copy!' : 'Copy Link'}</span>
                      </button>
                      <a
                        href={`https://zalo.me/${selectedApp.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                        title="Mở Zalo gửi link cho ứng viên"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Gửi Zalo</span>
                      </a>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Hướng dẫn: Gửi link này cho ứng viên qua Zalo/SMS. Ứng viên bấm vào link, điền mật khẩu mới là tài khoản Đối tác được kích hoạt ngay lập tức. Sau khi đổi mật khẩu thành công, link này sẽ tự động hết hiệu lực.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 p-3 bg-white rounded-xl border border-amber-200">
                    <div className="text-xs text-slate-600 leading-relaxed">
                      Tạo đường link riêng chứa token bảo mật để gửi cho ứng viên tự thiết lập mật khẩu đăng nhập.
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerateActivationLink(selectedApp)}
                      disabled={generatingLinkAppId === selectedApp.id}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer transition-all"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>{generatingLinkAppId === selectedApp.id ? 'Đang Tạo Link...' : 'Lấy Link Kích Hoạt'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Admin Review & Evaluation Form */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Đánh Giá &amp; Cập Nhật Trạng Thái Xét Duyệt</span>
                </h4>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Trạng thái hồ sơ
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="PENDING">Chờ Xử Lý (Mới nộp)</option>
                      <option value="REVIEWING">Đang Xem Xét Hồ Sơ</option>
                      <option value="INTERVIEWED">Đã Phỏng Vấn (Hẹn trao đổi)</option>
                      <option value="ACCEPTED">Đã Tuyển Dụng (Nhận việc)</option>
                      <option value="REJECTED">Chưa Phù Hợp (Từ chối)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mức lương cơ bản thỏa thuận
                    </label>
                    <input
                      type="text"
                      value={editSalaryOffer}
                      onChange={(e) => setEditSalaryOffer(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                      placeholder="VD: 2.000.000 ₫ + Hoa hồng"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Lịch hẹn phỏng vấn (Nếu có)
                    </label>
                    <input
                      type="datetime-local"
                      value={editInterviewDate}
                      onChange={(e) => setEditInterviewDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ghi chú nội bộ của Admin (Nhận xét sau phỏng vấn, đánh giá kỹ năng...)
                    </label>
                    <textarea
                      rows={3}
                      value={editAdminNotes}
                      onChange={(e) => setEditAdminNotes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                      placeholder="Ghi nhận xét về ứng viên, năng lực bán hàng, thời gian có thể bắt đầu làm việc..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleDeleteApp(selectedApp.id, selectedApp.fullName)}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa Hồ Sơ</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="w-1/2 sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetail}
                  disabled={isUpdating}
                  className="w-1/2 sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isUpdating ? 'Đang Lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

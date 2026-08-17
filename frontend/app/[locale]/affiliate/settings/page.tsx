'use client';

import { use, useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  CreditCard,
  User,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Save,
  Upload,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { affiliateStore, AffiliateAccount } from '@/lib/affiliate-store';
import { authStore } from '@/lib/auth-store';
import { userStore } from '@/lib/user-store';
import { VIETNAM_BANKS } from '@/lib/constants/banks';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export default function AffiliateSettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [affiliate, setAffiliate] = useState<AffiliateAccount | null>(null);

  // Bank Info States
  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('1012938475');
  const [accountName, setAccountName] = useState('LE VAN TIEP THI');
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');

  // Personal Profile States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  useEffect(() => {
    const data = affiliateStore.getAffiliate();
    const current = authStore.getUser();

    setAffiliate(data);
    if (data?.bankInfo) {
      setBankName(data.bankInfo.bankName || 'Vietcombank');
      setAccountNumber(data.bankInfo.accountNumber || '');
      setAccountName(data.bankInfo.accountName || '');
    }

    if (current) {
      const live = userStore.getUserById(current.id) || userStore.getUserByCustomerCode(current.customerCode || '');
      setFullName(live?.fullName || current.fullName || '');
      setEmail(live?.email || current.email || '');
      setPhone(live?.phone || current.phone || '');
      setAvatarUrl(live?.avatarUrl || current.avatarUrl || PRESET_AVATARS[0]);
    }
  }, []);

  const handleSaveBankInfo = (e: React.FormEvent) => {
    e.preventDefault();
    affiliateStore.updateBankInfo({ bankName, accountNumber, accountName });
    setBankSuccessMsg('Đã lưu thông tin tài khoản ngân hàng thành công!');
    setTimeout(() => setBankSuccessMsg(''), 3000);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const current = authStore.getUser();
    if (!current) return;

    try {
      await authStore.updateProfile({ fullName: fullName.trim(), phone: phone.trim(), avatarUrl });

      const aff = affiliateStore.getAffiliate();
      aff.fullName = fullName.trim();
      aff.email = email.trim();
      aff.phone = phone.trim();
      affiliateStore.saveAffiliate(aff);
      setAffiliate(aff);

      setProfileSuccessMsg('Đã cập nhật thông tin cá nhân & Avatar thành công!');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch (error: any) { setProfileSuccessMsg(error.message || 'Không thể cập nhật hồ sơ'); }
  };

  return (
    <div className="space-y-6 text-slate-800  ">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span>Thiết Lập Tài Khoản</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Cài Đặt Hồ Sơ Cá Nhân, Avatar &amp; Ngân Hàng</h1>
        <p className="text-xs text-slate-300 mt-1">
          Chỉnh sửa thông tin liên hệ đối tác, thay đổi ảnh đại diện Avatar &amp; ngân hàng thụ hưởng nhận hoa hồng.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Form: Personal Profile & Avatar */}
        <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Thông Tin Đối Tác &amp; Avatar</h2>
              <p className="text-xs text-slate-500">Mã Đối Tác: {affiliate?.affiliateCode || 'OCV_AFF_888888'}</p>
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {/* Avatar Selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-700">Hình Ảnh Đại Diện (Avatar)</div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-amber-500 text-white font-bold text-xl flex items-center justify-center border-2 border-amber-500 shadow-md shrink-0 relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>P</span>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tải Ảnh Từ Máy Tính</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-500">Hỗ trợ file JPG, PNG, WEBP từ thiết bị của bạn.</p>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-500 mb-1.5">Hoặc chọn Avatar mẫu có sẵn:</div>
              <div className="flex items-center gap-2.5">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${avatarUrl === url ? 'border-amber-500 scale-110 shadow-md ring-2 ring-amber-500/30' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Họ Và Tên Đối Tác</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Liên Hệ</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Đổi Mật Khẩu Mới (Tùy chọn)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Bỏ trống nếu không đổi mật khẩu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thông Tin Cá Nhân &amp; Avatar</span>
            </button>
          </form>
        </div>

        {/* Right Form: Bank Account Settings */}
        <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Tài Khoản Ngân Hàng Nhận Hoa Hồng</h2>
              <p className="text-xs text-slate-500">Dùng để nhận tiền chuyển khoản tự động 24/7</p>
            </div>
          </div>

          {bankSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{bankSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveBankInfo} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên Ngân Hàng Thụ Hưởng</label>
              <select
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {VIETNAM_BANKS.map((b) => (
                  <option key={b.code} value={b.shortName}>
                    {b.shortName} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Số Tài Khoản Ngân Hàng</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1012938475"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản (In hoa không dấu)</label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="LE VAN TIEP THI"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thông Tin Ngân Hàng</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}



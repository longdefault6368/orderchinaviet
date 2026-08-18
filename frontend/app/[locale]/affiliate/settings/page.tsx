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
  Wallet,
  ShieldCheck,
  Check,
  MapPin,
  GraduationCap,
  Briefcase,
  Calendar,
  Image as ImageIcon,
  AlertCircle,
  Camera,
  Layers,
} from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { affiliateStore, AffiliateAccount } from '@/lib/affiliate-store';
import { authStore } from '@/lib/auth-store';
import { userStore } from '@/lib/user-store';
import { VIETNAM_BANKS } from '@/lib/constants/banks';
import {
  fetchVietnamLocations,
  ApiProvince,
  FALLBACK_PROVINCES,
  normalizeLocationName,
  findMatchingProvince,
  findMatchingDistrict,
} from '@/lib/services/vietnam-locations';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

const EDUCATION_OPTIONS = [
  'Đại học / Cao đẳng',
  'Sau đại học (Thạc sĩ / Tiến sĩ)',
  'Trung cấp / Cao đẳng nghề',
  'Tốt nghiệp THPT',
  'Khác / Tự học',
];

const EXPERTISE_OPTIONS = [
  'Kinh doanh & Bán hàng Online (E-commerce / TikTok / Shopee)',
  'Nguồn hàng Taobao/1688 & Đánh hàng xưởng Quảng Châu',
  'Vận chuyển Logistics Trung - Việt',
  'Marketing Online / Sáng tạo nội dung / Livestream',
  'Đổi tiền & Thanh toán hộ Alipay / WeChat',
  'Tự do / Đang học hỏi phát triển',
];

export default function AffiliateSettingsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params);
  const [affiliate, setAffiliate] = useState<AffiliateAccount | null>(null);

  // Vietnam Administrative Divisions API State
  const [apiProvinces, setApiProvinces] = useState<ApiProvince[]>([]);
  const [loadingLocations, setLoadingLocations] = useState<boolean>(true);

  // Payout Method State (Independent Dropdown)
  const [payoutMethod, setPayoutMethod] = useState<'WALLET' | 'BANK'>('BANK');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');

  // Bank Info States (Independent Card)
  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('1012938475');
  const [accountName, setAccountName] = useState('LE VAN TIEP THI');
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');

  // Personal Profile & Expertise States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // Address States with Province / District Dropdowns
  const [province, setProvince] = useState('Thành phố Hà Nội');
  const [customProvince, setCustomProvince] = useState('');
  const [district, setDistrict] = useState('Quận Cầu Giấy');
  const [customDistrict, setCustomDistrict] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

  const [educationLevel, setEducationLevel] = useState('Đại học / Cao đẳng');
  const [expertise, setExpertise] = useState('Kinh doanh & Bán hàng Online (E-commerce / TikTok / Shopee)');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Security & KYC Identity Documents States (Portrait + ID Front + ID Back)
  const [idCardType, setIdCardType] = useState<'CCCD' | 'PASSPORT'>('CCCD');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idCardIssueDate, setIdCardIssueDate] = useState('');
  const [idCardIssuePlace, setIdCardIssuePlace] = useState('Cục Cảnh sát QLHC về TTXH');
  const [portraitUrl, setPortraitUrl] = useState('');
  const [idCardFrontUrl, setIdCardFrontUrl] = useState('');
  const [idCardBackUrl, setIdCardBackUrl] = useState('');
  const [kycStatus, setKycStatus] = useState<'NOT_SUBMITTED' | 'PENDING_REVIEW' | 'VERIFIED'>('NOT_SUBMITTED');
  const [kycSuccessMsg, setKycSuccessMsg] = useState('');

  // Fetch online Vietnam Provinces & Districts on Mount
  useEffect(() => {
    let isMounted = true;
    fetchVietnamLocations().then((data) => {
      if (isMounted && data && data.length > 0) {
        setApiProvinces(data);
        setLoadingLocations(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute Province List: from live API or Fallback + 'Khác'
  const provinceOptions: string[] = [
    ...(apiProvinces.length > 0
      ? apiProvinces.map((p) => p.name)
      : FALLBACK_PROVINCES),
    'Khác',
  ];

  // Compute Available Districts based on selected Province
  const selectedProvinceData = findMatchingProvince(apiProvinces, province);

  const districtOptions: string[] = [
    ...(selectedProvinceData && selectedProvinceData.districts && selectedProvinceData.districts.length > 0
      ? selectedProvinceData.districts.map((d) => d.name)
      : ['Quận / Huyện trung tâm', 'Thành phố / Thị xã trực thuộc']),
    'Khác',
  ];

  useEffect(() => {
    const syncData = () => {
      const data = affiliateStore.getAffiliate();
      const current = authStore.getUser();

      setAffiliate(data);

      // Payout Method
      if (data?.payoutMethod) {
        setPayoutMethod(data.payoutMethod);
      }

      // Bank Info
      if (data?.bankInfo) {
        setBankName(data.bankInfo.bankName || 'Vietcombank');
        setAccountNumber(data.bankInfo.accountNumber || '');
        setAccountName(data.bankInfo.accountName || '');
      }

      // Personal & Extended Info
      if (current) {
        const live = userStore.getUserById(current.id) || userStore.getUserByCustomerCode(current.customerCode || '');
        setFullName(live?.fullName || current.fullName || data?.fullName || '');
        setEmail(live?.email || current.email || data?.email || '');
        setPhone(live?.phone || current.phone || data?.phone || '');
        setAvatarUrl(live?.avatarUrl || current.avatarUrl || data?.avatarUrl || PRESET_AVATARS[0]);
        setDateOfBirth(current.dateOfBirth || data?.dateOfBirth || '');

        // Address syncing
        const rawProv = current.province || data?.province || '';
        const rawDist = current.district || data?.district || '';

        if (rawProv) {
          if (rawProv === 'Khác') {
            setProvince('Khác');
            setCustomProvince(current.detailAddress || data?.detailAddress || '');
          } else {
            const matchedProv = findMatchingProvince(apiProvinces, rawProv);
            if (matchedProv) {
              setProvince(matchedProv.name);
              if (rawDist) {
                const matchedDist = findMatchingDistrict(matchedProv.districts, rawDist);
                if (matchedDist) {
                  setDistrict(matchedDist.name);
                } else if (rawDist === 'Khác') {
                  setDistrict('Khác');
                } else {
                  setDistrict(rawDist);
                }
              }
            } else {
              // Fallback match
              const fallbackFound = FALLBACK_PROVINCES.find(
                (p) =>
                  p.toLowerCase() === rawProv.toLowerCase() ||
                  normalizeLocationName(p).toLowerCase() === normalizeLocationName(rawProv).toLowerCase()
              );
              if (fallbackFound) {
                setProvince(fallbackFound);
                if (rawDist) setDistrict(rawDist);
              } else {
                setProvince('Khác');
                setCustomProvince(rawProv);
                if (rawDist) setDistrict(rawDist);
              }
            }
          }
        }

        setDetailAddress(current.detailAddress || data?.detailAddress || current.address || data?.address || '');
        setEducationLevel(current.educationLevel || data?.educationLevel || 'Đại học / Cao đẳng');
        setExpertise(current.expertise || data?.expertise || 'Kinh doanh & Bán hàng Online (E-commerce / TikTok / Shopee)');

        // KYC & Portrait
        setIdCardType(current.idCardType || data?.idCardType || 'CCCD');
        setIdCardNumber(current.idCardNumber || data?.idCardNumber || '');
        setIdCardIssueDate(current.idCardIssueDate || data?.idCardIssueDate || '');
        setIdCardIssuePlace(current.idCardIssuePlace || data?.idCardIssuePlace || 'Cục Cảnh sát QLHC về TTXH');
        setPortraitUrl(current.portraitUrl || data?.portraitUrl || '');
        setIdCardFrontUrl(current.idCardFrontUrl || data?.idCardFrontUrl || '');
        setIdCardBackUrl(current.idCardBackUrl || data?.idCardBackUrl || '');
        setKycStatus(current.kycStatus || data?.kycStatus || (current.idCardNumber ? 'VERIFIED' : 'NOT_SUBMITTED'));
      }
    };

    syncData();
    window.addEventListener('orderchinaviet_affiliate_updated', syncData);
    return () => {
      window.removeEventListener('orderchinaviet_affiliate_updated', syncData);
    };
  }, [apiProvinces]);

  // Update district automatically when province changes
  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince);
    if (newProvince === 'Khác') {
      setDistrict('Khác');
      setCustomProvince('');
      setCustomDistrict('');
    } else {
      const match = findMatchingProvince(apiProvinces, newProvince);
      if (match && match.districts && match.districts.length > 0) {
        setDistrict(match.districts[0].name);
      } else {
        setDistrict('Khác');
      }
      setCustomProvince('');
      setCustomDistrict('');
    }
  };

  // Save Payout Method (Independent Dropdown)
  const handleSavePayoutMethod = (e: React.FormEvent) => {
    e.preventDefault();
    const aff = affiliateStore.getAffiliate();
    aff.payoutMethod = payoutMethod;
    affiliateStore.saveAffiliate(aff);
    setAffiliate(aff);
    const methodLabel = payoutMethod === 'WALLET' ? 'Hệ Thống (Ví Số Dư)' : 'Tài Khoản Ngân Hàng';
    setPayoutSuccessMsg(`Đã lưu hình thức nhận lương: [${methodLabel}] thành công!`);
    setTimeout(() => setPayoutSuccessMsg(''), 3500);
  };

  // Save Bank Account (Independent Card)
  const handleSaveBankInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = affiliateStore.updateBankInfo({ bankName, accountNumber, accountName }, payoutMethod);
    setAffiliate(updated);
    setBankSuccessMsg('Đã lưu thông tin tài khoản ngân hàng thụ hưởng thành công!');
    setTimeout(() => setBankSuccessMsg(''), 3500);
  };

  // Upload Local Files (Avatar / Portrait / ID Card)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Personal Profile & Address & Expertise
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeProvince = province === 'Khác' ? customProvince.trim() || 'Khác' : province;
    const activeDistrict = district === 'Khác' ? customDistrict.trim() || 'Khác' : district;
    const combinedAddress = [detailAddress.trim(), activeDistrict, activeProvince].filter(Boolean).join(', ');

    try {
      const profileData = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl,
        dateOfBirth,
        province: activeProvince,
        district: activeDistrict,
        detailAddress: detailAddress.trim(),
        address: combinedAddress,
        educationLevel,
        expertise,
      };

      await authStore.updateProfile(profileData);

      const aff = affiliateStore.getAffiliate();
      aff.fullName = fullName.trim();
      aff.email = email.trim();
      aff.phone = phone.trim();
      aff.avatarUrl = avatarUrl;
      aff.dateOfBirth = dateOfBirth;
      aff.province = activeProvince;
      aff.district = activeDistrict;
      aff.detailAddress = detailAddress.trim();
      aff.address = combinedAddress;
      aff.educationLevel = educationLevel;
      aff.expertise = expertise;
      affiliateStore.saveAffiliate(aff);
      setAffiliate(aff);

      // Keep selection state strictly synced
      setProvince(activeProvince);
      setDistrict(activeDistrict);

      setProfileSuccessMsg('Đã lưu thông tin cá nhân, địa chỉ & chuyên môn thành công!');
      setTimeout(() => setProfileSuccessMsg(''), 3500);
    } catch (error: any) {
      setProfileSuccessMsg(error.message || 'Không thể cập nhật hồ sơ');
    }
  };

  // Save KYC Security, Portrait & Identity Documents
  const handleSaveKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const kycData = {
        idCardType,
        idCardNumber: idCardNumber.trim(),
        idCardIssueDate,
        idCardIssuePlace: idCardIssuePlace.trim(),
        portraitUrl,
        idCardFrontUrl,
        idCardBackUrl,
        kycStatus: 'VERIFIED' as const,
      };

      await authStore.updateProfile(kycData);

      const aff = affiliateStore.getAffiliate();
      aff.idCardType = idCardType;
      aff.idCardNumber = idCardNumber.trim();
      aff.idCardIssueDate = idCardIssueDate;
      aff.idCardIssuePlace = idCardIssuePlace.trim();
      aff.portraitUrl = portraitUrl;
      aff.idCardFrontUrl = idCardFrontUrl;
      aff.idCardBackUrl = idCardBackUrl;
      aff.kycStatus = 'VERIFIED';
      affiliateStore.saveAffiliate(aff);
      setAffiliate(aff);
      setKycStatus('VERIFIED');

      setKycSuccessMsg('Đã lưu ảnh chân dung và xác thực giấy tờ tùy thân thành công!');
      setTimeout(() => setKycSuccessMsg(''), 3500);
    } catch (error: any) {
      setKycSuccessMsg(error.message || 'Không thể lưu giấy tờ tùy thân');
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full mb-2">
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span>Thiết Lập Tài Khoản Đối Tác</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Cài Đặt Hồ Sơ Cá Nhân, Định Danh KYC &amp; Nhận Lương</h1>
        <p className="text-xs text-slate-300 mt-1">
          Quản lý thông tin cá nhân, địa chỉ Tỉnh/Huyện, ảnh chân dung, xác thực CCCD/Hộ chiếu và thiết lập nhận lương.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* LEFT COLUMN: 1. THÔNG TIN CÁ NHÂN & CHUYÊN MÔN                       */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          {/* Card 1: Personal Info, Address Dropdowns & Education */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Thông Tin Cá Nhân &amp; Chuyên Môn</h2>
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
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
                      onChange={(e) => handleFileUpload(e, setAvatarUrl)}
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
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        avatarUrl === url
                          ? 'border-amber-500 scale-110 shadow-md ring-2 ring-amber-500/30'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ Và Tên</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Tháng Năm Sinh</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Email Liên Hệ (Cố định)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Không thể thay đổi</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      readOnly
                      value={email}
                      className="w-full pl-9 pr-3 py-2 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-xs font-mono cursor-not-allowed select-none focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Điện Thoại</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Address Section with Province & District Dropdowns */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Địa Chỉ Thường Trú / Liên Hệ</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Province Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Tỉnh / Thành Phố
                    </label>
                    <select
                      value={province}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {provinceOptions.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>

                    {province === 'Khác' && (
                      <input
                        type="text"
                        required
                        value={customProvince}
                        onChange={(e) => setCustomProvince(e.target.value)}
                        placeholder="Nhập Tỉnh/Thành phố khác..."
                        className="mt-1.5 w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    )}
                  </div>

                  {/* District Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Quận / Huyện</span>
                      {loadingLocations && (
                        <span className="text-[10px] text-amber-600 font-normal animate-pulse">Đang tải...</span>
                      )}
                    </label>
                    <select
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        if (e.target.value !== 'Khác') setCustomDistrict('');
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {districtOptions.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>

                    {district === 'Khác' && (
                      <input
                        type="text"
                        required
                        value={customDistrict}
                        onChange={(e) => setCustomDistrict(e.target.value)}
                        placeholder="Nhập Quận/Huyện khác..."
                        className="mt-1.5 w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    )}
                  </div>
                </div>

                {/* Specific House Number / Street */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Số Nhà, Tên Đường, Phường/Xã
                  </label>
                  <input
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="VD: Số 123 Đường Cầu Giấy, Phường Dịch Vọng"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trình Độ Học Vấn</label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {EDUCATION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lĩnh Vực Chuyên Môn</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {EXPERTISE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đổi Mật Khẩu Mới (Tùy chọn)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Bỏ trống nếu không đổi mật khẩu"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thông Tin Cá Nhân, Địa Chỉ &amp; Chuyên Môn</span>
              </button>
            </form>
          </div>

          {/* Card 2: Security & KYC Identity Documents (Portrait + ID Front + ID Back) */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Bảo Mật &amp; Giấy Tờ Tùy Thân (KYC)</h2>
                  <p className="text-xs text-slate-500">Ảnh chân dung cá nhân &amp; CCCD/Hộ chiếu xác thực đối soát</p>
                </div>
              </div>

              <div>
                {kycStatus === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Đã Xác Thực</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Chưa Xác Thực</span>
                  </span>
                )}
              </div>
            </div>

            {kycSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{kycSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveKyc} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại Giấy Tờ Tùy Thân</label>
                  <select
                    value={idCardType}
                    onChange={(e) => setIdCardType(e.target.value as 'CCCD' | 'PASSPORT')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="CCCD">Căn cước công dân (CCCD 12 số)</option>
                    <option value="PASSPORT">Hộ chiếu (Passport)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {idCardType === 'CCCD' ? 'Số Căn Cước Công Dân' : 'Số Hộ Chiếu'}
                  </label>
                  <input
                    type="text"
                    required
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value)}
                    placeholder={idCardType === 'CCCD' ? 'VD: 001293847562' : 'VD: C1234567'}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày Cấp</label>
                  <input
                    type="date"
                    value={idCardIssueDate}
                    onChange={(e) => setIdCardIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nơi Cấp</label>
                  <input
                    type="text"
                    value={idCardIssuePlace}
                    onChange={(e) => setIdCardIssuePlace(e.target.value)}
                    placeholder="VD: Cục Cảnh sát QLHC về TTXH"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 3 Photo Uploaders: 1. Portrait Photo, 2. Front Photo, 3. Back Photo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* 1. Portrait Photo */}
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-indigo-600" />
                      <span>Ảnh Chân Dung</span>
                    </span>
                    {portraitUrl && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Đã tải
                      </span>
                    )}
                  </div>

                  <div className="h-28 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                    {portraitUrl ? (
                      <img src={portraitUrl} alt="Chân dung" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center space-y-1">
                        <Camera className="w-5 h-5 text-slate-400 mx-auto" />
                        <span className="text-[9px] text-slate-500 block">Tải ảnh chân dung</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-[11px] font-bold gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{portraitUrl ? 'Đổi' : 'Tải'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setPortraitUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Front Photo */}
                <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 truncate">
                      <ImageIcon className="w-3 h-3 text-indigo-600" />
                      <span>{idCardType === 'CCCD' ? 'Mặt Trước CCCD' : 'Hộ Chiếu'}</span>
                    </span>
                    {idCardFrontUrl && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Đã tải
                      </span>
                    )}
                  </div>

                  <div className="h-28 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                    {idCardFrontUrl ? (
                      <img src={idCardFrontUrl} alt="Mặt trước" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="text-center space-y-1">
                        <ImageIcon className="w-5 h-5 text-slate-400 mx-auto" />
                        <span className="text-[9px] text-slate-500 block">Tải ảnh mặt trước</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-[11px] font-bold gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{idCardFrontUrl ? 'Đổi' : 'Tải'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setIdCardFrontUrl)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* 3. Back Photo (Only for CCCD) */}
                {idCardType === 'CCCD' ? (
                  <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1 truncate">
                        <ImageIcon className="w-3 h-3 text-indigo-600" />
                        <span>Mặt Sau CCCD</span>
                      </span>
                      {idCardBackUrl && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Đã tải
                        </span>
                      )}
                    </div>

                    <div className="h-28 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden group">
                      {idCardBackUrl ? (
                        <img src={idCardBackUrl} alt="Mặt sau" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <div className="text-center space-y-1">
                          <ImageIcon className="w-5 h-5 text-slate-400 mx-auto" />
                          <span className="text-[9px] text-slate-500 block">Tải ảnh mặt sau</span>
                        </div>
                      )}
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-[11px] font-bold gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{idCardBackUrl ? 'Đổi' : 'Tải'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setIdCardBackUrl)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/40 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                    <span>Hộ chiếu chỉ cần 1 trang thông tin chính</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Lưu &amp; Xác Thực Giấy Tờ Tùy Thân</span>
              </button>
            </form>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN: 2. HÌNH THỨC NHẬN LƯƠNG & NGÂN HÀNG THỤ HƯỞNG        */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">
          {/* Card 3: Payout Method (Independent Dropdown Selection) */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Hình Thức Nhận Lương Cứng &amp; Hoa Hồng</h2>
                <p className="text-xs text-slate-500">Lựa chọn nhận qua Ví Hệ Thống hoặc Chuyển Khoản Ngân Hàng</p>
              </div>
            </div>

            {payoutSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{payoutSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSavePayoutMethod} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn Hình Thức Nhận Lương Cứng &amp; Hoa Hồng:
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as 'WALLET' | 'BANK')}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
                >
                  <option value="BANK">Tài Khoản Ngân Hàng (Chuyển khoản trực tiếp 24/7)</option>
                  <option value="WALLET">Hệ Thống (Ví Số Dư OrderChinaViet)</option>
                </select>
              </div>

              {/* Explanatory Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {payoutMethod === 'BANK'
                      ? 'Hình thức: Chuyển khoản ngân hàng trực tiếp'
                      : 'Hình thức: Nhận vào ví số dư hệ thống'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  {payoutMethod === 'BANK'
                    ? 'Tiền lương ngày 05 hằng tháng và các khoản hoa hồng sẽ được kế toán công ty đối soát và chuyển khoản trực tiếp về số tài khoản ngân hàng thụ hưởng bên dưới.'
                    : 'Tiền lương và hoa hồng sẽ được tự động cộng thẳng vào Ví Số Dư Khách Hàng của bạn. Bạn có thể dùng số dư để đặt cọc mua hàng Taobao/1688 hoặc rút tiền về ngân hàng bất kỳ lúc nào.'}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Hình Thức Nhận Lương</span>
              </button>
            </form>
          </div>

          {/* Card 4: Independent Bank Account Settings */}
          <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Thông Tin Tài Khoản Ngân Hàng Thụ Hưởng</h2>
                <p className="text-xs text-slate-500">Dùng để nhận tiền lương chuyển khoản hoặc tạo lệnh rút tiền</p>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Ngân Hàng Thụ Hưởng <span className="text-rose-500">*</span>
                </label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số Tài Khoản Ngân Hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="VD: 1012938475"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Chủ Tài Khoản (In hoa không dấu) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thông Tin Tài Khoản Ngân Hàng</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

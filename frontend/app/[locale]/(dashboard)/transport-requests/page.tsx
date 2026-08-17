"use client";

import { FormEvent, use, useEffect, useState } from "react";
import {
  Calculator,
  CheckCircle2,
  ChevronDown,
  Eye,
  LoaderCircle,
  MapPin,
  PackagePlus,
  Pencil,
  ShieldCheck,
  Upload,
  Trash2,
  X,
} from "lucide-react";
import { Locale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api-client";
import { authStore } from "@/lib/auth-store";
import { notificationStore } from "@/lib/notification-store";
import {
  DEFAULT_CATEGORY_RATES,
  DEFAULT_CONTACT_SETTINGS,
  settingsStore,
} from "@/lib/settings-store";

type RequestItem = {
  id: string;
  requestCode: string;
  categoryName: string;
  goodsDescription: string;
  chargeableWeight: number;
  estimatedTotalVnd: number;
  status: string;
  createdAt: string;
  [key: string]: any;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  APPROVED: "Đã duyệt",
  PICKING_UP: "Đang lấy hàng",
  IN_TRANSIT: "Đang vận chuyển",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};
const money = (value: number) => `${value.toLocaleString("vi-VN")} ₫`;
const VIETNAM_PROVINCES = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Hải Phòng",
  "Đà Nẵng",
  "Cần Thơ",
  "Huế",
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Tĩnh",
  "Hưng Yên",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
];
const CHINA_PROVINCES = [
  "An Huy",
  "Bắc Kinh",
  "Cam Túc",
  "Chiết Giang",
  "Phúc Kiến",
  "Giang Tây",
  "Giang Tô",
  "Hà Bắc",
  "Hà Nam",
  "Hải Nam",
  "Hắc Long Giang",
  "Hồ Bắc",
  "Hồ Nam",
  "Liêu Ninh",
  "Nội Mông",
  "Quảng Đông",
  "Quảng Tây",
  "Quý Châu",
  "Sơn Đông",
  "Sơn Tây",
  "Thiểm Tây",
  "Thượng Hải",
  "Thanh Hải",
  "Thiên Tân",
  "Tân Cương",
  "Tây Tạng",
  "Tứ Xuyên",
  "Vân Nam",
  "Cát Lâm",
  "Trùng Khánh",
  "Ninh Hạ",
];

export default function TransportRequestsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  use(params);
  const [settings, setSettings] = useState(DEFAULT_CONTACT_SETTINGS);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [form, setForm] = useState({
    categoryId: "cat-normal",
    categoryName: "",
    goodsDescription: "",
    quantity: 1,
    weightKg: 0,
    lengthCm: 0,
    widthCm: 0,
    heightCm: 0,
    shippingMethod: "STANDARD",
    declaredValueVnd: 0,
    insurance: false,
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    country: "VN",
    customCountry: "",
    province: "",
    district: "",
    ward: "",
    addressLine: "",
    deliveryNote: "",
    pickupContactName: "",
    pickupPhone: "",
    pickupCountry: "CN",
    pickupCustomCountry: "",
    pickupProvince: "",
    pickupDistrict: "",
    pickupWard: "",
    pickupAddressLine: "",
    pickupNote: "",
    pickupImage: "",
  });
  const [pickupOpen, setPickupOpen] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [tab, setTab] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RequestItem | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const rates = settings.categoryShippingRates?.length
    ? settings.categoryShippingRates
    : DEFAULT_CATEGORY_RATES;
  const category =
    form.categoryId === "OTHER"
      ? { priceCnyUnder3kg: 15, priceCnyOver3kg: 12 }
      : rates.find((x) => x.id === form.categoryId) || rates[0];
  const volumetric = (form.lengthCm * form.widthCm * form.heightCm) / 6000;
  const chargeable = Math.max(form.weightKg, volumetric);
  const perKg =
    (chargeable < 3 ? category.priceCnyUnder3kg : category.priceCnyOver3kg) *
    (settings.rateBuyForMe || settings.cnyRate || 3650);
  const serviceMultiplier =
    form.shippingMethod === "ECONOMY"
      ? (settings.economyShippingPercent || 90) / 100
      : form.shippingMethod === "EXPRESS"
        ? (settings.expressShippingPercent || 120) / 100
        : (settings.standardShippingPercent || 100) / 100;
  const shipping = Math.round(chargeable * perKg * serviceMultiplier);
  const insuranceFee = form.insurance
    ? Math.round(
        (form.declaredValueVnd * (settings.insuranceFeePercent || 10)) / 100,
      )
    : 0;
  const phonePattern = /^[0-9+(). -]{8,20}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const pickupPhoneError = form.pickupPhone.length > 0 && !phonePattern.test(form.pickupPhone);
  const recipientPhoneError = form.recipientPhone.length > 0 && !phonePattern.test(form.recipientPhone);
  const recipientEmailError = form.recipientEmail.length > 0 && !emailPattern.test(form.recipientEmail);

  const load = () =>
    apiFetch("/packages/transport-requests/mine").then(async (r) => {
      if (r.ok) setItems((await r.json()).data);
    });
  useEffect(() => {
    setSettings(settingsStore.getSettings());
    void load();
  }, []);
  const setNumber = (key: string, value: string) =>
    setForm((old) => ({ ...old, [key]: Number(value) || 0 }));
  const handlePickupImage = (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return setMessage("Ảnh phải là JPG, PNG hoặc WEBP");
    if (file.size > 2 * 1024 * 1024)
      return setMessage("Ảnh lấy hàng không được vượt quá 2 MB");
    const reader = new FileReader();
    reader.onload = () =>
      setForm((old) => ({ ...old, pickupImage: String(reader.result) }));
    reader.readAsDataURL(file);
  };
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.pickupContactName || !form.pickupPhone || !form.pickupProvince || !form.pickupDistrict || !form.pickupWard || !form.pickupAddressLine) {
      setPickupOpen(true); setMessage("Vui lòng hoàn tất thông tin lấy hàng"); return;
    }
    if (!form.recipientName || !form.recipientPhone || !form.province || !form.district || !form.ward || !form.addressLine) {
      setRecipientOpen(true); setMessage("Vui lòng hoàn tất thông tin nhận hàng"); return;
    }
    if (pickupPhoneError || recipientPhoneError || recipientEmailError) { setPickupOpen(pickupPhoneError); setRecipientOpen(recipientPhoneError || recipientEmailError); setMessage("Vui lòng sửa thông tin liên hệ chưa hợp lệ"); return; }
    setSubmitting(true);
    setMessage("");
    try {
      const response = await apiFetch(editingId ? `/packages/transport-requests/${editingId}` : "/packages/transport-requests", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.message || "Không thể gửi yêu cầu");
      setMessage(`Đã gửi yêu cầu ${json.data.requestCode}`);
      setForm((old) => ({ ...old, goodsDescription: "" }));
      await load();
      window.dispatchEvent(new Event("orderchinaviet_transport_updated"));
      
      const currentUser = authStore.getUser();
      notificationStore.notifyTransportRequest({
        requestCode: json.data?.requestCode || 'TR-REQ',
        customerName: currentUser?.fullName || 'Khách hàng',
        categoryName: form.categoryName || 'Hàng hóa thông thường',
        estimatedTotalVnd: Number(json.data?.estimatedTotalVnd || 0),
        weight: Number(form.weightKg || 1),
      });

      setEditingId(null);
      setTab("list");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  }
  const editItem = (item: RequestItem) => { setForm(old => ({ ...old, ...item, categoryName: item.categoryName || "", recipientEmail: item.recipientEmail || "", customCountry: item.customCountry || "", deliveryNote: item.deliveryNote || "", pickupCustomCountry: item.pickupCustomCountry || "", pickupNote: item.pickupNote || "", pickupImage: item.pickupImage || "" })); setEditingId(item.id); setPickupOpen(false); setRecipientOpen(false); setMessage(""); setTab("form"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const deleteItem = async (item: RequestItem) => { if (!window.confirm(`Xóa yêu cầu ${item.requestCode}?`)) return; const response = await apiFetch(`/packages/transport-requests/${item.id}`, { method: "DELETE" }); const json = await response.json(); if (!response.ok) return alert(json.message || "Không thể xóa yêu cầu"); await load(); window.dispatchEvent(new Event("orderchinaviet_transport_updated")); };

  return (
    <div className="space-y-5 text-slate-800">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="flex items-center gap-2 font-bold">
          <PackagePlus className="h-5 w-5 text-[#0c3ed0]" />
          Gửi yêu cầu vận chuyển
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Khai báo thông tin hàng và nhận dự toán trước khi nhân viên xác nhận.
        </p>
      </div>
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        <button type="button" onClick={() => setTab("list")} className={`rounded-xl px-5 py-2.5 text-xs font-bold ${tab === "list" ? "bg-[#0c3ed0] text-white" : "text-slate-600 hover:bg-slate-100"}`}>Danh sách ({items.length})</button>
        <button type="button" onClick={() => setTab("form")} className={`rounded-xl px-5 py-2.5 text-xs font-bold ${tab === "form" ? "bg-[#0c3ed0] text-white" : "text-slate-600 hover:bg-slate-100"}`}>Gửi yêu cầu</button>
      </div>
      {tab === "form" && <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div>
            <label className="mb-1 block text-xs font-bold">
              Phân loại hàng hóa
            </label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-xl border p-2.5 text-sm"
            >
              {rates.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.categoryName}
                </option>
              ))}
              <option value="OTHER">Hàng hóa khác</option>
            </select>
          </div>
          {form.categoryId === "OTHER" && (
            <input
              required
              placeholder="Tên loại hàng"
              value={form.categoryName}
              onChange={(e) =>
                setForm({ ...form, categoryName: e.target.value })
              }
              className="w-full rounded-xl border p-2.5 text-sm"
            />
          )}
          <div>
            <label className="mb-1 block text-xs font-bold">
              Mô tả hàng hóa
            </label>
            <textarea
              required
              value={form.goodsDescription}
              onChange={(e) =>
                setForm({ ...form, goodsDescription: e.target.value })
              }
              placeholder="Tên hàng, đặc điểm, lưu ý khi vận chuyển..."
              className="min-h-24 w-full rounded-xl border p-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["quantity", "Số lượng"],
              ["weightKg", "Nặng (kg)"],
              ["lengthCm", "Dài (cm)"],
              ["widthCm", "Rộng (cm)"],
              ["heightCm", "Cao (cm)"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="mb-1 block text-[11px] font-bold">
                  {label}
                </label>
                <input
                  min={key === "quantity" ? 1 : 0.01}
                  step={key === "quantity" ? 1 : 0.01}
                  required
                  type="number"
                  value={(form as any)[key]}
                  onChange={(e) => setNumber(key, e.target.value)}
                  className="w-full rounded-xl border p-2.5 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold">
                Gói vận chuyển đường bộ
              </label>
              <select
                value={form.shippingMethod}
                onChange={(e) =>
                  setForm({ ...form, shippingMethod: e.target.value })
                }
                className="w-full rounded-xl border p-2.5 text-sm"
              >
                <option value="ECONOMY">Tiết kiệm</option>
                <option value="STANDARD">Tiêu chuẩn</option>
                <option value="EXPRESS">Nhanh</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold">
                Giá trị hàng hóa (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                value={form.declaredValueVnd}
                onChange={(e) => setNumber("declaredValueVnd", e.target.value)}
                placeholder="Ví dụ: 1.000.000"
                className="w-full rounded-xl border p-2.5 text-sm"
              />
            </div>
          </div>
          <section className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/30">
            <button
              type="button"
              onClick={() => setPickupOpen(!pickupOpen)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-bold">
                <MapPin className="h-4 w-4 text-blue-700" />
                Thông tin lấy hàng
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${pickupOpen ? "rotate-180" : ""}`}
              />
            </button>
            {pickupOpen && (
              <div className="grid gap-3 border-t border-blue-100 bg-white p-4 sm:grid-cols-2">
                <input
                  required
                  value={form.pickupContactName}
                  onChange={(e) =>
                    setForm({ ...form, pickupContactName: e.target.value })
                  }
                  placeholder="Người liên hệ lấy hàng *"
                  className="rounded-xl border p-2.5 text-sm"
                />
                <div><input required type="tel" value={form.pickupPhone} onChange={(e) => setForm({ ...form, pickupPhone: e.target.value })} placeholder="Số điện thoại lấy hàng *" className={`w-full rounded-xl border p-2.5 text-sm ${pickupPhoneError ? "border-red-500 bg-red-50" : ""}`} />{pickupPhoneError && <p className="mt-1 text-[11px] font-medium text-red-600">Số điện thoại phải có 8–20 ký tự số hợp lệ.</p>}</div>
                <select
                  value={form.pickupCountry}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pickupCountry: e.target.value,
                      pickupProvince: "",
                    })
                  }
                  className="rounded-xl border p-2.5 text-sm"
                >
                  <option value="CN">Trung Quốc</option>
                  <option value="VN">Việt Nam</option>
                  <option value="OTHER">Khác</option>
                </select>
                {form.pickupCountry === "OTHER" ? (
                  <input
                    required
                    value={form.pickupCustomCountry}
                    onChange={(e) =>
                      setForm({ ...form, pickupCustomCountry: e.target.value })
                    }
                    placeholder="Tên quốc gia *"
                    className="rounded-xl border p-2.5 text-sm"
                  />
                ) : (
                  <select
                    required
                    value={form.pickupProvince}
                    onChange={(e) =>
                      setForm({ ...form, pickupProvince: e.target.value })
                    }
                    className="rounded-xl border p-2.5 text-sm"
                  >
                    <option value="">Chọn tỉnh / thành phố lấy hàng *</option>
                    {(form.pickupCountry === "VN"
                      ? VIETNAM_PROVINCES
                      : CHINA_PROVINCES
                    ).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                )}
                {form.pickupCountry === "OTHER" && (
                  <input
                    required
                    value={form.pickupProvince}
                    onChange={(e) =>
                      setForm({ ...form, pickupProvince: e.target.value })
                    }
                    placeholder="Tỉnh / Thành phố lấy hàng *"
                    className="rounded-xl border p-2.5 text-sm"
                  />
                )}
                <input
                  required
                  value={form.pickupDistrict}
                  onChange={(e) =>
                    setForm({ ...form, pickupDistrict: e.target.value })
                  }
                  placeholder="Quận / Huyện lấy hàng *"
                  className="rounded-xl border p-2.5 text-sm"
                />
                <input
                  required
                  value={form.pickupWard}
                  onChange={(e) =>
                    setForm({ ...form, pickupWard: e.target.value })
                  }
                  placeholder="Phường / Xã lấy hàng *"
                  className="rounded-xl border p-2.5 text-sm"
                />
                <input
                  required
                  value={form.pickupAddressLine}
                  onChange={(e) =>
                    setForm({ ...form, pickupAddressLine: e.target.value })
                  }
                  placeholder="Địa chỉ lấy hàng chi tiết *"
                  className="rounded-xl border p-2.5 text-sm sm:col-span-2"
                />
                <textarea
                  value={form.pickupNote}
                  onChange={(e) =>
                    setForm({ ...form, pickupNote: e.target.value })
                  }
                  placeholder="Ghi chú lấy hàng"
                  className="min-h-20 rounded-xl border p-2.5 text-sm sm:col-span-2"
                />
                <div className="rounded-xl border-2 border-dashed p-3 sm:col-span-2">
                  <p className="mb-2 text-xs font-bold">Hình ảnh tại địa điểm lấy hàng <span className="font-normal text-slate-400">(không bắt buộc)</span></p>
                  {form.pickupImage ? (
                    <div className="relative h-36 w-48 overflow-hidden rounded-xl border">
                      <img src={form.pickupImage} alt="Ảnh địa điểm lấy hàng" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setForm({ ...form, pickupImage: "" })} className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1 text-white"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-50 p-5 text-xs font-semibold text-slate-600 hover:bg-blue-50">
                      <Upload className="h-4 w-4" />Chọn ảnh JPG, PNG hoặc WEBP (tối đa 2 MB)
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePickupImage(file); }} />
                    </label>
                  )}
                </div>
              </div>
            )}
          </section>
          <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/30">
            <button
              type="button"
              onClick={() => setRecipientOpen(!recipientOpen)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-bold">
                <MapPin className="h-4 w-4 text-emerald-700" />
                Thông tin nhận hàng
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${recipientOpen ? "rotate-180" : ""}`}
              />
            </button>
            {recipientOpen && (
              <div className="grid gap-3 border-t border-emerald-100 bg-white p-4 sm:grid-cols-2">
                <input
                  required
                  value={form.recipientName}
                  onChange={(e) =>
                    setForm({ ...form, recipientName: e.target.value })
                  }
                  placeholder="Họ và tên người nhận *"
                  className="rounded-xl border p-2.5 text-sm"
                />
                <div><input required type="tel" value={form.recipientPhone} onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })} placeholder="Số điện thoại người nhận *" className={`w-full rounded-xl border p-2.5 text-sm ${recipientPhoneError ? "border-red-500 bg-red-50" : ""}`} />{recipientPhoneError && <p className="mt-1 text-[11px] font-medium text-red-600">Số điện thoại phải có 8–20 ký tự số hợp lệ.</p>}</div>
                <div className="sm:col-span-2"><input type="email" value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} placeholder="Email / Gmail (không bắt buộc)" className={`w-full rounded-xl border p-2.5 text-sm ${recipientEmailError ? "border-red-500 bg-red-50" : ""}`} />{recipientEmailError && <p className="mt-1 text-[11px] font-medium text-red-600">Email/Gmail chưa đúng định dạng, ví dụ: ten@gmail.com.</p>}</div>
                <select
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value, province: "" })
                  }
                  className="rounded-xl border p-2.5 text-sm"
                >
                  <option value="VN">Việt Nam</option>
                  <option value="CN">Trung Quốc</option>
                  <option value="OTHER">Khác</option>
                </select>
                {form.country === "OTHER" ? (
                  <input
                    required
                    value={form.customCountry}
                    onChange={(e) =>
                      setForm({ ...form, customCountry: e.target.value })
                    }
                    placeholder="Tên quốc gia *"
                    className="rounded-xl border p-2.5 text-sm"
                  />
                ) : (
                  <select
                    required
                    value={form.province}
                    onChange={(e) =>
                      setForm({ ...form, province: e.target.value })
                    }
                    className="rounded-xl border p-2.5 text-sm"
                  >
                    <option value="">Chọn tỉnh / thành phố nhận *</option>
                    {(form.country === "VN"
                      ? VIETNAM_PROVINCES
                      : CHINA_PROVINCES
                    ).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                )}
                {form.country === "OTHER" && (
                  <input
                    required
                    value={form.province}
                    onChange={(e) =>
                      setForm({ ...form, province: e.target.value })
                    }
                    placeholder="Tỉnh / Thành phố nhận *"
                    className="rounded-xl border p-2.5 text-sm"
                  />
                )}
                <input
                  required
                  value={form.district}
                  onChange={(e) =>
                    setForm({ ...form, district: e.target.value })
                  }
                  placeholder="Quận / Huyện nhận *"
                  className="rounded-xl border p-2.5 text-sm"
                />
                <input
                  required
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  placeholder="Phường / Xã nhận *"
                  className="rounded-xl border p-2.5 text-sm"
                />
                <input
                  required
                  value={form.addressLine}
                  onChange={(e) =>
                    setForm({ ...form, addressLine: e.target.value })
                  }
                  placeholder="Địa chỉ nhận chi tiết *"
                  className="rounded-xl border p-2.5 text-sm sm:col-span-2"
                />
                <textarea
                  value={form.deliveryNote}
                  onChange={(e) =>
                    setForm({ ...form, deliveryNote: e.target.value })
                  }
                  placeholder="Ghi chú giao nhận (khung giờ nhận, gọi trước...)"
                  className="min-h-20 rounded-xl border p-2.5 text-sm sm:col-span-2"
                />
              </div>
            )}
          </section>
          <label className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold">
            <input
              type="checkbox"
              checked={form.insurance}
              onChange={(e) =>
                setForm({ ...form, insurance: e.target.checked })
              }
            />
            <ShieldCheck className="h-4 w-4" />
            Mua bảo hiểm hàng hóa
          </label>
        </div>
        <div className="h-fit self-start rounded-2xl bg-slate-900 p-5 text-white lg:sticky lg:top-20 lg:z-10">
          <h2 className="flex items-center gap-2 font-bold">
            <Calculator className="h-5 w-5" />
            Dự toán chi phí
          </h2>
          <div className="mt-5 space-y-3 text-sm">
            <p className="flex justify-between">
              <span>Khối lượng quy đổi</span>
              <b>{volumetric.toFixed(2)} kg</b>
            </p>
            <p className="flex justify-between">
              <span>Khối lượng tính cước</span>
              <b>{chargeable.toFixed(2)} kg</b>
            </p>
            <p className="flex justify-between">
              <span>Cước vận chuyển</span>
              <b>{money(shipping)}</b>
            </p>
            <p className="flex justify-between">
              <span>Bảo hiểm</span>
              <b>{money(insuranceFee)}</b>
            </p>
            <p className="flex justify-between border-t border-slate-600 pt-3 text-base">
              <span>Tạm tính</span>
              <b className="text-amber-300">{money(shipping + insuranceFee)}</b>
            </p>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Sẽ tính lại theo bảng giá hiện hành khi gửi.
          </p>
          <button
            disabled={submitting}
            className="mt-5 w-full rounded-xl bg-[#fa3131] py-3 text-sm font-bold disabled:opacity-60"
          >
            {submitting ? <span className="flex items-center justify-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />Đang lưu...</span> : editingId ? "Lưu thay đổi" : "Gửi yêu cầu"}
          </button>
          {message && (
            <p className="mt-3 flex gap-1 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </p>
          )}
        </div>
      </form>}
      {tab === "list" && <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Yêu cầu đã gửi</h2>
        <div className="mt-3 space-y-2">
          {items.length === 0 ? (
            <p className="text-xs text-slate-500">Chưa có yêu cầu nào.</p>
          ) : (
            items.map((x) => (
              <div
                key={x.id}
                className="grid items-center gap-2 rounded-xl border p-3 text-xs sm:grid-cols-[1.2fr_1.5fr_1fr_1fr_1fr_auto]"
              >
                <b className="text-blue-700">{x.requestCode}</b>
                <span>{x.categoryName}</span>
                <span>{x.chargeableWeight.toFixed(2)} kg</span>
                <b>{money(x.estimatedTotalVnd)}</b>
                <span className="font-bold text-amber-700">
                  {STATUS_LABELS[x.status] || x.status}
                </span>
                <div className="flex gap-1"><button type="button" onClick={() => setSelectedItem(x)} title="Xem chi tiết" className="rounded-lg bg-blue-50 p-2 text-blue-700"><Eye className="h-4 w-4" /></button><button type="button" disabled={x.status !== "PENDING"} onClick={() => editItem(x)} title="Sửa" className="rounded-lg bg-amber-50 p-2 text-amber-700 disabled:cursor-not-allowed disabled:opacity-30"><Pencil className="h-4 w-4" /></button><button type="button" disabled={x.status !== "PENDING"} onClick={() => void deleteItem(x)} title="Xóa" className="rounded-lg bg-red-50 p-2 text-red-700 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            ))
          )}
        </div>
      </div>}
      {selectedItem && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onClick={() => setSelectedItem(null)}><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6" onClick={e => e.stopPropagation()}><div className="flex items-start justify-between"><div><h2 className="text-lg font-bold">Chi tiết {selectedItem.requestCode}</h2><p className="text-xs text-slate-500">{new Date(selectedItem.createdAt).toLocaleString("vi-VN")}</p></div><button onClick={() => setSelectedItem(null)} className="rounded-full bg-slate-100 p-2"><X className="h-4 w-4" /></button></div><div className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><Detail title="Hàng hóa" lines={[selectedItem.categoryName, selectedItem.goodsDescription, `${selectedItem.quantity} kiện • ${selectedItem.chargeableWeight.toFixed(2)} kg`, `Tạm tính: ${money(selectedItem.estimatedTotalVnd)}`]} /><Detail title="Địa điểm lấy hàng" lines={[`${selectedItem.pickupContactName} • ${selectedItem.pickupPhone}`, `${selectedItem.pickupAddressLine}, ${selectedItem.pickupWard}, ${selectedItem.pickupDistrict}, ${selectedItem.pickupProvince}`, selectedItem.pickupNote]} />{selectedItem.pickupImage && <img src={selectedItem.pickupImage} alt="Ảnh lấy hàng" className="max-h-56 w-full rounded-xl border object-cover sm:col-span-2" />}<Detail title="Thông tin nhận hàng" lines={[`${selectedItem.recipientName} • ${selectedItem.recipientPhone}`, selectedItem.recipientEmail, `${selectedItem.addressLine}, ${selectedItem.ward}, ${selectedItem.district}, ${selectedItem.province}`, selectedItem.deliveryNote]} /><Detail title="Trạng thái" lines={[STATUS_LABELS[selectedItem.status] || selectedItem.status, `Gói vận chuyển: ${selectedItem.shippingMethod}`]} /></div></div></div>}
    </div>
  );
}

function Detail({ title, lines }: { title: string; lines: Array<string | undefined> }) { return <div className="rounded-2xl bg-slate-50 p-4"><h3 className="mb-2 text-xs font-bold uppercase text-slate-500">{title}</h3>{lines.filter(Boolean).map((line, index) => <p key={index} className="mt-1 text-sm">{line}</p>)}</div>; }

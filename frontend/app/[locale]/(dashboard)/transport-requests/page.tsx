"use client";

import { FormEvent, use, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  Eye,
  Filter,
  Layers,
  LoaderCircle,
  MapPin,
  Package,
  PackagePlus,
  Pencil,
  QrCode,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { Locale } from "@/lib/i18n";
import { apiFetch } from "@/lib/api-client";
import { authStore } from "@/lib/auth-store";
import { notificationStore } from "@/lib/notification-store";
import { paymentGateway } from "@/lib/payment-service";
import {
  DEFAULT_CATEGORY_RATES,
  DEFAULT_CONTACT_SETTINGS,
  settingsStore,
} from "@/lib/settings-store";

export type TransportRequestItem = {
  id: string;
  requestCode: string;
  categoryName: string;
  goodsDescription: string;
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  chargeableWeight: number;
  shippingMethod: string;
  destinationWarehouse?: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  country: string;
  customCountry?: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  deliveryNote?: string;
  pickupContactName: string;
  pickupPhone: string;
  pickupCountry: string;
  pickupCustomCountry?: string;
  pickupProvince: string;
  pickupDistrict: string;
  pickupWard: string;
  pickupAddressLine: string;
  pickupNote?: string;
  pickupImage?: string;
  declaredValueVnd: number;
  insurance: boolean;
  estimatedShippingFeeVnd: number;
  insuranceFeeVnd: number;
  estimatedTotalVnd: number;
  depositPaidVnd?: number;
  depositPercentage?: number;
  depositRefundStatus?: string;
  depositRefundReason?: string;
  trackingCodeChina?: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  [key: string]: any;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  PENDING: {
    label: "Chờ đặt cọc",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Clock,
  },
  DEPOSITED: {
    label: "Đã đặt cọc",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  APPROVED: {
    label: "Đã duyệt",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: CheckCircle2,
  },
  PICKING_UP: {
    label: "Đang lấy hàng",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: Truck,
  },
  IN_TRANSIT: {
    label: "Đang vận chuyển",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: Truck,
  },
  COMPLETED: {
    label: "Đã hoàn tất",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Đã hủy",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: AlertCircle,
  },
};

const SHIPPING_METHOD_LABELS: Record<string, string> = {
  ECONOMY: "Tiết kiệm",
  STANDARD: "Tiêu chuẩn",
  EXPRESS: "Nhanh",
};

const money = (value: number) => `${Math.round(value || 0).toLocaleString("vi-VN")} ₫`;

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
  const [items, setItems] = useState<TransportRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"list" | "form">("list");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form State
  const [form, setForm] = useState({
    categoryId: "cat-normal",
    categoryName: "",
    goodsDescription: "",
    quantity: 1 as number | string,
    weightKg: "" as number | string,
    lengthCm: "" as number | string,
    widthCm: "" as number | string,
    heightCm: "" as number | string,
    shippingMethod: "STANDARD",
    declaredValueVnd: "" as number | string,
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TransportRequestItem | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Payment Gateway Modal State (Cọc Tiền)
  const [payGatewayItem, setPayGatewayItem] = useState<TransportRequestItem | null>(null);
  const [payMethod, setPayMethod] = useState<"PAYOS" | "PAYPAL" | "WALLET">("PAYOS");
  const [copiedTransferContent, setCopiedTransferContent] = useState(false);
  const [isVerifyingPayos, setIsVerifyingPayos] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentPercentage, setPaymentPercentage] = useState(70);

  // Bulk Deposit Modal State
  const [bulkDepositModalOpen, setBulkDepositModalOpen] = useState(false);
  const [isBulkDepositing, setIsBulkDepositing] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Deposit Refund Request Modal State
  const [refundModalItem, setRefundModalItem] = useState<TransportRequestItem | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);

  const paymentDepositAmount = payGatewayItem
    ? Math.min(
        payGatewayItem.estimatedTotalVnd,
        Math.round((payGatewayItem.estimatedTotalVnd * paymentPercentage) / 100)
      )
    : 0;

  const rates = settings.categoryShippingRates?.length
    ? settings.categoryShippingRates
    : DEFAULT_CATEGORY_RATES;
  const category =
    form.categoryId === "OTHER"
      ? { priceCnyUnder3kg: 15, priceCnyOver3kg: 12 }
      : rates.find((x) => x.id === form.categoryId) || rates[0];

  const numWeight = Number(form.weightKg) || 0;
  const numLength = Number(form.lengthCm) || 0;
  const numWidth = Number(form.widthCm) || 0;
  const numHeight = Number(form.heightCm) || 0;
  const numDeclared = Number(form.declaredValueVnd) || 0;

  const volumetric = (numLength * numWidth * numHeight) / 6000;
  const chargeable = Math.max(numWeight, volumetric);
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
        (numDeclared * (settings.insuranceFeePercent || 10)) / 100
      )
    : 0;

  const phonePattern = /^[0-9+(). -]{8,20}$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const pickupPhoneError =
    form.pickupPhone.length > 0 && !phonePattern.test(form.pickupPhone);
  const recipientPhoneError =
    form.recipientPhone.length > 0 && !phonePattern.test(form.recipientPhone);
  const recipientEmailError =
    form.recipientEmail.length > 0 && !emailPattern.test(form.recipientEmail);

  const refreshWalletBalance = async () => {
    try {
      const user = await authStore.refreshProfile();
      setWalletBalance(Number(user.balanceVnd ?? 0));
    } catch {
      setWalletBalance(Number(authStore.getUser()?.balanceVnd ?? 0));
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/packages/transport-requests/mine");
      if (res.ok) {
        const json = await res.json();
        setItems(json.data || []);
      }
    } catch (error) {
      console.error("Failed to load transport requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSettings(settingsStore.getSettings());
    void load();
    void refreshWalletBalance();

    const handleBalanceUpdate = () => void refreshWalletBalance();
    const handleTransportUpdate = () => void load();
    window.addEventListener("orderchinaviet_balance_updated", handleBalanceUpdate);
    window.addEventListener("orderchinaviet_transport_updated", handleTransportUpdate);
    return () => {
      window.removeEventListener("orderchinaviet_balance_updated", handleBalanceUpdate);
      window.removeEventListener("orderchinaviet_transport_updated", handleTransportUpdate);
    };
  }, []);

  const openPaymentGateway = (item: TransportRequestItem) => {
    setPayGatewayItem(item);
    setPaymentSuccessMsg(null);
    setPaymentPercentage(70);
    setPayMethod("PAYOS");
    void refreshWalletBalance();
  };

  const handleProcessPayment = async () => {
    if (!payGatewayItem) return;
    if (payMethod !== "WALLET") {
      setPaymentSuccessMsg(
        "PayOS / PayPal chỉ được ghi nhận tự động sau webhook ngân hàng. Vui lòng chọn Ví Dư Tài Khoản để thanh toán và duyệt cọc ngay lập tức."
      );
      return;
    }
    if (walletBalance < paymentDepositAmount) {
      setPaymentSuccessMsg(
        "Số dư ví không đủ để thanh toán tiền cọc cho yêu cầu vận chuyển này. Vui lòng nạp thêm tiền vào ví."
      );
      return;
    }
    setIsVerifyingPayos(true);

    try {
      const response = await apiFetch(
        `/packages/transport-requests/${payGatewayItem.id}/deposit`,
        {
          method: "POST",
          body: JSON.stringify({
            amountVnd: paymentDepositAmount,
            percentage: paymentPercentage,
          }),
        }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Thanh toán cọc thất bại");

      await refreshWalletBalance();
      await load();
      window.dispatchEvent(new Event("orderchinaviet_balance_updated"));
      window.dispatchEvent(new Event("orderchinaviet_transport_updated"));

      const currentUser = authStore.getUser();
      notificationStore.notifyTransportDeposit({
        requestCode: payGatewayItem.requestCode,
        customerName: currentUser?.fullName || payGatewayItem.recipientName || "Khách hàng",
        amountVnd: paymentDepositAmount,
        paymentMethod: "Ví Dư Tài Khoản",
        percentage: paymentPercentage,
      });

      setPaymentSuccessMsg(
        `Thanh toán cọc ${paymentPercentage}% (${money(paymentDepositAmount)}) thành công cho yêu cầu ${payGatewayItem.requestCode} qua Ví Dư!`
      );
      setTimeout(() => {
        setPayGatewayItem(null);
        setPaymentSuccessMsg(null);
        if (selectedItem?.id === payGatewayItem.id) {
          setSelectedItem(null);
        }
      }, 1800);
    } catch (error: any) {
      setPaymentSuccessMsg(error.message || "Không thể thanh toán tiền cọc. Vui lòng thử lại.");
      await refreshWalletBalance();
    } finally {
      setIsVerifyingPayos(false);
    }
  };

  const handleBulkDepositSubmit = async () => {
    const pendingSelected = items.filter(
      (item) => selectedIds.has(item.id) && item.status === "PENDING"
    );
    if (pendingSelected.length === 0) return;

    const totalNeeded = pendingSelected.reduce(
      (sum, x) => sum + Math.round(x.estimatedTotalVnd * 0.7),
      0
    );
    if (walletBalance < totalNeeded) {
      setBulkSuccessMsg("Số dư ví không đủ để thanh toán cọc cho tất cả các yêu cầu đã chọn.");
      return;
    }

    setIsBulkDepositing(true);
    let successCount = 0;
    try {
      for (const item of pendingSelected) {
        const depositAmt = Math.round(item.estimatedTotalVnd * 0.7);
        const res = await apiFetch(`/packages/transport-requests/${item.id}/deposit`, {
          method: "POST",
          body: JSON.stringify({ amountVnd: depositAmt, percentage: 70 }),
        });
        if (res.ok) successCount++;
      }
      await refreshWalletBalance();
      await load();
      window.dispatchEvent(new Event("orderchinaviet_balance_updated"));
      window.dispatchEvent(new Event("orderchinaviet_transport_updated"));
      setSelectedIds(new Set());
      setBulkSuccessMsg(`Đã đặt cọc 70% thành công cho ${successCount}/${pendingSelected.length} yêu cầu vận chuyển!`);
      setTimeout(() => {
        setBulkDepositModalOpen(false);
        setBulkSuccessMsg(null);
      }, 2000);
    } catch (error: any) {
      setBulkSuccessMsg(error.message || "Có lỗi xảy ra trong quá trình đặt cọc hàng loạt.");
    } finally {
      setIsBulkDepositing(false);
    }
  };

  const handleRefundSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!refundModalItem) return;
    setIsSubmittingRefund(true);
    try {
      const res = await apiFetch(
        `/packages/transport-requests/${refundModalItem.id}/request-refund`,
        {
          method: "POST",
          body: JSON.stringify({ reason: refundReason }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Không thể gửi yêu cầu hoàn tiền");
      await load();
      notificationStore.notifyTransportRefundRequest({
        requestCode: refundModalItem.requestCode,
        customerName: authStore.getUser()?.fullName || "Khách hàng",
        amountVnd: refundModalItem.depositPaidVnd || Math.round(refundModalItem.estimatedTotalVnd * 0.7),
        reason: refundReason,
      });
      setRefundSuccessMsg("Đã gửi yêu cầu hoàn tiền cọc tới ban quản trị. Chúng tôi sẽ phản hồi sớm nhất!");
      setTimeout(() => {
        setRefundModalItem(null);
        setRefundReason("");
        setRefundSuccessMsg(null);
      }, 2000);
    } catch (error: any) {
      alert(error.message || "Gửi yêu cầu hoàn tiền cọc thất bại");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const setNumber = (key: string, value: string) =>
    setForm((old) => ({ ...old, [key]: value === "" ? "" : Number(value) }));

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
    if (
      !form.pickupContactName ||
      !form.pickupPhone ||
      !form.pickupProvince ||
      !form.pickupDistrict ||
      !form.pickupWard ||
      !form.pickupAddressLine
    ) {
      setPickupOpen(true);
      setMessage("Vui lòng hoàn tất thông tin lấy hàng");
      return;
    }
    if (
      !form.recipientName ||
      !form.recipientPhone ||
      !form.province ||
      !form.district ||
      !form.ward ||
      !form.addressLine
    ) {
      setRecipientOpen(true);
      setMessage("Vui lòng hoàn tất thông tin nhận hàng");
      return;
    }
    if (pickupPhoneError || recipientPhoneError || recipientEmailError) {
      setPickupOpen(pickupPhoneError);
      setRecipientOpen(recipientPhoneError || recipientEmailError);
      setMessage("Vui lòng sửa thông tin liên hệ chưa hợp lệ");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const payload = {
        ...form,
        quantity: Math.max(1, Math.floor(Number(form.quantity) || 1)),
        weightKg: Number(form.weightKg) || 0,
        lengthCm: Number(form.lengthCm) || 0,
        widthCm: Number(form.widthCm) || 0,
        heightCm: Number(form.heightCm) || 0,
        declaredValueVnd: Number(form.declaredValueVnd) || 0,
      };
      const response = await apiFetch(
        editingId
          ? `/packages/transport-requests/${editingId}`
          : "/packages/transport-requests",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        }
      );
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Không thể gửi yêu cầu");
      setMessage(`Đã gửi yêu cầu ${json.data.requestCode}`);
      setForm((old) => ({ ...old, goodsDescription: "" }));
      await load();
      window.dispatchEvent(new Event("orderchinaviet_transport_updated"));

      const currentUser = authStore.getUser();
      notificationStore.notifyTransportRequest({
        requestCode: json.data?.requestCode || "TR-REQ",
        customerName: currentUser?.fullName || "Khách hàng",
        categoryName: form.categoryName || "Hàng hóa thông thường",
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

  const editItem = (item: TransportRequestItem) => {
    setForm((old) => ({
      ...old,
      ...item,
      categoryName: item.categoryName || "",
      recipientEmail: item.recipientEmail || "",
      customCountry: item.customCountry || "",
      deliveryNote: item.deliveryNote || "",
      pickupCustomCountry: item.pickupCustomCountry || "",
      pickupNote: item.pickupNote || "",
      pickupImage: item.pickupImage || "",
    }));
    setEditingId(item.id);
    setPickupOpen(false);
    setRecipientOpen(false);
    setMessage("");
    setTab("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteItem = async (item: TransportRequestItem) => {
    if (!window.confirm(`Xóa yêu cầu ${item.requestCode}?`)) return;
    const response = await apiFetch(`/packages/transport-requests/${item.id}`, {
      method: "DELETE",
    });
    const json = await response.json();
    if (!response.ok) return alert(json.message || "Không thể xóa yêu cầu");
    await load();
    window.dispatchEvent(new Event("orderchinaviet_transport_updated"));
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterStatus === "PENDING" && item.status !== "PENDING") return false;
      if (
        filterStatus === "DEPOSITED" &&
        !["DEPOSITED", "APPROVED"].includes(item.status)
      )
        return false;
      if (
        filterStatus === "IN_TRANSIT" &&
        !["PICKING_UP", "IN_TRANSIT"].includes(item.status)
      )
        return false;
      if (filterStatus === "COMPLETED" && item.status !== "COMPLETED")
        return false;
      if (filterStatus === "CANCELLED" && item.status !== "CANCELLED")
        return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCode = item.requestCode.toLowerCase().includes(query);
        const matchesCategory = (item.categoryName || "")
          .toLowerCase()
          .includes(query);
        const matchesDesc = (item.goodsDescription || "")
          .toLowerCase()
          .includes(query);
        const matchesRecipient = (item.recipientName || "")
          .toLowerCase()
          .includes(query);
        const matchesPickup = (item.pickupContactName || "")
          .toLowerCase()
          .includes(query);
        const matchesLocation = `${item.province} ${item.district} ${item.pickupProvince}`
          .toLowerCase()
          .includes(query);
        return (
          matchesCode ||
          matchesCategory ||
          matchesDesc ||
          matchesRecipient ||
          matchesPickup ||
          matchesLocation
        );
      }
      return true;
    });
  }, [items, filterStatus, searchQuery]);

  const pendingItemsCount = items.filter((x) => x.status === "PENDING").length;
  const depositedItemsCount = items.filter((x) =>
    ["DEPOSITED", "APPROVED"].includes(x.status)
  ).length;
  const inTransitCount = items.filter((x) =>
    ["PICKING_UP", "IN_TRANSIT"].includes(x.status)
  ).length;
  const completedCount = items.filter((x) => x.status === "COMPLETED").length;

  const selectedPendingCount = Array.from(selectedIds).filter((id) => {
    const item = items.find((x) => x.id === id);
    return item && item.status === "PENDING";
  }).length;

  const selectedPendingDepositSum = Array.from(selectedIds).reduce(
    (sum, id) => {
      const item = items.find((x) => x.id === id);
      return item && item.status === "PENDING"
        ? sum + Math.round(item.estimatedTotalVnd * 0.7)
        : sum;
    },
    0
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((x) => x.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#0c3ed0]">
              <PackagePlus className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Gửi Yêu Cầu Vận Chuyển
              </h1>
              <p className="text-xs text-slate-500">
                Khai báo thông tin nguồn hàng, địa điểm lấy hàng & nhận hàng với
                dự toán cước chuẩn xác.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-right">
            <span className="text-[11px] font-semibold text-slate-500">
              Số dư ví tài khoản
            </span>
            <p className="font-mono text-sm font-bold text-emerald-600">
              {money(walletBalance)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTab(tab === "list" ? "form" : "list");
              setEditingId(null);
            }}
            className={`cursor-pointer rounded-2xl px-5 py-2.5 text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
              tab === "form"
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-[#0c3ed0] text-white hover:bg-blue-700"
            }`}
          >
            {tab === "form" ? (
              <>
                <Layers className="h-4 w-4" />
                <span>Xem danh sách ({items.length})</span>
              </>
            ) : (
              <>
                <PackagePlus className="h-4 w-4" />
                <span>Tạo yêu cầu mới</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div
          onClick={() => setFilterStatus("ALL")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            filterStatus === "ALL"
              ? "border-[#0c3ed0] bg-blue-50/50 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tổng yêu cầu</span>
            <Package className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900">{items.length}</p>
        </div>

        <div
          onClick={() => setFilterStatus("PENDING")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            filterStatus === "PENDING"
              ? "border-amber-500 bg-amber-50/50 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>Chờ đặt cọc</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-xl font-bold text-amber-700">
            {pendingItemsCount}
          </p>
        </div>

        <div
          onClick={() => setFilterStatus("DEPOSITED")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            filterStatus === "DEPOSITED"
              ? "border-emerald-500 bg-emerald-50/50 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Đã đặt cọc</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-700">
            {depositedItemsCount}
          </p>
        </div>

        <div
          onClick={() => setFilterStatus("IN_TRANSIT")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            filterStatus === "IN_TRANSIT"
              ? "border-sky-500 bg-sky-50/50 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-sky-700">
            <span>Đang vận chuyển</span>
            <Truck className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 text-xl font-bold text-sky-700">{inTransitCount}</p>
        </div>

        <div
          onClick={() => setFilterStatus("COMPLETED")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all col-span-2 sm:col-span-1 ${
            filterStatus === "COMPLETED"
              ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
            <span>Đã hoàn tất</span>
            <Check className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-xl font-bold text-emerald-800">
            {completedCount}
          </p>
        </div>
      </div>

      {/* FORM TAB */}
      {tab === "form" && (
        <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-3">
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {editingId
                  ? `Chỉnh sửa yêu cầu ${editingId}`
                  : "Thông tin hàng hóa & địa điểm vận chuyển"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTab("list");
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Hủy sửa
                </button>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Phân loại hàng hóa *
              </label>
              <select
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-[#0c3ed0] focus:outline-hidden"
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
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Tên loại hàng *
                </label>
                <input
                  required
                  placeholder="Ví dụ: Thiết bị điện tử, máy công nghiệp..."
                  value={form.categoryName}
                  onChange={(e) =>
                    setForm({ ...form, categoryName: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-[#0c3ed0] focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Mô tả chi tiết hàng hóa *
              </label>
              <textarea
                required
                value={form.goodsDescription}
                onChange={(e) =>
                  setForm({ ...form, goodsDescription: e.target.value })
                }
                placeholder="Tên hàng, chủng loại, số kiện đóng thùng, đặc tính dễ vỡ..."
                className="min-h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-[#0c3ed0] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["quantity", "Số lượng kiện", "1", 1, 1],
                ["weightKg", "Nặng (kg)", "0.0", 0.01, 0.01],
                ["lengthCm", "Dài (cm)", "0", 0.1, 0.1],
                ["widthCm", "Rộng (cm)", "0", 0.1, 0.1],
                ["heightCm", "Cao (cm)", "0", 0.1, 0.1],
              ].map(([key, label, placeholder, min, step]) => (
                <div key={key as string}>
                  <label className="mb-1 block text-[11px] font-bold text-slate-600">
                    {label as string}
                  </label>
                  <input
                    min={min as number}
                    step={step as number}
                    required={key === "quantity"}
                    type="number"
                    placeholder={placeholder as string}
                    value={(form as any)[key as string] ?? ""}
                    onChange={(e) => setNumber(key as string, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-mono focus:border-[#0c3ed0] focus:outline-hidden"
                  />
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Gói vận chuyển
                </label>
                <select
                  value={form.shippingMethod}
                  onChange={(e) =>
                    setForm({ ...form, shippingMethod: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 p-3 text-sm focus:border-[#0c3ed0] focus:outline-hidden"
                >
                  <option value="ECONOMY">Tiết kiệm</option>
                  <option value="STANDARD">Tiêu chuẩn</option>
                  <option value="EXPRESS">Nhanh</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Giá trị khai báo hàng (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.declaredValueVnd ?? ""}
                  onChange={(e) =>
                    setNumber("declaredValueVnd", e.target.value)
                  }
                  placeholder="Nhập giá trị hàng (VNĐ)"
                  className="w-full rounded-2xl border border-slate-200 p-3 text-sm font-mono focus:border-[#0c3ed0] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Pickup Info Section */}
            <section className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50/30">
              <button
                type="button"
                onClick={() => setPickupOpen(!pickupOpen)}
                className="flex w-full items-center justify-between p-4 text-left cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-blue-900">
                  <MapPin className="h-4 w-4 text-blue-700" />
                  1. Thông tin lấy hàng (Kho gửi)
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-blue-700 transition-transform ${
                    pickupOpen ? "rotate-180" : ""
                  }`}
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
                    className="rounded-xl border border-slate-200 p-2.5 text-sm"
                  />
                  <div>
                    <input
                      required
                      type="tel"
                      value={form.pickupPhone}
                      onChange={(e) =>
                        setForm({ ...form, pickupPhone: e.target.value })
                      }
                      placeholder="Số điện thoại lấy hàng *"
                      className={`w-full rounded-xl border p-2.5 text-sm ${
                        pickupPhoneError ? "border-red-500 bg-red-50" : "border-slate-200"
                      }`}
                    />
                    {pickupPhoneError && (
                      <p className="mt-1 text-[11px] font-medium text-red-600">
                        Số điện thoại phải có 8–20 ký tự số.
                      </p>
                    )}
                  </div>

                  <select
                    value={form.pickupCountry}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pickupCountry: e.target.value,
                        pickupProvince: "",
                      })
                    }
                    className="rounded-xl border border-slate-200 p-2.5 text-sm"
                  >
                    <option value="CN">Trung Quốc (Mặc định)</option>
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
                      className="rounded-xl border border-slate-200 p-2.5 text-sm"
                    />
                  ) : (
                    <select
                      required
                      value={form.pickupProvince}
                      onChange={(e) =>
                        setForm({ ...form, pickupProvince: e.target.value })
                      }
                      className="rounded-xl border border-slate-200 p-2.5 text-sm"
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

                  <input
                    required
                    value={form.pickupDistrict}
                    onChange={(e) =>
                      setForm({ ...form, pickupDistrict: e.target.value })
                    }
                    placeholder="Quận / Huyện lấy hàng *"
                    className="rounded-xl border border-slate-200 p-2.5 text-sm"
                  />
                  <input
                    required
                    value={form.pickupWard}
                    onChange={(e) =>
                      setForm({ ...form, pickupWard: e.target.value })
                    }
                    placeholder="Phường / Xã lấy hàng *"
                    className="rounded-xl border border-slate-200 p-2.5 text-sm"
                  />

                  <input
                    required
                    value={form.pickupAddressLine}
                    onChange={(e) =>
                      setForm({ ...form, pickupAddressLine: e.target.value })
                    }
                    placeholder="Địa chỉ lấy hàng chi tiết (số nhà, ngõ...)*"
                    className="rounded-xl border border-slate-200 p-2.5 text-sm sm:col-span-2"
                  />

                  <textarea
                    value={form.pickupNote}
                    onChange={(e) =>
                      setForm({ ...form, pickupNote: e.target.value })
                    }
                    placeholder="Ghi chú lấy hàng (giờ mở cửa kho, liên hệ trước...)"
                    className="min-h-20 rounded-xl border border-slate-200 p-2.5 text-sm sm:col-span-2"
                  />

                  <div className="rounded-xl border-2 border-dashed border-slate-200 p-3 sm:col-span-2">
                    <p className="mb-2 text-xs font-bold text-slate-700">
                      Hình ảnh tại địa điểm lấy hàng{" "}
                      <span className="font-normal text-slate-400">
                        (không bắt buộc)
                      </span>
                    </p>
                    {form.pickupImage ? (
                      <div className="relative h-36 w-48 overflow-hidden rounded-xl border border-slate-200">
                        <img
                          src={form.pickupImage}
                          alt="Ảnh địa điểm lấy hàng"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, pickupImage: "" })
                          }
                          className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1 text-white hover:bg-slate-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-50 p-4 text-xs font-semibold text-slate-600 hover:bg-blue-50">
                        <Upload className="h-4 w-4 text-blue-600" />
                        <span>Chọn ảnh JPG, PNG hoặc WEBP (tối đa 2 MB)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePickupImage(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Recipient Info Section */}
            <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/30">
              <button
                type="button"
                onClick={() => setRecipientOpen(!recipientOpen)}
                className="flex w-full items-center justify-between p-4 text-left cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  2. Thông tin nhận hàng (Kho đích / Người nhận)
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-emerald-700 transition-transform ${
                    recipientOpen ? "rotate-180" : ""
                  }`}
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
                    className="rounded-xl border border-slate-200 p-2.5 text-sm"
                  />
                  <div>
                    <input
                      required
                      type="tel"
                      value={form.recipientPhone}
                      onChange={(e) =>
                        setForm({ ...form, recipientPhone: e.target.value })
                      }
                      placeholder="Số điện thoại người nhận *"
                      className={`w-full rounded-xl border p-2.5 text-sm ${
                        recipientPhoneError ? "border-red-500 bg-red-50" : "border-slate-200"
                      }`}
                    />
                    {recipientPhoneError && (
                      <p className="mt-1 text-[11px] font-medium text-red-600">
                        Số điện thoại phải có 8–20 ký tự số.
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="email"
                      value={form.recipientEmail}
                      onChange={(e) =>
                        setForm({ ...form, recipientEmail: e.target.value })
                      }
                      placeholder="Email / Gmail nhận thông báo (không bắt buộc)"
                      className={`w-full rounded-xl border p-2.5 text-sm ${
                        recipientEmailError ? "border-red-500 bg-red-50" : "border-slate-200"
                      }`}
                    />
                    {recipientEmailError && (
                      <p className="mt-1 text-[11px] font-medium text-red-600">
                        Email chưa đúng định dạng (ví dụ: ten@gmail.com).
                      </p>
                    )}
                  </div>

                  <select
                    value={form.country}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        country: e.target.value,
                        province: "",
                      })
                    }
                    className="rounded-xl border border-slate-200 p-2.5 text-sm"
                  >
                    <option value="VN">Việt Nam (Mặc định)</option>
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
                      className="rounded-xl border border-slate-200 p-2.5 text-sm"
                    />
                  ) : (
                    <select
                      required
                      value={form.province}
                      onChange={(e) =>
                        setForm({ ...form, province: e.target.value })
                      }
                      className="rounded-xl border border-slate-200 p-2.5 text-sm"
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

                  <input
                    required
                    value={form.district}
                    onChange={(e) =>
                      setForm({ ...form, district: e.target.value })
                    }
                    placeholder="Quận / Huyện nhận *"
                    className="rounded-xl border border-slate-200 p-2.5 text-sm"
                  />
                  <input
                    required
                    value={form.ward}
                    onChange={(e) =>
                      setForm({ ...form, ward: e.target.value })
                    }
                    placeholder="Phường / Xã nhận *"
                    className="rounded-xl border border-slate-200 p-2.5 text-sm"
                  />

                  <input
                    required
                    value={form.addressLine}
                    onChange={(e) =>
                      setForm({ ...form, addressLine: e.target.value })
                    }
                    placeholder="Địa chỉ nhận chi tiết *"
                    className="rounded-xl border border-slate-200 p-2.5 text-sm sm:col-span-2"
                  />

                  <textarea
                    value={form.deliveryNote}
                    onChange={(e) =>
                      setForm({ ...form, deliveryNote: e.target.value })
                    }
                    placeholder="Ghi chú giao nhận (khung giờ nhận, gọi trước khi giao...)"
                    className="min-h-20 rounded-xl border border-slate-200 p-2.5 text-sm sm:col-span-2"
                  />
                </div>
              )}
            </section>

            <label className="flex items-center gap-2.5 rounded-2xl bg-amber-50/70 border border-amber-200 p-3.5 text-xs font-semibold text-amber-900 cursor-pointer">
              <input
                type="checkbox"
                checked={form.insurance}
                onChange={(e) =>
                  setForm({ ...form, insurance: e.target.checked })
                }
                className="h-4 w-4 rounded-md border-amber-300 text-amber-600 accent-amber-600"
              />
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>
                Mua bảo hiểm an toàn hàng hóa (10% giá trị khai báo, đền bù 100% khi mất mát)
              </span>
            </label>
          </div>

          {/* Sticky Estimate Sidebar */}
          <div className="h-fit self-start rounded-3xl bg-slate-900 p-6 text-white shadow-lg lg:sticky lg:top-20 lg:z-10">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Calculator className="h-5 w-5 text-amber-400" />
              <span>Dự Toán Chi Phí</span>
            </h2>

            <div className="mt-5 space-y-3.5 text-xs">
              <p className="flex justify-between text-slate-300">
                <span>Khối lượng quy đổi</span>
                <b className="font-mono text-slate-100">{volumetric.toFixed(2)} kg</b>
              </p>
              <p className="flex justify-between text-slate-300">
                <span>Khối lượng tính cước</span>
                <b className="font-mono text-slate-100">{chargeable.toFixed(2)} kg</b>
              </p>
              <p className="flex justify-between text-slate-300">
                <span>Cước vận chuyển</span>
                <b className="font-mono text-slate-100">{money(shipping)}</b>
              </p>
              <p className="flex justify-between text-slate-300">
                <span>Phí bảo hiểm</span>
                <b className="font-mono text-slate-100">{money(insuranceFee)}</b>
              </p>

              <div className="border-t border-slate-700/80 pt-3">
                <p className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-200">Tổng tạm tính</span>
                  <b className="font-mono text-base font-bold text-amber-300">
                    {money(shipping + insuranceFee)}
                  </b>
                </p>
                <p className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>Tiền cọc tối thiểu (70%)</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {money((shipping + insuranceFee) * 0.7)}
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-slate-400 italic">
              * Dự toán sẽ được chuẩn hóa lại khi nhân viên kho tiến hành cân đo thực tế.
            </p>

            <button
              disabled={submitting}
              className="mt-5 w-full cursor-pointer rounded-2xl bg-[#fa3131] py-3.5 text-xs font-bold text-white transition-all hover:bg-rose-700 disabled:opacity-60 shadow-md"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Đang lưu yêu cầu...
                </span>
              ) : editingId ? (
                "Lưu thay đổi"
              ) : (
                "Gửi Yêu Cầu Vận Chuyển"
              )}
            </button>

            {message && (
              <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-950/60 p-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{message}</span>
              </p>
            )}
          </div>
        </form>
      )}

      {/* LIST TAB */}
      {tab === "list" && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Status Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                {[
                  { key: "ALL", label: "Tất cả", count: items.length },
                  { key: "PENDING", label: "Chờ đặt cọc", count: pendingItemsCount },
                  { key: "DEPOSITED", label: "Đã đặt cọc", count: depositedItemsCount },
                  { key: "IN_TRANSIT", label: "Đang vận chuyển", count: inTransitCount },
                  { key: "COMPLETED", label: "Hoàn tất", count: completedCount },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setFilterStatus(st.key)}
                    className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                      filterStatus === st.key
                        ? "bg-[#0c3ed0] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{st.label}</span>
                    <span className="ml-1.5 opacity-80">({st.count})</span>
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm mã, loại hàng, địa chỉ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs focus:border-[#0c3ed0] focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Bulk Actions Banner (When pending items selected) */}
            {selectedPendingCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-3.5">
                <div className="flex items-center gap-2 text-xs text-amber-900">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>
                    Đã chọn <strong>{selectedPendingCount}</strong> yêu cầu chờ cọc
                    • Tổng tiền cọc 70%:{" "}
                    <strong className="font-mono font-bold text-rose-600">
                      {money(selectedPendingDepositSum)}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkDepositModalOpen(true)}
                  className="cursor-pointer rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-amber-700 shadow-xs flex items-center gap-1.5"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Đặt cọc {selectedPendingCount} đơn đã chọn</span>
                </button>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                <LoaderCircle className="h-8 w-8 animate-spin text-[#0c3ed0]" />
                <p className="text-xs font-semibold">Đang tải danh sách yêu cầu vận chuyển...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
                <Package className="h-10 w-10 stroke-[1.5] text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">
                  Không tìm thấy yêu cầu vận chuyển nào.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("ALL");
                    setSearchQuery("");
                    setTab("form");
                  }}
                  className="cursor-pointer rounded-xl bg-[#0c3ed0] px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Tạo yêu cầu mới
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="p-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.size === filteredItems.length &&
                            filteredItems.length > 0
                          }
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-[#0c3ed0] accent-[#0c3ed0] cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Mã Yêu Cầu</th>
                      <th className="p-4">Hàng Hóa & Trọng Lượng</th>
                      <th className="p-4">Lộ Trình Vận Chuyển</th>
                      <th className="p-4">Dự Toán & Đặt Cọc</th>
                      <th className="p-4">Trạng Thái</th>
                      <th className="p-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const cfg =
                        STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
                      const StatusIcon = cfg.icon;
                      const isPending = item.status === "PENDING";
                      const isDeposited =
                        item.status === "DEPOSITED" || item.status === "APPROVED";
                      const depositPaid = item.depositPaidVnd || 0;
                      const depositRequired = Math.round(
                        item.estimatedTotalVnd * 0.7
                      );
                      const remaining = Math.max(
                        0,
                        item.estimatedTotalVnd - depositPaid
                      );

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(item.id)}
                              onChange={() => toggleSelectItem(item.id)}
                              className="h-4 w-4 rounded border-slate-300 text-[#0c3ed0] accent-[#0c3ed0] cursor-pointer"
                            />
                          </td>

                          {/* Code & Service */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <span className="font-mono font-bold text-blue-700 text-sm">
                                {item.requestCode}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                  {SHIPPING_METHOD_LABELS[item.shippingMethod] ||
                                    item.shippingMethod}
                                </span>
                                {item.insurance && (
                                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 flex items-center gap-0.5">
                                    <ShieldCheck className="h-3 w-3" />
                                    BH
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {new Date(item.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </p>
                            </div>
                          </td>

                          {/* Goods & Dimensions */}
                          <td className="p-4">
                            <div className="space-y-1 max-w-xs">
                              <p className="font-bold text-slate-900">
                                {item.categoryName}
                              </p>
                              <p className="line-clamp-1 text-slate-500">
                                {item.goodsDescription}
                              </p>
                              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600">
                                <span>{item.quantity} kiện</span>
                                <span>•</span>
                                <span className="font-bold text-slate-800">
                                  {item.chargeableWeight?.toFixed(2)} kg
                                </span>
                                <span>•</span>
                                <span>
                                  {item.lengthCm}x{item.widthCm}x{item.heightCm} cm
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Route */}
                          <td className="p-4">
                            <div className="space-y-1 text-[11px]">
                              <div className="flex items-center gap-1 text-blue-900 font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                                <span>Kho gửi: {item.pickupProvince || "TQ"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-emerald-900 font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                <span>Nhận: {item.province || "VN"}</span>
                              </div>
                              <p className="text-slate-500 line-clamp-1">
                                {item.recipientName} • {item.recipientPhone}
                              </p>
                            </div>
                          </td>

                          {/* Financial & Deposit */}
                          <td className="p-4">
                            <div className="space-y-1 font-mono">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] text-slate-500">Tạm tính:</span>
                                <span className="font-bold text-slate-900">
                                  {money(item.estimatedTotalVnd)}
                                </span>
                              </div>

                              {isDeposited ? (
                                <div className="flex items-center justify-between gap-2 text-emerald-700">
                                  <span className="text-[11px]">
                                    Đã cọc ({item.depositPercentage || 70}%):
                                  </span>
                                  <span className="font-bold">
                                    {money(depositPaid)}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2 text-rose-600">
                                  <span className="text-[11px]">Cần cọc (70%):</span>
                                  <span className="font-bold">
                                    {money(depositRequired)}
                                  </span>
                                </div>
                              )}

                              {isDeposited && remaining > 0 && (
                                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-0.5">
                                  <span>Còn lại:</span>
                                  <span>{money(remaining)}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}
                              >
                                <StatusIcon className="h-3.5 w-3.5" />
                                <span>{cfg.label}</span>
                              </span>

                              {item.depositRefundStatus === "PENDING" && (
                                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                                  <Clock className="h-3 w-3" />
                                  <span>Đang chờ hoàn cọc</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* DEPOSIT ACTION BUTTON */}
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => openPaymentGateway(item)}
                                  className="cursor-pointer rounded-xl bg-[#fa3131] hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                                  title="Đặt cọc tiền yêu cầu vận chuyển"
                                >
                                  <Wallet className="h-3.5 w-3.5" />
                                  <span>Đặt Cọc</span>
                                </button>
                              )}

                              {/* REFUND REQUEST BUTTON */}
                              {isDeposited &&
                                item.depositRefundStatus !== "PENDING" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRefundModalItem(item);
                                      setRefundReason("");
                                    }}
                                    className="cursor-pointer rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 p-2 border border-amber-200 transition-colors"
                                    title="Yêu cầu hoàn tiền cọc"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                )}

                              {/* VIEW DETAIL */}
                              <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="cursor-pointer rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0c3ed0] p-2 border border-blue-200 transition-colors"
                                title="Xem chi tiết yêu cầu"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* EDIT (Pending only) */}
                              <button
                                type="button"
                                disabled={!isPending}
                                onClick={() => editItem(item)}
                                className="cursor-pointer rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
                                title="Chỉnh sửa thông tin"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              {/* DELETE (Pending only) */}
                              <button
                                type="button"
                                disabled={!isPending}
                                onClick={() => void deleteItem(item)}
                                className="cursor-pointer rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 disabled:cursor-not-allowed disabled:opacity-30 transition-colors"
                                title="Xóa yêu cầu"
                              >
                                <Trash2 className="h-4 w-4" />
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
        </div>
      )}

      {/* PAYMENT GATEWAY MODAL (CỌC TIỀN) */}
      {payGatewayItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => {
            if (!isVerifyingPayos) setPayGatewayItem(null);
          }}
        >
          <div
            className="w-full max-w-xl max-h-[95vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    Thanh Toán Đặt Cọc Vận Chuyển
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Mã yêu cầu:{" "}
                  <strong className="font-mono text-blue-700">
                    {payGatewayItem.requestCode}
                  </strong>{" "}
                  • {payGatewayItem.categoryName} ({payGatewayItem.chargeableWeight.toFixed(2)} kg)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayGatewayItem(null)}
                className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Success Message Banner */}
            {paymentSuccessMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  paymentSuccessMsg.includes("thành công")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {paymentSuccessMsg.includes("thành công") ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            {/* Deposit Percentage Selector Slider */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Tỷ lệ đặt cọc yêu cầu
                </span>
                <span className="font-bold text-rose-600 font-mono text-sm">
                  {paymentPercentage}%
                </span>
              </div>

              <input
                type="range"
                min="70"
                max="100"
                step="1"
                value={paymentPercentage}
                onChange={(e) => setPaymentPercentage(Number(e.target.value))}
                className="w-full accent-[#fa3131] cursor-pointer"
              />

              <div className="grid grid-cols-4 gap-2">
                {[70, 80, 90, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setPaymentPercentage(pct)}
                    className={`cursor-pointer rounded-xl border py-1.5 text-xs font-bold transition-all ${
                      paymentPercentage === pct
                        ? "border-[#fa3131] bg-[#fa3131] text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 text-xs">
                <span className="font-semibold text-slate-600">
                  Tổng cước tạm tính:
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {money(payGatewayItem.estimatedTotalVnd)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Số tiền cọc cần thanh toán ({paymentPercentage}%):
                </span>
                <span className="font-mono text-base font-bold text-rose-600">
                  {money(paymentDepositAmount)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPayMethod("PAYOS")}
                className={`cursor-pointer py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  payMethod === "PAYOS"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>PayOS VietQR</span>
              </button>

              <button
                type="button"
                onClick={() => setPayMethod("PAYPAL")}
                className={`cursor-pointer py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  payMethod === "PAYPAL"
                    ? "bg-[#003087] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>PayPal USD</span>
              </button>

              <button
                type="button"
                onClick={() => setPayMethod("WALLET")}
                className={`cursor-pointer py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  payMethod === "WALLET"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ví Dư ({money(walletBalance)})</span>
              </button>
            </div>

            {/* 1. PAYOS VIETQR VIEW */}
            {payMethod === "PAYOS" &&
              (() => {
                const checkout = paymentGateway.createPayosCheckout({
                  orderId: payGatewayItem.requestCode,
                  amountVnd: paymentDepositAmount,
                  description: `Thanh toan coc ${payGatewayItem.requestCode}`,
                });

                return (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-36 h-36 bg-white p-2 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-center shrink-0">
                        <img
                          src={checkout.qrCodeUrl}
                          alt="PayOS VietQR Code"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-800 flex-1">
                        <div className="font-bold text-emerald-900 text-sm flex items-center gap-1">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span>Quét Mã QR Chuyển Khoản Tự Động</span>
                        </div>

                        <div>
                          Ngân Hàng:{" "}
                          <strong className="font-bold text-slate-900">
                            {checkout.bankName}
                          </strong>
                        </div>
                        <div>
                          Số Tài Khoản:{" "}
                          <strong className="font-mono font-bold text-slate-900">
                            {checkout.accountNumber}
                          </strong>
                        </div>
                        <div>
                          Chủ Tài Khoản:{" "}
                          <strong className="font-bold text-slate-900">
                            {checkout.accountName}
                          </strong>
                        </div>
                        <div>
                          Số Tiền Cọc {paymentPercentage}%:{" "}
                          <strong className="font-mono font-bold text-rose-600 text-sm">
                            {money(checkout.amountVnd)}
                          </strong>
                        </div>

                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-slate-500">Nội dung CK:</span>
                          <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 text-xs">
                            {checkout.transferContent}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                checkout.transferContent
                              );
                              setCopiedTransferContent(true);
                              setTimeout(
                                () => setCopiedTransferContent(false),
                                2000
                              );
                            }}
                            className="cursor-pointer text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                          >
                            {copiedTransferContent ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {copiedTransferContent ? "Đã chép" : "Sao chép"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic text-center">
                      * PayOS sẽ tự động quét biến động số dư 24/7 và cập nhật trạng thái yêu cầu ngay khi ngân hàng nhận tiền.
                    </p>
                  </div>
                );
              })()}

            {/* 2. PAYPAL USD VIEW */}
            {payMethod === "PAYPAL" &&
              (() => {
                const paypal = paymentGateway.createPaypalCheckout({
                  orderId: payGatewayItem.requestCode,
                  amountVnd: paymentDepositAmount,
                  description: `Transport Deposit ${payGatewayItem.requestCode}`,
                });

                return (
                  <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sky-900 flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-lg bg-[#003087] text-white font-mono font-bold flex items-center justify-center text-[10px]">
                          PP
                        </span>
                        <span>Thanh Toán Thẻ Visa / Mastercard Qua PayPal</span>
                      </div>
                      <span className="font-mono font-bold text-sky-700 bg-white px-2 py-0.5 rounded border border-sky-200">
                        {paypal.mode.toUpperCase()}
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-sky-200 space-y-2 font-mono">
                      <div className="flex justify-between text-slate-600">
                        <span>Giá Trị VNĐ:</span>
                        <span className="font-bold text-slate-900">
                          {money(paypal.amountVnd)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Tỷ Giá Quy Đổi:</span>
                        <span className="font-bold text-slate-900">
                          1 USD = {money(paypal.exchangeRate)}
                        </span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-bold text-sm pt-2 border-t border-sky-100">
                        <span>Tổng USD Thanh Toán:</span>
                        <span>${paypal.amountUsd.toFixed(2)} USD</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      PayPal Client ID:{" "}
                      <span className="font-mono text-slate-800 font-bold">
                        {paypal.paypalClientId}
                      </span>
                    </div>
                  </div>
                );
              })()}

            {/* 3. WALLET VIEW */}
            {payMethod === "WALLET" && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
                <div className="font-bold text-slate-900">
                  Thanh Toán Trực Tiếp Từ Số Dư Ví Tài Khoản (Duyệt Tức Thì)
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-600">Số Dư Khả Dụng Hiện Có:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {money(walletBalance)}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-600">
                    Trừ Tiền Cọc {paymentPercentage}%:
                  </span>
                  <span className="font-bold text-rose-600 text-sm">
                    -{money(paymentDepositAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-mono">
                  <span className="text-slate-600">Số Dư Sau Thanh Toán:</span>
                  <span
                    className={`font-bold text-sm ${
                      walletBalance >= paymentDepositAmount
                        ? "text-slate-900"
                        : "text-rose-600"
                    }`}
                  >
                    {walletBalance >= paymentDepositAmount
                      ? money(walletBalance - paymentDepositAmount)
                      : "Không đủ số dư ví"}
                  </span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPayGatewayItem(null)}
                className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Đóng
              </button>

              <button
                type="button"
                disabled={
                  isVerifyingPayos ||
                  (payMethod === "WALLET" &&
                    walletBalance < paymentDepositAmount)
                }
                onClick={handleProcessPayment}
                className={`cursor-pointer px-5 py-2.5 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  payMethod === "PAYOS"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : payMethod === "PAYPAL"
                      ? "bg-[#003087] hover:bg-[#002266]"
                      : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {isVerifyingPayos ? (
                  <>
                    <LoaderCircle className="w-4 h-4 animate-spin text-white" />
                    <span>Đang xử lý giao dịch...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Xác Nhận Đã Thanh Toán Cọc</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DEPOSIT MODAL */}
      {bulkDepositModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => setBulkDepositModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Đặt Cọc Hàng Loạt Qua Ví Dư
                </h2>
                <p className="text-xs text-slate-500">
                  Thanh toán cọc 70% cùng lúc cho các yêu cầu đã chọn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBulkDepositModalOpen(false)}
                className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {bulkSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Số yêu cầu chờ cọc đã chọn:</span>
                <span className="font-bold text-slate-900">{selectedPendingCount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tổng tiền cọc (70%):</span>
                <span className="font-bold text-rose-600">{money(selectedPendingDepositSum)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Số dư ví hiện có:</span>
                <span className="font-bold text-emerald-600">{money(walletBalance)}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2">
                <span>Số dư sau thanh toán:</span>
                <span
                  className={`font-bold ${
                    walletBalance >= selectedPendingDepositSum
                      ? "text-slate-900"
                      : "text-rose-600"
                  }`}
                >
                  {walletBalance >= selectedPendingDepositSum
                    ? money(walletBalance - selectedPendingDepositSum)
                    : "Không đủ số dư ví"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBulkDepositModalOpen(false)}
                className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={
                  isBulkDepositing || walletBalance < selectedPendingDepositSum
                }
                onClick={handleBulkDepositSubmit}
                className="cursor-pointer px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isBulkDepositing ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin text-white" />
                    <span>Đang cọc hàng loạt...</span>
                  </>
                ) : (
                  <span>Xác Nhận Đặt Cọc Hàng Loạt</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPOSIT REFUND MODAL */}
      {refundModalItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => setRefundModalItem(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  <span>Yêu Cầu Hoàn Tiền Cọc</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Yêu cầu:{" "}
                  <strong className="font-mono text-blue-700">
                    {refundModalItem.requestCode}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalItem(null)}
                className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {refundSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{refundSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleRefundSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Số tiền cọc đã trả:</span>
                  <span className="font-bold text-emerald-600">
                    {money(refundModalItem.depositPaidVnd || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-slate-700">
                  Lý do yêu cầu hoàn cọc *
                </label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ví dụ: Thay đổi kế hoạch vận chuyển, nhà cung cấp hủy đơn..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefundModalItem(null)}
                  className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="cursor-pointer px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmittingRefund ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin text-white" />
                      <span>Đang gửi yêu cầu...</span>
                    </>
                  ) : (
                    <span>Gửi Yêu Cầu Hoàn Cọc</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    Chi Tiết Yêu Cầu Vận Chuyển
                  </h2>
                  <span className="font-mono font-bold text-blue-700 text-base">
                    {selectedItem.requestCode}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Ngày tạo:{" "}
                  {new Date(selectedItem.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="cursor-pointer rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Grid Breakdown */}
            <div className="grid gap-4 text-xs sm:grid-cols-2">
              <Detail
                title="Hàng Hóa & Trọng Lượng"
                lines={[
                  `Phân loại: ${selectedItem.categoryName}`,
                  `Mô tả: ${selectedItem.goodsDescription}`,
                  `Số lượng: ${selectedItem.quantity} kiện`,
                  `Khối lượng thực: ${selectedItem.weightKg} kg`,
                  `Khối lượng tính cước: ${selectedItem.chargeableWeight?.toFixed(2)} kg`,
                  `Kích thước: ${selectedItem.lengthCm}x${selectedItem.widthCm}x${selectedItem.heightCm} cm`,
                ]}
              />

              <Detail
                title="Dự Toán Cước & Đặt Cọc"
                lines={[
                  `Gói cước: ${SHIPPING_METHOD_LABELS[selectedItem.shippingMethod] || selectedItem.shippingMethod}`,
                  `Cước vận chuyển: ${money(selectedItem.estimatedShippingFeeVnd)}`,
                  `Bảo hiểm: ${money(selectedItem.insuranceFeeVnd)}`,
                  `Tổng tạm tính: ${money(selectedItem.estimatedTotalVnd)}`,
                  selectedItem.status === "DEPOSITED" || selectedItem.status === "APPROVED"
                    ? `Đã thanh toán cọc: ${money(selectedItem.depositPaidVnd || 0)} (${selectedItem.depositPercentage || 70}%)`
                    : `Cần đặt cọc (70%): ${money(selectedItem.estimatedTotalVnd * 0.7)}`,
                  `Số tiền còn lại: ${money(Math.max(0, selectedItem.estimatedTotalVnd - (selectedItem.depositPaidVnd || 0)))}`,
                ]}
              />

              <Detail
                title="Địa Điểm Lấy Hàng (Kho Gửi)"
                lines={[
                  `Người liên hệ: ${selectedItem.pickupContactName} • ${selectedItem.pickupPhone}`,
                  `Địa chỉ: ${selectedItem.pickupAddressLine}, ${selectedItem.pickupWard}, ${selectedItem.pickupDistrict}, ${selectedItem.pickupProvince} (${selectedItem.pickupCountry})`,
                  selectedItem.pickupNote ? `Ghi chú: ${selectedItem.pickupNote}` : undefined,
                ]}
              />

              <Detail
                title="Thông Tin Nhận Hàng (Kho Đích)"
                lines={[
                  `Người nhận: ${selectedItem.recipientName} • ${selectedItem.recipientPhone}`,
                  selectedItem.recipientEmail ? `Email: ${selectedItem.recipientEmail}` : undefined,
                  `Địa chỉ: ${selectedItem.addressLine}, ${selectedItem.ward}, ${selectedItem.district}, ${selectedItem.province} (${selectedItem.country})`,
                  selectedItem.deliveryNote ? `Ghi chú giao: ${selectedItem.deliveryNote}` : undefined,
                ]}
              />

              {selectedItem.pickupImage && (
                <div className="sm:col-span-2 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ảnh Chụp Tại Địa Điểm Lấy Hàng
                  </h3>
                  <img
                    src={selectedItem.pickupImage}
                    alt="Ảnh lấy hàng"
                    className="max-h-64 w-full rounded-xl border border-slate-200 object-cover"
                  />
                </div>
              )}

              {selectedItem.adminNote && (
                <div className="sm:col-span-2 rounded-2xl bg-amber-50/70 p-4 border border-amber-200">
                  <h3 className="mb-1 text-xs font-bold uppercase text-amber-800">
                    Ghi Chú Ban Quản Trị
                  </h3>
                  <p className="text-xs text-amber-900">{selectedItem.adminNote}</p>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-bold ${
                    STATUS_CONFIG[selectedItem.status]?.bg || "bg-slate-100"
                  } ${STATUS_CONFIG[selectedItem.status]?.text || "text-slate-700"} ${
                    STATUS_CONFIG[selectedItem.status]?.border || "border-slate-200"
                  }`}
                >
                  <span>{STATUS_CONFIG[selectedItem.status]?.label || selectedItem.status}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedItem.status === "PENDING" && (
                  <button
                    type="button"
                    onClick={() => {
                      const itemToPay = selectedItem;
                      setSelectedItem(null);
                      openPaymentGateway(itemToPay);
                    }}
                    className="cursor-pointer rounded-xl bg-[#fa3131] hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Đặt Cọc Ngay</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="cursor-pointer rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  title,
  lines,
}: {
  title: string;
  lines: Array<string | undefined>;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1.5">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {lines.filter(Boolean).map((line, index) => (
        <p key={index} className="text-xs text-slate-800">
          {line}
        </p>
      ))}
    </div>
  );
}

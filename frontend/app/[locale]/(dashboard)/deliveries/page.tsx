'use client';

import { useCallback, useEffect, useState } from 'react';
import { Boxes, MapPin, Plus, Truck, X } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { authStore } from '@/lib/auth-store';
import { notificationStore } from '@/lib/notification-store';

type Parcel = { id:string; code:string; product:string; weight:number; arrivedAt:string; location:string };
type Request = { id:string; packages:string[]; totalWeight:number; address:string; contact:string; method:string; fee:number; status:string; createdAt:string };
const STATUS:Record<string,string>={PENDING:'Chờ duyệt',APPROVED:'Đã duyệt',DELIVERING:'Đang giao',COMPLETED:'Đã giao',REJECTED:'Từ chối'};

export default function DeliveriesPage(){
  const[loading,setLoading]=useState(true);const[parcels,setParcels]=useState<Parcel[]>([]);const[requests,setRequests]=useState<Request[]>([]);const[showCreate,setShowCreate]=useState(false);const[selected,setSelected]=useState<string[]>([]);const[submitting,setSubmitting]=useState(false);const[form,setForm]=useState({address:'',contactPhone:'',shippingMethod:'STANDARD'});
  const load=useCallback(async()=>{setLoading(true);try{const[pRes,rRes]=await Promise.all([apiFetch('/packages?status=RECEIVED_VIETNAM'),apiFetch('/packages/delivery-requests/mine')]);const[pJson,rJson]=await Promise.all([pRes.json(),rRes.json()]);if(!pRes.ok)throw new Error(pJson.message);if(!rRes.ok)throw new Error(rJson.message);setParcels(pJson.data.map((p:any)=>({id:p.id,code:p.parcelCode,product:p.notes||'Kiện hàng',weight:Number(p.chargeableWeight),arrivedAt:new Date(p.updatedAt).toLocaleString('vi-VN'),location:p.currentWarehouse?.name||'Kho Việt Nam'})));setRequests(rJson.data.map((r:any)=>({id:r.requestCode,packages:r.parcels.map((p:any)=>p.parcelCode),totalWeight:r.parcels.reduce((sum:number,p:any)=>sum+Number(p.chargeableWeight),0),address:r.address,contact:r.contactPhone,method:r.shippingMethod,fee:r.feeVnd,status:r.status,createdAt:new Date(r.createdAt).toLocaleString('vi-VN')})))}catch(e:any){alert(e.message)}finally{setLoading(false)}},[]);useEffect(()=>{void load()},[load]);
  const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!selected.length)return alert('Vui lòng chọn ít nhất một kiện');
    setSubmitting(true);
    try{
      const res=await apiFetch('/packages/delivery-requests',{method:'POST',body:JSON.stringify({...form,parcelIds:selected})});
      const json=await res.json();
      if(!res.ok)throw new Error(json.message);
      
      const currentUser = authStore.getUser();
      notificationStore.notifyDeliveryRequest({
        requestCode: json.data?.requestCode || 'DEL-REQ',
        customerName: currentUser?.fullName || 'Khách hàng',
        parcelsCount: selected.length,
        address: form.address,
      });

      setShowCreate(false);
      setSelected([]);
      setForm({address:'',contactPhone:'',shippingMethod:'STANDARD'});
      await load();
      window.dispatchEvent(new Event('orderchinaviet_transport_updated'))
    }catch(e:any){alert(e.message)}finally{setSubmitting(false)}
  };
  return <div className="space-y-5 text-slate-800"><div className="flex flex-col gap-4 rounded-3xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-bold text-amber-400">GIAO HÀNG NỘI ĐỊA</div><h1 className="mt-1 text-xl font-bold">Yêu Cầu Giao Hàng Từ Kho Việt Nam</h1><p className="mt-1 text-xs text-slate-400">Chọn kiện đã về kho, nhập địa chỉ và theo dõi trạng thái giao.</p></div><button disabled={!parcels.length} onClick={()=>setShowCreate(true)} className="flex items-center justify-center gap-2 rounded-xl bg-[#fa3131] px-4 py-2.5 text-xs font-bold disabled:opacity-50"><Plus className="h-4 w-4"/>Tạo Yêu Cầu Giao</button></div>
  <div className="rounded-3xl border bg-white p-5"><h2 className="mb-4 flex items-center gap-2 font-bold"><Boxes className="h-4 w-4 text-purple-600"/>Kiện sẵn sàng giao tại kho Việt Nam <span className="text-[#fa3131]">({parcels.length})</span></h2>{loading?<div className="py-10 text-center text-sm text-slate-500">Đang tải...</div>:parcels.length?<div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead><tr className="border-b text-[10px] uppercase text-slate-500"><th className="pb-3">Chọn</th><th className="pb-3">Mã kiện</th><th className="pb-3">Tên hàng</th><th className="pb-3">Cân tính phí</th><th className="pb-3">Kho</th><th className="pb-3">Ngày về</th></tr></thead><tbody className="divide-y">{parcels.map(p=><tr key={p.id}><td className="py-3"><input type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggle(p.id)}/></td><td className="font-mono font-bold text-[#fa3131]">{p.code}</td><td>{p.product}</td><td className="font-mono font-bold">{p.weight.toLocaleString('vi-VN')} kg</td><td>{p.location}</td><td>{p.arrivedAt}</td></tr>)}</tbody></table></div>:<div className="py-10 text-center text-sm text-slate-500">Chưa có kiện nào đã về kho Việt Nam.</div>}</div>
  <div className="rounded-3xl border bg-white p-5"><h2 className="mb-4 flex items-center gap-2 font-bold"><Truck className="h-4 w-4 text-sky-600"/>Lịch sử yêu cầu giao <span className="text-[#fa3131]">({requests.length})</span></h2>{requests.length?<div className="space-y-3">{requests.map(r=><div key={r.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><b className="font-mono text-[#fa3131]">{r.id}</b><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">{STATUS[r.status]||r.status}</span></div><div className="mt-3 grid gap-2 text-xs sm:grid-cols-3"><div><span className="text-slate-400">Kiện:</span> {r.packages.join(', ')}</div><div><span className="text-slate-400">Cân nặng:</span> {r.totalWeight.toLocaleString('vi-VN')} kg</div><div><span className="text-slate-400">Phí dự kiến:</span> <b>{r.fee.toLocaleString('vi-VN')} ₫</b></div></div><div className="mt-2 flex gap-1 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5 shrink-0 text-[#fa3131]"/>{r.address} • {r.contact}</div><div className="mt-2 text-[10px] text-slate-400">{r.createdAt}</div></div>)}</div>:<div className="py-10 text-center text-sm text-slate-500">Chưa có yêu cầu giao hàng.</div>}</div>
  {showCreate&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"><form onSubmit={submit} className="relative w-full max-w-lg space-y-4 rounded-3xl bg-white p-6"><button type="button" onClick={()=>setShowCreate(false)} className="absolute right-4 top-4 rounded-full bg-slate-100 p-2"><X className="h-4 w-4"/></button><div><h2 className="text-lg font-bold">Thông Tin Giao Hàng</h2><p className="text-xs text-slate-500">Đã chọn {selected.length} kiện.</p></div><div className="max-h-36 overflow-y-auto rounded-xl border p-3">{parcels.map(p=><label key={p.id} className="flex gap-2 py-1 text-xs"><input type="checkbox" checked={selected.includes(p.id)} onChange={()=>toggle(p.id)}/>{p.code} • {p.weight} kg</label>)}</div><input required value={form.contactPhone} onChange={e=>setForm({...form,contactPhone:e.target.value})} placeholder="Số điện thoại người nhận" className="w-full rounded-xl border px-3 py-2.5 text-sm"/><textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Địa chỉ nhận hàng đầy đủ" className="w-full rounded-xl border px-3 py-2.5 text-sm"/><select value={form.shippingMethod} onChange={e=>setForm({...form,shippingMethod:e.target.value})} className="w-full rounded-xl border px-3 py-2.5 text-sm"><option value="STANDARD">Giao tiêu chuẩn</option><option value="EXPRESS">Giao nhanh</option><option value="PICKUP">Tự đến kho nhận</option></select><button disabled={submitting} className="w-full rounded-xl bg-[#fa3131] py-2.5 text-xs font-bold text-white disabled:opacity-50">{submitting?'Đang gửi...':'Gửi Yêu Cầu Giao'}</button></form></div>}</div>;
}

'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, LogIn } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

const todayInVietnam = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export default function AffiliateAttendancePage() {
  const [month, setMonth] = useState(todayInVietnam().slice(0, 7));
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true); const [checking, setChecking] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { const res = await apiFetch(`/affiliates/attendance/me?month=${month}`); const json = await res.json(); if (!res.ok) throw new Error(json.message); setData(json.data); } catch (e: any) { alert(e.message); } finally { setLoading(false); } }, [month]);
  useEffect(() => { void load(); }, [load]);
  const checkIn = async () => { setChecking(true); try { const res = await apiFetch('/affiliates/attendance/check-in', { method: 'POST' }); const json = await res.json(); if (!res.ok) throw new Error(json.message); await load(); } catch (e: any) { alert(e.message); } finally { setChecking(false); } };
  const calendar = useMemo(() => { const [year, value] = month.split('-').map(Number); const days = new Date(year, value, 0).getDate(); const offset = (new Date(year, value - 1, 1).getDay() + 6) % 7; return { offset, dates: Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`) }; }, [month]);
  const recordMap = new Map((data?.records || []).map((record: any) => [record.workDate, record])); const today = todayInVietnam(); const checkedToday = recordMap.has(today);
  return <div className="space-y-6 text-slate-900">
    <div className="flex flex-col gap-4 rounded-3xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-bold text-amber-400">CHẤM CÔNG ĐỐI TÁC</div><h1 className="mt-1 text-2xl font-bold">Lịch Chấm Công</h1><p className="mt-1 text-xs text-slate-400">Mỗi ngày chỉ cần bấm bắt đầu làm việc một lần. Chủ nhật được nghỉ cố định.</p></div><button disabled={checking || checkedToday} onClick={() => void checkIn()} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:bg-emerald-800 disabled:opacity-70">{checkedToday ? <CheckCircle2 className="h-5 w-5"/> : <LogIn className="h-5 w-5"/>}{checkedToday ? 'Đã bắt đầu hôm nay' : checking ? 'Đang ghi nhận...' : 'Bắt đầu làm việc'}</button></div>
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 font-bold"><CalendarCheck className="h-5 w-5 text-emerald-600"/>Lịch công tháng</h2><input type="month" value={month} onChange={(e)=>setMonth(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm"/></div>
      {loading ? <div className="py-16 text-center text-sm text-slate-500">Đang tải lịch...</div> : <><div className="grid grid-cols-7 border-b text-center text-[10px] font-bold uppercase text-slate-400">{['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật'].map(day=><div key={day} className="py-3">{day}</div>)}</div><div className="grid grid-cols-7">{Array.from({length:calendar.offset}).map((_,i)=><div key={`empty-${i}`} className="min-h-24 border-b border-r border-slate-100 bg-slate-50/50"/>)}{calendar.dates.map((date)=>{const record:any=recordMap.get(date);const sunday=new Date(`${date}T00:00:00`).getDay()===0;return <div key={date} className={`min-h-24 border-b border-r border-slate-100 p-2 ${sunday?'bg-amber-50/60':date===today?'bg-sky-50':''}`}><div className="text-xs font-bold text-slate-600">{Number(date.slice(-2))}</div>{sunday?<div className="mt-3 text-center text-[10px] font-bold text-amber-600">LỊCH OFF</div>:record?<div className="mt-2 rounded-lg bg-emerald-50 p-2 text-center text-[10px] font-bold text-emerald-700"><CheckCircle2 className="mx-auto mb-1 h-4 w-4"/>{new Date(record.checkIn).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</div>:date<today?<div className="mt-3 text-center text-[10px] text-slate-400">Chưa chấm</div>:null}</div>})}</div></>}
    </div>
  </div>;
}

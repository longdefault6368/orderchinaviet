'use client';

import { useState, useEffect } from 'react';
import { TerminalSquare, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

export interface AdminLogItem {
  action: string;
  staff: string;
  entity: string;
  time: string;
}

export default function AdminLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AdminLogItem[]>([]);

  useEffect(() => {
    apiFetch('/operations/audit-logs').then(async (response) => {
      if (!response.ok) return;
      const json = await response.json();
      setLogs(json.data.map((item: any) => ({ action: item.action, staff: item.user?.fullName || item.user?.email || 'Hệ thống', entity: `${item.entity}${item.entityId ? ` #${item.entityId}` : ''}`, time: new Date(item.createdAt).toLocaleString('vi-VN') })));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 text-slate-900  animate-pulse">
        <div className="bg-slate-200 h-28 rounded-2xl sm:rounded-3xl w-full" />
        <div className="bg-slate-200 h-64 rounded-2xl sm:rounded-3xl w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 text-slate-900  animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Audit Logs &amp; Nhật Ký Hệ Thống</h1>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">Ghi lại toàn bộ thao tác quét mã, thay đổi số dư ví cước và phân quyền nhân viên.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
        {logs.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <TerminalSquare className="w-6 h-6 stroke-1.5" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-800">Chưa có bản ghi nhật ký hệ thống nào</p>
              <p className="text-xs text-slate-400 mt-0.5">Nhật ký thao tác quét mã, nạp tiền ví và tạo lô hàng sẽ xuất hiện tự động tại đây.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Hành Động Action</th>
                  <th className="pb-3">Nhân Viên Thực Hiện</th>
                  <th className="pb-3">Đối Tượng Tương Tác</th>
                  <th className="pb-3">Thời Gian Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map((l, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-primary-600">{l.action}</td>
                    <td className="py-3.5 font-bold text-slate-900">{l.staff}</td>
                    <td className="py-3.5 font-mono text-slate-700">{l.entity}</td>
                    <td className="py-3.5 font-mono text-slate-500">{l.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

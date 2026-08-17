'use client';

import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';

function showFriendlyToast(value?: unknown) {
  const message = String(value ?? '').trim() || 'Hệ thống đã ghi nhận thao tác.';
  const normalized = message.toLocaleLowerCase('vi-VN');

  if (/không thể|có lỗi|lỗi|không đủ|vượt quá|không hợp lệ/.test(normalized)) {
    toast.error(message);
    return;
  }
  if (/thành công|đã gửi|đã lưu|đã cập nhật|đã hoàn/.test(normalized)) {
    toast.success(message);
    return;
  }
  if (/vui lòng|tối thiểu|chưa|cần /.test(normalized)) {
    toast.warning(message);
    return;
  }
  toast.info(message);
}

export function GlobalToastProvider() {
  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message?: unknown) => showFriendlyToast(message);
    return () => {
      window.alert = nativeAlert;
    };
  }, []);

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      expand
      duration={4200}
      toastOptions={{
        classNames: {
          toast: 'font-sans text-sm shadow-xl',
          title: 'font-semibold',
          description: 'text-slate-600',
        },
      }}
    />
  );
}

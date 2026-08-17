'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const STATIC_ROUTE_TITLES: Record<string, string> = {
  '': 'OrderChinaViet - Hệ Thống Đặt Hàng & Vận Chuyển Trung Việt Uy Tín',
  'rates': 'Bảng Giá Cước Vận Chuyển Hàng Trung Quốc | OrderChinaViet',
  'track': 'Tra Cứu Vận Đơn & Hành Trình Đơn Hàng | OrderChinaViet',
  'blog': 'Blog Kiến Thức & Xu Hướng Nhập Hàng Trung Quốc | OrderChinaViet',
  'announcements': 'Thông Báo & Lịch Hoạt Động Kho Bãi | OrderChinaViet',
  'services/order-china': 'Đặt Hàng Trung Quốc Sỉ & Lẻ Tận Gốc (1688 / Taobao / Tmall) | OrderChinaViet',
  'services/alipay': 'Nạp & Bán Tệ Alipay / WeChat Pay Uy Tín Tốc Độ | OrderChinaViet',
  'services/van-chuyen': 'Vận Chuyển Hàng Trung Việt Trọn Gói | OrderChinaViet',
  'services/1688': 'Dịch Vụ Đặt Hàng 1688 Giá Gốc Tận Xưởng | OrderChinaViet',
  'services/tmall': 'Dịch Vụ Mua Hàng Hiệu Tmall Chính Hãng | OrderChinaViet',
  'services/nhap-hang': 'Dịch Vụ Tìm Nguồn Hàng & Nhập Khẩu Sỉ | OrderChinaViet',
  'services/chinh-ngach': 'Vận Chuyển & Khai Báo Hải Quan Chính Ngạch | OrderChinaViet',
  'guides/dat-hang': 'Hướng Dẫn Đặt Hàng 1688 & Taobao Trọn Gói | OrderChinaViet',
  'guides/doi-tien': 'Hướng Dẫn Nạp & Đổi Tiền Alipay / WeChat Pay | OrderChinaViet',
  'guides/nap-tien': 'Hướng Dẫn Nạp Tiền Vào Ví OrderChinaViet | OrderChinaViet',
  'guides/app': 'Hướng Dẫn Cài Đặt & Sử Dụng App Mobile | OrderChinaViet',
  'guides/rut-tien': 'Hướng Dẫn Rút Tiền Về Tài Khoản Ngân Hàng | OrderChinaViet',
  'policies/bao-mat': 'Chính Sách Bảo Mật Thông Tin | OrderChinaViet',
  'policies/dieu-khoan': 'Điều Khoản Sử Dụng Dịch Vụ | OrderChinaViet',
  'policies/khieu-nai': 'Chính Sách Giải Quyết Khiếu Nại & Bồi Thường | OrderChinaViet',
  'login': 'Đăng Nhập Tài Khoản | OrderChinaViet',
  'register': 'Đăng Ký Tài Khoản Mới | OrderChinaViet',
  'dashboard': 'Bảng Điều Khiển Khách Hàng | OrderChinaViet',
  'orders': 'Quản Lý Đơn Hàng Mua Hộ | OrderChinaViet',
  'packages': 'Quản Lý Kiện Hàng Ký Gửi | OrderChinaViet',
  'finance': 'Quản Lý Ví Tiền & Nạp Rút | OrderChinaViet',
  'complaints': 'Khiếu Nại & Hỗ Trợ Đơn Hàng | OrderChinaViet',
  'profile': 'Hồ Sơ Tài Khoản & Địa Chỉ | OrderChinaViet',
  'admin': 'Trang Quản Trị Hệ Thống | OrderChinaViet Admin',
  'admin/orders': 'Quản Trị Đơn Hàng | OrderChinaViet Admin',
  'admin/packages': 'Quản Trị Kiện Hàng & Kho Bãi | OrderChinaViet Admin',
  'admin/rates': 'Quản Trị Bảng Giá & Tỷ Giá | OrderChinaViet Admin',
  'admin/customers': 'Quản Trị Khách Hàng | OrderChinaViet Admin',
  'admin/finance': 'Quản Trị Tài Chính & Nạp Rút | OrderChinaViet Admin',
  'admin/cms': 'Quản Trị Nội Dung CMS & Blog | OrderChinaViet Admin',
  'admin/system': 'Cấu Hình Hệ Thống | OrderChinaViet Admin',
  'affiliate': 'Chương Trình Đối Tác Giới Thiệu Affiliate | OrderChinaViet',
};

export function RouteTitleWatcher() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document === 'undefined' || !pathname) return;

    // Remove locale prefix: e.g. /vi/rates -> rates, /vi -> '', /zh/blog/slug -> blog/slug
    const segments = pathname.split('/').filter(Boolean);
    // segments[0] is locale (vi, zh, en, etc.)
    const pathWithoutLocale = segments.slice(1).join('/');

    if (STATIC_ROUTE_TITLES[pathWithoutLocale]) {
      document.title = STATIC_ROUTE_TITLES[pathWithoutLocale];
    } else if (pathWithoutLocale === '') {
      document.title = 'OrderChinaViet - Hệ Thống Đặt Hàng & Vận Chuyển Trung Việt Uy Tín';
    } else if (pathWithoutLocale.startsWith('blog/')) {
      const slug = pathWithoutLocale.replace('blog/', '');
      if (slug) {
        const formatted = slug
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        document.title = `${formatted} | Blog OrderChinaViet`;
      }
    }
  }, [pathname]);

  return null;
}

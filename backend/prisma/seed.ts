import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting OrderChinaViet Database Seeding...');

  // 1. Roles
  const roles = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full access' },
    { code: 'ADMIN', name: 'System Administrator', description: 'Operations management' },
    { code: 'CHINA_WAREHOUSE', name: 'China Warehouse Staff', description: 'Guangzhou scanning' },
    { code: 'VIETNAM_WAREHOUSE', name: 'Vietnam Warehouse Staff', description: 'HCM scanning' },
    { code: 'ACCOUNTANT', name: 'Finance Accountant', description: 'Transactions & Ledger' },
    { code: 'CUSTOMER', name: 'Customer', description: 'Client access' },
    { code: 'AFFILIATE', name: 'Affiliate Partner', description: 'Referral partner access' },
  ];

  const roleMap: Record<string, string> = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: r,
    });
    roleMap[r.code] = role.id;
  }

  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 8) throw new Error('SEED_PASSWORD with at least 8 characters is required');
  const defaultPasswordHash = await bcrypt.hash(seedPassword, 12);

  // Seed Admin & Users
  await prisma.user.upsert({
    where: { email: 'admin@orderchinaviet.com' },
    update: {},
    create: {
      email: 'admin@orderchinaviet.com',
      fullName: 'Quản Trị Viên Hệ Thống',
      phone: '0900000001',
      customerCode: 'OCV000001',
      balance: 10000000,
      roleCode: 'SUPER_ADMIN',
      roleId: roleMap['SUPER_ADMIN'],
      passwordHash: defaultPasswordHash,
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer1@orderchinaviet.com' },
    update: {},
    create: {
      email: 'customer1@orderchinaviet.com',
      fullName: 'Nguyễn Văn Chủ Hàng',
      phone: '0909123456',
      customerCode: 'OCV888888',
      balance: 2500000,
      roleCode: 'CUSTOMER',
      roleId: roleMap['CUSTOMER'],
      passwordHash: defaultPasswordHash,
    },
  });

  // 3. Seed Warehouses
  await prisma.warehouse.upsert({
    where: { code: 'W-GZ-01' },
    update: {},
    create: {
      code: 'W-GZ-01',
      name: 'Kho Quảng Châu (Guangzhou Receiving Hub)',
      type: 'CHINA',
      country: 'CN',
      province: 'Guangdong',
      city: 'Guangzhou',
      district: 'Baiyun',
      address: '广东省 广州市 白云区 Logistics Park No. 88',
      contactName: 'Li Wei',
      phone: '+8613800000001',
    },
  });

  await prisma.warehouse.upsert({
    where: { code: 'W-HCM-01' },
    update: {},
    create: {
      code: 'W-HCM-01',
      name: 'Kho TP.HCM (Ho Chi Minh Distribution Hub)',
      type: 'VIETNAM',
      country: 'VN',
      province: 'Ho Chi Minh',
      city: 'Ho Chi Minh',
      district: 'Tân Bình',
      address: '120 Trường Chinh, Phường 12, Quận Tân Bình, TP.HCM',
      contactName: 'Nguyễn Văn Kho',
      phone: '+84900000003',
    },
  });

  // 4. Seed Rates
  const rates = [
    { shippingMethod: 'ROAD', minWeight: 0.1, maxWeight: 10, pricePerKg: 22000, estimatedDays: '3-7 Ngày' },
    { shippingMethod: 'ROAD', minWeight: 10.1, maxWeight: 50, pricePerKg: 20000, estimatedDays: '3-7 Ngày' },
    { shippingMethod: 'ROAD', minWeight: 50.1, maxWeight: 1000, pricePerKg: 18000, estimatedDays: '3-7 Ngày' },
    { shippingMethod: 'AIR', minWeight: 0.1, maxWeight: 1000, pricePerKg: 45000, estimatedDays: '1-2 ngày' },
  ];

  for (const rate of rates) {
    const existing = await prisma.shippingRate.findFirst({ where: { shippingMethod: rate.shippingMethod, minWeight: rate.minWeight, maxWeight: rate.maxWeight } });
    if (existing) await prisma.shippingRate.update({ where: { id: existing.id }, data: rate });
    else await prisma.shippingRate.create({ data: rate });
  }

  // 5. Seed CMS Services
  const services = [
    {
      title: 'Đặt Hàng 1688',
      slug: 'dat-hang-1688',
      category: '1688',
      summary: 'Dịch vụ đặt hàng bán buôn từ xưởng sản xuất 1688.com giá tận gốc.',
      content: 'OrderChinaViet hỗ trợ đàm phán giá sỉ, mua hàng tận xưởng trên 1688.com với mức phí dịch vụ ưu đãi nhất thị trường.',
      iconName: 'ShoppingBag',
    },
    {
      title: 'Đặt Hàng Tmall',
      slug: 'dat-hang-tmall',
      category: 'TMALL',
      summary: 'Mua hàng chính hãng từ thương hiệu cao cấp trên Tmall.com.',
      content: 'Cam kết 100% hàng chính hãng, hỗ trợ săn mã giảm giá và đàm phán trực tiếp với đại lý Tmall.',
      iconName: 'Award',
    },
    {
      title: 'Nhập Hàng Trung Quốc',
      slug: 'nhap-hang-trung-quoc',
      category: 'NHAP_HANG',
      summary: 'Giải pháp nhập hàng trọn gói từ Trung Quốc về Việt Nam cho doanh nghiệp.',
      content: 'Nhập hàng số lượng lớn, tối ưu thuế suất, hỗ trợ tìm nguồn hàng uy tín và làm thủ tục thông quan.',
      iconName: 'Boxes',
    },
    {
      title: 'Vận Chuyển Trung - Việt',
      slug: 'van-chuyen-trung-viet',
      category: 'VAN_CHUYEN',
      summary: 'Vận chuyển chính ngạch đường bộ và đường bay từ Quảng Châu về Việt Nam.',
      content: 'Tốc độ nhanh chóng từ 3-7 Ngày đối với đường bộ và 24h-48h đối với đường bay. Bồi thường 100% hàng mất mát.',
      iconName: 'Truck',
    },
    {
      title: 'Xuất Nhập Khẩu Chính Ngạch',
      slug: 'xuat-nhap-khau-chinh-ngach',
      category: 'XNK',
      summary: 'Ủy thác xuất nhập khẩu chính ngạch đầy đủ hóa đơn VAT và C/O.',
      content: 'Đầy đủ chứng từ xuất nhập khẩu, hải quan điện tử, cấp giấy chứng nhận xuất xứ hàng hóa C/O Form E.',
      iconName: 'FileCheck',
    },
    {
      title: 'Thanh Toán Hộ Alipay',
      slug: 'thanh-toan-ho-alipay',
      category: 'ALIPAY',
      summary: 'Dịch vụ nạp tiền và thanh toán hộ Alipay / Wechat Pay tỷ giá tốt nhất.',
      content: 'Nạp tiền tài khoản Alipay, chuyển khoản ngân hàng Trung Quốc trong vòng 5 phút với tỷ giá cập nhật theo thời gian thực.',
      iconName: 'CreditCard',
    },
  ];

  for (const s of services) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }

  // 6. Seed CMS Guides
  const guides = [
    {
      title: 'Hướng Dẫn Đặt Hàng',
      slug: 'huong-dan-dat-hang',
      category: 'DAT_HANG',
      summary: 'Các bước tạo đơn hàng và ủy thác mua hàng trên hệ thống OrderChinaViet.',
      content: 'Bước 1: Tạo tài khoản. Bước 2: Dán link sản phẩm Taobao/1688. Bước 3: Nạp tiền cọc. Bước 4: Theo dõi vận đơn.',
    },
    {
      title: 'Hướng Dẫn Nạp Tiền',
      slug: 'huong-dan-nap-tien',
      category: 'NAP_TIEN',
      summary: 'Hướng dẫn chuyển khoản ngân hàng tự động cộng tiền vào ví dư.',
      content: 'Chuyển khoản theo cú pháp OCV [Mã Khách Hàng] đến tài khoản ngân hàng niêm yết. Hệ thống tự động cộng dư trong 60 giây.',
    },
    {
      title: 'Tải App ODH Logistics',
      slug: 'tai-app-odh-logistics',
      category: 'APP',
      summary: 'Tải ứng dụng quản lý vận đơn và kho bãi trên iOS và Android.',
      content: 'Tải ứng dụng di động OrderChinaViet Logistics để nhận thông báo đẩy khi hàng về kho Quảng Châu hoặc kho Việt Nam.',
    },
    {
      title: 'Hướng Dẫn Rút Tiền',
      slug: 'huong-dan-rut-tien',
      category: 'RUT_TIEN',
      summary: 'Quy trình gửi yêu cầu rút tiền ví dư về tài khoản ngân hàng cá nhân.',
      content: 'Tạo lệnh rút tiền trong mục Quản Lý Tài Chính. Kế toán sẽ phê duyệt và chuyển tiền về tài khoản ngân hàng của bạn.',
    },
  ];

  for (const g of guides) {
    await prisma.guide.upsert({
      where: { slug: g.slug },
      update: g,
      create: g,
    });
  }

  // 7. Seed CMS Policies
  const policies = [
    {
      title: 'Chính Sách Mua Hàng',
      slug: 'chinh-sach-mua-hang',
      category: 'MUA_HANG',
      summary: 'Quy định về thời gian phát hàng, phí dịch vụ mua hộ và bảo hộ tỷ giá.',
      content: 'OrderChinaViet cam kết mua đơn hàng trong vòng 8-24 giờ kể từ khi khách hàng thanh toán tiền cọc thành công.',
    },
    {
      title: 'Chính Sách Khiếu Nại',
      slug: 'chinh-sach-khieu-nai',
      category: 'KHIEU_NAI',
      summary: 'Quy trình tiếp nhận và giải quyết khiếu nại hàng lỗi, thiếu hoặc hư hỏng.',
      content: 'Thời gian tiếp nhận khiếu nại trong vòng 7 ngày kể từ khi nhận hàng. Bồi thường tối đa 100% giá trị kiện hàng bị đền bù.',
    },
    {
      title: 'Chính Sách Đóng Gỗ',
      slug: 'chinh-sach-dong-go',
      category: 'DONG_GO',
      summary: 'Dịch vụ đóng kiện gỗ bảo vệ hàng dễ vỡ, máy móc và thiết bị điện tử.',
      content: 'Khuyến nghị đóng gỗ cho hàng gia dụng, gốm sứ, màn hình TV. Phí đóng gỗ được tính theo thể tích m³ thực tế.',
    },
    {
      title: 'Chính Sách Kiểm Hàng',
      slug: 'chinh-sach-kiem-hang',
      category: 'KIEM_HANG',
      summary: 'Dịch vụ kiểm đếm số lượng, màu sắc, size sản phẩm tại kho Quảng Châu.',
      content: 'Nhân viên kho Quảng Châu mở thùng kiểm đếm mẫu mã, chủng loại và số lượng theo yêu cầu trước khi đóng công xuất kho.',
    },
  ];

  for (const p of policies) {
    await prisma.policy.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  // 8. Seed Announcements
  const announcements = [
    {
      title: 'Thông Báo Lịch Nghỉ Lễ & Khai Thông Cửa Khẩu Quảng Châu',
      slug: 'thong-bao-lich-nghi-le',
      content: 'Hệ thống kho Quảng Châu và kho TP.HCM hoạt động xuyên suốt đợt cao điểm. Thời gian thông quan đường bộ trung bình 3 ngày.',
      priority: 'HIGH',
    },
    {
      title: 'Cập Nhật Tỷ Giá Nạp Tiền & Cước Phí Đường Bay Mới',
      slug: 'cap-nhat-ty-gia-moi',
      content: 'Tỷ giá quy đổi Nhân Dân Tệ (CNY) áp dụng tuần này: 3,520 VND. Cước đường bay hỏa tốc giảm còn 45,000 VND/kg.',
      priority: 'NORMAL',
    },
  ];

  for (const a of announcements) {
    await prisma.announcement.upsert({
      where: { slug: a.slug },
      update: a,
      create: a,
    });
  }

  // 9. Seed Blog Posts (9 Complete Articles)
  const blogs = [
    {
      title: 'Kinh Nghiệm Tìm Nguồn Hàng Uy Tín Trên 1688 Cho Người Mới Bắt Đầu',
      slug: 'kinh-nghiem-tim-nguon-hang-1688',
      summary: 'Bí quyết chọn xưởng sản xuất có đầu trâu, tỷ lệ quay lại cao và đánh giá 5 sao, đàm phán giá tận xưởng và cách nhập hàng an toàn nhất.',
      content: 'Nội dung chi tiết hướng dẫn tìm xưởng 1688, kiểm tra chỉ số DSR, thương lượng giảm phí ship nội địa và đặt hàng qua OrderChinaViet.',
      coverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop',
      category: 'Nguồn Hàng Sỉ',
      author: 'OrderChinaViet Logistics Team',
      tags: JSON.stringify(['1688', 'Nguồn Hàng Sỉ', 'Kinh Nghiệm', 'Đặt Hàng Hộ']),
      featured: true,
    },
    {
      title: 'Quy Trình Vận Chuyển Hàng Trung Quốc Về Việt Nam Từ A - Z Chuẩn Logistics ERP',
      slug: 'huong-dan-quy-trinh-van-chuyen-trung-viet',
      summary: 'Khám phá từng công đoạn kiện hàng luân chuyển từ xưởng Trung Quốc đến kho Quảng Châu, qua cửa khẩu Hải quan và về tận tay khách hàng.',
      content: 'Chi tiết 5 bước vận chuyển từ Kho Quảng Châu, kiểm đếm barcode, thông quan chính ngạch đến giao hàng tận nơi.',
      coverImage: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1200&auto=format&fit=crop',
      category: 'Vận Chuyển Trung - Việt',
      author: 'OrderChinaViet Logistics Team',
      tags: JSON.stringify(['Vận Chuyển', 'Kho Quảng Châu', 'Logistics', 'Hành Trình']),
      featured: false,
    },
    {
      title: 'Cách Tính Cân Nặng Quy Đổi Thể Tích (DxRxC / 6000) & Bí Quyết Tối Ưu Cước Phí',
      slug: 'cach-tinh-can-nang-the-tich-khi-van-chuyen',
      summary: 'Hiểu rõ công thức tính cân nặng thể tích hàng hóa nhẹ cồng kềnh và các giải pháp đóng gói tối ưu giúp tiết kiệm 30% cước vận chuyển.',
      content: 'Công thức DxRxC/6000, so sánh cân nặng thực tế và thể tích, mẹo hút chân không cho hàng cồng kềnh.',
      coverImage: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?q=80&w=1200&auto=format&fit=crop',
      category: 'Bảng Giá Cước',
      author: 'OrderChinaViet Expert',
      tags: JSON.stringify(['Cước Phí', 'Cân Nặng Thể Tích', 'Mẹo Tiết Kiệm', 'Vận Chuyển']),
      featured: false,
    },
    {
      title: 'Quy Trình Thông Quan Chính Ngạch Hàng Hóa Trung Quốc & Xin C/O Form E',
      slug: 'quy-trinh-thong-quan-chinh-ngach',
      summary: 'Các giấy tờ và chứng từ hải quan cần thiết khi nhập khẩu hàng chính ngạch, quy trình cấp C/O Form E và xuất hóa đơn VAT hợp lệ.',
      content: 'Ưu điểm nhập khẩu chính ngạch xuất hóa đơn VAT, chứng nhận xuất xứ Form E hưởng thuế 0%.',
      coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop',
      category: 'Xuất Nhập Khẩu',
      author: 'OrderChinaViet Logistics Team',
      tags: JSON.stringify(['Chính Ngạch', 'Form E', 'Hóa Đơn VAT', 'Hải Quan']),
      featured: false,
    },
    {
      title: 'Top 5 Nhóm Mặt Hàng Trung Quốc Bán Chạy Đem Lại Lợi Nhuận Cao Năm 2026',
      slug: 'top-mat-hang-trung-quoc-ban-chay-nhat',
      summary: 'Gợi ý những ngách sản phẩm tiềm năng như gia dụng thông minh, phụ kiện công nghệ, đồ ăn vặt và thời trang Quảng Châu có sức hút lớn.',
      content: 'Phân tích thị trường đồ gia dụng thông minh, đồ ăn vặt TQ, thời trang Quảng Châu và phụ kiện điện tử.',
      coverImage: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Expert',
      tags: JSON.stringify(['Xu Hướng', 'Kinh Doanh Online', 'Sản Phẩm Hot', 'Nguồn Hàng']),
      featured: false,
    },
    {
      title: 'Giải Pháp Thanh Toán Hộ Ví Alipay & WeChat Pay Nhanh Chóng, An Toàn 100%',
      slug: 'giai-phap-thanh-toan-ho-alipay-wechat-pay',
      summary: 'Giải quyết triệt để nỗi lo nạp tiền bị khóa thẻ ngân hàng Trung Quốc với dịch vụ ủy thác thanh toán hộ Alipay tỷ giá cập nhật real-time.',
      content: 'Giải pháp nạp tiền Tệ an toàn, thanh toán hộ lệnh Alipay Pay for Me trong 5 phút.',
      coverImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200&auto=format&fit=crop',
      category: 'Thanh Toán Hộ',
      author: 'OrderChinaViet Finance Team',
      tags: JSON.stringify(['Alipay', 'WeChat Pay', 'Thanh Toán Hộ', 'Tỷ Giá']),
      featured: false,
    },
    {
      title: '7 Lưu Ý Quan Trọng Khi Tự Đặt Hàng Taobao & Tmall Tránh Mua Hàng Kém Chất Lượng',
      slug: 'bi-quyet-phong-tranh-rui-ro-khi-mua-hang-taobao',
      summary: 'Hướng dẫn xem ảnh thật từ người mua trước (买家秀), đọc chỉ số DSR xưởng sản xuất và quy trình khiếu nại hoàn tiền khi hàng lỗi.',
      content: 'Cách xem nhận xét có hình ảnh, đọc chỉ số DSR shop Taobao/Tmall và quy trình hoàn tiền.',
      coverImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=1200&auto=format&fit=crop',
      category: 'Kinh Nghiệm',
      author: 'OrderChinaViet Logistics Team',
      tags: JSON.stringify(['Taobao', 'Tmall', 'Kinh Nghiệm', 'Khiếu Nại']),
      featured: false,
    },
    {
      title: 'Tại Sao Nên Đóng Kiện Gỗ Cho Hàng Dễ Vỡ Khi Vận Chuyển Đường Dài?',
      slug: 'dich-vu-dong-go-bao-ve-hang-de-vo',
      summary: 'Tầm quan trọng của giải pháp đóng kiện gỗ, chèn mút xốp chống va đập giúp bảo vệ tối đa máy móc, màn hình và đồ sứ gốm.',
      content: 'Dịch vụ gia cố thùng gỗ tại kho Quảng Châu cho máy móc, màn hình TV, đồ gốm sứ.',
      coverImage: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?q=80&w=1200&auto=format&fit=crop',
      category: 'Đóng Gói Logistics',
      author: 'OrderChinaViet Warehouse Team',
      tags: JSON.stringify(['Đóng Gỗ', 'Bảo Vệ Hàng Hóa', 'An Toàn', 'Vận Chuyển']),
      featured: false,
    },
    {
      title: 'Chính Sách Bảo Hiểm Hàng Hóa 100% & Quyền Lợi Khách Hàng Tại OrderChinaViet',
      slug: 'chinh-sach-bao-hiem-hang-hoa-logistics',
      summary: 'Tìm hiểu chính sách đền bù 3 lần cước mặc định và gói bảo hiểm 100% giá trị kiện hàng giúp bạn an tâm tuyệt đối khi kinh doanh.',
      content: 'Chính sách bảo hiểm đền bù 100% giá trị đơn hàng khi gặp rủi ro vận chuyển.',
      coverImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=1200&auto=format&fit=crop',
      category: 'Chính Sách & Quyền Lợi',
      author: 'OrderChinaViet Support Team',
      tags: JSON.stringify(['Bảo Hiểm', 'Bồi Thường', 'Quyền Lợi', 'OrderChinaViet']),
      featured: false,
    },
    {
      title: 'Top Nguồn Hàng Thời Trang Streetwear & Local Brand Quảng Châu Giá Sỉ Cho Giới Trẻ',
      slug: 'nguon-hang-thoi-trang-local-brand-quang-chau',
      summary: 'Khám phá các xưởng may áo thun oversize, hoodie, jacket dù và quần túi hộp Quảng Châu chất lượng chuẩn shop bán chạy trên TikTok Shop.',
      content: 'Nguồn hàng thời trang Streetwear và Local Brand Quảng Châu giá sỉ tận xưởng.',
      coverImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Fashion Team',
      tags: JSON.stringify(['Thời Trang', 'Quảng Châu', 'Streetwear', 'Xu Hướng']),
      featured: false,
    },
    {
      title: 'Cơn Sốt Đồ Gia Dụng Nhà Bếp Thông Minh Nội Địa Trung: Vốn Nhỏ Lời Cao',
      slug: 'do-gia-dung-thong-minh-nha-bep-noi-dia-trung',
      summary: 'Điểm danh các thiết bị mini thông minh như nồi lẩu nướng 2in1, máy xay tỏi ớt cầm tay, hộp cơm hâm nóng tự động đang làm mưa làm gió.',
      content: 'Thiết bị nhà bếp thông minh nội địa Trung Quốc tiện ích, biên lợi nhuận cao.',
      coverImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Home Team',
      tags: JSON.stringify(['Gia Dụng Thông Minh', 'Nhà Bếp', 'Nội Địa Trung', 'Kinh Doanh']),
      featured: false,
    },
    {
      title: 'Kinh Doanh Phụ Kiện & Đồ Chơi Ô Tô Trung Quốc: Thị Trường Tỷ Đô Đang Bùng Nổ',
      slug: 'phu-kien-xe-hoi-do-choi-o-to-trung-quoc',
      summary: 'Nguồn hàng máy lọc không khí xe hơi, thảm lót sàn 6D, camera hành trình 4K và sạc không dây giá gốc từ các đại lý Chiết Giang.',
      content: 'Thị trường phụ kiện ô tô và đồ chơi xe hơi thông minh Trung Quốc.',
      coverImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Auto Team',
      tags: JSON.stringify(['Phụ Kiện Ô Tô', 'Đồ Chơi Xe Hơi', 'Công Nghệ', 'Xu Hướng']),
      featured: false,
    },
    {
      title: 'Đồ Chơi Giáo Dục & Xếp Hình STEM Trẻ Em: Ngách Bán Hàng Biên Lợi Nhuận 50%',
      slug: 'nguon-hang-do-choi-tre-em-thong-minh-stem',
      summary: 'Tại sao đồ chơi thông minh, lego mô hình, bảng vẽ LCD và đồ chơi phát triển trí tuệ Trung Quốc luôn đắt khách tại Việt Nam.',
      content: 'Đồ chơi giáo dục trẻ em, lego lắp ráp và bộ học cụ STEM Trừng Hải.',
      coverImage: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Toy Team',
      tags: JSON.stringify(['Đồ Chơi Trẻ Em', 'STEM', 'Lego', 'Kinh Doanh']),
      featured: false,
    },
    {
      title: 'Kinh Doanh Đồ Dùng Thú Cưng Pet Shop: Bánh Mì Nuôi Mèo, Quần Áo & Nhà Cây Cao Cấp',
      slug: 'phu-kien-thu-cung-pet-shop-trung-quoc',
      summary: 'Nhu cầu chăm sóc thú cưng tăng vọt tại các thành phố lớn. Bật mí nguồn hàng bát ăn tự động, chuồng đệm và đồ chơi chó mèo siêu rẻ.',
      content: 'Phụ kiện và đồ dùng thú cưng cho chó mèo từ các xưởng sản xuất lớn.',
      coverImage: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Pet Team',
      tags: JSON.stringify(['Pet Shop', 'Thú Cưng', 'Phụ Kiện Chó Mèo', 'Nguồn Hàng']),
      featured: false,
    },
    {
      title: 'Mỹ Phẩm Nội Địa Trung (C-Beauty): Cơn Lốc Trang Điểm Giới Trẻ Đang Săn Đón',
      slug: 'my-pham-noi-dia-trung-trang-diem-skincare',
      summary: 'Phân tích các dòng son kem lì, bảng phấn mắt 9 ô, cọ trang điểm và mặt nạ dưỡng ẩm nội địa có mẫu mã bao bì hoàng cung cực kỳ sang trọng.',
      content: 'Mỹ phẩm nội địa Trung Quốc phong cách C-Beauty được giới trẻ ưa chuộng.',
      coverImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Beauty Team',
      tags: JSON.stringify(['Mỹ Phẩm Nội Địa Trung', 'C-Beauty', 'Trang Điểm', 'Skincare']),
      featured: false,
    },
    {
      title: 'Xu Hướng Decor Nhà Cửa & Đồ Trang Trí Homestay Phong Cách Tối Giản Bắc Âu (Nordic)',
      slug: 'do-trang-tri-decor-nha-cua-noi-that-vintage',
      summary: 'Nguồn sỉ đèn ngủ mặt trăng, tranh treo tường canvas, thảm trải sàn lông cừu và lọ hoa gốm sứ nghệ thuật từ các làng nghề Triều Châu.',
      content: 'Đồ trang trí decor nhà cửa, quán cafe, homestay phong cách Bắc Âu.',
      coverImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Decor Team',
      tags: JSON.stringify(['Decor Nhà Cửa', 'Homestay', 'Nội Thất', 'Vintage']),
      featured: false,
    },
    {
      title: 'Đồ Cắm Trại & Dã Ngoại Outdoor (Glamping): Ngách Thể Thao Đang Phát Triển Thần Tốc',
      slug: 'thiet-bi-the-thao-outdoor-camping-cam-trai',
      summary: 'Lều tự bung, ghế xếp du lịch, bàn nhôm gấp gọn, đèn bão cổ điển và bếp ga mini dã ngoại xách tay từ thủ phủ Chiết Giang.',
      content: 'Thiết bị cắm trại dã ngoại và du lịch ngoài trời Glamping.',
      coverImage: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Outdoor Team',
      tags: JSON.stringify(['Cắm Trại', 'Outdoor', 'Glamping', 'Dã Ngoại']),
      featured: false,
    },
    {
      title: 'Đại Lý Sỉ Túi Xách & Ví Da Nữ Quảng Châu: Mẫu Mới Cập Nhật Hàng Ngày',
      slug: 'nguon-hang-tui-xach-vi-da-phu-kien-nu',
      summary: 'Chợ Bạch Mã và chợ Quế Hoa Cương Quảng Châu quy tụ hàng ngàn mẫu túi xách kẹp nách, balo du lịch và ví cầm tay sang xịn mịn.',
      content: 'Túi xách và ví da nữ Quảng Châu chất lượng, đa dạng mẫu mã.',
      coverImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Fashion Team',
      tags: JSON.stringify(['Túi Xách', 'Ví Da', 'Phụ Kiện Nữ', 'Quảng Châu']),
      featured: false,
    },
    {
      title: 'Gaming Gear & Phụ Kiện Góc Setup Bàn Làm Việc: Xu Hướng Hot Cho Gen Z',
      slug: 'phu-kien-cong-nghe-gaming-gear-setup-ban-hoc',
      summary: 'Bàn phím cơ núm xoay, chuột công thái học không dây, lót chuột RGB và đèn treo màn hình bảo vệ mắt nhập từ Thâm Quyến.',
      content: 'Phụ kiện góc setup bàn làm việc, gaming gear công nghệ cao Thâm Quyến.',
      coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
      category: 'Xu Hướng Thị Trường',
      author: 'OrderChinaViet Tech Team',
      tags: JSON.stringify(['Gaming Gear', 'Setup Bàn Học', 'Bàn Phím Cơ', 'Thâm Quyến']),
      featured: false,
    },
  ];

  for (const b of blogs) {
    await prisma.blogPost.upsert({
      where: { slug: b.slug },
      update: b,
      create: b,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

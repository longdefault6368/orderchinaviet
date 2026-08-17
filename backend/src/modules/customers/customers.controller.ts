import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ADMIN_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';

const prisma = new PrismaClient();
export const customerRouter = Router();
customerRouter.use(authenticate, authorize(...ADMIN_ROLES));

function safeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// GET all customers (supports search, role, status query params)
customerRouter.get('/', async (req, res, next) => {
  try {
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as string;

    const where: any = {};
    if (role && role !== 'ALL') where.roleCode = role;
    if (status && status !== 'ALL') where.status = status;

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
        { customerCode: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      include: {
        affiliateProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: customers.map((c: any) => ({
        ...safeUser(c),
        affiliateCode: c.affiliateProfile?.affiliateCode,
        customCommissionRate: c.affiliateProfile ? Math.round(c.affiliateProfile.commissionRate * 100) : undefined,
        promoBalanceVnd: 250000,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// GET customer by ID
customerRouter.get('/:id', async (req, res, next) => {
  try {
    const customer = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { parcels: true, transactions: true, affiliateProfile: true },
    });
    if (!customer) return res.status(404).json({ success: false, message: 'Khách hàng không tồn tại' });
    res.json({
      success: true,
      data: {
        ...safeUser(customer),
        affiliateCode: (customer as any).affiliateProfile?.affiliateCode,
        customCommissionRate: (customer as any).affiliateProfile ? Math.round((customer as any).affiliateProfile.commissionRate * 100) : undefined,
        promoBalanceVnd: 250000,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST Create new customer or affiliate partner
customerRouter.post('/', async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, balanceVnd, affiliateCode, customCommissionRate, promoBalanceVnd } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Email và mật khẩu tối thiểu 6 ký tự là bắt buộc' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email này đã tồn tại trên hệ thống' });
    }

    const customerCode = `OCV${Math.floor(100000 + Math.random() * 900000)}`;
    const roleCode = role || 'CUSTOMER';

    const newUser = await prisma.user.create({
      data: {
        customerCode,
        fullName: fullName || 'Khách Hàng Mới',
        email: normalizedEmail,
        phone: phone || '',
        passwordHash: await bcrypt.hash(password, 10),
        roleCode,
        balance: balanceVnd || 0,
      },
    });

    let affiliateProfile = null;
    if (roleCode === 'AFFILIATE' || req.body.isAffiliate) {
      const code = affiliateCode?.trim()?.toUpperCase() || `OCV_AFF_${Date.now().toString().slice(-8)}`;
      const rateNumber = customCommissionRate !== undefined && customCommissionRate !== null ? Number(customCommissionRate) : 30;
      affiliateProfile = await prisma.affiliateProfile.create({
        data: {
          userId: newUser.id,
          affiliateCode: code,
          commissionRate: rateNumber > 1 ? rateNumber / 100 : rateNumber,
          status: 'ACTIVE',
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        ...safeUser(newUser),
        affiliateCode: affiliateProfile?.affiliateCode,
        customCommissionRate: affiliateProfile ? Math.round(affiliateProfile.commissionRate * 100) : undefined,
        promoBalanceVnd: promoBalanceVnd !== undefined ? Number(promoBalanceVnd) : 250000,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH Update customer
customerRouter.patch('/:id', async (req, res, next) => {
  try {
    const { fullName, phone, role, status, address, avatarUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(role && { roleCode: role }),
        ...(status && { status }),
        ...(address && { address }),
        ...(avatarUrl && { avatarUrl }),
      },
    });
    res.json({ success: true, data: safeUser(updated) });
  } catch (error) {
    next(error);
  }
});

// POST Adjust customer balance
customerRouter.post('/:id/balance', async (req, res, next) => {
  try {
    const { amountVnd, note } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'Khách hàng không tồn tại' });

    if (!Number.isFinite(amountVnd) || amountVnd === 0) {
      return res.status(400).json({ success: false, message: 'Số tiền điều chỉnh không hợp lệ' });
    }
    const newBalance = user.balance + amountVnd;
    if (newBalance < 0) return res.status(400).json({ success: false, message: 'Số dư không được âm' });
    const [updated] = await prisma.$transaction([
      prisma.user.update({ where: { id: req.params.id }, data: { balance: newBalance } }),
      prisma.financialTransaction.create({ data: {
        transactionNo: `FT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: user.id,
        type: amountVnd > 0 ? 'DEPOSIT' : 'ADJUSTMENT',
        amountVnd,
        balanceAfter: newBalance,
        description: note || 'Điều chỉnh số dư bởi quản trị viên',
      }}),
    ]);

    res.json({ success: true, data: safeUser(updated) });
  } catch (error) {
    next(error);
  }
});

// POST Toggle customer / affiliate status (ACTIVE / DISABLED)
customerRouter.post('/:id/toggle-status', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    const newStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { status: newStatus },
    });

    // Also sync affiliateProfile status if user is affiliate
    if (user.roleCode === 'AFFILIATE') {
      await prisma.affiliateProfile.updateMany({
        where: { userId: user.id },
        data: { status: newStatus },
      });
    }

    res.json({
      success: true,
      message: newStatus === 'ACTIVE' ? `Đã mở khóa / kích hoạt lại tài khoản [${user.fullName}]` : `Đã vô hiệu hóa / khóa tài khoản [${user.fullName}]`,
      data: safeUser(updated),
    });
  } catch (error) {
    next(error);
  }
});

// POST Admin Reset / Change password for user / affiliate
customerRouter.post('/:id/reset-password', async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới tối thiểu 6 ký tự' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: `Đã đổi mật khẩu thành công cho [${user.fullName}]`,
      data: safeUser(updated),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE Customer
customerRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    next(error);
  }
});

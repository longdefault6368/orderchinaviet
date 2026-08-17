import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ADMIN_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';

const prisma = new PrismaClient();
export const ratesRouter = Router();

ratesRouter.get('/', async (_req, res, next) => {
  try {
    const data = await prisma.shippingRate.findMany({
      where: { isActive: true },
      orderBy: [{ shippingMethod: 'asc' }, { minWeight: 'asc' }],
    });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

ratesRouter.post('/', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const { shippingMethod, minWeight, maxWeight, pricePerKg, estimatedDays } = req.body;
    if (!['ROAD', 'AIR'].includes(shippingMethod) || [minWeight, maxWeight, pricePerKg].some((value) => !Number.isFinite(Number(value)))) {
      return res.status(400).json({ success: false, message: 'Dữ liệu bảng giá không hợp lệ' });
    }
    const data = await prisma.shippingRate.create({ data: { shippingMethod, minWeight: Number(minWeight), maxWeight: Number(maxWeight), pricePerKg: Number(pricePerKg), estimatedDays } });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

ratesRouter.patch('/:id', authenticate, authorize(...ADMIN_ROLES), async (req, res, next) => {
  try {
    const allowed = ['shippingMethod', 'minWeight', 'maxWeight', 'pricePerKg', 'estimatedDays', 'isActive'];
    const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const result = await prisma.shippingRate.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

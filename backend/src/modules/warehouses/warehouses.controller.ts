import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { OPERATIONS_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';

const prisma = new PrismaClient();
export const warehouseRouter = Router();
warehouseRouter.use(authenticate, authorize(...OPERATIONS_ROLES));

warehouseRouter.get('/', async (req, res, next) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      orderBy: { code: 'asc' },
    });
    res.json({ success: true, data: warehouses });
  } catch (error) {
    next(error);
  }
});

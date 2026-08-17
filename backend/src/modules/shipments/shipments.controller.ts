import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { OPERATIONS_ROLES, authenticate, authorize } from '../../middleware/auth.middleware';

const prisma = new PrismaClient();
export const shipmentRouter = Router();

const SHIPMENT_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['DISPATCHED'],
  DISPATCHED: ['IN_CUSTOMS'],
  IN_CUSTOMS: ['ARRIVED_DESTINATION'],
  ARRIVED_DESTINATION: ['COMPLETED'],
  COMPLETED: [],
};

shipmentRouter.get('/track/:code', async (req, res, next) => {
  try {
    const code = req.params.code.trim();
    const parcel = await prisma.parcel.findFirst({
      where: { OR: [{ parcelCode: code }, { trackingCodeChina: code }] },
      select: {
        parcelCode: true, trackingCodeChina: true, status: true, weightKg: true, chargeableWeight: true, createdAt: true, updatedAt: true,
        currentWarehouse: { select: { code: true, name: true, country: true, province: true, city: true } },
        shipment: { select: { shipmentCode: true, status: true, dispatchedAt: true, arrivedAt: true } },
        scanLogs: { select: { statusAfter: true, notes: true, createdAt: true, warehouse: { select: { code: true, name: true, country: true } } }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!parcel) return res.status(404).json({ success: false, message: 'Không tìm thấy vận đơn' });
    res.json({ success: true, data: parcel });
  } catch (error) { next(error); }
});

shipmentRouter.use(authenticate);

shipmentRouter.get('/', async (req, res, next) => {
  try {
    if (req.user!.roleCode !== 'CUSTOMER' && !OPERATIONS_ROLES.includes(req.user!.roleCode)) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem chuyến hàng' });
    const where = req.user!.roleCode === 'CUSTOMER' ? { parcels: { some: { customerId: req.user!.id } } } : {};
    const shipments = await prisma.shipment.findMany({
      where,
      include: { parcels: { where: req.user!.roleCode === 'CUSTOMER' ? { customerId: req.user!.id } : undefined } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: shipments });
  } catch (error) { next(error); }
});

shipmentRouter.post('/', authorize(...OPERATIONS_ROLES), async (req, res, next) => {
  try {
    const { originWarehouseCode, destWarehouseCode, parcelIds = [] } = req.body;
    if (!originWarehouseCode || !destWarehouseCode || originWarehouseCode === destWarehouseCode) return res.status(400).json({ success: false, message: 'Kho đi và kho đến không hợp lệ' });
    if (!Array.isArray(parcelIds) || parcelIds.length === 0) return res.status(400).json({ success: false, message: 'Chuyến hàng phải có ít nhất một kiện' });
    const [origin, destination, parcels] = await Promise.all([
      prisma.warehouse.findUnique({ where: { code: originWarehouseCode } }),
      prisma.warehouse.findUnique({ where: { code: destWarehouseCode } }),
      prisma.parcel.findMany({ where: { id: { in: parcelIds } } }),
    ]);
    if (!origin || !destination) return res.status(404).json({ success: false, message: 'Kho đi hoặc kho đến không tồn tại' });
    if (parcels.length !== new Set(parcelIds).size) return res.status(400).json({ success: false, message: 'Danh sách kiện có mã không tồn tại' });
    if (parcels.some((parcel) => parcel.status !== 'RECEIVED_CHINA' || parcel.shipmentId)) return res.status(409).json({ success: false, message: 'Chỉ kiện đã nhận tại kho Trung Quốc và chưa thuộc chuyến nào mới được xuất' });
    const shipment = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({ data: { shipmentCode: `SHP-${Date.now()}-${Math.floor(Math.random() * 1000)}`, originWarehouseCode, destWarehouseCode, status: 'DISPATCHED', dispatchedAt: new Date() } });
      await tx.parcel.updateMany({ where: { id: { in: parcelIds } }, data: { shipmentId: created.id, status: 'IN_TRANSIT' } });
      await tx.auditLog.create({ data: { userId: req.user!.id, action: 'CREATE_SHIPMENT', entity: 'Shipment', entityId: created.id, details: JSON.stringify({ parcelIds }) } });
      return tx.shipment.findUnique({ where: { id: created.id }, include: { parcels: true } });
    });
    res.status(201).json({ success: true, data: shipment });
  } catch (error) { next(error); }
});

shipmentRouter.patch('/:id/status', authorize(...OPERATIONS_ROLES), async (req, res, next) => {
  try {
    const shipment = await prisma.shipment.findUnique({ where: { id: req.params.id } });
    if (!shipment) return res.status(404).json({ success: false, message: 'Chuyến hàng không tồn tại' });
    const { status } = req.body;
    if (!SHIPMENT_TRANSITIONS[shipment.status]?.includes(status)) return res.status(409).json({ success: false, message: `Không thể chuyển chuyến từ ${shipment.status} sang ${status}` });
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.shipment.update({ where: { id: shipment.id }, data: { status, ...(status === 'ARRIVED_DESTINATION' || status === 'COMPLETED' ? { arrivedAt: new Date() } : {}) } });
      if (status === 'ARRIVED_DESTINATION') await tx.parcel.updateMany({ where: { shipmentId: shipment.id }, data: { status: 'RECEIVED_VIETNAM' } });
      await tx.auditLog.create({ data: { userId: req.user!.id, action: 'UPDATE_SHIPMENT_STATUS', entity: 'Shipment', entityId: shipment.id, details: JSON.stringify({ from: shipment.status, to: status }) } });
      return result;
    });
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export type AuthUser = { id: string; email: string; roleCode: string; fullName?: string; phone?: string };

declare global {
  namespace Express { interface Request { user?: AuthUser } }
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required');
  return secret;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  try {
    const payload = jwt.verify(header.slice(7), jwtSecret()) as jwt.JwtPayload;
    if (!payload.sub || !payload.email || !payload.roleCode) throw new Error('Invalid token payload');
    req.user = {
      id: payload.sub,
      email: payload.email,
      roleCode: payload.roleCode,
      fullName: payload.fullName || payload.name,
      phone: payload.phone,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    if (!roles.includes(req.user.roleCode)) return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    next();
  };
}

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];
export const OPERATIONS_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CHINA_WAREHOUSE', 'VIETNAM_WAREHOUSE'];
export const FINANCE_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'];

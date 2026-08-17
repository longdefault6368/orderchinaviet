"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting OrderChinaViet Database Seeding...');
    // 1. Roles & Permissions
    const roleCodes = [
        { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Full platform access' },
        { code: 'ADMIN', name: 'System Administrator', description: 'Operations & user management' },
        { code: 'CHINA_WAREHOUSE', name: 'China Warehouse Staff', description: 'Parcel receiving, scanning & weight entry' },
        { code: 'VIETNAM_WAREHOUSE', name: 'Vietnam Warehouse Staff', description: 'Container arrival, scanning & pickup' },
        { code: 'ACCOUNTANT', name: 'Finance Accountant', description: 'Transactions, payments & billing' },
        { code: 'CUSTOMER_SUPPORT', name: 'Customer Support Agent', description: 'Customer tickets & parcel tracking' },
        { code: 'CUSTOMER', name: 'Customer', description: 'Client access for tracking & shipments' },
    ];
    for (const r of roleCodes) {
        await prisma.role.upsert({
            where: { code: r.code },
            update: { name: r.name, description: r.description },
            create: r,
        });
    }
    // 2. Default Hashed Password for Seed Users: "password123"
    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    // Seed Staff Users
    const staffUsers = [
        {
            email: 'admin@orderchinaviet.com',
            fullName: 'Super Admin',
            phone: '+84900000001',
            roleCode: 'SUPER_ADMIN',
        },
        {
            email: 'staff.admin@orderchinaviet.com',
            fullName: 'Tran Van Admin',
            phone: '+84900000002',
            roleCode: 'ADMIN',
        },
        {
            email: 'gz.warehouse@orderchinaviet.com',
            fullName: 'Guangzhou Wh Lead (Li Wei)',
            phone: '+8613800000001',
            roleCode: 'CHINA_WAREHOUSE',
        },
        {
            email: 'hcm.warehouse@orderchinaviet.com',
            fullName: 'Nguyen Van Kho (HCM Wh)',
            phone: '+84900000003',
            roleCode: 'VIETNAM_WAREHOUSE',
        },
        {
            email: 'accounting@orderchinaviet.com',
            fullName: 'Le Thi Ke Toan',
            phone: '+84900000004',
            roleCode: 'ACCOUNTANT',
        },
        {
            email: 'support@orderchinaviet.com',
            fullName: 'Pham Support',
            phone: '+84900000005',
            roleCode: 'CUSTOMER_SUPPORT',
        },
    ];
    for (const staff of staffUsers) {
        await prisma.user.upsert({
            where: { email: staff.email },
            update: { fullName: staff.fullName, roleCode: staff.roleCode, phone: staff.phone },
            create: {
                email: staff.email,
                fullName: staff.fullName,
                phone: staff.phone,
                roleCode: staff.roleCode,
                passwordHash: defaultPasswordHash,
                preferredLanguage: 'vi',
            },
        });
    }
    // 3. Seed Warehouses
    const chinaWh = await prisma.warehouse.upsert({
        where: { code: 'W-GZ-01' },
        update: {},
        create: {
            code: 'W-GZ-01',
            name: 'Guangzhou Central Receiving Hub',
            type: 'CHINA',
            country: 'CN',
            province: 'Guangdong',
            city: 'Guangzhou',
            district: 'Baiyun',
            address: 'No. 88 Logistics Park, Baiyun District, Guangzhou',
            contactName: 'Li Wei',
            phone: '+86 138 0000 0001',
        },
    });
    const vnWh = await prisma.warehouse.upsert({
        where: { code: 'W-HCM-01' },
        update: {},
        create: {
            code: 'W-HCM-01',
            name: 'Ho Chi Minh Distribution Hub',
            type: 'VIETNAM',
            country: 'VN',
            province: 'Ho Chi Minh',
            city: 'Ho Chi Minh',
            district: 'Tan Bình',
            address: '120 Truong Chinh, Ward 12, Tan Binh District, HCMC',
            contactName: 'Nguyen Van Kho',
            phone: '+84 900 000 003',
        },
    });
    // 4. Seed Customers
    const customerList = [
        {
            code: 'OCV636868',
            name: 'Khách Hàng Long Default',
            company: 'Long Default Import-Export',
            phone: '0908636868',
            email: 'longdefault6368@gmail.com',
            balance: 1000000,
        },
        {
            code: 'OCV000001',
            name: 'Nguyen Van An (Minh Quan Trading)',
            company: 'Minh Quan Trading Co.',
            phone: '0912345678',
            email: 'customer1@orderchinaviet.com',
            balance: 15500000,
        },
        {
            code: 'OCV000002',
            name: 'Tran Thi Bich (Bich Shop Fashion)',
            company: 'Bich Fashion Studio',
            phone: '0923456789',
            email: 'customer2@orderchinaviet.com',
            balance: 8200000,
        },
        {
            code: 'OCV000003',
            name: 'Pham Quoc Cuong (TechImport VN)',
            company: 'TechImport Vietnam JSC',
            phone: '0934567890',
            email: 'customer3@orderchinaviet.com',
            balance: 32000000,
        },
    ];
    for (const c of customerList) {
        const user = await prisma.user.upsert({
            where: { email: c.email },
            update: { fullName: c.name },
            create: {
                email: c.email,
                fullName: c.name,
                phone: c.phone,
                roleCode: 'CUSTOMER',
                passwordHash: defaultPasswordHash,
                preferredLanguage: 'vi',
            },
        });
        await prisma.customer.upsert({
            where: { customerCode: c.code },
            update: { currentBalance: c.balance },
            create: {
                customerCode: c.code,
                userId: user.id,
                fullName: c.name,
                companyName: c.company,
                phone: c.phone,
                email: c.email,
                currentBalance: c.balance,
                creditLimit: 50000000,
                address: '123 Nguyen Hue, District 1, HCMC',
            },
        });
    }
    // 5. Seed Shipping Methods & Rates
    const roadMethod = await prisma.shippingMethod.upsert({
        where: { code: 'ROAD_STD' },
        update: {},
        create: {
            code: 'ROAD_STD',
            name: 'China → Vietnam Standard Road Freight',
            estimatedDays: '3 - 5 Days',
            minWeight: 1.0,
            pricePerKg: 35000,
            volumetricDivisor: 6000,
        },
    });
    const airMethod = await prisma.shippingMethod.upsert({
        where: { code: 'AIR_EXP' },
        update: {},
        create: {
            code: 'AIR_EXP',
            name: 'China → Vietnam Express Air Freight',
            estimatedDays: '1 - 2 Days',
            minWeight: 0.5,
            pricePerKg: 85000,
            volumetricDivisor: 5000,
        },
    });
    // Tiers for Road
    await prisma.shippingRate.createMany({
        data: [
            { shippingMethodId: roadMethod.id, minWeight: 0, maxWeight: 10, pricePerKg: 45000 },
            { shippingMethodId: roadMethod.id, minWeight: 10.01, maxWeight: 50, pricePerKg: 40000 },
            { shippingMethodId: roadMethod.id, minWeight: 50.01, maxWeight: 500, pricePerKg: 35000 },
        ],
    });
    // 6. Seed Sample Packages & Transactions
    const customer1 = await prisma.customer.findUnique({ where: { customerCode: 'OCV000001' } });
    if (customer1) {
        const pkg1 = await prisma.package.upsert({
            where: { packageCode: 'PKG-2026-000001' },
            update: {},
            create: {
                packageCode: 'PKG-2026-000001',
                customerId: customer1.id,
                warehouseId: chinaWh.id,
                domesticTrackingNumber: 'SF13498192348',
                shippingCarrier: 'SF Express China',
                productName: 'Electronic Components & Smart Watch Case',
                quantity: 50,
                actualWeight: 12.5,
                volumetricWeight: 10.2,
                chargeableWeight: 12.5,
                length: 40,
                width: 30,
                height: 25,
                declaredValue: 3500000,
                warehouseShelf: 'A-12-04',
                receivedAt: new Date('2026-08-08T10:00:00Z'),
                status: 'RECEIVED_CHINA_WAREHOUSE',
                notes: 'Carton intact, fragile sticker attached',
            },
        });
        const adminUser = await prisma.user.findUnique({ where: { email: 'admin@orderchinaviet.com' } });
        if (adminUser) {
            await prisma.transaction.upsert({
                where: { transactionCode: 'TRX-2026-000001' },
                update: {},
                create: {
                    transactionCode: 'TRX-2026-000001',
                    customerId: customer1.id,
                    type: 'DEPOSIT',
                    amount: 20000000,
                    balanceBefore: 0,
                    balanceAfter: 20000000,
                    description: 'Top-up via Bank Transfer (Techcombank #981273918)',
                    reference: 'BANK-REF-981273918',
                    createdById: adminUser.id,
                },
            });
        }
    }
    console.log('✅ OrderChinaViet Seed Completed Successfully!');
    console.log('----------------------------------------------------');
    console.log('🔐 Default Test Accounts (Password for all: password123):');
    console.log('   - Super Admin:       admin@orderchinaviet.com');
    console.log('   - China Wh Staff:    gz.warehouse@orderchinaviet.com');
    console.log('   - Vietnam Wh Staff:  hcm.warehouse@orderchinaviet.com');
    console.log('   - Accountant:        accounting@orderchinaviet.com');
    console.log('   - Customer:          customer1@orderchinaviet.com');
    console.log('----------------------------------------------------');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});

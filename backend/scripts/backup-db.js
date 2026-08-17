const { PrismaClient } = require('@prisma/client');
const { mkdirSync, readdirSync, statSync, unlinkSync } = require('node:fs');
const { resolve, join } = require('node:path');

const prisma = new PrismaClient();
const backupDir = resolve(__dirname, '..', 'backups');
mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = join(backupDir, `orderchinaviet-${stamp}.db`);
const escapedTarget = target.replaceAll("'", "''");

async function main() {
  await prisma.$executeRawUnsafe(`VACUUM INTO '${escapedTarget}'`);
  const backups = readdirSync(backupDir).filter((name) => name.endsWith('.db')).map((name) => ({ name, time: statSync(join(backupDir, name)).mtimeMs })).sort((a, b) => b.time - a.time);
  for (const old of backups.slice(14)) unlinkSync(join(backupDir, old.name));
  console.log(`Database backup created: ${target}`);
}

main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exit(1); });

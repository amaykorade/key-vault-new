import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const db = globalThis.__prisma || new PrismaClient({
  log: ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = db;
}

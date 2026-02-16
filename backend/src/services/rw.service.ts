import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { AppError } from '../utils/AppError';

export async function findAll() {
  return prisma.rw.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(nomorRw: string, userId: string) {
  const existing = await prisma.rw.findUnique({ where: { nomorRw } });
  if (existing) {
    throw new AppError('Nomor RW already registered', 409);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const rw = await tx.rw.create({
        data: { nomorRw },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          tableName: 'rw',
          recordId: rw.id,
        },
      });

      return rw;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('Nomor RW already registered', 409);
    }
    throw error;
  }
}

export async function update(id: string, nomorRw: string | undefined, userId: string) {
  const existing = await prisma.rw.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new AppError('RW not found', 404);
  }

  if (nomorRw && nomorRw !== existing.nomorRw) {
    const duplicate = await prisma.rw.findUnique({ where: { nomorRw } });
    if (duplicate) {
      throw new AppError('Nomor RW already registered', 409);
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const rw = await tx.rw.update({
        where: { id },
        data: {
          ...(nomorRw !== undefined ? { nomorRw } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          tableName: 'rw',
          recordId: rw.id,
        },
      });

      return rw;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('Nomor RW already registered', 409);
    }
    throw error;
  }
}

export async function remove(id: string, userId: string) {
  const existing = await prisma.rw.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new AppError('RW not found', 404);
  }

  const activeRtCount = await prisma.rt.count({
    where: { rwId: id, deletedAt: null },
  });
  if (activeRtCount > 0) {
    throw new AppError('Cannot delete RW: active RT still references it', 409);
  }

  return prisma.$transaction(async (tx) => {
    const rw = await tx.rw.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        tableName: 'rw',
        recordId: rw.id,
      },
    });

    return rw;
  });
}

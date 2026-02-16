import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';
import { AppError } from '../utils/AppError';

export async function findAll() {
  return prisma.rt.findMany({
    where: { deletedAt: null },
    include: { rw: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(nomorRt: string, rwId: string, userId: string) {
  const rw = await prisma.rw.findUnique({ where: { id: rwId } });
  if (!rw || rw.deletedAt) {
    throw new AppError('RW not found', 404);
  }

  const existing = await prisma.rt.findUnique({
    where: { nomorRt_rwId: { nomorRt, rwId } },
  });
  if (existing) {
    throw new AppError('RT with this nomor already exists in the specified RW', 409);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const rt = await tx.rt.create({
        data: { nomorRt, rwId },
        include: { rw: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          tableName: 'rt',
          recordId: rt.id,
        },
      });

      return rt;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('RT with this nomor already exists in the specified RW', 409);
    }
    throw error;
  }
}

export async function update(
  id: string,
  nomorRt: string | undefined,
  rwId: string | undefined,
  userId: string,
) {
  const existing = await prisma.rt.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new AppError('RT not found', 404);
  }

  if (rwId && rwId !== existing.rwId) {
    const rw = await prisma.rw.findUnique({ where: { id: rwId } });
    if (!rw || rw.deletedAt) {
      throw new AppError('RW not found', 404);
    }
  }

  const effectiveNomorRt = nomorRt ?? existing.nomorRt;
  const effectiveRwId = rwId ?? existing.rwId;

  if (effectiveNomorRt !== existing.nomorRt || effectiveRwId !== existing.rwId) {
    const duplicate = await prisma.rt.findUnique({
      where: { nomorRt_rwId: { nomorRt: effectiveNomorRt, rwId: effectiveRwId } },
    });
    if (duplicate && duplicate.id !== id) {
      throw new AppError('RT with this nomor already exists in the specified RW', 409);
    }
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const rt = await tx.rt.update({
        where: { id },
        data: {
          ...(nomorRt !== undefined ? { nomorRt } : {}),
          ...(rwId !== undefined ? { rwId } : {}),
        },
        include: { rw: true },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE',
          tableName: 'rt',
          recordId: rt.id,
        },
      });

      return rt;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('RT with this nomor already exists in the specified RW', 409);
    }
    throw error;
  }
}

export async function remove(id: string, userId: string) {
  const existing = await prisma.rt.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new AppError('RT not found', 404);
  }

  const activeKkCount = await prisma.kartuKeluarga.count({
    where: { rtId: id, deletedAt: null },
  });
  if (activeKkCount > 0) {
    throw new AppError('Cannot delete RT: active Kartu Keluarga still references it', 409);
  }

  return prisma.$transaction(async (tx) => {
    const rt = await tx.rt.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { rw: true },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        tableName: 'rt',
        recordId: rt.id,
      },
    });

    return rt;
  });
}

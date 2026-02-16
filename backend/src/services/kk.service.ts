import { Role } from '@prisma/client';
import prisma from '../prisma/client';
import { AppError } from '../utils/AppError';

const DIGIT_16 = /^\d{16}$/;

interface CreateKKInput {
  noKk: string;
  alamat: string;
  rt: string;
  rw: string;
}

interface UpdateKKInput {
  noKk?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
}

function validateNoKk(noKk: string): void {
  if (!DIGIT_16.test(noKk)) {
    throw new AppError('No KK must be exactly 16 digits', 400);
  }
}

export async function findAll() {
  return prisma.kartuKeluarga.findMany({
    include: { penduduk: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(data: CreateKKInput, userId: string, userRole: Role) {
  if (userRole !== Role.ADMIN) {
    throw new AppError('Only ADMIN can create Kartu Keluarga', 403);
  }

  validateNoKk(data.noKk);

  const existing = await prisma.kartuKeluarga.findUnique({ where: { noKk: data.noKk } });
  if (existing) {
    throw new AppError('No KK already registered', 409);
  }

  return prisma.$transaction(async (tx) => {
    const kk = await tx.kartuKeluarga.create({
      data,
      include: { penduduk: true },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        tableName: 'kartu_keluarga',
        recordId: kk.id,
      },
    });

    return kk;
  });
}

export async function update(id: string, data: UpdateKKInput, userId: string, userRole: Role) {
  if (userRole !== Role.ADMIN) {
    throw new AppError('Only ADMIN can update Kartu Keluarga', 403);
  }

  if (data.noKk) {
    validateNoKk(data.noKk);
  }

  const existing = await prisma.kartuKeluarga.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Kartu Keluarga not found', 404);
  }

  if (data.noKk && data.noKk !== existing.noKk) {
    const duplicate = await prisma.kartuKeluarga.findUnique({ where: { noKk: data.noKk } });
    if (duplicate) {
      throw new AppError('No KK already registered', 409);
    }
  }

  return prisma.$transaction(async (tx) => {
    const kk = await tx.kartuKeluarga.update({
      where: { id },
      data,
      include: { penduduk: true },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        tableName: 'kartu_keluarga',
        recordId: kk.id,
      },
    });

    return kk;
  });
}

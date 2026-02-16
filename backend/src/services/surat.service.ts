import { JenisSurat, Role, StatusSurat } from '@prisma/client';
import prisma from '../prisma/client';
import { AppError } from '../utils/AppError';

const SURAT_INCLUDE = {
  penduduk: true,
  createdBy: { select: { id: true, name: true, email: true, role: true } },
} as const;

interface CreateSuratInput {
  jenis: JenisSurat;
  pendudukId: string;
}

export async function findAll() {
  return prisma.surat.findMany({
    include: SURAT_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

export async function create(data: CreateSuratInput, userId: string) {
  const penduduk = await prisma.penduduk.findUnique({ where: { id: data.pendudukId } });
  if (!penduduk) {
    throw new AppError('Penduduk not found', 404);
  }

  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const suffix = `/SIDESA/${month}/${year}`;

    const lastSurat = await tx.surat.findFirst({
      where: { nomorSurat: { endsWith: suffix } },
      orderBy: { nomorSurat: 'desc' },
    });

    let nextNumber = 1;
    if (lastSurat) {
      const parsed = parseInt(lastSurat.nomorSurat.split('/')[0], 10);
      nextNumber = isNaN(parsed) ? 1 : parsed + 1;
    }

    const nomorSurat = `${String(nextNumber).padStart(3, '0')}${suffix}`;

    const surat = await tx.surat.create({
      data: {
        nomorSurat,
        jenis: data.jenis,
        pendudukId: data.pendudukId,
        createdById: userId,
      },
      include: SURAT_INCLUDE,
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        tableName: 'surat',
        recordId: surat.id,
      },
    });

    return surat;
  });
}

export async function approve(id: string, userId: string, userRole: Role) {
  if (userRole === Role.RT) {
    throw new AppError('RT cannot approve surat', 403);
  }
  if (userRole !== Role.ADMIN && userRole !== Role.KEPALA_DESA) {
    throw new AppError('Only ADMIN or KEPALA_DESA can approve surat', 403);
  }

  const surat = await prisma.surat.findUnique({ where: { id } });
  if (!surat) {
    throw new AppError('Surat not found', 404);
  }

  if (surat.status !== StatusSurat.PENDING) {
    throw new AppError('Only pending surat can be approved', 400);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.surat.update({
      where: { id },
      data: { status: StatusSurat.APPROVED },
      include: SURAT_INCLUDE,
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'APPROVE',
        tableName: 'surat',
        recordId: updated.id,
      },
    });

    return updated;
  });
}

export async function reject(id: string, userId: string, userRole: Role) {
  if (userRole !== Role.ADMIN && userRole !== Role.KEPALA_DESA) {
    throw new AppError('Only ADMIN or KEPALA_DESA can reject surat', 403);
  }

  const surat = await prisma.surat.findUnique({ where: { id } });
  if (!surat) {
    throw new AppError('Surat not found', 404);
  }

  if (surat.status !== StatusSurat.PENDING) {
    throw new AppError('Only pending surat can be rejected', 400);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.surat.update({
      where: { id },
      data: { status: StatusSurat.REJECTED },
      include: SURAT_INCLUDE,
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'REJECT',
        tableName: 'surat',
        recordId: updated.id,
      },
    });

    return updated;
  });
}

import { JenisKelamin, Role, StatusPenduduk } from '@prisma/client';
import prisma from '../prisma/client';
import { AppError } from '../utils/AppError';

const DIGIT_16 = /^\d{16}$/;

interface CreatePendudukInput {
  nik: string;
  nama: string;
  tanggalLahir: string;
  jenisKelamin: JenisKelamin;
  pekerjaan: string;
  kkId: string;
}

interface UpdatePendudukInput {
  nik?: string;
  nama?: string;
  tanggalLahir?: string;
  jenisKelamin?: JenisKelamin;
  pekerjaan?: string;
  status?: StatusPenduduk;
  kkId?: string;
}

function validateNik(nik: string): void {
  if (!DIGIT_16.test(nik)) {
    throw new AppError('NIK must be exactly 16 digits', 400);
  }
}

export async function findAll() {
  return prisma.penduduk.findMany({
    include: { kartuKeluarga: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findById(id: string) {
  const penduduk = await prisma.penduduk.findUnique({
    where: { id },
    include: { kartuKeluarga: true, surat: true },
  });

  if (!penduduk) {
    throw new AppError('Penduduk not found', 404);
  }

  return penduduk;
}

export async function create(data: CreatePendudukInput, userId: string) {
  validateNik(data.nik);

  const existing = await prisma.penduduk.findUnique({ where: { nik: data.nik } });
  if (existing) {
    throw new AppError('NIK already registered', 409);
  }

  const kk = await prisma.kartuKeluarga.findUnique({ where: { id: data.kkId } });
  if (!kk) {
    throw new AppError('Kartu Keluarga not found', 404);
  }

  return prisma.$transaction(async (tx) => {
    const penduduk = await tx.penduduk.create({
      data: {
        nik: data.nik,
        nama: data.nama,
        tanggalLahir: new Date(data.tanggalLahir),
        jenisKelamin: data.jenisKelamin,
        pekerjaan: data.pekerjaan,
        kkId: data.kkId,
      },
      include: { kartuKeluarga: true },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE',
        tableName: 'penduduk',
        recordId: penduduk.id,
      },
    });

    return penduduk;
  });
}

export async function update(id: string, data: UpdatePendudukInput, userId: string) {
  if (data.nik) {
    validateNik(data.nik);
  }

  const existing = await prisma.penduduk.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Penduduk not found', 404);
  }

  if (data.nik && data.nik !== existing.nik) {
    const duplicate = await prisma.penduduk.findUnique({ where: { nik: data.nik } });
    if (duplicate) {
      throw new AppError('NIK already registered', 409);
    }
  }

  if (data.kkId) {
    const kk = await prisma.kartuKeluarga.findUnique({ where: { id: data.kkId } });
    if (!kk) {
      throw new AppError('Kartu Keluarga not found', 404);
    }
  }

  return prisma.$transaction(async (tx) => {
    const penduduk = await tx.penduduk.update({
      where: { id },
      data: {
        nik: data.nik,
        nama: data.nama,
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : undefined,
        jenisKelamin: data.jenisKelamin,
        pekerjaan: data.pekerjaan,
        status: data.status,
        kkId: data.kkId,
      },
      include: { kartuKeluarga: true },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        tableName: 'penduduk',
        recordId: penduduk.id,
      },
    });

    return penduduk;
  });
}

export async function remove(id: string, userId: string, userRole: Role) {
  if (userRole !== Role.ADMIN) {
    throw new AppError('Only ADMIN can delete penduduk', 403);
  }

  const existing = await prisma.penduduk.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Penduduk not found', 404);
  }

  return prisma.$transaction(async (tx) => {
    await tx.penduduk.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'DELETE',
        tableName: 'penduduk',
        recordId: id,
      },
    });
  });
}

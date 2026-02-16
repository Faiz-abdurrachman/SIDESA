import { HubunganKeluarga, JenisKelamin, Role, StatusPenduduk } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import prisma from '../prisma/client';
import { AppError } from '../utils/AppError';

const DIGIT_16 = /^\d{16}$/;

type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

interface CreatePendudukInput {
  nik: string;
  nama: string;
  tanggalLahir: string;
  jenisKelamin: JenisKelamin;
  pekerjaan: string;
  hubunganKeluarga: HubunganKeluarga;
  kkId: string;
}

interface UpdatePendudukInput {
  nik?: string;
  nama?: string;
  tanggalLahir?: string;
  jenisKelamin?: JenisKelamin;
  pekerjaan?: string;
  status?: StatusPenduduk;
  hubunganKeluarga?: HubunganKeluarga;
  kkId?: string;
}

function validateNik(nik: string): void {
  if (!DIGIT_16.test(nik)) {
    throw new AppError('NIK must be exactly 16 digits', 400);
  }
}

/**
 * Enforces the StatusPenduduk state machine.
 *
 * Allowed transitions:
 *   AKTIF     → PINDAH
 *   AKTIF     → MENINGGAL
 *   PINDAH    → AKTIF
 *   PINDAH    → MENINGGAL
 *
 * Terminal state:
 *   MENINGGAL → (any) is FORBIDDEN
 *
 * No-op (same status) is silently allowed.
 */
const ALLOWED_TRANSITIONS: Record<StatusPenduduk, StatusPenduduk[]> = {
  [StatusPenduduk.AKTIF]: [StatusPenduduk.PINDAH, StatusPenduduk.MENINGGAL],
  [StatusPenduduk.PINDAH]: [StatusPenduduk.AKTIF, StatusPenduduk.MENINGGAL],
  [StatusPenduduk.MENINGGAL]: [],
};

function validateStatusTransition(from: StatusPenduduk, to: StatusPenduduk): void {
  if (from === to) return;

  if (from === StatusPenduduk.MENINGGAL) {
    throw new AppError('Cannot change status: MENINGGAL is a terminal state', 409);
  }

  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new AppError(
      `Invalid status transition: ${from} → ${to}`,
      409,
    );
  }
}

/**
 * Acquires a row-level exclusive lock on a KartuKeluarga row by performing
 * an idempotent updateMany (sets deletedAt to null, which is already null
 * for active records). PostgreSQL acquires ROW EXCLUSIVE lock on the matched
 * row, blocking concurrent transactions until this transaction completes.
 *
 * Returns the count of matched rows (0 = KK not found or soft-deleted).
 */
async function acquireKkLock(tx: TransactionClient, kkId: string): Promise<number> {
  const result = await tx.kartuKeluarga.updateMany({
    where: { id: kkId, deletedAt: null },
    data: { deletedAt: null },
  });
  return result.count;
}

/**
 * Counts active KEPALA_KELUARGA in a KK, optionally excluding a specific penduduk.
 * Must be called AFTER acquireKkLock to guarantee consistency.
 */
async function countActiveKepala(
  tx: TransactionClient,
  kkId: string,
  excludePendudukId?: string,
): Promise<number> {
  return tx.penduduk.count({
    where: {
      kkId,
      hubunganKeluarga: HubunganKeluarga.KEPALA_KELUARGA,
      status: StatusPenduduk.AKTIF,
      deletedAt: null,
      ...(excludePendudukId ? { id: { not: excludePendudukId } } : {}),
    },
  });
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

  return prisma.$transaction(async (tx) => {
    // Lock KK row: validates existence + active state, acquires row-level lock
    const lockCount = await acquireKkLock(tx, data.kkId);
    if (lockCount === 0) {
      throw new AppError('Kartu Keluarga not found', 404);
    }

    // Kepala invariant: if creating as KEPALA_KELUARGA, enforce at-most-one
    if (data.hubunganKeluarga === HubunganKeluarga.KEPALA_KELUARGA) {
      const kepalaCount = await countActiveKepala(tx, data.kkId);
      if (kepalaCount > 0) {
        throw new AppError('KK already has an active Kepala Keluarga', 409);
      }
    }

    const penduduk = await tx.penduduk.create({
      data: {
        nik: data.nik,
        nama: data.nama,
        tanggalLahir: new Date(data.tanggalLahir),
        jenisKelamin: data.jenisKelamin,
        pekerjaan: data.pekerjaan,
        hubunganKeluarga: data.hubunganKeluarga,
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

  // Terminal state immutability: MENINGGAL records are frozen — no field updates allowed
  if (existing.status === StatusPenduduk.MENINGGAL) {
    throw new AppError('Cannot modify record: MENINGGAL is a terminal state', 409);
  }

  if (data.nik && data.nik !== existing.nik) {
    const duplicate = await prisma.penduduk.findUnique({ where: { nik: data.nik } });
    if (duplicate) {
      throw new AppError('NIK already registered', 409);
    }
  }

  // State machine enforcement: validate status transition before entering transaction
  if (data.status) {
    validateStatusTransition(existing.status, data.status);
  }

  return prisma.$transaction(async (tx) => {
    const isChangingToKepala =
      data.hubunganKeluarga === HubunganKeluarga.KEPALA_KELUARGA &&
      existing.hubunganKeluarga !== HubunganKeluarga.KEPALA_KELUARGA;

    const isTransferringKk = data.kkId !== undefined && data.kkId !== existing.kkId;

    const effectiveKkId = data.kkId ?? existing.kkId;
    const effectiveHubungan = data.hubunganKeluarga ?? existing.hubunganKeluarga;
    const willBeKepala = effectiveHubungan === HubunganKeluarga.KEPALA_KELUARGA;

    // Detect status reactivation: non-AKTIF → AKTIF while hubungan is/becomes KEPALA
    const isReactivatingAsKepala =
      data.status === StatusPenduduk.AKTIF &&
      existing.status !== StatusPenduduk.AKTIF &&
      willBeKepala;

    // Lock required when operation could increase active kepala count in any KK
    const needsKepalaCheck =
      isChangingToKepala || isReactivatingAsKepala || (isTransferringKk && willBeKepala);

    if (needsKepalaCheck) {
      if (isTransferringKk) {
        // Dual-KK lock: acquire in deterministic UUID order to prevent deadlock
        const [firstKkId, secondKkId] =
          existing.kkId < effectiveKkId
            ? [existing.kkId, effectiveKkId]
            : [effectiveKkId, existing.kkId];

        const lock1 = await acquireKkLock(tx, firstKkId);
        if (lock1 === 0) {
          throw new AppError('Kartu Keluarga not found', 404);
        }

        const lock2 = await acquireKkLock(tx, secondKkId);
        if (lock2 === 0) {
          throw new AppError('Kartu Keluarga not found', 404);
        }
      } else {
        // Single KK lock: same KK, hubungan or status change increases kepala count
        const lockCount = await acquireKkLock(tx, existing.kkId);
        if (lockCount === 0) {
          throw new AppError('Kartu Keluarga not found or deleted', 404);
        }
      }

      // Check kepala invariant on target KK (under lock)
      const kepalaCount = await countActiveKepala(tx, effectiveKkId, existing.id);
      if (kepalaCount > 0) {
        throw new AppError('KK already has an active Kepala Keluarga', 409);
      }
    } else if (isTransferringKk) {
      // Transferring to another KK but NOT as kepala — just validate target KK is active
      const lockCount = await acquireKkLock(tx, effectiveKkId);
      if (lockCount === 0) {
        throw new AppError('Kartu Keluarga not found', 404);
      }
    }

    const penduduk = await tx.penduduk.update({
      where: { id },
      data: {
        nik: data.nik,
        nama: data.nama,
        tanggalLahir: data.tanggalLahir ? new Date(data.tanggalLahir) : undefined,
        jenisKelamin: data.jenisKelamin,
        pekerjaan: data.pekerjaan,
        status: data.status,
        hubunganKeluarga: data.hubunganKeluarga,
        kkId: data.kkId,
      },
      include: { kartuKeluarga: true },
    });

    // TODO: When MutasiPenduduk is implemented, create mutation record here
    // inside this transaction for any status change (data.status !== existing.status).
    // The MutasiPenduduk type maps: AKTIF→PINDAH=KELUAR, AKTIF→MENINGGAL=MENINGGAL,
    // PINDAH→AKTIF=MASUK, PINDAH→MENINGGAL=MENINGGAL.

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

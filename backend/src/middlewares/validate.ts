import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGIT_16 = /^\d{16}$/;
const VALID_ROLES = ['ADMIN', 'RT', 'KEPALA_DESA'];
const VALID_JENIS_KELAMIN = ['LAKI_LAKI', 'PEREMPUAN'];
const VALID_STATUS_PENDUDUK = ['AKTIF', 'PINDAH', 'MENINGGAL'];
const VALID_HUBUNGAN_KELUARGA = [
  'KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'MENANTU', 'CUCU',
  'ORANG_TUA', 'MERTUA', 'FAMILI_LAIN', 'LAINNYA',
];
const VALID_JENIS_SURAT = ['DOMISILI', 'TIDAK_MAMPU'];

function requireFields(body: Record<string, unknown>, fields: string[]): void {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === '',
  );
  if (missing.length > 0) {
    throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
  }
}

export function validateRegister(req: Request, _res: Response, next: NextFunction): void {
  requireFields(req.body, ['name', 'email', 'password']);

  if (req.body.role !== undefined) {
    throw new AppError('Role assignment is not allowed on public registration', 400);
  }
  if (!EMAIL_REGEX.test(req.body.email)) {
    throw new AppError('Invalid email format', 400);
  }

  next();
}

export function validateCreateUser(req: Request, _res: Response, next: NextFunction): void {
  requireFields(req.body, ['name', 'email', 'password', 'role']);

  if (!EMAIL_REGEX.test(req.body.email)) {
    throw new AppError('Invalid email format', 400);
  }
  if (!VALID_ROLES.includes(req.body.role)) {
    throw new AppError(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, 400);
  }

  next();
}

export function validateLogin(req: Request, _res: Response, next: NextFunction): void {
  requireFields(req.body, ['email', 'password']);

  if (!EMAIL_REGEX.test(req.body.email)) {
    throw new AppError('Invalid email format', 400);
  }

  next();
}

export function validatePenduduk(req: Request, _res: Response, next: NextFunction): void {
  requireFields(req.body, ['nik', 'nama', 'tanggalLahir', 'jenisKelamin', 'pekerjaan', 'kkId', 'hubunganKeluarga']);

  if (!DIGIT_16.test(req.body.nik)) {
    throw new AppError('NIK must be exactly 16 digits', 400);
  }
  if (!VALID_JENIS_KELAMIN.includes(req.body.jenisKelamin)) {
    throw new AppError(
      `Invalid jenisKelamin. Must be one of: ${VALID_JENIS_KELAMIN.join(', ')}`,
      400,
    );
  }
  if (!VALID_HUBUNGAN_KELUARGA.includes(req.body.hubunganKeluarga)) {
    throw new AppError(
      `Invalid hubunganKeluarga. Must be one of: ${VALID_HUBUNGAN_KELUARGA.join(', ')}`,
      400,
    );
  }

  next();
}

export function validatePendudukUpdate(req: Request, _res: Response, next: NextFunction): void {
  if (req.body.nik && !DIGIT_16.test(req.body.nik)) {
    throw new AppError('NIK must be exactly 16 digits', 400);
  }
  if (req.body.jenisKelamin && !VALID_JENIS_KELAMIN.includes(req.body.jenisKelamin)) {
    throw new AppError(
      `Invalid jenisKelamin. Must be one of: ${VALID_JENIS_KELAMIN.join(', ')}`,
      400,
    );
  }
  if (req.body.status && !VALID_STATUS_PENDUDUK.includes(req.body.status)) {
    throw new AppError(
      `Invalid status. Must be one of: ${VALID_STATUS_PENDUDUK.join(', ')}`,
      400,
    );
  }
  if (req.body.hubunganKeluarga && !VALID_HUBUNGAN_KELUARGA.includes(req.body.hubunganKeluarga)) {
    throw new AppError(
      `Invalid hubunganKeluarga. Must be one of: ${VALID_HUBUNGAN_KELUARGA.join(', ')}`,
      400,
    );
  }

  next();
}

export function validateKK(req: Request, _res: Response, next: NextFunction): void {
  requireFields(req.body, ['noKk', 'alamat', 'rt', 'rw']);

  if (!DIGIT_16.test(req.body.noKk)) {
    throw new AppError('No KK must be exactly 16 digits', 400);
  }

  next();
}

export function validateKKUpdate(req: Request, _res: Response, next: NextFunction): void {
  if (req.body.noKk && !DIGIT_16.test(req.body.noKk)) {
    throw new AppError('No KK must be exactly 16 digits', 400);
  }

  next();
}

export function validateSurat(req: Request, _res: Response, next: NextFunction): void {
  requireFields(req.body, ['jenis', 'pendudukId']);

  if (!VALID_JENIS_SURAT.includes(req.body.jenis)) {
    throw new AppError(
      `Invalid jenis surat. Must be one of: ${VALID_JENIS_SURAT.join(', ')}`,
      400,
    );
  }

  next();
}

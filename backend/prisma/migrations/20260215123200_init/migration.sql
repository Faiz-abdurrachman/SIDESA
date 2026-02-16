-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RT', 'KEPALA_DESA');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "StatusPenduduk" AS ENUM ('AKTIF', 'PINDAH', 'MENINGGAL');

-- CreateEnum
CREATE TYPE "JenisSurat" AS ENUM ('DOMISILI', 'TIDAK_MAMPU');

-- CreateEnum
CREATE TYPE "StatusSurat" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kartu_keluarga" (
    "id" TEXT NOT NULL,
    "no_kk" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "rt" TEXT NOT NULL,
    "rw" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kartu_keluarga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penduduk" (
    "id" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tanggal_lahir" TIMESTAMP(3) NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "pekerjaan" TEXT NOT NULL,
    "status" "StatusPenduduk" NOT NULL DEFAULT 'AKTIF',
    "kk_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penduduk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surat" (
    "id" TEXT NOT NULL,
    "nomor_surat" TEXT NOT NULL,
    "jenis" "JenisSurat" NOT NULL,
    "status" "StatusSurat" NOT NULL DEFAULT 'PENDING',
    "penduduk_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "kartu_keluarga_no_kk_key" ON "kartu_keluarga"("no_kk");

-- CreateIndex
CREATE UNIQUE INDEX "penduduk_nik_key" ON "penduduk"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "surat_nomor_surat_key" ON "surat"("nomor_surat");

-- AddForeignKey
ALTER TABLE "penduduk" ADD CONSTRAINT "penduduk_kk_id_fkey" FOREIGN KEY ("kk_id") REFERENCES "kartu_keluarga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_penduduk_id_fkey" FOREIGN KEY ("penduduk_id") REFERENCES "penduduk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat" ADD CONSTRAINT "surat_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "JenisMutasi" AS ENUM ('MASUK', 'KELUAR', 'LAHIR', 'MENINGGAL');

-- CreateTable
CREATE TABLE "mutasi_penduduk" (
    "id" TEXT NOT NULL,
    "penduduk_id" TEXT NOT NULL,
    "jenis_mutasi" "JenisMutasi" NOT NULL,
    "tanggal_mutasi" TIMESTAMP(3) NOT NULL,
    "keterangan" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "mutasi_penduduk_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mutasi_penduduk" ADD CONSTRAINT "mutasi_penduduk_penduduk_id_fkey" FOREIGN KEY ("penduduk_id") REFERENCES "penduduk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_penduduk" ADD CONSTRAINT "mutasi_penduduk_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

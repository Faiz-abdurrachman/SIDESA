-- CreateEnum
CREATE TYPE "HubunganKeluarga" AS ENUM ('KEPALA_KELUARGA', 'ISTRI', 'ANAK', 'MENANTU', 'CUCU', 'ORANG_TUA', 'MERTUA', 'FAMILI_LAIN', 'LAINNYA');

-- AlterTable
ALTER TABLE "penduduk" ADD COLUMN     "hubungan_keluarga" "HubunganKeluarga";

-- AlterTable
ALTER TABLE "kartu_keluarga" ADD COLUMN     "rt_id" TEXT;

-- AddForeignKey
ALTER TABLE "kartu_keluarga" ADD CONSTRAINT "kartu_keluarga_rt_id_fkey" FOREIGN KEY ("rt_id") REFERENCES "rt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

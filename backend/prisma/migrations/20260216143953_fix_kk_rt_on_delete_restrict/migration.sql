-- DropForeignKey
ALTER TABLE "kartu_keluarga" DROP CONSTRAINT "kartu_keluarga_rt_id_fkey";

-- AddForeignKey
ALTER TABLE "kartu_keluarga" ADD CONSTRAINT "kartu_keluarga_rt_id_fkey" FOREIGN KEY ("rt_id") REFERENCES "rt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

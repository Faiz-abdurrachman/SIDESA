-- CreateTable
CREATE TABLE "rw" (
    "id" TEXT NOT NULL,
    "nomor_rw" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rt" (
    "id" TEXT NOT NULL,
    "nomor_rt" TEXT NOT NULL,
    "rw_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rw_nomor_rw_key" ON "rw"("nomor_rw");

-- CreateIndex
CREATE UNIQUE INDEX "rt_nomor_rt_rw_id_key" ON "rt"("nomor_rt", "rw_id");

-- AddForeignKey
ALTER TABLE "rt" ADD CONSTRAINT "rt_rw_id_fkey" FOREIGN KEY ("rw_id") REFERENCES "rw"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" BIGSERIAL NOT NULL,
    "clinicId" BIGINT NOT NULL,
    "patientId" BIGINT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "medicalNoteId" BIGINT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tests" JSONB NOT NULL,
    "instructions" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" BIGSERIAL NOT NULL,
    "labOrderId" BIGINT NOT NULL,
    "testName" TEXT NOT NULL,
    "result" TEXT,
    "unit" TEXT,
    "referenceRange" TEXT,
    "flag" TEXT,
    "resultDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imaging_orders" (
    "id" BIGSERIAL NOT NULL,
    "clinicId" BIGINT NOT NULL,
    "patientId" BIGINT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "medicalNoteId" BIGINT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studyType" TEXT NOT NULL,
    "bodyPart" TEXT NOT NULL,
    "reason" TEXT,
    "clinicalNotes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "reportUrl" TEXT,
    "imagesUrl" TEXT,
    "findings" TEXT,
    "impression" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imaging_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_orders_clinicId_idx" ON "lab_orders"("clinicId");

-- CreateIndex
CREATE INDEX "lab_orders_patientId_idx" ON "lab_orders"("patientId");

-- CreateIndex
CREATE INDEX "lab_orders_doctorId_idx" ON "lab_orders"("doctorId");

-- CreateIndex
CREATE INDEX "lab_orders_status_idx" ON "lab_orders"("status");

-- CreateIndex
CREATE INDEX "lab_orders_orderDate_idx" ON "lab_orders"("orderDate");

-- CreateIndex
CREATE INDEX "lab_results_labOrderId_idx" ON "lab_results"("labOrderId");

-- CreateIndex
CREATE INDEX "imaging_orders_clinicId_idx" ON "imaging_orders"("clinicId");

-- CreateIndex
CREATE INDEX "imaging_orders_patientId_idx" ON "imaging_orders"("patientId");

-- CreateIndex
CREATE INDEX "imaging_orders_doctorId_idx" ON "imaging_orders"("doctorId");

-- CreateIndex
CREATE INDEX "imaging_orders_status_idx" ON "imaging_orders"("status");

-- CreateIndex
CREATE INDEX "imaging_orders_orderDate_idx" ON "imaging_orders"("orderDate");

-- CreateIndex
CREATE INDEX "imaging_orders_studyType_idx" ON "imaging_orders"("studyType");

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_medicalNoteId_fkey" FOREIGN KEY ("medicalNoteId") REFERENCES "medical_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_orders" ADD CONSTRAINT "imaging_orders_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_orders" ADD CONSTRAINT "imaging_orders_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_orders" ADD CONSTRAINT "imaging_orders_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imaging_orders" ADD CONSTRAINT "imaging_orders_medicalNoteId_fkey" FOREIGN KEY ("medicalNoteId") REFERENCES "medical_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

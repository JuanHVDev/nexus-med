-- AlterTable
ALTER TABLE "medical_histories" ADD COLUMN     "personalHistory" TEXT,
ADD COLUMN     "vitalSigns" JSONB,
ADD COLUMN     "vitalSignsRecordedAt" TIMESTAMP(3);

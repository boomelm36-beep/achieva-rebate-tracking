-- AlterEnum
ALTER TYPE "DocStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "proofFileData" TEXT,
ADD COLUMN     "proofFileName" TEXT;

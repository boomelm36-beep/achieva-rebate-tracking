/*
  Warnings:

  - The values [PENDING,REJECTED] on the enum `DocStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DocStatus_new" AS ENUM ('REQUEST', 'CHECKING', 'APPROVED');
ALTER TABLE "public"."Document" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Document" ALTER COLUMN "status" TYPE "DocStatus_new" USING ("status"::text::"DocStatus_new");
ALTER TYPE "DocStatus" RENAME TO "DocStatus_old";
ALTER TYPE "DocStatus_new" RENAME TO "DocStatus";
DROP TYPE "public"."DocStatus_old";
ALTER TABLE "Document" ALTER COLUMN "status" SET DEFAULT 'REQUEST';
COMMIT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "fileData" TEXT,
ADD COLUMN     "fileName" TEXT,
ALTER COLUMN "status" SET DEFAULT 'REQUEST';

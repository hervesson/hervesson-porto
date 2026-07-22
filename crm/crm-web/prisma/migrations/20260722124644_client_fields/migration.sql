-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "clientSince" TIMESTAMP(3),
ADD COLUMN     "health" TEXT,
ADD COLUMN     "mrr" INTEGER,
ADD COLUMN     "plan" TEXT;

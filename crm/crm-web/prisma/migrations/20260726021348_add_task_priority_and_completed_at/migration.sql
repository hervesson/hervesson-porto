-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'normal';

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

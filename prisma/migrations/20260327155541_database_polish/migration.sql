/*
  Warnings:

  - A unique constraint covering the columns `[user_id,region_id,category_id]` on the table `alert_subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "citizen_reports" ADD COLUMN     "incident_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "alert_subscriptions_user_id_region_id_category_id_key" ON "alert_subscriptions"("user_id", "region_id", "category_id");

-- CreateIndex
CREATE INDEX "checkpoints_name_idx" ON "checkpoints"("name");

-- CreateIndex
CREATE INDEX "citizen_reports_incident_id_idx" ON "citizen_reports"("incident_id");

-- CreateIndex
CREATE INDEX "incidents_source_type_idx" ON "incidents"("source_type");

-- CreateIndex
CREATE INDEX "regions_name_idx" ON "regions"("name");

-- AddForeignKey
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

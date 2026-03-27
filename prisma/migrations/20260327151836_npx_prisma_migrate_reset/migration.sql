-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('citizen', 'moderator', 'admin');

-- CreateEnum
CREATE TYPE "CheckpointStatus" AS ENUM ('open', 'delayed', 'closed', 'unknown');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('open', 'verified', 'closed', 'rejected');

-- CreateEnum
CREATE TYPE "IncidentSourceType" AS ENUM ('official', 'crowd', 'external_api');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'approved', 'rejected', 'merged');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('confirm', 'deny');

-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('report', 'incident');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('approve', 'reject', 'verify', 'close', 'merge', 'flag');

-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('city', 'village', 'governorate', 'area');

-- CreateEnum
CREATE TYPE "AlertDeliveryStatus" AS ENUM ('pending', 'sent', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_region_id" TEXT,
    "region_type" "RegionType" NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "region_id" TEXT NOT NULL,
    "description" TEXT,
    "current_status" "CheckpointStatus" NOT NULL DEFAULT 'unknown',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkpoint_status_history" (
    "id" TEXT NOT NULL,
    "checkpoint_id" TEXT NOT NULL,
    "status" "CheckpointStatus" NOT NULL,
    "changed_by_user_id" TEXT,
    "note" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkpoint_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "incident_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'open',
    "source_type" "IncidentSourceType" NOT NULL,
    "checkpoint_id" TEXT,
    "region_id" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "reported_by_user_id" TEXT,
    "verified_by_user_id" TEXT,
    "closed_by_user_id" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incident_status_history" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "old_status" "IncidentStatus" NOT NULL,
    "new_status" "IncidentStatus" NOT NULL,
    "changed_by_user_id" TEXT,
    "reason" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "category_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "region_id" TEXT,
    "report_time" TIMESTAMP(3) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "duplicate_of_report_id" TEXT,
    "confidence_score" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_votes" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vote_type" "VoteType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" TEXT NOT NULL,
    "target_type" "ModerationTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "moderator_user_id" TEXT NOT NULL,
    "action_type" "ModerationActionType" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "region_id" TEXT,
    "category_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "alert_message" TEXT NOT NULL,
    "delivery_status" "AlertDeliveryStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "origin_name" TEXT NOT NULL,
    "origin_lat" DECIMAL(9,6) NOT NULL,
    "origin_lng" DECIMAL(9,6) NOT NULL,
    "destination_name" TEXT NOT NULL,
    "destination_lat" DECIMAL(9,6) NOT NULL,
    "destination_lng" DECIMAL(9,6) NOT NULL,
    "estimated_distance_km" DECIMAL(10,2),
    "estimated_duration_min" INTEGER,
    "avoid_checkpoints" JSONB,
    "avoid_areas" JSONB,
    "metadata_json" JSONB,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_api_logs" (
    "id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "request_summary" TEXT,
    "response_status" INTEGER,
    "response_time_ms" INTEGER,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "regions_parent_region_id_idx" ON "regions"("parent_region_id");

-- CreateIndex
CREATE INDEX "checkpoints_region_id_idx" ON "checkpoints"("region_id");

-- CreateIndex
CREATE INDEX "checkpoints_current_status_idx" ON "checkpoints"("current_status");

-- CreateIndex
CREATE INDEX "checkpoint_status_history_checkpoint_id_idx" ON "checkpoint_status_history"("checkpoint_id");

-- CreateIndex
CREATE INDEX "checkpoint_status_history_changed_by_user_id_idx" ON "checkpoint_status_history"("changed_by_user_id");

-- CreateIndex
CREATE INDEX "checkpoint_status_history_changed_at_idx" ON "checkpoint_status_history"("changed_at");

-- CreateIndex
CREATE UNIQUE INDEX "incident_categories_name_key" ON "incident_categories"("name");

-- CreateIndex
CREATE INDEX "incidents_category_id_idx" ON "incidents"("category_id");

-- CreateIndex
CREATE INDEX "incidents_checkpoint_id_idx" ON "incidents"("checkpoint_id");

-- CreateIndex
CREATE INDEX "incidents_region_id_idx" ON "incidents"("region_id");

-- CreateIndex
CREATE INDEX "incidents_status_idx" ON "incidents"("status");

-- CreateIndex
CREATE INDEX "incidents_severity_idx" ON "incidents"("severity");

-- CreateIndex
CREATE INDEX "incidents_occurred_at_idx" ON "incidents"("occurred_at");

-- CreateIndex
CREATE INDEX "incidents_reported_by_user_id_idx" ON "incidents"("reported_by_user_id");

-- CreateIndex
CREATE INDEX "incidents_verified_by_user_id_idx" ON "incidents"("verified_by_user_id");

-- CreateIndex
CREATE INDEX "incidents_closed_by_user_id_idx" ON "incidents"("closed_by_user_id");

-- CreateIndex
CREATE INDEX "incident_status_history_incident_id_idx" ON "incident_status_history"("incident_id");

-- CreateIndex
CREATE INDEX "incident_status_history_changed_by_user_id_idx" ON "incident_status_history"("changed_by_user_id");

-- CreateIndex
CREATE INDEX "incident_status_history_changed_at_idx" ON "incident_status_history"("changed_at");

-- CreateIndex
CREATE INDEX "citizen_reports_user_id_idx" ON "citizen_reports"("user_id");

-- CreateIndex
CREATE INDEX "citizen_reports_category_id_idx" ON "citizen_reports"("category_id");

-- CreateIndex
CREATE INDEX "citizen_reports_region_id_idx" ON "citizen_reports"("region_id");

-- CreateIndex
CREATE INDEX "citizen_reports_status_idx" ON "citizen_reports"("status");

-- CreateIndex
CREATE INDEX "citizen_reports_report_time_idx" ON "citizen_reports"("report_time");

-- CreateIndex
CREATE INDEX "citizen_reports_duplicate_of_report_id_idx" ON "citizen_reports"("duplicate_of_report_id");

-- CreateIndex
CREATE INDEX "report_votes_user_id_idx" ON "report_votes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_votes_report_id_user_id_key" ON "report_votes"("report_id", "user_id");

-- CreateIndex
CREATE INDEX "moderation_actions_target_type_target_id_idx" ON "moderation_actions"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "moderation_actions_moderator_user_id_idx" ON "moderation_actions"("moderator_user_id");

-- CreateIndex
CREATE INDEX "moderation_actions_action_type_idx" ON "moderation_actions"("action_type");

-- CreateIndex
CREATE INDEX "alert_subscriptions_user_id_idx" ON "alert_subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "alert_subscriptions_region_id_idx" ON "alert_subscriptions"("region_id");

-- CreateIndex
CREATE INDEX "alert_subscriptions_category_id_idx" ON "alert_subscriptions"("category_id");

-- CreateIndex
CREATE INDEX "alert_subscriptions_is_active_idx" ON "alert_subscriptions"("is_active");

-- CreateIndex
CREATE INDEX "alerts_incident_id_idx" ON "alerts"("incident_id");

-- CreateIndex
CREATE INDEX "alerts_subscription_id_idx" ON "alerts"("subscription_id");

-- CreateIndex
CREATE INDEX "alerts_delivery_status_idx" ON "alerts"("delivery_status");

-- CreateIndex
CREATE INDEX "routes_created_by_user_id_idx" ON "routes"("created_by_user_id");

-- CreateIndex
CREATE INDEX "external_api_logs_provider_name_idx" ON "external_api_logs"("provider_name");

-- CreateIndex
CREATE INDEX "external_api_logs_created_at_idx" ON "external_api_logs"("created_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "refresh_tokens_revoked_at_idx" ON "refresh_tokens"("revoked_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "regions" ADD CONSTRAINT "regions_parent_region_id_fkey" FOREIGN KEY ("parent_region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoints" ADD CONSTRAINT "checkpoints_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_status_history" ADD CONSTRAINT "checkpoint_status_history_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkpoint_status_history" ADD CONSTRAINT "checkpoint_status_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "incident_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "checkpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reported_by_user_id_fkey" FOREIGN KEY ("reported_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_verified_by_user_id_fkey" FOREIGN KEY ("verified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_closed_by_user_id_fkey" FOREIGN KEY ("closed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_status_history" ADD CONSTRAINT "incident_status_history_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_status_history" ADD CONSTRAINT "incident_status_history_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "incident_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_reports" ADD CONSTRAINT "citizen_reports_duplicate_of_report_id_fkey" FOREIGN KEY ("duplicate_of_report_id") REFERENCES "citizen_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_votes" ADD CONSTRAINT "report_votes_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "citizen_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_votes" ADD CONSTRAINT "report_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_moderator_user_id_fkey" FOREIGN KEY ("moderator_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "incident_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "alert_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Seed Script
 * -----------
 * Author: All Team Members
 *
 * This script initializes the database with default seed data
 * required for development, testing, and demonstration purposes.
 *
 * Responsibilities:
 * - Establish a database connection using Prisma and PostgreSQL
 * - Hash predefined user passwords securely
 * - Insert or update base system data using upsert operations
 * - Populate users, regions, categories, checkpoints, incidents,
 *   reports, votes, moderation actions, subscriptions, alerts,
 *   routes, and external API logs
 *
 * Design Goals:
 * - Safe re-execution through upsert and cleanup logic
 * - Deterministic seeded records using fixed UUID values
 * - Consistent initial system state for testing
 */

const connectionString = process.env.DATABASE_URL;

/**
 * Validates the database connection string.
 *
 * Throws:
 * - Error if DATABASE_URL is missing
 */
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

/**
 * PostgreSQL connection pool used by Prisma adapter.
 *
 * Configuration:
 * - Uses the DATABASE_URL environment variable
 * - Enables SSL connection with relaxed certificate validation
 */
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Prisma PostgreSQL adapter connected to the pg Pool.
 */
const adapter = new PrismaPg(pool);

/**
 * Prisma client instance used for all database operations in this script.
 */
const prisma = new PrismaClient();

/**
 * hashPassword
 * ------------
 * Hashes a plain-text password using bcrypt.
 *
 * @param password - Raw plain-text password
 * @returns Promise<string> - Securely hashed password
 *
 * Purpose:
 * - Ensures passwords are never stored in plain text
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * main
 * ----
 * Main seed execution function.
 *
 * Responsibilities:
 * - Prepares hashed passwords
 * - Seeds all core entities in dependency-safe order
 * - Ensures records are inserted or updated consistently
 *
 * Seed Order:
 * 1. Users
 * 2. Fixed IDs
 * 3. Regions
 * 4. Incident categories
 * 5. Checkpoints
 * 6. Checkpoint status history
 * 7. Incidents
 * 8. Incident status history
 * 9. Citizen reports
 * 10. Report votes
 * 11. Moderation actions
 * 12. Alert subscriptions
 * 13. Alerts
 * 14. Route
 * 15. External API logs
 */
async function main() {
  console.log("🌱 Seeding database...");

  /**
   * Pre-hashed passwords for seeded users.
   */
  const adminPassword = await hashPassword("Admin123!");
  const moderatorPassword = await hashPassword("Moderator123!");
  const citizenPassword = await hashPassword("Citizen123!");

  /**
   * Users
   * -----
   * Seeds the default application users.
   *
   * Includes:
   * - One admin
   * - One moderator
   * - Three citizen accounts
   *
   * Uses upsert to avoid duplication on repeated seed runs.
   */
  const admin = await prisma.user.upsert({
    where: { email: "admin@wasel.ps" },
    update: {
      fullName: "System Admin",
      passwordHash: adminPassword,
      role: "admin",
      isActive: true,
    },
    create: {
      fullName: "System Admin",
      email: "admin@wasel.ps",
      passwordHash: adminPassword,
      role: "admin",
      isActive: true,
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@wasel.ps" },
    update: {
      fullName: "Main Moderator",
      passwordHash: moderatorPassword,
      role: "moderator",
      isActive: true,
    },
    create: {
      fullName: "Main Moderator",
      email: "moderator@wasel.ps",
      passwordHash: moderatorPassword,
      role: "moderator",
      isActive: true,
    },
  });

  const citizen1 = await prisma.user.upsert({
    where: { email: "citizen1@wasel.ps" },
    update: {
      fullName: "Citizen One",
      passwordHash: citizenPassword,
      role: "citizen",
      isActive: true,
    },
    create: {
      fullName: "Citizen One",
      email: "citizen1@wasel.ps",
      passwordHash: citizenPassword,
      role: "citizen",
      isActive: true,
    },
  });

  const citizen2 = await prisma.user.upsert({
    where: { email: "citizen2@wasel.ps" },
    update: {
      fullName: "Citizen Two",
      passwordHash: citizenPassword,
      role: "citizen",
      isActive: true,
    },
    create: {
      fullName: "Citizen Two",
      email: "citizen2@wasel.ps",
      passwordHash: citizenPassword,
      role: "citizen",
      isActive: true,
    },
  });

  const citizen3 = await prisma.user.upsert({
    where: { email: "citizen3@wasel.ps" },
    update: {
      fullName: "Citizen Three",
      passwordHash: citizenPassword,
      role: "citizen",
      isActive: true,
    },
    create: {
      fullName: "Citizen Three",
      email: "citizen3@wasel.ps",
      passwordHash: citizenPassword,
      role: "citizen",
      isActive: true,
    },
  });

  /**
   * Fixed valid UUIDs
   * -----------------
   * Defines deterministic identifiers for seeded entities.
   *
   * Purpose:
   * - Ensures stable references across repeated runs
   * - Makes relationships predictable during testing
   */
  const REGION_NABLUS_GOVERNORATE_ID = "7d1a2c4e-5b6f-4a8d-9c10-1f2e3d4c5b6a";
  const REGION_NABLUS_CITY_ID = "8a2b3c4d-6e7f-4a1b-9c2d-3e4f5a6b7c8d";
  const REGION_BEIT_FURIK_ID = "9b3c4d5e-7f8a-4b1c-8d2e-4f5a6b7c8d9e";
  const REGION_HUWARA_AREA_ID = "ac4d5e6f-8a9b-4c1d-8e2f-5a6b7c8d9e0f";

  const CHECKPOINT_HUWARA_ID = "bd5e6f7a-9b0c-4d1e-8f2a-6b7c8d9e0f1a";
  const CHECKPOINT_BEIT_FURIK_ID = "ce6f7a8b-0c1d-4e1f-9a2b-7c8d9e0f1a2b";

  const INCIDENT_1_ID = "df7a8b9c-1d2e-4f1a-8b2c-8d9e0f1a2b3c";
  const INCIDENT_2_ID = "e08b9c1d-2e3f-4a1b-9c2d-9e0f1a2b3c4d";

  const REPORT_1_ID = "f19c1d2e-3f4a-4b1c-8d2e-0f1a2b3c4d5e";
  const REPORT_2_ID = "a21d2e3f-4a5b-4c1d-9e2f-1a2b3c4d5e6f";
  const REPORT_3_ID = "b32e3f4a-5b6c-4d1e-8f2a-2b3c4d5e6f7a";

  const SUB_1_ID = "c43f4a5b-6c7d-4e1f-9a2b-3c4d5e6f7a8b";
  const SUB_2_ID = "d54a5b6c-7d8e-4f1a-8b2c-4d5e6f7a8b9c";

  const ALERT_1_ID = "e65b6c7d-8e9f-4a1b-9c2d-5e6f7a8b9c0d";
  const ALERT_2_ID = "f76c7d8e-9f0a-4b1c-8d2e-6f7a8b9c0d1e";

  const ROUTE_1_ID = "a87d8e9f-0a1b-4c1d-9e2f-7a8b9c0d1e2f";

  /**
   * Regions
   * -------
   * Seeds geographic regions with hierarchical structure.
   *
   * Includes:
   * - Nablus Governorate
   * - Nablus City
   * - Beit Furik
   * - Huwara Area
   */
  const nablusGovernorate = await prisma.region.upsert({
    where: { id: REGION_NABLUS_GOVERNORATE_ID },
    update: {
      name: "Nablus Governorate",
      regionType: "governorate",
      parentRegionId: null,
    },
    create: {
      id: REGION_NABLUS_GOVERNORATE_ID,
      name: "Nablus Governorate",
      regionType: "governorate",
      parentRegionId: null,
    },
  });

  const nablusCity = await prisma.region.upsert({
    where: { id: REGION_NABLUS_CITY_ID },
    update: {
      name: "Nablus City",
      regionType: "city",
      parentRegionId: nablusGovernorate.id,
    },
    create: {
      id: REGION_NABLUS_CITY_ID,
      name: "Nablus City",
      regionType: "city",
      parentRegionId: nablusGovernorate.id,
    },
  });

  const beitFurik = await prisma.region.upsert({
    where: { id: REGION_BEIT_FURIK_ID },
    update: {
      name: "Beit Furik",
      regionType: "village",
      parentRegionId: nablusGovernorate.id,
    },
    create: {
      id: REGION_BEIT_FURIK_ID,
      name: "Beit Furik",
      regionType: "village",
      parentRegionId: nablusGovernorate.id,
    },
  });

  const huwaraArea = await prisma.region.upsert({
    where: { id: REGION_HUWARA_AREA_ID },
    update: {
      name: "Huwara Area",
      regionType: "area",
      parentRegionId: nablusCity.id,
    },
    create: {
      id: REGION_HUWARA_AREA_ID,
      name: "Huwara Area",
      regionType: "area",
      parentRegionId: nablusCity.id,
    },
  });

  /**
   * Incident Categories
   * -------------------
   * Seeds the supported incident classification values.
   *
   * Includes categories such as:
   * - closure
   * - delay
   * - accident
   * - weather_hazard
   * - military_activity
   * - road_damage
   */
  const closureCategory = await prisma.incidentCategory.upsert({
    where: { name: "closure" },
    update: { description: "Road is fully closed" },
    create: { name: "closure", description: "Road is fully closed" },
  });

  const delayCategory = await prisma.incidentCategory.upsert({
    where: { name: "delay" },
    update: { description: "Traffic delay or slow movement" },
    create: { name: "delay", description: "Traffic delay or slow movement" },
  });

  const accidentCategory = await prisma.incidentCategory.upsert({
    where: { name: "accident" },
    update: { description: "Traffic accident or collision" },
    create: { name: "accident", description: "Traffic accident or collision" },
  });

  const weatherHazardCategory = await prisma.incidentCategory.upsert({
    where: { name: "weather_hazard" },
    update: { description: "Weather hazard affecting roads" },
    create: {
      name: "weather_hazard",
      description: "Weather hazard affecting roads",
    },
  });

  const militaryActivityCategory = await prisma.incidentCategory.upsert({
    where: { name: "military_activity" },
    update: { description: "Military activity affecting mobility" },
    create: {
      name: "military_activity",
      description: "Military activity affecting mobility",
    },
  });

  const roadDamageCategory = await prisma.incidentCategory.upsert({
    where: { name: "road_damage" },
    update: { description: "Road damage or infrastructure issue" },
    create: {
      name: "road_damage",
      description: "Road damage or infrastructure issue",
    },
  });

  /**
   * Checkpoints
   * -----------
   * Seeds physical checkpoints with coordinates, region assignments,
   * descriptions, and current operational status.
   */
  const huwaraCheckpoint = await prisma.checkpoint.upsert({
    where: { id: CHECKPOINT_HUWARA_ID },
    update: {
      name: "Huwara Checkpoint",
      latitude: new Prisma.Decimal("32.152200"),
      longitude: new Prisma.Decimal("35.281100"),
      regionId: huwaraArea.id,
      description: "Main checkpoint south of Nablus",
      currentStatus: "delayed",
    },
    create: {
      id: CHECKPOINT_HUWARA_ID,
      name: "Huwara Checkpoint",
      latitude: new Prisma.Decimal("32.152200"),
      longitude: new Prisma.Decimal("35.281100"),
      regionId: huwaraArea.id,
      description: "Main checkpoint south of Nablus",
      currentStatus: "delayed",
    },
  });

  const beitFurikCheckpoint = await prisma.checkpoint.upsert({
    where: { id: CHECKPOINT_BEIT_FURIK_ID },
    update: {
      name: "Beit Furik Checkpoint",
      latitude: new Prisma.Decimal("32.177000"),
      longitude: new Prisma.Decimal("35.300000"),
      regionId: beitFurik.id,
      description: "Checkpoint near Beit Furik entrance",
      currentStatus: "open",
    },
    create: {
      id: CHECKPOINT_BEIT_FURIK_ID,
      name: "Beit Furik Checkpoint",
      latitude: new Prisma.Decimal("32.177000"),
      longitude: new Prisma.Decimal("35.300000"),
      regionId: beitFurik.id,
      description: "Checkpoint near Beit Furik entrance",
      currentStatus: "open",
    },
  });

  /**
   * Checkpoint Status History
   * -------------------------
   * Seeds checkpoint history records to simulate status changes over time.
   *
   * Existing records for the selected checkpoints are cleared first
   * to ensure deterministic seed results.
   */
  await prisma.checkpointStatusHistory.deleteMany({
    where: {
      checkpointId: { in: [huwaraCheckpoint.id, beitFurikCheckpoint.id] },
    },
  });

  await prisma.checkpointStatusHistory.createMany({
    data: [
      {
        checkpointId: huwaraCheckpoint.id,
        status: "unknown",
        changedByUserId: admin.id,
        note: "Initial imported status",
      },
      {
        checkpointId: huwaraCheckpoint.id,
        status: "delayed",
        changedByUserId: moderator.id,
        note: "Heavy traffic reported",
      },
      {
        checkpointId: beitFurikCheckpoint.id,
        status: "open",
        changedByUserId: admin.id,
        note: "Checkpoint operating normally",
      },
    ],
  });

  /**
   * Incidents
   * ---------
   * Seeds incident records representing real-world traffic or road events.
   *
   * Includes:
   * - One open crowd-sourced delay incident
   * - One verified official road damage incident
   */
  const incident1 = await prisma.incident.upsert({
    where: { id: INCIDENT_1_ID },
    update: {
      title: "Heavy Traffic at Huwara",
      description: "Long vehicle queues reported near the checkpoint.",
      categoryId: delayCategory.id,
      severity: "high",
      status: "open",
      sourceType: "crowd",
      checkpointId: huwaraCheckpoint.id,
      regionId: huwaraArea.id,
      latitude: new Prisma.Decimal("32.152500"),
      longitude: new Prisma.Decimal("35.281300"),
      reportedByUserId: citizen1.id,
      verifiedByUserId: null,
      closedByUserId: null,
      occurredAt: new Date("2026-03-27T07:30:00.000Z"),
      verifiedAt: null,
      closedAt: null,
    },
    create: {
      id: INCIDENT_1_ID,
      title: "Heavy Traffic at Huwara",
      description: "Long vehicle queues reported near the checkpoint.",
      categoryId: delayCategory.id,
      severity: "high",
      status: "open",
      sourceType: "crowd",
      checkpointId: huwaraCheckpoint.id,
      regionId: huwaraArea.id,
      latitude: new Prisma.Decimal("32.152500"),
      longitude: new Prisma.Decimal("35.281300"),
      reportedByUserId: citizen1.id,
      occurredAt: new Date("2026-03-27T07:30:00.000Z"),
    },
  });

  const incident2 = await prisma.incident.upsert({
    where: { id: INCIDENT_2_ID },
    update: {
      title: "Minor Road Damage in Beit Furik",
      description: "Road surface damage causing slower movement.",
      categoryId: roadDamageCategory.id,
      severity: "medium",
      status: "verified",
      sourceType: "official",
      checkpointId: beitFurikCheckpoint.id,
      regionId: beitFurik.id,
      latitude: new Prisma.Decimal("32.177400"),
      longitude: new Prisma.Decimal("35.300500"),
      reportedByUserId: moderator.id,
      verifiedByUserId: moderator.id,
      closedByUserId: null,
      occurredAt: new Date("2026-03-27T06:00:00.000Z"),
      verifiedAt: new Date("2026-03-27T06:30:00.000Z"),
      closedAt: null,
    },
    create: {
      id: INCIDENT_2_ID,
      title: "Minor Road Damage in Beit Furik",
      description: "Road surface damage causing slower movement.",
      categoryId: roadDamageCategory.id,
      severity: "medium",
      status: "verified",
      sourceType: "official",
      checkpointId: beitFurikCheckpoint.id,
      regionId: beitFurik.id,
      latitude: new Prisma.Decimal("32.177400"),
      longitude: new Prisma.Decimal("35.300500"),
      reportedByUserId: moderator.id,
      verifiedByUserId: moderator.id,
      occurredAt: new Date("2026-03-27T06:00:00.000Z"),
      verifiedAt: new Date("2026-03-27T06:30:00.000Z"),
    },
  });

  /**
   * Incident Status History
   * -----------------------
   * Seeds audit trail records for incident lifecycle transitions.
   */
  await prisma.incidentStatusHistory.deleteMany({
    where: {
      incidentId: { in: [incident1.id, incident2.id] },
    },
  });

  await prisma.incidentStatusHistory.createMany({
    data: [
      {
        incidentId: incident1.id,
        oldStatus: "open",
        newStatus: "open",
        changedByUserId: citizen1.id,
        reason: "Initial report submission",
      },
      {
        incidentId: incident2.id,
        oldStatus: "open",
        newStatus: "verified",
        changedByUserId: moderator.id,
        reason: "Verified by moderator after review",
      },
    ],
  });

  /**
   * Citizen Reports
   * ---------------
   * Seeds sample citizen reports.
   *
   * Includes:
   * - One pending report
   * - One merged duplicate report
   * - One approved report
   */
  const report1 = await prisma.citizenReport.upsert({
    where: { id: REPORT_1_ID },
    update: {
      userId: citizen1.id,
      categoryId: delayCategory.id,
      description: "Traffic is very slow near Huwara checkpoint.",
      latitude: new Prisma.Decimal("32.152450"),
      longitude: new Prisma.Decimal("35.281250"),
      regionId: huwaraArea.id,
      reportTime: new Date("2026-03-27T07:20:00.000Z"),
      status: "pending",
      duplicateOfReportId: null,
      confidenceScore: new Prisma.Decimal("0.70"),
    },
    create: {
      id: REPORT_1_ID,
      userId: citizen1.id,
      categoryId: delayCategory.id,
      description: "Traffic is very slow near Huwara checkpoint.",
      latitude: new Prisma.Decimal("32.152450"),
      longitude: new Prisma.Decimal("35.281250"),
      regionId: huwaraArea.id,
      reportTime: new Date("2026-03-27T07:20:00.000Z"),
      status: "pending",
      confidenceScore: new Prisma.Decimal("0.70"),
    },
  });

  const report2 = await prisma.citizenReport.upsert({
    where: { id: REPORT_2_ID },
    update: {
      userId: citizen2.id,
      categoryId: delayCategory.id,
      description: "Queue is getting longer in the same area.",
      latitude: new Prisma.Decimal("32.152480"),
      longitude: new Prisma.Decimal("35.281280"),
      regionId: huwaraArea.id,
      reportTime: new Date("2026-03-27T07:25:00.000Z"),
      status: "merged",
      duplicateOfReportId: report1.id,
      confidenceScore: new Prisma.Decimal("0.55"),
    },
    create: {
      id: REPORT_2_ID,
      userId: citizen2.id,
      categoryId: delayCategory.id,
      description: "Queue is getting longer in the same area.",
      latitude: new Prisma.Decimal("32.152480"),
      longitude: new Prisma.Decimal("35.281280"),
      regionId: huwaraArea.id,
      reportTime: new Date("2026-03-27T07:25:00.000Z"),
      status: "merged",
      duplicateOfReportId: report1.id,
      confidenceScore: new Prisma.Decimal("0.55"),
    },
  });

  const report3 = await prisma.citizenReport.upsert({
    where: { id: REPORT_3_ID },
    update: {
      userId: citizen3.id,
      categoryId: accidentCategory.id,
      description: "Minor accident reported near city entrance.",
      latitude: new Prisma.Decimal("32.220000"),
      longitude: new Prisma.Decimal("35.254000"),
      regionId: nablusCity.id,
      reportTime: new Date("2026-03-27T08:00:00.000Z"),
      status: "approved",
      duplicateOfReportId: null,
      confidenceScore: new Prisma.Decimal("0.88"),
    },
    create: {
      id: REPORT_3_ID,
      userId: citizen3.id,
      categoryId: accidentCategory.id,
      description: "Minor accident reported near city entrance.",
      latitude: new Prisma.Decimal("32.220000"),
      longitude: new Prisma.Decimal("35.254000"),
      regionId: nablusCity.id,
      reportTime: new Date("2026-03-27T08:00:00.000Z"),
      status: "approved",
      confidenceScore: new Prisma.Decimal("0.88"),
    },
  });

  /**
   * Report Votes
   * ------------
   * Seeds crowd votes on reports to support confidence evaluation.
   *
   * Existing votes for seeded reports are deleted first
   * to avoid duplication across repeated runs.
   */
  await prisma.reportVote.deleteMany({
    where: {
      reportId: { in: [report1.id, report2.id, report3.id] },
    },
  });

  await prisma.reportVote.createMany({
    data: [
      {
        reportId: report1.id,
        userId: citizen2.id,
        voteType: "confirm",
      },
      {
        reportId: report1.id,
        userId: citizen3.id,
        voteType: "confirm",
      },
      {
        reportId: report3.id,
        userId: citizen1.id,
        voteType: "confirm",
      },
      {
        reportId: report3.id,
        userId: citizen2.id,
        voteType: "deny",
      },
    ],
  });

  /**
   * Moderation Actions
   * ------------------
   * Seeds moderation log entries for reports and incidents.
   *
   * Purpose:
   * - Simulates moderator review actions
   * - Supports audit trail testing
   */
  await prisma.moderationAction.deleteMany({
    where: {
      targetId: { in: [report2.id, report3.id, incident2.id] },
    },
  });

  await prisma.moderationAction.createMany({
    data: [
      {
        targetType: "report",
        targetId: report2.id,
        moderatorUserId: moderator.id,
        actionType: "merge",
        reason: "Duplicate of earlier Huwara delay report",
      },
      {
        targetType: "report",
        targetId: report3.id,
        moderatorUserId: moderator.id,
        actionType: "approve",
        reason: "Approved after consistency check",
      },
      {
        targetType: "incident",
        targetId: incident2.id,
        moderatorUserId: moderator.id,
        actionType: "verify",
        reason: "Verified from trusted source",
      },
    ],
  });

  /**
   * Alert Subscriptions
   * -------------------
   * Seeds user alert preferences based on region and category.
   */
  const sub1 = await prisma.alertSubscription.upsert({
    where: { id: SUB_1_ID },
    update: {
      userId: citizen1.id,
      regionId: huwaraArea.id,
      categoryId: delayCategory.id,
      isActive: true,
    },
    create: {
      id: SUB_1_ID,
      userId: citizen1.id,
      regionId: huwaraArea.id,
      categoryId: delayCategory.id,
      isActive: true,
    },
  });

  const sub2 = await prisma.alertSubscription.upsert({
    where: { id: SUB_2_ID },
    update: {
      userId: citizen2.id,
      regionId: beitFurik.id,
      categoryId: roadDamageCategory.id,
      isActive: true,
    },
    create: {
      id: SUB_2_ID,
      userId: citizen2.id,
      regionId: beitFurik.id,
      categoryId: roadDamageCategory.id,
      isActive: true,
    },
  });

  /**
   * Alerts
   * ------
   * Seeds sample alert delivery records linked to subscriptions and incidents.
   */
  await prisma.alert.deleteMany({
    where: {
      id: {
        in: [ALERT_1_ID, ALERT_2_ID],
      },
    },
  });

  await prisma.alert.createMany({
    data: [
      {
        id: ALERT_1_ID,
        incidentId: incident2.id,
        subscriptionId: sub2.id,
        alertMessage: "Verified road damage reported in Beit Furik.",
        deliveryStatus: "pending",
      },
      {
        id: ALERT_2_ID,
        incidentId: incident1.id,
        subscriptionId: sub1.id,
        alertMessage: "Traffic delay reported in Huwara Area.",
        deliveryStatus: "pending",
      },
    ],
  });

  /**
   * Route
   * -----
   * Seeds a sample saved route record used for route estimation testing.
   *
   * Includes:
   * - Origin and destination coordinates
   * - Estimated distance and duration
   * - Avoidance preferences
   * - Metadata for route analysis
   */
  await prisma.route.upsert({
    where: { id: ROUTE_1_ID },
    update: {
      originName: "Nablus City Center",
      originLat: new Prisma.Decimal("32.221110"),
      originLng: new Prisma.Decimal("35.254440"),
      destinationName: "Beit Furik",
      destinationLat: new Prisma.Decimal("32.176500"),
      destinationLng: new Prisma.Decimal("35.335000"),
      estimatedDistanceKm: new Prisma.Decimal("12.40"),
      estimatedDurationMin: 24,
      avoidCheckpoints: ["Huwara Checkpoint"],
      avoidAreas: ["Huwara Area"],
      metadataJson: {
        usedProvider: "seed-demo",
        affectedByCheckpointCount: 1,
        affectedByIncidentCount: 2,
        weatherConsidered: false,
        notes: "Sample route record for testing",
      },
      createdByUserId: citizen1.id,
    },
    create: {
      id: ROUTE_1_ID,
      originName: "Nablus City Center",
      originLat: new Prisma.Decimal("32.221110"),
      originLng: new Prisma.Decimal("35.254440"),
      destinationName: "Beit Furik",
      destinationLat: new Prisma.Decimal("32.176500"),
      destinationLng: new Prisma.Decimal("35.335000"),
      estimatedDistanceKm: new Prisma.Decimal("12.40"),
      estimatedDurationMin: 24,
      avoidCheckpoints: ["Huwara Checkpoint"],
      avoidAreas: ["Huwara Area"],
      metadataJson: {
        usedProvider: "seed-demo",
        affectedByCheckpointCount: 1,
        affectedByIncidentCount: 2,
        weatherConsidered: false,
        notes: "Sample route record for testing",
      },
      createdByUserId: citizen1.id,
    },
  });

  /**
   * External API Logs
   * -----------------
   * Seeds example records representing third-party API calls.
   *
   * Purpose:
   * - Supports testing of monitoring and integration logging
   */
  await prisma.externalApiLog.deleteMany({
    where: {
      providerName: { in: ["openrouteservice", "openweather"] },
    },
  });

  await prisma.externalApiLog.createMany({
    data: [
      {
        providerName: "openrouteservice",
        endpoint: "/v2/directions/driving-car",
        requestSummary: "Nablus -> Beit Furik",
        responseStatus: 200,
        responseTimeMs: 420,
        cached: false,
        errorMessage: null,
      },
      {
        providerName: "openweather",
        endpoint: "/data/2.5/weather",
        requestSummary: "Weather for Nablus area",
        responseStatus: 200,
        responseTimeMs: 210,
        cached: true,
        errorMessage: null,
      },
    ],
  });

  /**
   * Completion Output
   * -----------------
   * Prints seed completion status and seeded login credentials.
   */
  console.log("✅ Seed completed successfully.");
  console.log("Admin:", admin.email, "/ password: Admin123!");
  console.log("Moderator:", moderator.email, "/ password: Moderator123!");
  console.log("Citizen:", citizen1.email, "/ password: Citizen123!");

  /**
   * Keeps seeded category variables intentionally referenced
   * to avoid unused variable warnings.
   */
  void closureCategory;
  void weatherHazardCategory;
  void militaryActivityCategory;
}

/**
 * Script Execution
 * ----------------
 * Executes the main seed function and ensures cleanup behavior.
 *
 * Behavior:
 * - Runs the seed process
 * - Logs any failure
 * - Exits with non-zero status on error
 * - Disconnects Prisma client
 * - Closes PostgreSQL pool
 */
main()
  .catch((e) => {
    console.error("❌ Seed failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
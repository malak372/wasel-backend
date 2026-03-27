import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("🌱 Seeding database...");

  const adminPassword = hashPassword("Admin123!");
  const moderatorPassword = hashPassword("Moderator123!");
  const citizenPassword = hashPassword("Citizen123!");

  // =========================
  // Users
  // =========================
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

  // =========================
  // Regions
  // =========================
  const nablusGovernorate = await prisma.region.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: {
      name: "Nablus Governorate",
      regionType: "governorate",
      parentRegionId: null,
    },
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Nablus Governorate",
      regionType: "governorate",
      parentRegionId: null,
    },
  });

  const nablusCity = await prisma.region.upsert({
    where: { id: "22222222-2222-2222-2222-222222222222" },
    update: {
      name: "Nablus City",
      regionType: "city",
      parentRegionId: nablusGovernorate.id,
    },
    create: {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Nablus City",
      regionType: "city",
      parentRegionId: nablusGovernorate.id,
    },
  });

  const beitFurik = await prisma.region.upsert({
    where: { id: "33333333-3333-3333-3333-333333333333" },
    update: {
      name: "Beit Furik",
      regionType: "village",
      parentRegionId: nablusGovernorate.id,
    },
    create: {
      id: "33333333-3333-3333-3333-333333333333",
      name: "Beit Furik",
      regionType: "village",
      parentRegionId: nablusGovernorate.id,
    },
  });

  const huwaraArea = await prisma.region.upsert({
    where: { id: "44444444-4444-4444-4444-444444444444" },
    update: {
      name: "Huwara Area",
      regionType: "area",
      parentRegionId: nablusCity.id,
    },
    create: {
      id: "44444444-4444-4444-4444-444444444444",
      name: "Huwara Area",
      regionType: "area",
      parentRegionId: nablusCity.id,
    },
  });

  // =========================
  // Incident categories
  // =========================
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

  // =========================
  // Checkpoints
  // =========================
  const huwaraCheckpoint = await prisma.checkpoint.upsert({
    where: { id: "55555555-5555-5555-5555-555555555555" },
    update: {
      name: "Huwara Checkpoint",
      latitude: new Prisma.Decimal("32.152200"),
      longitude: new Prisma.Decimal("35.281100"),
      regionId: huwaraArea.id,
      description: "Main checkpoint south of Nablus",
      currentStatus: "delayed",
    },
    create: {
      id: "55555555-5555-5555-5555-555555555555",
      name: "Huwara Checkpoint",
      latitude: new Prisma.Decimal("32.152200"),
      longitude: new Prisma.Decimal("35.281100"),
      regionId: huwaraArea.id,
      description: "Main checkpoint south of Nablus",
      currentStatus: "delayed",
    },
  });

  const beitFurikCheckpoint = await prisma.checkpoint.upsert({
    where: { id: "66666666-6666-6666-6666-666666666666" },
    update: {
      name: "Beit Furik Checkpoint",
      latitude: new Prisma.Decimal("32.177000"),
      longitude: new Prisma.Decimal("35.300000"),
      regionId: beitFurik.id,
      description: "Checkpoint near Beit Furik entrance",
      currentStatus: "open",
    },
    create: {
      id: "66666666-6666-6666-6666-666666666666",
      name: "Beit Furik Checkpoint",
      latitude: new Prisma.Decimal("32.177000"),
      longitude: new Prisma.Decimal("35.300000"),
      regionId: beitFurik.id,
      description: "Checkpoint near Beit Furik entrance",
      currentStatus: "open",
    },
  });

  // =========================
  // Checkpoint status history
  // =========================
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

  // =========================
  // Incidents
  // =========================
  const incident1 = await prisma.incident.upsert({
    where: { id: "77777777-7777-7777-7777-777777777777" },
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
      id: "77777777-7777-7777-7777-777777777777",
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
    where: { id: "88888888-8888-8888-8888-888888888888" },
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
      id: "88888888-8888-8888-8888-888888888888",
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

  // =========================
  // Incident status history
  // =========================
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

  // =========================
  // Citizen reports
  // =========================
  const report1 = await prisma.citizenReport.upsert({
    where: { id: "99999999-9999-9999-9999-999999999999" },
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
      id: "99999999-9999-9999-9999-999999999999",
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
    where: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
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
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
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
    where: { id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" },
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
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
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

  // =========================
  // Report votes
  // =========================
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

  // =========================
  // Moderation actions
  // =========================
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

  // =========================
  // Alert subscriptions
  // =========================
  const sub1 = await prisma.alertSubscription.upsert({
    where: { id: "cccccccc-cccc-cccc-cccc-cccccccccccc" },
    update: {
      userId: citizen1.id,
      regionId: huwaraArea.id,
      categoryId: delayCategory.id,
      isActive: true,
    },
    create: {
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      userId: citizen1.id,
      regionId: huwaraArea.id,
      categoryId: delayCategory.id,
      isActive: true,
    },
  });

  const sub2 = await prisma.alertSubscription.upsert({
    where: { id: "dddddddd-dddd-dddd-dddd-dddddddddddd" },
    update: {
      userId: citizen2.id,
      regionId: beitFurik.id,
      categoryId: roadDamageCategory.id,
      isActive: true,
    },
    create: {
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      userId: citizen2.id,
      regionId: beitFurik.id,
      categoryId: roadDamageCategory.id,
      isActive: true,
    },
  });

  // =========================
  // Alerts
  // =========================
  await prisma.alert.deleteMany({
    where: {
      id: {
        in: [
          "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
          "ffffffff-ffff-ffff-ffff-ffffffffffff",
        ],
      },
    },
  });

  await prisma.alert.createMany({
    data: [
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        incidentId: incident2.id,
        subscriptionId: sub2.id,
        alertMessage: "Verified road damage reported in Beit Furik.",
        deliveryStatus: "pending",
      },
      {
        id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        incidentId: incident1.id,
        subscriptionId: sub1.id,
        alertMessage: "Traffic delay reported in Huwara Area.",
        deliveryStatus: "pending",
      },
    ],
  });

  // =========================
  // Route
  // =========================
  await prisma.route.upsert({
    where: { id: "12121212-1212-1212-1212-121212121212" },
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
      id: "12121212-1212-1212-1212-121212121212",
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

  // =========================
  // External API logs
  // =========================
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

  console.log("✅ Seed completed successfully.");
  console.log("Admin:", admin.email, "/ password: Admin123!");
  console.log("Moderator:", moderator.email, "/ password: Moderator123!");
  console.log("Citizen:", citizen1.email, "/ password: Citizen123!");

  void closureCategory;
  void weatherHazardCategory;
  void militaryActivityCategory;
}

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
import "dotenv/config";

import bcrypt from "bcryptjs";
import {
  PaymentStatus,
  Priority,
  Prisma,
  PrismaClient,
  ProjectStatus,
  TaskStatus,
  UserRole,
} from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL?.trim();
const adminName = process.env.ADMIN_NAME?.trim();
const adminPassword = process.env.ADMIN_PASSWORD?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

if (!adminEmail) {
  throw new Error("ADMIN_EMAIL is required to seed the admin user.");
}

if (!adminPassword) {
  throw new Error("ADMIN_PASSWORD is required to seed the admin user.");
}

if (!adminName) {
  throw new Error("ADMIN_NAME is required to seed the admin user.");
}

const prisma = new PrismaClient();

const ids = {
  adminUser: "11111111-1111-4111-8111-111111111111",
  managerUser: "22222222-2222-4222-8222-222222222222",
  projectLaunch: "33333333-3333-4333-8333-333333333333",
  projectWarehouse: "44444444-4444-4444-8444-444444444444",
  providerDesign: "55555555-5555-4555-8555-555555555555",
  providerBuild: "66666666-6666-4666-8666-666666666666",
  providerLogistics: "77777777-7777-4777-8777-777777777777",
};

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const [adminUser, managerUser] = await Promise.all([
    prisma.user.upsert({
      where: { id: ids.adminUser },
      update: {
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: UserRole.ADMIN,
      },
      create: {
        id: ids.adminUser,
        name: adminName,
        email: adminEmail,
        passwordHash,
        telegramUserId: "100000001",
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { id: ids.managerUser },
      update: {},
      create: {
        id: ids.managerUser,
        name: "Operations Lead",
        email: "ops.lead@example.com",
        telegramUserId: "100000002",
        role: UserRole.MANAGER,
      },
    }),
  ]);

  const [launchProject, warehouseProject] = await Promise.all([
    prisma.project.upsert({
      where: { id: ids.projectLaunch },
      update: {},
      create: {
        id: ids.projectLaunch,
        name: "ManagerOps Launch",
        description: "Prepare the first production release of the ManagerOps AI Assistant.",
        status: ProjectStatus.ACTIVE,
        priority: Priority.HIGH,
        budget: new Prisma.Decimal("25000.00"),
        startDate: new Date("2026-05-01T00:00:00.000Z"),
        dueDate: new Date("2026-06-15T00:00:00.000Z"),
      },
    }),
    prisma.project.upsert({
      where: { id: ids.projectWarehouse },
      update: {},
      create: {
        id: ids.projectWarehouse,
        name: "Warehouse Workflow Upgrade",
        description: "Improve task tracking, provider coordination, and payment visibility.",
        status: ProjectStatus.PLANNING,
        priority: Priority.MEDIUM,
        budget: new Prisma.Decimal("42000.00"),
        startDate: new Date("2026-06-01T00:00:00.000Z"),
        dueDate: new Date("2026-08-30T00:00:00.000Z"),
      },
    }),
  ]);

  const [designProvider, buildProvider, logisticsProvider] = await Promise.all([
    prisma.provider.upsert({
      where: { id: ids.providerDesign },
      update: {},
      create: {
        id: ids.providerDesign,
        name: "Northstar Design Studio",
        contactName: "Maya Collins",
        email: "maya@example-provider.com",
        phone: "+1-555-0101",
        notes: "UI and product design support.",
      },
    }),
    prisma.provider.upsert({
      where: { id: ids.providerBuild },
      update: {},
      create: {
        id: ids.providerBuild,
        name: "Reliable Build Co.",
        contactName: "Daniel Reyes",
        email: "daniel@example-provider.com",
        phone: "+1-555-0102",
        notes: "Implementation and field operations partner.",
      },
    }),
    prisma.provider.upsert({
      where: { id: ids.providerLogistics },
      update: {},
      create: {
        id: ids.providerLogistics,
        name: "Borderline Logistics",
        contactName: "Elena Cruz",
        email: "elena@example-provider.com",
        phone: "+1-555-0103",
        notes: "Delivery and procurement coordination.",
      },
    }),
  ]);

  await Promise.all([
    prisma.task.upsert({
      where: { id: "88888888-8888-4888-8888-888888888881" },
      update: {},
      create: {
        id: "88888888-8888-4888-8888-888888888881",
        title: "Finalize Telegram command list",
        description: "Confirm /start, /help, /projects, /tasks, /payments, and /report flows.",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        dueDate: new Date("2026-05-20T00:00:00.000Z"),
        projectId: launchProject.id,
        assignedToId: adminUser.id,
      },
    }),
    prisma.task.upsert({
      where: { id: "88888888-8888-4888-8888-888888888882" },
      update: {},
      create: {
        id: "88888888-8888-4888-8888-888888888882",
        title: "Connect Supabase database",
        description: "Apply Prisma migrations and verify seeded records.",
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        dueDate: new Date("2026-05-22T00:00:00.000Z"),
        projectId: launchProject.id,
        assignedToId: managerUser.id,
      },
    }),
    prisma.task.upsert({
      where: { id: "88888888-8888-4888-8888-888888888883" },
      update: {},
      create: {
        id: "88888888-8888-4888-8888-888888888883",
        title: "Draft provider onboarding checklist",
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
        dueDate: new Date("2026-06-05T00:00:00.000Z"),
        projectId: warehouseProject.id,
        assignedToId: managerUser.id,
      },
    }),
    prisma.task.upsert({
      where: { id: "88888888-8888-4888-8888-888888888884" },
      update: {},
      create: {
        id: "88888888-8888-4888-8888-888888888884",
        title: "Review warehouse payment schedule",
        status: TaskStatus.BLOCKED,
        priority: Priority.MEDIUM,
        dueDate: new Date("2026-06-12T00:00:00.000Z"),
        projectId: warehouseProject.id,
      },
    }),
    prisma.task.upsert({
      where: { id: "88888888-8888-4888-8888-888888888885" },
      update: {},
      create: {
        id: "88888888-8888-4888-8888-888888888885",
        title: "Prepare launch report template",
        status: TaskStatus.DONE,
        priority: Priority.LOW,
        completedAt: new Date("2026-05-10T00:00:00.000Z"),
        projectId: launchProject.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.payment.upsert({
      where: { id: "99999999-9999-4999-8999-999999999991" },
      update: {},
      create: {
        id: "99999999-9999-4999-8999-999999999991",
        description: "Design system deposit",
        amount: new Prisma.Decimal("3500.00"),
        status: PaymentStatus.APPROVED,
        dueDate: new Date("2026-05-18T00:00:00.000Z"),
        projectId: launchProject.id,
        providerId: designProvider.id,
      },
    }),
    prisma.payment.upsert({
      where: { id: "99999999-9999-4999-8999-999999999992" },
      update: {},
      create: {
        id: "99999999-9999-4999-8999-999999999992",
        description: "Backend implementation milestone",
        amount: new Prisma.Decimal("7200.00"),
        status: PaymentStatus.PENDING,
        dueDate: new Date("2026-06-01T00:00:00.000Z"),
        projectId: launchProject.id,
        providerId: buildProvider.id,
      },
    }),
    prisma.payment.upsert({
      where: { id: "99999999-9999-4999-8999-999999999993" },
      update: {},
      create: {
        id: "99999999-9999-4999-8999-999999999993",
        description: "Warehouse equipment delivery planning",
        amount: new Prisma.Decimal("5100.00"),
        status: PaymentStatus.PAID,
        dueDate: new Date("2026-05-12T00:00:00.000Z"),
        paidAt: new Date("2026-05-12T00:00:00.000Z"),
        projectId: warehouseProject.id,
        providerId: logisticsProvider.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.document.upsert({
      where: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1" },
      update: {},
      create: {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
        title: "ManagerOps Product Brief",
        fileName: "managerops-product-brief.pdf",
        fileType: "application/pdf",
        url: "https://example.com/documents/managerops-product-brief.pdf",
        projectId: launchProject.id,
      },
    }),
    prisma.document.upsert({
      where: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2" },
      update: {},
      create: {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
        title: "Warehouse Upgrade Scope",
        fileName: "warehouse-upgrade-scope.pdf",
        fileType: "application/pdf",
        url: "https://example.com/documents/warehouse-upgrade-scope.pdf",
        projectId: warehouseProject.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.activityLog.upsert({
      where: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1" },
      update: {},
      create: {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
        action: "PROJECT_CREATED",
        details: { source: "seed", projectName: launchProject.name },
        projectId: launchProject.id,
        userId: adminUser.id,
      },
    }),
    prisma.activityLog.upsert({
      where: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2" },
      update: {},
      create: {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
        action: "PAYMENT_RECORDED",
        details: { source: "seed", providerName: logisticsProvider.name },
        projectId: warehouseProject.id,
        userId: managerUser.id,
      },
    }),
  ]);

  console.log("Seed data created for ManagerOps AI Assistant.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

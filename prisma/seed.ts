// prisma/seed.ts
import { PrismaClient, Role, DocStatus } from "./generated/client/index.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Clean out existing records
  await prisma.document.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create an Approver User
  const approver = await prisma.user.create({
    data: {
      email: "approver@example.com",
      name: "Alice Approver",
      role: Role.APPROVER,
    },
  });

  // 3. Create a Requester User
  const requester = await prisma.user.create({
    data: {
      email: "requester@example.com",
      name: "Bob Requester",
      role: Role.REQUESTER,
    },
  });

  // 4. Create sample rebate documents attached to the requester
  await prisma.document.createMany({
    data: [
      {
        subject: "Q1 Global Supply Rebate",
        docNumber: "REB-2026-001",
        amount: 14200.00,
        // CHANGED: From PENDING to REQUEST
        status: DocStatus.REQUEST,
        deadline: new Date("2026-08-01"),
        userId: requester.id,
      },
      {
        subject: "Marketing MDF Reimbursement",
        docNumber: "REB-2026-002",
        amount: 3500.50,
        // CHANGED: From PENDING to REQUEST
        status: DocStatus.REQUEST,
        deadline: new Date("2026-07-15"),
        userId: requester.id,
      },
    ],
  });

  console.log("✅ Seed data successfully inserted into Neon Database!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
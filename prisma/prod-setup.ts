// prisma/prod-setup.ts
import { PrismaClient, Role } from "./generated/client/index.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Delete all documents to start fresh
  await prisma.document.deleteMany({});
  console.log("🧹 Cleared all mock documents.");

  // 2. Promote your account
  const updatedUser = await prisma.user.updateMany({
    where: { email: "boomelm36@gmail.com" },
    data: { role: Role.APPROVER }, // This grants you the ability to approve/reject
  });

  if (updatedUser.count > 0) {
    console.log("👑 Successfully promoted boomelm36@gmail.com to APPROVER (Admin)!");
  } else {
    console.log("⚠️ Account not found. Make sure you signed up with this email first!");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await pool.end());
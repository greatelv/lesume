import { PrismaClient, PlanCode } from "../src/generated/client/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const plans = [
    {
      code: PlanCode.FREE,
      monthly_quota: 2,
      max_resumes: 1,
    },
    {
      code: PlanCode.STANDARD,
      monthly_quota: 6,
      max_resumes: 3,
    },
    {
      code: PlanCode.PRO,
      monthly_quota: 20,
      max_resumes: 9999, // Unlimited representation
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }

  console.log("Plans seeded successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

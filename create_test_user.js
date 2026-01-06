const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const userId = "test-user-id";

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: "Test User",
      email: "test@example.com",
      image: "https://ui.shadcn.com/avatars/01.png",
      emailVerified: new Date(),
    },
  });

  console.log("Test user created/verified:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

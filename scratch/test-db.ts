import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting...");
  const asset = await prisma.asset.findFirst({
    where: { bookable: true }
  });
  console.log("Asset:", asset?.id);

  if (!asset) return;

  const user = await prisma.user.findFirst();
  console.log("User:", user?.id);

  if (!user) return;

  console.log("Starting transaction...");
  const result = await prisma.$transaction(async (tx) => {
    console.log("Inside tx...");
    return await tx.booking.create({
      data: {
        assetId: asset.id,
        userId: user.id,
        startTime: new Date(Date.now() + 1000000),
        endTime: new Date(Date.now() + 2000000),
        status: "UPCOMING"
      }
    });
  });
  console.log("Transaction finished:", result);
}

main().catch(console.error).finally(() => prisma.$disconnect());

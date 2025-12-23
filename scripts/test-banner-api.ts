import { prisma } from "../lib/prisma";

async function testBannerAPI() {
  console.log("Testing Banner API CRUD operations...");

  try {
    // CREATE - Test creating a banner
    console.log("\n1. Creating a banner...");
    const createdBanner = await prisma.banner.create({
      data: {
        message: "Welcome to our store! Special offers available.",
      },
    });
    console.log("Created banner:", createdBanner);

    // READ - Test getting all banners
    console.log("\n2. Getting all banners...");
    const allBanners = await prisma.banner.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("All banners:", allBanners);

    // READ - Test getting a specific banner
    console.log("\n3. Getting specific banner...");
    const specificBanner = await prisma.banner.findUnique({
      where: {
        id: createdBanner.id,
      },
    });
    console.log("Specific banner:", specificBanner);

    // UPDATE - Test updating the banner
    console.log("\n4. Updating the banner...");
    const updatedBanner = await prisma.banner.update({
      where: {
        id: createdBanner.id,
      },
      data: {
        message: "Welcome to our store! Limited time offers available.",
      },
    });
    console.log("Updated banner:", updatedBanner);

    // DELETE - Test deleting the banner
    console.log("\n5. Deleting the banner...");
    await prisma.banner.delete({
      where: {
        id: createdBanner.id,
      },
    });
    console.log("Banner deleted successfully");

    // Verify deletion - should return empty array
    console.log("\n6. Verifying deletion...");
    const remainingBanners = await prisma.banner.findMany();
    console.log("Remaining banners:", remainingBanners);

    console.log("\n✅ All Banner CRUD operations completed successfully!");

  } catch (error) {
    console.error("❌ Error during testing:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testBannerAPI();

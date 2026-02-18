import { storage } from "./storage";

async function main() {
  try {
    console.log("Seeding categories...");
    await storage.seedCategories();
    console.log("Seeding products...");
    await storage.seedProducts();
    console.log("Seed completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

main();

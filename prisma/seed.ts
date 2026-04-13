import { PrismaClient } from "../src/generated/prisma";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.incomeEntry.deleteMany();
  await prisma.expenseEntry.deleteMany();
  await prisma.recurringItem.deleteMany();
  await prisma.settings.deleteMany();

  // Create settings
  await prisma.settings.create({
    data: {
      id: "default",
      startingCash: 45000,
      minCashBuffer: 10000,
      horizonMonths: 12,
      effectiveTaxRate: 22,
      taxDeductions: 7056, // Pillar 3a max 2024
      taxReservePercent: 22,
      taxPaymentSchedule: "monthly",
      currency: "CHF",
    },
  });
  console.log("✓ Settings created");

  // Create income entries (past 6 months)
  const now = new Date();
  const clients = [
    "Acme AG",
    "SwissTech GmbH",
    "FinServ SA",
    "MediaHouse AG",
    null,
  ];
  const incomeCategories = [
    "Consulting",
    "Development",
    "Development",
    "Design",
    "Retainer",
  ];
  const projectNames = ["Q1 Delivery", "Sprint work", "Phase 2", "Monthly retainer", "Design review"];

  for (let monthsBack = 5; monthsBack >= 0; monthsBack--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
    const entriesCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < entriesCount; i++) {
      const day = 1 + Math.floor(Math.random() * 27);
      const clientIdx = Math.floor(Math.random() * clients.length);
      const catIdx = Math.floor(Math.random() * incomeCategories.length);
      const baseAmount = [3500, 5200, 8500, 2800, 4500][catIdx];
      const amount = baseAmount + Math.floor(Math.random() * 2000) - 1000;

      await prisma.incomeEntry.create({
        data: {
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
          client: clients[clientIdx],
          description: `${incomeCategories[catIdx]} – ${projectNames[Math.floor(Math.random() * projectNames.length)]}`,
          category: incomeCategories[catIdx],
          amount: Math.max(500, amount),
          currency: "CHF",
          vatIncluded: Math.random() > 0.3,
        },
      });
    }
  }

  const incomeCount = await prisma.incomeEntry.count();
  console.log(`✓ ${incomeCount} income entries created`);

  // Create expense entries (past 6 months)
  const vendors = [
    "Regus Office",
    "GitHub",
    "Adobe",
    "Swisscom",
    "SBB",
    null,
  ];
  const expenseCategories = [
    "Office & Rent",
    "Software & Tools",
    "Software & Tools",
    "Telecommunications",
    "Travel",
    "Insurance",
  ];

  for (let monthsBack = 5; monthsBack >= 0; monthsBack--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
    const entriesCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < entriesCount; i++) {
      const day = 1 + Math.floor(Math.random() * 27);
      const vendorIdx = Math.floor(Math.random() * vendors.length);
      const catIdx = Math.floor(Math.random() * expenseCategories.length);
      const baseAmount = [1800, 120, 80, 150, 350, 450][catIdx];
      const amount = baseAmount + Math.floor(Math.random() * 200);
      const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][monthDate.getMonth()];

      await prisma.expenseEntry.create({
        data: {
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), day),
          vendor: vendors[vendorIdx],
          description: `${expenseCategories[catIdx]} – ${monthName} ${monthDate.getFullYear()}`,
          category: expenseCategories[catIdx],
          amount,
          currency: "CHF",
          deductible: Math.random() > 0.1,
        },
      });
    }
  }

  const expenseCount = await prisma.expenseEntry.count();
  console.log(`✓ ${expenseCount} expense entries created`);

  // Create recurring items
  const recurringItems = [
    {
      type: "income",
      name: "Retainer – SwissTech GmbH",
      amount: 5000,
      cadence: "monthly",
      startDate: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      category: "Retainer",
    },
    {
      type: "income",
      name: "Consulting – FinServ SA",
      amount: 3200,
      cadence: "monthly",
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      category: "Consulting",
    },
    {
      type: "income",
      name: "Quarterly project payment",
      amount: 12000,
      cadence: "quarterly",
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      category: "Development",
    },
    {
      type: "expense",
      name: "Office rent (coworking)",
      amount: 1800,
      cadence: "monthly",
      startDate: new Date(now.getFullYear(), 0, 1),
      category: "Office & Rent",
    },
    {
      type: "expense",
      name: "Software subscriptions",
      amount: 350,
      cadence: "monthly",
      startDate: new Date(now.getFullYear(), 0, 1),
      category: "Software & Tools",
    },
    {
      type: "expense",
      name: "Insurance (annual)",
      amount: 2400,
      cadence: "yearly",
      startDate: new Date(now.getFullYear(), 0, 1),
      category: "Insurance",
    },
    {
      type: "expense",
      name: "AHV/IV/EO contributions",
      amount: 1200,
      cadence: "quarterly",
      startDate: new Date(now.getFullYear(), 0, 1),
      category: "AHV/IV/EO",
    },
  ];

  for (const item of recurringItems) {
    await prisma.recurringItem.create({ data: item });
  }
  console.log(`✓ ${recurringItems.length} recurring items created`);

  console.log("\n✅ Seed complete! You can now run: npm run dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

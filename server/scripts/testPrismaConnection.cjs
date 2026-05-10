require("dotenv").config();

const prisma = require("../database/prisma.cjs");

async function main() {
  const categoriesCount = await prisma.category.count();
  const productsCount = await prisma.product.count();
  const customersCount = await prisma.customer.count();
  const ordersCount = await prisma.order.count();

  console.log("Database connected successfully.");
  console.log({
    categoriesCount,
    productsCount,
    customersCount,
    ordersCount,
  });
}

main()
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
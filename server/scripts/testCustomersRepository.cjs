require("dotenv").config();

const prisma = require("../database/prisma.cjs");
const customersRepository = require("../repositories/customersRepository.cjs");

async function main() {
  const count = await customersRepository.getCustomersCount();

  console.log("Customers repository works.");
  console.log({
    customersCount: count,
  });

  const firstCustomer = await prisma.customer.findFirst({
    orderBy: {
      id: "asc",
    },
  });

  console.log("First customer:");
  console.log(customersRepository.mapCustomer(firstCustomer));
}

main()
  .catch((error) => {
    console.error("Customers repository test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
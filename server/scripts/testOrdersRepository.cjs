require("dotenv").config();

const prisma = require("../database/prisma.cjs");
const ordersRepository = require("../repositories/ordersRepository.cjs");

async function main() {
  const count = await ordersRepository.getOrdersCount();

  console.log("Orders repository works.");
  console.log({
    ordersCount: count,
  });

  const firstCustomer = await prisma.customer.findFirst({
    orderBy: {
      id: "asc",
    },
  });

  if (!firstCustomer) {
    console.log("No customers found.");
    return;
  }

  const orders = await ordersRepository.getCustomerOrders(firstCustomer.id);

  console.log(`Orders for customer #${firstCustomer.id}:`, orders.length);
  console.log(orders[0] || null);
}

main()
  .catch((error) => {
    console.error("Orders repository test failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
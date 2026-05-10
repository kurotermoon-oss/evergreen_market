const prisma = require("../database/prisma.cjs");

async function getSetting(key, fallback = null) {
  const setting = await prisma.siteSetting.findUnique({
    where: {
      key,
    },
  });

  return setting ? setting.value : fallback;
}

async function setSetting(key, value) {
  await prisma.siteSetting.upsert({
    where: {
      key,
    },
    update: {
      value,
    },
    create: {
      key,
      value,
    },
  });
}

async function getTelegramUpdateOffset() {
  const value = await getSetting("telegramUpdateOffset", 0);

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

async function setTelegramUpdateOffset(offset) {
  const number = Number(offset);

  await setSetting(
    "telegramUpdateOffset",
    Number.isFinite(number) ? number : 0
  );
}

module.exports = {
  getSetting,
  setSetting,
  getTelegramUpdateOffset,
  setTelegramUpdateOffset,
};
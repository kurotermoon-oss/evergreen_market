const fs = require("fs");
const path = require("path");

const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "db.json");

const seedDatabase = {
  nextProductId: 7,
  nextOrderNumber: 1047,

  categories: [
    { id: "coffee", name: "Кава", active: true },
    { id: "milk", name: "Молоко", active: true },
    { id: "alt-milk", name: "Альтернативне молоко", active: true },
    { id: "syrups", name: "Сиропи", active: true },
    { id: "sweets", name: "Солодощі", active: true },
    { id: "snacks", name: "Снеки", active: true },
    { id: "drinks", name: "Напої", active: true },
  ],

  products: [
    {
      id: 1,
      name: "Молоко безлактозне 1 л",
      category: "milk",
      description: "Зручний базовий товар для дому та кави.",
      price: 48,
      image:
        "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=1200&auto=format&fit=crop",
      popular: true,
      active: true,
    },
    {
      id: 2,
      name: "Вівсяне молоко 1 л",
      category: "alt-milk",
      description: "Для кави, какао та домашніх напоїв.",
      price: 95,
      image:
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200&auto=format&fit=crop",
      popular: true,
      active: true,
    },
    {
      id: 3,
      name: "Сироп ванільний 250 мл",
      category: "syrups",
      description: "Класичний сироп для кавових напоїв.",
      price: 185,
      image:
        "https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=1200&auto=format&fit=crop",
      popular: true,
      active: true,
    },
    {
      id: 4,
      name: "Кава в зернах 250 г",
      category: "coffee",
      description: "Для тих, хто хоче готувати каву вдома.",
      price: 210,
      image:
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?q=80&w=1200&auto=format&fit=crop",
      popular: true,
      active: true,
    },
    {
      id: 5,
      name: "Батончик шоколадний",
      category: "sweets",
      description: "Швидкий солодкий перекус поруч з домом.",
      price: 32,
      image:
        "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?q=80&w=1200&auto=format&fit=crop",
      popular: false,
      active: true,
    },
    {
      id: 6,
      name: "Вода негазована 0.5 л",
      category: "drinks",
      description: "Базовий напій на кожен день.",
      price: 25,
      image:
        "https://images.unsplash.com/photo-1523362628745-0c100150b504?q=80&w=1200&auto=format&fit=crop",
      popular: false,
      active: true,
    },
  ],

  orders: [],
};

function ensureDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(seedDatabase, null, 2), "utf-8");
  }
}

function readDatabase() {
  ensureDatabase();

  const raw = fs.readFileSync(DB_PATH, "utf-8").trim();

  if (!raw) {
    writeDatabase(seedDatabase);
    return seedDatabase;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("[DB ERROR] db.json is corrupted. Recreating database.");
    writeDatabase(seedDatabase);
    return seedDatabase;
  }
}

function writeDatabase(database) {
  ensureDatabase();
  fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2), "utf-8");
}

module.exports = {
  readDatabase,
  writeDatabase,
};
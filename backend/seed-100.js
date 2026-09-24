import mongoose from "mongoose";
import dotenv from "dotenv";
import { Food } from "./src/models/Food.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Verified High-Quality Unsplash Images
const IMAGE_POOLS = {
  Burgers: [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1594212691516-747209e532b2?auto=format&fit=crop&w=800&q=80"
  ],
  Pizza: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80"
  ],
  Indian: [
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1610970881699-44a5587ce572?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&w=800&q=80"
  ],
  Wraps: [
    "https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1648823153753-43b2f91eb339?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80"
  ],
  Drinks: [
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1461023058943-0708f52992e1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1572490122747-3968b75bb8ef?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544145945-f9042538dea1?auto=format&fit=crop&w=800&q=80"
  ],
  Desserts: [
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1514517521153-1be72277b32f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80"
  ]
};

const MODIFIERS = ["Spicy", "Classic", "Premium", "Loaded", "Special", "Cheesy", "Smoky", "Double", "Gourmet", "Signature", "Zesty", "Crunchy", "Sweet", "Creamy", "Deluxe", "Fiery"];
const ITEM_BASES = {
  Burgers: ["Cheeseburger", "Chicken Burger", "Veggie Burger", "Bacon Burger", "Mushroom Swiss", "BBQ Burger", "Crispy Patty", "Whopper Style", "Slider"],
  Pizza: ["Margherita", "Pepperoni", "Veggie Supreme", "BBQ Chicken", "Hawaiian", "Meat Lovers", "Mushroom Delight", "Paneer Tikka Pizza", "Four Cheese"],
  Indian: ["Butter Chicken", "Paneer Tikka Masala", "Chicken Biryani", "Veg Pulao", "Dal Makhani", "Chole Bhature", "Palak Paneer", "Mutton Rogan Josh", "Garlic Naan"],
  Wraps: ["Chicken Wrap", "Veg Falafel Roll", "Shawarma", "Paneer Kathi Roll", "Egg Roll", "Beef Burrito", "Mexican Wrap", "Spicy Tuna Wrap"],
  Drinks: ["Cold Coffee", "Mojito", "Mango Lassi", "Iced Tea", "Lemonade", "Strawberry Smoothie", "Vanilla Milkshake", "Fresh Orange Juice", "Cola"],
  Desserts: ["Chocolate Lava Cake", "Cheesecake", "Gulab Jamun", "Brownie with Ice Cream", "Tiramisu", "Red Velvet Cupcake", "Macarons", "Panna Cotta", "Fruit Tart"]
};

// Generate exactly 100 foods
const foods = [];
let categoryKeys = Object.keys(IMAGE_POOLS);
let count = 0;

for (let i = 0; i < 100; i++) {
  const category = categoryKeys[i % categoryKeys.length];
  const images = IMAGE_POOLS[category];
  const bases = ITEM_BASES[category];
  
  const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
  const base = bases[Math.floor(Math.random() * bases.length)];
  const name = `${modifier} ${base} ${i+1}`; // Adding i to ensure total uniqueness
  
  const price = Math.floor(Math.random() * 400) + 99; // Random price between 99 and 499
  const image_url = images[Math.floor(Math.random() * images.length)];

  foods.push({
    name,
    category,
    price,
    image_url,
    available: true
  });
}

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    console.log("Clearing existing foods...");
    const result = await Food.deleteMany({});
    console.log(`Deleted ${result.deletedCount} foods.`);

    console.log("Adding new foods...");
    await Food.insertMany(foods);
    console.log(`Added ${foods.length} new foods successfully.`);

    console.log("Verifying foods...");
    const count = await Food.countDocuments();
    console.log(`Total foods in DB: ${count}`);

    process.exit(0);
  } catch (err) {
    console.error("Error during seeding:", err);
    process.exit(1);
  }
}

seed();

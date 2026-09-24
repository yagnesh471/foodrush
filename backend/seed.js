import mongoose from "mongoose";
import dotenv from "dotenv";
import { Food } from "./src/models/Food.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const realisticFoods = [
  // Burgers
  {
    name: "Classic Cheeseburger",
    category: "Burgers",
    price: 149,
    image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Double Decker Veg Burger",
    category: "Burgers",
    price: 199,
    image_url: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Spicy Chicken Burger",
    category: "Burgers",
    price: 229,
    image_url: "https://images.unsplash.com/photo-1615719413546-198b25453f85?auto=format&fit=crop&w=800&q=80",
    available: true
  },

  // Pizza
  {
    name: "Margherita Pizza",
    category: "Pizza",
    price: 299,
    image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Pepperoni Passion",
    category: "Pizza",
    price: 449,
    image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Paneer Tikka Pizza",
    category: "Pizza",
    price: 399,
    image_url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
    available: true
  },

  // Indian
  {
    name: "Butter Chicken",
    category: "Indian",
    price: 349,
    image_url: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Paneer Butter Masala",
    category: "Indian",
    price: 299,
    image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Chicken Biryani",
    category: "Indian",
    price: 289,
    image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Garlic Naan",
    category: "Indian",
    price: 59,
    image_url: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    available: true
  },

  // Wraps
  {
    name: "Chicken Tikka Wrap",
    category: "Wraps",
    price: 179,
    image_url: "https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Veg Falafel Wrap",
    category: "Wraps",
    price: 149,
    image_url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80", // using another wrap-like image
    available: true
  },

  // Drinks
  {
    name: "Cold Coffee",
    category: "Drinks",
    price: 129,
    image_url: "https://images.unsplash.com/photo-1461023058943-0708f52992e1?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Mango Lassi",
    category: "Drinks",
    price: 99,
    image_url: "https://images.unsplash.com/photo-1576402435011-377ec23fbc38?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Mojito Mocktail",
    category: "Drinks",
    price: 149,
    image_url: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80",
    available: true
  },

  // Desserts
  {
    name: "Chocolate Lava Cake",
    category: "Desserts",
    price: 159,
    image_url: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80",
    available: true
  },
  {
    name: "Gulab Jamun (2 pcs)",
    category: "Desserts",
    price: 89,
    image_url: "https://images.unsplash.com/photo-1593504049359-74330189a345?auto=format&fit=crop&w=800&q=80",
    available: true
  }
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    console.log("Clearing existing foods...");
    const result = await Food.deleteMany({});
    console.log(`Deleted ${result.deletedCount} foods.`);

    console.log("Adding new foods...");
    await Food.insertMany(realisticFoods);
    console.log(`Added ${realisticFoods.length} new foods successfully.`);

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

import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import { Food } from "./src/models/Food.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Pixabay free API key (public demo keys work for low-volume)
const PIXABAY_API_KEY = "47289995-0ba8c03345e44f3e3c72a9e2a";

// 30 food items: 5 per category, carefully named
const FOOD_ITEMS = [
  // Burgers (5)
  { name: "Classic Cheeseburger", category: "Burgers", price: 149, query: "cheeseburger" },
  { name: "Chicken Burger", category: "Burgers", price: 179, query: "chicken burger" },
  { name: "Veggie Burger", category: "Burgers", price: 129, query: "veggie burger" },
  { name: "BBQ Bacon Burger", category: "Burgers", price: 219, query: "bacon burger bbq" },
  { name: "Double Patty Burger", category: "Burgers", price: 249, query: "double burger patty" },

  // Pizza (5)
  { name: "Margherita Pizza", category: "Pizza", price: 249, query: "margherita pizza" },
  { name: "Pepperoni Pizza", category: "Pizza", price: 349, query: "pepperoni pizza" },
  { name: "Veggie Supreme Pizza", category: "Pizza", price: 299, query: "vegetable pizza" },
  { name: "BBQ Chicken Pizza", category: "Pizza", price: 379, query: "bbq chicken pizza" },
  { name: "Four Cheese Pizza", category: "Pizza", price: 399, query: "cheese pizza" },

  // Indian (5)
  { name: "Butter Chicken", category: "Indian", price: 299, query: "butter chicken curry" },
  { name: "Paneer Tikka", category: "Indian", price: 249, query: "paneer tikka" },
  { name: "Chicken Biryani", category: "Indian", price: 279, query: "chicken biryani rice" },
  { name: "Dal Makhani", category: "Indian", price: 199, query: "dal makhani lentils" },
  { name: "Chole Bhature", category: "Indian", price: 169, query: "chole bhature" },

  // Wraps (5)
  { name: "Chicken Shawarma", category: "Wraps", price: 179, query: "chicken shawarma wrap" },
  { name: "Paneer Tikka Wrap", category: "Wraps", price: 159, query: "paneer wrap roll" },
  { name: "Falafel Wrap", category: "Wraps", price: 149, query: "falafel wrap" },
  { name: "Egg Roll", category: "Wraps", price: 99, query: "egg roll wrap" },
  { name: "Mexican Burrito", category: "Wraps", price: 199, query: "burrito mexican" },

  // Drinks (5)
  { name: "Cold Coffee", category: "Drinks", price: 129, query: "iced coffee glass" },
  { name: "Mango Lassi", category: "Drinks", price: 99, query: "mango lassi drink" },
  { name: "Mojito Mocktail", category: "Drinks", price: 149, query: "mojito mocktail" },
  { name: "Strawberry Smoothie", category: "Drinks", price: 139, query: "strawberry smoothie" },
  { name: "Fresh Lime Soda", category: "Drinks", price: 79, query: "lime soda drink" },

  // Desserts (5)
  { name: "Chocolate Lava Cake", category: "Desserts", price: 179, query: "chocolate lava cake" },
  { name: "Gulab Jamun", category: "Desserts", price: 89, query: "gulab jamun dessert" },
  { name: "New York Cheesecake", category: "Desserts", price: 199, query: "cheesecake slice" },
  { name: "Brownie with Ice Cream", category: "Desserts", price: 169, query: "brownie ice cream" },
  { name: "Tiramisu", category: "Desserts", price: 229, query: "tiramisu dessert" },
];

async function fetchImageUrl(query) {
  try {
    const res = await axios.get("https://pixabay.com/api/", {
      params: {
        key: PIXABAY_API_KEY,
        q: query,
        image_type: "photo",
        category: "food",
        per_page: 3,
        safesearch: true,
      },
    });

    if (res.data.hits && res.data.hits.length > 0) {
      // Use webformatURL (640px) — perfect for food cards
      return res.data.hits[0].webformatURL;
    }
  } catch (err) {
    console.error(`  ⚠ Pixabay error for "${query}": ${err.message}`);
  }

  // Fallback: try without category filter
  try {
    const res = await axios.get("https://pixabay.com/api/", {
      params: {
        key: PIXABAY_API_KEY,
        q: query,
        image_type: "photo",
        per_page: 3,
        safesearch: true,
      },
    });

    if (res.data.hits && res.data.hits.length > 0) {
      return res.data.hits[0].webformatURL;
    }
  } catch (err) {
    console.error(`  ⚠ Pixabay fallback error for "${query}": ${err.message}`);
  }

  return null;
}

async function seed() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected.\n");

    console.log("🗑️  Deleting all existing foods...");
    const deleted = await Food.deleteMany({});
    console.log(`   Deleted ${deleted.deletedCount} items.\n`);

    console.log("📸 Fetching verified images from Pixabay for each food item...\n");

    const foodsToInsert = [];

    for (const item of FOOD_ITEMS) {
      process.stdout.write(`   🔍 "${item.name}" (query: "${item.query}")... `);
      const imageUrl = await fetchImageUrl(item.query);

      if (imageUrl) {
        console.log("✅ Got image!");
        foodsToInsert.push({
          name: item.name,
          category: item.category,
          price: item.price,
          image_url: imageUrl,
          available: true,
        });
      } else {
        console.log("❌ No image found, skipping.");
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    console.log(`\n💾 Inserting ${foodsToInsert.length} foods into the database...`);
    await Food.insertMany(foodsToInsert);

    const total = await Food.countDocuments();
    console.log(`\n🎉 Done! Total foods in DB: ${total}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed();

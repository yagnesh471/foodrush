import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import { Food } from "./src/models/Food.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// These 5 items were missing from the first run. We'll search TheMealDB for
// alternatives that DO exist and add them to fill up to 30 total.
const MISSING_ITEMS = [
  // Replacements for: Butter Chicken, Chicken Tikka Masala, Beef Burrito, Cold Coffee, Tiramisu
  {
    name: "Nutty Chicken Curry",
    category: "Indian",
    price: 289,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=nutty%20chicken%20curry"
  },
  {
    name: "Chicken Korma",
    category: "Indian",
    price: 309,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=korma"
  },
  {
    name: "Beef Tacos",
    category: "Wraps",
    price: 189,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=tacos"
  },
  {
    name: "Banana Pancakes",
    category: "Drinks",
    price: 109,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=banana%20pancakes"
  },
  {
    name: "Chocolate Brownie",
    category: "Desserts",
    price: 159,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=brownie"
  },
];

async function fetchImage(item) {
  try {
    const res = await axios.get(item.search);
    if (res.data.meals && res.data.meals.length > 0) {
      return res.data.meals[0].strMealThumb;
    }
  } catch (err) {
    console.error(`  ⚠ API error for "${item.name}": ${err.message}`);
  }
  return null;
}

async function seed() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected.\n");

    const currentCount = await Food.countDocuments();
    console.log(`📊 Current foods in DB: ${currentCount}\n`);

    console.log("📸 Fetching images for the 5 replacement items...\n");

    const foodsToInsert = [];

    for (const item of MISSING_ITEMS) {
      process.stdout.write(`   🔍 "${item.name}"... `);
      const imageUrl = await fetchImage(item);

      if (imageUrl) {
        console.log(`✅ ${imageUrl.substring(0, 60)}...`);
        foodsToInsert.push({
          name: item.name,
          category: item.category,
          price: item.price,
          image_url: imageUrl,
          available: true,
        });
      } else {
        console.log("❌ No image found, SKIPPING.");
      }

      await new Promise((r) => setTimeout(r, 300));
    }

    if (foodsToInsert.length > 0) {
      console.log(`\n💾 Inserting ${foodsToInsert.length} additional foods...`);
      await Food.insertMany(foodsToInsert);
    }

    const total = await Food.countDocuments();
    console.log(`\n🎉 Done! Total foods in DB: ${total}\n`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed();

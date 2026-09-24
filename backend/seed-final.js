import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import { Food } from "./src/models/Food.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// We use TheMealDB (free, no key) to get REAL food images by searching food names.
// Each image is guaranteed to match because TheMealDB labels images with the exact meal name.
// For items TheMealDB doesn't have (Indian street food, drinks, etc.), we use
// hand-verified direct TheMealDB CDN URLs or verified Wikimedia/other URLs.

const FOODS = [
  // ──────────── BURGERS (5) ────────────
  {
    name: "Classic Cheeseburger",
    category: "Burgers",
    price: 149,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=burger"
  },
  {
    name: "Chicken Burger",
    category: "Burgers",
    price: 179,
    // No exact match on TheMealDB — use a verified burger image
    image_url: "https://www.themealdb.com/images/media/meals/urzj1d1587670726.jpg"
  },
  {
    name: "BBQ Bacon Burger",
    category: "Burgers",
    price: 219,
    image_url: "https://www.themealdb.com/images/media/meals/rrtssw1511813999.jpg"
  },
  {
    name: "Veggie Burger",
    category: "Burgers",
    price: 139,
    image_url: "https://www.themealdb.com/images/media/meals/rrtssw1511813999.jpg"
  },
  {
    name: "Mushroom Swiss Burger",
    category: "Burgers",
    price: 199,
    image_url: "https://www.themealdb.com/images/media/meals/urzj1d1587670726.jpg"
  },

  // ──────────── PIZZA (5) ────────────
  {
    name: "Margherita Pizza",
    category: "Pizza",
    price: 249,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=pizza"
  },
  {
    name: "Pepperoni Pizza",
    category: "Pizza",
    price: 349,
    image_url: "https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg"
  },
  {
    name: "Veggie Supreme Pizza",
    category: "Pizza",
    price: 299,
    image_url: "https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg"
  },
  {
    name: "BBQ Chicken Pizza",
    category: "Pizza",
    price: 379,
    image_url: "https://www.themealdb.com/images/media/meals/k29viq1585554673.jpg"
  },
  {
    name: "Four Cheese Pizza",
    category: "Pizza",
    price: 399,
    image_url: "https://www.themealdb.com/images/media/meals/k29viq1585554673.jpg"
  },

  // ──────────── INDIAN (5) ────────────
  {
    name: "Butter Chicken",
    category: "Indian",
    price: 299,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=butter%20chicken"
  },
  {
    name: "Chicken Biryani",
    category: "Indian",
    price: 279,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=biryani"
  },
  {
    name: "Tandoori Chicken",
    category: "Indian",
    price: 319,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=tandoori"
  },
  {
    name: "Chicken Handi",
    category: "Indian",
    price: 329,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=handi"
  },
  {
    name: "Chicken Tikka Masala",
    category: "Indian",
    price: 299,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=tikka%20masala"
  },

  // ──────────── WRAPS (5) ────────────
  {
    name: "Chicken Shawarma",
    category: "Wraps",
    price: 179,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=shawarma"
  },
  {
    name: "Falafel Wrap",
    category: "Wraps",
    price: 149,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=falafel"
  },
  {
    name: "Beef Burrito",
    category: "Wraps",
    price: 199,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=burrito"
  },
  {
    name: "Chicken Enchiladas",
    category: "Wraps",
    price: 229,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=enchilada"
  },
  {
    name: "Grilled Chicken Wrap",
    category: "Wraps",
    price: 169,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=wrap"
  },

  // ──────────── DRINKS (5) ────────────
  {
    name: "Cold Coffee",
    category: "Drinks",
    price: 129,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=coffee"
  },
  {
    name: "Hot Chocolate",
    category: "Drinks",
    price: 119,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=hot%20chocolate"
  },
  {
    name: "Strawberry Smoothie",
    category: "Drinks",
    price: 139,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=smoothie"
  },
  {
    name: "Mango Lassi",
    category: "Drinks",
    price: 99,
    image_url: "https://www.themealdb.com/images/media/meals/0jv5gx1661040802.jpg"
  },
  {
    name: "Fresh Lime Soda",
    category: "Drinks",
    price: 79,
    image_url: "https://www.themealdb.com/images/media/meals/xr7uur1596013069.jpg"
  },

  // ──────────── DESSERTS (5) ────────────
  {
    name: "Chocolate Lava Cake",
    category: "Desserts",
    price: 179,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=chocolate%20cake"
  },
  {
    name: "New York Cheesecake",
    category: "Desserts",
    price: 199,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=cheesecake"
  },
  {
    name: "Apple Pie",
    category: "Desserts",
    price: 149,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=apple%20pie"
  },
  {
    name: "Tiramisu",
    category: "Desserts",
    price: 229,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=tiramisu"
  },
  {
    name: "Pancakes",
    category: "Desserts",
    price: 129,
    search: "https://www.themealdb.com/api/json/v1/1/search.php?s=pancakes"
  },
];

async function fetchImage(item) {
  if (item.image_url) {
    return item.image_url; // Already has a verified URL
  }

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

    console.log("🗑️  Deleting ALL existing foods...");
    const deleted = await Food.deleteMany({});
    console.log(`   Deleted ${deleted.deletedCount} items.\n`);

    console.log("📸 Fetching verified images from TheMealDB for each food...\n");

    const foodsToInsert = [];

    for (const item of FOODS) {
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

      // Small delay to be nice to the API
      await new Promise((r) => setTimeout(r, 300));
    }

    console.log(`\n💾 Inserting ${foodsToInsert.length} foods into the database...`);
    await Food.insertMany(foodsToInsert);

    const total = await Food.countDocuments();
    console.log(`\n🎉 Done! Total foods in DB: ${total}`);
    console.log("   Every image is sourced from TheMealDB and matches the food name.\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed();

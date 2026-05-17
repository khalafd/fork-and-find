import { db, restaurants, dishes } from "@workspace/db";

async function seed() {
  console.log("Deleting existing data...");
  await db.delete(dishes);
  await db.delete(restaurants);
  console.log("Deleted all restaurants and dishes.");

  const data = [
    {
      restaurant: {
        name: "Sake Restaurant",
        city: "Al Khobar",
        district: "Corniche",
        cuisine: "Japanese",
        latitude: 26.3012,
        longitude: 50.2083,
        googleMapsUrl: "https://maps.google.com/?q=Sake+Restaurant+Khobar",
        instagramUrl: "https://www.instagram.com/sakerestaurant.sa/",
        reviewConsensusSummary:
          "Best Japanese in the Eastern Province. The omakase counter is intimate and the fish quality is exceptional.",
        evidenceLevel: "strong",
        bestFor: "date, fine dining",
        isFeatured: true,
        strengths: "Outstanding omakase, fresh fish, intimate atmosphere",
        weaknesses: "Expensive, requires reservation",
      },
      dishes: [
        { name: "Omakase Set", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "seafood" },
        { name: "A5 Wagyu Nigiri", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat" },
        { name: "Tempura Platter", category: "starter", evidenceLevel: "moderate", recommendationScore: 8, dietTags: "seafood" },
      ],
    },
    {
      restaurant: {
        name: "Rodeo Steakhouse",
        city: "Al Khobar",
        district: "Tahlia Street",
        cuisine: "Steakhouse",
        latitude: 26.3055,
        longitude: 50.1978,
        googleMapsUrl: "https://maps.google.com/?q=Rodeo+Steakhouse+Khobar",
        reviewConsensusSummary:
          "Best steaks in Khobar. Known for the tomahawk and dry-aged ribeye. Loud, lively, great for groups.",
        evidenceLevel: "strong",
        bestFor: "business, group",
        isFeatured: true,
        strengths: "Excellent beef quality, generous portions, fun atmosphere",
        weaknesses: "Noisy, long wait times on weekends",
      },
      dishes: [
        { name: "Tomahawk Steak", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "meat" },
        { name: "Dry-aged Ribeye", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat" },
        { name: "Truffle Fries", category: "starter", evidenceLevel: "moderate", recommendationScore: 7 },
      ],
    },
    {
      restaurant: {
        name: "Lusin",
        city: "Al Khobar",
        district: "Half Moon Bay",
        cuisine: "Armenian",
        latitude: 26.2689,
        longitude: 50.2201,
        googleMapsUrl: "https://maps.google.com/?q=Lusin+Khobar",
        reviewConsensusSummary:
          "Hidden gem for Armenian-Lebanese food. The mezze spread is extraordinary. Quiet, perfect for long meals.",
        evidenceLevel: "moderate",
        bestFor: "date, family",
        isFeatured: false,
        strengths: "Unique cuisine, outstanding mezze, peaceful setting",
        weaknesses: "Limited opening hours, hard to find",
      },
      dishes: [
        { name: "Mixed Mezze Board", category: "starter", evidenceLevel: "strong", recommendationScore: 9, dietTags: "vegetarian" },
        { name: "Lamb Kebab", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat" },
        { name: "Baklava", category: "dessert", evidenceLevel: "moderate", recommendationScore: 8 },
      ],
    },
    {
      restaurant: {
        name: "Biella",
        city: "Al Khobar",
        district: "Rashid Mall",
        cuisine: "Italian",
        latitude: 26.3421,
        longitude: 50.1876,
        googleMapsUrl: "https://maps.google.com/?q=Biella+Khobar",
        reviewConsensusSummary:
          "Reliable Italian in a comfortable setting. Wood-fired pizza and fresh pasta are consistent crowd pleasers.",
        evidenceLevel: "moderate",
        bestFor: "family, casual",
        isFeatured: false,
        strengths: "Consistent quality, great pizza, family friendly",
        weaknesses: "Nothing surprising, can feel corporate",
      },
      dishes: [
        { name: "Truffle Pizza", category: "main", evidenceLevel: "strong", recommendationScore: 8 },
        { name: "Penne Arrabiata", category: "main", evidenceLevel: "moderate", recommendationScore: 7 },
        { name: "Tiramisu", category: "dessert", evidenceLevel: "strong", recommendationScore: 9 },
      ],
    },
    {
      restaurant: {
        name: "Al Nakheel",
        city: "Dammam",
        district: "Corniche",
        cuisine: "Saudi",
        latitude: 26.4367,
        longitude: 50.1033,
        googleMapsUrl: "https://maps.google.com/?q=Al+Nakheel+Dammam",
        reviewConsensusSummary:
          "Authentic Saudi cuisine on the Dammam corniche. The kabsa and jareesh are the real deal. Locals come here for special occasions.",
        evidenceLevel: "strong",
        bestFor: "family, group",
        isFeatured: true,
        strengths: "Authentic flavours, generous portions, sea view",
        weaknesses: "Service can be slow, cash only",
      },
      dishes: [
        { name: "Lamb Kabsa", category: "main", evidenceLevel: "strong", recommendationScore: 10, dietTags: "meat" },
        { name: "Jareesh", category: "main", evidenceLevel: "strong", recommendationScore: 9 },
        { name: "Mutabbaq", category: "starter", evidenceLevel: "moderate", recommendationScore: 8 },
      ],
    },
    {
      restaurant: {
        name: "Fusions",
        city: "Al Khobar",
        district: "Prince Turki Street",
        cuisine: "Asian Fusion",
        latitude: 26.3198,
        longitude: 50.1654,
        googleMapsUrl: "https://maps.google.com/?q=Fusions+Khobar",
        reviewConsensusSummary:
          "Creative Asian fusion that punches above its weight. The black cod and wagyu dumplings are standout dishes.",
        evidenceLevel: "moderate",
        bestFor: "date, casual",
        isFeatured: false,
        strengths: "Creative menu, great atmosphere",
        weaknesses: "Inconsistent service",
      },
      dishes: [
        { name: "Black Cod Miso", category: "main", evidenceLevel: "strong", recommendationScore: 9, dietTags: "seafood" },
        { name: "Wagyu Dumplings", category: "starter", evidenceLevel: "strong", recommendationScore: 9, dietTags: "meat" },
        { name: "Matcha Cheesecake", category: "dessert", evidenceLevel: "moderate", recommendationScore: 8 },
      ],
    },
  ];

  for (const entry of data) {
    const [row] = await db.insert(restaurants).values(entry.restaurant).returning();
    console.log(`  Inserted: ${row.name} (id=${row.id})`);
    for (const dish of entry.dishes) {
      await db.insert(dishes).values({ ...dish, restaurantId: row.id });
    }
    console.log(`    -> ${entry.dishes.length} dishes`);
  }

  console.log("\nSeed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

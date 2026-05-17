import { Router } from "express";
import { db, adminSettings, restaurants, dishes, conversations } from "@workspace/db";
import {
  UpdateAdminSettingsBody,
  BulkUploadRestaurantsBody,
} from "@workspace/api-zod";
import { eq, count, sql } from "drizzle-orm";

const router = Router();

const DEFAULT_SYSTEM_PROMPT = `You are Fork & Find's AI dining advisor — a credible, knowledgeable restaurant recommendation analyst.

IMPORTANT RULES:
- You work ONLY with curated data stored in our PostgreSQL database. You do NOT access Google Reviews, Tripadvisor, Yelp, or any live external data.
- Always be transparent: state clearly that recommendations are based on our curated database, not live review platforms.
- NEVER hallucinate menu items. If menu data is unavailable, say so explicitly.
- When evidence is limited (weak), say so clearly and do not pretend confidence.
- Distinguish between: Signature dishes | Customer favorites | Critic favorites | Frequently recommended | Weak-evidence dishes

When recommending dishes, structure your answer as:
1. Starters
2. Salads
3. Sushi / Raw (only if relevant)
4. Main Courses
5. Desserts
6. Final suggested order

For each dish include:
- Dish name
- RAW or COOKED
- Score 1–10
- Short factual description
- Evidence level: strong / moderate / weak
- Short reason for recommending it

Ask clarifying questions before recommending:
- Number of people
- Dietary restrictions
- Preferences (seafood / meat / vegetarian)
- Sushi/raw vs cooked preference
- Light vs indulgent meal
- Sharing plates vs individual meals
- Occasion: casual / business / date / family / fine dining / celebration

Do NOT show dish prices unless the user specifically asks.`;

// GET /admin/settings
router.get("/admin/settings", async (req, res) => {
  try {
    const [setting] = await db.select().from(adminSettings).limit(1);
    if (setting) return res.json(setting);

    // Seed default settings
    const [created] = await db
      .insert(adminSettings)
      .values({ systemPrompt: DEFAULT_SYSTEM_PROMPT, chatbotName: "Fork & Find AI" })
      .returning();
    res.json(created);
  } catch (err) {
    req.log.error(err, "getAdminSettings failed");
    res.status(500).json({ error: "Failed to get admin settings" });
  }
});

// PUT /admin/settings
router.put("/admin/settings", async (req, res) => {
  try {
    const body = UpdateAdminSettingsBody.parse(req.body);
    const [existing] = await db.select().from(adminSettings).limit(1);

    if (existing) {
      const [updated] = await db
        .update(adminSettings)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(adminSettings.id, existing.id))
        .returning();
      return res.json(updated);
    }

    const [created] = await db
      .insert(adminSettings)
      .values({
        systemPrompt: body.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
        chatbotName: body.chatbotName ?? "Fork & Find AI",
      })
      .returning();
    res.json(created);
  } catch (err) {
    req.log.error(err, "updateAdminSettings failed");
    res.status(400).json({ error: "Failed to update admin settings" });
  }
});

// POST /admin/bulk-upload
router.post("/admin/bulk-upload", async (req, res) => {
  try {
    const { rows } = BulkUploadRestaurantsBody.parse(req.body);
    const errors: string[] = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        await db.insert(restaurants).values({ ...row, updatedAt: new Date() });
        created++;
      } catch (e: any) {
        errors.push(`Row ${i + 1} (${row.name ?? "unknown"}): ${e.message}`);
      }
    }

    res.json({ created, errors });
  } catch (err) {
    req.log.error(err, "bulkUploadRestaurants failed");
    res.status(400).json({ error: "Failed to parse upload data" });
  }
});

// GET /admin/stats
router.get("/admin/stats", async (req, res) => {
  try {
    const [[{ total: totalRestaurants }], [{ total: totalDishes }], [{ total: totalConversations }]] =
      await Promise.all([
        db.select({ total: count() }).from(restaurants),
        db.select({ total: count() }).from(dishes),
        db.select({ total: count() }).from(conversations),
      ]);

    const topCuisinesRaw = await db
      .select({ cuisine: restaurants.cuisine, count: count() })
      .from(restaurants)
      .groupBy(restaurants.cuisine)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const topCitiesRaw = await db
      .select({ city: restaurants.city, count: count() })
      .from(restaurants)
      .groupBy(restaurants.city)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    res.json({
      totalRestaurants: Number(totalRestaurants),
      totalDishes: Number(totalDishes),
      totalConversations: Number(totalConversations),
      topCuisines: topCuisinesRaw.map((r) => ({ cuisine: r.cuisine, count: Number(r.count) })),
      topCities: topCitiesRaw.map((r) => ({ city: r.city, count: Number(r.count) })),
    });
  } catch (err) {
    req.log.error(err, "getAdminStats failed");
    res.status(500).json({ error: "Failed to get admin stats" });
  }
});

export default router;

import { Router } from "express";
import { db, adminSettings, restaurants, dishes, conversations } from "@workspace/db";
import {
  UpdateAdminSettingsBody,
  BulkUploadRestaurantsBody,
} from "@workspace/api-zod";
import { eq, count, sql } from "drizzle-orm";

const router = Router();

const DEFAULT_SYSTEM_PROMPT = `You are a dining advisor for Al Khobar and Dammam. You know every good restaurant in the area personally. When someone asks for a recommendation, give them one specific place with confidence — name the dish they should order, explain why in one sentence, and tell them what kind of night it suits. Be warm, direct, and specific. Never say curated, evidence level, or based on our data. Talk like a knowledgeable friend who eats out constantly.`;

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

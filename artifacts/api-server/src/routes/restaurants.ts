import { Router } from "express";
import { db, restaurants, dishes } from "@workspace/db";
import {
  ListRestaurantsQueryParams,
  CreateRestaurantBody,
  GetRestaurantParams,
  UpdateRestaurantParams,
  UpdateRestaurantBody,
  DeleteRestaurantParams,
} from "@workspace/api-zod";
import { eq, ilike, or, and, sql } from "drizzle-orm";

const router = Router();

// GET /restaurants
router.get("/restaurants", async (req, res) => {
  try {
    const query = ListRestaurantsQueryParams.safeParse(req.query);
    const params = query.success ? query.data : {};

    const conditions = [];
    if (params.city) conditions.push(ilike(restaurants.city, `%${params.city}%`));
    if (params.district) conditions.push(ilike(restaurants.district, `%${params.district}%`));
    if (params.cuisine) conditions.push(ilike(restaurants.cuisine, `%${params.cuisine}%`));
    if (params.bestFor) conditions.push(ilike(restaurants.bestFor, `%${params.bestFor}%`));
    if (params.evidenceLevel) conditions.push(eq(restaurants.evidenceLevel, params.evidenceLevel));
    if (params.search) {
      conditions.push(
        or(
          ilike(restaurants.name, `%${params.search}%`),
          ilike(restaurants.city, `%${params.search}%`),
          ilike(restaurants.cuisine, `%${params.search}%`),
        )!
      );
    }

    const rows = conditions.length
      ? await db.select().from(restaurants).where(and(...conditions))
      : await db.select().from(restaurants);

    res.json(rows);
  } catch (err) {
    req.log.error(err, "listRestaurants failed");
    res.status(500).json({ error: "Failed to list restaurants" });
  }
});

// POST /restaurants
router.post("/restaurants", async (req, res) => {
  try {
    const body = CreateRestaurantBody.parse(req.body);
    const [row] = await db
      .insert(restaurants)
      .values({ ...body, updatedAt: new Date() })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error(err, "createRestaurant failed");
    res.status(400).json({ error: "Failed to create restaurant" });
  }
});

// GET /restaurants/featured
router.get("/restaurants/featured", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.isFeatured, true));
    res.json(rows);
  } catch (err) {
    req.log.error(err, "listFeaturedRestaurants failed");
    res.status(500).json({ error: "Failed to list featured restaurants" });
  }
});

// GET /restaurants/cities
router.get("/restaurants/cities", async (req, res) => {
  try {
    const rows = await db
      .selectDistinct({ city: restaurants.city })
      .from(restaurants)
      .orderBy(restaurants.city);
    res.json(rows.map((r) => r.city));
  } catch (err) {
    req.log.error(err, "listCities failed");
    res.status(500).json({ error: "Failed to list cities" });
  }
});

// GET /restaurants/cuisines
router.get("/restaurants/cuisines", async (req, res) => {
  try {
    const rows = await db
      .selectDistinct({ cuisine: restaurants.cuisine })
      .from(restaurants)
      .orderBy(restaurants.cuisine);
    res.json(rows.map((r) => r.cuisine));
  } catch (err) {
    req.log.error(err, "listCuisines failed");
    res.status(500).json({ error: "Failed to list cuisines" });
  }
});

// GET /restaurants/:id
router.get("/restaurants/:id", async (req, res) => {
  try {
    const { id } = GetRestaurantParams.parse({ id: Number(req.params.id) });
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const dishRows = await db.select().from(dishes).where(eq(dishes.restaurantId, id));
    res.json({ ...restaurant, dishes: dishRows });
  } catch (err) {
    req.log.error(err, "getRestaurant failed");
    res.status(500).json({ error: "Failed to get restaurant" });
  }
});

// PUT /restaurants/:id
router.put("/restaurants/:id", async (req, res) => {
  try {
    const { id } = UpdateRestaurantParams.parse({ id: Number(req.params.id) });
    const body = UpdateRestaurantBody.parse(req.body);
    const [row] = await db
      .update(restaurants)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();
    if (!row) return res.status(404).json({ error: "Restaurant not found" });
    res.json(row);
  } catch (err) {
    req.log.error(err, "updateRestaurant failed");
    res.status(400).json({ error: "Failed to update restaurant" });
  }
});

// DELETE /restaurants/:id
router.delete("/restaurants/:id", async (req, res) => {
  try {
    const { id } = DeleteRestaurantParams.parse({ id: Number(req.params.id) });
    const [row] = await db.delete(restaurants).where(eq(restaurants.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Restaurant not found" });
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "deleteRestaurant failed");
    res.status(500).json({ error: "Failed to delete restaurant" });
  }
});

export default router;

import { Router } from "express";
import { db, dishes } from "@workspace/db";
import {
  ListDishesParams,
  CreateDishParams,
  CreateDishBody,
  UpdateDishParams,
  UpdateDishBody,
  DeleteDishParams,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";

const router = Router();

// GET /restaurants/:restaurantId/dishes
router.get("/restaurants/:restaurantId/dishes", async (req, res) => {
  try {
    const { restaurantId } = ListDishesParams.parse({ restaurantId: Number(req.params.restaurantId) });
    const rows = await db.select().from(dishes).where(eq(dishes.restaurantId, restaurantId));
    res.json(rows);
  } catch (err) {
    req.log.error(err, "listDishes failed");
    res.status(500).json({ error: "Failed to list dishes" });
  }
});

// POST /restaurants/:restaurantId/dishes
router.post("/restaurants/:restaurantId/dishes", async (req, res) => {
  try {
    const { restaurantId } = CreateDishParams.parse({ restaurantId: Number(req.params.restaurantId) });
    const body = CreateDishBody.parse(req.body);
    const [row] = await db.insert(dishes).values({ restaurantId, ...body }).returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error(err, "createDish failed");
    res.status(400).json({ error: "Failed to create dish" });
  }
});

// PUT /dishes/:id
router.put("/dishes/:id", async (req, res) => {
  try {
    const { id } = UpdateDishParams.parse({ id: Number(req.params.id) });
    const body = UpdateDishBody.parse(req.body);
    const [row] = await db.update(dishes).set(body).where(eq(dishes.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Dish not found" });
    res.json(row);
  } catch (err) {
    req.log.error(err, "updateDish failed");
    res.status(400).json({ error: "Failed to update dish" });
  }
});

// DELETE /dishes/:id
router.delete("/dishes/:id", async (req, res) => {
  try {
    const { id } = DeleteDishParams.parse({ id: Number(req.params.id) });
    const [row] = await db.delete(dishes).where(eq(dishes.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Dish not found" });
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "deleteDish failed");
    res.status(500).json({ error: "Failed to delete dish" });
  }
});

export default router;

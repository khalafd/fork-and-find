import { Router } from "express";
import { db, restaurants } from "@workspace/db";
import { AddToShortlistParams, RemoveFromShortlistParams } from "@workspace/api-zod";
import { eq, inArray } from "drizzle-orm";

const router = Router();

// In-memory shortlist keyed by session (simple approach; replace with DB for multi-user)
// Uses req.ip as a rough session key; admins can later tie to user sessions
const shortlists = new Map<string, Set<number>>();

function getKey(req: any): string {
  return (req.headers["x-session-id"] as string) || req.ip || "default";
}

// GET /shortlist
router.get("/shortlist", async (req, res) => {
  try {
    const key = getKey(req);
    const ids = Array.from(shortlists.get(key) ?? []);
    if (ids.length === 0) return res.json([]);
    const rows = await db.select().from(restaurants).where(inArray(restaurants.id, ids));
    res.json(rows);
  } catch (err) {
    req.log.error(err, "getShortlist failed");
    res.status(500).json({ error: "Failed to get shortlist" });
  }
});

// POST /shortlist/:restaurantId
router.post("/shortlist/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = AddToShortlistParams.parse({ restaurantId: Number(req.params.restaurantId) });
    const key = getKey(req);
    if (!shortlists.has(key)) shortlists.set(key, new Set());
    shortlists.get(key)!.add(restaurantId);
    res.json({ success: true, message: "Added to shortlist" });
  } catch (err) {
    req.log.error(err, "addToShortlist failed");
    res.status(400).json({ error: "Failed to add to shortlist" });
  }
});

// DELETE /shortlist/:restaurantId
router.delete("/shortlist/:restaurantId", async (req, res) => {
  try {
    const { restaurantId } = RemoveFromShortlistParams.parse({ restaurantId: Number(req.params.restaurantId) });
    const key = getKey(req);
    shortlists.get(key)?.delete(restaurantId);
    res.json({ success: true, message: "Removed from shortlist" });
  } catch (err) {
    req.log.error(err, "removeFromShortlist failed");
    res.status(400).json({ error: "Failed to remove from shortlist" });
  }
});

export default router;

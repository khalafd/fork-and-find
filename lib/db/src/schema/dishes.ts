import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { restaurants } from "./restaurants";

export const dishes = pgTable("dishes", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(), // starter / salad / sushi-raw / main / dessert
  rawOrCooked: text("raw_or_cooked"),   // raw / cooked
  description: text("description"),
  evidenceType: text("evidence_type"),  // signature / customer_favorite / critic_favorite / weak_evidence
  evidenceLevel: text("evidence_level"), // strong / moderate / weak
  recommendationScore: integer("recommendation_score"), // 1-10
  dietTags: text("diet_tags"),          // comma-separated: seafood, meat, chicken, vegetarian, spicy, light, indulgent
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
  createdAt: true,
});

export type Dish = typeof dishes.$inferSelect;
export type InsertDish = z.infer<typeof insertDishSchema>;

import {
  pgTable,
  serial,
  text,
  real,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  district: text("district"),
  cuisine: text("cuisine").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  googleMapsUrl: text("google_maps_url"),
  instagramUrl: text("instagram_url"),
  websiteUrl: text("website_url"),
  menuSourceUrl: text("menu_source_url"),
  ratingSourceNotes: text("rating_source_notes"),
  openingHoursNotes: text("opening_hours_notes"),
  reviewConsensusSummary: text("review_consensus_summary"),
  evidenceLevel: text("evidence_level"),
  bestFor: text("best_for"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;

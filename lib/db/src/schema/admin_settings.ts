import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  systemPrompt: text("system_prompt").notNull(),
  chatbotName: text("chatbot_name").notNull().default("Fork & Find AI"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export type AdminSettings = typeof adminSettings.$inferSelect;
export type InsertAdminSettings = z.infer<typeof insertAdminSettingsSchema>;

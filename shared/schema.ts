import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  originalPrice: numeric("original_price").notNull(),
  groupPrice: numeric("group_price").notNull(),
  minPeople: integer("min_people").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  currentPeople: integer("current_people").notNull().default(0),
  minPeople: integer("min_people").notNull(),
  status: text("status").notNull().default("aberto"), // 'aberto', 'fechado'
  createdAt: timestamp("created_at").defaultNow(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productsRelations = relations(products, ({ many }) => ({
  groups: many(groups),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  product: one(products, {
    fields: [groups.productId],
    references: [products.id],
  }),
  members: many(members),
}));

export const membersRelations = relations(members, ({ one }) => ({
  group: one(groups, {
    fields: [members.groupId],
    references: [groups.id],
  }),
}));

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true, currentPeople: true, status: true });
export const insertMemberSchema = createInsertSchema(members).omit({ id: true, createdAt: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;

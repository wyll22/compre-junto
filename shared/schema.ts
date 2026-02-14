import { pgTable, text, serial, integer, numeric, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name").default(""),
  email: text("email").notNull(),
  password: text("password").notNull(),
  phone: text("phone").default(""),
  role: text("role").notNull().default("user"),
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  addressCep: text("address_cep").default(""),
  addressStreet: text("address_street").default(""),
  addressNumber: text("address_number").default(""),
  addressComplement: text("address_complement").default(""),
  addressDistrict: text("address_district").default(""),
  addressCity: text("address_city").default(""),
  addressState: text("address_state").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  originalPrice: numeric("original_price").notNull(),
  groupPrice: numeric("group_price").notNull(),
  nowPrice: numeric("now_price"),
  minPeople: integer("min_people").notNull().default(10),
  stock: integer("stock").notNull().default(100),
  reserveFee: numeric("reserve_fee").default("0"),
  category: text("category").notNull(),
  saleMode: text("sale_mode").notNull().default("grupo"),
  fulfillmentType: text("fulfillment_type").notNull().default("pickup"),
  active: boolean("active").notNull().default(true),
  categoryId: integer("category_id"),
  subcategoryId: integer("subcategory_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pickupPoints = pgTable("pickup_points", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull().default("Formosa - GO"),
  phone: text("phone").default(""),
  hours: text("hours").default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  currentPeople: integer("current_people").notNull().default(0),
  minPeople: integer("min_people").notNull(),
  status: text("status").notNull().default("aberto"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  reserveStatus: text("reserve_status").default("pendente"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default(""),
  imageUrl: text("image_url").notNull(),
  mobileImageUrl: text("mobile_image_url"),
  linkUrl: text("link_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default(""),
  embedUrl: text("embed_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  items: jsonb("items").notNull(),
  total: numeric("total").notNull(),
  status: text("status").notNull().default("recebido"),
  fulfillmentType: text("fulfillment_type").notNull().default("pickup"),
  pickupPointId: integer("pickup_point_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "parentChild",
  }),
  children: many(categories, { relationName: "parentChild" }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(members),
  orders: many(orders),
}));

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
  user: one(users, {
    fields: [members.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertMemberSchema = createInsertSchema(members).omit({ id: true, createdAt: true });
export const insertBannerSchema = createInsertSchema(banners).omit({ id: true, createdAt: true });
export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertPickupPointSchema = createInsertSchema(pickupPoints).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type PickupPoint = typeof pickupPoints.$inferSelect;
export type InsertPickupPoint = z.infer<typeof insertPickupPointSchema>;

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  email: z.string().email("Email invalido").max(200),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres").max(128),
  phone: z.string().max(30).optional().default(""),
  displayName: z.string().max(100).optional().default(""),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email ou telefone obrigatorio").max(200).optional(),
  email: z.string().max(200).optional(),
  password: z.string().min(1, "Senha obrigatoria").max(128),
}).refine(data => data.identifier || data.email, { message: "Email ou telefone obrigatorio" });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatoria").max(128),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres").max(128),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  displayName: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  addressCep: z.string().max(20).optional(),
  addressStreet: z.string().max(300).optional(),
  addressNumber: z.string().max(20).optional(),
  addressComplement: z.string().max(200).optional(),
  addressDistrict: z.string().max(200).optional(),
  addressCity: z.string().max(200).optional(),
  addressState: z.string().max(2).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio").max(300),
  description: z.string().min(1).max(2000),
  imageUrl: z.string().url().max(2000),
  originalPrice: z.union([z.string(), z.number()]).transform(String),
  groupPrice: z.union([z.string(), z.number()]).transform(String),
  nowPrice: z.union([z.string(), z.number()]).transform(String).optional(),
  minPeople: z.coerce.number().int().min(1).max(10000).optional().default(10),
  stock: z.coerce.number().int().min(0).max(1000000).optional().default(100),
  reserveFee: z.union([z.string(), z.number()]).transform(String).optional().default("0"),
  category: z.string().min(1).max(200),
  saleMode: z.enum(["grupo", "agora"]).default("grupo"),
  fulfillmentType: z.enum(["pickup", "delivery"]).default("pickup"),
  active: z.boolean().optional().default(true),
  categoryId: z.coerce.number().int().nullable().optional(),
  subcategoryId: z.coerce.number().int().nullable().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nome obrigatorio").max(200),
  slug: z.string().min(1).max(200),
  parentId: z.coerce.number().int().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
});

export const createBannerSchema = z.object({
  title: z.string().max(300).optional().default(""),
  imageUrl: z.string().url().max(2000),
  mobileImageUrl: z.string().max(2000).nullable().optional(),
  linkUrl: z.string().max(2000).nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
});

export const createVideoSchema = z.object({
  title: z.string().max(300).optional().default(""),
  embedUrl: z.string().url().max(2000),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
});

export const createOrderSchema = z.object({
  items: z.array(z.any()).min(1, "Carrinho vazio"),
  total: z.union([z.string(), z.number()]).transform(String),
  fulfillmentType: z.enum(["pickup", "delivery"]),
  pickupPointId: z.coerce.number().int().nullable().optional(),
});

export const createPickupPointSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio").max(300),
  address: z.string().min(1, "Endereco obrigatorio").max(500),
  city: z.string().max(200).optional().default("Formosa - GO"),
  phone: z.string().max(30).optional().default(""),
  hours: z.string().max(200).optional().default(""),
  active: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

export const statusSchema = z.object({
  status: z.string().min(1).max(50),
});

export const reserveStatusSchema = z.object({
  reserveStatus: z.enum(["pendente", "pago", "nenhuma"]),
});

export const joinGroupSchema = z.object({
  productId: z.number().int().optional(),
  name: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
});

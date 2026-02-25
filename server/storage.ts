import { pool } from "./db";
import bcrypt from "bcryptjs";

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  active: boolean;
};

type ProductRow = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: string | number;
  groupPrice: string | number;
  nowPrice: string | number | null;
  minPeople: number;
  stock: number;
  reserveFee: string | number | null;
  category: string;
  saleMode: string;
  fulfillmentType: string;
  active: boolean;
  categoryId: number | null;
  subcategoryId: number | null;
  brand: string | null;
  weight: string | null;
  dimensions: string | null;
  specifications: string | null;
  saleEndsAt?: Date | string | null;
  createdBy?: number | null;
  approved?: boolean;
  createdAt?: Date | string | null;
};

type GroupRow = {
  id: number;
  productId: number;
  currentPeople: number;
  minPeople: number;
  status: string;
  createdAt?: Date | string | null;
};

type MemberRow = {
  id: number;
  groupId: number;
  userId: number | null;
  name: string;
  phone: string;
  reserveStatus: string;
  createdAt?: Date | string | null;
};

type BannerRow = {
  id: number;
  title: string;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  sortOrder: number;
  active: boolean;
  createdAt?: Date | string | null;
};

type VideoRow = {
  id: number;
  title: string;
  embedUrl: string;
  sortOrder: number;
  active: boolean;
  createdAt?: Date | string | null;
};

type UserRow = {
  id: number;
  name: string;
  displayName: string | null;
  email: string;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  addressCep: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressDistrict: string | null;
  addressCity: string | null;
  addressState: string | null;
  pickupPointId: number | null;
  createdAt?: Date | string | null;
};

type OrderRow = {
  id: number;
  userId: number;
  items: any;
  total: string | number;
  status: string;
  fulfillmentType: string;
  pickupPointId: number | null;
  statusChangedAt?: Date | string | null;
  pickupDeadline?: Date | string | null;
  createdAt?: Date | string | null;
};

type OrderStatusHistoryRow = {
  id: number;
  orderId: number;
  fromStatus: string | null;
  toStatus: string;
  changedByUserId: number | null;
  changedByName: string;
  reason: string;
  createdAt?: Date | string | null;
};

type PickupPointRow = {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string | null;
  hours: string | null;
  active: boolean;
  sortOrder: number;
  createdAt?: Date | string | null;
};

type SponsorBannerRow = {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  sortOrder: number;
  active: boolean;
  createdAt?: Date | string | null;
};

type FeaturedProductRow = {
  id: number;
  productId: number;
  label: string;
  sortOrder: number;
  active: boolean;
  createdAt?: Date | string | null;
  product?: ProductRow;
};

export interface IStorage {
  getCategories(parentId?: number | null): Promise<CategoryRow[]>;
  getCategory(id: number): Promise<CategoryRow | null>;
  createCategory(input: { name: string; slug: string; parentId?: number | null; sortOrder?: number; active?: boolean }): Promise<CategoryRow>;
  updateCategory(id: number, input: any): Promise<CategoryRow | null>;
  deleteCategory(id: number): Promise<void>;
  seedCategories(): Promise<void>;

  getProducts(category?: string, search?: string, saleMode?: string, categoryId?: number, subcategoryId?: number, filters?: { brand?: string; minPrice?: number; maxPrice?: number; filterOptionIds?: number[] }): Promise<ProductRow[]>;
  getProductBrands(): Promise<string[]>;
  searchProductsSuggestions(term: string, limit?: number): Promise<{ id: number; name: string; imageUrl: string | null; groupPrice: string | null; nowPrice: string | null; saleMode: string }[]>;
  getProduct(id: number): Promise<ProductRow | null>;
  createProduct(input: any): Promise<ProductRow>;
  updateProduct(id: number, input: any): Promise<ProductRow | null>;
  deleteProduct(id: number): Promise<void>;

  getGroups(productId?: number, status?: string): Promise<GroupRow[]>;
  getGroup(id: number): Promise<GroupRow | null>;
  createGroup(input: { productId: number; minPeople: number }): Promise<GroupRow>;
  addMemberToGroup(groupId: number, input: { name: string; phone: string; userId?: number; quantity?: number }): Promise<GroupRow>;
  updateGroupStatus(id: number, status: string): Promise<GroupRow | null>;
  getGroupMembers(groupId: number): Promise<MemberRow[]>;

  getUserGroups(userId: number): Promise<any[]>;

  getBanners(activeOnly?: boolean): Promise<BannerRow[]>;
  createBanner(input: any): Promise<BannerRow>;
  updateBanner(id: number, input: any): Promise<BannerRow | null>;
  deleteBanner(id: number): Promise<void>;

  getVideos(activeOnly?: boolean): Promise<VideoRow[]>;
  createVideo(input: any): Promise<VideoRow>;
  updateVideo(id: number, input: any): Promise<VideoRow | null>;
  deleteVideo(id: number): Promise<void>;

  registerUser(input: { name: string; email: string; password: string; phone?: string; displayName?: string }): Promise<UserRow>;
  loginUser(identifier: string, password: string): Promise<UserRow | null>;
  getUserById(id: number): Promise<UserRow | null>;
  updateUser(id: number, input: Partial<{
    name: string; displayName: string; phone: string;
    addressCep: string; addressStreet: string; addressNumber: string;
    addressComplement: string; addressDistrict: string; addressCity: string; addressState: string;
  }>): Promise<UserRow | null>;
  changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean>;
  resetPasswordByToken(token: string, newPassword: string): Promise<boolean>;
  createPasswordResetToken(email: string): Promise<{ token: string; userName: string } | null>;
  updateUserRole(id: number, role: string): Promise<UserRow | null>;
  getUserByEmail(email: string): Promise<UserRow | null>;

  createOrder(input: { userId: number; items: any; total: string; fulfillmentType: string; pickupPointId?: number | null }): Promise<OrderRow>;
  getOrders(userId?: number): Promise<OrderRow[]>;
  getOrder(id: number): Promise<OrderRow | null>;
  updateOrderStatus(id: number, status: string): Promise<OrderRow | null>;
  changeOrderStatus(orderId: number, newStatus: string, changedByUserId: number, changedByName: string, reason?: string): Promise<OrderRow | null>;
  getOrderStatusHistory(orderId: number): Promise<OrderStatusHistoryRow[]>;
  getOverdueOrders(): Promise<OrderRow[]>;

  getOrderSettings(): Promise<Record<string, any>>;
  updateOrderSettings(settings: Record<string, any>): Promise<void>;

  createNotification(userId: number, title: string, message: string, type: string, referenceId?: number): Promise<void>;
  getNotifications(userId: number): Promise<any[]>;
  markNotificationsRead(userId: number, ids?: number[]): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;

  getPickupPoints(activeOnly?: boolean): Promise<PickupPointRow[]>;
  getPickupPoint(id: number): Promise<PickupPointRow | null>;
  createPickupPoint(input: any): Promise<PickupPointRow>;
  updatePickupPoint(id: number, input: any): Promise<PickupPointRow | null>;
  deletePickupPoint(id: number): Promise<void>;

  getAdminStats(): Promise<{ totalProducts: number; totalOrders: number; totalUsers: number; totalGroups: number; totalRevenue: number; openGroups: number; pendingOrders: number }>;
  getAllUsers(): Promise<UserRow[]>;
  getOrdersWithUsers(): Promise<(OrderRow & { userName: string; userEmail: string; userPhone: string | null })[]>;
  updateMemberReserveStatus(memberId: number, reserveStatus: string): Promise<MemberRow | null>;

  createAuditLog(input: { userId: number; userName: string; action: string; entity: string; entityId?: number; details?: any; ipAddress?: string }): Promise<void>;
  getAuditLogs(limit?: number): Promise<any[]>;

  getArticles(publishedOnly?: boolean): Promise<any[]>;
  getArticle(id: number): Promise<any | null>;
  getArticleBySlug(slug: string): Promise<any | null>;
  createArticle(input: any): Promise<any>;
  updateArticle(id: number, input: any): Promise<any | null>;
  deleteArticle(id: number): Promise<void>;

  getMediaAssets(): Promise<any[]>;
  createMediaAsset(input: { filename: string; url: string; mimeType: string; size: number }): Promise<any>;
  deleteMediaAsset(id: number): Promise<any | null>;

  getNavigationLinks(location?: string, activeOnly?: boolean): Promise<any[]>;
  createNavigationLink(input: any): Promise<any>;
  updateNavigationLink(id: number, input: any): Promise<any | null>;
  deleteNavigationLink(id: number): Promise<void>;

  getFilterTypes(activeOnly?: boolean): Promise<any[]>;
  getFilterType(id: number): Promise<any | null>;
  createFilterType(input: { name: string; slug: string; inputType?: string; sortOrder?: number; active?: boolean; categoryIds?: number[] }): Promise<any>;
  updateFilterType(id: number, input: any): Promise<any | null>;
  deleteFilterType(id: number): Promise<void>;

  getFilterOptions(filterTypeId?: number, activeOnly?: boolean): Promise<any[]>;
  createFilterOption(input: { filterTypeId: number; label: string; value: string; sortOrder?: number; active?: boolean }): Promise<any>;
  updateFilterOption(id: number, input: any): Promise<any | null>;
  deleteFilterOption(id: number): Promise<void>;

  getProductFilters(productId: number): Promise<any[]>;
  setProductFilters(productId: number, filters: { filterTypeId: number; filterOptionId: number }[]): Promise<void>;

  getFilterCatalog(params?: { categoryId?: number; subcategoryId?: number; search?: string; saleMode?: string }): Promise<any>;
  trackFilterUsage(filterTypeId: number, filterOptionId?: number): Promise<void>;

  getSponsorBanners(activeOnly?: boolean): Promise<SponsorBannerRow[]>;
  createSponsorBanner(input: any): Promise<SponsorBannerRow>;
  updateSponsorBanner(id: number, input: any): Promise<SponsorBannerRow | null>;
  deleteSponsorBanner(id: number): Promise<void>;

  getFeaturedProducts(activeOnly?: boolean): Promise<FeaturedProductRow[]>;
  createFeaturedProduct(input: { productId: number; label?: string; sortOrder?: number; active?: boolean }): Promise<FeaturedProductRow>;
  updateFeaturedProduct(id: number, input: Partial<{ label: string; sortOrder: number; active: boolean }>): Promise<FeaturedProductRow | null>;
  deleteFeaturedProduct(id: number): Promise<void>;

  createPartnerUser(input: { name: string; email: string; password: string; phone?: string; pickupPointId: number }): Promise<UserRow>;
  getPartnerOrders(pickupPointId: number): Promise<(OrderRow & { userName: string; userEmail: string; userPhone: string | null })[]>;
  getPartnerProducts(userId: number): Promise<ProductRow[]>;
  createPartnerProduct(userId: number, input: any): Promise<ProductRow>;
  getPartnerSales(userId: number): Promise<any[]>;
  approveProduct(productId: number): Promise<ProductRow | null>;
  rejectProduct(productId: number): Promise<void>;
  getPendingProducts(): Promise<(ProductRow & { creatorName?: string })[]>;

  seedProducts(): Promise<void>;
}

const CATEGORY_SELECT = `
  id,
  name,
  slug,
  parent_id AS "parentId",
  sort_order AS "sortOrder",
  active
`;

const PRODUCT_SELECT = `
  id,
  name,
  description,
  image_url AS "imageUrl",
  original_price AS "originalPrice",
  group_price AS "groupPrice",
  now_price AS "nowPrice",
  min_people AS "minPeople",
  stock,
  reserve_fee AS "reserveFee",
  category,
  sale_mode AS "saleMode",
  fulfillment_type AS "fulfillmentType",
  active,
  category_id AS "categoryId",
  subcategory_id AS "subcategoryId",
  brand,
  weight,
  dimensions,
  specifications,
  sale_ends_at AS "saleEndsAt",
  created_by AS "createdBy",
  approved,
  created_at AS "createdAt"
`;

const GROUP_SELECT = `
  id,
  product_id AS "productId",
  current_people AS "currentPeople",
  min_people AS "minPeople",
  status,
  created_at AS "createdAt"
`;

const MEMBER_SELECT = `
  id,
  group_id AS "groupId",
  user_id AS "userId",
  name,
  phone,
  quantity,
  reserve_status AS "reserveStatus",
  created_at AS "createdAt"
`;

const BANNER_SELECT = `
  id,
  title,
  image_url AS "imageUrl",
  mobile_image_url AS "mobileImageUrl",
  link_url AS "linkUrl",
  sort_order AS "sortOrder",
  active,
  created_at AS "createdAt"
`;

const VIDEO_SELECT = `
  id,
  title,
  embed_url AS "embedUrl",
  sort_order AS "sortOrder",
  active,
  created_at AS "createdAt"
`;

const ORDER_SELECT = `
  id,
  user_id AS "userId",
  items,
  total,
  status,
  fulfillment_type AS "fulfillmentType",
  pickup_point_id AS "pickupPointId",
  status_changed_at AS "statusChangedAt",
  pickup_deadline AS "pickupDeadline",
  created_at AS "createdAt"
`;

const STATUS_HISTORY_SELECT = `
  id,
  order_id AS "orderId",
  from_status AS "fromStatus",
  to_status AS "toStatus",
  changed_by_user_id AS "changedByUserId",
  changed_by_name AS "changedByName",
  reason,
  created_at AS "createdAt"
`;

const PICKUP_POINT_SELECT = `
  id,
  name,
  address,
  city,
  phone,
  hours,
  active,
  sort_order AS "sortOrder",
  created_at AS "createdAt"
`;

const USER_SELECT = `id, name, display_name AS "displayName", email, phone, role, email_verified AS "emailVerified", phone_verified AS "phoneVerified", address_cep AS "addressCep", address_street AS "addressStreet", address_number AS "addressNumber", address_complement AS "addressComplement", address_district AS "addressDistrict", address_city AS "addressCity", address_state AS "addressState", pickup_point_id AS "pickupPointId", created_at AS "createdAt"`;

class DatabaseStorage implements IStorage {
  async getCategories(parentId?: number | null): Promise<CategoryRow[]> {
    if (parentId === null) {
      const result = await pool.query(
        `SELECT ${CATEGORY_SELECT} FROM categories WHERE parent_id IS NULL ORDER BY sort_order ASC, id ASC`
      );
      return result.rows as CategoryRow[];
    }
    if (parentId !== undefined) {
      const result = await pool.query(
        `SELECT ${CATEGORY_SELECT} FROM categories WHERE parent_id = $1 ORDER BY sort_order ASC, id ASC`,
        [parentId]
      );
      return result.rows as CategoryRow[];
    }
    const result = await pool.query(
      `SELECT ${CATEGORY_SELECT} FROM categories ORDER BY sort_order ASC, id ASC`
    );
    return result.rows as CategoryRow[];
  }

  async getCategory(id: number | string): Promise<CategoryRow | null> {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    if (isNaN(numericId)) return null;
    const result = await pool.query(
      `SELECT ${CATEGORY_SELECT} FROM categories WHERE id = $1 LIMIT 1`,
      [numericId]
    );
    return (result.rows[0] as CategoryRow | undefined) ?? null;
  }

  async createCategory(input: { name: string; slug: string; parentId?: number | null; sortOrder?: number; active?: boolean }): Promise<CategoryRow> {
    const result = await pool.query(
      `INSERT INTO categories (name, slug, parent_id, sort_order, active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${CATEGORY_SELECT}`,
      [input.name, input.slug, input.parentId ?? null, input.sortOrder ?? 0, input.active !== undefined ? input.active : true]
    );
    return result.rows[0] as CategoryRow;
  }

  async updateCategory(id: number, input: any): Promise<CategoryRow | null> {
    const map: Record<string, string> = {
      name: "name", slug: "slug", parentId: "parent_id", sortOrder: "sort_order", active: "active",
    };
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, rawValue] of Object.entries(input)) {
      if (rawValue === undefined) continue;
      const dbField = map[key];
      if (!dbField) continue;
      values.push(rawValue);
      fields.push(`${dbField} = $${values.length}`);
    }
    if (!fields.length) return this.getCategory(id);
    values.push(id);
    const result = await pool.query(
      `UPDATE categories SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING ${CATEGORY_SELECT}`,
      values
    );
    return (result.rows[0] as CategoryRow | undefined) ?? null;
  }

  async deleteCategory(id: number): Promise<void> {
    await pool.query(`DELETE FROM categories WHERE id = $1`, [id]);
  }

  async seedCategories(): Promise<void> {
    try {
      await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
      const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM categories`);
      if (countRes.rows[0]?.total > 0) return;

      const topLevel = [
        { name: "Mercado", slug: "mercado", sortOrder: 1 },
        { name: "Bebidas", slug: "bebidas", sortOrder: 2 },
        { name: "Casa & Limpeza", slug: "casa-limpeza", sortOrder: 3 },
        { name: "Higiene & Beleza", slug: "higiene-beleza", sortOrder: 4 },
        { name: "Pet Shop", slug: "pet-shop", sortOrder: 5 },
        { name: "Agro & Jardim", slug: "agro-jardim", sortOrder: 6 },
        { name: "Ferramentas", slug: "ferramentas", sortOrder: 7 },
        { name: "Moda & Calcados", slug: "moda-calcados", sortOrder: 8 },
        { name: "Ofertas", slug: "ofertas", sortOrder: 9 },
      ];

      const subcats: Record<string, string[]> = {
        "mercado": ["Basicos", "Matinais", "Industrializados", "Temperos e Condimentos", "Padaria", "Frios e Laticinios", "Hortifruti"],
        "bebidas": ["Refrigerantes", "Sucos", "Aguas", "Energeticos"],
        "casa-limpeza": ["Limpeza pesada", "Limpeza diaria", "Lavanderia", "Utensilios domesticos", "Descartaveis"],
        "higiene-beleza": ["Higiene pessoal", "Perfumaria", "Cuidados com cabelo", "Cuidados com pele", "Infantil"],
        "pet-shop": ["Racoes", "Petiscos", "Higiene pet", "Acessorios"],
        "agro-jardim": ["Jardinagem", "Insumos", "Acessorios agro", "Irrigacao basica"],
        "ferramentas": ["Eletricas", "Manuais", "Acessorios", "EPIs", "Organizacao"],
        "moda-calcados": ["Botinas", "Calcados", "Roupas", "Acessorios", "Uniformes"],
        "ofertas": ["Queima de estoque", "Combo", "Leve mais por menos", "Ultimas unidades"],
      };

      for (const cat of topLevel) {
        const res = await pool.query(
          `INSERT INTO categories (name, slug, parent_id, sort_order, active) VALUES ($1, $2, NULL, $3, true) RETURNING id`,
          [cat.name, cat.slug, cat.sortOrder]
        );
        const parentId = res.rows[0].id;
        const subs = subcats[cat.slug] || [];
        for (let i = 0; i < subs.length; i++) {
          const subSlug = subs[i].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          await pool.query(
            `INSERT INTO categories (name, slug, parent_id, sort_order, active) VALUES ($1, $2, $3, $4, true)`,
            [subs[i], subSlug, parentId, i + 1]
          );
        }
      }
    } catch (err) {
      console.error("Error seeding categories:", err);
    }
  }

  async getProducts(category?: string, search?: string, saleMode?: string, categoryId?: number, subcategoryId?: number, filters?: { brand?: string; minPrice?: number; maxPrice?: number; filterOptionIds?: number[] }): Promise<ProductRow[]> {
    const values: unknown[] = [];
    const conditions: string[] = ["p.active = true", "p.approved = true"];
    let needsCategoryJoin = false;

    if (search?.trim()) {
      const st = search.trim();
      values.push(`%${st}%`);
      const si = values.length;
      values.push(st);
      const ti = values.length;
      conditions.push(`(p.name ILIKE $${si} OR COALESCE(p.description, '') ILIKE $${si} OR COALESCE(p.category, '') ILIKE $${si} OR COALESCE(p.brand, '') ILIKE $${si} OR COALESCE(p.specifications, '') ILIKE $${si} OR COALESCE(c1.name, '') ILIKE $${si} OR COALESCE(c2.name, '') ILIKE $${si} OR word_similarity($${ti}, p.name) > 0.3 OR word_similarity($${ti}, COALESCE(p.category, '')) > 0.3 OR word_similarity($${ti}, COALESCE(c1.name, '')) > 0.3 OR word_similarity($${ti}, COALESCE(c2.name, '')) > 0.3)`);
      needsCategoryJoin = true;
    }

    if (category && category.toLowerCase() !== "todos") {
      values.push(category);
      conditions.push(`p.category = $${values.length}`);
    }

    if (saleMode) {
      values.push(saleMode);
      conditions.push(`p.sale_mode = $${values.length}`);
    }

    if (categoryId) {
      values.push(categoryId);
      conditions.push(`p.category_id = $${values.length}`);
    }
    if (subcategoryId) {
      values.push(subcategoryId);
      conditions.push(`p.subcategory_id = $${values.length}`);
    }

    if (filters?.brand) {
      values.push(filters.brand);
      conditions.push(`p.brand = $${values.length}`);
    }
    if (filters?.minPrice !== undefined) {
      values.push(filters.minPrice);
      conditions.push(`COALESCE(p.now_price, p.original_price)::numeric >= $${values.length}`);
    }
    if (filters?.maxPrice !== undefined) {
      values.push(filters.maxPrice);
      conditions.push(`COALESCE(p.now_price, p.original_price)::numeric <= $${values.length}`);
    }

    if (filters?.filterOptionIds && filters.filterOptionIds.length > 0) {
      values.push(filters.filterOptionIds);
      conditions.push(`p.id IN (SELECT product_id FROM product_filters WHERE filter_option_id = ANY($${values.length}))`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const categoryJoins = needsCategoryJoin
      ? `LEFT JOIN categories c1 ON p.category_id = c1.id LEFT JOIN categories c2 ON p.subcategory_id = c2.id`
      : "";
    const pSelect = PRODUCT_SELECT.trim().split('\n').map(col => {
      const c = col.trim().replace(/,$/, '').trim();
      return c ? `p.${c}` : '';
    }).filter(Boolean).join(', ');
    const result = await pool.query(
      `SELECT ${pSelect} FROM products p ${categoryJoins} ${where} ORDER BY p.id DESC`,
      values,
    );
    return result.rows as ProductRow[];
  }

  async getProductBrands(): Promise<string[]> {
    const result = await pool.query(
      `SELECT DISTINCT brand FROM products WHERE active = true AND approved = true AND brand IS NOT NULL AND brand != '' ORDER BY brand ASC`,
    );
    return result.rows.map((r: any) => r.brand);
  }

  async searchProductsSuggestions(term: string, limit: number = 8): Promise<{ id: number; name: string; imageUrl: string | null; groupPrice: string | null; nowPrice: string | null; saleMode: string }[]> {
    const t = term.trim();
    const like = `%${t}%`;
    const prefix = `${t}%`;
    const result = await pool.query(
      `SELECT p.id, p.name, p.image_url AS "imageUrl", p.group_price AS "groupPrice", p.now_price AS "nowPrice", p.sale_mode AS "saleMode"
       FROM products p
       LEFT JOIN categories c1 ON p.category_id = c1.id
       LEFT JOIN categories c2 ON p.subcategory_id = c2.id
       WHERE p.active = true AND p.approved = true AND (
         p.name ILIKE $1 OR COALESCE(p.description, '') ILIKE $1
         OR COALESCE(p.category, '') ILIKE $1 OR COALESCE(p.brand, '') ILIKE $1
         OR COALESCE(p.specifications, '') ILIKE $1
         OR COALESCE(c1.name, '') ILIKE $1 OR COALESCE(c2.name, '') ILIKE $1
         OR word_similarity($2, p.name) > 0.3
         OR word_similarity($2, COALESCE(p.category, '')) > 0.3
         OR word_similarity($2, COALESCE(c1.name, '')) > 0.3
         OR word_similarity($2, COALESCE(c2.name, '')) > 0.3
       )
       GROUP BY p.id
       ORDER BY
         CASE WHEN p.name ILIKE $3 THEN 0 WHEN p.name ILIKE $1 THEN 1 ELSE 2 END,
         GREATEST(word_similarity($2, p.name), word_similarity($2, COALESCE(p.category, ''))) DESC,
         p.name ASC
       LIMIT $4`,
      [like, t, prefix, limit],
    );
    return result.rows;
  }

  async getProduct(id: number): Promise<ProductRow | null> {
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT} FROM products WHERE id = $1 LIMIT 1`,
      [id],
    );
    return (result.rows[0] as ProductRow | undefined) ?? null;
  }

  async createProduct(input: any): Promise<ProductRow> {
    const result = await pool.query(
      `INSERT INTO products
        (name, description, image_url, original_price, group_price, now_price, min_people, stock, reserve_fee, category, sale_mode, fulfillment_type, active, category_id, subcategory_id, brand, weight, dimensions, specifications, sale_ends_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING ${PRODUCT_SELECT}`,
      [
        input.name,
        input.description ?? "",
        input.imageUrl ?? "",
        String(input.originalPrice),
        String(input.groupPrice),
        input.nowPrice ? String(input.nowPrice) : null,
        Number(input.minPeople) || 10,
        Number(input.stock) || 100,
        input.reserveFee ? String(input.reserveFee) : "0",
        input.category || "Outros",
        input.saleMode || "grupo",
        input.fulfillmentType || (input.saleMode === "agora" ? "delivery" : "pickup"),
        input.active !== undefined ? input.active : true,
        input.categoryId || null,
        input.subcategoryId || null,
        input.brand || null,
        input.weight || null,
        input.dimensions || null,
        input.specifications || null,
        input.saleEndsAt || null,
      ],
    );
    return result.rows[0] as ProductRow;
  }

  async updateProduct(id: number, input: any): Promise<ProductRow | null> {
    const map: Record<string, string> = {
      name: "name",
      description: "description",
      imageUrl: "image_url",
      originalPrice: "original_price",
      groupPrice: "group_price",
      nowPrice: "now_price",
      minPeople: "min_people",
      stock: "stock",
      reserveFee: "reserve_fee",
      category: "category",
      saleMode: "sale_mode",
      fulfillmentType: "fulfillment_type",
      active: "active",
      categoryId: "category_id",
      subcategoryId: "subcategory_id",
      brand: "brand",
      weight: "weight",
      dimensions: "dimensions",
      specifications: "specifications",
      saleEndsAt: "sale_ends_at",
    };

    const fields: string[] = [];
    const values: unknown[] = [];

    for (const [key, rawValue] of Object.entries(input)) {
      if (rawValue === undefined) continue;
      const dbField = map[key];
      if (!dbField) continue;

      let value: unknown = rawValue;
      if (key === "originalPrice" || key === "groupPrice" || key === "nowPrice" || key === "reserveFee") {
        value = rawValue !== null && rawValue !== "" ? String(rawValue) : null;
      }
      if (key === "minPeople" || key === "stock") {
        value = Number(rawValue);
      }
      if (key === "saleEndsAt") {
        value = rawValue ? new Date(rawValue as string) : null;
      }

      values.push(value);
      fields.push(`${dbField} = $${values.length}`);
    }

    if (!fields.length) return this.getProduct(id);

    values.push(id);
    const result = await pool.query(
      `UPDATE products SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING ${PRODUCT_SELECT}`,
      values,
    );
    return (result.rows[0] as ProductRow | undefined) ?? null;
  }

  async deleteProduct(id: number): Promise<void> {
    await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
  }

  async getGroups(productId?: number, status?: string): Promise<GroupRow[]> {
    const values: unknown[] = [];
    const conditions: string[] = [];

    if (productId !== undefined) {
      values.push(productId);
      conditions.push(`g.product_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`g.status = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT g.id, g.product_id AS "productId", g.current_people AS "currentPeople",
              g.min_people AS "minPeople", g.status, g.created_at AS "createdAt",
              p.name AS "productName", p.image_url AS "productImageUrl",
              p.group_price AS "productGroupPrice", p.category_id AS "productCategoryId"
       FROM groups g
       LEFT JOIN products p ON p.id = g.product_id
       ${where} ORDER BY g.id DESC`,
      values,
    );
    return result.rows as any[];
  }

  async getGroup(id: number): Promise<GroupRow | null> {
    const result = await pool.query(
      `SELECT ${GROUP_SELECT} FROM groups WHERE id = $1 LIMIT 1`,
      [id],
    );
    return (result.rows[0] as GroupRow | undefined) ?? null;
  }

  async createGroup(input: { productId: number; minPeople: number }): Promise<GroupRow> {
    const result = await pool.query(
      `INSERT INTO groups (product_id, current_people, min_people, status)
      VALUES ($1, 0, $2, 'aberto')
      RETURNING ${GROUP_SELECT}`,
      [input.productId, Number(input.minPeople)],
    );
    return result.rows[0] as GroupRow;
  }

  async addMemberToGroup(groupId: number, input: { name: string; phone: string; userId?: number; quantity?: number }): Promise<GroupRow> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const groupRes = await client.query(
        `SELECT id, product_id, current_people, min_people, status FROM groups WHERE id = $1 FOR UPDATE`,
        [groupId],
      );

      const group = groupRes.rows[0] as any;
      if (!group) throw new Error("Grupo nao encontrado");
      if (group.status !== "aberto") throw new Error("Este grupo ja esta fechado");

      if (input.userId) {
        const dupRes = await client.query(
          `SELECT id FROM members WHERE group_id = $1 AND user_id = $2 LIMIT 1`,
          [groupId, input.userId],
        );
        if (dupRes.rows.length) throw new Error("Voce ja esta neste grupo");
      }

      const reserveFeeRes = await client.query(
        `SELECT reserve_fee AS "reserveFee" FROM products WHERE id = $1`,
        [group.product_id],
      );
      const reserveFee = reserveFeeRes.rows[0]?.reserveFee;
      const hasReserveFee = reserveFee && Number(reserveFee) > 0;

      await client.query(
        `INSERT INTO members (group_id, name, phone, user_id, quantity, reserve_status) VALUES ($1, $2, $3, $4, $5, $6)`,
        [groupId, input.name, input.phone, input.userId || null, input.quantity || 1, hasReserveFee ? "pendente" : "nenhuma"],
      );

      const nextPeople = Number(group.current_people) + 1;
      const nextStatus = nextPeople >= Number(group.min_people) ? "fechado" : "aberto";

      await client.query(
        `UPDATE groups SET current_people = $1, status = $2 WHERE id = $3`,
        [nextPeople, nextStatus, groupId],
      );

      if (nextStatus === "fechado") {
        const product = await client.query(
          `SELECT id, stock, min_people FROM products WHERE id = $1`,
          [group.product_id],
        );
        const p = product.rows[0];
        if (p && Number(p.stock) > Number(p.min_people)) {
          await client.query(
            `INSERT INTO groups (product_id, current_people, min_people, status)
             VALUES ($1, 0, $2, 'aberto')`,
            [group.product_id, Number(p.min_people)],
          );
        }
      }

      const updated = await client.query(
        `SELECT ${GROUP_SELECT} FROM groups WHERE id = $1`,
        [groupId],
      );

      await client.query("COMMIT");
      return updated.rows[0] as GroupRow;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateGroupStatus(id: number, status: string): Promise<GroupRow | null> {
    const result = await pool.query(
      `UPDATE groups SET status = $1 WHERE id = $2 RETURNING ${GROUP_SELECT}`,
      [status, id],
    );
    return (result.rows[0] as GroupRow | undefined) ?? null;
  }

  async getGroupMembers(groupId: number): Promise<MemberRow[]> {
    const result = await pool.query(
      `SELECT ${MEMBER_SELECT} FROM members WHERE group_id = $1 ORDER BY id ASC`,
      [groupId],
    );
    return result.rows as MemberRow[];
  }

  async getUserGroups(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT m.id AS "memberId", m.created_at AS "joinedAt", m.reserve_status AS "reserveStatus",
              g.id AS "groupId", g.current_people AS "currentPeople", g.min_people AS "minPeople",
              g.status, g.created_at AS "groupCreatedAt",
              p.id AS "productId", p.name AS "productName", p.image_url AS "productImageUrl",
              p.group_price AS "groupPrice", p.reserve_fee AS "reserveFee"
       FROM members m
       JOIN groups g ON g.id = m.group_id
       JOIN products p ON p.id = g.product_id
       WHERE m.user_id = $1
       ORDER BY m.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async getBanners(activeOnly?: boolean): Promise<BannerRow[]> {
    const where = activeOnly ? "WHERE active = true" : "";
    const result = await pool.query(
      `SELECT ${BANNER_SELECT} FROM banners ${where} ORDER BY sort_order ASC, id DESC`,
    );
    return result.rows as BannerRow[];
  }

  async createBanner(input: any): Promise<BannerRow> {
    const result = await pool.query(
      `INSERT INTO banners (title, image_url, mobile_image_url, link_url, sort_order, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${BANNER_SELECT}`,
      [
        input.title || "",
        input.imageUrl,
        input.mobileImageUrl || null,
        input.linkUrl || null,
        Number(input.sortOrder) || 0,
        input.active !== undefined ? input.active : true,
      ],
    );
    return result.rows[0] as BannerRow;
  }

  async updateBanner(id: number, input: any): Promise<BannerRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    const map: Record<string, string> = {
      title: "title", imageUrl: "image_url", mobileImageUrl: "mobile_image_url",
      linkUrl: "link_url", sortOrder: "sort_order", active: "active",
    };

    for (const [key, rawValue] of Object.entries(input)) {
      if (rawValue === undefined) continue;
      const dbField = map[key];
      if (!dbField) continue;
      values.push(rawValue);
      fields.push(`${dbField} = $${values.length}`);
    }

    if (!fields.length) return null;
    values.push(id);
    const result = await pool.query(
      `UPDATE banners SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING ${BANNER_SELECT}`,
      values,
    );
    return (result.rows[0] as BannerRow | undefined) ?? null;
  }

  async deleteBanner(id: number): Promise<void> {
    await pool.query(`DELETE FROM banners WHERE id = $1`, [id]);
  }

  async getVideos(activeOnly?: boolean): Promise<VideoRow[]> {
    const where = activeOnly ? "WHERE active = true" : "";
    const result = await pool.query(
      `SELECT ${VIDEO_SELECT} FROM videos ${where} ORDER BY sort_order ASC, id DESC`,
    );
    return result.rows as VideoRow[];
  }

  async createVideo(input: any): Promise<VideoRow> {
    const result = await pool.query(
      `INSERT INTO videos (title, embed_url, sort_order, active)
      VALUES ($1, $2, $3, $4)
      RETURNING ${VIDEO_SELECT}`,
      [input.title || "", input.embedUrl, Number(input.sortOrder) || 0, input.active !== undefined ? input.active : true],
    );
    return result.rows[0] as VideoRow;
  }

  async updateVideo(id: number, input: any): Promise<VideoRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    const map: Record<string, string> = {
      title: "title", embedUrl: "embed_url", sortOrder: "sort_order", active: "active",
    };

    for (const [key, rawValue] of Object.entries(input)) {
      if (rawValue === undefined) continue;
      const dbField = map[key];
      if (!dbField) continue;
      values.push(rawValue);
      fields.push(`${dbField} = $${values.length}`);
    }

    if (!fields.length) return null;
    values.push(id);
    const result = await pool.query(
      `UPDATE videos SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING ${VIDEO_SELECT}`,
      values,
    );
    return (result.rows[0] as VideoRow | undefined) ?? null;
  }

  async deleteVideo(id: number): Promise<void> {
    await pool.query(`DELETE FROM videos WHERE id = $1`, [id]);
  }

  async registerUser(input: { name: string; email: string; password: string; phone?: string; displayName?: string }): Promise<UserRow> {
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [input.email.toLowerCase()]);
    if (existing.rows.length) throw new Error("Email ja cadastrado");

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, display_name, email, password, phone, role)
      VALUES ($1, $2, $3, $4, $5, 'user')
      RETURNING ${USER_SELECT}`,
      [input.name, input.displayName || "", input.email.toLowerCase(), hashedPassword, input.phone || ""],
    );
    return result.rows[0] as UserRow;
  }

  async loginUser(identifier: string, password: string): Promise<UserRow | null> {
    const isPhone = /^\d{8,}$/.test(identifier.replace(/\D/g, "")) && !identifier.includes("@");
    let result;
    if (isPhone) {
      const digits = identifier.replace(/\D/g, "");
      result = await pool.query(
        `SELECT ${USER_SELECT}, password FROM users WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1`,
        [digits],
      );
    } else {
      result = await pool.query(
        `SELECT ${USER_SELECT}, password FROM users WHERE LOWER(email) = LOWER($1)`,
        [identifier],
      );
    }
    if (result.rows.length === 0) return null;
    const user = result.rows[0] as any;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as UserRow;
  }

  async getUserById(id: number): Promise<UserRow | null> {
    const result = await pool.query(
      `SELECT ${USER_SELECT} FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    return (result.rows[0] as UserRow | undefined) ?? null;
  }

  async updateUserRole(id: number, role: string): Promise<UserRow | null> {
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING ${USER_SELECT}`,
      [role, id],
    );
    return (result.rows[0] as UserRow | undefined) ?? null;
  }

  async updateUser(id: number, data: Partial<{
    name: string; displayName: string; phone: string;
    addressCep: string; addressStreet: string; addressNumber: string;
    addressComplement: string; addressDistrict: string; addressCity: string; addressState: string;
  }>): Promise<UserRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      name: "name",
      displayName: "display_name",
      phone: "phone",
      addressCep: "address_cep",
      addressStreet: "address_street",
      addressNumber: "address_number",
      addressComplement: "address_complement",
      addressDistrict: "address_district",
      addressCity: "address_city",
      addressState: "address_state",
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        fields.push(`${col} = $${idx}`);
        values.push((data as any)[key]);
        idx++;
      }
    }

    if (fields.length === 0) {
      return this.getUserById(id);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING ${USER_SELECT}`,
      values,
    );
    return (result.rows[0] as UserRow | undefined) ?? null;
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const result = await pool.query(`SELECT password FROM users WHERE id = $1`, [userId]);
    if (result.rows.length === 0) return false;
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!valid) return false;
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, userId]);
    return true;
  }

  async getUserByEmail(email: string): Promise<UserRow | null> {
    const result = await pool.query(
      `SELECT ${USER_SELECT} FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email],
    );
    return (result.rows[0] as UserRow | undefined) ?? null;
  }

  async createPasswordResetToken(email: string): Promise<{ token: string; userName: string } | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt],
    );
    return { token, userName: user.name };
  }

  async resetPasswordByToken(token: string, newPassword: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT id, user_id FROM password_resets WHERE token = $1 AND used = false AND expires_at > NOW() LIMIT 1`,
      [token],
    );
    if (result.rows.length === 0) return false;
    const resetRow = result.rows[0] as any;
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashed, resetRow.user_id]);
    await pool.query(`UPDATE password_resets SET used = true WHERE id = $1`, [resetRow.id]);
    return true;
  }

  async createOrder(input: { userId: number; items: any; total: string; fulfillmentType: string; pickupPointId?: number | null }): Promise<OrderRow> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const items = Array.isArray(input.items) ? input.items : [];
      for (const item of items) {
        if (item.productId) {
          const qty = Number(item.qty) || 1;
          const stockCheck = await client.query(
            `SELECT stock FROM products WHERE id = $1 FOR UPDATE`,
            [item.productId],
          );
          if (stockCheck.rows.length > 0) {
            const currentStock = Number(stockCheck.rows[0].stock);
            if (currentStock < qty) {
              throw new Error(`Estoque insuficiente para "${item.name}". Disponivel: ${currentStock}`);
            }
            await client.query(
              `UPDATE products SET stock = stock - $1 WHERE id = $2`,
              [qty, item.productId],
            );
          }
        }
      }

      const result = await client.query(
        `INSERT INTO orders (user_id, items, total, status, fulfillment_type, pickup_point_id)
        VALUES ($1, $2::jsonb, $3, 'recebido', $4, $5)
        RETURNING ${ORDER_SELECT}`,
        [input.userId, JSON.stringify(input.items), input.total, input.fulfillmentType, input.pickupPointId ?? null],
      );

      await client.query("COMMIT");
      return result.rows[0] as OrderRow;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getOrders(userId?: number): Promise<OrderRow[]> {
    const where = userId ? `WHERE user_id = $1` : "";
    const values = userId ? [userId] : [];
    const result = await pool.query(
      `SELECT ${ORDER_SELECT} FROM orders ${where} ORDER BY id DESC`,
      values,
    );
    return result.rows as OrderRow[];
  }

  async getOrder(id: number): Promise<OrderRow | null> {
    const result = await pool.query(
      `SELECT ${ORDER_SELECT} FROM orders WHERE id = $1 LIMIT 1`,
      [id],
    );
    return (result.rows[0] as OrderRow | undefined) ?? null;
  }

  async updateOrderStatus(id: number, status: string): Promise<OrderRow | null> {
    const result = await pool.query(
      `UPDATE orders SET status = $1, status_changed_at = NOW() WHERE id = $2 RETURNING ${ORDER_SELECT}`,
      [status, id],
    );
    return (result.rows[0] as OrderRow | undefined) ?? null;
  }

  async changeOrderStatus(orderId: number, newStatus: string, changedByUserId: number, changedByName: string, reason?: string): Promise<OrderRow | null> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const orderRes = await client.query(`SELECT ${ORDER_SELECT} FROM orders WHERE id = $1 FOR UPDATE`, [orderId]);
      const order = orderRes.rows[0] as OrderRow | undefined;
      if (!order) {
        await client.query("ROLLBACK");
        return null;
      }

      const fromStatus = order.status;

      let pickupDeadlineClause = "";
      const values: any[] = [newStatus, orderId];
      if (newStatus === "pronto_retirada" && !order.pickupDeadline) {
        const settings = await this.getOrderSettings();
        const windowHours = settings.pickupWindowHours || 72;
        const toleranceHours = settings.toleranceHours || 24;
        const totalHours = windowHours + toleranceHours;
        pickupDeadlineClause = `, pickup_deadline = NOW() + interval '${totalHours} hours'`;
      }

      const updated = await client.query(
        `UPDATE orders SET status = $1, status_changed_at = NOW()${pickupDeadlineClause} WHERE id = $2 RETURNING ${ORDER_SELECT}`,
        values,
      );

      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by_user_id, changed_by_name, reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, fromStatus, newStatus, changedByUserId, changedByName, reason || ""],
      );

      await client.query("COMMIT");

      const statusLabels: Record<string, string> = {
        recebido: "Recebido",
        em_separacao: "Em separacao",
        pronto_retirada: "Pronto para retirada",
        retirado: "Retirado",
        nao_retirado: "Nao retirado no prazo",
        cancelado: "Cancelado",
      };
      const orderUserId = Number(order.userId);
      const statusLabel = statusLabels[newStatus] || newStatus;
      try {
        await this.createNotification(
          orderUserId,
          `Pedido #${orderId} atualizado`,
          `Seu pedido mudou para: ${statusLabel}.${reason ? " Motivo: " + reason : ""}`,
          "order_status",
          orderId,
        );
      } catch (_) {}

      return updated.rows[0] as OrderRow;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrderStatusHistory(orderId: number): Promise<OrderStatusHistoryRow[]> {
    const result = await pool.query(
      `SELECT ${STATUS_HISTORY_SELECT} FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
      [orderId],
    );
    return result.rows as OrderStatusHistoryRow[];
  }

  async getOverdueOrders(): Promise<OrderRow[]> {
    const result = await pool.query(
      `SELECT ${ORDER_SELECT} FROM orders
       WHERE status = 'pronto_retirada'
       AND pickup_deadline IS NOT NULL
       AND pickup_deadline < NOW()
       ORDER BY pickup_deadline ASC`,
    );
    return result.rows as OrderRow[];
  }

  async getOrderSettings(): Promise<Record<string, any>> {
    const result = await pool.query(`SELECT key, value FROM order_settings`);
    const settings: Record<string, any> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    const defaults: Record<string, any> = {
      statusLabels: { recebido: "Recebido", em_separacao: "Em separacao", pronto_retirada: "Pronto para retirada", retirado: "Retirado", nao_retirado: "Nao retirado no prazo", cancelado: "Cancelado" },
      statusTransitions: { recebido: ["em_separacao", "cancelado"], em_separacao: ["pronto_retirada", "cancelado"], pronto_retirada: ["retirado", "nao_retirado", "cancelado"], retirado: [], nao_retirado: ["cancelado"], cancelado: [] },
      adminOverride: true,
      pickupWindowHours: 72,
      toleranceHours: 24,
      autoMarkOverdue: true,
      autoCancelAfterOverdue: false,
      autoCancelDelayHours: 48,
      overdueStockPolicy: "hold",
      notifications: {},
    };
    return { ...defaults, ...settings };
  }

  async updateOrderSettings(settings: Record<string, any>): Promise<void> {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO order_settings (key, value) VALUES ($1, $2::jsonb)
         ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = NOW()`,
        [key, JSON.stringify(value)],
      );
    }
  }

  async createNotification(userId: number, title: string, message: string, type: string, referenceId?: number): Promise<void> {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, reference_id) VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, message, type, referenceId ?? null],
    );
  }

  async getNotifications(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, title, message, type, reference_id AS "referenceId", read, created_at AS "createdAt"
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId],
    );
    return result.rows;
  }

  async markNotificationsRead(userId: number, ids?: number[]): Promise<void> {
    if (ids && ids.length > 0) {
      await pool.query(
        `UPDATE notifications SET read = true WHERE user_id = $1 AND id = ANY($2::int[])`,
        [userId, ids],
      );
    } else {
      await pool.query(
        `UPDATE notifications SET read = true WHERE user_id = $1`,
        [userId],
      );
    }
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND read = false`,
      [userId],
    );
    return Number(result.rows[0]?.count || 0);
  }

  async getPickupPoints(activeOnly?: boolean): Promise<PickupPointRow[]> {
    const where = activeOnly ? `WHERE active = true` : "";
    const result = await pool.query(
      `SELECT ${PICKUP_POINT_SELECT} FROM pickup_points ${where} ORDER BY sort_order ASC, id ASC`,
    );
    return result.rows as PickupPointRow[];
  }

  async getPickupPoint(id: number): Promise<PickupPointRow | null> {
    const result = await pool.query(
      `SELECT ${PICKUP_POINT_SELECT} FROM pickup_points WHERE id = $1 LIMIT 1`,
      [id],
    );
    return (result.rows[0] as PickupPointRow | undefined) ?? null;
  }

  async createPickupPoint(input: any): Promise<PickupPointRow> {
    const result = await pool.query(
      `INSERT INTO pickup_points (name, address, city, phone, hours, active, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${PICKUP_POINT_SELECT}`,
      [input.name, input.address, input.city ?? "Formosa - GO", input.phone ?? "", input.hours ?? "", input.active !== undefined ? input.active : true, input.sortOrder ?? 0],
    );
    return result.rows[0] as PickupPointRow;
  }

  async updatePickupPoint(id: number, input: any): Promise<PickupPointRow | null> {
    const map: Record<string, string> = {
      name: "name", address: "address", city: "city", phone: "phone", hours: "hours", active: "active", sortOrder: "sort_order",
    };
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, rawValue] of Object.entries(input)) {
      if (rawValue === undefined) continue;
      const dbField = map[key];
      if (!dbField) continue;
      values.push(rawValue);
      fields.push(`${dbField} = $${values.length}`);
    }
    if (fields.length === 0) return this.getPickupPoint(id);
    values.push(id);
    const result = await pool.query(
      `UPDATE pickup_points SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING ${PICKUP_POINT_SELECT}`,
      values,
    );
    return (result.rows[0] as PickupPointRow | undefined) ?? null;
  }

  async deletePickupPoint(id: number): Promise<void> {
    await pool.query(`DELETE FROM pickup_points WHERE id = $1`, [id]);
  }

  async getAdminStats() {
    const productsResult = await pool.query(`SELECT COUNT(*) as count FROM products WHERE active = true`);
    const ordersResult = await pool.query(`SELECT COUNT(*) as count FROM orders`);
    const usersResult = await pool.query(`SELECT COUNT(*) as count FROM users WHERE role = 'user'`);
    const groupsResult = await pool.query(`SELECT COUNT(*) as count FROM groups`);
    const openGroupsResult = await pool.query(`SELECT COUNT(*) as count FROM groups WHERE status = 'aberto'`);
    const pendingOrdersResult = await pool.query(`SELECT COUNT(*) as count FROM orders WHERE status IN ('recebido', 'processando')`);
    const revenueResult = await pool.query(`SELECT COALESCE(SUM(CAST(total AS NUMERIC)), 0) as total FROM orders WHERE status != 'cancelado'`);

    return {
      totalProducts: parseInt(productsResult.rows[0].count),
      totalOrders: parseInt(ordersResult.rows[0].count),
      totalUsers: parseInt(usersResult.rows[0].count),
      totalGroups: parseInt(groupsResult.rows[0].count),
      openGroups: parseInt(openGroupsResult.rows[0].count),
      pendingOrders: parseInt(pendingOrdersResult.rows[0].count),
      totalRevenue: parseFloat(revenueResult.rows[0].total),
    };
  }

  async getAllUsers(): Promise<UserRow[]> {
    const result = await pool.query(
      `SELECT ${USER_SELECT} FROM users ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async getOrdersWithUsers() {
    const result = await pool.query(
      `SELECT o.id, o.user_id AS "userId", o.items, o.total, o.status,
              o.fulfillment_type AS "fulfillmentType", o.pickup_point_id AS "pickupPointId",
              o.status_changed_at AS "statusChangedAt", o.pickup_deadline AS "pickupDeadline",
              o.created_at AS "createdAt",
              u.name AS "userName", u.email AS "userEmail", u.phone AS "userPhone"
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    return result.rows;
  }

  async updateMemberReserveStatus(memberId: number, reserveStatus: string): Promise<MemberRow | null> {
    const result = await pool.query(
      `UPDATE members SET reserve_status = $1 WHERE id = $2
       RETURNING id, group_id AS "groupId", user_id AS "userId", name, phone, reserve_status AS "reserveStatus", created_at AS "createdAt"`,
      [reserveStatus, memberId]
    );
    return result.rows[0] || null;
  }

  async getArticles(publishedOnly: boolean = false): Promise<any[]> {
    const where = publishedOnly ? `WHERE published = true` : ``;
    const result = await pool.query(
      `SELECT id, title, slug, content, excerpt, image_url AS "imageUrl", published, author_id AS "authorId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM articles ${where} ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async getArticle(id: number): Promise<any | null> {
    const result = await pool.query(
      `SELECT id, title, slug, content, excerpt, image_url AS "imageUrl", published, author_id AS "authorId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM articles WHERE id = $1`, [id]
    );
    return result.rows[0] || null;
  }

  async getArticleBySlug(slug: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT id, title, slug, content, excerpt, image_url AS "imageUrl", published, author_id AS "authorId", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM articles WHERE slug = $1`, [slug]
    );
    return result.rows[0] || null;
  }

  async createArticle(input: any): Promise<any> {
    const result = await pool.query(
      `INSERT INTO articles (title, slug, content, excerpt, image_url, published, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, slug, content, excerpt, image_url AS "imageUrl", published, author_id AS "authorId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [input.title, input.slug, input.content || "", input.excerpt || "", input.imageUrl || "", input.published ?? false, input.authorId ?? null]
    );
    return result.rows[0];
  }

  async updateArticle(id: number, input: any): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    const mapping: Record<string, string> = { title: "title", slug: "slug", content: "content", excerpt: "excerpt", imageUrl: "image_url", published: "published" };
    for (const [key, col] of Object.entries(mapping)) {
      if (input[key] !== undefined) { fields.push(`${col} = $${idx}`); values.push(input[key]); idx++; }
    }
    if (fields.length === 0) return this.getArticle(id);
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const result = await pool.query(
      `UPDATE articles SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, title, slug, content, excerpt, image_url AS "imageUrl", published, author_id AS "authorId", created_at AS "createdAt", updated_at AS "updatedAt"`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteArticle(id: number): Promise<void> {
    await pool.query(`DELETE FROM articles WHERE id = $1`, [id]);
  }

  async getMediaAssets(): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, filename, url, mime_type AS "mimeType", size, created_at AS "createdAt"
       FROM media_assets ORDER BY created_at DESC`
    );
    return result.rows;
  }

  async createMediaAsset(input: { filename: string; url: string; mimeType: string; size: number }): Promise<any> {
    const result = await pool.query(
      `INSERT INTO media_assets (filename, url, mime_type, size) VALUES ($1, $2, $3, $4)
       RETURNING id, filename, url, mime_type AS "mimeType", size, created_at AS "createdAt"`,
      [input.filename, input.url, input.mimeType, input.size]
    );
    return result.rows[0];
  }

  async deleteMediaAsset(id: number): Promise<any | null> {
    const result = await pool.query(
      `DELETE FROM media_assets WHERE id = $1 RETURNING id, filename, url, mime_type AS "mimeType", size`, [id]
    );
    return result.rows[0] || null;
  }

  async getNavigationLinks(location?: string, activeOnly: boolean = false): Promise<any[]> {
    let where = "";
    const params: any[] = [];
    const conditions: string[] = [];
    if (location) { conditions.push(`location = $${params.length + 1}`); params.push(location); }
    if (activeOnly) { conditions.push(`active = true`); }
    if (conditions.length) where = `WHERE ${conditions.join(" AND ")}`;
    const result = await pool.query(
      `SELECT id, location, label, url, sort_order AS "sortOrder", active FROM navigation_links ${where} ORDER BY sort_order ASC, id ASC`,
      params
    );
    return result.rows;
  }

  async createNavigationLink(input: any): Promise<any> {
    const result = await pool.query(
      `INSERT INTO navigation_links (location, label, url, sort_order, active) VALUES ($1, $2, $3, $4, $5)
       RETURNING id, location, label, url, sort_order AS "sortOrder", active`,
      [input.location || "footer", input.label, input.url, input.sortOrder ?? 0, input.active ?? true]
    );
    return result.rows[0];
  }

  async updateNavigationLink(id: number, input: any): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    const mapping: Record<string, string> = { location: "location", label: "label", url: "url", sortOrder: "sort_order", active: "active" };
    for (const [key, col] of Object.entries(mapping)) {
      if (input[key] !== undefined) { fields.push(`${col} = $${idx}`); values.push(input[key]); idx++; }
    }
    if (fields.length === 0) return null;
    values.push(id);
    const result = await pool.query(
      `UPDATE navigation_links SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, location, label, url, sort_order AS "sortOrder", active`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteNavigationLink(id: number): Promise<void> {
    await pool.query(`DELETE FROM navigation_links WHERE id = $1`, [id]);
  }

  async seedProducts(): Promise<void> {
    try {
      const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM products`);
      const total = countRes.rows[0]?.total ?? 0;
      if (total > 0) return;

      const seed: any[] = [
        { name: "Kit Cesta Basica Premium", description: "Itens essenciais para o mes inteiro", imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800", originalPrice: "120", groupPrice: "85", nowPrice: "110", minPeople: 10, stock: 500, category: "Basico", saleMode: "grupo" },
        { name: "Fardo de Coca-Cola 1.5L (6 un)", description: "Refrigerante Coca-Cola 1.5L", imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800", originalPrice: "59.9", groupPrice: "42", nowPrice: "54.9", minPeople: 5, stock: 200, category: "Bebida", saleMode: "grupo" },
        { name: "Kit Higiene Pessoal Familiar", description: "Sabonete, shampoo e creme dental", imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800", originalPrice: "45", groupPrice: "29.9", nowPrice: "39.9", minPeople: 8, stock: 300, category: "Higiene pessoal", saleMode: "grupo" },
        { name: "Sabao Liquido OMO 3L", description: "Limpeza pesada com alto rendimento", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800", originalPrice: "48.9", groupPrice: "35.5", nowPrice: "44.9", minPeople: 15, stock: 400, reserveFee: "5", category: "Limpeza", saleMode: "grupo" },
        { name: "Cafe Pilao 500g", description: "Cafe torrado e moido tradicional", imageUrl: "https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?w=800", originalPrice: "18.9", groupPrice: "14.5", nowPrice: "16.9", minPeople: 10, stock: 600, category: "Matinais", saleMode: "agora" },
        { name: "Desinfetante Pinho Sol 1L", description: "Limpeza profunda e perfumada", imageUrl: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800", originalPrice: "12.9", groupPrice: "8.9", nowPrice: "11.5", minPeople: 12, stock: 350, category: "Limpeza", saleMode: "agora" },
        { name: "Racao Premium Caes 15kg", description: "Racao premium para caes adultos", imageUrl: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800", originalPrice: "129.9", groupPrice: "95", nowPrice: "119.9", minPeople: 5, stock: 100, category: "Pet Shop", saleMode: "agora" },
        { name: "Caixa de Leite Integral 12un", description: "Leite integral longa vida", imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800", originalPrice: "59.9", groupPrice: "42", nowPrice: "52.9", minPeople: 8, stock: 250, category: "Frios e Laticinios", saleMode: "grupo" },
      ];

      for (const p of seed) {
        await this.createProduct(p);
      }

      const adminExists = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
      if (!adminExists.rows.length) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await pool.query(
          `INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)`,
          ["Administrador", "admin@comprajuntoformosa.com", hashedPassword, "", "admin"],
        );
      }
    } catch (error) {
      console.error("Erro ao semear produtos:", error);
    }
  }

  async createAuditLog(input: { userId: number; userName: string; action: string; entity: string; entityId?: number; details?: any; ipAddress?: string }): Promise<void> {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [input.userId, input.userName, input.action, input.entity, input.entityId ?? null, input.details ? JSON.stringify(input.details) : null, input.ipAddress ?? null],
    );
  }

  async getAuditLogs(limit: number = 100): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, user_id AS "userId", user_name AS "userName", action, entity, entity_id AS "entityId", details, ip_address AS "ipAddress", created_at AS "createdAt"
       FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit],
    );
    return result.rows;
  }

  async getFilterTypes(activeOnly: boolean = false): Promise<any[]> {
    const where = activeOnly ? "WHERE active = true" : "";
    const result = await pool.query(
      `SELECT id, name, slug, input_type AS "inputType", sort_order AS "sortOrder", active, category_ids AS "categoryIds", created_at AS "createdAt"
       FROM filter_types ${where} ORDER BY sort_order ASC, name ASC`
    );
    return result.rows;
  }

  async getFilterType(id: number): Promise<any | null> {
    const result = await pool.query(
      `SELECT id, name, slug, input_type AS "inputType", sort_order AS "sortOrder", active, category_ids AS "categoryIds", created_at AS "createdAt"
       FROM filter_types WHERE id = $1 LIMIT 1`, [id]
    );
    return result.rows[0] ?? null;
  }

  async createFilterType(input: { name: string; slug: string; inputType?: string; sortOrder?: number; active?: boolean; categoryIds?: number[] }): Promise<any> {
    const result = await pool.query(
      `INSERT INTO filter_types (name, slug, input_type, sort_order, active, category_ids)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, slug, input_type AS "inputType", sort_order AS "sortOrder", active, category_ids AS "categoryIds"`,
      [input.name, input.slug, input.inputType ?? "select", input.sortOrder ?? 0, input.active !== false, input.categoryIds ?? null]
    );
    return result.rows[0];
  }

  async updateFilterType(id: number, input: any): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (input.name !== undefined) { fields.push(`name = $${idx++}`); values.push(input.name); }
    if (input.slug !== undefined) { fields.push(`slug = $${idx++}`); values.push(input.slug); }
    if (input.inputType !== undefined) { fields.push(`input_type = $${idx++}`); values.push(input.inputType); }
    if (input.sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(input.sortOrder); }
    if (input.active !== undefined) { fields.push(`active = $${idx++}`); values.push(input.active); }
    if (input.categoryIds !== undefined) { fields.push(`category_ids = $${idx++}`); values.push(input.categoryIds); }
    if (fields.length === 0) return this.getFilterType(id);
    values.push(id);
    const result = await pool.query(
      `UPDATE filter_types SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, name, slug, input_type AS "inputType", sort_order AS "sortOrder", active, category_ids AS "categoryIds"`,
      values
    );
    return result.rows[0] ?? null;
  }

  async deleteFilterType(id: number): Promise<void> {
    await pool.query(`DELETE FROM filter_types WHERE id = $1`, [id]);
  }

  async getFilterOptions(filterTypeId?: number, activeOnly: boolean = false): Promise<any[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    if (filterTypeId) { conditions.push(`fo.filter_type_id = $${conditions.length + 1}`); values.push(filterTypeId); }
    if (activeOnly) { conditions.push(`fo.active = true`); }
    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    const result = await pool.query(
      `SELECT fo.id, fo.filter_type_id AS "filterTypeId", fo.label, fo.value, fo.sort_order AS "sortOrder", fo.active,
              ft.name AS "filterTypeName", ft.slug AS "filterTypeSlug"
       FROM filter_options fo
       JOIN filter_types ft ON ft.id = fo.filter_type_id
       ${where}
       ORDER BY fo.sort_order ASC, fo.label ASC`,
      values
    );
    return result.rows;
  }

  async createFilterOption(input: { filterTypeId: number; label: string; value: string; sortOrder?: number; active?: boolean }): Promise<any> {
    const result = await pool.query(
      `INSERT INTO filter_options (filter_type_id, label, value, sort_order, active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, filter_type_id AS "filterTypeId", label, value, sort_order AS "sortOrder", active`,
      [input.filterTypeId, input.label, input.value, input.sortOrder ?? 0, input.active !== false]
    );
    return result.rows[0];
  }

  async updateFilterOption(id: number, input: any): Promise<any | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (input.label !== undefined) { fields.push(`label = $${idx++}`); values.push(input.label); }
    if (input.value !== undefined) { fields.push(`value = $${idx++}`); values.push(input.value); }
    if (input.sortOrder !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(input.sortOrder); }
    if (input.active !== undefined) { fields.push(`active = $${idx++}`); values.push(input.active); }
    if (fields.length === 0) return null;
    values.push(id);
    const result = await pool.query(
      `UPDATE filter_options SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, filter_type_id AS "filterTypeId", label, value, sort_order AS "sortOrder", active`,
      values
    );
    return result.rows[0] ?? null;
  }

  async deleteFilterOption(id: number): Promise<void> {
    await pool.query(`DELETE FROM filter_options WHERE id = $1`, [id]);
  }

  async getProductFilters(productId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT pf.id, pf.product_id AS "productId", pf.filter_type_id AS "filterTypeId", pf.filter_option_id AS "filterOptionId",
              ft.name AS "filterTypeName", ft.slug AS "filterTypeSlug",
              fo.label AS "optionLabel", fo.value AS "optionValue"
       FROM product_filters pf
       JOIN filter_types ft ON ft.id = pf.filter_type_id
       JOIN filter_options fo ON fo.id = pf.filter_option_id
       WHERE pf.product_id = $1
       ORDER BY ft.sort_order ASC, fo.sort_order ASC`,
      [productId]
    );
    return result.rows;
  }

  async setProductFilters(productId: number, filters: { filterTypeId: number; filterOptionId: number }[]): Promise<void> {
    await pool.query(`DELETE FROM product_filters WHERE product_id = $1`, [productId]);
    for (const f of filters) {
      await pool.query(
        `INSERT INTO product_filters (product_id, filter_type_id, filter_option_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [productId, f.filterTypeId, f.filterOptionId]
      );
    }
  }

  async getFilterCatalog(params?: { categoryId?: number; subcategoryId?: number; search?: string; saleMode?: string }): Promise<any> {
    const conditions: string[] = ["p.active = true"];
    const values: any[] = [];
    let idx = 1;
    if (params?.categoryId) { conditions.push(`p.category_id = $${idx++}`); values.push(params.categoryId); }
    if (params?.subcategoryId) { conditions.push(`p.subcategory_id = $${idx++}`); values.push(params.subcategoryId); }
    if (params?.search) { conditions.push(`(p.name ILIKE $${idx} OR COALESCE(p.description, '') ILIKE $${idx})`); values.push(`%${params.search}%`); idx++; }
    if (params?.saleMode) { conditions.push(`p.sale_mode = $${idx++}`); values.push(params.saleMode); }
    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const catRes = await pool.query(
      `SELECT c.id, c.name, c.slug, c.parent_id AS "parentId", COUNT(p.id)::int AS count
       FROM categories c
       LEFT JOIN products p ON (p.category_id = c.id OR p.subcategory_id = c.id) AND p.active = true
       WHERE c.active = true
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    );

    const brandRes = await pool.query(
      `SELECT p.brand, COUNT(*)::int AS count
       FROM products p ${where} AND p.brand IS NOT NULL AND p.brand != ''
       GROUP BY p.brand ORDER BY count DESC, p.brand ASC`,
      values
    );

    const priceRes = await pool.query(
      `SELECT MIN(COALESCE(p.now_price, p.original_price)::numeric)::text AS "minPrice",
              MAX(COALESCE(p.now_price, p.original_price)::numeric)::text AS "maxPrice"
       FROM products p ${where}`,
      values
    );

    const dynamicRes = await pool.query(
      `SELECT ft.id AS "filterTypeId", ft.name AS "filterTypeName", ft.slug AS "filterTypeSlug", ft.input_type AS "inputType",
              ft.category_ids AS "categoryIds",
              fo.id AS "optionId", fo.label AS "optionLabel", fo.value AS "optionValue",
              COUNT(DISTINCT pf.product_id)::int AS count
       FROM filter_types ft
       JOIN filter_options fo ON fo.filter_type_id = ft.id AND fo.active = true
       LEFT JOIN product_filters pf ON pf.filter_option_id = fo.id
       LEFT JOIN products p ON p.id = pf.product_id AND p.active = true
       WHERE ft.active = true
       GROUP BY ft.id, ft.name, ft.slug, ft.input_type, ft.category_ids, fo.id, fo.label, fo.value
       ORDER BY ft.sort_order ASC, fo.sort_order ASC`
    );

    const dynamicFilters: Record<string, any> = {};
    for (const row of dynamicRes.rows) {
      const catIds: number[] | null = row.categoryIds;
      if (catIds && catIds.length > 0 && params?.categoryId) {
        if (!catIds.includes(params.categoryId)) continue;
      }
      if (catIds && catIds.length > 0 && !params?.categoryId) continue;
      if (!dynamicFilters[row.filterTypeId]) {
        dynamicFilters[row.filterTypeId] = {
          id: row.filterTypeId,
          name: row.filterTypeName,
          slug: row.filterTypeSlug,
          inputType: row.inputType,
          categoryIds: catIds,
          options: [],
        };
      }
      dynamicFilters[row.filterTypeId].options.push({
        id: row.optionId,
        label: row.optionLabel,
        value: row.optionValue,
        count: row.count,
      });
    }

    return {
      categories: catRes.rows,
      brands: brandRes.rows,
      priceRange: priceRes.rows[0] ?? { minPrice: "0", maxPrice: "0" },
      dynamicFilters: Object.values(dynamicFilters),
    };
  }

  async trackFilterUsage(filterTypeId: number, filterOptionId?: number): Promise<void> {
    const existing = await pool.query(
      `SELECT id FROM filter_usage WHERE filter_type_id = $1 AND ${filterOptionId ? 'filter_option_id = $2' : 'filter_option_id IS NULL'}`,
      filterOptionId ? [filterTypeId, filterOptionId] : [filterTypeId]
    );
    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE filter_usage SET count = count + 1, last_used_at = NOW() WHERE id = $1`,
        [existing.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO filter_usage (filter_type_id, filter_option_id, count) VALUES ($1, $2, 1)`,
        [filterTypeId, filterOptionId ?? null]
      );
    }
  }

  async getSponsorBanners(activeOnly?: boolean): Promise<SponsorBannerRow[]> {
    const where = activeOnly ? "WHERE active = true" : "";
    const result = await pool.query(
      `SELECT id, title, image_url AS "imageUrl", link_url AS "linkUrl", position, sort_order AS "sortOrder", active, created_at AS "createdAt" FROM sponsor_banners ${where} ORDER BY sort_order ASC, id ASC`
    );
    return result.rows;
  }

  async createSponsorBanner(input: any): Promise<SponsorBannerRow> {
    const result = await pool.query(
      `INSERT INTO sponsor_banners (title, image_url, link_url, position, sort_order, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, image_url AS "imageUrl", link_url AS "linkUrl", position, sort_order AS "sortOrder", active, created_at AS "createdAt"`,
      [input.title || "", input.imageUrl, input.linkUrl || "", input.position || "sidebar", input.sortOrder ?? 0, input.active !== false]
    );
    return result.rows[0];
  }

  async updateSponsorBanner(id: number, input: any): Promise<SponsorBannerRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [key, value] of Object.entries(input)) {
      const col = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      fields.push(`${col} = $${idx}`);
      values.push(value);
      idx++;
    }
    if (fields.length === 0) return null;
    values.push(id);
    const result = await pool.query(
      `UPDATE sponsor_banners SET ${fields.join(", ")} WHERE id = $${idx}
       RETURNING id, title, image_url AS "imageUrl", link_url AS "linkUrl", position, sort_order AS "sortOrder", active, created_at AS "createdAt"`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteSponsorBanner(id: number): Promise<void> {
    await pool.query(`DELETE FROM sponsor_banners WHERE id = $1`, [id]);
  }

  async getFeaturedProducts(activeOnly?: boolean): Promise<FeaturedProductRow[]> {
    const where = activeOnly ? "WHERE fp.active = true AND p.active = true AND p.approved = true" : "";
    const result = await pool.query(
      `SELECT
        fp.id,
        fp.product_id AS "productId",
        fp.label,
        fp.sort_order AS "sortOrder",
        fp.active,
        fp.created_at AS "createdAt",
        row_to_json(p_data) AS product
      FROM featured_products fp
      JOIN (
        SELECT ${PRODUCT_SELECT}
        FROM products
      ) p_data ON p_data.id = fp.product_id
      JOIN products p ON p.id = fp.product_id
      ${where}
      ORDER BY fp.sort_order ASC, fp.id ASC`
    );
    return result.rows;
  }

  async createFeaturedProduct(input: { productId: number; label?: string; sortOrder?: number; active?: boolean }): Promise<FeaturedProductRow> {
    const result = await pool.query(
      `INSERT INTO featured_products (product_id, label, sort_order, active)
       VALUES ($1, $2, $3, $4)
       RETURNING id, product_id AS "productId", label, sort_order AS "sortOrder", active, created_at AS "createdAt"`,
      [input.productId, input.label || "", input.sortOrder ?? 0, input.active !== false]
    );
    return result.rows[0];
  }

  async updateFeaturedProduct(id: number, input: Partial<{ label: string; sortOrder: number; active: boolean }>): Promise<FeaturedProductRow | null> {
    const map: Record<string, string> = {
      label: "label",
      sortOrder: "sort_order",
      active: "active",
    };
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, rawValue] of Object.entries(input)) {
      if (rawValue === undefined) continue;
      const dbField = map[key];
      if (!dbField) continue;
      values.push(rawValue);
      fields.push(`${dbField} = $${values.length}`);
    }
    if (!fields.length) {
      const existing = await pool.query(
        `SELECT id, product_id AS "productId", label, sort_order AS "sortOrder", active, created_at AS "createdAt" FROM featured_products WHERE id = $1`,
        [id]
      );
      return existing.rows[0] || null;
    }
    values.push(id);
    const result = await pool.query(
      `UPDATE featured_products SET ${fields.join(", ")} WHERE id = $${values.length}
       RETURNING id, product_id AS "productId", label, sort_order AS "sortOrder", active, created_at AS "createdAt"`,
      values
    );
    return result.rows[0] || null;
  }

  async deleteFeaturedProduct(id: number): Promise<void> {
    await pool.query(`DELETE FROM featured_products WHERE id = $1`, [id]);
  }

  async createPartnerUser(input: { name: string; email: string; password: string; phone?: string; pickupPointId: number }): Promise<UserRow> {
    const hashedPassword = await bcrypt.hash(input.password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, pickup_point_id)
       VALUES ($1, $2, $3, $4, 'parceiro', $5)
       RETURNING ${USER_SELECT}`,
      [input.name, input.email, hashedPassword, input.phone || "", input.pickupPointId]
    );
    return result.rows[0];
  }

  async getPartnerOrders(pickupPointId: number): Promise<(OrderRow & { userName: string; userEmail: string; userPhone: string | null })[]> {
    const result = await pool.query(
      `SELECT o.id, o.user_id AS "userId", o.items, o.total, o.status,
              o.fulfillment_type AS "fulfillmentType", o.pickup_point_id AS "pickupPointId",
              o.status_changed_at AS "statusChangedAt", o.pickup_deadline AS "pickupDeadline",
              o.created_at AS "createdAt",
              u.name AS "userName", u.email AS "userEmail", u.phone AS "userPhone"
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.pickup_point_id = $1
       ORDER BY o.created_at DESC`,
      [pickupPointId]
    );
    return result.rows;
  }

  async getPartnerProducts(userId: number): Promise<ProductRow[]> {
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT} FROM products WHERE created_by = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows as ProductRow[];
  }

  async createPartnerProduct(userId: number, input: any): Promise<ProductRow> {
    const result = await pool.query(
      `INSERT INTO products (name, description, image_url, original_price, group_price, now_price, min_people, stock, reserve_fee, category, sale_mode, fulfillment_type, active, category_id, subcategory_id, brand, weight, dimensions, specifications, created_by, approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, $13, $14, $15, $16, $17, $18, $19, false)
       RETURNING ${PRODUCT_SELECT}`,
      [
        input.name, input.description, input.imageUrl,
        input.originalPrice, input.groupPrice, input.nowPrice || null,
        input.minPeople || 10, input.stock || 100, input.reserveFee || "0",
        input.category, input.saleMode || "grupo", input.fulfillmentType || "pickup",
        input.categoryId || null, input.subcategoryId || null,
        input.brand || null, input.weight || null, input.dimensions || null, input.specifications || null,
        userId
      ]
    );
    return result.rows[0] as ProductRow;
  }

  async getPartnerSales(userId: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT o.id, o.user_id AS "userId", o.items, o.total, o.status,
              o.fulfillment_type AS "fulfillmentType", o.pickup_point_id AS "pickupPointId",
              o.created_at AS "createdAt",
              u.name AS "buyerName", u.email AS "buyerEmail", u.phone AS "buyerPhone"
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.items::text LIKE ANY(
         SELECT '%"id":' || p.id || ',%' FROM products p WHERE p.created_by = $1
       )
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async approveProduct(productId: number): Promise<ProductRow | null> {
    const result = await pool.query(
      `UPDATE products SET approved = true WHERE id = $1 RETURNING ${PRODUCT_SELECT}`,
      [productId]
    );
    return result.rows[0] || null;
  }

  async rejectProduct(productId: number): Promise<void> {
    await pool.query(`DELETE FROM products WHERE id = $1 AND approved = false`, [productId]);
  }

  async getPendingProducts(): Promise<(ProductRow & { creatorName?: string })[]> {
    const result = await pool.query(
      `SELECT p.id, p.name, p.description, p.image_url AS "imageUrl",
              p.original_price AS "originalPrice", p.group_price AS "groupPrice",
              p.now_price AS "nowPrice", p.min_people AS "minPeople", p.stock,
              p.reserve_fee AS "reserveFee", p.category, p.sale_mode AS "saleMode",
              p.fulfillment_type AS "fulfillmentType", p.active,
              p.category_id AS "categoryId", p.subcategory_id AS "subcategoryId",
              p.brand, p.weight, p.dimensions, p.specifications,
              p.sale_ends_at AS "saleEndsAt", p.created_by AS "createdBy",
              p.approved, p.created_at AS "createdAt",
              u.name AS "creatorName"
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.approved = false
       ORDER BY p.created_at DESC`
    );
    return result.rows;
  }
}

export const storage: IStorage = new DatabaseStorage();

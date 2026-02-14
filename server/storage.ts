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
  active: boolean;
  categoryId: number | null;
  subcategoryId: number | null;
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
  createdAt?: Date | string | null;
};

type OrderRow = {
  id: number;
  userId: number;
  items: any;
  total: string | number;
  status: string;
  createdAt?: Date | string | null;
};

export interface IStorage {
  getCategories(parentId?: number | null): Promise<CategoryRow[]>;
  getCategory(id: number): Promise<CategoryRow | null>;
  createCategory(input: { name: string; slug: string; parentId?: number | null; sortOrder?: number; active?: boolean }): Promise<CategoryRow>;
  updateCategory(id: number, input: any): Promise<CategoryRow | null>;
  deleteCategory(id: number): Promise<void>;
  seedCategories(): Promise<void>;

  getProducts(category?: string, search?: string, saleMode?: string, categoryId?: number, subcategoryId?: number): Promise<ProductRow[]>;
  getProduct(id: number): Promise<ProductRow | null>;
  createProduct(input: any): Promise<ProductRow>;
  updateProduct(id: number, input: any): Promise<ProductRow | null>;
  deleteProduct(id: number): Promise<void>;

  getGroups(productId?: number, status?: string): Promise<GroupRow[]>;
  getGroup(id: number): Promise<GroupRow | null>;
  createGroup(input: { productId: number; minPeople: number }): Promise<GroupRow>;
  addMemberToGroup(groupId: number, input: { name: string; phone: string; userId?: number }): Promise<GroupRow>;
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

  createOrder(input: { userId: number; items: any; total: string }): Promise<OrderRow>;
  getOrders(userId?: number): Promise<OrderRow[]>;
  getOrder(id: number): Promise<OrderRow | null>;
  updateOrderStatus(id: number, status: string): Promise<OrderRow | null>;

  getAdminStats(): Promise<{ totalProducts: number; totalOrders: number; totalUsers: number; totalGroups: number; totalRevenue: number; openGroups: number; pendingOrders: number }>;
  getAllUsers(): Promise<UserRow[]>;
  getOrdersWithUsers(): Promise<(OrderRow & { userName: string; userEmail: string; userPhone: string | null })[]>;
  updateMemberReserveStatus(memberId: number, reserveStatus: string): Promise<MemberRow | null>;

  createAuditLog(input: { userId: number; userName: string; action: string; entity: string; entityId?: number; details?: any; ipAddress?: string }): Promise<void>;
  getAuditLogs(limit?: number): Promise<any[]>;

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
  active,
  category_id AS "categoryId",
  subcategory_id AS "subcategoryId",
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
  created_at AS "createdAt"
`;

const USER_SELECT = `id, name, display_name AS "displayName", email, phone, role, email_verified AS "emailVerified", phone_verified AS "phoneVerified", address_cep AS "addressCep", address_street AS "addressStreet", address_number AS "addressNumber", address_complement AS "addressComplement", address_district AS "addressDistrict", address_city AS "addressCity", address_state AS "addressState", created_at AS "createdAt"`;

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

  async getCategory(id: number): Promise<CategoryRow | null> {
    const result = await pool.query(
      `SELECT ${CATEGORY_SELECT} FROM categories WHERE id = $1 LIMIT 1`,
      [id]
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

  async getProducts(category?: string, search?: string, saleMode?: string, categoryId?: number, subcategoryId?: number): Promise<ProductRow[]> {
    const values: unknown[] = [];
    const conditions: string[] = ["active = true"];

    if (search?.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    if (category && category.toLowerCase() !== "todos") {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    if (saleMode) {
      values.push(saleMode);
      conditions.push(`sale_mode = $${values.length}`);
    }

    if (categoryId) {
      values.push(categoryId);
      conditions.push(`category_id = $${values.length}`);
    }
    if (subcategoryId) {
      values.push(subcategoryId);
      conditions.push(`subcategory_id = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT ${PRODUCT_SELECT} FROM products ${where} ORDER BY id DESC`,
      values,
    );
    return result.rows as ProductRow[];
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
        (name, description, image_url, original_price, group_price, now_price, min_people, stock, reserve_fee, category, sale_mode, active, category_id, subcategory_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
        input.active !== undefined ? input.active : true,
        input.categoryId || null,
        input.subcategoryId || null,
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
      active: "active",
      categoryId: "category_id",
      subcategoryId: "subcategory_id",
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
              p.name AS "productName", p.image_url AS "productImageUrl"
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

  async addMemberToGroup(groupId: number, input: { name: string; phone: string; userId?: number }): Promise<GroupRow> {
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
        `INSERT INTO members (group_id, name, phone, user_id, reserve_status) VALUES ($1, $2, $3, $4, $5)`,
        [groupId, input.name, input.phone, input.userId || null, hasReserveFee ? "pendente" : "nenhuma"],
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

  async createOrder(input: { userId: number; items: any; total: string }): Promise<OrderRow> {
    const result = await pool.query(
      `INSERT INTO orders (user_id, items, total, status)
      VALUES ($1, $2::jsonb, $3, 'recebido')
      RETURNING ${ORDER_SELECT}`,
      [input.userId, JSON.stringify(input.items), input.total],
    );
    return result.rows[0] as OrderRow;
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
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING ${ORDER_SELECT}`,
      [status, id],
    );
    return (result.rows[0] as OrderRow | undefined) ?? null;
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
      `SELECT o.id, o.user_id AS "userId", o.items, o.total, o.status, o.created_at AS "createdAt",
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
}

export const storage: IStorage = new DatabaseStorage();

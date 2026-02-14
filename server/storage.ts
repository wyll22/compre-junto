import { pool } from "./db";
import type { InsertProduct, InsertBanner, InsertVideo } from "@shared/schema";
import bcrypt from "bcryptjs";

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
  email: string;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  createdAt?: Date | string | null;
};

export interface IStorage {
  getProducts(category?: string, search?: string, saleMode?: string): Promise<ProductRow[]>;
  getProduct(id: number): Promise<ProductRow | null>;
  createProduct(input: any): Promise<ProductRow>;
  updateProduct(id: number, input: any): Promise<ProductRow | null>;
  deleteProduct(id: number): Promise<void>;

  getGroups(productId?: number, status?: string): Promise<GroupRow[]>;
  getGroup(id: number): Promise<GroupRow | null>;
  createGroup(input: { productId: number; minPeople: number }): Promise<GroupRow>;
  addMemberToGroup(groupId: number, input: { name: string; phone: string; userId?: number }): Promise<GroupRow>;
  updateGroupStatus(id: number, status: string): Promise<GroupRow | null>;

  getBanners(activeOnly?: boolean): Promise<BannerRow[]>;
  createBanner(input: any): Promise<BannerRow>;
  updateBanner(id: number, input: any): Promise<BannerRow | null>;
  deleteBanner(id: number): Promise<void>;

  getVideos(activeOnly?: boolean): Promise<VideoRow[]>;
  createVideo(input: any): Promise<VideoRow>;
  updateVideo(id: number, input: any): Promise<VideoRow | null>;
  deleteVideo(id: number): Promise<void>;

  registerUser(input: { name: string; email: string; password: string; phone?: string }): Promise<UserRow>;
  loginUser(email: string, password: string): Promise<UserRow | null>;
  getUserById(id: number): Promise<UserRow | null>;

  seedProducts(): Promise<void>;
}

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

class DatabaseStorage implements IStorage {
  async getProducts(category?: string, search?: string, saleMode?: string): Promise<ProductRow[]> {
    const values: unknown[] = [];
    const conditions: string[] = [];

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
        (name, description, image_url, original_price, group_price, now_price, min_people, stock, reserve_fee, category, sale_mode, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
      conditions.push(`product_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT ${GROUP_SELECT} FROM groups ${where} ORDER BY id DESC`,
      values,
    );

    return result.rows as GroupRow[];
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
      if (group.status !== "aberto") throw new Error("Grupo ja esta fechado");

      const dupRes = await client.query(
        `SELECT id FROM members WHERE group_id = $1 AND phone = $2 LIMIT 1`,
        [groupId, input.phone],
      );

      if (!dupRes.rows.length) {
        await client.query(
          `INSERT INTO members (group_id, name, phone, user_id) VALUES ($1, $2, $3, $4)`,
          [groupId, input.name, input.phone, input.userId || null],
        );

        const nextPeople = Number(group.current_people) + 1;
        const nextStatus = nextPeople >= Number(group.min_people) ? "fechado" : "aberto";

        await client.query(
          `UPDATE groups SET current_people = $1, status = $2 WHERE id = $3`,
          [nextPeople, nextStatus, groupId],
        );
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
      title: "title",
      imageUrl: "image_url",
      mobileImageUrl: "mobile_image_url",
      linkUrl: "link_url",
      sortOrder: "sort_order",
      active: "active",
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
      [
        input.title || "",
        input.embedUrl,
        Number(input.sortOrder) || 0,
        input.active !== undefined ? input.active : true,
      ],
    );
    return result.rows[0] as VideoRow;
  }

  async updateVideo(id: number, input: any): Promise<VideoRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    const map: Record<string, string> = {
      title: "title",
      embedUrl: "embed_url",
      sortOrder: "sort_order",
      active: "active",
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

  async registerUser(input: { name: string; email: string; password: string; phone?: string }): Promise<UserRow> {
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [input.email.toLowerCase()]);
    if (existing.rows.length) throw new Error("Email ja cadastrado");

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role)
      VALUES ($1, $2, $3, $4, 'user')
      RETURNING id, name, email, phone, role, email_verified AS "emailVerified", created_at AS "createdAt"`,
      [input.name, input.email.toLowerCase(), hashedPassword, input.phone || ""],
    );
    return result.rows[0] as UserRow;
  }

  async loginUser(email: string, password: string): Promise<UserRow | null> {
    const result = await pool.query(
      `SELECT id, name, email, password, phone, role, email_verified AS "emailVerified", created_at AS "createdAt"
      FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase()],
    );

    const user = result.rows[0] as any;
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;

    const { password: _, ...safeUser } = user;
    return safeUser as UserRow;
  }

  async getUserById(id: number): Promise<UserRow | null> {
    const result = await pool.query(
      `SELECT id, name, email, phone, role, email_verified AS "emailVerified", created_at AS "createdAt"
      FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    return (result.rows[0] as UserRow | undefined) ?? null;
  }

  async seedProducts(): Promise<void> {
    try {
      const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM products`);
      const total = countRes.rows[0]?.total ?? 0;
      if (total > 0) return;

      const seed: any[] = [
        {
          name: "Kit Cesta Basica Premium",
          description: "Itens essenciais para o mes inteiro",
          imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
          originalPrice: "120",
          groupPrice: "85",
          nowPrice: "110",
          minPeople: 10,
          stock: 500,
          category: "Basico",
          saleMode: "grupo",
        },
        {
          name: "Fardo de Coca-Cola 1.5L (6 un)",
          description: "Refrigerante Coca-Cola 1.5L",
          imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800",
          originalPrice: "59.9",
          groupPrice: "42",
          nowPrice: "54.9",
          minPeople: 5,
          stock: 200,
          category: "Bebida",
          saleMode: "grupo",
        },
        {
          name: "Kit Higiene Pessoal Familiar",
          description: "Sabonete, shampoo e creme dental",
          imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800",
          originalPrice: "45",
          groupPrice: "29.9",
          nowPrice: "39.9",
          minPeople: 8,
          stock: 300,
          category: "Higiene pessoal",
          saleMode: "grupo",
        },
        {
          name: "Sabao Liquido OMO 3L",
          description: "Limpeza pesada com alto rendimento",
          imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800",
          originalPrice: "48.9",
          groupPrice: "35.5",
          nowPrice: "44.9",
          minPeople: 15,
          stock: 400,
          category: "Limpeza",
          saleMode: "grupo",
        },
        {
          name: "Cafe Pilao 500g",
          description: "Cafe torrado e moido tradicional",
          imageUrl: "https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?w=800",
          originalPrice: "18.9",
          groupPrice: "14.5",
          nowPrice: "16.9",
          minPeople: 10,
          stock: 600,
          category: "Matinais",
          saleMode: "agora",
        },
        {
          name: "Desinfetante Pinho Sol 1L",
          description: "Limpeza profunda e perfumada",
          imageUrl: "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800",
          originalPrice: "12.9",
          groupPrice: "8.9",
          nowPrice: "11.5",
          minPeople: 12,
          stock: 350,
          category: "Limpeza",
          saleMode: "agora",
        },
        {
          name: "Racao Premium Caes 15kg",
          description: "Racao premium para caes adultos",
          imageUrl: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=800",
          originalPrice: "129.9",
          groupPrice: "95",
          nowPrice: "119.9",
          minPeople: 5,
          stock: 100,
          category: "Pet Shop",
          saleMode: "agora",
        },
        {
          name: "Caixa de Leite Integral 12un",
          description: "Leite integral longa vida",
          imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800",
          originalPrice: "59.9",
          groupPrice: "42",
          nowPrice: "52.9",
          minPeople: 8,
          stock: 250,
          category: "Frios e Laticinios",
          saleMode: "grupo",
        },
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
}

export const storage: IStorage = new DatabaseStorage();

import { pool } from "./db";
import type { InsertProduct } from "@shared/schema";

type GroupStatus = "aberto" | "fechado";

type ProductRow = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: string | number;
  groupPrice: string | number;
  minPeople: number;
  category: string;
  saleMode: string;
  createdAt?: Date | string | null;
};

type GroupRow = {
  id: number;
  productId: number;
  currentPeople: number;
  minPeople: number;
  status: GroupStatus;
  createdAt?: Date | string | null;
};

type JoinMemberInput = {
  name: string;
  phone: string;
};

type CreateGroupAndJoinInput = {
  productId: number;
  name: string;
  phone: string;
};

type JoinGroupInput = {
  groupId: number;
  name: string;
  phone: string;
};

type ProductUpdateInput = Partial<InsertProduct>;

export interface IStorage {
  getProducts(category?: string, search?: string): Promise<ProductRow[]>;
  getProduct(id: number): Promise<ProductRow | null>;
  createProduct(input: InsertProduct): Promise<ProductRow>;
  updateProduct(
    id: number,
    input: ProductUpdateInput,
  ): Promise<ProductRow | null>;
  deleteProduct(id: number): Promise<void>;

  // ✅ aceita status em string (vindo de req.query) e normaliza internamente
  getGroups(productId?: number, status?: string): Promise<GroupRow[]>;
  getGroup(id: number): Promise<GroupRow | null>;

  createGroup(input: {
    productId: number;
    minPeople: number;
  }): Promise<GroupRow>;
  addMemberToGroup(groupId: number, input: JoinMemberInput): Promise<GroupRow>;
  createGroupAndJoin(
    input: CreateGroupAndJoinInput,
  ): Promise<GroupRow>;
  joinGroup(input: JoinGroupInput): Promise<GroupRow>;

  seedProducts(): Promise<void>;
}

function normalizeCategory(cat?: string) {
  if (!cat) return undefined;
  const c = cat.trim().toLowerCase();

  if (c === "todos") return undefined;

  // abas UI -> categoria salva no banco
  if (c === "mercado") return "Alimentos";
  if (c === "casa & limpeza" || c === "casa e limpeza") return "Limpeza";
  if (c === "higiene & beleza" || c === "higiene e beleza") return "Higiene";
  if (c === "agro & pet" || c === "agro e pet") return "Pet";

  return cat.trim();
}

function normalizeStatus(status?: string): GroupStatus | undefined {
  if (!status) return undefined;
  const s = status.trim().toLowerCase();
  if (s === "aberto") return "aberto";
  if (s === "fechado") return "fechado";
  return undefined;
}

function toCreateGroupAndJoinPayload(
  input: CreateGroupAndJoinInput | number,
  maybeInput?: JoinMemberInput,
): CreateGroupAndJoinInput {
  if (typeof input === "number") {
    if (!maybeInput) throw new Error("Dados de membro não informados");
    return {
      productId: input,
      name: maybeInput.name,
      phone: maybeInput.phone,
    };
  }
  return input;
}

class DatabaseStorage implements IStorage {
  // =========================
  // PRODUCTS
  // =========================
  async getProducts(category?: string, search?: string): Promise<ProductRow[]> {
    const values: unknown[] = [];
    const conditions: string[] = [];

    if (search?.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    const mappedCategory = normalizeCategory(category);
    if (mappedCategory) {
      values.push(mappedCategory);
      conditions.push(`category = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        image_url AS "imageUrl",
        original_price AS "originalPrice",
        group_price AS "groupPrice",
        min_people AS "minPeople",
        category,
        sale_mode AS "saleMode",
        created_at AS "createdAt"
      FROM products
      ${where}
      ORDER BY id DESC
      `,
      values,
    );

    return result.rows as ProductRow[];
  }

  async getProduct(id: number): Promise<ProductRow | null> {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        image_url AS "imageUrl",
        original_price AS "originalPrice",
        group_price AS "groupPrice",
        min_people AS "minPeople",
        category,
        sale_mode AS "saleMode",
        created_at AS "createdAt"
      FROM products
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    return (result.rows[0] as ProductRow | undefined) ?? null;
  }

  async createProduct(input: any): Promise<ProductRow> {
    const result = await pool.query(
      `
      INSERT INTO products
        (name, description, image_url, original_price, group_price, min_people, category, sale_mode)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        name,
        description,
        image_url AS "imageUrl",
        original_price AS "originalPrice",
        group_price AS "groupPrice",
        min_people AS "minPeople",
        category,
        sale_mode AS "saleMode",
        created_at AS "createdAt"
      `,
      [
        input.name,
        input.description ?? "",
        input.imageUrl ?? "",
        input.originalPrice.toString(),
        input.groupPrice.toString(),
        Number(input.minPeople),
        input.category,
        input.saleMode ?? "group",
      ],
    );

    return result.rows[0] as ProductRow;
  }

  async updateProduct(
    id: number,
    input: ProductUpdateInput,
  ): Promise<ProductRow | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const map: Record<string, string> = {
      name: "name",
      description: "description",
      imageUrl: "image_url",
      originalPrice: "original_price",
      groupPrice: "group_price",
      minPeople: "min_people",
      category: "category",
      saleMode: "sale_mode",
    };

    for (const [key, rawValue] of Object.entries(input)) {
      if (rawValue === undefined) continue;
      const dbField = map[key];
      if (!dbField) continue;

      let value: unknown = rawValue;
      if (
        key === "originalPrice" ||
        key === "groupPrice" ||
        key === "minPeople"
      ) {
        value = Number(rawValue);
      }

      values.push(value);
      fields.push(`${dbField} = $${values.length}`);
    }

    if (!fields.length) {
      return this.getProduct(id);
    }

    values.push(id);

    const result = await pool.query(
      `
      UPDATE products
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING
        id,
        name,
        description,
        image_url AS "imageUrl",
        original_price AS "originalPrice",
        group_price AS "groupPrice",
        min_people AS "minPeople",
        category,
        sale_mode AS "saleMode",
        created_at AS "createdAt"
      `,
      values,
    );

    return (result.rows[0] as ProductRow | undefined) ?? null;
  }

  async deleteProduct(id: number): Promise<void> {
    await pool.query(`DELETE FROM products WHERE id = $1`, [id]);
  }

  // =========================
  // GROUPS
  // =========================
  async getGroups(productId?: number, status?: string): Promise<GroupRow[]> {
    const values: unknown[] = [];
    const conditions: string[] = [];

    if (productId !== undefined) {
      values.push(productId);
      conditions.push(`product_id = $${values.length}`);
    }

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      values.push(normalizedStatus);
      conditions.push(`status = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT
        id,
        product_id AS "productId",
        current_people AS "currentPeople",
        min_people AS "minPeople",
        status,
        created_at AS "createdAt"
      FROM groups
      ${where}
      ORDER BY id DESC
      `,
      values,
    );

    return result.rows as GroupRow[];
  }

  async getGroup(id: number): Promise<GroupRow | null> {
    const result = await pool.query(
      `
      SELECT
        id,
        product_id AS "productId",
        current_people AS "currentPeople",
        min_people AS "minPeople",
        status,
        created_at AS "createdAt"
      FROM groups
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    return (result.rows[0] as GroupRow | undefined) ?? null;
  }

  async createGroup(input: {
    productId: number;
    minPeople: number;
  }): Promise<GroupRow> {
    const result = await pool.query(
      `
      INSERT INTO groups (product_id, current_people, min_people, status)
      VALUES ($1, 0, $2, 'aberto')
      RETURNING
        id,
        product_id AS "productId",
        current_people AS "currentPeople",
        min_people AS "minPeople",
        status,
        created_at AS "createdAt"
      `,
      [input.productId, Number(input.minPeople)],
    );

    return result.rows[0] as GroupRow;
  }

  async addMemberToGroup(
    groupId: number,
    input: JoinMemberInput,
  ): Promise<GroupRow> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const groupRes = await client.query(
        `
        SELECT id, product_id, current_people, min_people, status
        FROM groups
        WHERE id = $1
        FOR UPDATE
        `,
        [groupId],
      );

      const group = groupRes.rows[0] as
        | {
            id: number;
            product_id: number;
            current_people: number;
            min_people: number;
            status: string;
          }
        | undefined;

      if (!group) throw new Error("Grupo não encontrado");
      if (group.status !== "aberto") throw new Error("Grupo já está fechado");

      // evita duplicidade por telefone no mesmo grupo
      const dupRes = await client.query(
        `SELECT id FROM members WHERE group_id = $1 AND phone = $2 LIMIT 1`,
        [groupId, input.phone],
      );

      if (!dupRes.rows.length) {
        await client.query(
          `INSERT INTO members (group_id, name, phone) VALUES ($1, $2, $3)`,
          [groupId, input.name, input.phone],
        );

        const nextPeople = Number(group.current_people) + 1;
        const nextStatus =
          nextPeople >= Number(group.min_people) ? "fechado" : "aberto";

        await client.query(
          `UPDATE groups SET current_people = $1, status = $2 WHERE id = $3`,
          [nextPeople, nextStatus, groupId],
        );
      }

      const updated = await client.query(
        `
        SELECT
          id,
          product_id AS "productId",
          current_people AS "currentPeople",
          min_people AS "minPeople",
          status,
          created_at AS "createdAt"
        FROM groups
        WHERE id = $1
        `,
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

  async createGroupAndJoin(
    input: CreateGroupAndJoinInput,
  ): Promise<GroupRow> {
    const payload = input;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // procura grupo aberto do produto
      const openRes = await client.query(
        `
        SELECT id, product_id, current_people, min_people, status
        FROM groups
        WHERE product_id = $1 AND status = 'aberto'
        ORDER BY id DESC
        LIMIT 1
        FOR UPDATE
        `,
        [payload.productId],
      );

      let group = openRes.rows[0] as
        | {
            id: number;
            product_id: number;
            current_people: number;
            min_people: number;
            status: string;
          }
        | undefined;

      // se não houver grupo aberto, cria
      if (!group) {
        const productRes = await client.query(
          `SELECT id, min_people FROM products WHERE id = $1 LIMIT 1`,
          [payload.productId],
        );
        const product = productRes.rows[0] as
          | { id: number; min_people: number }
          | undefined;
        if (!product) throw new Error("Produto não encontrado");

        const createRes = await client.query(
          `
          INSERT INTO groups (product_id, current_people, min_people, status)
          VALUES ($1, 0, $2, 'aberto')
          RETURNING id, product_id, current_people, min_people, status
          `,
          [payload.productId, Number(product.min_people)],
        );
        group = createRes.rows[0] as {
          id: number;
          product_id: number;
          current_people: number;
          min_people: number;
          status: string;
        };
      }

      // evita duplicidade por telefone
      const dupRes = await client.query(
        `SELECT id FROM members WHERE group_id = $1 AND phone = $2 LIMIT 1`,
        [group.id, payload.phone],
      );

      if (!dupRes.rows.length) {
        await client.query(
          `INSERT INTO members (group_id, name, phone) VALUES ($1, $2, $3)`,
          [group.id, payload.name, payload.phone],
        );

        const nextPeople = Number(group.current_people) + 1;
        const nextStatus =
          nextPeople >= Number(group.min_people) ? "fechado" : "aberto";

        await client.query(
          `UPDATE groups SET current_people = $1, status = $2 WHERE id = $3`,
          [nextPeople, nextStatus, group.id],
        );
      }

      const updated = await client.query(
        `
        SELECT
          id,
          product_id AS "productId",
          current_people AS "currentPeople",
          min_people AS "minPeople",
          status,
          created_at AS "createdAt"
        FROM groups
        WHERE id = $1
        `,
        [group.id],
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

  async joinGroup(input: JoinGroupInput): Promise<GroupRow> {
    return this.addMemberToGroup(input.groupId, {
      name: input.name,
      phone: input.phone,
    });
  }

  // =========================
  // SEED
  // =========================
  async seedProducts(): Promise<void> {
    try {
      const countRes = await pool.query(
        `SELECT COUNT(*)::int AS total FROM products`,
      );
      const total = countRes.rows[0]?.total ?? 0;
      if (total > 0) return;

      const seed: any[] = [
        {
          name: "Kit Cesta Básica Premium",
          description: "Itens essenciais para o mês inteiro",
          imageUrl:
            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800",
          originalPrice: "120",
          groupPrice: "85",
          minPeople: 10,
          category: "Alimentos",
        },
        {
          name: "Fardo de Coca-Cola 1.5L (6 un)",
          description: "Refrigerante Coca-Cola 1.5L",
          imageUrl:
            "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800",
          originalPrice: "59.9",
          groupPrice: "42",
          minPeople: 5,
          category: "Bebidas",
        },
        {
          name: "Kit Higiene Pessoal Familiar",
          description: "Sabonete, shampoo e creme dental",
          imageUrl:
            "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800",
          originalPrice: "45",
          groupPrice: "29.9",
          minPeople: 8,
          category: "Higiene",
        },
        {
          name: "Sabão Líquido OMO 3L",
          description: "Limpeza pesada com alto rendimento",
          imageUrl:
            "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800",
          originalPrice: "48.9",
          groupPrice: "35.5",
          minPeople: 15,
          category: "Limpeza",
          saleMode: "group",
        },
        {
          name: "Fone de Ouvido Bluetooth JBL",
          description: "Som potente e bateria de longa duração",
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
          originalPrice: "249.9",
          groupPrice: "199.9",
          minPeople: 1,
          category: "Eletrônicos",
          saleMode: "buyNow",
        },
        {
          name: "Cafeteira Nespresso Essenza",
          description: "Café perfeito a qualquer hora",
          imageUrl: "https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?w=800",
          originalPrice: "499.9",
          groupPrice: "389.9",
          minPeople: 1,
          category: "Eletro",
          saleMode: "buyNow",
        },
      ];

      for (const p of seed) {
        await this.createProduct(p);
      }
    } catch (error) {
      console.error("Erro ao semear produtos:", error);
    }
  }
}

export const storage: IStorage = new DatabaseStorage();

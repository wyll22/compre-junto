import { db } from "./db";
import {
  products, groups, members, users,
  type Product, type InsertProduct,
  type Group, type InsertGroup,
  type Member, type InsertMember,
  type User, type InsertUser
} from "@shared/schema";
import { eq, like, and, desc } from "drizzle-orm";

export interface IStorage {
  getProducts(category?: string, search?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  getGroups(productId?: number, status?: string): Promise<(Group & { product: Product, members: Member[] })[]>;
  getGroup(id: number): Promise<(Group & { product: Product, members: Member[] }) | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, group: Partial<InsertGroup>): Promise<Group>;
  addMemberToGroup(groupId: number, userData: { name: string, phone: string }): Promise<Group>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    let conditions = [];
    if (category && category !== 'Todos') {
      conditions.push(eq(products.category, category));
    }
    if (search) {
      conditions.push(like(products.name, `%${search}%`));
    }
    if (conditions.length > 0) {
      return await db.select().from(products).where(and(...conditions));
    }
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db.update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getGroups(productId?: number, status?: string): Promise<(Group & { product: Product, members: Member[] })[]> {
    const result = await db.query.groups.findMany({
      where: and(
        productId ? eq(groups.productId, productId) : undefined,
        status ? eq(groups.status, status) : undefined
      ),
      with: {
        product: true,
        members: true
      },
      orderBy: [desc(groups.createdAt)]
    });
    return result;
  }

  async getGroup(id: number): Promise<(Group & { product: Product, members: Member[] }) | undefined> {
    const result = await db.query.groups.findFirst({
      where: eq(groups.id, id),
      with: {
        product: true,
        members: true
      }
    });
    return result;
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values({
        ...group,
        currentPeople: 0,
        status: 'aberto'
    }).returning();
    return newGroup;
  }

  async updateGroup(id: number, updates: Partial<InsertGroup>): Promise<Group> {
    const [updated] = await db.update(groups)
      .set(updates)
      .where(eq(groups.id, id))
      .returning();
    return updated;
  }

  async addMemberToGroup(groupId: number, userData: { name: string, phone: string }): Promise<Group> {
    const [user] = await db.insert(users).values({
      name: userData.name,
      identifier: userData.phone
    }).returning();

    await db.insert(members).values({
        groupId,
        userId: user.id,
        name: user.name,
        phone: user.identifier
    });
    
    const group = await this.getGroup(groupId);
    if (!group) throw new Error("Group not found");

    const newCount = group.currentPeople + 1;
    const updates: Partial<InsertGroup> = { currentPeople: newCount };
    
    if (newCount >= group.minPeople) {
        updates.status = 'completo';
    }

    const [updatedGroup] = await db.update(groups)
        .set(updates)
        .where(eq(groups.id, groupId))
        .returning();
    
    return updatedGroup;
  }
}

export const storage = new DatabaseStorage();

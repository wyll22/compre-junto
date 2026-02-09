import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertProductSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const category = req.query.category as string;
    const search = req.query.search as string;
    const products = await storage.getProducts(category, search);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.products.update.path, async (req, res) => {
    try {
        const input = api.products.update.input.parse(req.body);
        const product = await storage.updateProduct(Number(req.params.id), input);
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: "Update failed" });
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  // Groups
  app.get(api.groups.list.path, async (req, res) => {
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const status = req.query.status as string;
    const groups = await storage.getGroups(productId, status);
    res.json(groups);
  });

  app.get(api.groups.get.path, async (req, res) => {
      const group = await storage.getGroup(Number(req.params.id));
      if (!group) return res.status(404).json({ message: "Group not found" });
      res.json(group);
  });

  app.post(api.groups.create.path, async (req, res) => {
    const productId = req.body.productId;
    const product = await storage.getProduct(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const group = await storage.createGroup({
        productId,
        minPeople: product.minPeople,
    });
    res.status(201).json(group);
  });

  app.post(api.groups.join.path, async (req, res) => {
    try {
        const input = api.groups.join.input.parse(req.body);
        const groupId = Number(req.params.id);
        const group = await storage.addMemberToGroup({ ...input, groupId });
        res.json(group);
    } catch (err) {
        res.status(400).json({ message: "Failed to join group" });
    }
  });

  // Seed data
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const products = await storage.getProducts();
  if (products.length === 0) {
    console.log("Seeding database...");
    await storage.createProduct({
        name: "Arroz Tio João 5kg",
        description: "Arroz branco tipo 1, soltinho e saboroso.",
        imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60",
        originalPrice: "25.90",
        groupPrice: "19.90",
        minPeople: 10,
        category: "Alimentos"
    });
    await storage.createProduct({
        name: "Feijão Camil 1kg",
        description: "Feijão carioca de alta qualidade.",
        imageUrl: "https://images.unsplash.com/photo-1551489186-cf8726f514f8?w=500&auto=format&fit=crop&q=60",
        originalPrice: "9.90",
        groupPrice: "6.99",
        minPeople: 15,
        category: "Alimentos"
    });
    await storage.createProduct({
        name: "Coca-Cola 2L",
        description: "Refrigerante de cola.",
        imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60",
        originalPrice: "10.00",
        groupPrice: "7.50",
        minPeople: 20,
        category: "Bebidas"
    });
    await storage.createProduct({
        name: "Heineken 350ml (Pack 12)",
        description: "Cerveja Premium Lager.",
        imageUrl: "https://images.unsplash.com/photo-1623592477122-861cb7044675?w=500&auto=format&fit=crop&q=60",
        originalPrice: "48.00",
        groupPrice: "39.90",
        minPeople: 5,
        category: "Bebidas"
    });
    await storage.createProduct({
        name: "Sabão em Pó Omo 1.6kg",
        description: "Limpeza profunda e perfume duradouro.",
        imageUrl: "https://images.unsplash.com/photo-1585830816768-ae42475477c7?w=500&auto=format&fit=crop&q=60",
        originalPrice: "22.00",
        groupPrice: "16.90",
        minPeople: 30,
        category: "Limpeza"
    });
    await storage.createProduct({
        name: "Kit Shampoo + Condicionador Pantene",
        description: "Para cabelos danificados.",
        imageUrl: "https://images.unsplash.com/photo-1585232561307-3f83b0b70d47?w=500&auto=format&fit=crop&q=60",
        originalPrice: "35.90",
        groupPrice: "24.90",
        minPeople: 10,
        category: "Higiene"
    });
  }
}

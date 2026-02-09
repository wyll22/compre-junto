import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use(
    session({
      cookie: { maxAge: 86400000 },
      store: new SessionStore({
        checkPeriod: 86400000,
      }),
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET || "compre-junto-fsa-secret",
    })
  );

  // Auth
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      let user = await storage.getUserByIdentifier(input.identifier);
      if (!user) {
        user = await storage.createUser(input);
      }
      (req.session as any).userId = user.id;
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: "Erro ao realizar login" });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.json(null);
    const user = await storage.getUser(userId);
    res.json(user || null);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const category = req.query.category as string;
    const search = req.query.search as string;
    const products = await storage.getProducts(category, search);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Produto não encontrado" });
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
        res.status(400).json({ message: "Erro ao atualizar produto" });
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
      if (!group) return res.status(404).json({ message: "Grupo não encontrado" });
      res.json(group);
  });

  app.post(api.groups.create.path, async (req, res) => {
    const productId = req.body.productId;
    const product = await storage.getProduct(productId);
    if (!product) return res.status(404).json({ message: "Produto não encontrado" });

    const group = await storage.createGroup({
        productId,
        minPeople: product.minPeople,
    });
    res.status(201).json(group);
  });

  app.post(api.groups.join.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Você precisa estar logado para entrar no grupo" });

    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Usuário não encontrado" });

    try {
        const groupId = Number(req.params.id);
        const group = await storage.addMemberToGroup(groupId, user);
        res.json(group);
    } catch (err) {
        res.status(400).json({ message: "Erro ao entrar no grupo" });
    }
  });

  // Seed data
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const products = await storage.getProducts();
  if (products.length === 0) {
    console.log("Semeando banco de dados...");
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
  }
}

import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
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
    if (!product)
      return res.status(404).json({ message: "Produto não encontrado" });
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
    const productId = req.query.productId
      ? Number(req.query.productId)
      : undefined;
    const status = req.query.status as string;
    const groups = await storage.getGroups(productId, status);
    res.json(groups);
  });

  app.get(api.groups.get.path, async (req, res) => {
    const group = await storage.getGroup(Number(req.params.id));
    if (!group)
      return res.status(404).json({ message: "Grupo não encontrado" });
    res.json(group);
  });

  // Criar grupo + já entrar como 1º membro (nome/telefone)
  app.post(api.groups.create.path, async (req, res) => {
    try {
      const productId = Number(req.body.productId);
      const name = String(req.body.name ?? "").trim();
      const phone = String(req.body.phone ?? "").trim();

      if (!productId)
        return res.status(400).json({ message: "productId é obrigatório" });
      if (!name) return res.status(400).json({ message: "name é obrigatório" });
      if (!phone)
        return res.status(400).json({ message: "phone é obrigatório" });

      const product = await storage.getProduct(productId);
      if (!product)
        return res.status(404).json({ message: "Produto não encontrado" });

      // 1) cria o grupo
      const group = await storage.createGroup({
        productId,
        minPeople: product.minPeople,
      });

      // 2) adiciona o primeiro membro e atualiza contagem do grupo
      const updatedGroup = await storage.addMemberToGroup(group.id, {
        name,
        phone,
      });

      res.status(201).json(updatedGroup);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Erro ao criar grupo" });
    }
  });

  // Entrar em um grupo existente (recebe groupId no body)
  app.post(api.groups.join.path, async (req, res) => {
    try {
      const groupId = Number(req.body.groupId);
      const name = String(req.body.name ?? "").trim();
      const phone = String(req.body.phone ?? "").trim();

      if (!groupId)
        return res.status(400).json({ message: "groupId é obrigatório" });
      if (!name) return res.status(400).json({ message: "name é obrigatório" });
      if (!phone)
        return res.status(400).json({ message: "phone é obrigatório" });

      const group = await storage.getGroup(groupId);
      if (!group)
        return res.status(404).json({ message: "Grupo não encontrado" });

      const updatedGroup = await storage.addMemberToGroup(groupId, {
        name,
        phone,
      });

      res.json(updatedGroup);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Erro ao entrar no grupo" });
    }
  });

  // Executa o seed dos produtos ao iniciar as rotas
  storage.seedProducts().catch(console.error);

  return httpServer;
}

import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const PgStore = pgSession(session);

  app.use(
    session({
      store: new PgStore({
        pool: pool as any,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "compra-junto-formosa-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    }),
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Nome, email e senha sao obrigatorios" });
      }
      const user = await storage.registerUser({ name, email, password, phone });
      req.session.userId = user.id;
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao cadastrar" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha sao obrigatorios" });
      }
      const user = await storage.loginUser(email, password);
      if (!user) {
        return res.status(401).json({ message: "Email ou senha incorretos" });
      }
      req.session.userId = user.id;
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Nao autenticado" });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Usuario nao encontrado" });
    }
    res.json(user);
  });

  app.get("/api/products", async (req: Request, res: Response) => {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const saleMode = req.query.saleMode as string | undefined;
    const products = await storage.getProducts(category, search, saleMode);
    res.json(products);
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Produto nao encontrado" });
    res.json(product);
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar produto" });
    }
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.updateProduct(Number(req.params.id), req.body);
      res.json(product);
    } catch (err: any) {
      res.status(400).json({ message: "Erro ao atualizar produto" });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/groups", async (req: Request, res: Response) => {
    const productId = req.query.productId ? Number(req.query.productId) : undefined;
    const status = req.query.status as string | undefined;
    const groups = await storage.getGroups(productId, status);
    res.json(groups);
  });

  app.get("/api/groups/:id", async (req: Request, res: Response) => {
    const group = await storage.getGroup(Number(req.params.id));
    if (!group) return res.status(404).json({ message: "Grupo nao encontrado" });
    res.json(group);
  });

  app.post("/api/groups", async (req: Request, res: Response) => {
    try {
      const productId = Number(req.body.productId);
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ message: "Produto nao encontrado" });

      const group = await storage.createGroup({
        productId,
        minPeople: product.minPeople,
      });

      if (req.body.name && req.body.phone) {
        const updated = await storage.addMemberToGroup(group.id, {
          name: req.body.name,
          phone: req.body.phone,
          userId: req.session.userId,
        });
        return res.status(201).json(updated);
      }

      res.status(201).json(group);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar grupo" });
    }
  });

  app.post("/api/groups/:id/join", async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.params.id);
      const name = String(req.body.name ?? "").trim();
      const phone = String(req.body.phone ?? "").trim();

      if (!name) return res.status(400).json({ message: "Nome e obrigatorio" });
      if (!phone) return res.status(400).json({ message: "Telefone e obrigatorio" });

      const updated = await storage.addMemberToGroup(groupId, {
        name,
        phone,
        userId: req.session.userId,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao entrar no grupo" });
    }
  });

  app.post("/api/groups/join", async (req: Request, res: Response) => {
    try {
      const groupId = Number(req.body.groupId);
      const name = String(req.body.name ?? "").trim();
      const phone = String(req.body.phone ?? "").trim();

      if (!groupId) return res.status(400).json({ message: "groupId e obrigatorio" });
      if (!name) return res.status(400).json({ message: "Nome e obrigatorio" });
      if (!phone) return res.status(400).json({ message: "Telefone e obrigatorio" });

      const updated = await storage.addMemberToGroup(groupId, {
        name,
        phone,
        userId: req.session.userId,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao entrar no grupo" });
    }
  });

  app.patch("/api/groups/:id/status", async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const group = await storage.updateGroupStatus(Number(req.params.id), status);
      if (!group) return res.status(404).json({ message: "Grupo nao encontrado" });
      res.json(group);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao atualizar status" });
    }
  });

  app.get("/api/banners", async (req: Request, res: Response) => {
    const activeOnly = req.query.active === "true";
    const banners = await storage.getBanners(activeOnly);
    res.json(banners);
  });

  app.post("/api/banners", async (req: Request, res: Response) => {
    try {
      const banner = await storage.createBanner(req.body);
      res.status(201).json(banner);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar banner" });
    }
  });

  app.put("/api/banners/:id", async (req: Request, res: Response) => {
    try {
      const banner = await storage.updateBanner(Number(req.params.id), req.body);
      res.json(banner);
    } catch (err: any) {
      res.status(400).json({ message: "Erro ao atualizar banner" });
    }
  });

  app.delete("/api/banners/:id", async (req: Request, res: Response) => {
    await storage.deleteBanner(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/videos", async (req: Request, res: Response) => {
    const activeOnly = req.query.active === "true";
    const videos = await storage.getVideos(activeOnly);
    res.json(videos);
  });

  app.post("/api/videos", async (req: Request, res: Response) => {
    try {
      const video = await storage.createVideo(req.body);
      res.status(201).json(video);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar video" });
    }
  });

  app.put("/api/videos/:id", async (req: Request, res: Response) => {
    try {
      const video = await storage.updateVideo(Number(req.params.id), req.body);
      res.json(video);
    } catch (err: any) {
      res.status(400).json({ message: "Erro ao atualizar video" });
    }
  });

  app.delete("/api/videos/:id", async (req: Request, res: Response) => {
    await storage.deleteVideo(Number(req.params.id));
    res.status(204).send();
  });

  storage.seedProducts().catch(console.error);

  return httpServer;
}

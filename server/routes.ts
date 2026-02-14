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

function requireAuth(req: Request, res: Response): number | null {
  if (!req.session.userId) {
    res.status(401).json({ message: "Faca login para continuar" });
    return null;
  }
  return req.session.userId;
}

async function requireAdmin(req: Request, res: Response): Promise<number | null> {
  const userId = requireAuth(req, res);
  if (userId === null) return null;
  const user = await storage.getUserById(userId);
  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Acesso negado" });
    return null;
  }
  return userId;
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
      const { name, email, password, phone, displayName } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Nome, email e senha sao obrigatorios" });
      }
      const user = await storage.registerUser({ name, email, password, phone, displayName });
      req.session.userId = user.id;
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao cadastrar" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password, identifier } = req.body;
      const loginId = identifier || email;
      if (!loginId || !password) {
        return res.status(400).json({ message: "Email/telefone e senha sao obrigatorios" });
      }
      const user = await storage.loginUser(loginId, password);
      if (!user) {
        return res.status(401).json({ message: "Email/telefone ou senha incorretos" });
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

  app.put("/api/auth/profile", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    try {
      const { name, displayName, phone, addressCep, addressStreet, addressNumber, addressComplement, addressDistrict, addressCity, addressState } = req.body;
      const user = await storage.updateUser(userId, {
        name, displayName, phone,
        addressCep, addressStreet, addressNumber, addressComplement,
        addressDistrict, addressCity, addressState,
      });
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao atualizar perfil" });
    }
  });

  app.post("/api/auth/password", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Senha atual e nova senha sao obrigatorias" });
      }
      if (newPassword.length < 4) {
        return res.status(400).json({ message: "Nova senha deve ter pelo menos 4 caracteres" });
      }
      const success = await storage.changePassword(userId, currentPassword, newPassword);
      if (!success) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      res.json({ ok: true, message: "Senha alterada com sucesso" });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao alterar senha" });
    }
  });

  app.get("/api/categories", async (req: Request, res: Response) => {
    const parentId = req.query.parentId;
    let result;
    if (parentId === "null" || parentId === "0") {
      result = await storage.getCategories(null);
    } else if (parentId) {
      result = await storage.getCategories(Number(parentId));
    } else {
      result = await storage.getCategories();
    }
    res.json(result);
  });

  app.get("/api/categories/:id", async (req: Request, res: Response) => {
    const cat = await storage.getCategory(Number(req.params.id));
    if (!cat) return res.status(404).json({ message: "Categoria nao encontrada" });
    res.json(cat);
  });

  app.post("/api/categories", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const cat = await storage.createCategory(req.body);
      res.status(201).json(cat);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar categoria" });
    }
  });

  app.put("/api/categories/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const cat = await storage.updateCategory(Number(req.params.id), req.body);
      res.json(cat);
    } catch (err: any) {
      res.status(400).json({ message: "Erro ao atualizar categoria" });
    }
  });

  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    await storage.deleteCategory(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/products", async (req: Request, res: Response) => {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const saleMode = req.query.saleMode as string | undefined;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const subcategoryId = req.query.subcategoryId ? Number(req.query.subcategoryId) : undefined;
    const products = await storage.getProducts(category, search, saleMode, categoryId, subcategoryId);
    res.json(products);
  });

  app.get("/api/products/all", async (req: Request, res: Response) => {
    const result = await pool.query(
      `SELECT id, name, description, image_url AS "imageUrl", original_price AS "originalPrice",
              group_price AS "groupPrice", now_price AS "nowPrice", min_people AS "minPeople",
              stock, reserve_fee AS "reserveFee", category, sale_mode AS "saleMode",
              category_id AS "categoryId", subcategory_id AS "subcategoryId",
              active, created_at AS "createdAt"
       FROM products ORDER BY id DESC`,
    );
    res.json(result.rows);
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Produto nao encontrado" });
    res.json(product);
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const product = await storage.createProduct(req.body);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar produto" });
    }
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const product = await storage.updateProduct(Number(req.params.id), req.body);
      res.json(product);
    } catch (err: any) {
      res.status(400).json({ message: "Erro ao atualizar produto" });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
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

  app.get("/api/groups/:id/members", async (req: Request, res: Response) => {
    const members = await storage.getGroupMembers(Number(req.params.id));
    res.json(members);
  });

  app.post("/api/groups", async (req: Request, res: Response) => {
    try {
      const userId = requireAuth(req, res);
      if (userId === null) return;

      const productId = Number(req.body.productId);
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ message: "Produto nao encontrado" });

      const group = await storage.createGroup({
        productId,
        minPeople: product.minPeople,
      });

      const user = await storage.getUserById(userId);
      if (user) {
        const updated = await storage.addMemberToGroup(group.id, {
          name: req.body.name || user.name,
          phone: req.body.phone || user.phone || "",
          userId,
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
      const userId = requireAuth(req, res);
      if (userId === null) return;

      const groupId = Number(req.params.id);
      const user = await storage.getUserById(userId);
      const name = String(req.body.name || user?.name || "").trim();
      const phone = String(req.body.phone || user?.phone || "").trim();

      if (!name) return res.status(400).json({ message: "Nome e obrigatorio" });

      const updated = await storage.addMemberToGroup(groupId, {
        name,
        phone,
        userId,
      });

      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao entrar no grupo" });
    }
  });

  app.patch("/api/groups/:id/status", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const { status } = req.body;
      const group = await storage.updateGroupStatus(Number(req.params.id), status);
      if (!group) return res.status(404).json({ message: "Grupo nao encontrado" });
      res.json(group);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao atualizar status" });
    }
  });

  app.get("/api/user/groups", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    const groups = await storage.getUserGroups(userId);
    res.json(groups);
  });

  app.get("/api/banners", async (req: Request, res: Response) => {
    const activeOnly = req.query.active === "true";
    const banners = await storage.getBanners(activeOnly);
    res.json(banners);
  });

  app.post("/api/banners", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const banner = await storage.createBanner(req.body);
      res.status(201).json(banner);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar banner" });
    }
  });

  app.put("/api/banners/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const banner = await storage.updateBanner(Number(req.params.id), req.body);
      res.json(banner);
    } catch (err: any) {
      res.status(400).json({ message: "Erro ao atualizar banner" });
    }
  });

  app.delete("/api/banners/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    await storage.deleteBanner(Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/videos", async (req: Request, res: Response) => {
    const activeOnly = req.query.active === "true";
    const videos = await storage.getVideos(activeOnly);
    res.json(videos);
  });

  app.post("/api/videos", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const video = await storage.createVideo(req.body);
      res.status(201).json(video);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar video" });
    }
  });

  app.put("/api/videos/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const video = await storage.updateVideo(Number(req.params.id), req.body);
      res.json(video);
    } catch (err: any) {
      res.status(400).json({ message: "Erro ao atualizar video" });
    }
  });

  app.delete("/api/videos/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    await storage.deleteVideo(Number(req.params.id));
    res.status(204).send();
  });

  app.post("/api/orders", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    try {
      const { items, total } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Carrinho vazio" });
      }
      const order = await storage.createOrder({ userId, items, total: String(total) });
      res.status(201).json(order);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar pedido" });
    }
  });

  app.get("/api/orders", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    const user = await storage.getUserById(userId);
    if (user?.role === "admin" && req.query.all === "true") {
      const orders = await storage.getOrders();
      return res.json(orders);
    }
    const orders = await storage.getOrders(userId);
    res.json(orders);
  });

  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Pedido nao encontrado" });
    res.json(order);
  });

  app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(Number(req.params.id), status);
      if (!order) return res.status(404).json({ message: "Pedido nao encontrado" });
      res.json(order);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao atualizar pedido" });
    }
  });

  storage.seedProducts().catch(console.error);
  storage.seedCategories().catch(console.error);

  return httpServer;
}

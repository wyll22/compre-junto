import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import pgSession from "connect-pg-simple";
import helmet from "helmet";
import cors from "cors";
import crypto from "crypto";
import { pool } from "./db";
import { z } from "zod";
import {
  registerSchema, loginSchema, changePasswordSchema, profileUpdateSchema,
  createProductSchema, createCategorySchema, createBannerSchema, createVideoSchema,
  createOrderSchema, createPickupPointSchema, statusSchema, reserveStatusSchema, joinGroupSchema,
} from "@shared/schema";

function stripHtmlTags(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

function sanitizeInput(obj: any): any {
  if (typeof obj === "string") return stripHtmlTags(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeInput);
  if (obj && typeof obj === "object") {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      clean[key] = sanitizeInput(value);
    }
    return clean;
  }
  return obj;
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

function parseZodError(error: z.ZodError): string {
  return error.errors.map(e => e.message).join("; ");
}

const rateLimitStore = new Map<string, { count: number; windowStart: number; lockedUntil: number }>();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const IP_MAX_ATTEMPTS = 20;

function normalizeIdentifier(id: string): string {
  const digits = id.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 11) return `phone:${digits}`;
  return `id:${id.toLowerCase().trim()}`;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

function checkRateLimit(key: string, maxAttempts: number = MAX_ATTEMPTS): { allowed: boolean; message?: string; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) return { allowed: true };

  if (record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      message: `Conta bloqueada temporariamente. Tente novamente em ${Math.ceil(retryAfterSeconds / 60)} minuto(s)`,
      retryAfterSeconds,
    };
  }

  if (now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.delete(key);
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    record.lockedUntil = now + LOCKOUT_DURATION;
    rateLimitStore.set(key, record);
    const retryAfterSeconds = Math.ceil(LOCKOUT_DURATION / 1000);
    return {
      allowed: false,
      message: `Muitas tentativas. Tente novamente em ${Math.ceil(retryAfterSeconds / 60)} minuto(s)`,
      retryAfterSeconds,
    };
  }

  return { allowed: true };
}

function recordAttempt(key: string): void {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { count: 1, windowStart: now, lockedUntil: 0 });
    return;
  }

  record.count += 1;
  rateLimitStore.set(key, record);
}

function clearAttempts(key: string): void {
  rateLimitStore.delete(key);
}

setInterval(() => {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, record] of entries) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW && record.lockedUntil < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

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

async function auditLog(req: Request, userId: number, action: string, entity: string, entityId?: number, details?: any) {
  try {
    const user = await storage.getUserById(userId);
    await storage.createAuditLog({
      userId,
      userName: user?.name || "Desconhecido",
      action,
      entity,
      entityId,
      details,
      ipAddress: getClientIp(req),
    });
  } catch {
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const PgStore = pgSession(session);

  app.set("trust proxy", 1);

  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  const allowedOrigins = process.env.NODE_ENV === "production"
    ? [process.env.APP_DOMAIN || "https://comprajuntoformosa.replit.app"].filter(Boolean)
    : ["http://localhost:5000", "http://0.0.0.0:5000"];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  app.use(
    session({
      store: new PgStore({
        pool: pool as any,
        createTableIfMissing: true,
      }),
      secret: (() => {
        const secret = process.env.SESSION_SECRET;
        if (!secret && process.env.NODE_ENV === "production") {
          throw new Error("SESSION_SECRET is required in production");
        }
        return secret || crypto.randomBytes(64).toString("hex");
      })(),
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    }),
  );

  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeInput(req.body);
    }
    next();
  });

  const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!MUTATION_METHODS.has(req.method)) return next();
    if (process.env.NODE_ENV !== "production") return next();
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const allowedHost = (process.env.APP_DOMAIN || "https://comprajuntoformosa.replit.app").replace(/\/+$/, "");
    if (origin) {
      if (origin !== allowedHost) {
        return res.status(403).json({ message: "Origem invalida" });
      }
      return next();
    }
    if (referer) {
      if (!referer.startsWith(allowedHost + "/") && referer !== allowedHost) {
        return res.status(403).json({ message: "Origem invalida" });
      }
      return next();
    }
    return res.status(403).json({ message: "Origem nao identificada" });
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const { name, email, password, phone, displayName } = parsed.data;

      const ip = getClientIp(req);
      const registerKey = `register:${ip}`;
      const rateCheck = checkRateLimit(registerKey, IP_MAX_ATTEMPTS);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
      }
      recordAttempt(registerKey);

      const user = await storage.registerUser({ name, email, password, phone, displayName });
      req.session.userId = user.id;
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao cadastrar" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const { identifier, email, password } = parsed.data;
      const loginId = identifier || email || "";

      const loginKey = `login:${normalizeIdentifier(loginId)}`;
      const ipKey = `login-ip:${getClientIp(req)}`;

      const userCheck = checkRateLimit(loginKey);
      if (!userCheck.allowed) {
        return res.status(429).json({ message: userCheck.message, retryAfterSeconds: userCheck.retryAfterSeconds });
      }
      const ipCheck = checkRateLimit(ipKey);
      if (!ipCheck.allowed) {
        return res.status(429).json({ message: ipCheck.message, retryAfterSeconds: ipCheck.retryAfterSeconds });
      }

      const user = await storage.loginUser(loginId, password);
      if (!user) {
        recordAttempt(loginKey);
        recordAttempt(ipKey);
        return res.status(401).json({ message: "Email/telefone ou senha incorretos" });
      }

      clearAttempts(loginKey);
      clearAttempts(ipKey);

      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao criar sessao" });
        }
        req.session.userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            return res.status(500).json({ message: "Erro ao salvar sessao" });
          }
          res.json(user);
        });
      });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Informe o email cadastrado" });
      }
      const ip = getClientIp(req);
      const resetKey = `reset:${ip}`;
      const rateCheck = checkRateLimit(resetKey, 5);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
      }
      recordAttempt(resetKey);

      const result = await storage.createPasswordResetToken(email.trim());
      if (result) {
        console.log(`[PASSWORD RESET] Token para ${email}: ${result.token}`);
      }
      res.json({ message: "Se o email estiver cadastrado, voce recebera instrucoes para redefinir sua senha." });
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao processar solicitacao" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Token invalido" });
      }
      if (!password || typeof password !== "string" || password.length < 8) {
        return res.status(400).json({ message: "Senha deve ter pelo menos 8 caracteres" });
      }
      const success = await storage.resetPasswordByToken(token, password);
      if (!success) {
        return res.status(400).json({ message: "Token invalido ou expirado. Solicite uma nova redefinicao." });
      }
      res.json({ message: "Senha redefinida com sucesso! Faca login com sua nova senha." });
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao redefinir senha" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      res.clearCookie("connect.sid");
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

  app.get("/api/notifications", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    const notifications = await storage.getNotifications(userId);
    res.json(notifications);
  });

  app.get("/api/notifications/unread-count", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    const count = await storage.getUnreadNotificationCount(userId);
    res.json({ count });
  });

  app.post("/api/notifications/mark-read", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    const { ids } = req.body;
    await storage.markNotificationsRead(userId, Array.isArray(ids) ? ids : undefined);
    res.json({ ok: true });
  });

  app.put("/api/auth/profile", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    try {
      const parsed = profileUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const user = await storage.updateUser(userId, parsed.data);
      res.json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao atualizar perfil" });
    }
  });

  app.post("/api/auth/password", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    try {
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const { currentPassword, newPassword } = parsed.data;
      const success = await storage.changePassword(userId, currentPassword, newPassword);
      if (!success) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      req.session.regenerate((err) => {
        if (err) {
          return res.json({ ok: true, message: "Senha alterada com sucesso" });
        }
        req.session.userId = userId;
        req.session.save(() => {
          res.json({ ok: true, message: "Senha alterada com sucesso" });
        });
      });
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
      const parsed = createCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const cat = await storage.createCategory(parsed.data);
      await auditLog(req, userId, "criar", "categoria", cat.id, { name: parsed.data.name });
      res.status(201).json(cat);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar categoria" });
    }
  });

  app.put("/api/categories/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = createCategorySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const cat = await storage.updateCategory(Number(req.params.id), parsed.data);
      await auditLog(req, userId, "editar", "categoria", Number(req.params.id), { fields: Object.keys(parsed.data) });
      res.json(cat);
    } catch (err: any) {
      res.status(400).json({ message: "Erro ao atualizar categoria" });
    }
  });

  app.delete("/api/categories/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    await storage.deleteCategory(Number(req.params.id));
    await auditLog(req, userId, "excluir", "categoria", Number(req.params.id));
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
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
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
      const parsed = createProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const product = await storage.createProduct(parsed.data);
      await auditLog(req, userId, "criar", "produto", product.id, { name: parsed.data.name, price: parsed.data.originalPrice });
      res.status(201).json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar produto" });
    }
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = createProductSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const oldProduct = await storage.getProduct(Number(req.params.id));
      const product = await storage.updateProduct(Number(req.params.id), parsed.data);
      const changes: Record<string, any> = {};
      if (parsed.data.originalPrice && oldProduct && String(parsed.data.originalPrice) !== String(oldProduct.originalPrice)) changes.originalPrice = { de: oldProduct.originalPrice, para: parsed.data.originalPrice };
      if (parsed.data.groupPrice && oldProduct && String(parsed.data.groupPrice) !== String(oldProduct.groupPrice)) changes.groupPrice = { de: oldProduct.groupPrice, para: parsed.data.groupPrice };
      if (parsed.data.active !== undefined && oldProduct && parsed.data.active !== oldProduct.active) changes.active = { de: oldProduct.active, para: parsed.data.active };
      if (parsed.data.name && oldProduct && parsed.data.name !== oldProduct.name) changes.name = { de: oldProduct.name, para: parsed.data.name };
      await auditLog(req, userId, "editar", "produto", Number(req.params.id), Object.keys(changes).length > 0 ? changes : { fields: Object.keys(parsed.data) });
      res.json(product);
    } catch (err: any) {
      res.status(400).json({ message: "Erro ao atualizar produto" });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    const product = await storage.getProduct(Number(req.params.id));
    await storage.deleteProduct(Number(req.params.id));
    await auditLog(req, userId, "excluir", "produto", Number(req.params.id), { name: product?.name });
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
    const userId = requireAuth(req, res);
    if (userId === null) return;
    const members = await storage.getGroupMembers(Number(req.params.id));
    const user = await storage.getUserById(userId);
    if (user?.role === "admin") {
      return res.json(members);
    }
    const isMember = members.some((m: any) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ message: "Acesso negado" });
    }
    res.json(members);
  });

  app.post("/api/groups", async (req: Request, res: Response) => {
    try {
      const userId = requireAuth(req, res);
      if (userId === null) return;

      const parsed = joinGroupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }

      const productId = parsed.data.productId;
      if (!productId) return res.status(400).json({ message: "Produto obrigatorio" });
      const product = await storage.getProduct(productId);
      if (!product) return res.status(404).json({ message: "Produto nao encontrado" });

      const group = await storage.createGroup({
        productId,
        minPeople: product.minPeople,
      });

      const user = await storage.getUserById(userId);
      if (user) {
        const quantity = Number(parsed.data.quantity) || 1;
        const updated = await storage.addMemberToGroup(group.id, {
          name: parsed.data.name || user.name,
          phone: parsed.data.phone || user.phone || "",
          userId,
          quantity,
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

      const parsed = joinGroupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }

      const groupId = Number(req.params.id);
      const user = await storage.getUserById(userId);
      const name = (parsed.data.name || user?.name || "").trim();
      const phone = (parsed.data.phone || user?.phone || "").trim();

      if (!name) return res.status(400).json({ message: "Nome e obrigatorio" });

      const quantity = Number(parsed.data.quantity) || 1;

      const updated = await storage.addMemberToGroup(groupId, {
        name,
        phone,
        userId,
        quantity,
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
      const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const group = await storage.updateGroupStatus(Number(req.params.id), parsed.data.status);
      if (!group) return res.status(404).json({ message: "Grupo nao encontrado" });
      await auditLog(req, userId, "alterar_status", "grupo", Number(req.params.id), { status: parsed.data.status });
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
      const parsed = createBannerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const banner = await storage.createBanner(parsed.data);
      res.status(201).json(banner);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar banner" });
    }
  });

  app.put("/api/banners/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = createBannerSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const banner = await storage.updateBanner(Number(req.params.id), parsed.data);
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
      const parsed = createVideoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const video = await storage.createVideo(parsed.data);
      res.status(201).json(video);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar video" });
    }
  });

  app.put("/api/videos/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = createVideoSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const video = await storage.updateVideo(Number(req.params.id), parsed.data);
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

  app.get("/api/pickup-points", async (req: Request, res: Response) => {
    const activeOnly = req.query.active === "true";
    const points = await storage.getPickupPoints(activeOnly);
    res.json(points);
  });

  app.post("/api/pickup-points", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = createPickupPointSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parseZodError(parsed.error) });
      const point = await storage.createPickupPoint(parsed.data);
      res.status(201).json(point);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar ponto de retirada" });
    }
  });

  app.put("/api/pickup-points/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const point = await storage.updatePickupPoint(Number(req.params.id), req.body);
      if (!point) return res.status(404).json({ message: "Ponto nao encontrado" });
      res.json(point);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao atualizar" });
    }
  });

  app.delete("/api/pickup-points/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    await storage.deletePickupPoint(Number(req.params.id));
    res.status(204).send();
  });

  app.post("/api/orders", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;
    try {
      const parsed = createOrderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      if (parsed.data.fulfillmentType === "pickup" && !parsed.data.pickupPointId) {
        return res.status(400).json({ message: "Selecione um ponto de retirada" });
      }
      const order = await storage.createOrder({
        userId,
        items: parsed.data.items,
        total: parsed.data.total,
        fulfillmentType: parsed.data.fulfillmentType,
        pickupPointId: parsed.data.pickupPointId ?? null,
      });
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
      const orders = await storage.getOrdersWithUsers();
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
    const user = await storage.getUserById(userId);
    if (order.userId !== userId && user?.role !== "admin") {
      return res.status(403).json({ message: "Acesso negado" });
    }
    res.json(order);
  });

  app.patch("/api/orders/:id/status", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const newStatus = parsed.data.status;
      const reason = (req.body.reason as string) || "";

      const settings = await storage.getOrderSettings();
      const currentOrder = await storage.getOrder(Number(req.params.id));
      if (!currentOrder) return res.status(404).json({ message: "Pedido nao encontrado" });

      const transitions = settings.statusTransitions || {};
      const allowed = transitions[currentOrder.status] || [];
      if (!settings.adminOverride && !allowed.includes(newStatus)) {
        return res.status(400).json({
          message: `Transicao de "${currentOrder.status}" para "${newStatus}" nao permitida`
        });
      }

      const user = await storage.getUserById(userId);
      const changedByName = user?.name || "Admin";

      const order = await storage.changeOrderStatus(Number(req.params.id), newStatus, userId, changedByName, reason);
      if (!order) return res.status(404).json({ message: "Pedido nao encontrado" });
      await auditLog(req, userId, "alterar_status", "pedido", Number(req.params.id), { from: currentOrder.status, to: newStatus, reason });
      res.json(order);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao atualizar pedido" });
    }
  });

  app.get("/api/orders/:id/history", async (req: Request, res: Response) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Nao autenticado" });
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) return res.status(404).json({ message: "Pedido nao encontrado" });
      const user = await storage.getUserById(userId);
      if (order.userId !== userId && user?.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado" });
      }
      const history = await storage.getOrderStatusHistory(Number(req.params.id));
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar historico" });
    }
  });

  app.get("/api/admin/orders/overdue", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const orders = await storage.getOverdueOrders();
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar pedidos atrasados" });
    }
  });

  app.get("/api/admin/order-settings", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const settings = await storage.getOrderSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar configuracoes" });
    }
  });

  app.put("/api/admin/order-settings", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      await storage.updateOrderSettings(req.body);
      await auditLog(req, userId, "atualizar_configuracoes", "pedidos", 0, req.body);
      const settings = await storage.getOrderSettings();
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao atualizar configuracoes" });
    }
  });

  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar estatisticas" });
    }
  });

  app.get("/api/admin/users", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar usuarios" });
    }
  });

  app.patch("/api/members/:id/reserve-status", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = reserveStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const member = await storage.updateMemberReserveStatus(Number(req.params.id), parsed.data.reserveStatus);
      if (!member) return res.status(404).json({ message: "Membro nao encontrado" });
      res.json(member);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao atualizar status" });
    }
  });

  app.get("/api/admin/audit-logs", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const limit = req.query.limit ? Math.min(Number(req.query.limit), 500) : 100;
      const logs = await storage.getAuditLogs(limit);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar logs" });
    }
  });

  storage.seedProducts().catch(console.error);
  storage.seedCategories().catch(console.error);

  return httpServer;
}

import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import pgSession from "connect-pg-simple";
import helmet from "helmet";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { pool } from "./db";
import { z } from "zod";
import multer from "multer";
import {
  registerSchema, loginSchema, changePasswordSchema, profileUpdateSchema,
  createProductSchema, createCategorySchema, createBannerSchema, createVideoSchema,
  createOrderSchema, createPickupPointSchema, statusSchema, reserveStatusSchema, joinGroupSchema,
  insertArticleSchema, insertNavigationLinkSchema, createSponsorBannerSchema, createPartnerUserSchema,
  createSiteConfigSchema, passwordSchema,
} from "@shared/schema";

function stripHtmlTags(str: string): string {
  return str
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

const SENSITIVE_INPUT_KEYS = new Set([
  "password",
  "currentpassword",
  "newpassword",
  "token",
  "authorization",
  "secret",
  "accesstoken",
  "refreshtoken",
  "apikey",
]);

function isSensitiveInputKey(key: string): boolean {
  return SENSITIVE_INPUT_KEYS.has(key.replace(/[_-]/g, "").toLowerCase());
}

function sanitizeInput(obj: any): any {
  function sanitizeValue(value: any, pathIsSensitive: boolean = false): any {
    if (pathIsSensitive) return value;

    if (typeof value === "string") {
      return stripHtmlTags(value);
    }
    if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, pathIsSensitive));
    if (value && typeof value === "object") {
      const clean: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        clean[k] = sanitizeValue(v, isSensitiveInputKey(k));
      }
      return clean;
    }
    return value;
  }

  return sanitizeValue(obj);
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

function parseZodError(error: z.ZodError): string {
  return error.errors.map(e => e.message).join("; ");
}


const DEFAULT_SITE_CONFIG = {
  companyName: "",
  legalName: "",
  cnpj: "",
  addressLine1: "",
  city: "",
  state: "",
  cep: "",
  email: "",
  phone: "",
  whatsapp: "",
  instagramUrl: "",
  facebookUrl: "",
  mapsUrl: "",
  openingHoursText: "",
};

function normalizeWhatsAppValue(raw: string): string {
  const value = (raw || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}`;
}

function sanitizeCep(raw: string): string {
  return (raw || "").replace(/\D/g, "").slice(0, 8);
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 7000): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeCepPayload(data: any): { cep: string; street: string; district: string; city: string; state: string; source: "viacep" | "brasilapi" } {
  return {
    cep: sanitizeCep(data?.cep || ""),
    street: data?.logradouro || data?.street || "",
    district: data?.bairro || data?.neighborhood || "",
    city: data?.localidade || data?.city || "",
    state: data?.uf || data?.state || "",
    source: (data?.logradouro !== undefined || data?.bairro !== undefined || data?.localidade !== undefined || data?.uf !== undefined)
      ? "viacep"
      : "brasilapi",
  };
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if ((char === ',' || char === ';') && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

function isTrustedReplitDomain(origin: string): boolean {
  try {
    const host = new URL(origin).hostname.toLowerCase();
    return host.endsWith(".replit.app") || host.endsWith(".repl.co") || host.endsWith(".replit.dev");
  } catch {
    return false;
  }
}

function isPreviewEnvironment(): boolean {
  const envHints = [
    process.env.REPLIT_DEPLOYMENT_TYPE,
    process.env.REPLIT_ENVIRONMENT,
    process.env.REPL_DEPLOYMENT_TYPE,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return envHints.some((value) => value.includes("preview"));
}

function parseAllowedOrigins(): string[] {
  const appDomain = process.env.APP_DOMAIN?.trim();
  const customOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];

  const origins = new Set<string>();
  if (appDomain) origins.add(normalizeOrigin(appDomain));
  for (const origin of customOrigins) origins.add(normalizeOrigin(origin));

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:5000");
    origins.add("http://0.0.0.0:5000");
    origins.add("http://127.0.0.1:5000");
  }

  if (process.env.NODE_ENV === "production" && origins.size === 0) {
    throw new Error("APP_DOMAIN (or CORS_ALLOWED_ORIGINS) is required in production");
  }

  return Array.from(origins);
}

function buildOriginMatcher(allowedOrigins: string[]) {
  const previewMode = isPreviewEnvironment();

  return {
    previewMode,
    isAllowed: (candidate: string, req: Request): boolean => {
      const normalized = normalizeOrigin(candidate);
      if (isAllowedRequestOrigin(normalized, allowedOrigins, req)) return true;
      if (previewMode && isTrustedReplitDomain(normalized)) return true;
      return false;
    },
  };
}

function getRequestOrigins(req: Request): string[] {
  const candidates = new Set<string>();
  const host = req.get("x-forwarded-host") || req.get("host");
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  if (host) {
    candidates.add(normalizeOrigin(`${proto}://${host}`));
    candidates.add(normalizeOrigin(`https://${host}`));
    candidates.add(normalizeOrigin(`http://${host}`));
  }
  return Array.from(candidates);
}

function isAllowedRequestOrigin(candidate: string, allowedOrigins: string[], req: Request): boolean {
  const normalized = normalizeOrigin(candidate);
  if (allowedOrigins.includes(normalized)) return true;
  return getRequestOrigins(req).includes(normalized);
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return secret || crypto.randomBytes(64).toString("hex");
}


function logApiError(req: Request, endpoint: string, error: unknown) {
  console.error("api_error", {
    endpoint,
    method: req.method,
    path: req.originalUrl,
    error: error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) },
  });
}

const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const IP_MAX_ATTEMPTS = 20;

type RateLimitResult = {
  allowed: boolean;
  message?: string;
  retryAfterSeconds?: number;
};

function normalizeIdentifier(id: string): string {
  const digits = id.replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 11) return `phone:${digits}`;
  return `id:${id.toLowerCase().trim()}`;
}

function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}


async function checkRateLimit(key: string, maxAttempts: number = MAX_ATTEMPTS): Promise<RateLimitResult> {
  const now = Date.now();
  const result = await pool.query<{
    count: number;
    window_start: Date;
    locked_until: Date | null;
  }>(
    `SELECT count, window_start, locked_until
     FROM auth_rate_limits
     WHERE key = $1`,
    [key],
  );

  const record = result.rows[0];
  if (!record) return { allowed: true };

  const lockedUntil = record.locked_until ? new Date(record.locked_until).getTime() : 0;
  if (lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((lockedUntil - now) / 1000);
    return {
      allowed: false,
      message: `Conta bloqueada temporariamente. Tente novamente em ${Math.ceil(retryAfterSeconds / 60)} minuto(s)`,
      retryAfterSeconds,
    };
  }

  const windowStart = new Date(record.window_start).getTime();
  if (now - windowStart > RATE_LIMIT_WINDOW) {
    await clearAttempts(key);
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    const lockUntilDate = new Date(now + LOCKOUT_DURATION);
    await pool.query(
      `UPDATE auth_rate_limits
       SET locked_until = $2
       WHERE key = $1`,
      [key, lockUntilDate],
    );
    const retryAfterSeconds = Math.ceil(LOCKOUT_DURATION / 1000);
    return {
      allowed: false,
      message: `Muitas tentativas. Tente novamente em ${Math.ceil(retryAfterSeconds / 60)} minuto(s)`,
      retryAfterSeconds,
    };
  }

  return { allowed: true };
}

async function recordAttempt(key: string): Promise<void> {
  const now = Date.now();
  const windowStart = new Date(now);
  const staleWindow = new Date(now - RATE_LIMIT_WINDOW);

  await pool.query(
    `INSERT INTO auth_rate_limits (key, count, window_start, locked_until)
     VALUES ($1, 1, $2, NULL)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE
         WHEN auth_rate_limits.window_start < $3 THEN 1
         ELSE auth_rate_limits.count + 1
       END,
       window_start = CASE
         WHEN auth_rate_limits.window_start < $3 THEN $2
         ELSE auth_rate_limits.window_start
       END,
       locked_until = CASE
         WHEN auth_rate_limits.window_start < $3 THEN NULL
         ELSE auth_rate_limits.locked_until
       END`,
    [key, windowStart, staleWindow],
  );
}

async function clearAttempts(key: string): Promise<void> {
  await pool.query(`DELETE FROM auth_rate_limits WHERE key = $1`, [key]);
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

async function requireRole(req: Request, res: Response, roles: string[]): Promise<number | null> {
  const userId = requireAuth(req, res);
  if (userId === null) return null;
  const user = await storage.getUserById(userId);
  if (!user || !roles.includes(user.role)) {
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
  } catch (err) {
    console.error("Audit log failed:", {
      action,
      entity,
      entityId,
      userId,
      error: err,
    });
  }
}

async function ensureSessionTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")');
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const PgStore = pgSession(session);

  app.set("trust proxy", 1);

  try {
    await ensureSessionTable();
  } catch (error) {
    console.error("session_table_setup_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error("Falha ao preparar armazenamento de sessão no banco. Execute npm run db:push e valide permissões do DATABASE_URL.");
  }

  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production"
      ? {
          directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            frameSrc: ["'self'", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://replit.com", "https://*.replit.com"],
            imgSrc: ["'self'", "data:", "https:"],
            objectSrc: ["'none'"],
            scriptSrc: ["'self'", "https://replit.com", "https://*.replit.com", "https://replit-cdn.com"],
            scriptSrcAttr: ["'none'"],
            styleSrc: ["'self'", "https:", "'unsafe-inline'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  }));

  const allowedOrigins = parseAllowedOrigins();
  const originMatcher = buildOriginMatcher(allowedOrigins);

  app.use((req, res, next) => {
    cors({
      origin: (origin, callback) => {
        const normalizedOrigin = origin ? normalizeOrigin(origin) : "";
        if (!origin || originMatcher.isAllowed(normalizedOrigin, req)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })(req, res, next);
  });

  app.use(
    session({
      store: new PgStore({
        pool: pool as any,
        createTableIfMissing: true,
      }),
      secret: getSessionSecret(),
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
    const secFetchSite = (req.headers["sec-fetch-site"] || "").toString().toLowerCase();
    const isAllowed = (candidate: string) => originMatcher.isAllowed(candidate, req);

    if (origin) {
      if (!isAllowed(origin)) {
        return res.status(403).json({ message: "Origem invalida" });
      }
      return next();
    }

    if (referer) {
      const refererOrigin = (() => {
        try {
          return new URL(referer).origin;
        } catch {
          return "";
        }
      })();

      if (!refererOrigin || !isAllowed(refererOrigin)) {
        return res.status(403).json({ message: "Origem invalida" });
      }
      return next();
    }

    if (!origin && !referer && !secFetchSite) {
      return next();
    }

    if (secFetchSite === "same-origin" || secFetchSite === "none") {
      return next();
    }

    return res.status(403).json({ message: "Origem nao identificada" });
  });

  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      await pool.query("SELECT 1");
      res.json({ ok: true, status: "healthy" });
    } catch {
      res.status(503).json({ ok: false, status: "unhealthy" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const { name, email, password, phone, displayName, acceptTerms, acceptPrivacy } = parsed.data;

      const ip = getClientIp(req);
      const registerKey = `register:${ip}`;
      const rateCheck = await checkRateLimit(registerKey, IP_MAX_ATTEMPTS);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
      }
      await recordAttempt(registerKey);

      const user = await storage.registerUser({ name, email, password, phone, displayName, acceptTerms, acceptPrivacy });
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
        return res.status(422).json({ message: parseZodError(parsed.error) });
      }
      const { identifier, email, password } = parsed.data;
      const loginId = identifier || email || "";

      const loginKey = `login:${normalizeIdentifier(loginId)}`;
      const ipKey = `login-ip:${getClientIp(req)}`;

      const userCheck = await checkRateLimit(loginKey);
      if (!userCheck.allowed) {
        return res.status(429).json({ message: userCheck.message, retryAfterSeconds: userCheck.retryAfterSeconds });
      }
      const ipCheck = await checkRateLimit(ipKey);
      if (!ipCheck.allowed) {
        return res.status(429).json({ message: ipCheck.message, retryAfterSeconds: ipCheck.retryAfterSeconds });
      }

      const user = await storage.loginUser(loginId, password);
      if (!user) {
        await recordAttempt(loginKey);
        await recordAttempt(ipKey);
        return res.status(401).json({ message: "Email/telefone ou senha incorretos" });
      }

      await clearAttempts(loginKey);
      await clearAttempts(ipKey);

      req.session.regenerate((err) => {
        if (err) {
          console.error("auth_login_session_regenerate_failed", {
            error: err instanceof Error ? err.message : String(err),
          });
          return res.status(500).json({ message: "Erro ao criar sessao" });
        }
        req.session.userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("auth_login_session_save_failed", {
              error: saveErr instanceof Error ? saveErr.message : String(saveErr),
            });
            return res.status(500).json({ message: "Erro ao salvar sessao" });
          }
          res.json(user);
        });
      });
    } catch (err) {
      console.error("auth_login_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ message: "Erro ao fazer login" });
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
      const rateCheck = await checkRateLimit(resetKey, 5);
      if (!rateCheck.allowed) {
        return res.status(429).json({ message: rateCheck.message });
      }
      await recordAttempt(resetKey);

      await storage.createPasswordResetToken(email.trim());
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
      const pwParsed = passwordSchema.safeParse(password);
      if (!pwParsed.success) {
        return res.status(400).json({ message: pwParsed.error.errors[0]?.message || "Senha invalida" });
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
      if (err) {
        return res.status(500).json({ message: "Erro ao encerrar sessao" });
      }
      res.clearCookie("connect.sid");
      return res.json({ ok: true });
    });
  });

  app.delete("/api/auth/account", async (req: Request, res: Response) => {
    const userId = requireAuth(req, res);
    if (userId === null) return;

    const deleteAccountSchema = z.object({
      password: z.string().min(1, "Senha obrigatoria"),
      confirmation: z.literal("EXCLUIR", { errorMap: () => ({ message: "Digite EXCLUIR para confirmar" }) }),
    });

    const parsed = deleteAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parseZodError(parsed.error) });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario nao encontrado" });
    }

    const verified = await storage.loginUser(user.email, parsed.data.password);
    if (!verified || verified.id !== userId) {
      return res.status(401).json({ message: "Senha incorreta" });
    }

    await storage.deleteUserAccount(userId);

    req.session.destroy((_err) => {
      res.clearCookie("connect.sid");
      return res.json({ ok: true });
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

  app.get("/api/cep", async (req: Request, res: Response) => {
    const cep = sanitizeCep(String(req.query.cep || ""));
    if (cep.length !== 8) {
      return res.status(400).json({ message: "CEP invalido. Informe 8 digitos." });
    }

    try {
      const viaCepData = await fetchJsonWithTimeout(`https://viacep.com.br/ws/${cep}/json/`, 7000);
      if (!viaCepData?.erro) {
        return res.json({ ok: true, data: normalizeCepPayload(viaCepData) });
      }
    } catch {
      // fallback below
    }

    try {
      const brasilApiData = await fetchJsonWithTimeout(`https://brasilapi.com.br/api/cep/v1/${cep}`, 7000);
      return res.json({ ok: true, data: normalizeCepPayload(brasilApiData) });
    } catch {
      return res.status(502).json({ message: "Servico de CEP indisponivel, tente novamente" });
    }
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
    try {
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
    } catch (error) {
      logApiError(req, "/api/categories", error);
      res.status(500).json({ message: "Erro ao carregar categorias" });
    }
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

  app.get("/api/products/suggestions", async (req: Request, res: Response) => {
    const term = req.query.q as string | undefined;
    if (!term || term.trim().length < 2) return res.json([]);
    const suggestions = await storage.searchProductsSuggestions(term);
    res.json(suggestions);
  });

  app.get("/api/products/brands", async (_req: Request, res: Response) => {
    const brands = await storage.getProductBrands();
    res.json(brands);
  });

  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const saleMode = req.query.saleMode as string | undefined;
      const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
      const subcategoryId = req.query.subcategoryId ? Number(req.query.subcategoryId) : undefined;
      const brand = req.query.brand as string | undefined;
      const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined;
      const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined;
      const filterOptionIdsRaw = req.query.filterOptionIds as string | undefined;
      const filterOptionIds = filterOptionIdsRaw ? filterOptionIdsRaw.split(",").map(Number).filter(n => !isNaN(n)) : undefined;
      const hasFilters = brand || minPrice !== undefined || maxPrice !== undefined || (filterOptionIds && filterOptionIds.length > 0);
      const filters = hasFilters ? { brand, minPrice, maxPrice, filterOptionIds } : undefined;
      const products = await storage.getProducts(category, search, saleMode, categoryId, subcategoryId, filters);
      res.json(products);
    } catch (error) {
      logApiError(req, "/api/products", error);
      res.status(500).json({ message: "Erro ao carregar produtos" });
    }
  });

  app.get("/api/products/all", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    const result = await pool.query(
      `SELECT id, name, description, image_url AS "imageUrl", original_price AS "originalPrice",
              group_price AS "groupPrice", now_price AS "nowPrice", min_people AS "minPeople",
              stock, reserve_fee AS "reserveFee", category, sale_mode AS "saleMode",
              category_id AS "categoryId", subcategory_id AS "subcategoryId",
              brand, weight, dimensions, specifications,
              active, created_by AS "createdBy", approved,
              created_at AS "createdAt"
       FROM products ORDER BY id DESC`,
    );
    res.json(result.rows);
  });

  app.get("/api/featured-products", async (req: Request, res: Response) => {
    try {
      const items = await storage.getFeaturedProducts(true);
      res.json(items);
    } catch (error) {
      logApiError(req, "/api/featured-products", error);
      res.status(500).json({ message: "Erro ao carregar destaques" });
    }
  });

  app.get("/api/admin/featured-products", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    const items = await storage.getFeaturedProducts(false);
    res.json(items);
  });

  app.post("/api/admin/featured-products", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;

    try {
      const productId = Number(req.body?.productId);
      if (!productId || Number.isNaN(productId)) {
        return res.status(400).json({ message: "productId obrigatorio" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado para destaque" });
      }

      const created = await storage.createFeaturedProduct({
        productId,
        label: String(req.body?.label || ""),
        sortOrder: Number(req.body?.sortOrder || 0),
        active: req.body?.active !== false,
      });
      await auditLog(req, userId, "criar", "destaque", created.id, { productId });
      res.status(201).json(created);
    } catch (err: any) {
      const message = err?.message || "Erro ao criar destaque";
      res.status(500).json({ message });
    }
  });

  app.put("/api/admin/featured-products/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;

    const updated = await storage.updateFeaturedProduct(Number(req.params.id), {
      label: req.body?.label,
      sortOrder: req.body?.sortOrder !== undefined ? Number(req.body.sortOrder) : undefined,
      active: req.body?.active,
    });
    if (!updated) return res.status(404).json({ message: "Destaque nao encontrado" });
    await auditLog(req, userId, "editar", "destaque", Number(req.params.id), req.body || {});
    res.json(updated);
  });

  app.delete("/api/admin/featured-products/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    await storage.deleteFeaturedProduct(Number(req.params.id));
    await auditLog(req, userId, "excluir", "destaque", Number(req.params.id), {});
    res.status(204).send();
  });

  const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  app.post("/api/admin/products/import-csv", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;

    csvUpload.single("file")(req, res, async (err: any) => {
      if (err) return res.status(400).json({ message: err.message || "Erro no upload" });
      if (!req.file?.buffer) return res.status(400).json({ message: "Arquivo CSV obrigatorio" });

      const text = req.file.buffer.toString("utf-8").replace(/^\uFEFF/, "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) return res.status(400).json({ message: "CSV sem dados" });

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const required = ["name", "description", "imageurl", "originalprice", "groupprice", "category"];
      const missing = required.filter((r) => !headers.includes(r));
      if (missing.length > 0) {
        return res.status(400).json({ message: `Colunas obrigatorias ausentes: ${missing.join(", ")}` });
      }

      let created = 0;
      const errors: { line: number; message: string }[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.every((c) => c.trim() === "")) continue;
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = cols[idx] ?? "";
        });

        const payload = {
          name: row.name,
          description: row.description,
          imageUrl: row.imageurl,
          originalPrice: row.originalprice,
          groupPrice: row.groupprice,
          nowPrice: row.nowprice || undefined,
          minPeople: row.minpeople ? Number(row.minpeople) : 10,
          stock: row.stock ? Number(row.stock) : 100,
          reserveFee: row.reservefee || "0",
          category: row.category,
          saleMode: row.salemode || "grupo",
          fulfillmentType: row.fulfillmenttype || ((row.salemode || "grupo") === "agora" ? "delivery" : "pickup"),
          active: row.active ? ["1", "true", "sim", "yes"].includes(row.active.toLowerCase()) : true,
          brand: row.brand || undefined,
          weight: row.weight || undefined,
          dimensions: row.dimensions || undefined,
          specifications: row.specifications || undefined,
        };

        const parsed = createProductSchema.safeParse(payload);
        if (!parsed.success) {
          errors.push({ line: i + 1, message: parseZodError(parsed.error) });
          continue;
        }

        try {
          await storage.createProduct(parsed.data);
          created++;
        } catch (createErr: any) {
          errors.push({ line: i + 1, message: createErr?.message || "Falha ao criar produto" });
        }
      }

      await auditLog(req, userId, "importar", "produto", undefined, { created, errors: errors.length });
      res.json({ created, errors });
    });
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Produto nao encontrado" });
    if (!product.approved) {
      const userId = (req.session as any)?.userId;
      const user = userId ? await storage.getUserById(userId) : null;
      if (!user || (user.role !== "admin" && user.role !== "editor" && product.createdBy !== user.id)) {
        return res.status(404).json({ message: "Produto nao encontrado" });
      }
    }
    res.json(product);
  });

  app.get("/api/products/:id/related", async (req: Request, res: Response) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product || !product.approved) return res.json([]);
    const limit = Math.min(Number(req.query.limit) || 8, 20);
    const mode = req.query.mode as string | undefined;
    const catId = product.categoryId;
    let allProducts: any[];
    if (catId) {
      allProducts = await storage.getProducts(undefined, undefined, mode || undefined, catId);
      if (allProducts.filter((p: any) => p.id !== product.id && Number(p.stock) > 0).length === 0) {
        allProducts = await storage.getProducts(undefined, undefined, mode || undefined);
      }
    } else {
      allProducts = await storage.getProducts(undefined, undefined, mode || undefined);
    }
    const related = allProducts
      .filter((p: any) => p.id !== product.id && Number(p.stock) > 0)
      .slice(0, limit);
    res.json(related);
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

  app.get("/api/filters/catalog", async (req: Request, res: Response) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const subcategoryId = req.query.subcategoryId ? Number(req.query.subcategoryId) : undefined;
    const search = req.query.search as string | undefined;
    const saleMode = req.query.saleMode as string | undefined;
    const catalog = await storage.getFilterCatalog({ categoryId, subcategoryId, search, saleMode });
    res.json(catalog);
  });

  app.post("/api/filters/track", async (req: Request, res: Response) => {
    const { filterTypeId, filterOptionId } = req.body;
    if (!filterTypeId) return res.status(400).json({ message: "filterTypeId obrigatorio" });
    await storage.trackFilterUsage(filterTypeId, filterOptionId);
    res.json({ ok: true });
  });

  app.get("/api/admin/filter-types", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    const types = await storage.getFilterTypes();
    res.json(types);
  });

  app.post("/api/admin/filter-types", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    const { name, slug, inputType, sortOrder, active, categoryIds } = req.body;
    if (!name || !slug) return res.status(400).json({ message: "Nome e slug obrigatorios" });
    const ft = await storage.createFilterType({ name, slug, inputType, sortOrder, active, categoryIds });
    await auditLog(req, userId, "criar", "filtro", ft.id, { name });
    res.status(201).json(ft);
  });

  app.put("/api/admin/filter-types/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    const ft = await storage.updateFilterType(Number(req.params.id), req.body);
    if (!ft) return res.status(404).json({ message: "Tipo de filtro nao encontrado" });
    await auditLog(req, userId, "editar", "filtro", ft.id, { name: ft.name });
    res.json(ft);
  });

  app.delete("/api/admin/filter-types/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    await storage.deleteFilterType(Number(req.params.id));
    await auditLog(req, userId, "excluir", "filtro", Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/admin/filter-options", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    const filterTypeId = req.query.filterTypeId ? Number(req.query.filterTypeId) : undefined;
    const options = await storage.getFilterOptions(filterTypeId);
    res.json(options);
  });

  app.post("/api/admin/filter-options", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    const { filterTypeId, label, value, sortOrder, active } = req.body;
    if (!filterTypeId || !label || !value) return res.status(400).json({ message: "filterTypeId, label e value obrigatorios" });
    const opt = await storage.createFilterOption({ filterTypeId, label, value, sortOrder, active });
    await auditLog(req, userId, "criar", "opcao_filtro", opt.id, { label });
    res.status(201).json(opt);
  });

  app.put("/api/admin/filter-options/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    const opt = await storage.updateFilterOption(Number(req.params.id), req.body);
    if (!opt) return res.status(404).json({ message: "Opcao nao encontrada" });
    await auditLog(req, userId, "editar", "opcao_filtro", opt.id, { label: opt.label });
    res.json(opt);
  });

  app.delete("/api/admin/filter-options/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    await storage.deleteFilterOption(Number(req.params.id));
    await auditLog(req, userId, "excluir", "opcao_filtro", Number(req.params.id));
    res.status(204).send();
  });

  app.get("/api/products/:id/filters", async (req: Request, res: Response) => {
    const filters = await storage.getProductFilters(Number(req.params.id));
    res.json(filters);
  });

  app.put("/api/products/:id/filters", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    const { filters } = req.body;
    if (!Array.isArray(filters)) return res.status(400).json({ message: "filters deve ser um array" });
    await storage.setProductFilters(Number(req.params.id), filters);
    await auditLog(req, userId, "editar", "filtros_produto", Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/groups", async (req: Request, res: Response) => {
    try {
      const productId = req.query.productId ? Number(req.query.productId) : undefined;
      const status = req.query.status as string | undefined;
      const groups = await storage.getGroups(productId, status);
      res.json(groups);
    } catch (error) {
      logApiError(req, "/api/groups", error);
      res.status(500).json({ message: "Erro ao carregar grupos" });
    }
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
    try {
      const activeOnly = req.query.active === "true";
      const banners = await storage.getBanners(activeOnly);
      res.json(banners);
    } catch (error) {
      logApiError(req, "/api/banners", error);
      res.status(500).json({ message: "Erro ao carregar banners" });
    }
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
    try {
      const activeOnly = req.query.active === "true";
      const videos = await storage.getVideos(activeOnly);
      res.json(videos);
    } catch (error) {
      logApiError(req, "/api/videos", error);
      res.status(500).json({ message: "Erro ao carregar videos" });
    }
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


  app.get("/api/site-config", async (_req: Request, res: Response) => {
    try {
      const config = await storage.getSiteConfig();
      res.json({ ...DEFAULT_SITE_CONFIG, ...(config || {}) });
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar configuracoes do site" });
    }
  });

  app.put("/api/admin/site-config", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;

    const parsed = createSiteConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parseZodError(parsed.error) });
    }

    try {
      const payload = {
        ...parsed.data,
        state: (parsed.data.state || "").toUpperCase().slice(0, 2),
        whatsapp: normalizeWhatsAppValue(parsed.data.whatsapp || ""),
      };

      const config = await storage.upsertSiteConfig(payload);
      await auditLog(req, userId, "atualizar_configuracoes_site", "site_config", 1, payload);
      res.json({ ...DEFAULT_SITE_CONFIG, ...config });
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao atualizar configuracoes do site" });
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

  app.patch("/api/admin/users/:id/role", async (req: Request, res: Response) => {
    const adminId = await requireAdmin(req, res);
    if (adminId === null) return;
    try {
      const { role } = req.body;
      const validRoles = ["admin", "editor", "author", "user"];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ message: "Papel invalido. Use: admin, editor, author, user" });
      }
      const targetId = Number(req.params.id);
      if (targetId === adminId && role !== "admin") {
        return res.status(400).json({ message: "Voce nao pode remover seu proprio papel de admin" });
      }
      const updated = await storage.updateUserRole(targetId, role);
      if (!updated) return res.status(404).json({ message: "Usuario nao encontrado" });
      await auditLog(req, adminId, "update_role", "users", targetId, { newRole: role });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao atualizar papel" });
    }
  });

  app.get("/api/admin/analytics", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const [topPages, topReferrers, dailyViews] = await Promise.all([
        pool.query(`
          SELECT page, COUNT(*)::int as views, COUNT(DISTINCT visitor_id)::int as unique_visitors
          FROM site_visits
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY page ORDER BY views DESC LIMIT 15
        `),
        pool.query(`
          SELECT referrer, COUNT(*)::int as visits
          FROM site_visits
          WHERE referrer IS NOT NULL AND referrer != '' AND created_at > NOW() - INTERVAL '30 days'
          GROUP BY referrer ORDER BY visits DESC LIMIT 10
        `),
        pool.query(`
          SELECT DATE(created_at) as date, COUNT(*)::int as views, COUNT(DISTINCT visitor_id)::int as unique_visitors
          FROM site_visits
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at) ORDER BY date ASC
        `),
      ]);
      res.json({
        topPages: topPages.rows,
        topReferrers: topReferrers.rows,
        dailyViews: dailyViews.rows,
      });
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar analytics" });
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

  app.post("/api/track-visit", async (req: Request, res: Response) => {
    try {
      const { visitorId, page, referrer } = req.body;
      if (!visitorId || typeof visitorId !== "string") {
        return res.status(400).json({ message: "visitorId obrigatorio" });
      }
      const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";
      const userId = (req.session as any)?.userId || null;
      await pool.query(
        `INSERT INTO site_visits (visitor_id, page, referrer, user_agent, ip_address, user_id) VALUES ($1, $2, $3, $4, $5, $6)`,
        [visitorId.slice(0, 100), (page || "/").slice(0, 500), (referrer || "").slice(0, 500), userAgent.slice(0, 500), ip.slice(0, 100), userId]
      );
      res.json({ ok: true });
    } catch (err) {
      res.json({ ok: true });
    }
  });

  app.get("/api/admin/system-health", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const startTime = Date.now();

      const dbStart = Date.now();
      const dbResult = await pool.query("SELECT NOW() as now, pg_database_size(current_database()) as db_size");
      const dbResponseTime = Date.now() - dbStart;
      const dbRow = dbResult.rows[0];

      const counts = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM products WHERE active = true)::int as active_products,
          (SELECT COUNT(*) FROM products WHERE active = false)::int as inactive_products,
          (SELECT COUNT(*) FROM orders)::int as total_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'recebido')::int as pending_orders,
          (SELECT COUNT(*) FROM orders WHERE status = 'cancelado')::int as cancelled_orders,
          (SELECT COUNT(*) FROM orders WHERE created_at > NOW() - INTERVAL '24 hours')::int as orders_today,
          (SELECT COUNT(*) FROM users WHERE role = 'user')::int as total_customers,
          (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days')::int as new_customers_week,
          (SELECT COUNT(*) FROM groups)::int as total_groups,
          (SELECT COUNT(*) FROM groups WHERE status = 'aberto')::int as open_groups,
          (SELECT COUNT(*) FROM groups WHERE status = 'fechado')::int as closed_groups,
          (SELECT COUNT(*) FROM banners WHERE active = true)::int as active_banners,
          (SELECT COUNT(*) FROM videos WHERE active = true)::int as active_videos,
          (SELECT COUNT(*) FROM categories WHERE active = true)::int as active_categories,
          (SELECT COUNT(*) FROM pickup_points WHERE active = true)::int as active_pickup_points,
          (SELECT COALESCE(SUM(CAST(total AS NUMERIC)), 0) FROM orders WHERE status != 'cancelado') as total_revenue,
          (SELECT COALESCE(SUM(CAST(total AS NUMERIC)), 0) FROM orders WHERE status != 'cancelado' AND created_at > NOW() - INTERVAL '30 days') as revenue_30d,
          (SELECT COUNT(*) FROM orders WHERE status = 'pronto_retirada' AND pickup_deadline < NOW())::int as overdue_pickups,
          (SELECT COUNT(*) FROM products WHERE stock <= 5 AND active = true)::int as low_stock_products,
          (SELECT COUNT(*) FROM site_visits)::int as total_visits,
          (SELECT COUNT(DISTINCT visitor_id) FROM site_visits)::int as unique_visitors,
          (SELECT COUNT(*) FROM site_visits WHERE created_at > NOW() - INTERVAL '24 hours')::int as visits_today,
          (SELECT COUNT(DISTINCT visitor_id) FROM site_visits WHERE created_at > NOW() - INTERVAL '24 hours')::int as unique_visitors_today,
          (SELECT COUNT(*) FROM site_visits WHERE created_at > NOW() - INTERVAL '7 days')::int as visits_week,
          (SELECT COUNT(DISTINCT visitor_id) FROM site_visits WHERE created_at > NOW() - INTERVAL '7 days')::int as unique_visitors_week,
          (SELECT COUNT(*) FROM site_visits WHERE created_at > NOW() - INTERVAL '30 days')::int as visits_month
      `);

      const recentErrors = await pool.query(`
        SELECT action, entity, entity_id, details, created_at
        FROM audit_logs
        WHERE action IN ('erro', 'error', 'falha')
        ORDER BY created_at DESC
        LIMIT 10
      `).catch(() => ({ rows: [] }));

      const recentActivity = await pool.query(`
        SELECT action, entity, entity_id, user_name, created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 15
      `);

      const apiResponseTime = Date.now() - startTime;

      res.json({
        status: "online",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        performance: {
          apiResponseMs: apiResponseTime,
          dbResponseMs: dbResponseTime,
        },
        database: {
          connected: true,
          serverTime: dbRow.now,
          sizeBytes: parseInt(dbRow.db_size),
          sizeMB: (parseInt(dbRow.db_size) / (1024 * 1024)).toFixed(2),
        },
        counts: counts.rows[0],
        recentErrors: recentErrors.rows,
        recentActivity: recentActivity.rows,
        nodeVersion: process.version,
        memoryUsage: {
          rss: Math.round(process.memoryUsage().rss / (1024 * 1024)),
          heapUsed: Math.round(process.memoryUsage().heapUsed / (1024 * 1024)),
          heapTotal: Math.round(process.memoryUsage().heapTotal / (1024 * 1024)),
        },
      });
    } catch (err: any) {
      res.status(500).json({
        status: "error",
        message: "Erro ao verificar saude do sistema",
        database: { connected: false },
      });
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

  // === Articles (Blog) ===
  const createArticleSchema = z.object({
    title: z.string().min(1).max(500),
    slug: z.string().min(1).max(500),
    content: z.string().default(""),
    excerpt: z.string().max(1000).default(""),
    imageUrl: z.string().max(2000).default(""),
    published: z.boolean().default(false),
  });

  app.get("/api/articles", async (req: Request, res: Response) => {
    try {
      const publishedOnly = req.query.published === "true";
      const articles = await storage.getArticles(publishedOnly);
      res.json(articles);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar artigos" });
    }
  });

  app.get("/api/articles/:slug", async (req: Request, res: Response) => {
    try {
      const article = await storage.getArticleBySlug(String(req.params.slug));
      if (!article) return res.status(404).json({ message: "Artigo nao encontrado" });
      const isAdmin = req.session?.userId && (await storage.getUserById(req.session.userId))?.role === "admin";
      if (!article.published && !isAdmin) return res.status(404).json({ message: "Artigo nao encontrado" });
      res.json(article);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar artigo" });
    }
  });

  app.post("/api/articles", async (req: Request, res: Response) => {
    const userId = await requireRole(req, res, ["admin", "editor", "author"]);
    if (userId === null) return;
    try {
      const parsed = createArticleSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parseZodError(parsed.error) });
      const article = await storage.createArticle({ ...parsed.data, authorId: userId });
      res.status(201).json(article);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar artigo" });
    }
  });

  app.put("/api/articles/:id", async (req: Request, res: Response) => {
    const userId = await requireRole(req, res, ["admin", "editor"]);
    if (userId === null) return;
    try {
      const parsed = createArticleSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parseZodError(parsed.error) });
      const article = await storage.updateArticle(Number(req.params.id), parsed.data);
      if (!article) return res.status(404).json({ message: "Artigo nao encontrado" });
      res.json(article);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao atualizar artigo" });
    }
  });

  app.delete("/api/articles/:id", async (req: Request, res: Response) => {
    const userId = await requireRole(req, res, ["admin", "editor"]);
    if (userId === null) return;
    try {
      await storage.deleteArticle(Number(req.params.id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao excluir artigo" });
    }
  });

  // === Media Upload ===
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, uploadsDir),
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (allowed.includes(file.mimetype)) { cb(null, true); }
      else { cb(new Error("Tipo de arquivo nao permitido. Use JPEG, PNG, GIF, WebP ou SVG.")); }
    },
  });

  app.use("/uploads", (req: Request, res: Response, next: NextFunction) => {
    const express = require("express");
    express.static(uploadsDir)(req, res, next);
  });

  app.get("/api/media", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const assets = await storage.getMediaAssets();
      res.json(assets);
    } catch (err: any) {
      res.status(500).json({ message: "Erro ao buscar midia" });
    }
  });

  app.post("/api/media/upload", async (req: Request, res: Response) => {
    const userId = await requireRole(req, res, ["admin", "editor", "author"]);
    if (userId === null) return;
    upload.single("file")(req, res, async (err: any) => {
      if (err) return res.status(400).json({ message: err.message || "Erro no upload" });
      if (!req.file) return res.status(400).json({ message: "Nenhum arquivo enviado" });
      try {
        const url = `/uploads/${req.file.filename}`;
        const asset = await storage.createMediaAsset({
          filename: req.file.originalname,
          url,
          mimeType: req.file.mimetype,
          size: req.file.size,
        });
        res.status(201).json(asset);
      } catch (err: any) {
        res.status(500).json({ message: "Erro ao salvar midia" });
      }
    });
  });

  app.delete("/api/media/:id", async (req: Request, res: Response) => {
    const userId = await requireRole(req, res, ["admin", "editor"]);
    if (userId === null) return;
    try {
      const asset = await storage.deleteMediaAsset(Number(req.params.id));
      if (!asset) return res.status(404).json({ message: "Midia nao encontrada" });
      const filePath = path.join(uploadsDir, path.basename(asset.url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao excluir midia" });
    }
  });

  // === Navigation Links ===
  const createNavLinkSchema = z.object({
    location: z.enum(["header", "footer"]),
    label: z.string().min(1).max(200),
    url: z.string().min(1).max(1000),
    sortOrder: z.number().int().default(0),
    active: z.boolean().default(true),
  });

  app.get("/api/navigation-links", async (req: Request, res: Response) => {
    try {
      const location = req.query.location as string | undefined;
      const activeOnly = req.query.active === "true";
      const links = await storage.getNavigationLinks(location, activeOnly);
      res.json(links);
    } catch {
      res.json([]);
    }
  });

  app.post("/api/navigation-links", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = createNavLinkSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parseZodError(parsed.error) });
      const link = await storage.createNavigationLink(parsed.data);
      res.status(201).json(link);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar link" });
    }
  });

  app.put("/api/navigation-links/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = createNavLinkSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parseZodError(parsed.error) });
      const link = await storage.updateNavigationLink(Number(req.params.id), parsed.data);
      if (!link) return res.status(404).json({ message: "Link nao encontrado" });
      res.json(link);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao atualizar link" });
    }
  });

  app.delete("/api/navigation-links/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      await storage.deleteNavigationLink(Number(req.params.id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao excluir link" });
    }
  });

  app.get("/api/sponsor-banners", async (_req: Request, res: Response) => {
    try {
      const banners = await storage.getSponsorBanners(true);
      res.json(banners);
    } catch {
      res.json([]);
    }
  });

  app.get("/api/admin/sponsor-banners", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const banners = await storage.getSponsorBanners(false);
      res.json(banners);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/sponsor-banners", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = createSponsorBannerSchema.safeParse(sanitizeInput(req.body));
      if (!parsed.success) return res.status(400).json({ message: parseZodError(parsed.error) });
      const banner = await storage.createSponsorBanner(parsed.data);
      await auditLog(req, userId, "criar", "sponsor_banner", banner.id);
      res.status(201).json(banner);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put("/api/admin/sponsor-banners/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = createSponsorBannerSchema.partial().safeParse(sanitizeInput(req.body));
      if (!parsed.success) return res.status(400).json({ message: parseZodError(parsed.error) });
      const banner = await storage.updateSponsorBanner(Number(req.params.id), parsed.data);
      if (!banner) return res.status(404).json({ message: "Banner nao encontrado" });
      await auditLog(req, userId, "atualizar", "sponsor_banner", banner.id);
      res.json(banner);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/admin/sponsor-banners/:id", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      await storage.deleteSponsorBanner(Number(req.params.id));
      await auditLog(req, userId, "excluir", "sponsor_banner", Number(req.params.id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/admin/partners", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const parsed = createPartnerUserSchema.safeParse(sanitizeInput(req.body));
      if (!parsed.success) return res.status(400).json({ message: parseZodError(parsed.error) });
      const existing = await storage.getUserByEmail(parsed.data.email);
      if (existing) return res.status(409).json({ message: "Email ja cadastrado" });
      const partner = await storage.createPartnerUser(parsed.data);
      await auditLog(req, userId, "criar_parceiro", "user", partner.id, { pickupPointId: parsed.data.pickupPointId });
      res.status(201).json(partner);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao criar parceiro" });
    }
  });

  app.get("/api/partner/orders", async (req: Request, res: Response) => {
    const userId = await requireRole(req, res, ["parceiro", "admin"]);
    if (userId === null) return;
    try {
      const user = await storage.getUserById(userId);
      if (!user || !user.pickupPointId) return res.status(400).json({ message: "Parceiro sem ponto de retirada vinculado" });
      const orders = await storage.getPartnerOrders(user.pickupPointId);
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/partner/pickup-point", async (req: Request, res: Response) => {
    const userId = await requireRole(req, res, ["parceiro", "admin"]);
    if (userId === null) return;
    try {
      const user = await storage.getUserById(userId);
      if (!user || !user.pickupPointId) return res.status(400).json({ message: "Sem ponto vinculado" });
      const point = await storage.getPickupPoint(user.pickupPointId);
      res.json(point);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/partner/products", async (req: Request, res: Response) => {
    const userId = await requireRole(req, res, ["parceiro"]);
    if (userId === null) return;
    try {
      const products = await storage.getPartnerProducts(userId);
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/partner/products", async (req: Request, res: Response) => {
    const userId = await requireRole(req, res, ["parceiro"]);
    if (userId === null) return;
    try {
      const parsed = createProductSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parseZodError(parsed.error) });
      }
      const product = await storage.createPartnerProduct(userId, parsed.data);
      res.status(201).json(product);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Erro ao cadastrar produto" });
    }
  });

  app.get("/api/partner/sales", async (req: Request, res: Response) => {
    const userId = await requireRole(req, res, ["parceiro"]);
    if (userId === null) return;
    try {
      const sales = await storage.getPartnerSales(userId);
      res.json(sales);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/pending-products", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const products = await storage.getPendingProducts();
      res.json(products);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/products/:id/approve", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      const product = await storage.approveProduct(Number(req.params.id));
      if (!product) return res.status(404).json({ message: "Produto nao encontrado" });
      await auditLog(req, userId, "aprovar_produto", "produto", product.id, { name: product.name });
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/products/:id/reject", async (req: Request, res: Response) => {
    const userId = await requireAdmin(req, res);
    if (userId === null) return;
    try {
      await storage.rejectProduct(Number(req.params.id));
      await auditLog(req, userId, "rejeitar_produto", "produto", Number(req.params.id), {});
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_BOOTSTRAP_SEED === "true") {
    storage.seedProducts().catch(console.error);
    storage.seedCategories().catch(console.error);
  }

  return httpServer;
}

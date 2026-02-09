import { z } from 'zod';
import { insertProductSchema, products, groups, members } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products' as const,
      input: z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products' as const,
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/products/:id' as const,
      input: insertProductSchema.partial(),
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  groups: {
    list: {
      method: 'GET' as const,
      path: '/api/groups' as const,
      input: z.object({
        productId: z.coerce.number().optional(),
        status: z.enum(['aberto', 'fechado', 'completo']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof groups.$inferSelect & { product: typeof products.$inferSelect, members: (typeof members.$inferSelect)[] }>()),
      }
    },
    create: {
        method: 'POST' as const,
        path: '/api/groups' as const,
        input: z.object({ productId: z.number() }),
        responses: {
            201: z.custom<typeof groups.$inferSelect>(),
        }
    },
    join: {
        method: 'POST' as const,
        path: '/api/groups/:id/join' as const,
        input: z.object({
          name: z.string().min(1, "Nome é obrigatório"),
          phone: z.string().min(1, "Telefone é obrigatório"),
        }),
        responses: {
            200: z.custom<typeof groups.$inferSelect>(),
            400: errorSchemas.validation,
            404: errorSchemas.notFound,
        }
    },
    get: {
      method: 'GET' as const,
      path: '/api/groups/:id' as const,
      responses: {
        200: z.custom<typeof groups.$inferSelect & { product: typeof products.$inferSelect, members: (typeof members.$inferSelect)[] }>(),
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

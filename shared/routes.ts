import { z } from 'zod';
import { insertProductSchema, insertBannerSchema, insertVideoSchema } from './schema';

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
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/products' as const,
      input: insertProductSchema,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/products/:id' as const,
      input: insertProductSchema.partial(),
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/products/:id' as const,
    },
  },
  groups: {
    list: {
      method: 'GET' as const,
      path: '/api/groups' as const,
    },
    get: {
      method: 'GET' as const,
      path: '/api/groups/:id' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups' as const,
    },
    join: {
      method: 'POST' as const,
      path: '/api/groups/:id/join' as const,
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/groups/:id/status' as const,
    },
  },
  banners: {
    list: {
      method: 'GET' as const,
      path: '/api/banners' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/banners' as const,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/banners/:id' as const,
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/banners/:id' as const,
    },
  },
  videos: {
    list: {
      method: 'GET' as const,
      path: '/api/videos' as const,
    },
    create: {
      method: 'POST' as const,
      path: '/api/videos' as const,
    },
    update: {
      method: 'PUT' as const,
      path: '/api/videos/:id' as const,
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/videos/:id' as const,
    },
  },
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
    },
  },
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

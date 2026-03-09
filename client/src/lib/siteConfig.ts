import { useQuery } from "@tanstack/react-query";

export type SiteConfig = {
  companyName?: string;
  legalName?: string;
  cnpj?: string;
  city?: string;
  state?: string;
  addressLine1?: string;
  email?: string;
  supportEmail?: string;
  openingHoursText?: string;
  whatsapp?: string;
  mapsUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  pixKey?: string;
  [key: string]: unknown;
};

export function normalizeWhatsAppLink(raw: string): string {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export function useSiteConfigQuery() {
  return useQuery<SiteConfig>({
    queryKey: ["/api/site-config"],
    queryFn: async () => {
      const response = await fetch("/api/site-config", { credentials: "include" });
      if (!response.ok) return {};
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

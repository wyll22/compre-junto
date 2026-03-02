import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiWhatsapp, SiFacebook, SiInstagram } from "react-icons/si";
import { MapPin } from "lucide-react";

type SiteConfig = {
  companyName: string;
  legalName: string;
  cnpj: string;
  addressLine1: string;
  city: string;
  state: string;
  cep: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagramUrl: string;
  facebookUrl: string;
  mapsUrl: string;
  openingHoursText: string;
};

const DEFAULT_FOOTER_LINKS = [
  { label: "Termos de Uso", url: "/termos" },
  { label: "Politica de Privacidade", url: "/privacidade" },
  { label: "Trocas e Reembolsos", url: "/trocas-e-reembolsos" },
  { label: "Politica de Entregas", url: "/entregas" },
  { label: "Blog", url: "/blog" },
  { label: "Fale Conosco", url: "/contato" },
];

const EMPTY_SITE_CONFIG: SiteConfig = {
  companyName: "Compra Junto Formosa",
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

function normalizeWhatsAppLink(raw: string): string {
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export function Footer() {
  const { data: dbLinks } = useQuery<any[]>({
    queryKey: ["/api/navigation-links", "footer"],
    queryFn: async () => {
      const res = await fetch("/api/navigation-links?location=footer&active=true");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: siteConfig = EMPTY_SITE_CONFIG } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config"],
    queryFn: async () => {
      const res = await fetch("/api/site-config");
      if (!res.ok) return EMPTY_SITE_CONFIG;
      const data = await res.json();
      return { ...EMPTY_SITE_CONFIG, ...data };
    },
    staleTime: 5 * 60 * 1000,
  });

  const footerLinks = dbLinks && dbLinks.length > 0
    ? dbLinks.map((l: any) => ({ label: l.label, url: l.url }))
    : DEFAULT_FOOTER_LINKS;

  const whatsappLink = normalizeWhatsAppLink(siteConfig.whatsapp);
  const fullAddress = [siteConfig.addressLine1, [siteConfig.city, siteConfig.state].filter(Boolean).join(" - "), siteConfig.cep ? `CEP ${siteConfig.cep}` : ""]
    .filter(Boolean)
    .join(", ");

  return (
    <footer className="bg-primary text-primary-foreground mt-auto" data-testid="footer">
      <div className="border-t-4 border-[#D4A62A]" />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-90">Institucional</h3>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.url}
                  className="text-sm opacity-75 underline-offset-2"
                  data-testid={`link-footer-${i}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-90">Contato</h3>
            <div className="space-y-2 text-sm">
              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 opacity-75 hover:opacity-100 transition-opacity"
                  data-testid="link-footer-whatsapp"
                >
                  <SiWhatsapp className="w-4 h-4 flex-shrink-0" />
                  {siteConfig.whatsapp}
                </a>
              )}
              {siteConfig.email && <p className="opacity-75" data-testid="text-footer-email">E-mail: {siteConfig.email}</p>}
              {siteConfig.phone && <p className="opacity-75">Telefone: {siteConfig.phone}</p>}
              {siteConfig.openingHoursText && <p className="opacity-75" data-testid="text-footer-horario">{siteConfig.openingHoursText}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-90">{siteConfig.companyName || "Compra Junto Formosa"}</h3>
            <div className="space-y-2 text-sm">
              {siteConfig.legalName && <p className="opacity-75" data-testid="text-footer-razao">{siteConfig.legalName}</p>}
              {siteConfig.cnpj && <p className="opacity-75" data-testid="text-footer-cnpj">CNPJ: {siteConfig.cnpj}</p>}
              {fullAddress && (
                siteConfig.mapsUrl ? (
                  <a
                    href={siteConfig.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 opacity-75 hover:opacity-100 transition-opacity"
                    data-testid="link-footer-endereco"
                  >
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{fullAddress}</span>
                  </a>
                ) : (
                  <p className="flex items-center gap-2 opacity-75" data-testid="text-footer-endereco">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{fullAddress}</span>
                  </p>
                )
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-90">Redes Sociais</h3>
            <p className="text-sm opacity-75">Siga-nos nas redes sociais</p>
            <div className="flex items-center gap-3">
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="WhatsApp" data-testid="link-social-whatsapp">
                  <SiWhatsapp className="w-5 h-5" />
                </a>
              )}
              {siteConfig.facebookUrl && (
                <a href={siteConfig.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="Facebook" data-testid="link-social-facebook">
                  <SiFacebook className="w-5 h-5" />
                </a>
              )}
              {siteConfig.instagramUrl && (
                <a href={siteConfig.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" aria-label="Instagram" data-testid="link-social-instagram">
                  <SiInstagram className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-4">
          <p className="text-xs text-center opacity-50" data-testid="text-footer-copyright">
            {new Date().getFullYear()} {siteConfig.companyName || "Compra Junto Formosa"}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

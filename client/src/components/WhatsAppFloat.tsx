import { useLocation } from "wouter";
import { SiWhatsapp } from "react-icons/si";

import { normalizeWhatsAppLink, useSiteConfigQuery } from "@/lib/siteConfig";

export default function WhatsAppFloat() {
  const { data } = useSiteConfigQuery();
  const [location] = useLocation();
  const whatsappLink = normalizeWhatsAppLink(String(data?.whatsapp ?? ""));

  if (!whatsappLink) return null;
  if (["/admin", "/checkout", "/carrinho", "/minha-conta", "/notificacoes", "/login", "/cadastro", "/register"].some((r) => location.startsWith(r))) return null;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] right-3 z-[9998] flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(2,6,23,0.2)] transition-transform duration-200 hover:scale-105 sm:bottom-4 sm:right-4 sm:h-[58px] sm:w-[58px]"
      data-testid="button-whatsapp-float"
    >
      <SiWhatsapp className="h-6 w-6 sm:h-7 sm:w-7" />
    </a>
  );
}

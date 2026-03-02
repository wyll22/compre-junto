import { SiWhatsapp } from "react-icons/si";

import { normalizeWhatsAppLink, useSiteConfigQuery } from "@/lib/siteConfig";

export default function WhatsAppFloat() {
  const { data } = useSiteConfigQuery();
  const whatsappLink = normalizeWhatsAppLink(String(data?.whatsapp ?? ""));

  if (!whatsappLink) return null;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-4 right-4 z-[9998] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(2,6,23,0.2)] transition-transform duration-200 hover:scale-105"
      data-testid="button-whatsapp-float"
    >
      <SiWhatsapp className="h-7 w-7" />
    </a>
  );
}

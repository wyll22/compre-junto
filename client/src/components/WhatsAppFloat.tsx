import { useQuery } from "@tanstack/react-query";
import { SiWhatsapp } from "react-icons/si";

type SiteConfig = {
  whatsapp: string;
};

function normalizeWhatsAppLink(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export default function WhatsAppFloat() {
  const { data } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config"],
    queryFn: async () => {
      const response = await fetch("/api/site-config");
      if (!response.ok) return { whatsapp: "" };
      const payload = await response.json();
      return { whatsapp: payload?.whatsapp ?? "" };
    },
    staleTime: 5 * 60 * 1000,
  });

  const whatsappLink = normalizeWhatsAppLink(data?.whatsapp ?? "");

  if (!whatsappLink) {
    return null;
  }

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-4 left-4 z-[9999] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-105"
      data-testid="button-whatsapp-float"
    >
      <SiWhatsapp className="h-7 w-7" />
    </a>
  );
}

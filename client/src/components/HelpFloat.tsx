import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { FaQuestion } from "react-icons/fa6";

import { HELP_FAQ } from "@/components/helpFaq";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SiteConfig = {
  whatsapp?: string;
};

function normalizeWhatsAppLink(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export default function HelpFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [location] = useLocation();

  const { data } = useQuery<SiteConfig>({
    queryKey: ["/api/site-config"],
    queryFn: async () => {
      const response = await fetch("/api/site-config", { credentials: "include" });
      if (!response.ok) return {};
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const isAdminRoute = location.startsWith("/admin");

  const selectedItem = useMemo(
    () => HELP_FAQ.find((faq) => faq.question === selectedQuestion),
    [selectedQuestion],
  );

  const whatsappLink = normalizeWhatsAppLink(data?.whatsapp ?? "");

  if (isAdminRoute) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Ajuda"
          aria-label="Abrir ajuda"
          className="fixed bottom-[90px] right-4 z-[9999] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200 hover:scale-105 sm:bottom-6"
          data-testid="button-help-float"
        >
          <FaQuestion className="h-6 w-6" />
        </button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-0 sm:rounded-2xl">
        <DialogHeader className="border-b px-5 pb-4 pt-5">
          <DialogTitle>Ajuda</DialogTitle>
          <DialogDescription>
            Oi! Eu sou o mascote do Compre Junto 😊 Como posso te ajudar?
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-2">
            {HELP_FAQ.map((faq) => (
              <Button
                key={faq.question}
                type="button"
                variant="outline"
                className="h-auto justify-start whitespace-normal text-left"
                onClick={() => setSelectedQuestion(faq.question)}
                data-testid={`button-help-faq-${faq.question}`}
              >
                {faq.question}
              </Button>
            ))}
          </div>

          {selectedItem && (
            <div className="space-y-3" data-testid="help-faq-conversation">
              <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                {selectedItem.question}
              </div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm text-foreground">
                {selectedItem.answer}
              </div>
            </div>
          )}

          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
              <Button type="button" className="w-full" data-testid="button-help-whatsapp">
                Falar no WhatsApp
              </Button>
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { X } from "lucide-react";

import { HELP_FAQ } from "@/components/help/helpFaq";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { normalizeWhatsAppLink, useSiteConfigQuery } from "@/lib/siteConfig";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const SUPPORT_MESSAGE = "Oi Ju! Vim pelo Compre Junto e preciso de ajuda.";

export default function HelpFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Oi 😊 Eu sou a Ju Assistente do Compre Junto. Escolha uma opção abaixo ou clique em ‘Falar com suporte’.",
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const { data } = useSiteConfigQuery();

  const isAdminRoute = location.startsWith("/admin");
  const whatsappLink = normalizeWhatsAppLink(String(data?.whatsapp ?? ""));
  const whatsappSupportLink = whatsappLink
    ? `${whatsappLink}${whatsappLink.includes("?") ? "&" : "?"}text=${encodeURIComponent(SUPPORT_MESSAGE)}`
    : "";

  useEffect(() => {
    if (!isOpen) return;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, messages]);

  if (isAdminRoute) return null;

  const onSelectFaq = (question: string, answer: string) => {
    setMessages((previous) => [
      ...previous,
      { id: `${Date.now()}-q`, role: "user", text: question },
      { id: `${Date.now()}-a`, role: "assistant", text: answer },
    ]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Ajuda"
          aria-label="Abrir ajuda"
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] right-3 z-[9999] flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-[#16A34A] shadow-[0_10px_28px_rgba(2,6,23,0.2)] transition-transform duration-200 hover:scale-105 sm:bottom-[calc(env(safe-area-inset-bottom)+6rem)] sm:right-4 sm:h-14 sm:w-14"
          data-testid="button-help-float"
        >
          <img
            src="/ju-avatar.png"
            alt="Ju Assistente"
            className="h-10 w-10 rounded-full border-2 border-white object-cover"
          />
        </button>
      </DialogTrigger>

      <DialogContent className="left-1/2 top-auto right-auto bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-[10000] grid h-[min(36rem,calc(100dvh-8.5rem))] w-[calc(100%-0.75rem)] max-w-[28rem] -translate-x-1/2 translate-y-0 gap-0 overflow-hidden rounded-2xl border p-0 shadow-2xl sm:left-auto sm:right-4 sm:bottom-[calc(env(safe-area-inset-bottom)+6rem)] sm:h-[min(40rem,calc(100dvh-9rem))] sm:w-[min(28rem,calc(100%-2rem))] sm:translate-x-0">
        <DialogHeader className="flex items-center gap-3 bg-[#16A34A] px-4 py-3 text-white">
          <div className="flex items-center gap-3 pr-8">
            <img
              src="/ju-avatar.png"
              alt="Ju Assistente"
              className="h-9 w-9 rounded-full object-cover"
            />
            <div>
              <DialogTitle className="text-base font-semibold">
                Ju Assistente
              </DialogTitle>
              <DialogDescription className="text-xs text-white/90">
                Online agora
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <button
          type="button"
          aria-label="Fechar ajuda"
          onClick={() => setIsOpen(false)}
          className="absolute right-3 top-3 rounded-full p-1 text-white/90 transition hover:bg-white/15"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex min-h-0 flex-1 flex-col bg-[#F8FAFC]">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[86%]"
                    : "max-w-[88%]"
                }
                data-testid={`help-chat-message-${message.role}`}
              >
                <div
                  className={
                    message.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-[#16A34A] px-3 py-2 text-sm text-white"
                      : "rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                  }
                >
                  {message.text}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-1 gap-2 pt-1 md:grid-cols-2">
              {HELP_FAQ.map((faq) => (
                <button
                  key={faq.question}
                  type="button"
                  onClick={() => onSelectFaq(faq.question, faq.answer)}
                  className="w-full rounded-2xl border border-[#DCFCE7] bg-white px-3 py-2 text-left text-xs font-medium text-[#166534] transition hover:border-[#86EFAC] hover:bg-[#F0FDF4]"
                  data-testid={`button-help-chip-${faq.question}`}
                >
                  {faq.question}
                </button>
              ))}
            </div>
            <div ref={chatEndRef} />
          </div>

          <div className="border-t bg-white p-3">
            {whatsappSupportLink ? (
              <a
                href={whatsappSupportLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
                data-testid="button-help-whatsapp"
              >
                <Button
                  type="button"
                  className="w-full bg-[#16A34A] hover:bg-[#15803D]"
                >
                  Falar com suporte no WhatsApp
                </Button>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">
                WhatsApp ainda não configurado.
              </p>
            )}

            <Link
              href="/"
              className="mt-2 inline-flex text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Ver regras/como funciona
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

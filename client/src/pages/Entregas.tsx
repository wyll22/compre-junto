import { Link } from "wouter";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft } from "lucide-react";
import { useSiteConfigQuery, normalizeWhatsAppLink } from "@/lib/siteConfig";
import { Footer } from "@/components/Footer";

export default function Entregas() {
  const { data: siteConfig = {} } = useSiteConfigQuery();
  const company = {
    nomeFantasia: String((siteConfig as any).companyName || "Compra Junto Formosa"),
    razaoSocial: String((siteConfig as any).legalName || ""),
    cnpj: String((siteConfig as any).cnpj || ""),
    cidadeUf: [String((siteConfig as any).city || ""), String((siteConfig as any).state || "")].filter(Boolean).join(" - "),
    whatsappSuporte: String((siteConfig as any).whatsapp || ""),
    emailSuporte: String((siteConfig as any).supportEmail || (siteConfig as any).email || ""),
    endereco: [String((siteConfig as any).addressLine1 || ""), String((siteConfig as any).city || ""), String((siteConfig as any).state || "")].filter(Boolean).join(" - "),
    horarioAtendimento: String((siteConfig as any).openingHoursText || ""),
    googleMapsUrl: String((siteConfig as any).mapsUrl || ""),
    redesSociais: {
      whatsapp: normalizeWhatsAppLink(String((siteConfig as any).whatsapp || "")),
      facebook: String((siteConfig as any).facebookUrl || ""),
      instagram: String((siteConfig as any).instagramUrl || ""),
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-primary-foreground" data-testid="link-back-home">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <BrandLogo size="header" />
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6" data-testid="text-page-title">Politica de Entregas</h1>

        <div className="prose prose-sm max-w-none space-y-4 text-foreground/90">
          <p className="text-muted-foreground text-sm">Ultima atualizacao: Fevereiro de 2026</p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Area de Entrega</h2>
            <p>Atualmente, a <strong>{company.nomeFantasia}</strong> realiza entregas na regiao de <strong>{company.cidadeUf}</strong> e cidades vizinhas. A disponibilidade de entrega e verificada pelo CEP informado no cadastro.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Modalidades de Recebimento</h2>
            <p>A <strong>{company.nomeFantasia}</strong> oferece duas modalidades de recebimento conforme o tipo de compra:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Retirada no Ponto de Coleta (Compra em Grupo):</strong> produtos adquiridos na modalidade de compra em grupo devem ser retirados em um dos pontos de coleta disponiveis. O ponto e selecionado no momento da finalizacao do pedido.</li>
              <li><strong>Entrega no Endereco (Compre Agora):</strong> produtos adquiridos na modalidade individual sao entregues diretamente no endereco cadastrado na conta do cliente.</li>
            </ul>
            <p className="text-sm text-muted-foreground">Nao e possivel misturar produtos de retirada e entrega em um mesmo pedido.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Prazos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Compre Agora:</strong> pedidos individuais sao processados em ate 2 dias uteis apos a confirmacao do pagamento, com entrega em ate 5 dias uteis.</li>
              <li><strong>Compra em Grupo:</strong> o prazo de entrega comeca a contar apos o fechamento do grupo (quando o minimo de participantes e atingido) e confirmacao do pagamento de todos os membros. Estimativa de 5 a 10 dias uteis apos o fechamento.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Frete</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>O valor do frete e calculado com base no CEP de entrega e sera informado antes da finalizacao do pedido.</li>
              <li>Promocoes de frete gratis podem ser oferecidas conforme campanhas vigentes.</li>
              <li>Em compras em grupo, o frete pode ser rateado entre os participantes.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Acompanhamento</h2>
            <p>Voce pode acompanhar o status do seu pedido pela secao "Minha Conta" na plataforma. Os status possiveis sao:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Recebido:</strong> pedido registrado com sucesso.</li>
              <li><strong>Processando:</strong> pedido em preparacao.</li>
              <li><strong>Enviado:</strong> pedido a caminho.</li>
              <li><strong>Entregue:</strong> pedido finalizado.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Tentativas de Entrega</h2>
            <p>Serao realizadas ate 2 tentativas de entrega no endereco cadastrado. Caso nao haja ninguem para receber, entraremos em contato para reagendar.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Problemas na Entrega</h2>
            <p>Em caso de atraso, extravio ou produto danificado durante o transporte, entre em contato:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>WhatsApp: <strong>{company.whatsappSuporte}</strong></li>
              <li>E-mail: <strong>{company.emailSuporte}</strong></li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

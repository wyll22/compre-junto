import { Link } from "wouter";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft, Mail, MapPin, Clock, ExternalLink } from "lucide-react";
import { SiWhatsapp, SiFacebook, SiInstagram } from "react-icons/si";
import { useSiteConfigQuery, normalizeWhatsAppLink } from "@/lib/siteConfig";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/Footer";

export default function Contato() {
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
        <h1 className="text-2xl font-display font-bold text-foreground mb-6" data-testid="text-page-title">Fale Conosco</h1>

        <p className="text-muted-foreground mb-6">Estamos aqui para ajudar! Entre em contato pelos canais abaixo:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <a
            href={company.redesSociais.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-contato-whatsapp"
          >
            <Card className="p-4 flex items-start gap-3 h-full hover-elevate">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <SiWhatsapp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">WhatsApp</p>
                <p className="text-sm text-muted-foreground" data-testid="text-whatsapp">{company.whatsappSuporte}</p>
                <p className="text-xs text-primary mt-1 flex items-center gap-1">Clique para conversar <ExternalLink className="w-3 h-3" /></p>
              </div>
            </Card>
          </a>

          <a href={`mailto:${company.emailSuporte}`} data-testid="link-contato-email">
            <Card className="p-4 flex items-start gap-3 h-full hover-elevate">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">E-mail</p>
                <p className="text-sm text-muted-foreground break-all" data-testid="text-email">{company.emailSuporte}</p>
                <p className="text-xs text-muted-foreground mt-1">Resposta em ate 24 horas uteis</p>
              </div>
            </Card>
          </a>

          <a
            href={company.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="link-contato-endereco"
          >
            <Card className="p-4 flex items-start gap-3 h-full hover-elevate">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">Endereco</p>
                <p className="text-sm text-muted-foreground" data-testid="text-endereco">{company.endereco}</p>
                <p className="text-xs text-primary mt-1 flex items-center gap-1">Ver no mapa <ExternalLink className="w-3 h-3" /></p>
              </div>
            </Card>
          </a>

          <Card className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Horario de Atendimento</p>
              <p className="text-sm text-muted-foreground" data-testid="text-horario">{company.horarioAtendimento}</p>
            </div>
          </Card>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Redes Sociais</h2>
          <p className="text-sm text-muted-foreground mb-4">Siga-nos nas redes sociais para ficar por dentro das novidades e ofertas:</p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={company.redesSociais.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-social-whatsapp"
            >
              <Card className="flex items-center gap-3 px-4 py-3 hover-elevate">
                <SiWhatsapp className="w-5 h-5 text-[#25D366]" />
                <span className="text-sm font-medium text-foreground">WhatsApp</span>
              </Card>
            </a>
            <a
              href={company.redesSociais.facebook}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-social-facebook"
            >
              <Card className="flex items-center gap-3 px-4 py-3 hover-elevate">
                <SiFacebook className="w-5 h-5 text-[#1877F2]" />
                <span className="text-sm font-medium text-foreground">Facebook</span>
              </Card>
            </a>
            <a
              href={company.redesSociais.instagram}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-social-instagram"
            >
              <Card className="flex items-center gap-3 px-4 py-3 hover-elevate">
                <SiInstagram className="w-5 h-5 text-[#E4405F]" />
                <span className="text-sm font-medium text-foreground">Instagram</span>
              </Card>
            </a>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Duvidas Frequentes</h2>
          <div className="space-y-3">
            <Card className="p-4">
              <p className="font-medium text-sm text-foreground">Como funciona a compra em grupo?</p>
              <p className="text-sm text-muted-foreground mt-1">Voce escolhe um produto no modo "Compra em Grupo", entra em um grupo aberto (ou cria um novo) e aguarda o grupo atingir o numero minimo de participantes. Quando isso acontece, o grupo fecha automaticamente e todos conseguem o preco de grupo.</p>
            </Card>
            <Card className="p-4">
              <p className="font-medium text-sm text-foreground">Posso cancelar minha participacao em um grupo?</p>
              <p className="text-sm text-muted-foreground mt-1">Enquanto o grupo estiver aberto, entre em contato conosco pelo WhatsApp para solicitar a saida. Apos o fechamento do grupo, aplicam-se as regras de troca e reembolso.</p>
            </Card>
            <Card className="p-4">
              <p className="font-medium text-sm text-foreground">Quais formas de pagamento sao aceitas?</p>
              <p className="text-sm text-muted-foreground mt-1">As formas de pagamento disponiveis sao informadas no momento da finalizacao do pedido. Trabalhamos com as principais opcoes do mercado.</p>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

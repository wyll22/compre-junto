import { Link } from "wouter";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft, Mail, Phone, MapPin, Clock } from "lucide-react";
import { companyConfig } from "@/lib/companyConfig";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/Footer";

export default function Contato() {
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
          <Card className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">WhatsApp</p>
              <p className="text-sm text-muted-foreground" data-testid="text-whatsapp">{companyConfig.whatsappSuporte}</p>
              <p className="text-xs text-muted-foreground mt-1">Atendimento rapido e direto</p>
            </div>
          </Card>

          <Card className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">E-mail</p>
              <p className="text-sm text-muted-foreground" data-testid="text-email">{companyConfig.emailSuporte}</p>
              <p className="text-xs text-muted-foreground mt-1">Resposta em ate 24 horas uteis</p>
            </div>
          </Card>

          <Card className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Endereco</p>
              <p className="text-sm text-muted-foreground" data-testid="text-endereco">{companyConfig.endereco}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">Horario de Atendimento</p>
              <p className="text-sm text-muted-foreground" data-testid="text-horario">{companyConfig.horarioAtendimento}</p>
            </div>
          </Card>
        </div>

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

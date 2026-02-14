import { Link } from "wouter";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft } from "lucide-react";
import { companyConfig } from "@/lib/companyConfig";
import { Footer } from "@/components/Footer";

export default function TrocasReembolsos() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Link href="/">
          <a className="flex items-center gap-2 text-primary-foreground" data-testid="link-back-home">
            <ArrowLeft className="w-5 h-5" />
          </a>
        </Link>
        <BrandLogo size="header" />
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6" data-testid="text-page-title">Trocas e Reembolsos</h1>

        <div className="prose prose-sm max-w-none space-y-4 text-foreground/90">
          <p className="text-muted-foreground text-sm">Ultima atualizacao: Fevereiro de 2026</p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Direito de Arrependimento</h2>
            <p>De acordo com o Codigo de Defesa do Consumidor (Art. 49), voce pode desistir da compra em ate <strong>7 dias corridos</strong> apos o recebimento do produto, sem necessidade de justificativa.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>O produto deve estar em sua embalagem original, sem sinais de uso.</li>
              <li>O reembolso sera efetuado pelo mesmo meio de pagamento utilizado na compra.</li>
              <li>Os custos de devolucao serao por conta da {companyConfig.nomeFantasia}.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Troca por Defeito</h2>
            <p>Se o produto apresentar defeito de fabricacao, voce tem ate <strong>30 dias</strong> (produtos nao duraveis) ou <strong>90 dias</strong> (produtos duraveis) para solicitar a troca ou reparo.</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Entre em contato pelo WhatsApp ou e-mail informando o problema.</li>
              <li>Envie fotos do defeito para agilizar a analise.</li>
              <li>A {companyConfig.nomeFantasia} se responsabiliza pelo frete de devolucao.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Produto em Desacordo</h2>
            <p>Se o produto recebido for diferente do anunciado (modelo, cor, tamanho), entre em contato em ate <strong>7 dias</strong> apos o recebimento para solicitar a troca sem custos adicionais.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Compra em Grupo - Cancelamento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Grupo nao fechado:</strong> caso o grupo nao atinja o minimo de participantes, o pedido e cancelado automaticamente e eventuais valores pagos sao integralmente reembolsados.</li>
              <li><strong>Taxa de reserva:</strong> a taxa de reserva e devolvida caso o grupo seja cancelado. Se o grupo for fechado e voce desistir, a taxa pode nao ser reembolsavel, conforme indicado no produto.</li>
              <li><strong>Apos fechamento do grupo:</strong> aplicam-se as regras gerais de troca e devolucao acima.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Prazo de Reembolso</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cartao de credito:</strong> estorno em ate 2 faturas subsequentes.</li>
              <li><strong>PIX ou boleto:</strong> reembolso em ate 10 dias uteis apos aprovacao.</li>
              <li><strong>Credito na plataforma:</strong> disponivel imediatamente apos aprovacao.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Como Solicitar</h2>
            <p>Para solicitar troca ou reembolso:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>WhatsApp: <strong>{companyConfig.whatsappSuporte}</strong></li>
              <li>E-mail: <strong>{companyConfig.emailSuporte}</strong></li>
            </ul>
            <p>Informe o numero do pedido e uma descricao do problema.</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { Link } from "wouter";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft } from "lucide-react";
import { companyConfig } from "@/lib/companyConfig";
import { Footer } from "@/components/Footer";

export default function Termos() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-primary-foreground" data-testid="link-back-home">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <BrandLogo size="header" />
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6" data-testid="text-page-title">Termos de Uso</h1>

        <div className="prose prose-sm max-w-none space-y-4 text-foreground/90">
          <p className="text-muted-foreground text-sm">Ultima atualizacao: Fevereiro de 2026</p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Aceitacao dos Termos</h2>
            <p>Ao acessar e utilizar a plataforma <strong>{companyConfig.nomeFantasia}</strong>, voce concorda com estes Termos de Uso. Caso nao concorde, nao utilize nossos servicos.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Descricao do Servico</h2>
            <p>A plataforma oferece dois modos de compra:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Compra em Grupo:</strong> usuarios se reunem para comprar produtos com desconto. O preco de grupo e ativado quando o numero minimo de participantes e atingido.</li>
              <li><strong>Compre Agora:</strong> compra individual pelo preco normal, sem necessidade de grupo.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Cadastro</h2>
            <p>Para realizar compras, e necessario criar uma conta com informacoes verdadeiras e atualizadas. Voce e responsavel pela seguranca da sua senha e por todas as atividades realizadas em sua conta.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Compra em Grupo</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Ao ingressar em um grupo de compra, voce se compromete a efetuar o pagamento caso o grupo atinja o minimo de participantes.</li>
              <li>Grupos que nao atingem o minimo podem ser cancelados sem cobranca.</li>
              <li>Uma taxa de reserva pode ser cobrada para garantir sua participacao, conforme indicado no produto.</li>
              <li>A taxa de reserva sera descontada do valor final ou devolvida em caso de cancelamento do grupo.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Precos e Pagamentos</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Os precos exibidos na plataforma podem variar sem aviso previo.</li>
              <li>O preco de grupo so e garantido apos o fechamento do grupo com o minimo de participantes.</li>
              <li>Os meios de pagamento aceitos serao informados no momento da compra.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Responsabilidades do Usuario</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fornecer dados corretos e atualizados.</li>
              <li>Nao utilizar a plataforma para fins ilegais ou fraudulentos.</li>
              <li>Respeitar os demais usuarios e membros dos grupos de compra.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Propriedade Intelectual</h2>
            <p>Todo o conteudo da plataforma (textos, imagens, logos, layout) e protegido por direitos autorais. E proibida a reproducao sem autorizacao previa.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">8. Alteracoes nos Termos</h2>
            <p>Estes termos podem ser atualizados a qualquer momento. Alteracoes significativas serao comunicadas por e-mail ou notificacao na plataforma.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">9. Contato</h2>
            <p>E-mail: <strong>{companyConfig.emailSuporte}</strong><br />
            WhatsApp: <strong>{companyConfig.whatsappSuporte}</strong><br />
            {companyConfig.nomeFantasia} - {companyConfig.cidadeUf}</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

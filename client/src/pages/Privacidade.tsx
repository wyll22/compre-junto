import { Link } from "wouter";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowLeft } from "lucide-react";
import { companyConfig } from "@/lib/companyConfig";
import { Footer } from "@/components/Footer";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Link href="/">
          <a className="flex items-center gap-2 text-primary-foreground" data-testid="link-back-home">
            <ArrowLeft className="w-5 h-5" />
          </a>
        </Link>
        <BrandLogo size="sm" />
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6" data-testid="text-page-title">Politica de Privacidade</h1>

        <div className="prose prose-sm max-w-none space-y-4 text-foreground/90">
          <p className="text-muted-foreground text-sm">Ultima atualizacao: Fevereiro de 2026</p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">1. Introducao</h2>
            <p>A <strong>{companyConfig.nomeFantasia}</strong> ({companyConfig.razaoSocial}, CNPJ {companyConfig.cnpj}) valoriza a privacidade dos seus usuarios. Esta Politica de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informacoes pessoais, em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei n 13.709/2018).</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">2. Dados Coletados</h2>
            <p>Coletamos os seguintes dados pessoais:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, apelido e senha (armazenada de forma criptografada).</li>
              <li><strong>Dados de endereco:</strong> CEP, rua, numero, complemento, bairro, cidade e estado.</li>
              <li><strong>Dados de uso:</strong> historico de pedidos, participacao em grupos de compra e preferencias de navegacao.</li>
              <li><strong>Dados tecnicos:</strong> endereco IP, tipo de navegador e dados de sessao.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">3. Finalidade do Tratamento</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Criar e gerenciar sua conta na plataforma.</li>
              <li>Processar pedidos e participacoes em grupos de compra.</li>
              <li>Enviar comunicacoes sobre pedidos, entregas e novidades.</li>
              <li>Melhorar nossos servicos e a experiencia do usuario.</li>
              <li>Cumprir obrigacoes legais e regulatorias.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">4. Compartilhamento de Dados</h2>
            <p>Seus dados pessoais nao sao vendidos a terceiros. Podemos compartilha-los apenas com:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Parceiros logisticos para entrega de produtos.</li>
              <li>Prestadores de servico de pagamento.</li>
              <li>Autoridades competentes quando exigido por lei.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">5. Seguranca</h2>
            <p>Adotamos medidas tecnicas e organizacionais para proteger seus dados, incluindo criptografia de senhas, controle de acesso, monitoramento de logs e protecao contra acessos nao autorizados.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">6. Seus Direitos (LGPD)</h2>
            <p>Voce tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmar a existencia de tratamento de seus dados.</li>
              <li>Acessar, corrigir ou excluir seus dados pessoais.</li>
              <li>Solicitar a portabilidade dos dados.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
              <li>Solicitar a anonimizacao ou eliminacao de dados desnecessarios.</li>
            </ul>
            <p>Para exercer seus direitos, entre em contato pelo e-mail <strong>{companyConfig.emailSuporte}</strong> ou WhatsApp <strong>{companyConfig.whatsappSuporte}</strong>.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">7. Retencao de Dados</h2>
            <p>Seus dados sao mantidos enquanto sua conta estiver ativa ou pelo prazo necessario para cumprir obrigacoes legais. Apos solicitacao de exclusao, os dados serao removidos em ate 15 dias uteis, exceto quando houver obrigacao legal de retencao.</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">8. Contato</h2>
            <p>Para duvidas sobre esta politica, entre em contato:</p>
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

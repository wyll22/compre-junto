import { Link } from "wouter";
import { companyConfig } from "@/lib/companyConfig";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-80">Institucional</h3>
            <nav className="flex flex-col gap-1.5">
              <Link href="/termos">
                <a className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="link-footer-termos">Termos de Uso</a>
              </Link>
              <Link href="/privacidade">
                <a className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="link-footer-privacidade">Politica de Privacidade</a>
              </Link>
              <Link href="/trocas-e-reembolsos">
                <a className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="link-footer-trocas">Trocas e Reembolsos</a>
              </Link>
              <Link href="/entregas">
                <a className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="link-footer-entregas">Politica de Entregas</a>
              </Link>
              <Link href="/contato">
                <a className="text-sm opacity-80 hover:opacity-100 transition-opacity" data-testid="link-footer-contato">Fale Conosco</a>
              </Link>
            </nav>
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-80">Contato</h3>
            <div className="space-y-1.5 text-sm">
              <p className="opacity-80" data-testid="text-footer-whatsapp">WhatsApp: {companyConfig.whatsappSuporte}</p>
              <p className="opacity-80" data-testid="text-footer-email">E-mail: {companyConfig.emailSuporte}</p>
              <p className="opacity-80" data-testid="text-footer-horario">{companyConfig.horarioAtendimento}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-80">{companyConfig.nomeFantasia}</h3>
            <div className="space-y-1.5 text-sm">
              <p className="opacity-80" data-testid="text-footer-razao">{companyConfig.razaoSocial}</p>
              <p className="opacity-80" data-testid="text-footer-cnpj">CNPJ: {companyConfig.cnpj}</p>
              <p className="opacity-80" data-testid="text-footer-cidade">{companyConfig.cidadeUf}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-6 pt-4">
          <p className="text-xs text-center opacity-60" data-testid="text-footer-copyright">
            {new Date().getFullYear()} {companyConfig.nomeFantasia}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

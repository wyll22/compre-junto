import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { companyConfig } from "@/lib/companyConfig";

const DEFAULT_FOOTER_LINKS = [
  { label: "Termos de Uso", url: "/termos" },
  { label: "Politica de Privacidade", url: "/privacidade" },
  { label: "Trocas e Reembolsos", url: "/trocas-e-reembolsos" },
  { label: "Politica de Entregas", url: "/entregas" },
  { label: "Blog", url: "/blog" },
  { label: "Fale Conosco", url: "/contato" },
];

export function Footer() {
  const { data: dbLinks } = useQuery<any[]>({
    queryKey: ["/api/navigation-links", "footer"],
    queryFn: async () => {
      const res = await fetch("/api/navigation-links?location=footer&active=true");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const footerLinks = dbLinks && dbLinks.length > 0
    ? dbLinks.map((l: any) => ({ label: l.label, url: l.url }))
    : DEFAULT_FOOTER_LINKS;

  return (
    <footer className="bg-primary text-primary-foreground mt-auto" data-testid="footer">
      <div className="border-t-4 border-[#D4A62A]" />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-90">Institucional</h3>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.url}
                  className="text-sm opacity-75 underline-offset-2"
                  data-testid={`link-footer-${i}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-90">Contato</h3>
            <div className="space-y-2 text-sm">
              <p className="opacity-75" data-testid="text-footer-whatsapp">WhatsApp: {companyConfig.whatsappSuporte}</p>
              <p className="opacity-75" data-testid="text-footer-email">E-mail: {companyConfig.emailSuporte}</p>
              <p className="opacity-75" data-testid="text-footer-horario">{companyConfig.horarioAtendimento}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider opacity-90">{companyConfig.nomeFantasia}</h3>
            <div className="space-y-2 text-sm">
              <p className="opacity-75" data-testid="text-footer-razao">{companyConfig.razaoSocial}</p>
              <p className="opacity-75" data-testid="text-footer-cnpj">CNPJ: {companyConfig.cnpj}</p>
              <p className="opacity-75" data-testid="text-footer-cidade">{companyConfig.cidadeUf}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-4">
          <p className="text-xs text-center opacity-50" data-testid="text-footer-copyright">
            {new Date().getFullYear()} {companyConfig.nomeFantasia}. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

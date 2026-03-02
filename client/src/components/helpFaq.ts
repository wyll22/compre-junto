export type HelpFaqItem = {
  question: string;
  answer: string;
};

export const HELP_FAQ: HelpFaqItem[] = [
  {
    question: "Como funciona a Compra em Grupo?",
    answer:
      "Você entra em um grupo aberto e, quando o grupo atinge o mínimo de participantes, o pedido é confirmado com preço de grupo.",
  },
  {
    question: "Como funciona o Comprar Agora?",
    answer:
      "No Comprar Agora você finaliza o pedido na hora, sem aguardar grupo, com confirmação imediata no checkout.",
  },
  {
    question: "Como retiro meu pedido?",
    answer:
      "Após a confirmação, avisamos o prazo de retirada. Você retira no ponto informado com nome e número do pedido.",
  },
  {
    question: "Tem entrega?",
    answer:
      "Hoje nosso fluxo principal é retirada. Em alguns casos pode haver entrega pontual, conforme regras exibidas no pedido.",
  },
  {
    question: "Quais formas de pagamento?",
    answer:
      "Aceitamos as formas mostradas no checkout, como Pix e cartão, conforme disponibilidade do produto e campanha.",
  },
  {
    question: "Trocas e reembolso",
    answer:
      "Seguimos a política de trocas e reembolso da plataforma. Você pode consultar os detalhes na página de políticas.",
  },
  {
    question: "Problemas com login/conta?",
    answer:
      "Confira e-mail e senha, tente recuperar acesso e verifique sua conexão. Se persistir, nosso suporte te ajuda rapidamente.",
  },
  {
    question: "Como falar com suporte?",
    answer:
      "Você pode usar o botão de WhatsApp aqui no painel quando disponível ou acessar a página de contato da loja.",
  },
];

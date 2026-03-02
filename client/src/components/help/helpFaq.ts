export type HelpFaqItem = {
  question: string;
  answer: string;
};

export const HELP_FAQ: HelpFaqItem[] = [
  {
    question: "Como funciona a Compra em Grupo?",
    answer:
      "Você entra em um grupo aberto e o pedido confirma quando atingir o mínimo de participantes, com preço de grupo.",
  },
  {
    question: "Como funciona o Comprar Agora?",
    answer:
      "No Comprar Agora você fecha o pedido na hora, sem esperar o grupo completar.",
  },
  {
    question: "Como retiro meu pedido?",
    answer:
      "Após a confirmação, avisamos o prazo e o local. Na retirada, informe seu nome e número do pedido.",
  },
  {
    question: "Entrega ou retirada?",
    answer:
      "Nosso fluxo principal é retirada. Quando houver entrega disponível, essa opção aparece no pedido.",
  },
  {
    question: "Formas de pagamento",
    answer:
      "As opções aparecem no checkout e podem incluir Pix e cartão, conforme a campanha ativa.",
  },
  {
    question: "Trocas e reembolso",
    answer:
      "Seguimos nossa política de trocas e reembolso. Consulte a página de políticas para os detalhes.",
  },
  {
    question: "Problemas com login/conta",
    answer:
      "Tente recuperar a senha e conferir seus dados de acesso. Se continuar, fale com o suporte.",
  },
  {
    question: "Como falar com suporte?",
    answer:
      "Clique em “Falar com suporte no WhatsApp” aqui embaixo para atendimento mais rápido.",
  },
];

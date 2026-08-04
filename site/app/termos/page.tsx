import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, Section, List } from "@/components/legal-layout"
import { legal } from "@/lib/legal"

const DESCRIPTION =
  "Condições de uso do site e da plataforma de atendimento por WhatsApp da Trinc Tecnologies."

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: DESCRIPTION,
  alternates: { canonical: "/termos" },
  openGraph: {
    title: "Termos de Uso",
    description: DESCRIPTION,
    url: "/termos",
    type: "website",
  },
}

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      intro="Condições gerais para uso do nosso site e da plataforma de atendimento e pedidos por WhatsApp."
    >
      <Section n={1} title="Quem oferece o serviço">
        <p>
          Os serviços descritos aqui são prestados por{" "}
          <strong>{legal.razaoSocial}</strong>, CNPJ nº {legal.cnpj}, com sede em{" "}
          {legal.endereco}.
        </p>
        <p>
          Ao usar o site ou a plataforma, você concorda com estes termos. Se não
          concordar, não os utilize.
        </p>
      </Section>

      <Section n={2} title="O que estes termos cobrem">
        <List
          items={[
            <>
              <strong>O site</strong> — conteúdo informativo, blog e formulário de
              contato.
            </>,
            <>
              <strong>A plataforma</strong> — os sistemas de atendimento e
              pedidos por WhatsApp que desenvolvemos e operamos para empresas
              contratantes.
            </>,
          ]}
        />
        <p>
          Estes são termos gerais. Valores, prazos, escopo e nível de serviço de
          cada projeto são definidos em proposta ou contrato próprio, que
          prevalece sobre este documento em caso de divergência.
        </p>
      </Section>

      <Section n={3} title="O site">
        <p>
          O conteúdo do site tem caráter informativo. Não constitui consultoria
          técnica, jurídica ou financeira, nem garantia de resultado. Decisões
          tomadas com base nele são de responsabilidade de quem as toma.
        </p>
        <p>
          O formulário de contato serve para iniciar uma conversa comercial.
          Preenchê-lo não gera obrigação de contratação para nenhuma das partes.
        </p>
      </Section>

      <Section n={4} title="Responsabilidades de quem contrata a plataforma">
        <p>A empresa contratante é responsável por:</p>
        <List
          items={[
            "Manter corretos os dados que alimentam o sistema — cardápio, preços, taxas, horários e áreas de entrega. Nós fornecemos as ferramentas de edição; o conteúdo é dela.",
            "Cumprir as obrigações fiscais, sanitárias, consumeristas e trabalhistas da própria atividade.",
            "Entregar os produtos e serviços vendidos pelo canal e responder por eles perante o consumidor.",
            "Cumprir as políticas do WhatsApp e da Meta, em especial a Política de Mensagens Comerciais, e não usar o canal para mensagem não solicitada.",
            "Guardar as credenciais de acesso ao painel e não compartilhá-las.",
            "Ser a controladora dos dados dos próprios clientes, definindo finalidade e prazo de guarda.",
          ]}
        />
      </Section>

      <Section n={5} title="Nossas responsabilidades">
        <p>Nós nos comprometemos a:</p>
        <List
          items={[
            "Entregar o que foi acordado na proposta ou contrato.",
            "Manter os sistemas em funcionamento com diligência técnica razoável e corrigir defeitos que nos forem reportados.",
            "Tratar os dados conforme a Política de Privacidade e as instruções da contratante.",
            "Comunicar com antecedência mudanças relevantes no serviço.",
          ]}
        />
      </Section>

      <Section n={6} title="Dependência de plataformas de terceiros">
        <p>
          A plataforma funciona sobre serviços que não controlamos, entre eles o
          WhatsApp, operado pela Meta, e os provedores de pagamento e de
          infraestrutura.
        </p>
        <p>
          Isso significa que indisponibilidade, mudança de regra, alteração de
          preço, restrição de recurso ou suspensão de número por decisão desses
          terceiros podem afetar o serviço sem que tenhamos como evitar. Nesses
          casos, atuamos para restabelecer o funcionamento no menor prazo
          possível, mas não respondemos por decisões tomadas por eles.
        </p>
        <p>
          Os custos de mensagens cobrados pela Meta são faturados diretamente à
          empresa contratante, na conta dela, e não passam por nós.
        </p>
      </Section>

      <Section n={7} title="Titularidade da conta de WhatsApp">
        <p>
          A conta comercial de WhatsApp (WABA) e o número usados no atendimento
          pertencem à empresa contratante. Nós atuamos como provedor técnico
          sobre a conta dela.
        </p>
        <p>
          Encerrado o contrato, ela permanece com a conta e o número, e mantém a
          possibilidade de contratar outro fornecedor sem perder o canal.
        </p>
      </Section>

      <Section n={8} title="Propriedade intelectual">
        <p>
          O código, a arquitetura, a documentação e os componentes reutilizáveis
          que desenvolvemos permanecem de nossa titularidade, salvo cessão
          expressa em contrato. A contratante recebe licença de uso do sistema
          durante a vigência da contratação.
        </p>
        <p>
          Marca, logotipo, textos, imagens e dados da contratante permanecem
          dela. O conteúdo do nosso site e do blog é nosso — a reprodução exige
          citação da fonte e link para a página original.
        </p>
      </Section>

      <Section n={9} title="Limitação de responsabilidade">
        <p>
          Respondemos por danos diretos comprovadamente causados por falha nossa,
          limitados ao valor pago pela contratante nos 12 meses anteriores ao
          evento.
        </p>
        <p>
          Não respondemos por lucros cessantes, perda de oportunidade, danos
          indiretos, nem por prejuízos decorrentes de: uso indevido do sistema,
          informação incorreta cadastrada pela contratante, descumprimento das
          políticas da Meta, ou indisponibilidade de terceiros descrita na seção
          6.
        </p>
        <p>
          Nada nestes termos afasta direitos previstos no Código de Defesa do
          Consumidor quando ele for aplicável.
        </p>
      </Section>

      <Section n={10} title="Vigência e encerramento">
        <p>
          O prazo, as condições de renovação e as hipóteses de rescisão são
          definidos no contrato de cada projeto.
        </p>
        <p>
          Podemos suspender o serviço em caso de inadimplência, uso que viole
          estes termos ou as políticas da Meta, ou determinação legal — sempre
          com aviso prévio, exceto quando a suspensão imediata for necessária
          para conter dano ou cumprir ordem de autoridade.
        </p>
      </Section>

      <Section n={11} title="Privacidade">
        <p>
          O tratamento de dados pessoais é descrito na{" "}
          <Link
            href="/privacidade"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Política de Privacidade
          </Link>
          , que é parte integrante destes termos.
        </p>
      </Section>

      <Section n={12} title="Alterações">
        <p>
          Podemos alterar estes termos para refletir mudanças nos serviços ou na
          legislação. A data da última revisão fica no topo da página, e
          alterações relevantes são comunicadas aos contratantes pelos canais de
          contato registrados.
        </p>
      </Section>

      <Section n={13} title="Lei aplicável e foro">
        <p>
          Estes termos são regidos pela lei brasileira. Fica eleito o foro da
          comarca de {legal.foro}, para dirimir controvérsias, com renúncia a
          qualquer outro por mais privilegiado que seja.
        </p>
        <p>
          Contato:{" "}
          <a
            href={`mailto:${legal.emailPrivacidade}`}
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            {legal.emailPrivacidade}
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  )
}

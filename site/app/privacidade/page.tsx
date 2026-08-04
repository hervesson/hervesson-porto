import type { Metadata } from "next"
import { LegalPage, Section, List } from "@/components/legal-layout"
import { legal } from "@/lib/legal"

const DESCRIPTION =
  "Como a Trinc Tecnologies trata dados pessoais no site e na plataforma de atendimento por WhatsApp, conforme a LGPD."

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: DESCRIPTION,
  alternates: { canonical: "/privacidade" },
  openGraph: {
    title: "Política de Privacidade",
    description: DESCRIPTION,
    url: "/privacidade",
    type: "website",
  },
}

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro="Este documento explica quais dados pessoais tratamos, por que tratamos, com quem compartilhamos e como você exerce seus direitos."
    >
      <Section n={1} title="Quem somos">
        <p>
          Esta política é mantida por <strong>{legal.razaoSocial}</strong>,
          inscrita no CNPJ nº {legal.cnpj}, com sede em {legal.endereco}, também
          identificada pelo nome fantasia {legal.nomeFantasia} e pela marca
          pessoal Hervesson Porto.
        </p>
        <p>
          Encarregado pelo tratamento de dados pessoais (DPO), nos termos do
          art. 41 da LGPD: {legal.encarregado} —{" "}
          <a
            href={`mailto:${legal.emailPrivacidade}`}
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            {legal.emailPrivacidade}
          </a>
          .
        </p>
      </Section>

      <Section n={2} title="A que este documento se aplica">
        <p>Esta política cobre dois contextos distintos:</p>
        <List
          items={[
            <>
              <strong>Nosso site</strong> — navegação, formulário de contato e
              blog.
            </>,
            <>
              <strong>Nossa plataforma de atendimento</strong> — os sistemas de
              atendimento e pedidos por WhatsApp que desenvolvemos e operamos
              para empresas clientes.
            </>,
          ]}
        />
      </Section>

      <Section n={3} title="Nossos dois papéis: controladora e operadora">
        <p>
          A distinção abaixo determina a quem você deve dirigir um pedido sobre
          seus dados.
        </p>
        <p>
          Somos <strong>controladora</strong> quando decidimos sobre o
          tratamento — é o caso dos dados de quem preenche o formulário do nosso
          site, de quem nos procura como potencial cliente e de quem já é nosso
          cliente contratante.
        </p>
        <p>
          Somos <strong>operadora</strong> quando tratamos dados em nome de uma
          empresa cliente. Se você é consumidor e conversou pelo WhatsApp com um
          estabelecimento que usa nossa plataforma, quem decide sobre aqueles
          dados é o próprio estabelecimento — nós apenas processamos conforme as
          instruções dele. Nesse caso, dirija seu pedido ao estabelecimento. Se
          preferir nos procurar, encaminhamos a ele.
        </p>
      </Section>

      <Section n={4} title="Dados que tratamos">
        <p>
          <strong>No site:</strong>
        </p>
        <List
          items={[
            "Dados que você mesmo informa no formulário: nome, telefone de WhatsApp, e-mail e a mensagem que escrever.",
            "Dados técnicos de navegação, em forma agregada e sem identificar você individualmente: páginas visitadas, origem do acesso, tipo de dispositivo e país.",
          ]}
        />
        <p>
          <strong>Na plataforma de atendimento, em nome do estabelecimento:</strong>
        </p>
        <List
          items={[
            "Número de telefone, nome de exibição e foto de perfil do WhatsApp.",
            "Conteúdo das mensagens trocadas com o estabelecimento, incluindo textos, imagens, áudios e documentos enviados.",
            "Dados do pedido: itens escolhidos, valores, observações, forma de entrega e endereço, quando houver entrega.",
            "Situação do pagamento (aprovado, pendente, expirado) e o identificador da transação.",
          ]}
        />
        <p>
          <strong>Não armazenamos dados de cartão.</strong> Quando o pagamento é
          por cartão, você é levado ao ambiente do provedor de pagamento, e os
          dados do cartão são informados diretamente a ele. Nós recebemos apenas
          a confirmação de que o pagamento ocorreu.
        </p>
      </Section>

      <Section n={5} title="Por que tratamos e com qual base legal">
        <p>
          Tratamos dados pessoais com as bases legais previstas no art. 7º da Lei
          nº 13.709/2018 (LGPD):
        </p>
        <List
          items={[
            <>
              <strong>Execução de contrato e procedimentos preliminares</strong>{" "}
              (inciso V) — para responder a quem nos procura, elaborar propostas,
              prestar os serviços contratados, processar pedidos e pagamentos.
            </>,
            <>
              <strong>Cumprimento de obrigação legal</strong> (inciso II) — para
              guardar registros fiscais e contábeis pelos prazos exigidos por lei.
            </>,
            <>
              <strong>Legítimo interesse</strong> (inciso IX) — para manter a
              segurança dos sistemas, prevenir fraude e abuso, e entender de forma
              agregada como o site é usado.
            </>,
            <>
              <strong>Consentimento</strong> (inciso I) — quando pedimos
              autorização específica para algo, como sincronizar o histórico de
              conversas anteriores de um estabelecimento no momento em que ele
              adere à plataforma.
            </>,
          ]}
        />
      </Section>

      <Section n={6} title="Uso de inteligência artificial no atendimento">
        <p>
          Nossa plataforma usa um modelo de linguagem para redigir respostas
          automáticas no WhatsApp. Na prática, isso significa que o conteúdo das
          mensagens da conversa é enviado ao provedor do modelo para que a
          resposta seja gerada.
        </p>
        <List
          items={[
            "O provedor do modelo é a Anthropic, e o processamento ocorre em servidores fora do Brasil.",
            "As mensagens não são usadas para treinar modelos de inteligência artificial.",
            "O responsável pelo estabelecimento pode assumir a conversa a qualquer momento, e a partir daí o atendimento passa a ser humano.",
            "Você pode pedir, a qualquer momento na conversa, para falar com uma pessoa.",
          ]}
        />
      </Section>

      <Section n={7} title="Com quem compartilhamos">
        <p>
          <strong>Não vendemos dados pessoais.</strong> Compartilhamos apenas o
          necessário para o serviço funcionar, com os seguintes tipos de parceiro:
        </p>
        <List
          items={[
            <>
              <strong>Meta Platforms</strong> — operadora do WhatsApp, por onde a
              conversa acontece.
            </>,
            <>
              <strong>Anthropic</strong> — provedora do modelo de linguagem que
              redige as respostas automáticas.
            </>,
            <>
              <strong>Provedores de pagamento</strong> — para gerar a cobrança e
              confirmar a transação.
            </>,
            <>
              <strong>Provedores de infraestrutura e hospedagem</strong> — para
              manter os sistemas no ar.
            </>,
            <>
              <strong>Autoridades públicas</strong> — quando houver obrigação
              legal ou ordem judicial.
            </>,
          ]}
        />
      </Section>

      <Section n={8} title="Transferência internacional">
        <p>
          Parte dos parceiros acima processa dados fora do Brasil, o que
          caracteriza transferência internacional nos termos do art. 33 da LGPD.
          Fazemos isso apenas quando necessário para executar o serviço e
          mediante contratos que exigem do parceiro nível de proteção compatível
          com a legislação brasileira.
        </p>
      </Section>

      <Section n={9} title="Por quanto tempo guardamos">
        <p>
          Guardamos os dados pelo tempo necessário à finalidade que motivou a
          coleta. Depois disso, eliminamos ou anonimizamos.
        </p>
        <List
          items={[
            "Contatos recebidos pelo site que não avançam: até 24 meses.",
            "Dados de clientes contratantes e registros fiscais: pelos prazos exigidos pela legislação tributária e civil.",
            "Conversas e pedidos tratados em nome de um estabelecimento: pelo prazo que ele determinar. Encerrado o contrato, devolvemos ou eliminamos os dados conforme a instrução dele.",
          ]}
        />
      </Section>

      <Section n={10} title="Segurança">
        <p>
          Adotamos medidas técnicas e administrativas para proteger os dados,
          entre elas: tráfego criptografado, acesso aos painéis restrito por
          autenticação, separação dos dados de cada cliente em ambientes
          distintos e restrição do acesso ao mínimo necessário.
        </p>
        <p>
          Nenhum sistema é imune a incidentes. Caso ocorra um incidente de
          segurança com risco relevante, comunicaremos os titulares afetados e a
          Autoridade Nacional de Proteção de Dados, conforme o art. 48 da LGPD.
        </p>
      </Section>

      <Section n={11} title="Seus direitos">
        <p>
          O art. 18 da LGPD garante a você, a qualquer momento e gratuitamente,
          o direito de:
        </p>
        <List
          items={[
            "Confirmar se tratamos dados seus e acessá-los.",
            "Corrigir dados incompletos, inexatos ou desatualizados.",
            "Pedir anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei.",
            "Solicitar a portabilidade a outro fornecedor.",
            "Revogar consentimento e pedir a eliminação dos dados tratados com base nele.",
            "Ser informado sobre com quem compartilhamos seus dados.",
            "Opor-se a um tratamento feito com base em legítimo interesse.",
          ]}
        />
        <p>
          Para exercer qualquer um deles, escreva para{" "}
          <a
            href={`mailto:${legal.emailPrivacidade}`}
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            {legal.emailPrivacidade}
          </a>
          . Respondemos em até 15 dias. Podemos pedir informações que confirmem
          sua identidade antes de atender — é uma proteção contra pedidos feitos
          por terceiros em seu nome.
        </p>
      </Section>

      <Section n={12} title="Cookies e medição de audiência">
        <p>
          O site usa uma ferramenta de medição de audiência que coleta dados de
          navegação de forma agregada, sem cookies de identificação individual e
          sem criar perfil de comportamento. Não usamos cookies de publicidade
          nem compartilhamos dados de navegação com redes de anúncios.
        </p>
      </Section>

      <Section n={13} title="Crianças e adolescentes">
        <p>
          Nossos serviços são dirigidos a empresas e a pessoas maiores de 18
          anos. Não coletamos intencionalmente dados de crianças. Se identificar
          que uma criança nos forneceu dados, escreva para o endereço da seção 11
          e faremos a eliminação.
        </p>
      </Section>

      <Section n={14} title="Alterações nesta política">
        <p>
          Podemos atualizar este documento para refletir mudanças nos serviços ou
          na legislação. A data da última revisão fica sempre no topo da página.
          Mudanças relevantes serão comunicadas aos clientes contratantes pelos
          canais de contato registrados.
        </p>
      </Section>

      <Section n={15} title="Fale conosco">
        <p>
          Dúvidas sobre esta política ou sobre o tratamento dos seus dados:{" "}
          <a
            href={`mailto:${legal.emailPrivacidade}`}
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            {legal.emailPrivacidade}
          </a>
          .
        </p>
        <p>
          Você também pode apresentar reclamação à Autoridade Nacional de
          Proteção de Dados (ANPD).
        </p>
      </Section>
    </LegalPage>
  )
}

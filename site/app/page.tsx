import { HeroSection } from "@/components/ui/hero-section-dark";
import { Services } from "@/components/sections/services";
import { HowItWorks } from "@/components/sections/how-it-works";
import { WhyMe } from "@/components/sections/why-me";
import { ContactCta } from "@/components/sections/contact-cta";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <HeroSection
        title={site.tagline}
        subtitle={{
          regular: "Sua empresa não precisa de mais ferramentas. ",
          gradient: "Precisa de estrutura.",
        }}
        description="TI e IA aplicadas ao seu negócio: atendimento que não deixa cliente esperando, tráfego que traz o cliente certo e sistemas sob medida pra sua operação sair da planilha e do improviso — de uma vez por todas."
        ctaText="Começar pelo diagnóstico gratuito"
        ctaHref={site.whatsappUrl}
        gridOptions={{
          angle: 65,
          opacity: 0.35,
          cellSize: 50,
          lightLineColor: "#c7d4e0",
          darkLineColor: "#2a2f36",
        }}
      />
      <Services />
      <HowItWorks />
      <WhyMe />
      <ContactCta />
    </>
  );
}

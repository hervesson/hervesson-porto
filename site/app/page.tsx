import { HeroSection } from "@/components/ui/hero-section-dark";
import { Clients } from "@/components/sections/clients";
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
        description="TI e IA aplicadas ao seu negócio: atendimento que não deixa cliente esperando, tráfego que traz o cliente certo e sistemas sob medida pra sua operação sair da planilha e ganhar estrutura — de uma vez por todas."
        ctaText="Começar pelo diagnóstico gratuito"
        ctaHref={site.whatsappUrl}
      />
      <Services />
      <HowItWorks />
      <WhyMe />
      <Clients />
      <ContactCta />
    </>
  );
}

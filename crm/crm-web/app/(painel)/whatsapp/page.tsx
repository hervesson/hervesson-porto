import { Suspense } from "react";
import { numberStatus } from "@/lib/whatsapp/cloud-api";
import WhatsappInbox from "@/components/whatsapp/inbox";

export const dynamic = "force-dynamic";

export default async function WhatsappPage() {
  // Na Cloud API não existe "conectado/desconectado" como no Baileys — a infra
  // é da Meta. O que importa é o número estar CONNECTED e a nota de qualidade
  // não estar em RED (aí a Meta corta o limite de envio).
  const { online } = await numberStatus();
  return (
    <Suspense>
      <WhatsappInbox online={online} />
    </Suspense>
  );
}

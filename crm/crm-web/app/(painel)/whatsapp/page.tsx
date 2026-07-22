import { Suspense } from "react";
import { connectionState } from "@/lib/evolution";
import WhatsappInbox from "@/components/whatsapp/inbox";

export const dynamic = "force-dynamic";

export default async function WhatsappPage() {
  const state = await connectionState();
  return (
    <Suspense>
      <WhatsappInbox online={state === "open"} />
    </Suspense>
  );
}

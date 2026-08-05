// Envia uma mensagem de teste pela WhatsApp Cloud API, sem subir o painel.
// Serve pra provar que token, número e permissões estão certos.
//
//   node --env-file=.env.local scripts/enviar-teste.mjs 5598988958835
//   node --env-file=.env.local scripts/enviar-teste.mjs 5598988958835 "texto livre"
//
// Sem o segundo argumento, manda o template "hello_world".
//
// ⚠️ Texto livre só é entregue dentro da janela de 24h aberta pela última
// mensagem do contato. Em número de teste novo, ninguém te mandou nada ainda —
// então o primeiro envio TEM que ser template, senão a Meta recusa com o erro
// 131047 ("Message failed to send because more than 24 hours have passed").

const VERSION = process.env.WHATSAPP_API_VERSION ?? "v23.0";
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const to = process.argv[2];
const text = process.argv[3];

if (!PHONE_ID || !TOKEN) {
  console.error("Faltam WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN no ambiente.");
  console.error("Rode com: node --env-file=.env.local scripts/enviar-teste.mjs <numero>");
  process.exit(1);
}
if (!to) {
  console.error("Uso: node --env-file=.env.local scripts/enviar-teste.mjs <numero> [texto]");
  process.exit(1);
}

const body = text
  ? {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { preview_url: true, body: text },
    }
  : {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: "hello_world", language: { code: "en_US" } },
    };

const res = await fetch(`https://graph.facebook.com/${VERSION}/${PHONE_ID}/messages`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

const data = await res.json().catch(() => ({}));

if (!res.ok) {
  const err = data?.error ?? {};
  console.error(`\n  Falhou (HTTP ${res.status})`);
  console.error(`   ${err.message ?? "erro desconhecido"}`);
  if (err.code) console.error(`   código: ${err.code}${err.error_subcode ? `/${err.error_subcode}` : ""}`);
  if (err.error_data?.details) console.error(`   detalhe: ${err.error_data.details}`);
  console.error("");
  process.exit(1);
}

console.log(`\n  Enviado para ${data?.contacts?.[0]?.wa_id ?? to}`);
console.log(`   wamid: ${data?.messages?.[0]?.id ?? "?"}\n`);

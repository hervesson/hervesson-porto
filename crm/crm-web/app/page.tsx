import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

export default async function Home() {
  const session = await requireUser();
  redirect(session ? "/kanban" : "/login");
}

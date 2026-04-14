import { redirect } from "next/navigation";

import { getSession } from "./auth-server";

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/agency/sign-in");
  }
  return session;
}

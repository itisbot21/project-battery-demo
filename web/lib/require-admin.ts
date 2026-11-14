import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/admin/login");

  const roles = session.user.role?.split(",") ?? [];
  if (!roles.includes("admin")) notFound();

  return session;
}

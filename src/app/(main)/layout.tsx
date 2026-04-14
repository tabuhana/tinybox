import { requireAuth } from "@/lib/auth-guard";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}

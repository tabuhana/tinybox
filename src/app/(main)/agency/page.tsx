import { getCurrentUser } from "@/lib/auth-server";

export default async function AgencyHome() {
  const user = await getCurrentUser();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">
        Welcome{user?.name ? `, ${user.name}` : ""}
      </h1>
    </main>
  );
}

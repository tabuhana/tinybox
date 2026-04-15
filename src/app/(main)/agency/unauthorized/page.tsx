import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">Unauthorized</h1>
      <p className="text-muted-foreground">
        You do not have access to this agency.
      </p>
      <Link href="/agency" className={buttonVariants()}>
        Go back
      </Link>
    </main>
  );
}

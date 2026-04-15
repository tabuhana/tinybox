import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteNavigation() {
  return (
    <header className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between p-4">
      <aside className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary-foreground text-sm font-bold text-primary-foreground">
          T
        </div>
        <span className="text-xl font-bold">Tinybox.</span>
      </aside>
      <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
        <ul className="flex items-center justify-center gap-8">
          <li>
            <Link href="#pricing">Pricing</Link>
          </li>
          <li>
            <Link href="#features">Features</Link>
          </li>
          <li>
            <Link href="#about">About</Link>
          </li>
        </ul>
      </nav>
      <aside className="flex items-center gap-2">
        <Link
          href="/agency/sign-in"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Sign in
        </Link>
        <Link
          href="/agency/sign-up"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Get started
        </Link>
      </aside>
    </header>
  );
}

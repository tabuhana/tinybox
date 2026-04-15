"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";

export default function AgencySignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: signUpError } = await signUp.email({ name, email, password });
      if (signUpError) {
        const message = signUpError.message ?? "Sign up failed";
        setError(message);
        toast.error(message);
        return;
      }
      router.push("/agency");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(ev) => setName(ev.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Creating account…" : "Sign up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t pt-6 text-sm text-muted-foreground">
          <span>
            Already have an account?{" "}
            <Link href="/agency/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </span>
        </CardFooter>
      </Card>
    </main>
  );
}

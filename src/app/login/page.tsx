"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Valderia</h1>
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-foreground px-3 py-2 font-medium text-background disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Log in"}
        </button>
      </form>
      <p className="text-sm">
        Need an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}

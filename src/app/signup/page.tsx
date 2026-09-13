"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "../login/actions";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
        <input
          name="displayName"
          type="text"
          placeholder="Display name"
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20"
        />
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
          placeholder="Password (min 8 characters)"
          required
          minLength={8}
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-foreground px-3 py-2 font-medium text-background disabled:opacity-50"
        >
          {pending ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </main>
  );
}

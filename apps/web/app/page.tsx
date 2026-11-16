"use client";

import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { data: session } = authClient.useSession();

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome, {session?.user.name}</h1>
      <p className="text-sm text-muted-foreground">
        You are signed in with your client certificate.
      </p>
    </div>
  );
}

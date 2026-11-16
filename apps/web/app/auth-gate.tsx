"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Unauthorized } from "@/app/unauthorized";
import { Spinner } from "@newt-app-ssl-auth-example/ui/spinner";

/**
 * Renders the app only for a signed-in user. Without a session it signs in
 * with the client certificate nginx forwarded; if that certificate has no user
 * row, the visitor sees the unauthorized page instead.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (isPending || session || denied) return;
    authClient.signIn.ssl().then(({ error }) => {
      if (error) setDenied(true);
    });
  }, [isPending, session, denied]);

  if (session) return children;
  if (denied) return <Unauthorized />;
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner />
    </div>
  );
}

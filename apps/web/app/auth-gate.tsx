"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Unauthorized } from "@/app/unauthorized";
import { Spinner } from "@newt-app-ssl-auth-example/ui/spinner";

function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner />
    </div>
  );
}

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

  if (session) {
    return (
      <OrganizationGate activeOrganizationId={session.session.activeOrganizationId ?? null}>
        {children}
      </OrganizationGate>
    );
  }
  if (denied) return <Unauthorized />;
  return <Loading />;
}

/**
 * Makes sure the session has an organization the user still belongs to. A new
 * session starts in their first one, but they may since have left it, deleted
 * it or been removed from it; then this switches to another.
 */
function OrganizationGate({
  activeOrganizationId,
  children,
}: {
  activeOrganizationId: string | null;
  children: React.ReactNode;
}) {
  const { data: organizations, isPending } = authClient.useListOrganizations();
  const isMember = organizations?.some(({ id }) => id === activeOrganizationId) ?? false;
  const [none, setNone] = useState(false);

  useEffect(() => {
    if (isPending || isMember) return;
    let cancelled = false;
    void (async () => {
      // Fetched fresh: the cached list can still hold the organization just left.
      let { data } = await authClient.organization.list();
      // Signing in again lets the server provision them, e.g. Devin in
      // development, whose session may predate his organization.
      if (!data?.length && !(await authClient.signIn.ssl()).error) {
        ({ data } = await authClient.organization.list());
      }
      if (cancelled) return;
      const first = data?.[0];
      if (!first) {
        setNone(true);
        return;
      }
      authClient.$store.notify("$listOrg");
      await authClient.organization.setActive({ organizationId: first.id });
    })();
    return () => {
      cancelled = true;
    };
  }, [isPending, isMember]);

  if (isMember) return children;
  if (none) return <Unauthorized />;
  return <Loading />;
}

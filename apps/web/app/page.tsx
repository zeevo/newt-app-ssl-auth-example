"use client";

import { authClient } from "@/lib/auth-client";
import { primaryRole, roleLabels, useActiveMembership } from "@/lib/organization";

export default function Home() {
  const { data: session } = authClient.useSession();
  const { organization, member } = useActiveMembership();

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome, {session?.user.name}</h1>
      <p className="text-sm text-muted-foreground">
        You are signed in with your client certificate
        {organization && member
          ? `, as ${roleLabels[primaryRole(member.role)].toLowerCase()} of ${organization.name}.`
          : "."}
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useActiveMembership } from "@/lib/organization";
import { ConfirmButton } from "@/app/settings/confirm-button";
import { Button } from "@newt-app-ssl-auth-example/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@newt-app-ssl-auth-example/ui/card";
import { Field, FieldGroup, FieldLabel } from "@newt-app-ssl-auth-example/ui/field";
import { Input } from "@newt-app-ssl-auth-example/ui/input";

function RenameCard({ organizationId, name }: { organizationId: string; name: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = String(new FormData(event.currentTarget).get("name")).trim();
    if (next === name) return;
    setPending(true);
    setError("");
    const { error } = await authClient.organization.update({
      organizationId,
      data: { name: next },
    });
    setPending(false);
    if (error) setError(error.message ?? "Could not rename the organization");
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-6">
        <CardHeader>
          <CardTitle>Name</CardTitle>
          <CardDescription>How the organization appears to its members.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="organization-name">Organization name</FieldLabel>
              {/* Keyed by name so switching organizations resets the input. */}
              <Input key={name} id="organization-name" name="name" required defaultValue={name} />
            </Field>
          </FieldGroup>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const { organizationId, organization, canUpdateOrganization, canDeleteOrganization } =
    useActiveMembership();
  if (!organizationId || !organization) return null;
  const { name } = organization;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">{name}</p>
      </div>

      {canUpdateOrganization && <RenameCard organizationId={organizationId} name={name} />}

      <Card>
        <CardHeader>
          <CardTitle>Leave organization</CardTitle>
          <CardDescription>
            You lose access to {name}. If it is your only organization, your account is deleted and
            you are signed out. The last owner cannot leave.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <ConfirmButton
            label="Leave"
            pendingLabel="Leaving…"
            title={`Leave ${name}?`}
            description="Someone who can manage its members will have to add you back."
            onConfirm={async () => {
              const { error } = await authClient.organization.leave({ organizationId });
              if (error) return error.message ?? "Could not leave the organization";
              // The organization plugin refreshes the list after delete, not leave.
              authClient.$store.notify("$listOrg");
              return null;
            }}
          />
        </CardFooter>
      </Card>

      {canDeleteOrganization && (
        <Card>
          <CardHeader>
            <CardTitle>Delete organization</CardTitle>
            <CardDescription>
              Removes {name} and every membership in it. Members with no other organization are
              deleted and signed out.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <ConfirmButton
              label="Delete"
              pendingLabel="Deleting…"
              title={`Delete ${name}?`}
              description="This cannot be undone."
              onConfirm={async () => {
                const { error } = await authClient.organization.delete({ organizationId });
                return error ? (error.message ?? "Could not delete the organization") : null;
              }}
            />
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

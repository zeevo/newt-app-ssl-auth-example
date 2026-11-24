"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { slugify } from "@newt-app-ssl-auth-example/auth/client";
import { Button } from "@newt-app-ssl-auth-example/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@newt-app-ssl-auth-example/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@newt-app-ssl-auth-example/ui/field";
import { Input } from "@newt-app-ssl-auth-example/ui/input";

// Slugs must be unique but are never shown, so a short suffix keeps two
// organizations with the same name from colliding.
function uniqueSlug(name: string): string {
  return [slugify(name), crypto.randomUUID().slice(0, 8)].filter(Boolean).join("-");
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name")).trim();
    setPending(true);
    setError("");
    const { error } = await authClient.organization.create({ name, slug: uniqueSlug(name) });
    setPending(false);
    if (error) {
      setError(error.message ?? "Could not create the organization");
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) setError("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={submit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              You will be its owner, and can add members by their certificate DN.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="organization-name">Name</FieldLabel>
              <Input id="organization-name" name="name" required placeholder="Acme Corp." />
            </Field>
          </FieldGroup>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

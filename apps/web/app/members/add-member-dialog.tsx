"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import type { Role } from "@newt-app-ssl-auth-example/auth/client";
import { authClient } from "@/lib/auth-client";
import { RoleSelect } from "@/app/members/role-select";
import { Button } from "@newt-app-ssl-auth-example/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@newt-app-ssl-auth-example/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@newt-app-ssl-auth-example/ui/field";
import { Input } from "@newt-app-ssl-auth-example/ui/input";

export function AddMemberDialog({
  organizationId,
  allowOwner,
  onAdded,
}: {
  organizationId: string;
  allowOwner: boolean;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("member");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dn = String(new FormData(event.currentTarget).get("dn")).trim();
    setPending(true);
    setError("");
    // Someone new gets a user, named from the directory on the server. No
    // password: they sign in only with their client certificate.
    const { error } = await authClient.organization.addCertificateMember({
      dn,
      role,
      organizationId,
    });
    setPending(false);
    if (error) {
      setError(error.message ?? "Could not add member");
      return;
    }
    setOpen(false);
    onAdded();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) {
          setRole("member");
          setError("");
        }
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Add member
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>
              They sign in with a client certificate whose DN matches exactly. Someone new gets
              their name and email from the directory.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="dn">Certificate DN</FieldLabel>
              <Input
                id="dn"
                name="dn"
                required
                placeholder="CN=Jane Doe,OU=Engineering,O=Example,C=US"
              />
              <FieldDescription>RFC 2253 order, as nginx reports it.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="add-member-role">Role</FieldLabel>
              <RoleSelect
                id="add-member-role"
                value={role}
                onChange={setRole}
                allowOwner={allowOwner}
              />
            </Field>
          </FieldGroup>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

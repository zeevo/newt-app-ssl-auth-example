"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@newt-app-ssl-auth-example/ui/button";
import { Checkbox } from "@newt-app-ssl-auth-example/ui/checkbox";
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

export function AddUserDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    // Name and email come from the user directory on the server. No
    // password: users sign in only with their client certificate.
    const { error } = await authClient.createCertificateUser(
      String(form.get("dn")).trim(),
      form.get("admin") ? "admin" : "user",
    );
    setPending(false);
    if (error) {
      setError(error.message ?? "Could not add user");
      return;
    }
    setOpen(false);
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Add user
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>Add user</DialogTitle>
            <DialogDescription>
              They sign in with a client certificate whose DN matches exactly. Their name and email
              are looked up from the DN.
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
            <Field orientation="horizontal">
              <Checkbox id="admin" name="admin" />
              <FieldLabel htmlFor="admin">Admin</FieldLabel>
            </Field>
          </FieldGroup>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

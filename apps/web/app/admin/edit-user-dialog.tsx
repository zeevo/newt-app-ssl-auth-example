"use client";

import { useId, useState } from "react";
import { PencilIcon } from "lucide-react";
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

export interface EditableUser {
  id: string;
  name: string;
  dn?: string | null;
  role?: string | null;
}

export function EditUserDialog({
  user,
  isSelf,
  onSaved,
}: {
  user: EditableUser;
  isSelf: boolean;
  onSaved: () => void;
}) {
  const adminId = useId();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const wasAdmin = user.role === "admin";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSelf || admin === wasAdmin) {
      setOpen(false);
      return;
    }
    setPending(true);
    setError("");
    const { error } = await authClient.admin.setRole({
      userId: user.id,
      role: admin ? "admin" : "user",
    });
    setPending(false);
    if (error) {
      setError(error.message ?? "Could not save changes");
      return;
    }
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Start from the user's current role each time the dialog opens.
        if (next) {
          setAdmin(wasAdmin);
          setError("");
        }
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <PencilIcon />
        Edit
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-6">
          <DialogHeader>
            <DialogTitle>Edit {user.name}</DialogTitle>
            <DialogDescription>
              <code className="break-all">{user.dn ?? "No certificate DN"}</code>
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field orientation="horizontal">
              <Checkbox id={adminId} checked={admin} onCheckedChange={setAdmin} disabled={isSelf} />
              <FieldLabel htmlFor={adminId}>Admin</FieldLabel>
            </Field>
            {isSelf && <FieldDescription>You can't change your own role.</FieldDescription>}
          </FieldGroup>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

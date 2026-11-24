"use client";

import { useId, useState } from "react";
import { PencilIcon, TrashIcon } from "lucide-react";
import type { Role } from "@newt-app-ssl-auth-example/auth/client";
import { authClient } from "@/lib/auth-client";
import { primaryRole } from "@/lib/organization";
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
import { Field, FieldGroup, FieldLabel } from "@newt-app-ssl-auth-example/ui/field";

export interface EditableMember {
  id: string;
  role: string;
  user: { name: string; dn: string | null };
}

export function EditMemberDialog({
  member,
  organizationId,
  organizationName,
  allowOwner,
  onSaved,
}: {
  member: EditableMember;
  organizationId: string;
  organizationName: string;
  allowOwner: boolean;
  onSaved: () => void;
}) {
  const roleId = useId();
  const current = primaryRole(member.role);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>(current);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (role === current) {
      setOpen(false);
      return;
    }
    setPending(true);
    setError("");
    const { error } = await authClient.organization.updateMemberRole({
      memberId: member.id,
      role,
      organizationId,
    });
    setPending(false);
    if (error) {
      setError(error.message ?? "Could not save changes");
      return;
    }
    setOpen(false);
    onSaved();
  }

  async function remove() {
    setPending(true);
    setError("");
    const { error } = await authClient.organization.removeMember({
      memberIdOrEmail: member.id,
      organizationId,
    });
    setPending(false);
    if (error) {
      // Back to the edit form, showing why.
      setConfirming(false);
      setError(error.message ?? "Could not remove member");
      return;
    }
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        // Dismissing the confirmation (Escape, clicking outside) goes back to
        // the edit form as it was, rather than closing the dialog.
        if (!next && confirming) {
          setConfirming(false);
          return;
        }
        // Start from the member's current role each time the dialog opens.
        if (next) {
          setRole(current);
          setError("");
          setConfirming(false);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <PencilIcon />
        Edit
      </DialogTrigger>
      {/* One dialog that swaps its content, so the backdrop stays put and
          only one modal is ever shown. */}
      <DialogContent showCloseButton={!confirming}>
        {confirming ? (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle>
                Remove {member.user.name} from {organizationName}?
              </DialogTitle>
              <DialogDescription>
                They lose access to {organizationName}. If it is their only organization, their
                account is deleted and they are signed out, so their certificate no longer gets them
                in.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" disabled={pending} onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={pending} onClick={remove}>
                {pending ? "Removing…" : "Remove"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Edit {member.user.name}</DialogTitle>
              <DialogDescription>
                <code className="break-all">{member.user.dn ?? "No certificate DN"}</code>
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={roleId}>Role</FieldLabel>
                <RoleSelect id={roleId} value={role} onChange={setRole} allowOwner={allowOwner} />
              </Field>
            </FieldGroup>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="destructive"
                className="sm:mr-auto"
                disabled={pending}
                onClick={() => setConfirming(true)}
              >
                <TrashIcon />
                Remove
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

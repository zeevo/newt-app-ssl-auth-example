"use client";

import { roles, type Role } from "@newt-app-ssl-auth-example/auth/client";
import { roleLabels } from "@/lib/organization";
import { NativeSelect, NativeSelectOption } from "@newt-app-ssl-auth-example/ui/native-select";

const descriptions = {
  member: "can see the organization and its members",
  admin: "also adds, edits and removes members",
  owner: "also manages owners, and can delete the organization",
} satisfies Record<Role, string>;

/** Owner is offered only to owners; the server refuses it to anyone else. */
export function RoleSelect({
  id,
  value,
  onChange,
  allowOwner,
  disabled,
}: {
  id: string;
  value: Role;
  onChange: (role: Role) => void;
  allowOwner: boolean;
  disabled?: boolean;
}) {
  return (
    <NativeSelect
      id={id}
      value={value}
      disabled={disabled}
      onChange={(event) => {
        const role = roles.find((role) => role === event.target.value);
        if (role) onChange(role);
      }}
    >
      {roles
        .filter((role) => allowOwner || role !== "owner")
        .map((role) => (
          <NativeSelectOption key={role} value={role}>
            {roleLabels[role]}: {descriptions[role]}
          </NativeSelectOption>
        ))}
    </NativeSelect>
  );
}

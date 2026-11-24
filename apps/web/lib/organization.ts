import { hasRole, type Role } from "@newt-app-ssl-auth-example/auth/client";
import { authClient } from "@/lib/auth-client";

export const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
} satisfies Record<Role, string>;

export function primaryRole(memberRole: string): Role {
  if (hasRole(memberRole, "owner")) return "owner";
  if (hasRole(memberRole, "admin")) return "admin";
  return "member";
}

/**
 * The signed-in user's membership in the active organization, and what it lets
 * them do. The UI uses it to hide what the server would refuse anyway.
 */
export function useActiveMembership() {
  const { data: session } = authClient.useSession();
  const { data: organization } = authClient.useActiveOrganization();
  const { data: member } = authClient.useActiveMember();
  const role = member?.role ?? "";
  // The default roles nest (owner > admin > member), so the highest one
  // carries all of a member's permissions.
  const can = (
    permissions: Parameters<typeof authClient.organization.hasPermission>[0]["permissions"],
  ) =>
    role !== "" &&
    authClient.organization.checkRolePermission({ role: primaryRole(role), permissions });
  return {
    organizationId: session?.session.activeOrganizationId ?? null,
    organization,
    member,
    isOwner: hasRole(role, "owner"),
    canManageMembers: can({ member: ["create", "update", "delete"] }),
    canUpdateOrganization: can({ organization: ["update"] }),
    canDeleteOrganization: can({ organization: ["delete"] }),
  };
}

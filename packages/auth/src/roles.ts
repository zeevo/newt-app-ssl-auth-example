/**
 * The organization plugin's default roles, least to most privileged. Owners can
 * do everything, including deleting the organization and managing other
 * owners; admins manage members; members can only look.
 */
export const roles = ["member", "admin", "owner"] as const;

export type Role = (typeof roles)[number];

/** A member's role column holds one role, or several separated by commas. */
export function hasRole(memberRole: string, role: Role): boolean {
  return memberRole
    .split(",")
    .map((entry) => entry.trim())
    .includes(role);
}

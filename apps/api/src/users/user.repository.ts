import type { Organization, User } from "./user";

export const USER_REPOSITORY = Symbol("UserRepository");

export interface UserRepository {
  findByDn(dn: string): Promise<User | null>;
  /**
   * Returns the user with this DN, creating them if there is none. If they
   * belong to no organization (new, or left over from before organizations),
   * they become an owner of the one with this slug, which is created if
   * needed. Every user belongs to an organization, so a new user is never
   * written without the membership.
   */
  ensureOwner(user: User, organization: Organization): Promise<User>;
}

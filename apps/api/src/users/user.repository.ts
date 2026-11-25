import type { Organization, User } from "./user";

export const USER_REPOSITORY = Symbol("UserRepository");

export interface UserRepository {
  findByDn(dn: string): Promise<User | null>;
  /**
   * Creates the user as an owner of the organization with this slug, which is
   * created if needed. Every user belongs to an organization, so the user is
   * never written without the membership.
   */
  createOwner(user: User, organization: Organization): Promise<User>;
}

import type { Organization, User } from "./user";
import type { UserRepository } from "./user.repository";

export interface InMemoryMembership {
  userId: string;
  slug: string;
  role: string;
}

/** A UserRepository for tests. */
export class InMemoryUserRepository implements UserRepository {
  readonly users: User[] = [];
  readonly organizations: Organization[] = [];
  readonly members: InMemoryMembership[] = [];

  async findByDn(dn: string): Promise<User | null> {
    return this.users.find((user) => user.dn === dn) ?? null;
  }

  async ensureOwner(user: User, organization: Organization): Promise<User> {
    const existing = this.users.find(({ dn }) => dn === user.dn);
    if (existing && this.members.some(({ userId }) => userId === existing.id)) return existing;
    if (!existing) this.users.push(user);
    const owner = existing ?? user;
    if (!this.organizations.some(({ slug }) => slug === organization.slug)) {
      this.organizations.push(organization);
    }
    this.members.push({ userId: owner.id, slug: organization.slug, role: "owner" });
    return owner;
  }
}

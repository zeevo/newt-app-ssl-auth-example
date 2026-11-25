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

  async createOwner(user: User, organization: Organization): Promise<User> {
    this.users.push(user);
    if (!this.organizations.some(({ slug }) => slug === organization.slug)) {
      this.organizations.push(organization);
    }
    this.members.push({ userId: user.id, slug: organization.slug, role: "owner" });
    return user;
  }
}

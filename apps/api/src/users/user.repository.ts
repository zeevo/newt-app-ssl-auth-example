import type { User } from "./user";

export const USER_REPOSITORY = Symbol("UserRepository");

export interface UserRepository {
  findByDn(dn: string): Promise<User | null>;
  create(user: User): Promise<User>;
}

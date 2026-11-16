import type { User } from "./user";

export const USER_SERVICE = Symbol("UserService");

export interface UserService {
  /** The user making this request, or null if they may not sign in. */
  authenticate(headers: Headers): Promise<User | null>;
}

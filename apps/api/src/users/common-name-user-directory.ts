import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { commonName } from "./common-name";
import type { DirectoryEntry, UserDirectory } from "./user-directory";

/**
 * Stand-in until the external directory API is wired up: the name is the DN's
 * CN and the email is a unique placeholder, since better-auth requires one.
 */
@Injectable()
export class CommonNameUserDirectory implements UserDirectory {
  async lookup(dn: string): Promise<DirectoryEntry | null> {
    const name = commonName(dn);
    if (!name) return null;
    return { name, email: `${randomUUID()}@users.invalid` };
  }
}

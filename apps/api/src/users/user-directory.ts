export const USER_DIRECTORY = Symbol("UserDirectory");

export interface DirectoryEntry {
  name: string;
  email: string;
}

/** Where a new user's name and email come from, looked up by certificate DN. */
export interface UserDirectory {
  lookup(dn: string): Promise<DirectoryEntry | null>;
}

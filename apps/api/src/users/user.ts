export interface User {
  id: string;
  dn: string;
  name: string;
  email: string;
}

export interface Organization {
  name: string;
  /** Unique; identifies the organization across restarts. */
  slug: string;
}

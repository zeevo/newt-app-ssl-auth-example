import { Inject, Injectable } from "@nestjs/common";
import type { User } from "./user";
import { USER_REPOSITORY, type UserRepository } from "./user.repository";
import type { UserService } from "./user.service";
import { APP_CONFIG, type AppConfig } from "../app.config";

/**
 * Signs in the user whose client certificate DN, forwarded by the nginx
 * reverse proxy in a header, is in the user table.
 */
@Injectable()
export class CertificateUserService implements UserService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async authenticate(headers: Headers): Promise<User | null> {
    const dn = headers.get(this.config.dnHeader);
    if (!dn) return null;
    return this.users.findByDn(dn);
  }
}

import { Test } from "@nestjs/testing";
import { CertificateUserService } from "./certificate-user.service";
import { DEVIN, DevinUserService } from "./devin-user.service";
import { InMemoryUserRepository } from "./in-memory-user.repository";
import { USER_REPOSITORY } from "./user.repository";
import { USER_SERVICE, type UserService } from "./user.service";
import { loadUsersConfig } from "./users.config";
import { UsersModule } from "./users.module";

const alice = {
  id: "alice",
  dn: "CN=Alice,O=Example,C=US",
  name: "Alice",
  email: "a@example.com",
  role: "user",
};

async function userService(env: NodeJS.ProcessEnv, repository: InMemoryUserRepository) {
  const moduleRef = await Test.createTestingModule({
    imports: [UsersModule.register(loadUsersConfig(env))],
  })
    .overrideProvider(USER_REPOSITORY)
    .useValue(repository)
    .compile();
  return moduleRef.get<UserService>(USER_SERVICE);
}

describe("UsersModule", () => {
  let repository: InMemoryUserRepository;

  beforeEach(() => {
    repository = new InMemoryUserRepository();
    repository.users.push(alice);
  });

  it("binds the certificate service by default", async () => {
    expect(await userService({}, repository)).toBeInstanceOf(CertificateUserService);
  });

  it("binds the Devin service when USER_SERVICE=devin", async () => {
    expect(await userService({ USER_SERVICE: "devin" }, repository)).toBeInstanceOf(
      DevinUserService,
    );
  });

  describe("certificate", () => {
    it("signs in a user whose DN is in the user table", async () => {
      const users = await userService({}, repository);
      expect(await users.authenticate(new Headers({ "X-DN": alice.dn }))).toEqual(alice);
    });

    it("rejects an unknown DN", async () => {
      const users = await userService({}, repository);
      expect(await users.authenticate(new Headers({ "X-DN": "CN=Mallory" }))).toBeNull();
    });

    it("rejects a request without a DN", async () => {
      const users = await userService({}, repository);
      expect(await users.authenticate(new Headers())).toBeNull();
    });

    it("reads the header named by DN_HEADER", async () => {
      const users = await userService({ DN_HEADER: "x-ssl-client-s-dn" }, repository);
      expect(await users.authenticate(new Headers({ "X-DN": alice.dn }))).toBeNull();
      expect(await users.authenticate(new Headers({ "X-SSL-Client-S-DN": alice.dn }))).toEqual(
        alice,
      );
    });
  });

  describe("devin", () => {
    it("signs in as Devin without a certificate, creating him once", async () => {
      const users = await userService({ USER_SERVICE: "devin" }, repository);
      expect(await users.authenticate(new Headers())).toEqual(DEVIN);
      expect(await users.authenticate(new Headers({ "X-DN": alice.dn }))).toEqual(DEVIN);
      expect(repository.users.filter((user) => user.dn === DEVIN.dn)).toHaveLength(1);
    });
  });
});

describe("loadUsersConfig", () => {
  it("refuses the Devin service in production", () => {
    expect(() => loadUsersConfig({ USER_SERVICE: "devin", NODE_ENV: "production" })).toThrow();
  });

  it("rejects an unknown USER_SERVICE", () => {
    expect(() => loadUsersConfig({ USER_SERVICE: "nobody" })).toThrow();
  });
});

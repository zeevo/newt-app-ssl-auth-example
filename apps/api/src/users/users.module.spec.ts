import { Test } from "@nestjs/testing";
import { CertificateUserService } from "./certificate-user.service";
import { DEVIN, DEVIN_ORGANIZATION, DevinUserService } from "./devin-user.service";
import { InMemoryUserRepository } from "./in-memory-user.repository";
import { USER_REPOSITORY } from "./user.repository";
import { USER_SERVICE, type UserService } from "./user.service";
import { loadAppConfig } from "../app.config";
import { UsersModule } from "./users.module";

// Variables the app can't start without; never connected to in these tests.
const required = {
  DATABASE_URL: "postgres://localhost/unused",
  BETTER_AUTH_SECRET: "test-secret",
};

const alice = {
  id: "alice",
  dn: "CN=Alice,O=Example,C=US",
  name: "Alice",
  email: "a@example.com",
};

async function userService(env: NodeJS.ProcessEnv, repository: InMemoryUserRepository) {
  const moduleRef = await Test.createTestingModule({
    imports: [UsersModule.register(loadAppConfig({ ...required, ...env }))],
  })
    .overrideProvider(USER_REPOSITORY)
    .useValue(repository)
    .compile();
  // Runs startup hooks, as the app does.
  await moduleRef.init();
  return moduleRef.get<UserService>(USER_SERVICE);
}

const initialOwnerEnv = {
  INITIAL_OWNER_DN: "CN=Root,O=Example,C=US",
  INITIAL_OWNER_NAME: "Root Owner",
  INITIAL_OWNER_EMAIL: "root@example.com",
  INITIAL_ORGANIZATION: "Example Corp.",
};

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

  describe("initial owner", () => {
    it("creates the owner and their organization on startup", async () => {
      const users = await userService(initialOwnerEnv, repository);
      const owner = await users.authenticate(
        new Headers({ "X-DN": initialOwnerEnv.INITIAL_OWNER_DN }),
      );
      expect(owner).toEqual(
        expect.objectContaining({ name: "Root Owner", email: "root@example.com" }),
      );
      expect(repository.organizations).toEqual([{ name: "Example Corp.", slug: "example-corp" }]);
      expect(repository.members).toEqual([
        { userId: owner?.id, slug: "example-corp", role: "owner" },
      ]);
    });

    it("leaves an existing user with that DN alone", async () => {
      await userService({ ...initialOwnerEnv, INITIAL_OWNER_DN: alice.dn }, repository);
      expect(repository.users).toEqual([alice]);
      expect(repository.organizations).toEqual([]);
      expect(repository.members).toEqual([]);
    });

    it("creates nothing when unset or empty", async () => {
      await userService(
        {
          INITIAL_OWNER_DN: "",
          INITIAL_OWNER_NAME: "",
          INITIAL_OWNER_EMAIL: "",
          INITIAL_ORGANIZATION: "",
        },
        repository,
      );
      expect(repository.users).toEqual([alice]);
    });
  });

  describe("devin", () => {
    it("signs in as Devin without a certificate, creating him once", async () => {
      const users = await userService({ USER_SERVICE: "devin" }, repository);
      expect(await users.authenticate(new Headers())).toEqual(DEVIN);
      expect(await users.authenticate(new Headers({ "X-DN": alice.dn }))).toEqual(DEVIN);
      expect(repository.users.filter((user) => user.dn === DEVIN.dn)).toHaveLength(1);
    });

    it("leaves a Devin who already belongs to an organization alone", async () => {
      const users = await userService({ USER_SERVICE: "devin" }, repository);
      await users.authenticate(new Headers());
      await users.authenticate(new Headers());
      expect(repository.members).toHaveLength(1);
    });

    it("makes Devin the owner of the development organization", async () => {
      const users = await userService({ USER_SERVICE: "devin" }, repository);
      await users.authenticate(new Headers());
      expect(repository.organizations).toEqual([DEVIN_ORGANIZATION]);
      expect(repository.members).toEqual([
        { userId: DEVIN.id, slug: DEVIN_ORGANIZATION.slug, role: "owner" },
      ]);
    });
  });
});

describe("loadAppConfig", () => {
  it("requires DATABASE_URL and BETTER_AUTH_SECRET", () => {
    expect(() => loadAppConfig({})).toThrow();
    expect(loadAppConfig(required)).toMatchObject({
      databaseUrl: required.DATABASE_URL,
      authUrl: "http://localhost:3000",
      userService: "certificate",
      initialOwner: null,
    });
  });

  it("refuses the Devin service in production", () => {
    expect(() =>
      loadAppConfig({ ...required, USER_SERVICE: "devin", NODE_ENV: "production" }),
    ).toThrow();
  });

  it("rejects an unknown USER_SERVICE", () => {
    expect(() => loadAppConfig({ ...required, USER_SERVICE: "nobody" })).toThrow();
  });

  it("requires the initial owner variables together", () => {
    expect(() => loadAppConfig({ ...required, INITIAL_OWNER_DN: "CN=Root" })).toThrow(
      /set together/,
    );
    expect(() =>
      loadAppConfig({ ...required, ...initialOwnerEnv, INITIAL_ORGANIZATION: "" }),
    ).toThrow(/set together/);
  });

  it("rejects an invalid INITIAL_OWNER_EMAIL", () => {
    expect(() =>
      loadAppConfig({ ...required, ...initialOwnerEnv, INITIAL_OWNER_EMAIL: "nope" }),
    ).toThrow();
  });

  it("derives the initial organization's slug from its name", () => {
    expect(loadAppConfig({ ...required, ...initialOwnerEnv }).initialOwner?.organization).toEqual({
      name: "Example Corp.",
      slug: "example-corp",
    });
    expect(() =>
      loadAppConfig({ ...required, ...initialOwnerEnv, INITIAL_ORGANIZATION: "!!!" }),
    ).toThrow(/letter or digit/);
  });
});

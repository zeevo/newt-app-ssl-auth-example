# newt-app-ssl-auth-example

Full-stack monorepo: Next.js 16 + NestJS 12 + better-auth + Postgres.

## Quick start

```sh
pnpm install
cp .env.example .env   # then set BETTER_AUTH_SECRET
pnpm db:up             # local Postgres in Docker, on localhost:5432
pnpm dev               # runs migrations, then starts the app
```

Open [http://localhost:3000](http://localhost:3000).

To skip certificates in development and be signed in as Devin E. Loper:

```sh
pnpm dev:devin
```

## Certificate authentication

nginx terminates TLS, verifies the client certificate against a CA, and forwards the certificate's subject DN in the `X-DN` header (always overwriting any `X-DN` the client sent). The app's `sslAuth` better-auth plugin (`POST /api/auth/sign-in/ssl`) asks the bound Nest `UserService` who that is; if the DN is in the `user` table's `dn` column, it opens a normal better-auth session. The app calls it automatically when there is no session, and shows an unauthorized page if the certificate has no user row.

The `UserService` implementation is picked by `USER_SERVICE` and bound with Nest DI (`apps/api/src/users/users.module.ts`):

- **`CertificateUserService`** (`certificate`, the default): looks up the DN header in the user table
- **`DevinUserService`** (`devin`): ignores certificates and signs in as Devin E. Loper, creating him on first use as the owner of a **Development** organization; refused when `NODE_ENV=production`

There is no sign-up and no password sign-in.

## Organizations

Access is organized with better-auth's [organization plugin](https://better-auth.com/docs/plugins/organization). Every user belongs to one or more organizations, and has a role in each:

- **Owner**: everything, including deleting the organization and adding, promoting or demoting other owners
- **Admin**: adds, edits and removes members (but not owners), and renames the organization
- **Member**: sees the organization and its members

The plugin checks these on the server, so a member gets a 403 whatever the UI shows. It also keeps at least one owner in every organization: the last owner cannot leave, be removed, or be demoted.

The sidebar switches between your organizations and creates new ones (the creator becomes the owner; any signed-in user may create one, the plugin's default). Each session starts in the organization the user joined first. The **Members** page lists the active organization's members with their certificate DNs, and owners and admins add members by DN alone (`POST /api/auth/organization/add-certificate-member`). **Settings** renames, leaves or deletes the organization.

Adding a DN that has no user yet creates one. Their name and email come from the Nest `UserDirectory` (`apps/api/src/users/user-directory.ts`), looked up by DN. The bound implementation, `CommonNameUserDirectory`, is a stand-in: the name is the DN's CN and the email is a unique `@users.invalid` placeholder. In production, bind an implementation that calls the external directory API instead. The lookup only runs once the caller is confirmed to be allowed to add members, and before the user is written, so a slow directory never holds the database.

Because adding a new DN creates a user, anyone who can create an organization can let new people in. To restrict who can, set the organization plugin's `allowUserToCreateOrganization` in `packages/auth/src/index.ts`.

Belonging to an organization is what lets someone in. When someone is removed from, or leaves, their last organization, or it is deleted, their user row is deleted, which ends their sessions; their certificate no longer gets them in until someone adds them again.

When deploying, set `INITIAL_OWNER_DN`, `INITIAL_OWNER_NAME`, `INITIAL_OWNER_EMAIL` and `INITIAL_ORGANIZATION` (all four, or none) and the app creates that user as an owner of that organization (creating it too, unless one with the same name's slug exists) when it starts, if no user has that DN yet. A user who already has the DN is never changed, so the variables can stay set: changes made in the app stick until the next restart, when a deleted owner is created again. Startup fails if only some are set or the email is invalid.

Alternatively, create the first owner in the database, for example:

```sql
INSERT INTO "user" (id, name, email, "emailVerified", dn, "createdAt", "updatedAt")
VALUES ('devin', 'Devin E. Loper', 'devin@example.com', true,
        'CN=Devin E. Loper,OU=Development,O=Example,C=US', now(), now());
INSERT INTO organization (id, name, slug, "createdAt")
VALUES ('example', 'Example Corp.', 'example-corp', now());
INSERT INTO member (id, "organizationId", "userId", role, "createdAt")
VALUES ('devin-example', 'example', 'devin', 'owner', now());
```

(`user` is a reserved word in Postgres, so the table name and camelCase columns are quoted.)

The DN must match nginx's `$ssl_client_s_dn` exactly (RFC 2253 order, e.g. `CN=...,OU=...,O=...,C=...`).

## Production

```sh
./nginx/gen-certs.sh   # throwaway CA, server cert, and a client cert for Devin
docker compose up --build   # needs BETTER_AUTH_SECRET and POSTGRES_PASSWORD set
```

`docker compose` reads the root `.env`, so set `BETTER_AUTH_URL=https://localhost` there (or in the shell) first. The dev value `http://localhost:3000` makes better-auth reject organization changes through nginx with "Invalid origin".

The stack runs its own Postgres (`postgres` service, data in the `pg_data` volume, not published to the host); the `migrate` service applies migrations before the app starts. Open [https://localhost](https://localhost) with a client certificate (import `nginx/certs/devin.p12`, password `devin`). Requests without a valid certificate are rejected by nginx. For a real deployment, replace the certificates in `nginx/certs`, set `BETTER_AUTH_URL` to the public URL, and keep the `app` service unreachable except through nginx, since it trusts `X-DN`.

## Commands

- `pnpm dev`: run in development
- `pnpm dev:devin`: run in development, signed in as Devin E. Loper
- `pnpm build`, `pnpm typecheck`, `pnpm test`: build, type-check, and test every workspace
- `pnpm lint`: lint (fails on errors); `pnpm format`: apply formatting
- `pnpm db:up` / `pnpm db:down`: start or stop the local development Postgres
- `pnpm db:migrate`: run migrations; `pnpm db:make <name>`: scaffold a new one

## Environment

Set in `.env` (a committed `.env.example` documents each one). The app reads them all once, at startup, into a validated `AppConfig` (`apps/api/src/app.config.ts`) that Nest injects where needed; a missing or invalid value stops the server from starting.

- **BETTER_AUTH_URL**: the public origin of the app
- **BETTER_AUTH_SECRET**: a random secret used to sign sessions
- **USER_SERVICE**: `certificate` (default) or `devin`
- **DN_HEADER**: header holding the client certificate DN (default `x-dn`)
- **DATABASE_URL**: Postgres connection string (`.env.example` matches `pnpm db:up`)
- **POSTGRES_PASSWORD**: `docker compose` only, the password for its Postgres service
- **INITIAL_OWNER_DN**, **INITIAL_OWNER_NAME**, **INITIAL_OWNER_EMAIL**, **INITIAL_ORGANIZATION**: deployment only, an optional owner and organization created on startup (see Organizations)

## Layout

- **`apps/web`**: Next.js frontend, a static export (SPA). In development `next dev` runs on port 3000 and proxies `/api` to Nest.
- **`apps/api`**: NestJS server (port 3001). It serves `/api`, including better-auth on `/api/auth`, and in production also serves the web app's static export, so the deployed app is one Nest process. Every API route requires a session unless marked `@AllowAnonymous()`.
- **`packages/`**: `auth`, `db`, `ui`, and shared `typescript-config`

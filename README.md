# newt-app-ssl-auth-example

Full-stack monorepo: Next.js 16 + NestJS 12 + better-auth + SQLite.

## Quick start

```sh
pnpm install
pnpm dev
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
- **`DevinUserService`** (`devin`): ignores certificates and signs in as Devin E. Loper (an admin), creating him on first use; refused when `NODE_ENV=production`

There is no sign-up and no password sign-in.

## Roles

Users have a `role` of `user` or `admin` (better-auth's admin plugin). Admins get an **Admin** panel (`/admin`) where they add users by certificate DN alone and make other users admins or remove the role.

A new user's name and email come from the Nest `UserDirectory` (`apps/api/src/users/user-directory.ts`), looked up by DN. The bound implementation, `CommonNameUserDirectory`, is a stand-in: the name is the DN's CN and the email is a unique `@users.invalid` placeholder. In production, bind an implementation that calls the external directory API instead. The lookup only runs once the caller is confirmed to be an admin, and before the user is written, so a slow directory never holds the database. The plugin's endpoints check the caller's role on the server, so non-admins get a 403 whatever the UI shows. Admins cannot change their own role, so at least one admin always remains.

The first admin has to be created in the database, for example:

```sql
INSERT INTO user (id, name, email, emailVerified, image, createdAt, updatedAt, dn, role)
VALUES ('devin', 'Devin E. Loper', 'devin@example.com', 1, NULL,
        strftime('%Y-%m-%dT%H:%M:%fZ'), strftime('%Y-%m-%dT%H:%M:%fZ'),
        'CN=Devin E. Loper,OU=Development,O=Example,C=US', 'admin');
```

`pnpm dev:devin` signs in as Devin with the admin role.

The DN must match nginx's `$ssl_client_s_dn` exactly (RFC 2253 order, e.g. `CN=...,OU=...,O=...,C=...`).

## Production

```sh
./nginx/gen-certs.sh   # throwaway CA, server cert, and a client cert for Devin
docker compose up --build
```

The `migrate` service applies migrations before the app starts. Open [https://localhost](https://localhost) with a client certificate (import `nginx/certs/devin.p12`, password `devin`). Requests without a valid certificate are rejected by nginx. For a real deployment, replace the certificates in `nginx/certs`, set `BETTER_AUTH_URL` to the public URL, and keep the `web` service unreachable except through nginx, since it trusts `X-DN`.

## Commands

- `pnpm dev`: run in development
- `pnpm dev:devin`: run in development, signed in as Devin E. Loper
- `pnpm build`, `pnpm typecheck`, `pnpm test`: build, type-check, and test every workspace
- `pnpm lint:check`: lint (fails on errors); `pnpm format:fix`: apply formatting
- `pnpm db:migrate`: run migrations; `pnpm db:make <name>`: scaffold a new one

## Environment

Set in `.env` (a committed `.env.example` documents each one):

- **BETTER_AUTH_URL**: the public origin of the app
- **BETTER_AUTH_SECRET**: a random secret used to sign sessions
- **USER_SERVICE**: `certificate` (default) or `devin`
- **DN_HEADER**: header holding the client certificate DN (default `x-dn`)
- **DATABASE_URL**: not set for SQLite (the app uses `dev.db` at the repo root); set it to a Postgres URL to use Postgres

## Layout

- **`apps/web`**: Next.js frontend (port 3000)
- **`apps/api`**: NestJS providers, resolved in-process by the web app
- **`packages/`**: `auth`, `db`, `ui`, and shared `typescript-config`

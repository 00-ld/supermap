# Admin Account Seeding Design

## Goal

Provide a reproducible initial administrator account for local and fresh deployments:

- username: `admin`
- initial password: `123456`
- role: `admin`

The initial password is intentionally documented as a bootstrap credential and must be changed after first login.

## Data Flow

1. The canonical database migration checks whether `user.username = 'admin'` exists.
2. If it does not exist, the migration inserts the account with a precomputed `{argon2id}` password hash.
3. If it already exists, the migration leaves its password and role unchanged.
4. Fresh Docker/MySQL initialization includes the same idempotent seed so a new database has the account without requiring a later manual step.

## Security and Compatibility

- The repository will never contain the plaintext password; only the Argon2id hash is stored.
- Existing accounts are not overwritten by a repeatable migration.
- The account uses the existing `role = 'admin'` authorization model and existing login endpoint.
- The migration remains safe to run more than once.

## Validation

- Verify the migration syntax and manifest registration.
- Verify the backend test suite and build.
- Verify that the seeded hash matches `123456` through the existing password encoder.
- Verify login returns an admin token and an admin-protected endpoint accepts that token in a local database.

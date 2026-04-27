# Fix MikroORM Config Plan

## Goal

Fix MikroORM setup issues found in review:
- runtime and CLI config drift
- unsafe URL password parsing
- incomplete migrations config
- missing DB constraints/relations
- e2e failing on MikroORM ESM dependency

## Tasks

1. Make `src/config/mikro-orm.config.ts` the single config factory.
2. Make root `mikro-orm.config.ts` only load env and export that factory result for CLI.
3. Use `clientUrl: DATABASE_URL` so special chars in Supabase password are handled by pg.
4. Add `extensions: [Migrator]`.
5. Configure migrations with `path: ./dist/migrations`, `pathTs: ./migrations`, `emit: ts`.
6. Add unique/index constraints and relation mapping before first migration.
7. Update e2e Jest config so MikroORM ESM packages are transformed.
8. Run build, lint, unit, e2e, and MikroORM CLI debug.

## Unresolved Questions

- Real DB connectivity depends on local network and actual Supabase password.

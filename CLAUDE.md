# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A NestJS 11 REST API for blog-post CRUD, backed by PostgreSQL through TypeORM. Swagger UI is served at `/docs`. It deploys to a single server with Docker Compose.

## Commands

```bash
npm install
npm run start:dev            # watch mode on PORT (default 3000)
npm run build                # nest build -> dist/
npm run lint                 # eslint with --fix (CI runs `npx eslint "{src,test}/**/*.ts"` without --fix)
npm run format               # prettier on src/ and test/
npm test                     # unit tests: src/**/*.spec.ts (jest rootDir is src/)
npm test -- src/blogs/blogs.service.spec.ts   # a single test file
npm test -- -t "throws NotFoundException"     # tests matching a name
npm run test:e2e             # test/*.e2e-spec.ts; boots the full AppModule, so it needs a reachable Postgres
docker compose up -d --build # Postgres 16 + API; the API is bound to 127.0.0.1:${API_PORT:-3006}
```

For local dev outside Docker, a Postgres must be running. Connection settings come from env vars (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`). `ConfigModule` loads them, and also reads a `.env` file, which is gitignored. Hardcoded fallbacks in `src/app.module.ts` match the docker-compose defaults.

## Architecture

- `src/main.ts`: bootstraps the app. It registers a global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted` and `transform`, so requests with unknown body fields are rejected with a 400. It also sets up Swagger.
- `src/app.module.ts`: global `ConfigModule` plus `TypeOrmModule.forRootAsync` with `autoLoadEntities: true`. Entities are picked up through each feature module's `TypeOrmModule.forFeature([...])` and are not listed centrally.
- `src/blogs/`: the only feature module, laid out in the standard Nest resource shape (controller → service → `Repository<Blog>`). The service throws `NotFoundException` for missing ids, and `update`/`remove` reuse `findOne` for that. Route `:id` params are converted with `+id` and not with `ParseIntPipe`.
- DTOs carry both `class-validator` and `@nestjs/swagger` decorators. `UpdateBlogDto` uses `PartialType` from `@nestjs/swagger` and not from `@nestjs/mapped-types`, which keeps the Swagger metadata. Keep the column lengths in the entity (`@Column({ length })`) in sync with `@MaxLength` in the DTO.
- There are no migrations. The schema is managed by TypeORM `synchronize` (see the gotchas below).

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main`:
1. A test job runs eslint, `npm test` and `npm run build` on Node 24.
2. A deploy job SSHes to the server, runs `git pull` in `/opt/blog`, then `docker compose up -d --build --wait`. It health-checks `http://127.0.0.1:$API_PORT/docs`, so the deploy fails if Swagger isn't served.

The `Dockerfile` is a two-stage `node:24-alpine` build that runs `node dist/main` as the `node` user with `NODE_ENV=production`. Nginx on the host fronts the API.

## Known gotchas

- **The `synchronize` logic in `app.module.ts` is inverted.** `DB_SYNCHRONIZE === 'false'` evaluates to `synchronize: true`, and docker-compose sets `DB_SYNCHRONIZE: 'false'`. As a result, production currently auto-syncs the schema. Without the variable, synchronize is on everywhere except when `NODE_ENV=production`.
- **`@nestjs/typeorm` 12 and `@nestjs/config` 12 are ESM-only.** The npm test scripts run Jest under `node --experimental-vm-modules` so it can `require()` them. Running bare `npx jest` fails with "Must use import to load ES Module", so use `npm test -- <path>` or `npm test -- -t "<name>"` instead.
- Unit specs mock the repository with `{ provide: getRepositoryToken(Blog), useValue: ... }`. Controller specs mock `BlogsService` directly.
- The e2e test expects `GET /` to return `Hello World!` from `AppController`/`AppService`.

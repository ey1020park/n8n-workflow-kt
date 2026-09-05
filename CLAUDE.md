# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A minimal CLI for version-controlling an existing n8n server's workflows as JSON files under `workflows/`. It has no build step, no tests, and no bundler — it's a thin wrapper around the n8n REST API run directly via `tsx`.

## Commands

```bash
npm run pull                          # server → workflows/*.json (overwrites local files)
npm run validate                      # check schema + secret-leak issues on local files
npm run creds                         # regenerate credential-map.md
npm run push                          # push all local workflows/*.json to server
npm run push -- workflows/xxx.json    # push a single file
```

There is no test suite, lint config, or build script in this repo — don't assume `npm test`/`npm run lint`/`npm run build` exist. Requires `.env` (copy from `.env.example`) with `N8N_API_URL` and `N8N_API_KEY`.

## Architecture

- `src/cli.ts` — argv dispatch to the four commands in `src/commands/`. No other entry point.
- `src/client.ts` — all n8n REST API calls (`/api/v1/...`), paginated via `cursor`/`nextCursor`. `toUploadBody()` strips server-managed fields (`id`, `active`, `tags`, `createdAt`, ...) down to the allowlist n8n accepts on create/update (`name`, `nodes`, `connections`, `settings`, `staticData`) — any new field n8n starts returning must be added here explicitly or it silently gets dropped on push.
- `src/schema.ts` — zod schema for the *minimal* workflow shape (name/nodes/connections only; node `parameters` are untyped since they vary per node type). Also owns `findSecretLeaks()`, which both `validate` and `push` call — this is the security gate, not something duplicated elsewhere. It flags two independent things: (1) a `node.credentials` entry containing keys other than `id`/`name` (meaning a real credential value leaked into the export), and (2) any `parameters` key matching `SECRET_LIKE_KEYS` whose string value isn't an n8n expression (`={{...}}`).
- `src/config.ts` — reads `N8N_API_URL`/`N8N_API_KEY` from env, throws if missing.
- `src/util.ts` — `workflows/` directory path and local-file listing; `sanitizeFilename()` used by `pull` to name files as `{id}-{sanitized-name}.json`.
- `src/commands/*.ts` — one file per CLI subcommand, each independently `async function` matching its command name.

### Data flow / invariants

- **push always re-validates.** `push.ts` re-parses each file through `WorkflowSchema` and `findSecretLeaks()` itself rather than trusting a prior `validate` run — never remove this check to "optimize" push.
- **Credential values never touch disk.** The n8n API only ever returns credential `id`/`name`/`type` metadata (never secret values), and workflow exports only contain `{id, name}` references in `node.credentials`. This is a hard security property of the tool, not incidental — any change to `client.ts` or `schema.ts` must preserve it.
- **push distinguishes create vs. update by the presence of `raw.id`** in the local file (not by filename). A file without `id` is `POST`ed as new; the response (including the assigned `id`) is written back to the same file.
- **`credential-map.md` is generated output**, derived by cross-referencing local `workflows/*.json` node credential references against the live server's credential list — it flags `orphaned` (referenced locally, missing on server) vs. `unused` (exists on server, referenced nowhere locally).

## Language

User-facing CLI output, error messages, and code comments are in Korean, matching the existing style in `src/`. Match this when editing these files.

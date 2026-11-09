# meshbay-sample-hono-bun

Bun + Hono API with MongoDB for the Meshbay vs Railway side-by-side test. No framework beyond Hono, no ORM.

## Environment

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URL` | yes | none | MongoDB connection string, e.g. `mongodb://user:password@host:27017/meshbay` |
| `PORT` | no | `8080` | HTTP port |

The database name is taken from the path of `MONGO_URL` (`meshbay` in the example above); when the URL has no path it
falls back to `meshbay`. The `items` collection is created on start when it is missing.

## Run locally

```sh
bun install
MONGO_URL=mongodb://localhost:27017/meshbay bun run start
```

Development mode with reload, and the production bundle check:

```sh
MONGO_URL=mongodb://localhost:27017/meshbay bun run dev
bun run build
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | `200 {"status":"ok","version":"v1"}` |
| GET | `/api/items` | JSON array of items (`id` is the MongoDB ObjectId hex string) |
| POST | `/api/items` | Body `{"name":"..."}` → `201` with the created item |

```sh
curl localhost:8080/health
curl -X POST localhost:8080/api/items -H 'content-type: application/json' -d '{"name":"first"}'
curl localhost:8080/api/items
```

CORS is open for every origin. `API_VERSION` in `src/index.ts` is the `version` text in `/health`.

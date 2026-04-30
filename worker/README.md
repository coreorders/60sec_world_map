# 60초 세계지도 Ranking API

Cloudflare Worker + D1 ranking API for `maps.zzim.site`.

## Setup

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create map-rank-db
```

Copy the returned `database_id` into `wrangler.jsonc`.

## Initialize D1

```bash
npm run db:remote
```

## Deploy

```bash
npm run deploy
```

After deploy, the game can use the default Worker URL:

```text
https://map-rank-api.ykdj.workers.dev
```

You can later connect a custom domain such as `api.maps.zzim.site` if DNS is available.

## Endpoints

- `POST /scores`
- `GET /leaderboard?period=monthly&limit=10`
- `GET /rank?id=<score-id>&period=monthly`

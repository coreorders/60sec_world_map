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

After deploy, connect a custom domain such as `api.maps.zzim.site` to this Worker.

## Endpoints

- `POST /scores`
- `GET /leaderboard?period=monthly&limit=10`
- `GET /rank?id=<score-id>&period=monthly`

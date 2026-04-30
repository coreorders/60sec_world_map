# 60초 세계지도

60초 동안 세계 지도에서 정답 국가를 찾아 점수를 올리는 캐주얼 웹 게임입니다.

## Local Preview

```bash
python -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173/?v=14
```

## Deploy Frontend

This repository can be deployed as a static site with GitHub Pages or Cloudflare Pages.

Production site:

```text
https://map.zzim.site
```

## Ranking API

The ranking API lives in `worker/` and uses Cloudflare Worker + D1.

```bash
cd worker
npm install
npm run db:remote
npm run deploy
```

After deployment, connect the Worker custom domain:

```text
https://api.map.zzim.site
```

When the game runs on `map.zzim.site`, it automatically uses `https://api.map.zzim.site` for rankings.

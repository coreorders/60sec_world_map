const ALLOWED_ORIGINS = new Set([
  "https://maps.zzim.site",
  "http://maps.zzim.site",
  "https://coreorders.github.io",
  "https://map.zzim.site",
  "http://map.zzim.site",
  "http://127.0.0.1:4173",
  "http://localhost:4173"
]);

const MAX_LIMIT = 100000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return corsResponse(origin);

    const url = new URL(request.url);

    try {
      if (url.pathname === "/scores" && request.method === "POST") {
        const body = await request.json();
        const entry = normalizeScore(body);

        await env.DB.prepare(`
          INSERT INTO scores (id, game_mode, nickname, score, accuracy, attempts, locale, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          entry.id,
          entry.game_mode,
          entry.nickname,
          entry.score,
          entry.accuracy,
          entry.attempts,
          entry.locale,
          entry.created_at
        ).run();

        return json(entry, 201, origin);
      }

      if (url.pathname === "/leaderboard" && request.method === "GET") {
        const period = periodRange(url.searchParams.get("period") || "monthly");
        const limit = clampInt(url.searchParams.get("limit"), 1, MAX_LIMIT, 10);

        const result = await env.DB.prepare(`
          SELECT id, game_mode, nickname, score, accuracy, attempts, locale, created_at
          FROM scores
          WHERE game_mode = 'COUNTRY' AND created_at >= ?
          ORDER BY score DESC, accuracy DESC, created_at ASC
          LIMIT ?
        `).bind(period.start, limit).all();

        return json({
          rows: withRanks(result.results || [], 1),
          period: period.name
        }, 200, origin);
      }

      if (url.pathname === "/rank" && request.method === "GET") {
        const id = url.searchParams.get("id") || "";
        const period = periodRange(url.searchParams.get("period") || "monthly");
        const current = await env.DB.prepare(`
          SELECT id, game_mode, nickname, score, accuracy, attempts, locale, created_at
          FROM scores
          WHERE id = ? AND game_mode = 'COUNTRY' AND created_at >= ?
        `).bind(id, period.start).first();

        if (!current) return json({ error: "Score not found" }, 404, origin);

        const rankRow = await env.DB.prepare(`
          SELECT COUNT(*) + 1 AS rank
          FROM scores
          WHERE game_mode = 'COUNTRY'
            AND created_at >= ?
            AND (
              score > ?
              OR (score = ? AND accuracy > ?)
              OR (score = ? AND accuracy = ? AND created_at < ?)
            )
        `).bind(
          period.start,
          current.score,
          current.score,
          current.accuracy,
          current.score,
          current.accuracy,
          current.created_at
        ).first();

        const rank = Number(rankRow.rank || 1);
        const offset = Math.max(0, rank - 3);
        const result = await env.DB.prepare(`
          SELECT id, game_mode, nickname, score, accuracy, attempts, locale, created_at
          FROM scores
          WHERE game_mode = 'COUNTRY' AND created_at >= ?
          ORDER BY score DESC, accuracy DESC, created_at ASC
          LIMIT 5 OFFSET ?
        `).bind(period.start, offset).all();

        return json({
          rank,
          rows: withRanks(result.results || [], offset + 1),
          period: period.name
        }, 200, origin);
      }

      return json({ error: "Not found" }, 404, origin);
    } catch (error) {
      return json({ error: "Server error" }, 500, origin);
    }
  }
};

function normalizeScore(body) {
  const now = Date.now();
  const id = crypto.randomUUID();
  const nickname = String(body.nickname || "Anonymous").trim().slice(0, 10) || "Anonymous";
  return {
    id,
    game_mode: body.game_mode === "CITY" ? "CITY" : "COUNTRY",
    nickname,
    score: clampNumber(body.score, 0, 10000),
    accuracy: clampNumber(body.accuracy, 0, 100),
    attempts: clampNumber(body.attempts, 0, 1000),
    locale: body.locale === "en" ? "en" : "ko",
    created_at: now
  };
}

function periodRange(period) {
  const now = new Date();
  if (period === "weekly") {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    return { name: "weekly", start: start.getTime() };
  }
  if (period === "yearly") {
    return { name: "yearly", start: Date.UTC(now.getUTCFullYear(), 0, 1) };
  }
  return { name: "monthly", start: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) };
}

function withRanks(rows, startRank) {
  return rows.map((row, index) => ({
    ...row,
    rank: startRank + index
  }));
}

function clampInt(value, min, max, fallback) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.round(Math.max(min, Math.min(max, number)));
}

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://maps.zzim.site";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function corsResponse(origin) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

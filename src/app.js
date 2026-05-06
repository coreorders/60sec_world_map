const COUNTRY_DATA = window.COUNTRY_DATA || [];
const COUNTRY_BY_ID = window.COUNTRY_BY_ID || new Map();
const CITY_DATA = window.CITY_DATA || [];
const EXCLUDED_COUNTRY_IDS = new Set(["010"]);
const PLAYABLE_COUNTRIES = COUNTRY_DATA.filter((country) => !EXCLUDED_COUNTRY_IDS.has(country.id));
const COUNTRY_PALETTE = [
  "#f7c6c7", "#f8d49a", "#f7ef9f", "#bfe7c2", "#b9eadf", "#b9dcf2",
  "#c8d3ff", "#dcc5f2", "#f3c4df", "#d9e7aa", "#ffd2b3", "#c9e2d0"
];

const I18N = {
      en: {
        appName: "60-Second World Map",
        tagline: "Find countries around the world in 60 seconds.",
        homeTitle: "60-Second World Map",
        homeLead: "A bright 60-second world map challenge. Zoom, pan, and tap the right country to score.",
        countryMode: "Start Game",
        countryModeDesc: "Tap the correct country polygon.",
        cityMode: "City Mode",
        cityModeDesc: "Pin the target city within the tolerance radius.",
        normal: "Normal",
        hard: "Hard",
        controlsHint: "Drag to move the map. Pinch or wheel to zoom deeper. Country names appear when you zoom in.",
        targetLabel: "Find",
        gameTimer: "Game",
        questionTimer: "Question",
        nickname: "Nickname",
        score: "Score",
        finishNow: "Finish",
        myResult: "My Result",
        myRank: "My Rank",
        rankSuffix: "",
        accuracy: "Accuracy",
        questions: "Questions",
        resultTitle: "Result",
        mode: "Mode",
        saveScore: "Save Score",
        skip: "Skip",
        retry: "Try Again",
        share: "Share",
        home: "Home",
        correct: "Correct! +4",
        partial: "+{points} ({distance}km away)",
        wrong: "Wrong! +0",
        timeout: "Time's up! +0",
        reviewNone: "Perfect run. No misses to review.",
        reviewSome: "Missed locations are highlighted on the map.",
        weekly: "Weekly",
        monthly: "Monthly Ranking",
        yearly: "Yearly",
        anonymous: "Anonymous",
        loadingBoard: "Loading rankings...",
        emptyBoard: "No scores yet",
        rankMore: "Show top 200",
        country: "Country",
        city: "City"
      },
      ko: {
        appName: "60초 세계지도",
        tagline: "60초 동안 세계의 나라를 최대한 많이 찾아보세요.",
        homeTitle: "60초 세계지도",
        homeLead: "밝고 빠른 60초 세계지도 챌린지입니다. 지도를 움직이고 확대하며 정답 국가를 터치해 점수를 올리세요.",
        countryMode: "게임 시작",
        countryModeDesc: "정답 국가의 영역을 터치합니다.",
        cityMode: "도시 맞추기",
        cityModeDesc: "목표 도시를 허용 반경 안에 찍습니다.",
        normal: "Normal",
        hard: "Hard",
        controlsHint: "드래그로 이동, 핀치나 휠로 더 깊게 확대하세요. 확대하면 나라 이름이 표시됩니다.",
        targetLabel: "찾을 곳",
        gameTimer: "전체",
        questionTimer: "문제",
        nickname: "닉네임",
        score: "점수",
        finishNow: "여기까지하기",
        myResult: "내 기록",
        myRank: "내 순위",
        rankSuffix: "위",
        accuracy: "정답률",
        questions: "문제 수",
        resultTitle: "결과",
        mode: "모드",
        saveScore: "점수 저장",
        skip: "스킵",
        retry: "다시 하기",
        share: "공유하기",
        home: "홈",
        correct: "정답! +4",
        partial: "+{points} ({distance}km 차이)",
        wrong: "오답! +0",
        timeout: "시간 초과! +0",
        reviewNone: "완벽합니다. 리뷰할 오답이 없습니다.",
        reviewSome: "틀렸거나 시간 초과된 위치가 지도에 표시됩니다.",
        weekly: "주간",
        monthly: "월간 랭킹",
        yearly: "연간",
        anonymous: "Anonymous",
        loadingBoard: "순위를 불러오는 중입니다",
        emptyBoard: "아직 기록이 없습니다",
        rankMore: "200위까지 보기",
        country: "국가",
        city: "도시"
      }
    };

    const MAP_URL = "./src/map/countries-110m.json";
    const MAX_RANK_ROWS = 100000;
    const HOME_RANK_LIMIT = 50;
    const HOME_RANK_EXPANDED_LIMIT = 200;
    const MOBILE_DRAG_Y_GAIN = 1.55;
    const MAX_MAP_SCALE = 20;
    const MAP_WIDTH = 1000;
    const MAP_HEIGHT = 500;
    const MAP_LAT_LIMIT = 85;
    const MAP_VERTICAL_PADDING = 18;
    const MERCATOR_LAT_RAD = MAP_LAT_LIMIT * Math.PI / 180;
    const MERCATOR_Y_SPAN = Math.log(Math.tan(Math.PI / 4 + MERCATOR_LAT_RAD / 2));
    const MERCATOR_SCALE = (MAP_HEIGHT - MAP_VERTICAL_PADDING * 2) / (MERCATOR_Y_SPAN * 2);
    const WORLD_WIDTH = 2 * Math.PI * MERCATOR_SCALE;
    const WORLD_COPIES = [-2, -1, 0, 1, 2].map((copy) => copy * WORLD_WIDTH);
    const PRODUCTION_HOSTS = new Set(["maps.zzim.site", "coreorders.github.io"]);
    const API_BASE = window.MAP_RANK_API || (PRODUCTION_HOSTS.has(location.hostname) ? "https://map-rank-api.ykdj.workers.dev" : "");
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));
    const projection = d3.geoMercator()
      .scale(MERCATOR_SCALE)
      .translate([WORLD_WIDTH / 2, MAP_HEIGHT / 2]);
    const geoPath = d3.geoPath(projection);
    const MAP_Y_MIN = projection([0, MAP_LAT_LIMIT])[1];
    const MAP_Y_MAX = projection([0, -MAP_LAT_LIMIT])[1];

    const state = {
      locale: pickInitialLocale(),
      mode: "COUNTRY",
      period: "monthly",
      playing: false,
      score: 0,
      correctCount: 0,
      combo: 0,
      attempts: 0,
      gameLeft: 60,
      questionLeft: 10,
      current: null,
      pool: [],
      misses: [],
      revealingAnswer: false,
      saved: false,
      timerId: 0,
      transform: { x: 0, y: 0, scale: 1 },
      countryCentroids: new Map(),
      countrySegments: new Map(),
      countryHitTolerances: new Map(),
      pointers: new Map(),
      dragStart: null,
      lastGestureMoved: false,
      multiTouchActive: false,
      suppressTapUntil: 0,
      resultEntry: null,
      remoteScores: [],
      leaderboardLoading: Boolean(API_BASE),
      leaderboardLimit: HOME_RANK_LIMIT,
      resultRankRows: null,
      savePromise: null,
      audio: {
        context: null,
        master: null,
        bgmTimer: 0,
        bgmAudio: null,
        bgmDuckTimer: 0,
        bgmSourceUnavailable: false
      }
    };

    function pickInitialLocale() {
      const saved = localStorage.getItem("wpr_locale_v2");
      const manuallySelected = localStorage.getItem("wpr_locale_manual_v2") === "1";
      if (manuallySelected && (saved === "ko" || saved === "en")) return saved;
      const browserLocales = [
        ...(navigator.languages || []),
        navigator.language,
        navigator.userLanguage,
        Intl.DateTimeFormat().resolvedOptions().locale
      ].filter(Boolean).map((value) => String(value).toLowerCase());
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (browserLocales.some((locale) => locale.startsWith("ko")) || timeZone === "Asia/Seoul") return "ko";
      return "en";
    }

    function t(key) {
      return I18N[state.locale][key] || I18N.en[key] || key;
    }

    function trackEvent(name, params = {}) {
      if (typeof window.gtag !== "function") return;
      window.gtag("event", name, {
        game_mode: state.mode,
        locale: state.locale,
        ...params
      });
    }

    function deviceType() {
      const ua = navigator.userAgent || "";
      const maxTouchPoints = navigator.maxTouchPoints || 0;
      if (/ipad|tablet/i.test(ua) || (maxTouchPoints > 1 && /macintosh/i.test(ua))) return "tablet";
      if (/mobile|iphone|ipod|android.*mobile/i.test(ua)) return "mobile";
      if (/android/i.test(ua)) return "tablet";
      return "desktop";
    }

    function browserName() {
      const ua = navigator.userAgent || "";
      if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
      if (/Whale/i.test(ua)) return "Whale";
      if (/Edg/i.test(ua)) return "Edge";
      if (/Firefox|FxiOS/i.test(ua)) return "Firefox";
      if (/Chrome|CriOS/i.test(ua) && !/Edg|Whale|SamsungBrowser/i.test(ua)) return "Chrome";
      if (/Safari/i.test(ua) && !/Chrome|CriOS|Edg|Whale|SamsungBrowser/i.test(ua)) return "Safari";
      return "Other";
    }

    function localName(item) {
      return state.locale === "ko" ? (item.name_ko || item.city_ko) : (item.name_en || item.city_en);
    }

    function updateCountryLabels() {
      $$(".country-label").forEach((node) => {
        const country = COUNTRY_BY_ID.get(node.dataset.countryId);
        if (country) node.textContent = localName(country);
      });
      $$(".answer-name").forEach((node) => {
        const country = COUNTRY_BY_ID.get(node.dataset.countryId);
        if (country) node.textContent = localName(country);
      });
    }

    function project(lng, lat) {
      const [x, y] = projection([lng, lat]);
      return { x, y };
    }

    function unproject(x, y) {
      const [lng, lat] = projection.invert([x, y]);
      return { lng, lat };
    }

    function haversineKm(a, b) {
      const R = 6371;
      const toRad = (d) => d * Math.PI / 180;
      const dLat = toRad(b.lat - a.lat);
      const dLng = toRad(b.lng - a.lng);
      const lat1 = toRad(a.lat);
      const lat2 = toRad(b.lat);
      const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(h));
    }

    function getRings(feature) {
      if (!feature || !feature.geometry) return [];
      if (feature.geometry.type === "Polygon") return feature.geometry.coordinates;
      if (feature.geometry.type === "MultiPolygon") return feature.geometry.coordinates.flat();
      return [];
    }

    function buildCountrySegments(feature) {
      const segments = [];
      getRings(feature).forEach((ring) => {
        const points = ring.map((coord) => {
          const projected = projection(coord);
          return projected ? { x: projected[0], y: projected[1], lng: coord[0], lat: coord[1] } : null;
        }).filter(Boolean);
        for (let i = 0; i < points.length - 1; i += 1) {
          segments.push([points[i], points[i + 1]]);
        }
      });
      return segments;
    }

    function nearestPointOnSegment(point, a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lengthSq = dx * dx + dy * dy;
      if (!lengthSq) return a;
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq));
      return {
        x: a.x + dx * t,
        y: a.y + dy * t
      };
    }

    function distanceToCountryKm(mapPoint, countryId) {
      const targetNode = document.querySelector(`[data-country-id="${countryId}"]`);
      if (targetNode && targetNode.isPointInFill) {
        const svgPoint = $("#mapSvg").createSVGPoint();
        svgPoint.x = mapPoint.x;
        svgPoint.y = mapPoint.y;
        if (targetNode.isPointInFill(svgPoint)) return 0;
      }
      const segments = state.countrySegments.get(countryId) || [];
      const clickedGeo = unproject(mapPoint.x, mapPoint.y);
      let nearest = null;
      let bestSq = Infinity;
      segments.forEach(([a, b]) => {
        const candidate = nearestPointOnSegment(mapPoint, a, b);
        const dx = candidate.x - mapPoint.x;
        const dy = candidate.y - mapPoint.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < bestSq) {
          bestSq = distSq;
          nearest = candidate;
        }
      });
      if (!nearest) return Infinity;
      const nearestGeo = unproject(nearest.x, nearest.y);
      return haversineKm(clickedGeo, nearestGeo);
    }

    function pointsForDistance(distanceKm, exact) {
      if (exact) return 4;
      if (distanceKm <= 500) return 3;
      if (distanceKm <= 1000) return 2;
      if (distanceKm <= 2000) return 1;
      return 0;
    }

    function hitToleranceForFeature(feature) {
      const area = geoPath.area(feature);
      if (area < 1) return 320;
      if (area < 3) return 260;
      if (area < 7) return 200;
      if (area < 15) return 140;
      if (area < 30) return 90;
      return 0;
    }

    function accuracyPercent() {
      if (!state.attempts) return 0;
      return Math.round((state.correctCount / state.attempts) * 100);
    }

    function renderI18n() {
      document.documentElement.lang = state.locale;
      document.title = t("appName");
      $$("[data-i18n]").forEach((node) => node.textContent = t(node.dataset.i18n));
      $("#langToggle").textContent = state.locale === "ko" ? "EN" : "KR";
      $("#nicknameInput").placeholder = t("nickname");
      updateCountryLabels();
      renderLeaderboard();
      renderResultReel();
      if (state.current) $("#targetName").textContent = localName(state.current);
    }

    function initAudio() {
      if (state.audio.context) {
        if (state.audio.context.state === "suspended") state.audio.context.resume();
        return state.audio.context;
      }
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      const context = new AudioContextClass();
      const master = context.createGain();
      master.gain.value = 0.9;
      master.connect(context.destination);
      state.audio.context = context;
      state.audio.master = master;
      return context;
    }

    function duckBgm(duration = 190) {
      if (!state.audio.bgmAudio || state.audio.bgmAudio.paused) return;
      state.audio.bgmAudio.volume = 0.28;
      clearTimeout(state.audio.bgmDuckTimer);
      state.audio.bgmDuckTimer = setTimeout(() => {
        if (state.audio.bgmAudio && !state.audio.bgmAudio.paused) state.audio.bgmAudio.volume = 0.52;
      }, duration);
    }

    function playTone(freq, startDelay, duration, type, volume) {
      const context = initAudio();
      if (!context || !state.audio.master) return;
      duckBgm();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime + startDelay;
      const sfxVolume = Math.min(0.22, (volume || 0.08) * 1.8);
      oscillator.type = type || "sine";
      oscillator.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(sfxVolume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(state.audio.master);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.04);
    }

    function playNoiseBurst(startDelay, duration, volume, filterFreq = 2200) {
      const context = initAudio();
      if (!context || !state.audio.master) return;
      duckBgm();
      const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
      const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
      }

      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const now = context.currentTime + startDelay;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(filterFreq, now);
      filter.Q.setValueAtTime(6, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.min(0.12, volume * 1.9), now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(state.audio.master);
      source.start(now);
      source.stop(now + duration + 0.03);
    }

    function playBgmTone(freq, startDelay, duration, volume = 0.02) {
      const context = initAudio();
      if (!context || !state.audio.master) return;
      const now = context.currentTime + startDelay;
      const main = context.createOscillator();
      const sparkle = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();

      main.type = "triangle";
      sparkle.type = "sine";
      main.frequency.setValueAtTime(freq, now);
      sparkle.frequency.setValueAtTime(freq * 2, now);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(3400, now + 0.035);
      filter.frequency.exponentialRampToValueAtTime(1500, now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      main.connect(filter);
      sparkle.connect(filter);
      filter.connect(gain);
      gain.connect(state.audio.master);
      main.start(now);
      sparkle.start(now);
      main.stop(now + duration + 0.04);
      sparkle.stop(now + duration + 0.04);
    }

    function playClickSound() {
      playTone(760, 0, 0.045, "triangle", 0.06);
      playNoiseBurst(0, 0.028, 0.018, 2800);
    }

    function playUiClickSound() {
      playTone(620, 0, 0.045, "triangle", 0.045);
      playTone(930, 0.035, 0.055, "sine", 0.035);
    }

    function playStartSound() {
      [523, 784, 1047].forEach((freq, index) => {
        playTone(freq, index * 0.055, 0.115, "triangle", 0.075);
      });
    }

    function playCorrectSound(combo = 1) {
      const step = Math.min(7, Math.max(0, combo - 1));
      const lift = 2 ** (step / 12);
      const volume = Math.min(0.105, 0.066 + step * 0.006);
      playTone(660 * lift, 0, 0.08, "triangle", volume);
      playTone(880 * lift, 0.075, 0.09, "triangle", volume + 0.005);
      playTone(1320 * lift, 0.16, 0.12, "sine", volume);
      if (combo >= 4) playTone(1760 * lift, 0.25, 0.09, "sine", 0.05);
    }

    function playPartialSound(points = 1) {
      const lift = 2 ** (Math.max(0, points - 1) / 12);
      playTone(494 * lift, 0, 0.07, "triangle", 0.052);
      playTone(659 * lift, 0.065, 0.085, "sine", 0.046);
      playTone(784 * lift, 0.14, 0.075, "triangle", 0.038);
    }

    function playWrongSound() {
      playTone(330, 0, 0.12, "sawtooth", 0.052);
      playTone(220, 0.1, 0.16, "triangle", 0.055);
    }

    function playTimeoutSound() {
      playTone(440, 0, 0.08, "square", 0.045);
      playTone(330, 0.085, 0.09, "square", 0.04);
      playTone(247, 0.17, 0.13, "triangle", 0.045);
    }

    function playFinishSound() {
      [523, 659, 784, 1047].forEach((freq, index) => {
        playTone(freq, index * 0.08, 0.16, "triangle", 0.075);
      });
    }

    function startBgm() {
      if (startMp3Bgm()) return;
      const context = initAudio();
      if (!context || state.audio.bgmTimer) return;
      let phraseIndex = 0;
      const phrase = () => {
        if (!state.playing) return;
        const phrases = [
          [523, 659, 784, 988, 880, 784, 659, 587], 
          [587, 784, 988, 1175, 1047, 988, 784, 698], 
          [659, 880, 1047, 1319, 1175, 1047, 880, 784], 
          [523, 698, 880, 1047, 988, 880, 698, 659], 
          [659, 784, 1047, 1319, 1175, 1047, 784, 698], 
          [587, 784, 988, 1175, 1047, 988, 784, 698], 
          [523, 659, 880, 1047, 988, 880, 659, 587], 
          [440, 523, 698, 880, 784, 698, 523, 494], 
          [587, 698, 880, 1175, 1047, 880, 698, 659], 
          [784, 988, 1175, 1568, 1480, 1175, 988, 880], 
          [523, 659, 784, 1047, 988, 784, 659, 587], 
          [659, 880, 1047, 1319, 1175, 1047, 880, 784], 
          [698, 880, 1047, 1397, 1319, 1047, 880, 784], 
          [659, 784, 1047, 1319, 1175, 1047, 784, 698], 
          [587, 784, 988, 1175, 1047, 988, 784, 698], 
          [698, 784, 988, 1175, 1047, 988, 784, 698]
        ];
        const basses = [
          262, 196, 220, 175,
          262, 196, 220, 175,
          294, 196, 262, 220,
          175, 262, 196, 196
        ];
        const bass = basses[phraseIndex % 16];
        const melody = phrases[phraseIndex % 16];
        melody.forEach((freq, index) => {
          playBgmTone(freq, index * 0.16, 0.115, index % 2 ? 0.019 : 0.026);
        });
        [0, 0.64, 1.28].forEach((delay) => playBgmTone(bass, delay, 0.18, 0.012));
        phraseIndex += 1;
      };
      phrase();
      state.audio.bgmTimer = setInterval(phrase, 1340);
    }

    function stopBgm() {
      if (state.audio.bgmAudio) {
        state.audio.bgmAudio.pause();
        state.audio.bgmAudio.currentTime = 0;
      }
      if (state.audio.bgmTimer) {
        clearInterval(state.audio.bgmTimer);
        state.audio.bgmTimer = 0;
      }
    }

    function startMp3Bgm() {
      if (state.audio.bgmSourceUnavailable) return false;
      if (!state.audio.bgmAudio) {
        const audio = new Audio(new URL("bgm.mp3", document.baseURI).href);
        audio.loop = true;
        audio.preload = "auto";
        audio.volume = 0.52;
        audio.addEventListener("error", () => {
          state.audio.bgmSourceUnavailable = true;
          state.audio.bgmAudio = null;
          if (state.playing) startBgm();
        }, { once: true });
        state.audio.bgmAudio = audio;
      }
      const playPromise = state.audio.bgmAudio.play();
      if (!playPromise || typeof playPromise.catch !== "function") return true;
      playPromise.catch(() => {
        state.audio.bgmSourceUnavailable = true;
        state.audio.bgmAudio = null;
        if (state.playing) startBgm();
      });
      return true;
    }

    async function renderMap() {
      const graticule = $("#graticule");
      WORLD_COPIES.forEach((offset) => {
        const graticulePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        graticulePath.setAttribute("class", "graticule");
        graticulePath.setAttribute("d", geoPath(d3.geoGraticule10()));
        graticulePath.setAttribute("transform", `translate(${offset} 0)`);
        graticule.appendChild(graticulePath);
      });

      const countriesLayer = $("#countries");
      const labelsLayer = $("#countryLabels");
      const response = await fetch(MAP_URL);
      if (!response.ok) throw new Error("Map data failed to load");
      const topology = await response.json();
      const world = topojson.feature(topology, topology.objects.countries);
      const countryColors = buildCountryColorMap(topology.objects.countries.geometries);
      world.features.forEach((feature) => {
        const featureName = feature.properties && feature.properties.name ? feature.properties.name : "Unknown";
        const id = feature.id == null ? `custom:${featureName}` : String(feature.id).padStart(3, "0");
        if (EXCLUDED_COUNTRY_IDS.has(id)) return;
        state.countryCentroids.set(id, geoPath.centroid(feature));
        state.countrySegments.set(id, buildCountrySegments(feature));
        state.countryHitTolerances.set(id, hitToleranceForFeature(feature));
        WORLD_COPIES.forEach((offset) => {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("class", "country");
          path.dataset.countryId = id;
          path.setAttribute("d", geoPath(feature));
          path.setAttribute("transform", `translate(${offset} 0)`);
          path.style.setProperty("--country-fill", countryColors.get(id) || COUNTRY_PALETTE[0]);
          countriesLayer.appendChild(path);
        });
        const country = COUNTRY_BY_ID.get(id);
        if (country) {
          const labelPoint = getCountryPoint(country);
          WORLD_COPIES.forEach((offset) => {
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("class", "country-label");
            label.dataset.countryId = id;
            label.setAttribute("x", labelPoint.x + offset);
            label.setAttribute("y", labelPoint.y);
            label.textContent = localName(country);
            labelsLayer.appendChild(label);
          });
        }
      });

      CITY_DATA.forEach((city) => {
        const point = project(city.lng, city.lat);
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute("class", "city-dot");
        dot.setAttribute("cx", point.x);
        dot.setAttribute("cy", point.y);
        dot.setAttribute("r", 3);
        countriesLayer.appendChild(dot);
      });
      applyTransform();
    }

    function buildCountryColorMap(geometries) {
      const idToArcs = new Map();
      const arcOwners = new Map();
      geometries.forEach((geometry) => {
        const id = geometry.id == null ? `custom:${geometry.properties?.name || "Unknown"}` : String(geometry.id).padStart(3, "0");
        if (EXCLUDED_COUNTRY_IDS.has(id)) return;
        const arcs = collectArcIndexes(geometry.arcs);
        idToArcs.set(id, arcs);
        arcs.forEach((arc) => {
          if (!arcOwners.has(arc)) arcOwners.set(arc, []);
          arcOwners.get(arc).push(id);
        });
      });

      const neighbors = new Map([...idToArcs.keys()].map((id) => [id, new Set()]));
      arcOwners.forEach((owners) => {
        owners.forEach((id) => {
          owners.forEach((otherId) => {
            if (id !== otherId) neighbors.get(id)?.add(otherId);
          });
        });
      });

      const colors = new Map();
      [...neighbors.entries()]
        .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
        .forEach(([id, neighborIds]) => {
          const blocked = new Set([...neighborIds].map((neighborId) => colors.get(neighborId)).filter(Boolean));
          const color = COUNTRY_PALETTE.find((candidate) => !blocked.has(candidate)) || COUNTRY_PALETTE[hashString(id) % COUNTRY_PALETTE.length];
          colors.set(id, color);
        });
      return colors;
    }

    function collectArcIndexes(arcs, out = new Set()) {
      if (!Array.isArray(arcs)) return out;
      arcs.forEach((value) => {
        if (Array.isArray(value)) {
          collectArcIndexes(value, out);
        } else if (Number.isInteger(value)) {
          out.add(value >= 0 ? value : ~value);
        }
      });
      return out;
    }

    function hashString(value) {
      let hash = 0;
      for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
      return hash;
    }

    function applyTransform() {
      const { x, y, scale } = state.transform;
      $("#viewport").setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
      $("#mapWrap").classList.toggle("labels-on", scale >= 3.4);
      $$(".country-label").forEach((node) => {
        node.setAttribute("font-size", Math.min(6.72, Math.max(0.768, 23.04 / scale)));
      });
    }

    function clampTransformValues(transform) {
      const scale = Math.max(.9, Math.min(MAX_MAP_SCALE, transform.scale));
      const pad = 160;
      return {
        scale,
        x: wrapTranslateX(transform.x, scale),
        y: Math.max(MAP_HEIGHT - MAP_Y_MAX * scale - pad, Math.min(pad - MAP_Y_MIN * scale, transform.y))
      };
    }

    function wrapTranslateX(x, scale) {
      const width = WORLD_WIDTH * scale;
      if (!Number.isFinite(width) || width <= 0) return x;
      let wrapped = ((x % width) + width) % width;
      if (wrapped > 0) wrapped -= width;
      return wrapped;
    }

    function normalizeMapPoint(point) {
      let x = ((point.x % WORLD_WIDTH) + WORLD_WIDTH) % WORLD_WIDTH;
      if (x === WORLD_WIDTH) x = 0;
      return { x, y: point.y };
    }

    function screenToMap(event) {
      const svg = $("#mapSvg");
      const pt = svg.createSVGPoint();
      pt.x = event.clientX;
      pt.y = event.clientY;
      const raw = pt.matrixTransform(svg.getScreenCTM().inverse());
      return normalizeMapPoint({
        x: (raw.x - state.transform.x) / state.transform.scale,
        y: (raw.y - state.transform.y) / state.transform.scale
      });
    }

    function clientToSvg(clientX, clientY) {
      const svg = $("#mapSvg");
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const raw = pt.matrixTransform(svg.getScreenCTM().inverse());
      return { x: raw.x, y: raw.y };
    }

    function resetMapView() {
      state.transform = { x: 0, y: 0, scale: 1 };
      applyTransform();
    }

    function clampTransform() {
      state.transform = clampTransformValues(state.transform);
    }

    function animateTransformTo(target, duration = 500) {
      const start = { ...state.transform };
      const end = clampTransformValues(target);
      const startedAt = performance.now();
      return new Promise((resolve) => {
        function step() {
          const now = performance.now();
          const raw = Math.min(1, (now - startedAt) / duration);
          const eased = 1 - Math.pow(1 - raw, 3);
          state.transform = {
            x: start.x + (end.x - start.x) * eased,
            y: start.y + (end.y - start.y) * eased,
            scale: start.scale + (end.scale - start.scale) * eased
          };
          applyTransform();
          if (raw < 1) {
            setTimeout(step, 16);
          } else {
            state.transform = end;
            applyTransform();
            resolve();
          }
        }
        step();
      });
    }

    function focusMapOn(point, duration = 500) {
      const targetScale = Math.max(state.transform.scale, 4.8);
      const scale = Math.min(6, targetScale);
      const wrappedPoint = nearestWrappedPoint(point, scale);
      return animateTransformTo({
        scale,
        x: MAP_WIDTH / 2 - wrappedPoint.x * scale,
        y: MAP_HEIGHT / 2 - wrappedPoint.y * scale
      }, duration);
    }

    function nearestWrappedPoint(point, scale) {
      const candidates = WORLD_COPIES.map((offset) => ({ x: point.x + offset, y: point.y }));
      let best = candidates[0];
      let bestDistance = Infinity;
      candidates.forEach((candidate) => {
        const targetX = MAP_WIDTH / 2 - candidate.x * scale;
        const distance = Math.abs(targetX - state.transform.x);
        if (distance < bestDistance) {
          best = candidate;
          bestDistance = distance;
        }
      });
      return best;
    }

    function zoomAt(clientX, clientY, factor) {
      const svg = $("#mapSvg");
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const raw = pt.matrixTransform(svg.getScreenCTM().inverse());
      const before = {
        x: (raw.x - state.transform.x) / state.transform.scale,
        y: (raw.y - state.transform.y) / state.transform.scale
      };
      state.transform.scale *= factor;
      clampTransform();
      state.transform.x = raw.x - before.x * state.transform.scale;
      state.transform.y = raw.y - before.y * state.transform.scale;
      clampTransform();
      applyTransform();
    }

    function attachMapControls() {
      const wrap = $("#mapWrap");
      wrap.addEventListener("wheel", (event) => {
        event.preventDefault();
        zoomAt(event.clientX, event.clientY, event.deltaY < 0 ? 1.12 : .88);
      }, { passive: false });

      wrap.addEventListener("pointerdown", (event) => {
        wrap.setPointerCapture(event.pointerId);
        state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (state.pointers.size > 1) {
          state.multiTouchActive = true;
          state.lastGestureMoved = true;
          state.suppressTapUntil = performance.now() + 420;
        } else {
          const start = clientToSvg(event.clientX, event.clientY);
          state.dragStart = { x: start.x, y: start.y, tx: state.transform.x, ty: state.transform.y, moved: false };
        }
      });

      wrap.addEventListener("pointermove", (event) => {
        if (!state.pointers.has(event.pointerId)) return;
        const previous = state.pointers.get(event.pointerId);
        state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const points = [...state.pointers.values()];
        if (points.length > 1) {
          state.multiTouchActive = true;
          state.lastGestureMoved = true;
          state.suppressTapUntil = performance.now() + 420;
        }
        if (points.length === 1 && state.dragStart) {
          const current = clientToSvg(event.clientX, event.clientY);
          const dx = current.x - state.dragStart.x;
          const dy = (current.y - state.dragStart.y) * dragYGain();
          if (Math.hypot(dx, dy) > 5) {
            state.dragStart.moved = true;
            state.lastGestureMoved = true;
          }
          state.transform.x = state.dragStart.tx + dx;
          state.transform.y = state.dragStart.ty + dy;
          clampTransform();
          applyTransform();
        } else if (points.length === 2 && previous) {
          const [a, b] = points;
          const centerX = (a.x + b.x) / 2;
          const centerY = (a.y + b.y) / 2;
          const oldOther = points.find((p) => p !== state.pointers.get(event.pointerId)) || a;
          const oldDistance = Math.hypot(previous.x - oldOther.x, previous.y - oldOther.y);
          const newDistance = Math.hypot(a.x - b.x, a.y - b.y);
          if (oldDistance > 0) zoomAt(centerX, centerY, Math.max(.85, Math.min(1.18, newDistance / oldDistance)));
        }
      });

      wrap.addEventListener("pointerup", handlePointerEnd);
      wrap.addEventListener("pointercancel", handlePointerEnd);
      wrap.addEventListener("pointerleave", handlePointerEnd);
    }

    function dragYGain() {
      return window.matchMedia("(pointer: coarse), (max-width: 620px)").matches ? MOBILE_DRAG_Y_GAIN : 1;
    }

    function handlePointerEnd(event) {
      const wasMultiTouch = state.multiTouchActive || state.pointers.size > 1 || performance.now() < state.suppressTapUntil;
      if (event.type === "pointerup" && state.playing && !state.lastGestureMoved && !wasMultiTouch) {
        handleMapTap(event);
      }
      state.pointers.delete(event.pointerId);
      if (wasMultiTouch && state.pointers.size === 1) {
        const remaining = [...state.pointers.values()][0];
        const point = clientToSvg(remaining.x, remaining.y);
        state.dragStart = {
          x: point.x,
          y: point.y,
          tx: state.transform.x,
          ty: state.transform.y,
          moved: true
        };
        state.lastGestureMoved = true;
        state.suppressTapUntil = performance.now() + 420;
      }
      setTimeout(() => {
        if (state.pointers.size === 0) {
          state.dragStart = null;
          state.lastGestureMoved = false;
          state.multiTouchActive = false;
        }
      }, 80);
    }

    function handleMapTap(event) {
      if (state.revealingAnswer) return;
      playClickSound();
      if (state.mode === "COUNTRY") {
        const tappedElement = document.elementFromPoint(event.clientX, event.clientY);
        const countryNode = tappedElement && tappedElement.closest ? tappedElement.closest(".country") : null;
        handleCountryGuess(countryNode ? countryNode.dataset.countryId : null, screenToMap(event));
      } else {
        handleCityGuess(event);
      }
    }

    function showToast(message, kind) {
      const toast = $("#toast");
      toast.textContent = message;
      toast.className = `toast ${kind} show`;
      clearTimeout(showToast.timeout);
      showToast.timeout = setTimeout(() => toast.classList.remove("show"), 520);
    }

    function setMapMode(mode) {
      const wrap = $("#mapWrap");
      wrap.classList.toggle("country-mode", mode === "COUNTRY");
      wrap.classList.toggle("city-mode", mode === "CITY");
    }

    function startGame(mode) {
      mode = "COUNTRY";
      state.mode = mode;
      setMapMode(mode);
      state.playing = true;
      state.score = 0;
      state.correctCount = 0;
      state.combo = 0;
      state.attempts = 0;
      state.gameLeft = 60;
      state.questionLeft = 10;
      state.misses = [];
      state.revealingAnswer = false;
      state.saved = false;
      state.resultEntry = null;
      state.resultRankRows = null;
      state.savePromise = null;
      state.pool = shuffle(mode === "COUNTRY" ? PLAYABLE_COUNTRIES : CITY_DATA);
      clearInterval(state.timerId);
      clearReview();
      resetMapView();
      $("#app").classList.add("in-game");
      $("#homeScreen").classList.remove("active");
      $("#resultScreen").classList.remove("active");
      $("#hud").classList.add("active");
      $("#langToggle").disabled = true;
      $("#mapWrap").classList.remove("urgent");
      startBgm();
      trackEvent("game_start");
      nextQuestion();
      updateHud();
      state.timerId = setInterval(tick, 1000);
    }

    function tick() {
      if (!state.playing) return;
      state.gameLeft -= 1;
      state.questionLeft -= 1;
      if (state.questionLeft <= 3) $("#mapWrap").classList.add("urgent");
      if (!state.revealingAnswer && state.questionLeft <= 0) {
        resolveGuess({ ok: false, points: 0, distanceKm: Infinity, missReason: "timeout" });
      }
      if (state.gameLeft <= 0) finishGame();
      updateHud();
    }

    function nextQuestion() {
      $("#mapWrap").classList.remove("urgent");
      state.revealingAnswer = false;
      clearCountryFeedback();
      if (state.pool.length === 0) state.pool = shuffle(state.mode === "COUNTRY" ? PLAYABLE_COUNTRIES : CITY_DATA);
      state.current = state.pool.pop();
      state.questionLeft = 10;
      $("#targetName").textContent = localName(state.current);
      updateHud();
    }

    function handleCountryGuess(countryId, mapPoint) {
      if (!state.current) return;
      const exact = countryId === state.current.id;
      const distanceKm = exact ? 0 : distanceToCountryKm(mapPoint, state.current.id);
      const toleranceKm = state.countryHitTolerances.get(state.current.id) || 0;
      const ok = exact || distanceKm <= toleranceKm;
      if (ok) {
        flashCountry(state.current.id, "hit");
      } else {
        flashCountry(countryId, "miss");
      }
      const points = pointsForDistance(distanceKm, ok);
      resolveGuess({ ok, points, distanceKm, missReason: ok ? null : "wrong" });
    }

    function handleCityGuess(event) {
      if (!state.current) return;
      const mapPoint = screenToMap(event);
      const lngLat = unproject(mapPoint.x, mapPoint.y);
      const distance = haversineKm({ lat: lngLat.lat, lng: lngLat.lng }, state.current);
      const toleranceKm = Math.max(450 / state.transform.scale, 80);
      const ok = distance <= toleranceKm;
      addTemporaryPin(mapPoint, ok);
      resolveGuess({ ok, points: ok ? 4 : 0, distanceKm: ok ? 0 : distance, missReason: ok ? null : "wrong" });
    }

    function resolveGuess(result) {
      state.attempts += 1;
      state.score += result.points;
      if (result.ok) {
        state.correctCount += 1;
        state.combo += 1;
        playCorrectSound(state.combo);
        showToast(t("correct"), "good");
        setTimeout(() => state.playing && nextQuestion(), 360);
      } else {
        handleMiss(result);
      }
      updateHud();
    }

    function handleMiss(result) {
      if (!state.playing || state.revealingAnswer) return;
      state.revealingAnswer = true;
      state.combo = 0;
      recordMiss(result.missReason, result.points, result.distanceKm);
      const message = result.missReason === "timeout"
        ? t("timeout")
        : result.points > 0
          ? t("partial").replace("{points}", result.points).replace("{distance}", Math.round(result.distanceKm))
          : t("wrong");
      if (result.missReason === "timeout") {
        playTimeoutSound();
      } else if (result.points > 0) {
        playPartialSound(result.points);
      } else {
        playWrongSound();
      }
      showToast(message, result.points > 0 ? "good" : "bad");
      updateHud();
      const point = getCountryPoint(state.current);
      focusMapOn(point, 500).then(() => {
        if (!state.playing || !state.revealingAnswer) return;
        showCorrectAnswer(point);
      });
      setTimeout(() => state.playing && nextQuestion(), 1800);
    }

    function recordMiss(reason, points = 0, distanceKm = Infinity) {
      if (!state.current) return;
      state.misses.push({ ...state.current, reason, points, distanceKm, mode: state.mode });
    }

    function finishGame() {
      if (!state.playing) return;
      state.playing = false;
      clearInterval(state.timerId);
      stopBgm();
      playFinishSound();
      $("#hud").classList.remove("active");
      $("#langToggle").disabled = false;
      $("#mapWrap").classList.remove("urgent");
      $("#app").classList.remove("in-game");
      setMapMode(state.mode);
      $("#resultScreen").classList.add("active");
      $("#finalScore").textContent = state.score;
      $("#finalAccuracy").textContent = `${accuracyPercent()}%`;
      $("#finalQuestions").textContent = state.attempts;
      state.resultEntry = {
        id: "current-result",
        game_mode: "COUNTRY",
        nickname: t("myResult"),
        score: state.score,
        accuracy: accuracyPercent(),
        attempts: state.attempts,
        created_at: Date.now(),
        locale: state.locale,
        isCurrent: true
      };
      renderResultReel();
      $("#reviewText").textContent = state.misses.length ? t("reviewSome") : t("reviewNone");
      $("#nicknameInput").value = "";
      renderReview();
      trackEvent("game_finish", {
        score: state.score,
        accuracy: accuracyPercent(),
        attempts: state.attempts
      });
      autoSaveScore();
    }

    function updateHud() {
      $("#gameTime").textContent = Math.max(0, state.gameLeft);
      $("#questionTime").textContent = Math.max(0, state.questionLeft);
      $("#liveScore").textContent = state.score;
    }

    function flashCountry(id, className, duration = 430) {
      const nodes = $$(`[data-country-id="${id}"]`);
      if (!nodes.length) return;
      nodes.forEach((node) => node.classList.add(className));
      setTimeout(() => nodes.forEach((node) => node.classList.remove(className)), duration);
    }

    function clearCountryFeedback() {
      $$(".country").forEach((node) => node.classList.remove("hit", "miss", "correct-answer"));
      $$(".temp-pin, .temp-answer").forEach((node) => node.remove());
    }

    function getCountryPoint(country) {
      if (country && Number.isFinite(country.lng) && Number.isFinite(country.lat)) {
        return project(country.lng, country.lat);
      }
      const centroid = state.countryCentroids.get(country.id) || [500, 250];
      return { x: centroid[0], y: centroid[1] };
    }

    function showCorrectAnswer(pointOverride) {
      if (!state.current || state.mode !== "COUNTRY") return;
      flashCountry(state.current.id, "correct-answer", 1250);
      const point = pointOverride || getCountryPoint(state.current);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "answer-name temp-answer");
      label.dataset.countryId = state.current.id;
      label.setAttribute("x", point.x);
      label.setAttribute("y", point.y - 14 / state.transform.scale);
      label.setAttribute("font-size", Math.max(5, 24 / state.transform.scale));
      label.textContent = localName(state.current);
      $("#reviewLayer").appendChild(label);
    }

    function addTemporaryPin(point, ok) {
      const pin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pin.setAttribute("class", "review-marker temp-pin");
      pin.setAttribute("cx", point.x);
      pin.setAttribute("cy", point.y);
      pin.setAttribute("r", ok ? 9 : 7);
      pin.style.fill = ok ? "var(--accent)" : "var(--danger)";
      $("#reviewLayer").appendChild(pin);
      setTimeout(() => pin.remove(), 520);
    }

    function clearReview() {
      $("#reviewLayer").innerHTML = "";
    }

    function renderReview() {
      clearReview();
      state.misses.forEach((item, index) => {
        let point;
        if (item.mode === "COUNTRY") {
          point = getCountryPoint(item);
        } else {
          point = project(item.lng, item.lat);
        }
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        marker.setAttribute("class", "review-marker");
        marker.setAttribute("cx", point.x);
        marker.setAttribute("cy", point.y);
        marker.setAttribute("r", 8);
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("class", "review-label");
        label.setAttribute("x", point.x + 12);
        label.setAttribute("y", point.y + 4 + index % 3 * 13);
        label.textContent = localName(item);
        $("#reviewLayer").append(marker, label);
      });
    }

    function currentScoreEntry(nickname) {
      return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        game_mode: state.mode,
        nickname,
        score: state.score,
        accuracy: accuracyPercent(),
        attempts: state.attempts,
        created_at: Date.now(),
        locale: state.locale
      };
    }

    async function autoSaveScore(nickname = t("anonymous")) {
      if (state.saved) return state.resultEntry;
      if (state.savePromise) return state.savePromise;
      const entry = currentScoreEntry(nickname);
      state.saved = true;
      state.resultEntry = { ...entry, isCurrent: true };
      renderResultReel();

      state.savePromise = persistNewScore(entry).finally(() => {
        state.savePromise = null;
      });
      return state.savePromise;
    }

    async function persistNewScore(entry) {
      if (API_BASE) {
        try {
          const savedEntry = await postScore(entry);
          state.resultEntry = { ...savedEntry, isCurrent: true };
          await loadRemoteRank(savedEntry.id);
          await refreshRemoteLeaderboard();
          renderLeaderboard();
          renderResultReel();
          trackEvent("score_auto_saved", {
            score: savedEntry.score,
            accuracy: savedEntry.accuracy,
            attempts: savedEntry.attempts
          });
          return state.resultEntry;
        } catch (error) {
          console.warn("Remote score save failed. Falling back to local scores.", error);
        }
      }

      const records = loadScores();
      records.push(entry);
      const trimmedRecords = records.sort(compareScoreRows).slice(0, MAX_RANK_ROWS);
      localStorage.setItem("wpr_scores", JSON.stringify(trimmedRecords));
      renderLeaderboard();
      renderResultReel();
      trackEvent("score_auto_saved_local", {
        score: entry.score,
        accuracy: entry.accuracy,
        attempts: entry.attempts
      });
      return state.resultEntry;
    }

    async function saveScore(name) {
      const nickname = (name || "").trim().slice(0, 10) || t("anonymous");
      if (!state.saved) {
        await autoSaveScore(nickname);
        return;
      }
      if (state.savePromise) await state.savePromise;
      if (!state.resultEntry || state.resultEntry.nickname === nickname) return;

      if (API_BASE) {
        try {
          const updatedEntry = await updateScoreNickname(state.resultEntry.id, nickname);
          state.resultEntry = { ...updatedEntry, isCurrent: true };
          await loadRemoteRank(updatedEntry.id);
          await refreshRemoteLeaderboard();
          renderLeaderboard();
          renderResultReel();
          trackEvent("score_nickname_updated");
          return;
        } catch (error) {
          console.warn("Remote score save failed. Falling back to local scores.", error);
        }
      }

      updateLocalNickname(state.resultEntry.id, nickname);
      state.resultEntry = { ...state.resultEntry, nickname };
      renderLeaderboard();
      renderResultReel();
      trackEvent("score_nickname_updated_local");
    }

    async function apiJson(path, options) {
      const response = await fetch(`${API_BASE}${path}`, options || {});
      if (!response.ok) throw new Error(`API ${response.status}`);
      return response.json();
    }

    async function postScore(entry) {
      return apiJson("/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: entry.nickname,
          score: entry.score,
          accuracy: entry.accuracy,
          attempts: entry.attempts,
          locale: entry.locale,
          device_type: deviceType(),
          browser: browserName(),
          game_mode: "COUNTRY"
        })
      });
    }

    async function updateScoreNickname(id, nickname) {
      return apiJson("/scores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nickname })
      });
    }

    function updateLocalNickname(id, nickname) {
      const records = loadScores();
      const nextRecords = records.map((row) => row.id === id ? { ...row, nickname } : row);
      localStorage.setItem("wpr_scores", JSON.stringify(nextRecords));
    }

    async function refreshRemoteLeaderboard(limit = state.leaderboardLimit) {
      if (!API_BASE) return;
      state.leaderboardLoading = true;
      try {
        const data = await apiJson(`/leaderboard?period=monthly&limit=${limit}`);
        state.remoteScores = Array.isArray(data.rows) ? data.rows : [];
      } catch (error) {
        console.warn("Remote leaderboard failed.", error);
      } finally {
        state.leaderboardLoading = false;
      }
    }

    async function loadRemoteRank(id) {
      if (!API_BASE || !id) return;
      try {
        const data = await apiJson(`/rank?id=${encodeURIComponent(id)}&period=monthly`);
        state.resultRankRows = Array.isArray(data.rows) ? data.rows : null;
      } catch (error) {
        console.warn("Remote rank failed.", error);
      }
    }

    function loadScores() {
      try {
        return JSON.parse(localStorage.getItem("wpr_scores") || "[]");
      } catch {
        return [];
      }
    }

    function periodStart(period) {
      const now = new Date();
      if (period === "weekly") {
        const start = new Date(now);
        start.setHours(0,0,0,0);
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        return start.getTime();
      }
      if (period === "monthly") return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return new Date(now.getFullYear(), 0, 1).getTime();
    }

    function compareScoreRows(a, b) {
      return b.score - a.score || (b.accuracy || 0) - (a.accuracy || 0) || a.created_at - b.created_at;
    }

    function monthlyCountryScores() {
      if (state.remoteScores.length) return state.remoteScores;
      return loadScores()
        .filter((row) => row.game_mode === "COUNTRY" && row.created_at >= periodStart("monthly"));
    }

    function renderLeaderboard() {
      state.mode = "COUNTRY";
      state.period = "monthly";
      const allRows = monthlyCountryScores().sort(compareScoreRows);
      const rows = allRows.slice(0, state.leaderboardLimit);
      const body = $("#leaderRows");
      const moreButton = $("#rankMoreBtn");
      body.innerHTML = "";
      if (state.leaderboardLoading) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="4">${t("loadingBoard")}</td>`;
        body.appendChild(tr);
        if (moreButton) moreButton.hidden = true;
        return;
      }
      if (!rows.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="4">${t("emptyBoard")}</td>`;
        body.appendChild(tr);
        if (moreButton) moreButton.hidden = true;
        return;
      }
      if (moreButton) {
        moreButton.hidden = state.leaderboardLimit >= HOME_RANK_EXPANDED_LIMIT || allRows.length < HOME_RANK_LIMIT;
        moreButton.disabled = false;
      }
      rows.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${index + 1}</td><td>${escapeHtml(row.nickname)}</td><td>${row.score}</td><td>${row.accuracy || 0}%</td>`;
        body.appendChild(tr);
      });
    }

    function formatRank(rank) {
      if (state.locale === "ko") return `${rank}${t("rankSuffix")}`;
      return `#${rank}`;
    }

    function resultRankRows() {
      if (!state.resultEntry) return [];
      if (state.resultRankRows && state.resultRankRows.length) return state.resultRankRows;
      const currentId = state.resultEntry.id;
      return monthlyCountryScores()
        .filter((row) => row.id !== currentId)
        .concat(state.resultEntry)
        .sort(compareScoreRows);
    }

    function renderResultReel() {
      const reel = $("#rankReel");
      if (!reel) return;
      if (!state.resultEntry) {
        reel.innerHTML = "";
        return;
      }
      const rows = resultRankRows();
      const currentIndex = Math.max(0, rows.findIndex((row) => row.id === state.resultEntry.id));
      const start = Math.max(0, Math.min(currentIndex - 2, rows.length - 5));
      const visible = rows.slice(start, start + 5);
      const currentRow = rows[currentIndex] || state.resultEntry;
      const currentRank = currentRow.rank || currentIndex + 1;
      const rankText = state.locale === "ko"
        ? `${t("myRank")} ${formatRank(currentRank)}`
        : `${t("myRank")} ${formatRank(currentRank)}`;
      reel.innerHTML = `<div class="rank-reel-title">${rankText}</div>`;
      visible.forEach((row, index) => {
        const rank = row.rank || start + index + 1;
        const div = document.createElement("div");
        div.className = row.id === state.resultEntry.id ? "rank-row is-me" : "rank-row";
        div.style.animationDelay = `${index * 70}ms`;
        div.innerHTML = `
          <span class="rank-no">${formatRank(rank)}</span>
          <span class="rank-name">${escapeHtml(row.nickname || t("anonymous"))}</span>
          <strong>${row.score}</strong>
          <span class="rank-accuracy">${row.accuracy || 0}%</span>
        `;
        reel.appendChild(div);
      });
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      }[char]));
    }

    function shareResult() {
      trackEvent("share_result", {
        score: state.score,
        accuracy: accuracyPercent()
      });
      const url = "https://maps.zzim.site";
      const text = state.locale === "ko"
        ? `점수: ${state.score}점\n정답률: ${accuracyPercent()}%\n\n${url}`
        : `Score: ${state.score}\nAccuracy: ${accuracyPercent()}%\n\n${url}`;
      if (navigator.share) {
        navigator.share({ title: t("appName"), text }).catch(() => {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
      showToast(state.locale === "ko" ? "공유 문구 복사됨" : "Share text copied", "good");
    }

    function shuffle(items) {
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    function bindUi() {
      document.addEventListener("click", (event) => {
        const button = event.target && event.target.closest ? event.target.closest("button") : null;
        if (!button || button.disabled) return;
        if (button.classList.contains("mode")) {
          playStartSound();
          return;
        }
        playUiClickSound();
      }, true);

      $("#langToggle").addEventListener("click", () => {
        if (state.playing) return;
        state.locale = state.locale === "ko" ? "en" : "ko";
        localStorage.setItem("wpr_locale_v2", state.locale);
        localStorage.setItem("wpr_locale_manual_v2", "1");
        renderI18n();
        renderReview();
      });

      $$(".mode:not([hidden])").forEach((button) => {
        button.addEventListener("click", () => startGame(button.dataset.mode));
      });

      $("#saveScoreBtn").addEventListener("click", async () => {
        await saveScore($("#nicknameInput").value);
        $("#homeScreen").classList.add("active");
        $("#resultScreen").classList.remove("active");
        setMapMode(null);
      });

      $("#skipScoreBtn").addEventListener("click", async () => {
        await saveScore("");
        $("#homeScreen").classList.add("active");
        $("#resultScreen").classList.remove("active");
        setMapMode(null);
      });

      $("#retryBtn").addEventListener("click", async () => {
        await saveScore($("#nicknameInput").value);
        startGame(state.mode);
      });

      $("#shareBtn").addEventListener("click", shareResult);

      $("#rankMoreBtn").addEventListener("click", async () => {
        state.leaderboardLimit = HOME_RANK_EXPANDED_LIMIT;
        $("#rankMoreBtn").disabled = true;
        trackEvent("leaderboard_expand", {
          limit: HOME_RANK_EXPANDED_LIMIT
        });
        await refreshRemoteLeaderboard(HOME_RANK_EXPANDED_LIMIT);
        renderLeaderboard();
      });

      $("#finishNowBtn").addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });

      $("#finishNowBtn").addEventListener("pointerup", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });

      $("#finishNowBtn").addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!state.playing) return;
        trackEvent("finish_now", {
          score: state.score,
          attempts: state.attempts
        });
        finishGame();
      });

      $("#homeBtn").addEventListener("click", async () => {
        await saveScore($("#nicknameInput").value);
        $("#resultScreen").classList.remove("active");
        $("#homeScreen").classList.add("active");
        setMapMode(null);
      });
    }

    async function init() {
      attachMapControls();
      bindUi();
      renderI18n();
      setMapMode(null);
      await refreshRemoteLeaderboard();
      renderLeaderboard();
      try {
        await renderMap();
      } catch (error) {
        console.error(error);
        showToast("Map load failed", "bad");
      }
    }

    init();

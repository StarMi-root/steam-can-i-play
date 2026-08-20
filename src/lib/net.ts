/**
 * 联网层：访问 Steam 官方商店 API + 硬件性能查询。
 *
 * 解决「代理不可用」：不再依赖单一代理，而是同时竞速多个公共 CORS 代理，
 * 谁先成功用谁，并记住上次可用的代理下次优先；全部失败时抛 NetError 由 UI 降级。
 * 硬件查分则「在线数据源优先，失败自动回退本地模糊匹配/型号解析」。
 */

import { EstimateResult, estimateScoreByName } from "../data/hardware";

/* ---------------- CORS 代理竞速 ---------------- */

interface ProxyDef {
  id: string;
  wrap: (u: string) => string;
  /** 部分代理把正文包在 JSON 字段里 */
  unwrap?: (json: any) => any;
}

const enc = encodeURIComponent;

const PROXIES: ProxyDef[] = [
  { id: "allorigins", wrap: (u) => `https://api.allorigins.win/raw?url=${enc(u)}` },
  { id: "corsproxy.io", wrap: (u) => `https://corsproxy.io/?url=${enc(u)}` },
  { id: "codetabs", wrap: (u) => `https://api.codetabs.com/v1/proxy?quest=${enc(u)}` },
  { id: "cors.lol", wrap: (u) => `https://api.cors.lol/?url=${enc(u)}` },
  { id: "corsproxy.yt", wrap: (u) => `https://proxy.corsproxy.yt/?url=${enc(u)}` },
  { id: "cors.eu.org", wrap: (u) => `https://cors.eu.org/${u}` },
  { id: "yacdn", wrap: (u) => `https://yacdn.org/proxy/${u}` },
  { id: "vlaha", wrap: (u) => `https://api.vlaha.io/proxy?url=${enc(u)}` },
  { id: "bridged", wrap: (u) => `https://cors.bridged.cc/${u}` },
  {
    id: "allorigins.get",
    wrap: (u) => `https://api.allorigins.win/get?url=${enc(u)}`,
    unwrap: (j) => (typeof j?.contents === "string" ? JSON.parse(j.contents) : j),
  },
];

const GOOD_KEY = "cip.lastGoodProxy.v1";

export class NetError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "NetError";
  }
}

function remember(id: string) {
  try { localStorage.setItem(GOOD_KEY, id); } catch { /* ignore */ }
}
function orderedProxies(): ProxyDef[] {
  let good: string | null = null;
  try { good = localStorage.getItem(GOOD_KEY); } catch { /* ignore */ }
  const g = PROXIES.find((p) => p.id === good);
  return g ? [g, ...PROXIES.filter((p) => p.id !== good)] : PROXIES;
}

async function tryOne(
  def: ProxyDef, url: string, timeoutMs: number, outer: AbortSignal
): Promise<any> {
  const ctrl = new AbortController();
  const onOuterAbort = () => ctrl.abort();
  outer.addEventListener("abort", onOuterAbort);
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(def.wrap(url), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let json = JSON.parse(await res.text());
    if (def.unwrap) json = def.unwrap(json);
    return json;
  } finally {
    window.clearTimeout(t);
    outer.removeEventListener("abort", onOuterAbort);
  }
}

/**
 * 竞速所有代理拉取 JSON。任一成功即返回，其余被中止。
 */
export async function fetchViaProxy(url: string, timeoutMs = 9000): Promise<any> {
  const defs = orderedProxies();
  const ctrl = new AbortController();
  const attempts = defs.map((def, i) =>
    tryOne(def, url, timeoutMs, ctrl.signal).then((json) => ({ json, i }))
  );
  const winner = await new Promise<{ json: any; i: number }>((resolve, reject) => {
    let failed = 0;
    attempts.forEach((p, i) => {
      p.then((r) => resolve(r)).catch(() => {
        failed += 1;
        if (failed === attempts.length) reject(new Error("all proxies failed"));
      });
    });
  }).catch(() => null);

  ctrl.abort(); // 中止仍在飞行的其余请求
  if (!winner) {
    throw new NetError("所有网络通道暂时不可用（代理被墙或 Steam 限流），已保存进度，请稍后重试");
  }
  remember(defs[winner.i].id); // 记住本次可用的代理，下次优先
  return winner.json;
}

/** 快速探测联网通道是否可用（用于界面状态指示） */
export async function probeNetwork(timeoutMs = 6000): Promise<boolean> {
  try {
    await fetchViaProxy(
      `https://store.steampowered.com/api/getfeatured/?l=schinese&cc=cn`,
      timeoutMs
    );
    return true;
  } catch {
    return false;
  }
}

/* ---------------- Steam 商店 API ---------------- */

export interface SteamSearchHit { id: number; name: string }

/** 按名称搜索 Steam 游戏（官方 storesearch 接口） */
export async function searchSteamGames(term: string): Promise<SteamSearchHit[]> {
  const url = `https://store.steampowered.com/api/storesearch/?term=${enc(term)}&l=schinese&cc=cn`;
  const data = await fetchViaProxy(url);
  const items: any[] = Array.isArray(data?.items) ? data.items : [];
  return items
    .filter((it) => typeof it?.id === "number" && typeof it?.name === "string")
    .map((it) => ({ id: it.id as number, name: it.name as string }))
    .slice(0, 40);
}

export interface SteamAppInfo {
  appId: number;
  name: string;
  isFree: boolean;
  year: number | null;
  platforms: { windows: boolean; mac: boolean; linux: boolean };
  genres: string[];
  minRequirements: string;
  recRequirements: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<\s*(br|li|p|div)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{2,}/g, "\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)
    .join("\n");
}

function parseYear(raw?: string): number | null {
  if (!raw) return null;
  const m = raw.match(/(19|20)\d{2}/);
  return m ? Number(m[0]) : null;
}

/** 获取单个应用详情（官方 appdetails 接口） */
export async function getSteamAppInfo(appId: number): Promise<SteamAppInfo> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=schinese&cc=cn`;
  const data = await fetchViaProxy(url);
  const node = data?.[String(appId)];
  if (!node?.success || !node?.data) {
    throw new NetError("Steam 未返回该应用数据，请确认输入的是游戏的 AppID");
  }
  const d = node.data;

  const grab = (field: "minimum" | "recommended"): string => {
    const pc = d.pc_requirements;
    if (pc && typeof pc === "object") {
      if (typeof pc[field] === "string") return stripHtml(pc[field]);
      if (Array.isArray(pc)) {
        const m = pc.find((x: any) => typeof x?.[field] === "string");
        if (m) return stripHtml(m[field]);
      }
    }
    return "";
  };

  return {
    appId,
    name: typeof d.name === "string" ? d.name : `App ${appId}`,
    isFree: d.is_free === true || d.price_overview?.final === 0,
    year: parseYear(d.release_date?.date),
    platforms: {
      windows: !!d.platforms?.windows,
      mac: !!d.platforms?.mac,
      linux: !!d.platforms?.linux,
    },
    genres: Array.isArray(d.genres)
      ? d.genres.map((g: any) => g?.description).filter((x: any) => typeof x === "string")
      : [],
    minRequirements: grab("minimum"),
    recRequirements: grab("recommended"),
  };
}

/* ---------------- Steam 热门榜单（一键更新游戏库） ---------------- */

export interface TopGame { id: number; name: string }

export type TopSource = "steamspy-week" | "steamspy-forever" | "steam-official";

/**
 * 拉取热门游戏榜单，支持三种数据源（官方 + 第三方任选）：
 * - steamspy-week    第三方 SteamSpy 近两周最热 Top100
 * - steamspy-forever 第三方 SteamSpy 历史最热 Top100
 * - steam-official   Steam 官方 featured categories 热销榜
 */
export async function fetchSteamTopList(source: TopSource): Promise<TopGame[]> {
  const out: TopGame[] = [];
  const seen = new Set<number>();
  const push = (rawId: unknown, name: unknown) => {
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) return;
    if (typeof name !== "string" || !name.trim()) return;
    seen.add(id);
    out.push({ id, name: name.trim() });
  };

  if (source === "steam-official") {
    const data = await fetchViaProxy(
      "https://store.steampowered.com/api/featuredcategories/?l=schinese&cc=cn",
      15000,
    );
    for (const key of ["top_sellers", "popular_new"]) {
      const items = data?.[key]?.items;
      if (Array.isArray(items)) for (const it of items) push(it?.id, it?.name);
    }
  } else {
    const ep = source === "steamspy-week" ? "top100in2weeks" : "top100forever";
    const data = await fetchViaProxy(`https://steamspy.com/api.php?request=${ep}`, 15000);
    if (data && typeof data === "object") {
      for (const v of Object.values(data) as any[]) push(v?.appid, v?.name);
    }
  }

  if (out.length === 0) {
    throw new NetError("该数据源暂时不可用（代理可能受限），请更换数据源或稍后重试");
  }
  return out.slice(0, 120);
}

/* ---------------- 第三方游戏数据源：PCGamingWiki ---------------- */

export interface PcgwHit { title: string; url: string }

/**
 * 通过 PCGamingWiki 的 MediaWiki API 搜索游戏（第三方数据源）。
 * 该接口带 origin=* 直接支持跨域，无需代理。
 */
export async function searchPcgw(query: string): Promise<PcgwHit[]> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 9000);
  try {
    const url =
      "https://www.pcgamingwiki.com/w/api.php?action=opensearch" +
      `&search=${encodeURIComponent(query)}&limit=10&namespace=0&format=json&origin=*`;
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new NetError(`PCGamingWiki 返回 HTTP ${res.status}`);
    const data = await res.json();
    const titles: unknown[] = Array.isArray(data?.[1]) ? data[1] : [];
    const urls: unknown[] = Array.isArray(data?.[3]) ? data[3] : [];
    return titles
      .map((tt, i) => ({ title: String(tt), url: String(urls[i] ?? "") }))
      .filter((h) => h.title.trim().length > 0);
  } catch (e) {
    if (e instanceof NetError) throw e;
    throw new NetError("PCGamingWiki 搜索失败，请检查网络后重试");
  } finally {
    window.clearTimeout(t);
  }
}

/* ---------------- 硬件联网查分 ---------------- */

export interface ScoreLookup extends EstimateResult {
  source: "online" | "local";
}

/** 候选在线基准数据集（raw.githubusercontent.com 自带跨域头，直连即可） */
const ONLINE_DATASETS: { url: string; kind: "cpu" | "gpu" }[] = [
  { kind: "cpu", url: "https://raw.githubusercontent.com/felixsteinke/cpu-spec-dataset/main/cpu_benchmark.csv" },
  { kind: "cpu", url: "https://raw.githubusercontent.com/felixsteinke/cpu-spec-dataset/master/cpu_benchmark.csv" },
  { kind: "gpu", url: "https://raw.githubusercontent.com/mkozden/Gpu-Performance-Analysis/main/gpu_data.json" },
  { kind: "gpu", url: "https://raw.githubusercontent.com/mkozden/Gpu-Performance-Analysis/master/gpu_data.json" },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 把外部 PassMark 分值换算成本工具的内部相对指数 */
function toInternal(pm: number, kind: "cpu" | "gpu"): number {
  if (kind === "cpu") return clamp(Math.round(46 * Math.log(pm) - 376), 10, 150);
  return clamp(Math.round(23.5 * Math.log(pm) - 117.7), 10, 130);
}

async function tryOnlineDataset(name: string, kind: "cpu" | "gpu"): Promise<number | null> {
  const want = name.toLowerCase();
  for (const ds of ONLINE_DATASETS.filter((d) => d.kind === kind)) {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(ds.url, { signal: ctrl.signal });
      if (!res.ok) continue;
      const text = await res.text();
      // 逐行找包含型号名的记录，取其中最大的数字作为基准分
      for (const line of text.split(/\r?\n/)) {
        // 跳过超长行：压缩成单行的 JSON 会整文件匹配，取分会失真
        if (line.length > 400) continue;
        if (line.toLowerCase().includes(want)) {
          const nums = line.match(/\d{3,7}/g)?.map(Number) ?? [];
          // 仅接受 PassMark 合理量级（100 ~ 200000），避免把价格/年份当成分
          const pm = nums.filter((n) => n >= 100 && n <= 200000).sort((a, b) => b - a)[0];
          if (pm) return toInternal(pm, kind);
        }
      }
    } catch {
      /* 换下一个数据源 */
    } finally {
      window.clearTimeout(t);
    }
  }
  return null;
}

/**
 * 硬件联网查分：先尝试在线基准数据集，失败自动回退本地估算。
 * 永不抛错——保证「添加硬件时自动给分」始终可用。
 */
export async function lookupHardwareScore(
  name: string, kind: "cpu" | "gpu"
): Promise<ScoreLookup> {
  const online = await tryOnlineDataset(name, kind);
  if (online != null) {
    return { score: online, method: "local-match", source: "online", note: "来自在线基准数据集（PassMark 换算）" };
  }
  const local = estimateScoreByName(name, kind);
  return { ...local, source: "local" };
}

/* ---------------- 外部查分链接（人工核对用） ---------------- */

export const hardwareLookupLinks = (name: string, kind: "cpu" | "gpu") =>
  kind === "cpu"
    ? [
        { label: "PassMark CPU", href: `https://www.cpubenchmark.net/cpu_list.php` },
        { label: "Technical City", href: `https://technical.city/en/search?q=${enc(name)}` },
      ]
    : [
        { label: "PassMark GPU", href: `https://www.videocardbenchmark.net/gpu_list.php` },
        { label: "Technical City", href: `https://technical.city/en/search?q=${enc(name)}` },
      ];

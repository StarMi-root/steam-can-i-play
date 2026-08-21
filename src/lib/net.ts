/*
 * Copyright (C) 2026 王博
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { EstimateResult, estimateScoreByName } from "../data/hardware";

export class NetError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "NetError";
  }
}

const enc = encodeURIComponent;

/* ---------------- 代理定义 --------------- */

interface ProxyDef {
  id: string;
  label: string;
  /** 该通道是否允许跨域直连（true=不用代理） */
  direct?: boolean;
  wrap: (u: string) => string;
  /** 部分代理把正文包在 JSON 字段里 */
  unwrap?: (json: any) => any;
  /** 返回的是纯文本而非 JSON（用于 HTML/文本抓取） */
  text?: boolean;
}

const CUSTOM_KEY = "cip.customProxy.v1";
const HEALTH_KEY = "cip.proxyHealth.v2";

/** 用户自定义代理（最高优先级），返回前缀字符串或 null */
export function getCustomProxy(): string | null {
  try {
    const v = localStorage.getItem(CUSTOM_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch { return null; }
}
export function setCustomProxy(prefix: string) {
  try {
    if (prefix.trim()) localStorage.setItem(CUSTOM_KEY, prefix.trim());
    else localStorage.removeItem(CUSTOM_KEY);
  } catch { /* ignore */ }
}

const BUILTIN: ProxyDef[] = [
  // —— 直连（部分接口允许 CORS）——
  { id: "direct", label: "直连（无代理）", direct: true, wrap: (u) => u },
  // —— 第三方公共 CORS 代理 ——
  { id: "allorigins", label: "AllOrigins", wrap: (u) => `https://api.allorigins.win/raw?url=${enc(u)}` },
  { id: "corsproxy.io", label: "CorsProxy.io", wrap: (u) => `https://corsproxy.io/?url=${enc(u)}` },
  { id: "codetabs", label: "CodeTabs", wrap: (u) => `https://api.codetabs.com/v1/proxy?quest=${enc(u)}` },
  { id: "cors.lol", label: "CORS.lol", wrap: (u) => `https://api.cors.lol/?url=${enc(u)}` },
  { id: "isomorphic", label: "Isomorphic Git", wrap: (u) => `https://cors.isomorphic-git.org/${u}` },
  { id: "cors.eu.org", label: "CORS.eu.org", wrap: (u) => `https://cors.eu.org/${u}` },
  { id: "yacdn", label: "YACDN", wrap: (u) => `https://yacdn.org/proxy/${u}` },
  { id: "vlaha", label: "Vlaha.io", wrap: (u) => `https://api.vlaha.io/proxy?url=${enc(u)}` },
  { id: "thingproxy", label: "ThingProxy", wrap: (u) => `https://thingproxy.freeboard.io/fetch/${u}` },
  { id: "bridged", label: "Bridged", wrap: (u) => `https://cors.bridged.cc/${u}` },
  { id: "corsproxy.yt", label: "CorsProxy.yt", wrap: (u) => `https://proxy.corsproxy.yt/?url=${enc(u)}` },
  {
    id: "allorigins.get",
    label: "AllOrigins(JSON)",
    wrap: (u) => `https://api.allorigins.win/get?url=${enc(u)}`,
    unwrap: (j) => (typeof j?.contents === "string" ? JSON.parse(j.contents) : j),
  },
];

export function listProxies(): { id: string; label: string; direct?: boolean }[] {
  return BUILTIN.map((p) => ({ id: p.id, label: p.label, direct: p.direct }));
}

/* ---------------- 通道健康记忆 ---------------- */

interface Health { ok: number; fail: number; lastOk: number }
type HealthMap = Record<string, Health>;

function loadHealth(): HealthMap {
  try {
    const raw = localStorage.getItem(HEALTH_KEY);
    if (raw) return JSON.parse(raw) as HealthMap;
  } catch { /* ignore */ }
  return {};
}
function saveHealth(map: HealthMap) {
  try { localStorage.setItem(HEALTH_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}
function record(id: string, ok: boolean) {
  const m = loadHealth();
  const h = m[id] ?? { ok: 0, fail: 0, lastOk: 0 };
  if (ok) { h.ok += 1; h.lastOk = Date.now(); } else h.fail += 1;
  m[id] = h;
  saveHealth(m);
}
/** 供 UI 展示：各代理健康度（ok 次数与最近成功时间） */
export function getProxyHealth(): Record<string, Health> {
  return loadHealth();
}

/** 按「自定义代理 → 健康度高的直连/代理 → 其余」排序 */
function orderedDefs(): ProxyDef[] {
  const health = loadHealth();
  const score = (id: string) => {
    const h = health[id];
    if (!h) return 0;
    const recency = h.lastOk ? Math.max(0, 1 - (Date.now() - h.lastOk) / 3600e3) : 0;
    return h.ok * 2 + recency * 3 - h.fail * 0.5;
  };
  const customPrefix = getCustomProxy();
  const custom: ProxyDef[] = customPrefix
    ? [{
        id: "custom",
        label: "自定义代理",
        wrap: (u) => {
          const p = customPrefix.trim();
          // 查询参数式（以 ? 或 = 结尾，如 https://xx.dev/?url=）→ 编码后拼接
          if (p.endsWith("=") || p.includes("?")) return `${p}${enc(u)}`;
          // 路径式（如 https://xx.dev/ 或 https://xx.dev/fetch）→ 斜杠拼接
          return `${p.replace(/\/+$/, "")}/${u}`;
        },
      }]
    : [];
  const sorted = [...BUILTIN].sort((a, b) => score(b.id) - score(a.id));
  return [...custom, ...sorted];
}

/* ---------------- 竞速引擎 ---------------- */

async function tryOne(
  def: ProxyDef, url: string, timeoutMs: number, outer: AbortSignal, wantText: boolean,
): Promise<any> {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  outer.addEventListener("abort", onAbort);
  const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(def.wrap(url), { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.text();
    if (!body) throw new Error("empty body");
    record(def.id, true);
    if (wantText || def.text) return body;
    let json = JSON.parse(body);
    if (def.unwrap) json = def.unwrap(json);
    return json;
  } catch (e) {
    record(def.id, false);
    throw e;
  } finally {
    window.clearTimeout(t);
    outer.removeEventListener("abort", onAbort);
  }
}

/**
 * 错峰竞速：按健康度排序后，每隔 staggerMs 依次发起一个通道的请求。
 * 任一通道成功即返回并中止其余；全部失败则抛 NetError。
 * 这样既快（健康通道排前面、成功即停），又不一次性打爆所有代理。
 */
async function raceAll(
  url: string, timeoutMs: number, wantText: boolean, staggerMs = 220,
): Promise<any> {
  const defs = orderedDefs();
  const ctrl = new AbortController();

  // 每个通道延迟 i*staggerMs 后发起，成功返回 {value,id}，失败返回 null
  const attempt = (def: ProxyDef, delay: number) =>
    new Promise<{ value: any; id: string } | null>((resolve) => {
      window.setTimeout(() => {
        if (ctrl.signal.aborted) { resolve(null); return; }
        tryOne(def, url, timeoutMs, ctrl.signal, wantText)
          .then((value) => resolve({ value, id: def.id }))
          .catch(() => resolve(null));
      }, delay);
    });

  const promises = defs.map((def, i) => attempt(def, i * staggerMs));

  const winner = await new Promise<{ value: any; id: string } | null>((resolve) => {
    let pending = promises.length;
    let settled = false;
    promises.forEach((p) => {
      p.then((r) => {
        if (settled) return;
        if (r) { settled = true; resolve(r); }
        else {
          pending -= 1;
          if (pending === 0) resolve(null);
        }
      });
    });
  });

  ctrl.abort(); // 中止仍在飞行的其余请求
  if (!winner) {
    throw new NetError(
      "所有网络通道暂时不可用（代理被墙 / Steam 限流 / 网络受限）。可尝试：① 打开「网络设置」填写自定义代理；② 点页头指示灯重新探测；③ 稍后重试。离线游戏库仍可正常使用。",
    );
  }
  return winner.value;
}

/** 竞速所有通道拉取并解析 JSON */
export async function fetchViaProxy(url: string, timeoutMs = 9000): Promise<any> {
  return raceAll(url, timeoutMs, false);
}
/** 竞速所有通道拉取纯文本（HTML / 文本抓取） */
export async function fetchTextViaProxy(url: string, timeoutMs = 9000): Promise<string> {
  return raceAll(url, timeoutMs, true);
}

/* ---------------- 通道探测（UI 状态指示） ---------------- */

export interface ChannelStatus {
  ok: boolean;
  /** 实际打通的通道 id（如 "direct" / "allorigins" / "custom"） */
  via?: string;
}

/**
 * 探测联网能力。返回是否可用，以及打通所用的通道。
 * 探测目标换成一个几乎必然可达、且体积小的接口，减少误报。
 */
export async function probeNetwork(timeoutMs = 6000): Promise<boolean> {
  const r = await probeNetworkDetailed(timeoutMs);
  return r.ok;
}
export async function probeNetworkDetailed(timeoutMs = 6000): Promise<ChannelStatus> {
  try {
    const json = await raceAll(
      "https://store.steampowered.com/api/getfeatured/?l=schinese&cc=cn",
      timeoutMs, false, 150,
    );
    return { ok: !!json, via: undefined };
  } catch {
    return { ok: false };
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

export type TopSource = "steamspy-week" | "steamspy-forever" | "steam-official" | "steam-browse";

export interface BrowseOpts {
  /** Steam 商店 genre 编号，空串=全部 */
  genre: string;
  /** 排序：_ASC 综合 / Reviews_DESC 评测数 / Released_DESC 发行日期 / Name_ASC 名称 */
  sort: string;
  /** 拉取页数（每页约 50 款） */
  pages: number;
}

/**
 * Steam 商店搜索分页抓取（官方搜索接口）：
 * 支持分类 + 排序 + 翻页，单次可批量获取数百款，远超 Top100 榜单。
 */
export async function fetchSteamBrowse(
  browse: BrowseOpts,
  onPage?: (page: number) => void,
): Promise<TopGame[]> {
  const out: TopGame[] = [];
  const seen = new Set<number>();
  for (let p = 1; p <= browse.pages; p++) {
    onPage?.(p);
    const url =
      "https://store.steampowered.com/search/results/?ndl=1&json=1&category1=998&cc=cn&l=schinese" +
      `&sort_by=${browse.sort}&page=${p}` +
      (browse.genre ? `&genre=${browse.genre}` : "");
    const data = await fetchViaProxy(url, 20000);
    const html: string = typeof data?.results_html === "string" ? data.results_html : "";
    if (!html) break;
    const ids = [...html.matchAll(/data-ds-appid="([\d,]+)"/g)].map((m) =>
      Number(m[1].split(",")[0]),
    );
    const names = [...html.matchAll(/<span class="title">([^<]+)<\/span>/g)].map((m) =>
      m[1].trim(),
    );
    const n = Math.min(ids.length, names.length);
    for (let i = 0; i < n; i++) {
      const id = ids[i];
      if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, name: names[i] });
    }
    if (ids.length === 0) break; // 已翻完
  }
  if (out.length === 0) {
    throw new NetError("Steam 商店搜索无结果（代理可能受限），请更换分类或稍后重试");
  }
  return out;
}

/**
 * 拉取热门游戏榜单，支持四种数据源（官方 + 第三方任选）：
 * - steamspy-week    第三方 SteamSpy 近两周最热 Top100
 * - steamspy-forever 第三方 SteamSpy 历史最热 Top100
 * - steam-official   Steam 官方 featured categories 热销榜
 * - steam-browse     Steam 官方商店搜索分页（分类 + 排序 + 翻页，数百款）
 */
export async function fetchSteamTopList(source: TopSource, browse?: BrowseOpts): Promise<TopGame[]> {
  if (source === "steam-browse") {
    return fetchSteamBrowse(browse ?? { genre: "", sort: "_ASC", pages: 4 });
  }
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

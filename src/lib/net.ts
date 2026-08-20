/**
 * 联网层：通过公共 CORS 代理访问 Steam 官方商店 API。
 * 三重代理自动回退；全部失败时抛出 NetError，由 UI 降级提示。
 */

const PROXIES: ((u: string) => string)[] = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

export class NetError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "NetError";
  }
}

export async function fetchViaProxy(url: string, timeoutMs = 10000): Promise<any> {
  let lastErr: unknown = null;
  for (const wrap of PROXIES) {
    const ctrl = new AbortController();
    const t = window.setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(wrap(url), { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return JSON.parse(await res.text());
    } catch (e) {
      lastErr = e;
    } finally {
      window.clearTimeout(t);
    }
  }
  throw new NetError("网络通道全部失败（代理可能暂时不可用），请稍后重试");
}

/* ---------- Steam 商店 API ---------- */

export interface SteamSearchHit {
  id: number;
  name: string;
}

/** 按名称搜索 Steam 游戏（官方 storesearch 接口） */
export async function searchSteamGames(term: string): Promise<SteamSearchHit[]> {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=schinese&cc=cn`;
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
    .slice(0, 10)
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

  let minReq = "";
  const pc = d.pc_requirements;
  if (pc && typeof pc === "object") {
    if (typeof pc.minimum === "string") minReq = stripHtml(pc.minimum);
    else if (Array.isArray(pc)) {
      const m = pc.find((x: any) => typeof x?.minimum === "string");
      if (m) minReq = stripHtml(m.minimum);
    }
  }

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
    minRequirements: minReq,
  };
}

/* ---------- 硬件联网查分（外部链接） ---------- */

export const hardwareLookupLinks = (name: string) => [
  { label: "Technical City", href: `https://technical.city/en/search?q=${encodeURIComponent(name)}` },
  { label: "PassMark", href: `https://www.cpubenchmark.net/cpu_list.php` },
];

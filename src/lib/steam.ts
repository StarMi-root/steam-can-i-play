/**
 * Steam 账户接入：通过用户自己的 Steam Web API 密钥调用官方接口。
 * - GetOwnedGames       游戏库（含时长）
 * - GetFriendList       好友列表
 * - GetPlayerSummaries  个人 / 好友状态
 * - ResolveVanityURL    自定义 URL → SteamID64
 * 所有请求经代理竞速通道转发（api.steampowered.com 不允许浏览器直连）。
 */
import { NetError, fetchViaProxy } from "./net";

export const STEAM_CONN_KEY = "cip.steam.v1";

export interface SteamConn {
  key: string;
  steamid: string;
  persona: string;
  avatar: string;
}

export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime: number; // 小时（分钟 / 60）
  logo: string | null;
}

export interface SteamFriend {
  steamid: string;
  persona: string;
  avatar: string;
  state: string;
  stateColor: string;
  gameName: string | null;
}

export interface SteamProfile {
  steamid: string;
  persona: string;
  avatar: string;
}

const API = "https://api.steampowered.com";

/** 从输入解析 SteamID64：支持 17 位数字、自定义 URL 或完整资料链接 */
export function parseSteamIdInput(input: string): { steamid?: string; vanity?: string } {
  const t = input.trim();
  if (/^7656\d{13}$/.test(t)) return { steamid: t };
  const m = t.match(/steamcommunity\.com\/(?:profiles\/(\d{17})|id\/([\w-]+))/i);
  if (m) return m[1] ? { steamid: m[1] } : { vanity: m[2] };
  if (/^[\w-]{3,32}$/.test(t)) return { vanity: t };
  return {};
}

export async function resolveVanityUrl(vanity: string, key: string): Promise<string> {
  const data = await fetchViaProxy(
    `${API}/ISteamUser/ResolveVanityURL/v1/?vanityurl=${encodeURIComponent(vanity)}&key=${encodeURIComponent(key)}`,
  );
  const id = data?.response?.steamid;
  if (typeof id === "string" && id.length > 0) return id;
  throw new NetError(`无法解析「${vanity}」对应的 SteamID，请确认自定义 URL 拼写`);
}

export async function fetchSteamProfile(key: string, steamid: string): Promise<SteamProfile> {
  const data = await fetchViaProxy(
    `${API}/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(key)}&steamids=${steamid}`,
  );
  const p = data?.response?.players?.[0];
  if (!p) throw new NetError("密钥无效或该 SteamID 不存在（请检查 API Key 是否为当前登录账户申请的）");
  return { steamid, persona: p.personaname ?? "Steam 玩家", avatar: p.avatarfull ?? "" };
}

export async function fetchOwnedGames(key: string, steamid: string): Promise<SteamOwnedGame[]> {
  const data = await fetchViaProxy(
    `${API}/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(key)}&steamid=${steamid}&include_appinfo=1&include_played_free_games=1`,
  );
  const list: any[] = Array.isArray(data?.response?.games) ? data.response.games : [];
  return list
    .map((g) => ({
      appid: Number(g?.appid),
      name: typeof g?.name === "string" ? g.name : `App #${g?.appid}`,
      playtime: Math.round((Number(g?.playtime_forever) || 0) / 60),
      logo: typeof g?.img_logo_url === "string" && g.img_logo_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_logo_url}.jpg`
        : null,
    }))
    .filter((g) => Number.isFinite(g.appid) && g.appid > 0)
    .sort((a, b) => b.playtime - a.playtime);
}

const STATE_MAP: Record<number, [string, string]> = {
  0: ["离线", "text-ink-500"],
  1: ["在线", "text-ok"],
  2: ["忙碌", "text-bad"],
  3: ["离开", "text-warn"],
  4: ["打盹", "text-ink-400"],
  5: ["寻找交易", "text-teal-core"],
  6: ["寻找游戏", "text-steam"],
};

export async function fetchFriends(key: string, steamid: string): Promise<SteamFriend[]> {
  const data = await fetchViaProxy(
    `${API}/ISteamUser/GetFriendList/v1/?key=${encodeURIComponent(key)}&steamid=${steamid}&relationship=friend`,
  );
  const friends: any[] = Array.isArray(data?.friendslist?.friends) ? data.friendslist.friends : [];
  if (friends.length === 0) {
    throw new NetError("好友列表为空 —— 请在 Steam 设置中把个人资料 / 好友列表设为「公开」后重试");
  }
  const ids = friends.map((f) => String(f?.steamid)).filter(Boolean);
  const sums = await fetchViaProxy(
    `${API}/ISteamUser/GetPlayerSummaries/v2/?key=${encodeURIComponent(key)}&steamids=${ids.join(",")}`,
  );
  const players: any[] = Array.isArray(sums?.response?.players) ? sums.response.players : [];
  return players
    .map((p) => {
      const st = Number(p?.personastate ?? 0);
      const [state, stateColor] = STATE_MAP[st] ?? STATE_MAP[0];
      return {
        steamid: String(p.steamid),
        persona: p.personaname ?? "好友",
        avatar: p.avatar ?? "",
        state: typeof p?.gameextrainfo === "string" && p.gameextrainfo ? `游戏中 · ${p.gameextrainfo}` : state,
        stateColor: p?.gameextrainfo ? "text-steam" : stateColor,
        gameName: p?.gameextrainfo ?? null,
      } as SteamFriend;
    })
    .sort((a, b) => Number(b.stateColor === "text-ok" || b.stateColor === "text-steam") - Number(a.stateColor === "text-ok" || a.stateColor === "text-steam"));
}

export const storeUrl = (appid: number) => `https://store.steampowered.com/app/${appid}/`;

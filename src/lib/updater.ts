/**
 * 一键更新游戏库：拉取 Steam 热门榜单 → 逐款获取详情 →
 * 解析官方最低 / 推荐配置文本 → 生成本工具可用的游戏条目。
 */
import { Game, mapSteamGenres } from "../data/games";
import { BrowseOpts, SteamAppInfo, TopSource, fetchSteamTopList, getSteamAppInfo } from "./net";
import { ParsedReq, parseRequirements } from "./reqparse";

export interface UpdateProgress {
  phase: string;
  done: number;
  total: number;
}

export interface UpdateResult {
  added: Game[];
  skipped: number;
  failed: number;
  total: number;
  already: number;
}

const CONCURRENCY = 3;

export async function updateGameLibrary(
  existingIds: Set<number>,
  source: TopSource,
  onProgress: (p: UpdateProgress) => void,
  isCancelled: () => boolean,
  browse?: BrowseOpts,
): Promise<UpdateResult> {
  const srcName =
    source === "steam-official" ? "Steam 官方热销榜"
    : source === "steam-browse" ? "Steam 商店搜索 · 分页"
    : "第三方 SteamSpy";
  onProgress({ phase: `获取游戏列表（${srcName}）`, done: 0, total: 0 });
  const top = await fetchSteamTopList(source, browse);
  const already = top.filter((g) => existingIds.has(g.id)).length;
  const fresh = top.filter((g) => !existingIds.has(g.id)).slice(0, 100);

  const added: Game[] = [];
  let skipped = 0;
  let failed = 0;
  onProgress({ phase: "拉取游戏详情并解析官方配置", done: 0, total: fresh.length });

  let idx = 0;
  const worker = async () => {
    for (;;) {
      if (isCancelled()) return;
      const cur = idx++;
      if (cur >= fresh.length) return;
      const g = fresh[cur];
      try {
        const info = await getSteamAppInfo(g.id);
        const game = toGame(info);
        if (game) added.push(game);
        else skipped += 1;
      } catch {
        failed += 1;
      }
      onProgress({
        phase: "拉取游戏详情并解析官方配置",
        done: Math.min(idx, fresh.length),
        total: fresh.length,
      });
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  return { added, skipped, failed, total: fresh.length, already };
}

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

export interface GameParse {
  game: Game;
  /** 官方最低配置解析结果（分数为 null 表示未公布 / 未解析出） */
  min: ParsedReq;
  /** 官方推荐配置解析结果 */
  rec: ParsedReq;
}

/**
 * 将 Steam 详情解析为本工具游戏条目。
 * `strict=false` 时即使官方未公布配置也返回条目（用默认估值），供「实时检测」展示；
 * `strict=true`（默认）用于批量更新，解析不出配置即跳过。
 */
export function parseGameInfo(
  info: SteamAppInfo,
  opts?: { strict?: boolean; mark?: "ext" | "custom" },
): GameParse | null {
  const strict = opts?.strict !== false;
  const mark = opts?.mark ?? "ext";
  const min = parseRequirements(info.minRequirements);
  if (strict && (!info.minRequirements || (min.cpu == null && min.gpu == null))) return null;
  const rec = parseRequirements(info.recRequirements);
  const genres = mapSteamGenres(info.genres);

  const game: Game = {
    id: info.appId,
    name: info.name,
    zh: info.name,
    year: info.year ?? new Date().getFullYear(),
    genres: genres.length > 0 ? genres : ["其他"],
    minCpu: min.cpu ?? 40,
    minGpu: min.gpu ?? 24,
    minRam: min.ram ?? 8,
    recCpu: rec.cpu ?? undefined,
    recGpu: rec.gpu ?? undefined,
    recRam: rec.ram ?? undefined,
    minNote: truncate(info.minRequirements, 220),
    recNote: info.recRequirements ? truncate(info.recRequirements, 220) : undefined,
    platforms: {
      win: info.platforms.windows,
      mac: info.platforms.mac,
      linux: info.platforms.linux,
    },
    free: info.isFree,
    ...(mark === "ext" ? { ext: true } : { custom: true }),
  };
  return { game, min, rec };
}

function toGame(info: SteamAppInfo): Game | null {
  return parseGameInfo(info)?.game ?? null;
}

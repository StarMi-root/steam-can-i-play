/**
 * 一键更新游戏库：拉取 Steam 热门榜单 → 逐款获取详情 →
 * 解析官方最低 / 推荐配置文本 → 生成本工具可用的游戏条目。
 */
import { Game, mapSteamGenres } from "../data/games";
import { SteamAppInfo, fetchSteamTopList, getSteamAppInfo } from "./net";
import { parseRequirements } from "./reqparse";

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
  onProgress: (p: UpdateProgress) => void,
  isCancelled: () => boolean,
): Promise<UpdateResult> {
  onProgress({ phase: "获取 Steam 热门游戏榜单", done: 0, total: 0 });
  const top = await fetchSteamTopList();
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

function toGame(info: SteamAppInfo): Game | null {
  const req = parseRequirements(info.minRequirements);
  // 未公布最低配置，或 CPU/GPU 均无法解析 → 无法评估，跳过
  if (!info.minRequirements || (req.cpu == null && req.gpu == null)) return null;
  const rec = parseRequirements(info.recRequirements);
  const genres = mapSteamGenres(info.genres);

  return {
    id: info.appId,
    name: info.name,
    zh: info.name,
    year: info.year ?? new Date().getFullYear(),
    genres: genres.length > 0 ? genres : ["其他"],
    minCpu: req.cpu ?? 40,
    minGpu: req.gpu ?? 24,
    minRam: req.ram ?? 8,
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
    ext: true,
  };
}

import { useEffect, useState } from "react";
import { ALL_GENRES, Game } from "../data/games";
import { CPU_TIERS, GPU_TIERS } from "../data/hardware";
import { NetError, SteamAppInfo, SteamSearchHit, getSteamAppInfo, searchSteamGames } from "../lib/net";
import { ExternalIcon, SearchIcon, SteamIcon, WarnIcon } from "./icons";

const RAM_CHOICES = [2, 4, 6, 8, 12, 16, 24, 32];

function mapGenres(steamGenres: string[]): string[] {
  const hit = ALL_GENRES.filter((g) => g !== "其他" && steamGenres.some((sg) => sg.includes(g)));
  return hit.slice(0, 3);
}

export default function AddGameModal({
  open, onClose, onAdd, existingIds,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (g: Game) => void;
  existingIds: Set<number>;
}) {
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<SteamSearchHit[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [info, setInfo] = useState<SteamAppInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const [zh, setZh] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [cpuIdx, setCpuIdx] = useState(2);
  const [gpuIdx, setGpuIdx] = useState(2);
  const [ram, setRam] = useState(8);
  const [dup, setDup] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const resetDetail = () => {
    setInfo(null); setZh(""); setGenres([]); setCpuIdx(2); setGpuIdx(2); setRam(8);
    setDup(false); setSaved(false); setImgErr(false); setErr(null);
  };

  const loadInfo = async (appId: number) => {
    setLoadingInfo(true); setErr(null); setSaved(false);
    try {
      const d = await getSteamAppInfo(appId);
      setInfo(d);
      setZh(d.name);
      setGenres(mapGenres(d.genres));
      setDup(existingIds.has(appId));
    } catch (e) {
      setErr(e instanceof NetError ? e.message : "请求失败，请检查网络后重试");
    } finally {
      setLoadingInfo(false);
    }
  };

  const doSearch = async () => {
    const t = term.trim();
    if (!t) return;
    setErr(null); setSaved(false);
    if (/^\d{2,8}$/.test(t)) { loadInfo(Number(t)); return; }
    setSearching(true);
    try {
      const list = await searchSteamGames(t);
      setHits(list);
      if (list.length === 0) setErr(`没有找到与「${t}」相关的游戏，可尝试英文名或直接输入 AppID`);
    } catch (e) {
      setErr(e instanceof NetError ? e.message : "请求失败，请检查网络后重试");
    } finally {
      setSearching(false);
    }
  };

  const save = () => {
    if (!info) return;
    const game: Game = {
      id: info.appId,
      name: info.name,
      zh: zh.trim() || info.name,
      year: info.year ?? new Date().getFullYear(),
      genres: genres.length > 0 ? genres : ["其他"],
      minCpu: CPU_TIERS[cpuIdx].score,
      minGpu: GPU_TIERS[gpuIdx].score,
      minRam: ram,
      platforms: { win: info.platforms.windows, mac: info.platforms.mac, linux: info.platforms.linux },
      free: info.isFree,
      custom: true,
    };
    onAdd(game);
    setSaved(true);
    setDup(existingIds.has(info.appId));
  };

  const busy = searching || loadingInfo;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/80 px-4 py-8 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="animate-fade-up w-full max-w-2xl rounded-md border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div>
            <div className="font-display text-[10px] font-semibold tracking-[0.28em] text-teal-core">
              ONLINE · STEAM STORE API
            </div>
            <h3 className="mt-1 text-lg font-black text-ink-100">联网添加 Steam 游戏</h3>
          </div>
          <button onClick={onClose} className="rounded-sm border border-ink-700 px-2.5 py-1 text-sm text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
            关闭
          </button>
        </div>

        <div className="px-5 py-5">
          {/* 搜索栏 */}
          <form
            onSubmit={(e) => { e.preventDefault(); doSearch(); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="输入游戏名搜索，或直接输入 AppID（商店链接中的数字）"
                className="w-full rounded-sm border border-ink-700 bg-ink-850 py-2.5 pl-9 pr-3 text-sm text-ink-100 outline-none placeholder:text-ink-600 focus:border-teal-core/60"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !term.trim()}
              className="flex items-center gap-2 rounded-sm bg-teal-core px-5 py-2.5 text-sm font-black text-ink-950 transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" style={{ animationDuration: "0.7s" }} />}
              {loadingInfo ? "查询中" : "搜索"}
            </button>
          </form>

          {err && !info && (
            <div className="mt-3 flex items-start gap-2 rounded-sm border border-warn/30 bg-warn/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-warn">
              <WarnIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {err}
            </div>
          )}

          {/* 搜索结果 */}
          {!info && !searching && hits.length > 0 && (
            <div className="mt-4 max-h-56 overflow-y-auto rounded-sm border border-ink-700">
              {hits.map((h, i) => (
                <button
                  key={h.id}
                  onClick={() => { setHits([]); setTerm(h.name); loadInfo(h.id); }}
                  className={`flex w-full items-center gap-3 border-b border-ink-800 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-ink-800 ${i < 6 ? "" : ""}`}
                >
                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${h.id}/capsule_sm_120.jpg`}
                    alt=""
                    loading="lazy"
                    className="h-8 w-20 shrink-0 rounded-[2px] object-cover"
                    onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-100">{h.name}</span>
                  <span className="font-display shrink-0 text-[10px] text-ink-500">#{h.id}</span>
                  {existingIds.has(h.id) && (
                    <span className="shrink-0 rounded-sm border border-warn/40 px-1.5 py-0.5 text-[10px] text-warn">已在库中</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {searching && (
            <div className="mt-4 flex items-center gap-3 rounded-sm border border-ink-700 bg-ink-850 px-4 py-6 text-sm text-ink-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-600 border-t-teal-core" style={{ animationDuration: "0.7s" }} />
              正在通过公共代理请求 Steam 商店…（首次可能需要几秒）
            </div>
          )}

          {/* 详情 + 配置表单 */}
          {info && (
            <div className="mt-5 animate-fade-up">
              <div className="flex gap-4 overflow-hidden rounded-sm border border-ink-700 bg-ink-850">
                {!imgErr ? (
                  <img
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${info.appId}/capsule_231x87.jpg`}
                    alt={info.name}
                    className="h-[86px] w-[231px] shrink-0 object-cover max-sm:hidden"
                    onError={() => setImgErr(true)}
                  />
                ) : null}
                <div className="min-w-0 flex-1 py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-base font-black text-ink-100">{info.name}</h4>
                    <span className={`shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${info.isFree ? "border-ok/40 bg-ok/10 text-ok" : "border-ink-600 text-ink-300"}`}>
                      {info.isFree ? "免费" : "付费"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-ink-400">
                    <span className="font-display">AppID {info.appId}</span>
                    {info.year && <span>· {info.year} 年</span>}
                    <span>· {info.platforms.windows ? "Windows" : ""}{info.platforms.mac ? " / macOS" : ""}{info.platforms.linux ? " / Linux" : ""}</span>
                  </div>
                  {info.minRequirements && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[11px] text-teal-core hover:underline">查看 Steam 官方最低配置</summary>
                      <pre className="mt-1.5 max-h-28 overflow-y-auto whitespace-pre-wrap rounded-sm bg-ink-900 p-2 font-sans text-[11px] leading-relaxed text-ink-300">{info.minRequirements}</pre>
                    </details>
                  )}
                </div>
              </div>

              {dup && (
                <div className="mt-3 flex items-center gap-2 rounded-sm border border-warn/30 bg-warn/[0.07] px-3.5 py-2 text-xs text-warn">
                  <WarnIcon className="h-3.5 w-3.5" /> 该游戏已存在于游戏库中，重复保存会覆盖旧条目。
                </div>
              )}

              {/* 要求配置 */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-bold text-ink-400">显示名称（中文）</span>
                  <input value={zh} onChange={(e) => setZh(e.target.value)}
                    className="mt-1 w-full rounded-sm border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-ink-100 outline-none focus:border-teal-core/60" />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-ink-400">最低内存要求</span>
                  <select value={ram} onChange={(e) => setRam(Number(e.target.value))}
                    className="mt-1 w-full rounded-sm border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-ink-100 outline-none focus:border-teal-core/60">
                    {RAM_CHOICES.map((r) => <option key={r} value={r}>{r} GB</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-ink-400">最低 CPU 档位（对照官方要求选）</span>
                  <select value={cpuIdx} onChange={(e) => setCpuIdx(Number(e.target.value))}
                    className="mt-1 w-full rounded-sm border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-ink-100 outline-none focus:border-teal-core/60">
                    {CPU_TIERS.map((t, i) => <option key={t.name} value={i}>{t.name} · {t.desc}（{t.score} 分）</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold text-ink-400">最低 GPU 档位（对照官方要求选）</span>
                  <select value={gpuIdx} onChange={(e) => setGpuIdx(Number(e.target.value))}
                    className="mt-1 w-full rounded-sm border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-ink-100 outline-none focus:border-teal-core/60">
                    {GPU_TIERS.map((t, i) => <option key={t.name} value={i}>{t.name} · {t.desc}（{t.score} 分）</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-3">
                <span className="text-[11px] font-bold text-ink-400">类型标签（影响筛选）</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {ALL_GENRES.map((g) => {
                    const on = genres.includes(g);
                    return (
                      <button key={g} onClick={() => setGenres((cur) => on ? cur.filter((x) => x !== g) : [...cur, g])}
                        className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${on ? "border-teal-core bg-teal-core/10 text-teal-core" : "border-ink-700 text-ink-400 hover:border-ink-600 hover:text-ink-200"}`}>
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button onClick={resetDetail}
                  className="rounded-sm border border-ink-700 px-4 py-2.5 text-sm text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100">
                  换一个
                </button>
                <button onClick={save}
                  className={`flex-1 rounded-sm py-2.5 text-sm font-black transition-all active:scale-[0.98] ${saved ? "bg-ok/15 text-ok" : "bg-amber-core text-ink-950 hover:bg-amber-hi"}`}>
                  {saved ? "已保存 ✓ 可继续添加或关闭" : dup ? "覆盖保存" : "保存到游戏库"}
                </button>
              </div>
            </div>
          )}

          {/* 底部说明 */}
          <p className="mt-5 flex items-start gap-2 border-t border-ink-800 pt-3.5 text-[11px] leading-relaxed text-ink-600">
            <SteamIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steam" />
            数据来自 Steam 官方商店 API（经公共 CORS 代理中转）。添加的游戏保存在本机浏览器，参与匹配；
            AppID 在商店页网址中，如 store.steampowered.com/app/<b className="text-ink-400">620</b>。
            若代理不可用，可稍后重试或使用内置游戏库。
            <a className="ml-auto shrink-0 text-teal-core hover:underline" href="https://store.steampowered.com/" target="_blank" rel="noreferrer">
              去 Steam 商店 <ExternalIcon className="inline h-2.5 w-2.5" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

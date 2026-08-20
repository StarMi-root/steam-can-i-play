import { useEffect, useRef, useState } from "react";
import { Game } from "../data/games";
import { UpdateProgress, UpdateResult, updateGameLibrary } from "../lib/updater";
import { TopSource } from "../lib/net";
import { GlobeIcon, RestartIcon } from "./icons";

const SOURCES: { id: TopSource; label: string; tag: string; desc: string }[] = [
  { id: "steamspy-week", label: "SteamSpy · 近两周最热", tag: "第三方", desc: "按最近游玩人数排名的 Top100，追新首选" },
  { id: "steamspy-forever", label: "SteamSpy · 历史最热", tag: "第三方", desc: "全 Steam 历史玩家数 Top100，经典全收录" },
  { id: "steam-official", label: "Steam 官方热销榜", tag: "官方", desc: "官方 featured 接口的热销 / 新品榜" },
];

export default function UpdateModal({
  open, onClose, existingIds, onAdded,
}: {
  open: boolean;
  onClose: () => void;
  existingIds: Set<number>;
  onAdded: (games: Game[]) => void;
}) {
  const [source, setSource] = useState<TopSource>("steamspy-week");
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [result, setResult] = useState<UpdateResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !progress && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, progress]);

  useEffect(() => {
    if (open) { setProgress(null); setResult(null); setErr(null); }
  }, [open]);

  if (!open) return null;

  const running = !!progress;
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null;

  const run = async () => {
    cancelRef.current = false;
    setErr(null);
    setResult(null);
    setProgress({ phase: "连接数据源", done: 0, total: 0 });
    try {
      const res = await updateGameLibrary(existingIds, source, setProgress, () => cancelRef.current);
      if (res.added.length > 0) onAdded(res.added);
      setResult(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "更新失败，请更换数据源或稍后重试");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/80 px-3 py-8 backdrop-blur-sm sm:px-4 sm:py-12"
      onMouseDown={(e) => e.target === e.currentTarget && !running && onClose()}
    >
      <div className="animate-fade-up w-full max-w-xl rounded-md border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 font-display text-[10px] font-semibold tracking-[0.28em] text-teal-core">
              <GlobeIcon className="h-4 w-4" /> LIBRARY SYNC
            </div>
            <h3 className="mt-1 text-lg font-black text-ink-100">一键更新游戏库</h3>
          </div>
          <button onClick={onClose} disabled={running} className="rounded-sm border border-ink-700 px-2.5 py-1 text-sm text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100 disabled:opacity-40">
            关闭
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* 数据源选择 */}
          <div className="grid gap-2">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                disabled={running}
                onClick={() => setSource(s.id)}
                className={`rounded-sm border px-4 py-3 text-left transition-all ${
                  source === s.id
                    ? "border-teal-core bg-teal-core/[0.08]"
                    : "border-ink-700 bg-ink-850 hover:-translate-y-0.5 hover:border-ink-600"
                } disabled:opacity-60`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${source === s.id ? "text-teal-core" : "text-ink-100"}`}>{s.label}</span>
                  <span className={`rounded-sm border px-1.5 py-0.5 font-display text-[10px] font-bold ${
                    s.tag === "第三方" ? "border-amber-core/50 text-amber-core" : "border-ink-600 text-ink-400"
                  }`}>
                    {s.tag}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-ink-500">{s.desc}</div>
              </button>
            ))}
          </div>

          <p className="rounded-sm border border-ink-800 bg-ink-950/70 px-3 py-2.5 text-[11px] leading-relaxed text-ink-500">
            更新流程：拉取榜单 → 逐款获取详情 → <b className="text-ink-300">自动解析官方最低 / 推荐配置文本</b> →
            换算性能分入库。未公布配置的游戏会自动跳过；结果保存在本地，可随时在报告页移除。
          </p>

          {/* 进度 */}
          {running && progress && (
            <div className="animate-fade-up rounded-sm border border-amber-core/40 bg-amber-core/[0.05] px-4 py-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-hi">{progress.phase}</span>
                <span className="font-display text-amber-core">
                  {progress.total > 0 ? `${progress.done} / ${progress.total}` : "…"}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-750">
                <div
                  className="h-full rounded-full bg-amber-core transition-all duration-300"
                  style={{ width: `${pct ?? 8}%` }}
                />
              </div>
              <button
                onClick={() => { cancelRef.current = true; }}
                className="mt-2.5 rounded-sm border border-ink-600 px-3 py-1.5 text-[11px] text-ink-300 transition-colors hover:border-bad/50 hover:text-bad"
              >
                取消（保留已入库部分）
              </button>
            </div>
          )}

          {err && (
            <div className="animate-fade-up rounded-sm border border-bad/40 bg-bad/10 px-4 py-3 text-xs leading-relaxed text-bad">
              {err}
              <div className="mt-1 text-[11px] text-ink-400">可尝试更换数据源；若页头显示「代理受限」，请稍后重试。</div>
            </div>
          )}

          {/* 结果 */}
          {result && (
            <div className="animate-fade-up rounded-sm border border-ok/40 bg-ok/[0.07] px-4 py-3">
              <div className="text-sm font-black text-ok">更新完成</div>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-ink-300 sm:grid-cols-3">
                <span>新增 <b className="font-display text-ok">{result.added.length}</b> 款</span>
                <span>已收录 <b className="font-display">{result.already}</b> 款</span>
                <span>跳过 <b className="font-display">{result.skipped}</b> 款</span>
                {result.failed > 0 && <span className="text-warn">失败 <b className="font-display">{result.failed}</b> 款</span>}
                <span>本次扫描 <b className="font-display">{result.total}</b> 款</span>
              </div>
              {result.added.length > 0 && (
                <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
                  {result.added.slice(0, 20).map((g) => (
                    <img key={g.id} src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${g.id}/capsule_231x87.jpg`} alt={g.name} title={g.name} className="h-10 shrink-0 rounded-sm border border-ink-700" loading="lazy" />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 操作 */}
          <div className="flex items-center justify-between border-t border-ink-800 pt-4">
            <span className="text-[11px] text-ink-600">已收录 {existingIds.size} 款 · 自动去重</span>
            <button
              onClick={run}
              disabled={running}
              className="group flex items-center gap-2 rounded-sm bg-teal-core px-5 py-2.5 text-sm font-black text-ink-950 transition-all enabled:hover:brightness-110 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RestartIcon className={`h-4 w-4 ${running ? "animate-spin" : "transition-transform duration-500 group-hover:-rotate-180"}`} />
              {running ? "更新中…" : result ? "再更新一次" : "开始更新"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

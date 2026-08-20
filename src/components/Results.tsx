import { useEffect, useMemo, useState } from "react";
import { ALL_GENRES } from "../data/games";
import {
  Build, Fit, LEVEL_META, machineGrade, upgradeHint,
} from "../lib/match";
import { OS_OPTIONS, cpuTierLabel, gpuTierLabel } from "../data/hardware";
import {
  ArrowLeft, ExternalIcon, GaugeIcon, RestartIcon, SteamIcon, VrIcon, WarnIcon,
} from "./icons";

/* ---------- 游戏卡片 ---------- */

function GameCard({ fit, delay }: { fit: Fit; delay: number }) {
  const [imgErr, setImgErr] = useState(false);
  const meta = LEVEL_META[fit.level];
  const fpsPct = Math.min(100, Math.round((fit.estFps / 120) * 100));
  const barColor =
    fit.level === "perfect" ? "bg-ok" : fit.level === "smooth" ? "bg-teal-core" : "bg-warn";
  const hue = (fit.game.id % 7) * 40;

  return (
    <article
      className="group animate-fade-up overflow-hidden rounded-sm border border-ink-700 bg-ink-850 transition-all duration-200 hover:-translate-y-1 hover:border-ink-600 hover:shadow-[0_14px_36px_-14px_rgba(0,0,0,0.8)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* 封面 */}
      <div className="relative aspect-[460/140] overflow-hidden border-b border-ink-700">
        {!imgErr ? (
          <img
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${fit.game.id}/capsule_616x353.jpg`}
            alt={fit.game.name}
            loading="lazy"
            onError={() => setImgErr(true)}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: `linear-gradient(135deg, hsl(${hue} 32% 22%), hsl(${(hue + 40) % 360} 38% 13%))` }}
          >
            <span className="font-display text-3xl font-bold tracking-widest text-white/25">
              {fit.game.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-transparent to-transparent" />
        <span className={`absolute left-2 top-2 rounded-sm border px-2 py-0.5 font-display text-[11px] font-bold tracking-wider ${meta.bg} ${meta.color} backdrop-blur-sm`}>
          {meta.label}
        </span>
        {fit.game.vr && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-sm border border-ink-600 bg-ink-900/80 px-1.5 py-0.5 text-[10px] text-ink-300 backdrop-blur-sm">
            <VrIcon className="h-3 w-3" /> VR
          </span>
        )}
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black leading-tight text-white drop-shadow">{fit.game.zh}</h3>
            <p className="truncate font-display text-[10px] tracking-wide text-ink-300/90">{fit.game.name}</p>
          </div>
          <span className="shrink-0 font-display text-[11px] font-semibold text-ink-300">{fit.game.year}</span>
        </div>
      </div>

      {/* 数据区 */}
      <div className="px-3.5 py-3">
        <div className="flex items-center justify-between text-[11px] text-ink-400">
          <span>{fit.game.genres.join(" · ")}</span>
          <span className={`font-display text-sm font-bold ${meta.color}`}>≈ {fit.estFps} FPS</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-750">
          <div
            className={`h-full origin-left animate-bar-grow rounded-full ${barColor}`}
            style={{ width: `${fpsPct}%`, animationDelay: `${delay + 150}ms` }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px]">
          <span className={`truncate ${fit.ramOk ? "text-ink-400" : "text-warn"}`}>
            {fit.ramOk ? meta.desc : `内存不足（需 ${fit.game.minRam}GB）`}
          </span>
          <a
            href={`https://store.steampowered.com/app/${fit.game.id}/`}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-sm border border-ink-600 bg-ink-800 px-2.5 py-1.5 font-display text-[11px] font-semibold text-steam transition-colors hover:border-steam/60 hover:bg-steam/10"
          >
            <SteamIcon className="h-3.5 w-3.5" />
            Steam
            <ExternalIcon className="h-2.5 w-2.5 opacity-60" />
          </a>
        </div>
      </div>
    </article>
  );
}

/* ---------- 扫描动画 ---------- */

const SCAN_LINES = [
  "> 读取硬件档案 …",
  "> 载入游戏库最低配置表 …",
  "> 按 CPU / GPU / 内存逐项比对 …",
  "> 估算 1080P 帧率区间 …",
  "> 生成匹配报告 ✓",
];

function ScanOverlay({ done }: { done: () => void }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((l) => l + 1), 260);
    const stop = setTimeout(done, SCAN_LINES.length * 260 + 300);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [done]);

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-sm border border-ink-700 bg-ink-900/70">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-2 border-ink-700" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-amber-core" style={{ animationDuration: "0.9s" }} />
        <GaugeIcon className="absolute inset-0 m-auto h-7 w-7 text-amber-core" />
      </div>
      <div className="mt-5 font-display text-sm font-bold tracking-[0.3em] text-amber-core">
        SCANNING
      </div>
      <div className="mt-1 text-xs text-ink-400">正在生成兼容性报告</div>
      <div className="mt-6 w-64 space-y-1.5 font-display text-[11px] text-teal-core/90">
        {SCAN_LINES.slice(0, Math.min(line + 1, SCAN_LINES.length)).map((l, i) => (
          <div key={i} className="animate-fade-up">{l}</div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 结果主体 ---------- */

export default function Results({
  build, playable, rejected, totalSupported, onBack, onRestart,
}: {
  build: Build;
  playable: Fit[];
  rejected: Fit[];
  totalSupported: number;
  onBack: () => void;
  onRestart: () => void;
}) {
  const [scanned, setScanned] = useState(false);
  const [levelTab, setLevelTab] = useState<"all" | "perfect" | "smooth" | "low">("all");
  const [genre, setGenre] = useState<string>("全部");
  const [sort, setSort] = useState<"fit" | "year" | "name">("fit");
  const [showRejected, setShowRejected] = useState(false);

  const counts = useMemo(() => ({
    all: playable.length,
    perfect: playable.filter((f) => f.level === "perfect").length,
    smooth: playable.filter((f) => f.level === "smooth").length,
    low: playable.filter((f) => f.level === "low").length,
  }), [playable]);

  const genres = useMemo(
    () => ["全部", ...ALL_GENRES.filter((g) => playable.some((f) => f.game.genres.includes(g)))],
    [playable]
  );

  const list = useMemo(() => {
    let arr = playable;
    if (levelTab !== "all") arr = arr.filter((f) => f.level === levelTab);
    if (genre !== "全部") arr = arr.filter((f) => f.game.genres.includes(genre));
    if (sort === "year") arr = [...arr].sort((a, b) => b.game.year - a.game.year);
    else if (sort === "name") arr = [...arr].sort((a, b) => a.game.zh.localeCompare(b.game.zh, "zh-CN"));
    return arr;
  }, [playable, levelTab, genre, sort]);

  const grade = machineGrade(build.cpu!.score, build.gpu!.score);
  const hint = upgradeHint(build);
  const osName = OS_OPTIONS.find((o) => o.id === build.os)?.name ?? "";

  const tabs: { key: typeof levelTab; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "perfect", label: "完美运行" },
    { key: "smooth", label: "流畅运行" },
    { key: "low", label: "勉强可玩" },
  ];

  if (!scanned) return <ScanOverlay done={() => setScanned(true)} />;

  return (
    <div className="animate-step-in">
      {/* 报告头 */}
      <div className="overflow-hidden rounded-md border border-ink-700 bg-ink-900/80">
        <div className="relative border-b border-ink-700 px-5 py-5 sm:px-6">
          <div className="tick-rule absolute inset-x-0 top-0 h-[3px]" />
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <div className="font-display text-[11px] font-semibold tracking-[0.28em] text-ink-400">
                COMPATIBILITY REPORT · 匹配报告
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className={`text-3xl font-black sm:text-4xl ${grade.tone}`}>{grade.grade}</span>
                <span className="font-display text-xs font-bold tracking-[0.2em] text-ink-500">{grade.tag}</span>
              </div>
            </div>
            <div className="hidden h-12 w-px bg-ink-700 sm:block" />
            <dl className="flex flex-wrap gap-x-7 gap-y-2 text-sm">
              <div>
                <dt className="text-[11px] text-ink-500">可玩游戏</dt>
                <dd className="font-display text-xl font-bold text-ok">{counts.all}
                  <span className="ml-1 text-xs font-semibold text-ink-500">/ {totalSupported} 款支持</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-500">完美运行</dt>
                <dd className="font-display text-xl font-bold text-ok">{counts.perfect}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-500">流畅运行</dt>
                <dd className="font-display text-xl font-bold text-teal-core">{counts.smooth}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-ink-500">勉强可玩</dt>
                <dd className="font-display text-xl font-bold text-warn">{counts.low}</dd>
              </div>
            </dl>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-400">
            {grade.advice}
            {hint && <span className="text-amber-core"> · 升级建议：{hint}。</span>}
          </p>
        </div>

        {/* 当前配置摘要 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 bg-ink-850/70 px-5 py-3 font-display text-[11px] tracking-wide text-ink-400 sm:px-6">
          <span><b className="text-ink-300">OS</b> {osName}</span>
          <span><b className="text-ink-300">CPU</b> {build.cpu!.name}（{cpuTierLabel(build.cpu!.score)}）</span>
          <span><b className="text-ink-300">GPU</b> {build.gpu!.name}（{gpuTierLabel(build.gpu!.score)}）</span>
          <span><b className="text-ink-300">RAM</b> {build.ram} GB</span>
          {(build.os === "win7" || build.os === "mac" || build.os === "linux") && (
            <span className="flex items-center gap-1 text-warn">
              <WarnIcon className="h-3.5 w-3.5" />
              {build.os === "win7"
                ? "Win7/8.1 已排除要求 Win10+ 的新游戏"
                : build.os === "mac" ? "仅显示原生支持 macOS 的游戏" : "仅显示原生支持 Linux 的游戏"}
            </span>
          )}
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-sm border border-ink-700 bg-ink-850 p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setLevelTab(t.key)}
              className={`rounded-[3px] px-3 py-1.5 text-xs font-bold transition-colors ${
                levelTab === t.key
                  ? "bg-amber-core text-ink-950"
                  : "text-ink-400 hover:text-ink-100"
              }`}
            >
              {t.label}
              <span className={`ml-1.5 font-display ${levelTab === t.key ? "opacity-70" : "opacity-60"}`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-ink-500">
          排序
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-sm border border-ink-700 bg-ink-850 px-2 py-1.5 text-xs text-ink-100 outline-none focus:border-amber-core/60"
          >
            <option value="fit">按匹配度</option>
            <option value="year">按年份（新→旧）</option>
            <option value="name">按名称</option>
          </select>
        </div>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
              genre === g
                ? "border-teal-core bg-teal-core/10 text-teal-core"
                : "border-ink-700 bg-ink-850 text-ink-400 hover:border-ink-600 hover:text-ink-100"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* 卡片网格 */}
      {list.length > 0 ? (
        <div key={`${levelTab}-${genre}-${sort}`} className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((f, i) => (
            <GameCard key={f.game.id} fit={f} delay={Math.min(i, 12) * 45} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-sm border border-dashed border-ink-700 px-6 py-14 text-center">
          <WarnIcon className="mx-auto h-8 w-8 text-warn" />
          <p className="mt-3 text-sm font-bold text-ink-100">这个组合下没有符合条件的游戏</p>
          <p className="mt-1 text-xs text-ink-500">试试切换筛选条件，或返回修改硬件配置</p>
        </div>
      )}

      {/* 带不动列表 */}
      {rejected.length > 0 && (
        <div className="mt-8 rounded-md border border-ink-800 bg-ink-900/60">
          <button
            onClick={() => setShowRejected((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-ink-850"
          >
            <span className="flex items-center gap-2.5 text-sm font-bold text-bad">
              <WarnIcon className="h-4 w-4" />
              带不动的游戏（{rejected.length} 款）
            </span>
            <span className="font-display text-xs text-ink-500">{showRejected ? "收起 ▲" : "展开 ▼"}</span>
          </button>
          {showRejected && (
            <ul className="grid gap-x-6 border-t border-ink-800 px-5 py-4 sm:grid-cols-2">
              {rejected.map((f) => (
                <li key={f.game.id} className="flex items-center justify-between gap-3 border-b border-ink-800/60 py-2 text-sm last:border-0 sm:[&:nth-last-child(2)]:border-0">
                  <span className="truncate text-ink-400">
                    {f.game.zh}
                    {f.game.vr && <span className="ml-1.5 text-[10px] text-ink-600">VR</span>}
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-600">
                    约 {f.estFps} FPS · {!f.ramOk ? `内存需 ${f.game.minRam}GB` : "低于最低配置"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 底部操作 */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 rounded-sm border border-ink-700 px-4 py-2.5 text-sm text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          修改配置
        </button>
        <button
          onClick={onRestart}
          className="group flex items-center gap-2 rounded-sm border border-amber-core/50 bg-amber-core/10 px-4 py-2.5 text-sm font-bold text-amber-core transition-colors hover:bg-amber-core/20"
        >
          <RestartIcon className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-180" />
          重新检测
        </button>
        <p className="ml-auto max-w-xs text-[11px] leading-relaxed text-ink-600">
          * 帧率为 1080P 下估算值，实际表现受驱动、画质设置与散热影响，仅供参考。
        </p>
      </div>
    </div>
  );
}

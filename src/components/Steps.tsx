import { useEffect, useMemo, useState } from "react";
import {
  CPU_MODELS, CPU_TIERS, GPU_MODELS, GPU_TIERS, OS_OPTIONS, RAM_OPTIONS,
  OsId, cpuTierLabel, gpuTierLabel, nearestModel,
} from "../data/hardware";
import { ScoreLookup, hardwareLookupLinks, lookupHardwareScore } from "../lib/net";
import {
  AppleIcon, ArrowLeft, ExternalIcon, GlobeIcon, InfoIcon, LinuxIcon, PlusIcon, SearchIcon, TrashIcon, WindowsIcon,
} from "./icons";

/* ---------- 通用外壳 ---------- */

export function StepShell({
  index, title, en, desc, hint, onBack, children,
}: {
  index: number;
  title: string;
  en: string;
  desc: string;
  hint?: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  const [showHint, setShowHint] = useState(false);
  return (
    <section className="animate-step-in">
      <div className="flex items-end justify-between gap-4 border-b-2 border-ink-700 pb-4">
        <div>
          <div className="font-display text-[11px] font-semibold tracking-[0.3em] text-amber-core">
            STEP {index} / 4 · {en}
          </div>
          <h2 className="mt-1.5 text-2xl font-black text-ink-100 sm:text-3xl">{title}</h2>
          <p className="mt-1.5 text-sm text-ink-400">{desc}</p>
        </div>
        <div className="font-display hidden text-5xl font-bold leading-none text-ink-750 sm:block select-none">
          0{index}
        </div>
      </div>

      <div className="py-6">{children}</div>

      <div className="flex items-center justify-between border-t border-ink-800 pt-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="group flex items-center gap-2 rounded-sm border border-ink-700 px-3.5 py-2 text-sm text-ink-300 transition-colors hover:border-ink-600 hover:text-ink-100"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            上一步
          </button>
        ) : (
          <span />
        )}
        {hint && (
          <button
            onClick={() => setShowHint((v) => !v)}
            className={`flex items-center gap-1.5 rounded-sm px-3 py-2 text-xs transition-colors ${
              showHint ? "bg-amber-core/10 text-amber-core" : "text-ink-400 hover:text-amber-core"
            }`}
          >
            <InfoIcon className="h-3.5 w-3.5" />
            不知道怎么查？
          </button>
        )}
      </div>

      {hint && showHint && (
        <div className="mt-3 animate-fade-up rounded-sm border border-amber-core/25 bg-amber-core/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-hi/90">
          {hint}
        </div>
      )}
    </section>
  );
}

/* ---------- 第一步：操作系统 ---------- */

const OS_ICONS: Record<OsId, (p: { className?: string }) => React.ReactNode> = {
  win11: WindowsIcon, win10: WindowsIcon, win7: WindowsIcon,
  mac: AppleIcon, linux: LinuxIcon,
};

export function StepOs({
  value, onPick,
}: {
  value: OsId | null;
  onPick: (os: OsId) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OS_OPTIONS.map((o, i) => {
        const Icon = OS_ICONS[o.id];
        const active = value === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onPick(o.id)}
            style={{ animationDelay: `${i * 55}ms` }}
            className={`group relative animate-fade-up overflow-hidden rounded-sm border px-4 py-4 text-left transition-all duration-200 ${
              active
                ? "border-amber-core bg-amber-core/[0.08] shadow-[0_0_0_1px_rgba(245,168,60,0.4)]"
                : "border-ink-700 bg-ink-850 hover:-translate-y-0.5 hover:border-ink-600 hover:bg-ink-800"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                  active
                    ? "border-amber-core/50 bg-amber-core/10 text-amber-core"
                    : "border-ink-700 bg-ink-800 text-ink-400 group-hover:text-ink-300"
                }`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <div className={`font-display text-base font-bold ${active ? "text-amber-hi" : "text-ink-100"}`}>
                  {o.name}
                </div>
                <div className="mt-0.5 text-xs text-ink-400">{o.sub} · {o.note}</div>
              </div>
            </div>
            {active && (
              <span className="animate-led absolute right-3 top-3 h-2 w-2 animate-pop rounded-full bg-amber-core text-amber-core" />
            )}
          </button>
        );
      })}
      <div className="animate-fade-up rounded-sm border border-dashed border-ink-700 px-4 py-4 text-xs leading-relaxed text-ink-500 sm:col-span-2" style={{ animationDelay: "300ms" }}>
        <span className="font-bold text-ink-400">提示：</span>
        选择 Windows 7 / 8.1 时，2017 年之后要求 Win10+ 的新游戏会被自动排除；选择 macOS 或 Linux
        时只匹配原生支持的游戏。不确定的话，在「此电脑」上右键 → 属性即可查看。
      </div>
    </div>
  );
}

/* ---------- 档位徽章 ---------- */

function TierBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`font-display shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider ${tone}`}>
      {label}
    </span>
  );
}

const TIER_TONES: Record<string, string> = {
  核显级: "border-ink-600 text-ink-400",
  入门: "border-ink-600 text-ink-300",
  主流: "border-teal-dim text-teal-core",
  中端: "border-teal-dim text-teal-core",
  高性能: "border-amber-deep text-amber-core",
  旗舰: "border-amber-core/60 text-amber-hi",
};

/* ---------- 自定义型号录入 ---------- */

function CustomForm({
  kind, onCancel, onSave,
}: {
  kind: "cpu" | "gpu";
  onCancel: () => void;
  onSave: (item: { name: string; score: number }) => void;
}) {
  const [name, setName] = useState("");
  const [score, setScore] = useState(kind === "cpu" ? 60 : 50);
  const [err, setErr] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const [lookup, setLookup] = useState<ScoreLookup | null>(null);
  const near = nearestModel(score, kind);
  const tierOf = kind === "cpu" ? cpuTierLabel : gpuTierLabel;
  const max = kind === "cpu" ? 150 : 130;
  const unit = kind === "cpu" ? "处理器" : "显卡";

  const save = () => {
    const n = name.trim();
    if (n.length < 2) { setErr(`请输入${unit}型号名称（至少 2 个字符）`); return; }
    onSave({ name: n, score });
  };

  const runLookup = async (n: string) => {
    setLooking(true);
    setLookup(null);
    const res = await lookupHardwareScore(n, kind);
    setScore(res.score);
    setLookup(res);
    setLooking(false);
  };

  const autoLookup = () => {
    const n = name.trim();
    if (n.length < 2) { setErr(`先输入${unit}型号名称，再联网查分`); return; }
    setErr(null);
    void runLookup(n);
  };

  /* 输入型号后自动联网查分（防抖 700ms） */
  useEffect(() => {
    const n = name.trim();
    if (n.length < 2) { setLookup(null); return; }
    const t = window.setTimeout(() => void runLookup(n), 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, kind]);

  return (
    <div className="animate-fade-up mt-3 rounded-sm border border-amber-core/40 bg-amber-core/[0.05] p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-amber-hi">手动添加任意{unit}型号</div>
        <button onClick={onCancel} className="text-xs text-ink-400 hover:text-ink-100">取消</button>
      </div>
      <input
        autoFocus
        value={name}
        onChange={(e) => { setName(e.target.value); setErr(null); }}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder={kind === "cpu" ? "如 AMD Athlon II X4 641" : "如 GeForce 210"}
        className="mt-3 w-full rounded-sm border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 outline-none placeholder:text-ink-600 focus:border-amber-core/60"
      />
      {err && <div className="mt-1.5 text-xs text-bad">{err}</div>}

      {/* 联网查分 */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={autoLookup}
          disabled={looking}
          className="inline-flex items-center gap-2 rounded-sm border border-teal-dim bg-teal-core/10 px-3 py-1.5 text-xs font-bold text-teal-core transition-colors hover:bg-teal-core/20 disabled:opacity-60"
        >
          {looking ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-core/30 border-t-teal-core" />
          ) : (
            <GlobeIcon className="h-3.5 w-3.5" />
          )}
          {looking ? "联网查分中…" : "联网自动查性能分"}
        </button>
        {lookup && !looking && (
          <span className="text-[11px] text-ink-400">
            <b className={lookup.source === "online" ? "text-ok" : "text-amber-core"}>
              {lookup.source === "online" ? "在线" : "本地估算"}
            </b>
            · {lookup.note}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-ink-400">性能定位（相对指数）</span>
          <span className="font-display text-2xl font-bold text-amber-core">{score}</span>
        </div>
        <input
          type="range"
          min={4}
          max={max}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="mt-2 w-full"
        />
        <div className="mt-1 flex justify-between text-[10px] text-ink-600">
          <span>亮机</span><span>主流</span><span>旗舰</span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          <TierBadge label={tierOf(score)} tone={TIER_TONES[tierOf(score)]} />
          <span className="text-ink-400">
            ≈ 相当于 <b className="text-ink-200">{near.name}</b>（{near.score} 分）
          </span>
        </div>
      </div>

      <div className="mt-3 border-t border-ink-800 pt-3 text-[11px] text-ink-500">
        不确定性能分？联网查一下：
        <span className="ml-1 inline-flex flex-wrap gap-2">
          {name.trim().length >= 2
            ? hardwareLookupLinks(name.trim(), kind).map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-teal-core hover:underline">
                  {l.label} <ExternalIcon className="h-2.5 w-2.5" />
                </a>
              ))
            : "（输入型号后显示查询链接）"}
        </span>
      </div>

      <button
        onClick={save}
        className="mt-4 w-full rounded-sm bg-amber-core py-2.5 text-sm font-black text-ink-950 transition-colors hover:bg-amber-hi active:scale-[0.98]"
      >
        保存并选用该{unit}
      </button>
    </div>
  );
}

/* ---------- 硬件选择列表 ---------- */

export interface HardwareItem { name: string; score: number }

export function HardwarePicker({
  kind, groups, tiers, selected, onPick, unitLabel, tierOf,
  customItems, onAddCustom, onDeleteCustom,
}: {
  kind: "cpu" | "gpu";
  groups: { brand: string; items: HardwareItem[] }[];
  tiers: { name: string; desc: string; score: number }[];
  selected: string | null;
  onPick: (item: HardwareItem) => void;
  unitLabel: string;
  tierOf: (score: number) => string;
  customItems: HardwareItem[];
  onAddCustom: (item: HardwareItem) => void;
  onDeleteCustom: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = customItems.length > 0
      ? [{ brand: "我的自定义", items: customItems }, ...groups]
      : groups;
    if (!q) return all;
    return all
      .map((g) => ({ ...g, items: g.items.filter((it) => it.name.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, customItems, query]);

  const empty = filtered.length === 0;

  return (
    <div>
      {/* 搜索 */}
      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`搜索${unitLabel}型号（${kind === "cpu" ? `${CPU_MODELS.length}` : `${GPU_MODELS.length}`} 款内置 + 自定义），如 641 / 210 / 4060…`}
          className="w-full rounded-sm border border-ink-700 bg-ink-850 py-2.5 pl-9 pr-3 text-sm text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-amber-core/60 focus:bg-ink-800"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_290px]">
        {/* 型号列表 */}
        <div className="max-h-[420px] overflow-y-auto rounded-sm border border-ink-700 bg-ink-900/60 pr-1">
          {empty ? (
            <div className="px-5 py-10 text-center text-sm text-ink-500">
              没有匹配「{query}」的型号
              <br />
              <span className="text-xs text-ink-600">右侧可按档位估算，或点「手动添加任意型号」自行录入</span>
            </div>
          ) : (
            filtered.map((g) => (
              <div key={g.brand}>
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-ink-800 bg-ink-850/95 px-4 py-2 backdrop-blur">
                  <span className={`font-display text-[11px] font-bold tracking-[0.2em] ${g.brand === "我的自定义" ? "text-amber-core" : "text-ink-400"}`}>
                    {g.brand}
                  </span>
                  <span className="h-px flex-1 bg-ink-700" />
                  <span className="text-[10px] text-ink-600">{g.items.length} 款</span>
                </div>
                <ul>
                  {g.items.map((it) => {
                    const active = selected === it.name;
                    return (
                      <li key={`${g.brand}-${it.name}`} className="border-b border-ink-800/70 last:border-0">
                        <div className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          active ? "bg-amber-core/[0.09] text-amber-hi" : "text-ink-100 hover:bg-ink-800"
                        }`}>
                          <button
                            onClick={() => onPick(it)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-amber-core" : "bg-ink-600"}`} />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.name}</span>
                            <TierBadge label={tierOf(it.score)} tone={TIER_TONES[tierOf(it.score)]} />
                            <span className="font-display w-12 shrink-0 text-right text-xs font-bold text-ink-400">
                              {it.score}
                            </span>
                          </button>
                          {g.brand === "我的自定义" && (
                            <button
                              onClick={() => onDeleteCustom(it.name)}
                              title="删除该自定义型号"
                              className="shrink-0 rounded-sm p-1 text-ink-600 transition-colors hover:bg-bad/10 hover:text-bad"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* 档位兜底 + 自定义 */}
        <div>
          <div className="font-display mb-2 text-[11px] font-semibold tracking-[0.22em] text-ink-400">
            找不到型号？按档位选
          </div>
          <div className="space-y-2">
            {tiers.map((t) => {
              const active = selected === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => onPick({ name: `${t.name}（约 ${t.score} 分）`, score: t.score })}
                  className={`w-full rounded-sm border px-3.5 py-2.5 text-left transition-all ${
                    active
                      ? "border-amber-core bg-amber-core/[0.08]"
                      : "border-ink-700 bg-ink-850 hover:-translate-y-0.5 hover:border-ink-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${active ? "text-amber-hi" : "text-ink-100"}`}>{t.name}</span>
                    <span className="font-display text-xs font-bold text-ink-400">{t.score}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-500">{t.desc}</div>
                </button>
              );
            })}
          </div>

          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-amber-core/50 bg-amber-core/[0.04] px-3.5 py-3 text-sm font-bold text-amber-core transition-colors hover:bg-amber-core/[0.1]"
            >
              <PlusIcon className="h-4 w-4" />
              手动添加任意{unitLabel}型号
            </button>
          ) : (
            <CustomForm
              kind={kind}
              onCancel={() => setShowCustom(false)}
              onSave={(item) => {
                onAddCustom(item);
                onPick(item);
                setShowCustom(false);
              }}
            />
          )}

          <p className="mt-3 rounded-sm border border-ink-800 bg-ink-900/70 px-3 py-2.5 text-[11px] leading-relaxed text-ink-500">
            内置 {kind === "cpu" ? CPU_MODELS.length : GPU_MODELS.length} 款常见型号；列表里没有的（老机器、魔改、笔记本 U）都可以手动添加，自定义型号会保存在本机。
          </p>
        </div>
      </div>
    </div>
  );
}

export function StepCpu({
  value, onPick, customItems, onAddCustom, onDeleteCustom,
}: {
  value: HardwareItem | null;
  onPick: (c: HardwareItem) => void;
  customItems: HardwareItem[];
  onAddCustom: (item: HardwareItem) => void;
  onDeleteCustom: (name: string) => void;
}) {
  const groups = [
    { brand: "INTEL", items: CPU_MODELS.filter((c) => c.brand === "Intel") },
    { brand: "AMD", items: CPU_MODELS.filter((c) => c.brand === "AMD") },
  ];
  return (
    <HardwarePicker
      kind="cpu"
      groups={groups}
      tiers={CPU_TIERS}
      selected={value?.name ?? null}
      onPick={onPick}
      unitLabel="处理器"
      tierOf={cpuTierLabel}
      customItems={customItems}
      onAddCustom={onAddCustom}
      onDeleteCustom={onDeleteCustom}
    />
  );
}

export function StepGpu({
  value, onPick, customItems, onAddCustom, onDeleteCustom,
}: {
  value: HardwareItem | null;
  onPick: (g: HardwareItem) => void;
  customItems: HardwareItem[];
  onAddCustom: (item: HardwareItem) => void;
  onDeleteCustom: (name: string) => void;
}) {
  const groups = [
    { brand: "NVIDIA", items: GPU_MODELS.filter((g) => g.brand === "NVIDIA") },
    { brand: "AMD RADEON", items: GPU_MODELS.filter((g) => g.brand === "AMD") },
    { brand: "INTEL / 核显", items: GPU_MODELS.filter((g) => g.brand === "Intel") },
  ];
  return (
    <HardwarePicker
      kind="gpu"
      groups={groups}
      tiers={GPU_TIERS}
      selected={value?.name ?? null}
      onPick={onPick}
      unitLabel="显卡"
      tierOf={gpuTierLabel}
      customItems={customItems}
      onAddCustom={onAddCustom}
      onDeleteCustom={onDeleteCustom}
    />
  );
}

/* ---------- 第四步：内存 ---------- */

export function StepRam({
  value, onPick,
}: {
  value: number | null;
  onPick: (ram: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      {RAM_OPTIONS.map((gb, i) => {
        const active = value === gb;
        return (
          <button
            key={gb}
            onClick={() => onPick(gb)}
            style={{ animationDelay: `${i * 45}ms` }}
            className={`group animate-fade-up rounded-sm border px-4 py-5 text-left transition-all duration-200 ${
              active
                ? "border-amber-core bg-amber-core/[0.08] shadow-[0_0_0_1px_rgba(245,168,60,0.4)]"
                : "border-ink-700 bg-ink-850 hover:-translate-y-0.5 hover:border-ink-600"
            }`}
          >
            <div className="flex items-baseline gap-1.5">
              <span className={`font-display text-3xl font-bold ${active ? "text-amber-hi" : "text-ink-100"}`}>
                {gb}
              </span>
              <span className="font-display text-sm font-semibold text-ink-400">GB</span>
            </div>
            {/* 容量可视化 */}
            <div className="mt-3 flex h-6 items-end gap-[3px]">
              {Array.from({ length: 8 }).map((_, j) => (
                <span
                  key={j}
                  className={`w-full rounded-[1px] transition-all duration-300 ${
                    j < Math.max(1, Math.round((gb / 64) * 8))
                      ? active
                        ? "bg-amber-core"
                        : "bg-ink-600 group-hover:bg-ink-500"
                      : "bg-ink-800"
                  }`}
                  style={{ height: `${30 + j * 9}%` }}
                />
              ))}
            </div>
            <div className="mt-2 text-[11px] text-ink-500">
              {gb <= 4 ? "老游戏 / 轻度网游" : gb === 6 ? "老网游尚可" : gb === 8 ? "网游流畅，新 3A 吃紧" : gb <= 16 ? "当前主流甜品容量" : "大型 3A / 多开无压力"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

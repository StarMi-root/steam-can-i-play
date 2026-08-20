import { useMemo, useState } from "react";
import {
  CPU_MODELS, CPU_TIERS, GPU_MODELS, GPU_TIERS, OS_OPTIONS, RAM_OPTIONS,
  OsId, cpuTierLabel, gpuTierLabel,
} from "../data/hardware";
import {
  AppleIcon, ArrowLeft, InfoIcon, LinuxIcon, SearchIcon, WindowsIcon,
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
              <span className="absolute right-3 top-3 h-2 w-2 animate-pop rounded-full bg-amber-core text-amber-core animate-led" />
            )}
          </button>
        );
      })}
      <div className="animate-fade-up rounded-sm border border-dashed border-ink-700 px-4 py-4 text-xs leading-relaxed text-ink-500 sm:col-span-2" style={{ animationDelay: "300ms" }}>
        <span className="font-bold text-ink-400">提示：</span>
        选择 Windows 7 / 8.1 时，要求 Win10 以上的新游戏会被自动排除；选择 macOS 或 Linux
        时只匹配原生支持的游戏。不确定的话，在「此电脑」上右键 → 属性即可查看。
      </div>
    </div>
  );
}

/* ---------- 第二/三步通用：硬件选择列表 ---------- */

function TierBadge({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`shrink-0 rounded-sm border px-1.5 py-0.5 font-display text-[10px] font-semibold tracking-wider ${tone}`}>
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

export function HardwarePicker({
  groups, tiers, selected, onPick, unitLabel, tierOf,
}: {
  groups: { brand: string; items: { name: string; score: number }[] }[];
  tiers: { name: string; desc: string; score: number }[];
  selected: string | null;
  onPick: (item: { name: string; score: number }) => void;
  unitLabel: string;
  tierOf: (score: number) => string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((it) => it.name.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  const empty = filtered.length === 0;

  return (
    <div>
      {/* 搜索 */}
      <div className="relative mb-4">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`输入${unitLabel}型号搜索，如 12400F / 4060…`}
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
              <span className="text-xs text-ink-600">试试右侧按档位选择，或换个关键词（如只输数字 3060）</span>
            </div>
          ) : (
            filtered.map((g) => (
              <div key={g.brand}>
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-ink-800 bg-ink-850/95 px-4 py-2 backdrop-blur">
                  <span className="font-display text-[11px] font-bold tracking-[0.2em] text-ink-400">
                    {g.brand}
                  </span>
                  <span className="h-px flex-1 bg-ink-700" />
                  <span className="text-[10px] text-ink-600">{g.items.length} 款</span>
                </div>
                <ul>
                  {g.items.map((it) => {
                    const active = selected === it.name;
                    return (
                      <li key={it.name} className="border-b border-ink-800/70 last:border-0">
                        <button
                          onClick={() => onPick(it)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            active
                              ? "bg-amber-core/[0.09] text-amber-hi"
                              : "text-ink-100 hover:bg-ink-800"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-amber-core" : "bg-ink-600"}`} />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.name}</span>
                          <TierBadge label={tierOf(it.score)} tone={TIER_TONES[tierOf(it.score)]} />
                          <span className="w-12 shrink-0 text-right font-display text-xs font-bold text-ink-400">
                            {it.score}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* 档位兜底 */}
        <div>
          <div className="mb-2 font-display text-[11px] font-semibold tracking-[0.22em] text-ink-400">
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
          <p className="mt-3 rounded-sm border border-ink-800 bg-ink-900/70 px-3 py-2.5 text-[11px] leading-relaxed text-ink-500">
            数字为相对性能指数（越大越强），用于和游戏最低配置对比。同档内误差对结果影响很小。
          </p>
        </div>
      </div>
    </div>
  );
}

export function StepCpu({
  value, onPick,
}: {
  value: { name: string; score: number } | null;
  onPick: (c: { name: string; score: number }) => void;
}) {
  const groups = [
    { brand: "INTEL", items: CPU_MODELS.filter((c) => c.brand === "Intel") },
    { brand: "AMD", items: CPU_MODELS.filter((c) => c.brand === "AMD") },
  ];
  return (
    <HardwarePicker
      groups={groups}
      tiers={CPU_TIERS}
      selected={value?.name ?? null}
      onPick={onPick}
      unitLabel="处理器"
      tierOf={cpuTierLabel}
    />
  );
}

export function StepGpu({
  value, onPick,
}: {
  value: { name: string; score: number } | null;
  onPick: (g: { name: string; score: number }) => void;
}) {
  const groups = [
    { brand: "NVIDIA", items: GPU_MODELS.filter((g) => g.brand === "NVIDIA") },
    { brand: "AMD RADEON", items: GPU_MODELS.filter((g) => g.brand === "AMD") },
    { brand: "INTEL / 核显", items: GPU_MODELS.filter((g) => g.brand === "Intel") },
  ];
  return (
    <HardwarePicker
      groups={groups}
      tiers={GPU_TIERS}
      selected={value?.name ?? null}
      onPick={onPick}
      unitLabel="显卡"
      tierOf={gpuTierLabel}
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {RAM_OPTIONS.map((gb, i) => {
        const active = value === gb;
        return (
          <button
            key={gb}
            onClick={() => onPick(gb)}
            style={{ animationDelay: `${i * 60}ms` }}
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
              {gb <= 4 ? "老游戏 / 轻度网游" : gb === 8 ? "网游流畅，新 3A 吃紧" : gb === 16 ? "当前主流甜品容量" : "大型 3A / 多开无压力"}
            </div>
          </button>
        );
      })}
    </div>
  );
}

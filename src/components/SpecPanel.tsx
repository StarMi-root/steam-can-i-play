import { Build, machineGrade } from "../lib/match";
import { cpuTierLabel, gpuTierLabel, OS_OPTIONS } from "../data/hardware";
import { CpuIcon, GpuIcon, MonitorIcon, RamIcon } from "./icons";

interface Props {
  build: Build;
  step: number;
  view: "wizard" | "result";
  onJump: (step: number) => void;
}

function Led({ state }: { state: "off" | "wait" | "on" }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
        state === "on"
          ? "bg-ok text-ok animate-led"
          : state === "wait"
            ? "bg-amber-core text-amber-core animate-led"
            : "bg-ink-600"
      }`}
    />
  );
}

function Meter({ value, max, tone }: { value: number; max: number; tone: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ink-700">
      <div
        className={`h-full origin-left rounded-full animate-bar-grow ${tone}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const rowState = (filled: boolean, active: boolean): "off" | "wait" | "on" =>
  filled ? "on" : active ? "wait" : "off";

export default function SpecPanel({ build, step, view, onJump }: Props) {
  const osName = build.os ? OS_OPTIONS.find((o) => o.id === build.os)?.name : null;
  const grade =
    build.cpu && build.gpu ? machineGrade(build.cpu.score, build.gpu.score) : null;

  const rows = [
    {
      icon: MonitorIcon,
      label: "操作系统",
      key: "OS",
      value: osName,
      done: !!build.os,
      jump: 0,
      meter: null as { v: number; max: number } | null,
      tier: null as string | null,
    },
    {
      icon: CpuIcon,
      label: "处理器",
      key: "CPU",
      value: build.cpu?.name ?? null,
      done: !!build.cpu,
      jump: 1,
      meter: build.cpu ? { v: build.cpu.score, max: 520 } : null,
      tier: build.cpu ? `${cpuTierLabel(build.cpu.score)} · ${build.cpu.score}` : null,
    },
    {
      icon: GpuIcon,
      label: "显卡",
      key: "GPU",
      value: build.gpu?.name ?? null,
      done: !!build.gpu,
      jump: 2,
      meter: build.gpu ? { v: build.gpu.score, max: 1600 } : null,
      tier: build.gpu ? `${gpuTierLabel(build.gpu.score)} · ${build.gpu.score}` : null,
    },
    {
      icon: RamIcon,
      label: "内存",
      key: "RAM",
      value: build.ram != null ? `${build.ram} GB` : null,
      done: build.ram != null,
      jump: 3,
      meter: build.ram != null ? { v: build.ram, max: 64 } : null,
      tier: null as string | null,
    },
  ];

  return (
    <aside className="rounded-md border border-ink-700 bg-ink-900/80 backdrop-blur-sm">
      {/* 面板头 */}
      <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
        <div>
          <div className="font-display text-[11px] font-semibold tracking-[0.22em] text-ink-400">
            SYSTEM PROFILE
          </div>
          <div className="text-sm font-bold text-ink-100">系统档案</div>
        </div>
        <div className="flex items-center gap-1.5 font-display text-[11px] text-ink-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-core text-teal-core animate-led" />
          LIVE
        </div>
      </div>

      {/* 条目 */}
      <div className="divide-y divide-ink-800 px-4">
        {rows.map((r, i) => {
          const active = view === "wizard" && step === r.jump;
          const state = rowState(r.done, active);
          return (
            <button
              key={r.key}
              onClick={() => r.done && onJump(r.jump)}
              disabled={!r.done}
              className={`group block w-full py-3 text-left transition-colors ${
                r.done ? "cursor-pointer hover:bg-ink-850" : "cursor-default"
              } -mx-4 px-4`}
            >
              <div className="flex items-center gap-2.5">
                <Led state={state} />
                <r.icon className="h-4 w-4 text-ink-400" />
                <span className="w-14 shrink-0 text-xs text-ink-400">{r.label}</span>
                {r.done ? (
                  <span key={r.value} className="min-w-0 flex-1 animate-pop truncate text-sm font-bold text-ink-100">
                    {r.value}
                  </span>
                ) : (
                  <span className={`flex-1 text-sm ${active ? "text-amber-core" : "text-ink-600"}`}>
                    {active ? "录入中" : "待录入"}
                    {active && <span className="ml-1 inline-block animate-blink">▍</span>}
                  </span>
                )}
                {r.done && (
                  <span className="text-[10px] text-ink-600 opacity-0 transition-opacity group-hover:opacity-100">
                    点击修改 ↺
                  </span>
                )}
              </div>
              {r.meter && (
                <>
                  <Meter
                    value={r.meter.v}
                    max={r.meter.max}
                    tone={r.key === "GPU" ? "bg-teal-core" : "bg-amber-core"}
                  />
                  {r.tier && (
                    <div className="mt-1 font-display text-[10px] tracking-wider text-ink-400">
                      {r.tier}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* 综合预估 */}
      <div className="border-t border-ink-700 px-4 py-3.5">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-[10px] font-semibold tracking-[0.22em] text-ink-400">
            ESTIMATED CLASS
          </span>
          {grade && (
            <span className={`font-display text-xs font-bold tracking-widest ${grade.tone}`}>
              {grade.tag}
            </span>
          )}
        </div>
        {grade ? (
          <div key={grade.grade} className="mt-1 animate-pop">
            <div className={`text-xl font-black ${grade.tone}`}>{grade.grade}</div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{grade.advice}</p>
          </div>
        ) : (
          <p className="mt-1 text-[11px] leading-relaxed text-ink-600">
            完成 CPU 与显卡录入后，这里会给出整机段位预估。
          </p>
        )}
      </div>
    </aside>
  );
}

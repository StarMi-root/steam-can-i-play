import { useMemo, useRef, useState } from "react";
import { GAMES } from "./data/games";
import { CPU_MODELS, GPU_MODELS, OS_OPTIONS } from "./data/hardware";
import { Build, EMPTY_BUILD, evaluateAll, osSupported } from "./lib/match";
import SpecPanel from "./components/SpecPanel";
import Results from "./components/Results";
import { StepOs, StepCpu, StepGpu, StepRam, StepShell } from "./components/Steps";
import { ArrowRight, CheckIcon, LogoMark } from "./components/icons";

const STEP_META = [
  { label: "系统", en: "OS" },
  { label: "处理器", en: "CPU" },
  { label: "显卡", en: "GPU" },
  { label: "内存", en: "RAM" },
];

function Stepper({
  step, done, onJump,
}: {
  step: number;
  done: boolean[];
  onJump: (i: number) => void;
}) {
  return (
    <ol className="mb-5 grid grid-cols-4 gap-2">
      {STEP_META.map((s, i) => {
        const isDone = done[i];
        const isCur = i === step;
        const clickable = isDone || i <= step;
        return (
          <li key={s.en}>
            <button
              disabled={!clickable}
              onClick={() => clickable && onJump(i)}
              className={`relative w-full rounded-sm border px-2 py-2 text-left transition-all sm:px-3 ${
                isCur
                  ? "border-amber-core/70 bg-amber-core/[0.07]"
                  : isDone
                    ? "border-ink-700 bg-ink-850 hover:border-ink-600"
                    : "border-ink-800 bg-ink-900/50"
              } ${!clickable ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-1.5">
                {isDone && !isCur ? (
                  <CheckIcon className="h-3 w-3 text-ok" />
                ) : (
                  <span className={`font-display text-[10px] font-bold ${isCur ? "text-amber-core" : "text-ink-500"}`}>
                    {i + 1}
                  </span>
                )}
                <span className={`text-xs font-bold ${isCur ? "text-amber-hi" : isDone ? "text-ink-100" : "text-ink-500"}`}>
                  {s.label}
                </span>
              </div>
              <div className="mt-0.5 hidden font-display text-[9px] tracking-[0.2em] text-ink-600 sm:block">
                {s.en}
              </div>
              {isCur && (
                <span className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden rounded-b-sm">
                  <span className="block h-full w-2/5 animate-scan bg-amber-core" />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export default function App() {
  const [view, setView] = useState<"wizard" | "result">("wizard");
  const [step, setStep] = useState(0);
  const [build, setBuild] = useState<Build>(EMPTY_BUILD);
  const timer = useRef<number | null>(null);

  const advance = (to: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStep(to), 330);
  };

  /** 手动跳转（取消挂起的自动前进，避免覆盖用户操作） */
  const jumpTo = (i: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    setStep(i);
  };

  const pickOs = (os: Build["os"]) => {
    setBuild((b) => ({ ...b, os }));
    advance(1);
  };
  const pickCpu = (cpu: NonNullable<Build["cpu"]>) => {
    setBuild((b) => ({ ...b, cpu }));
    advance(2);
  };
  const pickGpu = (gpu: NonNullable<Build["gpu"]>) => {
    setBuild((b) => ({ ...b, gpu }));
    advance(3);
  };
  const pickRam = (ram: number) => setBuild((b) => ({ ...b, ram }));

  const done = [!!build.os, !!build.cpu, !!build.gpu, build.ram != null];
  const ready = done.every(Boolean);

  const result = useMemo(
    () => (ready ? evaluateAll(build, GAMES) : null),
    [ready, build]
  );
  const totalSupported = useMemo(() => {
    const os = build.os;
    return os ? GAMES.filter((g) => osSupported(g, os)).length : 0;
  }, [build.os]);

  const startScan = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setView("result");
  };
  const backToEdit = () => {
    setView("wizard");
    setStep(0);
  };
  const restart = () => {
    setBuild(EMPTY_BUILD);
    setStep(0);
    setView("wizard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-ambient relative min-h-screen">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      {/* 顶部光线 */}
      <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-amber-deep via-amber-core to-teal-core animate-marquee-glow" />

      <div className="relative z-[5] mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        {/* 页头 */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-700 pb-5">
          <div className="flex items-center gap-3.5">
            <LogoMark className="h-11 w-11 text-amber-core" />
            <div>
              <h1 className="text-xl font-black leading-none tracking-wide text-ink-100">
                能不能玩<span className="mx-2 text-amber-core">·</span>
                <span className="font-display text-lg font-bold text-teal-core">CAN I PLAY</span>
              </h1>
              <p className="mt-1.5 text-xs text-ink-400">
                四步录入你的电脑配置，立刻知道 Steam 上哪些游戏跑得动
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 font-display text-[11px] tracking-wider text-ink-500">
            <span><b className="text-ink-300">{GAMES.length}</b> 款游戏</span>
            <span className="h-3 w-px bg-ink-700" />
            <span><b className="text-ink-300">{CPU_MODELS.length + GPU_MODELS.length}</b> 硬件样本</span>
            <span className="h-3 w-px bg-ink-700" />
            <span className="text-teal-core/80">MODEL v2.1</span>
          </div>
        </header>

        {/* 主体 */}
        <main className="mt-6 grid gap-6 lg:grid-cols-[290px_1fr]">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <SpecPanel build={build} step={step} view={view} onJump={(s) => { setView("wizard"); jumpTo(s); }} />
            {view === "wizard" && (
              <p className="mt-4 hidden px-1 text-[11px] leading-relaxed text-ink-600 lg:block">
                点击已点亮的条目可随时回头修改。所有数据保存在本地页面，不会上传。
              </p>
            )}
          </div>

          <div className="rounded-md border border-ink-700 bg-ink-900/70 px-5 py-6 backdrop-blur-sm sm:px-7 sm:py-7">
            {view === "result" && result ? (
              <Results
                build={build}
                playable={result.playable}
                rejected={result.rejected}
                totalSupported={totalSupported}
                onBack={backToEdit}
                onRestart={restart}
              />
            ) : (
              <>
                <Stepper step={step} done={done} onJump={jumpTo} />
                <div key={step}>
                  {step === 0 && (
                    <StepShell
                      index={1} en="OPERATING SYSTEM" title="你的电脑是什么系统？"
                      desc="操作系统决定了哪些游戏可以被安装运行。"
                      hint="在桌面「此电脑 / 我的电脑」图标上右键 → 属性，即可看到 Windows 版本；Mac 点击左上角苹果图标 → 关于本机。"
                    >
                      <StepOs value={build.os} onPick={pickOs} />
                    </StepShell>
                  )}
                  {step === 1 && (
                    <StepShell
                      index={2} en="PROCESSOR" title="处理器（CPU）是哪款？"
                      desc="选择最接近的型号即可，也可以直接按档位估算。"
                      hint="按下 Win + R 输入 dxdiag 回车，「系统」页会显示处理器型号；或打开任务管理器 → 性能 → CPU。"
                      onBack={() => setStep(0)}
                    >
                      <StepCpu value={build.cpu} onPick={pickCpu} />
                    </StepShell>
                  )}
                  {step === 2 && (
                    <StepShell
                      index={3} en="GRAPHICS CARD" title="显卡（GPU）是哪款？"
                      desc="显卡是游戏性能的第一决定因素。笔记本请选择对应的独显型号。"
                      hint="右键桌面 → 打开「任务管理器」→ 性能 → GPU，可以看到显卡型号；或 Win + R 输入 dxdiag 查看「显示」页。"
                      onBack={() => setStep(1)}
                    >
                      <StepGpu value={build.gpu} onPick={pickGpu} />
                    </StepShell>
                  )}
                  {step === 3 && (
                    <StepShell
                      index={4} en="MEMORY" title="内存有多大？"
                      desc="近年新游戏普遍要求 16GB，内存不足会明显卡顿。"
                      hint="在「此电脑」上右键 → 属性，「已安装的内存」一栏即是总容量；任务管理器 → 性能 → 内存也可以查看。"
                      onBack={() => setStep(2)}
                    >
                      <StepRam value={build.ram} onPick={pickRam} />
                    </StepShell>
                  )}
                </div>

                {/* 开始检测 */}
                {step === 3 && ready && (
                  <div className="mt-6 animate-fade-up">
                    <div className="flex flex-col items-center gap-3 rounded-sm border border-amber-core/40 bg-gradient-to-r from-amber-core/[0.1] via-transparent to-teal-core/[0.08] px-5 py-5 sm:flex-row sm:justify-between">
                      <div>
                        <div className="text-sm font-bold text-ink-100">
                          配置录入完成 · {OS_OPTIONS.find((o) => o.id === build.os)?.name}
                        </div>
                        <div className="mt-0.5 text-xs text-ink-400">
                          即将对 {totalSupported} 款支持该系统的游戏逐一比对
                        </div>
                      </div>
                      <button
                        onClick={startScan}
                        className="group flex items-center gap-2.5 rounded-sm bg-amber-core px-6 py-3 text-sm font-black text-ink-950 shadow-[0_0_24px_-6px_rgba(245,168,60,0.7)] transition-all hover:bg-amber-hi hover:shadow-[0_0_32px_-6px_rgba(245,168,60,0.9)] active:scale-[0.97]"
                      >
                        开始检测
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* 页脚 */}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink-800 pt-5 text-[11px] text-ink-600">
          <span>能不能玩 · CAN I PLAY — Steam 硬件游戏匹配器（非官方，与 Valve 无关）</span>
          <span className="font-display tracking-wider">LOCAL ONLY · NO UPLOAD · {GAMES.length} GAMES INDEXED</span>
        </footer>
      </div>
    </div>
  );
}

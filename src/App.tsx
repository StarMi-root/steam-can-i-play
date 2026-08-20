import { useEffect, useMemo, useRef, useState } from "react";
import { EXT_GAMES_KEY, GAMES, Game } from "./data/games";
import {
  CPU_MODELS, CUSTOM_GAMES_KEY, CUSTOM_HARDWARE_KEY, GPU_MODELS, OS_OPTIONS,
} from "./data/hardware";
import { Build, EMPTY_BUILD, evaluateAll, osSupported } from "./lib/match";
import SpecPanel from "./components/SpecPanel";
import Results from "./components/Results";
import AddGameModal from "./components/AddGameModal";
import { StepOs, StepCpu, StepGpu, StepRam, StepShell, HardwareItem } from "./components/Steps";
import { ArrowRight, CheckIcon, GlobeIcon, LogoMark, PlusIcon, RestartIcon } from "./components/icons";
import { NetError, probeNetwork } from "./lib/net";
import { UpdateProgress, updateGameLibrary } from "./lib/updater";

const STEP_META = [
  { label: "系统", en: "OS" },
  { label: "处理器", en: "CPU" },
  { label: "显卡", en: "GPU" },
  { label: "内存", en: "RAM" },
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

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
                  <span className="animate-scan block h-full w-2/5 bg-amber-core" />
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"online" | "manual">("online");

  const [customHardware, setCustomHardware] = useState<
    (HardwareItem & { kind: "cpu" | "gpu" })[]
  >(() => load(CUSTOM_HARDWARE_KEY, [] as (HardwareItem & { kind: "cpu" | "gpu" })[]));
  const [customGames, setCustomGames] = useState<Game[]>(() =>
    load(CUSTOM_GAMES_KEY, [] as Game[])
  );
  const [extGames, setExtGames] = useState<Game[]>(() => load(EXT_GAMES_KEY, [] as Game[]));
  const timer = useRef<number | null>(null);

  /* 一键更新游戏库 */
  const [updating, setUpdating] = useState<UpdateProgress | null>(null);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const cancelRef = useRef(false);
  const msgTimer = useRef<number | null>(null);

  /* 联网状态探测：让用户直观看到代理通道是否可用 */
  const [net, setNet] = useState<"checking" | "ok" | "down">("checking");
  const recheckNet = () => {
    setNet("checking");
    probeNetwork().then((ok) => setNet(ok ? "ok" : "down"));
  };
  useEffect(() => { recheckNet(); }, []);

  useEffect(() => {
    try { localStorage.setItem(CUSTOM_HARDWARE_KEY, JSON.stringify(customHardware)); } catch { /* 忽略配额错误 */ }
  }, [customHardware]);
  useEffect(() => {
    try { localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(customGames)); } catch { /* 忽略配额错误 */ }
  }, [customGames]);
  useEffect(() => {
    try { localStorage.setItem(EXT_GAMES_KEY, JSON.stringify(extGames)); } catch { /* 忽略配额错误 */ }
  }, [extGames]);

  const allGames = useMemo(() => {
    const seen = new Set<number>();
    const out: Game[] = [];
    for (const g of [...GAMES, ...extGames, ...customGames]) {
      if (!seen.has(g.id)) {
        seen.add(g.id);
        out.push(g);
      }
    }
    return out;
  }, [extGames, customGames]);
  const existingIds = useMemo(() => new Set(allGames.map((g) => g.id)), [allGames]);

  const advance = (to: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStep(to), 330);
  };

  /** 手动跳转（取消挂起的自动前进，避免覆盖用户操作） */
  const jumpTo = (i: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    setStep(i);
  };

  const pickOs = (os: Build["os"]) => { setBuild((b) => ({ ...b, os })); advance(1); };
  const pickCpu = (cpu: HardwareItem) => { setBuild((b) => ({ ...b, cpu })); advance(2); };
  const pickGpu = (gpu: HardwareItem) => { setBuild((b) => ({ ...b, gpu })); advance(3); };
  const pickRam = (ram: number) => setBuild((b) => ({ ...b, ram }));

  const addCustomHardware = (kind: "cpu" | "gpu") => (item: HardwareItem) => {
    setCustomHardware((cur) =>
      [{ ...item, kind }, ...cur.filter((c) => !(c.name === item.name && c.kind === kind))].slice(0, 60)
    );
  };
  const deleteCustomHardware = (kind: "cpu" | "gpu") => (name: string) =>
    setCustomHardware((cur) => cur.filter((c) => !(c.name === name && c.kind === kind)));

  const addCustomGame = (g: Game) => {
    setCustomGames((cur) => [g, ...cur.filter((c) => c.id !== g.id)]);
  };
  const deleteCustomGame = (id: number) =>
    setCustomGames((cur) => cur.filter((c) => c.id !== id));

  /* 一键更新游戏库：Steam 热门榜 → 详情 → 解析官方配置 → 入库 */
  const runUpdate = async () => {
    if (updating) return;
    cancelRef.current = false;
    setUpdating({ phase: "连接 Steam 榜单", done: 0, total: 0 });
    setUpdateMsg(null);
    try {
      const res = await updateGameLibrary(existingIds, setUpdating, () => cancelRef.current);
      if (res.added.length > 0) {
        setExtGames((cur) => {
          const seen = new Set([...GAMES, ...customGames, ...cur].map((g) => g.id));
          return [...res.added.filter((g) => !seen.has(g.id)), ...cur].slice(0, 600);
        });
      }
      const parts: string[] = [`新增 ${res.added.length} 款`];
      if (res.already > 0) parts.push(`已收录 ${res.already} 款`);
      if (res.skipped > 0) parts.push(`跳过 ${res.skipped} 款未公布配置`);
      if (res.failed > 0) parts.push(`${res.failed} 款拉取失败`);
      setUpdateMsg(`${cancelRef.current ? "已取消，部分完成：" : "游戏库更新完成："}${parts.join("，")}`);
    } catch (e) {
      setUpdateMsg(e instanceof NetError ? e.message : "更新失败，请稍后重试");
    } finally {
      setUpdating(null);
      if (msgTimer.current) window.clearTimeout(msgTimer.current);
      msgTimer.current = window.setTimeout(() => setUpdateMsg(null), 9000);
    }
  };

  const done = [!!build.os, !!build.cpu, !!build.gpu, build.ram != null];
  const ready = done.every(Boolean);

  const result = useMemo(
    () => (ready ? evaluateAll(build, allGames) : null),
    [ready, build, allGames]
  );
  const os = build.os;
  const totalSupported = useMemo(
    () => (os ? allGames.filter((g) => osSupported(g, os)).length : 0),
    [os, allGames]
  );

  const startScan = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setView("result");
  };
  const backToEdit = () => { setView("wizard"); setStep(0); };
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
      <div className="animate-marquee-glow absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-amber-deep via-amber-core to-teal-core" />

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
                四步录入配置，立刻知道 Steam 上哪些游戏跑得动
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={recheckNet}
              title="点击重新检测联网通道"
              className={`flex items-center gap-2 rounded-sm border px-3 py-2.5 font-display text-[11px] font-semibold tracking-wide transition-colors ${
                net === "ok"
                  ? "border-ok/40 bg-ok/[0.07] text-ok"
                  : net === "down"
                    ? "border-warn/40 bg-warn/[0.07] text-warn"
                    : "border-ink-700 bg-ink-850 text-ink-400"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  net === "ok" ? "animate-led bg-ok text-ok" : net === "down" ? "bg-warn text-warn" : "animate-pulse bg-ink-500"
                }`}
              />
              {net === "ok" ? "联网正常" : net === "down" ? "代理受限" : "检测中"}
            </button>
            <button
              onClick={() => { setModalMode("manual"); setModalOpen(true); }}
              title="不联网，直接填写游戏名、配置和图片，自动保存到本地游戏库"
              className="group flex items-center gap-2 rounded-sm border border-ink-600 bg-ink-850 px-3.5 py-2.5 text-sm font-bold text-ink-200 transition-all hover:-translate-y-0.5 hover:border-amber-core/60 hover:text-amber-core hover:shadow-[0_8px_24px_-10px_rgba(245,168,60,0.45)]"
            >
              <PlusIcon className="h-4 w-4 transition-transform group-hover:rotate-90" />
              手动添加游戏
            </button>
            <button
              onClick={() => { setModalMode("online"); setModalOpen(true); }}
              title="通过 Steam 官方 API 搜索并导入游戏"
              className="group flex items-center gap-2 rounded-sm border border-teal-core/50 bg-teal-core/[0.08] px-3.5 py-2.5 text-sm font-bold text-teal-core transition-all hover:-translate-y-0.5 hover:bg-teal-core/[0.16] hover:shadow-[0_8px_24px_-10px_rgba(61,220,211,0.5)]"
            >
              <GlobeIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
              联网添加
              {customGames.length > 0 && (
                <span className="font-display rounded-sm bg-teal-core px-1.5 py-0.5 text-[10px] font-bold text-ink-950">
                  {customGames.length}
                </span>
              )}
            </button>
            <button
              onClick={runUpdate}
              disabled={!!updating}
              title="从 Steam 官方热销榜 + 历史最热 Top100 批量导入游戏，自动解析官方配置（需代理可用）"
              className="group flex items-center gap-2 rounded-sm border border-amber-core/60 bg-amber-core/[0.09] px-3.5 py-2.5 text-sm font-bold text-amber-core transition-all hover:-translate-y-0.5 hover:bg-amber-core/[0.18] hover:shadow-[0_8px_24px_-10px_rgba(245,168,60,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RestartIcon
                className={`h-4 w-4 ${updating ? "animate-spin" : "transition-transform duration-500 group-hover:rotate-180"}`}
              />
              {updating ? "更新中…" : "一键更新游戏库"}
            </button>
            <div className="hidden font-display text-[11px] tracking-wider text-ink-500 md:block">
              <div><b className="text-ink-300">{allGames.length}</b> 款游戏</div>
              <div className="mt-0.5"><b className="text-ink-300">{CPU_MODELS.length + GPU_MODELS.length}</b> 硬件样本</div>
            </div>
          </div>
        </header>

        {/* 游戏库更新进度 */}
        {updating && (
          <div className="mt-4 animate-fade-up rounded-sm border border-amber-core/40 bg-ink-900/85 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 font-bold text-amber-core">
                <RestartIcon className="h-3.5 w-3.5 animate-spin" />
                {updating.phase}
                {updating.total > 0 && (
                  <span className="font-display text-ink-300">
                    {updating.done} / {updating.total}
                  </span>
                )}
              </span>
              <button
                onClick={() => { cancelRef.current = true; }}
                className="rounded-sm border border-ink-700 px-2.5 py-1 text-ink-400 transition-colors hover:border-bad/50 hover:text-bad"
              >
                取消
              </button>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-750">
              <div
                className={`h-full rounded-full bg-gradient-to-r from-amber-deep to-amber-core transition-all duration-300 ${
                  updating.total === 0 ? "w-1/3 animate-pulse" : ""
                }`}
                style={updating.total > 0 ? { width: `${Math.max(3, Math.round((updating.done / updating.total) * 100))}%` } : undefined}
              />
            </div>
          </div>
        )}

        {/* 主体 */}
        <main className="mt-6 grid gap-6 lg:grid-cols-[290px_1fr]">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <SpecPanel build={build} step={step} view={view} onJump={(s) => { setView("wizard"); jumpTo(s); }} />
            {view === "wizard" && (
              <p className="mt-4 hidden px-1 text-[11px] leading-relaxed text-ink-600 lg:block">
                点击已点亮的条目可随时回头修改。自定义硬件与游戏保存在本机浏览器，不会上传。
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
                onAddGame={() => { setModalMode("online"); setModalOpen(true); }}
                onDeleteCustomGame={deleteCustomGame}
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
                      desc={`内置 ${CPU_MODELS.length} 款常见型号，列表里没有的可以手动添加任意型号。`}
                      hint="按下 Win + R 输入 dxdiag 回车，「系统」页会显示处理器型号；或打开任务管理器 → 性能 → CPU。"
                      onBack={() => jumpTo(0)}
                    >
                      <StepCpu
                        value={build.cpu} onPick={pickCpu}
                        customItems={customHardware.filter((c) => c.kind === "cpu")}
                        onAddCustom={addCustomHardware("cpu")}
                        onDeleteCustom={deleteCustomHardware("cpu")}
                      />
                    </StepShell>
                  )}
                  {step === 2 && (
                    <StepShell
                      index={3} en="GRAPHICS CARD" title="显卡（GPU）是哪款？"
                      desc={`内置 ${GPU_MODELS.length} 款显卡，从亮机卡到旗舰全覆盖；笔记本请选择对应的独显型号。`}
                      hint="右键桌面 → 打开「任务管理器」→ 性能 → GPU，可以看到显卡型号；或 Win + R 输入 dxdiag 查看「显示」页。"
                      onBack={() => jumpTo(1)}
                    >
                      <StepGpu
                        value={build.gpu} onPick={pickGpu}
                        customItems={customHardware.filter((c) => c.kind === "gpu")}
                        onAddCustom={addCustomHardware("gpu")}
                        onDeleteCustom={deleteCustomHardware("gpu")}
                      />
                    </StepShell>
                  )}
                  {step === 3 && (
                    <StepShell
                      index={4} en="MEMORY" title="内存有多大？"
                      desc="近年新游戏普遍要求 16GB，内存不足会明显卡顿。"
                      hint="在「此电脑」上右键 → 属性，「已安装的内存」一栏即是总容量；任务管理器 → 性能 → 内存也可以查看。"
                      onBack={() => jumpTo(2)}
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
                          {customGames.length > 0 && <span className="text-teal-core">（含 {customGames.length} 款你添加的游戏）</span>}
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
          <span className="font-display tracking-wider">
            LOCAL FIRST · 内置 {GAMES.length} + 在线导入 {extGames.length} + 手动 {customGames.length} = {allGames.length} GAMES · {CPU_MODELS.length + GPU_MODELS.length} HW
          </span>
        </footer>
      </div>

      {/* 更新结果提示 */}
      {updateMsg && (
        <div className="animate-fade-up fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-sm border border-ink-600 bg-ink-900 px-4 py-3 text-xs leading-relaxed text-ink-100 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.9)]">
          <span className="animate-led mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-core text-amber-core" />
          <span>{updateMsg}</span>
          <button onClick={() => setUpdateMsg(null)} className="ml-1 shrink-0 text-ink-500 transition-colors hover:text-ink-100">
            关闭
          </button>
        </div>
      )}

      <AddGameModal
        open={modalOpen}
        initialMode={modalMode}
        onClose={() => setModalOpen(false)}
        onAdd={addCustomGame}
        existingIds={existingIds}
      />
    </div>
  );
}

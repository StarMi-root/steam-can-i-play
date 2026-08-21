/*
 * Copyright (C) 2026 王博
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
//不是，这小坨代码，一大片红的时候下死我了，在这个文件里用终端npm install就可以解决

import { useEffect, useMemo, useRef, useState } from "react";
import { EXT_GAMES_KEY, GAMES, Game } from "./data/games";
import {
  CPU_MODELS, CUSTOM_GAMES_KEY, CUSTOM_HARDWARE_KEY, GPU_MODELS, OS_OPTIONS, isLinuxId,
} from "./data/hardware";
import { Build, EMPTY_BUILD, evaluateAll, osSupported } from "./lib/match";
import SpecPanel, { SpecBar } from "./components/SpecPanel";
import Results from "./components/Results";
import AddGameModal from "./components/AddGameModal";
import UpdateModal from "./components/UpdateModal";
import LinuxGuideModal from "./components/LinuxGuide";
import CheckGameModal from "./components/CheckGameModal";
import AiChat from "./components/AiChat";
import Toolbox from "./components/Toolbox";
import SteamAccount from "./components/SteamAccount";
import { StepOs, StepCpu, StepGpu, StepRam, StepShell, StepMobo, HardwareItem, MoboPick } from "./components/Steps";
import { ArrowRight, CheckIcon, ChipIcon, GaugeIcon, GlobeIcon, LogoMark, PlusIcon, RestartIcon, SteamIcon, TerminalIcon } from "./components/icons";
import DeployModal from "./components/DeployModal";
import { probeNetwork } from "./lib/net";
import NetworkPanel from "./components/NetworkPanel";
import { STEAM_CONN_KEY, SteamConn, SteamOwnedGame, fetchOwnedGames } from "./lib/steam";

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
  const [updateOpen, setUpdateOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [mobo, setMobo] = useState<MoboPick | null>(null);

  /* Steam 账户接入 */
  const [steamConn, setSteamConn] = useState<SteamConn | null>(() => {
    try {
      const raw = localStorage.getItem(STEAM_CONN_KEY);
      return raw ? (JSON.parse(raw) as SteamConn) : null;
    } catch { return null; }
  });
  const [steamOpen, setSteamOpen] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [ownedGames, setOwnedGames] = useState<SteamOwnedGame[] | null>(null);
  useEffect(() => {
    if (!steamConn) { setOwnedGames(null); return; }
    let alive = true;
    fetchOwnedGames(steamConn.key, steamConn.steamid)
      .then((g) => { if (alive) setOwnedGames(g); })
      .catch(() => { if (alive) setOwnedGames([]); });
    return () => { alive = false; };
  }, [steamConn]);

  const [customHardware, setCustomHardware] = useState<
    (HardwareItem & { kind: "cpu" | "gpu" })[]
  >(() => load(CUSTOM_HARDWARE_KEY, [] as (HardwareItem & { kind: "cpu" | "gpu" })[]));
  const [customGames, setCustomGames] = useState<Game[]>(() =>
    load(CUSTOM_GAMES_KEY, [] as Game[])
  );
  const [extGames, setExtGames] = useState<Game[]>(() => load(EXT_GAMES_KEY, [] as Game[]));
  const timer = useRef<number | null>(null);

  /* 联网状态探测：让用户直观看到代理通道是否可用 */
  const [net, setNet] = useState<"checking" | "ok" | "down">("checking");
  const [netOpen, setNetOpen] = useState(false);
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

  const isLinux = !!(build.os && isLinuxId(build.os));

  const pickOs = (os: Build["os"]) => { setBuild((b) => ({ ...b, os })); advance(1); };
  const pickCpu = (cpu: HardwareItem) => { setBuild((b) => ({ ...b, cpu })); advance(2); };
  const pickGpu = (gpu: HardwareItem) => { setBuild((b) => ({ ...b, gpu })); advance(3); };
  const pickRam = (ram: number) => {
    setBuild((b) => ({ ...b, ram }));
    if (build.os && isLinuxId(build.os)) advance(4); // Linux 用户进入主板录入附加步骤
  };

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

  /** 更新弹窗回调：把在线导入的游戏并入本地扩展库 */
  const onLibraryUpdated = (games: Game[]) => {
    setExtGames((cur) => {
      const seen = new Set([...GAMES, ...customGames, ...cur].map((g) => g.id));
      return [...games.filter((g) => !seen.has(g.id)), ...cur].slice(0, 600);
    });
  };

  const done = [!!build.os, !!build.cpu, !!build.gpu, build.ram != null];
  const ready = done.every(Boolean);
  const canScan = ready && (!isLinux || step >= 4);

  const result = useMemo(
    () => (ready ? evaluateAll(build, allGames) : null),
    [ready, build, allGames]
  );
  const os = build.os;
  const totalSupported = useMemo(
    () => (os ? allGames.filter((g) => osSupported(g, os)).length : 0),
    [os, allGames]
  );

  /* Steam 库 × 匹配结果交叉统计 */
  const ownedIds = useMemo(() => new Set((ownedGames ?? []).map((g) => g.appid)), [ownedGames]);
  const playableIds = useMemo(() => new Set((result?.playable ?? []).map((f) => f.game.id)), [result]);
  const steamStats = useMemo(() => {
    if (!ownedGames) return null;
    const inLib = ownedGames.filter((g) => existingIds.has(g.appid)).length;
    const playable = ownedGames.filter((g) => playableIds.has(g.appid)).length;
    return { total: ownedGames.length, inLib, playable };
  }, [ownedGames, existingIds, playableIds]);

  /* 供 AI 助手读取的硬件档案上下文 */
  const aiContext = useMemo(() => {
    const parts: string[] = [];
    if (build.os) parts.push(`操作系统：${OS_OPTIONS.find((o) => o.id === build.os)?.name ?? build.os}`);
    if (build.cpu) parts.push(`CPU：${build.cpu.name}`);
    if (build.gpu) parts.push(`GPU：${build.gpu.name}`);
    if (build.ram != null) parts.push(`内存：${build.ram} GB`);
    if (mobo) parts.push(`主板：${mobo.brand} · ${mobo.chipset}`);
    if (result) {
      const perfect = result.playable.filter((f) => f.level === "perfect").length;
      parts.push(`匹配结果：${totalSupported} 款支持游戏中 ${result.playable.length} 款可玩（其中完美运行 ${perfect} 款），${result.rejected.length} 款带不动`);
    }
    if (steamConn && ownedGames) parts.push(`Steam 账户库：共 ${ownedGames.length} 款游戏，其中 ${steamStats?.playable ?? 0} 款当前配置可玩`);
    return parts.length > 0 ? parts.join("\n") : undefined;
  }, [build, mobo, result, totalSupported, steamConn, ownedGames, steamStats]);

  const startScan = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setView("result");
  };
  const backToEdit = () => { setView("wizard"); setStep(0); };
  const restart = () => {
    setBuild(EMPTY_BUILD);
    setMobo(null);
    setStep(0);
    setView("wizard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showMoboStep = isLinux && step === 4;

  return (
    <div className="bg-ambient relative min-h-screen">
      <div className="bg-grid pointer-events-none absolute inset-0" />
      {/* 顶部光线 */}
      <div className="animate-marquee-glow absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-amber-deep via-amber-core to-teal-core" />

      <div className="relative z-[5] mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 sm:pt-6">
        {/* 页头 */}
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-ink-700 pb-5">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10 text-amber-core sm:h-11 sm:w-11" />
            <div>
              <h1 className="text-lg font-black leading-none tracking-wide text-ink-100 sm:text-xl">
                能不能玩<span className="mx-2 text-amber-core">·</span>
                <span className="font-display text-base font-bold text-teal-core sm:text-lg">CAN I PLAY</span>
              </h1>
              <p className="mt-1.5 text-[11px] text-ink-400 sm:text-xs">
                录入配置，立刻知道 Steam 上哪些游戏跑得动
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setNetOpen(true)}
              title="网络通道设置：配置自定义代理、查看各通道健康度、重新探测"
              className={`flex items-center gap-2 rounded-sm border px-2.5 py-2 font-display text-[10px] font-semibold tracking-wide transition-colors sm:px-3 sm:text-[11px] ${
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
              onClick={() => setSteamOpen(true)}
              title="连接 Steam 账户：查看游戏库、好友、交叉匹配"
              className={`group flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5 sm:px-3.5 sm:text-sm ${
                steamConn
                  ? "border-steam/60 bg-steam/[0.1] text-steam hover:bg-steam/[0.18]"
                  : "border-ink-600 bg-ink-850 text-ink-300 hover:border-steam/50 hover:text-steam"
              }`}
            >
              {steamConn?.avatar ? (
                <img src={steamConn.avatar} alt="" className="h-4 w-4 rounded-full" />
              ) : (
                <SteamIcon className="h-4 w-4" />
              )}
              <span className="max-w-[7rem] truncate">{steamConn ? steamConn.persona : "Steam 账户"}</span>
              {steamConn && <span className="animate-led h-1.5 w-1.5 rounded-full bg-ok" />}
            </button>
            <button
              onClick={() => setCheckOpen(true)}
              title="实时连接 Steam，查询任意一款游戏的官方配置并立刻对比你的硬件"
              className="group flex items-center gap-2 rounded-sm border border-teal-core/60 bg-teal-core/[0.1] px-3 py-2 text-xs font-black text-teal-core transition-all hover:-translate-y-0.5 hover:bg-teal-core/[0.18] hover:shadow-[0_8px_24px_-10px_rgba(63,208,201,0.6)] sm:px-3.5 sm:text-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-core opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-core" />
              </span>
              <GaugeIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
              实时检测
            </button>
            <button
              onClick={() => { setModalMode("manual"); setModalOpen(true); }}
              title="不联网，直接填写游戏名、配置和图片，自动保存到本地游戏库"
              className="group flex items-center gap-2 rounded-sm border border-ink-600 bg-ink-850 px-3 py-2 text-xs font-bold text-ink-200 transition-all hover:-translate-y-0.5 hover:border-amber-core/60 hover:text-amber-core hover:shadow-[0_8px_24px_-10px_rgba(245,168,60,0.45)] sm:px-3.5 sm:text-sm"
            >
              <PlusIcon className="h-4 w-4 transition-transform group-hover:rotate-90" />
              手动添加游戏
            </button>
            <button
              onClick={() => setDeployOpen(true)}
              title="在 Linux 服务器上一键部署本站并开放外网访问（引导式 TUI）"
              className="group flex items-center gap-2 rounded-sm border border-ink-700 bg-ink-900 px-3 py-2 text-xs font-bold text-ink-300 transition-all hover:-translate-y-0.5 hover:border-teal-core/60 hover:text-teal-core hover:shadow-[0_8px_24px_-10px_rgba(61,220,211,0.4)] sm:px-3.5 sm:text-sm"
            >
              <TerminalIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
              部署到 Linux
            </button>
            <button
              onClick={() => { setModalMode("online"); setModalOpen(true); }}
              title="通过 Steam 官方 API 或 PCGamingWiki 第三方搜索导入游戏"
              className="group flex items-center gap-2 rounded-sm border border-teal-core/50 bg-teal-core/[0.08] px-3 py-2 text-xs font-bold text-teal-core transition-all hover:-translate-y-0.5 hover:bg-teal-core/[0.16] hover:shadow-[0_8px_24px_-10px_rgba(61,220,211,0.5)] sm:px-3.5 sm:text-sm"
            >
              <GlobeIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
              联网添加
              {(customGames.length + extGames.length) > 0 && (
                <span className="font-display rounded-sm bg-teal-core px-1.5 py-0.5 text-[10px] font-bold text-ink-950">
                  {customGames.length + extGames.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setUpdateOpen(true)}
              title="从 SteamSpy（第三方）/ Steam 官方榜单批量导入，自动解析官方配置"
              className="group flex items-center gap-2 rounded-sm border border-amber-core/60 bg-amber-core/[0.09] px-3 py-2 text-xs font-bold text-amber-core transition-all hover:-translate-y-0.5 hover:bg-amber-core/[0.18] hover:shadow-[0_8px_24px_-10px_rgba(245,168,60,0.6)] sm:px-3.5 sm:text-sm"
            >
              <RestartIcon className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
              一键更新游戏库
            </button>
            <div className="hidden font-display text-[11px] tracking-wider text-ink-500 xl:block">
              <div><b className="text-ink-300">{allGames.length}</b> 款游戏</div>
              <div className="mt-0.5"><b className="text-ink-300">{CPU_MODELS.length + GPU_MODELS.length}</b> 硬件样本</div>
            </div>
          </div>
        </header>

        {/* 主体 */}
        <main className="mt-5 grid gap-5 sm:mt-6 lg:grid-cols-[290px_1fr] lg:gap-6">
          {/* 桌面端：系统档案面板 */}
          <div className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
            <SpecPanel build={build} step={step} view={view} onJump={(s) => { setView("wizard"); jumpTo(s); }} />
            {view === "wizard" && (
              <p className="mt-4 px-1 text-[11px] leading-relaxed text-ink-600">
                点击已点亮的条目可随时回头修改。自定义硬件与游戏保存在本机浏览器，不会上传。
              </p>
            )}
            <Toolbox os={build.os} />
          </div>

          <div className="min-w-0">
            {/* 移动端：紧凑档案条 */}
            {view === "wizard" && (
              <div className="mb-4 lg:hidden">
                <SpecBar build={build} onJump={(s) => { setView("wizard"); jumpTo(s); }} />
              </div>
            )}

            <div className="rounded-md border border-ink-700 bg-ink-900/70 px-4 py-5 backdrop-blur-sm sm:px-7 sm:py-7">
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
                  onOpenGuide={isLinux ? () => setGuideOpen(true) : undefined}
                  steamStats={steamStats}
                  ownedIds={steamConn ? ownedIds : null}
                  onOpenSteam={() => setSteamOpen(true)}
                />
              ) : (
                <>
                  {step <= 3 && <Stepper step={step} done={done} onJump={jumpTo} />}
                  <div key={step}>
                    {step === 0 && (
                      <StepShell
                        index={1} en="OPERATING SYSTEM" title="你的电脑是什么系统？"
                        desc="有时候啊，大游戏除了硬件，还得关注操作系统（还要关注bilibili:星米StarMi)；Linux 请选择具体发行版。"
                        hint="Windows：在「此电脑」上右键 → 属性；macOS：左上角苹果 → 关于本机；Linux：终端执行 cat /etc/os-release。"
                      >
                        <StepOs value={build.os} onPick={pickOs} />
                      </StepShell>
                    )}
                    {step === 1 && (
                      <StepShell
                        index={2} en="PROCESSOR" title="处理器（CPU）是哪款？"
                        desc={`内置 ${CPU_MODELS.length} 款常见型号，列表里没有的可以手动添加任意型号（自动联网查分)你这CPU多小众啊。`}
                        //我服了还要给小众CPU喂饭吃
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
                        index={4} en="MEMORY" title="内存有多大？别告诉我你家用电脑1TB"
                        desc="近年新游戏普遍要求 16GB，内存不足会明显卡顿。"
                        hint="在「此电脑」上右键 → 属性，「已安装的内存」一栏即是总容量；任务管理器 → 性能 → 内存也可以查看。"
                        onBack={() => jumpTo(2)}
                      >
                        <StepRam value={build.ram} onPick={pickRam} />
                      </StepShell>
                    )}
                    {showMoboStep && (
                      <StepShell
                        index={5} total={5} en="MOTHERBOARD · LINUX 附加步骤" title="录入主板，生成启动教程"
                        desc="选择主板品牌与芯片组，将据此生成包含驱动、Proton 与 BIOS 调试的专属 Linux 启动教程。"
                        hint="主板型号印在主板正面或包装盒上；终端执行 sudo dmidecode -t baseboard 也能查到。"
                        onBack={() => jumpTo(3)}
                      >
                        <StepMobo
                          value={mobo}
                          onPick={(m) => { setMobo(m); window.setTimeout(startScan, 380); }}
                          onSkip={() => { setMobo({ brand: "其他 / 不确定", chipset: "不确定" }); window.setTimeout(startScan, 380); }}
                        />
                      </StepShell>
                    )}
                  </div>

                  {/* Linux 用户：内存完成后的下一步引导 */}
                  {isLinux && step === 3 && ready && (
                    <div className="mt-6 animate-fade-up">
                      <div className="flex flex-col items-center gap-3 rounded-sm border border-teal-core/40 bg-gradient-to-r from-teal-core/[0.08] via-transparent to-amber-core/[0.08] px-5 py-5 sm:flex-row sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-bold text-ink-100">
                            <ChipIcon className="h-4 w-4 text-teal-core" />
                            Linux 附加步骤：录入主板
                          </div>
                          <div className="mt-0.5 text-xs text-ink-400">
                            完成后将生成 {OS_OPTIONS.find((o) => o.id === build.os)?.name} 专属启动教程
                          </div>
                        </div>
                        <button
                          onClick={() => jumpTo(4)}
                          className="group flex items-center gap-2.5 rounded-sm bg-teal-core px-6 py-3 text-sm font-black text-ink-950 transition-all hover:brightness-110 active:scale-[0.97]"
                        >
                          下一步
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 开始检测 */}
                  {canScan && step >= 3 && !showMoboStep && (
                    <div className="mt-6 animate-fade-up">
                      <div className="flex flex-col items-center gap-3 rounded-sm border border-amber-core/40 bg-gradient-to-r from-amber-core/[0.1] via-transparent to-teal-core/[0.08] px-5 py-5 sm:flex-row sm:justify-between">
                        <div>
                          <div className="text-sm font-bold text-ink-100">
                            配置录入完成 · {OS_OPTIONS.find((o) => o.id === build.os)?.name}
                            {isLinux && mobo && <span className="ml-2 font-display text-[11px] text-teal-core">{mobo.brand} · {mobo.chipset}</span>}
                          </div>
                          <div className="mt-0.5 text-xs text-ink-400">
                            即将对 {totalSupported} 款支持该系统的游戏逐一比对
                            {(customGames.length + extGames.length) > 0 && (
                              <span className="text-teal-core">（含 {customGames.length + extGames.length} 款你添加的游戏）</span>
                            )}
                            {isLinux && <span className="text-teal-core"> · 报告页可打开 Linux 启动教程</span>}
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

      <CheckGameModal
        open={checkOpen}
        onClose={() => setCheckOpen(false)}
        build={build}
        buildReady={ready}
        onAdd={addCustomGame}
        existingIds={existingIds}
      />

      <AddGameModal
        open={modalOpen}
        initialMode={modalMode}
        onClose={() => setModalOpen(false)}
        onAdd={addCustomGame}
        existingIds={existingIds}
      />

      <UpdateModal
        open={updateOpen}
        onClose={() => setUpdateOpen(false)}
        existingIds={existingIds}
        onAdded={onLibraryUpdated}
      />

      <LinuxGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        distroId={build.os ?? "ubuntu"}
        brand={mobo?.brand ?? "其他 / 不确定"}
        chipset={mobo?.chipset ?? "不确定"}
        gpuName={build.gpu?.name}
      />

      <SteamAccount
        open={steamOpen}
        onClose={() => setSteamOpen(false)}
        conn={steamConn}
        onConn={setSteamConn}
        playableIds={playableIds}
        libraryIds={existingIds}
        allGames={allGames}
      />

      <NetworkPanel
        open={netOpen}
        onClose={() => setNetOpen(false)}
        onStatus={(ok) => setNet(ok ? "ok" : "down")}
      />

      <DeployModal open={deployOpen} onClose={() => setDeployOpen(false)} />

      <AiChat context={aiContext} />
    </div>
  );
}

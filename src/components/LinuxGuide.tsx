import { useEffect, useState } from "react";
import { GuideSection, LINUX_DISTROS, buildLinuxGuide, gpuVendorOf } from "../data/linux";
import { CopyIcon, LinuxIcon } from "./icons";

function CmdLine({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* 剪贴板不可用时忽略 */ }
  };
  return (
    <div className="mt-1.5 flex items-start gap-2 rounded-sm border border-ink-700 bg-ink-950 px-3 py-2">
      <code className="min-w-0 flex-1 break-all font-display text-[11px] leading-relaxed text-teal-core">{cmd}</code>
      <button
        onClick={copy}
        title="复制命令"
        className={`shrink-0 rounded-sm border p-1.5 transition-colors ${
          copied ? "border-ok/50 text-ok" : "border-ink-700 text-ink-500 hover:border-ink-600 hover:text-ink-200"
        }`}
      >
        <CopyIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Section({ s, delay }: { s: GuideSection; delay: number }) {
  return (
    <section className="animate-fade-up rounded-sm border border-ink-700 bg-ink-850/70 p-4" style={{ animationDelay: `${delay}ms` }}>
      <h4 className="font-display text-sm font-bold tracking-wide text-amber-hi">{s.title}</h4>
      <ul className="mt-2.5 space-y-2.5">
        {s.steps.map((st, i) => (
          <li key={i}>
            <div className="flex gap-2 text-xs leading-relaxed text-ink-200">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-core" />
              <span>{st.text}</span>
            </div>
            {st.cmd && <div className="ml-3"><CmdLine cmd={st.cmd} /></div>}
            {st.note && <p className="ml-3 mt-1 text-[11px] leading-relaxed text-ink-500">※ {st.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function LinuxGuideModal({
  open, onClose, distroId, brand, chipset, gpuName,
}: {
  open: boolean;
  onClose: () => void;
  distroId: string;
  brand: string;
  chipset: string;
  gpuName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const distro = LINUX_DISTROS.find((d) => d.id === distroId);
  const vendor = gpuVendorOf(gpuName);
  const sections = buildLinuxGuide(distroId as never, brand, chipset, gpuName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/80 px-3 py-6 backdrop-blur-sm sm:px-4 sm:py-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-fade-up w-full max-w-2xl rounded-md border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="border-b border-ink-700 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 font-display text-[10px] font-semibold tracking-[0.28em] text-teal-core">
                <LinuxIcon className="h-4 w-4" /> LINUX BOOT GUIDE
              </div>
              <h3 className="mt-1 text-lg font-black text-ink-100">
                {distro?.name ?? "Linux"} 专属启动教程
              </h3>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-display text-[11px] text-ink-400">
                <span>主板 <b className="text-ink-200">{brand}</b></span>
                <span>芯片组 <b className="text-ink-200">{chipset}</b></span>
                <span>显卡 <b className="text-ink-200">{vendor === "nvidia" ? "NVIDIA（专有驱动路线）" : vendor === "amd" ? "AMD（开源 Mesa 路线）" : vendor === "intel" ? "Intel（开源 Mesa 路线）" : "未识别厂商"}</b></span>
              </div>
            </div>
            <button onClick={onClose} className="rounded-sm border border-ink-700 px-2.5 py-1 text-sm text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
              关闭
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
          <p className="rounded-sm border border-teal-core/30 bg-teal-core/[0.06] px-3 py-2.5 text-[11px] leading-relaxed text-ink-300">
            按顺序执行即可在 <b className="text-teal-core">{distro?.name}</b> 上跑起 Steam 游戏（含大量 Windows 游戏经 Proton 转译运行）。
            命令右侧按钮可一键复制；卡住的地方直接问右下角 <b className="text-amber-core">AI 助手</b>。
          </p>
          {sections.map((s, i) => <Section key={s.title} s={s} delay={i * 70} />)}
        </div>

        <div className="border-t border-ink-700 px-5 py-3 text-[11px] text-ink-600">
          教程依据发行版包管理器、主板品牌 BIOS 习惯与芯片组年代自动生成 · 本机生成，不上传任何信息
        </div>
      </div>
    </div>
  );
}

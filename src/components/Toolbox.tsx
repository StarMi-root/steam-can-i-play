import { useState } from "react";
import { OsId, isLinuxId } from "../data/hardware";
import { CheckIcon, CopyIcon, ExternalIcon, UploadIcon } from "./icons";

const LINKS = [
  { name: "CPU-Z", desc: "查处理器 / 主板型号", url: "https://www.cpuid.com/softwares/cpu-z.html" },
  { name: "GPU-Z", desc: "查显卡详细参数", url: "https://www.techpowerup.com/gpuz/" },
  { name: "DDU", desc: "彻底卸载旧显卡驱动", url: "https://www.wagnardsoft.com/display-driver-uninstaller-ddu" },
  { name: "SteamDB", desc: "游戏史低价格查询", url: "https://steamdb.info/" },
  { name: "ProtonDB", desc: "Linux 游戏兼容性社区", url: "https://www.protondb.com/" },
  { name: "PCGamingWiki", desc: "游戏问题百科 / 修复", url: "https://www.pcgamingwiki.com/" },
  { name: "DXVK", desc: "DX9/10/11 转 Vulkan", url: "https://github.com/doitsujin/dxvk/releases" },
  { name: "inxi", desc: "Linux 硬件报告工具", url: "https://github.com/smxi/inxi" },
];

const WIN_CMDS: [string, string][] = [
  ["dxdiag", "查看 CPU / 显卡 / 系统版本"],
  ["taskmgr → 性能", "实时查看 CPU / GPU / 内存占用"],
  ["wmic memorychip get capacity", "查内存条容量"],
  ["wmic baseboard get product", "查主板型号"],
];

const LINUX_CMDS: [string, string][] = [
  ["lscpu", "CPU 型号 / 核心数"],
  ["sudo lspci -k | grep -A2 VGA", "显卡型号与驱动"],
  ["sudo dmidecode -t baseboard", "主板品牌 / 型号"],
  ["free -h", "内存容量"],
  ["inxi -G", "GPU 与驱动概览"],
];

export default function Toolbox({ os }: { os: OsId | null }) {
  const [copied, setCopied] = useState<string | null>(null);
  const isLinux = os ? isLinuxId(os) : false;
  const cmds = isLinux ? LINUX_CMDS : WIN_CMDS;

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => { /* 忽略 */ });
    setCopied(text);
    window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1400);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-sm border border-ink-700 bg-ink-900/70">
      <div className="flex items-center justify-between border-b border-ink-800 bg-ink-850/80 px-3.5 py-2.5">
        <span className="font-display text-[11px] font-bold tracking-[0.22em] text-ink-300">硬件工具箱</span>
        <span className="font-display text-[9px] tracking-[0.18em] text-ink-600">TOOLBOX</span>
      </div>

      {/* 快捷工具 */}
      <div className="grid grid-cols-2 gap-1.5 px-3 py-3">
        {LINKS.map((l) => (
          <a
            key={l.name}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="group rounded-sm border border-ink-800 bg-ink-850/60 px-2.5 py-2 transition-all hover:-translate-y-0.5 hover:border-teal-core/50 hover:bg-ink-800"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-[11px] font-bold text-ink-200 group-hover:text-teal-core">{l.name}</span>
              <ExternalIcon className="h-2.5 w-2.5 text-ink-600 transition-colors group-hover:text-teal-core" />
            </div>
            <div className="mt-0.5 truncate text-[10px] text-ink-500">{l.desc}</div>
          </a>
        ))}
      </div>

      {/* 检测命令 */}
      <div className="border-t border-ink-800 px-3 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wide text-ink-400">
            本机检测命令 · {isLinux ? "LINUX" : "WINDOWS"}
          </span>
          <span className="text-[9px] text-ink-600">点击复制</span>
        </div>
        <ul className="space-y-1">
          {cmds.map(([cmd, desc]) => (
            <li key={cmd}>
              <button
                onClick={() => copy(cmd)}
                className="group flex w-full items-center gap-2 rounded-sm border border-transparent bg-ink-950/60 px-2 py-1.5 text-left transition-colors hover:border-ink-700 hover:bg-ink-850"
              >
                <code className="min-w-0 flex-1 truncate font-display text-[10px] text-teal-core/90">{cmd}</code>
                <span className="hidden shrink-0 text-[9px] text-ink-600 group-hover:inline sm:inline">{desc}</span>
                {copied === cmd ? (
                  <CheckIcon className="h-3 w-3 shrink-0 text-ok" />
                ) : (
                  <CopyIcon className="h-3 w-3 shrink-0 text-ink-600 transition-colors group-hover:text-ink-300" />
                )}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-relaxed text-ink-600">
          <UploadIcon className="mt-px h-2.5 w-2.5 shrink-0" />
          查到型号后回到对应步骤，用搜索框或「手动添加」录入即可。
        </p>
      </div>
    </div>
  );
}

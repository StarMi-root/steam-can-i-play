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
import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, DownloadIcon, ExternalIcon, TerminalIcon } from "./icons";
import deployScript from "../../deploy.sh?raw";

export default function DeployModal({
  open, onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copy = (text: string, tag: string) => {
    navigator.clipboard?.writeText(text).catch(() => { /* ignore */ });
    setCopied(tag);
    window.setTimeout(() => setCopied((c) => (c === tag ? null : c)), 1400);
  };

  const download = () => {
    const blob = new Blob([deployScript], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deploy.sh";
    a.click();
    URL.revokeObjectURL(url);
  };

  const cmdBlock = (cmd: string, tag: string, note: string) => (
    <div className="overflow-hidden rounded-sm border border-ink-700 bg-ink-950">
      <div className="flex items-center justify-between border-b border-ink-800 px-3 py-1.5">
        <span className="font-display text-[10px] tracking-wider text-ink-500">{note}</span>
        <button
          onClick={() => copy(cmd, tag)}
          className="flex items-center gap-1 text-[10px] text-ink-400 transition-colors hover:text-teal-core"
        >
          {copied === tag ? <CheckIcon className="h-3 w-3 text-ok" /> : <CopyIcon className="h-3 w-3" />}
          {copied === tag ? "已复制" : "复制"}
        </button>
      </div>
      <code className="block overflow-x-auto whitespace-nowrap px-3 py-2 font-display text-[11px] text-teal-core">
        <span className="select-none text-ink-600">$ </span>{cmd}
      </code>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/85 px-3 py-6 backdrop-blur-sm sm:px-4 sm:py-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-fade-up flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-teal-core/40 bg-teal-core/[0.08] text-teal-core">
              <TerminalIcon className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-[10px] font-semibold tracking-[0.28em] text-teal-core">DEPLOY TO LINUX</div>
              <h3 className="mt-0.5 text-lg font-black text-ink-100">Linux 一键部署（引导式 TUI）</h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-sm border border-ink-700 px-2.5 py-1 text-sm text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
            关闭
          </button>
        </div>

        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <p className="text-xs leading-relaxed text-ink-400">
            一条命令在 Linux 服务器上把本站跑起来，并开放<b className="text-ink-200">外网访问</b>。
            脚本提供引导式终端界面，自动处理端口占用、推荐相似公网域名，可选安装 systemd 常驻服务。
          </p>

          {/* 三步走 */}
          <ol className="space-y-3">
            <li className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-ink-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-amber-core font-display text-[11px] text-ink-950">1</span>
                下载脚本
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={download}
                  className="flex items-center gap-2 rounded-sm bg-teal-core px-4 py-2 text-xs font-black text-ink-950 transition-all hover:brightness-110 active:scale-[0.97]"
                >
                  <DownloadIcon className="h-4 w-4" /> 下载 deploy.sh
                </button>
                <span className="text-[11px] text-ink-500">约 11 KB · 纯 Bash，无额外依赖（仅需 python3）</span>
              </div>
            </li>

            <li className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-ink-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-amber-core font-display text-[11px] text-ink-950">2</span>
                上传到服务器（脚本 + 构建产物 dist 放同一目录）
              </div>
              {cmdBlock("scp -r dist deploy.sh user@your-server:/opt/can-i-play/", "step2", "本地执行 · 换成你的服务器")}
            </li>

            <li className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-ink-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-amber-core font-display text-[11px] text-ink-950">3</span>
                登录服务器运行，按引导操作
              </div>
              {cmdBlock("cd /opt/can-i-play && chmod +x deploy.sh && ./deploy.sh", "step3", "服务器上执行")}
            </li>
          </ol>

          {/* 特性 */}
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["端口占用自动推荐", "8080 被占用时自动扫描并推荐下一个空闲端口"],
              ["公网域名占用检测", "自定义子域名被占用时，自动逐个尝试相似推荐域名"],
              ["三种公网隧道", "cloudflared 免注册随机域名 / localhost.run 自定义域名 / ngrok"],
              ["systemd 常驻", "可选安装系统服务，开机自启、崩溃自动重启"],
            ].map(([t, d]) => (
              <div key={t} className="rounded-sm border border-ink-800 bg-ink-950/60 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-core">
                  <CheckIcon className="h-3 w-3" /> {t}
                </div>
                <div className="mt-1 text-[10px] leading-relaxed text-ink-500">{d}</div>
              </div>
            ))}
          </div>

          {/* 脚本预览 */}
          <div className="overflow-hidden rounded-sm border border-ink-700 bg-ink-950">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-ink-900"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-ink-300">
                <TerminalIcon className="h-3.5 w-3.5 text-teal-core" /> 查看脚本源码（{deployScript.split("\n").length} 行）
              </span>
              <span className="font-display text-[10px] text-ink-500">{expanded ? "收起 ▲" : "展开 ▼"}</span>
            </button>
            {expanded && (
              <pre className="no-scrollbar max-h-72 overflow-auto border-t border-ink-800 px-3 py-3 font-display text-[10.5px] leading-relaxed text-ink-400">
                {deployScript}
              </pre>
            )}
            <div className="flex items-center justify-between border-t border-ink-800 px-3 py-2">
              <span className="text-[10px] text-ink-600">支持非交互：PORT=9000 MODE=cf ./deploy.sh</span>
              <button
                onClick={() => copy(deployScript, "full")}
                className="flex items-center gap-1.5 rounded-sm border border-ink-700 px-2.5 py-1 text-[10px] font-bold text-ink-300 transition-colors hover:border-teal-core/60 hover:text-teal-core"
              >
                {copied === "full" ? <CheckIcon className="h-3 w-3 text-ok" /> : <CopyIcon className="h-3 w-3" />}
                复制完整脚本
              </button>
            </div>
          </div>

          <a
            href="https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-ink-500 transition-colors hover:text-teal-core"
          >
            <ExternalIcon className="h-3 w-3" /> cloudflared 隧道说明（Cloudflare 官方文档）
          </a>
        </div>
      </div>
    </div>
  );
}

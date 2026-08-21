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
import { useEffect, useMemo, useState } from "react";
import {
  getCustomProxy, getProxyHealth, listProxies, probeNetworkDetailed, setCustomProxy,
} from "../lib/net";
import { CheckIcon, GlobeIcon, InfoIcon, WarnIcon } from "./icons";

export default function NetworkPanel({
  open, onClose, onStatus,
}: {
  open: boolean;
  onClose: () => void;
  /** 探测完成后回调，供外层同步指示灯状态 */
  onStatus: (ok: boolean) => void;
}) {
  const [custom, setCustom] = useState("");
  const [saved, setSaved] = useState(false);
  const [probing, setProbing] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "down">("idle");

  const proxies = useMemo(() => listProxies(), []);
  const health = useMemo(() => getProxyHealth(), []);
  const currentCustom = getCustomProxy();

  useEffect(() => {
    if (open) {
      setCustom(currentCustom ?? "");
      setSaved(false);
      setStatus("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = () => {
    setCustomProxy(custom);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const probe = async () => {
    setProbing(true);
    const r = await probeNetworkDetailed(7000);
    setStatus(r.ok ? "ok" : "down");
    onStatus(r.ok);
    setProbing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/85 px-3 py-8 backdrop-blur-sm sm:py-14"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-fade-up w-full max-w-lg overflow-hidden rounded-md border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <GlobeIcon className="h-5 w-5 text-teal-core" />
            <div>
              <div className="font-display text-[10px] font-semibold tracking-[0.28em] text-teal-core">NETWORK</div>
              <h3 className="text-base font-black text-ink-100">网络通道设置</h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-sm border border-ink-700 px-2.5 py-1 text-sm text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
            关闭
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-xs leading-relaxed text-ink-400">
            本工具会<b className="text-ink-200">直连 → 自定义代理 → 十几个第三方公共代理</b>依次错峰竞速，
            哪个先通用哪个，并记住各通道健康度。公共代理在不同网络环境下可用性不一，
            若都不通，强烈建议配置自己的反代。
          </p>

          {/* 自定义代理 */}
          <div className="rounded-sm border border-teal-core/35 bg-teal-core/[0.05] p-3.5">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-bold text-teal-core">
              自定义代理（优先级最高，推荐）
            </div>
            <div className="flex gap-2">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="https://你的反代地址/?url= 或 https://你的反代地址/"
                className="min-w-0 flex-1 rounded-sm border border-ink-700 bg-ink-950 px-3 py-2 font-display text-xs text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-teal-core/60"
              />
              <button onClick={save} className="shrink-0 rounded-sm bg-teal-core px-3.5 py-2 text-xs font-black text-ink-950 transition-all hover:brightness-110 active:scale-95">
                {saved ? "已保存 ✓" : "保存"}
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-500">
              支持「查询参数式」（以 <code className="text-teal-core">?url=</code> 结尾）与「路径式」两种前缀，自动识别。
              可用 Cloudflare Worker、cors-anywhere、自建 Nginx 反代等。留空保存即移除。
            </p>
            {currentCustom && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-ok">
                <CheckIcon className="h-3 w-3" /> 当前生效：{currentCustom}
              </p>
            )}
          </div>

          {/* 通道列表与健康度 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wide text-ink-400">可用通道与健康度（本机记录）</span>
            </div>
            <ul className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3">
              {(currentCustom ? [{ id: "custom", label: "自定义代理" }, ...proxies] : proxies).map((p) => {
                const h = health[p.id];
                const good = h && h.ok > 0;
                return (
                  <li
                    key={p.id}
                    className={`flex items-center gap-1.5 rounded-sm border px-2 py-1.5 text-[10px] ${
                      good ? "border-ok/30 bg-ok/[0.05] text-ink-200" : "border-ink-800 bg-ink-950/50 text-ink-500"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${good ? "bg-ok" : "bg-ink-600"}`} />
                    <span className="min-w-0 flex-1 truncate">{p.label}</span>
                    {h && <span className="shrink-0 font-display text-ink-600">✓{h.ok}</span>}
                  </li>
                );
              })}
            </ul>
            <p className="mt-1.5 flex items-start gap-1 text-[9px] text-ink-600">
              <InfoIcon className="mt-px h-2.5 w-2.5 shrink-0" />
              ✓ 后的数字为该通道在本机的历史成功次数，每次请求自动更新。
            </p>
          </div>

          {/* 探测 */}
          <div className="flex items-center gap-3 border-t border-ink-800 pt-4">
            <button
              onClick={probe}
              disabled={probing}
              className="flex items-center gap-2 rounded-sm bg-teal-core px-4 py-2.5 text-xs font-black text-ink-950 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              {probing ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
              ) : (
                <GlobeIcon className="h-3.5 w-3.5" />
              )}
              {probing ? "探测中…" : "探测全部通道"}
            </button>
            {status === "ok" && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-ok">
                <CheckIcon className="h-4 w-4" /> 通道可用
              </span>
            )}
            {status === "down" && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-warn">
                <WarnIcon className="h-4 w-4" /> 全部不通，请配置自定义代理
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

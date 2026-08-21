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
import { Game } from "../data/games";
import { OS_OPTIONS } from "../data/hardware";
import { Build, Fit, LEVEL_META, evaluate, osSupported } from "../lib/match";
import { NetError, SteamAppInfo, SteamSearchHit, getSteamAppInfo, searchSteamGames } from "../lib/net";
import { parseGameInfo } from "../lib/updater";
import {
  CheckIcon, ExternalIcon, GaugeIcon, SearchIcon, SteamIcon, WarnIcon,
} from "./icons";

/** 单个硬件项对比行 */
function CompareRow({
  label, mine, need, ok, unit,
}: {
  label: string;
  mine: string;
  need: string;
  ok: boolean;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-ink-800/70 py-2 text-xs last:border-0">
      <span className="w-12 shrink-0 font-display text-[10px] font-bold tracking-wider text-ink-500">{label}</span>
      <span className="flex-1 truncate text-ink-200">{mine}</span>
      <span className={`flex items-center gap-1 ${ok ? "text-ok" : "text-bad"}`}>
        {ok ? <CheckIcon className="h-3.5 w-3.5" /> : <WarnIcon className="h-3.5 w-3.5" />}
      </span>
      <span className="w-32 shrink-0 truncate text-right text-ink-400">
        需 {need}{unit ?? ""}
      </span>
    </div>
  );
}

export default function CheckGameModal({
  open, onClose, build, buildReady, onAdd, existingIds,
}: {
  open: boolean;
  onClose: () => void;
  /** 当前硬件配置（未完成时为部分字段） */
  build: Build;
  /** 四步是否已录完 */
  buildReady: boolean;
  onAdd: (g: Game) => void;
  existingIds: Set<number>;
}) {
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SteamSearchHit[]>([]);
  const [info, setInfo] = useState<SteamAppInfo | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) { setErr(null); setSaved(false); }
  }, [open, info]);

  const parse = useMemo(
    () => (info ? parseGameInfo(info, { strict: false, mark: "custom" }) : null),
    [info],
  );
  const fit: Fit | null = useMemo(
    () => (buildReady && parse ? evaluate(build, parse.game) : null),
    [buildReady, build, parse],
  );
  const osOk = useMemo(
    () => (build.os && parse ? osSupported(parse.game, build.os) : true),
    [build.os, parse],
  );

  if (!open) return null;

  const doSearch = async () => {
    const t = term.trim();
    if (!t) return;
    setErr(null); setSaved(false);
    if (/^\d{2,8}$/.test(t)) { loadInfo(Number(t)); return; }
    setSearching(true);
    try {
      const list = await searchSteamGames(t);
      setHits(list);
      setInfo(null);
      if (list.length === 0) setErr(`没找到「${t}」，试试英文原名或直接输入 AppID`);
    } catch (e) {
      setErr(e instanceof NetError ? e.message : "请求失败，请检查网络后重试");
    } finally {
      setSearching(false);
    }
  };

  const loadInfo = async (appId: number) => {
    setLoading(true); setErr(null); setSaved(false);
    try {
      setInfo(await getSteamAppInfo(appId));
      setHits([]);
    } catch (e) {
      setErr(e instanceof NetError ? e.message : "请求失败，请检查网络后重试：（");
    } finally {
      setLoading(false);
    }
  };

  const busy = searching || loading;
  const meta = fit ? LEVEL_META[fit.level] : null;
  const already = info ? existingIds.has(info.appId) : false;
  const cpuName = build.cpu?.name ?? "未录入";
  const gpuName = build.gpu?.name ?? "未录入";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/85 px-3 py-6 backdrop-blur-sm sm:px-4 sm:py-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-fade-up flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-teal-core/40 bg-teal-core/[0.08] text-teal-core">
              <GaugeIcon className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-[10px] font-semibold tracking-[0.28em] text-teal-core">LIVE CHECK · 实时检测</div>
              <h3 className="mt-0.5 text-lg font-black text-ink-100">任意游戏即查即判</h3>
            </div>
          </div>
          <button onClick={onClose} className="rounded-sm border border-ink-700 px-2.5 py-1 text-sm text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
            关闭
          </button>
        </div>

        <p className="border-b border-ink-800 bg-ink-950/50 px-5 py-2.5 text-[11px] leading-relaxed text-ink-500">
          Steam 全库约 <b className="text-ink-300">40 万款</b>无法打包进网页；这里实时连接 Steam 官方接口，
          查询<b className="text-teal-core">任意一款</b>的官方配置并立刻对比你的硬件，可一键存入本地库参与全部匹配。
        </p>

        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* 搜索 */}
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder="游戏名 或 AppID（如 黑神话 / 2358720）"
                className="w-full rounded-sm border border-ink-700 bg-ink-950 py-2.5 pl-8 pr-3 text-sm text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-teal-core/60"
              />
            </div>
            <button
              onClick={doSearch}
              disabled={busy}
              className="shrink-0 rounded-sm bg-teal-core px-5 text-sm font-bold text-ink-950 transition-all enabled:hover:brightness-110 enabled:active:scale-[0.97] disabled:opacity-50"
            >
              {busy ? "查询中…" : "检测"}
            </button>
          </div>

          {err && (
            <div className="flex animate-fade-up items-start gap-2 rounded-sm border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
              <WarnIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {err}
            </div>
          )}

          {/* 搜索结果列表 */}
          {hits.length > 0 && (
            <div className="max-h-44 animate-fade-up overflow-y-auto rounded-sm border border-ink-800">
              {hits.map((h) => (
                <button
                  key={h.id}
                  onClick={() => loadInfo(h.id)}
                  className="flex w-full items-center justify-between gap-3 border-b border-ink-800/70 px-3 py-2 text-left text-sm text-ink-100 transition-colors last:border-0 hover:bg-ink-850"
                >
                  <span className="truncate">{h.name}</span>
                  <span className="shrink-0 font-display text-[10px] text-ink-500">#{h.id}</span>
                </button>
              ))}
            </div>
          )}

          {/* 详情 + 结论 */}
          {info && parse && (
            <div className="animate-fade-up space-y-3">
              {/* 游戏信息头 */}
              <div className="flex items-center gap-3 rounded-sm border border-ink-700 bg-ink-950/50 p-3">
                <img
                  src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${info.appId}/capsule_231x87.jpg`}
                  alt={info.name}
                  className="h-16 w-[110px] shrink-0 rounded-sm object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-ink-100">{info.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
                    <span className="font-display">#{info.appId}</span>
                    <span>{info.year ?? "年份未知"}</span>
                    <span className={info.isFree ? "font-bold text-ok" : "text-amber-core"}>
                      {info.isFree ? "免费" : "付费"}
                    </span>
                    <a href={`https://store.steampowered.com/app/${info.appId}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-steam hover:underline">
                      商店页 <ExternalIcon className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* 结论 */}
              {!buildReady ? (
                <div className="rounded-sm border border-dashed border-ink-700 bg-ink-950/40 px-4 py-4 text-xs leading-relaxed text-ink-400">
                  配置还没录完。完成左侧 <b className="text-ink-200">系统 / CPU / GPU / 内存</b> 四步后，
                  这里会立刻给出「能不能玩」的结论与帧率估算。下方已先展示官方配置要求。
                </div>
              ) : fit && meta && osOk ? (
                <div className={`overflow-hidden rounded-sm border ${meta.bg}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                    <div>
                      <div className={`text-xl font-black ${meta.color}`}>{meta.label}</div>
                      <div className="mt-0.5 text-[11px] text-ink-400">
                        {meta.desc}
                        {fit.bottleneck === "cpu" && " · 瓶颈：CPU"}
                        {fit.bottleneck === "gpu" && " · 瓶颈：GPU"}
                        {fit.bottleneck === "ram" && " · 瓶颈：内存"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-display text-2xl font-bold ${meta.color}`}>≈ {fit.estFps}</div>
                      <div className="text-[10px] text-ink-500">1080P 预估帧率</div>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden bg-ink-800">
                    <div
                      className={`h-full animate-bar-grow ${fit.level === "perfect" ? "bg-ok" : fit.level === "smooth" ? "bg-teal-core" : fit.level === "low" ? "bg-warn" : "bg-bad"}`}
                      style={{ width: `${Math.min(100, Math.round((fit.estFps / 120) * 100))}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-sm border border-warn/40 bg-warn/10 px-4 py-3 text-xs leading-relaxed text-warn">
                  <WarnIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  该游戏<b className="mx-1">不原生支持</b>你当前的系统
                  {build.os ? `（${OS_OPTIONS.find((o) => o.id === build.os)?.name}）` : ""}
                  。Windows 游戏在 Linux 上可尝试 Proton，macOS 可尝试 CrossOver / Whisky。
                </div>
              )}

              {/* 配置对比表 */}
              {buildReady && fit && (
                <div className="rounded-sm border border-ink-700 bg-ink-950/50 px-4 py-2">
                  <CompareRow
                    label="CPU" mine={`${cpuName}（${build.cpu?.score} 分）`}
                    need={`${parse.game.minCpu} 分`} ok={build.cpu!.score >= parse.game.minCpu}
                  />
                  <CompareRow
                    label="GPU" mine={`${gpuName}（${build.gpu?.score} 分）`}
                    need={`${parse.game.minGpu} 分`} ok={build.gpu!.score >= parse.game.minGpu}
                  />
                  <CompareRow
                    label="内存" mine={`${build.ram} GB`} need={`${parse.game.minRam} GB`} ok={build.ram! >= parse.game.minRam}
                  />
                </div>
              )}

              {/* 官方原文 */}
              {(parse.game.minNote || parse.game.recNote) && (
                <div className="grid gap-2 text-[11px] leading-relaxed sm:grid-cols-2">
                  {parse.game.minNote && (
                    <div className="rounded-sm border border-ink-800 bg-ink-950/50 px-3 py-2">
                      <div className="mb-1 font-display text-[10px] font-bold tracking-wider text-ink-500">官方最低配置</div>
                      <p className="whitespace-pre-wrap text-ink-400">{parse.game.minNote}</p>
                    </div>
                  )}
                  {parse.game.recNote && (
                    <div className="rounded-sm border border-ink-800 bg-ink-950/50 px-3 py-2">
                      <div className="mb-1 font-display text-[10px] font-bold tracking-wider text-ink-500">官方推荐配置</div>
                      <p className="whitespace-pre-wrap text-ink-400">{parse.game.recNote}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 操作 */}
              <div className="flex flex-wrap items-center gap-2 border-t border-ink-800 pt-3">
                <button
                  onClick={() => { onAdd({ ...parse.game, custom: true, ext: false }); setSaved(true); }}
                  disabled={already || saved}
                  className={`flex items-center gap-2 rounded-sm px-4 py-2.5 text-xs font-bold transition-all ${
                    already || saved
                      ? "cursor-not-allowed border border-ok/40 bg-ok/[0.08] text-ok"
                      : "bg-teal-core text-ink-950 hover:brightness-110 active:scale-[0.97]"
                  }`}
                >
                  {already || saved ? <CheckIcon className="h-4 w-4" /> : <SteamIcon className="h-4 w-4" />}
                  {already ? "已在本地游戏库" : saved ? "已存入本地库" : "存入本地游戏库"}
                </button>
                <a
                  href={`https://store.steampowered.com/app/${info.appId}/`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-sm border border-ink-600 bg-ink-850 px-4 py-2.5 text-xs font-bold text-ink-200 transition-colors hover:border-steam/60 hover:text-steam"
                >
                  去商店获取 <ExternalIcon className="h-3 w-3" />
                </a>
                <span className="ml-auto text-[10px] text-ink-600">存入后即参与左侧全部匹配与筛选</span>
              </div>
            </div>
          )}

          {/* 初始引导 */}
          {!info && hits.length === 0 && !busy && !err && (
            <div className="rounded-sm border border-dashed border-ink-700 px-5 py-10 text-center">
              <GaugeIcon className="mx-auto h-9 w-9 text-teal-core/60" />
              <p className="mt-3 text-sm font-bold text-ink-200">输入任意游戏名或 AppID</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                覆盖 Steam 全库约 40 万款游戏，实时拉取官方配置，
                <br />不受热门榜单 Top100 限制。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

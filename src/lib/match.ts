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
import { Game } from "../data/games";
import { OsId } from "../data/hardware";

export interface Build {
  os: OsId | null;
  cpu: { name: string; score: number } | null;
  gpu: { name: string; score: number } | null;
  ram: number | null;
}

export const EMPTY_BUILD: Build = { os: null, cpu: null, gpu: null, ram: null };

export type FitLevel = "perfect" | "smooth" | "low" | "no";

export interface Fit {
  game: Game;
  level: FitLevel;
  factor: number; // 木桶比例：最弱一环 / 最低需求
  estFps: number;
  ramOk: boolean;
  bottleneck: "cpu" | "gpu" | "ram" | null;
}

/** Win7/8.1 大致能运行的游戏年份上限（此后的新游戏普遍要求 Win10+） */
const WIN7_MAX_YEAR = 2016;

export function osSupported(game: Game, os: OsId): boolean {
  switch (os) {
    case "win11":
    case "win10":
      return game.platforms.win;
    case "win7":
      return game.platforms.win && game.year <= WIN7_MAX_YEAR;
    case "mac":
      return game.platforms.mac;
    default:
      // 所有 Linux 发行版 → 看是否原生支持 Linux
      return game.platforms.linux;
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function evaluate(build: Build, game: Game): Fit | null {
  if (!build.os || !build.cpu || !build.gpu || build.ram == null) return null;
  if (!osSupported(game, build.os)) return null;

  const cpuR = build.cpu.score / game.minCpu;
  const gpuR = build.gpu.score / game.minGpu;
  const ramOk = build.ram >= game.minRam;

  let factor = Math.min(cpuR, gpuR);
  if (!ramOk) factor *= 0.55; // 内存不足会显著拖累实际体验

  let bottleneck: Fit["bottleneck"];
  if (!ramOk) bottleneck = "ram";
  else if (cpuR < gpuR) bottleneck = "cpu";
  else bottleneck = "gpu";

  // 达到「推荐配置」直接判完美；否则按与最低配置的余量分档
  const meetsRec =
    game.recCpu != null && game.recGpu != null
      ? build.cpu.score >= game.recCpu &&
        build.gpu.score >= game.recGpu &&
        build.ram >= (game.recRam ?? game.minRam)
      : false;

  const estFps = meetsRec
    ? clamp(Math.round(90 + factor * 20), 90, 240)
    : clamp(Math.round(60 * factor), 12, 240);

  let level: FitLevel;
  if (meetsRec || factor >= 1.5) level = "perfect";
  else if (factor >= 1) level = "smooth";
  else if (factor >= 0.72) level = "low";
  else level = "no";

  return { game, level, factor, estFps, ramOk, bottleneck };
}

export function evaluateAll(build: Build, games: Game[]): {
  playable: Fit[];
  rejected: Fit[];
} {
  const playable: Fit[] = [];
  const rejected: Fit[] = [];
  for (const g of games) {
    const fit = evaluate(build, g);
    if (!fit) continue;
    if (fit.level === "no") rejected.push(fit);
    else playable.push(fit);
  }
  playable.sort((a, b) => b.factor - a.factor);
  rejected.sort((a, b) => b.factor - a.factor);
  return { playable, rejected };
}

export const LEVEL_META: Record<
  FitLevel,
  { label: string; desc: string; color: string; bg: string }
> = {
  perfect: {
    label: "完美运行",
    desc: "高画质 · 60 帧以上",
    color: "text-ok",
    bg: "bg-ok/10 border-ok/30",
  },
  smooth: {
    label: "流畅运行",
    desc: "中高画质 · 约 60 帧",
    color: "text-teal-core",
    bg: "bg-teal-core/10 border-teal-core/30",
  },
  low: {
    label: "勉强可玩",
    desc: "低画质 · 30~45 帧",
    color: "text-warn",
    bg: "bg-warn/10 border-warn/30",
  },
  no: {
    label: "带不动",
    desc: "低于最低配置",
    color: "text-bad",
    bg: "bg-bad/10 border-bad/30",
  },
};

/** 整机段位 */
export function machineGrade(cpuScore: number, gpuScore: number) {
  const v = cpuScore / 320 + gpuScore / 640;
  if (v <= 0.14685) return { grade: "上古亮机", tag: "RETRO", tone: "text-ink-300", advice: "以老游戏、独立小品和经典网游为主，新 3A 基本无缘。" };
  if (v < 0.159375) return { grade: "入门办公", tag: "OFFICE", tone: "text-ink-300", advice: "适合网页办公与轻度网游，升级显卡收益最明显。" };
  if (v < 0.3125) return { grade: "网游畅玩", tag: "ESPORT", tone: "text-teal-core", advice: "主流电竞网游毫无压力，3A 大作需降低画质。" };
  if (v < 0.44375) return { grade: "甜品进阶", tag: "SWEET SPOT", tone: "text-amber-core", advice: "1080P 高画质畅玩绝大多数游戏。" };
  if (v < 0.653125) return { grade: "高端发烧", tag: "ENTHUSIAST", tone: "text-amber-hi", advice: "2K 分辨率全开画质，4K 中画质可战。" };
  return { grade: "旗舰极致", tag: "FLAGSHIP", tone: "text-ok", advice: "4K 全高画质 + 高刷，通吃当前所有游戏。" };
}

export function upgradeHint(build: Build): string | null {
  if (!build.cpu || !build.gpu || build.ram == null) return null;
  if (build.ram < 16 && build.gpu.score >= 60) {
    return `内存加到 16GB（当前 ${build.ram}GB）能让不少新游戏跨过门槛`;
  }
  if (build.gpu.score < build.cpu.score * 0.45) {
    return "显卡明显拖后腿，优先升级显卡";
  }
  if (build.cpu.score < build.gpu.score * 0.5) {
    return "CPU 偏老，升级处理器可缓解高帧率瓶颈";
  }
  return null;
}

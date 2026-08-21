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
/**
 * 官方配置文本解析器：
 * 将形如 "Intel Core i5-2400 or AMD FX-6300 / NVIDIA GeForce GTX 770 / 8 GB RAM"
 * 的官方配置描述换算为本工具的相对性能指数。
 * 原理：归一化后在型号库中做子串匹配（长名优先、去重叠区间防误命中），
 * "或" 的多选配置取最低分作为有效最低要求。
 */
import { CPU_MODELS, GPU_MODELS } from "../data/hardware";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "");

/** 补充表：官方配置中高频出现、但不在选择列表里展示的老型号 */
const EXTRA_CPU: [string, number][] = [
  ["corei5750", 30], ["corei7920", 30], ["corei7950", 32], ["corei52300", 36],
  ["corei52500", 40], ["corei72600", 46], ["corei73770", 52], ["corei74770", 56],
  ["corei56600", 54], ["corei76700", 64], ["corei77700", 70],
  ["athloniix2250", 16], ["athloniix3445", 20], ["athloniix4631", 22],
  ["phenomiix2545", 24], ["phenomiix2555", 26], ["phenomiix4955", 26], ["phenomiix4965", 26],
  ["phenomiix61055t", 32], ["phenomiix61090t", 34],
  ["fx4100", 32], ["fx4300", 34], ["fx6100", 36], ["fx6300", 38], ["fx8120", 40],
  ["fx8300", 42], ["fx8320", 44], ["fx8350", 46], ["fx9590", 50],
  ["a87600", 22], ["a107870k", 26], ["a129800", 30],
  ["core2duoe6600", 20], ["core2duoe6750", 22], ["pentiumd915", 12],
  ["ryzen31200", 40], ["ryzen32200g", 42], ["ryzen51400", 46], ["ryzen51500x", 50],
  ["ryzen52600", 56], ["ryzen71700", 58], ["ryzen72700", 62],
];

const EXTRA_GPU: [string, number][] = [
  ["geforcegts450", 14], ["geforcegt545", 8], ["geforcegt630", 8], ["geforcegt640", 12],
  ["geforcegt710", 8], ["geforcegt1030", 14],
  ["geforcegtx550ti", 18], ["geforcegtx560ti", 26], ["geforcegtx560", 24],
  ["geforcegtx650ti", 26], ["geforcegtx650", 22], ["geforcegtx660ti", 30], ["geforcegtx660", 28],
  ["geforcegtx760", 30], ["geforcegtx770", 34], ["geforcegtx780ti", 42],
  ["geforcegtx950", 30], ["geforcegtx960", 34], ["geforcegtx970", 42], ["geforcegtx980ti", 52],
  ["geforcegtx1050ti", 34], ["geforcegtx1650super", 44],
  ["radeonhd5770", 14], ["radeonhd5850", 18], ["radeonhd6850", 18], ["radeonhd6870", 20],
  ["radeonhd7850", 24], ["radeonhd7870", 28], ["radeonhd7950", 30],
  ["radeonr7260x", 20], ["radeonr9270x", 32], ["radeonr9270", 30], ["radeonr9280x", 36],
  ["radeonr9380", 34], ["radeonrx460", 22], ["radeonrx470", 34],
  ["radeonrx550", 22], ["radeonrx560", 26],
  ["radeonvega8", 16], ["radeonvega11", 20],
  ["intelhdgraphics4400", 7], ["quadrok620", 10],
];

interface Hit { start: number; len: number; score: number }

function matchScore(
  text: string,
  models: { name: string; score: number }[],
  extras: [string, number][],
): number | null {
  const t = norm(text);
  if (t.length < 4) return null;

  const hits: Hit[] = [];
  const pushHit = (key: string, score: number) => {
    if (key.length < 4) return;
    let from = 0;
    for (;;) {
      const i = t.indexOf(key, from);
      if (i === -1) break;
      hits.push({ start: i, len: key.length, score });
      from = i + key.length;
    }
  };
  for (const m of models) pushHit(norm(m.name), m.score);
  for (const [k, s] of extras) pushHit(k, s);
  if (hits.length === 0) return null;

  // 长名优先，剔除重叠命中（防止 "RX 580" 误命中 "RX 5800" 内部）
  hits.sort((a, b) => b.len - a.len || a.start - b.start);
  const taken: Hit[] = [];
  for (const h of hits) {
    const overlap = taken.some(
      (u) => h.start < u.start + u.len && u.start < h.start + h.len,
    );
    if (!overlap) taken.push(h);
  }
  // "或" 的并列备选 → 取最低分作为有效最低门槛
  return Math.min(...taken.map((h) => h.score));
}

function matchRam(text: string): number | null {
  const m = text.match(/(\d{1,3})\s*(?:gb|g)\s*(?:ram|内存|memory)/i);
  if (m) {
    const v = Number(m[1]);
    if (v >= 1 && v <= 128) return v;
  }
  // 兜底：在含「内存 / Memory」的行里找 "x GB"，避开显存 / VRAM
  for (const line of text.split(/\n/)) {
    if (/(内存|memory)/i.test(line) && !/(显存|vram|video)/i.test(line)) {
      const g = line.match(/(\d{1,3})\s*(?:gb|g)/i);
      if (g) {
        const v = Number(g[1]);
        if (v >= 1 && v <= 128) return v;
      }
    }
  }
  return null;
}

export interface ParsedReq {
  cpu: number | null;
  gpu: number | null;
  ram: number | null;
}

export function parseRequirements(text: string): ParsedReq {
  return {
    cpu: matchScore(text, CPU_MODELS, EXTRA_CPU),
    gpu: matchScore(text, GPU_MODELS, EXTRA_GPU),
    ram: matchRam(text),
  };
}

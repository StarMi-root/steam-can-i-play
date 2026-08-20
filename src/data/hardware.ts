/**
 * 内置硬件性能库（相对性能指数，越大越强）。
 * CPU/GPU 指数按 1080P 游戏综合表现标定，覆盖 2006 年至今的主流型号。
 */

export type OsId = "win11" | "win10" | "win7" | "mac" | "linux";

export interface OsOption {
  id: OsId;
  name: string;
  sub: string;
  note: string;
  /** 满足该平台最低游戏要求的年份阈值：早于此年份的游戏视为支持 */
  minYear: number;
}

export const OS_OPTIONS: OsOption[] = [
  { id: "win11", name: "Windows 11", sub: "2021 至今", note: "兼容所有游戏", minYear: 1990 },
  { id: "win10", name: "Windows 10", sub: "2015 – 2021", note: "兼容绝大多数游戏", minYear: 1990 },
  { id: "win7", name: "Windows 7 / 8.1", sub: "2009 – 2015", note: "较新游戏可能无法运行", minYear: 2014 },
  { id: "mac", name: "macOS", sub: "Apple 电脑", note: "仅限原生支持的游戏", minYear: 1990 },
  { id: "linux", name: "Linux / SteamOS", sub: "含 Steam Deck", note: "仅限原生支持的游戏", minYear: 1990 },
];

export interface CpuModel { name: string; brand: "Intel" | "AMD"; score: number }
export interface GpuModel { name: string; brand: "NVIDIA" | "AMD" | "Intel"; score: number }

export interface CpuTierOption { name: string; desc: string; score: number }
export interface GpuTierOption { name: string; desc: string; score: number }

/* ---------------- CPU ---------------- */

export const CPU_MODELS: CpuModel[] = [
  /* Intel — 经典老平台 */
  { name: "Celeron G530", brand: "Intel", score: 10 },
  { name: "Pentium E5300", brand: "Intel", score: 14 },
  { name: "Pentium G620", brand: "Intel", score: 16 },
  { name: "Pentium G4560", brand: "Intel", score: 34 },
  { name: "Pentium Gold G5400", brand: "Intel", score: 38 },
  { name: "Core 2 Duo E4500", brand: "Intel", score: 18 },
  { name: "Core 2 Duo E7400", brand: "Intel", score: 20 },
  { name: "Core 2 Duo E8400", brand: "Intel", score: 24 },
  { name: "Core 2 Quad Q6600", brand: "Intel", score: 32 },
  { name: "Core 2 Quad Q8400", brand: "Intel", score: 34 },
  { name: "Core 2 Quad Q9550", brand: "Intel", score: 38 },
  /* Intel — 2~7 代酷睿 */
  { name: "Core i3-2100", brand: "Intel", score: 26 },
  { name: "Core i3-3220", brand: "Intel", score: 30 },
  { name: "Core i3-4160", brand: "Intel", score: 36 },
  { name: "Core i3-6100", brand: "Intel", score: 40 },
  { name: "Core i3-8100", brand: "Intel", score: 48 },
  { name: "Core i3-9100F", brand: "Intel", score: 52 },
  { name: "Core i3-10100F", brand: "Intel", score: 56 },
  { name: "Core i3-12100F", brand: "Intel", score: 64 },
  { name: "Core i3-13100F", brand: "Intel", score: 66 },
  { name: "Core i3-14100F", brand: "Intel", score: 68 },
  { name: "Core i5-2400", brand: "Intel", score: 38 },
  { name: "Core i5-2500K", brand: "Intel", score: 42 },
  { name: "Core i5-3470", brand: "Intel", score: 44 },
  { name: "Core i5-3570K", brand: "Intel", score: 48 },
  { name: "Core i5-4460", brand: "Intel", score: 48 },
  { name: "Core i5-4590", brand: "Intel", score: 50 },
  { name: "Core i5-6500", brand: "Intel", score: 54 },
  { name: "Core i5-7500", brand: "Intel", score: 58 },
  { name: "Core i5-8400", brand: "Intel", score: 66 },
  { name: "Core i5-9400F", brand: "Intel", score: 70 },
  { name: "Core i5-10400F", brand: "Intel", score: 74 },
  { name: "Core i5-11400F", brand: "Intel", score: 78 },
  { name: "Core i5-12400F", brand: "Intel", score: 84 },
  { name: "Core i5-12600KF", brand: "Intel", score: 96 },
  { name: "Core i5-13400F", brand: "Intel", score: 88 },
  { name: "Core i5-13600KF", brand: "Intel", score: 106 },
  { name: "Core i5-14400F", brand: "Intel", score: 90 },
  { name: "Core i5-14600KF", brand: "Intel", score: 108 },
  { name: "Core i7-2600K", brand: "Intel", score: 50 },
  { name: "Core i7-3770K", brand: "Intel", score: 54 },
  { name: "Core i7-4770K", brand: "Intel", score: 58 },
  { name: "Core i7-4790K", brand: "Intel", score: 62 },
  { name: "Core i7-6700K", brand: "Intel", score: 68 },
  { name: "Core i7-7700K", brand: "Intel", score: 74 },
  { name: "Core i7-8700K", brand: "Intel", score: 80 },
  { name: "Core i7-9700K", brand: "Intel", score: 88 },
  { name: "Core i7-10700K", brand: "Intel", score: 92 },
  { name: "Core i7-11700K", brand: "Intel", score: 94 },
  { name: "Core i7-12700K", brand: "Intel", score: 106 },
  { name: "Core i7-13700K", brand: "Intel", score: 118 },
  { name: "Core i7-14700K", brand: "Intel", score: 122 },
  { name: "Core i9-9900K", brand: "Intel", score: 94 },
  { name: "Core i9-10900K", brand: "Intel", score: 98 },
  { name: "Core i9-11900K", brand: "Intel", score: 98 },
  { name: "Core i9-12900K", brand: "Intel", score: 112 },
  { name: "Core i9-13900K", brand: "Intel", score: 128 },
  { name: "Core i9-14900K", brand: "Intel", score: 130 },
  { name: "Core Ultra 5 245K", brand: "Intel", score: 112 },
  { name: "Core Ultra 7 265K", brand: "Intel", score: 126 },
  { name: "Core Ultra 9 285K", brand: "Intel", score: 132 },
  /* AMD — 速龙 / 羿龙 / FX 老平台 */
  { name: "Athlon 64 X2 5000+", brand: "AMD", score: 14 },
  { name: "Athlon II X2 250", brand: "AMD", score: 18 },
  { name: "Athlon II X3 445", brand: "AMD", score: 24 },
  { name: "Athlon II X4 640", brand: "AMD", score: 28 },
  { name: "Athlon II X4 641", brand: "AMD", score: 30 },
  { name: "Athlon X4 860K", brand: "AMD", score: 30 },
  { name: "Phenom II X4 955", brand: "AMD", score: 36 },
  { name: "Phenom II X6 1055T", brand: "AMD", score: 40 },
  { name: "A8-5600K", brand: "AMD", score: 26 },
  { name: "A8-7600", brand: "AMD", score: 28 },
  { name: "A10-7850K", brand: "AMD", score: 32 },
  { name: "FX-4100", brand: "AMD", score: 30 },
  { name: "FX-6300", brand: "AMD", score: 40 },
  { name: "FX-8300", brand: "AMD", score: 42 },
  { name: "FX-8320", brand: "AMD", score: 46 },
  { name: "FX-8350", brand: "AMD", score: 48 },
  /* AMD — Ryzen */
  { name: "Ryzen 3 1200", brand: "AMD", score: 38 },
  { name: "Ryzen 3 2200G", brand: "AMD", score: 40 },
  { name: "Ryzen 3 3200G", brand: "AMD", score: 44 },
  { name: "Ryzen 3 4100", brand: "AMD", score: 52 },
  { name: "Ryzen 5 1400", brand: "AMD", score: 44 },
  { name: "Ryzen 5 1600", brand: "AMD", score: 52 },
  { name: "Ryzen 5 2600", brand: "AMD", score: 60 },
  { name: "Ryzen 5 3600", brand: "AMD", score: 74 },
  { name: "Ryzen 5 5500", brand: "AMD", score: 76 },
  { name: "Ryzen 5 5600G", brand: "AMD", score: 78 },
  { name: "Ryzen 5 5600", brand: "AMD", score: 82 },
  { name: "Ryzen 5 5600X", brand: "AMD", score: 84 },
  { name: "Ryzen 5 7500F", brand: "AMD", score: 92 },
  { name: "Ryzen 5 7600", brand: "AMD", score: 94 },
  { name: "Ryzen 5 9600X", brand: "AMD", score: 100 },
  { name: "Ryzen 7 1700", brand: "AMD", score: 58 },
  { name: "Ryzen 7 2700X", brand: "AMD", score: 66 },
  { name: "Ryzen 7 3700X", brand: "AMD", score: 80 },
  { name: "Ryzen 7 5700X", brand: "AMD", score: 86 },
  { name: "Ryzen 7 5800X", brand: "AMD", score: 90 },
  { name: "Ryzen 7 5800X3D", brand: "AMD", score: 96 },
  { name: "Ryzen 7 7700X", brand: "AMD", score: 100 },
  { name: "Ryzen 7 7800X3D", brand: "AMD", score: 108 },
  { name: "Ryzen 7 9700X", brand: "AMD", score: 106 },
  { name: "Ryzen 7 9800X3D", brand: "AMD", score: 118 },
  { name: "Ryzen 9 3900X", brand: "AMD", score: 90 },
  { name: "Ryzen 9 5900X", brand: "AMD", score: 100 },
  { name: "Ryzen 9 5950X", brand: "AMD", score: 106 },
  { name: "Ryzen 9 7900X", brand: "AMD", score: 112 },
  { name: "Ryzen 9 7950X", brand: "AMD", score: 118 },
  { name: "Ryzen 9 9900X", brand: "AMD", score: 116 },
  { name: "Ryzen 9 9950X", brand: "AMD", score: 124 },
];

export const CPU_TIERS: CpuTierOption[] = [
  { name: "入门双核", desc: "赛扬 / 老奔腾级别", score: 16 },
  { name: "老款四核", desc: "酷睿2 Q 系列 / 速龙 II X4", score: 34 },
  { name: "主流六核", desc: "i5 十代 / Ryzen 5 水平", score: 60 },
  { name: "性能八核", desc: "i7 / Ryzen 7 水平", score: 86 },
  { name: "旗舰多核", desc: "i9 / Ryzen 9 / X3D 水平", score: 112 },
];

export function cpuTierLabel(score: number): string {
  if (score < 24) return "核显级";
  if (score < 50) return "入门";
  if (score < 76) return "主流";
  if (score < 100) return "中端";
  if (score < 120) return "高性能";
  return "旗舰";
}

/* ---------------- GPU ---------------- */

export const GPU_MODELS: GpuModel[] = [
  /* NVIDIA — 亮机卡 / 老将 */
  { name: "GeForce 210", brand: "NVIDIA", score: 5 },
  { name: "GeForce GT 610", brand: "NVIDIA", score: 6 },
  { name: "GeForce GT 630", brand: "NVIDIA", score: 8 },
  { name: "GeForce GT 730", brand: "NVIDIA", score: 10 },
  { name: "GeForce GT 1030", brand: "NVIDIA", score: 14 },
  { name: "GeForce GTX 650", brand: "NVIDIA", score: 16 },
  { name: "GeForce GTX 660", brand: "NVIDIA", score: 22 },
  { name: "GeForce GTX 750", brand: "NVIDIA", score: 20 },
  { name: "GeForce GTX 750 Ti", brand: "NVIDIA", score: 24 },
  { name: "GeForce GTX 760", brand: "NVIDIA", score: 30 },
  { name: "GeForce GTX 950", brand: "NVIDIA", score: 26 },
  { name: "GeForce GTX 960", brand: "NVIDIA", score: 30 },
  { name: "GeForce GTX 970", brand: "NVIDIA", score: 44 },
  { name: "GeForce GTX 980", brand: "NVIDIA", score: 52 },
  { name: "GeForce GTX 980 Ti", brand: "NVIDIA", score: 58 },
  /* NVIDIA — 10 / 16 系 */
  { name: "GeForce GTX 1050", brand: "NVIDIA", score: 32 },
  { name: "GeForce GTX 1050 Ti", brand: "NVIDIA", score: 36 },
  { name: "GeForce GTX 1060 3GB", brand: "NVIDIA", score: 42 },
  { name: "GeForce GTX 1060 6GB", brand: "NVIDIA", score: 46 },
  { name: "GeForce GTX 1070", brand: "NVIDIA", score: 58 },
  { name: "GeForce GTX 1070 Ti", brand: "NVIDIA", score: 62 },
  { name: "GeForce GTX 1080", brand: "NVIDIA", score: 68 },
  { name: "GeForce GTX 1080 Ti", brand: "NVIDIA", score: 80 },
  { name: "GeForce GTX 1650", brand: "NVIDIA", score: 40 },
  { name: "GeForce GTX 1650 Super", brand: "NVIDIA", score: 48 },
  { name: "GeForce GTX 1660", brand: "NVIDIA", score: 54 },
  { name: "GeForce GTX 1660 Super", brand: "NVIDIA", score: 58 },
  { name: "GeForce GTX 1660 Ti", brand: "NVIDIA", score: 60 },
  /* NVIDIA — RTX 20 / 30 系 */
  { name: "GeForce RTX 2060", brand: "NVIDIA", score: 62 },
  { name: "GeForce RTX 2060 Super", brand: "NVIDIA", score: 68 },
  { name: "GeForce RTX 2070", brand: "NVIDIA", score: 72 },
  { name: "GeForce RTX 2070 Super", brand: "NVIDIA", score: 76 },
  { name: "GeForce RTX 2080", brand: "NVIDIA", score: 84 },
  { name: "GeForce RTX 2080 Super", brand: "NVIDIA", score: 88 },
  { name: "GeForce RTX 2080 Ti", brand: "NVIDIA", score: 94 },
  { name: "GeForce RTX 3050", brand: "NVIDIA", score: 52 },
  { name: "GeForce RTX 3060", brand: "NVIDIA", score: 66 },
  { name: "GeForce RTX 3060 Ti", brand: "NVIDIA", score: 78 },
  { name: "GeForce RTX 3070", brand: "NVIDIA", score: 88 },
  { name: "GeForce RTX 3070 Ti", brand: "NVIDIA", score: 92 },
  { name: "GeForce RTX 3080", brand: "NVIDIA", score: 104 },
  { name: "GeForce RTX 3080 Ti", brand: "NVIDIA", score: 108 },
  { name: "GeForce RTX 3090", brand: "NVIDIA", score: 112 },
  { name: "GeForce RTX 3090 Ti", brand: "NVIDIA", score: 116 },
  /* NVIDIA — RTX 40 / 50 系 */
  { name: "GeForce RTX 4060", brand: "NVIDIA", score: 74 },
  { name: "GeForce RTX 4060 Ti", brand: "NVIDIA", score: 84 },
  { name: "GeForce RTX 4070", brand: "NVIDIA", score: 96 },
  { name: "GeForce RTX 4070 Super", brand: "NVIDIA", score: 104 },
  { name: "GeForce RTX 4070 Ti", brand: "NVIDIA", score: 110 },
  { name: "GeForce RTX 4070 Ti Super", brand: "NVIDIA", score: 114 },
  { name: "GeForce RTX 4080", brand: "NVIDIA", score: 124 },
  { name: "GeForce RTX 4080 Super", brand: "NVIDIA", score: 128 },
  { name: "GeForce RTX 4090", brand: "NVIDIA", score: 150 },
  { name: "GeForce RTX 5060", brand: "NVIDIA", score: 86 },
  { name: "GeForce RTX 5060 Ti", brand: "NVIDIA", score: 98 },
  { name: "GeForce RTX 5070", brand: "NVIDIA", score: 112 },
  { name: "GeForce RTX 5070 Ti", brand: "NVIDIA", score: 128 },
  { name: "GeForce RTX 5080", brand: "NVIDIA", score: 144 },
  { name: "GeForce RTX 5090", brand: "NVIDIA", score: 170 },
  /* AMD Radeon — 经典 */
  { name: "Radeon HD 5450", brand: "AMD", score: 5 },
  { name: "Radeon HD 6450", brand: "AMD", score: 6 },
  { name: "Radeon HD 6770", brand: "AMD", score: 12 },
  { name: "Radeon HD 7750", brand: "AMD", score: 14 },
  { name: "Radeon HD 7770", brand: "AMD", score: 18 },
  { name: "Radeon HD 7850", brand: "AMD", score: 24 },
  { name: "Radeon HD 7870", brand: "AMD", score: 28 },
  { name: "Radeon R7 260X", brand: "AMD", score: 22 },
  { name: "Radeon R7 370", brand: "AMD", score: 26 },
  { name: "Radeon R9 270X", brand: "AMD", score: 30 },
  { name: "Radeon R9 380", brand: "AMD", score: 36 },
  { name: "Radeon R9 390", brand: "AMD", score: 44 },
  /* AMD Radeon — RX 400~5000 */
  { name: "Radeon RX 460", brand: "AMD", score: 22 },
  { name: "Radeon RX 470", brand: "AMD", score: 40 },
  { name: "Radeon RX 480", brand: "AMD", score: 46 },
  { name: "Radeon RX 550", brand: "AMD", score: 16 },
  { name: "Radeon RX 560", brand: "AMD", score: 20 },
  { name: "Radeon RX 570", brand: "AMD", score: 42 },
  { name: "Radeon RX 580", brand: "AMD", score: 48 },
  { name: "Radeon RX 590", brand: "AMD", score: 52 },
  { name: "Radeon RX 5500 XT", brand: "AMD", score: 46 },
  { name: "Radeon RX 5600 XT", brand: "AMD", score: 60 },
  { name: "Radeon RX 5700", brand: "AMD", score: 64 },
  { name: "Radeon RX 5700 XT", brand: "AMD", score: 70 },
  { name: "Radeon RX 6500 XT", brand: "AMD", score: 36 },
  { name: "Radeon RX 6600", brand: "AMD", score: 68 },
  { name: "Radeon RX 6600 XT", brand: "AMD", score: 76 },
  { name: "Radeon RX 6700 XT", brand: "AMD", score: 86 },
  { name: "Radeon RX 6750 XT", brand: "AMD", score: 88 },
  { name: "Radeon RX 6800", brand: "AMD", score: 98 },
  { name: "Radeon RX 6800 XT", brand: "AMD", score: 106 },
  { name: "Radeon RX 6900 XT", brand: "AMD", score: 112 },
  { name: "Radeon RX 7600", brand: "AMD", score: 72 },
  { name: "Radeon RX 7700 XT", brand: "AMD", score: 92 },
  { name: "Radeon RX 7800 XT", brand: "AMD", score: 100 },
  { name: "Radeon RX 7900 GRE", brand: "AMD", score: 104 },
  { name: "Radeon RX 7900 XT", brand: "AMD", score: 118 },
  { name: "Radeon RX 7900 XTX", brand: "AMD", score: 128 },
  { name: "Radeon RX 9060 XT", brand: "AMD", score: 96 },
  { name: "Radeon RX 9070", brand: "AMD", score: 108 },
  { name: "Radeon RX 9070 XT", brand: "AMD", score: 124 },
  /* Intel 核显 / Arc */
  { name: "HD Graphics 3000", brand: "Intel", score: 4 },
  { name: "HD Graphics 4000", brand: "Intel", score: 6 },
  { name: "HD Graphics 4600", brand: "Intel", score: 8 },
  { name: "HD Graphics 530", brand: "Intel", score: 9 },
  { name: "HD Graphics 630", brand: "Intel", score: 10 },
  { name: "UHD Graphics 630", brand: "Intel", score: 12 },
  { name: "UHD Graphics 730", brand: "Intel", score: 14 },
  { name: "UHD Graphics 770", brand: "Intel", score: 18 },
  { name: "Iris Xe Graphics", brand: "Intel", score: 22 },
  { name: "Arc A380", brand: "Intel", score: 34 },
  { name: "Arc A580", brand: "Intel", score: 56 },
  { name: "Arc A750", brand: "Intel", score: 62 },
  { name: "Arc A770", brand: "Intel", score: 70 },
  { name: "Arc B570", brand: "Intel", score: 64 },
  { name: "Arc B580", brand: "Intel", score: 74 },
];

export const GPU_TIERS: GpuTierOption[] = [
  { name: "核显/亮机卡", desc: "UHD 核显 / GT 730 水平", score: 12 },
  { name: "入门独显", desc: "GTX 750Ti / RX 550 水平", score: 24 },
  { name: "主流甜品", desc: "GTX 1060 / RX 580 水平", score: 46 },
  { name: "中高端", desc: "RTX 2070 / RX 5700XT 水平", score: 72 },
  { name: "高端旗舰", desc: "RTX 3080 / RX 6800XT 水平", score: 106 },
];

export function gpuTierLabel(score: number): string {
  if (score < 12) return "核显级";
  if (score < 36) return "入门";
  if (score < 66) return "主流";
  if (score < 96) return "中端";
  if (score < 130) return "高性能";
  return "旗舰";
}

/* ---------------- 内存 ---------------- */

export const RAM_OPTIONS = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64];

export const CUSTOM_HARDWARE_KEY = "cip.customHardware.v1";
export const CUSTOM_GAMES_KEY = "cip.customGames.v1";

export function nearestModel(score: number, kind: "cpu" | "gpu"): { name: string; score: number } {
  const list = kind === "cpu" ? CPU_MODELS : GPU_MODELS;
  return list.reduce((best, m) =>
    Math.abs(m.score - score) < Math.abs(best.score - score) ? m : best
  );
}

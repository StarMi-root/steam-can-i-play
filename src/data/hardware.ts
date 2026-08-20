export type OsId = "win11" | "win10" | "win7" | "mac" | "linux";

export interface OsOption {
  id: OsId;
  name: string;
  sub: string;
  note: string;
}

export const OS_OPTIONS: OsOption[] = [
  { id: "win11", name: "Windows 11", sub: "64 位", note: "兼容全部 Steam 游戏" },
  { id: "win10", name: "Windows 10", sub: "64 位", note: "兼容绝大多数游戏" },
  { id: "win7", name: "Windows 7 / 8.1", sub: "旧版系统", note: "近年新游戏多要求 Win10+，将自动排除" },
  { id: "mac", name: "macOS", sub: "Intel / Apple 芯片", note: "仅匹配支持 Mac 的游戏" },
  { id: "linux", name: "Linux / SteamOS", sub: "含 Steam Deck", note: "仅匹配原生支持 Linux 的游戏" },
];

/** score = 相对性能指数（越大越强） */
export interface CpuModel {
  name: string;
  score: number;
  brand: "Intel" | "AMD";
}

export const CPU_MODELS: CpuModel[] = [
  { name: "奔腾 G4560 / G6405", score: 50, brand: "Intel" },
  { name: "i3-4170（4 代）", score: 85, brand: "Intel" },
  { name: "i5-4590（4 代）", score: 100, brand: "Intel" },
  { name: "i7-4790 / 4790K", score: 125, brand: "Intel" },
  { name: "i5-6500（6 代）", score: 115, brand: "Intel" },
  { name: "i5-7500（7 代）", score: 130, brand: "Intel" },
  { name: "i7-7700 / 7700K", score: 170, brand: "Intel" },
  { name: "i3-9100F", score: 130, brand: "Intel" },
  { name: "i5-8400（8 代）", score: 160, brand: "Intel" },
  { name: "i5-9400F", score: 175, brand: "Intel" },
  { name: "i7-9700K", score: 230, brand: "Intel" },
  { name: "i5-10400F", score: 230, brand: "Intel" },
  { name: "i7-10700", score: 260, brand: "Intel" },
  { name: "i5-11400F", score: 260, brand: "Intel" },
  { name: "i3-12100F", score: 290, brand: "Intel" },
  { name: "i5-12400F", score: 320, brand: "Intel" },
  { name: "i5-12600K", score: 360, brand: "Intel" },
  { name: "i5-13400F", score: 350, brand: "Intel" },
  { name: "i7-12700K", score: 400, brand: "Intel" },
  { name: "i5-14600K", score: 430, brand: "Intel" },
  { name: "i7-13700K", score: 460, brand: "Intel" },
  { name: "i9-13900K / 14900K", score: 505, brand: "Intel" },
  { name: "FX-6300", score: 70, brand: "AMD" },
  { name: "FX-8350", score: 95, brand: "AMD" },
  { name: "Ryzen 3 1200", score: 110, brand: "AMD" },
  { name: "Ryzen 5 1600", score: 150, brand: "AMD" },
  { name: "Ryzen 5 2600", score: 165, brand: "AMD" },
  { name: "Ryzen 3 3100", score: 170, brand: "AMD" },
  { name: "Ryzen 5 3600", score: 220, brand: "AMD" },
  { name: "Ryzen 7 3700X", score: 250, brand: "AMD" },
  { name: "Ryzen 5 5500", score: 250, brand: "AMD" },
  { name: "Ryzen 5 5600 / 5600X", score: 280, brand: "AMD" },
  { name: "Ryzen 7 5700X", score: 310, brand: "AMD" },
  { name: "Ryzen 9 5900X", score: 360, brand: "AMD" },
  { name: "Ryzen 7 5800X3D", score: 385, brand: "AMD" },
  { name: "Ryzen 5 7500F / 7600X", score: 400, brand: "AMD" },
  { name: "Ryzen 7 7700X", score: 420, brand: "AMD" },
  { name: "Ryzen 9 7900X", score: 470, brand: "AMD" },
  { name: "Ryzen 7 7800X3D", score: 480, brand: "AMD" },
  { name: "Ryzen 9 7950X", score: 520, brand: "AMD" },
];

export interface CpuTierOption {
  name: string;
  desc: string;
  score: number;
}

export const CPU_TIERS: CpuTierOption[] = [
  { name: "入门双核", desc: "赛扬 / 奔腾 / 老双核", score: 55 },
  { name: "老款四核", desc: "4~7 代 i5、FX 系列", score: 110 },
  { name: "主流六核", desc: "近五年 i5 / Ryzen 5", score: 230 },
  { name: "性能旗舰", desc: "近三年 i7/i9、Ryzen 7/9", score: 430 },
];

export interface GpuModel {
  name: string;
  score: number;
  brand: "NVIDIA" | "AMD" | "Intel";
  igpu?: boolean;
}

export const GPU_MODELS: GpuModel[] = [
  { name: "Intel UHD 630 核显", score: 25, brand: "Intel", igpu: true },
  { name: "Intel UHD 770 核显", score: 40, brand: "Intel", igpu: true },
  { name: "Intel Iris Xe 核显", score: 50, brand: "Intel", igpu: true },
  { name: "AMD Vega 8 核显（APU）", score: 45, brand: "AMD", igpu: true },
  { name: "AMD Radeon 780M 核显", score: 90, brand: "AMD", igpu: true },
  { name: "Intel Arc A380", score: 200, brand: "Intel" },
  { name: "Intel Arc A750", score: 420, brand: "Intel" },
  { name: "Intel Arc A770", score: 470, brand: "Intel" },
  { name: "GT 1030", score: 45, brand: "NVIDIA" },
  { name: "GTX 750 Ti", score: 100, brand: "NVIDIA" },
  { name: "GTX 950", score: 110, brand: "NVIDIA" },
  { name: "GTX 960", score: 140, brand: "NVIDIA" },
  { name: "GTX 1050", score: 150, brand: "NVIDIA" },
  { name: "GTX 1050 Ti", score: 165, brand: "NVIDIA" },
  { name: "GTX 970", score: 230, brand: "NVIDIA" },
  { name: "GTX 1650", score: 230, brand: "NVIDIA" },
  { name: "GTX 1060 6G", score: 260, brand: "NVIDIA" },
  { name: "GTX 980", score: 270, brand: "NVIDIA" },
  { name: "GTX 1650 Super", score: 290, brand: "NVIDIA" },
  { name: "GTX 1660", score: 310, brand: "NVIDIA" },
  { name: "GTX 1660 Super / Ti", score: 335, brand: "NVIDIA" },
  { name: "GTX 1070", score: 330, brand: "NVIDIA" },
  { name: "RTX 3050", score: 390, brand: "NVIDIA" },
  { name: "GTX 1080", score: 390, brand: "NVIDIA" },
  { name: "RTX 2060", score: 430, brand: "NVIDIA" },
  { name: "RTX 2060 Super", score: 470, brand: "NVIDIA" },
  { name: "GTX 1080 Ti", score: 480, brand: "NVIDIA" },
  { name: "RTX 2070 Super", score: 530, brand: "NVIDIA" },
  { name: "RTX 4060", score: 600, brand: "NVIDIA" },
  { name: "RTX 3060 / 3060 12G", score: 560, brand: "NVIDIA" },
  { name: "RTX 3060 Ti", score: 640, brand: "NVIDIA" },
  { name: "RTX 2080 Ti", score: 640, brand: "NVIDIA" },
  { name: "RTX 4060 Ti", score: 680, brand: "NVIDIA" },
  { name: "RTX 3070 / 3070 Ti", score: 700, brand: "NVIDIA" },
  { name: "RTX 4070", score: 780, brand: "NVIDIA" },
  { name: "RTX 4070 Super", score: 830, brand: "NVIDIA" },
  { name: "RTX 3080", score: 900, brand: "NVIDIA" },
  { name: "RTX 4070 Ti Super", score: 950, brand: "NVIDIA" },
  { name: "RTX 5070", score: 1050, brand: "NVIDIA" },
  { name: "RTX 4080 Super", score: 1100, brand: "NVIDIA" },
  { name: "RTX 5080", score: 1400, brand: "NVIDIA" },
  { name: "RTX 4090", score: 1600, brand: "NVIDIA" },
  { name: "RX 550", score: 70, brand: "AMD" },
  { name: "RX 560", score: 140, brand: "AMD" },
  { name: "RX 570", score: 230, brand: "AMD" },
  { name: "RX 580 8G", score: 265, brand: "AMD" },
  { name: "RX 590", score: 285, brand: "AMD" },
  { name: "RX 5500 XT", score: 300, brand: "AMD" },
  { name: "RX 5600 XT", score: 400, brand: "AMD" },
  { name: "RX 6600", score: 480, brand: "AMD" },
  { name: "RX 5700 XT", score: 520, brand: "AMD" },
  { name: "RX 6600 XT / 6650 XT", score: 530, brand: "AMD" },
  { name: "RX 7600", score: 560, brand: "AMD" },
  { name: "RX 6700 XT", score: 660, brand: "AMD" },
  { name: "RX 7700 XT", score: 760, brand: "AMD" },
  { name: "RX 7800 XT", score: 840, brand: "AMD" },
  { name: "RX 6800 XT", score: 880, brand: "AMD" },
  { name: "RX 7900 XT", score: 1000, brand: "AMD" },
  { name: "RX 7900 XTX", score: 1150, brand: "AMD" },
];

export const GPU_TIERS: { name: string; desc: string; score: number }[] = [
  { name: "核显水平", desc: "无独显 / 轻薄本", score: 35 },
  { name: "入门独显", desc: "750Ti / 1050 级别", score: 110 },
  { name: "中端甜品", desc: "1660S / 3050 级别", score: 330 },
  { name: "高端旗舰", desc: "4070 / 7800XT 及以上", score: 850 },
];

export const RAM_OPTIONS = [2, 4, 8, 16, 32, 64];

export function cpuTierLabel(score: number): string {
  if (score < 90) return "入门";
  if (score < 170) return "主流";
  if (score < 300) return "中端";
  if (score < 420) return "高性能";
  return "旗舰";
}

export function gpuTierLabel(score: number): string {
  if (score < 80) return "核显级";
  if (score < 200) return "入门";
  if (score < 400) return "主流";
  if (score < 700) return "高性能";
  return "旗舰";
}

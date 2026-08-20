/**
 * Linux 启动教程引擎：
 * 根据「发行版 + 主板品牌/芯片组 + 显卡厂商」生成定制化的 Steam 游戏启动与调试教程。
 */
import { OsId } from "./hardware";

export interface DistroMeta {
  id: OsId;
  name: string;
  base: string;
  pm: string; // 包管理器
  blurb: string;
}

export const LINUX_DISTROS: DistroMeta[] = [
  { id: "ubuntu", name: "Ubuntu", base: "Debian 系", pm: "apt", blurb: "用户最多，驱动支持最省心" },
  { id: "linuxmint", name: "Linux Mint", base: "Debian 系", pm: "apt", blurb: "界面友好，预装 Flatpak" },
  { id: "popos", name: "Pop!_OS", base: "Debian 系", pm: "apt", blurb: "系统自带 NVIDIA 驱动镜像" },
  { id: "debian", name: "Debian", base: "Debian 系", pm: "apt", blurb: "极稳定，需手动启用 non-free" },
  { id: "fedora", name: "Fedora", base: "RedHat 系", pm: "dnf", blurb: "内核新，需 RPM Fusion 源" },
  { id: "arch", name: "Arch Linux", base: "滚动更新", pm: "pacman", blurb: "软件最新，AUR 生态强大" },
  { id: "manjaro", name: "Manjaro", base: "Arch 系", pm: "pacman", blurb: "mhwd 自动管理驱动" },
  { id: "steamos", name: "SteamOS / Deck", base: "Arch 系", pm: "pacman", blurb: "Steam Deck 掌机系统" },
  { id: "otherlinux", name: "其他发行版", base: "—", pm: "通用", blurb: "openSUSE / Gentoo / NixOS…" },
];

export const MOBO_BRANDS = ["华硕 ASUS", "微星 MSI", "技嘉 Gigabyte", "华擎 ASRock", "七彩虹 Colorful", "昂达 Onda", "其他 / 不确定"];

export const INTEL_CHIPSETS = [
  "H61 / B75（LGA1155 老平台）",
  "B85 / H81（LGA1150）",
  "B150 / H170（LGA1151 早期）",
  "B250 / Z270",
  "B360 / B365 / Z390",
  "B460 / Z490",
  "B560 / Z590",
  "B660 / B760",
  "Z690 / Z790",
  "不确定",
];

export const AMD_CHIPSETS = [
  "A55 / A68（FM2+ 老平台）",
  "A320（AM4 入门）",
  "B350 / X370",
  "B450 / X470",
  "A520 / B550 / X570",
  "A620 / B650 / X670",
  "不确定",
];

export interface GuideStep {
  text: string;
  cmd?: string;
  note?: string;
}

export interface GuideSection {
  title: string;
  steps: GuideStep[];
}

export type GpuVendor = "nvidia" | "amd" | "intel" | "unknown";

export function gpuVendorOf(gpuName: string | undefined): GpuVendor {
  const s = (gpuName ?? "").toLowerCase();
  if (!s) return "unknown";
  if (/geforce|rtx|gtx|nvidia|quadro/.test(s)) return "nvidia";
  if (/radeon|rx\s?\d|vega|amd/.test(s)) return "amd";
  if (/intel|iris|uhd|arc/.test(s)) return "intel";
  return "unknown";
}

const isOldChipset = (chipset: string) =>
  /(H61|B75|B85|H81|A55|A68|LGA1155|LGA1150|FM2)/i.test(chipset);

const biosKeyOf = (brand: string) =>
  brand.includes("华硕") ? "开机连按 Del 或 F2"
  : brand.includes("微星") ? "开机连按 Del"
  : brand.includes("技嘉") ? "开机连按 Del（F12 选启动项）"
  : brand.includes("华擎") ? "开机连按 Del 或 F2"
  : "开机连按 Del / F2 / Esc（视品牌而定）";

interface DistroCmds {
  update: string;
  prep?: { cmd: string; note: string };
  nvidia: string;
  nvidiaNote: string;
  steam: string;
  gamemode: string;
}

const CMDS: Record<string, DistroCmds> = {
  ubuntu: {
    update: "sudo apt update && sudo apt full-upgrade -y",
    prep: { cmd: "sudo add-apt-repository universe multiverse", note: "启用 universe / multiverse 软件源（Steam 依赖 32 位库）" },
    nvidia: "sudo ubuntu-drivers autoinstall",
    nvidiaNote: "自动安装官方推荐的专有驱动，装完重启",
    steam: "sudo apt install -y steam",
    gamemode: "sudo apt install -y gamemode",
  },
  linuxmint: {
    update: "sudo apt update && sudo apt full-upgrade -y",
    prep: { cmd: "sudo apt install -y mesa-vulkan-drivers", note: "Mint 默认源已较完整，补装 Vulkan 运行库即可" },
    nvidia: "sudo ubuntu-drivers autoinstall",
    nvidiaNote: "Mint 与 Ubuntu 驱动通用；也可用「驱动管理器」图形界面安装",
    steam: "sudo apt install -y steam",
    gamemode: "sudo apt install -y gamemode",
  },
  popos: {
    update: "sudo apt update && sudo apt full-upgrade -y",
    nvidia: "sudo apt install -y system76-driver-nvidia",
    nvidiaNote: "Pop!_OS 的 NVIDIA 版镜像出厂已带驱动，此命令用于补装/修复",
    steam: "sudo apt install -y steam",
    gamemode: "sudo apt install -y gamemode",
  },
  debian: {
    update: "sudo apt update && sudo apt full-upgrade -y",
    prep: { cmd: "sudo dpkg --add-architecture i386 && sudo apt update", note: "Steam 需要 32 位库；并在 /etc/apt/sources.list 中为每行补上 non-free non-free-firmware 组件" },
    nvidia: "sudo apt install -y nvidia-driver firmware-misc-nonfree",
    nvidiaNote: "Debian 需先在软件源中启用 non-free 组件",
    steam: "sudo apt install -y steam-installer",
    gamemode: "sudo apt install -y gamemode",
  },
  fedora: {
    update: "sudo dnf upgrade -y",
    prep: {
      cmd: "sudo dnf install -y \"https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm\" \"https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm\"",
      note: "启用 RPM Fusion 源（NVIDIA 驱动与 Steam 都在这里）",
    },
    nvidia: "sudo dnf install -y akmod-nvidia",
    nvidiaNote: "akmod 会在内核更新时自动重建驱动模块",
    steam: "sudo dnf install -y steam",
    gamemode: "sudo dnf install -y gamemode",
  },
  arch: {
    update: "sudo pacman -Syu",
    prep: { cmd: "sudo sed -i '/^#\\[multilib\\]/,/^#Include/ s/^#//' /etc/pacman.conf && sudo pacman -Sy", note: "启用 [multilib] 32 位仓库（Steam 必需）" },
    nvidia: "sudo pacman -S --needed nvidia nvidia-utils lib32-nvidia-utils",
    nvidiaNote: "若使用 linux-lts 内核请改装 nvidia-lts",
    steam: "sudo pacman -S --needed steam steam-native-runtime",
    gamemode: "sudo pacman -S --needed gamemode lib32-gamemode",
  },
  manjaro: {
    update: "sudo pacman-mirrors -f5 && sudo pacman -Syu",
    nvidia: "sudo mhwd -a pci nonfree 0300",
    nvidiaNote: "mhwd 会自动识别显卡并安装对应专有驱动",
    steam: "sudo pacman -S --needed steam-manjaro",
    gamemode: "sudo pacman -S --needed gamemode lib32-gamemode",
  },
  steamos: {
    update: "sudo steamos-readonly disable && sudo pacman -Syu",
    nvidia: "echo 'Steam Deck 使用 APU 核显（AMD），驱动随系统内置，无需单独安装'",
    nvidiaNote: "Deck 掌机无需额外驱动；桌面模式性能受 TDP 限制属正常",
    steam: "sudo pacman -S --needed steam",
    gamemode: "SteamOS 已内置 GameMode（gamemoderun 可直接用）",
  },
  otherlinux: {
    update: "请使用你发行版的包管理器先完整更新系统",
    nvidia: "从发行版仓库或 NVIDIA 官网安装与你内核匹配的专有驱动",
    nvidiaNote: "关键词搜索：你的发行版名 + nvidia driver",
    steam: "优先使用 Flatpak：flatpak install flathub com.valvesoftware.Steam",
    gamemode: "通过包管理器安装 gamemode，或使用 Flatpak 版",
  },
};

/** 生成定制教程 */
export function buildLinuxGuide(
  distroId: OsId,
  brand: string,
  chipset: string,
  gpuName: string | undefined,
): GuideSection[] {
  const distro = LINUX_DISTROS.find((d) => d.id === distroId) ?? LINUX_DISTROS[LINUX_DISTROS.length - 1];
  const c = CMDS[distroId] ?? CMDS.otherlinux;
  const vendor = gpuVendorOf(gpuName);
  const old = isOldChipset(chipset);
  const out: GuideSection[] = [];

  /* 1 系统准备 */
  const prep: GuideStep[] = [{ text: "先把系统和软件源更新到最新", cmd: c.update }];
  if (c.prep) prep.push({ text: c.prep.note, cmd: c.prep.cmd });
  if (distroId === "arch") prep.push({ text: "确认 multilib 已启用后，同步一次数据库", cmd: "sudo pacman -Syu" });
  out.push({ title: `1 · 系统准备（${distro.name}）`, steps: prep });

  /* 2 显卡驱动 */
  const drv: GuideStep[] = [];
  if (vendor === "nvidia") {
    drv.push({ text: "安装 NVIDIA 专有驱动（开源 nouveau 玩 3D 游戏性能很差）", cmd: c.nvidia, note: c.nvidiaNote });
    drv.push({ text: "重启后验证驱动是否生效", cmd: "nvidia-smi", note: "能输出显卡型号和驱动版本即成功" });
  } else if (vendor === "amd") {
    drv.push({ text: "AMD 显卡使用内核自带开源驱动 + Mesa，无需手动装驱动" });
    drv.push({ text: "补装 Vulkan 与 32 位运行库", cmd: distro.pm === "apt" ? "sudo apt install -y mesa-vulkan-drivers libgl1-mesa-dri:i386" : distro.pm === "dnf" ? "sudo dnf install -y mesa-vulkan-drivers mesa-dri-drivers.i686" : distro.pm === "pacman" ? "sudo pacman -S --needed vulkan-radeon lib32-vulkan-radeon lib32-mesa" : "安装 mesa-vulkan-drivers 及对应 32 位包" });
    drv.push({ text: "验证 Vulkan 可用", cmd: "vulkaninfo --summary", note: "看不到 vulkaninfo 就先装 vulkan-tools 包" });
  } else if (vendor === "intel") {
    drv.push({ text: "Intel 核显 / Arc 使用 Mesa 开源驱动，一般开箱即用" });
    drv.push({ text: "补装 Vulkan", cmd: distro.pm === "apt" ? "sudo apt install -y mesa-vulkan-drivers intel-media-va-driver" : distro.pm === "pacman" ? "sudo pacman -S --needed vulkan-intel" : "安装 vulkan-intel / mesa-vulkan-drivers" });
    drv.push({ text: "核显性能有限，优先选择「轻量 / 独立」标签的游戏" });
  } else {
    drv.push({ text: "未识别显卡厂商：NVIDIA 卡请装专有驱动，AMD/Intel 用 Mesa 开源驱动即可" });
  }
  out.push({ title: "2 · 显卡驱动", steps: drv });

  /* 3 安装 Steam */
  const steam: GuideStep[] = [
    { text: "通过系统仓库安装 Steam", cmd: c.steam },
    { text: "或使用 Flatpak 通用版（任何发行版都可用）", cmd: "flatpak install flathub com.valvesoftware.Steam" },
  ];
  out.push({ title: `3 · 安装 Steam（${distro.pm}）`, steps: steam });

  /* 4 Proton */
  out.push({
    title: "4 · 开启 Proton（运行 Windows 游戏的关键）",
    steps: [
      { text: "Steam → 设置 → 兼容性 → 勾选「为所有其他产品启用 Steam Play」，版本选 Proton Experimental" },
      { text: "安装 ProtonUp-Qt 获取社区增强版 Proton-GE（兼容性更好）", cmd: "flatpak install flathub net.davidotek.pupgui2", note: "打开 ProtonUp-Qt → Add version → 选 GE-Proton 最新版 → 重启 Steam" },
      { text: "安装 GameMode 提升游戏帧率", cmd: c.gamemode, note: "游戏启动项加 gamemoderun %command% 即可生效" },
    ],
  });

  /* 5 主板与 BIOS */
  const bios: GuideStep[] = [
    { text: `进入 BIOS：${biosKeyOf(brand)}`, note: `当前主板：${brand} · ${chipset}` },
    { text: "关闭 Secure Boot（安全启动）", note: "NVIDIA 专有驱动未签名时，Secure Boot 开启会导致驱动加载失败、黑屏进不了桌面；也可选择注册 MOK 密钥保留 Secure Boot" },
    { text: "确认启动模式", note: old ? "老主板可能默认 CSM/Legacy 模式，建议切换为纯 UEFI 后重装系统，新内核对 UEFI 支持更好" : "保持 UEFI 模式即可；若系统装在 Legacy 模式下，混合模式可能引起启动问题" },
  ];
  if (!old && !chipset.includes("不确定")) {
    bios.push({ text: "开启内存 XMP / D.O.C.P 配置", note: `${brand} 主板在 BIOS 的 Ai Tweaker / OC / Tweaker 页面，开启后内存跑标称频率，帧数更稳` });
  }
  if (old) {
    bios.push({ text: "老平台额外提示", note: "该芯片组较老：使用 SATA SSD 即可显著提升体验；若 USB 安装介质无法启动，换 USB2.0 口或改用 Legacy 启动" });
  }
  out.push({ title: "5 · 主板与 BIOS 调优", steps: bios });

  /* 6 排查工具箱 */
  const dbg: GuideStep[] = [
    { text: "游戏无法启动时，强制输出 Proton 日志", note: "Steam 游戏属性 → 启动选项填入 PROTON_LOG=1 %command%，日志在 ~/steam-*.log" },
    { text: "验证 Vulkan 设备是否被识别", cmd: "vulkaninfo --summary" },
    { text: "用 GameMode 启动并观察是否仍闪退", cmd: "gamemoderun 你的游戏命令" },
    { text: "查看 Steam 自身日志", note: "~/.steam/steam/logs/ 下的 bootlog.txt 与 console 日志" },
    { text: "仍无法运行？", note: "在 ProtonDB.com 搜索该游戏查看社区评级与补丁参数；或点右下角 AI 助手描述你的报错" },
  ];
  out.push({ title: "6 · 常见故障排查", steps: dbg });

  return out;
}

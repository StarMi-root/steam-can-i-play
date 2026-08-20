/**
 * 内置 AI 助手：默认使用 Pollinations 免费文本模型（无需 API Key、无需配置）。
 * 网络不可用时自动降级为本地知识库问答，保证始终有回答。
 */

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface AiReply {
  text: string;
  source: "ai" | "kb";
}

const SYSTEM_PROMPT =
  "你是「能不能玩 CAN I PLAY」Steam 硬件匹配工具的内置 AI 助手。" +
  "用户会咨询：Steam 游戏能否在某配置上运行、CPU/GPU/内存升级建议、Windows/Linux（Proton、Steam Play、驱动、GameMode）游戏故障排查。" +
  "要求：用简体中文回答；简洁分点；涉及 Linux 时给出可复制的终端命令；不编造精确帧数，用区间估计；回答控制在 220 字以内。";

/** 调用免费模型（Pollinations text API，免 Key） */
async function callFreeModel(history: ChatMsg[]): Promise<string> {
  const ctrl = new AbortController();
  const t = window.setTimeout(() => ctrl.abort(), 28000);
  try {
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history.slice(-8)],
        model: "openai",
        private: true,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = (await res.text()).trim();
    if (!text) throw new Error("空响应");
    return text;
  } finally {
    window.clearTimeout(t);
  }
}

/* ---------- 本地知识库（离线兜底） ---------- */

const KB: { re: RegExp; a: string }[] = [
  { re: /黑屏|进不去|打不开|无法启动/, a: "常见处理顺序：① 验证游戏文件完整性；② 更新显卡驱动；③ Linux 用户在启动项加 PROTON_LOG=1 %command% 查看 ~/steam-*.log；④ 关闭游戏内覆盖层（Steam/Discord）；⑤ 以窗口模式启动试试。仍不行就把日志发给我看。" },
  { re: /闪退|崩溃|crash/i, a: "闪退排查：① 内存不足会直接闪退，先确认达到最低内存要求；② 更新/回退显卡驱动；③ 关闭超频与 XMP 不稳配置；④ Windows 可尝试以管理员身份运行；⑤ Linux 换 Proton-GE 版本再试。" },
  { re: /proton|steam\s*play/i, a: "开启 Proton：Steam 设置 → 兼容性 → 勾选「为所有其他产品启用 Steam Play」，版本选 Proton Experimental。想要更好兼容性，用 Flatpak 安装 ProtonUp-Qt 获取 GE-Proton，装完重启 Steam。" },
  { re: /帧数|fps|卡|掉帧/i, a: "提升帧数：① 降分辨率或开启 FSR/DLSS；② 关闭体积云、光追等重负载项；③ Linux 用 gamemoderun 前缀启动；④ 确认没被核显接管（笔记本选独显输出）；⑤ 内存组双通道对帧数影响很大。" },
  { re: /nvidia|英伟达|显卡驱动/, a: "NVIDIA 驱动：Windows 用 GeForce Experience/官网装最新 Game Ready 驱动；Ubuntu/Mint 执行 sudo ubuntu-drivers autoinstall；Fedora 先启 RPM Fusion 再 sudo dnf install akmod-nvidia；Arch/Manjaro 装 nvidia + nvidia-utils。装完重启。" },
  { re: /内存不足|ram|加内存/i, a: "内存不足的表现：加载慢、卡顿、闪退。建议：网游 8GB 起步、新 3A 直接 16GB 双通道、大型开放世界 32GB 更从容。双通道比单条大容量帧数更稳。" },
  { re: /升级|换什么|买什么|推荐.*配置/, a: "升级优先级看瓶颈：报告里若提示 GPU 瓶颈就先换显卡（提升最直接）；CPU 瓶颈且显卡已较强再换 CPU；内存不足先补内存（最便宜见效快）。告诉我你的具体配置，我给更精确的建议。" },
  { re: /secure\s*boot|安全启动/i, a: "Secure Boot 会拦截未签名驱动导致黑屏：进 BIOS（开机按 Del/F2）关闭 Secure Boot；或保留开启但为 NVIDIA 驱动注册 MOK 密钥（mokutil --import）。" },
  { re: /手柄|控制器|controller/i, a: "Steam 内置手柄支持：设置 → 控制器 → 启用对应配置支持（Xbox/PS/通用）。Linux 下 Xbox 手柄需 xpad 或 xone 驱动；多数游戏内直接识别。" },
  { re: /汉化|中文|语言/, a: "改语言：游戏属性 → 语言 → 选择简体中文（若商店页标注支持）。不支持中文的游戏可去对应社区找汉化补丁，注意版本匹配。" },
  { re: /核显|集成显卡|uhd|iris/i, a: "核显能玩：2D 独立游戏、老网游（CS:Source、DOTA2 低画质）、模拟器。想玩 3A 建议加独显；笔记本核显请确认内存是双通道，能明显提升核显性能。" },
  { re: /deck|steamos|掌机/i, a: "Steam Deck 开箱即玩大部分游戏：游戏页看 Deck 兼容性标识；桌面模式下可用 ProtonUp-Qt 装 GE-Proton 提升兼容；性能不足时降为 800p + FSR。" },
  { re: /你好|在吗|help|帮助/, a: "你好！我可以帮你：判断某游戏你的配置能否运行、给出升级建议、排查启动/闪退/黑屏问题、指导 Linux 下 Proton 与驱动配置。直接描述你的问题或配置即可。" },
];

function localKb(q: string): string {
  for (const { re, a } of KB) if (re.test(q)) return a;
  return "（离线知识库回答）暂时没匹配到现成答案。你可以换个说法描述问题，例如：游戏名 + 配置 + 症状（黑屏/闪退/帧数低）。联网恢复后我会用在线模型给你更详细的解答。";
}

export async function askAI(history: ChatMsg[]): Promise<AiReply> {
  try {
    const text = await callFreeModel(history);
    return { text, source: "ai" };
  } catch {
    const last = [...history].reverse().find((m) => m.role === "user");
    return { text: localKb(last?.content ?? ""), source: "kb" };
  }
}

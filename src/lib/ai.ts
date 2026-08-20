/**
 * 内置 AI 助手核心：
 * - 免费模式：Pollinations 文本模型，无需 Key、开箱即用（默认）
 * - 自定义 API：任意 OpenAI 兼容接口（OpenAI / DeepSeek / Kimi / 智谱 / Groq / OpenRouter / LM Studio…）
 * - 本地 AI：Ollama / LM Studio 本机服务
 * 任一通道失败时自动降级为本地知识库问答，保证始终有回答。
 */

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface AiReply {
  text: string;
  source: "ai" | "kb";
  /** 实际使用的通道描述，如「DeepSeek · deepseek-chat」「本地 Ollama · llama3」 */
  provider?: string;
}

export interface OpenAiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export interface AiConfig {
  provider: "free" | "openai" | "ollama";
  openai: OpenAiConfig;
  ollama: OllamaConfig;
}

export const AI_CONFIG_KEY = "cip.aiConfig.v1";

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "free",
  openai: { baseUrl: "https://api.deepseek.com", apiKey: "", model: "deepseek-chat" },
  ollama: { baseUrl: "http://localhost:11434", model: "" },
};

/** OpenAI 兼容接口预设（含本地服务） */
export const OPENAI_PRESETS: { label: string; baseUrl: string; model: string; needKey: boolean }[] = [
  { label: "DeepSeek（推荐）", baseUrl: "https://api.deepseek.com", model: "deepseek-chat", needKey: true },
  { label: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini", needKey: true },
  { label: "Moonshot Kimi", baseUrl: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k", needKey: true },
  { label: "智谱 GLM", baseUrl: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash", needKey: true },
  { label: "Groq（极速）", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", needKey: true },
  { label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "deepseek/deepseek-chat", needKey: true },
  { label: "LM Studio（本机）", baseUrl: "http://localhost:1234/v1", model: "local-model", needKey: false },
];

export function loadAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(AI_CONFIG_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    const p = JSON.parse(raw);
    return {
      provider: p?.provider === "openai" || p?.provider === "ollama" ? p.provider : "free",
      openai: { ...DEFAULT_AI_CONFIG.openai, ...(p?.openai ?? {}) },
      ollama: { ...DEFAULT_AI_CONFIG.ollama, ...(p?.ollama ?? {}) },
    };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAiConfig(cfg: AiConfig) {
  try { localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg)); } catch { /* 忽略 */ }
}

export function providerLabel(cfg: AiConfig): string {
  if (cfg.provider === "openai") {
    const preset = OPENAI_PRESETS.find((p) => p.baseUrl === cfg.openai.baseUrl.trim().replace(/\/+$/, ""));
    return `${preset?.label.replace(/（.*）/, "") ?? "自定义 API"} · ${cfg.openai.model || "未设模型"}`;
  }
  if (cfg.provider === "ollama") return `本地 Ollama · ${cfg.ollama.model || "未选模型"}`;
  return "免费模型 · Pollinations";
}

const SYSTEM_PROMPT =
  "你是「能不能玩 CAN I PLAY」Steam 硬件匹配工具的内置 AI 助手。" +
  "用户会咨询：Steam 游戏能否在某配置上运行、CPU/GPU/内存升级建议、Windows/Linux（Proton、Steam Play、驱动、GameMode）游戏故障排查。" +
  "要求：用简体中文回答；简洁分点；涉及 Linux 时给出可复制的终端命令；不编造精确帧数，用区间估计；回答控制在 220 字以内。";

/** 将用户录入的硬件档案拼进系统提示，让 AI 基于真实配置回答 */
const systemMsg = (context?: string): { role: "system"; content: string } => ({
  role: "system",
  content: context
    ? `${SYSTEM_PROMPT}\n\n【用户当前录入的硬件档案】\n${context}\n请优先基于以上真实配置作答，不要重复询问档案中已有的信息。`
    : SYSTEM_PROMPT,
});

/* ---------------- 三种通道 ---------------- */

async function withTimeout(ms: number): Promise<AbortSignal> {
  const ctrl = new AbortController();
  window.setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

/** 免费通道：Pollinations text API（免 Key） */
async function callFreeModel(history: ChatMsg[], context?: string): Promise<string> {
  const res = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [systemMsg(context), ...history.slice(-8)],
      model: "openai",
      private: true,
    }),
    signal: await withTimeout(28000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = (await res.text()).trim();
  if (!text) throw new Error("空响应");
  return text;
}

/** 自定义通道：OpenAI 兼容接口 */
async function callOpenAiCompatible(cfg: OpenAiConfig, history: ChatMsg[], context?: string): Promise<string> {
  const base = cfg.baseUrl.trim().replace(/\/+$/, "");
  if (!base) throw new Error("未填写 Base URL");
  if (!cfg.model.trim()) throw new Error("未填写模型名");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cfg.apiKey.trim() ? { Authorization: `Bearer ${cfg.apiKey.trim()}` } : {}),
    },
    body: JSON.stringify({
      model: cfg.model.trim(),
      messages: [systemMsg(context), ...history.slice(-8)],
      stream: false,
      max_tokens: 640,
    }),
    signal: await withTimeout(40000),
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.text()).slice(0, 120); } catch { /* 忽略 */ }
    throw new Error(`接口返回 HTTP ${res.status}${detail ? `：${detail}` : ""}`);
  }
  const data = await res.json();
  const text: unknown = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("接口未返回有效内容");
  return text.trim();
}

/** 本地通道：Ollama（/api/chat） */
async function callOllama(cfg: OllamaConfig, history: ChatMsg[], context?: string): Promise<string> {
  const base = cfg.baseUrl.trim().replace(/\/+$/, "");
  if (!base) throw new Error("未填写 Ollama 地址");
  if (!cfg.model.trim()) throw new Error("未选择 Ollama 模型");
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: cfg.model.trim(),
      messages: [systemMsg(context), ...history.slice(-8)],
      stream: false,
    }),
    signal: await withTimeout(60000),
  });
  if (!res.ok) throw new Error(`Ollama 返回 HTTP ${res.status}`);
  const data = await res.json();
  const text: unknown = data?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("Ollama 未返回有效内容");
  return text.trim();
}

/* ---------------- 连接测试 / 模型列表 ---------------- */

export interface TestResult { ok: boolean; msg: string }

export async function testAiConfig(cfg: AiConfig): Promise<TestResult> {
  try {
    if (cfg.provider === "openai") {
      const base = cfg.openai.baseUrl.trim().replace(/\/+$/, "");
      if (!base) return { ok: false, msg: "请先填写 Base URL" };
      const res = await fetch(`${base}/models`, {
        headers: cfg.openai.apiKey.trim() ? { Authorization: `Bearer ${cfg.openai.apiKey.trim()}` } : {},
        signal: await withTimeout(10000),
      });
      if (!res.ok) return { ok: false, msg: `连接失败（HTTP ${res.status}），请检查地址与 Key` };
      const data = await res.json();
      const n = Array.isArray(data?.data) ? data.data.length : 0;
      return { ok: true, msg: `连接成功${n ? ` · 可用模型 ${n} 个` : ""}` };
    }
    if (cfg.provider === "ollama") {
      const models = await listOllamaModels(cfg.ollama.baseUrl);
      return { ok: true, msg: `本地服务在线 · 已装 ${models.length} 个模型` };
    }
    const res = await fetch("https://text.pollinations.ai/models", { signal: await withTimeout(10000) });
    return res.ok
      ? { ok: true, msg: "免费通道可用（Pollinations）" }
      : { ok: false, msg: `免费通道异常（HTTP ${res.status}）` };
  } catch {
    return {
      ok: false,
      msg: cfg.provider === "ollama"
        ? "无法连接本地服务：确认 Ollama 已启动，且已允许跨域（设置环境变量 OLLAMA_ORIGINS=* 后重启）"
        : "连接超时或被拦截，请检查网络 / 代理后重试",
    };
  }
}

export async function listOllamaModels(baseUrl: string): Promise<string[]> {
  const base = baseUrl.trim().replace(/\/+$/, "") || "http://localhost:11434";
  const res = await fetch(`${base}/api/tags`, { signal: await withTimeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const models: unknown[] = Array.isArray(data?.models) ? data.models : [];
  return models.map((m: any) => String(m?.name ?? "")).filter(Boolean);
}

/* ---------------- 本地知识库（离线兜底） ---------------- */

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

/* ---------------- 统一入口 ---------------- */

export async function askAI(
  history: ChatMsg[],
  cfg: AiConfig = DEFAULT_AI_CONFIG,
  /** 用户录入的硬件档案摘要，注入系统提示 */
  context?: string,
): Promise<AiReply> {
  const last = [...history].reverse().find((m) => m.role === "user");
  const fallback = (reason: string): AiReply => ({
    text: `${reason}\n\n${localKb(last?.content ?? "")}`,
    source: "kb",
    provider: "离线知识库",
  });

  if (cfg.provider === "openai") {
    try {
      const text = await callOpenAiCompatible(cfg.openai, history, context);
      return { text, source: "ai", provider: providerLabel(cfg) };
    } catch (e) {
      return fallback(`⚠ 自定义 API 不可用（${e instanceof Error ? e.message : "网络错误"}），已切换离线知识库：`);
    }
  }
  if (cfg.provider === "ollama") {
    try {
      const text = await callOllama(cfg.ollama, history, context);
      return { text, source: "ai", provider: providerLabel(cfg) };
    } catch (e) {
      return fallback(`⚠ 本地 Ollama 不可用（${e instanceof Error ? e.message : "连接失败"}），已切换离线知识库：`);
    }
  }
  try {
    const text = await callFreeModel(history, context);
    return { text, source: "ai", provider: "免费模型 · Pollinations" };
  } catch {
    return fallback("⚠ 免费模型暂不可用，已切换离线知识库：");
  }
}

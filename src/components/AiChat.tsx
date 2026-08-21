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
import { useEffect, useRef, useState } from "react";
import {
  AiConfig, AiReply, ChatMsg, OPENAI_PRESETS, TestResult,
  askAI, listOllamaModels, loadAiConfig, providerLabel, saveAiConfig, testAiConfig,
} from "../lib/ai";
import { ArrowLeft, CheckIcon, GlobeIcon, RobotIcon, SendIcon, SettingsIcon, WarnIcon } from "./icons";

interface Msg extends ChatMsg {
  source?: AiReply["source"];
  provider?: string;
}

const QUICK = ["Linux 游戏黑屏怎么办？", "我的配置该先升级什么？", "Proton 怎么安装？", "帧数低怎么优化？"];

const inputCls =
  "w-full rounded-sm border border-ink-700 bg-ink-950 px-2.5 py-2 text-xs text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-amber-core/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold tracking-wide text-ink-500">{label}</span>
      {children}
    </label>
  );
}

/* ---------- AI 通道设置面板 ---------- */

function ConfigPanel({
  config, onSave, onBack,
}: {
  config: AiConfig;
  onSave: (c: AiConfig) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<AiConfig>(config);
  const [test, setTest] = useState<{ state: "idle" | "busy" | "ok" | "fail"; msg: string }>({ state: "idle", msg: "" });
  const [ollamaModels, setOllamaModels] = useState<string[] | null>(null);
  const [ollamaBusy, setOllamaBusy] = useState(false);

  const refreshOllama = async (base: string) => {
    setOllamaBusy(true);
    try {
      setOllamaModels(await listOllamaModels(base));
    } catch {
      setOllamaModels([]);
    } finally {
      setOllamaBusy(false);
    }
  };

  const runTest = async () => {
    setTest({ state: "busy", msg: "正在连接…" });
    const r: TestResult = await testAiConfig(draft);
    setTest({ state: r.ok ? "ok" : "fail", msg: r.msg });
  };

  const providers: { id: AiConfig["provider"]; label: string; desc: string }[] = [
    { id: "free", label: "免费模型", desc: "Pollinations · 无需任何配置，开箱即用" },
    { id: "openai", label: "自定义 API", desc: "OpenAI 兼容接口 · DeepSeek / Kimi / GLM / Groq…" },
    { id: "ollama", label: "本地 AI", desc: "Ollama / LM Studio 本机模型，数据不出电脑" },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ink-800 px-4 py-2.5">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-ink-300 transition-colors hover:text-amber-core">
          <ArrowLeft className="h-3.5 w-3.5" /> 返回对话
        </button>
        <span className="ml-auto font-display text-[10px] tracking-[0.2em] text-ink-600">AI PROVIDER</span>
      </div>

      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {/* 通道选择 */}
        <div className="space-y-2">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => { setDraft((d) => ({ ...d, provider: p.id })); setTest({ state: "idle", msg: "" }); }}
              className={`flex w-full items-center gap-3 rounded-sm border px-3 py-2.5 text-left transition-all ${
                draft.provider === p.id
                  ? "border-amber-core bg-amber-core/[0.08]"
                  : "border-ink-700 bg-ink-850 hover:border-ink-600"
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                draft.provider === p.id ? "border-amber-core bg-amber-core text-ink-950" : "border-ink-600"
              }`}>
                {draft.provider === p.id && <CheckIcon className="h-2.5 w-2.5" />}
              </span>
              <span>
                <span className={`block text-xs font-black ${draft.provider === p.id ? "text-amber-hi" : "text-ink-100"}`}>{p.label}</span>
                <span className="block text-[10px] text-ink-500">{p.desc}</span>
              </span>
            </button>
          ))}
        </div>

        {/* 自定义 API 配置 */}
        {draft.provider === "openai" && (
          <div className="animate-fade-up space-y-2.5 rounded-sm border border-ink-800 bg-ink-950/60 p-3">
            <Field label="接口预设（选择后自动填充，可再修改）">
              <select
                value={""}
                onChange={(e) => {
                  const p = OPENAI_PRESETS[Number(e.target.value)];
                  if (p) setDraft((d) => ({ ...d, openai: { baseUrl: p.baseUrl, apiKey: d.openai.apiKey, model: p.model } }));
                }}
                className={inputCls}
              >
                <option value="">— 选择预设 —</option>
                {OPENAI_PRESETS.map((p, i) => (
                  <option key={p.label} value={i}>{p.label} · {p.baseUrl}</option>
                ))}
              </select>
            </Field>
            <Field label="Base URL（OpenAI 兼容接口地址）">
              <input
                value={draft.openai.baseUrl}
                onChange={(e) => setDraft((d) => ({ ...d, openai: { ...d.openai, baseUrl: e.target.value } }))}
                placeholder="https://api.deepseek.com"
                className={inputCls + " font-display"}
              />
            </Field>
            <Field label="API Key（仅保存在本机浏览器）">
              <input
                type="password"
                value={draft.openai.apiKey}
                onChange={(e) => setDraft((d) => ({ ...d, openai: { ...d.openai, apiKey: e.target.value } }))}
                placeholder="sk-…"
                className={inputCls + " font-display"}
              />
            </Field>
            <Field label="模型名">
              <input
                value={draft.openai.model}
                onChange={(e) => setDraft((d) => ({ ...d, openai: { ...d.openai, model: e.target.value } }))}
                placeholder="deepseek-chat"
                className={inputCls + " font-display"}
              />
            </Field>
            <p className="text-[10px] leading-relaxed text-ink-600">
              兼容所有 /v1/chat/completions 风格接口。LM Studio 本机服务填 http://localhost:1234/v1 并在其 Server 页开启 CORS。
            </p>
          </div>
        )}

        {/* Ollama 配置 */}
        {draft.provider === "ollama" && (
          <div className="animate-fade-up space-y-2.5 rounded-sm border border-ink-800 bg-ink-950/60 p-3">
            <Field label="Ollama 服务地址">
              <div className="flex gap-2">
                <input
                  value={draft.ollama.baseUrl}
                  onChange={(e) => setDraft((d) => ({ ...d, ollama: { ...d.ollama, baseUrl: e.target.value } }))}
                  placeholder="http://localhost:11434"
                  className={inputCls + " font-display"}
                />
                <button
                  onClick={() => refreshOllama(draft.ollama.baseUrl)}
                  disabled={ollamaBusy}
                  className="shrink-0 rounded-sm border border-teal-core/50 bg-teal-core/[0.08] px-3 text-[11px] font-bold text-teal-core transition-colors hover:bg-teal-core/[0.18] disabled:opacity-50"
                >
                  {ollamaBusy ? "扫描中…" : "拉取模型"}
                </button>
              </div>
            </Field>
            <Field label="模型（从本机服务读取）">
              <select
                value={draft.ollama.model}
                onChange={(e) => setDraft((d) => ({ ...d, ollama: { ...d.ollama, model: e.target.value } }))}
                className={inputCls}
              >
                <option value="">{ollamaModels === null ? "先点「拉取模型」" : ollamaModels.length === 0 ? "未检测到模型（服务未启动？）" : "— 选择模型 —"}</option>
                {(ollamaModels ?? []).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            {ollamaModels === null && (
              <input
                value={draft.ollama.model}
                onChange={(e) => setDraft((d) => ({ ...d, ollama: { ...d.ollama, model: e.target.value } }))}
                placeholder="或手动输入模型名，如 llama3.2 / qwen2.5"
                className={inputCls + " font-display"}
              />
            )}
            <p className="text-[10px] leading-relaxed text-ink-600">
              需允许浏览器跨域：设置环境变量 <code className="font-display text-teal-core">OLLAMA_ORIGINS=*</code> 后重启 Ollama；
              模型可用 <code className="font-display text-teal-core">ollama pull llama3.2</code> 安装。
            </p>
          </div>
        )}

        {/* 测试与保存 */}
        <div className="space-y-2">
          {test.state !== "idle" && (
            <div className={`animate-fade-up flex items-start gap-2 rounded-sm border px-3 py-2 text-[11px] leading-relaxed ${
              test.state === "ok" ? "border-ok/40 bg-ok/[0.08] text-ok"
                : test.state === "fail" ? "border-bad/40 bg-bad/[0.08] text-bad"
                  : "border-ink-700 bg-ink-850 text-ink-400"
            }`}>
              {test.state === "ok" ? <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : test.state === "fail" ? <WarnIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <GlobeIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-pulse" />}
              {test.msg}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={runTest}
              disabled={test.state === "busy"}
              className="flex-1 rounded-sm border border-ink-600 bg-ink-850 px-3 py-2.5 text-xs font-bold text-ink-200 transition-colors hover:border-teal-core/60 hover:text-teal-core disabled:opacity-50"
            >
              {test.state === "busy" ? "测试中…" : "测试连接"}
            </button>
            <button
              onClick={() => { saveAiConfig(draft); onSave(draft); }}
              className="flex-1 rounded-sm bg-amber-core px-3 py-2.5 text-xs font-black text-ink-950 transition-all hover:brightness-110 active:scale-[0.97]"
            >
              保存并启用
            </button>
          </div>
          <p className="text-center text-[10px] text-ink-600">
            配置仅保存在本机浏览器；任一通道失败时自动降级离线知识库
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- 聊天主体 ---------- */

export default function AiChat({ context }: { context?: string }) {
  const [open, setOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showCtx, setShowCtx] = useState(false);
  const [config, setConfig] = useState<AiConfig>(() => loadAiConfig());
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, pending, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (showConfig ? setShowConfig(false) : setOpen(false));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, showConfig]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || pending) return;
    setInput("");
    const history: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(history);
    setPending(true);
    const reply: AiReply = await askAI(history, config, context);
    setMsgs((cur) => [...cur, { role: "assistant", content: reply.text, source: reply.source, provider: reply.provider }]);
    setPending(false);
  };

  const isFree = config.provider === "free";

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="AI 助手（默认免费模型，可接入自定义 API / 本地 AI）"
        className={`fixed bottom-4 right-4 z-40 flex items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
          open
            ? "border-amber-core bg-amber-core text-ink-950 shadow-[0_0_30px_-4px_rgba(245,168,60,0.8)]"
            : "border-amber-core/50 bg-ink-900 text-amber-core shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] hover:-translate-y-1 hover:bg-ink-850"
        }`}
        style={{ height: "3.25rem", width: "3.25rem" }}
      >
        <RobotIcon className="h-6 w-6" />
        {!open && msgs.length === 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-core opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-core" />
          </span>
        )}
      </button>

      {/* 聊天面板 */}
      {open && (
        <div
          className="animate-fade-up fixed bottom-[5.5rem] right-3 z-40 flex w-[min(93vw,380px)] flex-col overflow-hidden rounded-md border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]"
          style={{ height: "min(72vh, 560px)" }}
        >
          <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-black text-ink-100">
                <RobotIcon className="h-4 w-4 text-amber-core" /> AI 助手
              </div>
              <button
                onClick={() => setShowConfig((v) => !v)}
                title="点击配置 AI 通道"
                className={`mt-0.5 flex max-w-full items-center gap-1.5 truncate font-display text-[10px] tracking-wide transition-colors ${
                  showConfig ? "text-amber-core" : "text-ink-500 hover:text-teal-core"
                }`}
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isFree ? "bg-teal-core" : "bg-amber-core"} animate-led`} />
                <span className="truncate">{providerLabel(config)}</span>
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setShowConfig((v) => !v)}
                title="AI 通道设置（免费 / 自定义 API / 本地 AI）"
                className={`rounded-sm border p-1.5 transition-all ${
                  showConfig
                    ? "border-amber-core/60 bg-amber-core/10 text-amber-core"
                    : "border-ink-700 text-ink-400 hover:border-ink-600 hover:text-ink-100 hover:[&_svg]:rotate-45"
                } [&_svg]:transition-transform [&_svg]:duration-300`}
              >
                <SettingsIcon className="h-4 w-4" />
              </button>
              {msgs.length > 0 && !showConfig && (
                <button onClick={() => setMsgs([])} className="rounded-sm border border-ink-700 px-2 py-1.5 text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
                  清空
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded-sm border border-ink-700 px-2 py-1.5 text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
                收起
              </button>
            </div>
          </div>

          {showConfig ? (
            <ConfigPanel
              config={config}
              onSave={(c) => { setConfig(c); setShowConfig(false); }}
              onBack={() => setShowConfig(false)}
            />
          ) : (
            <>
              <div ref={listRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {msgs.length === 0 && (
                  <div className="pt-2">
                    <p className="text-xs leading-relaxed text-ink-400">
                      有问题直接问——游戏跑不动、配置怎么升级、Linux 驱动 / Proton 怎么配。
                      {!isFree && <span className="text-amber-core">当前使用 {providerLabel(config)}。</span>}
                    </p>

                    {context && (
                      <button
                        onClick={() => setShowCtx((v) => !v)}
                        className="mt-2.5 flex w-full items-start gap-2 rounded-sm border border-teal-core/35 bg-teal-core/[0.06] px-3 py-2 text-left transition-colors hover:bg-teal-core/[0.12]"
                      >
                        <span className="animate-led mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-core" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold text-teal-core">已读取你的硬件档案</span>
                          {showCtx ? (
                            <span className="mt-1 block whitespace-pre-wrap font-display text-[10px] leading-relaxed text-ink-400">{context}</span>
                          ) : (
                            <span className="block text-[10px] text-ink-500">提问时会自动附带，点击展开查看</span>
                          )}
                        </span>
                      </button>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[...(context ? ["分析一下我现在的配置"] : []), ...QUICK].map((q) => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                            q === "分析一下我现在的配置"
                              ? "border-teal-core/60 bg-teal-core/[0.08] font-bold text-teal-core hover:bg-teal-core/[0.16]"
                              : "border-ink-700 bg-ink-850 text-ink-300 hover:border-amber-core/50 hover:text-amber-core"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowConfig(true)}
                      className="mt-4 flex w-full items-center gap-2 rounded-sm border border-dashed border-ink-700 px-3 py-2.5 text-[11px] text-ink-500 transition-colors hover:border-teal-core/50 hover:text-teal-core"
                    >
                      <SettingsIcon className="h-3.5 w-3.5" />
                      接入自定义 API 或本地 AI（DeepSeek / Ollama / LM Studio…）
                    </button>
                  </div>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-md px-3 py-2 text-xs leading-relaxed ${
                        m.role === "user"
                          ? "rounded-br-none bg-amber-core/15 text-amber-hi"
                          : "rounded-bl-none border border-ink-700 bg-ink-850 text-ink-200"
                      }`}
                    >
                      {m.role === "assistant" && m.provider && (
                        <div className={`mb-1 inline-block rounded-sm border px-1.5 py-0.5 text-[10px] font-bold ${
                          m.source === "kb" ? "border-warn/40 bg-warn/10 text-warn" : "border-teal-core/40 bg-teal-core/10 text-teal-core"
                        }`}>
                          {m.source === "kb" ? "离线知识库" : m.provider}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
                {pending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-md rounded-bl-none border border-ink-700 bg-ink-850 px-3 py-2.5">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal-core" style={{ animationDelay: `${d * 140}ms` }} />
                      ))}
                      <span className="ml-1 text-[10px] text-ink-500">思考中…</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-ink-700 p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={2}
                    placeholder="描述你的问题或配置…"
                    className="min-w-0 flex-1 resize-none rounded-sm border border-ink-700 bg-ink-950 px-3 py-2 text-xs text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-amber-core/60"
                  />
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || pending}
                    className="shrink-0 rounded-sm bg-amber-core p-2.5 text-ink-950 transition-all enabled:hover:brightness-110 enabled:active:scale-95 disabled:opacity-40"
                    title="发送"
                  >
                    <SendIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}



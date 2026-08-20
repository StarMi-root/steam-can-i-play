import { useEffect, useRef, useState } from "react";
import { AiReply, ChatMsg, askAI } from "../lib/ai";
import { RobotIcon, SendIcon } from "./icons";

interface Msg extends ChatMsg {
  source?: AiReply["source"];
}

const QUICK = ["Linux 游戏黑屏怎么办？", "我的配置该先升级什么？", "Proton 怎么安装？", "帧数低怎么优化？"];

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, pending, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || pending) return;
    setInput("");
    const history: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(history);
    setPending(true);
    const reply = await askAI(history);
    setMsgs((cur) => [...cur, { role: "assistant", content: reply.text, source: reply.source }]);
    setPending(false);
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="AI 助手（免费模型，无需配置）"
        className={`fixed bottom-4 right-4 z-40 flex h-13 w-13 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
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
        <div className="animate-fade-up fixed bottom-[5.5rem] right-3 z-40 flex w-[min(93vw,380px)] flex-col overflow-hidden rounded-md border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]" style={{ height: "min(70vh, 540px)" }}>
          <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-ink-100">
                <RobotIcon className="h-4 w-4 text-amber-core" /> AI 助手
              </div>
              <div className="mt-0.5 font-display text-[10px] tracking-[0.18em] text-ink-500">
                免费模型 · 无需配置 KEY · 断网自动降级知识库
              </div>
            </div>
            <div className="flex items-center gap-2">
              {msgs.length > 0 && (
                <button onClick={() => setMsgs([])} className="rounded-sm border border-ink-700 px-2 py-1 text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
                  清空
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded-sm border border-ink-700 px-2 py-1 text-[11px] text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
                收起
              </button>
            </div>
          </div>

          <div ref={listRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {msgs.length === 0 && (
              <div className="pt-2">
                <p className="text-xs leading-relaxed text-ink-400">
                  有问题直接问——游戏跑不动、配置怎么升级、Linux 驱动 / Proton 怎么配，我都在行：
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border border-ink-700 bg-ink-850 px-3 py-1.5 text-[11px] text-ink-300 transition-colors hover:border-amber-core/50 hover:text-amber-core"
                    >
                      {q}
                    </button>
                  ))}
                </div>
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
                  {m.source === "kb" && m.role === "assistant" && (
                    <div className="mb-1 inline-block rounded-sm border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-[10px] font-bold text-warn">
                      离线知识库
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
        </div>
      )}
    </>
  );
}

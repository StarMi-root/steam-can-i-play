import { useEffect, useRef, useState } from "react";
import { ALL_GENRES, Game } from "../data/games";
import { CPU_TIERS, GPU_TIERS } from "../data/hardware";
import { NetError, PcgwHit, SteamAppInfo, SteamSearchHit, getSteamAppInfo, searchPcgw, searchSteamGames } from "../lib/net";
import { ExternalIcon, GlobeIcon, PlusIcon, SearchIcon, SteamIcon, UploadIcon, WarnIcon } from "./icons";

const RAM_CHOICES = [2, 4, 6, 8, 12, 16, 24, 32, 64];

const capsule = (id: number) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/capsule_616x353.jpg`;

function mapGenres(steamGenres: string[]): string[] {
  const hit = ALL_GENRES.filter((g) => g !== "其他" && steamGenres.some((sg) => sg.includes(g)));
  return hit.slice(0, 3);
}

/* ---------- 小部件 ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold tracking-wide text-ink-400">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-sm border border-ink-700 bg-ink-950 px-2.5 py-1.5 text-sm text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-teal-core/60";

function TierSelect({
  options, value, onChange,
}: {
  options: { name: string; score: number }[];
  value: number;
  onChange: (i: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={inputCls}
    >
      {options.map((o, i) => (
        <option key={o.name} value={i}>
          {o.name}（{o.score} 分）
        </option>
      ))}
    </select>
  );
}

/** 最低 / 推荐 配置录入块 */
function ConfigBlock({
  title, accent, cpuIdx, gpuIdx, ram, note,
  onCpu, onGpu, onRam, onNote,
}: {
  title: string;
  accent: string;
  cpuIdx: number; gpuIdx: number; ram: number; note: string;
  onCpu: (i: number) => void; onGpu: (i: number) => void;
  onRam: (n: number) => void; onNote: (s: string) => void;
}) {
  return (
    <div className="rounded-sm border border-ink-800 bg-ink-950/60 p-3">
      <div className={`font-display text-[10px] font-bold tracking-[0.22em] ${accent}`}>{title}</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Field label="CPU"><TierSelect options={CPU_TIERS} value={cpuIdx} onChange={onCpu} /></Field>
        <Field label="GPU"><TierSelect options={GPU_TIERS} value={gpuIdx} onChange={onGpu} /></Field>
        <Field label="内存">
          <select value={ram} onChange={(e) => onRam(Number(e.target.value))} className={inputCls}>
            {RAM_CHOICES.map((r) => <option key={r} value={r}>{r} GB</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-2">
        <Field label="官方原文（可选，仅展示）">
          <textarea
            value={note}
            onChange={(e) => onNote(e.target.value)}
            rows={2}
            placeholder="粘贴官方最低/推荐配置原文…"
            className={inputCls + " resize-none text-xs leading-relaxed"}
          />
        </Field>
      </div>
    </div>
  );
}

/* ---------- 主组件 ---------- */

export default function AddGameModal({
  open, onClose, onAdd, existingIds, initialMode = "online",
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (g: Game) => void;
  existingIds: Set<number>;
  initialMode?: "online" | "manual";
}) {
  const [mode, setMode] = useState<"online" | "manual">(initialMode);

  /* 每次打开时，按调用方指定的模式重置 */
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  /** 联网模式数据源：Steam 官方商店 / PCGamingWiki 第三方 */
  const [srcMode, setSrcMode] = useState<"steam" | "pcgw">("steam");
  const [pcgwHits, setPcgwHits] = useState<PcgwHit[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);

  /* 联网模式状态 */
  const [term, setTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [hits, setHits] = useState<SteamSearchHit[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<SteamAppInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [oZh, setOZh] = useState("");
  const [oGenres, setOGenres] = useState<string[]>([]);
  const [oMinCpu, setOMinCpu] = useState(2);
  const [oMinGpu, setOMinGpu] = useState(2);
  const [oMinRam, setOMinRam] = useState(8);
  const [oMinNote, setOMinNote] = useState("");
  const [oRecCpu, setORecCpu] = useState(3);
  const [oRecGpu, setORecGpu] = useState(3);
  const [oRecRam, setORecRam] = useState(16);
  const [oRecNote, setORecNote] = useState("");

  /* 手动模式状态 */
  const [mName, setMName] = useState("");
  const [mZh, setMZh] = useState("");
  const [mId, setMId] = useState("");
  const [mYear, setMYear] = useState(String(new Date().getFullYear()));
  const [mFree, setMFree] = useState(false);
  const [mGenres, setMGenres] = useState<string[]>(["其他"]);
  const [mImgUrl, setMImgUrl] = useState("");
  const [mImgData, setMImgData] = useState<string | null>(null);
  const [mWin, setMWin] = useState(true);
  const [mMac, setMMac] = useState(false);
  const [mLinux, setMLinux] = useState(false);
  const [mMinCpu, setMMinCpu] = useState(2);
  const [mMinGpu, setMMinGpu] = useState(2);
  const [mMinRam, setMMinRam] = useState(8);
  const [mMinNote, setMMinNote] = useState("");
  const [mRecCpu, setMRecCpu] = useState(3);
  const [mRecGpu, setMRecGpu] = useState(3);
  const [mRecRam, setMRecRam] = useState(16);
  const [mRecNote, setMRecNote] = useState("");
  const [mErr, setMErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const busy = searching || loadingInfo;

  /* ---- 联网 ---- */
  const loadInfo = async (appId: number) => {
    setLoadingInfo(true); setErr(null); setSavedMsg(null);
    try {
      const d = await getSteamAppInfo(appId);
      setInfo(d);
      setOZh(d.name);
      setOGenres(mapGenres(d.genres));
      setOMinNote(d.minRequirements);
      setORecNote(d.recRequirements);
      setHits([]);
    } catch (e) {
      setErr(e instanceof NetError ? e.message : "请求失败，请检查网络后重试");
    } finally {
      setLoadingInfo(false);
    }
  };

  const doSearch = async () => {
    const t = term.trim();
    if (!t) return;
    setErr(null); setSavedMsg(null);
    setSearching(true);
    try {
      if (srcMode === "steam") {
        if (/^\d{2,8}$/.test(t)) { loadInfo(Number(t)); return; }
        const list = await searchSteamGames(t);
        setHits(list); setPcgwHits([]); setInfo(null);
        if (list.length === 0) setErr(`没有找到与「${t}」相关的游戏，可尝试英文名或直接输入 AppID`);
      } else {
        const list = await searchPcgw(t);
        setPcgwHits(list); setHits([]); setInfo(null);
        if (list.length === 0) setErr(`PCGamingWiki 没有找到「${t}」，试试英文原名`);
      }
    } catch (e) {
      setErr(e instanceof NetError ? e.message : "请求失败，请检查网络后重试");
    } finally {
      setSearching(false);
    }
  };

  /** 第三方结果 → 尝试解析对应 Steam 页面；失败则转手动模式预填 */
  const resolvePcgw = async (title: string) => {
    setResolving(title); setErr(null); setSavedMsg(null);
    try {
      const found = await searchSteamGames(title);
      if (found.length > 0) {
        await loadInfo(found[0].id);
        setPcgwHits([]);
      } else {
        setMode("manual"); setMName(title);
        setSavedMsg(`PCGamingWiki 找到「${title}」但未匹配到 Steam 页面，已切到手动模式，请补全配置后保存`);
      }
    } catch {
      setMode("manual"); setMName(title);
      setSavedMsg(`代理受限，无法解析「${title}」的 Steam 数据，已切到手动模式补全`);
    } finally {
      setResolving(null);
    }
  };

  const saveOnline = () => {
    if (!info) return;
    onAdd({
      id: info.appId,
      name: info.name,
      zh: oZh.trim() || info.name,
      year: info.year ?? new Date().getFullYear(),
      genres: oGenres.length > 0 ? oGenres : ["其他"],
      minCpu: CPU_TIERS[oMinCpu].score, minGpu: GPU_TIERS[oMinGpu].score, minRam: oMinRam,
      recCpu: CPU_TIERS[oRecCpu].score, recGpu: GPU_TIERS[oRecGpu].score, recRam: oRecRam,
      minNote: oMinNote, recNote: oRecNote,
      platforms: { win: info.platforms.windows, mac: info.platforms.mac, linux: info.platforms.linux },
      free: info.isFree,
      image: capsule(info.appId),
      custom: true,
    });
    setSavedMsg(`已保存「${info.name}」到本地游戏库（共 ${existingIds.size + 1} 款自定义）`);
  };

  /* ---- 手动 ---- */
  const onFile = (f: File | null) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setMImgData(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(f);
  };

  const saveManual = () => {
    setMErr(null); setSavedMsg(null);
    const name = mName.trim();
    if (name.length < 1) { setMErr("请填写游戏名称"); return; }
    const idNum = mId.trim() !== "" ? Number(mId.trim()) : NaN;
    const id = Number.isFinite(idNum) && idNum > 0
      ? idNum
      : -Math.abs(Math.floor(Math.random() * 1e9) + 1); // 无 AppID 时用负数本地 ID
    onAdd({
      id,
      name,
      zh: mZh.trim() || name,
      year: Number(mYear) || new Date().getFullYear(),
      genres: mGenres.length > 0 ? mGenres : ["其他"],
      minCpu: CPU_TIERS[mMinCpu].score, minGpu: GPU_TIERS[mMinGpu].score, minRam: mMinRam,
      recCpu: CPU_TIERS[mRecCpu].score, recGpu: GPU_TIERS[mRecGpu].score, recRam: mRecRam,
      minNote: mMinNote, recNote: mRecNote,
      platforms: { win: mWin, mac: mMac, linux: mLinux },
      free: mFree,
      image: mImgData ?? (mImgUrl.trim() || (id > 0 ? capsule(id) : undefined)),
      custom: true,
    });
    setSavedMsg(`已保存「${name}」到本地游戏库`);
  };

  const genreToggle = (g: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(g) ? list.filter((x) => x !== g) : [...list, g]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/85 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-fade-up w-full max-w-2xl rounded-md border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        {/* 头部 + 模式切换 */}
        <div className="border-b border-ink-700 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-[10px] font-semibold tracking-[0.28em] text-teal-core">
                {mode === "online" ? "ONLINE · STEAM STORE API" : "MANUAL · LOCAL LIBRARY"}
              </div>
              <h3 className="mt-1 text-lg font-black text-ink-100">
                {mode === "online" ? "联网添加 Steam 游戏" : "手动录入游戏"}
              </h3>
            </div>
            <button onClick={onClose} className="rounded-sm border border-ink-700 px-2.5 py-1 text-sm text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
              关闭
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => { setMode("online"); setSavedMsg(null); }}
              className={`flex items-center gap-2.5 rounded-sm border px-3 py-2.5 text-left transition-all ${
                mode === "online"
                  ? "border-teal-core bg-teal-core/[0.1] text-teal-core"
                  : "border-ink-700 bg-ink-950 text-ink-400 hover:border-ink-600 hover:text-ink-200"
              }`}
            >
              <GlobeIcon className="h-4.5 w-4.5 shrink-0" />
              <span>
                <span className="block text-xs font-black">联网搜索 Steam</span>
                <span className="block text-[10px] opacity-70">需代理可用 · 自动拉配置</span>
              </span>
            </button>
            <button
              onClick={() => { setMode("manual"); setSavedMsg(null); }}
              className={`flex items-center gap-2.5 rounded-sm border px-3 py-2.5 text-left transition-all ${
                mode === "manual"
                  ? "border-amber-core bg-amber-core/[0.1] text-amber-core"
                  : "border-ink-700 bg-ink-950 text-ink-400 hover:border-ink-600 hover:text-ink-200"
              }`}
            >
              <PlusIcon className="h-4.5 w-4.5 shrink-0" />
              <span>
                <span className="block text-xs font-black">手动填写</span>
                <span className="block text-[10px] opacity-70">无需联网 · 保存到本地</span>
              </span>
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {savedMsg && (
            <div className="mb-3 animate-fade-up flex items-center gap-2 rounded-sm border border-ok/40 bg-ok/10 px-3 py-2 text-xs font-bold text-ok">
              <SteamIcon className="h-4 w-4" /> {savedMsg}
            </div>
          )}

          {mode === "online" ? (
            <div className="space-y-3">
              {/* 联网数据源切换 */}
              <div className="flex rounded-sm border border-ink-700 bg-ink-950 p-0.5 text-[11px] font-bold">
                <button
                  onClick={() => { setSrcMode("steam"); setPcgwHits([]); }}
                  className={`flex-1 rounded-[3px] px-2 py-1.5 transition-colors ${srcMode === "steam" ? "bg-teal-core text-ink-950" : "text-ink-400 hover:text-ink-100"}`}
                >
                  Steam 官方商店
                </button>
                <button
                  onClick={() => { setSrcMode("pcgw"); setHits([]); }}
                  className={`flex-1 rounded-[3px] px-2 py-1.5 transition-colors ${srcMode === "pcgw" ? "bg-amber-core text-ink-950" : "text-ink-400 hover:text-ink-100"}`}
                >
                  PCGamingWiki · 第三方
                </button>
              </div>
              {/* 搜索框 */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    placeholder="游戏名 或 AppID（如 2358720）"
                    className={inputCls + " pl-8"}
                  />
                </div>
                <button
                  onClick={doSearch}
                  disabled={busy}
                  className="rounded-sm bg-teal-core px-4 text-sm font-bold text-ink-950 transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "查询中…" : "搜索"}
                </button>
              </div>

              {err && (
                <div className="flex items-start gap-2 rounded-sm border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
                  <WarnIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {err}
                </div>
              )}

              {/* 搜索结果（Steam 官方） */}
              {hits.length > 0 && (
                <div className="max-h-44 overflow-y-auto rounded-sm border border-ink-800">
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

              {/* 搜索结果（PCGamingWiki 第三方） */}
              {pcgwHits.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-ink-500">
                    第三方来源 PCGamingWiki · 点击条目自动尝试解析对应 Steam 页面；解析不了会转入手动模式预填
                  </div>
                  <div className="max-h-44 overflow-y-auto rounded-sm border border-ink-800">
                    {pcgwHits.map((h) => (
                      <div key={h.title} className="flex w-full items-center justify-between gap-2 border-b border-ink-800/70 px-3 py-2 text-sm last:border-0">
                        <button
                          onClick={() => resolvePcgw(h.title)}
                          disabled={!!resolving}
                          className="min-w-0 flex-1 truncate text-left text-ink-100 transition-colors hover:text-teal-core disabled:opacity-50"
                        >
                          {resolving === h.title ? "解析中…" : h.title}
                        </button>
                        <a href={h.url} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1 text-[10px] text-ink-500 transition-colors hover:text-teal-core">
                          PCGW <ExternalIcon className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 详情 */}
              {info && (
                <div className="space-y-3 rounded-sm border border-ink-700 bg-ink-950/50 p-3">
                  <div className="flex items-center gap-3">
                    <img src={capsule(info.appId)} alt={info.name} className="h-14 w-24 rounded-sm object-cover" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-ink-100">{info.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-500">
                        <span>#{info.appId}</span>
                        <span>{info.year ?? "年份未知"}</span>
                        <span className={info.isFree ? "text-ok" : "text-amber-core"}>
                          {info.isFree ? "免费" : "付费"}
                        </span>
                        <a href={`https://store.steampowered.com/app/${info.appId}/`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-teal-core hover:underline">
                          商店页 <ExternalIcon className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <Field label="显示名称">
                    <input value={oZh} onChange={(e) => setOZh(e.target.value)} className={inputCls} />
                  </Field>

                  <div>
                    <span className="mb-1 block text-[11px] font-bold tracking-wide text-ink-400">类型标签</span>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_GENRES.map((g) => (
                        <button key={g} onClick={() => genreToggle(g, oGenres, setOGenres)}
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                            oGenres.includes(g)
                              ? "border-teal-core bg-teal-core/15 text-teal-core"
                              : "border-ink-700 text-ink-500 hover:border-ink-600 hover:text-ink-300"
                          }`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ConfigBlock
                    title="最低配置" accent="text-amber-core"
                    cpuIdx={oMinCpu} gpuIdx={oMinGpu} ram={oMinRam} note={oMinNote}
                    onCpu={setOMinCpu} onGpu={setOMinGpu} onRam={setOMinRam} onNote={setOMinNote}
                  />
                  <ConfigBlock
                    title="推荐配置（达到即判完美运行）" accent="text-ok"
                    cpuIdx={oRecCpu} gpuIdx={oRecGpu} ram={oRecRam} note={oRecNote}
                    onCpu={setORecCpu} onGpu={setORecGpu} onRam={setORecRam} onNote={setORecNote}
                  />

                  <button onClick={saveOnline}
                    className="w-full rounded-sm bg-amber-core py-2.5 text-sm font-black text-ink-950 transition-colors hover:bg-amber-hi active:scale-[0.98]">
                    保存到本地游戏库
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Field label="游戏名称 *">
                  <input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="如 Hollow Knight" className={inputCls} />
                </Field>
                <Field label="中文/显示名">
                  <input value={mZh} onChange={(e) => setMZh(e.target.value)} placeholder="如 空洞骑士" className={inputCls} />
                </Field>
                <Field label="Steam AppID（可选）">
                  <input value={mId} onChange={(e) => setMId(e.target.value)} placeholder="如 367520" className={inputCls} />
                </Field>
                <Field label="发行年份">
                  <input value={mYear} onChange={(e) => setMYear(e.target.value)} className={inputCls} />
                </Field>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <label className="flex cursor-pointer items-center gap-1.5 text-ink-300">
                  <input type="checkbox" checked={mFree} onChange={(e) => setMFree(e.target.checked)} className="accent-teal-core" />
                  免费游戏
                </label>
                {([["Windows", mWin, setMWin], ["macOS", mMac, setMMac], ["Linux", mLinux, setMLinux]] as const).map(([lb, v, sv]) => (
                  <label key={lb} className="flex cursor-pointer items-center gap-1.5 text-ink-300">
                    <input type="checkbox" checked={v} onChange={(e) => sv(e.target.checked)} className="accent-teal-core" />
                    {lb}
                  </label>
                ))}
              </div>

              <div>
                <span className="mb-1 block text-[11px] font-bold tracking-wide text-ink-400">类型标签</span>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_GENRES.map((g) => (
                    <button key={g} onClick={() => genreToggle(g, mGenres, setMGenres)}
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                        mGenres.includes(g)
                          ? "border-teal-core bg-teal-core/15 text-teal-core"
                          : "border-ink-700 text-ink-500 hover:border-ink-600 hover:text-ink-300"
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* 图片 */}
              <div>
                <span className="mb-1 block text-[11px] font-bold tracking-wide text-ink-400">封面图片（可选）</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => fileRef.current?.click()}
                    className="flex h-16 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-ink-600 bg-ink-950 text-[10px] text-ink-500 transition-colors hover:border-teal-core/60 hover:text-teal-core">
                    <UploadIcon className="h-4 w-4" /> 本地上传
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
                  <input value={mImgUrl} onChange={(e) => { setMImgUrl(e.target.value); setMImgData(null); }}
                    placeholder="或填图片 URL…" className={inputCls} />
                </div>
                {(mImgData || mImgUrl) && (
                  <img src={mImgData ?? mImgUrl} alt="封面预览"
                    className="mt-2 h-20 w-36 rounded-sm border border-ink-700 object-cover" />
                )}
              </div>

              <ConfigBlock
                title="最低配置" accent="text-amber-core"
                cpuIdx={mMinCpu} gpuIdx={mMinGpu} ram={mMinRam} note={mMinNote}
                onCpu={setMMinCpu} onGpu={setMMinGpu} onRam={setMMinRam} onNote={setMMinNote}
              />
              <ConfigBlock
                title="推荐配置（达到即判完美运行）" accent="text-ok"
                cpuIdx={mRecCpu} gpuIdx={mRecGpu} ram={mRecRam} note={mRecNote}
                onCpu={setMRecCpu} onGpu={setMRecGpu} onRam={setMRecRam} onNote={setMRecNote}
              />

              {mErr && <div className="text-xs text-bad">{mErr}</div>}

              <button onClick={saveManual}
                className="w-full rounded-sm bg-amber-core py-2.5 text-sm font-black text-ink-950 transition-colors hover:bg-amber-hi active:scale-[0.98]">
                保存到本地游戏库
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

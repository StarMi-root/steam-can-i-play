import { useEffect, useMemo, useState } from "react";
import { Game } from "../data/games";
import {
  STEAM_CONN_KEY, SteamConn, SteamFriend, SteamOwnedGame,
  fetchFriends, fetchOwnedGames, fetchSteamProfile, parseSteamIdInput, resolveVanityUrl, storeUrl,
} from "../lib/steam";
import { ExternalIcon, PlusIcon, SteamIcon, UsersIcon, WarnIcon } from "./icons";

type Tab = "connect" | "library" | "friends" | "add";

export default function SteamAccount({
  open, onClose, conn, onConn, playableIds, libraryIds, allGames,
}: {
  open: boolean;
  onClose: () => void;
  conn: SteamConn | null;
  onConn: (c: SteamConn | null) => void;
  /** 当前硬件「能玩」的游戏 ID 集合 */
  playableIds: Set<number>;
  /** 本工具游戏库全部 ID 集合 */
  libraryIds: Set<number>;
  /** 本工具完整游戏库（用于推荐未拥有的游戏） */
  allGames: Game[];
}) {
  const [tab, setTab] = useState<Tab>(conn ? "library" : "connect");
  const [key, setKey] = useState("");
  const [idInput, setIdInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [owned, setOwned] = useState<SteamOwnedGame[] | null>(null);
  const [friends, setFriends] = useState<SteamFriend[] | null>(null);
  const [loadingLib, setLoadingLib] = useState(false);
  const [loadingFr, setLoadingFr] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) {
      setTab(conn ? "library" : "connect");
      setErr(null);
    }
  }, [open, conn]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* 拉取游戏库 */
  const loadLibrary = async () => {
    if (!conn) return;
    setLoadingLib(true); setErr(null);
    try {
      setOwned(await fetchOwnedGames(conn.key, conn.steamid));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "拉取游戏库失败");
    } finally {
      setLoadingLib(false);
    }
  };
  const loadFriends = async () => {
    if (!conn) return;
    setLoadingFr(true); setErr(null);
    try {
      setFriends(await fetchFriends(conn.key, conn.steamid));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "拉取好友失败");
    } finally {
      setLoadingFr(false);
    }
  };

  useEffect(() => {
    if (open && conn && tab === "library" && owned === null && !loadingLib) loadLibrary();
    if (open && conn && tab === "friends" && friends === null && !loadingFr) loadFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conn, tab]);

  const connect = async () => {
    const k = key.trim();
    const parsed = parseSteamIdInput(idInput);
    if (!k) { setErr("请填写 Steam Web API 密钥（申请只需 30 秒，见下方步骤）"); return; }
    if (!parsed.steamid && !parsed.vanity) { setErr("请填写 SteamID64（17 位数字）或自定义资料 URL"); return; }
    setBusy(true); setErr(null);
    try {
      const steamid = parsed.steamid ?? (await resolveVanityUrl(parsed.vanity!, k));
      const profile = await fetchSteamProfile(k, steamid);
      const c: SteamConn = { key: k, steamid, persona: profile.persona, avatar: profile.avatar };
      try { localStorage.setItem(STEAM_CONN_KEY, JSON.stringify(c)); } catch { /* 忽略 */ }
      onConn(c);
      setOwned(null); setFriends(null);
      setTab("library");
      loadLibraryWith(c);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "连接失败，请检查密钥与网络");
    } finally {
      setBusy(false);
    }
  };
  const loadLibraryWith = async (c: SteamConn) => {
    setLoadingLib(true);
    try { setOwned(await fetchOwnedGames(c.key, c.steamid)); } catch (e) { setErr(e instanceof Error ? e.message : "拉取游戏库失败"); }
    finally { setLoadingLib(false); }
  };

  const disconnect = () => {
    try { localStorage.removeItem(STEAM_CONN_KEY); } catch { /* 忽略 */ }
    onConn(null); setOwned(null); setFriends(null); setTab("connect"); setKey(""); setIdInput("");
  };

  const filteredOwned = useMemo(() => {
    if (!owned) return null;
    const t = q.trim().toLowerCase();
    if (!t) return owned;
    return owned.filter((g) => g.name.toLowerCase().includes(t));
  }, [owned, q]);

  const stats = useMemo(() => {
    if (!owned) return null;
    const inLib = owned.filter((g) => libraryIds.has(g.appid));
    const playable = inLib.filter((g) => playableIds.has(g.appid));
    return { total: owned.length, inLib: inLib.length, playable: playable.length };
  }, [owned, libraryIds, playableIds]);

  if (!open) return null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "connect", label: "连接账户" },
    { id: "library", label: `游戏库${owned ? ` · ${owned.length}` : ""}` },
    { id: "friends", label: `好友${friends ? ` · ${friends.length}` : ""}` },
    { id: "add", label: "添加游戏" },
  ];

  /** 推荐：匹配库中你尚未拥有、且当前配置能玩的游戏（免费优先） */
  const suggestions = useMemo(() => {
    if (!owned) return [];
    const ownedSet = new Set(owned.map((g) => g.appid));
    return allGames
      .filter((g) => g.id > 0 && !ownedSet.has(g.id) && playableIds.has(g.id))
      .sort((a, b) => Number(!!b.free) - Number(!!a.free) || b.year - a.year)
      .slice(0, 24);
  }, [owned, allGames, playableIds]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/85 px-3 py-6 backdrop-blur-sm sm:px-4 sm:py-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-fade-up flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-ink-600 bg-ink-900 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div className="flex items-center gap-3">
            <SteamIcon className="h-7 w-7 text-steam" />
            <div>
              <div className="font-display text-[10px] font-semibold tracking-[0.28em] text-steam">STEAM ACCOUNT</div>
              <h3 className="mt-0.5 text-lg font-black text-ink-100">Steam 账户接入</h3>
            </div>
            {conn && (
              <span className="ml-2 flex items-center gap-2 rounded-full border border-ink-700 bg-ink-850 py-1 pl-1 pr-3">
                {conn.avatar ? <img src={conn.avatar} alt="" className="h-6 w-6 rounded-full" /> : <UsersIcon className="h-5 w-5 text-ink-500" />}
                <span className="max-w-[10rem] truncate text-xs font-bold text-ink-200">{conn.persona}</span>
                <span className="animate-led h-1.5 w-1.5 rounded-full bg-ok" />
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-sm border border-ink-700 px-2.5 py-1 text-sm text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
            关闭
          </button>
        </div>

        {/* 标签 */}
        <div className="flex border-b border-ink-800 bg-ink-950/50 px-5">
          {tabs.map((t) => {
            const locked = t.id !== "connect" && !conn;
            return (
              <button
                key={t.id}
                disabled={locked}
                onClick={() => { setTab(t.id); setErr(null); }}
                className={`-mb-px border-b-2 px-4 py-2.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                  tab === t.id
                    ? "border-steam text-steam"
                    : "border-transparent text-ink-500 hover:text-ink-200"
                }`}
              >
                {t.label}
                {locked && <span className="ml-1 text-[10px]">（需先连接）</span>}
              </button>
            );
          })}
          {conn && (
            <button onClick={disconnect} className="ml-auto self-center text-[11px] text-ink-600 transition-colors hover:text-bad">
              断开连接
            </button>
          )}
        </div>

        {err && (
          <div className="mx-5 mt-3 flex animate-fade-up items-start gap-2 rounded-sm border border-warn/40 bg-warn/10 px-3 py-2 text-xs leading-relaxed text-warn">
            <WarnIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {err}
          </div>
        )}

        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-4">
          {/* 连接 */}
          {tab === "connect" && (
            <div className="space-y-4">
              <p className="text-xs leading-relaxed text-ink-400">
                通过你自己的 <b className="text-ink-200">Steam Web API 密钥</b>调用 Steam 官方接口，查看游戏库与好友。
                密钥只保存在本机浏览器，不会上传。
              </p>
              <div className="rounded-sm border border-ink-700 bg-ink-950/60 p-4 text-xs leading-relaxed text-ink-400">
                <div className="font-display mb-2 text-[10px] font-bold tracking-[0.22em] text-amber-core">30 秒获取密钥</div>
                <ol className="list-decimal space-y-1.5 pl-4">
                  <li>打开 <a className="text-steam underline decoration-steam/40 hover:decoration-steam" href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noreferrer">steamcommunity.com/dev/apikey</a> 并登录</li>
                  <li>域名随便填（如 <code className="font-display text-ink-200">localhost</code>），勾选同意 → 复制 32 位密钥</li>
                  <li>在下方填入密钥 + 你的 SteamID64 或资料链接</li>
                </ol>
                <p className="mt-2 text-[11px] text-ink-600">
                  SteamID64 获取：打开个人资料页，地址栏 <code className="font-display">profiles/7656…</code> 后那串即是；
                  自定义 URL（id/xxx）也可以直接粘贴，会自动解析。
                </p>
              </div>
              <div className="grid gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold tracking-wide text-ink-400">Steam Web API 密钥</span>
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="粘贴 32 位密钥…"
                    className="w-full rounded-sm border border-ink-700 bg-ink-950 px-3 py-2.5 font-display text-xs text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-steam/60"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold tracking-wide text-ink-400">SteamID64 或资料链接</span>
                  <input
                    value={idInput}
                    onChange={(e) => setIdInput(e.target.value)}
                    placeholder="76561198xxxxxxxxx 或 https://steamcommunity.com/id/xxx/"
                    className="w-full rounded-sm border border-ink-700 bg-ink-950 px-3 py-2.5 font-display text-xs text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-steam/60"
                  />
                </label>
                <button
                  onClick={connect}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 rounded-sm bg-steam px-5 py-3 text-sm font-black text-ink-950 transition-all enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:opacity-50"
                >
                  <SteamIcon className="h-4 w-4" />
                  {busy ? "连接中…" : "连接 Steam 账户"}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-ink-600">
                说明：Steam 未向第三方开放聊天与「直接入库」接口 —— 好友页提供一键唤起 Steam 客户端聊天；
                添加游戏将跳转到商店页完成购买 / 免费领取（等同入库）。
              </p>
            </div>
          )}

          {/* 游戏库 */}
          {tab === "library" && conn && (
            <div className="space-y-3">
              {stats && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-sm border border-ink-700 bg-ink-850 px-3 py-2.5 text-center">
                    <div className="font-display text-xl font-bold text-ink-100">{stats.total}</div>
                    <div className="text-[10px] text-ink-500">拥有游戏</div>
                  </div>
                  <div className="rounded-sm border border-ink-700 bg-ink-850 px-3 py-2.5 text-center">
                    <div className="font-display text-xl font-bold text-steam">{stats.inLib}</div>
                    <div className="text-[10px] text-ink-500">在匹配库中</div>
                  </div>
                  <div className="rounded-sm border border-ok/40 bg-ok/[0.06] px-3 py-2.5 text-center">
                    <div className="font-display text-xl font-bold text-ok">{stats.playable}</div>
                    <div className="text-[10px] text-ink-500">你的配置能玩</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="在自己的游戏库里搜索…"
                  className="min-w-0 flex-1 rounded-sm border border-ink-700 bg-ink-950 px-3 py-2 text-xs text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-steam/60"
                />
                <button onClick={loadLibrary} disabled={loadingLib} className="shrink-0 rounded-sm border border-ink-600 px-3 py-2 text-xs text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100 disabled:opacity-50">
                  {loadingLib ? "刷新中…" : "刷新"}
                </button>
              </div>

              {loadingLib && !owned && (
                <div className="flex items-center justify-center gap-2 py-10 text-xs text-ink-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-700 border-t-steam" /> 正在拉取游戏库…
                </div>
              )}

              {filteredOwned && (
                <ul className="space-y-1.5">
                  {filteredOwned.slice(0, 120).map((g) => {
                    const inLib = libraryIds.has(g.appid);
                    const canPlay = playableIds.has(g.appid);
                    return (
                      <li key={g.appid} className="group flex items-center gap-3 rounded-sm border border-ink-800 bg-ink-950/50 px-3 py-2 transition-colors hover:border-ink-700 hover:bg-ink-850">
                        {g.logo ? (
                          <img src={g.logo} alt="" loading="lazy" className="h-8 w-[74px] shrink-0 rounded-[3px] border border-ink-800 object-cover" />
                        ) : (
                          <span className="flex h-8 w-[74px] shrink-0 items-center justify-center rounded-[3px] border border-ink-800 bg-ink-850 font-display text-[10px] text-ink-600">STEAM</span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-bold text-ink-100">{g.name}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-500">
                            <span className="font-display">{g.playtime > 0 ? `${g.playtime} 小时` : "未游玩"}</span>
                            {inLib ? (
                              <span className={`flex items-center gap-1 font-bold ${canPlay ? "text-ok" : "text-bad"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${canPlay ? "bg-ok" : "bg-bad"}`} />
                                {canPlay ? "能玩" : "带不动"}
                              </span>
                            ) : (
                              <span className="text-ink-600">未收录</span>
                            )}
                          </div>
                        </div>
                        <a
                          href={storeUrl(g.appid)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex shrink-0 items-center gap-1 rounded-sm border border-ink-700 px-2.5 py-1.5 font-display text-[10px] font-bold text-ink-400 opacity-0 transition-all hover:border-steam/60 hover:text-steam group-hover:opacity-100"
                        >
                          商店页 <ExternalIcon className="h-2.5 w-2.5" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
              {filteredOwned && filteredOwned.length === 0 && (
                <p className="py-8 text-center text-xs text-ink-500">没有匹配「{q}」的游戏</p>
              )}
              {owned && owned.length > 120 && (
                <p className="text-center text-[10px] text-ink-600">仅显示前 120 款（按时长排序），用搜索找更多</p>
              )}
            </div>
          )}

          {/* 好友 */}
          {tab === "friends" && conn && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={loadFriends} disabled={loadingFr} className="rounded-sm border border-ink-600 px-3 py-2 text-xs text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-100 disabled:opacity-50">
                  {loadingFr ? "刷新中…" : "刷新好友"}
                </button>
                <a href="steam://friends" className="rounded-sm border border-steam/50 bg-steam/[0.08] px-3 py-2 text-xs font-bold text-steam transition-colors hover:bg-steam/[0.18]">
                  唤起 Steam 客户端聊天
                </a>
                <a href="https://steamcommunity.com/chat/" target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-sm border border-ink-700 px-3 py-2 text-xs text-ink-400 transition-colors hover:border-ink-600 hover:text-ink-100">
                  网页版聊天 <ExternalIcon className="h-2.5 w-2.5" />
                </a>
              </div>
              <p className="text-[11px] text-ink-600">
                Steam 未开放第三方聊天接口，这里展示好友在线状态，点击可一键唤起客户端聊天窗口。
              </p>

              {loadingFr && !friends && (
                <div className="flex items-center justify-center gap-2 py-10 text-xs text-ink-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-700 border-t-steam" /> 正在拉取好友列表…
                </div>
              )}

              {friends && friends.length === 0 && (
                <p className="py-8 text-center text-xs text-ink-500">好友列表为空</p>
              )}
              {friends && friends.length > 0 && (
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {friends.map((f) => (
                    <li key={f.steamid} className="flex items-center gap-2.5 rounded-sm border border-ink-800 bg-ink-950/50 px-3 py-2 transition-colors hover:border-ink-700 hover:bg-ink-850">
                      {f.avatar ? <img src={f.avatar} alt="" className="h-8 w-8 shrink-0 rounded-sm" /> : <UsersIcon className="h-7 w-7 shrink-0 text-ink-600" />}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-ink-100">{f.persona}</div>
                        <div className={`truncate text-[10px] ${f.stateColor}`}>{f.state}</div>
                      </div>
                      <a href="https://steamcommunity.com/chat/" target="_blank" rel="noreferrer" title="打开 Steam 网页聊天" className="shrink-0 rounded-sm border border-ink-700 px-2 py-1.5 text-[10px] font-bold text-ink-400 transition-colors hover:border-steam/60 hover:text-steam">
                        聊天
                      </a>
                      <a href={`https://steamcommunity.com/profiles/${f.steamid}`} target="_blank" rel="noreferrer" title="查看资料" className="shrink-0 text-ink-600 transition-colors hover:text-steam">
                        <ExternalIcon className="h-3.5 w-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 添加游戏 */}
          {tab === "add" && conn && (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-ink-400">
                以下是匹配库中<b className="text-ink-200">你还没拥有、且当前配置能玩</b>的游戏（免费优先）。
                Steam 未开放第三方直接入库接口 —— 点击「去商店获取」跳转商店页，免费领取或购买后即自动进入你的游戏库。
              </p>
              {suggestions.length === 0 ? (
                <div className="rounded-sm border border-dashed border-ink-700 px-4 py-10 text-center text-xs text-ink-500">
                  {owned ? "匹配库里能玩的游戏你已经都拥有了 🎉" : "先在游戏库标签拉取数据后才能生成推荐"}
                </div>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {suggestions.map((g) => (
                    <li key={g.id} className="group flex items-center gap-3 rounded-sm border border-ink-800 bg-ink-950/50 p-2.5 transition-all hover:-translate-y-0.5 hover:border-steam/50 hover:bg-ink-850">
                      <img
                        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${g.id}/capsule_231x87.jpg`}
                        alt={g.name}
                        loading="lazy"
                        className="h-12 w-[84px] shrink-0 rounded-[3px] border border-ink-800 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-ink-100">{g.zh}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ink-500">
                          {g.free ? (
                            <span className="rounded-sm border border-ok/40 bg-ok/[0.08] px-1 py-px font-bold text-ok">免费</span>
                          ) : (
                            <span className="rounded-sm border border-ink-700 px-1 py-px text-ink-400">{g.year}</span>
                          )}
                          <span className="truncate">{g.genres.slice(0, 2).join(" · ")}</span>
                        </div>
                      </div>
                      <a
                        href={storeUrl(g.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex shrink-0 items-center gap-1 rounded-sm border border-steam/50 bg-steam/[0.08] px-2 py-1.5 text-[10px] font-bold text-steam transition-colors hover:bg-steam/[0.2]"
                      >
                        <PlusIcon className="h-3 w-3" /> 去商店获取
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

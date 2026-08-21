#!/usr/bin/env bash
# ==============================================================================
# Copyright (C) 2026 王博
# Licensed under GNU General Public License v3.0
# See LICENSE file for full license text.
# ==============================================================================

#!/usr/bin/env bash
# ==============================================================================
#  能不能玩 · CAN I PLAY —— Linux 一键部署脚本（引导式 TUI）
#
#  用法：
#    chmod +x deploy.sh && ./deploy.sh                    # 交互式引导
#    PORT=9000 MODE=cf ./deploy.sh                        # 半自动（公网隧道）
#    MODE=lr SUBDOMAIN=my-play ./deploy.sh                # 自定义公网域名
#    DIST_DIR=/var/www/cip PORT=8080 MODE=local ./deploy.sh
# ==============================================================================
set -u

# ---------------- TUI 颜色与排版 ----------------
C_RESET=$'\033[0m'; C_BOLD=$'\033[1m'; C_DIM=$'\033[2m'
C_AMBER=$'\033[38;5;214m'; C_TEAL=$'\033[38;5;44m'; C_OK=$'\033[38;5;114m'
C_BAD=$'\033[38;5;203m'; C_WARN=$'\033[38;5;220m'

banner() {
  printf '%s' "${C_AMBER}${C_BOLD}"
  cat <<'EOF'
  StarMi的自动化脚本,写这个累死我了不关注以下吗bilibili:星米StarMi
EOF
  printf '%s' "${C_RESET}"
  printf '  %sCAN I PLAY%s · Steam 硬件游戏匹配器 · Linux 部署向导 v1.0\n\n' "$C_TEAL$C_BOLD" "$C_RESET"
}

box() { # 章节标题
  printf '\n%s┌─ %s %s\n' "$C_TEAL$C_BOLD" "$1" "$C_RESET"
}
ok()   { printf '  %s✓%s %s\n' "$C_OK" "$C_RESET" "$1"; }
warn() { printf '  %s!%s %s\n' "$C_WARN" "$C_RESET" "$1"; }
err()  { printf '  %s✗%s %s\n' "$C_BAD" "$C_RESET" "$1"; }
info() { printf '  %s·%s %s\n' "$C_DIM" "$C_RESET" "$1"; }

ask() { # ask 提示 默认值 → REPLY
  local prompt="$1" default="$2"
  printf '  %s?%s %s %s[%s]%s ' "$C_AMBER$C_BOLD" "$C_RESET" "$prompt" "$C_DIM" "$default" "$C_RESET"
  read -r REPLY || REPLY=""
  [ -z "$REPLY" ] && REPLY="$default"
}

spin() { # spin "提示" 命令... → 返回命令退出码
  local msg="$1"; shift
  printf '  %s…%s %s ' "$C_TEAL" "$C_RESET" "$msg"
  "$@" >/tmp/.cip_spin.log 2>&1
  local rc=$?
  printf '\r\033[K'
  [ $rc -eq 0 ] && ok "$msg — 完成" || warn "$msg — 跳过/失败"
  return $rc
}

have() { command -v "$1" >/dev/null 2>&1; }

# ---------------- 端口检测与推荐 ----------------
port_free() {
  python3 - "$1" <<'PY'
import socket, sys
s = socket.socket()
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
try:
    s.bind(("0.0.0.0", int(sys.argv[1])))
    s.close()
    sys.exit(0)
except OSError:
    sys.exit(1)
PY
}

find_free_port() { # 从 $1 开始找第一个空闲端口（找不到输出空）
  local p="$1" i=0
  while [ $i -lt 50 ]; do
    if port_free "$p"; then echo "$p"; return 0; fi
    p=$((p + 1)); i=$((i + 1))
  done
  return 1
}

# ---------------- 网络信息 ----------------
lan_ip() {
  (hostname -I 2>/dev/null || ip -4 addr show 2>/dev/null | grep -oP 'inet \K[\d.]+' | grep -v 127.0.0.1) \
    | head -n1
}

# ==============================================================================
banner

# ---------------- ① 环境检查 ----------------
box "① 检查环境"
if ! have python3; then
  err "缺少 python3（用于静态服务器）。请先安装："
  info "Debian/Ubuntu: sudo apt install -y python3"
  info "RHEL/Fedora  : sudo dnf install -y python3"
  info "Arch         : sudo pacman -S python"
  exit 1
fi
ok "python3 $(python3 -c 'import sys;print("%d.%d.%d"%sys.version_info[:3])')"
have curl    && ok "curl 已安装"     || warn "缺少 curl（将影响 cloudflared 自动下载）"
have ssh     && ok "ssh 已安装（localhost.run 通道可用）" || warn "缺少 ssh（localhost.run 通道不可用）"
have systemctl && ok "systemd 可用（可安装常驻服务）" || info "未检测到 systemd（将以前台/后台进程运行）"

# ---------------- ② 定位站点文件 ----------------
box "② 站点文件"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="${DIST_DIR:-$SCRIPT_DIR/dist}"

if [ ! -f "$DIST_DIR/index.html" ]; then
  warn "默认目录 $DIST_DIR 中没有找到 index.html"
  ask "请输入 dist 目录的完整路径：" "$SCRIPT_DIR/dist"
  DIST_DIR="$REPLY"
  if [ ! -f "$DIST_DIR/index.html" ]; then
    err "该目录中依然没有 index.html。"
    info "请先在本机构建并把 dist 目录上传到服务器，或从网页「部署」面板下载脚本与说明。"
    exit 1
  fi
fi
ok "站点目录：$DIST_DIR"

# ---------------- ③ 端口配置（占用自动推荐） ----------------
box "③ 监听端口"
PORT="${PORT:-8080}"
if port_free "$PORT"; then
  ok "端口 $PORT 可用"
else
  warn "端口 $PORT 已被占用"
  SUGGEST="$(find_free_port "$((PORT + 1))" || true)"
  if [ -n "$SUGGEST" ]; then
    ask "推荐使用空闲端口 $SUGGEST，回车采用，或输入其他端口：" "$SUGGEST"
    PORT="$REPLY"
    if ! port_free "$PORT"; then
      err "端口 $PORT 仍被占用，请换一个。"; exit 1
    fi
    ok "改用端口 $PORT"
  else
    err "未找到可用端口。"; exit 1
  fi
fi

# ---------------- ④ 访问方式 ----------------
box "④ 访问方式"
MODE="${MODE:-}"
PUBLIC_URL=""

if [ -z "$MODE" ]; then
  echo "  请选择外网访问方案："
  echo "    ${C_BOLD}1)${C_RESET} 仅本机 / 局域网       （http://$(lan_ip || echo localhost):$PORT）"
  echo "    ${C_BOLD}2)${C_RESET} cloudflared 临时隧道   （免注册，随机 https 域名，推荐）"
  echo "    ${C_BOLD}3)${C_RESET} localhost.run 自定义域名（基于 SSH，可自取子域名）"
  echo "    ${C_BOLD}4)${C_RESET} ngrok                  （需已安装并登录 ngrok）"
  ask "输入编号：" "2"
  case "$REPLY" in
    1) MODE="local" ;; 2) MODE="cf" ;; 3) MODE="lr" ;; 4) MODE="ngrok" ;; *) MODE="cf" ;;
  esac
fi

# ---------------- ⑤ 启动静态服务器 ----------------
box "⑤ 启动服务"
LOG_FILE="/tmp/can-i-play.$PORT.log"
( cd "$DIST_DIR" && nohup python3 -m http.server "$PORT" --bind 0.0.0.0 >"$LOG_FILE" 2>&1 & echo $! >/tmp/can-i-play.$PORT.pid )
SERVER_PID="$(cat /tmp/can-i-play.$PORT.pid 2>/dev/null || true)"
sleep 1
if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
  ok "静态服务器已启动（PID $SERVER_PID，日志 $LOG_FILE）"
else
  err "服务器启动失败，它让你查看 $LOG_FILE"; exit 1
fi

# ---------------- ⑥ 公网隧道 ----------------
if [ "$MODE" = "cf" ]; then
  box "⑥ 公网隧道 · cloudflared"
  if ! have cloudflared && have curl; then
    info "未安装 cloudflared，自己下载官方二进制去吧…"
    ARCH="$(uname -m)"
    case "$ARCH" in
      x86_64)  CF_ARCH="amd64" ;; aarch64|arm64) CF_ARCH="arm64" ;; *) CF_ARCH="amd64" ;;
    esac
    CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}"
    if curl -fsSL "$CF_URL" -o /tmp/cloudflared && chmod +x /tmp/cloudflared; then
      CLOUDFLARED=/tmp/cloudflared
      ok "cloudflared 下载完成!!!（/tmp/cloudflared）"
    else
      warn "完蛋，下载是失败了，手动安装：https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    fi
  fi
  CLOUDFLARED="${CLOUDFLARED:-$(command -v cloudflared || true)}"
  if [ -n "$CLOUDFLARED" ]; then
    info "正在建立临时隧道（约 5-15 秒）…不要动我买几个橘子就回来"
    CF_LOG="/tmp/can-i-play.cf.log"
    "$CLOUDFLARED" tunnel --url "http://localhost:$PORT" >"$CF_LOG" 2>&1 &
    TUNNEL_PID=$!
    for i in $(seq 1 30); do
      sleep 1
      PUBLIC_URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$CF_LOG" 2>/dev/null | head -n1 || true)"
      [ -n "$PUBLIC_URL" ] && break
    done
    if [ -n "$PUBLIC_URL" ]; then
      ok "公网地址已就绪,时刻准备着，为你服务"
    else
      err "你的隧道超时了，快检查外网连通性（或改用方案 3/4）。详见 $CF_LOG"
    fi
  fi

elif [ "$MODE" = "lr" ]; then
  box "⑥ 公网隧道 · localhost.run"
  if ! have ssh; then err "该方案需要 ssh，请先安装 openssh-client。"; exit 1; fi
  SUBDOMAIN="${SUBDOMAIN:-}"
  if [ -z "$SUBDOMAIN" ]; then
    ask "你想要的什么子域名（如 my-play，将得到 my-play.localhost.run）：" "can-i-play"
    SUBDOMAIN="$REPLY"
  fi
  SUBDOMAIN="$(printf '%s' "$SUBDOMAIN" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')"

  # 检测子域名是否被占用；被占用则逐个尝试相似推荐
  try_lr() { # try_lr 子域名 → 成功返回 0 并置 PUBLIC_URL；2=被占用；1=超时
    local name="$1"
    local log="/tmp/can-i-play.lr.log"
    : >"$log"
    ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 \
        -R "${name}:80:localhost:${PORT}" nokey@localhost.run >"$log" 2>&1 &
    TUNNEL_PID=$!
    local i
    for i in $(seq 1 12); do
      sleep 1
      if grep -qiE 'already (in use|taken)|is busy|unavailable' "$log" 2>/dev/null; then
        kill "$TUNNEL_PID" 2>/dev/null; TUNNEL_PID=""
        return 2   # 被占用
      fi
      if grep -qE "https?://${name}\.localhost\.run" "$log" 2>/dev/null; then
        PUBLIC_URL="$(grep -oE "https?://${name}\.localhost\.run" "$log" | head -n1)"
        return 0
      fi
    done
    kill "$TUNNEL_PID" 2>/dev/null; TUNNEL_PID=""
    return 1       # 超时/未知
  }

  if try_lr "$SUBDOMAIN"; then
    ok "子域名 $SUBDOMAIN 可用，隧道已建立"
  else
    warn "子域名 ${C_BOLD}$SUBDOMAIN${C_RESET}${C_WARN} 已被占用或无法连接${C_RESET}"
    info "自动推荐相似域名并逐个尝试："
    CANDIDATES=("${SUBDOMAIN}-play" "${SUBDOMAIN}-game" "${SUBDOMAIN}-cn" "my-${SUBDOMAIN}" "${SUBDOMAIN}-2026" "${SUBDOMAIN}-1")
    FOUND=""
    for c in "${CANDIDATES[@]}"; do
      printf '    → 尝试 %s.localhost.run … ' "$c"
      if try_lr "$c"; then echo "${C_OK}成功${C_RESET}"; FOUND="$c"; break
      else echo "${C_DIM}不可用${C_RESET}"; fi
    done
    if [ -n "$FOUND" ]; then
      ok "已改用推荐域名：$FOUND.localhost.run"
    else
      err "所有推荐域名都用不了。可稍后重试，不然就用 cloudflared（MODE=cf）。"
    fi
  fi

elif [ "$MODE" = "ngrok" ]; then
  box "⑥ 公网隧道 · ngrok"
  if ! have ngrok; then err "未安装 ngrok：https://ngrok.com/download"; exit 1; fi
  ngrok http "$PORT" --log=stdout >/tmp/can-i-play.ngrok.log 2>&1 &
  TUNNEL_PID=$!
  for i in $(seq 1 20); do
    sleep 1
    PUBLIC_URL="$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
      | python3 -c 'import sys,json
try:
  d=json.load(sys.stdin)
  print(d["tunnels"][0]["public_url"])
except Exception:
  pass' 2>/dev/null || true)"
    [ -n "$PUBLIC_URL" ] && break
  done
  if [ -n "$PUBLIC_URL" ]; then ok "ngrok 隧道已建立"; else err "ngrok 未返回地址（是否已 ngrok authtoken？）。"; fi
fi

# ---------------- ⑦ 常驻服务（可选） ----------------
box "⑦ 长期运行"
if have systemctl; then
  if [ -z "${INSTALL_SERVICE:-}" ]; then
    ask "是否安装 systemd 服务（开机自启、崩溃自动重启）？[y/N]：" "n"
    INSTALL_SERVICE="$REPLY"
  fi
  case "$INSTALL_SERVICE" in
    y|Y|yes|YES)
      UNIT=/tmp/can-i-play.service
      cat >"$UNIT" <<EOF
[Unit]
Description=Can I Play - Steam Hardware Matcher
After=network.target

[Service]
WorkingDirectory=$DIST_DIR
ExecStart=$(command -v python3) -m http.server $PORT --bind 0.0.0.0
Restart=on-failure
User=$(id -un)

[Install]
WantedBy=multi-user.target
EOF
      if sudo mv "$UNIT" /etc/systemd/system/can-i-play.service \
         && sudo systemctl daemon-reload \
         && sudo systemctl enable --now can-i-play.service; then
        ok "systemd 服务已安装并启动：sudo systemctl status can-i-play"
        info "注意：启用服务后本脚本的临时进程可关闭，隧道需另行常驻（建议用 cloudflared 服务化）。"
      else
        warn "服务安装失败（可能缺少 sudo 权限），当前仍以后台进程运行。"
      fi
      ;;
    *) info "跳过。当前服务以后台进程运行，终端关闭不影响（已 nohup）。这个功能真伟大" ;;
  esac
else
  info "无 systemd，服务已用 nohup 后台运行。停止：kill $SERVER_PID"
fi

# ---------------- ⑧ 汇总 ----------------
box "⑧ 部署完成 🎉"
echo
printf '  %s本机访问%s    http://localhost:%s\n'        "$C_BOLD" "$C_RESET" "$PORT"
LAN="$(lan_ip || true)"
[ -n "$LAN" ] && printf '  %s局域网访问%s  http://%s:%s\n' "$C_BOLD" "$C_RESET" "$LAN" "$PORT"
if [ -n "$PUBLIC_URL" ]; then
  printf '  %s公网访问%s    %s%s%s   ← 外网直接打开这个\n' "$C_BOLD" "$C_RESET" "$C_TEAL$C_BOLD" "$PUBLIC_URL" "$C_RESET"
fi
if have qrencode; then
  echo
  info "扫码访问（局域网）："
  qrencode -t UTF8 "http://${LAN:-localhost}:$PORT" 2>/dev/null | sed 's/^/    /'
fi
echo
info "停止服务  : kill $SERVER_PID${TUNNEL_PID:+ $TUNNEL_PID}"
info "查看日志  : tail -f $LOG_FILE"
info "重新部署  : ./deploy.sh"
echo
printf '%s' "$C_DIM"; printf '按 Ctrl+C 退出向导（后台服务不受影响）'; printf '%s\n' "$C_RESET"
# 保持前台便于查看，隧道进程随脚本退出由 trap 清理（仅隧道，服务器保留）
trap 'kill ${TUNNEL_PID:-} 2>/dev/null' EXIT INT TERM
wait ${TUNNEL_PID:-} 2>/dev/null
echo "sh by StarMi"
exit 0

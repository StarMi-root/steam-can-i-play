# 能不能玩 · CAN I PLAY

> Steam 硬件游戏匹配器 | Steam Hardware Game Matcher

**中文**：录入你的 CPU、GPU、RAM 和系统信息，立刻知道 Steam 上哪些游戏能流畅运行、哪些勉强可玩，并支持预估 FPS。内置 AI 助手、Steam 账户接入与 Linux 一键部署脚本。  
**English**: Enter your CPU, GPU, RAM, and OS specs to instantly discover which Steam games you can run smoothly or at minimum settings, with estimated FPS. Features an integrated AI assistant, Steam account linking, and a one-click Linux deployment script.

## ✨ 核心功能 / Core Features

### 🎮 智能硬件匹配 / Smart Hardware Matching
-   **CN**: 基于自定义加权算法（CPU/GPU/RAM 三维评分 + 内存瓶颈惩罚系数），精准判断“完美/流畅/勉强/带不动”四档体验，并给出预估帧数。
-   **EN**: Powered by a custom weighted algorithm (3D scoring of CPU/GPU/RAM + RAM bottleneck penalty) to precisely categorize performance into Perfect/Smooth/Low/Unplayable tiers with estimated FPS.

###  离线优先 AI 助手 / Offline-First AI Assistant
-   **CN**: 支持 Pollinations 免费模型、OpenAI 兼容接口及本地 Ollama 三通道自动降级；内置专属知识库，断网也能回答驱动、Proton 及故障排查问题。
-   **EN**: Supports three auto-failover channels: Pollinations (free), OpenAI-compatible APIs, and local Ollama. Includes a dedicated knowledge base for driver, Proton, and troubleshooting queries even offline.

### 🔗 Steam 账户深度集成 / Deep Steam Integration
-   **CN**: 一键接入 Steam 账户，自动拉取游戏库并与当前硬件匹配结果交叉统计，直观展示“已拥有且能玩”的游戏数量。
-   **EN**: One-click Steam account linking to automatically fetch your library and cross-reference it with hardware match results, showing exactly how many owned games are playable.

### 📚 灵活游戏库管理 / Flexible Game Library
-   **CN**: 支持一键从第三方榜单批量更新游戏库，也可手动添加任意游戏；所有自定义数据本地存储，隐私安全。
-   **EN**: Batch update game library from third-party leaderboards or manually add any title. All custom data is stored locally for complete privacy.

###  Linux 一键部署向导 / One-Click Linux Deployment
-   **CN**: 内置引导式 TUI 部署脚本 (`server.sh`)，自动检测环境、智能推荐空闲端口、支持 cloudflared/localhost.run/ngrok 三种公网隧道方案，并可生成 systemd 常驻服务。
-   **EN**: Built-in guided TUI deployment script (`server.sh`) that auto-detects environment, intelligently recommends free ports, supports three public tunnel options (cloudflared/localhost.run/ngrok), and can generate a systemd service for persistent hosting.

---

## 🚀 运行指南 / Getting Started

本项目提供两种启动方式：**推荐 Linux 用户使用 `server.sh` 一键部署**；**开发者或 Windows/Mac 用户请使用 `npm` 命令**。  
This project provides two ways to run: **Linux users are recommended to use `server.sh` for one-click deployment**; **Developers or Windows/Mac users please use `npm` commands**.

### 方式一：服务器部署 (Server Deployment) 🐧
> **适用场景 / Scenario**: Linux 生产环境、公网访问、开机自启  
> **Applicable**: Linux production environment, public access, auto-start on boot

1.  **下载 Release 包 / Download Release Package**
    ```bash
    # 前往 Releases 页面下载最新版 ZIP 并解压
    # Go to Releases page to download the latest ZIP and extract it
    unzip steam-can-i-play-v*.zip -d can-i-play && cd can-i-play
    ```

2.  **赋予执行权限 / Grant Execute Permission**
    ```bash
    chmod +x server.sh
    ```

3.  **启动服务 / Start Service**
    ```bash
    ./server.sh
    ```
    > **💡 提示 / Tip**: 脚本会自动检测端口占用、配置反向隧道（cloudflared/ngrok），并生成 systemd 服务文件实现开机自启。全程交互式引导。  
    > The script automatically detects port conflicts, configures reverse tunnels (cloudflared/ngrok), and generates a systemd service file for auto-start. Interactive guidance is provided throughout.

4.  **访问应用 / Access Application**
    终端会显示访问地址（如 `http://localhost:602` 或公网链接）。在浏览器中打开即可使用。  
    The terminal will display the access URL (e.g., `http://localhost:602` or public tunnel link). Open it in your browser to use.

### 方式二：源码构建与开发 (Source Build & Development) 💻
> **适用场景 / Scenario**: 本地调试、修改代码、贡献 PR、Windows/Mac 环境  
> **Applicable**: Local debugging, code modification, contributing PRs, Windows/Mac environment

1.  **克隆仓库 / Clone Repository**
    ```bash
    git clone https://github.com/StarMi-root/steam-can-i-play.git
    cd steam-can-i-play
    ```

2.  **安装依赖 / Install Dependencies**
    ```bash
    npm install
    ```
    > **⚠️ 注意 / Note**: 如果网络受限，请先配置国内镜像源：  
    > If network restricted, configure mirror first:  
    > `npm config set registry https://registry.npmmirror.com`

3.  **开发模式启动 / Start Dev Server**
    ```bash
    npm run dev
    ```
    浏览器访问 `http://localhost:602`（若端口被占用请检查 `vite.config.js`）。  
    Visit `http://localhost:602` in browser (check `vite.config.js` if port is occupied).

4.  **生产环境构建 / Production Build**
    ```bash
    npm run build
    # 构建产物位于 dist/ 目录
    # Build artifacts are located in dist/ directory
    # 可使用 npx serve dist 本地预览
    # Use npx serve dist for local preview
    ```

### ⚙️ 环境要求 / Environment Requirements

| 组件 / Component | 最低版本 / Min Version | 说明 / Description |
| :--- | :--- | :--- |
| Node.js | ≥ 18.0.0 | 推荐使用 LTS 版本 / Recommended LTS |
| npm | ≥ 9.0.0 | 随 Node.js 自带 / Bundled with Node.js |
| Linux Kernel | ≥ 4.15 | 仅 server.sh 需要 / Only for server.sh |
| Browser | Chrome/Firefox ≥ 90 | 需支持 ES Modules / ES Modules required |

### 🛑 常见问题排查 / Troubleshooting

-   **Q: `server.sh` 提示权限不足？ / Permission denied?**  
    A: 确保执行了 `chmod +x server.sh`，且当前用户有 sudo 权限（用于创建 systemd 服务）。  
    Ensure you ran `chmod +x server.sh` and have sudo privileges (for creating systemd service).

-   **Q: 构建时报 `Could not resolve "../../deploy.sh?raw"`？**  
    A: 确认 `vite.config.js` 中包含 `assetsInclude: ['**/*.sh']`，且 `deploy.sh` 存在于项目根目录。  
    Confirm `assetsInclude: ['**/*.sh']` exists in `vite.config.js` and `deploy.sh` is in project root.

-   **Q: 页面黑屏或白屏？ / Black or white screen?**  
    A: **请勿直接双击打开 `index.html`！** 必须通过 `npm run dev` 或 Web 服务器访问。  
    **Do NOT double-click `index.html`!** Must access via `npm run dev` or web server.

---

## ⚖️ 许可证与版权 / License & Copyright

本项目采用 **GNU General Public License v3.0** 开源协议。  
This project is licensed under the **GNU General Public License v3.0**.

Copyright (C) 2026 王博

-   ✅ **你可以自由使用、修改、分发本软件。**  
    You are free to use, modify, and distribute this software.
-   ⚠️ **任何衍生作品必须以相同的 GPL v3 协议开源。**  
    Any derivative work MUST be released under the same GPL v3 license.
-   ❌ **禁止在不开放源码的情况下用于闭源商业产品。**  
    Proprietary/closed-source distribution without releasing source code is prohibited.

详见 [LICENSE](LICENSE) 文件获取完整法律文本。  
See the [LICENSE](LICENSE) file for full legal text.

> **Note on AI Assistance / AI 辅助说明**:  
> This project was initially drafted with AI assistance but has undergone substantial human-led refactoring, parameter tuning, and architectural redesign. The author asserts copyright over the final integrated work based on these creative contributions.  
> 本项目初稿由 AI 辅助生成，但经过了作者实质性的架构重构、参数调优与交互设计。作者基于这些创造性贡献对最终整合作品主张版权。
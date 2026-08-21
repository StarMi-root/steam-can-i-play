能不能玩 · CAN I PLAY
Steam 硬件游戏匹配器 | Steam Hardware Game Matcher

    中文：录入你的 CPU、GPU、RAM 和系统信息，立刻知道 Steam 上哪些游戏能流畅运行、哪些勉强可玩，并支持预估 FPS。内置 AI 助手、Steam 账户接入与 Linux 一键部署脚本。
    English: Enter your CPU, GPU, RAM, and OS specs to instantly discover which Steam games you can run smoothly or at minimum settings, with estimated FPS. Features an integrated AI assistant, Steam account linking, and a one-click Linux deployment script.

✨ 核心功能 / Core Features

    🎮 智能硬件匹配 / Smart Hardware Matching
        CN: 基于自定义加权算法（CPU/GPU/RAM 三维评分 + 内存瓶颈惩罚系数），精准判断“完美/流畅/勉强/带不动”四档体验，并给出预估帧数。
        EN: Powered by a custom weighted algorithm (3D scoring of CPU/GPU/RAM + RAM bottleneck penalty) to precisely categorize performance into Perfect/Smooth/Low/Unplayable tiers with estimated FPS.
    🤖 离线优先 AI 助手 / Offline-First AI Assistant
        CN: 支持 Pollinations 免费模型、OpenAI 兼容接口及本地 Ollama 三通道自动降级；内置专属知识库，断网也能回答驱动、Proton 及故障排查问题。
        EN: Supports three auto-failover channels: Pollinations (free), OpenAI-compatible APIs, and local Ollama. Includes a dedicated knowledge base for driver, Proton, and troubleshooting       queries even offline.
        ** Steam 账户深度集成 / Deep Steam Integration**

    CN: 一键接入 Steam 账户，自动拉取游戏库并与当前硬件匹配结果交叉统计，直观展示“已拥有且能玩”的游戏数量。
    EN: One-click Steam account linking to automatically fetch your library and cross-reference it with hardware match results, showing exactly how many owned games are playable.

📚 灵活游戏库管理 / Flexible Game Library

    CN: 支持一键从第三方榜单批量更新游戏库，也可手动添加任意游戏；所有自定义数据本地存储，隐私安全。
    EN: Batch update game library from third-party leaderboards or manually add any title. All custom data is stored locally for complete privacy.

🐧 Linux 一键部署向导 / One-Click Linux Deployment

    CN: 内置引导式 TUI 部署脚本 (server.sh)，自动检测环境、智能推荐空闲端口、支持 cloudflared/localhost.run/ngrok 三种公网隧道方案，并可生成 systemd 常驻服务。
    EN: Built-in guided TUI deployment script (server.sh) that auto-detects environment, intelligently recommends free ports, supports three public tunnel options (cloudflared/localhost.run/ngrok), and can generate a systemd service for persistent hosting.

    许可证 / License
本项目采用 GNU General Public License v3.0 开源协议。
This project is licensed under the GNU General Public License v3.0.
Copyright (C) 2026 王博

    ✅ 你可以自由使用、修改、分发本软件。
    ⚠️ 任何衍生作品必须以相同的 GPL v3 协议开源。
    ❌ 禁止在不开放源码的情况下用于闭源商业产品。

详见 LICENSE
 文件。
See the LICENSE
 file for full legal text.

    Note on AI Assistance: This project was initially drafted with AI assistance but has undergone substantial human-led refactoring, parameter tuning, and architectural redesign. The author asserts copyright over the final integrated work based on these creative contributions.
    AI 辅助说明：本项目初稿由 AI 辅助生成，但经过了作者实质性的架构重构、参数调优与交互设计。作者基于这些创造性贡献对最终整合作品主张版权。

##  License & Copyright

This project is licensed under the **GNU General Public License v3.0**.

Copyright (C) 2026 王博

- ✅ You are free to use, modify, and distribute this software.
- ⚠️ Any derivative work MUST be released under the same GPL v3 license.
- ❌ Proprietary/closed-source distribution without releasing source code is prohibited.

See the [LICENSE](LICENSE) file for full legal text.

> **Note on AI Assistance**: This project was initially drafted with AI assistance but has undergone substantial human-led refactoring, parameter tuning, and architectural redesign. The author asserts copyright over the final integrated work based on these creative contributions.

智能匹配算法：基于 CPU/GPU/RAM 三维评分，自动识别瓶颈并给出升级建议（体现 match.ts 的参数调优）

离线优先架构：所有数据本地存储，无需联网即可使用完整功能

AI 助手兜底机制：支持 Pollinations / OpenAI / Ollama 三通道，断网时自动切换本地知识库（体现 ai.ts 的降级策略）

Linux 专属部署向导：一键 TUI 脚本，自动处理端口冲突、隧道建立与 systemd 服务化（体现 deploy.sh 的交互设计）
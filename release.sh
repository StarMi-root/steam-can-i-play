#!/usr/bin/env bash
# ==============================================================================
# Copyright (C) 2026 王博
# Licensed under GNU General Public License v3.0
# See LICENSE file for full license text.
# ==============================================================================
# steam-can-i-play 一键构建与发布脚本
# 用法: chmod +x release.sh && ./release.sh
# ==============================================================================

set -euo pipefail

RELEASE_NAME="steam-can-i-play.v1.0.0.zip"
DIST_DIR="dist"
BRANCH="main"

echo "🚀 [1/7] 检查 GPL 许可证文件..."
if [ ! -f "LICENSE" ]; then
    echo "❌ 错误: 未找到 LICENSE 文件，GPL v3 合规检查失败！"
    exit 1
fi
echo "✅ LICENSE 文件存在"

echo "🔧 [2/7] 安装/更新依赖并修复 terser..."
npm install -D terser --silent
echo "✅ terser 已就绪"

echo "🏗️ [3/7] 清理旧构建产物并重新构建..."
rm -rf "$DIST_DIR" node_modules/.vite
npm run build
echo "✅ 构建完成"

echo "️ [4/7] GPL 合规性验证..."
if [ ! -f "$DIST_DIR/LICENSE" ]; then
    cp LICENSE "$DIST_DIR/"
    echo "ℹ️ 已将 LICENSE 复制到 dist 目录"
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
    echo "❌ 错误: dist/index.html 不存在，构建可能失败！"
    exit 1
fi

MAP_COUNT=$(find "$DIST_DIR/assets" -name "*.map" 2>/dev/null | wc -l)
if [ "$MAP_COUNT" -eq 0 ]; then
    echo "⚠️ 警告: 未找到 sourcemap 文件，GPL 源码提供义务可能未满足！"
else
    echo "✅ 找到 $MAP_COUNT 个 sourcemap 文件，符合 GPL 要求"
fi

echo "📦 [5/7] 打包 Release 附件..."
cd "$DIST_DIR"
zip -r "../$RELEASE_NAME" .
cd ..
ZIP_SIZE=$(du -h "$RELEASE_NAME" | cut -f1)
echo "✅ 已生成 $RELEASE_NAME ($ZIP_SIZE)"

echo "📝 [6/7] 提交源码到 Git..."
git add .
if git diff --cached --quiet; then
    echo "ℹ️ 无源码变更需要提交"
else
    git commit -m "release: prepare v1.0.0 with GPL v3 compliance

- Fixed terser dependency for production build
- Added assetsInclude for deploy.sh raw import
- Ensured LICENSE and sourcemaps in dist
- Packaged release artifact: $RELEASE_NAME"
fi

echo " [7/7] 推送到 GitHub ($BRANCH)..."
git push origin "$BRANCH"
echo "✅ 源码推送成功"

echo ""
echo "═══════════════════════════════════════════"
echo "🎉 发布准备完成！"
echo "═══════════════════════════════════════════"
echo "📁 本地附件: $RELEASE_NAME ($ZIP_SIZE)"
echo "🌐 下一步: 在手机浏览器访问 GitHub Releases 页面"
echo "   上传 $RELEASE_NAME 作为二进制附件"
echo "   Tag: v1.0.0"
echo "   Title: v1.0.0 - Initial GPL v3 Release"
echo "═══════════════════════════════════════════"
#!/bin/bash
# 清理 macOS 自动生成的 ._* 文件

echo "正在清理 macOS 自动生成的文件..."

# 查找并删除所有 ._* 文件
find . -name "._*" -type f -delete

# 查找并删除所有 .DS_Store 文件
find . -name ".DS_Store" -type f -delete

echo "清理完成！"
echo ""
echo "已删除的文件类型："
echo "  - ._* (macOS 资源分叉文件)"
echo "  - .DS_Store (macOS 文件夹元数据)"
echo ""
echo "提示：这些文件已被添加到 .gitignore，不会再次被 Git 跟踪。"


---
title: html转md文件
date: 2026-06-02
tags:
  - 技术
---
# html转md文件
```
from markdownify import MarkdownConverter
from bs4 import BeautifulSoup

# 读取 HTML 文件
with open("技术支持知识库.html", "r", encoding="utf-8") as f:
    html_content = f.read()

# 解析 HTML（支持表格、代码、链接、图片、标题）
soup = BeautifulSoup(html_content, "html.parser")

# 高保真转 MD
converter = MarkdownConverter(
    heading_style="ATX",        # 保持 # 标题
    code_style="fenced",         # 代码块用 ``` 包裹
    strip=None,                  # 不删除任何内容
    keep_xml=True                # 保留功能标签
)
md_content = converter.convert_soup(soup)

# 保存 MD
with open("技术支持知识库.md", "w", encoding="utf-8") as f:
    f.write(md_content)

print("✅ 转换完成！已生成：技术支持知识库.md")
```
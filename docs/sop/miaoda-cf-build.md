---
title: miaoda cf build 注意事项
date: 2026-07-09
tags:
  - 技术
---
秒哒在下载的源代码中构建函数中写的是
![image.png](https://img.z2m.store/file/1783582004680_image.png)
```
{
  "name": "miaoda-react-admin",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "echo 'Do not use this command, only use lint to check'",
    "build": "echo 'Do not use this command, only use lint to check'",
    "lint": "tsgo -p tsconfig.check.json; npx biome lint; .rules/check.sh;npx tailwindcss -i ./src/index.css -o /dev/null 2>&1 | grep -E '^(CssSyntaxError|Error):.*' || true;.rules/testBuild.sh"
  },
```
   我们需要将其改为
```
{
  "name": "miaoda-react-admin",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "build": "vite build",
    "pages:dev": "wrangler pages dev dist",
    "pages:deploy": "wrangler pages deploy dist"
  },
```
确保其正确生成 dist 文件

在cf中的构建配置如下
![image.png](https://img.z2m.store/file/1783582261355_image.png)
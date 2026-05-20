---
title: 笔记直接发布到cloudflare
date: 2026-05-20
tags:
  - 技术
---
## 笔记直接发布到cloudflare

### 各平台部署指南

### Netlify / Vercel / Cloudflare Pages / AWS Amplify / Render

使用仪表板创建新项目并更改这些设置：

- **构建命令：** pnpm build
- **输出目录：** `docs/.vitepress/dist`
- **node 版本：** `20` (或更高版本)
![image.png|591](https://img.z2m.store/file/1779267693434_image.png) 
## 有些报错可能是因为死链的原因

打开你的 VitePress 配置文件：

`packages/blogpress/.vitepress/config.ts`

添加一行配置：

ts

```
import { defineConfig } from 'vitepress'

export default defineConfig({
  // 👇 加上这一行，关闭死链检查
  ignoreDeadLinks: true,

  // 你原来的其他配置...
})
```

**保存 → 重新部署 → 立刻成功！**
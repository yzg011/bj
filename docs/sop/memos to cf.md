---
title: 安装memos到cf
date: 2026-06-09
tags:
  - 技术
---
# Memos on Cloudflare 发布


## 简介

将 [Memos](https://memos.top/go/aHR0cHM6Ly9naXRodWIuY29tL3VzZW1lbW9zL21lbW9z) 笔记应用完整迁移到 Cloudflare 边缘平台，使用 Workers + D1 + R2 替代原有的 Go + SQLite + 本地存储架构。

## 技术栈

|层级|技术|
|---|---|
|运行时|Cloudflare Workers|
|后端框架|Hono|
|数据库|Cloudflare D1 (SQLite)|
|文件存储|Cloudflare R2|
|AI|Cloudflare Workers AI (Whisper)|
|前端|React + Vite + TailwindCSS|
|认证|JWT (HS256) + bcrypt|

## 前置要求

- [Node.js](https://memos.top/go/aHR0cHM6Ly9ub2RlanMub3JnLw) >= 18
- [Wrangler CLI](https://memos.top/go/aHR0cHM6Ly9kZXZlbG9wZXJzLmNsb3VkZmxhcmUuY29tL3dvcmtlcnMvd3JhbmdsZXIv) >= 4.14
- Cloudflare 账号（已开通 Workers、D1、R2）

## 快速部署

### 1. 克隆仓库

```
git clone https://github.com/yzg011/memos-on-cloudflare.git
cd memos-on-cloudflare
```

### 2. 安装依赖

```
npm install
cd web && npm install && cd ..
```

### 3. 创建 Cloudflare 资源

```
# 创建 D1 数据库
wrangler d1 create cfmemos-db

# 创建 R2 存储桶
wrangler r2 bucket create cfmemos
```

### 4. 配置 wrangler.toml

将第 3 步创建 D1 时返回的 `database_id` 填入 `wrangler.toml`：

```
[assets]
directory = "./web/dist"
binding = "ASSETS"
not_found_handling = "single-page-application"
run_worker_first = ["/api/*", "/file/*", "/u/*"]

[[d1_databases]]
binding = "DB"
database_name = "cfmemos-db"
database_id = "你的实际数据库ID"
```

### 5. 设置生产密钥

```
# 设置 JWT 密钥（务必使用强随机字符串）
wrangler secret put JWT_SECRET
```

### 6. 初始化数据库

```
npm run db:migrate:remote
```

### 7. 构建并部署

```
npm run deploy
```

部署完成后，访问 Workers 分配的域名，首次访问会进入管理员注册页面。

## GitHub Actions 自动部署

推送到 `main` 分支会自动触发部署。需要在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加：

|Secret|说明|
|---|---|
|`CLOUDFLARE_API_TOKEN`|Cloudflare API Token（需要 Workers Scripts:Edit、D1:Edit、R2:Edit 权限）|
|`CLOUDFLARE_ACCOUNT_ID`|Cloudflare Account ID（在 Dashboard 右侧栏可找到）|

工作流会自动完成：安装依赖 → 构建前端 → 执行数据库迁移 → 部署 Worker。

![image.png](https://memos.top/usr/uploads/2026/05/652232882.png "image.png")

## 本地开发

需要两个终端窗口：

```
# 终端 1：启动 Worker 后端（端口 8787）
npm run db:migrate   # 首次运行需要初始化本地数据库
npm run dev

# 终端 2：启动前端开发服务器（端口 3001，自动代理 API 到 8787）
npm run dev:web
```

浏览器访问 `http://localhost:3001`。

## 项目结构

```
├── wrangler.toml          # Cloudflare 配置（D1、R2、AI 绑定）
├── package.json           # 根 package，部署脚本
├── migrations/
│   └── 0001_initial.sql   # D1 数据库 schema
├── worker/
│   └── src/
│       ├── index.ts       # Hono 入口，路由挂载
│       ├── types.ts       # Env 绑定类型定义
│       ├── routes/        # API 路由
│       │   ├── auth.ts    # 登录/注册/刷新令牌
│       │   ├── memos.ts   # 备忘录 CRUD + 评论/反应/分享
│       │   ├── users.ts   # 用户管理 + 设置/PAT/通知
│       │   ├── attachments.ts  # 文件上传（R2）
│       │   ├── files.ts   # 文件下载服务
│       │   ├── instance.ts # 实例配置
│       │   ├── ai.ts      # Workers AI 转写
│       │   ├── idp.ts     # SSO 身份提供商
│       │   ├── shortcuts.ts # 快捷过滤器
│       │   └── sse.ts     # 实时更新
│       ├── auth/          # JWT、密码哈希、PAT
│       ├── db/            # D1 查询模块
│       └── middleware/    # 认证中间件
└── web/
    └── src/
        ├── connect.ts     # REST 客户端（替代 Connect RPC）
        ├── contexts/      # React Context（实例、认证）
        ├── components/    # UI 组件
        ├── pages/         # 页面路由
        ├── locales/       # i18n 翻译文件
        └── shims/         # @bufbuild/protobuf 兼容层
```

## 环境变量

|变量|说明|必填|
|---|---|---|
|`JWT_SECRET`|JWT 签名密钥，生产环境必须使用强随机字符串|是|
|`INSTANCE_NAME`|实例名称，显示在页面标题|否|

生产环境通过 `wrangler secret put` 设置敏感变量，非敏感变量在 `wrangler.toml` 的 `[vars]` 中配置。

## Cloudflare 资源绑定

|绑定名|类型|用途|
|---|---|---|
|`DB`|D1 Database|存储用户、备忘录、设置等所有结构化数据|
|`BUCKET`|R2 Bucket|存储附件文件（图片、音频、文档）|
|`AI`|Workers AI|音频转写（@cf/openai/whisper）|
|`ASSETS`|Static Assets|托管前端构建产物|

## 自定义域名

在 Cloudflare Dashboard 中为 Worker 添加自定义域名：

1. Workers & Pages → cfmemos → Settings → Domains & Routes
2. 添加自定义域名（需要域名已在 Cloudflare DNS 中）

## 功能特性

- Markdown 备忘录（支持标签、代码块、任务列表、Mermaid 图表）
- 多用户支持（管理员/普通用户）
- 备忘录可见性（私有/工作区/公开）
- 文件附件上传（最大 100MB）
- 备忘录分享链接（可设过期时间）
- 备忘录评论和表情反应
- 音频录制 + AI 转写
- SSO 单点登录
- 多语言支持（中文、英文等 30+ 语言）
- 暗色/亮色主题
- 日历热力图
- 标签管理
- Webhook 通知

## 与原版 Memos 的区别

|项目|原版 Memos|本项目|
|---|---|---|
|后端|Go + gRPC|Cloudflare Workers + Hono|
|数据库|SQLite (本地文件)|Cloudflare D1 (托管 SQLite)|
|文件存储|本地/S3|Cloudflare R2|
|AI|OpenAI/Gemini API|Cloudflare Workers AI|
|部署|Docker/二进制|`wrangler deploy`|
|运维|需要服务器|无服务器，零运维|
|前端通信|Connect RPC (protobuf)|REST JSON|


---
title: "cf 安装极简论坛"
date: 2026-06-10
tags: []
---
# 极简论坛

[](https://github.com/yzg011/cloudflare-discus#%E6%9E%81%E7%AE%80%E8%AE%BA%E5%9D%9B)

当前分支已经改成 `Nuxt 静态前端 + Cloudflare Workers API + Cloudflare D1`。

- 前端页面结构、路由和交互尽量保持 `discussion` 原项目一致。
- 后端不再依赖 Prisma / Postgres / Nuxt server。
- 静态资源由 Worker 同域托管，`/api/*` 由 Worker 处理。

## 架构

[](https://github.com/yzg011/cloudflare-discus#%E6%9E%B6%E6%9E%84)

- 前端：Nuxt 3，`ssr: false`，通过 `nuxt generate` 生成静态站点
- 后端：Cloudflare Workers
- 数据库：Cloudflare D1
- 入口配置：[wrangler.jsonc](https://github.com/yzg011/cloudflare-discus/blob/main/wrangler.jsonc)
- 数据库迁移：[worker/migrations](https://github.com/yzg011/cloudflare-discus/blob/main/worker/migrations)

## 快速开始

[](https://github.com/yzg011/cloudflare-discus#%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B)

### 1. 创建 D1 数据库

[](https://github.com/yzg011/cloudflare-discus#1-%E5%88%9B%E5%BB%BA-d1-%E6%95%B0%E6%8D%AE%E5%BA%93)

```shell
npx wrangler d1 create bbs
```

把命令返回的 `database_id` 填入 [wrangler.jsonc](https://github.com/yzg011/cloudflare-discus/blob/main/wrangler.jsonc) 的 `d1_databases[0].database_id`。

### 2. 创建 R2 Bucket

[](https://github.com/yzg011/cloudflare-discus#2-%E5%88%9B%E5%BB%BA-r2-bucket)

```shell
npx wrangler r2 bucket create discussion-images
```

把实际 bucket 名称填入 [wrangler.jsonc](https://github.com/yzg011/cloudflare-discus/blob/main/wrangler.jsonc) 的 `r2_buckets[0].bucket_name` 和 `preview_bucket_name`。

### 3. 配置环境变量（我没有配置这一步）

[](https://github.com/yzg011/cloudflare-discus#3-%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F)

- 前端构建变量：复制 [.env.example](https://github.com/yzg011/cloudflare-discus/blob/main/.env.example) 为 `.env`
- Worker 运行时变量：复制 [.dev.vars.example](https://github.com/yzg011/cloudflare-discus/blob/main/.dev.vars.example) 为 `.dev.vars`

注意：

- `NUXT_PUBLIC_TOKEN_KEY` 必须和 `TOKEN_KEY` 保持一致
- `NUXT_PUBLIC_AVATAR_CDN` 建议和 `AVATAR_CDN` 保持一致
- 生产环境建议把 `COOKIE_SECURE` 设为 `"true"`

### 4. 安装依赖

[](https://github.com/yzg011/cloudflare-discus#4-%E5%AE%89%E8%A3%85%E4%BE%9D%E8%B5%96)

```shell
npm install
```

### 5. 本地初始化 D1

[](https://github.com/yzg011/cloudflare-discus#5-%E6%9C%AC%E5%9C%B0%E5%88%9D%E5%A7%8B%E5%8C%96-d1)

```shell
npm run d1:migrate:local
```

这里的脚本会直接对 `wrangler.jsonc` 里声明的 `DB` 绑定执行 migration，不需要再手动改数据库名。

### 6. 本地预览完整站点

[](https://github.com/yzg011/cloudflare-discus#6-%E6%9C%AC%E5%9C%B0%E9%A2%84%E8%A7%88%E5%AE%8C%E6%95%B4%E7%AB%99%E7%82%B9)

```shell
npm run cf:preview
```

这条命令会先执行 `nuxt generate`，然后用 Wrangler 在本地启动 Worker，并把 `.output/public` 作为同域静态资源。

`npm run dev` 仅适合单独调前端 UI，不包含 Worker API。

## 部署到 Cloudflare

[](https://github.com/yzg011/cloudflare-discus#%E9%83%A8%E7%BD%B2%E5%88%B0-cloudflare)

```shell
npm run d1:migrate:remote
npm run cf:deploy
```


## 当前已覆盖的核心能力

[](https://github.com/yzg011/cloudflare-discus#%E5%BD%93%E5%89%8D%E5%B7%B2%E8%A6%86%E7%9B%96%E7%9A%84%E6%A0%B8%E5%BF%83%E8%83%BD%E5%8A%9B)

- 注册、登录、个人设置
- 发帖、回帖、收藏、帖子支持
- 点赞 / 点踩评论
- 站内消息、私信、Telegram webhook 绑定通知
- 节点、头衔、用户、帖子、评论的后台管理
- 站点配置持久化到 D1
- 邀请码、积分、签到、隐藏内容付费查看
- R2 图片上传 邮件发送已经切到 Resend。部署后请在后台“系统设置 > 邮件设置”中填写 `Resend API Key`、发件邮箱和发件人名称；如果启用了邮箱验证码注册，注册验证码和找回密码邮件也会走 Resend。
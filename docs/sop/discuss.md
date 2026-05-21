---
title: "增加discuss评论"
date: 2026-05-21
tags: []
---
# VitePress 集成 Giscus 评论插件


## 前言

笔者维护的 [VitePress 博客主题](https://theme.sugarat.top/) 已经集成了非常多的功能，为便于在主题之外复用，因此有计划将其一部分功能分离出来，形成独立的插件。

分离的 [Giscus 评论插件](https://www.npmjs.com/package/vitepress-plugin-giscus)，效果如下：

![](https://github.com/ATQQ/sugar-blog/blob/master/packages/vitepress-plugin-giscus/image.png?raw=true)

不仅集成了 Giscus 评论系统，还包含了一个悬浮的评论跳转按钮（带移动端适配）。

接下来先简单介绍一下用法，再快速讲解核心原理。

插件开发基于之前创建的一个通用模板，[vitepress-plugin-slot-inject-template](https://github.com/ATQQ/sugar-blog/tree/master/template/vitepress-plugin-slot-inject-template)，在模板的基础上，**插件95%的代码由 Gemini 3.0 生成。**

## 关于 Giscus

[Giscus](https://giscus.app/zh-CN) 是一个基于 GitHub Discussions 的评论系统。它开源、免费、无广告、无跟踪，并且支持多种语言。

**配置参数获取方式：**

1. 访问 [Giscus 官网](https://giscus.app/zh-CN)。
2. 按照页面提示配置你的仓库信息（确保仓库是公开的，并且安装了 Giscus App，且开启了 Discussions 功能）。
3. 在页面底部的“启用 giscus”部分，你会看到生成的一段 `<script>` 代码。
4. 将代码中的 `data-repo`、`data-repo-id`、`data-category`、`data-category-id` 等属性值对应填入插件配置即可。

## 如何使用

_只需要 2 步：_

1. 安装插件

```
pnpm add vitepress-plugin-giscus @giscus/vue
```

1  

2. 配置插件

在 `.vitepress/config.ts` 中引入插件：

```
import { defineConfig } from 'vitepress'
import { giscusPlugin } from 'vitepress-plugin-giscus'

export default defineConfig({
  vite: {
    plugins: [
      giscusPlugin({
        repo: 'your-github-username/your-repo-name',
        repoId: 'your-repo-id',
        category: 'Announcements',
        categoryId: 'your-category-id',
        mapping: 'pathname',
        // ...其他 giscus 配置
      })
    ]
  }
})
```
---
title: blog添加algolia搜索
date: 2026-05-03 09:08:57
tags: 技术
---

## 安装

插件地址在：https://github.com/LouisBarranqueiro/hexo-algoliasearch

```
npm install hexo-algoliasearch --save
```

## 注册 Algolia 并获取配置

https://www.algolia.com/

[![https://blog.linkinstars.com/blog/blog-hexo-butterfly-algolia-1.png](https://blog.linkinstars.com/blog/blog-hexo-butterfly-algolia-1.png)](https://blog.linkinstars.com/blog/blog-hexo-butterfly-algolia-1.png)

[![https://blog.linkinstars.com/blog/blog-hexo-butterfly-algolia-2.png](https://blog.linkinstars.com/blog/blog-hexo-butterfly-algolia-2.png)](https://blog.linkinstars.com/blog/blog-hexo-butterfly-algolia-2.png)

## 配置

修改博客**根目录**的配置文件 `_config.yml`

```
algolia:
  appId: "Z7A3XW4R2I"
  apiKey: "12db1ad54372045549ef465881c17e743"
  adminApiKey: "40321c7c207e7f73b63a19aa24c4761b"
  chunkSize: 5000
  indexName: "my-hexo-blog"
  fields:
    - content:strip:truncate,0,500
    - excerpt:strip
    - gallery
    - permalink
    - photos
    - slug
    - tags
    - title
```

修改主题目录下的配置文件 `themes/butterfly/_config.yml`

```
algolia_search:
  enable: true
  hits:
    per_page: 10
  labels:
    input_placeholder: Search for Posts
    hits_empty: "我们没有找到任何搜索结果: ${query}"
    hits_stats: "找到${hits}条结果（用时${time} ms）"
```

## 命令

```
hexo algolia
```

其他命令照常就可以

## 注意事项

> 虽然有很多博客已经写过如何添加这个插件，如何使用，但是我在实际过程中还是遇到了很多奇怪的问题

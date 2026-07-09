---
title: wechat database 转移注意事项
date: 2026-07-09
tags: []
---
1 导入数据库后发现还是有问题
在数据库的配置中找到了 这个
![image.png](https://img.z2m.store/file/1783581436118_image.png)
```
[auth.email]
enable_confirmations = false

[auth.phone]
enable_confirmations = false

```
发现里面不需要强制要求邮箱认证

但是supabase默认邮箱认证是打开的 导致注册失败，在supabase的设置中将其关闭就可以

![image.png](https://img.z2m.store/file/1783581744759_image.png)
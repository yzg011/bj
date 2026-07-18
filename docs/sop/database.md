---
title: database 大坑
date: 2026-07-18
tags:
  - 技术
---
### database 大坑

最近在做一个聊天软件

发现秒哒平台的修改密码正常，我修改密码就一直提示Current password required when setting new password，我明明已经填入当前密码了，他还是这么显示

后来我将同样的代码只改连接的数据库，发现确实是连接不同的数据库产生

后来发现旧版本的supabase 
## 1. 核心错误 1：先登录校验旧密码，但**没有把新的 session 同步回去**

你用 `signInWithPassword` 校验旧密码后，当前页面的 supabase 实例 session 没变，后面调用 `updateUser` 时，请求上下文没有带上校验后的凭证，后端依旧判定你没提供当前密码。

## 2. 核心错误 2：`updateUser` 只传了 `password`，**缺少 `current_password` 参数**


而他使用的是旧版本，只需要填新密码和确认密码就可以

而我使用的是新版本的supabase，必须要传当前密码和新密码才可以

修改了上述逻辑后就可以正常修改了


最后发一下 我的新聊天工具


地址：https://xchat.z2m.store

![image.png](https://img.z2m.store/file/1784357495682_image.png)

大家可以来找茬


临时聊天链接体验：https://xchat.z2m.store/invite/45b6c5aad20ed722bd3dc719c541d0c8


谢谢大家
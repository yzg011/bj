---
title: 给你的静态博客网站增加管理后台
date: 2026-08-15
tags:
  - 技术
---
## 给你的静态博客网站增加管理后台

由于静态网站 没有数据库想要增加管理后台还是有一定难度的，不过这个难不倒聪明的广大网友


首先我们复制某团子的管理后台到自己的博客网站


![image.png](https://img.z2m.store/file/1786777932466_image.png)

这样我们就得到了一个管理后台啦，你想什么了，哪有那么简单哦

大家就看到一个管理后台的登录界面，那密码和用户名是什么了？

我们看到用户名是固定的，但是密码，说实话  我也不知道。

其实这个密码是通过你想要设置的密码经过hash-256加密存储在本地环境变量的

1. 修改你的 `.env.local`

```
PUBLIC_ADMIN_PASSWORD_HASH="921ff02109a3b7962c7799jjnjkd82b270a279c2180c85aea7a4e4c0dcd1d9"
```

2. **彻底关闭 Astro dev 终端进程，重新运行 dev**，只刷新浏览器不会加载新环境变量。
3. 浏览器按 `Ctrl+Shift+R` 硬刷新，检查开发者工具，确认 `data‑hash` 属性和上面这串完全一致。
![image.png](https://img.z2m.store/file/1786778685644_image.png)
4. 输入密码：`xxxxx` 登录。
你浏览器显示的加密和你在本地环境变量定义的加密是一样的那么 你的加密就设置成功了

这时你就可以通过 你设置的密码登录啦！

这个时候你要提交到cf的话，就需要再cf上定义这个环境变量就好啦

最后还有一个文件要放的的

### 确认文件物理位置

你的项目源码，确认：

plaintext

```
src/
└── js/
    └── gh-client.js      ← 这个文件必须存在！！
```

Astro 静态资源，**必须放在 `public/js/gh‑client.js`，不是 src/js/**

> ✅正确路径：`public/js/gh-client.js`
> 
> ❌错误：`src/js/gh-client.js` —— build 之后不会输出到 `/js/gh-client.js`

偷偷告诉你 可以使用这个网站生成你的密码哦：[https://emn178.github.io/online-tools/md5.html](https://emn178.github.io/online-tools/md5.html)


这样打开管理后台就完全没问题啦

![image.png](https://img.z2m.store/file/1786779350851_image.png)

现在只剩下最后一步啦

直接在github 设置中新建一个token 就可以啦

需要 `Contents: Read & Write` 权限。创建：[GitHub Fine-grained Token](https://github.com/settings/personal-access-tokens/new) → 选仓库 → Contents: Read and Write

填到这里  现在就能在线编辑你的静态博客网站啦

![image.png](https://img.z2m.store/file/1786779544223_image.png)
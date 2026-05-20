---
title: 部署Twikoo到cloudflaer
published: 2026-05-17
description: ''
image: ''
tags: []
category: ''
draft: false 
lang: ''
---

## 部署Twikoo

### 复制仓库

首先 [Fork](https://github.com/wuzhengmao/twikoo-cloudflare/fork) 博主的仓库，输入你自己的仓库名称，点击 `Create fork` 按钮创建自己的仓库。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/github-fork.png)



> **国内对github的访问向来是时断时续的，如果安装失败可以等一等，或者使用科学上网工具，这里推荐可以 [注册](https://speedv.219226.xyz/#/register) 一个，目前有免费流量可以薅羊毛。**

### 创建D1数据库

登录 [Cloudflare](https://dash.cloudflare.com/)，点击左侧栏 `存储和数据库` - `D1 SQL数据库`，点击 `创建` 按钮，填入 `twikoo` 作为数据库名后，点击 `创建` 按钮。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-create-d1.png)



创建成功后回到列表页面，可以找到对应红框中的 `ID` 复制出来。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-get-database-id.png)



然后点击 `twikoo` 数据库，选择 `控制台` 页签，将仓库根目录下的 `schema.sql` 文件中的内容全部复制到输入框中，点击 `执行` 按钮。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-create-table.png)



很快数据库表就创建完了，最后修改仓库根目录下的 `wrangler.toml` 文件中的 `database_id` 值。





```toml
[[d1_databases]]
binding = "DB" # available in your Worker on env.DB
database_name = "twikoo"
database_id = "b35e0bd5-6d17-42eb-a597-ff4869a74461" # 这里替换成你前面红框里的内容
```

### 创建R2存储

点击左侧栏 `R2 对象存储`，点击 `创建存储桶`，填入 `twikoo` 作为存储桶名称，点击 `创建存储桶` 按钮。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-create-r2.png)



创建成功后后回到列表页面，就可以看到刚才创建的存储桶了。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-create-r2-done.png)



再点击 `twikoo` 进入存储桶，点击 `设置` 页签，在 `公开访问` 点击 `连接域`， 输入你想设置的域名比如 `twikoo.r2.example.org`。如果还没有个人域名的可以看我的另外一篇博客 [如何注册一个域名并托管到Cloudflare](https://blog.mingy.org/2024/12/register-domain-with-cloudflare/)。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-r2-bind-domain.png)



然后点击 `继续`，再点击 `连接域` 就会回到设置页面，这时你会看到你设置的域状态为 `正在初始化`，过几分钟再次刷新状态就变成了 `活动`。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-r2-bind-done.png)



接下来还需要将刚才的域名写入修改仓库根目录下的 `wrangler.toml` 文件中。





```toml
[vars]
R2_PUBLIC_URL = "https://twikoo.r2.example.org" # 这里替换成你设置的域名
```

### Worker部署

在 `Cloudflare` 的左侧栏点击 `Workers 和 Pages`，点击 `创建`，再点击 `创建 Worker`，输入名称 `cf-create-worker`。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-create-worker.png)



然后点击 `部署`，过一会显示部署成功，再点击 `继续处理项目`，选择 `设置` 页签，滚动到构建区域，点击 `连接` 按钮。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-worker-connect.png)



此时右侧会弹出一个面板，先连接你的 `Github` 账号，然后选择你的仓库，如果列表中找不到可以直接输入仓库名，比如 `twikoo-cloudflare`，再选择 `main` 分支。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-worker-deploy.png)



然后在 `部署命令` 的输入框中填入 `npx wrangler deploy --minify`，最后点击 `连接` 按钮保存。

如果在前一步的列表中仓库名是手动输入的，你需要在这里点击 `管理` 按钮，跳转到 `Github` 登录账号。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-connect-github.png)



完成登录后进入 `Repository access` 页面，点击 `Select repositories` 按钮，选择你的仓库后点击 `Save` 按钮。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/github-select-repo.png)



此时页面会跳转回 `Cloudflare`，有可能会报一个错误，不用管它，直接关闭页面就可以了。

现在把前面修改的 `wrangler.toml` 文件保存并提交到 `Github` 仓库，此时就会触发 `Worker` 的自动构建了，过一会你就会在 `Workers 和 Pages` 页面看到部署已经更新，点击 `访问` 按钮，一切正常的话，你会看到这样的内容。





```json
{
    "code": 100,
    "message": "Twikoo 云函数运行正常，请参考 https://twikoo.js.org/frontend.html 完成前端的配置",
    "version": "1.6.40"
}
```

### 绑定域名

再次点击 `twikoo-cloudflare` 进入 `设置` 页签，在 `域和路由` 中点击 `添加`，右侧弹出 `域和路由` 面板。点击 `自定义域`，输入你想要绑定的域名，比如 `twikoo.example.org`，点击 `添加域` 按钮。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-worker-bind-domain.png)



添加完成后你的域名就和部署的 `Worker` 绑定好了。

## 配置博客

### 修改主题配置

回到上一篇创建的个人博客仓库，在 `themes/hexo-theme-matery` 目录下打开 `_config.yml` 文件进行编辑，搜索关键字 `twikoo` 将 `enabled` 改为 `true`，再将 `envId` 改成前面部署绑定的域名。





```yaml
twikoo:
  enable: true
  envId: https://twikoo.example.org # 这里改成前面部署绑定的域名
  # region: ap-guangzhou # 环境地域，默认为 ap-shanghai
  # path: 'window.location.pathname' # 自定义文章路径
```

修改完提交到 `Github` 后 `Cloudflare Pages` 会自动部署，等部署完打开你的个人博客，在你的博文最下面就可以看到评论区了。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/hexo-show-comments.png)



### 配置评论模块

点击评论区的小齿轮图标，首次进入需要设置密码，设置完就会进入管理面板，点击 `配置管理` 页签进行初始配置。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/twikoo-config-panel.png)



点开 `隐私`，在 `IMAGE_CDN` 处输入 `cloudflare`，点击 `保存` 按钮启用图片上传功能。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/twikoo-set-image-cdn.png)



其余每个配置项都有很详细的说明，大家可以自行慢慢摸索，不修改也已经可以正常使用了。

### 防止机器人

发表评论时可以使用 `Cloudflare Turnstile` 的检查来阻止机器人，如果需要启用先在 `Cloudflare` 的左侧栏点击 `Turnstile`，点击 `添加小组件` 按钮。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-create-turnstile.png)



小组件名称可以随便填写，比如 `twikoo`，点击下面的 `添加主机名` 按钮会在右侧弹出面板。在最上面的输入框填入个人博客的域名，比如 `blog.example.org`，点击右侧的 `添加` 按钮，主机名就会出现在下面的已选择主机名列表中。再点击最下面的 `添加` 按钮，右侧面板关闭，主机名会添加到 `主机名管理` 区域的列表中。最后点击右下角的 `创建` 按钮，就会显示已成功创建 `Turnstile` 小组件。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/cf-create-turnstile-ok.png)



在这个页面上 `站点密钥` 和 `密钥` 是你需要复制下来配置到 `Twikoo` 的管理面板中的。接下来再次打开管理面板，点开 `反垃圾`，在 `TURNSTILE_SITE_KEY` 处填入 `站点密钥` 的内容，在 `TURNSTILE_SECRET_KEY` 处填入 `密钥` 的内容，点击 `保存` 关闭面板。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/twikoo-config-turnstile.png)



完成后再次发表评论就会出现 `Cloudflare` 的机器人检查框了，大部分情况下等一会就会显示成功，或者出现一个勾选框确认后检查成功，只有极少数情况会发起 `JS质询` 进行挑战。



![img](https://blog.mingy.org/2024/12/hexo-add-twikoo/twikoo-post-comments.png)



## 后记

至此，一个基本上完整的评论系统就上线了，对于 `Twikoo` 的其他配置，还有一些建议：

- 使用隐藏入口不要暴露管理面板的配置按钮；
- 设置一个复杂的密码不要让别人轻易猜出来；
- 添加评论通知，[pushoo.js](https://pushoo.js.org/) 提供了丰富的通知方式，可以自行看文档选择最适合的方式。

来源: 一梦一孤舟
文章作者: Mingy
文章链接: https://blog.mingy.org/2024/12/hexo-add-twikoo/
本文章著作权归作者所有，任何形式的转载都请注明出处。

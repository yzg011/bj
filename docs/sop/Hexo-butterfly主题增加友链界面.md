---
title: Hexo-butterfly主题增加友链界面
tags: 技术
---




## Hexo-butterfly主题增加友链界面
在从 Stellar 切换到 Butterfly 主题的过程中，友链界面的配置往往是容易卡壳的一环。经过实测和填坑，我整理了这套标准的部署流程，希望能帮你快速搭建出理想的友链展示区。

一、 初始化页面文件
首先，你需要在博客根目录下手动创建对应的页面文件夹。

在 source/link 路径下新建一个 index.md 文件。打开该文件，将 Front-matter 区域配置如下：
``` 
---
title: 友链展示
date: 2025-11-16
type: "link"
---
```

设置 type: "link" 是关键，这会告诉主题调用专门的友链模板来渲染该页面。

二、 构建友链数据池
Butterfly 采用数据驱动的方式管理友链。你需要在博客根目录的 _data 文件夹下新建 link.yml 文件。

按照以下格式填入你的友链信息：
``` 
- class_name: 友情链接
  class_desc: 这里的每个站点，都耐人寻味……
  flink_style: flexcard
  link_list:
    - name: Saimen
      link: https://com.z2m.store
      avatar: https://img.z2m.store/file/public/1778862620159_g.png
      descr: "读史可以明智,知古方能鉴今。"
```

name： 网站名称。 link： 网站跳转链接。 avatar： 站长头像地址。 descr： 网站的一句话介绍。

后续每增加一个朋友，只需在 link_list 下按格式新增这四项信息即可。

三、 挂载到导航菜单
页面和数据准备好后，需要让它在导航栏显示出来。

打开主题配置文件 _config.butterfly.yml，在 menu 栏目下新增一行入口：

友链展示: /link/ || fas fa-link
四、 编译与发布
最后，执行 Hexo 标准的“三连”命令来清理缓存并部署上线：


小结
折腾个人博客的乐趣就在于这种从零到一的 DIY 过程。现在刷新一下你的站点，应该就能看到那个整齐划一、极客范儿十足的友链展示区了。
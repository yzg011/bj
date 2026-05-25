---
title: 多个地方编辑需要拉取合并
date: 2026-05-25
tags:
  - 技术
---
```
# 先换SSH地址规避HTTPS网络问题 
git remote set-url origin git@github.com:yzg011/huawei.git 
# 拉取合并 
git pull origin main --rebase 
# 推送 
git push origin main
```
正常只需要后面两步就可以，有错误 我们就进行第一步
记得修改库名哦

1. 放弃当前变基，回到原有状态

bash

运行

```
git rebase --abort
```

2. 拉取远端代码合并

bash

运行

```
git pull origin main
```

3. 解决文件冲突后，标记并推送

bash

运行

```
git add .
git commit -m "merge remote code"
git push origin main
```
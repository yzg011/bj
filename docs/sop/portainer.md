---
title: 树莓派更新portainer
date: 2026-06-25
tags:
  - 技术
---
# 树莓派更新portainer

1. 停止容器

docker stop portainer


2. 删除现有容器

docker rm portainer

3. 拉取镜像

```
docker run -d \
  --name portainer \
  --restart always \
  -p 9000:9000 \
  -p 9443:9443 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
  
```
![image.png](https://img.z2m.store/file/1782381646038_image.png)
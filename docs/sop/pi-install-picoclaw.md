---
title: pi install picoclaw
date: 2026-07-28
tags:
  - 技术
---
### 树莓派安装picoclaw

直接安装编译好的 找到你对应的系统 下载对应的安装包 
wget https://github.com/sipeed/picoclaw/releases/latest/download/picoclaw_Linux_arm64.tar.gz  

tar -xzf picoclaw_Linux_arm64.tar.gz

启动

直接  ./picoclaw-launcher   这样就可以启动   但是 只能在本地访问

为了能在局域网其他设备上访问  我们 需要输入

```
./picoclaw-launcher -public
```

这样其他设备就能通过ip地址：18800访问

也可以通过一个命令直接常驻后台启动
```
nohup ./picoclaw-launcher -public > webui.log 2>&1 &
```
``
还可以设置开机自启


如果你想树莓派开机自动后台启动 Web 面板，新建 systemd 服务：

1. 创建服务文件

```
sudo nano /etc/systemd/system/picoclaw-web.service
```

2. 写入内容ini

```
[Unit]
Description=Picoclaw Web UI
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi
ExecStart=/home/pi/picoclaw-launcher -public
Restart=always

[Install]
WantedBy=multi-user.target
```

3. 启用开机自启并启动服务

```
sudo systemctl daemon-reload
sudo systemctl enable picoclaw-web
sudo systemctl start picoclaw-web
```

4. 查看服务状态


```
sudo systemctl status picoclaw-web
```
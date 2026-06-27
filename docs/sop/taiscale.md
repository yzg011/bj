---
title: taiscale公网暴露
date: 2026-06-27
tags:
  - 技术
---
## 一、最简一键开启（最常用，转发本地 Web 端口）

### 示例 1：把本地 8099 端口（WechatOnCloud）暴露公网



运行

```
sudo tailscale funnel 6277
```

执行后弹出浏览器授权，确认后输出公网 HTTPS 地址：

`https://树莓派设备名.你的网段.ts.net`

### 示例 2：静默无交互后台运行（--yes 跳过确认）


运行

```
tailscale funnel --bg 3000
```

`--bg` 后台常驻，重启 tailscale 后配置保留
![image.png](https://img.z2m.store/file/1782531355640_image.png)
### 2. 一键关闭全部 Funnel 公网暴露


运行


```
tailscale funnel off
---

## 七、系统服务管理（树莓派 systemd）


# 查看运行状态
systemctl status tailscaled

# 开机自启（默认已开启）
sudo systemctl enable tailscaled

# 停止服务
sudo systemctl stop tailscaled

# 启动服务
sudo systemctl start tailscaled

# 后台重启服务 
sudo systemctl restart tailscaled

# 查看当前节点状态、在线设备、IP、登录账号 
tailscale status

```
![image.png](https://img.z2m.store/file/1782531866994_image.png)!
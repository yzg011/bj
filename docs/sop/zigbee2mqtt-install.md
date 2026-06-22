---
title: zigbee2mqtt install
date: 2026-06-22
tags:
  - 技术
---
树莓派已装好 Docker + Docker Compose
```
version: '3.8'

services:
  zigbee2mqtt:
    image: koenkk/zigbee2mqtt:latest
    container_name: zigbee2mqtt
    restart: unless-stopped
    privileged: true
    volumes:
      - ./data:/app/data
    devices:
      # 替换成你的串口设备
      - /dev/ttyUSB0:/dev/ttyUSB0
    environment:
      - TZ=Asia/Shanghai
    # MQTT 配置，根据你的mqtt地址修改
      - ZIGBEE2MQTT_CONFIG_MQTT_SERVER=mqtt://mosquitto:1883
      # 若MQTT有账号密码开启下面两行
      - ZIGBEE2MQTT_CONFIG_MQTT_USER=mqtt
      - ZIGBEE2MQTT_CONFIG_MQTT_PASSWORD=mqtt
      - ZIGBEE2MQTT_CONFIG_FRONTEND_ENABLE=true
      - ZIGBEE2MQTT_CONFIG_FRONTEND_PORT=8080
    ports:
      - "8080:8080"
    networks:
      - mqtt_net

  # 内置mosquitto mqtt（不想单独装mqtt就保留，已有mqtt可删除本段）
  mosquitto:
    image: eclipse-mosquitto:2
    container_name: mosquitto
    restart: unless-stopped
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log
    ports:
      - "1883:1883"
      - "9001:9001"
    networks:
      - mqtt_net

networks:
  mqtt_net:
```
安装好后 mqtt会报下面错误

1782089517: Error: Unable to open config file '/mosquitto/config/mosquitto.conf'. 1782089517: mosquitto version 2.1.2 terminating

# 报错原因

mosquitto 容器启动时找不到 `/mosquitto/config/mosquitto.conf` 文件，要么文件夹没创建、要么文件没生成、要么权限不足。

 首先查看mqtt挂载的位置

```
# 查看mosquitto挂载 
docker inspect mosquitto | grep -A10 Mounts 
# 查看zigbee2mqtt挂载 
docker inspect zigbee2mqtt | grep -A10 Mounts
```
会输出挂载的位置
pi@pi:~ $ docker inspect mosquitto | grep -A10 Mounts "Mounts": [ { "Type": "bind", "Source": "/data/compose/17/mosquitto/config", "Destination": "/mosquitto/config", "Mode": "rw", "RW": true, "Propagation": "rprivate" }, { "Type": "bind",

## 先看懂挂载路径

宿主机真实目录：`/data/compose/17/mosquitto/config`

容器内读取路径：`/mosquitto/config`

报错是这个宿主机目录里**缺少 mosquitto.conf**，直接进去补文件：
```
# 进入对应目录
cd /data/compose/17/mosquitto/config

# 生成mqtt配置文件
sudo tee mosquitto.conf <<EOF
allow_anonymous true
listener 1883
listener 9001
protocol websockets
EOF

# 赋权限
sudo chmod 644 mosquitto.conf

```

重启 mosquitto 容器

docker restart mosquitto
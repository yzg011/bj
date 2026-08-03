---
title: memos bot   memos机器人安装
date: 2026-08-03
tags:
  - 技术
---
## Prerequisites


- Memos service
- Telegram Bot

## Installation

Download the binary files for your operating system from the [Releases](https://github.com/usememos/telegram-integration/releases) page.
## Usage

### Starting the Service

#### Starting with binary

1. Download and extract the released binary file;
    
2. Create a `.env` file in the same directory as the binary file;
    
3. Run the executable in the terminal:
    
    ```shell
    ./memogram
    ```
    
1. Once the bot is running, you can interact with it via your Telegram bot.


主要是环境配置

```
SERVER_ADDR=dns:localhost:5230
BOT_TOKEN=your_telegram_bot_token
BOT_PROXY_ADDR=https://api.your_proxy_addr.com
ALLOWED_USERNAMES=user1,user2,user3
```

### Configuration Options
- `SERVER_ADDR`: The gRPC server address where Memos is running
- `BOT_TOKEN`: Your Telegram bot token
- `BOT_PROXY_ADDR`: Optional proxy address for Telegram API (leave empty if not needed)
- `ALLOWED_USERNAMES`: Optional comma-separated list of allowed usernames (without @ symbol)




SERVER_ADDR=你的服务器地址，本地的直接写本地的
BOT_TOKEN=your_telegram_bot_token
BOT_PROXY_ADDR=https://api.your_proxy_addr.com，这个代理地址在国内一定要写，否则访问不了TG的接口
ALLOWED_USERNAMES=user1,user2,user3 这里写的是tg的用户名 在我的资料中可以设置用户名

代理我走的是cf work

export default {
  async fetch(request) {
    const reqUrl = new URL(request.url);
    // 只放行 /bot 开头的API请求，其他路径直接返回404，避免跳转
    if (!reqUrl.pathname.startsWith("/bot")) {
      return new Response("Proxy only work for /botxxxx", { status: 403 });
    }
    const targetUrl = new URL(`https://api.telegram.org${reqUrl.pathname}${reqUrl.search}${reqUrl.hash}`);
    const newReq = new Request(targetUrl, request);
    try {
      return await fetch(newReq);
    } catch (err) {
      return new Response(JSON.stringify({
        ok: false,
        error_code: 502,
        description: "Proxy upstream failed"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 502
      });
    }
  }
};

部署后 上方填入 cf work 域名

1. Allow all users (leave empty or remove the variable):
    
    ```dotenv
    ALLOWED_USERNAMES=
    ```

这里如果留空就是允许所有用户  名外tg 用户名不用加@

如果用户不在这个允许的名单中  就会提示 - Users not in the allowed list will receive an error message: "you are not authorized to use this bot"



### Interaction Commands

- `/start <access_token>`: Start the bot with your Memos access token.
- token这里写的就是memos token，在memos中建立
- Send text messages: Save the message content as a memo.
- Send files (photos, documents): Save the files as resources in a memo.
- `/search <words>`: Search for the memos.


另外服务器需要一直启动  我这边是使用的树莓派设置开机启动

首先下载相应的程序

再次建一个文件夹

把程序发送到这个文件夹


./memogram    这个命令就能直接运行

但我们想要的是一直在后台运行

sudo nano /etc/systemd/system/memogram.service


1. 新建服务文件


```
sudo nano /etc/systemd/system/memogram.service
```


```
[Unit]
Description=Memogram Telegram Bot
After=network.target

[Service]
# 改成你memogram所在文件夹
WorkingDirectory=/home/pi/memosbot
# 用户，树莓派用pi，云主机一般用root
User=pi
# 启动命令，加载.env并运行程序
ExecStart=/bin/bash -c "source .env && ./memogram"
# 崩溃自动重启
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

2. 生效、启动、设置开机自启



```
# 重载systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start memogram

# 设置开机启动
sudo systemctl enable memogram

# 查看实时日志
journalctl -u memogram -f

# 停止/重启
sudo systemctl stop memogram
sudo systemctl restart memogram
```


这样就能一直在后台为你运行了

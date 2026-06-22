---
title: 【自用】云服务器 使用 docker 搭建 HomeAssistant + MQTT 物联网平台
date: 2026-06-22
tags:
  - 技术
---
原文链接：[【自用】云服务器 使用 docker 搭建 HomeAssistant + MQTT 物联网平台_服务器开放8123端口-CSDN博客](https://blog.csdn.net/qq_43768851/article/details/132233085)

总览
1.搭建流程概述
2.准备工作
3.开始搭建！
4.总结
如果想看 ESP32 或其他使用 MicroPython 编程的单片机如何连接到该云服务器，实现 HomeAssistant 控制 单片机的内容，请看我这篇博客的下一篇。

一、搭建流程概述
0.总体流程
我们需要先有一台云服务器，然后在上面搭建 docker（用宝塔傻瓜式搭建就行了，一会儿我会写怎么搭建），再用 docker 创建 2个 容器，它们分别装着 HomeAssistant 和 MQTT，这相当于我们在 1个 云服务器 上 运行了 2个 “服务（服务器）”。MQTT 网络信协议的具体内容如下，可以把它想象成一个 用于连接 ESP32物联网终端 和 HomeAssistant 平台 的 中转站：






二、准备工作
0.购买云服务器
0.1 买一台云服务器（什么阿某云、腾某云、华某云随便，轻量型服务器应该就够用了，看自己。不会买的自己搜去）

1.个人PC上暂时需要下载的软件或服务
1.1 Xshell （用于访问云服务器，没有安装的话自己去搜安装xshell的安装和使用教程，想要控制云服务器没有xshell…除非你用其他的终端访问软件）

2.云服务器上暂时需要下载的软件和服务
2.1 宝塔（用于更简便地使用docker和其他操作）


三、搭建工作开始
1.使用宝塔，访问你的云服务器，并傻瓜式安装 docker
点击左侧栏的 docker，你的页面上应该有一个“安装”。点击后，就进行安装，时间可能会较长，请耐心等待直到安装完成。



2.docker 安装完成后，直接拉取 HomeAssistant 镜像
2.1 拉取 HomeAssistant
docker -> 镜像 -> 从仓库中拉取 -> 填入内容：homeassistant/home-assistant:latest -> 确认


2.2 安装 HomeAssistant 步骤：



3.创建 docker 容器
3.1 创建容器文件夹
文件 -> 进入到 根目录下的 home/你的用户名/ 路径下，新建一个文件夹“homeassistant-config”，如图所示。
3.2 打开终端，开始创建容器



3.3 输入创建容器命令，并回车：

sudo docker run -d --name="homeassistant-v1" -v xxx:/config -p 8123:8123 homeassistant/home-assistant:latest
运行项目并下载源码
bash
1
请注意！上面的命令中“xxx”是创建容器的路径，应替换为你自己的路径！！！如我的命令改为了：

sudo docker run -d --name="homeassistant-v1" -v /home/admin/homeassistant-config:/config -p 8123:8123 homeassistant/home-assistant:latest
运行项目并下载源码
bash
1
3.4 创建容器成功

运行命令没有报错，去看看你刚才创建的空文件夹，现在如果已经有东西了则创建成功。如下面这样：



4.开放 云服务器 防火墙 8123 端口
4.1 开放端口
我也懒得写了，你直接在宝塔的终端里或者其他什么软件xshell之类的，只要能进到云服务器终端里就行，依次运行如下命令：

firewall-cmd --add-port=8123/tcp --permanent
运行项目并下载源码
bash
1
firewall-cmd --reload
运行项目并下载源码
bash
1
4.2 查看端口是否开放，你能看到 8123/tcp 代表开放成功

firewall-cmd --list-ports
运行项目并下载源码
bash
1
4.3 在云平台上开放端口

这个根据你使用的是什么云，自已找找，你的服务器的防火墙选项，添加端口即可（我演示的是阿里云）：



5.配置 HomeAssistant
5.1 访问 HomeAssistant

使用你的ip :8123的方式来访问 HomeAssistant 网页。如你的云服务器外网ip如果是182.96.213.203，那么你就在浏览器里访问如下网址：（我只是举个例子，你别填182.96.213.203，填你自己的服务器外网IP！）

182.96.213.203:8123



6.安装 MQTT 服务器
6.1 访问 EMQX 官网下载区
https://www.emqx.io/zh/downloads
6.2 运行命令 将 EMQX 放入 docker 中
分别在服务器终端上执行下面图中的“获取Docker镜像”和“启动Docker容器”的两段代码。

代码片1：

docker pull emqx/emqx:5.1.4
运行项目并下载源码
bash
1
代码片2：

docker run -d --name emqx -p 1883:1883 -p 8083:8083 -p 8084:8084 -p 8883:8883 -p 18083:18083 emqx/emqx:5.1.4
运行项目并下载源码
bash
1


6.3 EMQX 下载完成后，查看是否 EMQX 已经在 docker 中：

使用命令：

sudo docker ps
运行项目并下载源码
bash
1


6.4 开放防火墙上的 18083 和 1883 端口

6.4.1 依次运行命令，开放端口并重启防火墙使其生效：

firewall-cmd --add-port=18083/tcp --permanent

firewall-cmd --add-port=1883/tcp --permanent

firewall-cmd --reload
运行项目并下载源码
bash
1
2
3
4
5
6.4.2 运行如下命令，看是否我们已经开放了 18083 和 1883 端口：

firewall-cmd --list-ports
运行项目并下载源码
bash
1


6.4.3 在服务器控制台上开放 18083 和 1883 端口：



6.5 访问 EMQX 网站
6.5.1 URL ：
http://xxx.xxx.xxx.xxx:18083
xxx.xxx.xxx.xxx 代表你云服务器的公网IP地址



6.5.2 登录

默认的用户名是：admin
默认的密码是：public

6.6 回到 HomeAssistant 网站

6.6.1 操作流程：
i：配置（左边栏） ->
ii：设备与服务 ->
iii：添加集成（右下角）->
iv：搜索“MQTT” ->
v：点击“MQTT” ->
vi：点击“MQTT” ->
vii：输入相关信息（请注意，用户名和密码是你刚才登录 EMQX 的用户名和密码）
viii：提交,成功。我们的 HomeAssistant 已经成功连接了 MQTT 服务



6.7 回到 EMQX 网站

6.7.1 操作流程：

监控 -> 客户端 -> 发现一个新连接，好耶



6.7.2 确认 MQTT 和 HomeAssistant 已经连接成功：
1.去 HomeAssistant 网站
2.进入刚才的 MQTT
3.点击“选项”
4.打开监听后，发送数据包测试，成功。





四、总结
至此，在云服务器上使用 docker 搭建 HomeAssistant 平台并 让 MQTT 与 HomeAssistant 平台建立通讯的任务圆满结束。如果想看 ESP32 或其他使用 MicroPython 编程的单片机如何连接的内容，请看我这篇博客的下一篇。

---
title: 两块ESP32屏了解会议室状态
date: 2026-05-22
tags:
  - DIY
---
# "这会议室有人吗？" - 两块ESP32屏了解会议室状态

原创 Grovety 硬禾学堂

在很多小型办公室里，确认一间会议室"现在有没有人"，方式还停留在最原始的状态——隔着玻璃往里看、上去拧一下门把手、直接推门打断别人开会，或者挨个问同事。作者 Grovety 一针见血地指出这个日常痛点：

> "This creates confusion, wastes time, and leaves a poor impression on visitors."（这制造混乱、浪费时间，还给访客留下糟糕印象）

而商业的会议室预订系统，往往要接入日历服务器、要订阅付费、要 IT 部门配合部署，对小团队来说太重了。Grovety 给出的方案截然相反：**两块 ESP32 触摸屏、一个本地 Wi-Fi、零服务器，单间会议室总成本 48 美元**。项目的核心宣传语很精炼：

> "Clear room status, quick booking, and guest info—without servers or complexity."（清晰的房间状态、快速预订、访客信息——无需服务器，也不复杂）



值得一提的是，这个项目的作者正是前两天发的那篇广受欢迎的「[ESP32-P4 魔法故事书](https://mp.weixin.qq.com/s?__biz=MzIzMTcxMjU4Mg==&mid=2247522327&idx=1&sn=28e642f7bb96e610ea76f0c43cdfba79&scene=21#wechat_redirect)」的同一团队 Grovety——他们的项目一贯完整、可直接落地。下面顺着原文脉络拆解。

##   

**项目简介**


这套系统同时服务三类人：

- **会议室外的人**走近就能一眼看到房间空闲还是占用，不用再扒玻璃；
    
- **会议室内的人**桌边或墙上有一块屏，直接预订、看剩余时间；
    
- **来访的客人**还能顺带获取访客 Wi-Fi、公司网站、办公室地图（厕所/饮水机位置）和天气。还提供双语界面（英语/中文）
    

作者对方案的定位说得很朴实：

> "This project was created as a simple and affordable way to solve that problem."（这个项目就是为了用简单且廉价的方式解决这个问题）

##   

**用到的硬件**


|角色|型号|摆放位置|成本|
|---|---|---|---|
|副面板|Elecrow CrowPanel Advance **3.5" HMI ESP32**（320×240 IPS）|会议室**门外**|**$21**|
|主面板|Elecrow CrowPanel Advance **5" 或 7" HMI ESP32-S3**|会议室**室内**（墙上或桌上）|**$27**|
|||**单间会议室合计**|**$48**|

作者为什么选 Elecrow 面板？原文写得很明确——价格、开发难度、可获取性三者平衡得好；而且：

> "the display, touch interface, and controller are already integrated into one compact device, which simplifies prototyping and reduces development time."（屏、触摸、控制器三合一集成，简化原型、缩短开发时间）

**CrowPanel 系列国内淘宝可直接购买**，单间总价约 ¥350。开发框架支持 Arduino IDE / LVGL / MicroPython。

  

**主体：无服务器的双屏协同**

这是整个项目最值得学习的设计——两块屏放在不同位置，却能像一个系统一样保持状态完全一致：

> "Although the panels are placed in different locations, they work as one synchronized system. Any change made on one panel is immediately reflected on the other, so both displays always show the same current room status."（虽分处不同位置，却作为一个同步系统工作；任一面板的改动立即反映到另一块上，两屏始终显示相同的当前房间状态）

具体分工是：

- **主面板（室内，5"/7"）担任协调者**——广播 discovery/beacon 发现包，通过 UDP 发布 room-status 状态包，接收并保存副面板的配对请求；
    
- **副面板（室外，3.5"）担任显示端**——连接到同一本地 Wi-Fi，发现可用的主面板，配对后接收并本地显示状态更新。
    

  

整套通信完全基于**本地 Wi-Fi 的 UDP 广播/单播**，没有任何云或服务器参与：

> "No server infrastructure required. Fast setup and instant usability."（无需任何服务器基础设施，快速部署，即装即用）

功能上，它提供颜色编码的房间状态（空闲/占用）加当前会议剩余时间、面板上直接快速预订、访客 Wi-Fi 凭证、办公室地图、公司网站链接，还有**中英文双语界面**切换和室外天气（天气需 OpenWeather 免费 API Key）。


##   

**实现过程**

整个流程**纯固件烧录加屏上/网页配置，无需写代码**：

**主面板（5"/7"）**：

- 下载 `meeting_room_leader` 仓库里的 `Firmware.zip` 并解压，把面板接到 PC，运行解压出的 `flash_tool.exe`，完成后应用自动启动；
    
- 然后在面板右上角齿轮里配 Wi-Fi（选网络、屏幕键盘输密码）；
    
- 最后进 Settings > Device Setup，用手机扫二维码打开配置页，填写房间名、OpenWeather API Key、公司网站、办公室地图。
    


  

**副面板（3.5"）**：

- 下载 `meeting_room_support` 仓库里的 `Firmware_support.zip`，同样用 `flash_tool.exe` 烧录；
    
- 手机连面板广播的热点、扫码进网页，在网页里连到与主面板**相同的 Wi-Fi**并保存；
    
- 最后在 Settings 里点 "Link"，从检测到的主面板列表中选择，完成配对。
    

两个 GitHub 仓库分别是：

- 主面板 `github.com/Grovety/meeting_room_leader`
    
- 副面板 `github.com/Grovety/meeting_room_support`
    

仓库内还附有桌面配置工具的安装说明文档。

  

**扩展与适配**

作者明确强调这不仅是一个成品方案，更是二次开发的起点：

> "We hope this project can be useful not only as a ready-to-use meeting room solution, but also as a starting point for your own ideas."

官方列出的扩展方向相当丰富：UI 布局/主题/品牌化定制与多语言本地化、新增语音命令与自定义别名、加日历屏和调度工具、接外部设备（如 MiBoxer 照明控制）、对接 Microsoft Outlook 日历同步、OTA 空中升级与设备管理。应用场景也可延伸到**教室状态显示**等。

##   

**总结**

这个项目的价值有两层：对**普通团队**，它是 48 美元就能落地、自带中文、即装即用的会议室管理方案；对**工程师**，它演示了一套教科书级的**无服务器多设备协同架构**——UDP 发现、配对、状态广播同步，这套思路可以直接搬到任何"多块屏/多个节点要保持状态一致"的 IoT 场景。

  

不用再隔着玻璃张望，也不用打断别人开会——有时候解决问题，只需要门口的一块屏。

> 免责声明：本篇所发布的内容主要经 AI 整理、翻译国外技术网站与开源社区，版权归原作者所有，图片摘自原文，本文仅用于学习交流。如涉及侵权，请联系我们删除或更正。
> 
>   
> 
> 项目原文（或点击“阅读原文”）：
> 
> https://www.hackster.io/Grovety/knock-less-meet-more-smart-room-panels-esp32-29077d

  

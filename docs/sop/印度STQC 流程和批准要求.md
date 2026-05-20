---
title: 印度STQC 流程和批准要求
tags: 技术
---


# STQC process and approval requirements
List of documents and explanations required-
1.Datasheet of the SoC.
2.Design and architecture documents till the PCBA and SoC level.
3.Documentation related to ports/interfaces and protection mechanism for the same.
4.Process flow of the Manufacturing/Provisioning.
5.All keys and certificates being used in the device ecosystem.
6.Key management life cycle.
7.User manual/ Technical specifications of the device.
8.Code snippets of the TEE API call, wherever applicable.
9.List of all the sensitive data with their intended usage and secure storage mechanism.
10.Measures available in the device to prevent software tampering.
11.Measures available in the device to prevent hardware tampering.
12.Documentation regarding the Intellectual Property protection technologies provided by the chip manufacturer which have been enabled. 
13.In case, no Intellectual Property protection technologies are being provided by the chip manufacturer, then a declaration stating the same.
14.Technical specifications of the device regarding random generators, in case, software based random number generators are being used, vendors shall provide the libraries being used for the same.
15.Declaration of the memory protection controls available and enabled in the device.
16.Document mentioning the use-cases when the device establishes server connections with the external world, with detailed information about the security measures in place while validating the digital signatures of the server connections.
17.Firmware binaries for code review.
18.Internal code review reports.
19.software bill of materials, including third party components and versions.
20.documentation regarding the security controls in place to hinder firmware reverse engineering.
21.Process of achieving secure firmware upgrade which should consist of keys involved and their management life cycle, signature validation process and any other secure mechanisms if implemented.
22.Modes of updates available i.e. automatic, manual or both.
23.Organizational process and policies regarding the issuing of updates to the devices.
24.Process of mutual authentication as implemented in the device when wireless communications are initiated.
25.Bill of materials for critical hardware components (related to security functions like SoC).
26.Supply chain risk identification, assessment, prioritization, and mitigation documents.
27.Document for Network protocols used in the device.
28.Supply chain risk/business continuity planning policy documents, playbooks reflecting how to handle supply chain disruption, post-incident summary documents need to be submitted and demonstrate the same.

# STQC 流程和批准要求
所需文件及说明清单-
1.SoC 的数据表。
2.直至 PCBA 和 SoC 级别的设计和架构文档。
3.与端口/接口及其保护机制相关的文档。
4.制造/供应的流程。
5.设备生态系统中使用的所有密钥和证书。
6.密钥管理生命周期。
7.设备的用户手册/技术规格。
8.TEE API 调用的代码片段（如果适用）。
9.列出所有敏感数据及其预期用途和安全存储机制。
10.设备中可用的措施可防止软件被篡改。
11.设备中可用的措施可防止硬件篡改。
12.芯片制造商提供的已启用的知识产权保护技术文档。
13.如果芯片制造商未提供任何知识产权保护技术，则需要提供一份声明来说明。
14.设备有关随机数生成器的技术规格，如果使用基于软件的随机数生成器，则供应商应提供用于该生成器的库。
15.声明设备中可用且启用的内存保护控制。
16.该文档提及了设备与外部世界建立服务器连接时的用例，并提供了有关验证服务器连接的数字签名时所采取的安全措施的详细信息。
17.用于代码审查的固件二进制文件。
18.内部代码审查报告。
19.软件物料清单，包括第三方组件和版本。
20.有关阻止固件逆向工程的安全控制的文档。
21.实现安全固件升级的过程应包括所涉及的密钥及其管理生命周期、签名验证过程以及任何其他安全机制（如果实施）。
22.可用的更新模式包括自动、手动或两者。
23.有关发布设备更新的组织流程和政策。
24.启动无线通信时在设备中实施的相互认证过程。
25.关键硬件组件的物料清单（与 SoC 等安全功能相关）。
26.供应链风险识别、评估、优先排序和缓解文件。
27.设备中使用的网络协议的文档。
28.需要提交并证明供应链风险/业务连续性计划政策文件、反映如何处理供应链中断的剧本、事件后摘要文件。
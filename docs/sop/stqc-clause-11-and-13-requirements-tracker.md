---
title: STQC Clause 1.1 and 1.3 Requirements Tracker
date: 2026-06-02
tags:
  - 安防
---
# STQC-clause-11-and-13-requirements-tracker

| Clause | STQC Query / Requirement             | What STQC Will Check                         | Inputs Needed from OEM/Vendor | Artifacts / Evidence Required      |
| ------ | ------------------------------------ | -------------------------------------------- | ----------------------------- | ---------------------------------- |
| 1.1    | Identify all external interfaces     | UART, USB, Ethernet, SPI, I2C, SD, JTAG, SWD | Interface inventory           | Interface matrix                   |
| 1.1    | UART disablement                     | Software and runtime controls                | SDK/configuration details     | Screenshots, code references, demo |
| 1.1    | JTAG/SWD status                      | Presence and accessibility                   | PCB and SoC details           | Hardware declarations              |
| 1.1    | USB/SD access control                | Extraction and debug paths                   | Hardware restrictions         | Interface control document         |
| 1.1    | Ethernet/service exposure            | Management access paths                      | Network inventory             | Network architecture document      |
| 1.3    | Debug access protection              | JTAG/SWD/UART access                         | Hardware architecture         | Debug interface matrix             |
| 1.3    | No production debug access           | Runtime validation                           | Production firmware config    | Debug access policy                |
| 1.3    | UART restricted in production        | Physical testing                             | UART settings                 | UART disablement evidence          |
| 1.3    | Secure boot protection               | Firmware modification prevention             | Secure boot implementation    | Secure boot flow diagram           |
| 1.3    | Authorized access only               | Access control enforcement                   | Service procedures            | Access control SOP                 |
| 1.3    | Documentation matches implementation | Live review and demo                         | Demo setup                    | Demo report and screenshots        |
---
title: stqc question
date: 2026-09-10
tags:
  - 技术
---
• Please provide accurate details of cryptographic keys/certificates and how they are utilized.

• Please provide the detailed OTP memory structure, including the different segments and the purpose of each segment.

• Clearly specify which keys are stored in which OTP segment, including their purpose and protection mechanism.

• Provide details of where the OTA signing/verification key and associated certificate are stored in the camera and how they are protected.

• Provide a complete list of all certificates present in the camera, including their purpose, location, validity, and usage.

• Provide the key generation process inside the camera, including the mechanism/API used for generating cryptographic keys.

• Provide a detailed flowchart for configuration key generation.

• Please provide details of the entropy/TRNG/CSPRNG mechanism, APIs used, entropy usage in which segment, and the related entropy generation/consumption flowchart.

• Please provide the Secure Boot logs.

• Please explain why only a limited number of kernel module (.ko) files are present in the firmware.

• Please provide clarification on the SafeStack status detected by the Checksec tool.

• The current configuration was detected as ASLR Level 1. Please review and configure it to Level 2, where applicable.

• Please provide the list of unused/banned C functions applicable to the firmware.

• Please provide a detailed flowchart covering the complete firmware upgrade security process and anti-rollback mechanism for STQC Points 2.10 & 2.11.
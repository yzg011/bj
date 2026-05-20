---
title: 印度STQC认证所需文件
published: 2026-05-04
description: ''
image: ''
tags: 技术
category: ''
draft: false 
lang: ''
---


# Documents / Requirements Listed in the Guidelines:


Hardware-Level Documentation
###  1.SoC Datasheet
oDetails on debugging interfaces (USB, UART, JTAG, SWD).
oTEE/TPM/SE availability.
oRNG capability (hardware-based).
###  2.Device Technical Specifications
oIncludes secure boot architecture, communication protocols, and memory protection.
### 3.Block Connection Diagrams
oShowing microcontroller and peripheral interactions.
### 4.Access Control Mechanism Documents
oDocumentation on enabled/disabled ports and protection schemes.
### 5.Manufacturing/Provisioning Process Flow
oEspecially for disabling debugging interfaces and secure boot provisioning.
### 6.Key and Certificate List
oAll keys and certs used in the device ecosystem.
### 7.Key Management Lifecycle Document
oPurpose, generation, storage, destruction, validity, rotation.
### 8.Secure Storage Configuration
oStorage mechanism and configuration of sensitive data (keys, certificates).
### 9.Tamper Protection Documentation
oSoftware and hardware anti-tamper measures.
### 10.IP Protection Documentation
From chip manufacturer, or declaration if unavailable.
### 11.Boot Image Validation Report
Secure boot process validation (pass/fail cases).
### 12.Random Number Generator Usage
Description of RNG used (hardware or software) and supporting libraries.

## 🖥️ Software & Firmware Documentation
### 13.Firmware Code Snippets
Related to TEE APIs, secure boot, RNG, TLS, etc.
### 14.Memory Protection Declaration
Statement showing ASLR, DEP enabled if applicable.
### 15.TLS Communication Documentation
Details on TLS configuration, cipher suites, certificate validation.
### 16.Digital Signature Verification Use-Cases
When and how signatures are validated for server communication.
### 17.SBOM (Software Bill of Materials)
Third-party components, versions, and known vulnerabilities.
### 18.Static Code Analysis Report
Proving banned C functions are replaced.
### 19.Hardcoded Credential Audit Report
From secure code review (manual/automated).
### 20.Secure Firmware Update Procedure
Process for secure OTA/manual updates with rollback prevention.
### 21.Anti-Downgrade Declaration
Proof device doesn’t allow rollback to older firmware.
### 22.Scheduled Update Policy
Procedure for OTA or manual firmware update schedule.

## 📡 Wireless & Communication Security (If Applicable)
### 23.Mutual Authentication Process Document
For wireless communication initiation.
### 24.Wireless Encryption Mechanism
Data-in-transit protection via encryption.
### 25.Wireless Capability Declaration
If wireless not supported, submit a signed declaration.

## 🔗 Supply Chain & Risk Management
26.Component BOM with Source Traceability
For SoC and other critical security components.
### 27.Supply Chain Risk Management Plan
Risk identification, assessment, prioritization, and mitigation.
### 28.Business Continuity Plan
Post-incident reports, playbooks, continuity strategies.

## ✅ Submission Requirements
### 29.Test Reports from BIS Recognized Labs
As per Scheme II of BIS Conformity Assessment Regulations, 2018.
### 30.Compliance Checklist
Summary showing each requirement met and corresponding document reference.





## Essential Testing Procedures for CCTV Cameras

### 1. Hardware-Level Security
Debugging Interface Protection: Verify USB, UART, JTAG, SWD are disabled or protected (e.g., password-protected).
Unique Keys and Certificates: Confirm each device has unique cryptographic keys and certificates.
Trusted Execution Environment (TEE): Verify availability and use of TEE/TPM/SE for crypto operations.
Secure Storage: Ensure sensitive data, private keys, and certificates are stored securely.
Tamper Resistance: Test tamper detection and resistance features (software/hardware).
Intellectual Property Protection: Check IP protection tech from SoC vendor is enabled (if available).
Secure Boot: Validate boot image signature before loading.
Random Number Generation: Use cryptographically secure pseudo-random number generators.
### 2. Software/Firmware Security
Memory Protection: Verify ASLR and DEP are enabled.
Transport Layer Security (TLS): Confirm data in transit is encrypted using secure TLS protocols.
Digital Signature Validation: Validate server connection signatures and certificates.
Use of Safe C Functions: Replace banned C functions with secure equivalents (via static analysis).
Component Disclosure (SBOM): Maintain Software Bill of Materials (third-party libraries, versions).
No Hardcoded Credentials: Ensure no hardcoded usernames/passwords/backdoors.
Secure Firmware Update: Use secure bootloader and prevent downgrade attacks.
Scheduled Updates: Device must support scheduled OTA or manual secure updates.



Step-by-Step Testing Procedure for CCTV Cameras (BIS-CRS Compliance)

Phase 1: Preparation & Documentation
Phase 2: Hardware-Level Security Testing
Phase 3: Software & Firmware Security Testing
Phase 4: Communication & Supply Chain Assurance
Phase 5: Final Documentation & Compliance


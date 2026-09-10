---
title: Certificate Inventory
date: 2026-09-10
tags:
  - 安防
---
# Certificate Inventory — Realtek RTS3917

| | |
|---|---|
| **Document** | Certificate and trust-anchor inventory for security certification / customer audit |
| **Platform** | Realtek RTS3917 (rts39xx SDK v5.3.1), CPPlus2 IPC firmware |
| **Date** | 2026-09-09 |
| **Scope** | All certificates, public keys, and key files deployed on the camera (boot chain, root filesystem, application partition), with purpose, location, validity, and usage |
| **Audience** | Security auditors, certification reviewers, firmware maintainers |

All statements below are derived from the source files and build artifacts
listed in [Section 7 (Source References)](#7-source-references). Where a
detail is defined by the SoC vendor rather than this source tree, it is
identified as vendor-defined. OTP-resident keys are out of scope here; they
are documented separately in `otp-memory-structure.md` (§8 Key Storage Map).

---

## 1. Overview

The camera does not use a conventional certificate store (there is no
populated system CA bundle). Instead, it deploys a layered set of trust
anchors — one X.509 certificate and a small number of public keys — each
embedded in a verified, read-only component of the boot chain. Every stage
authenticates the next before handing over control:

```
First-stage boot (BL2 / boot ROM code)
   └─ verifies C1 (TB_FW certificate)      → authenticates U-Boot
U-Boot
   └─ verifies C2 (FIT signature key)      → authenticates kernel + DTB
Linux + fs_mgr
   └─ verifies C3 (verity_key2.der)        → authenticates rootfs and /app
Application layer
   └─ uses C5 (public_key.pem)             → verifies application components
```

---

## 2. Certificates and trust anchors deployed on the device

| ID | Item | Format / algorithm | Location | Purpose | Validity and usage |
|---|---|---|---|---|---|
| C1 | **Trusted-boot (TB_FW) certificate** | X.509 v3 (DER); RSASSA-PSS signature with SHA-256 (MGF-1, 32-byte salt); serial no. `00CA65E84108CBD432` | Flash boot region, preceding the U-Boot image | Root of the boot trust chain (Trusted Firmware-A `cert_create` format): binds the SHA-256 hashes of the next boot stage (U-Boot) into a signed certificate | Parsed and verified by the first-stage boot code on every boot; no X.509 expiry period is enforced — the credential is long-term and is replaced only via signed firmware update |
| C2 | **FIT signature public key** (`key-verity_key1`) | RSA-2048, SHA-256 with RSASSA-PKCS#1 v1.5 | Embedded in the U-Boot control device tree (flash boot partition), node `signature { key-verity_key1 }` | Authenticates FIT images — the Linux kernel + device tree FIT (`linux.itb`) and the U-Boot DTB FIT — via mandatory signature verification (`mkimage -r`) | Evaluated on every boot; unsigned or modified FIT images are rejected; long-term, no expiry |
| C3 | **Partition verification public key** (`verity_key2.der`) | RSA-2048 public key, X.509 SubjectPublicKeyInfo (DER, 270 B) | Root filesystem `/etc/keys/verity_key2.der` (read-only squashfs) | Verifies the signature of the dm-verity hash table attached to the read-only root filesystem (mtdblock4) and `/app` (mtdblock5) partitions (`verify=` option in `/etc/fstab.user`) | Used by `fs_mgr` at mount time via the kernel crypto API (`pkcs1pad(rsa,sha256)`); on success the dm-verity mapping is created and per-block integrity is enforced on every subsequent read; long-term |
| C4 | **Filesystem decryption key** (`crypto_key.bin`) | 256-bit AES key (AES-256-CBC, with a separate 16-byte IV) | Root filesystem `/etc/keys/crypto_key.bin` | Key material made available to `fs_mgr` for encrypted read-only partition support (`aes-cbc-plain64` via the kernel crypto API); counterpart of the build-time image-encryption key | Consumed at mount time when an encrypted mount is requested; long-term |
| C5 | **Application public key** (`public_key.pem`) | 32-byte Ed25519-class raw public key (paired with 64-byte signatures) | Application partition payload (`/app`) | Application-layer signature verification of security-relevant application components (e.g. the `.sign` signature shipped alongside the device-ID decryption library) | Consumed by the application layer; long-term |

The CP content-protection keys are OTP-resident secrets rather than
certificates; see `otp-memory-structure.md` §8 for that inventory.

---

## 3. Validity and rotation

- None of the deployed trust anchors carries a runtime-enforced X.509
  expiry period; all are long-term credentials bound to the device by the
  verified-boot chain.
- Trust anchors are replaced only as part of a signed firmware update, and
  every update image is itself verified by the chain in Section 1 before
  taking effect.

---

## 4. Certificate classes not present on the device

- **No TLS CA certificate pool**: the device does not ship a system CA
  bundle (`/etc/ssl/certs` is not populated). Trust anchors for the vendor
  cloud/P2P channel are embedded in the vendor application libraries and
  are vendor-defined (available on request).
- **Kernel image**: no certificates are compiled into the kernel
  (`CONFIG_SYSTEM_TRUSTED_KEYS=""`), and kernel module signing is not in
  use (`CONFIG_MODULE_SIG` not set).
- **OpenSSL demo/test certificates** present in the SDK source tree
  (`rts_openssl/demos`, `rts_openssl/test/certs`) are development samples
  on the build host and are not deployed to the device.

---

## 5. Protection of certificate storage

All items C2–C5 reside inside verified, read-only boot-chain components:
C2 within the authenticated U-Boot image; C3–C4 within the dm-verity-
protected root filesystem (C3 mechanism); C5 within the signature-verified
`/app` partition. Modification of any of these files breaks the
corresponding verification step at the next boot or mount, so the trust
anchors are protected by the same chain they anchor.

---

## 6. Glossary

| Term | Meaning |
|---|---|
| TB_FW certificate | Trusted-boot certificate (TF-A `cert_create` format) binding boot-stage hashes, signed with RSASSA-PSS |
| FIT | Flattened Image Tree — signed kernel/DTB image format verified by U-Boot |
| dm-verity | Kernel block-level integrity protection with a signed root hash |
| fs_mgr | User-space mount manager applying `/etc/fstab.user` (verify/key options) via the kernel crypto API |
| SPKI | X.509 SubjectPublicKeyInfo — standard DER container for a public key |

---

## 7. Source References

| Source (relative to workspace root) | Evidence provided |
|---|---|
| `ipc/rts3917/build_security_image/rts3917n/build/tb_fw.crt` | C1: X.509 v3 DER trusted-boot certificate, RSASSA-PSS with SHA-256 |
| `ipc/rts3917/fw/out/*_base/build/u-boot.dtb` (node `signature/key-verity_key1`) | C2: RSA-2048 FIT signature key embedded in the U-Boot control device tree |
| `ipc/rts3917/build_security_image/template/*.its.template` (`key-name-hint="verity_key1"`, `mkimage -r`) | FIT signing configuration: mandatory signature verification with C2 |
| `ipc/rts3917/build_security_image/genimage.sh`, `genimage_encrypt.sh` | Image build pipeline: TB_FW certificate generation/placement, FIT signatures, AES-256-CBC image encryption (C4 counterpart) |
| `ipc/rts3917/fw/rootfs/rootfs_cprt/etc/keys/` (`verity_key2.der`, `crypto_key.bin`) | C3, C4: the only key files shipped in the root filesystem |
| `ipc/rts3917/fw/rootfs/rootfs_cprt/etc/fstab.user` | Mount table: `/app` dm-verity signature verification (`verify=/etc/keys/verity_key2.der`); key-file references |
| `ipc/rts3917/fw/rootfs/rootfs_cprt/usr/bin/fs_mgr`, `lib/libfsmgr.so` | Mount manager: dm-verity signature verification via kernel crypto API (`pkcs1pad(rsa,sha256)`), AES-CBC filesystem decryption (C3, C4 usage) |
| `ipc/rts3917/fw/app/public_key.pem`, `libcp_device_id_decryption.so.sign` | C5: 32-byte Ed25519-class public key with its 64-byte component signature |
| `out/rts3917n_base/build/kernel/.config` | Kernel configuration: dm-verity enabled; no kernel-trusted certificate list; module signing disabled |
| `out/rts3917n_base/build/uboot-custom/.config` | Bootloader configuration: `CONFIG_FIT_SIGNATURE=y` (mandatory FIT verification) |

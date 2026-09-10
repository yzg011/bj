---
title: OTA Update Signing and Verification
date: 2026-09-10
tags:
  - 安防
---
# OTA Update Signing and Verification — Realtek RTS3917 

| | |
|---|---|
| **Document** | Firmware-update package signature scheme, on-device verification keys, and their protection |
| **Platform** | Realtek RTS3917 (rts39xx SDK v5.3.1), CPPlus2 IPC firmware |
| **Date** | 2026-09-09 |
| **Scope** | OTA and SD-card update flow, package signature verification, verification keys stored in the camera, and the mechanisms protecting them |
| **Audience** | Security auditors, certification reviewers, firmware maintainers |

All statements below are derived from the source files listed in
[Section 9 (Source References)](#9-source-references). Boot-chain certificates
and trust anchors (C1–C3) are documented in `certificate-inventory.md`;
OTP-resident keys in `otp-memory-structure.md`. This document covers the
firmware-update path and the keys that protect it.

---

## 1. Overview

Firmware updates are delivered as a single signed upgrade package
(`rts3917nall.cppa`) through three paths — cloud OTA download, SD-card update,
and an on-flash backup recovery partition (`otabak`). All three paths enforce
the same cryptographic gate: the package's Ed25519 signature is verified
**before any flash erase or write operation**. Independently, every partition
image contained in the package is signed at build time and re-verified by the
boot chain at every start (see `certificate-inventory.md` §1).

| Verification point | When evaluated | Key (see §3) | Behaviour on failure |
|---|---|---|---|
| Update-package signature (Ed25519) | Once per package, before flashing | K1 | Package rejected; no data written |
| TB_FW certificate (RSASSA-PSS) | Every boot, first-stage boot | C1 | Boot aborted |
| FIT image signature (RSA-2048) | Every boot, U-Boot | C2 | Kernel/DTB rejected |
| dm-verity table signature (RSA-2048) | Mount of rootfs and /app | C3 | Partition not mounted |
| Component signature (Ed25519) | Application start, per component | K2 | Component not loaded |

---

## 2. Update package format and signature scheme

The upgrade package is a plain (non-encrypted) container whose authenticity
and integrity rest entirely on a digital signature placed in its header.
Confidentiality of the delivery channel is provided by the TLS-protected
download connection to the vendor cloud.

```
Offset   Size   Field
0        4      Magic "cppa" (flag 0x61707063)
4        64     Ed25519 signature — covers all data from offset 68 to EOF
68       ...    TLV records:
                - IMAGE_LIST_DESC: number of images N
                - N x image descriptor: partition name (8 B), MTD device
                  number, flash start address, partition size, image offset
                  in package, image length, erase-all flag
                - image payloads (kernel FIT, rootfs, /app, ...)
```

Verification procedure (identical in the user-space installer and in U-Boot):

```
read magic, reject unless "cppa"
read 64-byte signature
SHA-512 over all remaining bytes  (TLV headers + all image payloads)
ed25519_verify(signature, sha512_digest, pubkey K1)
  |- pass  -> parse TLV list, proceed to flashing
  `- fail  -> abort with error; nothing is written to flash
```

Because the digest spans the complete payload, any modification of the image
list or of a single payload byte invalidates the signature.

## 3. Verification keys stored in the camera

| ID | Key | Algorithm / format | Storage location on device | Purpose |
|---|---|---|---|---|
| K1 | Update-package verification public key | Ed25519, 32-byte raw public key | Compiled into the `updater` installer (runtime path `/app/bin/updater`, built from `cpplus/updater`); the same key is compiled into the U-Boot SD-update command; a reference copy is shipped as `/app/public_key.pem` | Verifies the 64-byte Ed25519 header signature of every `.cppa` upgrade package before flashing (all three paths in §4) |
| K2 | Component verification public key | Ed25519, 32-byte raw public key | Compiled into the main camera application | Verified at application start for each vendor component: the 64-byte signature file (`<component>.so.sign`) is checked against the SHA-512 digest of the component binary before it is loaded |
| C1 | TB_FW certificate | X.509 v3, RSASSA-PSS / SHA-256 | Flash boot region, preceding the U-Boot image | First-stage boot authenticates U-Boot |
| C2 | FIT signature public key | RSA-2048, PKCS#1 v1.5 / SHA-256 | U-Boot control device tree, `signature` node | U-Boot authenticates the kernel + DTB FIT image |
| C3 | Partition verification public key | RSA-2048, X.509 SPKI (DER) | Root filesystem `/etc/keys/verity_key2.der` (read-only squashfs) | `fs_mgr` authenticates the dm-verity hash tables of the rootfs (mtdblock4) and `/app` (mtdblock5) at every mount |

Notes:

- **K1 and K2 are two independent Ed25519 key pairs.** K1 authenticates
  upgrade packages (signing performed by the firmware publishing
  infrastructure); K2 authenticates vendor application components. The two
  public keys are unrelated and are verified by different code paths.
- The verification code uses the **compiled-in copy** of K1; the PEM file in
  `/app` carries the same key material as a reference copy inside the same
  verified partition.
- **No private key material for K1, K2, C1, C2 or C3 exists on the device.**
  All signing takes place in the firmware build/publishing infrastructure,
  where partition image signatures are produced through an HSM-backed signing
  step (see Section 5).
- **Single root of trust for the boot chain:** the RSA public keys used at
  the C1/C2/C3 verification points all derive from one root public key; its
  SHA-256 hash is the reference value anchored in the first-stage boot code
  (derivation script in Section 9).

## 4. Update installation paths

### 4.1 Path A — cloud OTA (primary path)

```
Vendor cloud (TLS connection)
   |  OTA check: EDMPSDKOTACheckV2()   [scheduled window or app-triggered]
   v
Vendor EDMP SDK (closed-source in-device library)
   |  callback carries: download URL + MD5 + package size
   v
Application OTA callbacks
   |  on_ota_begin     -> release resources, stage file /tmp/upgrade.file
   |  on_ota_download  -> chunks appended under watchdog supervision
   |  on_download_complet
   v
cp_ota_upgrade()
   |  networking stopped, /app/bin/updater copied to /tmp/updater
   v
/tmp/updater /tmp/upgrade.file            <- user-space installer
   |  1. verify package signature (Ed25519, K1)  -> abort on failure
   |  2. for each TLV image descriptor: flashcp image -> /dev/mtdN
   v
reboot -> boot chain re-verifies every partition (C1 -> C2 -> C3)
```

### 4.2 Path B — SD-card update (U-Boot rescue path)

The platform boot command (`CONFIG_BOOTCOMMAND "cpsdupdate; bootm ..."`)
executes the U-Boot update command at **every** start before launching the
kernel. The command scans the SD card for a package
(`rts3917nall.cppa` / `sd.cppa` / `ota.cppa`), loads it into memory and runs
the identical verification routine of Section 2 before any flash operation.
Only partitions whose content differs from the package are erased and
rewritten; if the U-Boot partition itself was updated, the device resets and
re-enters the authenticated boot chain. Access to the U-Boot console update
entry is protected by a password prompt with a timeout.

### 4.3 Path C — `otabak` backup recovery (power-fail safe path)

In backup-mode OTA the downloaded package is first stored into the dedicated
`otabak` flash partition under a small header (flag `cpoa` / 0x616f7667 with
offset and length fields). After restart, `cpsdupdate` detects this header,
reads the package from flash instead of the SD card, verifies the same
Ed25519 signature, flashes the images and then erases the header. A package
that fails verification is skipped, leaving the previously installed firmware
running.

## 5. Protection of the verification keys

1. **Public-key-only on the device.** Every verification credential on the
   camera (K1, K2, C1–C3) is a public key or certificate. The corresponding
   private keys never leave the build/publishing infrastructure, where all
   partition image signatures and the update-package signature are produced
   through an HSM-backed signing step. A fully compromised device still
   cannot forge a new valid update package; at most it can replay a
   previously signed one.
2. **Self-referential storage.** Each copy of K1 resides inside a component
   that is itself integrity-protected: the `updater` installer and
   `/app/public_key.pem` live in the `/app` partition whose dm-verity hash
   table is signature-verified at every mount (C3), and the U-Boot copy is
   covered by the C1/C2 boot authentication. K2 is compiled into the main
   application in the same protected partition. Replacing any copy breaks the
   corresponding verification step — the keys are anchored by the same chain
   they anchor.
3. **Verify-before-write.** Both installers (user-space `updater` and U-Boot
   `cpsdupdate`) verify the package signature before the first erase/write
   command; a failed verification leaves the flash contents untouched.
4. **Single root of trust.** One RSA root public key (hash-anchored in the
   first-stage boot code) backs all three boot-chain verification points
   C1–C3, keeping the chain short and consistent.
5. **Gated rescue entry.** The U-Boot SD-update command is reachable only
   through a password-checked console entry with a timeout, limiting offline
   physical interaction with the update path.

## 6. Defence in depth after flashing

Installation-time verification (K1) protects the *package*; it is complemented
by build-time signatures on every partition image that are re-verified at
every start (details in `certificate-inventory.md` §1): first-stage boot
authenticates U-Boot via the TB_FW certificate (C1), U-Boot authenticates the
kernel/DTB FIT image (C2), and `fs_mgr` authenticates the dm-verity hash
tables of the rootfs and `/app` partitions (C3), enforcing per-block integrity
on every read. Application components in `/app` are additionally verified with
K2 at load time. An attacker who bypasses the installation gate would still
fail the boot-chain verification with the next start.

## 7. Boundaries and vendor-defined items

- **Closed-source download SDK.** The vendor EDMP library performs the OTA
  check and download; the download-integrity value supplied by the cloud is
  processed inside the SDK and is not re-verified independently by the
  application callback layer shown in the delivered sources. The enforced
  cryptographic boundary at installation time is the Ed25519 package
  signature of Section 2.
- **No cryptographic anti-rollback counter enforcement observed.** The
  Trusted-Firmware-A content certificate carries NV-counter fields, but their
  enforcement on this platform is vendor-defined and not observable in the
  delivered tree. Compensating application-level measures exist: the OTA
  preparation step deletes all upgrade packages from the TF card before
  flashing (preventing rollback via SD card), and the `otabak` header is
  erased after successful application.
- **Build-output caveat.** Production build artifacts (including the kernel
  `.config`) referenced by `certificate-inventory.md` were removed from this
  workspace; the kernel-configuration statements in that document carry that
  caveat.
- Scope of this document is the update path. TLS/cloud-channel certificates
  and OTP-resident keys are covered by `certificate-inventory.md` and
  `otp-memory-structure.md` respectively.

## 8. Glossary

| Term | Meaning |
|---|---|
| `.cppa` | Signed firmware upgrade package consumed by `updater` and U-Boot `cpsdupdate` |
| Ed25519 | EdDSA signature scheme over Edwards25519 (RFC 8032); 32-byte public keys, 64-byte signatures |
| FIT | Flattened Image Tree — signed kernel/DTB image format verified by U-Boot |
| dm-verity | Kernel block-level integrity protection with a signed root hash |
| fs_mgr | User-space mount manager applying `/etc/fstab.user` (verify/key options) via the kernel crypto API |
| `otabak` | Flash backup partition holding an OTA package awaiting application |
| updater | User-space installer that verifies and flashes `.cppa` packages (`/app/bin/updater`) |
| cpsdupdate | U-Boot command performing SD-card/`otabak` package verification and flashing |
| HSM | Hardware Security Module used by the build infrastructure to produce image signatures |
| TLV | Type-Length-Value record structure used inside the upgrade package |

---

## 9. Source References

| Source (relative to workspace root)                                                                        | Evidence provided                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `cpplus/updater/update_pack_decode.c`                                                                      | K1 hard-coded Ed25519 public key; package magic and 64-byte header signature; SHA-512 over the full payload; abort on verification failure |
| `cpplus/updater/update_pack_decode.h`                                                                      | Package flag 0x61707063, TLV record types, image descriptor layout                                                                         |
| `cpplus/updater/linux/main.c`                                                                              | User-space install flow: decode/verify -> per-partition flash write -> reboot                                                              |
| `cpplus/updater/uboot/uboot_sd_update.c`                                                                   | `cpsdupdate`: SD-card package names, `otabak` header 0x616f7667 handling, diff-only flashing, verification before erase/write              |
| `cpplus/updater/uboot/uboot_auth.c`                                                                        | Password gate with timeout protecting the U-Boot update entry                                                                              |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/bootloader/uboot-2023.01/board/realtek/rts3917/rlxboard.h` | `CONFIG_BOOTCOMMAND "cpsdupdate;bootm ..."` — rescue update runs at every boot                                                             |
| `cloud/cpplus2/app_main/src/cp_edmp_ota.c`                                                                 | Cloud OTA callbacks, `/tmp/upgrade.file` staging, installer invocation                                                                     |
| `cloud/cpplus2/app_main/include/cp_edmp_ota.h`                                                             | OTA callback contract (URL / MD5 / package size)                                                                                           |
| `cloud/cpplus2/sdk/rts3917/include/edmpsdk.h`                                                              | `EDMPSDKOTACheckV2` vendor cloud SDK API                                                                                                   |
| `cpplus/cp_ipc/src/cp_ota.c`                                                                               | OTA preparation under watchdog supervision, TF-card package deletion (anti-rollback measure), `otabak` backup writing                      |
| `cpplus/cp_ipc/src/cp_decrypt.c`                                                                           | K2: Ed25519 verification of component `.sign` files at application start                                                                   |
| `ipc/rts3917/fw/app/public_key.pem`                                                                        | K1 reference copy shipped in the `/app` partition (32-byte Ed25519 public key)                                                             |
| `ipc/rts3917/build_security_image/gensignature.sh`                                                         | Build-side signing of boot/kernel/rootfs/app images via the HSM signing step                                                               |
| `ipc/rts3917/build_security_image/genimage.sh`                                                             | Image pipeline: TB_FW certificate, FIT signature, dm-verity table images                                                                   |
| `ipc/rts3917/build_security_image/public_key/get_hash.sh`                                                  | Derivation of the boot-chain verification keys from the single root public key; SHA-256 root-key hash                                      |
| `ipc/rts3917/fw/rootfs/rootfs_cprt/etc/keys/`                                                              | C3 (and C4) key files deployed in the read-only root filesystem                                                                            |
| `docs/certificate-inventory.md`                                                                            | Full inventory and details of the C1–C5 boot-chain certificates and keys                                                                   |
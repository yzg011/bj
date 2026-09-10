---
title: OTP (eFuse) Memory Structure
date: 2026-09-10
tags:
  - 安防
---
# OTP (eFuse) Memory Structure — Realtek RTS3917 / 

| | |
|---|---|
| **Document** | OTP memory structure reference for security certification / customer audit |
| **Platform** | Realtek RTS3917 (rts39xx SDK v5.3.1), CPPlus2 IPC firmware |
| **Date** | 2026-09-09 |
| **Scope** | On-chip OTP memory organization, segment usage, access paths, and security properties, as implemented in the firmware source tree |
| **Audience** | Security auditors, certification reviewers, firmware maintainers |

All statements below are derived from the source files listed in
[Section 11 (Source References)](#11-source-references). Where a detail is
defined by the SoC vendor rather than this source tree, it is identified as
vendor-defined.

---

## 1. Overview

The RTS3917 integrates an on-chip OTP (one-time-programmable / eFuse) memory
used for immutable device data: boot-time control flags, AES keys for the
hardware crypto engine, and production data. Key characteristics:

| Item | Value |
|---|---|
| OTP controller base address | `0x188a0300` (register window `0x1000`) |
| Physical capacity | **2032 bytes** |
| Organization | Group 0 (control) + 56 hardware data groups, each with 2 sub-groups |
| User data capacity | 16 B (group 0) + 112 × 16 B = **1808 bytes** |
| ECC overhead | 112 × 2 B = 224 bytes (2 ECC bytes per 16-byte sub-group) |
| Write property | One-time programmable (bits can only be programmed 1 → 0); irreversible |
| Kernel interface | nvmem device `rts-otp0` (`/sys/bus/nvmem/devices/rts-otp0/nvmem`) |
| Bootloader interface | U-Boot command `rts_otp` |
| User-space tool | `otp_mfg` (read/write/ECC/grouped-print; shipping build adds `--cp_*` provisioning commands) |

Device tree node (`rts3917_base.dtsi`):

```dts
otp: otp@188a0300 {
    compatible = "realtek,rts-otp";
    reg = <0x188a0300 0x1000>;
    clocks = <&clks RLX_CLK_OTP>;
    clock-names = "otp_ck";
    resets = <&reset FORCE_RESET_OTP>;
    reset-names = "rst";
    status = "disabled";
};
```

---

## 2. Grouping Conventions

Two numbering conventions coexist in the source tree. Both describe the same
physical memory; reviewers should be aware of which one a given tool uses.

| View | Numbering | Size per group | Used by |
|---|---|---|---|
| **Hardware group** (contains 2 sub-groups `g-0`, `g-1`) | 0 – 56 | Group 0 = 16 B; groups 1–56 = 32 B data + 4 B ECC = 36 B | Kernel driver `rts-otp.c` (`GROUP_NUMS = 57`), U-Boot `rts_otp_cmd` (`group is 0 - 57`) |
| **Logical group** (one per 16-byte sub-group) | 0 – 112 | Group 0 = 16 B; groups 1–112 = 16 B data + 2 B ECC = 18 B | User-space `otp_mfg` (`GROUP_NUMS = 113`); help text: `group[2n-1,2n] = (16+16) bytes data + (2+2) bytes ecc, n=[1,56]` |

Mapping: logical groups `(2n-1, 2n)` form hardware group `n`, `n = 1..56`.

**Linear offset ↔ group conversion** (kernel `walk_group_init()`):

```
if offset < 16:            group 0
else:                      group = (offset - 16) / 36 + 1      (hardware group, 1..56)
                           intra-group offset = (offset - 16) % 36
```

**Capacity check:** 16 + 112 × 16 (data) + 112 × 2 (ECC) = **2032 bytes** ✓

---

## 3. Memory Map

```
nvmem linear offset        content
0x000  ┌──────────────────────────────────────────────┐
       │ Group 0: Control / configuration   (16 B)    │  no ECC, double-bit programmed
0x010  ├──────────────────────────────────────────────┤
       │ HW group 1 (36 B)                            │  ┐
       │   sub-group 0 data 16B   (0x010)             │  │
       │   sub-group 1 data 16B   (0x020)             │  │ AES key #0 (32 B)
       │   ECC0 2B (0x030), ECC1 2B (0x032)           │  ┘
0x034  ├──────────────────────────────────────────────┤
       │ HW group 2 (36 B)                            │  AES key #1
0x058  ├──────────────────────────────────────────────┤
       │ HW group 3 (36 B)                            │  AES key #2
0x07C  ├──────────────────────────────────────────────┤
       │ HW group 4 (36 B)                            │  AES key #3
0x0A0  ├──────────────────────────────────────────────┤
       │ HW groups 5 – 56 (36 B each)                 │  general-purpose data segment
       │   (logical groups 9 – 112)                   │  (production data; in this product:
       │                                              │   content-protection keys, locked)
0x7F0  └──────────────────────────────────────────────┘
```

### Segment summary

| Segment | Offsets (nvmem) | Size | ECC | Purpose |
|---|---|---|---|---|
| Group 0 — control | `0x000–0x00F` | 16 B | No | Chip control/configuration words consumed at boot |
| HW groups 1–4 — AES keys | `0x010–0x09F` | 4 × 36 B (4 × 32 B key) | Yes | AES keys for the hardware crypto engine (secure boot, kernel ekey) |
| HW groups 5–56 — general data | `0x0A0–0x7EF` | 52 × 36 B | Yes | Production / product data; in this product: content-protection (CP) keys |
| ECC storage (within groups 1–56) | intra-group `+32..+35` | 2 B per 16 B data | — | Hardware-checked error correction code |

---

## 4. Segment Details

### 4.1 Group 0 — Control / configuration segment (`0x000–0x00F`, 16 B)

- **Purpose:** chip-level control and configuration data consumed by the
  boot flow. The bit-level definitions are specified by the SoC vendor
  (Realtek/Realsil) and are vendor-defined (see §9).
- **Load path at every boot:** U-Boot `checkboard()` → `load_otp()` →
  `rts_otp_load(0, 32)`; content is exposed through the dedicated
  read-only register bank `OTP_CONTROL_DATA_0` (base + `0x70`) for
  boot-time logic — *not* through the normal data register
  `OTP_READ_DATA_0` (+ `0x48`).
- **Protection properties:**
  - **No ECC** on this segment (by hardware design).
  - Programmed with **double-bit programming** in production
    (`EN_DOUBLEBIT = 1`): every bit is written as two physical cells for
    reliability. (`TEST_MODE` build expands the usable area to 32 B and
    disables double-bit; not used in production.)
  - **Group 0 is write-protected in the bootloader API**
    (`rts_otp_write()` rejects `group == 0`).

### 4.2 Hardware groups 1–4 — AES key segment (4 × 32 B)

- **Purpose:** stores **4 AES eFuse keys** (`KEY_NUMS = 4`), organized as
  two key groups of two keys (`KEY_GROUP_NUMS = 2`). Key index `k`
  (`0..3`) resides in hardware group `k + 1`.
- **Keys are not CPU-readable.** Loading a key uses the "load key" path —
  registers `REG_AES_KEY_SEL` (+`0x88`), `REG_AES_KEY_GROUP` (+`0x90`),
  `REG_LOAD_KEY` (+`0x94`) — which streams the key directly into the AES
  engine. A normal read of a key group returns no data to software
  (`otp_read(otp, k + 1, 0, NULL, 0)`).
- **Consumers:**
  - **U-Boot secure boot:** `board/realtek/rts3917/rts_crypto.c` loads OTP
    keys via `rts_otp_load_aes_key()` for firmware image
    decryption/verification during boot.
  - **Kernel crypto API:** `drivers/crypto/rts_crypto.c`,
    `rts_setkey()` supports an "efuse key" mode: the caller passes an
    all-zero key whose **last byte selects the OTP key**:
    - `len == 16`: index `0..7` — `index / 2` selects the key group,
      `index % 2 + 1` selects the sub-key;
    - `len == 32`: index `0..3` — directly selects OTP key #0–#3
      (AES-256).
  The driver then calls `rts_otp_load_aes_key(index)`; the key itself
  never appears in kernel memory.

### 4.3 Hardware groups 5–56 — General-purpose data segment (`0x0A0–0x7EF`)

- **Purpose:** immutable production/product data (one 16-byte sub-group is
  the minimal write granularity; 2 sub-groups per hardware group).
- **In-tree, product-specific use — content-protection (CP) keys:** the
  shipping `otp_mfg` build provides provisioning commands driven by
  `fw/app/init/app_init.sh` at first boot:

  ```sh
  otp_mfg --cp_verify          # 1. verify CP keys present & correct
  # on failure (first boot / fresh device):
  otp_mfg --cp_write           # 2. program CP keys
  otp_mfg --cp_lock            # 3. permanently lock the CP region
  otp_mfg --cp_verify          # 4. re-verify after programming
  # verification failure => boot stops (fail-closed)
  ```

  This implements a **write-once-then-lock** provisioning flow: keys are
  injected at manufacturing/first-boot time and permanently locked
  afterwards. The flow is fail-closed: application startup proceeds only
  after successful verification.

### 4.4 ECC storage (intra-group offsets `+32..+35`)

- Each 16-byte data sub-group is protected by **2 ECC bytes**
  (sub-group 0 → group offsets 32–33, sub-group 1 → 34–35; confirmed by
  U-Boot `set_ecc()` writing at byte offset `32 << 3` and by the kernel
  `check_ecc_status()` layout).
- **Algorithm:** GF(2⁸) dual-parity code over the 16 data bytes with fixed
  coefficient tables (`calc_ecc()` in U-Boot, `calculate_ecc()` in
  `otp_mfg.c`), producing parity bytes `par0`, `par1`.
- **Hardware checking:** reads run through `ECC_CTRL_AUTO`; per-group ECC
  enable bitmaps are `ECC_CTRL1` (groups 1–32) and `ECC_CTRL2`
  (groups 33–56). Status per sub-group from `ECC_STATUS_REG0` (+`0x44`):
  `NO_ERROR` / `ERROR_IN_PARITY_BYTE` / `CORRECTED` (with failing byte
  location) / `UNCORRECTED`.

---

## 5. Controller Register Map (base `0x188a0300`)

Defined consistently in U-Boot `board/realtek/rts3917/bspchip.h` and kernel
`drivers/nvmem/rts-otp.c`:

| Offset | Register | Purpose |
|---|---|---|
| `0x00` | `SF_CTRL_0` | Power protection switch (`RG_PENVDD2_VDD2_SW`; must be set before any access) |
| `0x04` | `SF_MODE_CTRL` | Mode: read (`N_READ`) / program (`N_PGM`); double-bit enable (`DOUBLE_BIT_EN`) |
| `0x10` | `ADDR_CTRL` | Addressing: `group << 12 \| intra-group offset << 3` |
| `0x14` | `BURST_CTRL` | Burst length |
| `0x18` | `OTP_PROGRAM_DATA` | Program data port |
| `0x30` | `HW_START_REG` | Hardware start / busy polling |
| `0x34` | `ECC_CTRL_AUTO` | Automatic ECC check enable |
| `0x3C` | `ECC_CTRL1` | Per-group ECC enable bitmap (groups 1–32) |
| `0x40` | `ECC_CTRL2` | Per-group ECC enable bitmap (groups 33–56) |
| `0x44` | `ECC_STATUS_REG0` | Per-sub-group ECC status/location (8 bits each) |
| `0x48` | `OTP_READ_DATA_0` | Read data port for normal groups |
| `0x70` | `OTP_CONTROL_DATA_0` | Read port for group 0 control data |
| `0x88` | `REG_AES_KEY_SEL` | AES key selection (key ↔ key-group binding) |
| `0x90` | `REG_AES_KEY_GROUP` | AES key group selection |
| `0x94` | `REG_LOAD_KEY` | Key-load trigger (1 = load, 0 = disable) |

---

## 6. Access Interfaces

| Layer | Interface | Notes |
|---|---|---|
| U-Boot | `rts_otp read <addr> <group> <length>` / `rts_otp write <addr> <group> <sub-group>` | `group` = 0–57. Group 0: max 32 B via control-data registers; other groups: 36 B. Write only allowed for groups ≥ 1, targeting sub-group `0`/`1`/`all` (16 B each); ECC is computed and written automatically. Group 0 writes are rejected. |
| Kernel | nvmem device `rts-otp0` (2032 B, `stride = 1`, `word_size = 1`) | Registered by `drivers/nvmem/rts-otp.c` (`nvmem_register`); linear offsets per Section 2. |
| User space | `otp_mfg -r/-w [--ecc] [--pg] [--bit] [-l]` | User-space tool reading/writing `/sys/bus/nvmem/devices/rts-otp0/nvmem`. `--ecc` auto-adjusts offsets/writes ECC; `--pg` groups the dump by logical pair; `--bit` bit-level access; `-l` little-endian word display (for AES-key reads). The shipping build additionally implements the CP provisioning commands `--cp_verify/--cp_write/--cp_lock` (§4.3). |

---

## 7. Security Properties (certification summary)

1. **Immutability:** OTP bits can only be programmed once (1 → 0); there is
   no erase. Group 0 is additionally protected from software writes by the
   bootloader API.
2. **Key confidentiality:** AES keys in groups 1–4 are load-only — the
   hardware streams them into the AES engine and software reads return no
   key material. The kernel crypto driver's efuse-key mode also ensures
   plaintext keys never enter kernel RAM (zeroed key buffer + index byte).
3. **Provision-then-lock:** content-protection keys are verified, written,
   and permanently locked at first boot (`--cp_write` → `--cp_lock` →
   `--cp_verify`). The flow is fail-closed: if verification fails at any
   point, application startup does not proceed.
4. **Data integrity:** every 16-byte data sub-group in groups 1–56 carries
   2 ECC bytes checked by hardware on every read; single-byte errors are
   reported/corrected, uncorrectable errors are flagged.
5. **Control-data reliability:** group 0 (no ECC) is programmed with
   double-bit cells in production mode to compensate for the missing ECC.
6. **Access gating:** all controller access is guarded by the
   `SF_CTRL_0` power-protection bit; the OTP controller is clock/reset
   gated via the device tree (`RLX_CLK_OTP`, `FORCE_RESET_OTP`).

---

## 8. Key Storage Map — Keys, Locations, Purposes, Protection

This section answers the audit question *"Specify which keys are stored in
which OTP segment, including their purpose and protection mechanism."*
All entries are derived from the in-tree code paths cited in Section 11.

### 8.1 Key inventory

| # | Item | OTP segment | nvmem offsets | Size | Purpose |
|---|---|---|---|---|---|
| K1 | Boot key-source flag | Group 0, byte `0x0B`, bit 7 (control-data bit 95) | `0x00B` bit 7 | 1 bit | Selects the boot key source: unprogrammed (reads 1) = load key from SD card (development); programmed to 0 = use OTP AES key #0 (production). Evaluated at every boot by `read_flag_from_otp()`. |
| K2 | **AES key #0 — boot image key** | Hardware group 1 (sub-groups 0 + 1) | data `0x010–0x02F`, ECC `0x030–0x033` | 32 B | Bootloader image-decryption key. Loaded into the hardware AES engine by `rts_otp_load_aes_key(1, 36)`; key length and mode follow the bootloader build configuration (AES-128 or AES-256, ECB or CBC). |
| K3 | AES key #1 | Hardware group 2 | data `0x034–0x053`, ECC `0x054–0x057` | 32 B | Available to the kernel crypto driver (OTP-key "ekey" mode, `CONFIG_CRYPTO_DEV_REALTEK`) for data encryption with an OTP-resident key. |
| K4 | AES key #2 | Hardware group 3 | data `0x058–0x077`, ECC `0x078–0x07B` | 32 B | Same as K3. |
| K5 | AES key #3 | Hardware group 4 | data `0x07C–0x09B`, ECC `0x09C–0x09F` | 32 B | Same as K3. |
| K6 | Boot CBC IV | Hardware group 7, sub-group 0 | `0x0E8–0x0F7`, ECC `0x108–0x10B` | 16 B | Initialization vector for AES-CBC boot-image decryption (`otp_readiv_hw()`); consumed only when the CBC configuration is enabled. IVs are public parameters by design. |
| K7 | Content-protection (CP) keys | General-purpose segment (hardware groups 5–56; sub-group allocation defined by the provisioning tool) | vendor-defined | vendor-defined | Product content-protection keys, provisioned at first boot. |

Group 0 additionally carries **one permanent lock bit per data group**:
programming that bit to 0 irreversibly locks the corresponding group against
further programming. This is the hardware lock used by the CP provisioning
flow (`otp_mfg --cp_lock`, with "already locked" state detection).

### 8.2 Protection mechanisms per key class

| Key class | Protection |
|---|---|
| AES keys (K2–K5) | ① **Load-only**: keys are streamed directly into the AES engine through the key-load registers (`REG_AES_KEY_SEL` / `REG_AES_KEY_GROUP` / `REG_LOAD_KEY`); software reads of key groups return no data, so key material never appears in CPU-visible memory. ② OTP write-once. ③ Per-group permanent lock bit (§8.1). ④ ECC on every 16-byte sub-group. |
| Boot key-source flag (K1) | OTP one-way (the production OTP-key path is enabled by permanently programming the bit to 0). Group 0 is software write-protected and double-bit programmed. |
| CBC IV (K6) | ECC-protected; not a secret (IVs are public parameters). |
| CP keys (K7) | Write-once at first boot, then permanently locked (`--cp_write` → `--cp_lock`); verified at every subsequent boot (`--cp_verify`) with fail-closed behavior (§7-3). |
| Group 0 control data (K1) | No ECC by design; compensated by double-bit programming (§4.1); write-protected against software writes. |

### 8.3 Configuration status (production build `rts3917n_base`)

- Kernel: `CONFIG_RTS_OTP=y` (nvmem interface), `CONFIG_CRYPTO_DEV_REALTEK=y`
  (crypto driver including the OTP-key ekey mode),
  `CONFIG_CRYPTO_USER_API_SKCIPHER=y`.
- Bootloader: `CONFIG_FIT=y`, `CONFIG_FIT_SIGNATURE=y`,
  `CONFIG_FIT_FULL_CHECK=y` — FIT image authentication (RSA signature
  verification) is active in the boot path. `CONFIG_FIT_CIPHER` is not
  enabled and no `CONFIG_AES_256` / `CONFIG_CBC_MODE` is set, i.e. the
  current build authenticates boot images by signature; the OTP AES key
  path (K2, AES-128/ECB defaults) is the storage location for the
  encrypted-image decryption key.

---

## 9. Notes

- Bit-level definitions of the **group 0 control data** are specified by
  the SoC vendor (Realtek/Realsil) and can be obtained from the vendor on
  request.
- Allocation of the general-purpose segment (hardware groups 5–56) is
  product-specific and is managed through the content-protection
  provisioning flow described in §4.3.

---

## 10. Glossary

| Term | Meaning |
|---|---|
| OTP / eFuse | One-time-programmable non-volatile memory on the SoC |
| Hardware group | 36-byte unit: 2 × 16 B data sub-groups + 2 × 2 B ECC (kernel/U-Boot numbering) |
| Logical group | 18-byte unit: 16 B data + 2 B ECC (`otp_mfg` numbering) |
| ekey | Crypto-API key descriptor meaning "use OTP key #index" (all-zero key + index byte) |
| CP key | Content-protection key provisioned into OTP at first boot and locked |

---

## 11. Source References

| File | Content |
|---|---|
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/kernel/linux-6.6/drivers/nvmem/rts-otp.c` | Kernel nvmem driver: layout constants (`GROUP0_BYTE`, `GROUP_NUMS=57`, `GROUP_BYTE=36`, `ALL_BYTES=2032`, `KEY_NUMS=4`), read/write/ECC logic, `rts_otp_load_aes_key()` |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/bootloader/uboot-2023.01/drivers/otp/rts_otp.c` | U-Boot OTP driver: program/read, ECC computation (`calc_ecc`), AES key load path |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/bootloader/uboot-2023.01/include/otp/rts_otp.h` | U-Boot OTP API |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/bootloader/uboot-2023.01/board/realtek/rts3917/rts_otp_cmd.c` | U-Boot `rts_otp` command (group/length constraints) |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/bootloader/uboot-2023.01/board/realtek/rts3917/bspchip.h` | Register map (`SYS_OTP_BASE`, `SF_CTRL_0` … `REG_LOAD_KEY`) |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/bootloader/uboot-2023.01/board/realtek/rts3917/rlxboard.c` | Boot-time `load_otp()` (group 0 → `OTP_CONTROL_DATA_0`) |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/bootloader/uboot-2023.01/board/realtek/rts3917/rts_crypto.c` | U-Boot secure-boot crypto using OTP keys |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/kernel/linux-6.6/drivers/crypto/rts_crypto.c` | Kernel crypto efuse-key mode (`rts_setkey`, `ekey_idx`) |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/kernel/linux-6.6/arch/arm/boot/dts/realtek/rts3917_base.dtsi` | OTP controller DT node (`otp@188a0300`) |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/source/system/otp_mfg/otp_mfg.c` | User-space OTP tool (layout constants, `--ecc/--pg/--bit`, help text with segment description) |
| `ipc/rts3917/rts39xx_sdk_v5.3.1/platform/package/system/otp_mfg/otp_mfg.mk` | Build integration (package definition) for the `otp_mfg` tool |
| `ipc/rts3917/fw/app/init/app_init.sh` | First-boot CP key verify → write → lock flow |
| `out/rts3917n_base/build/linux-custom/.config` | Production kernel configuration (`CONFIG_RTS_OTP`, `CONFIG_CRYPTO_DEV_REALTEK`, nvmem) |
| `out/rts3917n_base/build/uboot-custom/.config` | Production bootloader configuration (`CONFIG_FIT_SIGNATURE`, AES/mode options) |

---
title: trust boot
date: 2026-07-23
tags:
  - 安防
---
# 3917 Trusted Boot Process And Secure Boot Logs

## Trusted Boot Process

| Level   | Stage                   | Log Evidence                                                                                                              | Result                                                                                 |
| ------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Level 0 | ASIC ROM secure boot    | `3917 ASIC rom secure boot code (v2.0)`                                                                                 | The SoC ROM secure boot code starts execution.                                         |
| Level 0 | NOR flash secure boot   | `nor flash secure boot`                                                                                                 | The device enters the secure boot path from NOR flash.                                 |
| Level 1 | Trusted Firmware BL1    | `NOTICE:  Booting Trusted Firmware` / `NOTICE:  BL1: v2.3():V2.0_TO-3-g4ae38097`                                      | Trusted Firmware BL1 starts.                                                           |
| Level 1 | BL1 crypto library      | `INFO:    Using crypto library 'mbed TLS'`                                                                              | BL1 uses the mbed TLS crypto library.                                                  |
| Level 1 | FIP/NOR security mode   | `INFO:    Using FIP in nor flash mode` / `INFO:    nor flash security mode`                                           | BL1 loads FIP images in NOR flash security mode.                                       |
| Level 1 | BL2 handoff             | `NOTICE:  BL1: Booting BL2`                                                                                             | BL1 transfers control to BL2.                                                          |
| Level 2 | U-Boot                  | `U-Boot 2023.01` / `Board: IPCAM RTS3917`                                                                             | The BL2/U-Boot stage starts.                                                           |
| Level 2 | OTA package scan        | `Warning, file: 0:rts3917nall.ippa does not exist`                                                                      | U-Boot scans for update packages. No update package is found in this log.              |
| Level 3 | FIT kernel verification | `Verifying Hash Integrity ... sha256,rsa2048:verity_key1+ OK`                                                           | U-Boot verifies the kernel FIT image using SHA256/RSA2048 and the verification passes. |
| Level 4 | Linux trusted keyrings  | `Initialise system trusted keyrings` / `Loading compiled-in X.509 certificates`                                       | Linux initializes system trusted keyrings and loads built-in X.509 certificates.       |
| Level 4 | Hardware crypto drivers | `Realtek RLX trng driver initialized` / `Realtek RLX sha driver initialized` / `Realtek RLX rsa driver initialized` | Linux initializes Realtek TRNG, SHA, and RSA crypto drivers.                           |
| Level 5 | dm-verity newroot       | `fs_mgr: Enabling dm-verity for newroot` / `__mount(...target=/newroot,type=squashfs)=0`                              | dm-verity is enabled for the newroot partition and the mount succeeds.                 |
| Level 5 | dm-verity app           | `fs_mgr: Enabling dm-verity for app` / `__mount(...target=/app,type=squashfs)=0`                                      | dm-verity is enabled for the app partition and the mount succeeds.                     |
| Level 6 | User-space app          | `[I][daemon]Start app -> [@ipc]`                                                                                        | The IPC app starts after the protected partitions are mounted.                         |

## Secure Boot Stage Debug Logs

### ROM And Trusted Firmware

```text
3917 ASIC rom secure boot code (v2.0)
ddr pll init OK
nor flash secure boot
NOTICE:  Booting Trusted Firmware
NOTICE:  BL1: v2.3():V2.0_TO-3-g4ae38097
INFO:    BL1: RAM 0x19004000 - 0x1900f000
INFO:    Using crypto library 'mbed TLS'
INFO:    BL1: Loading BL2
INFO:    Using FIP in nor flash mode
INFO:    Loading image id=6 at address 0x80040000
INFO:    nor flash security mode
INFO:    Image id=6 loaded: 0x402bed8 - 0x403a147
INFO:    Using FIP in nor flash mode
INFO:    Loading image id=1 at address 0x402bed8
INFO:    nor flash security mode
INFO:    Image id=1 loaded: 0x4000088 - 0x402bed8
NOTICE:  BL1: Booting BL2
INFO:    Entry point address = 0x4000088
INFO:    SPSR = 0x1d3
```

Interpretation: the log shows ROM secure boot, NOR flash secure boot, Trusted Firmware BL1, the mbed TLS crypto library, and FIP image loading in NOR flash security mode.

### U-Boot And FIT Kernel Verification

```text
U-Boot 2023.01 (Nov 07 2025 - 10:56:19 +0800)
Model: RTS3917N EVB
Board: IPCAM RTS3917
CPU:   ARM Cortex-A @ 800M
DRAM:  64 MiB @ 1200 MHz
Warning, file: 0:rts3917nall.ippa does not exist
Warning, file: 0:rts3917nsd.ippa does not exist
Warning, file: 0:rts3917nota.ippa does not exist
## Loading kernel from FIT Image at 80400000 ...
   Using 'config-1' configuration
   Verifying Hash Integrity ... OK
   Trying 'kernel-1' kernel subimage
     Description:  Linux kernel
     Type:         Kernel Image
     Sign algo:    sha256,rsa2048:verity_key1
   Verifying Hash Integrity ... sha256,rsa2048:verity_key1+ OK
   Loading Kernel Image
OK
Starting kernel ...
```

Interpretation: the log explicitly shows that U-Boot loads the FIT image and verifies the Linux kernel subimage using `sha256,rsa2048:verity_key1`. The verification result is `OK`.

### Linux Trusted Keyrings, Crypto Drivers, And dm-verity

```text
[    0.640314] Initialise system trusted keyrings
[    1.083505] rts-trng 188a0100.trng: Realtek RLX trng driver initialized
[    2.587738] rts-crypto 18600000.crypto: Realtek RLX crypto driver initialized
[    2.607933] rts-sha 19200000.sha: Realtek RLX sha driver initialized
[    2.621448] rts-rsa 18f00000.rsa: Realtek RLX rsa driver initialized
[    2.701506] Loading compiled-in X.509 certificates
[    2.871514] fs_mgr: Enabling dm-verity for newroot
[    2.892879] device-mapper: verity: sha256 using implementation "shash-sha256-rlx"
[    2.923533] fs_mgr: __mount(source=/dev/mapper/dm-verity-newroot,target=/newroot,type=squashfs)=0
[    3.637183] fs_mgr: Enabling dm-verity for app
[    3.798968] device-mapper: verity: sha256 using implementation "shash-sha256-rlx"
[    3.844452] fs_mgr: __mount(source=/dev/mapper/dm-verity-app,target=/app,type=squashfs)=0
```

Interpretation: Linux initializes trusted keyrings and crypto drivers, then enables runtime integrity protection for `/newroot` and `/app` using dm-verity.

### dm-verity Device Status And App Start

```text
Name              Maj Min Stat Open Targ Event  UUID
dm-verity-app     253   1 L--r    1    1      0
dm-verity-newroot 253   0 L--r    1    1      0
[0:00:11.272][I][daemon]Start app -> [@ipc]
```

Interpretation: the log shows that `dm-verity-app` and `dm-verity-newroot` exist, and the IPC app starts afterward.

## Repository Code

### Secure Boot Signature Generation

File: `chip/rts3917/build_security_image/gensignature.sh`

```bash
python3 ./sign_partition.py ${SIG_FILE_DIR}/tb_fw_to_sig.crt  rts3917_sec_boot rsa_pkcs_pss ${SIG_DIR}/uboot.signature

python3 ./sign_partition.py ${IMAGE_DIR}/zImage  rts3917_sec_boot rsa_pkcs ${SIG_DIR}/kernel.signature

python3 ./sign_partition.py ${IMAGE_DIR}/rootfs.squashfs.table  rts3917_sec_boot rsa_pkcs ${SIG_DIR}/rootfs.squashfs.signature

python3 ./sign_partition.py ${IMAGE_DIR}/app.bin.table  rts3917_sec_boot rsa_pkcs ${SIG_DIR}/app.bin.signature
```

Explanation: at build time, the HSM key `rts3917_sec_boot` is used to sign U-Boot, kernel, rootfs table, and app table. U-Boot uses `rsa_pkcs_pss`; the other image/table signatures use `rsa_pkcs`.

### HSM Public Key Retrieval And Signing Request

File: `chip/rts3917/build_security_image/sign_partition.py`

```python
def get_public_key(server_url, token, key_name, public_key_path):
    """Retrieve public key from HSM using HTTPS"""
    if os.path.exists(public_key_path):
        print(f"✅ Public key already exists: {public_key_path}")
        return True

    print("🔑 Retrieving public key from HSM...")

    session = setup_https_session()
    if not session:
        print("❌ Failed to setup HTTPS session for public key retrieval")
        return False

    try:
        response = session.get(
            f"{HTTPS_SERVER_URL}/api/v1/keys/{key_name}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            public_key = data.get("public_key", "")

            if public_key:
                with open(public_key_path, 'w') as f:
                    f.write(public_key)
                print(f"✅ Public key saved: {public_key_path}")
                return True
```

```python
def sign_file(server_url, token, file_to_sign, key_name, mechanism, signature_file, hash_alg, salt_len):
    """Sign file using HSM via HTTPS"""
    print("🔐 Signing file...")

    session = setup_https_session()
    if not session:
        print("❌ Failed to setup HTTPS session for signing")
        return False

    try:
        if mechanism.startswith("rsa_"):
            file_hash = calculate_file_hash(file_to_sign, hash_alg)
            files = {'file': (file_to_sign, file_hash, 'application/octet-stream')}

            data = {
                'key_name': key_name,
                'mechanism': mechanism,
                'skip_hash_calculation': 'true',
                'hash_algorithm': hash_alg
            }

            if mechanism == "rsa_pkcs_pss" and salt_len:
                data['salt_length'] = salt_len

            response = session.post(
                f"{HTTPS_SERVER_URL}/api/v1/sign/file",
                headers={"Authorization": f"Bearer {token}"},
                files=files,
                data=data,
                timeout=60
            )
```

```python
parser.add_argument('mechanism', choices=['rsa_pkcs_pss', 'rsa_pkcs', 'eddsa'], help='Signing mechanism')

hash_alg = "sha256"
salt_len = ""

if args.mechanism == "eddsa":
    print("ℹ️  Ed25519: 64-byte signatures, built-in hashing")
elif args.mechanism == "rsa_pkcs_pss":
    salt_len = "32"
    print("ℹ️  RSA-PSS: SHA-256, 32-byte salt")
elif args.mechanism == "rsa_pkcs":
    print("ℹ️  RSA-PKCS#1: SHA-256")
```

### FIT Kernel Image And dm-verity Image Generation

File: `chip/rts3917/build_security_image/genimage.sh`

```bash
gen_kernel()
{
	echo "Create linux FIT image";
	sed "s%TAG_KERNEL_BIN%${IMAGE_DIR}/zImage%g; s%TAG_LOAD_ADDR%`cat ${IMAGE_DIR}/Makefile.boot | grep "loadaddr" | awk '{ print $3 }'`%g; s%TAG_ENTRY_ADDR%`cat ${IMAGE_DIR}/Makefile.boot | grep "loadaddr" | awk '{ print $3 }'`%g; s%SIG_KERNEL%`${TOOLS_DIR}/get_sig_value.py ${SIG_DIR}/kernel.signature`%g" ${TEMPLATE_DIR}/linux.its.template > ${BUILD_DIR}/linux.its

	${TOOLS_DIR}/mkimage \
			-f ${BUILD_DIR}/linux.its \
			-r ${RELEASE_DIR}/linux.itb
}
```

```bash
gen_rootfs()
{
	echo "Generate signed root filesystem image rootfs.squashfs.signed"

	${TOOLS_DIR}/build_verity_img.py build \
		${TOOLS_DIR} \
		${IMAGE_DIR}/rootfs.squashfs \
		${RELEASE_DIR}/rootfs.squashfs.signed \
		${SIG_DIR}

}

gen_user()
{
	echo "Generate app.signed"
	${TOOLS_DIR}/build_verity_img.py build \
		${TOOLS_DIR} \
		${IMAGE_DIR}/app.bin \
		${RELEASE_DIR}/app.bin.signed \
		${SIG_DIR}
}
```

Explanation: the kernel is generated as a FIT image with the signature value inserted. The rootfs and app images are built through `build_verity_img.py` as signed dm-verity images.

### Public Key / Verity Key Handling

File: `chip/rts3917/build_security_image/public_key/get_hash.sh`

```bash
cp rts3917_sec_boot.pem verity_key0.pem
cp rts3917_sec_boot.pem verity_key1.pem
cp rts3917_sec_boot.pem verity_key2.pem

openssl rsa -pubin -in verity_key2.pem -inform PEM -RSAPublicKey_out -outform DER > verity_key2.der
openssl rsa -pubin -in verity_key0.pem -inform PEM -outform DER > verity_key0.der

openssl dgst -sha256 -binary verity_key0.der  > verity_key0_pub.der.sha256.bin

cp verity_key2.der ../../fw/rootfs/rootfs_ipcrt//etc/keys/verity_key2.der
cp verity_key2.der ${sdk_dir}/out/rts3917n_base/target-mini/etc/keys/
cp verity_key2.der ${sdk_dir}/out/rts3918n_base/target-mini/etc/keys/

cp verity_key1.pem ${sdk_dir}/out/rts3917n_base/rtskey/
```

Explanation: the repository copies the `rts3917_sec_boot.pem` public key as `verity_key0/1/2` and generates DER/hash outputs. The boot log shows that kernel FIT verification uses `verity_key1`, and the Linux dm-verity stage protects rootfs/app using verity metadata and hash verification.

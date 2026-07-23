---
title: HSM, OTP and Secure Boot
date: 2026-07-18
tags:
  - 技术
---



# HSM, OTP and Secure Boot

## 1. Purpose

This document explains the relationship among the HSM, OTP, firmware signing, public-key verification, and Secure Boot in the RTS3917 IPC firmware.

> The device does not write the HSM, the HSM private key, or the complete public key into OTP. It writes the SHA-256 digest of the DER-encoded public key corresponding to the HSM-managed `rts3917_sec_boot` private key. After this digest is locked, it becomes the immutable hardware root of trust.

```text
HSM stores the rts3917_sec_boot RSA private key
                    │
                    ├── Signs U-Boot, kernel, rootfs, and app
                    │
                    └── Exports the corresponding RSA public key
                                      │
                                      ▼
                           Encode the public key as DER
                                      │
                                      ▼
                                Calculate SHA-256
                                      │
                                      ▼
                    Program and lock the 32-byte digest in OTP
                                      │
                                      ▼
              Boot ROM/Trusted Firmware establishes a hardware root of trust
                                      │
                                      ▼
                Only firmware signed by the HSM private key is accepted
```

## 2. Responsibilities of the HSM and OTP

| Component               | Location                                      | Security material                                                                | Main functions                                                                              |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| HSM                     | Build/signing server                          | `rts3917_sec_boot` RSA private key and `ipc_upgrade_key` Ed25519 private key | Isolates and protects private keys, signs firmware/update packages, and exports public keys |
| OTP                     | One-time-programmable area inside the RTS3917 | SHA-256 of the DER-encoded`rts3917_sec_boot` public key, lock bits, and ECC    | Stores the immutable hardware root of trust and prevents Secure Boot public-key replacement |
| Public keys in firmware | U-Boot, kernel, or read-only filesystem       | `verity_key0/1/2` public keys and the OTA Ed25519 public key                   | Verifies signatures at the corresponding boot or update stage                               |

The HSM answers “who is authorized to sign?” Only the private key protected inside the HSM can generate an accepted signature.

OTP answers “which public key shall the device trust?” Once the public-key digest is locked in OTP, modifying both the firmware and a public key in Flash cannot make a replacement key trusted.

![rts3917_sec_boot public key in the HSM](image/sds/1784794756801.png)

## 3. Signing Firmware with the HSM Private Key

#### 3.1 HSM connection

The build environment connects to the HSM using `HSM_SERVER_IP` and `HSM_TOKEN`.

Relevant files:

- [`setup.sh`](../../setup.sh)
- [`sign_partition.py`](../../chip/rts3917/build_security_image/sign_partition.py)

#### 3.2 Signed objects and algorithms

[`gensignature.sh`](../../chip/rts3917/build_security_image/gensignature.sh) uses the HSM key named `rts3917_sec_boot`:

| Boot object  | Data that is signed                       | HSM algorithm                           |
| ------------ | ----------------------------------------- | --------------------------------------- |
| U-Boot/BL2   | `tb_fw_to_sig.crt`                      | RSA-PSS with SHA-256 and a 32-byte salt |
| Linux kernel | `zImage`                                | RSA PKCS#1 v1.5 with SHA-256            |
| rootfs       | `rootfs.squashfs.table` dm-verity table | RSA PKCS#1 v1.5 with SHA-256            |
| app          | `app.bin.table` dm-verity table         | RSA PKCS#1 v1.5 with SHA-256            |

The command pattern is:

```bash
python3 ./sign_partition.py \
    <file_to_sign> \
    rts3917_sec_boot \
    <rsa_pkcs_pss|rsa_pkcs> \
    <signature_file>
```

The RSA signing flow is:

1. The build host calculates SHA-256 over the data to be signed.
2. `sign_partition.py` calls the HSM `/api/v1/sign/file` endpoint over HTTPS.
3. The request specifies `key_name=rts3917_sec_boot`, the signature mechanism, and the hash algorithm.
4. The HSM signs the digest internally with the non-exportable RSA private key.
5. Only the signature is returned; the private key remains inside the HSM.
6. The signature is added to the FIP, kernel FIT, or rootfs/app verity metadata.

The operation can be summarized as:

```text
digest = SHA256(firmware_data)
signature = RSA_Sign(HSM_private_key, digest)
```

The overall order in [`run.sh`](../../chip/rts3917/build_security_image/run.sh) is:

```text
Collect images
  → Generate the kernel hash and rootfs/app dm-verity tables
  → Request signatures from the HSM
  → Assemble signatures, public-key information, and verity metadata
```

## 4. Verifying HSM Signatures with the Public Key

A public key is not confidential, but the device must establish that it is the trusted public key paired with the HSM private key.

Signature verification is:

```text
expected_digest = SHA256(received_firmware_data)
result = RSA_Verify(public_key, signature, expected_digest)
```

Verification fails if the firmware data or signature is modified, or if a non-matching public key is used.

The project has the following verification layers:

#### 4.1 Local build-time verification

`sign_partition.py` retrieves the PEM public key from `/api/v1/keys/rts3917_sec_boot`. After receiving a signature, the script immediately verifies it locally with this public key. A verification failure terminates the build.

#### 4.2 Boot ROM and Trusted Firmware

The first hardware trust anchor is the public-key digest in OTP. The boot stage must establish that the DER digest of the current root public key matches OTP before trusting that public key to verify the FIP/BL2 certificate and signature.

The Boot ROM is immutable chip code. The device log provides the following runtime evidence:

```text
3917 ASIC rom secure boot code (v2.0)
nor flash secure boot
NOTICE:  Booting Trusted Firmware
INFO:    nor flash security mode
NOTICE:  BL1: Booting BL2
```

#### 4.3 U-Boot verification of the Linux kernel

The kernel signature is stored in the FIT image. U-Boot verifies it with the `verity_key1` public key and the `sha256,rsa2048` algorithm. The kernel is loaded only after successful verification.

Successful verification is shown by:

```text
Sign algo:    sha256,rsa2048:verity_key1
Verifying Hash Integrity ... sha256,rsa2048:verity_key1+ OK
```

#### 4.4 Linux verification of rootfs and app

rootfs and app use two protection layers:

1. `fs_mgr` uses `/etc/keys/verity_key2.der` to verify the RSA signature of the dm-verity table.
2. After the table is authenticated, Linux creates the dm-verity mapping and verifies filesystem blocks against the SHA-256 hash tree while reading them.

If the table signature fails or a protected data block is modified, the partition cannot be mounted as a trusted filesystem.

Successful setup is shown by:

```text
fs_mgr: Enabling dm-verity for newroot
fs_mgr: Enabling dm-verity for app
```

## 5. Deriving the OTP Trust Anchor from the HSM Public Key

```text
Retrieve the rts3917_sec_boot public key from the HSM
  → Save it as PEM
  → Convert it to DER
  → Calculate SHA-256
  → Program the 32-byte digest into OTP
  → Generate ECC
  → Verify and lock OTP
```

#### 5.1 Retrieving the public key

`sign_partition.py` calls:

```text
GET /api/v1/keys/rts3917_sec_boot
```

and saves the returned public key as:

```text
chip/rts3917/build_security_image/public_key/rts3917_sec_boot.pem
```

#### 5.2 Converting PEM to DER and calculating SHA-256

[`public_key/get_hash.sh`](../../chip/rts3917/build_security_image/public_key/get_hash.sh) executes:

```bash
cp rts3917_sec_boot.pem verity_key0.pem

openssl rsa -pubin \
    -in verity_key0.pem \
    -inform PEM \
    -outform DER \
    > verity_key0.der

openssl dgst -sha256 -binary \
    verity_key0.der \
    > verity_key0_pub.der.sha256.bin
```

DER is the canonical binary ASN.1 encoding of the public-key structure. Hashing DER avoids differences caused by PEM line wrapping or Base64 formatting.

![Public key in the firmware build directory](image/sds/1784795216097.png)

The current SHA-256 value of `verity_key0.der` is:

```text
8922c1135016b14fe11270887cb8f8b465048bd38f0f7c36acac0f49c36cf256
```

#### 5.3 Programming and locking OTP

The device startup script [`app_init.sh`](../../chip/rts3917/fw/app/init/app_init.sh) executes:

```sh
otp_mfg --ipc_verify
if [ $? -ne 0 ]; then
    otp_mfg --ipc_write
    otp_mfg --ipc_lock
    otp_mfg --ipc_verify
    reboot -f
fi
```

In the current firmware, `otp_mfg --ipc_write` programs the 32-byte digest at logical OTP offset 144 with ECC enabled. The grouped OTP dump is:

```text
group009-010(0160):
89 22 c1 13 50 16 b1 4f e1 12 70 88 7c b8 f8 b4
65 04 8b d3 8f 0f 7c 36 ac ac 0f 49 c3 6c f2 56
1c 5e 19 a7
```

The bytes have the following meanings:

| Bytes                              | Meaning                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| First 32 bytes,`89 22 ... f2 56` | `SHA256(verity_key0.der)`, the fingerprint of the HSM Secure Boot public key |
| Next 2 bytes,`1c 5e`             | ECC for group009                                                               |
| Final 2 bytes,`19 a7`            | ECC for group010                                                               |

`144` is the logical data offset before preceding ECC insertion. `(0160)` is the physical display position after earlier ECC layout is included;

![Public-key digest and ECC in device OTP](image/sds/1784795105284.png)

`--ipc_lock` sets the lock bit. After locking, the digest cannot be replaced with the digest of another public key.

## 6. How OTP Enables Secure Boot

OTP does not perform RSA operations. It provides Boot ROM with an immutable expected public-key digest.

The Secure Boot logic can be summarized as:

```text
1. Boot ROM obtains the root public key/certificate from the boot image
2. Calculate current_hash = SHA256(DER(root_public_key))
3. Read expected_hash from OTP
4. Compare current_hash with expected_hash
5. Mismatch: reject the public key and boot image
6. Match: use the public key to verify the HSM-generated signature
7. Valid signature: continue to the next boot stage
8. Invalid signature: stop the trusted boot process
```

This prevents the following attacks:

| Attack                                          | Protection result                                               |
| ----------------------------------------------- | --------------------------------------------------------------- |
| Modify firmware contents                        | The digest changes and RSA signature verification fails         |
| Re-sign with an attacker-controlled private key | The attacker public-key digest does not match OTP               |
| Replace the verification public key in Flash    | The DER digest of the replacement public key does not match OTP |
| Modify rootfs/app blocks                        | dm-verity hash-tree verification fails                          |

The complete chain of trust is:

```text
HSM public-key digest in OTP
  → Trust the corresponding HSM public key
  → Verify the HSM-signed U-Boot/BL2
  → U-Boot verifies the kernel
  → Linux fs_mgr verifies the rootfs/app verity tables
  → dm-verity continuously verifies filesystem blocks
  → Start the IPC application
```

## 7. Notes

1. OTP is one-time programmable. Do not lock it until the HSM key, DER format, and SHA-256 value have been confirmed.
2. Replacing the `rts3917_sec_boot` HSM key after OTP is locked causes existing devices to reject images signed by the new key.
3. Before provisioning, confirm:

   ```text
   SHA256(verity_key0.der)
   ==
   the 32-byte value expected by otp_mfg --ipc_verify
   ```

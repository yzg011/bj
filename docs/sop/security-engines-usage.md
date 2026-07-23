---
title: security engines usage
date: 2026-07-23
tags:
  - 安防
---
# Security Engines Usage

## Security Engine Inventory

| Security engine/mechanism         | Code location                                                                                                            | Purpose                                                              | Initialization                                                                                                                                  | Data processed                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Linux KCAPI AES-256-CBC           | `cam/ipc_core/ipc_tool/aes/ipc_aes.c`                                                                                  | Runtime AES-CBC encryption/decryption                                | `ipc_aes_service_init()` is called by `key_manage_init()`; KCAPI does not require explicit initialization                                   | `/conf/conf_key_1`, `/conf/conf_key_2`, JSON configuration under `/conf/ipc/`, and buffers passed through root/conf key APIs |
| SHA-256                           | `cam/ipc_core/ipc_tool/src/ipc_key_manage.c`                                                                           | Derives the AES key and IV for`conf_key_2`                         | Each operation initializes the SHA context with`ipc_sha256_init()`                                                                            | `seed` and `seed_IV`                                                                                                           |
| HSM signing API                   | `chip/rts3917/build_security_image/sign_partition.py`                                                                  | Secure boot RSA signing and OTA Ed25519/EdDSA signing                | Creates an HTTPS session, retrieves the HSM public key, and sends signing requests to`/api/v1/sign/file`                                      | U-Boot certificate/table, kernel image, rootfs table, app table, OTA package                                                       |
| Ed25519 + SHA512 verification     | `cam/updater/update_pack_decode.c`, `cam/ipc_middleware/src/ipc_decrypt.c`, `cam/ipc_middleware/src/ipc_factory.c` | Verifies OTA package, dynamic library, and factory binary signatures | Initializes digest context with`sha512_init()` and verifies with hardcoded Ed25519 public keys through `ed25519_verify()`                   | OTA update package,`.so` dynamic library, factory test binary                                                                    |
| Build-time AES image encryption   | `chip/rts3917/build_security_image/genimage_encrypt.sh`, `tools/mkcryptfs.py`                                        | Encrypts kernel/rootfs/app images during release image generation    | Shell invokes OpenSSL AES-256-CBC; Python uses`AES.new(key, AES.MODE_CBC, iv)`                                                                | `zImage`, `rootfs.squashfs.signed`, `app.bin.signed`, and related build artifacts                                            |
| Bootloader hardware crypto engine | `chip/rts3917/sdk/.../uboot-2023.01/board/realtek/rts3917/rts_crypto.c`                                                | Hardware AES encryption/decryption in U-Boot                         | Compiled when`CONFIG_CRYPTO_BOOT` is enabled; `crypto_init()` resets the cipher; `rlx_crypto()` enables crypto clock and selects AES mode | Source/destination buffers passed to bootloader crypto APIs                                                                        |

## 1. Linux KCAPI AES-CBC

### Purpose

The runtime AES-CBC engine is used to encrypt and decrypt local configuration key files and configuration data. The implementation calls Linux KCAPI:

- `kcapi_cipher_enc_aes_cbc()`
- `kcapi_cipher_dec_aes_cbc()`

### Initialization And Encryption/Decryption Code

File: `cam/ipc_core/ipc_tool/aes/ipc_aes.c`

```c
void ipc_aes_service_init(void)
{
    /* kcapi does not require explicit initialization */
}

void ipc_aes_init_ctx_iv(struct ipc_aes_ctx* ctx, const uint8_t* key, const uint8_t* iv)
{
    memcpy(ctx->key, key, 32);
    memcpy(ctx->iv, iv, 16);
}

int ipc_aes_cbc_encrypt_buffer(struct ipc_aes_ctx* aes_ctx, unsigned char* plaintext, int plaintext_len)
{
    int ret;
    unsigned char* ciphertext = plaintext;
    int ciphertext_len        = plaintext_len;

    ret = kcapi_cipher_enc_aes_cbc(aes_ctx->key, 32, plaintext, ciphertext_len, aes_ctx->iv, ciphertext, ciphertext_len);
    if (ret < 0) {
        return -1;
    }

    return ciphertext_len;
}

int ipc_aes_cbc_decrypt_buffer(struct ipc_aes_ctx* aes_ctx, unsigned char* ciphertext, int ciphertext_len)
{
    int ret;
    unsigned char* plaintext = ciphertext;
    int plaintext_len        = ciphertext_len;

    ret = kcapi_cipher_dec_aes_cbc(aes_ctx->key, 32, ciphertext, plaintext_len, aes_ctx->iv, plaintext, plaintext_len);
    if (ret < 0) {
        return -1;
    }

    return plaintext_len;
}
```

### Key Manager Initialization

File: `cam/ipc_core/ipc_tool/src/ipc_key_manage.c`

```c
s32 key_manage_init(void)
{
    ipc_aes_service_init();

    try_create_root_key();

    create_conf_key_1();

    u8 conf_key_2[48];
    s32 key_buf_len = ipc_file_read_once("/conf/conf_key_2", (pv8)conf_key_2, 48, __IPC_LOG__);

    if (key_buf_len > 0) {
        decrypt_data_with_otp_key(conf_key_2, key_buf_len);
        memcpy(_g_key[KEY_TYPE_CONF_KEY_2].key, conf_key_2, 32);
        memcpy(_g_key[KEY_TYPE_CONF_KEY_2].iv, conf_key_2 + 32, 16);
    }

    return 0;
}
```

## 2. Configuration Key File Encryption/Decryption

### `conf_key_1`

If `conf_key_1` does not exist, it is generated from random bytes. If it exists, it is read from `/conf/conf_key_1`, decrypted, and loaded. The file stores wrapped key/IV material.

File: `cam/ipc_core/ipc_tool/src/ipc_key_manage.c`

```c
static s32 create_conf_key_1(void)
{
    u8 conf_key_1[64];
    s32 key_buf_len = 0;
    s32 ret         = 0;

    key_buf_len = ipc_file_read_once("/conf/conf_key_1", (pv8)conf_key_1, 64, __IPC_LOG__);

    if (key_buf_len > 0) {
        decrypt_data_with_otp_key(conf_key_1, key_buf_len);

        memcpy(_g_key[KEY_TYPE_CONF_KEY_1].key, conf_key_1, 32);
        memcpy(_g_key[KEY_TYPE_CONF_KEY_1].iv, conf_key_1 + 32, 16);

        return 0;
    }

    ret = get_random_bytes(conf_key_1, 64);
    if (ret < 0) {
        printf("Error get_random_bytes for conf_key_1\n");
        exit(-1);
        return -1;
    }

    memcpy(_g_key[KEY_TYPE_CONF_KEY_1].key, conf_key_1, 32);
    memcpy(_g_key[KEY_TYPE_CONF_KEY_1].iv, conf_key_1 + 32, 16);

    encrypt_data_with_otp_key(conf_key_1, 64);

    ipc_file_write_once("/conf/conf_key_1", (pv8)conf_key_1, 64, __IPC_LOG__);

    return 0;
}
```

### Root/OTP Wrapping Path

`encrypt_data_with_otp_key()` and `decrypt_data_with_otp_key()` use AES-CBC.

File: `cam/ipc_core/ipc_tool/src/ipc_key_manage.c`

```c
static s32 encrypt_data_with_otp_key(pu8 data, s32 data_len)
{

    struct ipc_aes_ctx ctx;

    unsigned char key[32];
    unsigned char iv[16];

    memset(key, 0, 32);
    memset(iv, 0, 16);

    key[31] = 0x1;
    iv[15]  = 0x1;

    ipc_aes_init_ctx_iv(&ctx, key, iv);

    return ipc_aes_cbc_encrypt_buffer(&ctx, data, data_len);
}

static s32 decrypt_data_with_otp_key(pu8 data, s32 data_len)
{

    struct ipc_aes_ctx ctx;

    unsigned char key[32];
    unsigned char iv[16];

    memset(key, 0, 32);
    memset(iv, 0, 16);

    key[31] = 0x1;
    iv[15]  = 0x1;

    ipc_aes_init_ctx_iv(&ctx, key, iv);

    return ipc_aes_cbc_decrypt_buffer(&ctx, data, data_len);
}
```

### `conf_key_2`

`conf_key_2` is derived from an input seed. SHA-256 of `seed` is used as the AES key, and the first 16 bytes of SHA-256 of `seed_IV` are used as the IV. The result is then encrypted through the root/OTP wrapping path and written to `/conf/conf_key_2`.

File: `cam/ipc_core/ipc_tool/src/ipc_key_manage.c`

```c
s32 key_manage_create_conf_key_2(pv8 seed)
{
    if (!seed) {
        printf("Error: Seed required for conf_key_2 generation\n");
        return -1;
    }

    u8 conf_key_2[48]   = { 0 };
    u8 existing_key[48] = { 0 };
    s32 key_buf_len     = 0;
    s32 need_update;

    key_buf_len = ipc_file_read_once("/conf/conf_key_2", (pv8)existing_key, 48, __IPC_LOG__);
    if (key_buf_len > 0) {
        decrypt_data_with_otp_key(existing_key, key_buf_len);
    }

    u8 md_value[32];
    ipc_sha256_ctx_t sha_ctx;

    ipc_sha256_init(&sha_ctx);
    ipc_sha256_update(&sha_ctx, (u8*)seed, strlen(seed));
    ipc_sha256_final(&sha_ctx, md_value);
    memcpy(conf_key_2, md_value, 32);

    char iv_seed[256];
    snprintf(iv_seed, sizeof(iv_seed), "%s_IV", seed);
    ipc_sha256_init(&sha_ctx);
    ipc_sha256_update(&sha_ctx, (u8*)iv_seed, strlen(iv_seed));
    ipc_sha256_final(&sha_ctx, md_value);
    memcpy(conf_key_2 + 32, md_value, 16);

    memcpy(_g_key[KEY_TYPE_CONF_KEY_2].key, conf_key_2, 32);
    memcpy(_g_key[KEY_TYPE_CONF_KEY_2].iv, conf_key_2 + 32, 16);

    encrypt_data_with_otp_key(conf_key_2, sizeof(conf_key_2));
    ipc_file_write_once("/conf/conf_key_2", (pv8)conf_key_2, sizeof(conf_key_2), __IPC_LOG__);

    return 0;
}
```

## 3. Runtime JSON Configuration Encryption/Decryption

### Common Encrypt/Decrypt Entry

File: `cam/ipc_core/ipc_tool/src/ipc_key_manage.c`

```c
static void run_decrypt_encrypt_data(KEY_TYPE key_type, u8 reverse, vptr buff, s32 len)
{
    typedef int (*AES_CBC_x_buffer_t)(struct ipc_aes_ctx*, uint8_t*, int);

    AES_CBC_x_buffer_t aes_x = ipc_aes_cbc_encrypt_buffer;
    if (reverse) {
        aes_x = ipc_aes_cbc_decrypt_buffer;
    }

#define NEW_LEN(buf_len, align) (buf_len - buf_len % align)

    struct ipc_aes_ctx ctx;

    ipc_aes_init_ctx_iv(&ctx, _g_key[key_type].key, _g_key[key_type].iv);

    if (len > 180000) {
        len = 180000;
    }

    aes_x(&ctx, buff, NEW_LEN(len, 16));
}

s32 key_manage_decrypt_with_conf_key_1(pv8 path, pv8 data, s32 len)
{
    if (path && strncmp(path, "/conf/ipc/", 13)) {
        return 0;
    }

    run_decrypt_encrypt_data(KEY_TYPE_CONF_KEY_1, 1, data, len);

    return 0;
}

s32 key_manage_encrypt_with_conf_key_1(pv8 path, pv8 data, s32 len)
{
    if (path && strncmp(path, "/conf/ipc/", 13)) {
        return 0;
    }

    run_decrypt_encrypt_data(KEY_TYPE_CONF_KEY_1, 0, data, len);

    return 0;
}
```

### Encrypted/Decrypted Data

When JSON configuration is read or written, the code builds a JSON file path. Only data under `/conf/ipc/` is processed by `conf_key_1`.

File: `cam/ipc_core/ipc_tool/src/ipc_json.c`

```c
s32 ipc_json_rdconf(pv8 session, ipc_json_t h_jsons[], s32 num)
{
    v8 buff[IPC_CONF_MAX_SIZE] = { 0 };
    v8 path[128]              = { 0 };

    if (session[0] == '/') {
        snprintf(path, sizeof(path), "%s.json", session);
    } else {
        snprintf(path, sizeof(path), "%s/%s.json", IPC_CONF_SAVE_PATH, session);
    }

    s32 ret = ipc_file_read_once(path, buff, sizeof(buff), NULL);
    if (ret < 0)
        return ret;

    key_manage_decrypt_with_conf_key_1(path, buff, ret);

    return ipc_json_parse(buff, h_jsons, num);
}
```

```c
s32 ipc_json_wrconf(pv8 session, ipc_json_t h_jsons[], s32 num)
{
    v8 buff[IPC_CONF_MAX_SIZE];
    v8 path[128];

    if (session[0] == '/') {
        snprintf(path, sizeof(path), "%s.json", session);
    } else {
        snprintf(path, sizeof(path), "%s/%s.json", IPC_CONF_SAVE_PATH, session);
    }

    s32 len = ipc_file_read(h_file, buff, sizeof(buff) - 1);
    buff[len] = '\0';

    key_manage_decrypt_with_conf_key_1(path, buff, len);

    pv8 json = _json_update(buff, h_jsons, num);

    s32 new_len = strlen(json);
    if (new_len != len || strcmp(json, buff)) {
        ipc_file_clear(h_file);

        key_manage_encrypt_with_conf_key_1(path, json, new_len);

        ret = ipc_file_write(h_file, json, new_len);
    }
```

## 4. HSM Signing Engine

### HSM Public Key Retrieval And Signing Request

File: `chip/rts3917/build_security_image/sign_partition.py`

```python
def get_public_key(server_url, token, key_name, public_key_path):
    """Retrieve public key from HSM using HTTPS"""
    if os.path.exists(public_key_path):
        print(f"✅ Public key already exists: {public_key_path}")
        return True

    session = setup_https_session()
    if not session:
        print("❌ Failed to setup HTTPS session for public key retrieval")
        return False

    response = session.get(
        f"{HTTPS_SERVER_URL}/api/v1/keys/{key_name}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30
    )
```

```python
def sign_file(server_url, token, file_to_sign, key_name, mechanism, signature_file, hash_alg, salt_len):
    """Sign file using HSM via HTTPS"""
    session = setup_https_session()
    if not session:
        print("❌ Failed to setup HTTPS session for signing")
        return False

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

    else:
        with open(file_to_sign, 'rb') as f:
            files = {'file': f}

            data = {
                'key_name': key_name,
                'mechanism': mechanism,
                'skip_hash_calculation': 'true'
            }

            if mechanism == "eddsa":
                data['curve'] = 'ed25519'
```

### Mechanism Selection

File: `chip/rts3917/build_security_image/sign_partition.py`

```python
parser.add_argument('mechanism', choices=['rsa_pkcs_pss', 'rsa_pkcs', 'eddsa'], help='Signing mechanism')

if args.mechanism == "eddsa":
    print("ℹ️  Ed25519: 64-byte signatures, built-in hashing")
elif args.mechanism == "rsa_pkcs_pss":
    salt_len = "32"
    print("ℹ️  RSA-PSS: SHA-256, 32-byte salt")
elif args.mechanism == "rsa_pkcs":
    print("ℹ️  RSA-PKCS#1: SHA-256")
```

### Secure Boot Signing Calls

File: `chip/rts3917/build_security_image/gensignature.sh`

```sh
python3 ./sign_partition.py ${SIG_FILE_DIR}/tb_fw_to_sig.crt  rts3917_sec_boot rsa_pkcs_pss ${SIG_DIR}/uboot.signature

python3 ./sign_partition.py ${IMAGE_DIR}/zImage  rts3917_sec_boot rsa_pkcs ${SIG_DIR}/kernel.signature

python3 ./sign_partition.py ${IMAGE_DIR}/rootfs.squashfs.table  rts3917_sec_boot rsa_pkcs ${SIG_DIR}/rootfs.squashfs.signature

python3 ./sign_partition.py ${IMAGE_DIR}/app.bin.table  rts3917_sec_boot rsa_pkcs ${SIG_DIR}/app.bin.signature
```

### OTA Signing Calls

File: `chip/rts3917/fw/sign_update_pkg.sh`

```sh
python3 ./sign_partition.py ${cur_dir}/$2  $1 eddsa ${cur_dir}/$3
```

File: `chip/rts3917/fw/partition.js`

```js
function createFirmwarePackage(chipName, version, outputDir) {
    const partitions = getSignedTable(chipName);

    const pkg = partitions.newPackage(chipName, outputDir, "./sign_update_pkg.sh", "ipc_upgrade_key", "ippa");

    pkg.flash(version);
    pkg.ota();
```

## 5. Ed25519 + SHA512 Verification

### OTA Package Verification

File: `cam/updater/update_pack_decode.c`

```c
sha512_init(&md);

do {
    unsigned char buffer[512] = { 0 };
    ret                       = ipc_read(fd, buffer, 512);
    if (ret < 0) {
        return -1;
    } else if (ret == 0) {
        break;
    }

    sha512_update(&md, buffer, ret);
} while (1);

unsigned char sha512sum[64] = { 0 };

sha512_final(&md, sha512sum);

unsigned char ed25519_pub[32] = { 0x84, 0xad, 0x2a, 0x49, 0x0a, 0x8b, 0x86, 0x11, 0xee, 0xcc, 0xc6, 0xa6, 0xd4, 0x86, 0x0a, 0x19,
                                  0x4e, 0xc9, 0xef, 0x64, 0x38, 0xc4, 0x87, 0x45, 0xad, 0x88, 0x42, 0x33, 0x40, 0x45, 0xed, 0xec };

if (!ed25519_verify(sign, sha512sum, 64, ed25519_pub)) {
    printf("sign error\n");
    return -3;
}
```

### Dynamic Library Verification

File: `cam/ipc_middleware/src/ipc_decrypt.c`

```c
sha512_init(&sha);

u8 buff[512];
s32 len = sizeof(buff);
ITER_INIT(iter, 1);
while (ipc_file_read_iter(iter[0], so_file, (pv8)buff, &len)) {
    sha512_update(&sha, buff, len);
}

u8 sha512sum[64] = { 0 };
sha512_final(&sha, sha512sum);

u8 ed25519_pub[] = { 84,  172, 69,  158, 47, 171, 163, 1,  131, 37,  134, 208, 173, 144, 49, 88,
                     208, 204, 202, 152, 62, 235, 53,  77, 55,  147, 177, 117, 218, 39,  34, 152 };
if (!ed25519_verify(sign, sha512sum, sizeof(sha512sum), ed25519_pub)) {
    ipcfatal("so sign error");
    return NULL;
}
```

## 6. Build-Time AES Image Encryption

### Kernel Image

File: `chip/rts3917/build_security_image/genimage_encrypt.sh`

```sh
${BASE_DIR}/tools/openssl enc -aes-256-cbc -in ${IMAGE_DIR}/zImage -out ${SIG_FILE_DIR}/zImage.crypted \
    -K `cat ${CRYPTOKEY_DIR}/crypto_key.bin | xxd -ps -c 32` -iv `cat ${CRYPTOKEY_DIR}/crypto_iv.bin | xxd -ps -c 16`
${BASE_DIR}/tools/openssl dgst -sha256 -binary -out ${SHA_DIR}/kernel.sha256 ${SIG_FILE_DIR}/zImage.crypted
```

### Rootfs/App Filesystem Images

File: `chip/rts3917/build_security_image/genimage_encrypt.sh`

```sh
${TOOLS_DIR}/mkcryptfs.py \
    ${BUILD_DIR}/rootfs.squashfs.signed \
    ${RELEASE_DIR}/rootfs.squashfs.signed.crypted \
    ${CRYPTOKEY_DIR}/crypto_key.bin \
    4096
```

File: `chip/rts3917/build_security_image/tools/mkcryptfs.py`

```python
def generater_key(keyfile):
    with open(keyfile, "rb") as fd:
        return fd.read(-1)

def generater_iv(sector_num, salt):
    return struct.pack('<Q', sector_num).ljust(AES.block_size, b'\x00')

def encrypt(ptext, key, mode, iv):
    cipher = AES.new(key, mode, iv)
    return cipher.encrypt(ptext)

def encrypt_fs(ifsname, ofsname, keyfile, sector_size):
    key = generater_key(keyfile)
    salt = hashlib.sha256(key).digest()
    sector_num = 0
    with open(ifsname, "rb") as fdi, open(ofsname, "wb") as fdo:
        while True:
            ptext = fdi.read(sector_size)
            if ptext == b'':
                break
            iv = generater_iv(sector_num, salt)
            sector_num = sector_num + 1
            ctext = encrypt(ptext, key, AES.MODE_CBC, iv)
            fdo.write(ctext)
```

## 7. Bootloader Hardware Crypto Engine

### Build Entry

File: `chip/rts3917/sdk/rts39xx_sdk_v5.3/platform/source/bootloader/uboot-2023.01/board/realtek/rts3917/Makefile`

```make
obj-$(CONFIG_CRYPTO_BOOT)	+= rts_crypto.o
```

### Registers And Flags

File: `chip/rts3917/sdk/rts39xx_sdk_v5.3/platform/source/bootloader/uboot-2023.01/board/realtek/rts3917/rts_crypto.h`

```c
#define CRYPTO_CLOCK			0x188d0020
#define CLK_ENABLE_DISABLE		BIT(24)

#define CRYPTO_FORCE_RESET		0x188d8008
#define FORCE_CIPHER_RST		BIT(4)

#define RLX_AES_MODE_SEL		10

#define FLAGS_ENCRYPT		BIT(0)
#define FLAGS_DECRYPT		BIT(1)
#define FLAGS_AES		BIT(2)
```

### Initialization And AES Mode Selection

File: `chip/rts3917/sdk/rts39xx_sdk_v5.3/platform/source/bootloader/uboot-2023.01/board/realtek/rts3917/rts_crypto.c`

```c
int crypto_init(void)
{
    set_bit(CRYPTO_FORCE_RESET, FORCE_CIPHER_RST);
    clear_bit(CRYPTO_FORCE_RESET, FORCE_CIPHER_RST);
    udelay(2);

    return 0;
}
```

```c
static int rlx_crypto(u8 *dst, u8 *src, unsigned int nbytes,
		      unsigned int mask)
{
    flush_cache((ulong)src, ALIGN((ulong)nbytes, ARCH_DMA_MINALIGN));

    set_bit(CRYPTO_CLOCK, CLK_ENABLE_DISABLE);
    mdelay(1);

    rlx_crypto_write(RLX_REG_CIPHER_INT_FLAG, 0xf);
    memset(&ctx, 0, sizeof(ctx));
    ctx.keylen = 16;
#ifdef CONFIG_AES_256
    ctx.keylen = 32;
#endif
    ctx.mask = mask;

    val = 0;
    align_mask = 0x7;
    if (mask & FLAGS_AES) {
        if (ctx.keylen == 16)
            val = val | ((u32)0x0 << RLX_AES_MODE_SEL);
        else if (ctx.keylen == 24)
            val = val | ((u32)0x1 << RLX_AES_MODE_SEL);
        else if (ctx.keylen == 32)
            val = val | ((u32)0x2 << RLX_AES_MODE_SEL);
        align_mask = 0xf;
    }
```

```c
int rlx_aes_ecb_encrypt(u8 *dst, u8 *src, unsigned int nbytes)
{
    int ret;
    unsigned int mask;

    mask = FLAGS_ENCRYPT | FLAGS_AES;
#ifdef CONFIG_CBC_MODE
    mask |= FLAGS_CBC;
#else
    mask |= FLAGS_ECB;
#endif
    do {
        ret = rlx_crypto(dst, src, nbytes, mask);
    } while (ret == -EAGAIN);

    return ret;
}
```

---
title: aslr and secure update
date: 2026-07-23
tags:
  - 安防
---
# ASLR And Secure Update

## ASLR Information

The Linux kernel source contains generic `randomize_va_space` sysctl support:

File: `chip/rts3917/sdk/rts39xx_sdk_v5.3/platform/source/kernel/linux-6.6/kernel/sysctl.c`

```c
#if defined(CONFIG_MMU)
	{
		.procname	= "randomize_va_space",
		.data		= &randomize_va_space,
		.maxlen		= sizeof(int),
		.mode		= 0644,
		.proc_handler	= proc_dointvec,
	},
#endif
```

## Secure Update Process Overview

The secure update process includes:

| Stage                    | Implementation                                                             | Security purpose                                                                                                             |
| ------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| OTA package creation     | `partition.js` creates the update package and selects the signing script | Binds package generation with signing                                                                                        |
| OTA package signing      | `sign_update_pkg.sh` calls `sign_partition.py`                         | Uses HSM key`ipc_upgrade_key` with `eddsa` mechanism                                                                     |
| Device-side verification | `update_pack_decode.c`                                                   | Checks firmware magic, reads the 64-byte signature, calculates SHA512, and verifies with Ed25519 public key                  |
| OTA preparation          | `ipc_ota_prepare()`                                                      | Stops modules, removes old TF-card update packages, unmounts TF card, and prevents rollback update from old TF-card packages |
| OTA writing              | `ipc_ota_writing()`                                                      | Writes the temporary OTA file and feeds the watchdog                                                                         |
| OTA execution            | `ipc_ota_upgrade()`                                                      | Uses backup partition path or copies`/app/bin/updater` to `/tmp/updater` and runs it                                     |

## OTA Package Creation And Signing

### Package Generation Selects Signing Script And HSM Key

File: `chip/rts3917/fw/partition.js`

```js
function createFirmwarePackage(chipName, version, outputDir) {
    const partitions = getSignedTable(chipName);

    // Create package with the selected partition table
    const pkg = partitions.newPackage(chipName, outputDir, "./sign_update_pkg.sh", "ipc_upgrade_key", "ippa");

    pkg.flash(version);
    pkg.ota();
```

`partition.js` passes `sign_update_pkg.sh` as the signing script and passes the HSM key name `ipc_upgrade_key`.

### Signing Script Uses EdDSA

File: `chip/rts3917/fw/sign_update_pkg.sh`

```sh
#!/bin/bash

cur_dir=$(pwd)

echo $@

cd ../build_security_image/

python3 ./sign_partition.py ${cur_dir}/$2  $1 eddsa ${cur_dir}/$3
```

This script calls `sign_partition.py` with the supplied key name and the `eddsa` mechanism. Based on the caller, the OTA signing key is `ipc_upgrade_key`.

## Device-Side Update Package Verification

File: `cam/updater/update_pack_decode.c`

```c
static int read_update_pack_file_head(int fd)
{
    int ret                    = 0;
    char firmware_flag[5] = { 0 };
    unsigned char sign[64]     = { 0 };

    ret = ipc_read(fd, firmware_flag, 4);
    if (ret != 4) {
        printf("read firmware flag error\n");
        return -1;
    }

    if (strncmp(IPC_FIRMWARE_FLAG, firmware_flag, 4) != 0) {
        printf("firmware flag error[%s]\n", firmware_flag);
        return -2;
    }

    ret = ipc_read(fd, sign, 64);
    if (ret != 64) {
        printf("read firmware sign error\n");
        return -1;
    }
```

The device first reads and checks the firmware magic, then reads the 64-byte signature.

```c
    sha512_context md = { 0 };
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
```

The device calculates SHA512 over the remaining update package content.

```c
    unsigned char ed25519_pub[32] = { 0x84, 0xad, 0x2a, 0x49, 0x0a, 0x8b, 0x86, 0x11, 0xee, 0xcc, 0xc6, 0xa6, 0xd4, 0x86, 0x0a, 0x19,
                                      0x4e, 0xc9, 0xef, 0x64, 0x38, 0xc4, 0x87, 0x45, 0xad, 0x88, 0x42, 0x33, 0x40, 0x45, 0xed, 0xec };

    hexdump("ed25519_pub", ed25519_pub, 32);
  
    if (!ed25519_verify(sign, sha512sum, 64, ed25519_pub)) {
        hexdump("sign", sign, 64);
        hexdump("sha512", sha512sum, 64);
        printf("sign error\n");
        return -3;
    }
```

The device verifies the signature with a built-in Ed25519 public key. If verification fails, the function returns `-3`, so update package decoding fails and the package is not accepted.

## OTA Runtime Process

### OTA Preparation

File: `cam/ipc_middleware/src/ipc_ota.c`

```c
s32 ipc_ota_prepare(pv8 path, s32 pack_size, u8 has_backup)
{
    s32 ret = 0;
    clog_init("ota", "OTA upgrade");

    _g_ota->swdg_fd = ipc_swdg_reg(1);
    if (_g_ota->swdg_fd < 0) {
        ipcfatal("Soft watchdog registration failed! retcode=[%d]", _g_ota->swdg_fd);
        return _g_ota->swdg_fd;
    }

    ipc_swdg_feed(_g_ota->swdg_fd, 30);

    /* step 1: Exit all internal modules to free up resources for OTA */
    ipc_alarm_uninit(0);
    ipc_env_monitor_uninit(0);
    ipc_button_monitor_uninit(0);
    ipc_status_led_uninit(0);
```

Before OTA starts, the code registers a software watchdog and releases internal module resources.

```c
    /* step 2: Delete all TF card upgrade packages to prevent rollback upgrade by TF card after OTA */
    ipc_exec("rm %s/*all.cppa", TFCARD_PATH);
    ipc_exec("rm %s/*sd.cppa", TFCARD_PATH);
    ipc_exec("rm %s/*ota.cppa", TFCARD_PATH);
    ipc_exec("umount -f %s", TFCARD_PATH);
    ipc_exec("sync");

    ipc_mpp_uninit(1);

    ipc_exec("echo 3 > /proc/sys/vm/drop_caches");
```

The code deletes old TF-card update packages and unmounts the TF card. This is done to prevent rollback update from TF card after OTA.

```c
    if (has_backup) {
        _init_flash_backup_mtd_dev();
        _check_bak_partition_is_valid(&has_backup, pack_size);
    }

    if (pack_size >= 0) {
        ret = ipc_file_open(_g_ota->file, path, IPC_FILE_WRONLY, __IPC_LOG__);
        if (ret < 0)
            return ret;

        if (has_backup) {
            _ota_write_backup_head(pack_size);
        }
    }

    _g_ota->has_backup = has_backup;
    snprintf(_g_ota->ota_file, sizeof(_g_ota->ota_file), "%s", path);
    _g_ota->pack_size = pack_size;

    ipc_swdg_feed(_g_ota->swdg_fd, 90);
```

### OTA Writing

File: `cam/ipc_middleware/src/ipc_ota.c`

```c
s32 ipc_ota_writing(vptr data, s32 len)
{
    ipc_swdg_feed(_g_ota->swdg_fd, 90); // If there is no next one within 90 seconds, commit suicide

    if (_g_ota->pack_size < 0) {
        return 0;
    }

    s32 ret = ipc_file_write(_g_ota->file, data, len);
    if (ret < 0)
        return ret;

    return _g_ota->now_size += ret;
}
```

During OTA data writing, the watchdog is fed and the written size is accumulated.

### OTA Execution

File: `cam/ipc_middleware/src/ipc_ota.c`

```c
static s32 _flash_backup(void)
{

    ipc_exec("flashcp %s /dev/%s -v", _g_ota->ota_file, _g_ota->mtd_dev.mtd_name);

    return IPC_SUCCESS;
}
```

The backup partition path writes the OTA file through `flashcp`.

```c
void ipc_ota_upgrade(void (*f_before_exit)(s32 ret))
{
    if (!f_before_exit)
        f_before_exit = NOT_DO_ANYTHING;

    if ((_g_ota->has_backup) && (_g_ota->pack_size == 0)) {
        _ota_write_backup_head(_g_ota->now_size);
    }

    if (_g_ota->pack_size >= 0) {
        ipc_file_close(_g_ota->file);
    }

    ipc_swdg_feed(_g_ota->swdg_fd, 10 * 60);

    ipc_net_uninit(1);
    ipc_wifi_sta_disconnect();
```

Before executing the upgrade, the OTA file is closed, the watchdog timeout is extended, and network/WiFi are disconnected.

```c
    if (_g_ota->has_backup) {

        ret = _flash_backup(); // The backup partition is completed and the system can be restarted directly
        f_before_exit(ret);

        ipc_exec("reboot");

        exit(-1);
    } else { // Normal upgrade
        ipc_file_copy("/app/bin/updater", "/tmp/updater", __IPC_LOG__);
        ipc_exec("chmod 777 /tmp/updater");
        f_before_exit(ret);
        ipc_exec("/tmp/updater %s &", _g_ota->ota_file);
        _exit(0);
    }
```

The package is written to the backup partition and the device reboots. In the normal path, `/app/bin/updater` is copied to `/tmp/updater`, and `/tmp/updater` is executed with the OTA file path.

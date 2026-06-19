---
name: tauri-cnb-autoupdate
description: Set up Tauri v2 auto-update where GitHub Actions builds/signs macOS+Windows packages and CNB (cnb.cool) hosts the binaries and update manifest for domestic (China) downloads. Use when adding auto-update to a Tauri app whose repo is on CNB, wiring cross-platform signed releases without owning Mac/Windows machines, hosting Tauri updater artifacts on CNB Release, or fixing "downloads must go through CNB / 国内" requirements.
---

# Tauri 自动更新（GitHub 构建 + CNB 托管）

让 Tauri v2 桌面应用自动更新：**GitHub Actions 免费 mac/win runner 构建签名 → 产物发布到 CNB Release → 检查与下载全程走 CNB（国内）。** GitHub 仅构建农场。

适用前提：仓库主托管在 CNB（cnb.cool），且 CNB 仓库**公开**（下载直链免鉴权靠这个）；CNB 公共节点只有 Linux，所以 mac/win 包必须靠 GitHub。

`assets/` 内有可直接套用的模板：`release.yml`、`publish-cnb.sh`、`sync-version.mjs`、`updater.ts`。深入细节（REST 流程、踩坑、维护红线、Gatekeeper）见 [REFERENCE.md](REFERENCE.md)。

## 占位符

套用时替换：`<CNB_SLUG>`（如 `org/app`）、`<GH_REPO>`（如 `user/app`）、`<PRODUCT>`（**ASCII** productName，如 `my-app`）、`<KEY_PATH>`（如 `~/.tauri/my-app.key`）、`<IDENTIFIER>`（bundle id）。

## 搭建步骤（checklist）

1. **装插件**：`pnpm add @tauri-apps/plugin-updater @tauri-apps/plugin-process`；`cargo add tauri-plugin-updater tauri-plugin-process`（在 `src-tauri`）。
2. **生成签名密钥**：`pnpm tauri signer generate -w <KEY_PATH> --password ""`。⚠️ **备份私钥**——丢了已装用户永远收不到更新。
3. **改 `tauri.conf.json`**：
   - `productName` 必须 **ASCII**（中文会被 GitHub 资源名 sanitize 成 `_xxx`，窗口标题可另设中文）。
   - `plugins.updater.endpoints = ["https://cnb.cool/<CNB_SLUG>/-/git/raw/main/.updater/latest.json"]`
   - `plugins.updater.pubkey = "<上一步公钥>"`、`plugins.updater.windows.installMode = "passive"`
   - `bundle.createUpdaterArtifacts = true`
4. **改 `capabilities/default.json`**：加 `"updater:default"`、`"process:default"`。
5. **注册插件**（`src-tauri/src/lib.rs`）：`.plugin(tauri_plugin_process::init())`；updater 在 setup 钩子里 `#[cfg(desktop)] app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;`
6. **前端**：复制 `assets/updater.ts` 到 `src/lib/`；启动时 `runUpdateCheck(true)`，手动检查按钮调 `runUpdateCheck(false)`。
7. **发布脚手架**：复制 `assets/sync-version.mjs`、`assets/publish-cnb.sh`（改顶部 `REPO`/`PRODUCT` 或用占位符）、`.github/workflows/release.yml`。
8. **加 GitHub 远程**：`gh repo create <GH_REPO> --public --source . --remote github --push`（公开仓库 Actions 免费、mac/win 分钟数无限）。
9. **配 GitHub Secrets**（用户自己跑，勿经手私钥/令牌）：
   - `gh secret set TAURI_SIGNING_PRIVATE_KEY -R <GH_REPO> < <KEY_PATH>`
   - `gh secret set CNB_TOKEN -R <GH_REPO> --body "<CNB令牌, repo-code:rw>"`
   - 密码 secret 不用设。

## 发布一个版本

```bash
node scripts/sync-version.mjs 0.3.0
git commit -am "release 0.3.0" && git tag v0.3.0
git push origin main && git push github v0.3.0   # 只推 tag 到 github 触发；CNB tag 由 publish-cnb.sh 建
```

之后全自动：GitHub 出 mac+win 签名包（含 dmg）→ 传 CNB Release → 生成指向 CNB 直链的 `latest.json` 推回 CNB main。发版后本地 `git pull --ff-only origin main` 同步 bot 提交。

## 必查的坑（详见 REFERENCE.md）

- Windows 必须 `--bundles nsis`（WiX/MSI 的 light.exe 会失败）。
- productName 用 ASCII（中文被 GitHub 剥名）。
- CNB REST 请求要带 `Accept: application/json`（否则 406）、建 release 必带 `target_commitish`（否则 400）。
- **别动**：minisign 密钥、bundle identifier、endpoint URL（动了老 app 收不到更新）；CNB 仓库**保持公开**。

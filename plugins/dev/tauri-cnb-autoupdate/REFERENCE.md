# 参考：原理、REST、踩坑、维护

## 架构

```
push tag v* → GitHub  ──Actions──┐
  macos-14(arm64) + windows-latest │ tauri-action 构建+minisign 签名 → GitHub Release（中转）
  publish-to-cnb ───────────────────┘ scripts/publish-cnb.sh：
        下载产物 → REST 传 CNB Release → 生成 latest.json(CNB 直链) → 推 CNB main
用户端 tauri-plugin-updater：读 CNB latest.json → 下 CNB Release 包 → 验签(minisign) → 装 → 重启
```

| 环节 | 位置 |
|---|---|
| 构建 mac/win 签名包 | GitHub Actions（CNB 公共节点只有 Linux） |
| 二进制托管 + 下载 | CNB Release 公开直链（国内） |
| 更新清单 latest.json（endpoint） | CNB git raw（国内） |

更新机制只认：endpoint（config）、version 比对、latest.json 里的 url、minisign 公钥、bundle identifier——**都不依赖 productName**。

## CNB Release 上传（publish-cnb.sh 内部，REST）

base `https://api.cnb.cool/<slug>`，每个请求带 `Authorization: Bearer <CNB_TOKEN>` + `Accept: application/json`（**缺 Accept → 406**）。

1. `POST /-/releases`（body 必含 `target_commitish`，否则 **400**）→ `id`
2. `POST /-/releases/<id>/asset-upload-url`（`asset_name`/`size`/`overwrite`）→ `upload_url` + `verify_url`
3. `PUT <upload_url>`（传文件）
4. `POST <verify_url>`（已含 token/asset_path/ttl，确认）

下载公开直链（公开仓库免鉴权，稳定）：`https://cnb.cool/<slug>/-/releases/download/<tag>/<file>`
> 别用 `cnb releases get-releases-asset`（那是鉴权 + 12h/10 次临时链）。

git HTTPS 推送认证：用户名固定 `cnb`、密码=令牌 → `https://cnb:<CNB_TOKEN>@cnb.cool/<slug>.git`

## 产物（每个版本三件）

- `<PRODUCT>_<ver>_aarch64.dmg` — macOS 首装
- `<PRODUCT>_<ver>_x64-setup.exe` — Windows 安装（也是更新包）
- `<PRODUCT>_aarch64.app.tar.gz` — macOS 更新包（**仅它进 latest.json**）

publish-cnb.sh 按**后缀**找产物（`.app.tar.gz`/`-setup.exe`/`.dmg`），改名也稳健。

## 踩坑

1. **Windows WiX/MSI 失败**（`light.exe`）→ 只出 NSIS：`args: --target x86_64-pc-windows-msvc --bundles nsis`。
2. **中文 productName**被 GitHub 资源名剥成 `_aarch64.app.tar.gz` → productName 用 ASCII。
3. **tauri-action `includeUpdaterJson` 的清单指向 GitHub** → 我们要 CNB 直链，所以 publish-cnb.sh 自己生成 latest.json。
4. CNB REST：`Accept` 头、`target_commitish` 必填。
5. 别误以为 CNB Release 无稳定直链——公开仓库有（见上）。
6. 发版后 bot 会往 CNB main 推 latest.json，本地要 `git pull --ff-only` 否则下次推送覆盖回旧版。

## 维护红线（动了自动更新失效）

- ❌ 换 minisign 密钥（公钥）/ 改 bundle identifier / 改失效 endpoint。
- ⚠️ CNB 仓库必须公开。
- 改 productName 不会让更新失效（机制/打包不依赖它）；但 Windows 改名可能产生重复安装入口，mac 就地替换影响小。

## macOS Gatekeeper

未签名+公证时，从 dmg 装报"已损坏"（Gatekeeper 误导提示）。
- 绕过：`sudo xattr -dr com.apple.quarantine /Applications/<PRODUCT>.app`
- 根治：Apple Developer（$99/年）+ Developer ID 签名 + 公证，配 `APPLE_*` Secrets 接进 tauri-action。
- 加公证后**现有用户无需重装**：自动更新推签名版（minisign 密钥不变即可），更新后不再被拦。

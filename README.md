# 浮光 · Shimmer

浮光为 Codex 桌面应用提供本地主题库和背景工坊。你可以从图片提取配色，在模拟聊天画面里预览效果，再将主题保存到本机或导出为 ZIP。

Shimmer is a local theme library and wallpaper editor for the Codex desktop app. Sample colors from an image, preview the result in a chat layout, then save your theme locally or export a theme ZIP.

[主页 · Home](https://litianbaowork.github.io/shimmer-downloads/) · [下载与安装](https://litianbaowork.github.io/shimmer-downloads/install.html#chinese) · [Download and install](https://litianbaowork.github.io/shimmer-downloads/install.html#english)

## 1.7.0 更新 · What’s new

主题库左侧可搜索和选择，右侧显示聊天预览。选中主题即可试调背景透明度，点「应用到 Codex」后切换。背景工坊把壁纸取色、十项颜色和焦点调整放在一起，设置里可以查看正在使用的主题。Windows 导入主题后会选中对应条目。聊天操作、表单焦点、用量进度条和未读标记的对比度也有改善。[完整更新说明](https://github.com/litianbaowork/shimmer-downloads/releases/tag/v1.7.0)

Search the library on the left and preview a theme on the right. Try a wallpaper transparency setting before applying it to Codex. Wallpaper Studio brings image sampling, ten theme colors and focal-point controls together. Settings shows your active theme. On Windows the library selects imported themes for preview. Chat controls, keyboard focus, usage meters and unread indicators are easier to see. [Full release notes](https://github.com/litianbaowork/shimmer-downloads/releases/tag/v1.7.0)

## 下载 · Downloads

| 平台 · Platform | 系统要求 · Requirements | 1.7.0 |
| --- | --- | --- |
| macOS | macOS 13+ · Apple Silicon / Intel | [下载 Mac 版 · Download DMG](https://github.com/litianbaowork/shimmer-downloads/releases/download/v1.7.0/Shimmer-v1.7.0.dmg) |
| Windows | Windows 10+ · x64 | [下载 Windows 版 · Download installer](https://github.com/litianbaowork/shimmer-downloads/releases/download/v1.7.0/Shimmer-Setup-v1.7.0.exe) |

可用清单中的 SHA-256 核对下载文件。To verify your download, compare its SHA-256 hash with the entry for the same filename. [SHA256SUMS.txt](https://github.com/litianbaowork/shimmer-downloads/releases/download/v1.7.0/SHA256SUMS.txt)

## 安装

先打开一次官方 Codex 桌面应用，再完全退出。Windows 用户需要 Microsoft Store 版 Codex。

- **macOS**　打开 DMG，将 Shimmer 拖入「应用程序」，再打开 Shimmer。此版本未经 Apple 公证，首次启动时系统可能显示提示。
- **Windows**　运行安装程序，完成后从系统托盘打开浮光。安装程序未带 Authenticode 签名，Windows 可能显示「未知发布者」。

## Installation

Open the official Codex desktop app once and quit it before installing Shimmer. Windows requires the Microsoft Store edition of Codex.

- **macOS**　Open the DMG, drag Shimmer to Applications, and open it. This release has not been notarized by Apple. macOS may display a notice on first launch.
- **Windows**　Run the installer and open Shimmer from the system tray. The installer is not Authenticode-signed. Windows may show “Unknown publisher”.

## 署名 · Credits

浮光基于 [Fei-Away](https://github.com/Fei-Away) 的 MIT 许可项目 Codex Dream Skin。随包主题「哥特虚空远征」的原创画作由 [@seansong-ideogram](https://github.com/seansong-ideogram) 贡献。浮光为独立项目，与 OpenAI 无隶属关系。

Shimmer is based on Codex Dream Skin by [Fei-Away](https://github.com/Fei-Away), licensed under MIT. The bundled Gothic Void Crusade artwork was contributed by [@seansong-ideogram](https://github.com/seansong-ideogram). Copyright © 2026 Codex Dream Skin Studio contributors. License notices are included with the downloads. Shimmer is an independent project, unaffiliated with OpenAI.

## Release page maintenance

GitHub Pages publishes the root of `main`. The homepage and installation guide serve both languages as static HTML. Visitors can use the original [Chinese](https://litianbaowork.github.io/shimmer-downloads/#chinese) and [English](https://litianbaowork.github.io/shimmer-downloads/#english) entry points. The homepage download sections use `#download` and `#download-en`. The [installation guide](https://litianbaowork.github.io/shimmer-downloads/install.html) uses `#chinese` and `#english` at the top and `#changelog` and `#changelog-en` for release notes.

After a new public release is available:

1. Read the tag, published date, installer filenames and byte counts from the [latest public release](https://github.com/litianbaowork/shimmer-downloads/releases/latest). Use its published assets and notes as the source for supported platforms, signing status and changes.
2. In `index.html` and `install.html`, update both languages together. Link the DMG, Setup EXE and `SHA256SUMS.txt` directly to the same public tag. Each asset must appear once in each language on each page. Update displayed versions and sizes, add the bilingual changelog entry and update this README’s download table and release notes.
3. Before merging, confirm that the selected tag is still the latest release. Once Pages has built the merged commit, open both language entry points and both changelog anchors. Using an unauthenticated session, download both installers and the checksum manifest. Verify the file sizes against the release and the SHA-256 of each installer against the manifest.

## Homepage artwork

Rainy Corner, Moonlit Duel and Koi were created for Shimmer with ImageGen. Each work in `assets/art/` includes a still, a thumbnail, a looping animated WebP, a transparent foreground, a clean still background and a looping background for animated parallax. In the Moonlit Duel preview, the two fighters move independently. Open `?art=koi&mode=motion` or `?art=anime&mode=depth` for a particular treatment. Reduced motion starts with the still.

The opening illustrates a ChatGPT conversation. Shimmer themes the official Codex desktop app. [ChatGPT interface reference](https://learn.chatgpt.com/docs/quickstart)

Run `python3 _checks/site.py` from the repository root before shipping changes to the downloads, artwork or language anchors.

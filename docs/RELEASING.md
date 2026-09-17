# Share a downloadable Spidey preview

## Current distribution status

The project builds a local, unsigned **Mochi.app**. [Version 0.1.0 is published](https://github.com/Haimantika/talking-pet/releases/tag/v0.1.0) in the private repository, with the ZIP, checksum, and install guide attached. Downloads require repository access. No public release URL, signing credentials, notarization workflow, or automatic updater is configured here. The current verified artifact is for **Apple Silicon macOS**. Uploading source code alone does not give users a ready-to-run app.

For now, distribute this as a developer preview where each tester supplies their own Agora credentials. For a consumer release without credential setup, first move service credentials and agent/session authorization to a backend with user authentication and usage controls. Do not embed your App Certificate in the download. Replace the development Quick Tunnel dependency with a supported production callback design before promising production availability.

## 1. Build on an Apple Silicon Mac

From the project directory:

```sh
npm ci
npm run setup:conversation
npm run check
npm run test:desktop
npm run package
```

Output:

```text
release/mac-arm64/Mochi.app
```

`setup:conversation` downloads and checks the official conversation helper; packaging includes it. Do not reuse an ARM helper for a future Intel build. Other platforms need their own packaging and verification.

The root `.env` is excluded by the packaging file list. Ship only the app archive and documentation, not a copy of your workspace or user-data folder. Keep credentials, task data, and private logs out of release assets.

## 2. Create the app download

For the current version, run from the project directory:

```sh
ditto -c -k --sequesterRsrc --keepParent \
  release/mac-arm64/Mochi.app \
  release/Spidey-0.1.0-mac-arm64.zip

cd release
shasum -a 256 Spidey-0.1.0-mac-arm64.zip > Spidey-0.1.0-mac-arm64.zip.sha256
```

`ditto` preserves the macOS app bundle. Update the version in `package.json` and the archive filename together for later releases.

The ZIP is a downloadable preview, not a DMG installer. Do not describe it as signed or notarized. For broader distribution, configure Developer ID signing and Apple notarization, including the bundled helper. Apple's overview is [Protecting users from suspicious software](https://developer.apple.com/support/protecting-users-from-suspicious-software/).

## 3. Verify the download as a new user

Extract the ZIP into a fresh location and test the packaged application. Ideally use a separate macOS user account or another Apple Silicon Mac:

1. Move the extracted app to Applications and open it.
2. Follow [the installation guide](INSTALL.md) exactly, including the packaged `.env` path.
3. Confirm tasks can be created manually without credentials.
4. With the tester's Agora project, verify microphone permission, a spoken request, an actual saved task, and a spoken reply.
5. Check web dragging, persistence after restart, and full quit.
6. Confirm the archive contains neither your credentials nor your task data.

Source-mode testing alone does not verify installed-app setup or macOS download security prompts.

## 4. Publish or share

For a small test group, send the ZIP, checksum file, and installation guide through your chosen file-sharing service.

For a public download, create a release in the project's repository hosting service, such as GitHub Releases, and attach:

- `Spidey-0.1.0-mac-arm64.zip`
- `Spidey-0.1.0-mac-arm64.zip.sha256`
- `INSTALL.md`

Describe the release as **macOS Apple Silicon developer preview — unsigned; own Agora credentials required**. Include changes and known limitations. Publish the release, then add its actual download URL to README.md and INSTALL.md. Do not use placeholder URLs as working download links.

The 0.1.0 release has already been published. Use a new version/tag for subsequent releases.

## Suggested release description

> Spidey is a Spider-Man desktop companion with an adjustable web, a hand-held conversation banner, and English/Hindi voice reminders powered by Agora.
>
> **Requirements:** Apple Silicon Mac, macOS 13+, Internet for voice, and your own Agora Conversational AI project with managed-model access. No Node.js installation is needed for the app download.
>
> Download `Spidey-0.1.0-mac-arm64.zip`, extract it, move `Mochi.app` to Applications, then follow the attached `INSTALL.md` for voice setup.
>
> This is an unsigned developer preview. The app is still named Mochi in Finder. Updates are manual, reminders require the app to stay running, and conversational task callbacks use a development tunnel.

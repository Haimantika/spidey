# Download and install Spidey

Spidey is a desktop Spider-Man companion with task reminders and voice conversations in English and Hindi. The app file is currently named **Mochi.app**; its interface is branded Spidey.

## Before you download

The current build is a **developer preview for Apple Silicon Macs** (M1, M2, M3, or newer), with macOS 13 or later. Intel Mac, Windows, and Linux downloads are not provided by this build. Check **Apple menu → About This Mac** for your chip and macOS version.

You do **not** need Node.js, npm, or the source code to use the packaged app. Voice conversations require Internet access and your own Agora project with Conversational AI and managed-model access enabled. Agora service usage is charged according to your project/account configuration. Manual tasks and reminder scheduling do not require Agora credentials.

## 1. Get the download

[Download Spidey-0.1.0-mac-arm64.zip](https://github.com/Haimantika/talking-pet/releases/download/v0.1.0/Spidey-0.1.0-mac-arm64.zip), or visit the [release page](https://github.com/Haimantika/talking-pet/releases/tag/v0.1.0). The download is public and does not require a GitHub account.

Choose the app ZIP from the release's assets, **not** GitHub's “Source code (zip)” download. The latter contains development files, not an installed app.

## 2. Install the app

1. Double-click the downloaded ZIP to extract **Mochi.app**.
2. Drag **Mochi.app** into **Applications**.
3. Open **Applications → Mochi**.

This preview is unsigned and not notarized. If macOS blocks it as an unidentified developer, only proceed if you trust the maintainer and the download source. After attempting to open it, go to **System Settings → Privacy & Security → Open Anyway**, then confirm. See [Apple's instructions for opening an app from an unknown developer](https://support.apple.com/en-gb/102445). If macOS reports malware or that the app is damaged, stop and request a fresh, verified build from the maintainer.

The dashboard opens and Spider-Man appears at the top-center of the display. You can add tasks manually before setting up voice.

## 3. Set up voice once

This preview does not yet have an in-app account/setup screen. Each tester supplies their **own** Agora credentials. Do not request or share the maintainer's App Certificate.

1. In your Agora project, enable Conversational AI and access to the managed speech and language models used by the app.
2. Copy your project's **App ID** and **App Certificate**.
3. Open and then fully quit Mochi once, using the power button below Spider-Man.
4. Open **Terminal** and run:

   ```sh
   mkdir -p "$HOME/Library/Application Support/mochi-desktop-pet"
   touch "$HOME/Library/Application Support/mochi-desktop-pet/.env"
   chmod 600 "$HOME/Library/Application Support/mochi-desktop-pet/.env"
   open -e "$HOME/Library/Application Support/mochi-desktop-pet/.env"
   ```

5. In the file that opens, enter the following, replacing the two placeholder values with your own credentials. Save as plain text and keep the filename exactly `.env`, not `.env.txt`:

   ```dotenv
   AGORA_APP_ID=your_project_app_id
   AGORA_APP_CERTIFICATE=your_project_app_certificate
   AGORA_AREA=us
   ```

   `us` is the app's default Agora API area. Use `eu` or `ap` if that is the area you need for your project. `AGORA_PIPELINE_ID` can be omitted for the built-in conversational configuration.

6. Reopen **Applications → Mochi**. Fully quit and reopen whenever you change this file.

The installed app reads this file from **Library/Application Support/mochi-desktop-pet**. It does not read a `.env` beside the downloaded ZIP or inside Applications. Keep the certificate private; do not include it in screenshots or support reports.

The conversation helper is included in the packaged app. You do not need to install Cloudflare separately. While chatting, the app uses a temporary authenticated Cloudflare connection so Agora can save tasks locally. Your network must allow Agora and Cloudflare connections. Voice and conversation data are processed by Agora and its model providers; task tool requests pass through Cloudflare. This preview uses development tunnels whose availability is not guaranteed.

## 4. Try a conversation

1. Click **Talk** below Spider-Man.
2. Allow microphone access when macOS asks. If previously denied, enable Mochi under **System Settings → Privacy & Security → Microphone**, then restart the app.
3. Select **English** or **हिन्दी**. Changing languages ends the current chat; click Talk again.
4. Choose your microphone in the banner. Confirm the input meter moves while you speak.
5. Say **“Remind me to drink water in ten minutes.”**
6. Look for **Heard:** and then **Saved:**. A saved receipt confirms that the reminder was actually created.
7. Click **End chat** to turn off microphone capture.

You can also type in the message field during a conversation. If you do not specify a reminder time, the assistant asks for one.

## Everyday controls

- **Adjust the web:** drag Spider-Man or the thread up or down. The position is saved.
- **Show/hide the banner:** click his hand.
- **Open tasks and settings:** click the gear below him.
- **Mute speech:** click the speaker button.
- **Quit completely:** click the power button or choose **🌱 menu bar → Quit Spidey**. Closing the dashboard leaves reminders running.

Reminders require the app to be running. It does not automatically open at login. After sleep, overdue reminders are delivered when the app resumes.

## Updating and removing the app

To update, fully quit Mochi, download the newer app ZIP, and replace **Mochi.app** in Applications. Tasks, settings, and credentials are stored separately and are retained. There is no automatic updater in this preview.

To uninstall, quit the app and move **Mochi.app** from Applications to the Trash. To also erase local tasks, history, settings, and credentials, use Finder → Go → Go to Folder and open `~/Library/Application Support/mochi-desktop-pet`, then delete that folder. Only delete it if you intend to remove your saved data.

## If something does not work

| Symptom | What to check |
| --- | --- |
| Download contains source files | Download the release's app ZIP rather than “Source code”. |
| App cannot run on this Mac | Check Apple Silicon and macOS 13+ requirements. |
| Voice says credentials are missing | Check the exact `.env` location above and restart the app. |
| Microphone meter stays flat | Select another input, check hardware mute, and check macOS microphone permission. |
| Speech is recognized but no task is saved | Include a time; check the displayed Agora/task connection error and network access. |
| Cannot hear a reply | Unmute the app and check Mac output volume/device. |
| Old behavior after an update | Fully quit the existing process before opening the replacement app. |

When reporting a problem, include your app version, Mac chip, macOS version, and the visible error. Never include your App Certificate or full `.env` file.

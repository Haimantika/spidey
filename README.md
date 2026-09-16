# Spidey — your friendly neighborhood desktop companion

Spider-Man lowers from the top-center notch on a web, chats in **English or Hindi**, and remembers tasks you ask for. Agora handles speech recognition, conversation, tool calling, and spoken replies.

## Run

```sh
npm install
npm run setup:conversation
npm run desktop
```

The conversation helper downloads Cloudflare’s official `cloudflared` binary and verifies its published SHA-256 checksum. It is already installed in this workspace. Node.js 22.12+ is required.

Configure your existing `.env`:

```dotenv
AGORA_APP_ID=your_project_app_id
AGORA_APP_CERTIFICATE=your_project_app_certificate
AGORA_PIPELINE_ID=
AGORA_AREA=us
```

Enable Conversational AI and managed-model access in your Agora project. Keep the certificate private. **Fully quit and restart the app after changing `.env`.**

## Talk to Spider-Man

1. Click **Talk** below Spider-Man, or **Talk to Spider-Man** in the dashboard.
2. Allow microphone access when macOS asks.
3. Choose **English** or **हिन्दी** in the bubble or Voice & settings. Changing language ends the current conversation; tap Talk again.
4. Speak naturally:
   - “Remind me to call Amma in ten minutes.”
   - “What tasks do I have?”
   - “Mark the call to Amma as done.”
   - “Snooze that task for fifteen minutes.”
   - “मुझे दस मिनट में पानी पीने की याद दिलाना।”
5. A **Saved** receipt appears only when the task has actually been saved. If you omit the time, the agent should ask when.
6. Click **End chat** to close the microphone immediately. You can also type during a conversation.

Conversations can be interrupted by speaking. The agent uses Agora-managed Deepgram Nova 3, OpenAI GPT-4o mini, and MiniMax Speech 2.6 Turbo. Hindi uses multilingual recognition for Hindi/English code-switching and a Hindi conversation prompt. Reminder text is localized too. No separate provider keys are required for this configuration.

The optional `AGORA_PIPELINE_ID` is used only for English reminder-only playback. Interactive conversations use the app’s own configuration so task tools and language settings are always included.

## Tasks and reminders

- Voice-created tasks and manually added tasks use the same persistent scheduler.
- A pending task repeats every 30 minutes until completed.
- Water, walking, and eye-break intervals are editable.
- Five-minute snooze, one-hour pause, speaker mute, and volume controls remain available.
- Sleep recovery emits one catch-up reminder per overdue item.
- Reminders keep running with the dashboard closed, while the app is running.
- Quit using the **power button below Spider-Man** or **🌱 menu bar → Quit Spidey**. The existing application name and storage location remain Mochi so previous tasks migrate automatically.

## How task creation works

Agora’s LLM calls a narrowly scoped `manage_tasks` REST tool. A session-specific bearer token authenticates each call. The local Electron process validates task names, reminder times, and task IDs, saves the result atomically, and returns the actual result to Agora before it confirms the action.

During a conversation, the app creates a temporary Cloudflare Quick Tunnel to an ephemeral loopback server exposing **only** the authenticated `/tasks` endpoint. It does not serve files or credentials. Task arguments and tool results travel through Cloudflare and Agora. Duplicate tool-call IDs do not create duplicate tasks. The endpoint and tunnel close when the session ends. Quick Tunnels are intended for personal development, have no availability guarantee, and should be replaced with a managed authenticated backend for production distribution.

The microphone is off until you start a conversation and is closed on End chat, disconnect, language changes, or session timeout. Sessions end after 15 minutes; Agora can end an idle session earlier. Conversation captions are held in memory, not written to the task file. Agora and its model providers process the voice and conversation data.

The certificate remains in Electron’s main process. Tasks and settings are stored locally in Electron’s user-data directory. Existing Mochi settings migrate to Spider-Man without losing tasks. `.env` is not packaged.

## Test and build

```sh
npm run check
npm run test:desktop
npm run package
```

Automated checks cover scheduler behavior, migration, English/Hindi configuration, Agora tool execution flags, callback authentication, idempotency, invalid dates, completion, snoozing, safe errors, and lifecycle cleanup. Desktop checks use an isolated temporary profile and verify actual notch placement, reminders, persistence, language synchronization, and transparency.

Optional **live** tests use your configured Agora credentials and consume service usage:

```sh
node tests/live-conversation.mjs
node tests/live-conversation.mjs --hindi
node tests/live-desktop-conversation.mjs
```

The first two test the real Agora LLM → authenticated callback → scheduled task path with an isolated in-memory task list. The desktop test injects the included synthetic speech fixture into a Web Audio stream (hardware capture is blocked in the test), verifies ASR → task creation, and checks that End chat stops all input tracks. They never write to your actual tasks.

`npm run package` creates an unsigned macOS app under `release/mac-arm64/Mochi.app`, including the installed conversation helper. Packaged apps read `.env` from their user-data directory; `npm run desktop` reads the project’s `.env`.

## Troubleshooting

- **Opus / G722 BUNDLE codec collision:** restart the updated build. A scoped audio SDP compatibility adapter aligns known bundled Opus parameters and removes misplaced Opus attributes from fallback audio codecs. Regression checks inspect native Electron warnings as well as API errors.
- **Connected but no conversation:** after Talk, expect a spoken greeting. Use the microphone dropdown in the pet bubble (for example, choose Insta360 instead of the built-in microphone when using an external setup). The input meter should move when you speak; “Heard” shows Agora’s recognized words. If the meter stays flat, check the selected device and its mute switch. You can also type a request with a time to check task creation independently of microphone input.
- **Microphone denied:** enable the app in System Settings → Privacy & Security → Microphone, then restart.
- **Conversation helper missing:** run `npm run setup:conversation`.
- **Task connection failed:** check Internet/firewall access to Cloudflare and Agora, end the session, and reconnect.
- **Agora error:** the app displays a redacted API status and error reason. Verify Conversational AI and managed-model access for the configured project.
- **Browser preview:** `npm run dev` previews the design and local task controls. Native notch placement, microphone conversations, and background reminders require `npm run desktop`.

See [Agora research and architecture](docs/AGORA.md).

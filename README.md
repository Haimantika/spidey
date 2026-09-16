# Mochi 🌱

A little desktop friend for a gentler workday. Mochi lives in a transparent, draggable, always-on-top window and gently reminds you to drink water, move, rest your eyes, and finish pending tasks. Its spoken reminders are delivered through **Agora Conversational AI and Agora RTC**.

## Run

Requires Node.js 22.12+ and npm. Developed and desktop-tested on macOS.

```sh
npm install
npm run desktop
```

The dashboard and floating pet open together. Closing the dashboard keeps the pet and reminders running. Use the **🌱 menu bar → Quit Mochi** to fully quit. Drag the pet itself to move it. Hover above it for dashboard and mute controls.

For a browser-only visual preview:

```sh
npm run dev
```

The browser preview has local reminders and tasks while the page is open. True desktop overlay, OS notifications, background scheduling, and Agora voice require the desktop app.

## Connect Agora voice

1. Create a project in the [Agora Console](https://console.agora.io/). Enable **Conversational AI**, confirm the project is eligible for managed models, and enable an App Certificate.
2. Copy the template locally:

   ```sh
   cp .env.example .env
   ```

3. Fill `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` in `.env`. Keep the certificate private. Restart Mochi after changing configuration.
4. Open **Voice & settings → Say hello with Agora**. Mochi connects to a short-lived RTC channel and speaks. A missing credential or connection error is displayed in the app.

The default agent uses Agora-managed Deepgram Nova 3, OpenAI GPT-4o mini, and MiniMax Speech 2.6 Turbo. Managed-model access and usage are governed by your Agora account; no separate vendor keys are configured in this default path. This is not browser speech synthesis.

### Optional: use your own Agent Studio voice

Publish a **cascade** agent in [Agora Agent Studio](https://console.agora.io/studio/) and put its ID in `AGORA_PIPELINE_ID`. Configure its TTS voice, disable its opening greeting, and disable automatic silence/filler announcements. This uses your published pipeline instead of the default models. Do **not** use an MLLM/realtime speech-to-speech pipeline: Agora’s `/speak` endpoint requires the TTS module.

`AGORA_AREA` accepts `us` (default), `eu`, or `ap` for API routing. It does not by itself guarantee data residency.

### What is sent to Agora?

Only a triggered reminder’s text is sent to the agent. The app does not request microphone permission or publish microphone audio. The renderer receives the App ID and a short-lived, channel-scoped RTC token; the App Certificate stays in the local Electron main process. Local reminders and task titles are stored in `reminders.json` under Electron’s user-data directory.

A voice session starts on demand, plays audio through RTC, and stops after speech becomes quiet. It also has idle and hard cleanup timers. Voice errors leave the visual reminder available. While offline, text nudges and native notifications continue to work while the app is running.

## Features

- Three animated companions: mint **Mochi**, peach **Peaches**, lavender **Nimbus**.
- Water, movement, and eye-break reminders with editable 1–1440 minute intervals.
- Tasks with an initial reminder time, then 30-minute repeat nudges until completed.
- Five-minute snooze, one-hour pause, mute, and volume controls.
- Local persistence and recent reminder history.
- One catch-up nudge per due item after sleep, without replaying missed intervals.
- Transparent floating pet, native notifications, and a menu-bar shortcut.
- Speaking animation driven by the real remote audio volume.
- Reduced-motion support and keyboard-accessible controls.

## Verification

```sh
npm run check          # Scheduler and Agora integration unit tests, TypeScript, production build
npm run test:desktop   # launches Electron with an isolated temporary profile; no live Agora calls
```

Desktop tests cover both windows, persistence across reload, task completion, interval editing, missing-credential feedback, scheduled delivery, snoozing, pause, and live pet appearance synchronization. Screenshots are saved to `docs/screenshots/`.

Live Agora agent creation and desktop speech reception were verified on September 16, 2026 using locally configured credentials. The isolated desktop check observed Connecting → Voice connected → Speaking → Voice ready. Automated tests also verify generated requests, token generation, lifecycle cleanup after failed starts, redacted diagnostics, and payload limits.

If voice fails, fully quit Mochi and restart with `npm run desktop`. The app now displays the API status and a redacted error reason. Optional diagnostics: `node tests/diagnose-voice.mjs` checks a real start/stop; `node tests/diagnose-desktop-voice.mjs` plays one real spoken reminder in an isolated desktop profile. Both use your local `.env` and consume Agora service usage.

## Package locally

```sh
npm run package
```

This produces an unpacked app in `release/`; it is not a signed or notarized release. Packaged apps read `.env` from their Electron user-data directory (typically `~/Library/Application Support/Mochi/` on macOS; development usually uses `mochi-desktop-pet/`). `.env` is excluded from packaging. For distributing an app with your own shared Agora credentials, move the voice service to an authenticated backend instead of shipping a certificate.

## Implementation

- `src/App.tsx`, `src/Pet.tsx`, `src/styles.css`: React dashboard, original animated SVG pet, floating UI.
- `electron/main.mjs`: windows, tray, notifications, persistence, validated IPC.
- `electron/reminders.mjs`: pure reminder state and scheduling.
- `electron/voice.mjs`: Agora agent lifecycle and token generation.
- `src/voice.ts`: Agora RTC subscription and playback; no microphone.
- [Agora research and architecture](docs/AGORA.md).

Reminders require Mochi to be running. OS notification permissions and Focus settings may affect notification banners. Pending work is entered manually; external calendar/task integrations and voice commands are not implemented.

# Agora: research and implementation decisions

Research checked September 16, 2026 against Agora’s official documentation and the installed `agora-agents` 2.8.1 SDK.

## What Agora does

Agora supplies real-time audio/video transport and a managed Conversational AI orchestration layer. A client and AI agent join the same RTC channel. The agent can transcribe incoming speech, pass the text to an LLM, synthesize the response through a TTS provider, and stream its audio back to the client. Agora’s real-time network handles delivery; the chosen TTS model determines the sound of the voice. Agora is not itself an LLM training service. [Product overview](https://www.agora.io/en/products/conversational-ai-engine/)

This matters for Mochi: “voice from Agora” means the voice is orchestrated by Agora and delivered over its RTC network. The default audible voice is MiniMax, accessed through Agora-managed credentials. Other voice providers can be selected through a published Agent Studio pipeline.

## Why reminders use `speak`

A scheduled reminder already has exact text. We do not ask an LLM to invent the reminder. The agent’s `say()` method calls the `/speak` API, which sends text directly through the TTS module. The message limit is 512 UTF-8 bytes. Priority can interrupt, append after the current interaction, or be ignored if the agent is busy. Mochi uses `APPEND` with `interruptable: false` and serializes reminders locally. MLLM configurations do not support this endpoint. [Broadcast a message using TTS](https://docs.agora.io/en/api-reference/api-ref/conversational-ai/speak)

## Architecture

```text
Electron main process
  persisted local state → scheduler → pet bubble + native notification
                                  ↓
                       Agora agent session + short-lived tokens
                                  ↓ IPC (no certificate)
Floating pet renderer → joins RTC channel → subscribes to agent audio
                                  ↑
Agora Conversational AI → /speak → managed TTS → RTC audio
```

The renderer joins first, the agent joins second, then the app waits for remote audio publication before sending the reminder. Remote audio levels drive the mouth animation. No microphone track is created. Sessions stop after the audio has been quiet for a short interval; local and server idle deadlines provide cleanup safeguards. The app also attempts cleanup on quit. Starting sessions per reminder trades some connection latency for avoiding an always-running AI agent. Agora describes this server-start/client-join/stop lifecycle in its [start and stop guide](https://docs.agora.io/en/ai/build/start-stop-agent).

## Managed models and authentication

The TypeScript Agent SDK can infer supported managed presets from provider configurations when vendor keys are omitted. In version 2.8.1, final preset resolution occurs in `AgentSession.start()`, after `Agent.toProperties()`. A test intercepts the actual SDK request and verifies the expected Deepgram, OpenAI, and MiniMax presets. Optional `pipeline_id` selects a published Studio configuration. [Official TypeScript SDK](https://github.com/AgoraIO/agora-agents-ts)

REST authentication and RTC membership are separate concerns. The SDK creates REST authentication tokens from the App ID and Certificate; the client receives a separate expiring RTC token bound to a randomized channel and its own numeric UID. Agent UID `101` and client UID `100` remain distinct. Agora recommends keeping authentication on the server. For this personal desktop app that trusted role is the local main process; a distributed product using shared credentials should use a remote authenticated backend. [RESTful authentication](https://docs.agora.io/en/api-reference/api-ref/conversational-ai/authentication)

## Desktop behavior

Electron provides the transparent always-on-top pet window, drag regions, native notifications, and a separate dashboard. The scheduler runs in the main process; closing the dashboard does not stop reminders. Renderer background throttling is disabled for audio responsiveness. [Electron BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window)

## Scope and verification limits

- Live agent creation and desktop speech reception were verified on September 16, 2026 with locally configured credentials. The test detected remote speech volume and successful completion. This does not measure perceived voice quality or guarantee service availability.
- The app clearly reports missing credentials and network failures; it does not substitute a local synthetic voice while labeling it Agora.
- Voice here is outbound reminder speech. Listening, conversational replies, external task synchronization, and voice-driven task completion are future features.
- Browser preview is a convenience for the design. Native window behavior and reliable background scheduling belong to the Electron app.

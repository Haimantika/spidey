# Agora conversation architecture

## Voice flow

The pet renderer joins an Agora RTC channel, publishes a microphone track only after Talk is selected, subscribes to the agent’s audio, and plays its responses. Agora-managed Deepgram Nova 3 performs recognition, GPT-4o mini handles conversation, and MiniMax Speech 2.6 Turbo synthesizes speech. English uses `en-IN` recognition; Hindi uses `multi` for Hindi/English code-switching and Hindi turn detection. The system prompt controls the reply language. [Agora start/stop guide](https://docs.agora.io/en/ai/build/start-stop-agent), [Deepgram language support](https://developers.deepgram.com/docs/models-languages-overview), [MiniMax language support](https://platform.minimax.io/docs/api-reference/api-overview)

## Real task tools

The agent declares `llm.tools` with a synchronous POST endpoint and explicitly sets `advanced_features.enable_tools=true`. Without that flag, an agent can describe a tool action without executing it. The implementation verifies actual callback results and shows Saved only after local persistence succeeds. Agora introduced this REST tool interface in v2.12. [Agora release notes](https://github.com/AgoraIO/docs-portal/blob/main/content/docs/en/ai/release-notes.mdx)

```text
Microphone → Agora RTC → Agora ASR → Agora LLM
                                      ↓ manage_tasks
                         authenticated HTTPS callback
                                      ↓
                      local validation → saved task → result
                                      ↓
                   Agora LLM confirmation → TTS → RTC speaker

Saved task → local scheduler → native notification + notch bubble
                                      ↓
                              Agora /speak → TTS
```

The callback exposes only add/list/complete/snooze. Tool arguments are validated independently of the model. Absolute times require an explicit timezone, relative times are interpreted locally, duplicate callback IDs reuse the saved result, and tool replies include real task IDs. The list tool supplies current time and timezone for date reasoning. Task titles remain untrusted data in the agent prompt.

## Local callback transport

Cloudflare Quick Tunnel provides a temporary public HTTPS address for the ephemeral loopback server. A fresh 256-bit bearer secret authenticates requests; it is sent only to Agora’s tool configuration. The server has body limits, a request timeout, rate limiting, and no file-serving route. Session termination closes the server and the tunnel. Quick Tunnels have no uptime guarantee and are appropriate for this personal development app; distribution should use a durable authenticated backend. [Cloudflare Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/)

## Conversation lifecycle

The user can interrupt spoken responses naturally. Typed messages use Agora’s `/think` endpoint with explicit interruption behavior; they follow the same LLM/tool path as speech. Recent transcript messages are fetched from Agora’s history API while a conversation is active and held only in memory. [Custom instructions](https://docs.agora.io/en/api-reference/api-ref/conversational-ai/think)

End chat closes the microphone immediately, then stops RTC, the agent, and the callback. Disconnect, language changes, and the 15-minute session limit also end capture. Scheduled reminders reuse an active session or create a short reminder-only session. `/speak` broadcasts known reminder text directly through TTS without asking the LLM to create another task. [Agora TTS broadcast](https://docs.agora.io/en/api-reference/api-ref/conversational-ai/speak)

## Desktop design

The reference screenshot places a character below the notch and a bubble beside it. The new original SVG illustration shows Spider-Man hanging upside down from a web, with descent, sway, blinking, and speech-reactive animation. Electron’s transparent panel is anchored to the primary display’s top center and repositions after display metrics change. Noninteractive transparent areas pass pointer events through. A visible Talk/End chat button and a power button keep microphone and app lifecycle accessible.

## Verification

Live English and Hindi requests have been verified to create actual scheduled tasks through Agora’s tool callback. An isolated desktop test also passed synthetic speech → Agora ASR → LLM tool call → saved reminder and verified that End chat stopped the input tracks. Local tests cover authentication, duplicate requests, validation, migration, scheduling, and agent configuration. Desktop tests check real top-edge placement, transparent rendering, saved tasks, snoozing, and language synchronization. Live tests use isolated state, not the user’s task store. Model interpretation and accent quality are not deterministic; the app shows the saved task so users can verify its title and time.

## Electron codec compatibility

`src/audio-sdp.mjs` repairs known Agora audio format-parameter inconsistencies before local/remote descriptions reach WebRTC. It aligns non-conflicting Opus attributes across a BUNDLE group and removes misplaced Opus attributes from fallback audio codecs, including G722, PCMU and PCMA. It leaves unknown/contradictory parameters, video, ICE and DTLS unchanged. This is a compatibility workaround, to revisit with SDK/runtime upgrades.

`node tests/desktop-audio-negotiation.mjs` reproduces native Opus, G722, PCMU and PCMA collision diagnostics with generated SDP and checks repaired descriptions without capturing microphone audio. Native warnings must be checked: these collisions do not necessarily reject the JavaScript negotiation promise.

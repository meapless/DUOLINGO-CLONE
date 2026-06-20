---
name: Agent
description: Use when building real-time voice and video AI agents, deploying conversational AI to production, integrating with multiple AI providers, adding function calling and tool use, or scaling agents across multiple servers. Agents handle speech-to-speech conversations, video analysis, tool execution, and real-time interactions with sub-50ms latency.
metadata:
    mintlify-proj: agent
    version: "1.0"
---

# Vision Agents Skill

## Product Summary

Vision Agents is a Python framework for building real-time voice and video AI agents. It orchestrates LLMs, speech-to-text, text-to-speech, video processors, and external tools into conversational agents that run on Stream's edge network or your own infrastructure. Key files: `main.py` (agent definition), `.env` (API keys), `pyproject.toml` (dependencies). CLI commands: `uv run agent.py run` (console mode), `uv run agent.py serve` (HTTP server). Supports 30+ provider integrations (OpenAI, Gemini, Deepgram, ElevenLabs, etc.). Primary docs: https://visionagents.ai

## When to Use

Reach for this skill when:
- **Building voice agents** — Real-time conversational AI that users talk to via phone, browser, or WebRTC
- **Adding video understanding** — Agents that see and analyze video frames in real time
- **Deploying to production** — Running agents as HTTP servers, scaling across multiple nodes, monitoring with metrics
- **Integrating tools** — Registering functions or MCP servers so agents can call APIs, databases, or external services
- **Testing agent behavior** — Verifying tool calls, responses, and intent without spinning up audio/video infrastructure
- **Choosing AI providers** — Swapping between LLMs, STT, TTS, or realtime models without rewriting agent logic
- **Handling complex conversations** — Multi-speaker audio, interruption handling, turn detection, chat memory

## Quick Reference

### Project Setup

```bash
# Initialize with uv
uv init --python 3.12 my-agent && cd my-agent

# Add plugins (only what you need)
uv add "vision-agents[getstream,gemini]"           # Realtime voice
uv add "vision-agents[getstream,gemini,deepgram,elevenlabs]"  # Custom pipeline
uv add "vision-agents[getstream,gemini,ultralytics]"  # Video + YOLO
```

### Core Agent Structure

```python
from vision_agents.core import Agent, AgentLauncher, User, Runner
from vision_agents.plugins import getstream, gemini

async def create_agent(**kwargs) -> Agent:
    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Assistant", id="agent"),
        instructions="You're a helpful voice assistant.",
        llm=gemini.Realtime(),  # or gemini.LLM() for custom pipeline
    )

async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)
    async with agent.join(call):
        await agent.simple_response("Greet the user")
        await agent.finish()

if __name__ == "__main__":
    Runner(AgentLauncher(create_agent=create_agent, join_call=join_call)).cli()
```

### CLI Commands

| Command | Purpose |
|---------|---------|
| `uv run agent.py run` | Console mode — single agent, browser UI |
| `uv run agent.py serve` | HTTP server mode — spawn agents on demand |
| `uv run agent.py serve --host 0.0.0.0 --port 8000` | Bind to all interfaces |
| `uv run agent.py run --video-track-override=/path/to/video.mp4` | Test with local video file |

### Agent Constructor Parameters

| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| `edge` | EdgeTransport | Yes | Transport layer (usually `getstream.Edge()`) |
| `llm` | LLM/AudioLLM/Realtime | Yes | Language model or realtime model |
| `agent_user` | User | Yes | Agent identity (name, id) |
| `instructions` | str | No | System prompt; supports `@file.md` for loading from files |
| `stt` | STT | No | Speech-to-text (skip for realtime models) |
| `tts` | TTS | No | Text-to-speech (skip for realtime models) |
| `processors` | List[Processor] | No | Video/audio processors (YOLO, custom ML) |
| `mcp_servers` | List[MCPServer] | No | External tool servers |
| `avatar` | Avatar | No | Lip-synced visual character |
| `turn_detection` | TurnDetector | No | Custom turn detection (auto-skipped if STT has built-in) |

### HTTP Server Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/calls/{call_id}/sessions` | Start agent session |
| DELETE | `/calls/{call_id}/sessions/{session_id}` | Close session |
| GET | `/calls/{call_id}/sessions/{session_id}` | Get session info |
| GET | `/calls/{call_id}/sessions/{session_id}/metrics` | Real-time metrics |
| GET | `/health` | Liveness check |
| GET | `/ready` | Readiness check |

### Agent Response Methods

```python
# Generate response via LLM, speak via TTS
await agent.simple_response("What's the weather?", interrupt=True)

# Speak directly, bypass LLM
await agent.say("Welcome!", interrupt=False)

# Check idle time
idle_seconds = agent.idle_for()
on_call_seconds = agent.on_call_for()
```

### Function Calling

```python
@llm.register_function(description="Get weather for a location")
async def get_weather(location: str) -> dict:
    return {"temp": "22C", "condition": "Sunny"}

# LLM calls automatically when relevant
response = await llm.simple_response("What's the weather in London?")
```

## Decision Guidance

### Realtime vs Custom Pipeline

| Aspect | Realtime Model | Custom Pipeline |
|--------|---|---|
| **Setup** | Simplest — one LLM | More config — STT + LLM + TTS |
| **Latency** | Lowest (native speech-to-speech) | Slightly higher (separate components) |
| **Control** | Less — model handles STT/TTS | Full — pick each provider |
| **Providers** | OpenAI, Gemini, Qwen, xAI, Inworld | Any LLM + any STT + any TTS |
| **Use case** | Quick prototypes, demos | Production, specific provider needs |

**Choose Realtime if:** You want the fastest path and don't need specific STT/TTS providers.  
**Choose Custom if:** You need Deepgram STT + Gemini LLM + ElevenLabs TTS, or have provider preferences.

### Video Processing Approaches

| Approach | Best For | How It Works |
|----------|----------|-------------|
| **Realtime Video** | Lowest latency | WebRTC/WebSocket direct to model (fps parameter) |
| **VLMs** | Video understanding | Frame buffering + chat API (Moondream, NVIDIA Cosmos) |
| **Processors** | Computer vision | YOLO detection, pose estimation, custom ML pipelines |

**Choose Realtime if:** You need sub-100ms latency and the model supports native video.  
**Choose VLM if:** You need video understanding without custom ML.  
**Choose Processors if:** You need object detection, pose estimation, or custom ML alongside the LLM.

### Deployment Scale

| Scale | Approach | Key Setup |
|-------|----------|-----------|
| **Local dev** | Console mode (`uv run agent.py run`) | No extra config |
| **Single container** | HTTP server + Docker | `Dockerfile`, environment variables |
| **Multiple replicas** | HTTP server + Redis registry | `SessionRegistry` with Redis backend |
| **Kubernetes** | Helm chart + Prometheus | Full monitoring, auto-scaling, health probes |

**Choose HTTP server if:** You need to spawn multiple agents per call or scale horizontally.  
**Choose console mode if:** You're testing locally or running a single agent.

### RAG Options

| Option | Setup | Best For |
|--------|-------|----------|
| **Gemini File Search** | Simple — `GeminiFilesearchRAG` | Quick prototypes, automatic chunking |
| **TurboPuffer** | More setup — hybrid search config | Production, full control, custom chunking |

## Workflow

### 1. Build a Basic Agent

1. **Initialize project** — `uv init --python 3.12 my-agent && cd my-agent`
2. **Add plugins** — `uv add "vision-agents[getstream,gemini]"`
3. **Create `.env`** — Add `STREAM_API_KEY`, `STREAM_API_SECRET`, `GOOGLE_API_KEY`
4. **Write `main.py`** — Define `create_agent()` and `join_call()` functions
5. **Test locally** — `uv run main.py run` (opens browser UI)
6. **Verify** — Talk to agent, check console logs for errors

### 2. Add Function Calling

1. **Register function** — Use `@llm.register_function(description="...")` decorator
2. **Make it async** — All registered functions must be `async def`
3. **Test with TestSession** — Use `vision_agents.testing.TestSession` to verify tool calls
4. **Check events** — Subscribe to `ToolStartEvent` and `ToolEndEvent` for debugging

### 3. Deploy to Production

1. **Choose deployment** — Single container or multi-node?
2. **Create Dockerfile** — Use CPU or GPU template from docs
3. **Set environment variables** — Create `.env` or Kubernetes secret
4. **Run HTTP server** — `uv run agent.py serve --host 0.0.0.0 --port 8000`
5. **Add monitoring** — Enable OpenTelemetry for metrics (Prometheus + Grafana)
6. **Scale if needed** — Add Redis `SessionRegistry` for multi-node deployments

### 4. Test Agent Behavior

1. **Import TestSession** — `from vision_agents.testing import TestSession, LLMJudge`
2. **Create test** — Wrap LLM in `async with TestSession(llm=llm, instructions="...") as session:`
3. **Send input** — `response = await session.simple_response("user input")`
4. **Assert tool calls** — `response.assert_function_called("tool_name", arguments={...})`
5. **Judge intent** — Use `LLMJudge` to evaluate response quality
6. **Run tests** — `uv run pytest tests/ -m integration`

## Common Gotchas

- **Realtime models don't use STT/TTS** — If using `openai.Realtime()` or `gemini.Realtime()`, omit `stt` and `tts` parameters. The framework auto-disables them.
- **Registered functions must be async** — Passing a sync function to `@llm.register_function()` raises `ValueError`. Always use `async def`.
- **STT with built-in turn detection** — Deepgram and ElevenLabs STT include turn detection. If you pass both STT and a separate `TurnDetector`, the STT's built-in detector takes precedence.
- **Multi-speaker audio defaults to first speaker** — `FirstSpeakerWinsFilter` locks onto the first active speaker and drops other participants. Override with `multi_speaker_filter` parameter if needed.
- **Session limits prevent runaway costs** — Set `max_session_duration_seconds` and `max_concurrent_sessions` on `AgentLauncher` to prevent long-running or duplicate sessions.
- **Custom FastAPI app skips defaults** — If you pass `ServeOptions(fast_api=app)`, the Runner won't register default endpoints (`/health`, `/calls/...`). You must add them yourself.
- **Video override loops at 30 FPS** — When using `--video-track-override`, the local video file plays in a loop. Useful for reproducible testing but not for production.
- **Metrics endpoint returns 202 Accepted** — Close operations (DELETE, POST `/close`) are async. The session closes on the next maintenance cycle, not immediately.
- **Instructions support file references** — Use `instructions="@system.md"` to load from a markdown file. Relative to the working directory.
- **MCP servers require async functions** — All tool implementations must be `async`. Sync functions will fail silently or raise errors.

## Verification Checklist

Before submitting agent code:

- [ ] **API keys set** — All required keys in `.env` or environment variables
- [ ] **Agent joins call** — `create_agent()` returns an Agent, `join_call()` joins and responds
- [ ] **No sync functions** — All registered functions and MCP tools are `async def`
- [ ] **STT/TTS skipped for realtime** — If using `Realtime()` model, no `stt` or `tts` parameters
- [ ] **Turn detection configured** — If using custom STT without built-in detection, pass `turn_detection` parameter
- [ ] **Session limits set** — `max_concurrent_sessions`, `max_session_duration_seconds` configured for production
- [ ] **Metrics enabled** — OpenTelemetry exporter configured if monitoring required
- [ ] **Tests pass** — `pytest` runs without errors, tool calls verified
- [ ] **Docker builds** — `docker buildx build --platform linux/amd64 -t agent .` succeeds
- [ ] **Health endpoints respond** — `GET /health` and `GET /ready` return 200 OK
- [ ] **Logs are clean** — No warnings about missing plugins or deprecated patterns

## Resources

**Comprehensive navigation:** https://visionagents.ai/llms.txt

**Critical pages:**
- [Quickstart](/introduction/quickstart) — 5-minute setup with Gemini Realtime
- [Voice Agents](/introduction/voice-agents) — Custom STT/LLM/TTS pipelines and function calling
- [HTTP Server](/guides/http-server) — API endpoints, session management, authentication

---

> For additional documentation and navigation, see: https://visionagents.ai/llms.txt
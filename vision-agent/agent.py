import asyncio
import logging

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.plugins import gemini, getstream

load_dotenv()
logging.basicConfig(level=logging.INFO)

BASE_INSTRUCTIONS = """
You are Lingua, a warm and energetic AI language teacher having a real spoken conversation with a beginner.

Core rules — follow every one on every turn:
- Speak English almost all the time. Only switch to the target language to say or demonstrate a word or phrase.
- Introduce target-language words one at a time. Say the word clearly, then immediately give the English meaning — for example: "The word is 'hola' — and that just means 'hello'!"
- Keep every reply to one or two conversational sentences. Never lecture or list things out.
- Use contractions naturally: "you're", "let's", "it's", "don't", "that's", "we've".
- After introducing a word or phrase, ask the student to try it — something like "Can you give that a try?" or "Go ahead and say it back to me!"
- When the student responds, acknowledge them warmly — praise the effort even if the pronunciation isn't perfect — then move gently forward.
- If something was off, correct it kindly and briefly: "Almost! Try saying 'X' — you've so got this."
- Stay strictly inside this lesson's goals, vocabulary, and phrases. Do not teach unrelated grammar, extra vocabulary, or anything outside the lesson scope.
- Never quiz or give a list. Teach only through natural, friendly back-and-forth conversation.
"""


def _build_instructions(context: dict) -> str:
    """Build a lesson-aware system prompt from the session context."""
    language_code = context.get("language_code") or ""
    lesson_title = context.get("lesson_title") or ""
    goals = context.get("goals") or []
    vocabulary = context.get("vocabulary") or []
    phrases = context.get("phrases") or []
    ai_prompt = context.get("ai_teacher_prompt") or {}

    persona = ai_prompt.get("persona", "") if isinstance(ai_prompt, dict) else ""
    objective = ai_prompt.get("objective", "") if isinstance(ai_prompt, dict) else ""
    starters = ai_prompt.get("conversationStarters", []) if isinstance(ai_prompt, dict) else []

    parts = [BASE_INSTRUCTIONS]

    if language_code:
        parts.append(f"\nTarget language: {language_code.upper()}")
    if lesson_title:
        parts.append(f"Today's lesson: {lesson_title}")
    if persona:
        parts.append(f"\nPersona: {persona}")
    if objective:
        parts.append(f"Objective: {objective}")
    if goals:
        parts.append("\nLearning goals:\n" + "\n".join(f"- {g}" for g in goals if isinstance(g, str)))
    if vocabulary:
        vocab_lines = [
            f"- {v.get('word', '')}: {v.get('translation', '')}"
            for v in vocabulary
            if isinstance(v, dict)
        ]
        if vocab_lines:
            parts.append("\nVocabulary to cover:\n" + "\n".join(vocab_lines))
    if phrases:
        phrase_lines = [
            f"- {p.get('text', '')}: {p.get('translation', '')}"
            for p in phrases
            if isinstance(p, dict)
        ]
        if phrase_lines:
            parts.append("\nPhrases to practice:\n" + "\n".join(phrase_lines))
    if starters:
        parts.append("\nSuggested conversation openers:\n" + "\n".join(f"- {s}" for s in starters if isinstance(s, str)))

    return "\n".join(parts)


async def create_agent(**kwargs) -> Agent:
    instructions = _build_instructions(kwargs)
    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Lingua Teacher", id="lingua-teacher"),
        instructions=instructions,
        llm=gemini.Realtime(),
    )


async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)

    ai_prompt = kwargs.get("ai_teacher_prompt") or {}
    starters = ai_prompt.get("conversationStarters", []) if isinstance(ai_prompt, dict) else []
    lesson_title = kwargs.get("lesson_title") or "today's lesson"

    opening_prompt = (
        f"Welcome the student to today's {lesson_title} lesson with genuine enthusiasm. "
        "In one or two short sentences, tell them one exciting thing they'll be able to say by the end. "
        "Then ask if they're ready to jump in. Be warm, human, and use contractions."
    )
    if starters:
        first_starter = starters[0]
        opening_prompt += (
            f' Once they say yes, kick off the lesson naturally — you can start with something like: "{first_starter}"'
        )

    async with agent.join(call):
        # Patch conversation.upsert_message so that each *completed* transcript
        # is also sent as a Stream Video custom event. The mobile app listens for
        # these and displays Gemini's own accurate transcripts instead of relying
        # on Stream's server-side re-transcription (which garbles synthesised audio).
        conv = agent.conversation
        if conv is not None:
            _orig_upsert = conv.upsert_message

            async def _send_transcript_event(role: str, user_id: str, text: str, msg_id: str) -> None:
                try:
                    await agent.send_custom_event({
                        "type": "transcript",
                        "role": role,
                        "speaker_id": user_id,
                        "msg_id": msg_id,
                        "text": text,
                    })
                except Exception as exc:
                    logging.debug("Custom transcript event skipped: %s", exc)

            async def _upsert_with_event(
                role, user_id, content="", message_id=None,
                content_index=None, completed=True, replace=False, original=None,
            ):
                result = await _orig_upsert(
                    role=role, user_id=user_id, content=content,
                    message_id=message_id, content_index=content_index,
                    completed=completed, replace=replace, original=original,
                )
                if completed and content:
                    # Fire-and-forget so we never block the transcript hot path.
                    msg_id = (result.id if result else None) or message_id or ""
                    asyncio.create_task(
                        _send_transcript_event(role, user_id, content, str(msg_id))
                    )
                return result

            conv.upsert_message = _upsert_with_event

        await agent.simple_response(opening_prompt)
        await agent.finish()


if __name__ == "__main__":
    Runner(
        AgentLauncher(
            create_agent=create_agent,
            join_call=join_call,
            max_concurrent_sessions=5,
            max_sessions_per_call=1,
            max_session_duration_seconds=1800,  # 30-minute lesson cap
            agent_idle_timeout=120.0,           # disconnect if student is gone 2 min
        )
    ).cli()

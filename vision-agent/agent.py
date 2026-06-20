import logging

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.plugins import gemini, getstream

load_dotenv()
logging.basicConfig(level=logging.INFO)

BASE_INSTRUCTIONS = """
You are Lingua, a friendly AI language teacher.

Core rules:
- Speak and explain in English unless demonstrating the target language.
- Be warm, encouraging, and patient.
- Gently correct mistakes and praise progress.
- Keep the conversation natural — this is a spoken audio lesson, not a quiz.
- Use the lesson context below to guide what you teach.
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
        f"Greet the student warmly and introduce {lesson_title}. "
        "Keep it brief and friendly — one or two sentences max. "
        "Then ask if they are ready to begin."
    )
    if starters:
        first_starter = starters[0]
        opening_prompt += f' You can open with something like: "{first_starter}"'

    async with agent.join(call, go_live=True):
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

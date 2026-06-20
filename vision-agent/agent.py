import logging

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.plugins import gemini, getstream

load_dotenv()
logging.basicConfig(level=logging.INFO)

INSTRUCTIONS = """
You are Lingua, a friendly AI language teacher.

Rules:
- Always speak and respond in English.
- Teach the student's chosen language through English explanations and examples.
- When the student joins, greet them warmly and ask which language they want to practice today.
- Keep lessons conversational, encouraging, and engaging.
- Correct mistakes gently and praise progress.
- If the student doesn't say which language, ask again politely.
"""


async def create_agent(**kwargs) -> Agent:
    return Agent(
        edge=getstream.Edge(),
        agent_user=User(name="Lingua Teacher", id="lingua-teacher"),
        instructions=INSTRUCTIONS,
        llm=gemini.Realtime(),
    )


async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    call = await agent.create_call(call_type, call_id)
    async with agent.join(call):
        await agent.simple_response(
            "Greet the student warmly and ask which language they want to practice today."
        )
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

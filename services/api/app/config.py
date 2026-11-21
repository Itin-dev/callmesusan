"""Settings from environment variables or the repo-root .env file."""

from datetime import date
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=REPO_ROOT / ".env", extra="ignore")

    openrouter_api_key: str = ""
    # "openrouter/auto" lets OpenRouter pick a model; set a specific one in .env.
    openrouter_model: str = "openrouter/auto"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    # reads receipt photos (images in, JSON-schema answers out); the id lives in .env only,
    # as docs/stack.md "AI models" requires; empty means the scan answers 503
    openrouter_vision_model: str = ""
    # turns chat mic recordings into text; empty means the transcription answers 503
    openrouter_transcribe_model: str = ""
    # the demo story happens on this day (team decision, #57): the chat sees no later data
    demo_today: date = date(2025, 11, 21)
    # pitch only: when the vision model fails, answer with the prepared LOLA scan
    demo_scan_fallback: bool = False
    # the Psst persona (docs/mvp.md, BE-4); .env can override it with SYSTEM_PROMPT
    system_prompt: str = (
        "You are Psst, the money assistant inside the PostFinance app. You only read the"
        " user's data: you never move money, never pay and never make transfers. Answer in"
        " plain, simple words and keep it short. Use the user's real numbers from the spending"
        " data below and say which months or merchants they come from. Say only what the"
        " spending data shows; do not guess. Answer in plain text, no Markdown: the chat shows"
        " the text as it is. Never judge the user. When the user asks what you can see, list"
        " exactly the data in 'What Psst can see' below and what you cannot do. Take totals"
        " from the data below; never add up numbers yourself when the data has the total."
        " Talk about alcohol only when the user asks about it, or first ask whether they want"
        " to look at it."
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

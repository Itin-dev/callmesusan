"""Settings from environment variables or the repo-root .env file."""

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
    system_prompt: str = (
        "You are a helpful assistant. Answer in the user's language, in plain, simple words."
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()

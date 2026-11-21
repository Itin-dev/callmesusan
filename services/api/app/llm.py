"""LLM access through OpenRouter's OpenAI-compatible API."""

from typing import Annotated, Protocol

from fastapi import Depends, HTTPException
from openai import OpenAI

from app.config import Settings, get_settings

Message = dict[str, str]


class LLM(Protocol):
    def complete(self, messages: list[Message]) -> str: ...


class OpenRouterLLM:
    def __init__(self, settings: Settings) -> None:
        self._client = OpenAI(
            base_url=settings.openrouter_base_url, api_key=settings.openrouter_api_key
        )
        self._model = settings.openrouter_model

    def complete(self, messages: list[Message]) -> str:
        response = self._client.chat.completions.create(model=self._model, messages=messages)
        return response.choices[0].message.content or ""


def get_llm(settings: Annotated[Settings, Depends(get_settings)]) -> LLM:
    if not settings.openrouter_api_key:
        raise HTTPException(503, "OPENROUTER_API_KEY is not set (see .env.example)")
    return OpenRouterLLM(settings)

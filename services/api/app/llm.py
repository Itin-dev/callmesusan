"""LLM access through OpenRouter's OpenAI-compatible API."""

import base64
import json
from typing import Annotated, Any, Protocol

from fastapi import Depends, HTTPException
from openai import OpenAI

from app.config import Settings, get_settings

Message = dict[str, str]


class LLM(Protocol):
    def complete(self, messages: list[Message]) -> str: ...

    # messages may hold image parts; the answer must follow the JSON schema
    def extract_json(self, messages: list[dict[str, Any]], schema: dict[str, Any]) -> Any: ...

    # audio_format names the container, e.g. "webm"; the answer is the spoken text
    def transcribe(self, audio: bytes, audio_format: str, instructions: str) -> str: ...


class OpenRouterLLM:
    def __init__(self, settings: Settings) -> None:
        self._client = OpenAI(
            base_url=settings.openrouter_base_url, api_key=settings.openrouter_api_key
        )
        self._model = settings.openrouter_model
        self._vision_model = settings.openrouter_vision_model
        self._transcribe_model = settings.openrouter_transcribe_model

    def complete(self, messages: list[Message]) -> str:
        response = self._client.chat.completions.create(model=self._model, messages=messages)
        return response.choices[0].message.content or ""

    def extract_json(self, messages: list[dict[str, Any]], schema: dict[str, Any]) -> Any:
        response = self._client.chat.completions.create(
            model=self._vision_model,
            messages=messages,
            response_format={
                "type": "json_schema",
                "json_schema": {"name": "result", "strict": True, "schema": schema},
            },
        )
        return json.loads(response.choices[0].message.content or "")

    def transcribe(self, audio: bytes, audio_format: str, instructions: str) -> str:
        recording = base64.b64encode(audio).decode("ascii")
        response = self._client.chat.completions.create(
            model=self._transcribe_model,
            messages=[
                {"role": "system", "content": instructions},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_audio",
                            "input_audio": {"data": recording, "format": audio_format},
                        }
                    ],
                },
            ],
        )
        return response.choices[0].message.content or ""


def get_llm(settings: Annotated[Settings, Depends(get_settings)]) -> LLM:
    if not settings.openrouter_api_key:
        raise HTTPException(503, "OPENROUTER_API_KEY is not set (see .env.example)")
    return OpenRouterLLM(settings)

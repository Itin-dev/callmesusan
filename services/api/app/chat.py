"""Chat contract and prompt assembly.

The endpoint is stateless: the client sends the whole conversation on every turn and
nothing is stored or logged.
"""

from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, model_validator

from app.llm import Message

# Languages the web app offers (apps/web/src/i18n).
Language = Literal["en", "de", "uk", "ru", "ar"]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: Annotated[str, StringConstraints(min_length=1, max_length=4000)]


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=50)
    language: Language = "en"

    @model_validator(mode="after")
    def last_message_is_from_user(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("the last message must come from the user")
        return self


class ChatReply(BaseModel):
    reply: str


def build_messages(
    conversation: list[Message], *, language: str, persona: str, context: str = ""
) -> list[Message]:
    """Put the persona, the optional data context and the language rule into one system message."""
    parts = [persona, context, f"Write the reply in the language with ISO code '{language}'."]
    system = "\n\n".join(part for part in parts if part)
    return [{"role": "system", "content": system}, *conversation]

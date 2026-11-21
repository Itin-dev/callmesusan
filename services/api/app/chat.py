"""Chat contract, knowledge-base grounding and parsing of the model's structured reply.

The endpoint is stateless: the client sends the whole conversation on every turn and
nothing is stored or logged. The model gets only the knowledge-base entries for the
chosen topic (plus emergency numbers) and must answer as JSON; ids and links that are
not in the knowledge base are dropped, so the UI never shows an invented organization.
"""

import json
import re
from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, ValidationError, model_validator

from app.knowledge import KnowledgeBase, Language, Tile
from app.llm import Message

Mode = Literal[1, 2, 3]

OUTPUT_FORMAT = """\
Answer only from the knowledge base below. If it has no answer, say so and suggest the \
closest organization or emergency number from it.

Reply with one JSON object and nothing else:
{"reply": "<answer for the user>", "mode": 1 | 2 | 3, \
"organization_ids": ["<id>", ...], "source_url": "<url>" | null}
- mode 1: short information answer; set source_url to the entry's official_url or source_url.
- mode 2: referral; list the ids of the organizations the user should contact.
- mode 3: explanation of an official letter.
Use only ids and URLs that appear in the knowledge base."""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: Annotated[str, StringConstraints(min_length=1, max_length=4000)]


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=50)
    language: Language = "en"
    topic: Tile | None = None

    @model_validator(mode="after")
    def last_message_is_from_user(self) -> "ChatRequest":
        if self.messages[-1].role != "user":
            raise ValueError("the last message must come from the user")
        return self


class ChatReply(BaseModel):
    reply: str
    mode: Mode = 1
    organization_ids: list[str] = []
    source_url: str | None = None


def select_entries(kb: KnowledgeBase, topic: str | None) -> KnowledgeBase:
    """Keep the entries for one topic; emergency numbers always stay in."""
    if topic is None:
        return kb
    return kb.model_copy(
        update={
            "organizations": [o for o in kb.organizations if topic in o.tiles],
            "info": [i for i in kb.info if topic in i.tiles],
        }
    )


def build_messages(
    kb: KnowledgeBase,
    conversation: list[Message],
    *,
    language: str,
    topic: str | None,
    persona: str,
) -> list[Message]:
    knowledge = select_entries(kb, topic).model_dump_json(exclude_none=True)
    system = "\n\n".join(
        [
            persona,
            f"Write the reply in the language with ISO code '{language}'.",
            f"The user chose the topic: {topic}." if topic else "",
            OUTPUT_FORMAT,
            f"Knowledge base (JSON):\n{knowledge}",
        ]
    )
    return [{"role": "system", "content": system}, *conversation]


def _known_urls(kb: KnowledgeBase) -> set[str]:
    entries = (*kb.organizations, *kb.info, *kb.emergency)
    urls = {e.source_url for e in entries}
    urls |= {u for e in entries if (u := getattr(e, "official_url", None))}
    urls |= {o.booking_url for o in kb.organizations if o.booking_url}
    return urls


def _extract_json(raw: str) -> dict | None:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def parse_reply(raw: str, kb: KnowledgeBase) -> ChatReply:
    """Turn the model output into a reply that only references the knowledge base."""
    data = _extract_json(raw)
    if data is None or not isinstance(data.get("reply"), str):
        return ChatReply(reply=raw.strip())
    try:
        reply = ChatReply.model_validate(data)
    except ValidationError:
        reply = ChatReply(reply=data["reply"])
    org_ids = {o.id for o in kb.organizations}
    return reply.model_copy(
        update={
            "organization_ids": [i for i in reply.organization_ids if i in org_ids],
            "source_url": reply.source_url if reply.source_url in _known_urls(kb) else None,
        }
    )

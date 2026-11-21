"""HTTP entrypoint. Keep routes thin; put logic in separate modules."""

from typing import Annotated

from fastapi import Depends, FastAPI

from app.chat import ChatReply, ChatRequest, build_messages
from app.config import Settings, get_settings
from app.llm import LLM, get_llm

app = FastAPI(title="api")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat")
def chat(
    request: ChatRequest,
    llm: Annotated[LLM, Depends(get_llm)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ChatReply:
    messages = build_messages(
        [m.model_dump() for m in request.messages],
        language=request.language,
        persona=settings.system_prompt,
    )
    return ChatReply(reply=llm.complete(messages).strip())

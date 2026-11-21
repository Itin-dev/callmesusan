"""HTTP entrypoint. Keep routes thin; put logic in separate modules."""

from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException

from app.accounts import AccountsOverview, accounts_overview
from app.chat import ChatReply, ChatRequest, build_messages
from app.config import Settings, get_settings
from app.llm import LLM, get_llm
from app.transactions import (
    Account,
    TransactionDetail,
    TransactionOut,
    get_transaction,
    list_transactions,
)

app = FastAPI(title="api")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/accounts")
def accounts() -> AccountsOverview:
    return accounts_overview()


@app.get("/api/transactions")
def transactions(account: Account | None = None) -> list[TransactionOut]:
    return list_transactions(account)


@app.get("/api/transactions/{transaction_id}")
def transaction(transaction_id: str) -> TransactionDetail:
    detail = get_transaction(transaction_id)
    if detail is None:
        raise HTTPException(404, "unknown transaction id")
    return detail


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

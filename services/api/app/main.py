"""HTTP entrypoint. Keep routes thin; put logic in separate modules."""

from typing import Annotated

from fastapi import Depends, FastAPI, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.accounts import AccountsOverview, accounts_overview
from app.chat import ChatReply, ChatRequest, Language, build_messages
from app.config import Settings, get_settings
from app.llm import LLM, get_llm
from app.scan import MAX_UPLOAD_BYTES, ModelAnswerError, ScanResult, UploadError, scan_receipt
from app.spending import SpendingSummary, current_summary, data_years, year_summary
from app.transactions import (
    Account,
    TransactionDetail,
    TransactionOut,
    all_transactions,
    get_transaction,
    list_transactions,
)
from app.transcribe import NoSpeechError, transcribe_audio

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


@app.get("/api/spending/summary")
def spending_summary(year: int | None = None) -> SpendingSummary:
    transactions = all_transactions()
    years = data_years(transactions)
    # without a year the Analytics screen shows the latest year in the data
    chosen = year if year is not None else years[-1]
    if chosen not in years:
        raise HTTPException(404, f"no transactions in {chosen}")
    return SpendingSummary.model_validate(year_summary(transactions, chosen))


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
        context=current_summary(settings.demo_today),
    )
    return ChatReply(reply=llm.complete(messages).strip())


@app.post("/api/receipts/scan")
def receipts_scan(
    file: UploadFile,
    llm: Annotated[LLM, Depends(get_llm)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ScanResult:
    if not settings.openrouter_vision_model:
        raise HTTPException(503, "OPENROUTER_VISION_MODEL is not set (see .env.example)")
    # one byte over the limit is enough to know the photo is too large
    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    try:
        return scan_receipt(data, llm, fallback_allowed=settings.demo_scan_fallback)
    except UploadError as error:
        raise HTTPException(error.status, error.detail) from error
    except ModelAnswerError as error:
        raise HTTPException(502, str(error)) from error


class Transcript(BaseModel):
    text: str


@app.post("/api/transcribe")
def transcribe(
    file: UploadFile,
    llm: Annotated[LLM, Depends(get_llm)],
    settings: Annotated[Settings, Depends(get_settings)],
    language: Annotated[Language, Form()] = "en",
) -> Transcript:
    if not settings.openrouter_transcribe_model:
        raise HTTPException(503, "OPENROUTER_TRANSCRIBE_MODEL is not set (see .env.example)")
    # one byte over the limit is enough to know the recording is too large
    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    try:
        return Transcript(text=transcribe_audio(data, language, llm))
    except UploadError as error:
        raise HTTPException(error.status, error.detail) from error
    except NoSpeechError as error:
        raise HTTPException(422, str(error)) from error
    except ModelAnswerError as error:
        raise HTTPException(502, str(error)) from error

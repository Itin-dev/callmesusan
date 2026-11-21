"""Bank transactions with their linked store receipts (docs/mvp.md, task BE-1).

The data is read once from app/data: transactions.json (generated from the PostFinance CSV
exports) and receipts/*.json (digital receipts from partner shops).
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel

DATA_DIR = Path(__file__).parent / "data"
TRANSACTIONS_FILE = DATA_DIR / "transactions.json"
RECEIPTS_DIR = DATA_DIR / "receipts"

Account = Literal["privat", "kk"]


class ReceiptItem(BaseModel):
    name: str
    category: str
    # int for pieces, decimal for weighed items such as 0.714 kg
    quantity: int | float
    unit: Literal["pcs", "kg"] = "pcs"
    unit_price_rp: int
    line_total_rp: int
    # subtracted from line_total_rp; the receipt total is the sum of the net lines
    discount_rp: int = 0


class CategoryTotal(BaseModel):
    category: str
    total_rp: int


class Receipt(BaseModel):
    receipt_id: str
    store: str
    branch: str
    time: str
    # receipts in app/data come from partner shops; "photo" is for scanned receipts
    source: Literal["store_app", "photo"] = "store_app"
    total_rp: int
    items: list[ReceiptItem]
    category_totals: list[CategoryTotal]


class TransactionOut(BaseModel):
    id: str
    account: Account
    date: str
    type: Literal["expense", "income", "transfer"]
    description: str
    counterparty: str
    amount_rp: int
    currency: str
    original_amount: float | None = None
    original_currency: str | None = None
    has_receipt: bool


class TransactionDetail(TransactionOut):
    receipt: Receipt | None


def match_receipts(transactions: list[dict], receipts: list[dict]) -> dict[str, str]:
    """Map transaction id to receipt id: same date and amount, store name in the counterparty.

    Each transaction gets at most one receipt, and each receipt at most one transaction.
    A receipt without such an expense (a cash purchase) stays unmatched.
    """
    matches: dict[str, str] = {}
    for receipt in receipts:
        store = receipt["store"].casefold()
        for tx in transactions:
            if (
                tx["id"] not in matches
                and tx["type"] == "expense"
                and tx["date"] == receipt["date"]
                and tx["amount_rp"] == receipt["total_rp"]
                and store in tx["counterparty"].casefold()
            ):
                matches[tx["id"]] = receipt["receipt_id"]
                break
    return matches


def category_totals(items: list[ReceiptItem]) -> list[CategoryTotal]:
    """Net amount per category, largest first; ties sorted by category name."""
    totals: dict[str, int] = {}
    for item in items:
        totals[item.category] = totals.get(item.category, 0) + item.line_total_rp - item.discount_rp
    ranked = sorted(totals.items(), key=lambda entry: (-entry[1], entry[0]))
    return [CategoryTotal(category=category, total_rp=total) for category, total in ranked]


def _row_number(transaction_id: str) -> int:
    # ids are "<account letter>-<CSV row number>", for example K-0241
    return int(transaction_id.split("-", 1)[1])


@lru_cache
def _data() -> tuple[list[dict], dict[str, str], dict[str, dict]]:
    transactions = json.loads(TRANSACTIONS_FILE.read_text(encoding="utf-8"))
    receipts = [
        json.loads(p.read_text(encoding="utf-8")) for p in sorted(RECEIPTS_DIR.glob("*.json"))
    ]
    # newest first; within one day the later CSV row comes first
    transactions.sort(key=lambda tx: (tx["date"], _row_number(tx["id"])), reverse=True)
    links = match_receipts(transactions, receipts)
    receipts_by_id = {receipt["receipt_id"]: receipt for receipt in receipts}
    return transactions, links, receipts_by_id


def _receipt(raw: dict) -> Receipt:
    items = [ReceiptItem.model_validate(item) for item in raw["items"]]
    return Receipt.model_validate(
        {**raw, "items": items, "category_totals": category_totals(items)}
    )


def list_transactions(account: Account | None = None) -> list[TransactionOut]:
    transactions, links, _ = _data()
    return [
        TransactionOut.model_validate({**tx, "has_receipt": tx["id"] in links})
        for tx in transactions
        if account is None or tx["account"] == account
    ]


def get_transaction(transaction_id: str) -> TransactionDetail | None:
    transactions, links, receipts_by_id = _data()
    tx = next((tx for tx in transactions if tx["id"] == transaction_id), None)
    if tx is None:
        return None
    receipt_id = links.get(transaction_id)
    receipt = _receipt(receipts_by_id[receipt_id]) if receipt_id else None
    return TransactionDetail.model_validate(
        {**tx, "has_receipt": receipt is not None, "receipt": receipt}
    )

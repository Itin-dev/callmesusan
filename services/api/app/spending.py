"""Compact spending summary that grounds the Psst chat (docs/mvp.md, task BE-4).

Rules from docs/mvp.md: transfers between the user's own accounts are not spending, income on the
credit card account (kk) is a merchant refund and reduces spending, income on privat is salary.
"""

import json
from functools import lru_cache

from pydantic import BaseModel

from app.transactions import RECEIPTS_DIR, TRANSACTIONS_FILE

# merchants per month line and for the whole year; small numbers keep the system prompt short
TOP_PER_MONTH = 5
TOP_PER_YEAR = 10
# the period of GET /api/spending/summary is one calendar year
MONTHS_PER_YEAR = 12


def _is_refund(tx: dict) -> bool:
    return tx["type"] == "income" and tx["account"] == "kk"


def _chf(amount_rp: int) -> str:
    return f"{amount_rp / 100:.2f}"


def monthly_totals(transactions: list[dict]) -> dict[str, dict[str, int]]:
    """Income and spending per month ("YYYY-MM"), oldest month first."""
    months: dict[str, dict[str, int]] = {}
    for tx in transactions:
        month = months.setdefault(tx["date"][:7], {"income_rp": 0, "spending_rp": 0})
        if tx["type"] == "expense":
            month["spending_rp"] += tx["amount_rp"]
        elif _is_refund(tx):
            month["spending_rp"] -= tx["amount_rp"]
        elif tx["type"] == "income":
            month["income_rp"] += tx["amount_rp"]
    return dict(sorted(months.items()))


def top_merchants(
    transactions: list[dict], month: str | None = None, limit: int = TOP_PER_YEAR
) -> list[tuple[str, int]]:
    """Merchants by net spending (expenses minus refunds), largest first."""
    net: dict[str, int] = {}
    for tx in transactions:
        if month and not tx["date"].startswith(month):
            continue
        if tx["type"] == "expense":
            net[tx["counterparty"]] = net.get(tx["counterparty"], 0) + tx["amount_rp"]
        elif _is_refund(tx):
            net[tx["counterparty"]] = net.get(tx["counterparty"], 0) - tx["amount_rp"]
    ranked = sorted((entry for entry in net.items() if entry[1] > 0), key=lambda e: (-e[1], e[0]))
    return ranked[:limit]


def receipt_categories(receipts: list[dict]) -> dict[str, list[tuple[str, int]]]:
    """Net item amount per category and month from the shop receipts, largest first."""
    months: dict[str, dict[str, int]] = {}
    for receipt in receipts:
        totals = months.setdefault(receipt["date"][:7], {})
        for item in receipt["items"]:
            net = item["line_total_rp"] - item.get("discount_rp", 0)
            totals[item["category"]] = totals.get(item["category"], 0) + net
    return {
        month: sorted(totals.items(), key=lambda e: (-e[1], e[0]))
        for month, totals in sorted(months.items())
    }


def _amounts(entries: list[tuple[str, int]]) -> str:
    return ", ".join(f"{name} {_chf(amount)}" for name, amount in entries)


def spending_summary(transactions: list[dict], receipts: list[dict]) -> str:
    lines = [
        "Spending data of the user in CHF. Transfers between the user's own accounts are not"
        " spending; refunds are already subtracted.",
        "Per month:",
    ]
    for month, totals in monthly_totals(transactions).items():
        top = _amounts(top_merchants(transactions, month=month, limit=TOP_PER_MONTH))
        lines.append(
            f"{month}: income {_chf(totals['income_rp'])},"
            f" spending {_chf(totals['spending_rp'])}; top: {top}"
        )
    if transactions:
        lines.append(f"Top merchants of the year: {_amounts(top_merchants(transactions))}")
    categories = receipt_categories(receipts)
    if categories:
        lines.append("Shop receipt items by category (only partner shops send receipts):")
        lines.extend(f"{month}: {_amounts(entries)}" for month, entries in categories.items())
    return "\n".join(lines)


class SummaryTotals(BaseModel):
    total_rp: int
    count: int
    monthly_average_rp: int


class SpendingSummary(BaseModel):
    period_start: str
    period_end: str
    income: SummaryTotals
    expenses: SummaryTotals


def data_years(transactions: list[dict]) -> list[int]:
    """Years that have at least one transaction, oldest first."""
    return sorted({int(tx["date"][:4]) for tx in transactions})


def year_summary(transactions: list[dict], year: int) -> dict:
    """Income and expenses of one year (docs/mvp.md, GET /api/spending/summary).

    Refunds lower the expense total but are not counted as expense rows.
    """
    rows = [tx for tx in transactions if tx["date"].startswith(f"{year}-")]
    income = [tx for tx in rows if tx["type"] == "income" and not _is_refund(tx)]
    expenses = [tx for tx in rows if tx["type"] == "expense"]
    refunds_rp = sum(tx["amount_rp"] for tx in rows if _is_refund(tx))

    def totals(total_rp: int, count: int) -> dict:
        return {"total_rp": total_rp, "count": count,
                "monthly_average_rp": total_rp // MONTHS_PER_YEAR}  # fmt: skip

    return {
        "period_start": f"{year}-01-01",
        "period_end": f"{year}-12-31",
        "income": totals(sum(tx["amount_rp"] for tx in income), len(income)),
        "expenses": totals(sum(tx["amount_rp"] for tx in expenses) - refunds_rp, len(expenses)),
    }


@lru_cache
def current_summary() -> str:
    """Summary of the demo data in app/data, built once per process."""
    transactions = json.loads(TRANSACTIONS_FILE.read_text(encoding="utf-8"))
    receipts = [
        json.loads(p.read_text(encoding="utf-8")) for p in sorted(RECEIPTS_DIR.glob("*.json"))
    ]
    return spending_summary(transactions, receipts)

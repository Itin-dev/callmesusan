"""Compact spending summary that grounds the Psst chat (docs/mvp.md, task BE-4).

Rules from docs/mvp.md: transfers between the user's own accounts are not spending, income on the
credit card account (kk) is a merchant refund and reduces spending, income on privat is salary.
"""

import json
from datetime import date, timedelta
from functools import lru_cache

from pydantic import BaseModel

from app.transactions import DATA_DIR, RECEIPTS_DIR, TRANSACTIONS_FILE

# merchants per month line and for the whole year; small numbers keep the system prompt short
TOP_PER_MONTH = 5
TOP_PER_YEAR = 10
# the period of GET /api/spending/summary is one calendar year
MONTHS_PER_YEAR = 12
# weeks with daily detail in the chat context: enough for "last week", short enough for the prompt
WEEKS_SHOWN = 6
# demo "usual month" per item category: receipts exist only for November, so no average exists
USUAL_FILE = DATA_DIR / "usual_categories.json"
# own names, because strftime("%A") follows the server locale
WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")


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


def daily_spending(transactions: list[dict]) -> dict[str, int]:
    """Net spending per day ("YYYY-MM-DD"): expenses minus card refunds, transfers left out."""
    days: dict[str, int] = {}
    for tx in transactions:
        if tx["type"] == "expense":
            days[tx["date"]] = days.get(tx["date"], 0) + tx["amount_rp"]
        elif _is_refund(tx):
            days[tx["date"]] = days.get(tx["date"], 0) - tx["amount_rp"]
    return days


def week_lines(transactions: list[dict], today: date) -> list[str]:
    """One line per ISO week (Monday to Sunday), the last WEEKS_SHOWN weeks up to today."""
    days = daily_spending(transactions)
    this_monday = today - timedelta(days=today.weekday())
    lines = []
    for weeks_back in range(WEEKS_SHOWN - 1, -1, -1):
        monday = this_monday - timedelta(weeks=weeks_back)
        sunday = monday + timedelta(days=6)
        week_days = [monday + timedelta(days=offset) for offset in range(7)]
        spent = [(day, days[day.isoformat()]) for day in week_days if day.isoformat() in days]
        detail = ", ".join(
            f"{WEEKDAYS[day.weekday()][:3]} {day.isoformat()} {_chf(amount)}"
            for day, amount in spent
        )
        year, week, _ = monday.isocalendar()
        lines.append(
            f"{year}-W{week:02d} ({monday.isoformat()} to {sunday.isoformat()}):"
            f" spending {_chf(sum(amount for _, amount in spent))}; {detail or 'no spending'}"
        )
    return lines


def spending_summary(
    transactions: list[dict], receipts: list[dict], today: date | None = None
) -> str:
    """Text context for the chat. With today, rows and receipts after that day stay hidden."""
    lines = []
    if today is not None:
        cutoff = today.isoformat()
        transactions = [tx for tx in transactions if tx["date"] <= cutoff]
        receipts = [receipt for receipt in receipts if receipt["date"] <= cutoff]
        first = min((tx["date"] for tx in transactions), default=cutoff)
        lines.append(
            f"Today is {WEEKDAYS[today.weekday()]}, {cutoff}. The data covers {first} to {cutoff};"
            f" there is no data before {first}."
        )
    lines += [
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
    if today is not None:
        lines.append(f"Last {WEEKS_SHOWN} weeks (Monday to Sunday), spending per day:")
        lines.extend(week_lines(transactions, today))
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


class CategorySpending(BaseModel):
    category: str
    total_rp: int
    average_rp: int
    ratio: float


class SpendingByCategory(BaseModel):
    month: str
    categories: list[CategorySpending]


def category_comparison(receipts: list[dict], month: str, usual_rp: dict[str, int]) -> list[dict]:
    """Net item spending per category in one month against the usual month, largest ratio first."""
    month_receipts = [receipt for receipt in receipts if receipt["date"].startswith(f"{month}-")]
    totals = receipt_categories(month_receipts).get(month, [])
    entries = [
        {
            "category": category,
            "total_rp": total,
            "average_rp": usual_rp[category],
            "ratio": round(total / usual_rp[category], 2),
        }
        for category, total in totals
        if usual_rp.get(category)
    ]
    return sorted(entries, key=lambda entry: (-entry["ratio"], entry["category"]))


@lru_cache
def _usual_month() -> dict[str, int]:
    return json.loads(USUAL_FILE.read_text(encoding="utf-8"))["usual_rp"]


def current_categories(month: str) -> SpendingByCategory:
    """Category comparison of the demo receipts in app/data for one month ("YYYY-MM")."""
    receipts = [
        json.loads(p.read_text(encoding="utf-8")) for p in sorted(RECEIPTS_DIR.glob("*.json"))
    ]
    entries = category_comparison(receipts, month, _usual_month())
    return SpendingByCategory.model_validate({"month": month, "categories": entries})


@lru_cache
def current_summary(today: date | None = None) -> str:
    """Summary of the demo data in app/data, built once per process."""
    transactions = json.loads(TRANSACTIONS_FILE.read_text(encoding="utf-8"))
    receipts = [
        json.loads(p.read_text(encoding="utf-8")) for p in sorted(RECEIPTS_DIR.glob("*.json"))
    ]
    return spending_summary(transactions, receipts, today)

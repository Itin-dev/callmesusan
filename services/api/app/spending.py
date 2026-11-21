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
# account names as the user knows them, for the data list and the statement
ACCOUNT_NAMES = {"privat": "Privatkonto", "kk": "credit card"}
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


def _seen_data(transactions: list[dict], receipts: list[dict], today: date) -> list[str]:
    """The data list behind "What can you see?" (pitch slide "Transparent")."""
    first = min((tx["date"] for tx in transactions), default=today.isoformat())
    shops = ", ".join(sorted({receipt["store"] for receipt in receipts}))
    return [
        "What Psst can see:",
        f"- {len(transactions)} transactions of the Privatkonto and the credit card account"
        f" (KK-Konto) from {first} to {today.isoformat()}.",
        f"- {len(receipts)} digital receipts from partner shops ({shops}) with their item lists.",
        "- Psst cannot see other banks, cash payments, or receipts of other shops unless the user"
        " scans them.",
        "- Psst only reads: it cannot pay, transfer money or sign anything.",
    ]


def _statement_lines(transactions: list[dict], today: date) -> list[str]:
    """Every row of the current month up to today, oldest first, with its sign."""
    month = today.isoformat()[:7]
    lines = [f"Transactions of {month} up to today (for a statement):"]
    for tx in sorted(transactions, key=lambda tx: tx["date"]):
        if not tx["date"].startswith(month):
            continue
        account = ACCOUNT_NAMES.get(tx["account"], tx["account"])
        kind = "refund" if _is_refund(tx) else tx["type"]
        sign = "-" if tx["type"] == "expense" else "+" if tx["type"] == "income" else ""
        lines.append(
            f"{tx['date']} {account} {kind} {tx['counterparty']} {sign}{_chf(tx['amount_rp'])}"
        )
    return lines


def _receipt_category_lines(receipts: list[dict], usual: dict[str, int] | None) -> list[str]:
    lines = []
    for month, entries in receipt_categories(receipts).items():
        parts = []
        for category, total in entries:
            usual_rp = (usual or {}).get(category)
            compared = (
                f" (usual {_chf(usual_rp)}, {round(total / usual_rp, 2)}x)" if usual_rp else ""
            )
            parts.append(f"{category} {_chf(total)}{compared}")
        lines.append(f"{month}: {', '.join(parts)}")
    return lines


def spending_summary(
    transactions: list[dict],
    receipts: list[dict],
    today: date | None = None,
    usual: dict[str, int] | None = None,
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
        lines += _seen_data(transactions, receipts, today)
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
        lines.extend(_statement_lines(transactions, today))
    category_lines = _receipt_category_lines(receipts, usual)
    if category_lines:
        lines.append(
            "Shop receipt items by category, compared with the user's usual month"
            " (only partner shops send receipts):"
        )
        lines.extend(category_lines)
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
    return spending_summary(transactions, receipts, today, _usual_month())

"""Accounts for the Home screen.

Demo values from Figma "01 Home". They equal the frontend fixture in apps/web/src/api/accounts.ts,
so the Home screen shows the same numbers before and after it calls GET /api/accounts.
"""

from typing import Literal

from pydantic import BaseModel


class AccountOut(BaseModel):
    id: str
    kind: Literal["private", "savings", "pillar3"]
    # the third pillar has no IBAN
    iban_masked: str | None
    balance_rp: int


class AccountsOverview(BaseModel):
    accounts: list[AccountOut]
    total_rp: int


DEMO_ACCOUNTS = (
    AccountOut(id="privat", kind="private", iban_masked="CH•• •••• •••• 4821", balance_rp=481235),
    AccountOut(id="savings", kind="savings", iban_masked="CH•• •••• •••• 7390", balance_rp=1200000),
    AccountOut(id="pillar3", kind="pillar3", iban_masked=None, balance_rp=666765),
)


def accounts_overview() -> AccountsOverview:
    return AccountsOverview(
        accounts=list(DEMO_ACCOUNTS),
        total_rp=sum(account.balance_rp for account in DEMO_ACCOUNTS),
    )

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.transactions import match_receipts

# receipts in app/data/receipts that have a bank row (docs/mvp.md, "Data we have")
MATCHED = {
    "K-0241": "COOP-20251119-2281",
    "P-0233": "MIG-20251114-0417",
    "K-0242": "LIDL-20251120-0253",
    "K-0247": "LIDL-20251121-5513",
    "K-0265": "DEN-20251120-0932",
}

LIST_FIELDS = {
    "id",
    "account",
    "date",
    "type",
    "description",
    "counterparty",
    "amount_rp",
    "currency",
    "original_amount",
    "original_currency",
    "has_receipt",
}


@pytest.fixture
def client():
    return TestClient(app)


def test_list_returns_all_transactions_with_contract_fields(client):
    rows = client.get("/api/transactions").json()
    assert len(rows) == 531
    assert all(set(row) == LIST_FIELDS for row in rows)


def test_list_is_newest_first(client):
    dates = [row["date"] for row in client.get("/api/transactions").json()]
    assert dates == sorted(dates, reverse=True)


def test_list_keeps_row_order_reversed_within_one_day(client):
    rows = client.get("/api/transactions", params={"account": "kk"}).json()
    same_day = [row["id"] for row in rows if row["date"] == "2025-11-21"]
    assert same_day == sorted(same_day, reverse=True)


def test_list_filters_by_account(client):
    rows = client.get("/api/transactions", params={"account": "kk"}).json()
    assert len(rows) == 265
    assert {row["account"] for row in rows} == {"kk"}


def test_list_rejects_unknown_account(client):
    assert client.get("/api/transactions", params={"account": "savings"}).status_code == 422


def test_only_matched_transactions_have_a_receipt(client):
    rows = client.get("/api/transactions").json()
    assert {row["id"] for row in rows if row["has_receipt"]} == set(MATCHED)


def test_foreign_currency_fields_are_null_for_chf_rows(client):
    row = client.get("/api/transactions/K-0241").json()
    assert (row["original_amount"], row["original_currency"]) == (None, None)


def test_foreign_currency_fields_are_set_for_eur_rows(client):
    row = client.get("/api/transactions/K-0016").json()
    assert (row["original_amount"], row["original_currency"]) == (46.97, "EUR")


def test_detail_returns_the_linked_receipt(client):
    receipt = client.get("/api/transactions/K-0241").json()["receipt"]
    assert receipt["receipt_id"] == MATCHED["K-0241"]
    assert (receipt["store"], receipt["branch"], receipt["time"]) == (
        "Coop",
        "Luzern Bahnhof",
        "18:15",
    )
    assert receipt["source"] == "store_app"
    assert receipt["total_rp"] == 11970
    assert len(receipt["items"]) == 8


def test_category_totals_are_net_of_discounts(client):
    receipt = client.get("/api/transactions/K-0242").json()["receipt"]
    assert sum(c["total_rp"] for c in receipt["category_totals"]) == 8444


def test_category_totals_are_sorted_largest_first(client):
    totals = client.get("/api/transactions/K-0242").json()["receipt"]["category_totals"]
    assert [c["total_rp"] for c in totals] == sorted((c["total_rp"] for c in totals), reverse=True)
    assert totals[0] == {"category": "meat_fish", "total_rp": 2858}


def test_weighed_item_keeps_unit_quantity_and_discount(client):
    items = client.get("/api/transactions/K-0242").json()["receipt"]["items"]
    apple = next(item for item in items if item["name"] == "Apfel rot lose")
    assert apple == {
        "name": "Apfel rot lose",
        "category": "fruit",
        "quantity": 0.714,
        "unit": "kg",
        "unit_price_rp": 219,
        "line_total_rp": 156,
        "discount_rp": 17,
    }


def test_plain_item_defaults_to_pieces_without_discount(client):
    item = client.get("/api/transactions/K-0241").json()["receipt"]["items"][0]
    assert (item["unit"], item["discount_rp"]) == ("pcs", 0)


def test_detail_without_receipt_has_null_receipt(client):
    row = client.get("/api/transactions/P-0236").json()
    assert row["counterparty"] == "LOLA Mattenhof"
    assert row["has_receipt"] is False
    assert row["receipt"] is None


def test_detail_returns_404_for_unknown_id(client):
    assert client.get("/api/transactions/X-9999").status_code == 404


def _tx(id_, date="2025-11-19", amount_rp=1000, counterparty="Coop Luzern", type_="expense"):
    return {
        "id": id_,
        "date": date,
        "amount_rp": amount_rp,
        "counterparty": counterparty,
        "type": type_,
    }


def _rc(receipt_id="R1", date="2025-11-19", total_rp=1000, store="Coop"):
    return {"receipt_id": receipt_id, "date": date, "total_rp": total_rp, "store": store}


def test_match_needs_same_date_amount_and_store():
    assert match_receipts([_tx("T1")], [_rc()]) == {"T1": "R1"}


def test_match_ignores_store_case():
    assert match_receipts([_tx("T1", counterparty="COOP LUZERN")], [_rc()]) == {"T1": "R1"}


@pytest.mark.parametrize(
    "tx",
    [
        _tx("T1", date="2025-11-20"),
        _tx("T1", amount_rp=999),
        _tx("T1", counterparty="Migros Luzern"),
        _tx("T1", type_="income"),
    ],
)
def test_match_rejects_a_different_transaction(tx):
    assert match_receipts([tx], [_rc()]) == {}


def test_receipt_without_transaction_stays_unmatched():
    denner = _rc("DEN-1", date="2025-11-20", total_rp=5805, store="Denner")
    assert match_receipts([_tx("T1")], [denner]) == {}


def test_one_transaction_gets_at_most_one_receipt():
    twins = [_rc("R1"), _rc("R2")]
    assert match_receipts([_tx("T1")], twins) == {"T1": "R1"}


def test_accounts_match_the_frontend_demo_values(client):
    body = client.get("/api/accounts").json()
    assert body["accounts"] == [
        {
            "id": "privat",
            "kind": "private",
            "iban_masked": "CH•• •••• •••• 4821",
            "balance_rp": 481235,
        },
        {
            "id": "savings",
            "kind": "savings",
            "iban_masked": "CH•• •••• •••• 7390",
            "balance_rp": 1200000,
        },
        {"id": "pillar3", "kind": "pillar3", "iban_masked": None, "balance_rp": 666765},
    ]


def test_accounts_total_is_the_sum_of_balances(client):
    body = client.get("/api/accounts").json()
    assert body["total_rp"] == sum(a["balance_rp"] for a in body["accounts"]) == 2348000

"""Guards for the demo data: every receipt in app/data/receipts must fit its bank transaction."""

import json

import pytest

from app.transactions import RECEIPTS_DIR, TRANSACTIONS_FILE, match_receipts

# fixed item category list in docs/mvp.md ("Item categories")
ITEM_CATEGORIES = {
    "dairy", "bakery", "fruit", "vegetables", "meat_fish", "eggs", "pasta", "frozen",
    "spreads", "snacks", "chocolate", "beverages", "coffee", "alcohol", "household",
    "personal_care",
}  # fmt: skip

TRANSACTIONS = json.loads(TRANSACTIONS_FILE.read_text(encoding="utf-8"))
RECEIPTS = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(RECEIPTS_DIR.glob("*.json"))]
LINKS = match_receipts(TRANSACTIONS, RECEIPTS)


def by_id(receipt):
    return receipt["receipt_id"]


@pytest.mark.parametrize("receipt", RECEIPTS, ids=by_id)
def test_receipt_links_to_exactly_one_transaction(receipt):
    linked = [tx_id for tx_id, rc_id in LINKS.items() if rc_id == receipt["receipt_id"]]
    assert len(linked) == 1


@pytest.mark.parametrize("receipt", RECEIPTS, ids=by_id)
def test_receipt_total_equals_its_transaction_amount(receipt):
    tx_id = next(tx_id for tx_id, rc_id in LINKS.items() if rc_id == receipt["receipt_id"])
    tx = next(tx for tx in TRANSACTIONS if tx["id"] == tx_id)
    assert tx["amount_rp"] == receipt["total_rp"]


@pytest.mark.parametrize("receipt", RECEIPTS, ids=by_id)
def test_receipt_total_is_the_sum_of_net_lines(receipt):
    net = sum(item["line_total_rp"] - item.get("discount_rp", 0) for item in receipt["items"])
    assert net == receipt["total_rp"]


@pytest.mark.parametrize("receipt", RECEIPTS, ids=by_id)
def test_line_total_is_quantity_times_unit_price(receipt):
    for item in receipt["items"]:
        expected = round(item["quantity"] * item["unit_price_rp"])
        assert expected == item["line_total_rp"], item["name"]


@pytest.mark.parametrize("receipt", RECEIPTS, ids=by_id)
def test_item_categories_are_in_the_fixed_list(receipt):
    assert {item["category"] for item in receipt["items"]} <= ITEM_CATEGORIES

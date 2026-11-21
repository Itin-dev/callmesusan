import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.scan import ITEM_CATEGORIES
from app.spending import USUAL_FILE, category_comparison

USUAL = {"alcohol": 4500, "chocolate": 2000, "fruit": 1000}


def receipt(date, *items):
    return {"date": date, "items": [dict(item) for item in items]}


def item(category, line_total_rp, discount_rp=0):
    return {"category": category, "line_total_rp": line_total_rp, "discount_rp": discount_rp}


@pytest.fixture
def client():
    return TestClient(app)


def test_totals_are_net_of_discounts():
    receipts = [receipt("2025-11-20", item("fruit", 156, 17), item("fruit", 47))]
    assert category_comparison(receipts, "2025-11", USUAL) == [
        {"category": "fruit", "total_rp": 186, "average_rp": 1000, "ratio": 0.19}
    ]


def test_ratio_is_rounded_to_two_decimals():
    receipts = [receipt("2025-11-19", item("chocolate", 4975))]
    assert category_comparison(receipts, "2025-11", USUAL)[0]["ratio"] == 2.49


def test_categories_are_sorted_by_ratio_largest_first():
    receipts = [
        receipt("2025-11-14", item("chocolate", 3000), item("fruit", 900)),
        receipt("2025-11-19", item("alcohol", 13950)),
    ]
    ranked = [entry["category"] for entry in category_comparison(receipts, "2025-11", USUAL)]
    assert ranked == ["alcohol", "chocolate", "fruit"]


def test_only_receipts_of_the_month_count():
    receipts = [
        receipt("2025-10-31", item("alcohol", 999)),
        receipt("2025-11-01", item("alcohol", 450)),
    ]
    assert category_comparison(receipts, "2025-11", USUAL)[0]["total_rp"] == 450


def test_month_without_receipts_has_no_categories():
    assert (
        category_comparison([receipt("2025-11-01", item("alcohol", 450))], "2025-10", USUAL) == []
    )


def test_usual_month_covers_every_item_category():
    usual = json.loads(USUAL_FILE.read_text(encoding="utf-8"))["usual_rp"]
    assert set(usual) == set(ITEM_CATEGORIES)
    assert all(isinstance(value, int) and value > 0 for value in usual.values())


def test_november_alcohol_is_about_three_times_the_usual(client):
    body = client.get("/api/spending/categories", params={"month": "2025-11"}).json()
    assert body["month"] == "2025-11"
    assert body["categories"][0] == {
        "category": "alcohol",
        "total_rp": 13950,
        "average_rp": 4500,
        "ratio": 3.1,
    }


def test_november_chocolate_follows_alcohol(client):
    categories = client.get("/api/spending/categories", params={"month": "2025-11"}).json()[
        "categories"
    ]
    assert categories[1] == {
        "category": "chocolate",
        "total_rp": 4975,
        "average_rp": 2000,
        "ratio": 2.49,
    }


def test_october_has_no_receipts(client):
    body = client.get("/api/spending/categories", params={"month": "2025-10"}).json()
    assert body == {"month": "2025-10", "categories": []}


@pytest.mark.parametrize("month", ["2025-13", "11-2025", "", "2025-1", "2025-11-01", " 2025-11"])
def test_a_malformed_month_is_refused(client, month):
    assert client.get("/api/spending/categories", params={"month": month}).status_code == 422


def test_the_month_is_required(client):
    assert client.get("/api/spending/categories").status_code == 422

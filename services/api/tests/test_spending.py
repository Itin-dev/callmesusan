from app.spending import (
    current_summary,
    monthly_totals,
    receipt_categories,
    spending_summary,
    top_merchants,
)


def tx(date, type_, amount_rp, counterparty, account="kk"):
    return {"date": date, "type": type_, "amount_rp": amount_rp, "counterparty": counterparty,
            "account": account}  # fmt: skip


def test_transfers_are_not_spending():
    rows = [tx("2025-03-02", "expense", 5000, "Coop"),
            tx("2025-03-23", "transfer", 5000, "KK-Konto", account="privat")]  # fmt: skip
    assert monthly_totals(rows)["2025-03"] == {"income_rp": 0, "spending_rp": 5000}


def test_salary_on_privat_is_income():
    rows = [tx("2025-03-25", "income", 746400, "Employer AG", account="privat")]
    assert monthly_totals(rows)["2025-03"] == {"income_rp": 746400, "spending_rp": 0}


def test_refund_on_kk_reduces_spending_not_income():
    rows = [tx("2025-06-10", "expense", 15915, "Abercrombie & Fitch"),
            tx("2025-06-12", "income", 8365, "Abercrombie & Fitch")]  # fmt: skip
    assert monthly_totals(rows)["2025-06"] == {"income_rp": 0, "spending_rp": 7550}


def test_top_merchants_are_net_of_refunds_and_largest_first():
    rows = [tx("2025-06-01", "expense", 1000, "Netflix"),
            tx("2025-06-02", "expense", 3000, "Zalando"),
            tx("2025-06-03", "income", 2500, "Zalando"),
            tx("2025-06-04", "expense", 2000, "SBB")]  # fmt: skip
    assert top_merchants(rows, limit=2) == [("SBB", 2000), ("Netflix", 1000)]


def test_top_merchants_can_be_limited_to_one_month():
    rows = [tx("2025-06-01", "expense", 1000, "Netflix"), tx("2025-07-01", "expense", 9000, "SBB")]
    assert top_merchants(rows, month="2025-06") == [("Netflix", 1000)]


def test_receipt_categories_are_net_of_discounts_per_month():
    receipt = {"date": "2025-11-20", "items": [
        {"category": "fruit", "line_total_rp": 156, "discount_rp": 17},
        {"category": "alcohol", "line_total_rp": 2390},
        {"category": "fruit", "line_total_rp": 47},
    ]}  # fmt: skip
    assert receipt_categories([receipt]) == {"2025-11": [("alcohol", 2390), ("fruit", 186)]}


def test_summary_has_one_line_per_month_with_chf_amounts():
    rows = [tx("2025-03-25", "income", 746400, "Employer AG", account="privat"),
            tx("2025-03-02", "expense", 182000, "Rent", account="privat")]  # fmt: skip
    text = spending_summary(rows, [])
    assert "2025-03: income 7464.00, spending 1820.00; top: Rent 1820.00" in text


def test_summary_lists_receipt_categories():
    receipt = {"date": "2025-11-19", "items": [{"category": "alcohol", "line_total_rp": 11165}]}
    assert "2025-11: alcohol 111.65" in spending_summary([], [receipt])


def test_current_summary_uses_the_demo_data():
    text = current_summary()
    assert text.count("\n2025-") >= 12
    assert "2025-11: income 7464.00" in text
    assert "2025-11: alcohol 139.50" in text

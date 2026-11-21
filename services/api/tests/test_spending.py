from datetime import date

from app.spending import (
    current_summary,
    monthly_totals,
    receipt_categories,
    spending_summary,
    top_merchants,
    year_summary,
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


def test_year_summary_leaves_out_transfers():
    rows = [tx("2025-03-02", "expense", 5000, "Coop"),
            tx("2025-03-23", "transfer", 5000, "KK-Konto", account="privat")]  # fmt: skip
    assert year_summary(rows, 2025)["expenses"] == {
        "total_rp": 5000, "count": 1, "monthly_average_rp": 416,
    }  # fmt: skip


def test_year_summary_subtracts_refunds_but_does_not_count_them():
    rows = [tx("2025-06-10", "expense", 15915, "Abercrombie & Fitch"),
            tx("2025-06-12", "income", 8365, "Abercrombie & Fitch")]  # fmt: skip
    summary = year_summary(rows, 2025)
    assert summary["expenses"]["total_rp"] == 7550
    assert summary["expenses"]["count"] == 1
    assert summary["income"] == {"total_rp": 0, "count": 0, "monthly_average_rp": 0}


def test_year_summary_counts_salary_on_privat_as_income():
    rows = [tx("2025-01-25", "income", 746400, "Employer AG", account="privat")]
    assert year_summary(rows, 2025)["income"] == {
        "total_rp": 746400, "count": 1, "monthly_average_rp": 62200,
    }  # fmt: skip


def test_year_summary_rounds_the_monthly_average_down():
    rows = [tx("2025-01-05", "expense", 23, "Kiosk")]
    assert year_summary(rows, 2025)["expenses"]["monthly_average_rp"] == 1


def test_year_summary_only_uses_rows_of_that_year():
    rows = [tx("2024-12-31", "expense", 999, "Coop"), tx("2025-01-01", "expense", 100, "Coop")]
    assert year_summary(rows, 2025)["expenses"]["total_rp"] == 100


def test_year_summary_names_the_whole_year_as_period():
    summary = year_summary([tx("2025-05-05", "expense", 100, "Coop")], 2025)
    assert (summary["period_start"], summary["period_end"]) == ("2025-01-01", "2025-12-31")


DEMO_TODAY = date(2025, 11, 21)


def test_summary_starts_with_today_and_the_data_range():
    rows = [tx("2025-01-05", "expense", 100, "Coop"), tx("2025-11-20", "expense", 100, "Coop")]
    text = spending_summary(rows, [], today=DEMO_TODAY)
    assert text.startswith(
        "Today is Friday, 2025-11-21. The data covers 2025-01-05 to 2025-11-21;"
        " there is no data before 2025-01-05."
    )


def test_summary_hides_transactions_after_today():
    rows = [tx("2025-11-21", "expense", 100, "Coop"), tx("2025-11-22", "expense", 999, "Apple")]
    text = spending_summary(rows, [], today=DEMO_TODAY)
    assert "Apple" not in text
    assert "2025-11: income 0.00, spending 1.00" in text


def test_summary_hides_receipts_after_today():
    later = {"date": "2025-11-22", "items": [{"category": "alcohol", "line_total_rp": 900}]}
    assert "alcohol" not in spending_summary([], [later], today=DEMO_TODAY)


def test_week_line_lists_the_spending_per_day_with_the_rules():
    rows = [tx("2025-11-17", "expense", 1505, "Kantine AG", account="privat"),
            tx("2025-11-19", "expense", 11970, "Coop Luzern Bahnhof"),
            tx("2025-11-20", "transfer", 50000, "KK-Konto", account="privat"),
            tx("2025-11-21", "income", 500, "Zalando")]  # fmt: skip
    text = spending_summary(rows, [], today=DEMO_TODAY)
    assert (
        "2025-W47 (2025-11-17 to 2025-11-23): spending 129.75;"
        " Mon 2025-11-17 15.05, Wed 2025-11-19 119.70, Fri 2025-11-21 -5.00"
    ) in text


def test_summary_has_the_last_six_weeks_up_to_today():
    rows = [tx("2025-11-17", "expense", 100, "Coop")]
    text = spending_summary(rows, [], today=DEMO_TODAY)
    weeks = [line[:8] for line in text.splitlines() if line.startswith("2025-W")]
    assert weeks == ["2025-W42", "2025-W43", "2025-W44", "2025-W45", "2025-W46", "2025-W47"]


def test_week_without_spending_says_so():
    text = spending_summary([tx("2025-11-17", "expense", 100, "Coop")], [], today=DEMO_TODAY)
    assert "2025-W46 (2025-11-10 to 2025-11-16): spending 0.00; no spending" in text


def test_demo_summary_answers_last_week_and_this_week():
    text = current_summary(DEMO_TODAY)
    assert "2025-W46 (2025-11-10 to 2025-11-16): spending 807.80;" in text
    assert "2025-W47 (2025-11-17 to 2025-11-23): spending 469.96;" in text
    assert "2025-12:" not in text


def test_summary_lists_what_psst_can_see_and_cannot_do():
    rows = [tx("2025-01-03", "expense", 1325, "Kantine AG", account="privat"),
            tx("2025-11-19", "expense", 11970, "Coop Luzern Bahnhof")]  # fmt: skip
    coop = {
        "date": "2025-11-19",
        "store": "Coop",
        "items": [{"category": "alcohol", "line_total_rp": 11970}],
    }
    text = spending_summary(rows, [coop], today=DEMO_TODAY)
    assert "What Psst can see:" in text
    assert (
        "- 2 transactions of the Privatkonto and the credit card account (KK-Konto)"
        " from 2025-01-03 to 2025-11-21."
    ) in text
    assert "- 1 digital receipts from partner shops (Coop) with their item lists." in text
    assert (
        "- Psst cannot see other banks, cash payments, or receipts of other shops"
        " unless the user scans them."
    ) in text
    assert "- Psst only reads: it cannot pay, transfer money or sign anything." in text


def test_summary_compares_receipt_categories_with_the_usual_month():
    receipt = {"date": "2025-11-19", "items": [{"category": "alcohol", "line_total_rp": 11165}]}
    text = spending_summary([], [receipt], usual={"alcohol": 4500})
    assert "2025-11: alcohol 111.65 (usual 45.00, 2.48x)" in text


def test_summary_lists_the_current_month_up_to_today_as_a_statement():
    rows = [tx("2025-10-31", "expense", 999, "Old Shop"),
            tx("2025-11-21", "expense", 910, "LOLA Mattenhof", account="privat"),
            tx("2025-11-03", "income", 500, "Zalando"),
            tx("2025-11-22", "expense", 777, "Later Shop")]  # fmt: skip
    text = spending_summary(rows, [], today=DEMO_TODAY)
    statement = text[text.index("Transactions of 2025-11 up to today") :]
    lines = [line for line in statement.splitlines()[1:] if line.startswith("2025-")]
    assert lines == [
        "2025-11-03 credit card refund Zalando +5.00",
        "2025-11-21 Privatkonto expense LOLA Mattenhof -9.10",
    ]
    assert "Old Shop" not in statement and "Later Shop" not in text


def test_demo_summary_answers_the_pitch_questions():
    text = current_summary(DEMO_TODAY)
    assert "- 486 transactions of the Privatkonto and the credit card account" in text
    assert "(Coop, Denner, Lidl, Migros)" in text
    assert (
        "2025-11: alcohol 139.50 (usual 45.00, 3.1x), chocolate 49.75 (usual 20.00, 2.49x)" in text
    )
    assert "2025-11-19 credit card expense Coop Luzern Bahnhof -119.70" in text

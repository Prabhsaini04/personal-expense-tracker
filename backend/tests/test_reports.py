def _make_category(client, name):
    return client.post("/api/categories", json={"name": name}).get_json()


def test_category_totals_includes_zero_total_categories(client):
    food = _make_category(client, "Food")
    _make_category(client, "Transport")
    client.post(
        "/api/expenses",
        json={"amount": "10.00", "category_id": food["id"], "expense_date": "2026-01-01"},
    )

    resp = client.get("/api/reports/category-totals")
    assert resp.status_code == 200
    totals = {row["category_name"]: row["total"] for row in resp.get_json()}
    assert totals["Food"] == "10.00"
    assert totals["Transport"] == "0.00"


def test_category_totals_reconciles_with_expense_list(client):
    food = _make_category(client, "Food")
    client.post(
        "/api/expenses",
        json={"amount": "10.00", "category_id": food["id"], "expense_date": "2026-01-01"},
    )
    client.post(
        "/api/expenses",
        json={"amount": "5.25", "category_id": food["id"], "expense_date": "2026-01-05"},
    )

    expenses = client.get("/api/expenses").get_json()
    expected_total = sum(float(e["amount"]) for e in expenses)

    totals = client.get("/api/reports/category-totals").get_json()
    food_total = next(row for row in totals if row["category_name"] == "Food")["total"]
    assert float(food_total) == expected_total


def test_category_totals_invalid_date_range(client):
    resp = client.get(
        "/api/reports/category-totals?start_date=2026-02-01&end_date=2026-01-01"
    )
    assert resp.status_code == 400


def test_monthly_totals_grouped_by_month(client):
    food = _make_category(client, "Food")
    client.post(
        "/api/expenses",
        json={"amount": "10.00", "category_id": food["id"], "expense_date": "2026-01-01"},
    )
    client.post(
        "/api/expenses",
        json={"amount": "20.00", "category_id": food["id"], "expense_date": "2026-02-01"},
    )

    resp = client.get("/api/reports/monthly-totals")
    assert resp.status_code == 200
    totals = {row["month"]: row["total"] for row in resp.get_json()}
    assert totals["2026-01"] == "10.00"
    assert totals["2026-02"] == "20.00"


def test_monthly_totals_empty_period(client):
    resp = client.get("/api/reports/monthly-totals")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_monthly_totals_inclusive_date_boundary(client):
    food = _make_category(client, "Food")
    client.post(
        "/api/expenses",
        json={"amount": "10.00", "category_id": food["id"], "expense_date": "2026-01-31"},
    )

    resp = client.get(
        "/api/reports/monthly-totals?start_date=2026-01-31&end_date=2026-01-31"
    )
    totals = resp.get_json()
    assert len(totals) == 1
    assert totals[0]["total"] == "10.00"

from datetime import date

from app.models import Expense


def _make_category(client, name="Food"):
    return client.post("/api/categories", json={"name": name}).get_json()


def test_create_expense_happy_path(client):
    category = _make_category(client)
    resp = client.post(
        "/api/expenses",
        json={
            "amount": "12.50",
            "category_id": category["id"],
            "expense_date": "2026-01-15",
            "description": "Lunch",
        },
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["amount"] == "12.50"
    assert body["description"] == "Lunch"


def test_create_expense_optional_description(client):
    category = _make_category(client)
    resp = client.post(
        "/api/expenses",
        json={"amount": "5", "category_id": category["id"], "expense_date": "2026-01-15"},
    )
    assert resp.status_code == 201
    assert resp.get_json()["description"] == ""


def test_create_expense_missing_amount(client):
    category = _make_category(client)
    resp = client.post(
        "/api/expenses",
        json={"category_id": category["id"], "expense_date": "2026-01-15"},
    )
    assert resp.status_code == 400
    assert "amount" in resp.get_json()["errors"]


def test_create_expense_zero_or_negative_amount(client):
    category = _make_category(client)
    for bad_amount in ["0", "-5"]:
        resp = client.post(
            "/api/expenses",
            json={
                "amount": bad_amount,
                "category_id": category["id"],
                "expense_date": "2026-01-15",
            },
        )
        assert resp.status_code == 400


def test_create_expense_too_many_decimals(client):
    category = _make_category(client)
    resp = client.post(
        "/api/expenses",
        json={
            "amount": "12.999",
            "category_id": category["id"],
            "expense_date": "2026-01-15",
        },
    )
    assert resp.status_code == 400


def test_create_expense_amount_exceeds_ceiling(client):
    category = _make_category(client)
    resp = client.post(
        "/api/expenses",
        json={
            "amount": "100000000.00",
            "category_id": category["id"],
            "expense_date": "2026-01-15",
        },
    )
    assert resp.status_code == 400


def test_create_expense_missing_category(client):
    resp = client.post(
        "/api/expenses", json={"amount": "5", "expense_date": "2026-01-15"}
    )
    assert resp.status_code == 400
    assert "category_id" in resp.get_json()["errors"]


def test_create_expense_invalid_date(client):
    category = _make_category(client)
    resp = client.post(
        "/api/expenses",
        json={"amount": "5", "category_id": category["id"], "expense_date": "not-a-date"},
    )
    assert resp.status_code == 400
    assert "expense_date" in resp.get_json()["errors"]


def test_create_expense_future_date_allowed(client):
    category = _make_category(client)
    resp = client.post(
        "/api/expenses",
        json={"amount": "5", "category_id": category["id"], "expense_date": "2099-01-01"},
    )
    assert resp.status_code == 201


def test_list_expenses_empty(client):
    resp = client.get("/api/expenses")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_list_expenses_sorted_most_recent_first(client):
    category = _make_category(client)
    client.post(
        "/api/expenses",
        json={"amount": "1", "category_id": category["id"], "expense_date": "2026-01-01"},
    )
    client.post(
        "/api/expenses",
        json={"amount": "2", "category_id": category["id"], "expense_date": "2026-02-01"},
    )
    resp = client.get("/api/expenses")
    dates = [row["expense_date"] for row in resp.get_json()]
    assert dates == ["2026-02-01", "2026-01-01"]


def test_list_expenses_null_category_renders_uncategorized(client, db):
    expense = Expense(amount="9.99", category_id=None, expense_date=date(2026, 1, 1))
    db.session.add(expense)
    db.session.commit()

    resp = client.get("/api/expenses")
    assert resp.status_code == 200
    assert resp.get_json()[0]["category_name"] == "Uncategorized"


def test_list_expenses_invalid_date_range(client):
    resp = client.get(
        "/api/expenses?start_date=2026-02-01&end_date=2026-01-01"
    )
    assert resp.status_code == 400


def test_get_expense_not_found(client):
    resp = client.get("/api/expenses/999")
    assert resp.status_code == 404


def test_update_expense_happy_path(client):
    category = _make_category(client)
    created = client.post(
        "/api/expenses",
        json={"amount": "5", "category_id": category["id"], "expense_date": "2026-01-15"},
    ).get_json()

    resp = client.put(
        f"/api/expenses/{created['id']}",
        json={
            "amount": "7.50",
            "category_id": category["id"],
            "expense_date": "2026-01-16",
            "description": "Updated",
        },
    )
    assert resp.status_code == 200
    assert resp.get_json()["amount"] == "7.50"


def test_update_expense_invalid_leaves_original_unchanged(client):
    category = _make_category(client)
    created = client.post(
        "/api/expenses",
        json={"amount": "5", "category_id": category["id"], "expense_date": "2026-01-15"},
    ).get_json()

    resp = client.put(
        f"/api/expenses/{created['id']}",
        json={"amount": "-1", "category_id": category["id"], "expense_date": "2026-01-15"},
    )
    assert resp.status_code == 400

    unchanged = client.get(f"/api/expenses/{created['id']}").get_json()
    assert unchanged["amount"] == "5.00"


def test_update_expense_not_found(client):
    category = _make_category(client)
    resp = client.put(
        "/api/expenses/999",
        json={"amount": "5", "category_id": category["id"], "expense_date": "2026-01-15"},
    )
    assert resp.status_code == 404


def test_delete_expense_happy_path(client):
    category = _make_category(client)
    created = client.post(
        "/api/expenses",
        json={"amount": "5", "category_id": category["id"], "expense_date": "2026-01-15"},
    ).get_json()

    resp = client.delete(f"/api/expenses/{created['id']}")
    assert resp.status_code == 204
    assert client.get("/api/expenses").get_json() == []


def test_delete_expense_twice_returns_404(client):
    category = _make_category(client)
    created = client.post(
        "/api/expenses",
        json={"amount": "5", "category_id": category["id"], "expense_date": "2026-01-15"},
    ).get_json()

    client.delete(f"/api/expenses/{created['id']}")
    resp = client.delete(f"/api/expenses/{created['id']}")
    assert resp.status_code == 404

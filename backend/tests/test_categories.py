from app.models import Category


def test_list_categories_empty(client):
    resp = client.get("/api/categories")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_create_category(client):
    resp = client.post("/api/categories", json={"name": "Food"})
    assert resp.status_code == 201
    assert resp.get_json()["name"] == "Food"


def test_create_category_missing_name(client):
    resp = client.post("/api/categories", json={})
    assert resp.status_code == 400
    assert "name" in resp.get_json()["errors"]


def test_create_category_duplicate_case_insensitive(client):
    client.post("/api/categories", json={"name": "Food"})
    resp = client.post("/api/categories", json={"name": "food"})
    assert resp.status_code == 409


def test_rename_category_not_found(client):
    resp = client.put("/api/categories/999", json={"name": "New"})
    assert resp.status_code == 404


def test_rename_category_duplicate(client):
    client.post("/api/categories", json={"name": "Food"})
    other = client.post("/api/categories", json={"name": "Transport"}).get_json()
    resp = client.put(f"/api/categories/{other['id']}", json={"name": "food"})
    assert resp.status_code == 409


def test_delete_category_success(client):
    created = client.post("/api/categories", json={"name": "Food"}).get_json()
    resp = client.delete(f"/api/categories/{created['id']}")
    assert resp.status_code == 204


def test_delete_category_not_found(client):
    resp = client.delete("/api/categories/999")
    assert resp.status_code == 404


def test_delete_category_blocked_when_in_use(client, db):
    category = client.post("/api/categories", json={"name": "Food"}).get_json()
    client.post(
        "/api/expenses",
        json={
            "amount": "10.00",
            "category_id": category["id"],
            "expense_date": "2026-01-01",
        },
    )
    resp = client.delete(f"/api/categories/{category['id']}")
    assert resp.status_code == 409
    assert Category.query.count() == 1

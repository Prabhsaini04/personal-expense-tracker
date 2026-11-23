from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Category, Expense
from ..validation import (
    ValidationError,
    validate_amount,
    validate_date_range,
    validate_description,
    validate_expense_date,
)

bp = Blueprint("expenses", __name__, url_prefix="/api/expenses")


def _validate_expense_payload(data):
    errors = {}
    amount = category_id = expense_date = description = None

    try:
        amount = validate_amount(data.get("amount"))
    except ValidationError as exc:
        errors.update(exc.errors)

    category_id = data.get("category_id")
    if category_id is None:
        errors["category_id"] = "Category is required."
    elif not db.session.get(Category, category_id):
        errors["category_id"] = "Category does not exist."

    try:
        expense_date = validate_expense_date(data.get("expense_date"))
    except ValidationError as exc:
        errors.update(exc.errors)

    try:
        description = validate_description(data.get("description"))
    except ValidationError as exc:
        errors.update(exc.errors)

    if errors:
        raise ValidationError(errors)

    return amount, category_id, expense_date, description


@bp.get("")
def list_expenses():
    query = Expense.query

    category_id = request.args.get("category_id")
    if category_id:
        query = query.filter(Expense.category_id == category_id)

    try:
        start, end = validate_date_range(
            request.args.get("start_date"), request.args.get("end_date")
        )
    except ValidationError as exc:
        return jsonify({"errors": exc.errors}), 400

    if start:
        query = query.filter(Expense.expense_date >= start)
    if end:
        query = query.filter(Expense.expense_date <= end)

    expenses = query.order_by(Expense.expense_date.desc(), Expense.id.desc()).all()
    return jsonify([e.to_dict() for e in expenses])


@bp.get("/<int:expense_id>")
def get_expense(expense_id):
    expense = db.session.get(Expense, expense_id)
    if expense is None:
        return jsonify({"error": "Expense not found."}), 404
    return jsonify(expense.to_dict())


@bp.post("")
def create_expense():
    data = request.get_json(silent=True) or {}
    try:
        amount, category_id, expense_date, description = _validate_expense_payload(data)
    except ValidationError as exc:
        return jsonify({"errors": exc.errors}), 400

    expense = Expense(
        amount=amount,
        category_id=category_id,
        expense_date=expense_date,
        description=description,
    )
    db.session.add(expense)
    db.session.commit()
    return jsonify(expense.to_dict()), 201


@bp.put("/<int:expense_id>")
def update_expense(expense_id):
    expense = db.session.get(Expense, expense_id)
    if expense is None:
        return jsonify({"error": "Expense not found."}), 404

    data = request.get_json(silent=True) or {}
    try:
        amount, category_id, expense_date, description = _validate_expense_payload(data)
    except ValidationError as exc:
        return jsonify({"errors": exc.errors}), 400

    expense.amount = amount
    expense.category_id = category_id
    expense.expense_date = expense_date
    expense.description = description
    db.session.commit()
    return jsonify(expense.to_dict())


@bp.delete("/<int:expense_id>")
def delete_expense(expense_id):
    expense = db.session.get(Expense, expense_id)
    if expense is None:
        return jsonify({"error": "Expense not found."}), 404

    db.session.delete(expense)
    db.session.commit()
    return "", 204

from collections import OrderedDict
from decimal import Decimal

from flask import Blueprint, jsonify, request

from ..models import Category, Expense
from ..validation import ValidationError, validate_date_range

bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _filtered_expenses(start, end):
    query = Expense.query
    if start:
        query = query.filter(Expense.expense_date >= start)
    if end:
        query = query.filter(Expense.expense_date <= end)
    return query.all()


@bp.get("/category-totals")
def category_totals():
    try:
        start, end = validate_date_range(
            request.args.get("start_date"), request.args.get("end_date")
        )
    except ValidationError as exc:
        return jsonify({"errors": exc.errors}), 400

    totals = {c.id: Decimal("0.00") for c in Category.query.all()}
    names = {c.id: c.name for c in Category.query.all()}

    for expense in _filtered_expenses(start, end):
        if expense.category_id in totals:
            totals[expense.category_id] += expense.amount

    result = [
        {"category_id": cid, "category_name": names[cid], "total": str(total)}
        for cid, total in totals.items()
    ]
    result.sort(key=lambda row: row["category_name"].lower())
    return jsonify(result)


@bp.get("/monthly-totals")
def monthly_totals():
    try:
        start, end = validate_date_range(
            request.args.get("start_date"), request.args.get("end_date")
        )
    except ValidationError as exc:
        return jsonify({"errors": exc.errors}), 400

    totals = OrderedDict()
    for expense in sorted(_filtered_expenses(start, end), key=lambda e: e.expense_date):
        month_key = expense.expense_date.strftime("%Y-%m")
        totals[month_key] = totals.get(month_key, Decimal("0.00")) + expense.amount

    result = [{"month": month, "total": str(total)} for month, total in totals.items()]
    return jsonify(result)

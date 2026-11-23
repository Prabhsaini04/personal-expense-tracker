from flask import Blueprint, jsonify, request
from sqlalchemy import func

from ..extensions import db
from ..models import Category
from ..validation import ValidationError, validate_category_name

bp = Blueprint("categories", __name__, url_prefix="/api/categories")


@bp.get("")
def list_categories():
    categories = Category.query.order_by(Category.name.asc()).all()
    return jsonify([c.to_dict() for c in categories])


@bp.post("")
def create_category():
    data = request.get_json(silent=True) or {}
    try:
        name = validate_category_name(data.get("name"))
    except ValidationError as exc:
        return jsonify({"errors": exc.errors}), 400

    existing = Category.query.filter(func.lower(Category.name) == name.lower()).first()
    if existing:
        return jsonify({"error": f'Category "{name}" already exists.'}), 409

    category = Category(name=name)
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@bp.put("/<int:category_id>")
def rename_category(category_id):
    category = db.session.get(Category, category_id)
    if category is None:
        return jsonify({"error": "Category not found."}), 404

    data = request.get_json(silent=True) or {}
    try:
        name = validate_category_name(data.get("name"))
    except ValidationError as exc:
        return jsonify({"errors": exc.errors}), 400

    existing = Category.query.filter(
        func.lower(Category.name) == name.lower(), Category.id != category_id
    ).first()
    if existing:
        return jsonify({"error": f'Category "{name}" already exists.'}), 409

    category.name = name
    db.session.commit()
    return jsonify(category.to_dict())


@bp.delete("/<int:category_id>")
def delete_category(category_id):
    category = db.session.get(Category, category_id)
    if category is None:
        return jsonify({"error": "Category not found."}), 404

    in_use_count = len(category.expenses)
    if in_use_count > 0:
        return (
            jsonify(
                {
                    "error": f"{in_use_count} expense(s) use this category; "
                    "reassign or delete them first."
                }
            ),
            409,
        )

    db.session.delete(category)
    db.session.commit()
    return "", 204

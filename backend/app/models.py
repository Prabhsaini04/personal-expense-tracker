from datetime import datetime, UTC

from .extensions import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))

    expenses = db.relationship("Expense", back_populates="category")

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class Expense(db.Model):
    __tablename__ = "expenses"

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category_id = db.Column(
        db.Integer, db.ForeignKey("categories.id", ondelete="RESTRICT"), nullable=True
    )
    expense_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(UTC))
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    category = db.relationship("Category", back_populates="expenses")

    def to_dict(self):
        return {
            "id": self.id,
            "amount": str(self.amount),
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else "Uncategorized",
            "expense_date": self.expense_date.isoformat(),
            "description": self.description or "",
        }

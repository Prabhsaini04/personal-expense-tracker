from datetime import date, datetime
from decimal import Decimal, InvalidOperation

MAX_AMOUNT = Decimal("99999999.99")
MAX_DESCRIPTION_LENGTH = 500


class ValidationError(Exception):
    """Raised with a dict of field -> message."""

    def __init__(self, errors):
        super().__init__(str(errors))
        self.errors = errors


def validate_amount(raw_amount):
    if raw_amount is None or raw_amount == "":
        raise ValidationError({"amount": "Amount is required."})
    try:
        amount = Decimal(str(raw_amount))
    except (InvalidOperation, ValueError):
        raise ValidationError({"amount": "Amount must be a number."})
    if amount <= 0:
        raise ValidationError({"amount": "Amount must be greater than 0."})
    exponent = amount.as_tuple().exponent
    if isinstance(exponent, int) and exponent < -2:
        raise ValidationError({"amount": "Amount must have at most 2 decimal places."})
    if amount > MAX_AMOUNT:
        raise ValidationError({"amount": f"Amount must not exceed {MAX_AMOUNT}."})
    return amount.quantize(Decimal("0.01"))


def validate_expense_date(raw_date):
    if not raw_date:
        raise ValidationError({"expense_date": "Date is required."})
    try:
        return datetime.strptime(raw_date, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise ValidationError({"expense_date": "Date must be a valid calendar date (YYYY-MM-DD)."})


def validate_description(raw_description):
    if raw_description is None:
        return ""
    if not isinstance(raw_description, str):
        raise ValidationError({"description": "Description must be text."})
    if len(raw_description) > MAX_DESCRIPTION_LENGTH:
        raise ValidationError(
            {"description": f"Description must not exceed {MAX_DESCRIPTION_LENGTH} characters."}
        )
    return raw_description


def validate_category_name(raw_name):
    if raw_name is None or not isinstance(raw_name, str) or not raw_name.strip():
        raise ValidationError({"name": "Category name is required."})
    return raw_name.strip()


def validate_date_range(start_raw, end_raw):
    start = _parse_optional_date(start_raw, "start_date")
    end = _parse_optional_date(end_raw, "end_date")
    if start and end and start > end:
        raise ValidationError({"start_date": "start_date must not be after end_date."})
    return start, end


def _parse_optional_date(raw, field_name):
    if not raw:
        return None
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        raise ValidationError({field_name: f"{field_name} must be a valid date (YYYY-MM-DD)."})

"""PDF generator service for insurance claim documents."""

import os
from datetime import date
from pathlib import Path

# On macOS with Homebrew, WeasyPrint needs these libraries on the dyld path.
_HOMEBREW_LIB = "/opt/homebrew/lib"
if os.path.isdir(_HOMEBREW_LIB):
    _existing = os.environ.get("DYLD_LIBRARY_PATH", "")
    if _HOMEBREW_LIB not in _existing.split(":"):
        os.environ["DYLD_LIBRARY_PATH"] = f"{_HOMEBREW_LIB}:{_existing}" if _existing else _HOMEBREW_LIB

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

_TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
_jinja_env = Environment(loader=FileSystemLoader(str(_TEMPLATES_DIR)))


def generate_claim_pdf(claim_data: dict) -> bytes:
    """Render the claim template and convert to PDF bytes.

    Args:
        claim_data: dict containing claim fields. Expected keys:
            - pet_name, breed, age, gender
            - owner_name, owner_phone
            - clinic_name, clinic_business_number, visit_date, diagnosis
            - items: list of {name, quantity, unit_price, amount}
            - total_amount: int
            - estimated_payout: int
            - claim_number (optional)
            - submitted_date (optional)

    Returns:
        PDF file as bytes.
    """
    template = _jinja_env.get_template("claim_template.html")

    # Build items with safe defaults
    items = claim_data.get("items") or []
    normalized_items = []
    for item in items:
        normalized_items.append(
            {
                "name": item.get("name", "-"),
                "quantity": item.get("quantity", 1),
                "unit_price": item.get("unit_price", 0),
                "amount": item.get("amount", 0),
            }
        )

    # Derive total if not explicitly provided
    total_amount = claim_data.get("total_amount", 0)
    if total_amount == 0 and normalized_items:
        total_amount = sum(i["amount"] for i in normalized_items)

    estimated_payout = claim_data.get("estimated_payout", 0)
    if estimated_payout == 0 and total_amount > 0:
        # Default estimate: 80% of total minus 5,000 won deductible
        estimated_payout = max(0, int(total_amount * 0.8) - 5000)

    context = {
        "pet_name": claim_data.get("pet_name", "-"),
        "breed": claim_data.get("breed", "-"),
        "age": claim_data.get("age", "-"),
        "gender": claim_data.get("gender", "-"),
        "owner_name": claim_data.get("owner_name", "-"),
        "owner_phone": claim_data.get("owner_phone", "-"),
        "clinic_name": claim_data.get("clinic_name", "-"),
        "clinic_business_number": claim_data.get("clinic_business_number", "-"),
        "visit_date": claim_data.get("visit_date", "-"),
        "diagnosis": claim_data.get("diagnosis", "-"),
        "items": normalized_items,
        "total_amount": total_amount,
        "estimated_payout": estimated_payout,
        "claim_number": claim_data.get("claim_number", "자동생성"),
        "submitted_date": claim_data.get("submitted_date", date.today().isoformat()),
        "generated_date": date.today().strftime("%Y년 %m월 %d일"),
    }

    html_content = template.render(**context)
    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes

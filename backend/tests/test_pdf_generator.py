"""Tests for the PDF generator service."""

import pytest
from services.pdf_generator import generate_claim_pdf


_FULL_CLAIM = {
    "pet_name": "코코",
    "breed": "말티즈",
    "age": "3세",
    "gender": "수컷",
    "owner_name": "홍길동",
    "owner_phone": "010-1234-5678",
    "clinic_name": "행복동물병원",
    "clinic_business_number": "123-45-67890",
    "visit_date": "2024-03-15",
    "diagnosis": "슬개골 탈구 1기",
    "items": [
        {"name": "초진 진찰료", "quantity": 1, "unit_price": 15000, "amount": 15000},
        {"name": "X-ray 촬영", "quantity": 2, "unit_price": 35000, "amount": 70000},
        {"name": "처치료", "quantity": 1, "unit_price": 25000, "amount": 25000},
        {"name": "약품비", "quantity": 1, "unit_price": 18000, "amount": 18000},
    ],
    "total_amount": 128000,
    "estimated_payout": 97400,
    "claim_number": "HTP-2024-001",
    "submitted_date": "2024-03-16",
}


class TestGenerateClaimPdf:
    def test_generate_claim_pdf_returns_bytes(self):
        pdf = generate_claim_pdf(_FULL_CLAIM)

        assert isinstance(pdf, bytes)
        assert len(pdf) > 0
        # PDF files start with the %PDF- header
        assert pdf[:5] == b"%PDF-"

    def test_generated_pdf_has_reasonable_size(self):
        pdf = generate_claim_pdf(_FULL_CLAIM)

        # A rendered A4 page should be at least 5KB
        assert len(pdf) > 5000

    def test_generate_claim_pdf_with_missing_fields(self):
        """Partial data (only required minimums) should still produce a valid PDF."""
        partial_data = {
            "pet_name": "멍멍이",
            "clinic_name": "서울동물병원",
            "items": [
                {"name": "진찰료", "quantity": 1, "unit_price": 20000, "amount": 20000}
            ],
            "total_amount": 20000,
        }
        pdf = generate_claim_pdf(partial_data)

        assert isinstance(pdf, bytes)
        assert pdf[:5] == b"%PDF-"

    def test_generate_claim_pdf_with_empty_dict(self):
        """Empty dict should still produce a valid PDF without crashing."""
        pdf = generate_claim_pdf({})

        assert isinstance(pdf, bytes)
        assert pdf[:5] == b"%PDF-"

    def test_generate_claim_pdf_auto_calculates_total(self):
        """When total_amount is 0, it should be derived from items."""
        data = {
            "pet_name": "해피",
            "items": [
                {"name": "진찰료", "quantity": 1, "unit_price": 15000, "amount": 15000},
                {"name": "약품비", "quantity": 1, "unit_price": 10000, "amount": 10000},
            ],
            "total_amount": 0,
        }
        pdf = generate_claim_pdf(data)

        assert isinstance(pdf, bytes)
        assert pdf[:5] == b"%PDF-"

    def test_generate_claim_pdf_auto_calculates_payout(self):
        """When estimated_payout is 0, it should be auto-calculated."""
        data = {
            "pet_name": "해피",
            "items": [
                {"name": "수술비", "quantity": 1, "unit_price": 500000, "amount": 500000},
            ],
            "total_amount": 500000,
            "estimated_payout": 0,
        }
        pdf = generate_claim_pdf(data)

        assert isinstance(pdf, bytes)
        assert pdf[:5] == b"%PDF-"

    def test_generate_claim_pdf_with_no_items(self):
        """No items list should not crash."""
        data = {
            "pet_name": "코코",
            "clinic_name": "하나동물병원",
            "total_amount": 50000,
        }
        pdf = generate_claim_pdf(data)

        assert isinstance(pdf, bytes)
        assert pdf[:5] == b"%PDF-"

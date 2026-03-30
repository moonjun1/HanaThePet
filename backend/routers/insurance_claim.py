"""Insurance claim OCR and PDF generation API router."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Response, UploadFile
from pydantic import BaseModel

from services.openai_vision import analyze_receipt
from services.pdf_generator import generate_claim_pdf

router = APIRouter(prefix="/api/claim", tags=["claim"])

# ── Response / Request Models ────────────────────────────────────────────────


class ReceiptItem(BaseModel):
    name: str
    quantity: int
    unit_price: int
    amount: int


class OcrResultResponse(BaseModel):
    clinic_name: Optional[str] = None
    clinic_business_number: Optional[str] = None
    visit_date: Optional[str] = None
    diagnosis: Optional[str] = None
    items: List[ReceiptItem] = []
    total_amount: int = 0
    pet_name: Optional[str] = None


class GeneratePdfRequest(BaseModel):
    # Pet info
    pet_name: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    # Clinic / receipt info
    clinic_name: Optional[str] = None
    clinic_business_number: Optional[str] = None
    visit_date: Optional[str] = None
    diagnosis: Optional[str] = None
    items: List[ReceiptItem] = []
    total_amount: int = 0
    estimated_payout: int = 0
    claim_number: Optional[str] = None
    submitted_date: Optional[str] = None


# ── Sample fallback data ─────────────────────────────────────────────────────

_FALLBACK_OCR: dict = {
    "clinic_name": "샘플동물병원",
    "clinic_business_number": "000-00-00000",
    "visit_date": "2024-01-15",
    "diagnosis": "슬개골 탈구 (샘플 데이터)",
    "items": [
        {"name": "초진 진찰료", "quantity": 1, "unit_price": 15000, "amount": 15000},
        {"name": "X-ray 촬영", "quantity": 1, "unit_price": 35000, "amount": 35000},
        {"name": "약품비", "quantity": 1, "unit_price": 18000, "amount": 18000},
    ],
    "total_amount": 68000,
    "pet_name": None,
}


# ── Endpoints ────────────────────────────────────────────────────────────────


@router.post("/ocr", response_model=OcrResultResponse)
async def ocr_receipt(image: UploadFile) -> OcrResultResponse:
    """Perform OCR on a veterinary receipt image using GPT-4o Vision.

    On AI failure, returns sample receipt data.
    """
    image_bytes = await image.read()

    try:
        result = await _run_receipt_vision(image_bytes)
    except Exception:
        result = _FALLBACK_OCR.copy()

    # Normalize items
    items = [
        ReceiptItem(
            name=i.get("name", "-"),
            quantity=i.get("quantity", 1) or 1,
            unit_price=i.get("unit_price", 0) or 0,
            amount=i.get("amount", 0) or 0,
        )
        for i in (result.get("items") or [])
    ]

    return OcrResultResponse(
        clinic_name=result.get("clinic_name"),
        clinic_business_number=result.get("clinic_business_number"),
        visit_date=result.get("visit_date"),
        diagnosis=result.get("diagnosis"),
        items=items,
        total_amount=result.get("total_amount") or 0,
        pet_name=result.get("pet_name"),
    )


@router.post("/generate-pdf")
async def generate_pdf(request: GeneratePdfRequest) -> Response:
    """Generate a PDF insurance claim form from structured claim data.

    Returns a PDF file as application/pdf.
    """
    claim_data = request.model_dump()
    # Convert ReceiptItem pydantic objects to dicts for the generator
    claim_data["items"] = [i.model_dump() for i in request.items]

    pdf_bytes = generate_claim_pdf(claim_data)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="claim.pdf"',
        },
    )


# ── Helpers ──────────────────────────────────────────────────────────────────


async def _run_receipt_vision(image_bytes: bytes) -> dict:
    import asyncio

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, analyze_receipt, image_bytes)

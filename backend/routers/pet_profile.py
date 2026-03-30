"""Pet profile analysis API router."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Form, UploadFile
from pydantic import BaseModel

from services.cost_predictor import predict_lifetime_cost, recommend_insurance, recommend_savings
from services.openai_vision import analyze_pet_photo

router = APIRouter(prefix="/api/pet", tags=["pet"])

# ── Response Models ──────────────────────────────────────────────────────────


class BreakdownModel(BaseModel):
    checkup: int
    disease: int
    surgery: int


class CostPrediction(BaseModel):
    breed: str
    age: int
    life_expectancy: int
    remaining_years: int
    total_lifetime_cost: int
    breakdown: BreakdownModel
    common_conditions: List[str]
    risk_multiplier: float


class SavingsRecommendation(BaseModel):
    monthly_amount: int
    product_name: str
    interest_rate: float
    term_years: int
    total_deposit: int
    benefits: List[str]


class InsuranceItem(BaseModel):
    product_id: Optional[str] = None
    product_name: str
    adjusted_premium: int
    suitable: bool
    base_premium: Optional[int] = None
    features: Optional[List[str]] = None
    exclusions: Optional[List[str]] = None
    reason: Optional[str] = None


class PetPhotoAnalysis(BaseModel):
    breed: str
    estimated_age: str
    gender_guess: str
    health_notes: str
    confidence: float


class PetProfileResponse(BaseModel):
    photo_analysis: PetPhotoAnalysis
    cost_prediction: CostPrediction
    savings: SavingsRecommendation
    insurance: List[InsuranceItem]


# ── Sample fallback data ─────────────────────────────────────────────────────

_FALLBACK_BREED = "말티즈"
_FALLBACK_AGE = 3

_FALLBACK_PHOTO: dict = {
    "breed": _FALLBACK_BREED,
    "estimated_age": f"{_FALLBACK_AGE}세",
    "gender_guess": "알 수 없음",
    "health_notes": "사진 분석을 완료하지 못했습니다. 샘플 데이터를 표시합니다.",
    "confidence": 0.0,
}


# ── Endpoint ─────────────────────────────────────────────────────────────────


@router.post("/analyze", response_model=PetProfileResponse)
async def analyze_pet(
    image: UploadFile,
    pet_name: str = Form(default=""),
) -> PetProfileResponse:
    """Analyze a pet photo and return breed prediction + cost estimates.

    Accepts a JPEG/PNG image upload. On AI analysis failure, falls back to
    sample data (말티즈, 3세).
    """
    image_bytes = await image.read()

    # Step 1: Analyze photo with GPT-4o Vision (with fallback)
    try:
        photo_result = await _run_vision(image_bytes)
        breed = photo_result.get("breed", _FALLBACK_BREED)
        estimated_age_str: str = photo_result.get("estimated_age", f"{_FALLBACK_AGE}세")
        age = _parse_age(estimated_age_str)
    except Exception:
        photo_result = _FALLBACK_PHOTO.copy()
        breed = _FALLBACK_BREED
        age = _FALLBACK_AGE

    # Step 2: Predict lifetime cost
    cost = predict_lifetime_cost(breed, age)

    # Step 3: Recommend savings plan
    savings = recommend_savings(cost["total_lifetime_cost"], cost["remaining_years"])

    # Step 4: Recommend insurance
    insurance = recommend_insurance(breed, age)

    return PetProfileResponse(
        photo_analysis=PetPhotoAnalysis(**photo_result),
        cost_prediction=CostPrediction(**cost),
        savings=SavingsRecommendation(**savings),
        insurance=[InsuranceItem(**i) for i in insurance],
    )


# ── Helpers ──────────────────────────────────────────────────────────────────


async def _run_vision(image_bytes: bytes) -> dict:
    """Run OpenAI vision analysis (sync call wrapped for async context)."""
    import asyncio

    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, analyze_pet_photo, image_bytes)


def _parse_age(age_str: str) -> int:
    """Extract a numeric age from strings like '2-3세', '약 3세', '5세'."""
    import re

    nums = re.findall(r"\d+", age_str)
    if not nums:
        return _FALLBACK_AGE
    # Take the first number found; for ranges like '2-3', use average
    if len(nums) >= 2:
        return int((int(nums[0]) + int(nums[1])) / 2)
    return int(nums[0])

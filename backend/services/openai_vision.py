"""OpenAI Vision service for pet photo analysis and receipt OCR."""

from __future__ import annotations

import base64
import json
import os
import re
from typing import Optional

from openai import OpenAI

_client: Optional[OpenAI] = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    return _client


def _extract_json(text: str) -> dict:
    """Extract JSON from a response that may contain markdown code blocks."""
    # Strip markdown code block if present
    match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if match:
        text = match.group(1)
    return json.loads(text.strip())


def _encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")


def analyze_pet_photo(image_bytes: bytes) -> dict:
    """Analyze a pet photo using GPT-4o Vision.

    Args:
        image_bytes: Raw image bytes (JPEG, PNG, etc.)

    Returns:
        dict with breed, estimated_age, gender_guess, health_notes, confidence.
    """
    client = _get_client()
    b64 = _encode_image(image_bytes)

    system_prompt = (
        "당신은 반려동물 전문 수의사이자 견종 감별사입니다. "
        "제공된 반려동물 사진을 분석하여 아래 JSON 형식으로만 응답하세요. "
        "markdown 코드블록 없이 순수 JSON만 반환하세요.\n"
        '{\n'
        '  "breed": "감별된 견종 (한국어)",\n'
        '  "estimated_age": "추정 나이 (예: 2-3세)",\n'
        '  "gender_guess": "수컷 또는 암컷 (불분명한 경우 알 수 없음)",\n'
        '  "health_notes": "사진에서 관찰된 건강 상태 또는 특이사항 (한국어, 2-3문장)",\n'
        '  "confidence": 0.85\n'
        "}\n"
        "confidence는 0.0~1.0 사이의 숫자입니다."
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{b64}",
                            "detail": "low",
                        },
                    },
                    {
                        "type": "text",
                        "text": "이 반려동물 사진을 분석해주세요. JSON 형식으로만 응답하세요.",
                    },
                ],
            }
        ],
        max_tokens=500,
        temperature=0.1,
    )

    raw = response.choices[0].message.content or "{}"
    return _extract_json(raw)


def analyze_receipt(image_bytes: bytes) -> dict:
    """Analyze a veterinary receipt using GPT-4o Vision.

    Args:
        image_bytes: Raw image bytes of the receipt.

    Returns:
        dict with clinic_name, clinic_business_number, visit_date, diagnosis,
        items (list of {name, quantity, unit_price, amount}), total_amount, pet_name.
    """
    client = _get_client()
    b64 = _encode_image(image_bytes)

    system_prompt = (
        "당신은 동물병원 영수증 OCR 전문가입니다. "
        "제공된 동물병원 영수증 이미지를 분석하여 아래 JSON 형식으로만 응답하세요. "
        "markdown 코드블록 없이 순수 JSON만 반환하세요.\n"
        '{\n'
        '  "clinic_name": "병원명",\n'
        '  "clinic_business_number": "사업자등록번호 (없으면 null)",\n'
        '  "visit_date": "진료일 (YYYY-MM-DD 형식, 없으면 null)",\n'
        '  "diagnosis": "진단명 또는 진료 내용 (한국어)",\n'
        '  "items": [\n'
        '    {"name": "항목명", "quantity": 1, "unit_price": 10000, "amount": 10000}\n'
        '  ],\n'
        '  "total_amount": 50000,\n'
        '  "pet_name": "반려동물 이름 (없으면 null)"\n'
        "}\n"
        "금액은 정수(원 단위)로 표기하세요. 읽을 수 없는 항목은 null로 표기하세요."
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{b64}",
                            "detail": "high",
                        },
                    },
                    {
                        "type": "text",
                        "text": "이 동물병원 영수증을 분석해주세요. JSON 형식으로만 응답하세요.",
                    },
                ],
            }
        ],
        max_tokens=1000,
        temperature=0.0,
    )

    raw = response.choices[0].message.content or "{}"
    return _extract_json(raw)

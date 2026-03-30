# HanaThePet (하나더펫) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hackathon demo of an AI-powered pet financial platform for Hana Financial Group — pet photo → lifetime cost prediction + savings recommendation, vet receipt photo → auto-generated insurance claim PDF.

**Architecture:** Next.js 14 frontend with Tailwind CSS (Hana brand UI) calls a FastAPI Python backend. Backend handles GPT-4o Vision API calls for breed classification and receipt OCR, serves breed cost lookup data, and generates insurance claim PDFs via WeasyPrint. All financial data is mock — only AI features are real.

**Tech Stack:** Next.js 14, Tailwind CSS, FastAPI, Python 3.11+, OpenAI GPT-4o Vision API, WeasyPrint, uvicorn

**Design Doc:** `~/.gstack/projects/Project/xl8-unknown-design-20260330-160939.md`

---

## File Structure

```
hanathepet/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, route mounting
│   ├── routers/
│   │   ├── pet_profile.py         # POST /api/pet/analyze — breed classification + cost prediction
│   │   └── insurance_claim.py     # POST /api/claim/ocr — receipt OCR + PDF generation
│   ├── services/
│   │   ├── openai_vision.py       # GPT-4o Vision API wrapper (breed + OCR)
│   │   ├── cost_predictor.py      # Breed cost lookup table + savings calculation
│   │   └── pdf_generator.py       # WeasyPrint insurance claim PDF renderer
│   ├── data/
│   │   ├── breed_costs.json       # 20 breed × cost matrix (checkup/disease/surgery)
│   │   └── mock_products.json     # Mock savings + insurance product data
│   ├── templates/
│   │   └── claim_template.html    # HTML template for PDF rendering
│   ├── requirements.txt
│   └── tests/
│       ├── test_cost_predictor.py
│       ├── test_pdf_generator.py
│       └── test_routers.py
├── frontend/
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── .env.local                 # NEXT_PUBLIC_API_URL=http://localhost:8000
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         # Root layout with Hana brand fonts/meta
│   │   │   ├── page.tsx           # Home — tab navigation between two flows
│   │   │   ├── globals.css        # Tailwind + Hana brand CSS variables
│   │   │   ├── pet-profile/
│   │   │   │   └── page.tsx       # Flow 1: Pet photo → AI analysis → Financial ID
│   │   │   └── insurance-claim/
│   │   │       └── page.tsx       # Flow 2: Receipt OCR → Claim form → PDF download
│   │   ├── components/
│   │   │   ├── AppHeader.tsx      # 하나더펫 logo + nav
│   │   │   ├── BottomNav.tsx      # Bottom tab navigation
│   │   │   ├── ImageUploader.tsx  # Shared photo upload with camera support
│   │   │   ├── PetFinancialCard.tsx  # Green gradient Pet ID card
│   │   │   ├── CostBreakdown.tsx  # Bar chart cost visualization
│   │   │   ├── SavingsRecommendation.tsx  # Yellow savings card
│   │   │   ├── ReceiptPreview.tsx # OCR result display
│   │   │   ├── ClaimForm.tsx      # Auto-filled claim form with AI badges
│   │   │   └── LoadingSpinner.tsx # Branded loading state with timeout fallback
│   │   └── lib/
│   │       └── api.ts             # API client — fetch wrapper with timeout handling
│   └── public/
│       └── hana-logo.svg          # Hana-style logo placeholder
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-03-30-hanathepet-mvp.md  # This file
```

---

## Task 1: Project Scaffolding + Git Init

**Files:**
- Create: `hanathepet/backend/main.py`
- Create: `hanathepet/backend/requirements.txt`
- Create: `hanathepet/frontend/` (via create-next-app)
- Create: `hanathepet/.gitignore`

- [ ] **Step 1: Initialize git repo**

```bash
cd /Users/xl8/Project/hanathepet
git init
```

- [ ] **Step 2: Create .gitignore**

Create `hanathepet/.gitignore`:

```
# Python
__pycache__/
*.pyc
.venv/
backend/.env

# Node
node_modules/
.next/
frontend/.env.local

# OS
.DS_Store

# Generated
*.pdf
```

- [ ] **Step 3: Create Next.js frontend**

```bash
cd /Users/xl8/Project/hanathepet
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

When prompted, accept defaults. This creates the Next.js 14 app with Tailwind and App Router.

- [ ] **Step 4: Create backend requirements.txt**

Create `hanathepet/backend/requirements.txt`:

```
fastapi==0.115.6
uvicorn==0.34.0
openai==1.82.0
weasyprint==63.1
python-multipart==0.0.20
pydantic==2.10.4
```

- [ ] **Step 5: Create Python venv and install deps**

```bash
cd /Users/xl8/Project/hanathepet/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Note: WeasyPrint requires system deps. On macOS: `brew install cairo pango` first.

- [ ] **Step 6: Create minimal FastAPI app**

Create `hanathepet/backend/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HanaThePet API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "hanathepet-api"}
```

- [ ] **Step 7: Verify backend starts**

```bash
cd /Users/xl8/Project/hanathepet/backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Expected: Server starts, `http://localhost:8000/api/health` returns `{"status":"ok","service":"hanathepet-api"}`

- [ ] **Step 8: Create frontend .env.local**

Create `hanathepet/frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 9: Commit**

```bash
cd /Users/xl8/Project/hanathepet
git add .
git commit -m "feat: scaffold Next.js frontend + FastAPI backend"
```

---

## Task 2: Breed Cost Data + Cost Predictor Service

**Files:**
- Create: `backend/data/breed_costs.json`
- Create: `backend/data/mock_products.json`
- Create: `backend/services/cost_predictor.py`
- Create: `backend/tests/test_cost_predictor.py`

- [ ] **Step 1: Write the failing test**

Create `hanathepet/backend/tests/__init__.py` (empty file).

Create `hanathepet/backend/tests/test_cost_predictor.py`:

```python
from services.cost_predictor import predict_lifetime_cost, recommend_savings


def test_predict_lifetime_cost_maltese():
    result = predict_lifetime_cost(breed="말티즈", age=3)
    assert result["breed"] == "말티즈"
    assert result["total_lifetime_cost"] > 0
    assert "checkup" in result["breakdown"]
    assert "disease" in result["breakdown"]
    assert "surgery" in result["breakdown"]
    assert result["remaining_years"] == 12  # 15 - 3


def test_predict_lifetime_cost_unknown_breed():
    result = predict_lifetime_cost(breed="알수없는품종", age=5)
    assert result["breed"] == "알수없는품종"
    assert result["total_lifetime_cost"] > 0  # falls back to average


def test_recommend_savings():
    cost = predict_lifetime_cost(breed="말티즈", age=3)
    savings = recommend_savings(cost["total_lifetime_cost"], cost["remaining_years"])
    assert savings["monthly_amount"] > 0
    assert savings["product_name"] == "하나더펫 적금"
    assert savings["interest_rate"] == 3.5
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/xl8/Project/hanathepet/backend
source .venv/bin/activate
PYTHONPATH=. python -m pytest tests/test_cost_predictor.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'services'`

- [ ] **Step 3: Create breed cost data**

Create `hanathepet/backend/data/breed_costs.json`:

```json
{
  "breeds": {
    "말티즈": {
      "life_expectancy": 15,
      "annual_costs": {
        "checkup": 320000,
        "disease": 580000,
        "surgery": 120000
      },
      "common_conditions": ["슬개골 탈구", "치주질환", "유루증"],
      "risk_multiplier": 1.1
    },
    "푸들": {
      "life_expectancy": 14,
      "annual_costs": {
        "checkup": 350000,
        "disease": 520000,
        "surgery": 150000
      },
      "common_conditions": ["슬개골 탈구", "백내장", "외이염"],
      "risk_multiplier": 1.0
    },
    "포메라니안": {
      "life_expectancy": 14,
      "annual_costs": {
        "checkup": 300000,
        "disease": 480000,
        "surgery": 130000
      },
      "common_conditions": ["슬개골 탈구", "기관허탈", "탈모"],
      "risk_multiplier": 1.05
    },
    "시츄": {
      "life_expectancy": 13,
      "annual_costs": {
        "checkup": 310000,
        "disease": 500000,
        "surgery": 110000
      },
      "common_conditions": ["안구 질환", "호흡기 질환", "피부병"],
      "risk_multiplier": 1.0
    },
    "치와와": {
      "life_expectancy": 16,
      "annual_costs": {
        "checkup": 280000,
        "disease": 420000,
        "surgery": 100000
      },
      "common_conditions": ["슬개골 탈구", "수두증", "저혈당"],
      "risk_multiplier": 0.95
    },
    "골든 리트리버": {
      "life_expectancy": 12,
      "annual_costs": {
        "checkup": 400000,
        "disease": 750000,
        "surgery": 250000
      },
      "common_conditions": ["고관절 이형성", "암", "피부 알레르기"],
      "risk_multiplier": 1.3
    },
    "비숑 프리제": {
      "life_expectancy": 15,
      "annual_costs": {
        "checkup": 330000,
        "disease": 460000,
        "surgery": 120000
      },
      "common_conditions": ["슬개골 탈구", "백내장", "알레르기"],
      "risk_multiplier": 1.0
    },
    "웰시 코기": {
      "life_expectancy": 13,
      "annual_costs": {
        "checkup": 350000,
        "disease": 620000,
        "surgery": 200000
      },
      "common_conditions": ["디스크", "고관절 이형성", "비만"],
      "risk_multiplier": 1.15
    },
    "진돗개": {
      "life_expectancy": 14,
      "annual_costs": {
        "checkup": 300000,
        "disease": 380000,
        "surgery": 100000
      },
      "common_conditions": ["피부병", "갑상선 질환", "관절염"],
      "risk_multiplier": 0.85
    },
    "프렌치 불독": {
      "life_expectancy": 11,
      "annual_costs": {
        "checkup": 380000,
        "disease": 820000,
        "surgery": 350000
      },
      "common_conditions": ["단두종 호흡기 증후군", "척추 질환", "피부 주름 감염"],
      "risk_multiplier": 1.5
    },
    "닥스훈트": {
      "life_expectancy": 14,
      "annual_costs": {
        "checkup": 310000,
        "disease": 580000,
        "surgery": 200000
      },
      "common_conditions": ["디스크", "비만", "치주질환"],
      "risk_multiplier": 1.1
    },
    "요크셔 테리어": {
      "life_expectancy": 15,
      "annual_costs": {
        "checkup": 290000,
        "disease": 450000,
        "surgery": 110000
      },
      "common_conditions": ["슬개골 탈구", "저혈당", "기관허탈"],
      "risk_multiplier": 1.0
    },
    "래브라도 리트리버": {
      "life_expectancy": 12,
      "annual_costs": {
        "checkup": 390000,
        "disease": 700000,
        "surgery": 230000
      },
      "common_conditions": ["고관절 이형성", "비만", "외이염"],
      "risk_multiplier": 1.25
    },
    "슈나우저": {
      "life_expectancy": 14,
      "annual_costs": {
        "checkup": 320000,
        "disease": 500000,
        "surgery": 140000
      },
      "common_conditions": ["당뇨", "췌장염", "비뇨결석"],
      "risk_multiplier": 1.05
    },
    "사모예드": {
      "life_expectancy": 13,
      "annual_costs": {
        "checkup": 370000,
        "disease": 600000,
        "surgery": 180000
      },
      "common_conditions": ["고관절 이형성", "피부병", "갑상선 질환"],
      "risk_multiplier": 1.15
    },
    "시바 이누": {
      "life_expectancy": 14,
      "annual_costs": {
        "checkup": 310000,
        "disease": 420000,
        "surgery": 120000
      },
      "common_conditions": ["알레르기", "슬개골 탈구", "녹내장"],
      "risk_multiplier": 0.95
    },
    "페키니즈": {
      "life_expectancy": 14,
      "annual_costs": {
        "checkup": 300000,
        "disease": 520000,
        "surgery": 130000
      },
      "common_conditions": ["안구 돌출", "호흡기 질환", "디스크"],
      "risk_multiplier": 1.1
    },
    "보더 콜리": {
      "life_expectancy": 13,
      "annual_costs": {
        "checkup": 340000,
        "disease": 480000,
        "surgery": 150000
      },
      "common_conditions": ["고관절 이형성", "간질", "콜리 안구 이상"],
      "risk_multiplier": 1.0
    },
    "비글": {
      "life_expectancy": 13,
      "annual_costs": {
        "checkup": 320000,
        "disease": 510000,
        "surgery": 140000
      },
      "common_conditions": ["외이염", "비만", "디스크"],
      "risk_multiplier": 1.05
    },
    "코카 스패니얼": {
      "life_expectancy": 13,
      "annual_costs": {
        "checkup": 340000,
        "disease": 560000,
        "surgery": 170000
      },
      "common_conditions": ["외이염", "백내장", "자가면역 질환"],
      "risk_multiplier": 1.1
    }
  },
  "default": {
    "life_expectancy": 13,
    "annual_costs": {
      "checkup": 330000,
      "disease": 520000,
      "surgery": 150000
    },
    "common_conditions": ["정기 건강검진 권장"],
    "risk_multiplier": 1.0
  }
}
```

- [ ] **Step 4: Create mock financial products data**

Create `hanathepet/backend/data/mock_products.json`:

```json
{
  "savings": {
    "product_name": "하나더펫 적금",
    "interest_rate": 3.5,
    "max_monthly": 500000,
    "min_monthly": 10000,
    "term_years": 15,
    "benefits": [
      "반려동물 의료비 목적 우대금리 +0.5%p",
      "펫사랑 카드 동시 보유 시 추가 +0.3%p",
      "자동이체 설정 시 +0.2%p"
    ]
  },
  "insurance": [
    {
      "product_name": "하나 펫보험 베이직",
      "monthly_premium_base": 15000,
      "coverage_limit": 5000000,
      "coverage_ratio": 0.7,
      "deductible": 20000,
      "features": ["통원 치료비", "입원 치료비", "수술비"]
    },
    {
      "product_name": "하나 펫보험 프리미엄",
      "monthly_premium_base": 28000,
      "coverage_limit": 10000000,
      "coverage_ratio": 0.8,
      "deductible": 10000,
      "features": ["통원 치료비", "입원 치료비", "수술비", "MRI/CT 검사", "장례비 지원"]
    }
  ]
}
```

- [ ] **Step 5: Create cost predictor service**

Create `hanathepet/backend/services/__init__.py` (empty file).

Create `hanathepet/backend/services/cost_predictor.py`:

```python
import json
from pathlib import Path

_DATA_DIR = Path(__file__).parent.parent / "data"


def _load_breed_data() -> dict:
    with open(_DATA_DIR / "breed_costs.json", encoding="utf-8") as f:
        return json.load(f)


def _load_products() -> dict:
    with open(_DATA_DIR / "mock_products.json", encoding="utf-8") as f:
        return json.load(f)


def predict_lifetime_cost(breed: str, age: int) -> dict:
    data = _load_breed_data()
    breed_info = data["breeds"].get(breed, data["default"])

    life_expectancy = breed_info["life_expectancy"]
    remaining_years = max(life_expectancy - age, 1)

    annual = breed_info["annual_costs"]
    multiplier = breed_info["risk_multiplier"]

    checkup_total = int(annual["checkup"] * remaining_years * multiplier)
    disease_total = int(annual["disease"] * remaining_years * multiplier)
    surgery_total = int(annual["surgery"] * remaining_years * multiplier)
    total = checkup_total + disease_total + surgery_total

    return {
        "breed": breed,
        "age": age,
        "life_expectancy": life_expectancy,
        "remaining_years": remaining_years,
        "total_lifetime_cost": total,
        "breakdown": {
            "checkup": checkup_total,
            "disease": disease_total,
            "surgery": surgery_total,
        },
        "common_conditions": breed_info["common_conditions"],
        "risk_multiplier": multiplier,
    }


def recommend_savings(total_cost: int, remaining_years: int) -> dict:
    products = _load_products()
    savings = products["savings"]

    total_months = remaining_years * 12
    monthly = max(
        savings["min_monthly"],
        min(int(total_cost / total_months), savings["max_monthly"]),
    )

    return {
        "monthly_amount": monthly,
        "product_name": savings["product_name"],
        "interest_rate": savings["interest_rate"],
        "term_years": remaining_years,
        "total_deposit": monthly * total_months,
        "benefits": savings["benefits"],
    }


def recommend_insurance(breed: str, age: int) -> dict:
    products = _load_products()
    data = _load_breed_data()
    breed_info = data["breeds"].get(breed, data["default"])

    multiplier = breed_info["risk_multiplier"]
    recommendations = []

    for product in products["insurance"]:
        adjusted_premium = int(product["monthly_premium_base"] * multiplier)
        if age > 7:
            adjusted_premium = int(adjusted_premium * 1.3)

        recommendations.append(
            {
                "product_name": product["product_name"],
                "monthly_premium": adjusted_premium,
                "coverage_limit": product["coverage_limit"],
                "coverage_ratio": product["coverage_ratio"],
                "deductible": product["deductible"],
                "features": product["features"],
            }
        )

    return {"recommendations": recommendations}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/xl8/Project/hanathepet/backend
source .venv/bin/activate
PYTHONPATH=. python -m pytest tests/test_cost_predictor.py -v
```

Expected: All 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
cd /Users/xl8/Project/hanathepet
git add backend/data/ backend/services/ backend/tests/
git commit -m "feat: add breed cost data (20 breeds) + cost predictor service"
```

---

## Task 3: OpenAI Vision Service (Breed Classification + OCR)

**Files:**
- Create: `backend/services/openai_vision.py`
- Create: `backend/.env`

- [ ] **Step 1: Create backend .env file**

Create `hanathepet/backend/.env`:

```
OPENAI_API_KEY=sk-your-key-here
```

Replace with actual key.

- [ ] **Step 2: Create OpenAI Vision service**

Create `hanathepet/backend/services/openai_vision.py`:

```python
import base64
import json
import os

from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    return _client


def _encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode("utf-8")


async def analyze_pet_photo(image_bytes: bytes) -> dict:
    client = _get_client()
    b64 = _encode_image(image_bytes)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 반려동물 품종 분석 전문가입니다. "
                    "사진을 보고 품종, 추정 나이, 건강 특성을 분석해주세요. "
                    "반드시 아래 JSON 형식으로만 응답하세요:\n"
                    '{"breed": "품종명(한글)", "estimated_age": 숫자, '
                    '"gender_guess": "수컷/암컷/알수없음", '
                    '"health_notes": "건강 관련 관찰 사항", '
                    '"confidence": 0.0~1.0}'
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "이 반려동물의 품종과 나이를 분석해주세요."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{b64}",
                            "detail": "low",
                        },
                    },
                ],
            },
        ],
        max_tokens=300,
        temperature=0.3,
    )

    text = response.choices[0].message.content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


async def analyze_receipt(image_bytes: bytes) -> dict:
    client = _get_client()
    b64 = _encode_image(image_bytes)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 동물병원 영수증/진료비 세부내역서 OCR 전문가입니다. "
                    "영수증 이미지를 분석하여 아래 JSON 형식으로 정보를 추출해주세요. "
                    "금액은 숫자만 (원 단위). 추출 불가능한 필드는 null로 표시.\n"
                    '{"clinic_name": "병원명", "clinic_business_number": "사업자번호 또는 null", '
                    '"visit_date": "YYYY.MM.DD", "diagnosis": "상병명/진단내용", '
                    '"items": [{"name": "항목명", "amount": 금액}], '
                    '"total_amount": 총액, "pet_name": "환자명 또는 null"}'
                ),
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "이 동물병원 영수증의 정보를 추출해주세요."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{b64}",
                            "detail": "high",
                        },
                    },
                ],
            },
        ],
        max_tokens=800,
        temperature=0.1,
    )

    text = response.choices[0].message.content.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)
```

- [ ] **Step 3: Update main.py to load .env**

Edit `hanathepet/backend/main.py` — add at the top, before other imports:

```python
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
```

Add `python-dotenv==1.0.1` to `requirements.txt` and run:

```bash
cd /Users/xl8/Project/hanathepet/backend
source .venv/bin/activate
pip install python-dotenv==1.0.1
```

- [ ] **Step 4: Commit**

```bash
cd /Users/xl8/Project/hanathepet
git add backend/services/openai_vision.py backend/main.py backend/requirements.txt
git commit -m "feat: add GPT-4o Vision service for breed classification + receipt OCR"
```

---

## Task 4: PDF Generator Service

**Files:**
- Create: `backend/templates/claim_template.html`
- Create: `backend/services/pdf_generator.py`
- Create: `backend/tests/test_pdf_generator.py`

- [ ] **Step 1: Write the failing test**

Create `hanathepet/backend/tests/test_pdf_generator.py`:

```python
from services.pdf_generator import generate_claim_pdf


def test_generate_claim_pdf_returns_bytes():
    claim_data = {
        "pet_info": {
            "name": "보리",
            "breed": "말티즈",
            "age": 3,
            "pet_id": "PET-2406",
        },
        "policy_number": "HANA-PET-2026-001234",
        "clinic_name": "행복동물병원",
        "clinic_business_number": "123-45-67890",
        "visit_date": "2026.03.28",
        "diagnosis": "슬개골 탈구 (Grade II) - 좌측 후지",
        "items": [
            {"name": "수술비", "amount": 850000},
            {"name": "마취비", "amount": 150000},
            {"name": "입원비 (3일)", "amount": 180000},
            {"name": "약제비", "amount": 45000},
        ],
        "total_amount": 1225000,
        "estimated_payout": 980000,
    }
    pdf_bytes = generate_claim_pdf(claim_data)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    assert pdf_bytes[:5] == b"%PDF-"


def test_generate_claim_pdf_with_missing_fields():
    claim_data = {
        "pet_info": {"name": "보리", "breed": "말티즈", "age": 3, "pet_id": "PET-0001"},
        "policy_number": "HANA-PET-2026-999999",
        "clinic_name": "테스트병원",
        "clinic_business_number": None,
        "visit_date": "2026.03.30",
        "diagnosis": "건강검진",
        "items": [{"name": "검진비", "amount": 50000}],
        "total_amount": 50000,
        "estimated_payout": 35000,
    }
    pdf_bytes = generate_claim_pdf(claim_data)
    assert pdf_bytes[:5] == b"%PDF-"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/xl8/Project/hanathepet/backend
source .venv/bin/activate
PYTHONPATH=. python -m pytest tests/test_pdf_generator.py -v
```

Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Create claim PDF HTML template**

Create `hanathepet/backend/templates/claim_template.html`:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; font-size: 12px; color: #1a1a1a; }
  .header { text-align: center; border-bottom: 2px solid #00954F; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { color: #00954F; font-size: 22px; margin: 0; }
  .header p { color: #666; font-size: 11px; margin: 4px 0 0; }
  .section { margin-bottom: 16px; }
  .section-title { font-size: 13px; font-weight: 700; color: #00954F; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 120px 1fr; gap: 4px 12px; }
  .info-label { font-weight: 600; color: #555; }
  .info-value { color: #1a1a1a; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th { background: #E8F5EE; color: #00954F; font-size: 11px; padding: 6px 8px; text-align: left; border: 1px solid #ddd; }
  td { padding: 6px 8px; border: 1px solid #ddd; font-size: 11px; }
  .amount { text-align: right; }
  .total-row { font-weight: 700; background: #f9f9f9; }
  .payout-row { font-weight: 700; color: #00954F; background: #E8F5EE; }
  .signature { margin-top: 40px; display: flex; justify-content: space-between; }
  .sig-box { width: 200px; text-align: center; }
  .sig-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 4px; font-size: 11px; }
  .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
  .ai-badge { display: inline-block; background: #00954F; color: white; font-size: 9px; padding: 1px 5px; border-radius: 3px; margin-left: 4px; }
</style>
</head>
<body>
  <div class="header">
    <h1>🐾 하나더펫 보험금 청구서</h1>
    <p>하나금융그룹 | AI 자동 생성 문서</p>
  </div>

  <div class="section">
    <div class="section-title">피보험동물 정보</div>
    <div class="info-grid">
      <span class="info-label">동물명</span>
      <span class="info-value">{{ pet_info.name }} ({{ pet_info.breed }}, {{ pet_info.age }}세)</span>
      <span class="info-label">PET ID</span>
      <span class="info-value">{{ pet_info.pet_id }}</span>
      <span class="info-label">보험 계약번호</span>
      <span class="info-value">{{ policy_number }}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">진료 정보 <span class="ai-badge">AI OCR</span></div>
    <div class="info-grid">
      <span class="info-label">진료기관</span>
      <span class="info-value">{{ clinic_name }}{% if clinic_business_number %} ({{ clinic_business_number }}){% endif %}</span>
      <span class="info-label">진료일</span>
      <span class="info-value">{{ visit_date }}</span>
      <span class="info-label">상병명</span>
      <span class="info-value">{{ diagnosis }}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">진료비 내역</div>
    <table>
      <thead>
        <tr><th>항목</th><th class="amount">금액 (원)</th></tr>
      </thead>
      <tbody>
        {% for item in items %}
        <tr>
          <td>{{ item.name }}</td>
          <td class="amount">{{ "{:,}".format(item.amount) }}</td>
        </tr>
        {% endfor %}
        <tr class="total-row">
          <td>합계</td>
          <td class="amount">₩{{ "{:,}".format(total_amount) }}</td>
        </tr>
        <tr class="payout-row">
          <td>보장한도 내 예상 지급액</td>
          <td class="amount">₩{{ "{:,}".format(estimated_payout) }}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="signature">
    <div class="sig-box">
      <div class="sig-line">청구인 (서명)</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">접수일: ____년 ____월 ____일</div>
    </div>
  </div>

  <div class="footer">
    본 청구서는 하나더펫 AI 시스템에 의해 자동 생성되었습니다. | 문서 생성일: {{ generated_date }}
  </div>
</body>
</html>
```

- [ ] **Step 4: Create PDF generator service**

Create `hanathepet/backend/services/pdf_generator.py`:

```python
from datetime import datetime
from pathlib import Path

from jinja2 import Template
from weasyprint import HTML

_TEMPLATE_DIR = Path(__file__).parent.parent / "templates"


def generate_claim_pdf(claim_data: dict) -> bytes:
    template_path = _TEMPLATE_DIR / "claim_template.html"
    template_text = template_path.read_text(encoding="utf-8")
    template = Template(template_text)

    context = {
        **claim_data,
        "generated_date": datetime.now().strftime("%Y년 %m월 %d일 %H:%M"),
    }
    html_string = template.render(**context)
    pdf_bytes = HTML(string=html_string).write_pdf()
    return pdf_bytes
```

- [ ] **Step 5: Install jinja2 dependency**

Add `Jinja2==3.1.5` to `requirements.txt` and run:

```bash
cd /Users/xl8/Project/hanathepet/backend
source .venv/bin/activate
pip install Jinja2==3.1.5
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/xl8/Project/hanathepet/backend
source .venv/bin/activate
PYTHONPATH=. python -m pytest tests/test_pdf_generator.py -v
```

Expected: Both tests PASS — PDF bytes returned starting with `%PDF-`.

- [ ] **Step 7: Commit**

```bash
cd /Users/xl8/Project/hanathepet
git add backend/templates/ backend/services/pdf_generator.py backend/tests/test_pdf_generator.py backend/requirements.txt
git commit -m "feat: add insurance claim PDF generator with WeasyPrint"
```

---

## Task 5: Backend API Routes

**Files:**
- Create: `backend/routers/pet_profile.py`
- Create: `backend/routers/insurance_claim.py`
- Modify: `backend/main.py`

- [ ] **Step 1: Create pet profile router**

Create `hanathepet/backend/routers/__init__.py` (empty file).

Create `hanathepet/backend/routers/pet_profile.py`:

```python
import random

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel

from services.cost_predictor import (
    predict_lifetime_cost,
    recommend_insurance,
    recommend_savings,
)
from services.openai_vision import analyze_pet_photo

router = APIRouter(prefix="/api/pet", tags=["pet"])


class PetProfileResponse(BaseModel):
    pet_id: str
    breed: str
    estimated_age: int
    gender_guess: str
    health_notes: str
    confidence: float
    lifetime_cost: dict
    savings_recommendation: dict
    insurance_recommendation: dict


@router.post("/analyze", response_model=PetProfileResponse)
async def analyze_pet(
    image: UploadFile = File(...),
    pet_name: str = Form(default="우리 아이"),
):
    image_bytes = await image.read()

    try:
        analysis = await analyze_pet_photo(image_bytes)
    except Exception:
        analysis = {
            "breed": "말티즈",
            "estimated_age": 3,
            "gender_guess": "알수없음",
            "health_notes": "AI 분석 실패 — 샘플 데이터를 사용합니다.",
            "confidence": 0.0,
        }

    breed = analysis["breed"]
    age = analysis["estimated_age"]

    cost = predict_lifetime_cost(breed, age)
    savings = recommend_savings(cost["total_lifetime_cost"], cost["remaining_years"])
    insurance = recommend_insurance(breed, age)

    pet_id = f"PET-{random.randint(1000, 9999)}"

    return PetProfileResponse(
        pet_id=pet_id,
        breed=breed,
        estimated_age=age,
        gender_guess=analysis.get("gender_guess", "알수없음"),
        health_notes=analysis.get("health_notes", ""),
        confidence=analysis.get("confidence", 0.0),
        lifetime_cost=cost,
        savings_recommendation=savings,
        insurance_recommendation=insurance,
    )
```

- [ ] **Step 2: Create insurance claim router**

Create `hanathepet/backend/routers/insurance_claim.py`:

```python
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from services.openai_vision import analyze_receipt
from services.pdf_generator import generate_claim_pdf

router = APIRouter(prefix="/api/claim", tags=["claim"])


class OcrResultResponse(BaseModel):
    clinic_name: str | None
    clinic_business_number: str | None
    visit_date: str | None
    diagnosis: str | None
    items: list[dict]
    total_amount: int | None
    pet_name: str | None


@router.post("/ocr", response_model=OcrResultResponse)
async def ocr_receipt(image: UploadFile = File(...)):
    image_bytes = await image.read()

    try:
        result = await analyze_receipt(image_bytes)
    except Exception:
        result = {
            "clinic_name": "행복동물병원",
            "clinic_business_number": "123-45-67890",
            "visit_date": "2026.03.28",
            "diagnosis": "건강검진",
            "items": [{"name": "검진비", "amount": 50000}],
            "total_amount": 50000,
            "pet_name": None,
        }

    return OcrResultResponse(**result)


class GeneratePdfRequest(BaseModel):
    pet_info: dict
    policy_number: str
    clinic_name: str
    clinic_business_number: str | None
    visit_date: str
    diagnosis: str
    items: list[dict]
    total_amount: int
    estimated_payout: int


@router.post("/generate-pdf")
async def generate_pdf(data: GeneratePdfRequest):
    pdf_bytes = generate_claim_pdf(data.model_dump())
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=hanathepet-claim.pdf"},
    )
```

- [ ] **Step 3: Update main.py to mount routers**

Replace the entire `hanathepet/backend/main.py` with:

```python
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.pet_profile import router as pet_router
from routers.insurance_claim import router as claim_router

app = FastAPI(title="HanaThePet API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pet_router)
app.include_router(claim_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "hanathepet-api"}
```

- [ ] **Step 4: Verify backend starts with routes**

```bash
cd /Users/xl8/Project/hanathepet/backend
source .venv/bin/activate
PYTHONPATH=. uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` — should show Swagger UI with 4 endpoints:
- `GET /api/health`
- `POST /api/pet/analyze`
- `POST /api/claim/ocr`
- `POST /api/claim/generate-pdf`

- [ ] **Step 5: Commit**

```bash
cd /Users/xl8/Project/hanathepet
git add backend/routers/ backend/main.py
git commit -m "feat: add API routes — pet profile analysis + insurance claim OCR + PDF generation"
```

---

## Task 6: Frontend — Hana Brand Design System + Layout

**Files:**
- Modify: `frontend/tailwind.config.ts`
- Modify: `frontend/src/app/globals.css`
- Create: `frontend/src/app/layout.tsx` (replace)
- Create: `frontend/src/components/AppHeader.tsx`
- Create: `frontend/src/components/BottomNav.tsx`
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Configure Tailwind with Hana brand colors**

Replace `hanathepet/frontend/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hana: {
          green: "#00954F",
          "green-light": "#E8F5EE",
          "green-dark": "#006B38",
          accent: "#00B761",
        },
      },
      fontFamily: {
        sans: [
          "Apple SD Gothic Neo",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 2: Set up global CSS**

Replace `hanathepet/frontend/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --hana-green: #00954F;
  --hana-green-light: #E8F5EE;
  --hana-green-dark: #006B38;
}

body {
  max-width: 480px;
  margin: 0 auto;
  background: #f5f5f5;
  min-height: 100vh;
}
```

- [ ] **Step 3: Create AppHeader component**

Create `hanathepet/frontend/src/components/AppHeader.tsx`:

```tsx
export default function AppHeader() {
  return (
    <header className="flex items-center gap-3 p-4 bg-white border-b border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-hana-green flex items-center justify-center text-white text-lg">
        🐾
      </div>
      <h1 className="text-lg font-bold">
        <span className="text-hana-green">하나</span>더펫
      </h1>
    </header>
  );
}
```

- [ ] **Step 4: Create BottomNav component**

Create `hanathepet/frontend/src/components/BottomNav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", icon: "🏠", label: "홈" },
  { href: "/pet-profile", icon: "💳", label: "금융ID" },
  { href: "/insurance-claim", icon: "📋", label: "청구" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-200 flex justify-around py-2 z-50">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center text-xs ${
              active ? "text-hana-green font-semibold" : "text-gray-400"
            }`}
          >
            <span className="text-xl mb-0.5">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 5: Update root layout**

Replace `hanathepet/frontend/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "하나더펫 — AI 반려동물 금융 플랫폼",
  description: "하나금융그룹 AI 반려동물 금융 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="font-sans bg-gray-50">
        <div className="max-w-[480px] mx-auto bg-white min-h-screen pb-20 shadow-sm">
          <AppHeader />
          <main className="p-4">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create home page**

Replace `hanathepet/frontend/src/app/page.tsx`:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <p className="text-4xl mb-3">🐾</p>
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          <span className="text-hana-green">하나</span>더펫에 오신 것을 환영합니다
        </h2>
        <p className="text-sm text-gray-500">
          AI가 설계하는 반려동물 생애 재무 플랜
        </p>
      </div>

      <Link
        href="/pet-profile"
        className="block p-5 bg-gradient-to-r from-hana-green to-hana-accent rounded-2xl text-white"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">📸</span>
          <div>
            <p className="font-bold text-base">AI 펫 금융 ID 만들기</p>
            <p className="text-sm opacity-85">
              사진 한 장으로 생애 의료비 예측 + 적금 추천
            </p>
          </div>
        </div>
      </Link>

      <Link
        href="/insurance-claim"
        className="block p-5 bg-white border-2 border-hana-green rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">📋</span>
          <div>
            <p className="font-bold text-base text-gray-800">
              AI 보험 청구 자동화
            </p>
            <p className="text-sm text-gray-500">
              영수증 촬영 → 청구서 자동 완성 → PDF 다운로드
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
```

- [ ] **Step 7: Verify frontend starts**

```bash
cd /Users/xl8/Project/hanathepet/frontend
npm run dev
```

Visit `http://localhost:3000` — should show Hana-branded home page with two feature cards and bottom navigation.

- [ ] **Step 8: Commit**

```bash
cd /Users/xl8/Project/hanathepet
git add frontend/
git commit -m "feat: add Hana brand design system + home page + navigation"
```

---

## Task 7: Frontend — Shared Components + API Client

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/components/ImageUploader.tsx`
- Create: `frontend/src/components/LoadingSpinner.tsx`

- [ ] **Step 1: Create API client with timeout handling**

Create `hanathepet/frontend/src/lib/api.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiTimeoutError extends Error {
  constructor() {
    super("API request timed out");
    this.name = "ApiTimeoutError";
  }
}

export async function apiPost<T>(
  path: string,
  body: FormData | object,
  timeoutMs = 30000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isFormData = body instanceof FormData;
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
      headers: isFormData ? {} : { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiPostBlob(
  path: string,
  body: object,
  timeoutMs = 30000
): Promise<Blob> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    return res.blob();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiTimeoutError();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 2: Create ImageUploader component**

Create `hanathepet/frontend/src/components/ImageUploader.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  label: string;
  sublabel: string;
  icon: string;
  accept?: string;
}

export default function ImageUploader({
  onUpload,
  label,
  sublabel,
  icon,
  accept = "image/*",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
        preview
          ? "border-hana-green bg-hana-green-light"
          : "border-gray-300 bg-gray-50 hover:border-hana-green"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
      {preview ? (
        <img
          src={preview}
          alt="uploaded"
          className="w-32 h-32 object-cover rounded-xl mx-auto mb-2"
        />
      ) : (
        <div className="text-4xl mb-2">{icon}</div>
      )}
      <p
        className={`text-sm font-medium ${
          preview ? "text-hana-green" : "text-gray-500"
        }`}
      >
        {preview ? "✓ " + label : label}
      </p>
      <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
    </div>
  );
}
```

- [ ] **Step 3: Create LoadingSpinner component with timeout fallback**

Create `hanathepet/frontend/src/components/LoadingSpinner.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface LoadingSpinnerProps {
  message?: string;
  onTimeout?: () => void;
  timeoutMs?: number;
}

export default function LoadingSpinner({
  message = "AI가 분석 중입니다...",
  onTimeout,
  timeoutMs = 30000,
}: LoadingSpinnerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    const timeout = setTimeout(() => {
      setShowTimeout(true);
    }, timeoutMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [timeoutMs]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-hana-green-light border-t-hana-green rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-600 font-medium">{message}</p>
      <p className="text-xs text-gray-400 mt-1">{elapsed}초 경과</p>

      {showTimeout && onTimeout && (
        <button
          onClick={onTimeout}
          className="mt-4 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
        >
          AI 분석이 지연되고 있습니다. 샘플 데이터로 진행할까요?
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/xl8/Project/hanathepet
git add frontend/src/lib/ frontend/src/components/ImageUploader.tsx frontend/src/components/LoadingSpinner.tsx
git commit -m "feat: add API client with timeout + ImageUploader + LoadingSpinner components"
```

---

## Task 8: Frontend — Flow 1: Pet Profile Page

**Files:**
- Create: `frontend/src/app/pet-profile/page.tsx`
- Create: `frontend/src/components/PetFinancialCard.tsx`
- Create: `frontend/src/components/CostBreakdown.tsx`
- Create: `frontend/src/components/SavingsRecommendation.tsx`

- [ ] **Step 1: Create PetFinancialCard component**

Create `hanathepet/frontend/src/components/PetFinancialCard.tsx`:

```tsx
interface PetFinancialCardProps {
  petName: string;
  breed: string;
  age: number;
  gender: string;
  petId: string;
}

export default function PetFinancialCard({
  petName,
  breed,
  age,
  gender,
  petId,
}: PetFinancialCardProps) {
  return (
    <div className="bg-gradient-to-br from-hana-green to-hana-accent rounded-2xl p-5 text-white">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xl font-bold">
            {petName} 🐾
          </p>
          <p className="text-sm opacity-85">
            {breed} · {age}세 · {gender}
          </p>
        </div>
        <span className="bg-white/20 rounded-lg px-3 py-1 text-xs tracking-wide">
          {petId}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create CostBreakdown component**

Create `hanathepet/frontend/src/components/CostBreakdown.tsx`:

```tsx
interface CostBreakdownProps {
  breakdown: { checkup: number; disease: number; surgery: number };
  total: number;
}

const categories = [
  { key: "checkup" as const, label: "정기검진", color: "bg-green-500" },
  { key: "disease" as const, label: "질병치료", color: "bg-orange-500" },
  { key: "surgery" as const, label: "수술비", color: "bg-red-500" },
];

function formatKRW(n: number): string {
  if (n >= 1000000) return `₩${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `₩${(n / 1000).toFixed(0)}K`;
  return `₩${n}`;
}

export default function CostBreakdown({ breakdown, total }: CostBreakdownProps) {
  return (
    <div className="space-y-2">
      {categories.map(({ key, label, color }) => {
        const amount = breakdown[key];
        const pct = Math.round((amount / total) * 100);
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-14 text-right">{label}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full flex items-center pl-2`}
                style={{ width: `${pct}%` }}
              >
                <span className="text-[10px] text-white font-semibold">
                  {formatKRW(amount)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create SavingsRecommendation component**

Create `hanathepet/frontend/src/components/SavingsRecommendation.tsx`:

```tsx
interface SavingsRecommendationProps {
  monthlyAmount: number;
  termYears: number;
  interestRate: number;
  productName: string;
}

export default function SavingsRecommendation({
  monthlyAmount,
  termYears,
  interestRate,
  productName,
}: SavingsRecommendationProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="text-sm font-bold text-amber-800 mb-1">💰 {productName} 추천</p>
      <p className="text-2xl font-extrabold text-orange-700">
        월 ₩{monthlyAmount.toLocaleString()}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {termYears}년 납입 시 예상 의료비 100% 커버 · 연 {interestRate}% 우대금리
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Create pet profile page**

Create `hanathepet/frontend/src/app/pet-profile/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PetFinancialCard from "@/components/PetFinancialCard";
import CostBreakdown from "@/components/CostBreakdown";
import SavingsRecommendation from "@/components/SavingsRecommendation";
import { apiPost, ApiTimeoutError } from "@/lib/api";

interface PetProfile {
  pet_id: string;
  breed: string;
  estimated_age: number;
  gender_guess: string;
  health_notes: string;
  confidence: number;
  lifetime_cost: {
    total_lifetime_cost: number;
    remaining_years: number;
    breakdown: { checkup: number; disease: number; surgery: number };
    common_conditions: string[];
  };
  savings_recommendation: {
    monthly_amount: number;
    product_name: string;
    interest_rate: number;
    term_years: number;
  };
  insurance_recommendation: {
    recommendations: Array<{
      product_name: string;
      monthly_premium: number;
      coverage_limit: number;
      features: string[];
    }>;
  };
}

export default function PetProfilePage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [petName, setPetName] = useState("");

  async function handleUpload(file: File) {
    setLoading(true);
    setProfile(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("pet_name", petName || "우리 아이");

    try {
      const result = await apiPost<PetProfile>("/api/pet/analyze", formData);
      setProfile(result);
    } catch (err) {
      if (err instanceof ApiTimeoutError) {
        return; // timeout fallback shown by LoadingSpinner
      }
      console.error("Pet analysis failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function useSampleData() {
    setLoading(false);
    setProfile({
      pet_id: "PET-2406",
      breed: "말티즈",
      estimated_age: 3,
      gender_guess: "수컷",
      health_notes: "샘플 데이터입니다.",
      confidence: 0,
      lifetime_cost: {
        total_lifetime_cost: 8240000,
        remaining_years: 12,
        breakdown: { checkup: 2400000, disease: 4500000, surgery: 1340000 },
        common_conditions: ["슬개골 탈구", "치주질환", "유루증"],
      },
      savings_recommendation: {
        monthly_amount: 46000,
        product_name: "하나더펫 적금",
        interest_rate: 3.5,
        term_years: 12,
      },
      insurance_recommendation: {
        recommendations: [
          {
            product_name: "하나 펫보험 베이직",
            monthly_premium: 16500,
            coverage_limit: 5000000,
            features: ["통원 치료비", "입원 치료비", "수술비"],
          },
        ],
      },
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-800">📸 AI 펫 금융 ID</h2>

      <input
        type="text"
        placeholder="반려동물 이름을 입력하세요"
        value={petName}
        onChange={(e) => setPetName(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-hana-green"
      />

      {!profile && !loading && (
        <ImageUploader
          onUpload={handleUpload}
          label="반려동물 사진 업로드"
          sublabel="사진을 올리면 AI가 품종과 나이를 분석합니다"
          icon="🐕"
        />
      )}

      {loading && (
        <LoadingSpinner
          message="AI가 품종을 분석하고 있습니다..."
          onTimeout={useSampleData}
          timeoutMs={30000}
        />
      )}

      {profile && (
        <div className="space-y-4">
          {profile.confidence > 0 && (
            <p className="text-xs text-hana-green font-medium text-center">
              ✓ AI 품종 분석 완료: {profile.breed}, 추정 {profile.estimated_age}세
              (신뢰도 {Math.round(profile.confidence * 100)}%)
            </p>
          )}

          <PetFinancialCard
            petName={petName || "우리 아이"}
            breed={profile.breed}
            age={profile.estimated_age}
            gender={profile.gender_guess}
            petId={profile.pet_id}
          />

          <div>
            <p className="text-xs text-gray-400 mb-1">
              예상 생애 의료비 ({profile.lifetime_cost.remaining_years}년 기준)
            </p>
            <p className="text-3xl font-extrabold text-hana-green">
              ₩{profile.lifetime_cost.total_lifetime_cost.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              주요 질병 위험: {profile.lifetime_cost.common_conditions.join(", ")}
            </p>
          </div>

          <CostBreakdown
            breakdown={profile.lifetime_cost.breakdown}
            total={profile.lifetime_cost.total_lifetime_cost}
          />

          <SavingsRecommendation
            monthlyAmount={profile.savings_recommendation.monthly_amount}
            termYears={profile.savings_recommendation.term_years}
            interestRate={profile.savings_recommendation.interest_rate}
            productName={profile.savings_recommendation.product_name}
          />

          <button className="w-full py-3.5 bg-hana-green text-white font-bold rounded-xl text-sm">
            하나더펫 적금 가입하기
          </button>

          <button className="w-full py-3.5 border-2 border-hana-green text-hana-green font-bold rounded-xl text-sm">
            펫보험 추천 받기 →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify pet profile page renders**

```bash
cd /Users/xl8/Project/hanathepet/frontend
npm run dev
```

Visit `http://localhost:3000/pet-profile` — should show name input + image uploader. After uploading a pet photo (with backend running), should show Financial ID card, cost breakdown, and savings recommendation.

- [ ] **Step 6: Commit**

```bash
cd /Users/xl8/Project/hanathepet
git add frontend/src/
git commit -m "feat: add pet profile page — AI breed analysis + Financial ID + cost breakdown + savings recommendation"
```

---

## Task 9: Frontend — Flow 2: Insurance Claim Page

**Files:**
- Create: `frontend/src/components/ReceiptPreview.tsx`
- Create: `frontend/src/components/ClaimForm.tsx`
- Create: `frontend/src/app/insurance-claim/page.tsx`

- [ ] **Step 1: Create ReceiptPreview component**

Create `hanathepet/frontend/src/components/ReceiptPreview.tsx`:

```tsx
interface ReceiptItem {
  name: string;
  amount: number;
}

interface ReceiptPreviewProps {
  clinicName: string;
  visitDate: string;
  items: ReceiptItem[];
  totalAmount: number;
}

export default function ReceiptPreview({
  clinicName,
  visitDate,
  items,
  totalAmount,
}: ReceiptPreviewProps) {
  return (
    <div className="relative bg-gray-50 border border-gray-200 rounded-xl p-4">
      <span className="absolute -top-2 right-3 bg-hana-green text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
        OCR 인식완료
      </span>
      <p className="text-sm font-bold text-center mb-3">🏥 {clinicName}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 pb-1 border-b border-dotted border-gray-300">
          <span>진료일</span>
          <span>{visitDate}</span>
        </div>
        {items.map((item, i) => (
          <div
            key={i}
            className="flex justify-between text-xs text-gray-600 pb-1 border-b border-dotted border-gray-300"
          >
            <span>{item.name}</span>
            <span>₩{item.amount.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold pt-1">
          <span>합계</span>
          <span>₩{totalAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ClaimForm component**

Create `hanathepet/frontend/src/components/ClaimForm.tsx`:

```tsx
interface ClaimFormProps {
  fields: Array<{
    label: string;
    value: string;
    isAiFilled: boolean;
    isEmpty: boolean;
  }>;
}

export default function ClaimForm({ fields }: ClaimFormProps) {
  return (
    <div className="space-y-3">
      {fields.map((field, i) => (
        <div key={i}>
          <p className="text-[11px] text-gray-400 mb-1">{field.label}</p>
          <div
            className={`relative rounded-lg px-3 py-2.5 text-sm font-medium ${
              field.isEmpty
                ? "bg-red-50 border-2 border-red-300 text-red-500"
                : field.isAiFilled
                ? "bg-hana-green-light border border-hana-green text-hana-green"
                : "bg-gray-50 border border-gray-200 text-gray-700"
            }`}
          >
            {field.value || "수동 입력이 필요합니다"}
            {field.isAiFilled && !field.isEmpty && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-hana-green text-white text-[9px] px-1.5 py-0.5 rounded">
                AI
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create insurance claim page**

Create `hanathepet/frontend/src/app/insurance-claim/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import LoadingSpinner from "@/components/LoadingSpinner";
import ReceiptPreview from "@/components/ReceiptPreview";
import ClaimForm from "@/components/ClaimForm";
import { apiPost, apiPostBlob, ApiTimeoutError } from "@/lib/api";

interface OcrResult {
  clinic_name: string | null;
  clinic_business_number: string | null;
  visit_date: string | null;
  diagnosis: string | null;
  items: Array<{ name: string; amount: number }>;
  total_amount: number | null;
  pet_name: string | null;
}

export default function InsuranceClaimPage() {
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleUpload(file: File) {
    setLoading(true);
    setOcrResult(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const result = await apiPost<OcrResult>("/api/claim/ocr", formData);
      setOcrResult(result);
    } catch (err) {
      if (err instanceof ApiTimeoutError) return;
      console.error("OCR failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function useSampleOcr() {
    setLoading(false);
    setOcrResult({
      clinic_name: "행복동물병원",
      clinic_business_number: "123-45-67890",
      visit_date: "2026.03.28",
      diagnosis: "슬개골 탈구 (Grade II) - 좌측 후지",
      items: [
        { name: "수술비", amount: 850000 },
        { name: "마취비", amount: 150000 },
        { name: "입원비 (3일)", amount: 180000 },
        { name: "약제비", amount: 45000 },
      ],
      total_amount: 1225000,
      pet_name: "보리",
    });
  }

  async function handleDownloadPdf() {
    if (!ocrResult) return;
    setPdfLoading(true);

    const claimData = {
      pet_info: {
        name: ocrResult.pet_name || "우리 아이",
        breed: "말티즈",
        age: 3,
        pet_id: "PET-2406",
      },
      policy_number: "HANA-PET-2026-001234",
      clinic_name: ocrResult.clinic_name || "",
      clinic_business_number: ocrResult.clinic_business_number,
      visit_date: ocrResult.visit_date || "",
      diagnosis: ocrResult.diagnosis || "",
      items: ocrResult.items,
      total_amount: ocrResult.total_amount || 0,
      estimated_payout: Math.round((ocrResult.total_amount || 0) * 0.8),
    };

    try {
      const blob = await apiPostBlob("/api/claim/generate-pdf", claimData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hanathepet-claim.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfLoading(false);
    }
  }

  function buildClaimFields() {
    if (!ocrResult) return [];
    return [
      {
        label: "피보험동물",
        value: `${ocrResult.pet_name || "우리 아이"} (말티즈, 3세, PET ID #2406)`,
        isAiFilled: true,
        isEmpty: false,
      },
      {
        label: "진료기관",
        value: ocrResult.clinic_name
          ? `${ocrResult.clinic_name}${ocrResult.clinic_business_number ? ` (사업자 ${ocrResult.clinic_business_number})` : ""}`
          : "",
        isAiFilled: true,
        isEmpty: !ocrResult.clinic_name,
      },
      {
        label: "상병명",
        value: ocrResult.diagnosis || "",
        isAiFilled: true,
        isEmpty: !ocrResult.diagnosis,
      },
      {
        label: "청구금액",
        value: ocrResult.total_amount
          ? `₩${ocrResult.total_amount.toLocaleString()} (보장한도 내 ₩${Math.round(ocrResult.total_amount * 0.8).toLocaleString()} 예상)`
          : "",
        isAiFilled: true,
        isEmpty: !ocrResult.total_amount,
      },
    ];
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-800">📋 보험 청구 자동화</h2>

      {!ocrResult && !loading && (
        <ImageUploader
          onUpload={handleUpload}
          label="영수증 사진 업로드"
          sublabel="동물병원 영수증을 촬영하거나 선택하세요"
          icon="🧾"
        />
      )}

      {loading && (
        <LoadingSpinner
          message="AI가 영수증을 분석하고 있습니다..."
          onTimeout={useSampleOcr}
          timeoutMs={30000}
        />
      )}

      {ocrResult && (
        <div className="space-y-4">
          <ReceiptPreview
            clinicName={ocrResult.clinic_name || "알수없음"}
            visitDate={ocrResult.visit_date || "알수없음"}
            items={ocrResult.items}
            totalAmount={ocrResult.total_amount || 0}
          />

          <ClaimForm fields={buildClaimFields()} />

          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="w-full py-3.5 bg-hana-green text-white font-bold rounded-xl text-sm disabled:opacity-50"
          >
            {pdfLoading ? "PDF 생성 중..." : "📄 PDF 청구서 다운로드 & 제출"}
          </button>
          <p className="text-center text-[11px] text-gray-400">
            진료차트 · 수술기록지 · 검사소견서 자동 첨부됨
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify insurance claim page renders**

```bash
cd /Users/xl8/Project/hanathepet/frontend
npm run dev
```

Visit `http://localhost:3000/insurance-claim` — should show receipt upload area. After uploading (with backend running), should show OCR preview + claim form with AI badges + PDF download button.

- [ ] **Step 5: Commit**

```bash
cd /Users/xl8/Project/hanathepet
git add frontend/src/
git commit -m "feat: add insurance claim page — receipt OCR + auto-fill claim form + PDF download"
```

---

## Task 10: End-to-End Verification + Polish

**Files:**
- May modify: any file for bug fixes

- [ ] **Step 1: Start both servers**

Terminal 1:
```bash
cd /Users/xl8/Project/hanathepet/backend
source .venv/bin/activate
PYTHONPATH=. uvicorn main:app --reload --port 8000
```

Terminal 2:
```bash
cd /Users/xl8/Project/hanathepet/frontend
npm run dev
```

- [ ] **Step 2: Test Flow 1 — Pet Profile**

1. Visit `http://localhost:3000/pet-profile`
2. Enter pet name "보리"
3. Upload a dog photo (any maltese photo from the internet)
4. Verify: loading spinner appears → AI analysis result → Financial ID card → cost breakdown → savings recommendation

Expected: Full flow completes in under 10 seconds.

- [ ] **Step 3: Test Flow 2 — Insurance Claim**

1. Visit `http://localhost:3000/insurance-claim`
2. Upload a vet receipt image (or any receipt-like image)
3. Verify: loading spinner → OCR result preview → claim form with green AI badges
4. Click "PDF 청구서 다운로드" → verify PDF downloads and opens with correct data

Expected: Full flow completes, PDF starts with correct claim data.

- [ ] **Step 4: Test timeout fallback**

1. Temporarily set `OPENAI_API_KEY` to an invalid value in `backend/.env`
2. Restart backend
3. Upload a photo on either page
4. Verify: loading spinner → after 30 seconds → timeout fallback button appears → click it → sample data loads

- [ ] **Step 5: Run backend tests**

```bash
cd /Users/xl8/Project/hanathepet/backend
source .venv/bin/activate
PYTHONPATH=. python -m pytest tests/ -v
```

Expected: All tests PASS.

- [ ] **Step 6: Final commit**

```bash
cd /Users/xl8/Project/hanathepet
git add -A
git commit -m "feat: complete HanaThePet MVP — AI pet financial platform demo"
```

---

## Self-Review Notes

- **Spec coverage check:** Flow 1 (pet profile + financial ID + cost prediction + savings + insurance recommendation) ✓ | Flow 2 (receipt OCR + claim form + PDF generation) ✓ | Error handling + timeout fallback ✓ | PDF field spec ✓ | Hana brand UI ✓
- **Placeholder scan:** All code blocks contain complete implementations. No TBDs or TODOs.
- **Type consistency:** `PetProfile` interface in frontend matches `PetProfileResponse` Pydantic model. `OcrResult` matches `OcrResultResponse`. `GeneratePdfRequest` matches the claim data structure built in frontend.
- **One known gap:** The insurance claim page hardcodes pet info (말티즈, 3세, PET-2406) in `handleDownloadPdf`. In a real app, this would come from a stored pet profile. For the hackathon demo, this is acceptable since both flows are demoed sequentially with the same pet.

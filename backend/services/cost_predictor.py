"""Cost predictor service for pet lifetime medical cost estimation."""

import json
import math
from pathlib import Path

_DATA_DIR = Path(__file__).parent.parent / "data"

with open(_DATA_DIR / "breed_costs.json", encoding="utf-8") as f:
    _BREED_COSTS: dict = json.load(f)

with open(_DATA_DIR / "mock_products.json", encoding="utf-8") as f:
    _PRODUCTS: dict = json.load(f)


def predict_lifetime_cost(breed: str, age: int) -> dict:
    """Predict remaining lifetime medical cost for a pet.

    Args:
        breed: Korean breed name (e.g. '말티즈'). Falls back to 'default' if unknown.
        age: Current age of the pet in years.

    Returns:
        dict with breed, age, life_expectancy, remaining_years, total_lifetime_cost,
        breakdown, common_conditions, risk_multiplier.
    """
    data = _BREED_COSTS.get(breed, _BREED_COSTS["default"])
    life_expectancy: int = data["life_expectancy"]
    remaining_years = max(0, life_expectancy - age)
    risk = data["risk_multiplier"]

    annual = data["annual_costs"]
    annual_checkup = int(annual["checkup"] * risk)
    annual_disease = int(annual["disease"] * risk)
    annual_surgery = int(annual["surgery"] * risk)
    annual_total = annual_checkup + annual_disease + annual_surgery

    total = int(annual_total * remaining_years)

    return {
        "breed": breed,
        "age": age,
        "life_expectancy": life_expectancy,
        "remaining_years": remaining_years,
        "total_lifetime_cost": total,
        "breakdown": {
            "checkup": int(annual_checkup * remaining_years),
            "disease": int(annual_disease * remaining_years),
            "surgery": int(annual_surgery * remaining_years),
        },
        "common_conditions": data["common_conditions"],
        "risk_multiplier": risk,
    }


def recommend_savings(total_cost: int, remaining_years: int) -> dict:
    """Recommend a savings plan to cover predicted lifetime costs.

    Args:
        total_cost: Total predicted cost in KRW.
        remaining_years: Number of years remaining.

    Returns:
        dict with monthly_amount, product_name, interest_rate, term_years,
        total_deposit, benefits.
    """
    product = _PRODUCTS["savings"]
    interest_rate = product["interest_rate"] / 100  # annual rate
    term_years = max(1, remaining_years)
    months = term_years * 12

    # Calculate required monthly deposit using future value of annuity formula:
    # FV = PMT * [((1 + r)^n - 1) / r], solve for PMT
    # r = monthly interest rate
    monthly_rate = interest_rate / 12
    if monthly_rate > 0 and months > 0:
        fv_factor = ((1 + monthly_rate) ** months - 1) / monthly_rate
        raw_monthly = math.ceil(total_cost / fv_factor / 1000) * 1000
    else:
        raw_monthly = math.ceil(total_cost / max(months, 1) / 1000) * 1000

    monthly_amount = max(
        product["min_monthly"],
        min(raw_monthly, product["max_monthly"]),
    )

    total_deposit = monthly_amount * months

    return {
        "monthly_amount": monthly_amount,
        "product_name": product["product_name"],
        "interest_rate": product["interest_rate"],
        "term_years": term_years,
        "total_deposit": total_deposit,
        "benefits": product["benefits"],
    }


def recommend_insurance(breed: str, age: int) -> list[dict]:
    """Recommend insurance products adjusted for the pet's breed and age.

    Args:
        breed: Korean breed name.
        age: Current age of the pet in years.

    Returns:
        List of insurance recommendation dicts with adjusted premiums and suitability.
    """
    data = _BREED_COSTS.get(breed, _BREED_COSTS["default"])
    risk = data["risk_multiplier"]

    recommendations = []
    for product in _PRODUCTS["insurance"]:
        if age > product["max_age"]:
            continue

        # Adjust premium based on breed risk and age factor
        age_factor = 1.0 + (age / product["max_age"]) * 0.3
        adjusted_premium = int(product["monthly_premium"] * risk * age_factor / 1000) * 1000
        adjusted_premium = max(product["monthly_premium"], adjusted_premium)

        recommendations.append(
            {
                "product_id": product["product_id"],
                "product_name": product["product_name"],
                "base_premium": product["monthly_premium"],
                "adjusted_premium": adjusted_premium,
                "coverage": product["coverage"],
                "deductible": product["deductible"],
                "waiting_period_days": product["waiting_period_days"],
                "features": product["features"],
                "exclusions": product["exclusions"],
                "suitable": True,
            }
        )

    # If no products are suitable (pet too old), return message
    if not recommendations:
        recommendations.append(
            {
                "product_id": None,
                "product_name": "가입 불가",
                "adjusted_premium": 0,
                "suitable": False,
                "reason": f"현재 나이({age}세)로 인해 가입 가능한 보험 상품이 없습니다.",
            }
        )

    return recommendations

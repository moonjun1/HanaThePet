"""Tests for the cost predictor service."""

import pytest
from services.cost_predictor import predict_lifetime_cost, recommend_savings, recommend_insurance


class TestPredictLifetimeCost:
    def test_known_breed_maltese_age_3(self):
        result = predict_lifetime_cost("말티즈", 3)

        assert result["breed"] == "말티즈"
        assert result["age"] == 3
        assert result["life_expectancy"] == 15
        assert result["remaining_years"] == 12
        assert result["risk_multiplier"] == 0.9

        # Verify breakdown sums to total
        breakdown = result["breakdown"]
        assert breakdown["checkup"] + breakdown["disease"] + breakdown["surgery"] == result["total_lifetime_cost"]

        # Verify cost is positive and reasonable (should be in millions of KRW)
        assert result["total_lifetime_cost"] > 0
        assert result["total_lifetime_cost"] > 1_000_000  # at least 1M KRW for 12 years

        # Verify common conditions
        assert isinstance(result["common_conditions"], list)
        assert len(result["common_conditions"]) > 0
        assert "슬개골 탈구" in result["common_conditions"]

    def test_known_breed_maltese_exact_costs(self):
        result = predict_lifetime_cost("말티즈", 3)
        # annual_checkup = 220000 * 0.9 = 198000
        # annual_disease = 380000 * 0.9 = 342000
        # annual_surgery = 520000 * 0.9 = 468000
        # annual_total = 1008000, remaining = 12, total = 12096000
        assert result["breakdown"]["checkup"] == int(198000 * 12)
        assert result["breakdown"]["disease"] == int(342000 * 12)
        assert result["breakdown"]["surgery"] == int(468000 * 12)
        assert result["total_lifetime_cost"] == 12096000

    def test_unknown_breed_uses_fallback(self):
        result = predict_lifetime_cost("존재하지않는견종", 5)

        # Should use default breed data
        assert result["breed"] == "존재하지않는견종"
        assert result["life_expectancy"] == 13
        assert result["remaining_years"] == 8
        assert result["risk_multiplier"] == 1.0
        assert result["total_lifetime_cost"] > 0

    def test_unknown_breed_breakdown_sums_to_total(self):
        result = predict_lifetime_cost("unknown_dog", 2)
        breakdown = result["breakdown"]
        assert breakdown["checkup"] + breakdown["disease"] + breakdown["surgery"] == result["total_lifetime_cost"]

    def test_pet_at_max_age_returns_zero_remaining(self):
        result = predict_lifetime_cost("말티즈", 15)
        assert result["remaining_years"] == 0
        assert result["total_lifetime_cost"] == 0

    def test_pet_over_max_age_clamps_to_zero(self):
        result = predict_lifetime_cost("말티즈", 20)
        assert result["remaining_years"] == 0
        assert result["total_lifetime_cost"] == 0

    def test_high_risk_breed_costs_more(self):
        bulldog = predict_lifetime_cost("불독", 3)
        maltese = predict_lifetime_cost("말티즈", 3)
        # Bulldog has higher risk but lower life expectancy — per-year cost should be higher
        bulldog_annual = bulldog["total_lifetime_cost"] / max(bulldog["remaining_years"], 1)
        maltese_annual = maltese["total_lifetime_cost"] / max(maltese["remaining_years"], 1)
        assert bulldog_annual > maltese_annual


class TestRecommendSavings:
    def test_returns_valid_monthly_amount(self):
        result = recommend_savings(10_000_000, 10)

        assert "monthly_amount" in result
        assert result["monthly_amount"] >= 10_000   # min monthly
        assert result["monthly_amount"] <= 500_000  # max monthly
        assert isinstance(result["monthly_amount"], int)

    def test_product_name_and_rate(self):
        result = recommend_savings(5_000_000, 5)

        assert result["product_name"] == "하나더펫 적금"
        assert result["interest_rate"] == 3.5
        assert result["term_years"] == 5

    def test_total_deposit_is_monthly_times_months(self):
        result = recommend_savings(8_000_000, 8)

        expected_total = result["monthly_amount"] * (result["term_years"] * 12)
        assert result["total_deposit"] == expected_total

    def test_benefits_is_list(self):
        result = recommend_savings(3_000_000, 3)

        assert isinstance(result["benefits"], list)
        assert len(result["benefits"]) > 0

    def test_zero_remaining_years_returns_at_least_one_year(self):
        result = recommend_savings(1_000_000, 0)

        assert result["term_years"] >= 1
        assert result["monthly_amount"] >= 10_000

    def test_large_cost_caps_at_max_monthly(self):
        # Very large cost should cap at max monthly (500,000)
        result = recommend_savings(1_000_000_000, 1)
        assert result["monthly_amount"] <= 500_000


class TestRecommendInsurance:
    def test_young_dog_gets_recommendations(self):
        recommendations = recommend_insurance("말티즈", 3)

        assert isinstance(recommendations, list)
        assert len(recommendations) >= 1

        for rec in recommendations:
            assert rec["suitable"] is True
            assert "product_name" in rec
            assert "adjusted_premium" in rec

    def test_premium_adjusted_for_risk(self):
        # High-risk breed should have higher adjusted premium
        bulldog_recs = recommend_insurance("불독", 5)
        maltese_recs = recommend_insurance("말티즈", 5)

        bulldog_premium = next((r["adjusted_premium"] for r in bulldog_recs if r.get("product_id") == "basic"), None)
        maltese_premium = next((r["adjusted_premium"] for r in maltese_recs if r.get("product_id") == "basic"), None)

        if bulldog_premium and maltese_premium:
            assert bulldog_premium > maltese_premium

    def test_old_dog_has_no_suitable_products(self):
        recommendations = recommend_insurance("말티즈", 15)

        assert isinstance(recommendations, list)
        assert len(recommendations) == 1
        assert recommendations[0]["suitable"] is False

    def test_unknown_breed_falls_back_gracefully(self):
        recommendations = recommend_insurance("unknown_breed", 3)

        assert isinstance(recommendations, list)
        assert len(recommendations) >= 1

"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PetFinancialCard from "@/components/PetFinancialCard";
import CostBreakdown from "@/components/CostBreakdown";
import SavingsRecommendation from "@/components/SavingsRecommendation";
import Link from "next/link";
import { apiPost, ApiTimeoutError } from "@/lib/api";

/* ── Types matching backend PetProfileResponse ── */

interface PhotoAnalysis {
  breed: string;
  estimated_age: string;
  gender_guess: string;
  health_notes: string;
  confidence: number;
}

interface CostPrediction {
  breed: string;
  age: number;
  life_expectancy: number;
  remaining_years: number;
  total_lifetime_cost: number;
  breakdown: { checkup: number; disease: number; surgery: number };
  common_conditions: string[];
  risk_multiplier: number;
}

interface Savings {
  monthly_amount: number;
  product_name: string;
  interest_rate: number;
  term_years: number;
  total_deposit: number;
  benefits: string[];
}

interface InsuranceItem {
  product_name: string;
  adjusted_premium: number;
  suitable: boolean;
  features?: string[];
}

interface BackendResponse {
  photo_analysis: PhotoAnalysis;
  cost_prediction: CostPrediction;
  savings: Savings;
  insurance: InsuranceItem[];
}

/* ── Sample fallback ── */

const SAMPLE_RESPONSE: BackendResponse = {
  photo_analysis: {
    breed: "말티즈",
    estimated_age: "3세",
    gender_guess: "수컷",
    health_notes: "샘플 데이터입니다.",
    confidence: 0.0,
  },
  cost_prediction: {
    breed: "말티즈",
    age: 3,
    life_expectancy: 15,
    remaining_years: 12,
    total_lifetime_cost: 8240000,
    breakdown: { checkup: 2400000, disease: 4500000, surgery: 1340000 },
    common_conditions: ["슬개골 탈구", "치주질환", "유루증"],
    risk_multiplier: 1.1,
  },
  savings: {
    monthly_amount: 46000,
    product_name: "하나더펫 적금",
    interest_rate: 3.5,
    term_years: 12,
    total_deposit: 6624000,
    benefits: ["반려동물 병원비 우선 지원"],
  },
  insurance: [
    {
      product_name: "하나더펫 베이직",
      adjusted_premium: 16500,
      suitable: true,
      features: ["통원 치료비", "입원 치료비", "수술비"],
    },
  ],
};

type Stage = "input" | "loading" | "result";

export default function PetProfilePage() {
  const [petName, setPetName] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [result, setResult] = useState<BackendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    if (!petName.trim()) {
      setError("반려동물 이름을 먼저 입력해주세요.");
      return;
    }
    setError(null);
    setStage("loading");

    const fd = new FormData();
    fd.append("image", file);
    fd.append("pet_name", petName.trim());

    try {
      const data = await apiPost<BackendResponse>("/api/pet/analyze", fd, 30000);
      setResult(data);
      setStage("result");
    } catch (err) {
      if (err instanceof ApiTimeoutError) {
        return;
      }
      console.error(err);
    }
  }

  function handleTimeout() {
    setResult(SAMPLE_RESPONSE);
    setStage("result");
  }

  function handleReset() {
    setPetName("");
    setStage("input");
    setResult(null);
    setError(null);
  }

  const photo = result?.photo_analysis;
  const cost = result?.cost_prediction;
  const savings = result?.savings;

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">반려동물 금융 ID</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          AI가 사진으로 품종을 분석하고 의료비를 예측합니다
        </p>
      </div>

      {stage === "input" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              반려동물 이름
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="예: 하나, 몽이, 콩이…"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm outline-none focus:border-[#00954F] focus:ring-2 focus:ring-[#00954F]/20 transition-colors"
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              반려동물 사진
            </label>
            <ImageUploader
              onUpload={handleUpload}
              label="반려동물 사진 업로드"
              sublabel="탭하여 카메라로 촬영하거나 갤러리에서 선택"
            />
          </div>
        </>
      )}

      {stage === "loading" && (
        <LoadingSpinner
          timeoutMs={30000}
          onTimeout={handleTimeout}
          message="AI가 반려동물 품종을 분석 중입니다…"
        />
      )}

      {stage === "result" && photo && cost && savings && (
        <div className="space-y-4">
          {/* Confidence */}
          <div className="rounded-xl bg-[#E8F5EE] px-4 py-2.5 flex items-center gap-2">
            <span className="text-[#00954F] text-lg">🤖</span>
            <p className="text-xs text-[#006B38] font-medium">
              AI 분석 신뢰도:{" "}
              <span className="font-bold text-[#00954F]">
                {Math.round(photo.confidence * 100)}%
              </span>
              {" · "}
              {photo.breed}, {photo.estimated_age}
            </p>
          </div>

          {/* Financial card */}
          <PetFinancialCard
            petName={petName || "우리 아이"}
            breed={photo.breed}
            age={cost.age}
            gender={photo.gender_guess}
            petId={`PET-${Math.floor(Math.random() * 9000 + 1000)}`}
          />

          {/* Lifetime cost */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500 mb-1">
              예상 평생 의료비 ({cost.remaining_years}년 기준)
            </p>
            <p className="text-2xl font-bold text-gray-900">
              ₩{cost.total_lifetime_cost.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">{photo.health_notes}</p>
          </div>

          {/* Common conditions */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              주요 발생 질환
            </p>
            <div className="flex flex-wrap gap-2">
              {cost.common_conditions.map((cond) => (
                <span
                  key={cond}
                  className="text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full font-medium"
                >
                  {cond}
                </span>
              ))}
            </div>
          </div>

          {/* Cost breakdown chart */}
          <CostBreakdown
            breakdown={cost.breakdown}
            total={cost.total_lifetime_cost}
          />

          {/* Savings recommendation */}
          <SavingsRecommendation
            monthlyAmount={savings.monthly_amount}
            termMonths={savings.term_years * 12}
            interestRate={savings.interest_rate}
          />

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 pt-1 pb-2">
            <button className="w-full py-3.5 rounded-2xl bg-[#00954F] text-white font-bold text-sm active:bg-[#006B38] transition-colors shadow-md">
              하나더펫 적금 가입하기
            </button>
            <Link href="/insurance-claim">
              <button className="w-full py-3.5 rounded-2xl border-2 border-[#00954F] text-[#00954F] font-bold text-sm active:bg-[#E8F5EE] transition-colors">
                펫보험 청구하기
              </button>
            </Link>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 underline text-center"
            >
              다시 분석하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

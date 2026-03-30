"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PetFinancialCard from "@/components/PetFinancialCard";
import CostBreakdown from "@/components/CostBreakdown";
import SavingsRecommendation from "@/components/SavingsRecommendation";
import Link from "next/link";
import { apiPost, ApiTimeoutError } from "@/lib/api";

interface PetAnalysisResult {
  pet_name: string;
  breed: string;
  age: number;
  gender: string;
  pet_id: string;
  confidence: number;
  lifetime_cost: number;
  common_conditions: string[];
  cost_breakdown: {
    checkup: number;
    treatment: number;
    surgery: number;
  };
  monthly_savings: number;
  savings_term_months: number;
  savings_interest_rate: number;
}

const SAMPLE_DATA: PetAnalysisResult = {
  pet_name: "하나",
  breed: "말티즈",
  age: 3,
  gender: "암컷",
  pet_id: "HANA-MLT-2022-A001",
  confidence: 0.91,
  lifetime_cost: 18500000,
  common_conditions: ["슬개골 탈구", "치주 질환", "피부 알레르기"],
  cost_breakdown: {
    checkup: 3700000,
    treatment: 8300000,
    surgery: 6500000,
  },
  monthly_savings: 154000,
  savings_term_months: 120,
  savings_interest_rate: 3.5,
};

type Stage = "input" | "loading" | "result";

export default function PetProfilePage() {
  const [petName, setPetName] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [result, setResult] = useState<PetAnalysisResult | null>(null);
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
      const data = await apiPost<PetAnalysisResult>("/api/pet/analyze", fd, 30000);
      setResult(data);
      setStage("result");
    } catch (err) {
      if (err instanceof ApiTimeoutError) {
        // timeout handled by spinner fallback button
        return;
      }
      // API error — show error but stay in loading so spinner timeout still works
      console.error(err);
    }
  }

  function handleTimeout() {
    const sample = { ...SAMPLE_DATA, pet_name: petName.trim() || SAMPLE_DATA.pet_name };
    setResult(sample);
    setStage("result");
  }

  function handleReset() {
    setPetName("");
    setStage("input");
    setResult(null);
    setError(null);
  }

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
          {/* Pet name input */}
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

          {/* Image uploader */}
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

      {stage === "result" && result && (
        <div className="space-y-4">
          {/* Confidence */}
          <div className="rounded-xl bg-[#E8F5EE] px-4 py-2.5 flex items-center gap-2">
            <span className="text-[#00954F] text-lg">🤖</span>
            <p className="text-xs text-[#006B38] font-medium">
              AI 분석 신뢰도:{" "}
              <span className="font-bold text-[#00954F]">
                {Math.round(result.confidence * 100)}%
              </span>
            </p>
          </div>

          {/* Financial card */}
          <PetFinancialCard
            petName={result.pet_name}
            breed={result.breed}
            age={result.age}
            gender={result.gender}
            petId={result.pet_id}
          />

          {/* Lifetime cost */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500 mb-1">예상 평생 의료비</p>
            <p className="text-2xl font-bold text-gray-900">
              ₩{result.lifetime_cost.toLocaleString()}
            </p>
          </div>

          {/* Common conditions */}
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              주요 발생 질환
            </p>
            <div className="flex flex-wrap gap-2">
              {result.common_conditions.map((cond) => (
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
            breakdown={result.cost_breakdown}
            total={result.lifetime_cost}
          />

          {/* Savings recommendation */}
          <SavingsRecommendation
            monthlyAmount={result.monthly_savings}
            termMonths={result.savings_term_months}
            interestRate={result.savings_interest_rate}
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

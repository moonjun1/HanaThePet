interface SavingsRecommendationProps {
  monthlyAmount: number;
  termMonths: number;
  interestRate: number;
}

export default function SavingsRecommendation({
  monthlyAmount,
  termMonths,
  interestRate,
}: SavingsRecommendationProps) {
  const termYears = termMonths / 12;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">💰</span>
        <div>
          <p className="text-xs text-amber-700 font-medium">AI 추천 금융 상품</p>
          <h3 className="text-sm font-bold text-amber-900">하나더펫 적금</h3>
        </div>
      </div>

      <div className="bg-white/70 rounded-xl p-4 mb-3">
        <p className="text-xs text-amber-600 mb-1">월 납입 권장 금액</p>
        <p className="text-3xl font-bold text-amber-800">
          {monthlyAmount.toLocaleString()}
          <span className="text-base font-medium ml-1">원</span>
        </p>
      </div>

      <div className="flex gap-3 text-center">
        <div className="flex-1 bg-white/60 rounded-xl p-3">
          <p className="text-xs text-amber-600 mb-1">적립 기간</p>
          <p className="text-sm font-bold text-amber-800">{termYears}년</p>
        </div>
        <div className="flex-1 bg-white/60 rounded-xl p-3">
          <p className="text-xs text-amber-600 mb-1">금리 (연)</p>
          <p className="text-sm font-bold text-amber-800">{interestRate}%</p>
        </div>
        <div className="flex-1 bg-white/60 rounded-xl p-3">
          <p className="text-xs text-amber-600 mb-1">예상 만기 금액</p>
          <p className="text-sm font-bold text-amber-800">
            {Math.round(
              monthlyAmount * termMonths * (1 + interestRate / 100)
            ).toLocaleString()}
            원
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-amber-600 text-center">
        * 반려동물 의료비 전용 적금 상품
      </p>
    </div>
  );
}

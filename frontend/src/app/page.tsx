import Link from "next/link";

export default function Home() {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-gray-900">
          안녕하세요! 👋
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          반려동물의 건강한 미래를 하나더펫과 함께 준비하세요.
        </p>
      </div>

      {/* Feature cards */}
      <div className="space-y-4">
        {/* Pet Financial ID card — green gradient */}
        <Link href="/pet-profile">
          <div className="rounded-2xl bg-gradient-to-br from-[#00954F] to-[#006B38] p-5 text-white shadow-md active:scale-[0.98] transition-transform cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-green-200 font-medium uppercase tracking-wide mb-1">
                  Flow 1
                </p>
                <h3 className="text-lg font-bold leading-tight">
                  반려동물 금융 ID
                </h3>
                <p className="text-xs text-green-200 mt-1.5 leading-relaxed">
                  AI가 사진만으로 품종·나이를 분석하고<br />
                  평생 의료비를 예측해 드립니다
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                  <ellipse cx="5" cy="8" rx="2" ry="2.8" />
                  <ellipse cx="9.5" cy="5.5" rx="1.8" ry="2.5" />
                  <ellipse cx="14.5" cy="5.5" rx="1.8" ry="2.5" />
                  <ellipse cx="19" cy="8" rx="2" ry="2.8" />
                  <path d="M12 10c-3.5 0-6.5 2.5-6.5 5.5 0 1.5.7 2.8 2 3.8.8.6 2.2 1.2 4.5 1.2s3.7-.6 4.5-1.2c1.3-1 2-2.3 2-3.8C18.5 12.5 15.5 10 12 10z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-100 font-medium">
              시작하기
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Insurance Claim card — white with green border */}
        <Link href="/insurance-claim">
          <div className="rounded-2xl bg-white border-2 border-[#00954F] p-5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-[#00954F] font-medium uppercase tracking-wide mb-1">
                  Flow 2
                </p>
                <h3 className="text-lg font-bold leading-tight text-gray-900">
                  보험 청구 자동화
                </h3>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  영수증 사진을 찍으면 OCR로 자동 입력하고<br />
                  청구서 PDF를 즉시 생성해 드립니다
                </p>
              </div>
              <div className="w-12 h-12 bg-[#E8F5EE] rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00954F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="3" width="16" height="18" rx="2" />
                  <path d="M8 7h8M8 11h8M8 15h5" />
                </svg>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#00954F] font-medium">
              청구하기
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Info banner */}
      <div className="rounded-xl bg-[#E8F5EE] px-4 py-3 flex gap-3 items-start">
        <span className="text-lg flex-shrink-0">🏦</span>
        <div>
          <p className="text-xs font-semibold text-[#006B38]">하나은행 전용 서비스</p>
          <p className="text-xs text-[#00954F] mt-0.5 leading-relaxed">
            반려동물 의료비 적금부터 보험 청구까지 원스톱으로 제공합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

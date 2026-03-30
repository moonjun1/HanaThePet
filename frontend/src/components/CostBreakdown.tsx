interface BreakdownItem {
  label: string;
  amount: number;
  color: string;
  bgColor: string;
}

interface CostBreakdownProps {
  breakdown: {
    checkup: number;
    disease: number;
    surgery: number;
  };
  total: number;
}

function formatKRW(amount: number): string {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

export default function CostBreakdown({ breakdown, total }: CostBreakdownProps) {
  const items: BreakdownItem[] = [
    {
      label: "정기검진",
      amount: breakdown.checkup,
      color: "text-[#00954F]",
      bgColor: "bg-[#00954F]",
    },
    {
      label: "질병치료",
      amount: breakdown.disease,
      color: "text-orange-500",
      bgColor: "bg-orange-400",
    },
    {
      label: "수술비",
      amount: breakdown.surgery,
      color: "text-red-500",
      bgColor: "bg-red-400",
    },
  ];

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">예상 비용 분석</h3>

      <div className="space-y-3">
        {items.map((item) => {
          const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
          return (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className={`font-medium ${item.color}`}>{item.label}</span>
                <span className="text-gray-500">
                  {formatKRW(item.amount)} ({pct}%)
                </span>
              </div>
              <div className="relative h-7 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${item.bgColor} rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
                  style={{ width: `${Math.max(pct, 8)}%` }}
                >
                  {pct >= 15 && (
                    <span className="text-white text-xs font-semibold">
                      {formatKRW(item.amount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-500">예상 총 평생 비용</span>
        <span className="text-base font-bold text-gray-900">
          {total.toLocaleString()}원
        </span>
      </div>
    </div>
  );
}

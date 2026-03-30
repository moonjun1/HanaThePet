interface LineItem {
  description: string;
  amount: number;
}

interface ReceiptPreviewProps {
  clinicName: string;
  visitDate: string;
  items: LineItem[];
  total: number;
}

export default function ReceiptPreview({
  clinicName,
  visitDate,
  items,
  total,
}: ReceiptPreviewProps) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
      {/* OCR badge header */}
      <div className="bg-[#00954F] px-4 py-2 flex items-center justify-between">
        <span className="text-white text-xs font-semibold">📄 진료 영수증</span>
        <span className="bg-white text-[#00954F] text-xs font-bold px-2 py-0.5 rounded-full">
          OCR 인식완료 ✓
        </span>
      </div>

      <div className="p-4">
        {/* Clinic info */}
        <div className="mb-4">
          <p className="text-base font-bold text-gray-900">{clinicName}</p>
          <p className="text-xs text-gray-500 mt-0.5">방문일: {visitDate}</p>
        </div>

        {/* Line items */}
        <div className="space-y-2 mb-4">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.description}</span>
              <span className="font-medium text-gray-900">
                {item.amount.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t-2 border-dashed border-gray-200 pt-3 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-700">합계</span>
          <span className="text-lg font-bold text-[#00954F]">
            {total.toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  );
}

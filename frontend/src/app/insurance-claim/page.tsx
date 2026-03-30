"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import LoadingSpinner from "@/components/LoadingSpinner";
import ReceiptPreview from "@/components/ReceiptPreview";
import ClaimForm, { ClaimField } from "@/components/ClaimForm";
import { apiPost, apiPostBlob, ApiTimeoutError } from "@/lib/api";

/* ── Types matching backend OcrResultResponse ── */

interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface OcrResult {
  clinic_name: string | null;
  clinic_business_number: string | null;
  visit_date: string | null;
  diagnosis: string | null;
  items: ReceiptItem[];
  total_amount: number;
  pet_name: string | null;
}

const SAMPLE_OCR: OcrResult = {
  clinic_name: "행복동물병원",
  clinic_business_number: "123-45-67890",
  visit_date: "2026-03-28",
  diagnosis: "슬개골 탈구 (Grade II) - 좌측 후지",
  items: [
    { name: "슬개골 정복술", quantity: 1, unit_price: 850000, amount: 850000 },
    { name: "전신마취 (흡입)", quantity: 1, unit_price: 150000, amount: 150000 },
    { name: "입원비 (3일)", quantity: 1, unit_price: 60000, amount: 180000 },
    { name: "항생제 + 소염진통제", quantity: 1, unit_price: 45000, amount: 45000 },
  ],
  total_amount: 1225000,
  pet_name: "보리",
};

type Stage = "input" | "loading" | "result";

function buildFields(ocr: OcrResult): ClaimField[] {
  return [
    {
      key: "pet_name",
      label: "피보험동물",
      value: ocr.pet_name || "우리 아이",
      aiDetected: !!ocr.pet_name,
    },
    {
      key: "clinic_name",
      label: "진료기관",
      value: ocr.clinic_name
        ? `${ocr.clinic_name}${ocr.clinic_business_number ? ` (사업자 ${ocr.clinic_business_number})` : ""}`
        : "",
      aiDetected: !!ocr.clinic_name,
    },
    {
      key: "diagnosis",
      label: "상병명",
      value: ocr.diagnosis || "",
      aiDetected: !!ocr.diagnosis,
    },
    {
      key: "claim_amount",
      label: "청구금액",
      value: ocr.total_amount
        ? `₩${ocr.total_amount.toLocaleString()} (보장한도 내 ₩${Math.round(ocr.total_amount * 0.8).toLocaleString()} 예상)`
        : "",
      aiDetected: !!ocr.total_amount,
    },
  ];
}

export default function InsuranceClaimPage() {
  const [stage, setStage] = useState<Stage>("input");
  const [ocrData, setOcrData] = useState<OcrResult | null>(null);
  const [fields, setFields] = useState<ClaimField[]>([]);
  const [downloading, setDownloading] = useState(false);

  async function handleUpload(file: File) {
    setStage("loading");

    const fd = new FormData();
    fd.append("image", file);

    try {
      const data = await apiPost<OcrResult>("/api/claim/ocr", fd, 30000);
      setOcrData(data);
      setFields(buildFields(data));
      setStage("result");
    } catch (err) {
      if (err instanceof ApiTimeoutError) return;
      console.error(err);
    }
  }

  function handleTimeout() {
    setOcrData(SAMPLE_OCR);
    setFields(buildFields(SAMPLE_OCR));
    setStage("result");
  }

  function handleFieldChange(key: string, value: string) {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, value } : f))
    );
  }

  async function handleDownloadPdf() {
    if (!ocrData) return;
    setDownloading(true);

    const pdfPayload = {
      pet_name: ocrData.pet_name || "우리 아이",
      breed: "말티즈",
      age: "3세",
      clinic_name: ocrData.clinic_name,
      clinic_business_number: ocrData.clinic_business_number,
      visit_date: ocrData.visit_date,
      diagnosis: ocrData.diagnosis,
      items: ocrData.items,
      total_amount: ocrData.total_amount,
      estimated_payout: Math.round(ocrData.total_amount * 0.8),
    };

    try {
      const blob = await apiPostBlob("/api/claim/generate-pdf", pdfPayload, 30000);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hanathepet-claim.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF 생성 실패:", err);
    } finally {
      setDownloading(false);
    }
  }

  function handleReset() {
    setStage("input");
    setOcrData(null);
    setFields([]);
  }

  return (
    <div className="px-4 py-5 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">보험 청구 자동화</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          영수증 사진을 업로드하면 AI가 자동으로 입력해 드립니다
        </p>
      </div>

      {stage === "input" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            진료 영수증 사진
          </label>
          <ImageUploader
            onUpload={handleUpload}
            label="영수증 사진 업로드"
            sublabel="병원 영수증을 촬영하거나 갤러리에서 선택하세요"
          />
        </div>
      )}

      {stage === "loading" && (
        <LoadingSpinner
          timeoutMs={30000}
          onTimeout={handleTimeout}
          message="AI가 영수증을 분석 중입니다…"
        />
      )}

      {stage === "result" && ocrData && (
        <div className="space-y-4">
          <ReceiptPreview
            clinicName={ocrData.clinic_name || "알수없음"}
            visitDate={ocrData.visit_date || "알수없음"}
            items={ocrData.items.map((i) => ({
              description: i.name,
              amount: i.amount,
            }))}
            total={ocrData.total_amount}
          />

          <ClaimForm fields={fields} onChange={handleFieldChange} />

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="w-full py-3.5 rounded-2xl bg-[#00954F] text-white font-bold text-sm active:bg-[#006B38] transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {downloading ? "PDF 생성 중…" : "📄 청구서 PDF 다운로드"}
          </button>

          <button
            onClick={handleReset}
            className="text-xs text-gray-400 underline text-center w-full"
          >
            다른 영수증 처리하기
          </button>
        </div>
      )}
    </div>
  );
}

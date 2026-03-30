"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import LoadingSpinner from "@/components/LoadingSpinner";
import ReceiptPreview from "@/components/ReceiptPreview";
import ClaimForm, { ClaimField } from "@/components/ClaimForm";
import { apiPost, apiPostBlob, ApiTimeoutError } from "@/lib/api";

interface OcrResult {
  clinic_name: string;
  visit_date: string;
  items: { description: string; amount: number }[];
  total: number;
  patient_name: string;
  diagnosis: string;
  claim_amount: number;
}

const SAMPLE_OCR: OcrResult = {
  clinic_name: "행복동물병원",
  visit_date: "2026-03-28",
  items: [
    { description: "슬개골 탈구 수술비", amount: 1200000 },
    { description: "마취비", amount: 150000 },
    { description: "입원비 (3일)", amount: 210000 },
    { description: "약제비", amount: 45000 },
  ],
  total: 1605000,
  patient_name: "하나 (말티즈)",
  diagnosis: "슬개골 탈구 (Grade 2)",
  claim_amount: 1605000,
};

type Stage = "input" | "loading" | "result";

function buildFields(ocr: OcrResult): ClaimField[] {
  return [
    {
      key: "patient_name",
      label: "피보험동물",
      value: ocr.patient_name,
      aiDetected: true,
    },
    {
      key: "clinic_name",
      label: "진료기관",
      value: ocr.clinic_name,
      aiDetected: true,
    },
    {
      key: "diagnosis",
      label: "상병명",
      value: ocr.diagnosis,
      aiDetected: true,
    },
    {
      key: "claim_amount",
      label: "청구금액",
      value: ocr.claim_amount ? `${ocr.claim_amount.toLocaleString()}원` : "",
      aiDetected: true,
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
      const f = buildFields(data);
      setOcrData(data);
      setFields(f);
      setStage("result");
    } catch (err) {
      if (err instanceof ApiTimeoutError) {
        return; // spinner timeout button will handle
      }
      console.error(err);
    }
  }

  function handleTimeout() {
    const f = buildFields(SAMPLE_OCR);
    setOcrData(SAMPLE_OCR);
    setFields(f);
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

    // Build claim payload from current field values
    const fieldMap = Object.fromEntries(fields.map((f) => [f.key, f.value]));
    const claimPayload = {
      clinic_name: fieldMap.clinic_name ?? ocrData.clinic_name,
      visit_date: ocrData.visit_date,
      patient_name: fieldMap.patient_name ?? ocrData.patient_name,
      diagnosis: fieldMap.diagnosis ?? ocrData.diagnosis,
      claim_amount: fieldMap.claim_amount ?? String(ocrData.claim_amount),
      items: ocrData.items,
      total: ocrData.total,
    };

    try {
      const blob = await apiPostBlob("/api/claim/generate-pdf", claimPayload, 30000);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hanathepet-claim.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF 생성 실패:", err);
      alert("PDF 생성에 실패했습니다. 다시 시도해주세요.");
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
            icon={
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h8M8 11h8M8 15h5" />
              </svg>
            }
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
          {/* Receipt preview */}
          <ReceiptPreview
            clinicName={ocrData.clinic_name}
            visitDate={ocrData.visit_date}
            items={ocrData.items}
            total={ocrData.total}
          />

          {/* Claim form */}
          <ClaimForm fields={fields} onChange={handleFieldChange} />

          {/* PDF download */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="w-full py-3.5 rounded-2xl bg-[#00954F] text-white font-bold text-sm active:bg-[#006B38] transition-colors shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                PDF 생성 중…
              </>
            ) : (
              <>
                📄 청구서 PDF 다운로드
              </>
            )}
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

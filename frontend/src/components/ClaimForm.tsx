"use client";

import { useState } from "react";

export interface ClaimField {
  key: string;
  label: string;
  value: string;
  aiDetected: boolean;
}

interface ClaimFormProps {
  fields: ClaimField[];
  onChange: (key: string, value: string) => void;
}

export default function ClaimForm({ fields, onChange }: ClaimFormProps) {
  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">보험 청구 정보</h3>

      {fields.map((field) => (
        <div key={field.key}>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-xs font-medium text-gray-600">
              {field.label}
            </label>
            {field.aiDetected && field.value && (
              <span className="text-[10px] bg-[#00954F] text-white px-1.5 py-0.5 rounded-full font-bold">
                AI
              </span>
            )}
          </div>
          <input
            type="text"
            value={field.value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.aiDetected && !field.value ? "" : "입력하세요"}
            className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-colors ${
              field.aiDetected && field.value
                ? "bg-[#E8F5EE] border-[#00954F] text-gray-800"
                : !field.value
                ? "bg-red-50 border-red-400 text-gray-800 placeholder:text-red-300"
                : "bg-gray-50 border-gray-300 text-gray-800"
            }`}
          />
          {!field.value && (
            <p className="text-xs text-red-500 mt-1">수동 입력이 필요합니다</p>
          )}
        </div>
      ))}
    </div>
  );
}

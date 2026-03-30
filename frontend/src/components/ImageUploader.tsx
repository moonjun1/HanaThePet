"use client";

import { useRef, useState } from "react";

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  label?: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export default function ImageUploader({
  onUpload,
  label = "사진 업로드",
  sublabel = "탭하여 사진을 선택하세요",
  icon,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload(file);
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
        preview
          ? "border-[#00954F] bg-[#E8F5EE]"
          : "border-gray-300 bg-gray-50 hover:border-[#00954F] hover:bg-[#E8F5EE]"
      }`}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      aria-label={label}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="업로드된 사진"
            className="w-full max-h-56 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#00954F]/80 text-white text-xs text-center py-1 px-2 truncate">
            {fileName}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
          {icon ?? (
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
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
          <p className="text-sm font-semibold text-gray-700">{label}</p>
          <p className="text-xs text-gray-400">{sublabel}</p>
        </div>
      )}
    </div>
  );
}

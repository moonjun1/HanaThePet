export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Paw icon in hana green */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="#00954F"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <ellipse cx="5" cy="8" rx="2" ry="2.8" />
          <ellipse cx="9.5" cy="5.5" rx="1.8" ry="2.5" />
          <ellipse cx="14.5" cy="5.5" rx="1.8" ry="2.5" />
          <ellipse cx="19" cy="8" rx="2" ry="2.8" />
          <path d="M12 10c-3.5 0-6.5 2.5-6.5 5.5 0 1.5.7 2.8 2 3.8.8.6 2.2 1.2 4.5 1.2s3.7-.6 4.5-1.2c1.3-1 2-2.3 2-3.8C18.5 12.5 15.5 10 12 10z" />
        </svg>
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-[#00954F]">하나</span>더펫
        </h1>
      </div>
    </header>
  );
}

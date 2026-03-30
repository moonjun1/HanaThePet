interface PetFinancialCardProps {
  petName: string;
  breed: string;
  age: number;
  gender: "수컷" | "암컷" | string;
  petId: string;
}

export default function PetFinancialCard({
  petName,
  breed,
  age,
  gender,
  petId,
}: PetFinancialCardProps) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md bg-gradient-to-br from-[#00954F] to-[#006B38] text-white p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-green-200 font-medium tracking-wide uppercase mb-1">
            반려동물 금융 ID
          </p>
          <h2 className="text-2xl font-bold tracking-tight">{petName}</h2>
        </div>
        {/* Paw badge */}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <ellipse cx="5" cy="8" rx="2" ry="2.8" />
            <ellipse cx="9.5" cy="5.5" rx="1.8" ry="2.5" />
            <ellipse cx="14.5" cy="5.5" rx="1.8" ry="2.5" />
            <ellipse cx="19" cy="8" rx="2" ry="2.8" />
            <path d="M12 10c-3.5 0-6.5 2.5-6.5 5.5 0 1.5.7 2.8 2 3.8.8.6 2.2 1.2 4.5 1.2s3.7-.6 4.5-1.2c1.3-1 2-2.3 2-3.8C18.5 12.5 15.5 10 12 10z" />
          </svg>
        </div>
      </div>

      <div className="flex gap-4 text-sm mb-4">
        <div>
          <p className="text-green-200 text-xs">품종</p>
          <p className="font-semibold">{breed}</p>
        </div>
        <div>
          <p className="text-green-200 text-xs">나이</p>
          <p className="font-semibold">{age}세</p>
        </div>
        <div>
          <p className="text-green-200 text-xs">성별</p>
          <p className="font-semibold">{gender}</p>
        </div>
      </div>

      <div className="border-t border-white/20 pt-3">
        <p className="text-green-200 text-xs mb-1">Pet ID</p>
        <p className="font-mono text-xs tracking-widest bg-white/10 rounded-lg px-3 py-1.5 inline-block">
          {petId}
        </p>
      </div>
    </div>
  );
}

export default function Logo({ size = "md" }) {
  const sizes = {
    sm: "w-8 h-8 text-lg",
    md: "w-10 h-10 text-xl",
    lg: "w-14 h-14 text-2xl",
  };

  return (
    <div className="flex items-center gap-3 cursor-pointer select-none">
      {/* Logo Icon */}
      <div
        className={`${sizes[size]} relative flex items-center justify-center rounded-xl bg-white text-black font-black shadow-lg`}
      >
        <span className="absolute text-2xl font-extrabold">C</span>

        <span className="absolute text-[#00B386] font-black translate-x-2 translate-y-1">
          N
        </span>

      </div>

      {/* Brand */}
      <div className="leading-tight text-left">
        <h1 className="text-white font-bold tracking-tight text-2xl">
          Crack<span className="text-[#00B386]">Nest</span>
        </h1>

        <p className="text-gray-400 text-xs tracking-widest uppercase mt-1">
          From Resume to Offer Letter
        </p>
      </div>
    </div>
  );
}

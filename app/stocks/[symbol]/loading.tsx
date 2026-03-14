export default function StockDetailLoading() {
  return (
    <main className="min-h-screen bg-[#0c0c0c] px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center pt-24">
        <div className="relative mb-8">
          {/* Outer spinning ring */}
          <div className="h-20 w-20 rounded-full border-4 border-slate-700 border-t-[#2e86de] animate-spin" />
          {/* Inner pulsing dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-[#22c55e] animate-pulse" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-slate-300 animate-pulse">
          Loading stock data&hellip;
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Fetching company overview and price history
        </p>

        {/* Skeleton cards */}
        <div className="mt-12 grid w-full max-w-4xl gap-6 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-[#232336] animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

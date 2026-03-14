import Link from "next/link";
import StockLogo from "@/components/StockLogo";
import { STOCKS } from "@/lib/stocks";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0c0c0c] via-[#111118] to-[#0c0c0c] px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Tech Stock Explorer
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-400 sm:text-lg">
            Browse top stocks. Click any card for company details, historical
            prices, and an interactive price chart.
          </p>
        </header>

        <section className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {STOCKS.map((stock) => (
            <Link
              key={stock.symbol}
              href={`/stocks/${stock.symbol}`}
              className="group relative flex flex-col items-center rounded-2xl border border-slate-600/40 bg-[#232336] p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#2e86de]/10 hover:border-[#2e86de]/40"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-slate-500/30 group-hover:ring-[#2e86de]/40 transition-all">
                <StockLogo
                  src={stock.logo}
                  alt={`${stock.name} logo`}
                  symbol={stock.symbol}
                  size={48}
                />
              </div>

              <h2 className="text-lg font-bold text-white group-hover:text-[#2e86de] transition-colors">
                {stock.symbol}
              </h2>

              <p className="mt-1 text-sm text-slate-400 text-center leading-tight">
                {stock.name}
              </p>

              <span className="mt-3 inline-block rounded-full bg-[#1a1a2e] px-3 py-1 text-xs font-medium text-slate-300 group-hover:bg-[#2e86de]/10 group-hover:text-[#2e86de] transition-colors">
                {stock.sector}
              </span>

              <div className="mt-4 text-sm font-semibold text-[#22c55e] opacity-0 group-hover:opacity-100 transition-opacity">
                View details &rarr;
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

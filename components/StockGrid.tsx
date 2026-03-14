"use client";

import { useState } from "react";
import Link from "next/link";
import StockLogo from "@/components/StockLogo";
import { STOCKS } from "@/lib/stocks";

export default function StockGrid() {
  const [query, setQuery] = useState("");

  const filtered = STOCKS.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="mx-auto mb-8 max-w-md">
        <input
          type="text"
          placeholder="Search by name, symbol, or sector..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-400">
          No stocks match &ldquo;{query}&rdquo;
        </p>
      ) : (
        <section className="grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((stock) => (
            <Link
              key={stock.symbol}
              href={`/stocks/${stock.symbol}`}
              className="group relative flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-slate-100 group-hover:ring-blue-200 transition-all">
                <StockLogo
                  src={stock.logo}
                  alt={`${stock.name} logo`}
                  symbol={stock.symbol}
                  size={48}
                />
              </div>

              <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {stock.symbol}
              </h2>

              <p className="mt-1 text-sm text-slate-500 text-center leading-tight">
                {stock.name}
              </p>

              <span className="mt-3 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                {stock.sector}
              </span>

              <div className="mt-4 text-sm font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                View details &rarr;
              </div>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}

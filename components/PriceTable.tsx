"use client";

import { useState } from "react";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  type HistoricalPriceItem,
} from "@/lib/alphavantage";

const PAGE_SIZE = 20;

type Props = {
  data: HistoricalPriceItem[];
};

export default function PriceTable({ data }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (data.length === 0) {
    return (
      <p className="text-slate-500">
        Historical price data is unavailable right now.
      </p>
    );
  }

  const visibleItems = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;

  return (
    <>
      <div className="overflow-x-auto -mx-5 sm:-mx-6">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-left">
              <Th>Date</Th>
              <Th>Open</Th>
              <Th>High</Th>
              <Th>Low</Th>
              <Th>Close</Th>
              <Th>Volume</Th>
              <Th>% Change</Th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item, i) => {
              const changeText = formatPercent(item.percentChange);
              const isPositive =
                item.percentChange !== null && item.percentChange >= 0;
              const isNegative =
                item.percentChange !== null && item.percentChange < 0;

              return (
                <tr
                  key={item.date}
                  className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                    i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  }`}
                >
                  <Td className="font-medium text-slate-800">{item.date}</Td>
                  <Td>{formatCurrency(item.open)}</Td>
                  <Td>{formatCurrency(item.high)}</Td>
                  <Td>{formatCurrency(item.low)}</Td>
                  <Td>{formatCurrency(item.close)}</Td>
                  <Td>{formatNumber(item.volume)}</Td>
                  <Td
                    className={`font-semibold ${
                      isPositive
                        ? "text-emerald-600"
                        : isNegative
                        ? "text-red-500"
                        : "text-slate-400"
                    }`}
                  >
                    {changeText}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Show more ({data.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:px-6">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap px-5 py-3 text-sm text-slate-700 sm:px-6 ${className}`}
    >
      {children}
    </td>
  );
}

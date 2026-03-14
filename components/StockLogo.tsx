"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  symbol: string;
  size?: number;
};

export default function StockLogo({ src, alt, symbol, size = 48 }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-gradient-to-br from-[#2e86de] to-[#22c55e] font-bold text-white"
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="object-contain"
      onError={() => setFailed(true)}
    />
  );
}

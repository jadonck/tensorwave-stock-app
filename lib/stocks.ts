export type StockMeta = {
  symbol: string;
  name: string;
  sector: string;
  logo: string;
};

// Google Favicons API — free, no API key needed
function logo(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export const STOCKS: StockMeta[] = [
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", logo: "https://logo.uplead.com/amd.com" },
  { symbol: "AMZN", name: "Amazon", sector: "Cloud Computing", logo: logo("amazon.com") },
  { symbol: "ANET", name: "Arista Networks", sector: "Networking", logo: logo("arista.com") },
  { symbol: "AVGO", name: "Broadcom", sector: "Semiconductors", logo: logo("broadcom.com") },
  { symbol: "DELL", name: "Dell Technologies", sector: "Hardware", logo: logo("dell.com") },
  { symbol: "GOOGL", name: "Alphabet", sector: "Cloud Computing", logo: logo("google.com") },
  { symbol: "IBM", name: "IBM", sector: "Cloud / AI", logo: "https://logo.uplead.com/ibm.com" },
  { symbol: "META", name: "Meta Platforms", sector: "AI / Infrastructure", logo: logo("meta.com") },
  { symbol: "MRVL", name: "Marvell Technology", sector: "Semiconductors", logo: logo("marvell.com") },
  { symbol: "MSFT", name: "Microsoft", sector: "Cloud Computing", logo: logo("microsoft.com") },
  { symbol: "MU", name: "Micron Technology", sector: "Memory / Storage", logo: logo("micron.com") },
  { symbol: "NVDA", name: "NVIDIA", sector: "GPUs / AI", logo: logo("nvidia.com") },
  { symbol: "ORCL", name: "Oracle", sector: "Cloud Computing", logo: logo("oracle.com") },
  { symbol: "TSM", name: "Taiwan Semiconductor", sector: "Semiconductors", logo: "https://logo.uplead.com/tsmc.com" },
  { symbol: "VRT", name: "Vertiv", sector: "Data Center Infrastructure", logo: logo("vertiv.com") },
];

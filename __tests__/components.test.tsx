/**
 * Component Rendering Tests
 *
 * Tests that key UI components render correctly with expected content:
 *
 *   StockLogo:
 *   - Renders img with correct src/alt attributes
 *   - Supports default (48px) and custom sizes
 *   - Falls back to letter initials when image fails to load
 *
 *   HomePage:
 *   - Displays the "Tech Stock Explorer" title and subtitle
 *   - Renders all 15 stock cards with correct symbols, names, and sectors
 *   - Each card links to /stocks/SYMBOL route
 *
 *   PriceHistoryChart:
 *   - Shows "No price data available" for empty data
 *   - Renders chart title and Recharts container for valid data
 *
 * Why: These tests catch rendering regressions — a broken logo fallback,
 * missing card, or wrong link would all be caught here without needing
 * to visually inspect the page.
 */

import React, { act } from "react";
import { render, screen } from "@testing-library/react";
import StockLogo from "@/components/StockLogo";

// Mock next/link to render as a plain anchor
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});

// Mock recharts to avoid jsdom canvas issues
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <svg data-testid="area-chart">{children}</svg>
  ),
  Area: () => <g data-testid="area" />,
  XAxis: () => <g data-testid="x-axis" />,
  YAxis: () => <g data-testid="y-axis" />,
  CartesianGrid: () => <g data-testid="cartesian-grid" />,
  Tooltip: () => <g data-testid="tooltip" />,
}));

// ─── StockLogo ──────────────────────────────────────────────────────────────

describe("StockLogo", () => {
  it("renders an img tag with correct src and alt", () => {
    render(
      <StockLogo
        src="https://example.com/logo.png"
        alt="NVDA logo"
        symbol="NVDA"
        size={48}
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/logo.png");
    expect(img).toHaveAttribute("alt", "NVDA logo");
  });

  it("renders with default size of 48", () => {
    render(
      <StockLogo
        src="https://example.com/logo.png"
        alt="Test logo"
        symbol="TEST"
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "48");
    expect(img).toHaveAttribute("height", "48");
  });

  it("renders with custom size", () => {
    render(
      <StockLogo
        src="https://example.com/logo.png"
        alt="Test logo"
        symbol="TEST"
        size={64}
      />
    );

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("width", "64");
    expect(img).toHaveAttribute("height", "64");
  });

  it("shows fallback initials when image fails to load", () => {
    render(
      <StockLogo
        src="https://example.com/broken.png"
        alt="Broken logo"
        symbol="NVDA"
        size={48}
      />
    );

    const img = screen.getByRole("img");
    // Simulate error wrapped in act
    act(() => {
      img.dispatchEvent(new Event("error"));
    });

    // After error, should show initials
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("NV")).toBeInTheDocument();
  });
});

// ─── HomePage ───────────────────────────────────────────────────────────────

describe("HomePage", () => {
  // Import dynamically because it uses next/link
  let HomePage: React.ComponentType;

  beforeAll(async () => {
    const mod = await import("@/app/page");
    HomePage = mod.default;
  });

  it("renders the page title", () => {
    render(<HomePage />);
    expect(screen.getByText("Tech Stock Explorer")).toBeInTheDocument();
  });

  it("renders all 15 stock cards", () => {
    render(<HomePage />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(15);
  });

  it("each card links to the correct stock detail page", () => {
    render(<HomePage />);
    const links = screen.getAllByRole("link");

    links.forEach((link) => {
      const href = link.getAttribute("href");
      expect(href).toMatch(/^\/stocks\/[A-Z]+$/);
    });
  });

  it("displays stock symbols on cards", () => {
    render(<HomePage />);
    expect(screen.getByText("NVDA")).toBeInTheDocument();
    expect(screen.getByText("AMD")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
    expect(screen.getByText("GOOGL")).toBeInTheDocument();
  });

  it("displays stock names on cards", () => {
    render(<HomePage />);
    expect(screen.getByText("NVIDIA")).toBeInTheDocument();
    expect(screen.getByText("Microsoft")).toBeInTheDocument();
    expect(screen.getByText("Amazon")).toBeInTheDocument();
  });

  it("displays sector badges on cards", () => {
    render(<HomePage />);
    expect(screen.getByText("GPUs / AI")).toBeInTheDocument();
    expect(screen.getByText("Networking")).toBeInTheDocument();
  });

  it("renders the subtitle text", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Browse top stocks/i)
    ).toBeInTheDocument();
  });
});

// ─── PriceHistoryChart ──────────────────────────────────────────────────────

describe("PriceHistoryChart", () => {
  let PriceHistoryChart: React.ComponentType<{ data: { date: string; close: number }[] }>;

  beforeAll(async () => {
    const mod = await import("@/components/PriceHistoryChart");
    PriceHistoryChart = mod.default;
  });

  it("renders 'No price data available' when data is empty", () => {
    render(<PriceHistoryChart data={[]} />);
    expect(screen.getByText("No price data available")).toBeInTheDocument();
  });

  it("renders chart title when data is provided", () => {
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      date: `2025-03-${String(i + 1).padStart(2, "0")}`,
      close: 100 + i,
    }));

    render(<PriceHistoryChart data={mockData} />);
    expect(screen.getByText("30-Day Price History")).toBeInTheDocument();
  });

  it("renders the chart container when data is provided", () => {
    const mockData = Array.from({ length: 10 }, (_, i) => ({
      date: `2025-03-${String(i + 1).padStart(2, "0")}`,
      close: 100 + i,
    }));

    render(<PriceHistoryChart data={mockData} />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
  });
});

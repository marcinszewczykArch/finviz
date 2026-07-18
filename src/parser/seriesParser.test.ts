import { describe, it, expect } from "vitest";
import { SeriesParser } from "./seriesParser.ts";

describe("SeriesParser", () => {
  const parser = new SeriesParser();

  it("parses a single series definition", () => {
    const input = `
[[series]]
name="portfolio"
expr="cash+etf"
`;
    const result = parser.parse(input);
    expect(result).toEqual([{ name: "portfolio", expr: "cash+etf" }]);
  });

  it("parses multiple series definitions", () => {
    const input = `
[[series]]
name="portfolio"
expr="cash+etf"

[[series]]
name="totalDebt"
expr="abs(mortgage)+abs(carLoan)"
`;
    const result = parser.parse(input);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: "portfolio", expr: "cash+etf" });
    expect(result[1]).toEqual({
      name: "totalDebt",
      expr: "abs(mortgage)+abs(carLoan)",
    });
  });

  it("returns empty array when no series defined", () => {
    const input = `
[[chart]]
title="Test"
type="line"
y="cash"
`;
    const result = parser.parse(input);
    expect(result).toEqual([]);
  });

  it("throws on missing name", () => {
    const input = `
[[series]]
expr="cash+etf"
`;
    expect(() => parser.parse(input)).toThrow(
      "Each [[series]] must have a 'name' field",
    );
  });

  it("throws on missing expr", () => {
    const input = `
[[series]]
name="portfolio"
`;
    expect(() => parser.parse(input)).toThrow(
      "Series 'portfolio' must have an 'expr' field",
    );
  });

  it("handles series alongside chart definitions", () => {
    const input = `
[[series]]
name="portfolio"
expr="cash+etf"

[[chart]]
title="Portfolio"
type="line"
y="portfolio"
`;
    const result = parser.parse(input);
    expect(result).toEqual([{ name: "portfolio", expr: "cash+etf" }]);
  });
});

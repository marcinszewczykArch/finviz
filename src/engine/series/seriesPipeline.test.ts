import { describe, it, expect } from "vitest";
import { processSeries } from "./seriesPipeline.ts";
import type { DataRecord, ParsedData } from "../../models/types.ts";

function makeData(records: DataRecord[]): ParsedData {
  const seriesNamesSet = new Set<string>();
  for (const r of records) {
    for (const key of Object.keys(r)) {
      if (key !== "date" && key !== "note") {
        seriesNamesSet.add(key);
      }
    }
  }
  return {
    records,
    seriesNames: Array.from(seriesNamesSet).sort(),
  };
}

describe("processSeries", () => {
  it("returns original data when no series defined", () => {
    const data = makeData([{ date: "2024-01", cash: 10 }]);
    const result = processSeries([], data);
    expect(result).toBe(data);
  });

  it("processes simple computed series end-to-end", () => {
    const data = makeData([
      { date: "2024-01", cash: 10, etf: 20 },
      { date: "2024-02", cash: 15, etf: 25 },
    ]);
    const result = processSeries(
      [{ name: "portfolio", expr: "cash+etf" }],
      data,
    );

    expect(result.records[0].portfolio).toBe(30);
    expect(result.records[1].portfolio).toBe(40);
    expect(result.seriesNames).toContain("portfolio");
  });

  it("computed series usable in subsequent chart expressions", () => {
    const data = makeData([
      { date: "2024-01", cash: 10, etf: 20, bonds: 30 },
      { date: "2024-02", cash: 15, etf: 25, bonds: 35 },
    ]);
    const result = processSeries(
      [
        { name: "portfolio", expr: "cash+etf+bonds" },
        { name: "liquidRatio", expr: "cash/portfolio*100" },
      ],
      data,
    );

    expect(result.records[0].portfolio).toBe(60);
    expect(result.records[0].liquidRatio).toBeCloseTo(16.67, 1);
    expect(result.records[1].portfolio).toBe(75);
    expect(result.records[1].liquidRatio).toBeCloseTo(20.0, 1);
  });

  it("computed series works with delta()", () => {
    const data = makeData([
      { date: "2024-01", netWorth: 100 },
      { date: "2024-02", netWorth: 120 },
      { date: "2024-03", netWorth: 115 },
    ]);
    const result = processSeries(
      [{ name: "growth", expr: "delta(netWorth)" }],
      data,
    );

    expect(result.records[0].growth).toBe(0);
    expect(result.records[1].growth).toBe(20);
    expect(result.records[2].growth).toBe(-5);
  });

  it("computed series works with rollingMean()", () => {
    const data = makeData([
      { date: "2024-01", cash: 10 },
      { date: "2024-02", cash: 20 },
      { date: "2024-03", cash: 30 },
    ]);
    const result = processSeries(
      [{ name: "avg", expr: "rollingMean(cash, 3)" }],
      data,
    );

    expect(result.records[0].avg).toBeCloseTo(10, 1);
    expect(result.records[1].avg).toBeCloseTo(15, 1);
    expect(result.records[2].avg).toBeCloseTo(20, 1);
  });

  it("computed series with dependency chain works", () => {
    const data = makeData([
      { date: "2024-01", cash: 10, etf: 20 },
      { date: "2024-02", cash: 15, etf: 25 },
    ]);
    const result = processSeries(
      [
        { name: "a", expr: "cash+etf" },
        { name: "b", expr: "a*2" },
        { name: "c", expr: "delta(b)" },
      ],
      data,
    );

    expect(result.records[0].a).toBe(30);
    expect(result.records[0].b).toBe(60);
    expect(result.records[0].c).toBe(0);
    expect(result.records[1].a).toBe(40);
    expect(result.records[1].b).toBe(80);
    expect(result.records[1].c).toBe(20);
  });

  it("throws on circular dependency", () => {
    const data = makeData([{ date: "2024-01", cash: 10 }]);
    expect(() =>
      processSeries(
        [
          { name: "a", expr: "b" },
          { name: "b", expr: "a" },
        ],
        data,
      ),
    ).toThrow("Circular dependency");
  });
});
